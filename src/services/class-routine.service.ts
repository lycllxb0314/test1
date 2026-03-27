/**
 * 班级常规评比 Service
 * 
 * 业务逻辑：
 * 1. 值日老师每日按维度给班级打分
 * 2. 当天分数实时展示
 * 3. 每周汇总生成周评比结果
 * 
 * @module services/class-routine.service
 */

import { BaseService, type ServiceResult } from './base.service';
import { classRoutineRepository } from '@/repositories/class-routine.repository';
import { dutyTeacherRepository } from '@/repositories/duty-teacher.repository';
import { weeklyEvaluationRepository } from '@/repositories/weekly-evaluation.repository';
import type {
  ClassRoutineScore,
  DutyTeacher,
  ClassWeeklyEvaluation,
  ClassDailyScoreSummary,
  ClassWeeklyScoreSummary,
  RoutineScoreQueryParams,
  WeeklyEvaluationQueryParams,
  DutyTeacherQueryParams,
  CreateRoutineScoreParams,
  BatchCreateRoutineScoresParams,
  CreateDutyTeacherParams,
  UpdateDutyTeacherParams,
  RoutineScoreCategory,
} from '@/types/class-routine';
import { ROUTINE_SCORE_CATEGORIES, ROUTINE_CATEGORY_MAX_SCORES } from '@/types/class-routine';

/**
 * 班级常规评比 Service
 */
export class ClassRoutineService extends BaseService {
  // ==================== 评分记录业务 ====================

