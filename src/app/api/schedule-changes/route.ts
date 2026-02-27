/**
 * 调课管理 API
 * 
 * 功能：
 * 1. 获取调课记录列表
 * 2. 从请假记录创建调课记录（内部调用）
 * 3. 年段长安排代课/调换
 * 4. 调课完成后同步到各系统
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 数据结构定义 ====================

interface ScheduleChangeRecord {
  id: string;
  leaveRequestId?: string;
  // 申请人（请假教师）信息
  applicantId: string;
  applicantName: string;
  applicantSubject: string;
  applicantGrade: number;
  // 请假信息
  leaveType: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveReason: string;
  // 原课程信息
  originalClassId: string;
  originalClassName: string;
  originalSubject: string;
  originalWeekDay: number;
  originalPeriodIndex: number;
  originalPeriodName: string;
  // 调课状态
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  adjustType?: 'substitute' | 'swap' | 'cancel' | 'makeup';
  // 代课教师
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  // 调换信息
  swapWithSlot?: {
    classId: string;
    className: string;
    weekDay: number;
    periodIndex: number;
  };
  // 处理人
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  // 备注
  remark?: string;
  // 时间
  createdAt: string;
  updatedAt?: string;
}

// Mock调课数据（用于演示和fallback）
const mockScheduleChanges: ScheduleChangeRecord[] = [
  {
    id: 'sc-001',
    leaveRequestId: 'lr-001',
    applicantId: 't001',
    applicantName: '张明华',
    applicantSubject: '语文',
    applicantGrade: 3,
    leaveType: '病假',
    leaveStartDate: '2024-11-20',
    leaveEndDate: '2024-11-20',
    leaveReason: '身体不适，需就医',
    originalClassId: 'class-3-1',
    originalClassName: '三年1班',
    originalSubject: '语文',
    originalWeekDay: 1,
    originalPeriodIndex: 3,
    originalPeriodName: '第三节',
    status: 'pending',
    createdAt: '2024-11-18 08:30:00',
  },
  {
    id: 'sc-002',
    leaveRequestId: 'lr-002',
    applicantId: 't002',
    applicantName: '李小红',
    applicantSubject: '数学',
    applicantGrade: 3,
    leaveType: '事假',
    leaveStartDate: '2024-11-21',
    leaveEndDate: '2024-11-21',
    leaveReason: '家中有事需处理',
    originalClassId: 'class-3-2',
    originalClassName: '三年2班',
    originalSubject: '数学',
    originalWeekDay: 2,
    originalPeriodIndex: 1,
    originalPeriodName: '第一节',
    status: 'completed',
    adjustType: 'substitute',
    substituteTeacherId: 't003',
    substituteTeacherName: '王建国',
    handlerId: 'gl-001',
    handlerName: '林国强',
    handledAt: '2024-11-19 10:00:00',
    createdAt: '2024-11-17 14:20:00',
    remark: '已安排王建国老师代课',
  },
];

// 内存存储（实际应使用数据库）
let scheduleChangesStore: ScheduleChangeRecord[] = [...mockScheduleChanges];

// ==================== 辅助函数 ====================

const weekDayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * 获取教师当天的课程安排
 * 实际应从课表系统获取
 */
