/**
 * 习惯培养 Service
 * 
 * 提供习惯培养业务逻辑处理
 * 
 * @module services/habit.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  habitGoalRepository,
  studentHabitGoalRepository,
  habitRecordRepository,
  habitStarRepository,
  HabitQueryOptions,
  HabitGoal,
  StudentHabitGoal,
  HabitRecord,
  HabitStar,
  HabitCategory,
} from '@/repositories/habit.repository';

/**
 * 习惯目标 Service
 */
export class HabitGoalService extends BaseService {
  /**
   * 获取分页列表
   */
  async getPaginated(
    options: HabitQueryOptions = {}
  ): Promise<PaginatedServiceResult<HabitGoal>> {
    try {
      const result = await habitGoalRepository.findPaginated(options);
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
      return { success: false, error: '获取习惯目标列表失败' };
    }
  }

  /**
   * 获取活跃目标
   */
  async getActive(): Promise<ServiceResult<HabitGoal[]>> {
    const goals = await habitGoalRepository.findActive();
    return this.ok(goals);
  }

  /**
   * 根据类别获取
   */
  async getByCategory(category: HabitCategory): Promise<ServiceResult<HabitGoal[]>> {
    const goals = await habitGoalRepository.findByCategory(category);
    return this.ok(goals);
  }

  /**
   * 根据ID获取
   */
  async getById(id: string): Promise<ServiceResult<HabitGoal>> {
    const goal = await habitGoalRepository.findById(id);
    if (!goal) {
      return this.fail('习惯目标不存在', 'NOT_FOUND');
    }
    return this.ok(goal);
  }

