/**
 * 调课处理服务
 * 
 * 处理调课安排、代课教师推荐等业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { 
  courseAdjustmentRepository, 
  CourseAdjustmentRecord, 
  CourseAdjustmentQueryParams 
} from '@/repositories/course-adjustment.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 调课处理服务类
 */
export class CourseAdjustmentService extends BaseService {
  /**
   * 获取调课列表
   */
  async getList(params: CourseAdjustmentQueryParams): Promise<ServiceResult<CourseAdjustmentRecord[]>> {
    try {
      const data = await courseAdjustmentRepository.findList(params);
      return this.ok(data);
    } catch (error) {
      console.error('[CourseAdjustmentService] getList error:', error);
      return this.fail('获取调课列表失败');
    }
  }

  /**
   * 获取调课详情
   */
  async getById(id: string): Promise<ServiceResult<CourseAdjustmentRecord>> {
    try {
      const data = await courseAdjustmentRepository.findById(id);
      if (!data) {
        return this.fail('调课记录不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[CourseAdjustmentService] getById error:', error);
      return this.fail('获取调课详情失败');
    }
  }

  /**
   * 处理调课（安排代课教师）
   */
  async processAdjustment(params: {
    adjustmentId: string;
    action: 'substitute' | 'cancel';
    substituteEmployeeId?: string;
    substituteName?: string;
    remark?: string;
    userId: string;
    userName: string;
    userEmployeeId?: string;
  }): Promise<ServiceResult<CourseAdjustmentRecord>> {
    try {
      const client = getSupabaseClient();
      
      // 获取调课记录
      const adjustment = await courseAdjustmentRepository.findById(params.adjustmentId);
      if (!adjustment) {
        return this.fail('调课记录不存在');
      }

      // 构建更新数据
      const updateData: Partial<CourseAdjustmentRecord> = {
        status: 'completed',
        adjuster_id: params.userEmployeeId || params.userId,
        adjuster_name: params.userName,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        sync_status: {
          scheduleUpdated: true,
          workloadUpdated: false,
          notificationSent: false,
        },
      };

      if (params.action === 'substitute') {
        if (!params.substituteEmployeeId || !params.substituteName) {
          return this.fail('请选择代课教师');
        }
        updateData.adjust_type = 'substitute';
        updateData.substitute_employee_id = params.substituteEmployeeId;
        updateData.substitute_name = params.substituteName;
        updateData.adjust_result = {
          type: 'substitute',
          substituteEmployeeId: params.substituteEmployeeId,
          substituteName: params.substituteName,
        };
      } else if (params.action === 'cancel') {
        updateData.adjust_type = 'cancel';
        updateData.adjust_result = { type: 'cancel' };
      }

      if (params.remark) {
        updateData.reason = params.remark;
      }

      // 更新调课记录
      const record = await courseAdjustmentRepository.update(params.adjustmentId, updateData);
      if (!record) {
        return this.fail('更新调课记录失败');
      }

      // 检查是否所有调课都已完成
      if (adjustment.leave_request_id) {
        const pendingCount = await courseAdjustmentRepository.countPendingByLeave(adjustment.leave_request_id);
        
        if (pendingCount === 0) {
          // 更新请假申请状态
          await client
            .from('leave_requests')
            .update({
              status: 'completed',
              adjustment_status: 'completed',
              adjusted_by: params.userEmployeeId || params.userId,
              adjusted_at: new Date().toISOString(),
              current_step: 4,
              updated_at: new Date().toISOString(),
            })
            .eq('id', adjustment.leave_request_id);

          // 发送通知 - 需要先查询申请人的 UUID
          const { data: applicantUser } = await client
            .from('users')
            .select('id')
            .eq('employee_id', adjustment.applicant_id)
            .single();
          
          if (applicantUser) {
            await client.from('messages').insert({
              title: '【流程结束】请假调课已完成',
              content: '您的请假调课流程已全部完成，相关数据已同步到教务系统。',
              type: 'leave_approval',
              priority: 'normal',
              sender_id: 'system',
              sender_name: '系统通知',
              sender_role: 'system',
              recipient_id: applicantUser.id,
              metadata: { leaveRequestId: adjustment.leave_request_id },
            });
          }
        }
      }

      // 更新教师工作量
      if (params.action === 'substitute' && params.substituteEmployeeId) {
        await this.updateTeacherWorkload(params.substituteEmployeeId, params.substituteName || '');
      }

      // 更新课表（教师课表和班级课表）
      if (params.action === 'substitute' || params.action === 'cancel') {
        await this.updateScheduleSlot(adjustment, params.action, params.substituteEmployeeId, params.substituteName);
      }

      // 发送通知
      if (params.action === 'substitute' && params.substituteEmployeeId && params.substituteName) {
        await this.sendNotifications(adjustment, params.substituteEmployeeId, params.substituteName, params.userId, params.userName);
      }

      // 更新同步状态
      await courseAdjustmentRepository.update(params.adjustmentId, {
        sync_status: {
          scheduleUpdated: true,
          workloadUpdated: true,
          notificationSent: true,
        },
      });

      return this.ok(record);
    } catch (error) {
      console.error('[CourseAdjustmentService] processAdjustment error:', error);
      return this.fail('处理调课失败');
    }
  }

  /**
   * 获取推荐代课教师
   */
  async getRecommendedTeachers(adjustmentId: string): Promise<ServiceResult<{
    adjustment: Partial<CourseAdjustmentRecord>;
    recommended: Array<{
      id: string;
      employeeId: string;
      name: string;
      primarySubject: string;
      isSameSubject: boolean;
      isAvailable: boolean;
      score: number;
      reason: string;
    }>;
    available: Array<any>;
    unavailable: Array<any>;
    total: number;
  }>> {
    try {
      const client = getSupabaseClient();
      
      const adjustment = await courseAdjustmentRepository.findById(adjustmentId);
      if (!adjustment) {
        return this.fail('调课记录不存在');
      }

      const grade = adjustment.grade || 0;
      const subject = adjustment.subject || '';
      const weekDay = adjustment.week_day || 0;
      const periodIndex = adjustment.period_index || 0;

      // 获取该年级所有教师
      let query = client
        .from('teachers')
        .select(`
          id, name, employee_id, primary_subject, secondary_subjects,
          current_teaching_grades, total_weekly_hours, department, title
        `)
        .eq('status', 'active');

      if (grade > 0) {
        query = query.contains('current_teaching_grades', [grade]);
      }

      const { data: gradeTeachers } = await query;
      const availableTeachers = (gradeTeachers || []).filter((t: any) => t.employee_id !== adjustment.applicant_id);

      // 获取教师工作量
      const { data: workloadData } = await client
        .from('teacher_workload')
        .select('employee_id, total_lessons, substitute_lessons');

      const workloadMap: Record<string, { total: number; substitute: number }> = {};
      (workloadData || []).forEach((w: any) => {
        workloadMap[w.employee_id] = {
          total: w.total_lessons || 0,
          substitute: w.substitute_lessons || 0,
        };
      });

      // 获取该时间段已有课的教师
      let busyTeacherIds = new Set<string>();
      if (weekDay > 0) {
        const { data: busyTeachers } = await client
          .from('schedule_slots')
          .select('employee_id')
          .eq('week_day', weekDay)
          .eq('period_index', periodIndex);
        
        busyTeacherIds = new Set((busyTeachers || []).map((t: any) => t.employee_id));
      }

      // 构建推荐列表
      const recommendations = availableTeachers.map((teacher: any) => {
        const isSameSubject = teacher.primary_subject === subject || 
                             (teacher.secondary_subjects || []).includes(subject);
        const isBusy = busyTeacherIds.has(teacher.employee_id);
        const workload = workloadMap[teacher.employee_id] || { total: 0, substitute: 0 };

        let score = 0;
        if (!isBusy) score += 50;
        if (isSameSubject) score += 30;
        const maxHours = teacher.total_weekly_hours || 20;
        const availableRatio = Math.max(0, 1 - workload.total / maxHours);
        score += Math.round(availableRatio * 20);

        return {
          id: teacher.id,
          employeeId: teacher.employee_id,
          name: teacher.name,
          primarySubject: teacher.primary_subject,
          secondarySubjects: teacher.secondary_subjects || [],
          currentTeachingGrades: teacher.current_teaching_grades || [],
          department: teacher.department,
          title: teacher.title,
          totalWeeklyHours: teacher.total_weekly_hours,
          usedHours: workload.total,
          substituteCount: workload.substitute,
          isSameSubject,
          isAvailable: !isBusy,
          score,
          reason: isBusy ? '该时段有课' : (isSameSubject ? '同学科，推荐代课' : '有空闲时段'),
        };
      });

      recommendations.sort((a: any, b: any) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        return b.score - a.score;
      });

      const available = recommendations.filter((r: any) => r.isAvailable);
      const unavailable = recommendations.filter((r: any) => !r.isAvailable);

      return this.ok({
        adjustment: {
          id: adjustment.id,
          grade,
          subject,
          weekDay,
          periodIndex,
          class_name: adjustment.class_name,
          applicant_name: adjustment.applicant_name,
          effective_week_number: adjustment.effective_week_number,
        },
        recommended: available.slice(0, 5),
        available,
        unavailable,
        total: recommendations.length,
      });
    } catch (error) {
      console.error('[CourseAdjustmentService] getRecommendedTeachers error:', error);
      return this.fail('获取推荐教师失败');
    }
  }

