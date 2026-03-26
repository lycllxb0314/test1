/**
 * 教师考勤 API
 * 
 * 功能：
 * - GET: 获取教师考勤数据（当天/当月）
 * - POST: 创建/更新考勤记录
 * 
 * 考勤状态逻辑：
 * 1. 如果有请假记录且状态为 approved → 请假
 * 2. 如果有考勤记录标记为 late → 迟到
 * 3. 如果有考勤记录标记为 absent → 旷工
 * 4. 否则 → 正常
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  ErrorCode,
  parseQueryParams 
} from '@/lib/api-route-utils';

// 考勤状态类型
type AttendanceStatus = 'normal' | 'late' | 'absent' | 'leave';

// 教师考勤记录
interface TeacherAttendanceRecord {
  teacherId: string;
  teacherName: string;
  employeeId: string;
  department: string;
  subject: string;
  status: AttendanceStatus;
  leaveType?: string;
  leaveDuration?: number;
  remark?: string;
  recordId?: string;
}

// 日考勤响应
interface DailyAttendanceResponse {
  date: string;
  summary: {
    total: number;
    normal: number;
    late: number;
    absent: number;
    leave: number;
  };
  records: TeacherAttendanceRecord[];
}

// 月考勤响应
interface MonthlyAttendanceResponse {
  month: string;
  summary: {
    totalTeachers: number;
    totalDays: number;
    normalDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    averageAttendanceRate: number;
  };
  byTeacher: {
    teacherId: string;
    teacherName: string;
    employeeId: string;
    department: string;
    normalDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    attendanceRate: number;
    leaveRecords: { date: string; type: string }[];
  }[];
  byDate: {
    date: string;
    weekday: string;
    normal: number;
    late: number;
    absent: number;
    leave: number;
  }[];
}

/**
 * GET - 获取教师考勤数据
 * 
 * 参数：
 * - type: 'daily' | 'monthly' (默认 daily)
 * - date: 日期 (yyyy-MM-dd)，daily时默认今天，monthly时默认当月
 * - month: 月份 (yyyy-MM)
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  const type = String(params.type || 'daily');
  
  try {
    const client = getSupabaseClient();
    
    if (type === 'monthly') {
      return await getMonthlyAttendance(client, String(params.month || params.date || ''));
    } else {
      return await getDailyAttendance(client, params.date ? String(params.date) : undefined);
    }
  } catch (err) {
    console.error('获取教师考勤数据失败:', err);
    return NextResponse.json(
      error('获取教师考勤数据失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建/更新考勤记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { teacherId, teacherName, date, status, remark, recordedBy } = body;
    
    if (!teacherId || !date || !status) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 检查是否已存在记录
    const { data: existing } = await client
      .from('teacher_attendance')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('date', date)
      .single();
    
    if (existing) {
      // 更新记录
      const { data, error: dbError } = await client
        .from('teacher_attendance')
        .update({
          status,
          remark,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (dbError) {
        return NextResponse.json(
          error('更新考勤记录失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      
      return NextResponse.json(success(data));
    } else {
      // 创建新记录
      const { data, error: dbError } = await client
        .from('teacher_attendance')
        .insert({
          teacher_id: teacherId,
          teacher_name: teacherName,
          date,
          status,
          remark,
        })
        .select()
        .single();
      
      if (dbError) {
        return NextResponse.json(
          error('创建考勤记录失败', ErrorCode.DATABASE_ERROR),
          { status: 500 }
        );
      }
      
      return NextResponse.json(success(data));
    }
  } catch (err) {
    console.error('保存考勤记录失败:', err);
    return NextResponse.json(
      error('保存考勤记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * 获取日考勤数据
 */
