/**
 * 习惯培养 Service
 * 
 * 提供习惯培养业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/habit.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import type {
  IHabitGoalRepository,
  IStudentHabitGoalRepository,
  IHabitRecordRepository,
  IHabitStarRepository,
  HabitQueryOptions,
} from '@/lib/di/interfaces';
import type {
  HabitGoal,
  HabitCategory,
  HabitGoalType,
  StudentHabitGoal,
  HabitRecord,
  HabitStar,
} from '@/types/habit';

/**
 * 习惯目标 Service 类
 */
export class HabitGoalService extends BaseService {
  /**
   * 获取习惯目标 Repository（通过 DI 容器）
   */
  private get habitGoalRepository(): IHabitGoalRepository {
    return getService(SERVICE_IDENTIFIERS.HabitGoalRepository);
  }

  /**
   * 获取目标列表
   */
  async getList(options: HabitQueryOptions = {}): Promise<ServiceResult<HabitGoal[]>> {
    try {
      const filters = options.filters || {};
      if (filters.isActive === true) {
        const goals = await this.habitGoalRepository.findActive();
        return this.ok(goals);
      }
      if (filters.category) {
        const goals = await this.habitGoalRepository.findByCategory(filters.category as HabitCategory);
        return this.ok(goals);
      }
      const goals = await this.habitGoalRepository.findAll();
      return this.ok(goals);
    } catch (error) {
      return this.fail('获取习惯目标列表失败', 'FETCH_ERROR');
    }
  }

  /**
   * 获取分页目标列表
   */
  async getPaginated(options: HabitQueryOptions = {}): Promise<PaginatedServiceResult<HabitGoal>> {
    try {
      const result = await this.habitGoalRepository.findPaginated(options);
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
    } catch (error) {
      return {
        success: false,
        error: '获取习惯目标列表失败',
      };
    }
  }

  /**
   * 根据ID获取目标
   */
  async getById(id: string): Promise<ServiceResult<HabitGoal>> {
    const goal = await this.habitGoalRepository.findById(id);
    if (!goal) {
      return this.fail('习惯目标不存在', 'NOT_FOUND');
    }
    return this.ok(goal);
  }

  /**
   * 创建目标
   */
  async create(data: Partial<HabitGoal>): Promise<ServiceResult<HabitGoal>> {
    if (!data.name || !data.category) {
      return this.fail('目标名称和分类不能为空', 'VALIDATION_ERROR');
    }

    const goal = await this.habitGoalRepository.create({
      ...data,
      isActive: data.isActive ?? true,
    });

    if (!goal) {
      return this.fail('创建习惯目标失败', 'CREATE_ERROR');
    }

    return this.ok(goal);
  }

  /**
   * 更新目标
   */
  async update(id: string, data: Partial<HabitGoal>): Promise<ServiceResult<HabitGoal>> {
    const existing = await this.habitGoalRepository.findById(id);
    if (!existing) {
      return this.fail('习惯目标不存在', 'NOT_FOUND');
    }

    const goal = await this.habitGoalRepository.update(id, data);
    if (!goal) {
      return this.fail('更新习惯目标失败', 'UPDATE_ERROR');
    }

    return this.ok(goal);
  }

  /**
   * 删除目标
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.habitGoalRepository.findById(id);
    if (!existing) {
      return this.fail('习惯目标不存在', 'NOT_FOUND');
    }

    const success = await this.habitGoalRepository.delete(id);
    if (!success) {
      return this.fail('删除习惯目标失败', 'DELETE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 学生习惯目标 Service 类
 */
export class StudentHabitGoalService extends BaseService {
  /**
   * 获取学生习惯目标 Repository（通过 DI 容器）
   */
  private get studentHabitGoalRepository(): IStudentHabitGoalRepository {
    return getService(SERVICE_IDENTIFIERS.StudentHabitGoalRepository);
  }

  /**
   * 根据学生获取目标
   */
  async getByStudent(studentId: string): Promise<ServiceResult<StudentHabitGoal[]>> {
    const goals = await this.studentHabitGoalRepository.findByStudent(studentId);
    return this.ok(goals);
  }

  /**
   * 根据目标获取学生
   */
  async getByGoal(goalId: string): Promise<ServiceResult<StudentHabitGoal[]>> {
    const students = await this.studentHabitGoalRepository.findByGoal(goalId);
    return this.ok(students);
  }

  /**
   * 分配目标给学生
   */
  async assign(studentId: string, goalId: string): Promise<ServiceResult<StudentHabitGoal>> {
    const assignment = await this.studentHabitGoalRepository.create({
      studentId,
      goalId,
      status: 'active',
      month: new Date().toISOString().slice(0, 7),
    } as Partial<StudentHabitGoal>);

    if (!assignment) {
      return this.fail('分配失败', 'ASSIGN_ERROR');
    }

    return this.ok(assignment);
  }
}

/**
 * 习惯记录 Service 类
 */
export class HabitRecordService extends BaseService {
  /**
   * 获取习惯记录 Repository（通过 DI 容器）
   */
  private get habitRecordRepository(): IHabitRecordRepository {
    return getService(SERVICE_IDENTIFIERS.HabitRecordRepository);
  }

  /**
   * 根据学生和日期获取记录
   */
  async getByStudent(studentId: string, date: string): Promise<ServiceResult<HabitRecord[]>> {
    const records = await this.habitRecordRepository.findByStudent(studentId, date);
    return this.ok(records);
  }

  /**
   * 根据日期获取记录
   */
  async getByDate(date: string): Promise<ServiceResult<HabitRecord[]>> {
    const records = await this.habitRecordRepository.findByDate(date);
    return this.ok(records);
  }

  /**
   * 记录习惯
   */
  async record(studentId: string, goalId: string, value: number, date: string): Promise<ServiceResult<HabitRecord>> {
    const record = await this.habitRecordRepository.create({
      studentId,
      goalId,
      date,
      value,
      recordedAt: new Date().toISOString(),
    } as Partial<HabitRecord>);

    if (!record) {
      return this.fail('记录失败', 'RECORD_ERROR');
    }

    return this.ok(record);
  }
}

/**
 * 习惯之星 Service 类
 */
export class HabitStarService extends BaseService {
  /**
   * 获取习惯之星 Repository（通过 DI 容器）
   */
  private get habitStarRepository(): IHabitStarRepository {
    return getService(SERVICE_IDENTIFIERS.HabitStarRepository);
  }

  /**
   * 根据学生获取星星
   */
  async getByStudent(studentId: string): Promise<ServiceResult<HabitStar[]>> {
    const stars = await this.habitStarRepository.findByStudent(studentId);
    return this.ok(stars);
  }

  /**
   * 根据日期获取星星
   */
  async getByDate(date: string): Promise<ServiceResult<HabitStar[]>> {
    const stars = await this.habitStarRepository.findByDate(date);
    return this.ok(stars);
  }

  /**
   * 授予星星
   */
  async award(studentId: string, month: string, totalStars: number): Promise<ServiceResult<HabitStar>> {
    const star = await this.habitStarRepository.create({
      studentId,
      month,
      totalStars,
      level: 1,
    } as Partial<HabitStar>);

    if (!star) {
      return this.fail('授予失败', 'AWARD_ERROR');
    }

    return this.ok(star);
  }
}

// 导出单例
export const habitGoalService = new HabitGoalService();
export const studentHabitGoalService = new StudentHabitGoalService();
export const habitRecordService = new HabitRecordService();
export const habitStarService = new HabitStarService();
