/**
 * 考勤 Repository
 * 
 * 处理考勤相关的数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import type { StudentAttendance, AttendanceStatus } from '@/types';

/**
 * 考勤查询筛选
 */
export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

/**
 * 考勤统计
 */
export interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  leaveEarly: number;
  excused: number;
}

/**
 * 考勤 Repository
 */
export class AttendanceRepository extends BaseRepository<StudentAttendance> {
  constructor() {
    super('student_attendance');
  }

  /**
   * 按日期查询班级考勤
   */
  async findByClassAndDate(classId: string, date: string): Promise<StudentAttendance[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        students(id, name, student_number)
      `)
      .eq('class_id', classId)
      .eq('date', date);

    if (error) {
      console.error('[AttendanceRepository] findByClassAndDate error:', error.message);
      return [];
    }

    return (data || []) as StudentAttendance[];
  }

  /**
   * 按学生查询考勤记录
   */
  async findByStudent(
    studentId: string,
    options: { startDate?: string; endDate?: string } = {}
  ): Promise<StudentAttendance[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (options.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('date', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AttendanceRepository] findByStudent error:', error.message);
      return [];
    }

    return (data || []) as StudentAttendance[];
  }

  /**
   * 分页查询考勤记录
   */
  async findPaginatedWithFilters(
    options: {
      filters?: AttendanceFilters;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<PaginatedResult<StudentAttendance>> {
    const { filters, page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        students(id, name, student_number),
        classes(id, name)
      `, { count: 'exact' });

    if (filters?.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId);
    }
    if (filters?.date) {
      query = query.eq('date', filters.date);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('date', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[AttendanceRepository] findPaginatedWithFilters error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as StudentAttendance[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 批量创建或更新考勤记录
   */
  async upsertBatch(records: Partial<StudentAttendance>[]): Promise<StudentAttendance[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert(
        records.map(r => ({
          ...r,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'student_id,date' }
      )
      .select();

    if (error) {
      console.error('[AttendanceRepository] upsertBatch error:', error.message);
      return [];
    }

    return (data || []) as StudentAttendance[];
  }

  /**
   * 获取班级考勤统计
   */
  async getClassStatistics(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceStatistics> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('status')
      .eq('class_id', classId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('[AttendanceRepository] getClassStatistics error:', error.message);
      return { total: 0, present: 0, absent: 0, late: 0, leaveEarly: 0, excused: 0 };
    }

    const stats: AttendanceStatistics = {
      total: data?.length || 0,
      present: 0,
      absent: 0,
      late: 0,
      leaveEarly: 0,
      excused: 0,
    };

    (data || []).forEach((item: { status: string }) => {
      switch (item.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'leave_early':
          stats.leaveEarly++;
          break;
        case 'excused':
          stats.excused++;
          break;
      }
    });

    return stats;
  }

  /**
   * 获取学生考勤统计
   */
  async getStudentStatistics(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceStatistics> {
    let query = this.client
      .from(this.tableName)
      .select('status')
      .eq('student_id', studentId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AttendanceRepository] getStudentStatistics error:', error.message);
      return { total: 0, present: 0, absent: 0, late: 0, leaveEarly: 0, excused: 0 };
    }

    const stats: AttendanceStatistics = {
      total: data?.length || 0,
      present: 0,
      absent: 0,
      late: 0,
      leaveEarly: 0,
      excused: 0,
    };

    (data || []).forEach((item: { status: string }) => {
      switch (item.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'leave_early':
          stats.leaveEarly++;
          break;
        case 'excused':
          stats.excused++;
          break;
      }
    });

    return stats;
  }

  /**
   * 获取今日未考勤学生
   */
  async findUnrecordedToday(classId: string, date: string): Promise<string[]> {
    // 获取班级所有学生
    const { data: students } = await this.client
      .from('students')
      .select('id')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (!students?.length) return [];

    // 获取已考勤学生
    const { data: recorded } = await this.client
      .from(this.tableName)
      .select('student_id')
      .eq('class_id', classId)
      .eq('date', date);

    const recordedIds = new Set((recorded || []).map((r: { student_id: string }) => r.student_id));

    return students
      .filter((s: { id: string }) => !recordedIds.has(s.id))
      .map((s: { id: string }) => s.id);
  }
}

// 导出单例
export const attendanceRepository = new AttendanceRepository();
