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
  student_name?: string;
  class_id?: string;
  class_name?: string;
  title: string;
  level: string;
  category: string;
  issuer?: string;
  date: string; // 数据库使用 date 字段
  certificate_no?: string;
  description?: string;
  created_at?: string;
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

  /**
   * 分页查询荣誉列表，关联获取学生班级信息
   */
  async findByParams(params: { 
    studentId?: string; 
    classId?: string; 
    honorType?: string; 
    level?: string;
    keyword?: string;
    page?: number; 
    pageSize?: number 
  }): Promise<PaginatedResult<StudentHonorRecord & { grade?: number }>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 构建基础查询
    let query = this.client
      .from('student_honors')
      .select('*', { count: 'exact' });

    // 应用筛选条件
    if (params.studentId) {
      query = query.eq('student_id', params.studentId);
    }
    if (params.honorType) {
      query = query.eq('category', params.honorType);
    }
    if (params.level) {
      query = query.eq('level', params.level);
    }
    if (params.keyword) {
      query = query.or(`title.ilike.%${params.keyword}%,student_name.ilike.%${params.keyword}%`);
    }

    // 排序和分页
    query = query.order('date', { ascending: false }).range(from, to);

    const { data: honorsData, error, count } = await query;

    if (error) {
      console.error('查询荣誉列表失败:', error);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    if (!honorsData || honorsData.length === 0) {
      return { data: [], total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) };
    }

    // 获取所有学生ID，用于批量查询学生信息
    const studentIds = [...new Set(honorsData.map(h => h.student_id).filter(Boolean))];
    
    // 批量查询学生信息（包含班级信息）
    let studentsMap: Record<string, { name: string; class_id: string | null; class_name: string | null; grade: number | null }> = {};
    
    if (studentIds.length > 0) {
      const { data: studentsData } = await this.client
        .from('students')
        .select('id, name, class_id, class_name, grade')
        .in('id', studentIds);

      if (studentsData) {
        studentsMap = studentsData.reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as typeof studentsMap);
      }
    }

    // 如果有 classId 筛选，需要过滤
    let filteredHonors = honorsData;
    if (params.classId) {
      filteredHonors = honorsData.filter(h => {
        const student = studentsMap[h.student_id];
        return student?.class_id === params.classId;
      });
    }

    // 合并数据
    const result = filteredHonors.map(honor => {
      const student = studentsMap[honor.student_id];
      return {
        ...honor,
        student_name: honor.student_name || student?.name || '未知学生',
        class_id: honor.class_id || student?.class_id || null,
        class_name: honor.class_name || student?.class_name || null,
        grade: student?.grade || null,
      } as StudentHonorRecord & { grade?: number };
    });

    // 计算总数（如果有 classId 筛选需要重新计算）
    let totalCount = count || 0;
    if (params.classId) {
      // 需要单独计算符合条件总数
      const { count: filteredCount } = await this.client
        .from('student_honors')
        .select('id', { count: 'exact', head: true });
      
      // 获取所有相关学生ID
      const { data: classStudents } = await this.client
        .from('students')
        .select('id')
        .eq('class_id', params.classId);
      
      if (classStudents && classStudents.length > 0) {
        const classStudentIds = classStudents.map(s => s.id);
        const { count: honorCount } = await this.client
          .from('student_honors')
          .select('id', { count: 'exact', head: true })
          .in('student_id', classStudentIds);
        totalCount = honorCount || 0;
      } else {
        totalCount = 0;
      }
    }

    return {
      data: result,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  /**
   * 批量删除荣誉
   */
  async batchDelete(ids: string[]): Promise<number> {
    const { count, error } = await this.client
      .from('student_honors')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * 批量更新荣誉
   */
  async batchUpdate(ids: string[], data: Partial<StudentHonorRecord>): Promise<number> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    const { count, error } = await this.client
      .from('student_honors')
      .update(updateData, { count: 'exact' })
      .in('id', ids);

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * 导出荣誉数据（不分页）
   */
  async exportData(params: { 
    studentId?: string; 
    classId?: string; 
    honorType?: string;
    level?: string;
    ids?: string[];
  }): Promise<(StudentHonorRecord & { grade?: number })[]> {
    // 构建基础查询
    let query = this.client
      .from('student_honors')
      .select('*');

    // 应用筛选条件
    if (params.ids && params.ids.length > 0) {
      query = query.in('id', params.ids);
    } else {
      if (params.studentId) {
        query = query.eq('student_id', params.studentId);
      }
      if (params.honorType) {
        query = query.eq('category', params.honorType);
      }
      if (params.level) {
        query = query.eq('level', params.level);
      }
    }

    query = query.order('date', { ascending: false });

    const { data: honorsData, error } = await query;

    if (error || !honorsData) {
      return [];
    }

    // 获取所有学生ID
    const studentIds = [...new Set(honorsData.map(h => h.student_id).filter(Boolean))];
    
    // 批量查询学生信息
    let studentsMap: Record<string, { name: string; class_id: string | null; class_name: string | null; grade: number | null }> = {};
    
    if (studentIds.length > 0) {
      const { data: studentsData } = await this.client
        .from('students')
        .select('id, name, class_id, class_name, grade')
        .in('id', studentIds);

      if (studentsData) {
        studentsMap = studentsData.reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as typeof studentsMap);
      }
    }

    // 如果有 classId 筛选，过滤数据
    let filteredHonors = honorsData;
    if (params.classId) {
      filteredHonors = honorsData.filter(h => {
        const student = studentsMap[h.student_id];
        return student?.class_id === params.classId;
      });
    }

    // 合并数据
    return filteredHonors.map(honor => {
      const student = studentsMap[honor.student_id];
      return {
        ...honor,
        student_name: honor.student_name || student?.name || '未知学生',
        class_id: honor.class_id || student?.class_id || null,
        class_name: honor.class_name || student?.class_name || null,
        grade: student?.grade || null,
      } as StudentHonorRecord & { grade?: number };
    });
  }
}

// ==================== 导出单例 ====================

import { getSupabaseClient } from '@/storage/database/supabase-client';

export const afterSchoolServiceRepository = new AfterSchoolServiceRepository();
export const teacherAttendanceRepository = new TeacherAttendanceRepository();
export const workloadRepository = new WorkloadRepository();
export const schoolStatsRepository = new SchoolStatsRepository();
export const studentHonorRepository = new StudentHonorRepository();
