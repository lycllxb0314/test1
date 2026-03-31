/**
 * 考试详情 API
 * 
 * GET: 获取考试详情
 * PUT: 更新考试
 * DELETE: 删除考试
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, notFound, serverError } from '@/lib/api';
import type { ExamService } from '@/services/exam.service';

/**
 * GET: 获取考试详情
 */
export const GET = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    
    const result = await examService.getDetail(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('考试不存在');
      }
      return fail(result.error || '获取考试详情失败');
    }
    
    const item = result.data as unknown as Record<string, unknown>;
    
    return ok({
      id: item.id,
      name: item.name,
      type: item.type,
      semester: item.semester,
      grade: item.grade,
      subject: item.subject,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      totalScore: item.totalScore,
      passingScore: item.passingScore,
      description: item.description,
      participantCount: item.participantCount,
      statistics: item.statistics,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (error) {
    console.error('获取考试详情失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新考试
 */
export const PUT = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    const body = await request.json();
    
    const result = await examService.update(id as string, body);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('考试不存在');
      }
      return fail(result.error || '更新考试失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('更新考试失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * DELETE: 删除考试
 */
export const DELETE = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const examService = getService<ExamService>(SERVICE_IDENTIFIERS.ExamService);
    
    const result = await examService.delete(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('考试不存在');
      }
      return fail(result.error || '删除考试失败');
    }
    
    return ok({ id: id as string, message: '删除成功' });
  } catch (error) {
    console.error('删除考试失败:', error);
    return serverError('服务器错误');
  }
});