async function getDailyAttendance(client: any, date?: string): Promise<NextResponse> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // 1. 获取所有在职教师
  const { data: teachers, error: teacherError } = await client
    .from('teachers')
    .select('id, name, employee_id, department, primary_subject, subjects, status')
    .eq('status', 'active');
  
  if (teacherError) {
    return NextResponse.json(
      error('获取教师列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
  
  // 2. 获取当天的请假记录（已批准的）
  const { data: leaveRecords } = await client
    .from('leave_requests')
    .select('id, applicant_id, applicant_name, type, start_date, end_date, status')
    .eq('status', 'approved')
    .lte('start_date', targetDate)
    .gte('end_date', targetDate);
  
  // 构建请假教师映射
  const leaveMap = new Map<string, { type: string; id: string }>();
  (leaveRecords || []).forEach((leave: any) => {
    leaveMap.set(leave.applicant_id, { type: leave.type, id: leave.id });
  });
  
  // 3. 获取当天的考勤记录
  const { data: attendanceRecords } = await client
    .from('teacher_attendance')
    .select('*')
    .eq('date', targetDate);
  
  // 构建考勤记录映射
  const attendanceMap = new Map<string, any>();
  (attendanceRecords || []).forEach((record: any) => {
    attendanceMap.set(record.teacher_id, record);
  });
  
  // 4. 构建结果
  const records: TeacherAttendanceRecord[] = (teachers || []).map((teacher: any) => {
    const employeeId = teacher.employee_id;
    let status: AttendanceStatus = 'normal';
    let leaveType: string | undefined;
    let leaveDuration: number | undefined;
    let remark: string | undefined;
    let recordId: string | undefined;
    
    // 检查是否有请假记录
    if (employeeId && leaveMap.has(employeeId)) {
      const leave = leaveMap.get(employeeId)!;
      status = 'leave';
      leaveType = leave.type;
    }
    
    // 检查是否有考勤记录（迟到/旷工标记）
    const attendance = attendanceMap.get(teacher.id);
    if (attendance) {
      recordId = attendance.id;
      if (attendance.status === 'late' && status === 'normal') {
        status = 'late';
        remark = attendance.remark;
      } else if (attendance.status === 'absent' && status === 'normal') {
        status = 'absent';
        remark = attendance.remark;
      }
    }
    
    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      employeeId: employeeId || '',
      department: teacher.department || (teacher.primary_subject ? `${teacher.primary_subject}组` : '未分配'),
      subject: teacher.primary_subject || teacher.subjects?.[0] || '',
      status,
      leaveType,
      leaveDuration,
      remark,
      recordId,
    };
  });
  
  // 5. 统计汇总
  const summary = {
    total: records.length,
    normal: records.filter(r => r.status === 'normal').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    leave: records.filter(r => r.status === 'leave').length,
  };
  
  const response: DailyAttendanceResponse = {
    date: targetDate,
    summary,
    records,
  };
  
  return NextResponse.json(success(response));
}

/**
 * 获取月考勤数据
 */
async function getMonthlyAttendance(client: any, month?: string): Promise<NextResponse> {
  // 解析月份
  let targetMonth: string;
  if (month) {
    targetMonth = month.length === 7 ? month : month.substring(0, 7);
  } else {
    targetMonth = new Date().toISOString().substring(0, 7);
  }
  
  // 计算月份的开始和结束日期
  const [year, mon] = targetMonth.split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const endDate = new Date(year, mon, 0).toISOString().split('T')[0];
  
  // 1. 获取所有在职教师
  const { data: teachers, error: teacherError } = await client
    .from('teachers')
    .select('id, name, employee_id, department, primary_subject, subjects, status')
    .eq('status', 'active');
  
  if (teacherError) {
    return NextResponse.json(
      error('获取教师列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
  
  // 2. 获取当月所有请假记录
  const { data: leaveRecords } = await client
    .from('leave_requests')
    .select('id, applicant_id, applicant_name, type, start_date, end_date, status')
    .eq('status', 'approved')
    .or(`start_date.gte.${startDate},end_date.gte.${startDate}`)
    .or(`start_date.lte.${endDate},end_date.lte.${endDate}`);
  
  // 3. 获取当月考勤记录
  const { data: attendanceRecords } = await client
    .from('teacher_attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
  
  // 构建请假记录映射（按教师分组）
  const leaveByTeacher = new Map<string, { date: string; type: string }[]>();
  (leaveRecords || []).forEach((leave: any) => {
    if (!leave.applicant_id) return;
    
    // 展开请假日期
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr >= startDate && dateStr <= endDate) {
        if (!leaveByTeacher.has(leave.applicant_id)) {
          leaveByTeacher.set(leave.applicant_id, []);
        }
        leaveByTeacher.get(leave.applicant_id)!.push({ date: dateStr, type: leave.type });
      }
    }
  });
  
  // 构建考勤记录映射（按教师+日期）
  const attendanceByTeacherDate = new Map<string, any>();
  (attendanceRecords || []).forEach((record: any) => {
    const key = `${record.teacher_id}_${record.date}`;
    attendanceByTeacherDate.set(key, record);
  });
  
  // 计算工作日（排除周末）
  const workDays: string[] = [];
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // 排除周末
      workDays.push(d.toISOString().split('T')[0]);
    }
  }
  
  // 4. 按教师统计
  interface TeacherMonthlyData {
    teacherId: string;
    teacherName: string;
    employeeId: string;
    department: string;
    normalDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    attendanceRate: number;
    leaveRecords: { date: string; type: string }[];
  }
  
  const byTeacher: TeacherMonthlyData[] = (teachers || []).map((teacher: any) => {
    const employeeId = teacher.employee_id;
    const teacherLeaves = leaveByTeacher.get(employeeId) || [];
    const leaveDates = new Set(teacherLeaves.map((l: { date: string; type: string }) => l.date));
    
    let normalDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    
    workDays.forEach(date => {
      const key = `${teacher.id}_${date}`;
      const attendance = attendanceByTeacherDate.get(key);
      
      // 先检查是否请假
      if (leaveDates.has(date)) {
        leaveDays++;
        return;
      }
      
      // 再检查考勤记录
      if (attendance) {
        if (attendance.status === 'late') {
          lateDays++;
        } else if (attendance.status === 'absent') {
          absentDays++;
        } else {
          normalDays++;
        }
      } else {
        // 没有记录的算正常
        normalDays++;
      }
    });
    
    const totalDays = workDays.length;
    const attendanceRate = totalDays > 0 ? Math.round((normalDays + lateDays) / totalDays * 100) : 100;
    
    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      employeeId: employeeId || '',
      department: teacher.department || (teacher.primary_subject ? `${teacher.primary_subject}组` : '未分配'),
      normalDays,
      lateDays,
      absentDays,
      leaveDays,
      attendanceRate,
      leaveRecords: teacherLeaves,
    };
  });
  
  // 5. 按日期统计
  const byDate = workDays.map(date => {
    const d = new Date(date);
    const weekday = weekdays[d.getDay()];
    
    let normal = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;
    
    byTeacher.forEach(teacher => {
      const key = `${teacher.teacherId}_${date}`;
      const attendance = attendanceByTeacherDate.get(key);
      const hasLeave = teacher.leaveRecords.some(l => l.date === date);
      
      if (hasLeave) {
        leave++;
      } else if (attendance) {
        if (attendance.status === 'late') late++;
        else if (attendance.status === 'absent') absent++;
        else normal++;
      } else {
        normal++;
      }
    });
    
    return { date, weekday, normal, late, absent, leave };
  });
  
  // 6. 汇总统计
  const totalNormalDays = byTeacher.reduce((sum: number, t: TeacherMonthlyData) => sum + t.normalDays, 0);
  const totalLateDays = byTeacher.reduce((sum: number, t: TeacherMonthlyData) => sum + t.lateDays, 0);
  const totalAbsentDays = byTeacher.reduce((sum: number, t: TeacherMonthlyData) => sum + t.absentDays, 0);
  const totalLeaveDays = byTeacher.reduce((sum: number, t: TeacherMonthlyData) => sum + t.leaveDays, 0);
  const totalTeacherDays = byTeacher.length * workDays.length;
  
  const response: MonthlyAttendanceResponse = {
    month: targetMonth,
    summary: {
      totalTeachers: (teachers || []).length,
      totalDays: workDays.length,
      normalDays: totalNormalDays,
      lateDays: totalLateDays,
      absentDays: totalAbsentDays,
      leaveDays: totalLeaveDays,
      averageAttendanceRate: totalTeacherDays > 0 
        ? Math.round((totalNormalDays + totalLateDays) / totalTeacherDays * 100) 
        : 100,
    },
    byTeacher,
    byDate,
  };
  
  return NextResponse.json(success(response));
}
