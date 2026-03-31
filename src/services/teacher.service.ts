/**
 * 教师服务层
 * 
 * 处理教师相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { teacherRepository, classRepository, scheduleRepository } from '@/repositories';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { User, TeacherProfile, TeacherWorkload, UserRole } from '@/types';

/**
 * 教师查询参数
 */
export interface TeacherQueryParams {
  role?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 创建教师参数
 */
export interface CreateTeacherParams {
  name: string;
  employeeId: string;
  role?: UserRole;
  department?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * 更新教师参数
 */
export interface UpdateTeacherParams {
  name?: string;
  department?: string;
  phone?: string;
  email?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * 批量更新参数
 */
export interface BatchUpdateParams {
  ids: string[];
  updates: Record<string, unknown>;
}

/**
 * 教师服务
 */
export class TeacherService extends BaseService {
  /**
   * 获取教师详情
   */
  async getTeacher(id: string): Promise<ServiceResult<User>> {
    const teacher = await teacherRepository.findById(id);
    
    if (!teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }
    
    return this.ok(teacher);
  }

  /**
   * 根据工号获取教师
   */
  async getTeacherByEmployeeId(employeeId: string): Promise<ServiceResult<User>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teachers')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    
    if (error || !data) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }
    
    return this.ok(data as unknown as User);
  }

  /**
   * 获取教师完整档案
   */
  async getTeacherProfile(id: string): Promise<ServiceResult<TeacherProfile>> {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 获取关联信息
    const [classes, schedules] = await Promise.all([
      teacherRepository.findTeachingClasses(id),
      teacherRepository.findSchedule(id),
    ]);

    const profile: TeacherProfile = {
      ...teacher,
      honors: [],
      trainings: [],
      achievements: [],
      records: [],
    } as unknown as TeacherProfile;

    return this.ok(profile);
  }