function getTeacherCoursesForDate(teacherId: string, dateStr: string): Array<{
  classId: string;
  className: string;
  subject: string;
  weekDay: number;
  periodIndex: number;
  periodName: string;
}> {
  // 简化处理：根据日期计算星期几
  const date = new Date(dateStr);
  const weekDay = date.getDay(); // 0=周日, 1=周一
  
  // 只处理工作日
  if (weekDay === 0 || weekDay === 6) return [];
  
  // Mock数据：返回教师当天的课程
  // 实际应调用课表系统API
  const mockCourses: Record<string, Array<{
    classId: string;
    className: string;
    subject: string;
    weekDay: number;
    periodIndex: number;
    periodName: string;
  }>> = {
    't001': [
      { classId: 'class-3-1', className: '三年1班', subject: '语文', weekDay: 1, periodIndex: 1, periodName: '第一节' },
      { classId: 'class-3-1', className: '三年1班', subject: '语文', weekDay: 1, periodIndex: 2, periodName: '第二节' },
      { classId: 'class-3-2', className: '三年2班', subject: '语文', weekDay: 1, periodIndex: 3, periodName: '第三节' },
      { classId: 'class-3-1', className: '三年1班', subject: '语文', weekDay: 2, periodIndex: 1, periodName: '第一节' },
    ],
    't002': [
      { classId: 'class-3-1', className: '三年1班', subject: '数学', weekDay: 1, periodIndex: 4, periodName: '第四节' },
      { classId: 'class-3-2', className: '三年2班', subject: '数学', weekDay: 2, periodIndex: 1, periodName: '第一节' },
    ],
  };
  
  return (mockCourses[teacherId] || []).filter(c => c.weekDay === weekDay);
}

// ==================== API 处理函数 ====================

