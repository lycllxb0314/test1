/**
 * 实际课表 API
 * 
 * GET: 获取实际课表（按周生成）
 * POST: 生成某周实际课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ActualScheduleSlot, BaseScheduleSlot } from '@/types';

// Mock基准课表数据
const mockBaseScheduleSlots: BaseScheduleSlot[] = [
  // 一年级1班
  {
    id: 'bs001',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 1,
    startTime: '08:00',
    endTime: '08:40',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs002',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 2,
    startTime: '08:50',
    endTime: '09:30',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs003',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 1,
    periodIndex: 3,
    startTime: '10:00',
    endTime: '10:40',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs004',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 2,
    periodIndex: 1,
    startTime: '08:00',
    endTime: '08:40',
    subject: '数学',
    teacherId: 't002',
    teacherName: '李雪梅',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'bs005',
    semester: '2024-2025-1',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    dayOfWeek: 2,
    periodIndex: 2,
    startTime: '08:50',
    endTime: '09:30',
    subject: '语文',
    teacherId: 't001',
    teacherName: '张明华',
    classroomId: 'room001',
    classroomName: '一年级1班教室',
    status: 'normal',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
];

// Mock请假数据
const mockLeaveRecords = [
  {
    teacherId: 't001',
    startDate: '2024-11-18',
    endDate: '2024-11-18',
    periods: [1, 2],
    reason: '病假',
  },
];

// Mock代课数据
const mockSubstituteRecords = [
  {
    originalTeacherId: 't001',
    substituteTeacherId: 't003',
    date: '2024-11-18',
    periodIndex: 1,
    classId: 'c001',
    subject: '语文',
  },
];

/**
 * 根据周次获取日期范围
 */
function getWeekDateRange(semester: string, weekNumber: number): { startDate: Date; endDate: Date } {
  // 简化：假设学期从9月1日开始（周日）
  const year = parseInt(semester.split('-')[0]);
  const semesterStart = new Date(year, 8, 1); // 9月1日
  
  const startDate = new Date(semesterStart);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return { startDate, endDate };
}

/**
 * 根据周次和星期几获取具体日期
 */
function getDateFromWeekDay(semester: string, weekNumber: number, dayOfWeek: number): string {
  const { startDate } = getWeekDateRange(semester, weekNumber);
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOfWeek - 1); // dayOfWeek: 1=周一
  return date.toISOString().split('T')[0];
}

/**
 * 生成某周实际课表
 */
async function generateWeekActualScheduleSlot(
  semester: string,
  weekNumber: number
): Promise<ActualScheduleSlot[]> {
  const client = getSupabaseClient();
  
  try {
    // 1. 获取基准课表
    const { data: baseSchedules, error } = await client
      .from('base_schedules')
      .select('*')
      .eq('semester', semester);
    
    let baseData = baseSchedules;
    if (error || !baseData || baseData.length === 0) {
      // 使用Mock数据
      baseData = mockBaseScheduleSlots;
    }
    
    // 2. 获取本周的请假记录
    const { startDate, endDate } = getWeekDateRange(semester, weekNumber);
    const { data: leaveRecords } = await client
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());
    
    // 3. 获取本周的代课记录
    const { data: substituteRecords } = await client
      .from('substitute_records')
      .select('*')
      .eq('semester', semester)
      .eq('week_number', weekNumber);
    
    // 4. 生成实际课表
    const actualSchedules: ActualScheduleSlot[] = [];
    
    for (const base of baseData) {
      const date = getDateFromWeekDay(semester, weekNumber, base.dayOfWeek);
      
      // 检查是否有请假
      const leaveRecord = (leaveRecords || mockLeaveRecords).find(
        l => l.teacher_id === base.teacherId || l.teacherId === base.teacherId
      );
      
      // 检查是否有代课
      const substituteRecord = (substituteRecords || mockSubstituteRecords).find(
        s => s.original_teacher_id === base.teacherId || s.originalTeacherId === base.teacherId
      );
      
      let actualSchedule: ActualScheduleSlot = {
        ...base,
        weekNumber,
        date,
        isAdjusted: false,
      };
      
      // 处理请假
      if (leaveRecord && isLeaveAffectsSlot(leaveRecord, date, base.periodIndex)) {
        actualSchedule.status = 'leave';
        actualSchedule.isAdjusted = true;
        actualSchedule.substituteReason = '请假';
      }
      
      // 处理代课
      if (substituteRecord && isSubstituteAffectsSlot(substituteRecord, date, base.periodIndex)) {
        actualSchedule.originalTeacherId = base.teacherId;
        actualSchedule.originalTeacherName = base.teacherName;
        actualSchedule.teacherId = substituteRecord.substitute_teacher_id || substituteRecord.substituteTeacherId;
        actualSchedule.teacherName = substituteRecord.substitute_teacher_name || substituteRecord.substituteTeacherName;
        actualSchedule.status = 'substitute';
        actualSchedule.isAdjusted = true;
        actualSchedule.substituteId = substituteRecord.id;
      }
      
      actualSchedules.push(actualSchedule);
    }
    
    return actualSchedules;
  } catch (error) {
    console.error('生成实际课表失败:', error);
    // 返回基于Mock数据的实际课表
    return generateMockActualScheduleSlot(semester, weekNumber);
  }
}

