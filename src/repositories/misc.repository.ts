/**
 * 其他模块 Repository
 * 
 * 处理课后服务、工作量、学校统计等数据访问
 */

import { BaseRepository, PaginatedResult } from './base.repository';

// ==================== 课后服务 ====================

export interface AfterSchoolServiceRecord {
  id: string;
  name: string;
  type: string;
  teacher_id: string;
  teacher_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  enrolled: number;
  status: string;
  semester: string;
  created_at: string;
  updated_at?: string;
}

export class AfterSchoolServiceRepository extends BaseRepository<AfterSchoolServiceRecord> {
  constructor() {
    super('after_school_services');
  }

  async findBySemester(semester: string): Promise<AfterSchoolServiceRecord[]> {
    return this.findWhere({ semester });
  }

  async findByTeacher(teacherId: string, semester?: string): Promise<AfterSchoolServiceRecord[]> {
    let query = this.client
      .from('after_school_services')
      .select('*')
      .eq('teacher_id', teacherId);

    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;
    if (error) return [];
    return (data || []) as AfterSchoolServiceRecord[];
  }
}

// ==================== 教师考勤 ====================

export interface TeacherAttendanceRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export class TeacherAttendanceRepository extends BaseRepository<TeacherAttendanceRecord> {
  constructor() {
    super('teacher_attendance');
  }

  async findByDate(date: string): Promise<TeacherAttendanceRecord[]> {
    return this.findWhere({ date });
  }

  async findByTeacher(teacherId: string, startDate?: string, endDate?: string): Promise<TeacherAttendanceRecord[]> {
    let query = this.client
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) return [];
    return (data || []) as TeacherAttendanceRecord[];
  }

  async checkIn(teacherId: string, teacherName: string, location?: string): Promise<TeacherAttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.findWhere({ teacher_id: teacherId, date: today });
    
    if (existing.length > 0) {
      return this.update(existing[0].id, {
        check_in_time: new Date().toISOString(),
        status: 'present',
        location,
      } as Partial<TeacherAttendanceRecord>);
    }

    return this.create({
      id: `ta-${Date.now()}`,
      teacher_id: teacherId,
      teacher_name: teacherName,
      date: today,
      check_in_time: new Date().toISOString(),
      status: 'present',
      location,
    } as Partial<TeacherAttendanceRecord>);
  }

  async checkOut(teacherId: string): Promise<TeacherAttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.findWhere({ teacher_id: teacherId, date: today });
    
    if (existing.length === 0) return null;

    return this.update(existing[0].id, {
      check_out_time: new Date().toISOString(),
    } as Partial<TeacherAttendanceRecord>);
  }
}

// ==================== 工作量 ====================

export interface WorkloadRecord {
  id: string;
  teacher_id: string;
  teacher_name: string;
  semester: string;
  teaching_hours: number;
  overtime_hours: number;
  duty_count: number;
  activity_count: number;
  total_score: number;
  created_at: string;
  updated_at?: string;
}

export class WorkloadRepository extends BaseRepository<WorkloadRecord> {
  constructor() {
    super('workloads');
  }

  async findByTeacher(teacherId: string, semester?: string): Promise<WorkloadRecord[]> {
    let query = this.client
      .from('workloads')
      .select('*')
      .eq('teacher_id', teacherId);

    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query;
    if (error) return [];
    return (data || []) as WorkloadRecord[];
  }

  async findBySemester(semester: string): Promise<WorkloadRecord[]> {
    return this.findWhere({ semester });
  }

  async calculateTotal(teacherId: string, semester: string): Promise<number> {
    const records = await this.findByTeacher(teacherId, semester);
    return records.reduce((sum, r) => sum + (r.total_score || 0), 0);
  }
}

// ==================== 学校统计 ====================

export interface SchoolStatsRecord {
  id: string;
  date: string;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  attendance_rate: number;
  created_at: string;
}

export class SchoolStatsRepository extends BaseRepository<SchoolStatsRecord> {
  constructor() {
    super('school_stats');
  }

  async getLatest(): Promise<SchoolStatsRecord | null> {
    const { data, error } = await this.client
      .from('school_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as SchoolStatsRecord;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<SchoolStatsRecord[]> {
    const { data, error } = await this.client
      .from('school_stats')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) return [];
    return (data || []) as SchoolStatsRecord[];
  }
}

// ==================== 学生荣誉 ====================

export interface StudentHonorRecord {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  honor_type: string;
  honor_name: string;
  honor_level: string;
  award_date: string;
  issuer: string;
  certificate_no: string | null;
  description: string | null;
  created_at: string;
  updated_at?: string;
}

export class StudentHonorRepository extends BaseRepository<StudentHonorRecord> {
  constructor() {
    super('student_honors');
  }

  async findByStudent(studentId: string): Promise<StudentHonorRecord[]> {
    return this.findWhere({ student_id: studentId });
  }

  async findByClass(classId: string): Promise<StudentHonorRecord[]> {
    return this.findWhere({ class_id: classId });
  }

  async findByType(honorType: string): Promise<StudentHonorRecord[]> {
    return this.findWhere({ honor_type: honorType });
  }

  async findByParams(params: { studentId?: string; classId?: string; honorType?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<StudentHonorRecord>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('student_honors')
      .select('*', { count: 'exact' })
      .order('award_date', { ascending: false });

    if (params.studentId) query = query.eq('student_id', params.studentId);
    if (params.classId) query = query.eq('class_id', params.classId);
    if (params.honorType) query = query.eq('honor_type', params.honorType);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []) as StudentHonorRecord[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const afterSchoolServiceRepository = new AfterSchoolServiceRepository();
export const teacherAttendanceRepository = new TeacherAttendanceRepository();
export const workloadRepository = new WorkloadRepository();
export const schoolStatsRepository = new SchoolStatsRepository();
export const studentHonorRepository = new StudentHonorRepository();
