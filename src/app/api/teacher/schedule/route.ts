/**
 * 教师课表 API
 * 
 * GET: 获取教师课表数据
 * - mode=personal: 获取教师个人课表
 * - mode=classes: 获取教师任教的班级列表
 * - mode=class-schedule&classId=xxx: 获取指定班级的课表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

// 课表时段数据类型
interface SlotData {
  id: string;
  class_id: string;
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
  class_name?: string;
  grade?: number;
}

// 班级信息类型
interface ClassInfo {
  classId: string;
  className: string;
  grade: number;
  subjects: string[];
  totalHours: number;
  headTeacher?: { id: string; name: string; primary_subject: string } | null;
}

// 个人课表数据类型
interface PersonalScheduleData {
  teacher: {
    id: string;
    name: string;
    primary_subject: string;
    employee_id?: string;
  };
  scheduleMatrix: (SlotData | null)[][];
  byWeekday: Record<number, SlotData[]>;
  slots: SlotData[];
  totalHours: number;
  classes: { id: string; name: string; grade: number }[];
}

// 班级课表数据类型
interface ClassScheduleData {
  class: {
    id: string;
    name: string;
    grade: number;
    head_teacher?: { id: string; name: string; primary_subject: string } | null;
    sub_teacher?: { id: string; name: string; primary_subject: string } | null;
  };
  scheduleMatrix: (SlotData | null)[][];
  slots: SlotData[];
  subjectCount: Record<string, number>;
  totalSlots: number;
}

/**
 * 获取教师个人课表
 */
async function getPersonalSchedule(teacherId: string, employeeId?: string): Promise<PersonalScheduleData | null> {
  const client = getSupabaseClient();
  
  // 1. 获取教师信息
  const { data: teacher, error: teacherError } = await client
    .from('users')
    .select('id, name, primary_subject, employee_id')
    .eq('id', teacherId)
    .single();
  
  if (teacherError || !teacher) {
    return null;
  }
  
  // 2. 获取教师课表 - 使用 teacher_id 或 employee_id 匹配
  let query = client
    .from('schedule_slots')
    .select('*')
    .eq('status', 'active');
  
  // 优先使用 employee_id 匹配，如果没有则尝试 teacher_id
  const effectiveEmployeeId = employeeId || teacher.employee_id;
  if (effectiveEmployeeId) {
    query = query.eq('teacher_id', effectiveEmployeeId);
  } else {
    query = query.eq('teacher_id', teacherId);
  }
  
  const { data: slots, error: slotsError } = await query;
  
  if (slotsError) {
    console.error('获取课表失败:', slotsError);
    return null;
  }
  
  // 3. 构建 scheduleMatrix (6节 x 5天)
  const scheduleMatrix: (SlotData | null)[][] = Array(6).fill(null).map(() => Array(5).fill(null));
  const byWeekday: Record<number, SlotData[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const classMap = new Map<string, { id: string; name: string; grade: number }>();
  
  for (const slot of slots || []) {
    const slotData: SlotData = {
      id: slot.id,
      class_id: slot.class_id,
      subject: slot.subject,
      teacher_id: slot.teacher_id,
      teacher_name: slot.teacher_name,
      week_day: slot.week_day,
      period_index: slot.period_index,
      class_name: slot.class_name,
      grade: slot.grade,
    };
    
    // 填充矩阵 (period_index 从 0 开始, week_day 从 1 开始)
    if (slot.period_index >= 0 && slot.period_index < 6 && slot.week_day >= 1 && slot.week_day <= 5) {
      scheduleMatrix[slot.period_index][slot.week_day - 1] = slotData;
    }
    
    // 按星期分组
    if (slot.week_day >= 1 && slot.week_day <= 5) {
      byWeekday[slot.week_day].push(slotData);
    }
    
    // 记录班级
    if (slot.class_id && slot.class_name) {
      classMap.set(slot.class_id, {
        id: slot.class_id,
        name: slot.class_name,
        grade: slot.grade || 1,
      });
    }
  }
  
  return {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      primary_subject: teacher.primary_subject || '',
      employee_id: teacher.employee_id,
    },
    scheduleMatrix,
    byWeekday,
    slots: slots || [],
    totalHours: slots?.length || 0,
    classes: Array.from(classMap.values()),
  };
}

/**
 * 获取教师任教的班级列表
 */
