/**
 * 班级周评比 API
 * 
 * GET: 查询周评比
 * POST: 生成周评比
 * 
 * @module app/api/weekly-evaluations/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { classRoutineService } from '@/services/class-routine.service';
import type { WeeklyEvaluationQueryParams } from '@/types/class-routine';

/**
 * GET - 查询周评比
 * 
 * Query params:
 * - classId: 班级ID
 * - grade: 年级
 * - academicYear: 学年
 * - weekNumber: 周次
 * - latest: 是否获取最新
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  
  const classId = searchParams.get('classId') || undefined;
  const gradeParam = searchParams.get('grade');
  const academicYear = searchParams.get('academicYear') || undefined;
  const weekNumberParam = searchParams.get('weekNumber');
  const latest = searchParams.get('latest') === 'true';

  const params: WeeklyEvaluationQueryParams = {
    classId,
    grade: gradeParam ? parseInt(gradeParam) : undefined,
    academicYear,
    weekNumber: weekNumberParam ? parseInt(weekNumberParam) : undefined,
  };

  // 获取最新周评比
  if (latest && classId) {
    const evaluations = await classRoutineService.queryScores({ classId });
    // TODO: 实现获取最新周评比逻辑
    return NextResponse.json(success([], 'database'));
  }

  // 获取年级排名
  if (params.grade && params.academicYear && params.weekNumber) {
    const result = await classRoutineService.getGradeWeeklyRankings(
      params.grade,
      params.academicYear,
      params.weekNumber
    );

    if (!result.success) {
      return NextResponse.json(error(result.error || '查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  }

  // 查询班级周评比
  if (classId && academicYear && params.weekNumber) {
    const result = await classRoutineService.getClassWeeklySummary(
      classId,
      academicYear,
      params.weekNumber
    );

    if (!result.success) {
      return NextResponse.json(error(result.error || '查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  }

  return NextResponse.json(success([], 'database'));
});

/**
 * POST - 生成周评比
 * 
 * Body:
 * - grade: 年级 (必填)
 * - academicYear: 学年 (必填)
 * - weekNumber: 周次 (必填)
 * - weekStartDate: 周开始日期 (必填)
 * - weekEndDate: 周结束日期 (必填)
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    // 权限检查：只有德育副校长、德育主任可以生成周评比
    const allowedRoles = ['moral_vice_principal', 'moral_director'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(error('无权限执行此操作', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const body = await request.json();
    
    // 验证必填字段
    if (!body.grade || !body.academicYear || !body.weekNumber || !body.weekStartDate || !body.weekEndDate) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await classRoutineService.generateWeeklyEvaluation(
      body.grade,
      body.academicYear,
      body.weekNumber,
      body.weekStartDate,
      body.weekEndDate
    );

    if (!result.success) {
      return NextResponse.json(error(result.error || '生成失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('生成周评比失败:', err);
    return NextResponse.json(error('生成失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
