/**
 * 习惯培养 Repository
 * 
 * 提供习惯培养数据访问
 * 
 * @module repositories/habit.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  HabitGoal,
  StudentHabitGoal,
  HabitRecord,
  HabitStar,
  HabitCategory,
  HabitGoalType,
} from '@/types/habit';

// 导出类型供外部使用
export type { HabitGoal, StudentHabitGoal, HabitRecord, HabitStar, HabitCategory, HabitGoalType };

/**
 * 习惯查询选项
 */
export interface HabitQueryOptions extends QueryOptions {
  category?: HabitCategory;
  type?: HabitGoalType;
  isActive?: boolean;
}

/**
 * 习惯目标 Repository
 */
export class HabitGoalRepository extends BaseRepository<HabitGoal> {
  constructor() {
    super('habit_goals');
  }

  /**
   * 根据类别查询
   */
  async findByCategory(category: HabitCategory): Promise<HabitGoal[]> {
    return this.findWhere({ category });
  }

  /**
   * 查询活跃目标
   */
  async findActive(): Promise<HabitGoal[]> {
    return this.findWhere({ is_active: true });
  }

  /**
   * 分页查询
   */
  async findPaginated(options: HabitQueryOptions = {}): Promise<PaginatedResult<HabitGoal>> {
    const { category, type, isActive, ...baseOptions } = options;

    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };

    if (category) filters.category = category;
    if (type) filters.type = type;
    if (isActive !== undefined) filters.is_active = isActive;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }
}

/**
 * 学生习惯目标 Repository
 */
export class StudentHabitGoalRepository extends BaseRepository<StudentHabitGoal> {
  constructor() {
    super('student_habit_goals');
  }

  /**
   * 根据学生查询
   */
  async findByStudent(studentId: string): Promise<StudentHabitGoal[]> {
    return this.findWhere({ student_id: studentId });
  }

  /**
   * 根据班级和月份查询
   */
  async findByClassAndMonth(classId: string, month: string): Promise<StudentHabitGoal[]> {
    return this.findWhere({ class_id: classId, month });
  }

  /**
   * 根据学生和月份查询
   */
  async findByStudentAndMonth(
    studentId: string,
    month: string
  ): Promise<StudentHabitGoal[]> {
    return this.findWhere({ student_id: studentId, month });
  }
}

/**
 * 习惯记录 Repository
 */
export class HabitRecordRepository extends BaseRepository<HabitRecord> {
  constructor() {
    super('habit_records');
  }

  /**
   * 根据学生查询
   */
  async findByStudent(studentId: string): Promise<HabitRecord[]> {
    return this.findWhere({ student_id: studentId });
  }

  /**
   * 根据日期查询
   */
  async findByDate(date: string): Promise<HabitRecord[]> {
    return this.findWhere({ date });
  }

  /**
   * 根据学生和日期范围查询
   */
  async findByStudentAndDateRange(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitRecord[]> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error(`[${this.tableName}] findByStudentAndDateRange error:`, error.message);
      return [];
    }

    return (data || []) as HabitRecord[];
  }

  /**
   * 获取学生某目标在月份的总值
   */
  async getMonthlyTotal(
    studentId: string,
    goalId: string,
    month: string
  ): Promise<number> {
    const client = this.client;
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const { data, error } = await client
      .from(this.tableName)
      .select('value')
      .eq('student_id', studentId)
      .eq('goal_id', goalId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error || !data) {
      return 0;
    }

    return data.reduce((sum, item) => sum + (item.value || 0), 0);
  }
}

/**
 * 习惯星星 Repository
 */
export class HabitStarRepository extends BaseRepository<HabitStar> {
  constructor() {
    super('habit_stars');
  }

  /**
   * 根据学生查询
   */
  async findByStudent(studentId: string): Promise<HabitStar[]> {
    return this.findWhere({ student_id: studentId });
  }

  /**
   * 根据班级和月份查询
   */
  async findByClassAndMonth(classId: string, month: string): Promise<HabitStar[]> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('class_id', classId)
      .eq('month', month)
      .order('total_stars', { ascending: false });

    if (error) {
      console.error(`[${this.tableName}] findByClassAndMonth error:`, error.message);
      return [];
    }

    return (data || []) as HabitStar[];
  }

  /**
   * 更新学生星星
   */
  async updateStars(
    studentId: string,
    month: string,
    stars: number
  ): Promise<HabitStar | null> {
    const client = this.client;

    // 计算等级
    let level = 1;
    if (stars >= 100) level = 5;
    else if (stars >= 80) level = 4;
    else if (stars >= 60) level = 3;
    else if (stars >= 40) level = 2;

    const { data, error } = await client
      .from(this.tableName)
      .upsert(
        {
          student_id: studentId,
          month,
          total_stars: stars,
          level,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,month' }
      )
      .select()
      .single();

    if (error) {
      console.error(`[${this.tableName}] updateStars error:`, error.message);
      return null;
    }

    return data as HabitStar;
  }

  /**
   * 获取班级排行
   */
  async getClassRanking(classId: string, month: string): Promise<HabitStar[]> {
    const stars = await this.findByClassAndMonth(classId, month);

    // 添加排名
    return stars.map((star, index) => ({
      ...star,
      rank: index + 1,
    }));
  }
}

// 导出单例
export const habitGoalRepository = new HabitGoalRepository();
export const studentHabitGoalRepository = new StudentHabitGoalRepository();
export const habitRecordRepository = new HabitRecordRepository();
export const habitStarRepository = new HabitStarRepository();
