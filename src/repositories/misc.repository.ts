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
        check_in_time: new Date().toTimeString().slice(0, 8),
        status: 'normal',
        location,
      } as Partial<TeacherAttendanceRecord>);
    }

    return this.create({
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      teacher_name: teacherName,
      date: today,
      check_in_time: new Date().toTimeString().slice(0, 8),
      status: 'normal',
      location,
    } as Partial<TeacherAttendanceRecord>);
  }

  async checkOut(teacherId: string): Promise<TeacherAttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.findWhere({ teacher_id: teacherId, date: today });
    
    if (existing.length === 0) return null;

    return this.update(existing[0].id, {
      check_out_time: new Date().toTimeString().slice(0, 8),
    } as Partial<TeacherAttendanceRecord>);
  }

  /**
   * 获取每日考勤数据
   */
  async getDailyAttendance(date: string): Promise<{
    date: string;
    summary: { total: number; normal: number; late: number; absent: number; leave: number };
    records: Array<{
      teacherId: string;
      teacherName: string;
      employeeId: string;
      department: string;
      subject: string;
      status: string;
      leaveType?: string;
      leaveDuration?: number;
      remark?: string;
      recordId?: string;
    }>;
  }> {
    // 获取所有在职教师
    const { data: teachers, error: teachersError } = await this.client
      .from('teachers')
      .select('id, name, employee_id, department, primary_subject, role')
      .eq('status', 'active')
      .not('role', 'in', '(principal,secretary)');

    if (teachersError) {
      console.error('获取教师列表失败:', teachersError);
    }

    // 获取当天考勤记录
    const { data: attendanceRecords, error: attendanceError } = await this.client
      .from('teacher_attendance')
      .select('*')
      .filter('date', 'gte', `${date}T00:00:00`)
      .filter('date', 'lte', `${date}T23:59:59`);

    if (attendanceError) {
      console.error('获取考勤记录失败:', attendanceError);
    }
    
    console.log('[getDailyAttendance] date:', date, 'attendanceRecords:', attendanceRecords?.length, 'error:', attendanceError);

    // 获取当天请假记录
    const { data: leaveRecords } = await this.client
      .from('leave_requests_v2')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);

    const leaveMap = new Map((leaveRecords || []).map(l => [l.employee_id, l]));

    // 构建考勤记录
    const records = (teachers || []).map(teacher => {
      const attendance = (attendanceRecords || []).find(a => a.teacher_id === teacher.id);
      const leave = leaveMap.get(teacher.employee_id);
      
      if (attendance) {
        console.log('[getDailyAttendance] 找到考勤记录:', teacher.id, teacher.name, attendance.status);
      }
      
      let status = 'normal';
      let leaveType: string | undefined;
      let leaveDuration: number | undefined;
      
      if (leave) {
        status = 'leave';
        leaveType = leave.leave_type;
        leaveDuration = leave.duration_hours;
      } else if (attendance) {
        status = attendance.status || 'normal';
      }

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        employeeId: teacher.employee_id || '',
        department: teacher.department || '',
        subject: teacher.primary_subject || '',
        status,
        leaveType,
        leaveDuration,
        remark: attendance?.remark,
        recordId: attendance?.id,
      };
    });

    // 计算统计
    const summary = {
      total: records.length,
      normal: records.filter(r => r.status === 'normal').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
      leave: records.filter(r => r.status === 'leave').length,
    };

    return { date, summary, records };
  }

  /**
   * 获取月度考勤数据
   */
  async getMonthlyAttendance(month: string): Promise<{
    month: string;
    summary: {
      totalTeachers: number;
      totalDays: number;
      normalDays: number;
      lateDays: number;
      absentDays: number;
      leaveDays: number;
      averageAttendanceRate: number;
    };
    byTeacher: Array<{
      teacherId: string;
      teacherName: string;
      employeeId: string;
      department: string;
      normalDays: number;
      lateDays: number;
      absentDays: number;
      leaveDays: number;
      attendanceRate: number;
      leaveRecords: Array<{ date: string; type: string }>;
    }>;
    byDate: Array<{
      date: string;
      weekday: string;
      normal: number;
      late: number;
      absent: number;
      leave: number;
    }>;
  }> {
    // 计算月份的天数
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    // 生成该月所有工作日（排除周末）
    const workDays: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, mon - 1, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays.push(`${month}-${String(d).padStart(2, '0')}`);
      }
    }

    // 获取所有在职教师
    const { data: teachers } = await this.client
      .from('teachers')
      .select('id, name, employee_id, department, primary_subject, role')
      .eq('status', 'active')
      .not('role', 'in', '(principal,secretary)');

    // 获取该月考勤记录
    const { data: attendanceRecords } = await this.client
      .from('teacher_attendance')
      .select('*')
      .gte('date', `${month}-01`)
      .lte('date', `${month}-${daysInMonth}`);

    // 获取该月请假记录
    const { data: leaveRecords } = await this.client
      .from('leave_requests_v2')
      .select('*')
      .eq('status', 'approved')
      .gte('start_date', `${month}-01`)
      .lte('end_date', `${month}-${daysInMonth}`);

    // 按日期统计
    const byDate = workDays.map(date => {
      const dayAttendance = (attendanceRecords || []).filter(a => a.date === date);
      const dayOfWeek = new Date(date).getDay();
      
      return {
        date,
        weekday: `周${weekdays[dayOfWeek]}`,
        normal: dayAttendance.filter(a => a.status === 'normal').length,
        late: dayAttendance.filter(a => a.status === 'late').length,
        absent: dayAttendance.filter(a => a.status === 'absent').length,
        leave: 0, // 需要从请假记录计算
      };
    });

    // 按教师统计
    const byTeacher = (teachers || []).map(teacher => {
      const teacherAttendance = (attendanceRecords || []).filter(a => a.teacher_id === teacher.id);
      const teacherLeaves = (leaveRecords || []).filter(l => l.employee_id === teacher.employee_id);
      
      const normalDays = teacherAttendance.filter(a => a.status === 'normal').length;
      const lateDays = teacherAttendance.filter(a => a.status === 'late').length;
      const absentDays = teacherAttendance.filter(a => a.status === 'absent').length;
      const leaveDays = teacherLeaves.length;
      
      const attendanceRate = workDays.length > 0 
        ? Math.round((normalDays + lateDays) / workDays.length * 100) 
        : 0;

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        employeeId: teacher.employee_id || '',
        department: teacher.department || '',
        normalDays,
        lateDays,
        absentDays,
        leaveDays,
        attendanceRate,
        leaveRecords: teacherLeaves.map(l => ({ date: l.start_date, type: l.leave_type })),
      };
    });

    // 计算总统计
    const summary = {
      totalTeachers: (teachers || []).length,
      totalDays: workDays.length,
      normalDays: byTeacher.reduce((sum, t) => sum + t.normalDays, 0),
      lateDays: byTeacher.reduce((sum, t) => sum + t.lateDays, 0),
      absentDays: byTeacher.reduce((sum, t) => sum + t.absentDays, 0),
      leaveDays: byTeacher.reduce((sum, t) => sum + t.leaveDays, 0),
      averageAttendanceRate: byTeacher.length > 0
        ? Math.round(byTeacher.reduce((sum, t) => sum + t.attendanceRate, 0) / byTeacher.length)
        : 0,
    };

    return { month, summary, byTeacher, byDate };
  }

  /**
   * 标记考勤状态
   */
  async markStatus(
    teacherId: string,
    teacherName: string | undefined,
    date: string,
    status: string,
    remark?: string
  ): Promise<TeacherAttendanceRecord | null> {
    // 查找现有记录
    const existing = await this.findWhere({ teacher_id: teacherId, date });
    
    if (existing.length > 0) {
      return this.update(existing[0].id, {
        status,
        remark,
      } as Partial<TeacherAttendanceRecord>);
    }

    // 获取教师姓名
    let name = teacherName;
    if (!name) {
      const { data: teacher } = await this.client
        .from('teachers')
        .select('name')
        .eq('id', teacherId)
        .single();
      name = teacher?.name || teacherId;
    }

    // 创建新记录
    return this.create({
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      teacher_name: name,
      date,
      status,
      remark,
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
