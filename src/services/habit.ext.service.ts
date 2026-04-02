/**
 * 习惯培养扩展服务层
 * 
 * 提供习惯培养高级业务逻辑处理
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';

// ==================== 类型定义 ====================

export interface HabitGoalTemplate {
  id: string;
  category: string;
  code: string;
  title: string;
  description: string;
  gradeRange: string;
  difficulty: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyGoal {
  id: string;
  classId: string;
  studentId: string;
  studentName?: string;  // 学生姓名
  month: string;
  academicYear: string;
  goalId: string;
  customTitle?: string;
  customDescription?: string;
  status: string;
  approvalStatus: string;
  goal?: HabitGoalTemplate;
  createdAt: string;
  updatedAt: string;
}

export interface HabitDailyRecord {
  id: string;
  studentGoalId: string;
  studentId: string;
  studentName?: string;  // 学生姓名
  checkDate: string;
  month: string;
  status: string;
  photoUrl?: string;
  description?: string;
  parentComment?: string;
  teacherComment?: string;
  makeUpDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  studentGoal?: {
    id: string;
    month: string;
    academicYear: string;
    goalId: string;
    goal?: HabitGoalTemplate;
  };
}

export interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;
  month: string;
  categories: string[];
  score?: number;
  achievements?: string;
  createdAt: string;
}

export interface HabitSystemRule {
  id: string;
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  monthlyDeadline: number;
  checkFrequency: string;
  makeUpDays: number;
  passThreshold: number;
  starQuotaPerClass: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== 目标模板服务 ====================

export class HabitGoalTemplateService extends BaseService {
  /**
   * 获取目标模板列表
   */
  async getList(params: {
    category?: string;
    gradeRange?: string;
    isActive?: string;
  }): Promise<ServiceResult<{ data: HabitGoalTemplate[]; statistics: Record<string, unknown> }>> {
    try {
      const client = getSupabaseClient();

      let query = client
        .from('habit_goal_templates')
        .select('*', { count: 'exact' })
        .order('category')
        .order('sort_order');

      if (params.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }
      if (params.isActive !== undefined && params.isActive !== 'all') {
        query = query.eq('is_active', params.isActive === 'true');
      }

      const { data, count, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const formattedData: HabitGoalTemplate[] = (data || []).map(g => ({
        id: g.id,
        category: g.category,
        code: g.code,
        title: g.title,
        description: g.description,
        gradeRange: g.grade_range,
        difficulty: g.difficulty,
        isActive: g.is_active,
        sortOrder: g.sort_order,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));

      // 按类别分组统计
      const categoryStats: Record<string, number> = {};
      formattedData.forEach(g => {
        categoryStats[g.category] = (categoryStats[g.category] || 0) + 1;
      });

      return {
        success: true,
        data: {
          data: formattedData,
          statistics: {
            total: count || 0,
            active: formattedData.filter(g => g.isActive).length,
            categoryStats,
          },
        },
      };
    } catch (err) {
      console.error('Get goal templates error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建目标模板
   */
  async create(data: Partial<HabitGoalTemplate>): Promise<ServiceResult<HabitGoalTemplate>> {
    try {
      const client = getSupabaseClient();

      if (!data.category || !data.title) {
        return { success: false, error: '类别和标题为必填项', code: 'VALIDATION_ERROR' };
      }

      const { data: result, error } = await client
        .from('habit_goal_templates')
        .insert({
          category: data.category,
          code: data.code || null,
          title: data.title,
          description: data.description || null,
          grade_range: data.gradeRange || '1-6',
          difficulty: data.difficulty || 'medium',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          id: result.id,
          category: result.category,
          code: result.code,
          title: result.title,
          description: result.description,
          gradeRange: result.grade_range,
          difficulty: result.difficulty,
          isActive: result.is_active,
          sortOrder: result.sort_order,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        },
      };
    } catch (err) {
      console.error('Create goal template error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 更新目标模板
   */
  async update(id: string, data: Partial<HabitGoalTemplate>): Promise<ServiceResult<HabitGoalTemplate>> {
    try {
      const client = getSupabaseClient();

      const { data: result, error } = await client
        .from('habit_goal_templates')
        .update({
          ...data,
          grade_range: data.gradeRange,
          is_active: data.isActive,
          sort_order: data.sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: '更新失败' };
      }

      return { success: true, data: result as HabitGoalTemplate };
    } catch (err) {
      console.error('Update goal template error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 删除目标模板
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('habit_goal_templates')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: '删除失败' };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete goal template error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// ==================== 月度目标服务 ====================

export class MonthlyGoalService extends BaseService {
  /**
   * 获取月度目标列表
   */
  async getList(params: {
    classId?: string;
    studentId?: string;
    month?: string;
    academicYear?: string;
    status?: string;
  }): Promise<ServiceResult<MonthlyGoal[]>> {
    try {
      const client = getSupabaseClient();

      let query = client
        .from('habit_student_goals')
        .select(`
          *,
          habit_goal_templates (
            id, category, code, title, description, difficulty
          )
        `);

      if (params.classId) query = query.eq('class_id', params.classId);
      if (params.studentId) query = query.eq('student_id', params.studentId);
      if (params.month) query = query.eq('month', params.month);
      if (params.academicYear) query = query.eq('academic_year', params.academicYear);
      if (params.status) query = query.eq('status', params.status);

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // 获取学生姓名
      const studentIds = [...new Set((data || []).map(g => g.student_id))];
      const { data: students } = await client
        .from('students')
        .select('id, name')
        .in('id', studentIds);
      
      const studentNameMap: Record<string, string> = {};
      (students || []).forEach(s => {
        studentNameMap[s.id] = s.name;
      });

      const formattedData: MonthlyGoal[] = (data || []).map(g => ({
        id: g.id,
        classId: g.class_id,
        studentId: g.student_id,
        studentName: studentNameMap[g.student_id] || g.student_id,
        month: g.month,
        academicYear: g.academic_year,
        goalId: g.goal_template_id,
        customTitle: g.custom_title,
        customDescription: g.custom_description,
        status: g.status,
        approvalStatus: g.approval_status,
        approvalComment: g.approval_comment,
        approvedBy: g.approved_by,
        approvedAt: g.approved_at,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
        goal: g.habit_goal_templates ? {
          id: g.habit_goal_templates.id,
          category: g.habit_goal_templates.category,
          code: g.habit_goal_templates.code,
          title: g.habit_goal_templates.title,
          description: g.habit_goal_templates.description,
          difficulty: g.habit_goal_templates.difficulty,
        } as HabitGoalTemplate : undefined,
      }));

      return { success: true, data: formattedData };
    } catch (err) {
      console.error('Get monthly goals error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建月度目标
   */
  async create(goals: Array<{
    classId: string;
    studentId?: string;
    month: string;
    academicYear: string;
    goalId: string;
    customTitle?: string;
    customDescription?: string;
  }>): Promise<ServiceResult<MonthlyGoal[]>> {
    try {
      const client = getSupabaseClient();

      const insertData = goals.map(g => ({
        class_id: g.classId,
        student_id: g.studentId || null,
        month: g.month,
        academic_year: g.academicYear,
        goal_template_id: g.goalId,
        custom_title: g.customTitle || null,
        custom_description: g.customDescription || null,
        status: 'pending',
        approval_status: 'pending',
      }));

      const { data, error } = await client
        .from('habit_student_goals')
        .insert(insertData)
        .select(`
          *,
          habit_goal_templates (
            id, category, code, title, description, difficulty
          )
        `);

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: '该学生本月已设置相同目标，请勿重复添加', code: 'DUPLICATE' };
        }
        return { success: false, error: error.message };
      }

      const formattedData: MonthlyGoal[] = (data || []).map(g => ({
        id: g.id,
        classId: g.class_id,
        studentId: g.student_id,
        month: g.month,
        academicYear: g.academic_year,
        goalId: g.goal_template_id,
        customTitle: g.custom_title,
        customDescription: g.custom_description,
        status: g.status,
        approvalStatus: g.approval_status,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
        goal: g.habit_goal_templates ? {
          id: g.habit_goal_templates.id,
          category: g.habit_goal_templates.category,
          code: g.habit_goal_templates.code,
          title: g.habit_goal_templates.title,
          description: g.habit_goal_templates.description,
          difficulty: g.habit_goal_templates.difficulty,
        } as HabitGoalTemplate : undefined,
      }));

      return { success: true, data: formattedData };
    } catch (err) {
      console.error('Create monthly goals error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 更新月度目标
   */
  async update(id: string, data: Partial<MonthlyGoal>): Promise<ServiceResult<MonthlyGoal>> {
    try {
      const client = getSupabaseClient();

      const { data: result, error } = await client
        .from('habit_student_goals')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: '更新失败' };
      }

      return { success: true, data: result as MonthlyGoal };
    } catch (err) {
      console.error('Update monthly goal error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 删除月度目标
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('habit_student_goals')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: '删除失败' };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete monthly goal error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// ==================== 打卡记录服务 ====================

export class HabitRecordExtService extends BaseService {
  /**
   * 获取打卡记录列表
   */
  async getList(params: {
    monthlyGoalId?: string;
    studentId?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ServiceResult<{ data: HabitDailyRecord[]; statistics: Record<string, number> }>> {
    try {
      const client = getSupabaseClient();
      const limit = params.limit || 100;

      let query = client
        .from('habit_daily_records')
        .select(`
          *,
          habit_student_goals (
            id, month, academic_year, goal_template_id,
            habit_goal_templates (id, category, code, title, description, difficulty)
          )
        `);

      if (params.monthlyGoalId) query = query.eq('monthly_goal_id', params.monthlyGoalId);
      if (params.studentId) query = query.eq('student_id', params.studentId);
      if (params.month) query = query.eq('month', params.month);
      if (params.startDate) query = query.gte('check_date', params.startDate);
      if (params.endDate) query = query.lte('check_date', params.endDate);

      query = query.order('check_date', { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // 获取学生姓名
      const studentIds = [...new Set((data || []).map(r => r.student_id))];
      const { data: students } = await client
        .from('students')
        .select('id, name')
        .in('id', studentIds);
      
      const studentNameMap: Record<string, string> = {};
      (students || []).forEach(s => {
        studentNameMap[s.id] = s.name;
      });

      const formattedData: HabitDailyRecord[] = (data || []).map(r => ({
        id: r.id,
        studentGoalId: r.student_goal_id,
        studentId: r.student_id,
        studentName: studentNameMap[r.student_id] || r.student_id,
        checkDate: r.check_date,
        month: r.month,
        status: r.status,
        photoUrl: r.photo_url,
        description: r.description,
        parentComment: r.parent_comment,
        teacherComment: r.teacher_comment,
        makeUpDate: r.make_up_date,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        studentGoal: r.habit_student_goals ? {
          id: (r.habit_student_goals as Record<string, unknown>).id as string,
          month: (r.habit_student_goals as Record<string, unknown>).month as string,
          academicYear: (r.habit_student_goals as Record<string, unknown>).academic_year as string,
          goalId: (r.habit_student_goals as Record<string, unknown>).goal_template_id as string,
          goal: (r.habit_student_goals as Record<string, unknown>).habit_goal_templates ? {
            id: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).id as string,
            category: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).category as string,
            code: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).code as string,
            title: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).title as string,
            description: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).description as string,
            difficulty: ((r.habit_student_goals as Record<string, unknown>).habit_goal_templates as Record<string, unknown>).difficulty as string,
          } as HabitGoalTemplate : undefined,
        } : undefined,
      }));

      const statistics = {
        total: formattedData.length,
        completed: formattedData.filter(r => r.status === 'completed').length,
        pending: formattedData.filter(r => r.status === 'pending').length,
        missed: formattedData.filter(r => r.status === 'missed').length,
        makeUp: formattedData.filter(r => r.status === 'make_up').length,
      };

      return { success: true, data: { data: formattedData, statistics } };
    } catch (err) {
      console.error('Get records error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建/更新打卡记录
   */
  async upsert(data: {
    studentGoalId: string;
    studentId: string;
    checkDate: string;
    month: string;
    photoUrl?: string;
    description?: string;
    parentComment?: string;
    createdBy?: string;
  }): Promise<ServiceResult<HabitDailyRecord>> {
    try {
      const client = getSupabaseClient();

      if (!data.studentGoalId || !data.checkDate || !data.month) {
        return { success: false, error: '学生目标ID、打卡日期、月份为必填项', code: 'VALIDATION_ERROR' };
      }

      // 检查是否已存在
      const { data: existingRecord } = await client
        .from('habit_daily_records')
        .select('id')
        .eq('student_goal_id', data.studentGoalId)
        .eq('check_date', data.checkDate)
        .single();

      if (existingRecord) {
        // 更新
        const { data: result, error } = await client
          .from('habit_daily_records')
          .update({
            status: 'completed',
            photo_url: data.photoUrl || null,
            description: data.description || null,
            parent_comment: data.parentComment || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, data: result as HabitDailyRecord };
      }

      // 创建
      const { data: result, error } = await client
        .from('habit_daily_records')
        .insert({
          student_goal_id: data.studentGoalId,
          student_id: data.studentId,
          check_date: data.checkDate,
          month: data.month,
          status: 'completed',
          photo_url: data.photoUrl || null,
          description: data.description || null,
          parent_comment: data.parentComment || null,
          created_by: data.createdBy || null,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: result as HabitDailyRecord };
    } catch (err) {
      console.error('Upsert record error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 删除打卡记录
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const client = getSupabaseClient();

      const { error } = await client
        .from('habit_daily_records')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: '删除失败' };
      }

      return { success: true };
    } catch (err) {
      console.error('Delete record error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 更新打卡记录（班主任评论等）
   */
  async update(id: string, data: {
    teacherComment?: string;
    status?: string;
  }): Promise<ServiceResult<HabitDailyRecord>> {
    try {
      const client = getSupabaseClient();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.teacherComment !== undefined) {
        updateData.teacher_comment = data.teacherComment;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
      }

      const { data: result, error } = await client
        .from('habit_daily_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: result as HabitDailyRecord };
    } catch (err) {
      console.error('Update record error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// ==================== 习惯之星服务 ====================

export class HabitStarExtService extends BaseService {
  /**
   * 获取习惯之星列表
   */
  async getList(params: {
    studentId?: string;
    month?: string;
    grade?: number;
    limit?: number;
  }): Promise<ServiceResult<{ data: HabitStar[]; statistics: Record<string, unknown> }>> {
    try {
      const client = getSupabaseClient();
      const limit = params.limit || 50;

      let query = client.from('habit_stars').select('*');

      if (params.studentId) query = query.eq('student_id', params.studentId);
      if (params.month) query = query.eq('month', params.month);
      if (params.grade) query = query.eq('grade', params.grade);

      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // 获取学生信息
      const studentIds = [...new Set((data || []).map(s => s.student_id))];
      const { data: students } = await client
        .from('students')
        .select('id, name, class_id, class_name, grade')
        .in('id', studentIds);

      const studentMap: Record<string, { name: string; classId: string; className: string; grade: number }> = {};
      (students || []).forEach(s => {
        studentMap[s.id] = {
          name: s.name,
          classId: s.class_id,
          className: s.class_name,
          grade: s.grade,
        };
      });

      const formattedData: HabitStar[] = (data || []).map(s => {
        const student = studentMap[s.student_id] || {};
        return {
          id: s.id,
          studentId: s.student_id,
          studentName: student.name || '未知',
          classId: student.classId || '',
          className: student.className || '',
          grade: student.grade || s.grade || 0,
          month: s.month,
          categories: s.categories || [],
          score: s.total_score,
          achievements: s.achievements,
          createdAt: s.created_at,
        };
      });

      const statistics = {
        total: formattedData.length,
        byCategory: {} as Record<string, number>,
        byClass: {} as Record<string, number>,
      };

      formattedData.forEach(s => {
        if (s.categories && Array.isArray(s.categories)) {
          s.categories.forEach(cat => {
            statistics.byCategory[cat] = (statistics.byCategory[cat] || 0) + 1;
          });
        }
        if (s.classId) {
          statistics.byClass[s.classId] = (statistics.byClass[s.classId] || 0) + 1;
        }
      });

      return { success: true, data: { data: formattedData, statistics } };
    } catch (err) {
      console.error('Get stars error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建习惯之星
   */
  async create(data: {
    studentId: string;
    month: string;
    categories?: string[];
    score?: number;
    achievements?: string;
    grade?: number;
  }): Promise<ServiceResult<HabitStar>> {
    try {
      const client = getSupabaseClient();

      if (!data.studentId || !data.month) {
        return { success: false, error: '学生ID和月份为必填项', code: 'VALIDATION_ERROR' };
      }

      const { data: student } = await client
        .from('students')
        .select('id, name, grade, class_id, class_name')
        .eq('id', data.studentId)
        .single();

      if (!student) {
        return { success: false, error: '学生不存在', code: 'NOT_FOUND' };
      }

      const { data: result, error } = await client
        .from('habit_stars')
        .insert({
          id: `star_${data.studentId}_${data.month}`,
          student_id: data.studentId,
          month: data.month,
          categories: data.categories || [],
          total_score: data.score || null,
          achievements: data.achievements || null,
          grade: data.grade || student.grade,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: '该学生本月已是习惯之星', code: 'DUPLICATE' };
        }
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          id: result.id,
          studentId: result.student_id,
          studentName: student.name,
          classId: student.class_id,
          className: student.class_name,
          grade: result.grade,
          month: result.month,
          categories: result.categories,
          score: result.total_score,
          achievements: result.achievements,
          createdAt: result.created_at,
        },
      };
    } catch (err) {
      console.error('Create star error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// ==================== 统计服务 ====================

export class HabitStatisticsService extends BaseService {
  /**
   * 获取习惯养成统计
   */
  async getStatistics(params: {
    classId?: string;
    studentId?: string;
    month?: string;
    academicYear?: string;
  }): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const client = getSupabaseClient();

      // 并行获取各项统计
      const [goalsResult, recordsResult, starsResult, templatesResult] = await Promise.all([
        this.getGoalsStats(client, params),
        this.getRecordsStats(client, params),
        this.getStarsStats(client, params),
        this.getTemplatesStats(client),
      ]);

      return {
        success: true,
        data: {
          studentGoals: goalsResult,
          records: recordsResult,
          stars: starsResult,
          goals: templatesResult,
        },
      };
    } catch (err) {
      console.error('Get statistics error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  private async getGoalsStats(client: ReturnType<typeof getSupabaseClient>, params: { classId?: string; month?: string; academicYear?: string }) {
    let query = client.from('habit_student_goals').select('status, approval_status');

    if (params.classId) query = query.eq('class_id', params.classId);
    if (params.month) query = query.eq('month', params.month);
    if (params.academicYear) query = query.eq('academic_year', params.academicYear);

    const { data } = await query;

    return {
      total: data?.length || 0,
      approved: data?.filter(g => g.approval_status === 'approved').length || 0,
      pending: data?.filter(g => g.approval_status === 'pending').length || 0,
      rejected: data?.filter(g => g.approval_status === 'rejected').length || 0,
    };
  }

  private async getRecordsStats(client: ReturnType<typeof getSupabaseClient>, params: { studentId?: string; month?: string }) {
    let query = client.from('habit_daily_records').select('status');

    if (params.studentId) query = query.eq('student_id', params.studentId);
    if (params.month) query = query.eq('month', params.month);

    const { data } = await query;

    const total = data?.length || 0;
    const completed = data?.filter(r => r.status === 'completed').length || 0;

    return {
      total,
      completed,
      pending: data?.filter(r => r.status === 'pending').length || 0,
      missed: data?.filter(r => r.status === 'missed').length || 0,
      makeUp: data?.filter(r => r.status === 'make_up').length || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  private async getStarsStats(client: ReturnType<typeof getSupabaseClient>, params: { month?: string }) {
    let query = client.from('habit_stars').select('categories');

    if (params.month) query = query.eq('month', params.month);

    const { data } = await query;

    const byCategory: Record<string, number> = {};
    data?.forEach(s => {
      if (s.categories && Array.isArray(s.categories)) {
        s.categories.forEach(cat => {
          byCategory[cat] = (byCategory[cat] || 0) + 1;
        });
      }
    });

    return { total: data?.length || 0, byCategory };
  }

  private async getTemplatesStats(client: ReturnType<typeof getSupabaseClient>) {
    const { data } = await client.from('habit_goal_templates').select('category');

    const byCategory: Record<string, number> = {};
    data?.forEach(g => {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
    });

    return { total: data?.length || 0, byCategory };
  }

  /**
   * 获取班级统计
   */
  async getClassStatistics(params: {
    grade?: string;
    month?: string;
  }): Promise<ServiceResult<Record<string, unknown>[]>> {
    try {
      const client = getSupabaseClient();
      const month = params.month || new Date().toISOString().slice(0, 7);

      // 获取班级列表
      let classQuery = client
        .from('classes')
        .select('id, name, grade, grade_name, class_number, head_teacher_name, student_count, status')
        .eq('status', 'active')
        .order('grade')
        .order('class_number');

      if (params.grade && params.grade !== 'all') {
        classQuery = classQuery.eq('grade', parseInt(params.grade));
      }

      const { data: classes } = await classQuery;

      if (!classes || classes.length === 0) {
        return { success: true, data: [] };
      }

      const classIds = classes.map(c => c.id);

      // 获取统计数据
      const [goalsResult, goalTemplatesResult] = await Promise.all([
        client.from('habit_student_goals').select('id, class_id, status, approval_status, goal_template_id').in('class_id', classIds).eq('month', month),
        client.from('habit_goal_templates').select('id, category'),
      ]);

      const goals = goalsResult.data || [];
      const goalTemplates = goalTemplatesResult.data || [];
      const goalCategoryMap: Record<string, string> = {};
      goalTemplates.forEach(gt => { goalCategoryMap[gt.id] = gt.category; });

      // 按班级聚合
      const classStatsMap: Record<string, { goalsTotal: number; goalsApproved: number; goalsByCategory: Record<string, number> }> = {};
      classIds.forEach(id => {
        classStatsMap[id] = { goalsTotal: 0, goalsApproved: 0, goalsByCategory: {} };
      });

      goals.forEach(g => {
        if (classStatsMap[g.class_id]) {
          classStatsMap[g.class_id].goalsTotal++;
          if (g.approval_status === 'approved') classStatsMap[g.class_id].goalsApproved++;
          const category = g.goal_template_id ? goalCategoryMap[g.goal_template_id] : null;
          if (category) {
            classStatsMap[g.class_id].goalsByCategory[category] = (classStatsMap[g.class_id].goalsByCategory[category] || 0) + 1;
          }
        }
      });

      const result = classes.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        gradeName: c.grade_name,
        classNumber: c.class_number,
        headTeacherName: c.head_teacher_name,
        studentCount: c.student_count || 0,
        status: c.status,
        habitStats: {
          goalsTotal: classStatsMap[c.id].goalsTotal,
          goalsApproved: classStatsMap[c.id].goalsApproved,
          goalsByCategory: classStatsMap[c.id].goalsByCategory,
        },
      }));

      return { success: true, data: result };
    } catch (err) {
      console.error('Get class statistics error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// ==================== 规则配置服务 ====================

export class HabitRuleService extends BaseService {
  /**
   * 获取规则配置
   */
  async getList(params: {
    academicYear?: string;
    semester?: string;
  }): Promise<ServiceResult<HabitSystemRule[]>> {
    try {
      const client = getSupabaseClient();

      let query = client.from('habit_system_rules').select('*').order('created_at', { ascending: false });

      if (params.academicYear) query = query.eq('academic_year', params.academicYear);
      if (params.semester) query = query.eq('semester', params.semester);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const formattedData: HabitSystemRule[] = (data || []).map(r => ({
        id: r.id,
        academicYear: r.academic_year,
        semester: r.semester,
        startDate: r.start_date,
        endDate: r.end_date,
        monthlyDeadline: r.monthly_deadline,
        checkFrequency: r.check_frequency,
        makeUpDays: r.make_up_days,
        passThreshold: r.pass_threshold,
        starQuotaPerClass: r.star_quota_per_class,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return { success: true, data: formattedData };
    } catch (err) {
      console.error('Get rules error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 保存规则配置
   */
  async upsert(data: Partial<HabitSystemRule>): Promise<ServiceResult<HabitSystemRule>> {
    try {
      const client = getSupabaseClient();

      if (!data.academicYear || !data.semester || !data.startDate || !data.endDate) {
        return { success: false, error: '学年、学期、开始日期、结束日期为必填项', code: 'VALIDATION_ERROR' };
      }

      const { data: result, error } = await client
        .from('habit_system_rules')
        .upsert({
          academic_year: data.academicYear,
          semester: data.semester,
          start_date: data.startDate,
          end_date: data.endDate,
          monthly_deadline: data.monthlyDeadline || 25,
          check_frequency: data.checkFrequency || 'daily',
          make_up_days: data.makeUpDays || 3,
          pass_threshold: data.passThreshold || 80,
          star_quota_per_class: data.starQuotaPerClass || 5,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'academic_year,semester' })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          id: result.id,
          academicYear: result.academic_year,
          semester: result.semester,
          startDate: result.start_date,
          endDate: result.end_date,
          monthlyDeadline: result.monthly_deadline,
          checkFrequency: result.check_frequency,
          makeUpDays: result.make_up_days,
          passThreshold: result.pass_threshold,
          starQuotaPerClass: result.star_quota_per_class,
          isActive: result.is_active,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        },
      };
    } catch (err) {
      console.error('Save rule error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// 导出单例
export const habitGoalTemplateService = new HabitGoalTemplateService();
export const monthlyGoalService = new MonthlyGoalService();
export const habitRecordExtService = new HabitRecordExtService();
export const habitStarExtService = new HabitStarExtService();
export const habitStatisticsService = new HabitStatisticsService();
export const habitRuleService = new HabitRuleService();
