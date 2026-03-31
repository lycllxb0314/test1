/**
 * 课表服务
 * 
 * 处理基础课表和实际课表业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

export interface BaseScheduleSlot {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  day_of_week: number;
  lesson: number;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  semester: string;
  created_at: string;
  updated_at?: string;
}

export interface ActualScheduleSlot {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  week_number: number;
  week_start_date: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScheduleQueryParams {
  classId?: string;
  teacherId?: string;
  grade?: number;
  weekNumber?: number;
  semester?: string;
}

export interface ActualScheduleQueryParams {
  classId?: string;
  teacherId?: string;
  weekNumber?: number;
}

// ==================== 基础课表服务 ====================

export class BaseScheduleService extends BaseService {
  /**
   * 获取周课表
   */
  async getWeeklySchedule(params: ScheduleQueryParams): Promise<ServiceResult<BaseScheduleSlot[]>> {
    try {
      const client = getSupabaseClient();
      let query = client.from('schedules').select('*');

      if (params.classId) query = query.eq('class_id', params.classId);
      if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
      if (params.grade) query = query.eq('grade', params.grade);
      if (params.weekNumber) query = query.eq('week_number', params.weekNumber);
      if (params.semester) query = query.eq('semester', params.semester);

      const { data, error } = await query.order('day_of_week').order('lesson');

      if (error) {
        return this.fail('获取周课表失败');
      }

      return this.ok((data || []) as BaseScheduleSlot[]);
    } catch (error) {
      console.error('[BaseScheduleService] getWeeklySchedule error:', error);
      return this.fail('获取周课表失败');
    }
  }

  /**
   * 创建课表条目
   */
  async create(data: Partial<BaseScheduleSlot>): Promise<ServiceResult<BaseScheduleSlot>> {
    try {
      const client = getSupabaseClient();
      const { data: result, error } = await client
        .from('schedules')
        .insert({
          id: data.id || `schedule-${Date.now()}`,
          class_id: data.class_id,
          class_name: data.class_name,
          grade: data.grade,
          day_of_week: data.day_of_week,
          lesson: data.lesson,
          subject: data.subject,
          teacher_id: data.teacher_id,
          teacher_name: data.teacher_name,
          semester: data.semester,
        })
        .select()
        .single();

      if (error || !result) {
        return this.fail('创建课表条目失败');
      }

      return this.ok(result as BaseScheduleSlot);
    } catch (error) {
      console.error('[BaseScheduleService] create error:', error);
      return this.fail('创建课表条目失败');
    }
  }
}

// ==================== 实际课表服务 ====================

export class ActualScheduleService extends BaseService {
  /**
   * 获取实际课表
   */
  async getActualSchedule(params: ActualScheduleQueryParams): Promise<ServiceResult<ActualScheduleSlot[]>> {
    try {
      if (!params.classId && !params.teacherId) {
        return this.fail('需要提供班级ID或教师ID');
      }

      const client = getSupabaseClient();
      let query = client.from('actual_schedules').select('*');

      if (params.classId) query = query.eq('class_id', params.classId);
      if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
      if (params.weekNumber) query = query.eq('week_number', params.weekNumber);

      const { data, error } = await query.order('week_day').order('period_index');

      if (error) {
        return this.fail('获取实际课表失败');
      }

      return this.ok((data || []) as ActualScheduleSlot[]);
    } catch (error) {
      console.error('[ActualScheduleService] getActualSchedule error:', error);
      return this.fail('获取实际课表失败');
    }
  }

  /**
   * 创建实际课表条目
   */
  async create(data: Partial<ActualScheduleSlot>): Promise<ServiceResult<ActualScheduleSlot>> {
    try {
      const client = getSupabaseClient();
      const { data: result, error } = await client
        .from('actual_schedules')
        .insert({
          id: data.id || `as-${Date.now()}`,
          class_id: data.class_id,
          class_name: data.class_name,
          grade: data.grade,
          week_day: data.week_day,
          period_index: data.period_index,
          subject: data.subject,
          teacher_id: data.teacher_id,
          teacher_name: data.teacher_name,
          week_number: data.week_number,
          week_start_date: data.week_start_date,
          notes: data.notes,
        })
        .select()
        .single();

      if (error || !result) {
        return this.fail('创建实际课表条目失败');
      }

      return this.ok(result as ActualScheduleSlot);
    } catch (error) {
      console.error('[ActualScheduleService] create error:', error);
      return this.fail('创建实际课表条目失败');
    }
  }
}

// ==================== 导出单例 ====================

export const baseScheduleService = new BaseScheduleService();
export const actualScheduleService = new ActualScheduleService();
