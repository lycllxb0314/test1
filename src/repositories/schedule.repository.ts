/**
 * 课表 Repository
 * 
 * 处理课程表相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { BaseScheduleSlot, ActualScheduleSlot } from '@/types';

/**
 * 课表查询筛选
 */
export interface ScheduleFilters {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: number;
  lesson?: number;
  semester?: string;
}

/**
 * 课表 Repository
 */
export class ScheduleRepository extends BaseRepository<BaseScheduleSlot> {
  constructor() {
    super('base_schedules');
  }

  /**
   * 查询班级课表
   */
  async findByClass(classId: string, semester?: string): Promise<BaseScheduleSlot[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        courses(id, name, type),
        teachers:users!teacher_id(id, name)
      `)
      .eq('class_id', classId);

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduleRepository] findByClass error:', error.message);
      return [];
    }

    return (data || []) as BaseScheduleSlot[];
  }

  /**
   * 查询教师课表
   */
  async findByTeacher(teacherId: string, semester?: string): Promise<BaseScheduleSlot[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        courses(id, name, type),
        classes(id, name, grade)
      `)
      .eq('teacher_id', teacherId);

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduleRepository] findByTeacher error:', error.message);
      return [];
    }

    return (data || []) as BaseScheduleSlot[];
  }

  /**
   * 查询特定时间段的课表
   */
  async findBySlot(
    dayOfWeek: number,
    lesson: number,
    options: { classId?: string; teacherId?: string } = {}
  ): Promise<BaseScheduleSlot[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('lesson', lesson);

    if (options.classId) {
      query = query.eq('class_id', options.classId);
    }
    if (options.teacherId) {
      query = query.eq('teacher_id', options.teacherId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduleRepository] findBySlot error:', error.message);
      return [];
    }

    return (data || []) as BaseScheduleSlot[];
  }

  /**
   * 检查时间槽冲突
   */
  async checkConflict(
    dayOfWeek: number,
    lesson: number,
    options: {
      classId?: string;
      teacherId?: string;
      excludeId?: string;
    }
  ): Promise<boolean> {
    let query = this.client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('day_of_week', dayOfWeek)
      .eq('lesson', lesson);

    if (options.classId) {
      query = query.eq('class_id', options.classId);
    }
    if (options.teacherId) {
      query = query.eq('teacher_id', options.teacherId);
    }
    if (options.excludeId) {
      query = query.neq('id', options.excludeId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[ScheduleRepository] checkConflict error:', error.message);
      return false;
    }

    return (count || 0) > 0;
  }

  /**
   * 批量更新课表
   */
  async upsertBatch(slots: Partial<BaseScheduleSlot>[]): Promise<BaseScheduleSlot[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert(
        slots.map(s => ({
          ...s,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'class_id,day_of_week,lesson,semester' }
      )
      .select();

    if (error) {
      console.error('[ScheduleRepository] upsertBatch error:', error.message);
      return [];
    }

    return (data || []) as BaseScheduleSlot[];
  }

  /**
   * 获取教师周课时统计
   */
  async getTeacherWeeklyHours(teacherId: string, semester?: string): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId);

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[ScheduleRepository] getTeacherWeeklyHours error:', error.message);
      return 0;
    }

    return count || 0;
  }

  /**
   * 获取班级周课程分布
   */
  async getClassWeeklyDistribution(classId: string, semester?: string): Promise<Record<number, number>> {
    let query = this.client
      .from(this.tableName)
      .select('day_of_week')
      .eq('class_id', classId);

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduleRepository] getClassWeeklyDistribution error:', error.message);
      return {};
    }

    const distribution: Record<number, number> = {};
    (data || []).forEach((item: { day_of_week: number }) => {
      distribution[item.day_of_week] = (distribution[item.day_of_week] || 0) + 1;
    });

    return distribution;
  }
}

/**
 * 实际课表 Repository（调课后的实际课表）
 */
export class ActualScheduleRepository extends BaseRepository<ActualScheduleSlot> {
  constructor() {
    super('actual_schedules');
  }

  /**
   * 查询班级某日期的实际课表
   */
  async findByClassAndDate(classId: string, date: string): Promise<ActualScheduleSlot[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        courses(id, name),
        teachers:users!teacher_id(id, name)
      `)
      .eq('class_id', classId)
      .eq('date', date);

    if (error) {
      console.error('[ActualScheduleRepository] findByClassAndDate error:', error.message);
      return [];
    }

    return (data || []) as ActualScheduleSlot[];
  }

  /**
   * 查询教师某日期的实际课表
   */
  async findByTeacherAndDate(teacherId: string, date: string): Promise<ActualScheduleSlot[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        courses(id, name),
        classes(id, name)
      `)
      .eq('teacher_id', teacherId)
      .eq('date', date);

    if (error) {
      console.error('[ActualScheduleRepository] findByTeacherAndDate error:', error.message);
      return [];
    }

    return (data || []) as ActualScheduleSlot[];
  }

  /**
   * 获取日期范围内教师有空的时间段
   */
  async findAvailableSlots(
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<{ date: string; lesson: number }[]> {
    // 获取教师已有的课表
    const { data: scheduled } = await this.client
      .from(this.tableName)
      .select('date, lesson')
      .eq('teacher_id', teacherId)
      .gte('date', startDate)
      .lte('date', endDate);

    // 转换为已占用集合
    const occupied = new Set(
      (scheduled || []).map((s: { date: string; lesson: number }) => `${s.date}-${s.lesson}`)
    );

    // 生成所有可能的时间段，排除已占用的
    const available: { date: string; lesson: number }[] = [];
    // 这里简化处理，实际应该根据学校的作息时间表生成

    return available;
  }
}

// 导出单例
export const scheduleRepository = new ScheduleRepository();
export const actualScheduleRepository = new ActualScheduleRepository();
