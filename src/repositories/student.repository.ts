/**
 * 学生 Repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { Student } from '@/types';

/**
 * 学生查询筛选
 */
export interface StudentFilters {
  classId?: string;
  grade?: string;
  status?: string;
}

/**
 * 学生 Repository
 */
export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students');
  }
  
  /**
   * 根据学号查找
   */
  async findByStudentNumber(studentNumber: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_number', studentNumber)
      .single();
    
    if (error) {
      return null;
    }
    
    return data as Student;
  }
  
  /**
   * 根据班级查询学生
   */
  async findByClass(classId: string): Promise<Student[]> {
    return this.findWhere({ class_id: classId });
  }
  
  /**
   * 根据年级查询学生
   */
  async findByGrade(grade: string): Promise<Student[]> {
    return this.findWhere({ grade });
  }
  
  /**
   * 查询学生（包含班级信息）
   */
  async findWithClass(
    filters: StudentFilters = {},
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<Student & { class_name?: string }>> {
    const { page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = this.client
      .from(this.tableName)
      .select('*, classes(name)', { count: 'exact' });
    
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters.grade) {
      query = query.eq('grade', filters.grade);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    query = query.order('student_number').range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[StudentRepository] findWithClass error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    const students = (data || []).map((s: any) => ({
      ...s,
      class_name: s.classes?.name,
    }));
    
    return {
      data: students,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 获取学生详细信息（包含家长信息）
   */
  async findDetailById(id: string): Promise<{
    student: Student | null;
    parents: any[];
  }> {
    const [studentResult, parentsResult] = await Promise.all([
      this.findById(id),
      this.client
        .from('parents')
        .select('*')
        .contains('children_ids', [id])
    ]);
    
    return {
      student: studentResult,
      parents: (parentsResult.data || []),
    };
  }
  
  /**
   * 统计班级学生数
   */
  async countByClass(classId: string): Promise<number> {
    return this.count({ class_id: classId } as any);
  }
  
  /**
   * 统计年级学生数
   */
  async countByGrade(grade: string): Promise<number> {
    return this.count({ grade } as any);
  }
  
  /**
   * 升级学生年级
   */
  async promoteGrade(grade: string, nextGrade: string): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ grade: nextGrade, updated_at: new Date().toISOString() })
      .eq('grade', grade)
      .select();
    
    if (error) {
      console.error('[StudentRepository] promoteGrade error:', error.message);
      return 0;
    }
    
    return data?.length || 0;
  }
}

// 导出单例
export const studentRepository = new StudentRepository();
