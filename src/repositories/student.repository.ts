/**
 * 学生 Repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { Student, Parent, StudentFullProfile } from '@/types';
import type { StudentRow, ParentRow } from '@/types/db-helpers';

/**
 * 学生查询筛选
 */
export type StudentFilters = {
  classId?: string;
  grade?: string;
  status?: string;
};

/**
 * 将数据库行转换为前端格式
 */
function mapStudentRow(s: Record<string, unknown>): Student {
  return {
    id: s.id as string,
    studentNo: s.student_no as string,
    name: s.name as string,
    gender: (s.gender as 'male' | 'female') || 'male',
    birthDate: s.birth_date as string,
    idCard: s.id_card as string,
    ethnicity: s.ethnicity as string,
    nativePlace: s.native_place as string,
    politicalStatus: s.political_status as string,
    studentType: s.student_type as string,
    classId: s.class_id as string,
    className: s.class_name as string,
    grade: s.grade as number,
    gradeName: s.grade ? `${['一', '二', '三', '四', '五', '六'][s.grade as number - 1] || s.grade}年级` : undefined,
    headTeacherId: s.head_teacher_id as string,
    headTeacherName: s.head_teacher_name as string,
    enrollmentDate: s.enrollment_date as string,
    phone: s.phone as string,
    address: s.address as string,
    homeAddress: s.home_address as string,
    emergencyContact: s.emergency_contact as string,
    emergencyPhone: s.emergency_phone as string,
    familyType: s.family_type as string,
    parents: (Array.isArray(s.parents) ? s.parents : []) as Parent[],
    status: (s.status as Student['status']) || '在校',
    avatar: s.avatar as string,
    createdAt: s.created_at as string,
    updatedAt: s.updated_at as string,
  } as Student;
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
      .eq('student_no', studentNumber)
      .single();
    
    if (error) {
      return null;
    }
    
    return mapStudentRow(data as Record<string, unknown>);
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
  ): Promise<PaginatedResult<Student>> {
    const { page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = this.client
      .from(this.tableName)
      .select('*, classes(name, head_teacher_id, head_teacher_name)', { count: 'exact' });
    
    if (filters.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters.grade) {
      query = query.eq('grade', filters.grade);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    query = query.order('student_no').range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[StudentRepository] findWithClass error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    
    const students = (data || []).map((s: Record<string, unknown> & { classes?: { name?: string; head_teacher_id?: string; head_teacher_name?: string } }) => {
      const mapped = mapStudentRow(s);
      // 补充班级关联信息
      if (s.classes) {
        mapped.className = s.classes.name || mapped.className;
        mapped.headTeacherId = s.classes.head_teacher_id;
        mapped.headTeacherName = s.classes.head_teacher_name;
      }
      return mapped;
    });
    
    return {
      data: students,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
  
  /**
   * 根据ID查找学生详情
   */
  async findById(id: string): Promise<Student | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('[StudentRepository] findById error:', error.message);
      return null;
    }
    
    return mapStudentRow(data as Record<string, unknown>);
  }
  
  /**
   * 获取学生详细信息（包含家长信息）
   */
  async findDetailById(id: string): Promise<{
    student: Student | null;
    parents: Parent[];
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
      parents: (parentsResult.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        relationship: p.relationship as string,
        phone: p.phone as string,
        isPrimary: p.is_primary as boolean,
        wechat: p.wechat as string,
        email: p.email as string,
        occupation: p.occupation as string,
      })) as Parent[],
    };
  }
  
  /**
   * 统计班级学生数
   */
  async countByClass(classId: string): Promise<number> {
    return this.count({ class_id: classId } as Record<string, unknown>);
  }
  
  /**
   * 统计年级学生数
   */
  async countByGrade(grade: string): Promise<number> {
    return this.count({ grade } as Record<string, unknown>);
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