async function getTeachingClasses(teacherId: string, employeeId?: string): Promise<ClassInfo[]> {
  const client = getSupabaseClient();
  
  // 获取教师信息以获取 employee_id
  const { data: teacher } = await client
    .from('users')
    .select('id, employee_id')
    .eq('id', teacherId)
    .single();
  
  const effectiveEmployeeId = employeeId || teacher?.employee_id;
  
  // 获取教师任教的班级
  let query = client
    .from('schedule_slots')
    .select('class_id, class_name, grade, subject')
    .eq('status', 'active');
  
  if (effectiveEmployeeId) {
    query = query.eq('teacher_id', effectiveEmployeeId);
  } else {
    query = query.eq('teacher_id', teacherId);
  }
  
  const { data: slots, error } = await query;
  
  if (error || !slots) {
    return [];
  }
  
  // 按班级分组统计
  const classMap = new Map<string, ClassInfo>();
  
  for (const slot of slots) {
    if (!slot.class_id) continue;
    
    const existing = classMap.get(slot.class_id);
    if (existing) {
      if (slot.subject && !existing.subjects.includes(slot.subject)) {
        existing.subjects.push(slot.subject);
      }
      existing.totalHours++;
    } else {
      classMap.set(slot.class_id, {
        classId: slot.class_id,
        className: slot.class_name || slot.class_id,
        grade: slot.grade || 1,
        subjects: slot.subject ? [slot.subject] : [],
        totalHours: 1,
      });
    }
  }
  
  // 获取班主任信息
  const classIds = Array.from(classMap.keys());
  if (classIds.length > 0) {
    const { data: classes } = await client
      .from('classes')
      .select('id, head_teacher_id')
      .in('id', classIds);
    
    if (classes) {
      for (const cls of classes) {
        const classInfo = classMap.get(cls.id);
        if (classInfo && cls.head_teacher_id) {
          // 获取班主任信息
          const { data: headTeacher } = await client
            .from('users')
            .select('id, name, primary_subject')
            .eq('id', cls.head_teacher_id)
            .single();
          
          if (headTeacher) {
            classInfo.headTeacher = {
              id: headTeacher.id,
              name: headTeacher.name,
              primary_subject: headTeacher.primary_subject || '',
            };
          }
        }
      }
    }
  }
  
  return Array.from(classMap.values());
}

/**
 * 获取班级课表
 */
async function getClassSchedule(classId: string): Promise<ClassScheduleData | null> {
  const client = getSupabaseClient();
  
  // 获取班级信息
  const { data: classInfo, error: classError } = await client
    .from('classes')
    .select(`
      id,
      name,
      grade,
      head_teacher_id,
      sub_teacher_id
    `)
    .eq('id', classId)
    .single();
  
  if (classError || !classInfo) {
    return null;
  }
  
  // 获取班主任和副班主任信息
  let headTeacher = null;
  let subTeacher = null;
  
  if (classInfo.head_teacher_id) {
    const { data: teacher } = await client
      .from('users')
      .select('id, name, primary_subject')
      .eq('id', classInfo.head_teacher_id)
      .single();
    if (teacher) {
      headTeacher = {
        id: teacher.id,
        name: teacher.name,
        primary_subject: teacher.primary_subject || '',
      };
    }
  }
  
  if (classInfo.sub_teacher_id) {
    const { data: teacher } = await client
      .from('users')
      .select('id, name, primary_subject')
      .eq('id', classInfo.sub_teacher_id)
      .single();
    if (teacher) {
      subTeacher = {
        id: teacher.id,
        name: teacher.name,
        primary_subject: teacher.primary_subject || '',
      };
    }
  }
  
  // 获取班级课表
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'active');
  
  if (slotsError) {
    console.error('获取班级课表失败:', slotsError);
    return null;
  }
  
  // 构建 scheduleMatrix
  const scheduleMatrix: (SlotData | null)[][] = Array(6).fill(null).map(() => Array(5).fill(null));
  const subjectCount: Record<string, number> = {};
  
  for (const slot of slots || []) {
    const slotData: SlotData = {
      id: slot.id,
      class_id: slot.class_id,
      subject: slot.subject,
      teacher_id: slot.teacher_id,
      teacher_name: slot.teacher_name,
      week_day: slot.week_day,
      period_index: slot.period_index,
      class_name: slot.class_name,
      grade: slot.grade,
    };
    
    if (slot.period_index >= 0 && slot.period_index < 6 && slot.week_day >= 1 && slot.week_day <= 5) {
      scheduleMatrix[slot.period_index][slot.week_day - 1] = slotData;
    }
    
    // 统计科目课时
    if (slot.subject) {
      subjectCount[slot.subject] = (subjectCount[slot.subject] || 0) + 1;
    }
  }
  
  return {
    class: {
      id: classInfo.id,
      name: classInfo.name,
      grade: classInfo.grade,
      head_teacher: headTeacher,
      sub_teacher: subTeacher,
    },
    scheduleMatrix,
    slots: slots || [],
    subjectCount,
    totalSlots: slots?.length || 0,
  };
}

/**
 * GET - 获取教师课表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'personal';
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId') || user.id;
  
  try {
    switch (mode) {
      case 'personal': {
        const data = await getPersonalSchedule(teacherId, user.employeeId);
        if (!data) {
          return NextResponse.json(
            error('获取教师课表失败', ErrorCode.DATABASE_ERROR),
            { status: 500 }
          );
        }
        return NextResponse.json(success(data));
      }
      
      case 'classes': {
        const teachingClasses = await getTeachingClasses(teacherId, user.employeeId);
        return NextResponse.json(success({ teachingClasses }));
      }
      
      case 'class-schedule': {
        if (!classId) {
          return NextResponse.json(
            error('缺少班级ID', ErrorCode.VALIDATION_ERROR),
            { status: 400 }
          );
        }
        const data = await getClassSchedule(classId);
        if (!data) {
          return NextResponse.json(
            error('获取班级课表失败', ErrorCode.DATABASE_ERROR),
            { status: 500 }
          );
        }
        return NextResponse.json(success(data));
      }
      
      default:
        return NextResponse.json(
          error('无效的模式参数', ErrorCode.VALIDATION_ERROR),
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('获取课表失败:', err);
    return NextResponse.json(
      error('获取课表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