/**
 * 检查请假是否影响该课次
 */
function isLeaveAffectsSlot(leaveRecord: Record<string, unknown>, date: string, periodIndex: number): boolean {
  const startDate = (leaveRecord.start_time || leaveRecord.startDate) as string;
  const endDate = (leaveRecord.end_time || leaveRecord.endDate) as string;
  const periods = (leaveRecord.periods || leaveRecord.periods) as number[];
  
  if (date < startDate || date > endDate) return false;
  if (periods && !periods.includes(periodIndex)) return false;
  
  return true;
}

/**
 * 检查代课是否影响该课次
 */
function isSubstituteAffectsSlot(substituteRecord: Record<string, unknown>, date: string, periodIndex: number): boolean {
  const subDate = (substituteRecord.date) as string;
  const subPeriod = (substituteRecord.period_index || substituteRecord.periodIndex) as number;
  
  return subDate === date && subPeriod === periodIndex;
}

/**
 * 生成Mock实际课表
 */
function generateMockActualScheduleSlot(semester: string, weekNumber: number): ActualScheduleSlot[] {
  const actualSchedules: ActualScheduleSlot[] = [];
  
  for (const base of mockBaseScheduleSlots) {
    const date = getDateFromWeekDay(semester, weekNumber, base.dayOfWeek);
    
    let actualSchedule: ActualScheduleSlot = {
      ...base,
      weekNumber,
      date,
      isAdjusted: false,
    };
    
    // 模拟第12周周一第1、2节张老师请假
    if (weekNumber === 12 && base.dayOfWeek === 1 && base.teacherId === 't001' && [1, 2].includes(base.periodIndex)) {
      actualSchedule.status = 'substitute';
      actualSchedule.isAdjusted = true;
      actualSchedule.originalTeacherId = 't001';
      actualSchedule.originalTeacherName = '张明华';
      actualSchedule.teacherId = 't003';
      actualSchedule.teacherName = '王建国';
      actualSchedule.substituteReason = '张老师病假';
    }
    
    actualSchedules.push(actualSchedule);
  }
  
  return actualSchedules;
}

