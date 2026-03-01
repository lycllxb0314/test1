/**
 * 智能排课系统 API
 * 
 * GET: 获取课表数据
 * POST: 智能排课
 */

// 从API动态获取数据，不再使用硬编码
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  DEFAULT_PERIODS,
  WEEK_DAYS,
  generateSchedule,
  getClassSchedule,
  getTeacherSchedule,
  formatScheduleAsTable,
  calculateClassSubjectHours,
  calculateTeacherWeeklyHours,
  getPeriodsByGrade,
  MORNING_PERIODS,
  AFTERNOON_PERIODS_LOW,
  AFTERNOON_PERIODS_HIGH,
} from '@/lib/schedule-service';
import type { ScheduleSlot, TeachingTask, ScheduleRule, WeekDay } from '@/types';

// ==================== 数据模型 ====================

interface ClassSubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
}

// 动态获取班级数据
async function getClassesData() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('classes')
    .select('*')
    .order('grade', { ascending: true })
    .order('class_number', { ascending: true });
  
  if (error || !data) return [];
  
  return data.map(cls => ({
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    classNum: cls.class_number,
    students: cls.student_count || 0,
    headTeacherId: cls.head_teacher_id,
    headTeacherName: cls.head_teacher_name,
    subjectHeadId: cls.sub_teacher_id,
    subjectHeadName: cls.sub_teacher_name,
    classroom: cls.classroom_name,
    status: cls.status || 'active',
  }));
}

// 动态获取教师数据（包含完整课时配置）
async function getTeachersData() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('teachers')
    .select('*')
    .order('id', { ascending: true });
  
  if (error || !data) return [];
  
  return data.map(t => {
    // 从部门推断主教学科
    let primarySubject = t.primary_subject || t.subjects?.[0] || '';
    const dept = t.department || '';
    
    if (!primarySubject) {
      if (dept.includes('语文')) primarySubject = '语文';
      else if (dept.includes('数学')) primarySubject = '数学';
      else if (dept.includes('英语')) primarySubject = '英语';
      else if (dept.includes('体育')) primarySubject = '体育';
      else if (dept.includes('音乐')) primarySubject = '音乐';
      else if (dept.includes('美术')) primarySubject = '美术';
      else if (dept.includes('科学')) primarySubject = '科学';
      else if (dept.includes('道德') || dept.includes('道法')) primarySubject = '道德与法治';
    }
    
    // 获取教师的所有任教科目
    const subjects = t.subjects || [primarySubject].filter(Boolean);
    
    return {
      id: t.id,
      name: t.name,
      role: t.role || (t.is_head_teacher ? 'head_teacher' : 'subject_head'),
      primarySubject,
      subjects,
      department: dept,
      isHeadTeacher: t.is_head_teacher,
      headTeacherClassId: t.head_teacher_class_ids?.[0],
      subjectHeadClassId: t.subject_head_class_id,
      // 完整课时配置
      baseWeeklyHours: t.total_weekly_hours || t.base_weekly_hours || 16,
      mainClassCount: t.main_class_count || 1,
      mainSubjectHours: t.main_subject_hours || 12,
      totalWeeklyHours: t.total_weekly_hours || 16,
      secondarySubjects: t.secondary_subjects || [],
      teachableGrades: t.teachable_grades || [1, 2, 3, 4, 5, 6],
    };
  });
}

// 获取班级的科目教师分配（从数据库或默认配置）
async function getClassSubjectTeachers(classId: string, grade: number) {
  // 标准课时配置（根据年级区分）
  // 1-2年级：无英语，科学1节
  // 3-6年级：英语4节，科学2节
  const getStandardHours = (grade: number): Record<string, number> => {
    const base: Record<string, number> = {
      '语文': 6,
      '数学': 5,
      '体育': 3,
      '音乐': 2,
      '美术': 2,
      '道德与法治': 2,
      '劳动': 1,
      '班会': 1,
    };
    
    if (grade <= 2) {
      // 1-2年级：无英语，科学1节
      return { ...base, '科学': 1 };
    } else {
      // 3-6年级：英语4节，科学2节
      return { ...base, '英语': 4, '科学': 2 };
    }
  };
  
  // 所有可能的科目
  const allSubjects = ['语文', '数学', '英语', '体育', '音乐', '美术', '科学', '道德与法治', '劳动', '班会'];
  
  // TODO: 从数据库获取真实的科目教师分配
  // 目前返回空数组，由排课算法自动分配
  return [];
}

// ==================== 数据存储 ====================

