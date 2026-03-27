/**
 * 教师课表 API
 * 
 * 功能：
 * - 获取当前登录教师的个人课表
 * - 获取教师任教的班级列表
 * - 获取任教班级的课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

// 类型定义
type TeacherRow = {
  id: string;
  name: string;
  primary_subject: string | null;
  employee_id: string;
};

type ScheduleSlotRow = {
  id: string;
  class_id: string;
  class_name: string;
  subject: string;
  teacher_id: string;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
  grade?: number;
};

type ClassRow = {
  id: string;
  name: string;
  grade: number;
  head_teacher_id: string | null;
  sub_teacher_id: string | null;
};

type CourseAdjustmentRow = {
  id: string;
  class_id: string;
  class_name: string | null;
  subject: string | null;
  week_day: number | null;
  period_index: number | null;
  effective_week: string;
  applicant_id: string;
  applicant_name: string | null;
  substitute_employee_id: string | null;
  substitute_name: string | null;
  status: string;
};

// GET: 获取教师课表数据
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'personal';
    const classId = searchParams.get('classId');
    
    // 获取教师 ID
    // 用户可能是教师角色，通过 employee_id 关联到 teachers 表
    // 或者如果是直接使用教师 ID，可以通过查询参数传递
    let teacherId = searchParams.get('teacherId');
    let employeeId = searchParams.get('employeeId'); // 支持通过工号查询
    
    // 如果没有通过参数传递，尝试从用户信息获取
    if (!teacherId && !employeeId) {
      // 检查用户角色是否为教师相关角色
      const teacherRoles = ['head_teacher', 'subject_teacher', 'skill_teacher', 
                            'principal', 'secretary', 'academic_vice_principal', 
                            'moral_vice_principal', 'general_vice_principal'];
      
      if (teacherRoles.includes(user.role)) {
        // 优先使用 employee_id（工号）
        if (user.employeeId) {
          employeeId = user.employeeId;
        }
        
        // 如果有工号，查询对应的教师 ID
        if (employeeId) {
          const { data: teacher } = await client
            .from('teachers')
            .select('id, name, primary_subject, employee_id')
            .eq('employee_id', employeeId)
            .single();
          
          if (teacher) {
            teacherId = teacher.id;
          }
        } else if (user.name) {
          // 没有工号，尝试通过姓名匹配
          const { data: teacher } = await client
            .from('teachers')
            .select('id, name, primary_subject, employee_id')
            .eq('name', user.name)
            .single();
          
          if (teacher) {
            teacherId = teacher.id;
            employeeId = teacher.employee_id;
          }
        }
      }
    } else if (employeeId && !teacherId) {
      // 如果只提供了 employeeId，查询对应的教师 ID
      const { data: teacher } = await client
        .from('teachers')
        .select('id')
        .eq('employee_id', employeeId)
        .single();
      
      if (teacher) {
        teacherId = teacher.id;
      }
    }
    
    if (!teacherId) {
      return NextResponse.json(error('未找到教师信息，请确保账号已关联教师档案', ErrorCode.NOT_FOUND), { status: 404 });
    }

    switch (mode) {
      case 'personal':
        return await getPersonalSchedule(client, teacherId);
      
      case 'classes':
        return await getTeachingClasses(client, teacherId);
      
      case 'class-schedule':
        if (!classId) {
          return NextResponse.json(error('缺少班级ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        return await getClassSchedule(client, classId);
      
      default:
        return NextResponse.json(error('无效的查询模式', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
  } catch (err) {
    console.error('获取教师课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 获取教师个人课表
async function getPersonalSchedule(client: SupabaseClient, teacherId: string) {
  // 获取教师信息
  const { data: teacher, error: teacherError } = await client
    .from('teachers')
    .select('id, name, primary_subject, employee_id')
    .eq('id', teacherId)
    .single();
  
  if (teacherError || !teacher) {
    return NextResponse.json(error('教师不存在', ErrorCode.NOT_FOUND), { status: 404 });
  }
  
  // 获取该教师的所有课程
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .eq('teacher_id', teacherId);
  
  if (slotsError) {
    return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 获取涉及的班级信息
  const classIds = [...new Set((slots as ScheduleSlotRow[] || []).map((s) => s.class_id))];
  const { data: classes } = await client
    .from('classes')
    .select('id, name, grade')
    .in('id', classIds);
  
  const classMap = new Map<string, { id: string; name: string; grade: number }>(
    (classes as ClassRow[] || []).map((c) => [c.id, { id: c.id, name: c.name, grade: c.grade }])
  );
  
  // ====== 查询调课记录 ======
  // 使用 course_adjustments 表（正确的表名）
  // 注意：applicant_id 和 substitute_employee_id 存储的都是工号
  
  // 查询教师作为请假人（被代课）的调课记录
  const { data: adjustedRecordsAsApplicant, error: adjError1 } = await client
    .from('course_adjustments')
    .select(`
      id,
      class_id,
      class_name,
      subject,
      week_day,
      period_index,
      effective_week,
      applicant_id,
      applicant_name,
      substitute_employee_id,
      substitute_name,
      status
    `)
    .eq('applicant_id', teacher.employee_id)
    .in('status', ['approved', 'completed', 'pending'])
    .not('week_day', 'is', null); // 过滤掉无效记录
  
  if (adjError1) {
    console.error('查询调课记录(作为请假人)失败:', adjError1);
  }
  
  // 查询教师作为代课人的调课记录
  const { data: adjustedRecordsAsSubstitute, error: adjError2 } = await client
    .from('course_adjustments')
    .select(`
      id,
      class_id,
      class_name,
      subject,
      week_day,
      period_index,
      effective_week,
      applicant_id,
      applicant_name,
      substitute_employee_id,
      substitute_name,
      status
    `)
    .eq('substitute_employee_id', teacher.employee_id)
    .in('status', ['approved', 'completed', 'pending'])
    .not('week_day', 'is', null); // 过滤掉无效记录
  
  if (adjError2) {
    console.error('查询调课记录(作为代课人)失败:', adjError2);
  }
  
  // 构建调课记录映射
  // key: `${week_day}-${period_index}`, value: 调课记录
  type AdjustmentInfo = CourseAdjustmentRow & {
    isAdjusted: boolean;
    adjustmentType: 'substituted' | 'substituting';
    substituteTeacher?: { name: string; employee_id: string } | null;
    originalTeacher?: { name: string; employee_id: string };
  };
  
  const adjustmentMap = new Map<string, AdjustmentInfo>();
  
  // 被代课的记录（教师请假，别人代课）
  (adjustedRecordsAsApplicant as CourseAdjustmentRow[] || []).forEach((adj) => {
    const key = `${adj.week_day}-${adj.period_index}`;
    adjustmentMap.set(key, {
      ...adj,
      isAdjusted: true,
      adjustmentType: 'substituted', // 被代课
      substituteTeacher: adj.substitute_name ? {
        name: adj.substitute_name,
        employee_id: adj.substitute_employee_id || '',
      } : null,
    });
  });
  
  // 代课的记录（帮别人代课）
  (adjustedRecordsAsSubstitute as CourseAdjustmentRow[] || []).forEach((adj) => {
    const key = `${adj.week_day}-${adj.period_index}`;
    if (!adjustmentMap.has(key)) {
      adjustmentMap.set(key, {
        ...adj,
        isAdjusted: true,
        adjustmentType: 'substituting', // 代课
        originalTeacher: {
          name: adj.applicant_name || '',
          employee_id: adj.applicant_id,
        },
      });
    }
  });
  
  type ScheduleCell = (ScheduleSlotRow & { 
    className?: string; 
    grade?: number; 
    isAdjusted: boolean; 
    adjustment: AdjustmentInfo | null 
  }) | { 
    id: string; 
    class_id: string; 
    subject: string | null; 
    teacher_id: string; 
    teacher_name: string; 
    week_day: number; 
    period_index: number; 
    className: string; 
    grade: number | undefined; 
    isAdjusted: boolean; 
    adjustment: AdjustmentInfo 
  } | null;
  
  // 构建课表矩阵（6行5列）
  const scheduleMatrix: ScheduleCell[][] = [];
  for (let period = 0; period < 6; period++) {
    const row: ScheduleCell[] = [];
    for (let day = 0; day < 5; day++) {
      const slot = (slots as ScheduleSlotRow[] || []).find(
        (s) => s.week_day === day + 1 && s.period_index === period
      );
      const adjKey = `${day + 1}-${period}`;
      const adjustment = adjustmentMap.get(adjKey);
      
      if (slot) {
        const cls = classMap.get(slot.class_id);
        row.push({
          ...slot,
          className: cls?.name || slot.class_name,
          grade: cls?.grade,
          isAdjusted: !!adjustment,
          adjustment: adjustment || null,
        });
      } else if (adjustment && adjustment.adjustmentType === 'substituting') {
        // 代课的课程（这个时间槽原本不属于该教师，但他去代课了）
        const adjClass = classMap.get(adjustment.class_id);
        row.push({
          id: `adj-${adjustment.id}`,
          class_id: adjustment.class_id,
          subject: adjustment.subject,
          teacher_id: teacherId,
          teacher_name: teacher.name,
          week_day: day + 1,
          period_index: period,
          className: adjClass?.name || '',
          grade: adjClass?.grade,
          isAdjusted: true,
          adjustment: adjustment,
        });
      } else {
        row.push(null);
      }
    }
    scheduleMatrix.push(row);
  }
  
  // 按星期分组（用于列表视图）
  const byWeekday: Record<number, (ScheduleSlotRow & { 
    className?: string; 
    grade?: number; 
    isAdjusted: boolean; 
    adjustment: AdjustmentInfo | null 
  })[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  
  (slots as ScheduleSlotRow[] || []).forEach((slot) => {
    const cls = classMap.get(slot.class_id);
    const adjKey = `${slot.week_day}-${slot.period_index}`;
    const adjustment = adjustmentMap.get(adjKey);
    byWeekday[slot.week_day].push({
      ...slot,
      className: cls?.name || slot.class_name,
      grade: cls?.grade,
      isAdjusted: !!adjustment,
      adjustment: adjustment || null,
    });
  });
  
  // 排序
  Object.keys(byWeekday).forEach(day => {
    byWeekday[parseInt(day)].sort((a, b) => a.period_index - b.period_index);
  });
  
  return NextResponse.json(success({
    teacher,
    scheduleMatrix,
    byWeekday,
    slots: slots || [],
    totalHours: (slots || []).length,
    classes: Array.from(classMap.values()),
    // 添加调课统计信息
    adjustmentStats: {
      substitutedCount: (adjustedRecordsAsApplicant || []).length, // 被代课次数
      substitutingCount: (adjustedRecordsAsSubstitute || []).length, // 代课次数
    },
  }));
}

// 获取教师任教的班级列表
async function getTeachingClasses(client: SupabaseClient, teacherId: string) {
  // 从 schedule_slots 获取该教师任教的班级
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('class_id, subject, class_name, grade')
    .eq('teacher_id', teacherId);
  
  if (slotsError) {
    return NextResponse.json(error('获取任教班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 按班级分组，统计每个班级的课时和科目
  const classMap = new Map<string, {
    classId: string;
    className: string;
    grade: number;
    subjects: string[];
    totalHours: number;
  }>();
  
  type SlotData = { class_id: string; subject: string; class_name: string | null; grade: number | null };
  
  (slots as SlotData[] || []).forEach((slot) => {
    const existing = classMap.get(slot.class_id);
    if (existing) {
      existing.totalHours++;
      if (!existing.subjects.includes(slot.subject)) {
        existing.subjects.push(slot.subject);
      }
    } else {
      classMap.set(slot.class_id, {
        classId: slot.class_id,
        className: slot.class_name || `班级${slot.class_id}`,
        grade: slot.grade || 1,
        subjects: [slot.subject],
        totalHours: 1,
      });
    }
  });
  
  // 获取班级详细信息（班主任等）
  const classIds = Array.from(classMap.keys());
  const { data: classesInfo } = await client
    .from('classes')
    .select(`
      id,
      name,
      grade,
      head_teacher_id,
      head_teacher:teachers!classes_head_teacher_id_fkey(id, name, primary_subject)
    `)
    .in('id', classIds);
  
  // 合并信息
  const teachingClasses = Array.from(classMap.values()).map(cls => {
    const info = classesInfo?.find((c) => c.id === cls.classId);
    type ClassWithTeacher = { name: string; grade: number; head_teacher?: TeacherRow | null };
    const typedInfo = info as unknown as ClassWithTeacher | undefined;
    return {
      ...cls,
      className: typedInfo?.name || cls.className,
      grade: typedInfo?.grade || cls.grade,
      headTeacher: typedInfo?.head_teacher || null,
    };
  });
  
  // 按年级排序
  teachingClasses.sort((a, b) => a.grade - b.grade);
  
  return NextResponse.json(success({
    teachingClasses,
    totalClasses: teachingClasses.length,
  }));
}

// 获取班级课表
async function getClassSchedule(client: SupabaseClient, classId: string) {
  // 获取班级信息
  const { data: cls, error: classError } = await client
    .from('classes')
    .select('id, name, grade, head_teacher_id, sub_teacher_id')
    .eq('id', classId)
    .single();
  
  if (classError || !cls) {
    console.error('查询班级错误:', classError);
    return NextResponse.json(error('班级不存在', ErrorCode.NOT_FOUND), { status: 404 });
  }
  
  // 获取班主任和副班主任信息
  let headTeacher = null;
  let subTeacher = null;
  
  if (cls.head_teacher_id) {
    const { data: headTeacherData } = await client
      .from('teachers')
      .select('id, name, primary_subject')
      .eq('id', cls.head_teacher_id)
      .single();
    headTeacher = headTeacherData;
  }
  
  if (cls.sub_teacher_id) {
    const { data: subTeacherData } = await client
      .from('teachers')
      .select('id, name, primary_subject')
      .eq('id', cls.sub_teacher_id)
      .single();
    subTeacher = subTeacherData;
  }
  
  const classInfo = {
    ...cls,
    head_teacher: headTeacher,
    sub_teacher: subTeacher,
  };
  
  // 获取班级课表
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .eq('class_id', classId);
  
  if (slotsError) {
    return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 构建课表矩阵
  const scheduleMatrix: (ScheduleSlotRow | null)[][] = [];
  for (let period = 0; period < 6; period++) {
    const row: (ScheduleSlotRow | null)[] = [];
    for (let day = 0; day < 5; day++) {
      const slot = (slots as ScheduleSlotRow[] || []).find(
        (s) => s.week_day === day + 1 && s.period_index === period
      );
      row.push(slot || null);
    }
    scheduleMatrix.push(row);
  }
  
  // 统计各科目课时
  const subjectCount: Record<string, number> = {};
  (slots as ScheduleSlotRow[] || []).forEach((s) => {
    subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
  });
  
  return NextResponse.json(success({
    class: classInfo,
    scheduleMatrix,
    slots: slots || [],
    subjectCount,
    totalSlots: (slots || []).length,
  }));
}
