/**
 * 智能排课系统 API
 * 
 * GET: 获取课表数据
 * POST: 智能排课
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_PERIODS,
  WEEK_DAYS,
  generateSchedule,
  getClassSchedule,
  getTeacherSchedule,
  formatScheduleAsTable,
  calculateClassSubjectHours,
  calculateTeacherWeeklyHours,
} from '@/lib/schedule-service';
import type { ScheduleSlot, TeachingTask, ScheduleRule, WeekDay } from '@/types';
// 导入统一数据源
import { TEACHERS_DATA, CLASSES_DATA } from '@/lib/data/classes-teachers';

// ==================== 数据模型 ====================

interface ClassSubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
}

// 使用导入的统一数据源
const classesData = CLASSES_DATA;
const teachersData = TEACHERS_DATA;

// 模拟课表数据存储（实际应使用数据库）
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

function checkScheduleReadiness(): ScheduleReadiness {
  const issues: string[] = [];
  
  // 检查班级科任分配
  const classesWithAssignment = classesData.filter(c => c.subjectTeachers.length > 0);
  const classesWithoutAssignment = classesData.filter(c => c.subjectTeachers.length === 0);
  
  if (classesWithoutAssignment.length > 0) {
    issues.push(`${classesWithoutAssignment.length}个班级未完成科任分配：${classesWithoutAssignment.map(c => c.name).join('、')}`);
  }
  
  // 检查教师课时配置
  const teachersWithHours = teachersData.filter(t => t.totalWeeklyHours > 0);
  const teachersWithoutHours = teachersData.filter(t => t.totalWeeklyHours === 0);
  
  if (teachersWithoutHours.length > 0) {
    issues.push(`${teachersWithoutHours.length}位教师未配置周课时量：${teachersWithoutHours.map(t => t.name).join('、')}`);
  }
  
  // 检查科目覆盖
  const requiredSubjects = ['语文', '数学', '英语', '体育', '音乐', '美术', '科学', '道德与法治'];
  classesData.forEach(cls => {
    const assignedSubjects = cls.subjectTeachers.map(st => st.subject);
    const missingSubjects = requiredSubjects.filter(s => !assignedSubjects.includes(s));
    if (missingSubjects.length > 0) {
      issues.push(`${cls.name}缺少科目分配：${missingSubjects.join('、')}`);
    }
  });
  
  return {
    isReady: issues.length === 0,
    classesReady: classesWithAssignment.length,
    classesTotal: classesData.length,
    teachersConfigured: teachersWithHours.length,
    teachersTotal: teachersData.length,
    issues,
  };
}

// ==================== 从班级科任分配生成教学任务 ====================

function generateTeachingTasksFromAssignments(): TeachingTask[] {
  const tasks: TeachingTask[] = [];
  const semester = '2024-2025-1';
  
  for (const cls of classesData) {
    for (const assignment of cls.subjectTeachers) {
      if (!assignment.teacherId || !assignment.weeklyHours) continue;
      
      tasks.push({
        id: `task-${cls.id}-${assignment.subject}`,
        subject: assignment.subject,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherId: assignment.teacherId,
        teacherName: assignment.teacherName,
        weeklyHours: assignment.weeklyHours,
        arrangedHours: 0,
        allowContinuous: assignment.subject === '语文' || assignment.subject === '数学',
        semester,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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
          subjectHours: classId ? calculateClassSubjectHours(scheduleSlots.filter(s => s.classId === classId)) : {},
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
      // 获取班级列表
      return NextResponse.json({
        success: true,
        data: classesData,
      });
      
    case 'teachers':
      // 获取教师列表
      return NextResponse.json({
        success: true,
        data: teachersData,
      });
      
    case 'tasks':
      // 获取教学任务
      const tasks = generateTeachingTasksFromAssignments();
      return NextResponse.json({
        success: true,
        data: tasks,
      });
      
    case 'periods':
      // 获取节次配置
      return NextResponse.json({
        success: true,
        data: DEFAULT_PERIODS,
      });
      
    case 'readiness':
      // 检查排课前置条件
      return NextResponse.json({
        success: true,
        data: checkScheduleReadiness(),
      });
      
    case 'statistics':
      // 获取统计信息
      return NextResponse.json({
        success: true,
        data: {
          classCount: classesData.length,
          teacherCount: teachersData.length,
          totalSlots: scheduleSlots.length,
          arrangedTasks: teachingTasks.filter(t => t.status === 'completed').length,
          pendingTasks: teachingTasks.filter(t => t.status === 'pending').length,
        },
      });
      
    default:
      // 返回所有课表
      return NextResponse.json({
        success: true,
        data: {
          slots: scheduleSlots,
          classes: classesData,
          teachers: teachersData,
          periods: DEFAULT_PERIODS,
          weekDays: WEEK_DAYS,
          readiness: checkScheduleReadiness(),
        },
      });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;
  
  switch (action) {
    case 'generate':
      // 智能排课
      teachingTasks = generateTeachingTasksFromAssignments();
      
      const result = generateSchedule({
        tasks: teachingTasks,
        existingSlots: [],
        rules: scheduleRules,
        periods: DEFAULT_PERIODS,
        weekDays: [1, 2, 3, 4, 5] as const,
        semester: '2024-2025-1',
        // 传递完整的班级和教师信息
        classes: classesData.map(c => ({
          id: c.id,
          name: c.name,
          grade: c.grade,
          headTeacherId: c.headTeacherId,
          headTeacherName: c.headTeacherName,
          subjectHeadId: c.subjectHeadId,
          subjectHeadName: c.subjectHeadName,
        })),
        teachers: teachersData.map(t => ({
          id: t.id,
          name: t.name,
          role: t.role,
          primarySubject: t.primarySubject,
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
      teachingTasks = generateTeachingTasksFromAssignments();
      
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
