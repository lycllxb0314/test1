/**
 * 成绩 Repository
 * 
 * 处理学生成绩相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { StudentGrade, Exam } from '@/types';

/**
 * 成绩查询筛选
 */
export interface GradeFilters {
  studentId?: string;
  classId?: string;
  examId?: string;
  courseId?: string;
  semester?: string;
}

/**
 * 成绩统计
 */
export interface GradeStatistics {
  average: number;
  max: number;
  min: number;
  passCount: number;
  excellentCount: number;
  total: number;
}

/**
 * 成绩 Repository
 */
export class GradeRepository extends BaseRepository<StudentGrade> {
  constructor() {
    super('student_grades');
  }

  /**
   * 查询学生成绩
   */
  async findByStudent(
    studentId: string,
    options: { semester?: string; examId?: string } = {}
  ): Promise<StudentGrade[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        courses(id, name),
        exams(id, name, type)
      `)
      .eq('student_id', studentId);

    if (options.semester) {
      query = query.eq('semester', options.semester);
    }
    if (options.examId) {
      query = query.eq('exam_id', options.examId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GradeRepository] findByStudent error:', error.message);
      return [];
    }

    return (data || []) as StudentGrade[];
  }

  /**
   * 查询考试成绩
   */
  async findByExam(examId: string): Promise<StudentGrade[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        students(id, name, student_number, class_id),
        courses(id, name)
      `)
      .eq('exam_id', examId);

    if (error) {
      console.error('[GradeRepository] findByExam error:', error.message);
      return [];
    }

    return (data || []) as StudentGrade[];
  }

  /**
   * 查询班级成绩
   */
  async findByClass(
    classId: string,
    options: { examId?: string; courseId?: string } = {}
  ): Promise<StudentGrade[]> {
    // 先获取班级学生ID
    const { data: students } = await this.client
      .from('students')
      .select('id')
      .eq('class_id', classId);

    if (!students?.length) return [];

    const studentIds = students.map((s: { id: string }) => s.id);

    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        students(id, name, student_number)
      `)
      .in('student_id', studentIds);

    if (options.examId) {
      query = query.eq('exam_id', options.examId);
    }
    if (options.courseId) {
      query = query.eq('course_id', options.courseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GradeRepository] findByClass error:', error.message);
      return [];
    }

    return (data || []) as StudentGrade[];
  }

  /**
   * 分页查询成绩
   */
  async findPaginatedWithFilters(
    options: {
      filters?: GradeFilters;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<StudentGrade>> {
    const { filters, page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        students(id, name, student_number),
        courses(id, name),
        exams(id, name)
      `, { count: 'exact' });

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.examId) {
      query = query.eq('exam_id', filters.examId);
    }
    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    if (filters?.semester) {
      query = query.eq('semester', filters.semester);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GradeRepository] findPaginatedWithFilters error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as StudentGrade[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 计算成绩统计
   */
  async calculateStatistics(
    options: {
      examId?: string;
      classId?: string;
      courseId?: string;
    } = {}
  ): Promise<GradeStatistics> {
    let baseQuery = this.client.from(this.tableName).select('score');

    if (options.examId) {
      baseQuery = baseQuery.eq('exam_id', options.examId);
    }
    if (options.courseId) {
      baseQuery = baseQuery.eq('course_id', options.courseId);
    }

    // 如果指定班级，需要先获取学生ID
    if (options.classId) {
      const { data: students } = await this.client
        .from('students')
        .select('id')
        .eq('class_id', options.classId);

      if (students?.length) {
        const studentIds = students.map((s: { id: string }) => s.id);
        baseQuery = baseQuery.in('student_id', studentIds);
      }
    }

    const { data, error } = await baseQuery;

    if (error || !data?.length) {
      return { average: 0, max: 0, min: 0, passCount: 0, excellentCount: 0, total: 0 };
    }

    const scores = data.map((d: { score: number }) => d.score).filter(s => s !== null);

    return {
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      max: Math.max(...scores),
      min: Math.min(...scores),
      passCount: scores.filter(s => s >= 60).length,
      excellentCount: scores.filter(s => s >= 90).length,
      total: scores.length,
    };
  }

  /**
   * 批量录入成绩
   */
  async upsertBatch(grades: Partial<StudentGrade>[]): Promise<StudentGrade[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert(
        grades.map(g => ({
          ...g,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'student_id,exam_id,course_id' }
      )
      .select();

    if (error) {
      console.error('[GradeRepository] upsertBatch error:', error.message);
      return [];
    }

    return (data || []) as StudentGrade[];
  }

  /**
   * 获取学生成绩趋势
   */
  async getStudentTrend(
    studentId: string,
    courseId?: string,
    limit: number = 5
  ): Promise<{ examName: string; score: number; date: string }[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        score,
        exams(name, date)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GradeRepository] getStudentTrend error:', error.message);
      return [];
    }

    return (data || []).map((d: Record<string, unknown>) => ({
      examName: (d.exams as { name: string })?.name || '',
      score: d.score as number,
      date: (d.exams as { date: string })?.date || '',
    }));
  }
}

/**
 * 考试 Repository
 */
export class ExamRepository extends BaseRepository<Exam> {
  constructor() {
    super('exams');
  }

  /**
   * 查询学期考试
   */
  async findBySemester(semester: string): Promise<Exam[]> {
    return this.findWhere({ semester } as Record<string, unknown>);
  }

  /**
   * 查询进行中的考试
   */
  async findOngoing(): Promise<Exam[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .lte('start_date', now)
      .gte('end_date', now);

    if (error) {
      console.error('[ExamRepository] findOngoing error:', error.message);
      return [];
    }

    return (data || []) as Exam[];
  }

  /**
   * 查询即将开始的考试
   */
  async findUpcoming(limit: number = 5): Promise<Exam[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .gt('start_date', now)
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[ExamRepository] findUpcoming error:', error.message);
      return [];
    }

    return (data || []) as Exam[];
  }
}

// 导出单例
export const gradeRepository = new GradeRepository();
export const examRepository = new ExamRepository();
