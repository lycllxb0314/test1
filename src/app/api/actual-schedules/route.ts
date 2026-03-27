/**
 * 实际课表 API
 * 
 * GET: 获取实际课表（按周生成）
 * POST: 生成某周实际课表
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import type { ActualScheduleSlot } from '@/types';

/**
 * 根据周次获取日期范围
 */
function getWeekDateRange(semester: string, weekNumber: number): { startDate: Date; endDate: Date } {
  // 简化：假设学期从9月1日开始
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
  
  // 1. 获取基准课表
  const { data: baseSchedules, error: baseError } = await client
    .from('base_schedules')
    .select('*')
    .eq('semester', semester);
  
  if (baseError || !baseSchedules || baseSchedules.length === 0) {
    return [];
  }
  
  // 2. 获取本周的请假记录
  const { startDate, endDate } = getWeekDateRange(semester, weekNumber);
  const { data: leaveRecords } = await client
    .from('leave_requests')
    .select('*')
    .eq('status', 'approved')
    .gte('start_date', startDate.toISOString().split('T')[0])
    .lte('end_date', endDate.toISOString().split('T')[0]);
  
  // 3. 获取本周的代课记录
  const { data: substituteRecords } = await client
    .from('substitute_records')
    .select('*')
    .eq('semester', semester)
    .eq('week_number', weekNumber);
  
  // 4. 生成实际课表
  const actualSchedules: ActualScheduleSlot[] = [];
  
  for (const base of baseSchedules) {
    const date = getDateFromWeekDay(semester, weekNumber, base.day_of_week);
    
    // 检查是否有请假
    const leaveRecord = (leaveRecords || []).find(
      (l: Record<string, unknown>) => l.teacher_id === base.teacher_id
    );
    
    // 检查是否有代课
    const substituteRecord = (substituteRecords || []).find(
      (s: Record<string, unknown>) => s.original_teacher_id === base.teacher_id
    );
    
    let actualSchedule: ActualScheduleSlot = {
      id: base.id,
      semester: base.semester,
      classId: base.class_id,
      className: base.class_name,
      grade: base.grade,
      dayOfWeek: base.day_of_week,
      periodIndex: base.period_index,
      startTime: base.start_time,
      endTime: base.end_time,
      subject: base.subject,
      teacherId: base.teacher_id,
      teacherName: base.teacher_name,
      classroomId: base.classroom_id,
      classroomName: base.classroom_name,
      status: base.status || 'normal',
      createdAt: base.created_at,
      updatedAt: base.updated_at,
      weekNumber,
      date,
      isAdjusted: false,
    };
    
    // 处理请假
    if (leaveRecord && isLeaveAffectsSlot(leaveRecord, date)) {
      actualSchedule.status = 'leave';
      actualSchedule.isAdjusted = true;
      actualSchedule.substituteReason = '请假';
    }
    
    // 处理代课
    if (substituteRecord && isSubstituteAffectsSlot(substituteRecord, date, base.period_index)) {
      actualSchedule.originalTeacherId = base.teacher_id;
      actualSchedule.originalTeacherName = base.teacher_name;
      actualSchedule.teacherId = substituteRecord.substitute_teacher_id as string;
      actualSchedule.teacherName = substituteRecord.substitute_teacher_name as string;
      actualSchedule.status = 'substitute';
      actualSchedule.isAdjusted = true;
      actualSchedule.substituteId = substituteRecord.id as string;
    }
    
    actualSchedules.push(actualSchedule);
  }
  
  return actualSchedules;
}

/**
 * 检查请假是否影响该课次
 */
function isLeaveAffectsSlot(leaveRecord: Record<string, unknown>, date: string): boolean {
  const startDate = leaveRecord.start_date as string;
  const endDate = leaveRecord.end_date as string;
  
  if (date < startDate || date > endDate) return false;
  
  return true;
}

/**
 * 检查代课是否影响该课次
 */
function isSubstituteAffectsSlot(substituteRecord: Record<string, unknown>, date: string, periodIndex: number): boolean {
  const subDate = substituteRecord.date as string;
  const subPeriod = (substituteRecord.period_index || 0) as number;
  
  return subDate === date && subPeriod === periodIndex;
}

// API路由处理
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const semester = searchParams.get('semester') || '2025-2026-2';
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
      const client = getSupabaseClient();
      const { data, error: dbError } = await client
        .from('actual_schedules')
        .select('*')
        .limit(100);
      
      if (dbError) {
        return NextResponse.json(
          error('获取实际课表失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      
      let schedules: ActualScheduleSlot[] = (data || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        semester: s.semester as string,
        classId: s.class_id as string,
        className: s.class_name as string,
        grade: s.grade as number,
        weekNumber: s.week_number as number,
        date: s.date as string,
        dayOfWeek: s.day_of_week as number,
        periodIndex: s.period_index as number,
        startTime: s.start_time as string,
        endTime: s.end_time as string,
        subject: s.subject as string,
        teacherId: s.teacher_id as string,
        teacherName: s.teacher_name as string,
        classroomId: s.classroom_id as string,
        classroomName: s.classroom_name as string,
        status: (s.status as 'normal' | 'leave' | 'substitute' | 'cancelled') || 'normal',
        isAdjusted: (s.is_adjusted as boolean) || false,
        originalTeacherId: s.original_teacher_id as string,
        originalTeacherName: s.original_teacher_name as string,
        substituteReason: s.substitute_reason as string,
        createdAt: s.created_at as string,
        updatedAt: s.updated_at as string,
      }));
      
      if (classId) {
        schedules = schedules.filter(s => s.classId === classId);
      }
      
      if (teacherId) {
        schedules = schedules.filter(s => 
          s.teacherId === teacherId || s.originalTeacherId === teacherId
        );
      }
      
      const now = new Date();
      const semesterStart = new Date(2024, 8, 1);
      const diff = now.getTime() - semesterStart.getTime();
      const currentWeek = Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
      
      return NextResponse.json({
        success: true,
        data: schedules,
        weekInfo: {
          weekNumber: currentWeek,
          ...getWeekDateRange(semester, currentWeek),
        },
      });
    }
  } catch (err) {
    console.error('获取实际课表失败:', err);
    return NextResponse.json(
      error('获取实际课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 生成某周实际课表
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { semester, weekNumber } = body;
    
    if (!semester || !weekNumber) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数：semester, weekNumber',
      }, { status: 400 });
    }
    
    const schedules = await generateWeekActualScheduleSlot(semester, weekNumber);
    
    return NextResponse.json({
      success: true,
      data: schedules,
      message: `成功生成第${weekNumber}周实际课表，共${schedules.length}条记录`,
    });
  } catch (err) {
    console.error('生成实际课表失败:', err);
    return NextResponse.json({
      success: false,
      message: '生成实际课表失败',
    }, { status: 500 });
  }
}