  /**
   * 查询教师列表
   */
  async listTeachers(params: TeacherQueryParams): Promise<PaginatedServiceResult<User>> {
    const { page = 1, pageSize = 20, role, department, status, search } = params;

    const result = await teacherRepository.findPaginatedWithFilters({
      filters: { role, department },
      search,
      page,
      pageSize,
    });

    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 创建教师
   */
  async createTeacher(params: CreateTeacherParams): Promise<ServiceResult<User>> {
    // 检查工号是否重复
    const { data: existing } = await teacherRepository.findPaginatedWithFilters({
      search: params.employeeId,
    });
    
    if (existing.some((t: User) => t.employeeId === params.employeeId)) {
      return this.fail('工号已存在', 'DUPLICATE_EMPLOYEE_ID');
    }

    const teacher = await teacherRepository.create({
      ...params,
      role: params.role || 'subject_teacher' as UserRole,
    });

    if (!teacher) {
      return this.fail('创建教师失败', 'CREATE_FAILED');
    }

    return this.ok(teacher);
  }

  /**
   * 更新教师信息
   */
  async updateTeacher(id: string, params: UpdateTeacherParams): Promise<ServiceResult<User>> {
    const existing = await teacherRepository.findById(id);
    if (!existing) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    const teacher = await teacherRepository.update(id, params);
    
    if (!teacher) {
      return this.fail('更新教师失败', 'UPDATE_FAILED');
    }

    return this.ok(teacher);
  }

  /**
   * 删除教师
   */
  async deleteTeacher(id: string): Promise<ServiceResult<void>> {
    const existing = await teacherRepository.findById(id);
    if (!existing) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 检查是否还有任教班级
    const classes = await teacherRepository.findTeachingClasses(id);
    if (classes.length > 0) {
      return this.fail('该教师还有任教班级，无法删除', 'HAS_TEACHING_CLASSES');
    }

    const success = await teacherRepository.delete(id);
    
    if (!success) {
      return this.fail('删除教师失败', 'DELETE_FAILED');
    }

    return this.ok();
  }

  /**
   * 批量更新教师
   */
  async batchUpdate(params: BatchUpdateParams): Promise<ServiceResult<{ count: number }>> {
    if (!params.ids || params.ids.length === 0) {
      return this.fail('请选择要更新的数据', 'INVALID_PARAMS');
    }

    if (!params.updates || Object.keys(params.updates).length === 0) {
      return this.fail('请提供更新内容', 'INVALID_PARAMS');
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('teachers')
      .update({
        ...params.updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', params.ids);

    if (error) {
      console.error('[TeacherService] batchUpdate error:', error.message);
      return this.fail('批量更新失败', 'UPDATE_FAILED');
    }

    return this.ok({ count: params.ids.length });
  }

  /**
   * 批量删除教师
   */
  async batchDelete(ids: string[]): Promise<ServiceResult<{ count: number }>> {
    if (!ids || ids.length === 0) {
      return this.fail('请选择要删除的数据', 'INVALID_PARAMS');
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('teachers')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('[TeacherService] batchDelete error:', error.message);
      return this.fail('批量删除失败', 'DELETE_FAILED');
    }

    return this.ok({ count: ids.length });
  }

  /**
   * 更新教师密码
   */
  async updatePassword(id: string, newPassword: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();
    
    // 使用 bcrypt 加密密码（这里简化处理，实际应该使用 bcrypt）
    const { error } = await client
      .from('teachers')
      .update({
        password: newPassword, // 实际应用中应该加密
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[TeacherService] updatePassword error:', error.message);
      return this.fail('密码更新失败', 'UPDATE_FAILED');
    }

    return this.ok();
  }

  /**
   * 获取班主任列表
   */
  async listHeadTeachers(): Promise<ServiceResult<User[]>> {
    const teachers = await teacherRepository.findHeadTeachers();
    return this.ok(teachers);
  }

  /**
   * 获取教师工作量统计
   */
  async getWorkload(teacherId: string, semester?: string): Promise<ServiceResult<TeacherWorkload>> {
    const teacher = await teacherRepository.findById(teacherId);
    if (!teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 获取周课时
    const weeklyHours = await scheduleRepository.getTeacherWeeklyHours(teacherId, semester);
    
    // 获取任教班级
    const classes = await teacherRepository.findTeachingClasses(teacherId);

    const workload: TeacherWorkload = {
      id: `workload-${teacherId}`,
      teacherId,
      teacherName: teacher.name || '',
      semester: semester || 'current',
      baseWeeklyHours: weeklyHours,
      expectedHours: weeklyHours * 4,
      selfTaughtHours: weeklyHours * 4,
      leaveHours: 0,
      leaveDetails: [],
      substitutedHours: 0,
      substitutionDetails: [],
      extraHours: 0,
      extraDetails: [],
      totalHours: weeklyHours * 4,
      verified: false,
      details: classes.map((c: Record<string, unknown>) => ({
        classId: c.class_id as string,
        className: (c.classes as { name: string })?.name || '',
        position: c.position as string,
        hours: 0,
      })),
    } as unknown as TeacherWorkload;

    return this.ok(workload);
  }

  /**
   * 获取详细工作量统计
   */
  async getDetailedWorkload(employeeId: string, semester?: string, weekStartDate?: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    
    // 获取当前周的开始日期（周一）
    const getCurrentWeekMonday = () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    };

    const currentWeekStart = weekStartDate || getCurrentWeekMonday().toISOString().split('T')[0];

    // 1. 获取教师的基准课表
    const { data: scheduleSlots } = await client
      .from('schedule_slots')
      .select('*')
      .eq('employee_id', employeeId);

    // 2. 获取本周调课信息
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    const weekEndStr = weekEndDate.toISOString().split('T')[0];
    
    const { data: adjustments } = await client
      .from('course_adjustments')
      .select('*')
      .eq('applicant_id', employeeId)
      .gte('effective_week', currentWeekStart)
      .lt('effective_week', weekEndStr);

    // 3. 获取本周代课信息
    const { data: substitutes } = await client
      .from('course_adjustments')
      .select('*')
      .eq('substitute_employee_id', employeeId)
      .gte('effective_week', currentWeekStart)
      .lt('effective_week', weekEndStr);

    // 计算统计数据
    const totalBaseHours = scheduleSlots?.length || 0;
    const adjustedOutHours = adjustments?.filter(a => a.status === 'completed').length || 0;
    const substitutedInHours = substitutes?.filter(a => a.status === 'completed').length || 0;
    
    const teachingHours = totalBaseHours - adjustedOutHours;
    const substituteHours = substitutedInHours;
    const totalHours = teachingHours + substituteHours;

    // 学科分布
    const subjectMap = new Map<string, number>();
    scheduleSlots?.forEach((slot: Record<string, unknown>) => {
      const subject = slot.subject as string;
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
    });

    const subjectDistribution = Array.from(subjectMap.entries()).map(([subject, hours]) => ({
      subject,
      hours,
      percentage: totalBaseHours > 0 ? Math.round((hours / totalBaseHours) * 100 * 10) / 10 : 0,
    }));

    // 班级分布
    const classMap = new Map<string, number>();
    scheduleSlots?.forEach((slot: Record<string, unknown>) => {
      const className = (slot.class_name as string) || '未知班级';
      classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    const classDistribution = Array.from(classMap.entries())
      .map(([className, hours]) => ({ className, hours }))
      .sort((a, b) => b.hours - a.hours);

    // 获取教师基本信息
    const { data: teacherInfo } = await client
      .from('users')
      .select('name, employee_id')
      .eq('employee_id', employeeId)
      .single();

    return this.ok({
      teacherName: teacherInfo?.name || '未知',
      employeeId: employeeId,
      totalHours,
      teachingHours,
      substituteHours,
      adjustedHours: adjustedOutHours,
      subjectDistribution,
      classDistribution,
    });
  }

  /**
   * 获取教师统计
   */
  async getStatistics(): Promise<ServiceResult<{
    total: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  }>> {
    const allTeachers = await teacherRepository.findAllTeachers();
    const byRole = await teacherRepository.countByRole();

    // 按部门统计
    const byDepartment: Record<string, number> = {};
    allTeachers.forEach((t: User) => {
      if (t.department) {
        byDepartment[t.department] = (byDepartment[t.department] || 0) + 1;
      }
    });

    return this.ok({
      total: allTeachers.length,
      byRole,
      byDepartment,
    });
  }

  /**
   * 获取可选教师列表（用于排课等场景）
   */
  async getAvailableTeachers(
    options: {
      excludeIds?: string[];
      role?: string;
      subject?: string;
      weekDay?: number;
      periodIndex?: number;
      weekStartDate?: string;
    } = {}
  ): Promise<ServiceResult<User[]>> {
    const client = getSupabaseClient();
    
    // 1. 获取所有教师
    let teacherQuery = client
      .from('teachers')
      .select('id, name, primary_subject, employee_id')
      .eq('status', 'active');
    
    if (options.role) {
      teacherQuery = teacherQuery.eq('role', options.role);
    }
    
    const { data: teachers, error } = await teacherQuery;
    
    if (error) {
      console.error('[TeacherService] getAvailableTeachers error:', error.message);
      return this.ok([]);
    }

    // 2. 获取基准课表中该时段有课的教师
    let busyEmployeeIds = new Set<string>();
    
    if (options.weekDay !== undefined && options.periodIndex !== undefined) {
      const { data: busySlots } = await client
        .from('schedule_slots')
        .select('employee_id')
        .eq('week_day', options.weekDay)
        .eq('period_index', options.periodIndex);
      
      busyEmployeeIds = new Set((busySlots || []).map((s: { employee_id: string }) => s.employee_id));
    }

    // 3. 筛选可用教师
    const availableTeachers = (teachers || [])
      .filter((t: Record<string, unknown>) => !busyEmployeeIds.has(t.employee_id as string))
      .filter((t: Record<string, unknown>) => !options.excludeIds?.includes(t.id as string))
      .map((t: Record<string, unknown>) => ({
        id: t.id,
        name: t.name,
        subject: t.primary_subject,
        employeeId: t.employee_id,
        isSameSubject: t.primary_subject === options.subject,
      }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        // 同科目优先
        if (a.isSameSubject && !b.isSameSubject) return -1;
        if (!a.isSameSubject && b.isSameSubject) return 1;
        return (a.name as string).localeCompare(b.name as string);
      });

    return this.ok(availableTeachers as unknown as User[]);
  }

  /**
   * 获取教师荣誉列表
   */
  async getHonors(teacherId?: string): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();
    let query = client
      .from('teacher_honors')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query;
    if (error) {
      console.error('[TeacherService] getHonors error:', error.message);
      return this.fail('获取荣誉列表失败', 'DATABASE_ERROR');
    }

    const formattedData = (data || []).map(honor => ({
      id: honor.id,
      teacherId: honor.teacher_id,
      title: honor.title,
      level: honor.level,
      category: honor.category,
      issuer: honor.issuer,
      date: honor.date,
      certificateNo: honor.certificate_no,
      attachments: honor.attachments || [],
    }));

    return this.ok(formattedData);
  }

  /**
   * 创建教师荣誉
   */
  async createHonor(params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_honors')
      .insert({
        teacher_id: params.teacherId,
        title: params.title,
        level: params.level,
        category: params.category,
        issuer: params.issuer,
        date: params.date,
        certificate_no: params.certificateNo,
        attachments: params.attachments || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] createHonor error:', error.message);
      return this.fail('添加荣誉失败', 'DATABASE_ERROR');
    }

    return this.ok({
      id: data.id,
      teacherId: data.teacher_id,
      title: data.title,
      level: data.level,
      category: data.category,
      issuer: data.issuer,
      date: data.date,
      certificateNo: data.certificate_no,
      attachments: data.attachments || [],
    });
  }

  /**
   * 更新教师荣誉
   */
  async updateHonor(id: string, params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_honors')
      .update({
        title: params.title,
        level: params.level,
        category: params.category,
        issuer: params.issuer,
        date: params.date,
        certificate_no: params.certificateNo,
        attachments: params.attachments || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] updateHonor error:', error.message);
      return this.fail('更新荣誉失败', 'DATABASE_ERROR');
    }

    return this.ok(data);
  }

  /**
   * 删除教师荣誉
   */
  async deleteHonor(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();
    const { error } = await client.from('teacher_honors').delete().eq('id', id);

    if (error) {
      console.error('[TeacherService] deleteHonor error:', error.message);
      return this.fail('删除荣誉失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取教师培训列表
   */
  async getTrainings(teacherId?: string, type?: string, status?: string): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();
    let query = client
      .from('teacher_trainings')
      .select('*')
      .order('start_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('[TeacherService] getTrainings error:', error.message);
      return this.fail('获取培训列表失败', 'DATABASE_ERROR');
    }

    const formattedData = (data || []).map(training => ({
      id: training.id,
      teacherId: training.teacher_id,
      name: training.name,
      type: training.type,
      organizer: training.organizer,
      startDate: training.start_date,
      endDate: training.end_date,
      hours: training.hours,
      status: training.status,
      certificate: training.certificate,
      notes: training.notes,
    }));

    return this.ok(formattedData);
  }

  /**
   * 创建教师培训
   */
  async createTraining(params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_trainings')
      .insert({
        teacher_id: params.teacherId,
        name: params.name,
        type: params.type,
        organizer: params.organizer,
        start_date: params.startDate,
        end_date: params.endDate,
        hours: params.hours || 0,
        status: params.status || '进行中',
        certificate: params.certificate,
        notes: params.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] createTraining error:', error.message);
      return this.fail('添加培训失败', 'DATABASE_ERROR');
    }

    return this.ok({
      id: data.id,
      teacherId: data.teacher_id,
      name: data.name,
      type: data.type,
      organizer: data.organizer,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: data.hours,
      status: data.status,
      certificate: data.certificate,
      notes: data.notes,
    });
  }

  /**
   * 更新教师培训
   */
  async updateTraining(id: string, params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_trainings')
      .update({
        name: params.name,
        type: params.type,
        organizer: params.organizer,
        start_date: params.startDate,
        end_date: params.endDate,
        hours: params.hours,
        status: params.status,
        certificate: params.certificate,
        notes: params.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] updateTraining error:', error.message);
      return this.fail('更新培训失败', 'DATABASE_ERROR');
    }

    return this.ok({
      id: data.id,
      teacherId: data.teacher_id,
      name: data.name,
      type: data.type,
      organizer: data.organizer,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: data.hours,
      status: data.status,
      certificate: data.certificate,
      notes: data.notes,
    });
  }

  /**
   * 删除教师培训
   */
  async deleteTraining(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();
    const { error } = await client.from('teacher_trainings').delete().eq('id', id);

    if (error) {
      console.error('[TeacherService] deleteTraining error:', error.message);
      return this.fail('删除培训失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取教师成果列表
   */
  async getAchievements(teacherId?: string, type?: string, level?: string): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();
    let query = client
      .from('teacher_achievements')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (type) query = query.eq('type', type);
    if (level) query = query.eq('level', level);

    const { data, error } = await query;
    if (error) {
      console.error('[TeacherService] getAchievements error:', error.message);
      return this.fail('获取成果列表失败', 'DATABASE_ERROR');
    }

    const formattedData = (data || []).map(achievement => ({
      id: achievement.id,
      teacherId: achievement.teacher_id,
      type: achievement.type,
      title: achievement.title,
      level: achievement.level,
      result: achievement.result,
      date: achievement.date,
      description: achievement.description,
      attachments: achievement.attachments || [],
    }));

    return this.ok(formattedData);
  }

  /**
   * 创建教师成果
   */
  async createAchievement(params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_achievements')
      .insert({
        teacher_id: params.teacherId,
        type: params.type,
        title: params.title,
        level: params.level,
        result: params.result,
        date: params.date,
        description: params.description,
        attachments: params.attachments || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] createAchievement error:', error.message);
      return this.fail('添加成果失败', 'DATABASE_ERROR');
    }

    return this.ok({
      id: data.id,
      teacherId: data.teacher_id,
      type: data.type,
      title: data.title,
      level: data.level,
      result: data.result,
      date: data.date,
      description: data.description,
      attachments: data.attachments || [],
    });
  }

  /**
   * 更新教师成果
   */
  async updateAchievement(id: string, params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_achievements')
      .update({
        type: params.type,
        title: params.title,
        level: params.level,
        result: params.result,
        date: params.date,
        description: params.description,
        attachments: params.attachments || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] updateAchievement error:', error.message);
      return this.fail('更新成果失败', 'DATABASE_ERROR');
    }

    return this.ok(data);
  }

  /**
   * 删除教师成果
   */
  async deleteAchievement(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();
    const { error } = await client.from('teacher_achievements').delete().eq('id', id);

    if (error) {
      console.error('[TeacherService] deleteAchievement error:', error.message);
      return this.fail('删除成果失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取教师成长记录列表
   */
  async getRecords(teacherId?: string): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();
    let query = client
      .from('teacher_records')
      .select('*')
      .order('start_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query;
    if (error) {
      console.error('[TeacherService] getRecords error:', error.message);
      return this.fail('获取成长记录失败', 'DATABASE_ERROR');
    }

    const formattedData = (data || []).map(record => ({
      id: record.id,
      teacherId: record.teacher_id,
      teacherName: record.teacher_name,
      type: record.type,
      title: record.title,
      description: record.description,
      startDate: record.start_date,
      endDate: record.end_date,
      hours: record.hours,
      location: record.location,
      result: record.result,
      attachments: record.attachments || [],
      createdAt: record.created_at,
    }));

    return this.ok(formattedData);
  }

  /**
   * 创建教师成长记录
   */
  async createRecord(params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_records')
      .insert({
        teacher_id: params.teacherId,
        teacher_name: params.teacherName,
        type: params.type,
        title: params.title,
        description: params.description,
        start_date: params.startDate,
        end_date: params.endDate,
        hours: params.hours,
        location: params.location,
        result: params.result,
        attachments: params.attachments || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] createRecord error:', error.message);
      return this.fail('添加记录失败', 'DATABASE_ERROR');
    }

    return this.ok({
      id: data.id,
      teacherId: data.teacher_id,
      teacherName: data.teacher_name,
      type: data.type,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: data.hours,
      location: data.location,
      result: data.result,
      attachments: data.attachments || [],
      createdAt: data.created_at,
    });
  }

  /**
   * 更新教师成长记录
   */
  async updateRecord(id: string, params: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('teacher_records')
      .update({
        type: params.type,
        title: params.title,
        description: params.description,
        date: params.date,
        attachments: params.attachments || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TeacherService] updateRecord error:', error.message);
      return this.fail('更新记录失败', 'DATABASE_ERROR');
    }

    return this.ok(data);
  }

  /**
   * 删除教师成长记录
   */
  async deleteRecord(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();
    const { error } = await client.from('teacher_records').delete().eq('id', id);

    if (error) {
      console.error('[TeacherService] deleteRecord error:', error.message);
      return this.fail('删除记录失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取教师教研档案（含教研数据）
   */
  async getResearchProfile(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    // 1. 获取教师基本信息
    const { data: teacher, error: teacherError } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      return this.fail('教师不存在', 'NOT_FOUND');
    }

    // 2. 并行获取所有关联数据
    const [
      activitiesResult,
      observationsAsObserver,
      observationsAsTeacher,
      preparationsAsHost,
      preparationsAsParticipant,
      projects,
      trainings,
      achievements,
      growthRecords,
    ] = await Promise.all([
      // 教研活动参与记录
      client.from('research_activities').select('*').contains('participant_ids', [id]).order('created_at', { ascending: false }),
      // 听课评课记录 - 作为听课人
      client.from('lesson_observations').select('*').contains('observer_ids', [id]),
      // 听课评课记录 - 作为被听课人
      client.from('lesson_observations').select('*').eq('teacher_id', id),
      // 集体备课 - 作为主备人
      client.from('collective_preparations').select('*').eq('host_id', id),
      // 集体备课 - 作为参与人
      client.from('collective_preparations').select('*').contains('participant_ids', [id]),
      // 课题研究
      client.from('research_projects').select('*').or(`host_id.eq.${id},core_member_ids.cs.{${id}},participant_ids.cs.{${id}}`),
      // 培训研修记录
      client.from('teacher_trainings').select('*').eq('teacher_id', id),
      // 教学成果
      client.from('teacher_achievements').select('*').eq('teacher_id', id).order('date', { ascending: false }),
      // 成长记录
      client.from('teacher_growth_records').select('*').eq('teacher_id', id).order('date', { ascending: false }).limit(20),
    ]);

    // 统计教研活动
    const activities = activitiesResult.data || [];
    const activityByType = activities.reduce((acc: Record<string, number>, activity: Record<string, unknown>) => {
      const type = activity.type as string;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // 计算听课平均得分
    const scoresList = (observationsAsTeacher.data || [])
      .filter((o: Record<string, unknown>) => o.overall_score)
      .map((o: Record<string, unknown>) => o.overall_score as number);
    const averageScore = scoresList.length > 0
      ? scoresList.reduce((a, b) => a + b, 0) / scoresList.length
      : null;

    // 处理课题研究数据
    const projectData = (projects.data || []).map((p: Record<string, unknown>) => {
      let role: 'host' | 'core_member' | 'participant' = 'participant';
      if (p.host_id === id) {
        role = 'host';
      } else if ((p.core_member_ids as string[])?.includes(id)) {
        role = 'core_member';
      }
      return {
        id: p.id,
        name: p.name,
        role,
        status: p.status,
      };
    });

    // 培训学时统计
    const totalTrainingHours = (trainings.data || []).reduce((sum: number, t: Record<string, unknown>) => sum + (t.hours as number || 0), 0);

    // 组装档案
    const profile = {
      teacherId: id,
      teacherName: teacher.name,
      basicInfo: {
        employeeId: teacher.employee_id,
        gender: teacher.gender,
        phone: teacher.phone,
        email: teacher.email,
        department: teacher.department,
        subject: teacher.subject,
        title: teacher.title,
        education: teacher.education,
        joinDate: teacher.join_date,
        status: teacher.status,
      },
      totalActivities: activities.length,
      activityByType: Object.entries(activityByType).map(([type, count]) => ({ type, count })),
      lessonsObserved: (observationsAsObserver.data || []).length,
      lessonsTaught: (observationsAsTeacher.data || []).length,
      averageScore,
      lessonsPrepared: (preparationsAsHost.data || []).length,
      lessonsParticipated: (preparationsAsParticipant.data || []).length,
      projects: projectData,
      trainings: (trainings.data || []).map((t: Record<string, unknown>) => ({
        id: t.id,
        name: t.name,
        hours: t.hours,
        completedAt: t.completed_at,
      })),
      totalTrainingHours,
      achievements: (achievements.data || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        level: a.level,
        date: a.date,
      })),
      growthRecords: growthRecords.data || [],
      updatedAt: new Date().toISOString(),
    };

    return this.ok(profile);
  }
}

// 导出单例
export const teacherService = new TeacherService();
