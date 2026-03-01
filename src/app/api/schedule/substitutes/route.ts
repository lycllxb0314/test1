/**
 * 代课管理 API
 * 
 * GET: 获取代课记录列表
 * POST: 安排代课教师
 * 
 * 与请假系统联动：
 * - 请假审批通过后，系统自动创建代课记录
 * - 年段长在此接口安排代课教师
 * 
 * 数据来源：使用 lib/mock 统一数据源
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { DEFAULT_PERIODS, WEEK_DAYS } from '@/lib/schedule-service';
import { 
  MASTER_CLASSES, 
  MASTER_TEACHERS,
  getMasterClassById,
  getMasterTeacherById 
} from '@/lib/mock/master-data';
import { getMockScheduleChanges, type ScheduleChangeRecord } from '@/lib/mock/academic.mock';
import type { SubstituteRecord, ScheduleSlot } from '@/types';

// 内存中的代课记录（用于临时存储）
let substituteRecords: SubstituteRecord[] = [];

/**
 * 将 ScheduleChangeRecord 转换为 SubstituteRecord
 */
function scheduleChangeToSubstituteRecord(sc: ScheduleChangeRecord): SubstituteRecord {
  return {
    id: sc.id,
    leaveRequestId: sc.leaveRequestId || '',
    scheduleSlotId: `slot-${sc.id}`,
    originalTeacherId: sc.applicantId,
    originalTeacherName: sc.applicantName,
    classId: sc.originalClassId,
    className: sc.originalClassName,
    subject: sc.originalSubject,
    courseName: sc.originalSubject,
    weekDay: sc.originalWeekDay,
    periodIndex: sc.originalPeriodIndex,
    periodName: sc.originalPeriodName,
    semester: '2024-2025-1',
    status: sc.status === 'completed' ? 'completed' : sc.status === 'processing' ? 'arranged' : 'pending',
    substituteType: 'temporary',
    substituteTeacherId: sc.substituteTeacherId,
    substituteTeacherName: sc.substituteTeacherName,
    arrangerId: sc.handlerId,
    arrangerName: sc.handlerName,
    arrangedAt: sc.handledAt,
    arrangeRemark: sc.remark,
    leaveTeacherName: sc.applicantName,
    leaveReason: sc.leaveReason,
    leaveStartDate: sc.leaveStartDate,
    leaveEndDate: sc.leaveEndDate,
    createdAt: sc.createdAt,
    updatedAt: sc.updatedAt || sc.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const status = searchParams.get('status');
  const grade = searchParams.get('grade');
  const managedGrades = searchParams.get('managedGrades');
  
  // 尝试从数据库获取数据
  let dbRecords: SubstituteRecord[] = [];
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('substitute_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      dbRecords = data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        leaveRequestId: r.leave_request_id as string || '',
        scheduleSlotId: r.schedule_slot_id as string || '',
        originalTeacherId: r.original_teacher_id as string,
        originalTeacherName: r.original_teacher_name as string,
        classId: r.class_id as string,
        className: r.class_name as string,
        subject: r.subject as string,
        courseName: r.course_name as string || r.subject as string,
        weekDay: r.week_day as number,
        periodIndex: r.period_index as number,
        periodName: r.period_name as string,
        semester: r.semester as string || '2024-2025-1',
        status: r.status as 'pending' | 'arranged' | 'completed' | 'cancelled',
        substituteType: r.substitute_type as 'temporary' | 'long_term' || 'temporary',
        substituteTeacherId: r.substitute_teacher_id as string,
        substituteTeacherName: r.substitute_teacher_name as string,
        arrangerId: r.arranger_id as string,
        arrangerName: r.arranger_name as string,
        arrangedAt: r.arranged_at as string,
        arrangeRemark: r.arrange_remark as string,
        leaveTeacherName: r.leave_teacher_name as string || r.original_teacher_name as string,
        leaveReason: r.leave_reason as string,
        leaveStartDate: r.leave_start_date as string || '',
        leaveEndDate: r.leave_end_date as string || '',
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      }));
    }
  } catch (e) {
    console.log('Database not available, using mock data');
  }
  
  // 使用统一 Mock 数据作为后备
  const mockRecords = getMockScheduleChanges({}).map(scheduleChangeToSubstituteRecord);
  const allRecords = dbRecords.length > 0 ? dbRecords : mockRecords;
  
  switch (action) {
    case 'pending':
      // 获取待安排的代课（年段长用）
      const grades = managedGrades ? managedGrades.split(',').map(Number) : [];
      const pendingRecords = allRecords.filter(r => {
        if (r.status !== 'pending') return false;
        if (grades.length === 0) return true;
        const cls = MASTER_CLASSES.find(c => c.id === r.classId);
        return cls ? grades.includes(cls.grade) : false;
      });
      
      return NextResponse.json({
        success: true,
        data: pendingRecords,
        message: `共有${pendingRecords.length}条待安排代课`,
      });
      
    case 'history':
      // 获取代课历史记录
      let historyRecords = [...allRecords];
      
      if (status) {
        historyRecords = historyRecords.filter(r => r.status === status);
      }
      
      if (grade) {
        const gradeNum = parseInt(grade);
        const gradeClassIds = MASTER_CLASSES.filter(c => c.grade === gradeNum).map(c => c.id);
        historyRecords = historyRecords.filter(r => gradeClassIds.includes(r.classId));
      }
      
      return NextResponse.json({
        success: true,
        data: historyRecords.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
      
    case 'available-teachers':
      // 获取可代课教师列表（使用统一数据源）
      const subject = searchParams.get('subject');
      
      // 从统一数据源获取教师
      const availableTeachers = MASTER_TEACHERS.filter(
        t => subject ? t.subjects.includes(subject) : true
      ).map(t => ({
        id: t.id,
        name: t.name,
        subjects: t.subjects,
      }));
      
      return NextResponse.json({
        success: true,
        data: availableTeachers,
      });
      
    default:
      // 返回所有代课记录
      return NextResponse.json({
        success: true,
        data: allRecords,
        statistics: {
          total: allRecords.length,
          pending: allRecords.filter(r => r.status === 'pending').length,
          arranged: allRecords.filter(r => r.status === 'arranged').length,
          completed: allRecords.filter(r => r.status === 'completed').length,
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
      
      // 尝试更新数据库
      try {
        const client = getSupabaseClient();
        const { error } = await client
          .from('substitute_records')
          .update({
            status: 'arranged',
            substitute_teacher_id: substituteTeacherId,
            substitute_teacher_name: substituteTeacherName,
            arranger_id: arrangerId,
            arranger_name: arrangerName,
            arranged_at: new Date().toISOString(),
            arrange_remark: remark,
          })
          .eq('id', substituteRecordId);
        
        if (!error) {
          return NextResponse.json({
            success: true,
            data: { recordId: substituteRecordId },
            message: `已安排${substituteTeacherName}老师代课`,
          });
        }
      } catch (e) {
        console.log('Database update failed, using in-memory storage');
      }
      
      // 内存模式
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
      const newRecords: SubstituteRecord[] = (affectedSlots || []).map((slot: ScheduleSlot, index: number) => {
        const cls = getMasterClassById(slot.classId);
        return {
          id: `sub-${Date.now()}-${index}`,
          leaveRequestId,
          scheduleSlotId: `slot-${slot.classId}-${slot.weekDay}-${slot.periodIndex}`,
          originalTeacherId: teacherId,
          originalTeacherName: teacherName,
          classId: slot.classId,
          className: slot.className || cls?.name || '',
          subject: slot.subject,
          courseName: slot.subject,
          weekDay: slot.weekDay,
          periodIndex: slot.periodIndex,
          periodName: `第${slot.periodIndex}节`,
          semester: '2024-2025-1',
          status: 'pending' as const,
          substituteType: 'temporary' as const,
          leaveTeacherName: teacherName,
          leaveReason: reason,
          leaveStartDate: startDate,
          leaveEndDate: endDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      
      // 尝试写入数据库
      try {
        const client = getSupabaseClient();
        const recordsToInsert = newRecords.map(r => ({
          id: r.id,
          leave_request_id: r.leaveRequestId,
          schedule_slot_id: r.scheduleSlotId,
          original_teacher_id: r.originalTeacherId,
          original_teacher_name: r.originalTeacherName,
          class_id: r.classId,
          class_name: r.className,
          subject: r.subject,
          course_name: r.courseName,
          week_day: r.weekDay,
          period_index: r.periodIndex,
          period_name: r.periodName,
          semester: r.semester,
          status: r.status,
          substitute_type: r.substituteType,
          substitute_teacher_id: r.substituteTeacherId,
          substitute_teacher_name: r.substituteTeacherName,
          leave_teacher_name: r.leaveTeacherName,
          leave_reason: r.leaveReason,
          leave_start_date: r.leaveStartDate,
          leave_end_date: r.leaveEndDate,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        }));
        
        const { error } = await client
          .from('substitute_records')
          .insert(recordsToInsert);
        
        if (!error) {
          return NextResponse.json({
            success: true,
            data: newRecords,
            message: `已创建${newRecords.length}条代课记录`,
          });
        }
      } catch (e) {
        console.log('Database insert failed, using in-memory storage');
      }
      
      // 内存模式
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
