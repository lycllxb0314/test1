/**
 * 教师 Repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { User } from '@/types';

/**
 * 教师查询筛选
 */
export interface TeacherFilters {
  role?: string;
  department?: string;
  grade?: string;
  subject?: string;
}

/**
 * text[] 类型的数组字段
 */
const TEXT_ARRAY_FIELDS = [
  'subjects',
  'secondary_subjects',
  'teachable_subjects',
  'additional_roles',
];

/**
 * integer[] 类型的数组字段
 */
const INT_ARRAY_FIELDS = [
  'teachable_grades',
  'managed_grades',
];

/**
 * 所有数组类型字段
 */
const ALL_ARRAY_FIELDS = [...TEXT_ARRAY_FIELDS, ...INT_ARRAY_FIELDS];

/**
 * 教师 Repository
 */
export class TeacherRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }
  
  /**
   * 更新教师信息（覆盖基类方法，正确处理数组类型字段）
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    // 分离普通字段和数组字段
    const normalData: Record<string, unknown> = {};
    const arrayData: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (ALL_ARRAY_FIELDS.includes(key)) {
        arrayData[key] = value;
      } else {
        normalData[key] = value;
      }
    }
    
    // 先更新普通字段
    if (Object.keys(normalData).length > 0) {
      const { error } = await this.client
        .from(this.tableName)
        .update({
          ...normalData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) {
        console.error(`[${this.tableName}] update normal fields error:`, error.message);
        return null;
      }
    }
    
    // 使用 RPC 更新数组字段
    if (Object.keys(arrayData).length > 0) {
      const { error } = await this.client.rpc('update_teacher_array_fields', {
        p_user_id: id,
        p_subjects: arrayData.subjects as string[] | undefined,
        p_secondary_subjects: arrayData.secondary_subjects as string[] | undefined,
        p_teachable_subjects: arrayData.teachable_subjects as string[] | undefined,
        p_additional_roles: arrayData.additional_roles as string[] | undefined,
        p_teachable_grades: arrayData.teachable_grades as number[] | undefined,
        p_managed_grades: arrayData.managed_grades as number[] | undefined,
      });
      
      if (error) {
        console.error(`[${this.tableName}] update array fields error:`, error.message);
        // 数组字段更新失败不影响整体，继续返回
      }
    }
    
    // 返回更新后的数据
    return this.findById(id);
  }
  
  /**
   * 查询所有教师（排除家长）
   */
  async findAllTeachers(): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .neq('role', 'parent');
    
    if (error) {
      console.error('[TeacherRepository] findAllTeachers error:', error.message);
      return [];
    }
    
    return (data || []) as User[];
  }
  
  /**
   * 根据角色查询教师
   */
  async findByRole(role: string): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('role', role);
    
    if (error) {
      console.error('[TeacherRepository] findByRole error:', error.message);
      return [];
    }
    
    return (data || []) as User[];
  }
  
  /**
   * 查询班主任
   */
  async findHeadTeachers(): Promise<User[]> {
    return this.findByRole('head_teacher');
  }
  
  /**
   * 查询科任教师
   */
  async findSubjectTeachers(): Promise<User[]> {
    return this.findByRole('subject_teacher');
  }
  
  /**
   * 查询技能课教师
   */
  async findSkillTeachers(): Promise<User[]> {
    return this.findByRole('skill_teacher');
  }
  
  /**
   * 根据部门查询教师
   */
  async findByDepartment(department: string): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .ilike('department', `%${department}%`)
      .neq('role', 'parent');
    
    if (error) {
      console.error('[TeacherRepository] findByDepartment error:', error.message);
      return [];
    }
    
    return (data || []) as User[];
  }
  
  /**
   * 分页查询教师
   */
  async findPaginatedWithFilters(
    options: {
      filters?: TeacherFilters;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<User>> {
    const { filters, search, page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .neq('role', 'parent');
    
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.department) {
      query = query.ilike('department', `%${filters.department}%`);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }
    
    query = query.order('created_at', { ascending: false }).range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[TeacherRepository] findPaginatedWithFilters error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    return {
      data: (data || []) as User[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 获取教师所教班级
   */
  async findTeachingClasses(teacherId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('class_teachers')
      .select('*, classes(*)')
      .eq('teacher_id', teacherId);
    
    if (error) {
      console.error('[TeacherRepository] findTeachingClasses error:', error.message);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * 获取教师课程安排
   */
  async findSchedule(teacherId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('base_schedules')
      .select('*, classes(name), courses(name)')
      .eq('teacher_id', teacherId);
    
    if (error) {
      console.error('[TeacherRepository] findSchedule error:', error.message);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * 统计教师数（按角色）
   */
  async countByRole(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('role')
      .neq('role', 'parent');
    
    if (error) {
      console.error('[TeacherRepository] countByRole error:', error.message);
      return {};
    }
    
    const counts: Record<string, number> = {};
    (data || []).forEach((item: { role: string }) => {
      counts[item.role] = (counts[item.role] || 0) + 1;
    });
    
    return counts;
  }
}

// 导出单例
export const teacherRepository = new TeacherRepository();
