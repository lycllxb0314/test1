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
import { DEFAULT_PERIODS, WEEK_DAYS } from '@/lib/schedule-service';
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
      const pendingRecords = substituteRecords.filter(r => {
        if (r.status !== 'pending') return false;
        if (grades.length === 0) return true;
        const cls = mockClasses.find(c => c.id === r.classId);
        return cls ? grades.includes(cls.grade) : false;
      });
      
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
      const subject = searchParams.get('subject');
      
      // 简化处理，返回所有教师
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
      
      const recordIndex = substituteRecords.findIndex(r => r.id === substituteRecordId);
      if (recordIndex === -1) {
        return NextResponse.json({
          success: false,
          message: '找不到代课记录',
        }, { status: 404 });
      }
      
      const record = substituteRecords[recordIndex];
      
      // 更新代课记录
      const updatedRecord: SubstituteRecord = {
        ...record,
        status: 'arranged',
        substituteTeacherId,
        substituteTeacherName,
        arrangerId,
        arrangerName,
        arrangedAt: new Date().toISOString(),
        arrangeRemark: remark,
      };
      
      substituteRecords[recordIndex] = updatedRecord;
      
      return NextResponse.json({
        success: true,
        data: {
          record: updatedRecord,
        },
        message: `已安排${substituteTeacherName}老师代课`,
      });
      
    case 'create-from-leave':
      // 从请假记录创建代课记录（内部接口，由请假审批调用）
      const { leaveRequestId, teacherId, teacherName, startDate, endDate, reason, affectedSlots } = body;
      
      // 为每个受影响的课时创建代课记录
      const newRecords: SubstituteRecord[] = (affectedSlots || []).map((slot: ScheduleSlot, index: number) => ({
        id: `sub-${Date.now()}-${index}`,
        leaveRequestId,
        originalTeacherId: teacherId,
        originalTeacherName: teacherName,
        classId: slot.classId,
        className: slot.className,
        subject: slot.subject,
        weekDay: slot.weekDay,
        periodIndex: slot.periodIndex,
        periodName: `第${slot.periodIndex}节`,
        date: startDate, // 简化处理
        leaveReason: reason,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      substituteRecords.push(...newRecords);
      
      return NextResponse.json({
        success: true,
        data: newRecords,
        message: `已创建${newRecords.length}条代课记录`,
      });
      
    default:
      return NextResponse.json({
        success: false,
        message: '未知操作',
      }, { status: 400 });
  }
}
