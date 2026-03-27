/**
 * 值日教师 Repository
 * 
 * 负责值日教师安排的数据访问
 * 
 * @module repositories/duty-teacher.repository
 */

import { BaseRepository } from './base.repository';
import type {
  DutyTeacher,
  DutyTeacherRow,
  DutyTeacherQueryParams,
  CreateDutyTeacherParams,
  UpdateDutyTeacherParams,
} from '@/types/class-routine';

/**
 * 值日教师 Repository
 */
export class DutyTeacherRepository extends BaseRepository<DutyTeacher> {
  constructor() {
    super('duty_teachers');
  }

  // ==================== 查询方法 ====================

  /**
   * 查询值日教师
   */
  async queryDutyTeachers(params: DutyTeacherQueryParams): Promise<DutyTeacher[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    if (params.teacherId) {
      query = query.eq('teacher_id', params.teacherId);
    }
    if (params.grade !== undefined) {
      query = query.eq('grade', params.grade);
    }
    if (params.weekDay !== undefined) {
      query = query.eq('week_day', params.weekDay);
    }
    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive);
    }

    query = query.order('grade', { ascending: true });
    query = query.order('week_day', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[DutyTeacherRepository] queryDutyTeachers error:', error.message);
      return [];
    }

    return (data || []).map(this.toBusinessModel);
  }

  /**
   * 获取所有激活的值日教师
   */
  async getActiveDutyTeachers(): Promise<DutyTeacher[]> {
    return this.queryDutyTeachers({ isActive: true });
  }

  /**
   * 获取某年级的值日教师
   */
  async getGradeDutyTeachers(grade: number): Promise<DutyTeacher[]> {
    return this.queryDutyTeachers({ grade, isActive: true });
  }

  /**
   * 获取某天的值日教师（weekDay: 1-5 或 0 表示每天）
   */
  async getDutyTeachersByWeekDay(weekDay: number): Promise<DutyTeacher[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .or(`week_day.eq.0,week_day.eq.${weekDay}`);

    if (error) {
      console.error('[DutyTeacherRepository] getDutyTeachersByWeekDay error:', error.message);
      return [];
    }

    return (data || []).map(this.toBusinessModel);
  }

  /**
   * 检查教师是否为值日教师
   */
  async isDutyTeacher(teacherId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    if (error) {
      console.error('[DutyTeacherRepository] isDutyTeacher error:', error.message);
      return false;
    }

    return (count ?? 0) > 0;
  }

  /**
   * 根据ID获取值日教师安排
   */
  async findById(id: string): Promise<DutyTeacher | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[DutyTeacherRepository] findById error:', error.message);
      return null;
    }

    return data ? this.toBusinessModel(data) : null;
  }

  // ==================== 创建/更新方法 ====================

  /**
   * 创建值日教师安排
   */
  async createDutyTeacher(params: CreateDutyTeacherParams): Promise<DutyTeacher | null> {
    const rowData: DutyTeacherRow = {
      id: crypto.randomUUID(),
      teacher_id: params.teacherId,
      teacher_name: params.teacherName,
      grade: params.grade,
      week_day: params.weekDay,
      is_active: params.isActive ?? true,
      start_date: null,
      end_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(rowData)
      .select()
      .single();

    if (error) {
      console.error('[DutyTeacherRepository] createDutyTeacher error:', error.message);
      return null;
    }

    return this.toBusinessModel(data);
  }

  /**
   * 更新值日教师安排
   */
  async updateDutyTeacher(params: UpdateDutyTeacherParams): Promise<DutyTeacher | null> {
    const updateData: Partial<DutyTeacherRow> = {
      updated_at: new Date().toISOString(),
    };

    if (params.teacherId !== undefined) updateData.teacher_id = params.teacherId;
    if (params.teacherName !== undefined) updateData.teacher_name = params.teacherName;
    if (params.grade !== undefined) updateData.grade = params.grade;
    if (params.weekDay !== undefined) updateData.week_day = params.weekDay;
    if (params.isActive !== undefined) updateData.is_active = params.isActive;

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('[DutyTeacherRepository] updateDutyTeacher error:', error.message);
      return null;
    }

    return this.toBusinessModel(data);
  }

  /**
   * 删除值日教师安排
   */
  async deleteDutyTeacher(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DutyTeacherRepository] deleteDutyTeacher error:', error.message);
      return false;
    }

    return true;
  }

  // ==================== 私有方法 ====================

  /**
   * 数据库行转业务模型
   */
  private toBusinessModel(row: DutyTeacherRow): DutyTeacher {
    return {
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      grade: row.grade,
      weekDay: row.week_day,
      isActive: row.is_active,
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// 导出单例实例
export const dutyTeacherRepository = new DutyTeacherRepository();
