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

// 模拟课表数据存储（实际应使用数据库）
let scheduleSlots: ScheduleSlot[] = [];
let teachingTasks: TeachingTask[] = [];
let scheduleRules: ScheduleRule[] = [];

// 模拟班级数据
const mockClasses = [
  { id: 'class-1', name: '一年级1班', grade: 1, headTeacherId: 'teacher-1' },
  { id: 'class-2', name: '一年级2班', grade: 1, headTeacherId: 'teacher-2' },
  { id: 'class-3', name: '二年级1班', grade: 2, headTeacherId: 'teacher-3' },
  { id: 'class-4', name: '二年级2班', grade: 2, headTeacherId: 'teacher-4' },
  { id: 'class-5', name: '三年级1班', grade: 3, headTeacherId: 'teacher-5' },
  { id: 'class-6', name: '三年级2班', grade: 3, headTeacherId: 'teacher-6' },
  { id: 'class-7', name: '四年级1班', grade: 4, headTeacherId: 'teacher-7' },
  { id: 'class-8', name: '四年级2班', grade: 4, headTeacherId: 'teacher-8' },
  { id: 'class-9', name: '五年级1班', grade: 5, headTeacherId: 'teacher-9' },
  { id: 'class-10', name: '五年级2班', grade: 5, headTeacherId: 'teacher-10' },
  { id: 'class-11', name: '六年级1班', grade: 6, headTeacherId: 'teacher-11' },
  { id: 'class-12', name: '六年级2班', grade: 6, headTeacherId: 'teacher-12' },
];

// 模拟教师数据
const mockTeachers = [
  { id: 'teacher-1', name: '张明华', subjects: ['语文'], grades: [1] },
  { id: 'teacher-2', name: '李秀芳', subjects: ['数学'], grades: [1] },
  { id: 'teacher-3', name: '王建国', subjects: ['语文'], grades: [2] },
  { id: 'teacher-4', name: '赵丽萍', subjects: ['数学'], grades: [2] },
  { id: 'teacher-5', name: '刘伟强', subjects: ['语文'], grades: [3] },
  { id: 'teacher-6', name: '陈美玲', subjects: ['数学'], grades: [3] },
  { id: 'teacher-7', name: '周志明', subjects: ['英语'], grades: [4, 5, 6] },
  { id: 'teacher-8', name: '吴晓燕', subjects: ['体育'], grades: [1, 2, 3, 4, 5, 6] },
  { id: 'teacher-9', name: '郑文博', subjects: ['音乐'], grades: [1, 2, 3, 4, 5, 6] },
  { id: 'teacher-10', name: '孙艺华', subjects: ['美术'], grades: [1, 2, 3, 4, 5, 6] },
  { id: 'teacher-11', name: '黄志强', subjects: ['科学'], grades: [3, 4, 5, 6] },
  { id: 'teacher-12', name: '林小红', subjects: ['道德与法治'], grades: [1, 2, 3, 4, 5, 6] },
];

// 初始化教学任务（如果为空）
function initTeachingTasks() {
  if (teachingTasks.length > 0) return;
  
  // 课程标准：每个班级每周各科目课时
  const subjectHours: Record<string, number> = {
    '语文': 8,
    '数学': 6,
    '英语': 4,
    '体育': 3,
    '音乐': 2,
    '美术': 2,
    '科学': 2,
    '道德与法治': 2,
  };
  
  const semester = '2024-2025-1';
  
  for (const cls of mockClasses) {
    for (const [subject, hours] of Object.entries(subjectHours)) {
      // 找到能教这个班级这门课的老师
      const teacher = mockTeachers.find(
        t => t.subjects.includes(subject) && t.grades.includes(cls.grade)
      );
      
      if (teacher) {
        teachingTasks.push({
          id: `task-${cls.id}-${subject}`,
          subject,
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          teacherId: teacher.id,
          teacherName: teacher.name,
          weeklyHours: hours,
          arrangedHours: 0,
          allowContinuous: subject === '语文' || subject === '数学',
          semester,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
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
        data: mockClasses,
      });
      
    case 'teachers':
      // 获取教师列表
      return NextResponse.json({
        success: true,
        data: mockTeachers,
      });
      
    case 'tasks':
      // 获取教学任务
      initTeachingTasks();
      return NextResponse.json({
        success: true,
        data: teachingTasks,
      });
      
    case 'periods':
      // 获取节次配置
      return NextResponse.json({
        success: true,
        data: DEFAULT_PERIODS,
      });
      
    case 'statistics':
      // 获取统计信息
      return NextResponse.json({
        success: true,
        data: {
          classCount: mockClasses.length,
          teacherCount: mockTeachers.length,
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
          classes: mockClasses,
          teachers: mockTeachers,
          periods: DEFAULT_PERIODS,
          weekDays: WEEK_DAYS,
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
      initTeachingTasks();
      
      const result = generateSchedule({
        tasks: teachingTasks,
        existingSlots: [],
        rules: scheduleRules,
        periods: DEFAULT_PERIODS,
        weekDays: [1, 2, 3, 4, 5] as const,
        semester: '2024-2025-1',
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
      teachingTasks = [];
      initTeachingTasks();
      
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