// API路由处理
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const semester = searchParams.get('semester') || '2024-2025-1';
  const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : null;
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  const date = searchParams.get('date');

  try {
    if (weekNumber) {
      // 获取指定周的实际课表
      let schedules = await generateWeekActualScheduleSlot(semester, weekNumber);
      
      // 按班级筛选
      if (classId) {
        schedules = schedules.filter(s => s.classId === classId);
      }
      
      // 按教师筛选
      if (teacherId) {
        schedules = schedules.filter(s => 
          s.teacherId === teacherId || s.originalTeacherId === teacherId
        );
      }
      
      // 按日期筛选
      if (date) {
        schedules = schedules.filter(s => s.date === date);
      }
      
      return NextResponse.json({
        success: true,
        data: schedules,
        weekInfo: {
          weekNumber,
          ...getWeekDateRange(semester, weekNumber),
        },
      });
    } else if (date) {
      // 根据日期计算周次
      const dateObj = new Date(date);
      const semesterStart = new Date(2024, 8, 1); // 9月1日
      const diff = dateObj.getTime() - semesterStart.getTime();
      const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
      
      let schedules = await generateWeekActualScheduleSlot(semester, week);
      schedules = schedules.filter(s => s.date === date);
      
      return NextResponse.json({
        success: true,
        data: schedules,
        weekInfo: {
          weekNumber: week,
          date,
        },
      });
    } else {
      // 返回当前周
      const now = new Date();
      const semesterStart = new Date(2024, 8, 1);
      const diff = now.getTime() - semesterStart.getTime();
      const currentWeek = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
      
      let schedules = await generateWeekActualScheduleSlot(semester, currentWeek);
      
      if (classId) {
        schedules = schedules.filter(s => s.classId === classId);
      }
      
      if (teacherId) {
        schedules = schedules.filter(s => 
          s.teacherId === teacherId || s.originalTeacherId === teacherId
        );
      }
      
      return NextResponse.json({
        success: true,
        data: schedules,
        weekInfo: {
          weekNumber: currentWeek,
          ...getWeekDateRange(semester, currentWeek),
        },
      });
    }
  } catch (error) {
    console.error('获取实际课表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取实际课表失败',
    }, { status: 500 });
  }
}

/**
 * POST: 生成某周实际课表（手动触发）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { semester, weekNumber } = body;
    
    if (!semester || !weekNumber) {
      return NextResponse.json({
        success: false,
        message: '缺少学期或周次参数',
      }, { status: 400 });
    }
    
    const schedules = await generateWeekActualScheduleSlot(semester, weekNumber);
    
    // 存储到数据库
    const client = getSupabaseClient();
    
    // 先删除旧的
    await client
      .from('actual_schedules')
      .delete()
      .eq('semester', semester)
      .eq('week_number', weekNumber);
    
    // 插入新的
    const { error } = await client
      .from('actual_schedules')
      .insert(schedules.map(s => ({
        id: s.id,
        semester: s.semester,
        week_number: s.weekNumber,
        date: s.date,
        day_of_week: s.dayOfWeek,
        period_index: s.periodIndex,
        start_time: s.startTime,
        end_time: s.endTime,
        class_id: s.classId,
        class_name: s.className,
        grade: s.grade,
        subject: s.subject,
        teacher_id: s.teacherId,
        teacher_name: s.teacherName,
        classroom_id: s.classroomId,
        classroom_name: s.classroomName,
        status: s.status,
        is_adjusted: s.isAdjusted,
        original_teacher_id: s.originalTeacherId,
        original_teacher_name: s.originalTeacherName,
        substitute_reason: s.substituteReason,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })));
    
    if (error) {
      console.error('存储实际课表失败:', error);
      // 返回生成的数据，标记为mock
      return NextResponse.json({
        success: true,
        data: schedules,
        source: 'generated',
        weekInfo: {
          weekNumber,
          ...getWeekDateRange(semester, weekNumber),
        },
        message: '课表已生成，但数据库存储失败',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: schedules,
      source: 'database',
      weekInfo: {
        weekNumber,
        ...getWeekDateRange(semester, weekNumber),
      },
    });
  } catch (error) {
    console.error('生成实际课表失败:', error);
    return NextResponse.json({
      success: false,
      message: '生成实际课表失败',
    }, { status: 500 });
  }
}