let scheduleSlots: ScheduleSlot[] = [];
let teachingTasks: TeachingTask[] = [];
let scheduleRules: ScheduleRule[] = [];

// ==================== 排课前置条件检查 ====================

interface ScheduleReadiness {
  isReady: boolean;
  classesReady: number;
  classesTotal: number;
  teachersConfigured: number;
  teachersTotal: number;
  issues: string[];
}

async function checkScheduleReadiness(): Promise<ScheduleReadiness> {
  const issues: string[] = [];
  
  const classesData = await getClassesData();
  const teachersData = await getTeachersData();
  
  // 检查班级是否有班主任
  const classesWithoutHeadTeacher = classesData.filter(c => !c.headTeacherId);
  if (classesWithoutHeadTeacher.length > 0) {
    issues.push(`${classesWithoutHeadTeacher.length}个班级未分配班主任`);
  }
  
  return {
    isReady: issues.length === 0,
    classesReady: classesData.length - classesWithoutHeadTeacher.length,
    classesTotal: classesData.length,
    teachersConfigured: teachersData.length,
    teachersTotal: teachersData.length,
    issues,
  };
}

// ==================== 从数据库数据生成教学任务 ====================

async function generateTeachingTasksFromAssignments(): Promise<TeachingTask[]> {
  const tasks: TeachingTask[] = [];
  const semester = '2024-2025-1';
  
  const classesData = await getClassesData();
  const teachersData = await getTeachersData();
  
  // 标准课时配置（根据年级区分）
  const getStandardHours = (grade: number): Record<string, number> => {
    const base: Record<string, number> = {
      '语文': 6,
      '数学': 5,
      '体育': 3,
      '音乐': 2,
      '美术': 2,
      '道德与法治': 2,
      '劳动': 1,
      '班会': 1,
    };
    
    if (grade <= 2) {
      return { ...base, '科学': 1 };
    } else {
      return { ...base, '英语': 4, '科学': 2 };
    }
  };
  
  // 构建教师索引（按学科分组）
  const teachersBySubject: Record<string, typeof teachersData> = {};
  for (const t of teachersData) {
    for (const subj of t.subjects) {
      if (!teachersBySubject[subj]) teachersBySubject[subj] = [];
      teachersBySubject[subj].push(t);
    }
    if (t.primarySubject) {
      if (!teachersBySubject[t.primarySubject]) teachersBySubject[t.primarySubject] = [];
      if (!teachersBySubject[t.primarySubject].find(x => x.id === t.id)) {
        teachersBySubject[t.primarySubject].push(t);
      }
    }
  }
  
  // 用于跟踪每个教师已分配的课时（使用教师的实际课时配置）
  const teacherAssignedHours: Record<string, number> = {};
  const teacherMaxHours: Record<string, number> = {};
  teachersData.forEach(t => {
    teacherAssignedHours[t.id] = 0;
    teacherMaxHours[t.id] = t.baseWeeklyHours || 16; // 使用教师的课时配置
  });
  
  // 辅助函数：找到课时最少的教师（考虑课时上限）
  const findTeacherWithMinHours = (subject: string, excludeIds: string[] = []): typeof teachersData[0] | undefined => {
    const candidates = teachersBySubject[subject] || [];
    const available = candidates.filter(t => {
      if (excludeIds.includes(t.id)) return false;
      // 检查是否还有课时余量
      const currentHours = teacherAssignedHours[t.id] || 0;
      const maxHours = teacherMaxHours[t.id] || 16;
      return currentHours < maxHours;
    });
    if (available.length === 0) return undefined;
    return available.sort((a, b) => (teacherAssignedHours[a.id] || 0) - (teacherAssignedHours[b.id] || 0))[0];
  };
  
  // 辅助函数：检查教师是否有余量
  const hasCapacity = (teacherId: string, additionalHours: number): boolean => {
    const current = teacherAssignedHours[teacherId] || 0;
    const max = teacherMaxHours[teacherId] || 16;
    return current + additionalHours <= max;
  };
  
  // 辅助函数：分配课时并更新跟踪
  const assignHours = (teacherId: string, hours: number) => {
    teacherAssignedHours[teacherId] = (teacherAssignedHours[teacherId] || 0) + hours;
  };
  
  for (const cls of classesData) {
    const headTeacher = teachersData.find(t => t.id === cls.headTeacherId);
    const subjectHead = teachersData.find(t => t.id === cls.subjectHeadId);
    const grade = cls.grade || 1;
    
    // 根据年级获取标准课时
    const standardHours = getStandardHours(grade);
    
    // 班主任教的科目：语文、道德与法治、劳动、班会
    const headTeacherSubjects = ['语文', '道德与法治', '劳动', '班会'];
    // 科任（副班主任）教的科目：数学、科学
    const subjectHeadSubjects = ['数学', '科学'];
    // 技能科（注意：英语只在3-6年级有）
    const skillSubjects = ['英语', '体育', '音乐', '美术'];
    
    for (const subject of Object.keys(standardHours)) {
      const weeklyHours = standardHours[subject];
      let teacherId = '';
      let teacherName = '';
      
      if (headTeacherSubjects.includes(subject)) {
        // 班主任教的科目
        if (headTeacher && hasCapacity(headTeacher.id, weeklyHours)) {
          teacherId = headTeacher.id;
          teacherName = headTeacher.name;
        }
      } else if (subjectHeadSubjects.includes(subject)) {
        // 科任教的科目
        if (subjectHead && hasCapacity(subjectHead.id, weeklyHours)) {
          teacherId = subjectHead.id;
          teacherName = subjectHead.name;
        } else if (headTeacher && headTeacher.subjects.includes('数学') && hasCapacity(headTeacher.id, weeklyHours)) {
          // 如果没有科任或科任已满，班主任教数学
          teacherId = headTeacher.id;
          teacherName = headTeacher.name;
        }
      } else if (skillSubjects.includes(subject)) {
        // 技能科：找对应学科的教师（排除已满的教师）
        const skillTeacher = findTeacherWithMinHours(subject, [cls.headTeacherId, cls.subjectHeadId]);
        if (skillTeacher) {
          teacherId = skillTeacher.id;
          teacherName = skillTeacher.name;
        }
      }
      
      // 如果还是没找到教师，尝试任何能教这门课的教师
      if (!teacherId) {
        const anyTeacher = findTeacherWithMinHours(subject);
        if (anyTeacher) {
          teacherId = anyTeacher.id;
          teacherName = anyTeacher.name;
        }
      }
      
      if (teacherId) {
        tasks.push({
          id: `task-${cls.id}-${subject}`,
          subject,
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          teacherId,
          teacherName,
          weeklyHours,
          arrangedHours: 0,
          allowContinuous: subject === '语文' || subject === '数学',
          semester,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        // 更新教师已分配课时
        assignHours(teacherId, weeklyHours);
      }
    }
  }
  
  return tasks;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  const grade = searchParams.get('grade');
  
  switch (action) {
    case 'class':
      // 获取班级课表
      const classSlots = classId ? getClassSchedule(scheduleSlots, classId) : [];
      return NextResponse.json({
        success: true,
        data: {
          slots: classSlots,
          table: formatScheduleAsTable(classSlots, DEFAULT_PERIODS, WEEK_DAYS),
          subjectHours: classId ? calculateClassSubjectHours(scheduleSlots, classId) : {},
        },
      });
      
    case 'teacher':
      // 获取教师课表
      const teacherSlots = teacherId ? getTeacherSchedule(scheduleSlots, teacherId) : [];
      return NextResponse.json({
        success: true,
        data: {
          slots: teacherSlots,
          table: formatScheduleAsTable(teacherSlots, DEFAULT_PERIODS, WEEK_DAYS),
          weeklyHours: teacherId ? calculateTeacherWeeklyHours(scheduleSlots, teacherId) : 0,
        },
      });
      
    case 'classes':
      // 获取班级列表（从数据库）
      const dbClasses = await getClassesData();
      return NextResponse.json({
        success: true,
        data: dbClasses,
      });
      
    case 'teachers':
      // 获取教师列表（从数据库）
      const dbTeachers = await getTeachersData();
      return NextResponse.json({
        success: true,
        data: dbTeachers,
      });
      
    case 'tasks':
      // 获取教学任务（从数据库）
      const tasks = await generateTeachingTasksFromAssignments();
      return NextResponse.json({
        success: true,
        data: tasks,
      });
      
    case 'periods':
      // 获取节次配置（支持根据年级返回）
      const periodGrade = searchParams.get('grade');
      if (periodGrade) {
        return NextResponse.json({
          success: true,
          data: getPeriodsByGrade(parseInt(periodGrade)),
        });
      }
      // 返回所有节次配置
      return NextResponse.json({
        success: true,
        data: {
          morning: MORNING_PERIODS,
          afternoonLow: AFTERNOON_PERIODS_LOW,
          afternoonHigh: AFTERNOON_PERIODS_HIGH,
          default: DEFAULT_PERIODS,
        },
      });
      
    case 'readiness':
      // 检查排课前置条件
      const readiness = await checkScheduleReadiness();
      return NextResponse.json({
        success: true,
        data: readiness,
      });
      
    case 'statistics':
      // 获取统计信息（从数据库）
      const statClasses = await getClassesData();
      const statTeachers = await getTeachersData();
      return NextResponse.json({
        success: true,
        data: {
          classCount: statClasses.length,
          teacherCount: statTeachers.length,
          totalSlots: scheduleSlots.length,
          arrangedTasks: teachingTasks.filter(t => t.status === 'completed').length,
          pendingTasks: teachingTasks.filter(t => t.status === 'pending').length,
        },
      });
      
    default:
      // 返回所有课表
      const allClasses = await getClassesData();
      const allTeachers = await getTeachersData();
      const allReadiness = await checkScheduleReadiness();
      return NextResponse.json({
        success: true,
        data: {
          slots: scheduleSlots,
          classes: allClasses,
          teachers: allTeachers,
          periods: DEFAULT_PERIODS,
          weekDays: WEEK_DAYS,
          readiness: allReadiness,
        },
      });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;
  
  switch (action) {
    case 'generate':
      // 智能排课（从数据库获取数据）
      const genClasses = await getClassesData();
      const genTeachers = await getTeachersData();
      teachingTasks = await generateTeachingTasksFromAssignments();
      
      const result = generateSchedule({
        tasks: teachingTasks,
        existingSlots: [],
        rules: scheduleRules,
        periods: DEFAULT_PERIODS,
        weekDays: [1, 2, 3, 4, 5] as const,
        semester: '2024-2025-1',
        // 传递完整的班级和教师信息（从数据库获取）
        classes: genClasses.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          headTeacherId: c.headTeacherId,
          headTeacherName: c.headTeacherName,
          subjectHeadId: c.subjectHeadId,
          subjectHeadName: c.subjectHeadName,
        })),
        teachers: genTeachers.map(t => ({
          id: t.id,
          name: t.name,
          role: t.role,
          primarySubject: t.primarySubject || '',
          baseWeeklyHours: t.baseWeeklyHours || 16,
          totalWeeklyHours: t.totalWeeklyHours || 16,
          mainClassCount: t.mainClassCount || 1,
          mainSubjectHours: t.mainSubjectHours || 12,
          secondarySubjects: t.secondarySubjects || [],
          teachableGrades: t.teachableGrades || [1, 2, 3, 4, 5, 6],
          headTeacherClassId: t.headTeacherClassId,
          subjectHeadClassId: t.subjectHeadClassId,
        })),
      });
      
      if (result.success) {
        scheduleSlots = result.slots;
        // 更新教学任务状态
        teachingTasks.forEach(task => {
          task.arrangedHours = result.slots.filter(s => 
            s.classId === task.classId && s.subject === task.subject
          ).length;
          task.status = task.arrangedHours >= task.weeklyHours ? 'completed' : 'partial';
        });
        
        // 如果有课时调整建议，更新数据库中教师的课时配置
        if (result.adjustments && result.adjustments.length > 0) {
          const client = getSupabaseClient();
          for (const adj of result.adjustments) {
            await client
              .from('teachers')
              .update({ base_weekly_hours: adj.suggestedHours })
              .eq('id', adj.teacherId);
          }
        }
      }
      
      return NextResponse.json({
        success: result.success,
        data: result,
        message: result.success 
          ? `排课完成！共安排${result.statistics.arrangedSlots}节课，覆盖率${(result.statistics.coverageRate * 100).toFixed(1)}%`
          : '排课完成，但存在冲突，请检查',
      });
      
    case 'update-slot':
      // 更新单个课表槽位
      const { slotId, updates } = body;
      const slotIndex = scheduleSlots.findIndex(s => s.id === slotId);
      
      if (slotIndex === -1) {
        return NextResponse.json({
          success: false,
          message: '找不到该课表槽位',
        }, { status: 404 });
      }
      
      scheduleSlots[slotIndex] = {
        ...scheduleSlots[slotIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: scheduleSlots[slotIndex],
        message: '课表更新成功',
      });
      
    case 'reset':
      // 重置课表
      scheduleSlots = [];
      teachingTasks = await generateTeachingTasksFromAssignments();
      
      return NextResponse.json({
        success: true,
        message: '课表已重置',
      });
      
    default:
      return NextResponse.json({
        success: false,
        message: '未知操作',
      }, { status: 400 });
  }
}
