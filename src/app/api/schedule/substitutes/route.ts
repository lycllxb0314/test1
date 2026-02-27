/**
 * 代课管理 API
 * 
 * GET: 获取代课记录列表
 * POST: 安排代课教师
 * 
 * 与请假系统联动：
 * - 请假审批通过后，系统自动创建代课记录
 * - 年段长在此接口安排代课教师
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_PERIODS,
  WEEK_DAYS,
  processLeaveApproval,
  arrangeSubstitute,
  getPendingSubstitutes,
} from '@/lib/schedule-service';
import type { SubstituteRecord, ScheduleSlot } from '@/types';

// 模拟代课记录存储
let substituteRecords: SubstituteRecord[] = [];

// 模拟课表数据（实际应从数据库获取）
const scheduleSlots: ScheduleSlot[] = [];

// 模拟班级数据
const mockClasses = [
  { id: 'class-1', name: '一年级1班', grade: 1 },
  { id: 'class-2', name: '一年级2班', grade: 1 },
  { id: 'class-3', name: '二年级1班', grade: 2 },
  { id: 'class-4', name: '二年级2班', grade: 2 },
  { id: 'class-5', name: '三年级1班', grade: 3 },
  { id: 'class-6', name: '三年级2班', grade: 3 },
];

// 模拟教师数据
const mockTeachers = [
  { id: 'teacher-1', name: '张明华', subjects: ['语文'] },
  { id: 'teacher-2', name: '李秀芳', subjects: ['数学'] },
  { id: 'teacher-3', name: '王建国', subjects: ['语文'] },
  { id: 'teacher-4', name: '赵丽萍', subjects: ['数学'] },
  { id: 'teacher-5', name: '刘伟强', subjects: ['语文'] },
  { id: 'teacher-8', name: '吴晓燕', subjects: ['体育'] },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const status = searchParams.get('status');
  const grade = searchParams.get('grade');
  const managedGrades = searchParams.get('managedGrades');
  
  switch (action) {
    case 'pending':
      // 获取待安排的代课（年段长用）
      const grades = managedGrades ? managedGrades.split(',').map(Number) : [];
      const pendingRecords = getPendingSubstitutes(substituteRecords, grades, mockClasses);
      
      return NextResponse.json({
        success: true,
        data: pendingRecords,
        message: `共有${pendingRecords.length}条待安排代课`,
      });
      
    case 'history':
      // 获取代课历史记录
      let historyRecords = [...substituteRecords];
      
      if (status) {
        historyRecords = historyRecords.filter(r => r.status === status);
      }
      
      if (grade) {
        const gradeNum = parseInt(grade);
        const gradeClassIds = mockClasses.filter(c => c.grade === gradeNum).map(c => c.id);
        historyRecords = historyRecords.filter(r => gradeClassIds.includes(r.classId));
      }
      
      return NextResponse.json({
        success: true,
        data: historyRecords.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
      
    case 'available-teachers':
      // 获取可代课教师列表
      const weekDay = parseInt(searchParams.get('weekDay') || '1');
      const periodIndex = parseInt(searchParams.get('periodIndex') || '1');
      const subject = searchParams.get('subject');
      
      // 获取当前课表（需要从全局状态或数据库获取）
      // 这里简化处理，返回所有教师
      const availableTeachers = mockTeachers.filter(
        t => subject ? t.subjects.includes(subject) : true
      );
      
      return NextResponse.json({
        success: true,
        data: availableTeachers,
      });
      
    default:
      // 返回所有代课记录
      return NextResponse.json({
        success: true,
        data: substituteRecords,
        statistics: {
          total: substituteRecords.length,
          pending: substituteRecords.filter(r => r.status === 'pending').length,
          arranged: substituteRecords.filter(r => r.status === 'arranged').length,
          completed: substituteRecords.filter(r => r.status === 'completed').length,
        },
      });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;
  
  switch (action) {
    case 'arrange':
      // 安排代课教师
      const { substituteRecordId, substituteTeacherId, substituteTeacherName, arrangerId, arrangerName, remark } = body;
      
      const record = substituteRecords.find(r => r.id === substituteRecordId);
      if (!record) {
        return NextResponse.json({
          success: false,
          message: '找不到代课记录',
        }, { status: 404 });
      }
      
      try {
        // 安排代课
        const result = arrangeSubstitute({
          substituteRecord: record,
          substituteTeacherId,
          substituteTeacherName,
          arrangerId,
          arrangerName,
          remark,
          currentSlots: [], // 需要传入实际课表
        });
        
        // 更新代课记录
        const recordIndex = substituteRecords.findIndex(r => r.id === substituteRecordId);
        substituteRecords[recordIndex] = result.updatedRecord;
        
        return NextResponse.json({
          success: true,
          data: {
            record: result.updatedRecord,
            slot: result.updatedSlot,
          },
          message: `已安排${substituteTeacherName}老师代课`,
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: error instanceof Error ? error.message : '安排代课失败',
        }, { status: 400 });
      }
      
    case 'create-from-leave':
      // 从请假记录创建代课记录（内部接口，由请假审批调用）
      const { leaveRequestId, teacherId, teacherName, startDate, endDate, reason } = body;
      
      // 获取当前课表
      // 这里需要实际从数据库或全局状态获取
      const currentSlots: ScheduleSlot[] = [];
      
      const newRecords = processLeaveApproval({
        leaveRequestId,
        teacherId,
        teacherName,
        startDate,
        endDate,
        reason,
        currentSlots,
        semester: '2024-2025-1',
      });
      
      substituteRecords.push(...newRecords);
      
      return NextResponse.json({
        success: true,
        data: newRecords,
        message: `已创建${newRecords.length}条代课记录，请通知相关年段长安排代课`,
      });
      
    case 'complete':
      // 完成代课
      const { recordId } = body;
      const completeIndex = substituteRecords.findIndex(r => r.id === recordId);
      
      if (completeIndex === -1) {
        return NextResponse.json({
          success: false,
          message: '找不到代课记录',
        }, { status: 404 });
      }
      
      substituteRecords[completeIndex] = {
        ...substituteRecords[completeIndex],
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: substituteRecords[completeIndex],
        message: '代课已完成',
      });
      
    case 'cancel':
      // 取消代课安排
      const { cancelRecordId, cancelReason } = body;
      const cancelIndex = substituteRecords.findIndex(r => r.id === cancelRecordId);
      
      if (cancelIndex === -1) {
        return NextResponse.json({
          success: false,
          message: '找不到代课记录',
        }, { status: 404 });
      }
      
      substituteRecords[cancelIndex] = {
        ...substituteRecords[cancelIndex],
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        message: '代课安排已取消',
      });
      
    default:
      return NextResponse.json({
        success: false,
        message: '未知操作',
      }, { status: 400 });
  }
}