  /**
   * 创建目标
   */
  async create(data: Partial<HabitGoal>): Promise<ServiceResult<HabitGoal>> {
    if (!data.name || !data.category || !data.type) {
      return this.fail('目标名称、类别和类型不能为空', 'VALIDATION_ERROR');
    }

    const goal = await habitGoalRepository.create({
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
    const goal = await habitGoalRepository.update(id, data);
    if (!goal) {
      return this.fail('更新习惯目标失败', 'UPDATE_ERROR');
    }
    return this.ok(goal);
  }

  /**
   * 删除目标
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await habitGoalRepository.delete(id);
    if (!success) {
      return this.fail('删除习惯目标失败', 'DELETE_ERROR');
    }
    return this.ok();
  }
}

/**
 * 学生习惯目标 Service
 */
export class StudentHabitGoalService extends BaseService {
  /**
   * 根据学生获取
   */
  async getByStudent(studentId: string): Promise<ServiceResult<StudentHabitGoal[]>> {
    const goals = await studentHabitGoalRepository.findByStudent(studentId);
    return this.ok(goals);
  }

  /**
   * 根据班级和月份获取
   */
  async getByClassAndMonth(
    classId: string,
    month: string
  ): Promise<ServiceResult<StudentHabitGoal[]>> {
    const goals = await studentHabitGoalRepository.findByClassAndMonth(classId, month);
    return this.ok(goals);
  }

  /**
   * 创建学生目标
   */
  async create(data: Partial<StudentHabitGoal>): Promise<ServiceResult<StudentHabitGoal>> {
    if (!data.studentId || !data.goalId || !data.month) {
      return this.fail('学生ID、目标ID和月份不能为空', 'VALIDATION_ERROR');
    }

    const goal = await studentHabitGoalRepository.create({
      ...data,
      currentValue: data.currentValue || 0,
      status: data.status || 'active',
    });

    if (!goal) {
      return this.fail('创建学生习惯目标失败', 'CREATE_ERROR');
    }

    return this.ok(goal);
  }

  /**
   * 更新进度
   */
  async updateProgress(id: string, value: number): Promise<ServiceResult<StudentHabitGoal>> {
    const goal = await studentHabitGoalRepository.findById(id);
    if (!goal) {
      return this.fail('学生习惯目标不存在', 'NOT_FOUND');
    }

    const newValue = goal.currentValue + value;
    const status = newValue >= goal.targetValue ? 'completed' : 'active';

    const updated = await studentHabitGoalRepository.update(id, {
      currentValue: newValue,
      status,
    });

    if (!updated) {
      return this.fail('更新进度失败', 'UPDATE_ERROR');
    }

    return this.ok(updated);
  }
}

/**
 * 习惯记录 Service
 */
export class HabitRecordService extends BaseService {
  /**
   * 根据学生获取
   */
  async getByStudent(studentId: string): Promise<ServiceResult<HabitRecord[]>> {
    const records = await habitRecordRepository.findByStudent(studentId);
    return this.ok(records);
  }

  /**
   * 根据日期获取
   */
  async getByDate(date: string): Promise<ServiceResult<HabitRecord[]>> {
    const records = await habitRecordRepository.findByDate(date);
    return this.ok(records);
  }

  /**
   * 根据学生和日期范围获取
   */
  async getByStudentAndDateRange(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<HabitRecord[]>> {
    const records = await habitRecordRepository.findByStudentAndDateRange(
      studentId,
      startDate,
      endDate
    );
    return this.ok(records);
  }

  /**
   * 记录习惯
   */
  async record(data: Partial<HabitRecord>): Promise<ServiceResult<HabitRecord>> {
    if (!data.studentId || !data.goalId || !data.date) {
      return this.fail('学生ID、目标ID和日期不能为空', 'VALIDATION_ERROR');
    }

    const record = await habitRecordRepository.create({
      ...data,
      value: data.value || 1,
    });

    if (!record) {
      return this.fail('记录失败', 'CREATE_ERROR');
    }

    return this.ok(record);
  }

  /**
   * 获取学生某目标月度统计
   */
  async getMonthlyTotal(
    studentId: string,
    goalId: string,
    month: string
  ): Promise<ServiceResult<number>> {
    const total = await habitRecordRepository.getMonthlyTotal(studentId, goalId, month);
    return this.ok(total);
  }
}

/**
 * 习惯星星 Service
 */
export class HabitStarService extends BaseService {
  /**
   * 根据学生获取
   */
  async getByStudent(studentId: string): Promise<ServiceResult<HabitStar[]>> {
    const stars = await habitStarRepository.findByStudent(studentId);
    return this.ok(stars);
  }

  /**
   * 根据班级和月份获取
   */
  async getByClassAndMonth(
    classId: string,
    month: string
  ): Promise<ServiceResult<HabitStar[]>> {
    const stars = await habitStarRepository.findByClassAndMonth(classId, month);
    return this.ok(stars);
  }

  /**
   * 获取班级排行
   */
  async getClassRanking(
    classId: string,
    month: string
  ): Promise<ServiceResult<HabitStar[]>> {
    const ranking = await habitStarRepository.getClassRanking(classId, month);
    return this.ok(ranking);
  }

  /**
   * 更新学生星星
   */
  async updateStars(
    studentId: string,
    month: string,
    stars: number
  ): Promise<ServiceResult<HabitStar>> {
    const result = await habitStarRepository.updateStars(studentId, month, stars);
    if (!result) {
      return this.fail('更新星星失败', 'UPDATE_ERROR');
    }
    return this.ok(result);
  }

  /**
   * 计算并更新学生月度星星
   */
  async calculateMonthlyStars(
    studentId: string,
    studentName: string,
    classId: string,
    className: string,
    month: string
  ): Promise<ServiceResult<HabitStar>> {
    // 获取学生当月所有目标
    const studentGoals = await studentHabitGoalRepository.findByStudentAndMonth(
      studentId,
      month
    );

    // 计算总星星
    let totalStars = 0;
    for (const goal of studentGoals) {
      if (goal.status === 'completed') {
        // 获取目标信息获取积分
        const goalInfo = await habitGoalRepository.findById(goal.goalId);
        if (goalInfo) {
          totalStars += goalInfo.points;
        }
      }
    }

    // 更新星星记录
    const result = await habitStarRepository.updateStars(studentId, month, totalStars);
    if (!result) {
      return this.fail('计算星星失败', 'CALCULATE_ERROR');
    }

    return this.ok(result);
  }
}

// 导出单例
export const habitGoalService = new HabitGoalService();
export const studentHabitGoalService = new StudentHabitGoalService();
export const habitRecordService = new HabitRecordService();
export const habitStarService = new HabitStarService();
