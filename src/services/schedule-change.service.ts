/**
 * 调课服务
 * 
 * 处理调课申请相关的业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import { 
  scheduleChangeRepository, 
  ScheduleChangeRecord, 
  ScheduleChangeQueryParams 
} from '@/repositories/schedule-change.repository';
import { scheduleRepository } from '@/repositories/schedule.repository';

/**
 * 调课服务类
 */
export class ScheduleChangeService extends BaseService {
  /**
   * 获取调课列表
   */
  async getList(params: ScheduleChangeQueryParams): Promise<ServiceResult<ScheduleChangeRecord[]>> {
    try {
      const data = await scheduleChangeRepository.findList(params);
      return this.ok(data);
    } catch (error) {
      console.error('[ScheduleChangeService] getList error:', error);
      return this.fail('获取调课列表失败');
    }
  }

  /**
   * 获取调课详情
   */
  async getById(id: string): Promise<ServiceResult<ScheduleChangeRecord>> {
    try {
      const data = await scheduleChangeRepository.findById(id);
      if (!data) {
        return this.fail('调课记录不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[ScheduleChangeService] getById error:', error);
      return this.fail('获取调课详情失败');
    }
  }

  /**
   * 创建调课申请
   */
  async create(data: Partial<ScheduleChangeRecord>): Promise<ServiceResult<ScheduleChangeRecord>> {
    try {
      // 验证必填字段
      if (!data.applicant_id || !data.change_type) {
        return this.fail('缺少必要参数');
      }

      const record = await scheduleChangeRepository.create({
        id: data.id || `sc-${Date.now()}`,
        applicant_id: data.applicant_id,
        applicant_name: data.applicant_name,
        original_schedule_id: data.original_schedule_id,
        new_schedule_id: data.new_schedule_id,
        change_type: data.change_type,
        reason: data.reason,
        status: 'pending',
        // 原始课表信息
        original_class_id: data.original_class_id,
        original_class_name: data.original_class_name,
        original_subject: data.original_subject,
        original_teacher_id: data.original_teacher_id,
        original_teacher_name: data.original_teacher_name,
        original_day_of_week: data.original_day_of_week,
        original_period: data.original_period,
        // 新课表信息
        new_class_id: data.new_class_id,
        new_class_name: data.new_class_name,
        new_subject: data.new_subject,
        new_teacher_id: data.new_teacher_id,
        new_teacher_name: data.new_teacher_name,
        new_day_of_week: data.new_day_of_week,
        new_period: data.new_period,
      });

      if (!record) {
        return this.fail('创建调课申请失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[ScheduleChangeService] create error:', error);
      return this.fail('创建调课申请失败');
    }
  }

  /**
   * 审批调课申请
   */
  async approve(id: string, approverId: string, approverName: string): Promise<ServiceResult<ScheduleChangeRecord>> {
    try {
      const record = await scheduleChangeRepository.update(id, {
        status: 'approved',
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
      });

      if (!record) {
        return this.fail('审批失败');
      }

      // TODO: 实际调课逻辑 - 更新课表

      return this.ok(record);
    } catch (error) {
      console.error('[ScheduleChangeService] approve error:', error);
      return this.fail('审批失败');
    }
  }

  /**
   * 驳回调课申请
   */
  async reject(id: string, approverId: string, approverName: string, reason?: string): Promise<ServiceResult<ScheduleChangeRecord>> {
    try {
      const record = await scheduleChangeRepository.update(id, {
        status: 'rejected',
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
        remark: reason,
      });

      if (!record) {
        return this.fail('驳回失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[ScheduleChangeService] reject error:', error);
      return this.fail('驳回失败');
    }
  }

  /**
   * 取消调课申请
   */
  async cancel(id: string, applicantId: string): Promise<ServiceResult<ScheduleChangeRecord>> {
    try {
      const existing = await scheduleChangeRepository.findById(id);
      
      if (!existing) {
        return this.fail('调课记录不存在');
      }
      
      if (existing.applicant_id !== applicantId) {
        return this.fail('无权取消此申请');
      }
      
      if (existing.status !== 'pending') {
        return this.fail('只能取消待审批的申请');
      }

      const record = await scheduleChangeRepository.update(id, {
        status: 'cancelled',
      });

      if (!record) {
        return this.fail('取消失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[ScheduleChangeService] cancel error:', error);
      return this.fail('取消失败');
    }
  }

  /**
   * 获取教师的调课记录
   */
  async getByTeacher(teacherId: string, status?: string): Promise<ServiceResult<ScheduleChangeRecord[]>> {
    try {
      const data = await scheduleChangeRepository.findByTeacher(teacherId, status);
      return this.ok(data);
    } catch (error) {
      console.error('[ScheduleChangeService] getByTeacher error:', error);
      return this.fail('获取调课记录失败');
    }
  }
}

// 导出单例
export const scheduleChangeService = new ScheduleChangeService();
