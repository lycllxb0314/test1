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

// ==================== 数据模型 ====================

interface ClassSubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  classNum: number;
  students: number;
  headTeacherId: string;
  headTeacherName: string;
  subjectHeadId?: string;       // 科任（副班主任）
  subjectHeadName?: string;
  subjectTeachers: ClassSubjectTeacher[];
}

interface TeacherInfo {
  id: string;
  name: string;
  subjects: string[];
  grades: number[];
  weeklyHours: number;
  currentHours: number;
}

// 模拟课表数据存储（实际应使用数据库）
let scheduleSlots: ScheduleSlot[] = [];
let teachingTasks: TeachingTask[] = [];
let scheduleRules: ScheduleRule[] = [];

// ==================== 模拟数据（与班级管理模块同步） ====================

// 模拟班级数据（包含科任分配）
let classesData: ClassInfo[] = [
  {
    id: 'c001',
    name: '一年级1班',
    grade: 1,
    classNum: 1,
    students: 50,
    headTeacherId: 't001',
    headTeacherName: '张明华',
    subjectTeachers: [
      { subject: '语文', teacherId: 't001', teacherName: '张明华', weeklyHours: 8 },
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't001', teacherName: '张明华', weeklyHours: 2 },
    ],
  },
  {
    id: 'c002',
    name: '一年级2班',
    grade: 1,
    classNum: 2,
    students: 49,
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    subjectTeachers: [
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 8 },
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2 },
    ],
  },
  {
    id: 'c003',
    name: '二年级1班',
    grade: 2,
    classNum: 1,
    students: 48,
    headTeacherId: 't003',
    headTeacherName: '王建国',
    subjectTeachers: [
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 8 },
      { subject: '数学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2 },
    ],
  },
  {
    id: 'c004',
    name: '三年级1班',
    grade: 3,
    classNum: 1,
    students: 52,
    headTeacherId: 't006',
    headTeacherName: '陈美玲',
    subjectTeachers: [
      { subject: '语文', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 8 },
      { subject: '数学', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 2 },
    ],
  },
];

// 模拟教师数据
let teachersData: TeacherInfo[] = [
  { id: 't001', name: '张明华', subjects: ['语文', '道德与法治'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0 },
  { id: 't002', name: '李秀芳', subjects: ['数学', '科学'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0 },
  { id: 't003', name: '王建国', subjects: ['语文', '道德与法治'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0 },
  { id: 't004', name: '赵丽萍', subjects: ['数学', '科学'], grades: [2, 3, 4], weeklyHours: 14, currentHours: 0 },
  { id: 't005', name: '刘伟强', subjects: ['语文'], grades: [3, 4], weeklyHours: 12, currentHours: 0 },
  { id: 't006', name: '陈美玲', subjects: ['数学'], grades: [3, 4], weeklyHours: 12, currentHours: 0 },
  { id: 't007', name: '周志明', subjects: ['英语'], grades: [3, 4, 5, 6], weeklyHours: 16, currentHours: 0 },
  { id: 't008', name: '吴晓燕', subjects: ['体育'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 18, currentHours: 0 },
  { id: 't009', name: '郑文博', subjects: ['音乐'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 16, currentHours: 0 },
  { id: 't010', name: '孙艺华', subjects: ['美术'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 16, currentHours: 0 },
  { id: 't011', name: '黄志强', subjects: ['科学'], grades: [3, 4, 5, 6], weeklyHours: 14, currentHours: 0 },
  { id: 't012', name: '林小红', subjects: ['道德与法治'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 12, currentHours: 0 },
];

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
  const teachersWithHours = teachersData.filter(t => t.weeklyHours > 0);
  const teachersWithoutHours = teachersData.filter(t => t.weeklyHours === 0);
  
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
          table: formatScheduleAsTable(classSlots, DEFAULT_PERIODS, [1, 2, 3, 4, 5]),
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
          table: formatScheduleAsTable(teacherSlots, DEFAULT_PERIODS, [1, 2, 3, 4, 5]),
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
        // 传递班级信息，用于判断班主任和科任
        classes: classesData.map(c => ({
          id: c.id,
          headTeacherId: c.headTeacherId,
          subjectHeadId: c.subjectHeadId,
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