  /**
   * 查询评分记录
   */
  async queryScores(params: RoutineScoreQueryParams): Promise<ServiceResult<ClassRoutineScore[]>> {
    try {
      const scores = await classRoutineRepository.queryScores(params);
      return this.ok(scores);
    } catch (error) {
      console.error('[ClassRoutineService] queryScores error:', error);
      return this.fail('查询评分记录失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取班级日评分汇总
   */
  async getClassDailySummary(
    classId: string,
    date: string
  ): Promise<ServiceResult<ClassDailyScoreSummary | null>> {
    try {
      const summary = await classRoutineRepository.getClassDailySummary(classId, date);
      return this.ok(summary);
    } catch (error) {
      console.error('[ClassRoutineService] getClassDailySummary error:', error);
      return this.fail('获取班级日评分失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取多个班级的日评分汇总
   */
  async getClassesDailySummaries(
    classIds: string[],
    date: string
  ): Promise<ServiceResult<ClassDailyScoreSummary[]>> {
    try {
      const summaries = await classRoutineRepository.getClassesDailySummaries(classIds, date);
      return this.ok(summaries);
    } catch (error) {
      console.error('[ClassRoutineService] getClassesDailySummaries error:', error);
      return this.fail('获取班级日评分失败', 'QUERY_ERROR');
    }
  }

  /**
   * 创建评分记录
   */
  async createScore(params: CreateRoutineScoreParams): Promise<ServiceResult<ClassRoutineScore>> {
    try {
      // 设置默认满分
      const score = await classRoutineRepository.createScore({
        ...params,
        maxScore: params.maxScore ?? ROUTINE_CATEGORY_MAX_SCORES[params.category],
      });

      if (!score) {
        return this.fail('创建评分记录失败', 'CREATE_ERROR');
      }

      return this.ok(score);
    } catch (error) {
      console.error('[ClassRoutineService] createScore error:', error);
      return this.fail('创建评分记录失败', 'CREATE_ERROR');
    }
  }

  /**
   * 批量创建评分记录（值日老师给班级打分）
   */
  async batchCreateScores(
    params: BatchCreateRoutineScoresParams
  ): Promise<ServiceResult<ClassRoutineScore[]>> {
    try {
      // 设置默认满分
      const scoresWithMax = params.scores.map(s => ({
        ...s,
        maxScore: s.maxScore ?? ROUTINE_CATEGORY_MAX_SCORES[s.category],
      }));

      const scores = await classRoutineRepository.batchCreateScores({
        ...params,
        scores: scoresWithMax,
      });

      if (scores.length === 0 && params.scores.length > 0) {
        return this.fail('批量创建评分记录失败', 'CREATE_ERROR');
      }

      return this.ok(scores);
    } catch (error) {
      console.error('[ClassRoutineService] batchCreateScores error:', error);
      return this.fail('批量创建评分记录失败', 'CREATE_ERROR');
    }
  }

  /**
   * 删除评分记录
   */
  async deleteScore(id: string): Promise<ServiceResult<void>> {
    try {
      const success = await classRoutineRepository.deleteScore(id);
      if (!success) {
        return this.fail('删除评分记录失败', 'DELETE_ERROR');
      }
      return this.ok();
    } catch (error) {
      console.error('[ClassRoutineService] deleteScore error:', error);
      return this.fail('删除评分记录失败', 'DELETE_ERROR');
    }
  }

  /**
   * 获取评分统计
   */
  async getStatistics(params: RoutineScoreQueryParams): Promise<ServiceResult<{
    totalRecords: number;
    totalScore: number;
    avgScore: number;
    byCategory: Record<string, { totalScore: number; count: number; avgScore: number }>;
  }>> {
    try {
      const stats = await classRoutineRepository.getStatistics(params);
      return this.ok(stats);
    } catch (error) {
      console.error('[ClassRoutineService] getStatistics error:', error);
      return this.fail('获取统计数据失败', 'QUERY_ERROR');
    }
  }

  // ==================== 周评比业务 ====================

  /**
   * 获取班级周评分汇总
   */
  async getClassWeeklySummary(
    classId: string,
    academicYear: string,
    weekNumber: number
  ): Promise<ServiceResult<ClassWeeklyScoreSummary | null>> {
    try {
      const evaluation = await weeklyEvaluationRepository.getClassWeeklyEvaluation(
        classId,
        academicYear,
        weekNumber
      );

      if (!evaluation) {
        return this.ok(null);
      }

      const summary: ClassWeeklyScoreSummary = {
        classId: evaluation.classId,
        className: evaluation.className ?? '',
        grade: evaluation.grade,
        weekNumber: evaluation.weekNumber,
        weekStartDate: evaluation.weekStartDate,
        weekEndDate: evaluation.weekEndDate,
        dailyScores: [],
        categoryScores: evaluation.categoryScores,
        totalScore: evaluation.totalScore,
        avgScore: evaluation.totalScore / 5, // 假设一周5天
        rankInGrade: evaluation.rankInGrade ?? undefined,
        level: evaluation.level,
      };

      return this.ok(summary);
    } catch (error) {
      console.error('[ClassRoutineService] getClassWeeklySummary error:', error);
      return this.fail('获取周评分汇总失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取年级周评比排名
   */
  async getGradeWeeklyRankings(
    grade: number,
    academicYear: string,
    weekNumber: number
  ): Promise<ServiceResult<ClassWeeklyEvaluation[]>> {
    try {
      const evaluations = await weeklyEvaluationRepository.getGradeWeeklyRankings(
        grade,
        academicYear,
        weekNumber
      );
      return this.ok(evaluations);
    } catch (error) {
      console.error('[ClassRoutineService] getGradeWeeklyRankings error:', error);
      return this.fail('获取年级排名失败', 'QUERY_ERROR');
    }
  }

  /**
   * 生成周评比
   * 汇总一周的评分记录，生成周评比结果
   */
  async generateWeeklyEvaluation(
    grade: number,
    academicYear: string,
    weekNumber: number,
    weekStartDate: string,
    weekEndDate: string
  ): Promise<ServiceResult<ClassWeeklyEvaluation[]>> {
    try {
      // 1. 获取年级所有班级
      // 这里需要调用 classRepository 获取班级列表，暂时简化处理

      // 2. 获取一周的评分记录
      const scores = await classRoutineRepository.queryScores({
        grade,
        startDate: weekStartDate,
        endDate: weekEndDate,
      });

      if (scores.length === 0) {
        return this.fail('该周无评分记录', 'NO_DATA');
      }

      // 3. 按班级汇总
      const classScoresMap = new Map<string, {
        classId: string;
        grade: number;
        categoryScores: Record<RoutineScoreCategory, number>;
        totalScore: number;
      }>();

      for (const score of scores) {
        const existing = classScoresMap.get(score.classId) || {
          classId: score.classId,
          grade: score.grade,
          categoryScores: {
            '文明礼仪': 0,
            '遵守纪律': 0,
            '班容班貌': 0,
            '环境卫生': 0,
            '文体活动': 0,
            '学习习惯': 0,
          },
          totalScore: 0,
        };

        existing.categoryScores[score.category] += score.score;
        existing.totalScore += score.score;
        classScoresMap.set(score.classId, existing);
      }

      // 4. 创建周评比记录
      const evaluations: ClassWeeklyEvaluation[] = [];
      for (const classData of classScoresMap.values()) {
        const evaluation = await weeklyEvaluationRepository.upsertEvaluation({
          classId: classData.classId,
          grade: classData.grade,
          academicYear,
          weekNumber,
          weekStartDate,
          weekEndDate,
          categoryScores: classData.categoryScores,
          totalScore: classData.totalScore,
        });

        if (evaluation) {
          evaluations.push(evaluation);
        }
      }

      // 5. 更新排名
      const sortedEvaluations = evaluations.sort((a, b) => b.totalScore - a.totalScore);
      const rankings = sortedEvaluations.map((e, index) => ({
        classId: e.classId,
        rank: index + 1,
      }));

      await weeklyEvaluationRepository.updateGradeRankings(grade, academicYear, weekNumber, rankings);

      // 返回带排名的结果
      return this.ok(sortedEvaluations.map((e, index) => ({
        ...e,
        rankInGrade: index + 1,
      })));
    } catch (error) {
      console.error('[ClassRoutineService] generateWeeklyEvaluation error:', error);
      return this.fail('生成周评比失败', 'GENERATE_ERROR');
    }
  }

  // ==================== 值日教师业务 ====================

  /**
   * 查询值日教师
   */
  async queryDutyTeachers(params: DutyTeacherQueryParams): Promise<ServiceResult<DutyTeacher[]>> {
    try {
      const dutyTeachers = await dutyTeacherRepository.queryDutyTeachers(params);
      return this.ok(dutyTeachers);
    } catch (error) {
      console.error('[ClassRoutineService] queryDutyTeachers error:', error);
      return this.fail('查询值日教师失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取激活的值日教师
   */
  async getActiveDutyTeachers(): Promise<ServiceResult<DutyTeacher[]>> {
    try {
      const dutyTeachers = await dutyTeacherRepository.getActiveDutyTeachers();
      return this.ok(dutyTeachers);
    } catch (error) {
      console.error('[ClassRoutineService] getActiveDutyTeachers error:', error);
      return this.fail('获取值日教师失败', 'QUERY_ERROR');
    }
  }

  /**
   * 检查是否为值日教师
   */
  async isDutyTeacher(teacherId: string): Promise<ServiceResult<boolean>> {
    try {
      const isDuty = await dutyTeacherRepository.isDutyTeacher(teacherId);
      return this.ok(isDuty);
    } catch (error) {
      console.error('[ClassRoutineService] isDutyTeacher error:', error);
      return this.fail('检查值日教师状态失败', 'QUERY_ERROR');
    }
  }

  /**
   * 创建值日教师安排
   */
  async createDutyTeacher(params: CreateDutyTeacherParams): Promise<ServiceResult<DutyTeacher>> {
    try {
      const dutyTeacher = await dutyTeacherRepository.createDutyTeacher(params);

      if (!dutyTeacher) {
        return this.fail('创建值日教师安排失败', 'CREATE_ERROR');
      }

      return this.ok(dutyTeacher);
    } catch (error) {
      console.error('[ClassRoutineService] createDutyTeacher error:', error);
      return this.fail('创建值日教师安排失败', 'CREATE_ERROR');
    }
  }

  /**
   * 更新值日教师安排
   */
  async updateDutyTeacher(params: UpdateDutyTeacherParams): Promise<ServiceResult<DutyTeacher>> {
    try {
      const dutyTeacher = await dutyTeacherRepository.updateDutyTeacher(params);

      if (!dutyTeacher) {
        return this.fail('更新值日教师安排失败', 'UPDATE_ERROR');
      }

      return this.ok(dutyTeacher);
    } catch (error) {
      console.error('[ClassRoutineService] updateDutyTeacher error:', error);
      return this.fail('更新值日教师安排失败', 'UPDATE_ERROR');
    }
  }

  /**
   * 删除值日教师安排
   */
  async deleteDutyTeacher(id: string): Promise<ServiceResult<void>> {
    try {
      const success = await dutyTeacherRepository.deleteDutyTeacher(id);

      if (!success) {
        return this.fail('删除值日教师安排失败', 'DELETE_ERROR');
      }

      return this.ok();
    } catch (error) {
      console.error('[ClassRoutineService] deleteDutyTeacher error:', error);
      return this.fail('删除值日教师安排失败', 'DELETE_ERROR');
    }
  }
}

// 导出单例实例
export const classRoutineService = new ClassRoutineService();
