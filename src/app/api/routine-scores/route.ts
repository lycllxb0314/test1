/**
 * 班级常规评分 API
 * 
 * GET: 查询评分记录
 * POST: 创建评分记录
 * 
 * @module app/api/routine-scores/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { classRoutineService } from '@/services/class-routine.service';

/**
 * GET - 查询评分记录
 * 
 * Query params:
 * - classId: 班级ID
 * - grade: 年级
 * - date: 日期
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - category: 评分维度
 * - teacherId: 教师ID
 * - summary: 是否返回汇总统计
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  
  const classId = searchParams.get('classId') || undefined;
  const gradeParam = searchParams.get('grade');
  const date = searchParams.get('date') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const category = searchParams.get('category') as RoutineScoreCategory | null;
  const teacherId = searchParams.get('teacherId') || undefined;
  const needSummary = searchParams.get('summary') === 'true';

  const grade = gradeParam ? parseInt(gradeParam) : undefined;

  const params: RoutineScoreQueryParams = {
    classId,
    grade,
    date,
    startDate,
    endDate,
    category: category || undefined,
    teacherId,
  };

  // 获取评分记录
  const scoresResult = await classRoutineService.queryScores(params);
  
  if (!scoresResult.success) {
    return NextResponse.json(error(scoresResult.error || '查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }

  const scores = scoresResult.data || [];

  // 如果需要汇总
  if (needSummary) {
    // 获取统计数据
    const statsResult = await classRoutineService.getStatistics(params);
    
    // 按班级汇总排名
    const classRankingMap = new Map<string, {
      classId: string;
      className: string;
      grade: number;
      totalScore: number;
      count: number;
    }>();

    for (const score of scores) {
      const existing = classRankingMap.get(score.classId) || {
        classId: score.classId,
        className: '',
        grade: score.grade,
        totalScore: 0,
        count: 0,
      };
      existing.totalScore += score.score;
      existing.count += 1;
      classRankingMap.set(score.classId, existing);
    }

    // 计算平均分并排序
    const classRanking = Array.from(classRankingMap.values())
      .map(c => ({
        ...c,
        avgScore: c.count > 0 ? c.totalScore / c.count : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // 按年级和维度汇总
    const byCategory: Record<string, { totalScore: number; count: number }> = {};
    const byGrade: Record<number, { totalScore: number; count: number }> = {};

    for (const score of scores) {
      // 按维度
      if (!byCategory[score.category]) {
        byCategory[score.category] = { totalScore: 0, count: 0 };
      }
      byCategory[score.category].totalScore += score.score;
      byCategory[score.category].count += 1;

      // 按年级
      if (!byGrade[score.grade]) {
        byGrade[score.grade] = { totalScore: 0, count: 0 };
      }
      byGrade[score.grade].totalScore += score.score;
      byGrade[score.grade].count += 1;
    }

    return NextResponse.json(success({
      data: scores,
      summary: {
        totalRecords: scores.length,
        byCategory,
        byGrade,
        classRanking,
      },
    }, 'database'));
  }

  return NextResponse.json(success(scores, 'database'));
});

// 导入类型
import type { RoutineScoreCategory, RoutineScoreQueryParams } from '@/types/class-routine';

/**
 * POST - 创建评分记录
 * 
 * Body:
 * - classId: 班级ID (必填)
 * - grade: 年级 (必填)
 * - date: 日期 (必填)
 * - scores: 评分数组 [{ category, score, maxScore? }] (批量)
 * - 或单独: category, score, maxScore?, remark?
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.classId || !body.grade || !body.date) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    // 批量创建
    if (body.scores && Array.isArray(body.scores)) {
      if (body.scores.length === 0) {
        return NextResponse.json(error('评分数组不能为空', ErrorCode.BAD_REQUEST), { status: 400 });
      }

      const result = await classRoutineService.batchCreateScores({
        classId: body.classId,
        grade: body.grade,
        date: body.date,
        scores: body.scores,
        teacherId: user.id,
        teacherName: user.name,
      });

      if (!result.success) {
        return NextResponse.json(error(result.error || '创建失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }

      return NextResponse.json(success(result.data, 'database'));
    }

    // 单条创建
    if (!body.category || body.score === undefined) {
      return NextResponse.json(error('缺少评分维度或分数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await classRoutineService.createScore({
      classId: body.classId,
      grade: body.grade,
      date: body.date,
      category: body.category,
      score: body.score,
      maxScore: body.maxScore,
      teacherId: user.id,
      teacherName: user.name,
      remark: body.remark,
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '创建失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('创建评分记录失败:', err);
    return NextResponse.json(error('创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