  /**
   * 更新教师工作量
   */
  private async updateTeacherWorkload(employeeId: string, teacherName: string): Promise<void> {
    const client = getSupabaseClient();
    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    const weekStart = this.getWeekMonday(now);
    const weekEnd = this.getWeekSunday(now);

    const { data: currentSemester } = await client
      .from('semesters')
      .select('*')
      .lte('start_date', weekStart)
      .gte('end_date', weekStart)
      .single();

    const academicYear = currentSemester?.academic_year || '2024-2025';
    const semester = currentSemester?.semester || '1';

    const { data: existingWorkload } = await client
      .from('teacher_workload')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .eq('week_number', currentWeek)
      .single();

    if (existingWorkload) {
      await client
        .from('teacher_workload')
        .update({
          substitute_lessons: (existingWorkload.substitute_lessons || 0) + 1,
          total_lessons: (existingWorkload.total_lessons || 0) + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', existingWorkload.id);
    } else {
      const { data: subTeacher } = await client
        .from('teachers')
        .select('name, primary_subject')
        .eq('employee_id', employeeId)
        .single();

      await client.from('teacher_workload').insert({
        employee_id: employeeId,
        teacher_name: teacherName || subTeacher?.name || '',
        primary_subject: subTeacher?.primary_subject || '',
        academic_year: academicYear,
        semester: semester,
        week_number: currentWeek,
        week_start_date: weekStart,
        week_end_date: weekEnd,
        total_lessons: 1,
        actual_lessons: 0,
        substitute_lessons: 1,
        adjusted_lessons: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    }
  }

  /**
   * 更新课表（教师课表和班级课表）
   * 
   * 当安排代课时：
   * - 将原教师的课次标记为"调出"状态
   * - 创建或更新代课教师的课次记录
   * 
   * 当取消课程时：
   * - 将对应课次标记为"取消"状态
   */
  private async updateScheduleSlot(
    adjustment: CourseAdjustmentRecord,
    action: 'substitute' | 'cancel',
    substituteEmployeeId?: string,
    substituteName?: string
  ): Promise<void> {
    const client = getSupabaseClient();
    
    try {
      // 查找对应的课表记录
      const { data: slots, error: findError } = await client
        .from('schedule_slots')
        .select('*')
        .eq('employee_id', adjustment.applicant_id)
        .eq('week_day', adjustment.week_day || 0)
        .eq('period_index', adjustment.period_index || 0)
        .eq('class_id', adjustment.class_id || '')
        .eq('status', 'active');

      if (findError) {
        console.error('[updateScheduleSlot] Find slots error:', findError.message);
        return;
      }

      if (!slots || slots.length === 0) {
        console.log('[updateScheduleSlot] No matching slots found for adjustment');
        return;
      }

      const slot = slots[0];
      const now = new Date().toISOString();

      if (action === 'substitute' && substituteEmployeeId && substituteName) {
        // 1. 将原教师的课次标记为"调出"
        const { error: updateError } = await client
          .from('schedule_slots')
          .update({
            status: 'transferred',
            updated_at: now,
          })
          .eq('id', slot.id);

        if (updateError) {
          console.error('[updateScheduleSlot] Update original slot error:', updateError.message);
        }

        // 2. 为代课教师创建新的课次记录
        const { error: insertError } = await client
          .from('schedule_slots')
          .insert({
            class_id: slot.class_id,
            class_name: slot.class_name,
            grade: slot.grade,
            week_day: slot.week_day,
            period_index: slot.period_index,
            period_name: slot.period_name,
            subject: slot.subject,
            teacher_id: substituteEmployeeId,
            teacher_name: substituteName,
            employee_id: substituteEmployeeId,
            status: 'substitute',
            created_at: now,
            updated_at: now,
          });

        if (insertError) {
          console.error('[updateScheduleSlot] Insert substitute slot error:', insertError.message);
        }
      } else if (action === 'cancel') {
        // 将课次标记为"取消"
        const { error: cancelError } = await client
          .from('schedule_slots')
          .update({
            status: 'cancelled',
            updated_at: now,
          })
          .eq('id', slot.id);

        if (cancelError) {
          console.error('[updateScheduleSlot] Cancel slot error:', cancelError.message);
        }
      }
    } catch (error) {
      console.error('[updateScheduleSlot] Error:', error);
    }
  }

  /**
   * 发送通知
   */
  private async sendNotifications(
    adjustment: CourseAdjustmentRecord,
    substituteEmployeeId: string,
    substituteName: string,
    userId: string,
    userName: string
  ): Promise<void> {
    const client = getSupabaseClient();
    const weekDayLabels: Record<number, string> = {
      1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
    };

    // 查询代课教师的 UUID
    const { data: substituteUser } = await client
      .from('users')
      .select('id')
      .eq('employee_id', substituteEmployeeId)
      .single();

    // 查询请假教师的 UUID
    const { data: applicantUser } = await client
      .from('users')
      .select('id')
      .eq('employee_id', adjustment.applicant_id)
      .single();

    // 通知代课教师
    if (substituteUser) {
      const { error: insertError } = await client.from('messages').insert({
        title: '代课通知',
        content: `${adjustment.applicant_name}请假，您被安排于${adjustment.effective_week_number || ''}周${weekDayLabels[adjustment.week_day || 1] || ''}第${(adjustment.period_index || 0) + 1}节代课${adjustment.subject}，班级：${adjustment.class_name}。`,
        type: 'course_adjustment',
        priority: 'high',
        sender_id: userId,
        sender_name: userName,
        recipient_id: substituteUser.id,
        metadata: {
          adjustmentId: adjustment.id,
          classId: adjustment.class_id,
          weekDay: adjustment.week_day,
          periodIndex: adjustment.period_index,
        },
      });
      if (insertError) {
        console.error('[sendNotifications] Failed to insert message for substitute:', insertError.message);
      }
    }

    // 通知请假教师
    if (applicantUser) {
      const { error: insertError } = await client.from('messages').insert({
        title: '调课安排完成',
        content: `您${adjustment.effective_week_number || ''}周${weekDayLabels[adjustment.week_day || 1] || ''}第${(adjustment.period_index || 0) + 1}节的${adjustment.subject}课已安排${substituteName}代课。`,
        type: 'course_adjustment',
        priority: 'normal',
        sender_id: userId,
        sender_name: userName,
        recipient_id: applicantUser.id,
        metadata: {
          adjustmentId: adjustment.id,
          substituteEmployeeId,
          substituteName,
        },
      });
      if (insertError) {
        console.error('[sendNotifications] Failed to insert message for applicant:', insertError.message);
      }
    }
  }

  /**
   * 辅助函数：获取周数
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * 辅助函数：获取周一日期
   */
  private getWeekMonday(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  /**
   * 辅助函数：获取周日日期
   */
  private getWeekSunday(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}

// 导出单例
export const courseAdjustmentService = new CourseAdjustmentService();