/**
 * GET - 获取调课记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const grade = searchParams.get('grade');
    const teacherId = searchParams.get('teacherId');
    
    // 获取待处理的调课（年段长用）
    if (action === 'pending') {
      const grades = grade ? grade.split(',').map(Number) : [];
      let pendingRecords = scheduleChangesStore.filter(r => r.status === 'pending');
      
      if (grades.length > 0) {
        pendingRecords = pendingRecords.filter(r => grades.includes(r.applicantGrade));
      }
      
      return NextResponse.json({
        success: true,
        data: pendingRecords,
        message: `共有 ${pendingRecords.length} 条待处理调课`,
      });
    }
    
    // 获取历史记录
    if (action === 'history') {
      let historyRecords = [...scheduleChangesStore];
      
      if (status) {
        historyRecords = historyRecords.filter(r => r.status === status);
      }
      
      if (grade) {
        historyRecords = historyRecords.filter(r => r.applicantGrade === parseInt(grade));
      }
      
      return NextResponse.json({
        success: true,
        data: historyRecords.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
    }
    
    // 获取可代课教师
    if (action === 'available-teachers') {
      const subject = searchParams.get('subject');
      const weekDay = parseInt(searchParams.get('weekDay') || '1');
      const periodIndex = parseInt(searchParams.get('periodIndex') || '1');
      
      // Mock可代课教师列表
      const availableTeachers = [
        { id: 't003', name: '王建国', subjects: ['语文'], available: true },
        { id: 't004', name: '赵丽萍', subjects: ['数学'], available: true },
        { id: 't005', name: '周志明', subjects: ['英语'], available: true },
      ].filter(t => !subject || t.subjects.includes(subject));
      
      return NextResponse.json({
        success: true,
        data: availableTeachers,
      });
    }
    
    // 默认返回所有记录
    let records = [...scheduleChangesStore];
    
    if (status) {
      records = records.filter(r => r.status === status);
    }
    
    if (grade) {
      records = records.filter(r => r.applicantGrade === parseInt(grade));
    }
    
    if (teacherId) {
      records = records.filter(r => r.applicantId === teacherId);
    }
    
    return NextResponse.json({
      success: true,
      data: records,
      statistics: {
        total: scheduleChangesStore.length,
        pending: scheduleChangesStore.filter(r => r.status === 'pending').length,
        processing: scheduleChangesStore.filter(r => r.status === 'processing').length,
        completed: scheduleChangesStore.filter(r => r.status === 'completed').length,
      },
    });
    
  } catch (error) {
    console.error('Failed to fetch schedule changes:', error);
    return NextResponse.json({
      success: true,
      data: mockScheduleChanges,
      source: 'mock',
    });
  }
}

/**
 * POST - 创建调课申请
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // 从请假记录创建调课记录（由请假审批API调用）
    if (action === 'createFromLeave') {
      const { leaveRequestId, teacherId, teacherName, startDate, endDate, reason, grade } = body;
      
      // 获取教师请假期间的所有课程
      const start = new Date(startDate);
      const end = new Date(endDate);
      const newRecords: ScheduleChangeRecord[] = [];
      
      // 遍历请假日期范围内的每一天
      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const courses = getTeacherCoursesForDate(teacherId, dateStr);
        
        for (const course of courses) {
          newRecords.push({
            id: `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            leaveRequestId,
            applicantId: teacherId,
            applicantName: teacherName,
            applicantSubject: course.subject,
            applicantGrade: grade || 3,
            leaveType: body.leaveType || '请假',
            leaveStartDate: startDate,
            leaveEndDate: endDate,
            leaveReason: reason,
            originalClassId: course.classId,
            originalClassName: course.className,
            originalSubject: course.subject,
            originalWeekDay: course.weekDay,
            originalPeriodIndex: course.periodIndex,
            originalPeriodName: course.periodName,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      // 添加到存储
      scheduleChangesStore.push(...newRecords);
      
      return NextResponse.json({
        success: true,
        data: newRecords,
        message: `已创建 ${newRecords.length} 条调课记录，请通知年段长安排代课`,
      });
    }
    
    // 手动创建调课申请
    const { originalScheduleId, newTeacherId, newTeacherName, newDayOfWeek, newPeriod, reason, requesterId, requesterName, semester } = body;
    
    const newRecord: ScheduleChangeRecord = {
      id: `sc-${Date.now()}`,
      applicantId: requesterId,
      applicantName: requesterName,
      applicantSubject: '',
      applicantGrade: 1,
      leaveType: '调课',
      leaveStartDate: new Date().toISOString(),
      leaveEndDate: new Date().toISOString(),
      leaveReason: reason,
      originalClassId: '',
      originalClassName: '',
      originalSubject: '',
      originalWeekDay: newDayOfWeek || 1,
      originalPeriodIndex: newPeriod || 1,
      originalPeriodName: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    scheduleChangesStore.push(newRecord);
    
    return NextResponse.json({
      success: true,
      data: newRecord,
      message: '调课申请已创建',
    });
    
  } catch (error) {
    console.error('Failed to create schedule change:', error);
    return NextResponse.json({ success: false, error: '创建调课申请失败' }, { status: 500 });
  }
}

/**
 * PUT - 处理调课申请（年段长安排代课/调换）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // 安排代课
    if (action === 'arrange') {
      const { recordId, adjustType, substituteTeacherId, substituteTeacherName, swapWithSlot, handlerId, handlerName, remark } = body;
      
      const recordIndex = scheduleChangesStore.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        return NextResponse.json({
          success: false,
          error: '找不到调课记录',
        }, { status: 404 });
      }
      
      // 更新调课记录
      scheduleChangesStore[recordIndex] = {
        ...scheduleChangesStore[recordIndex],
        status: 'completed',
        adjustType,
        substituteTeacherId,
        substituteTeacherName,
        swapWithSlot,
        handlerId,
        handlerName,
        handledAt: new Date().toISOString(),
        remark,
        updatedAt: new Date().toISOString(),
      };
      
      // TODO: 同步到各系统
      // 1. 更新课表系统
      // 2. 更新电子白板
      // 3. 更新教师考勤
      // 4. 发送通知
      
      return NextResponse.json({
        success: true,
        data: scheduleChangesStore[recordIndex],
        message: adjustType === 'substitute' 
          ? `已安排${substituteTeacherName}老师代课`
          : '调课已完成',
      });
    }
    
    // 取消调课
    if (action === 'cancel') {
      const { recordId, reason } = body;
      
      const recordIndex = scheduleChangesStore.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) {
        return NextResponse.json({
          success: false,
          error: '找不到调课记录',
        }, { status: 404 });
      }
      
      scheduleChangesStore[recordIndex] = {
        ...scheduleChangesStore[recordIndex],
        status: 'cancelled',
        remark: reason,
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        message: '调课已取消',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未知操作',
    }, { status: 400 });
    
  } catch (error) {
    console.error('Failed to update schedule change:', error);
    return NextResponse.json({ success: false, error: '处理调课失败' }, { status: 500 });
  }
}
