/**
 * 德育活动提交详情 API
 * 
 * GET: 获取提交详情
 * PUT: 更新提交（审核）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, notFound, serverError } from '@/lib/api';
import type { MoralActivitySubmissionService } from '@/services/moral.service';

/**
 * GET: 获取提交详情
 */
export const GET = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const submissionService = getService<MoralActivitySubmissionService>(SERVICE_IDENTIFIERS.MoralActivitySubmissionService);
    
    const result = await submissionService.getById(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('提交不存在');
      }
      return fail(result.error || '获取提交详情失败');
    }
    
    const item = result.data as unknown as Record<string, unknown>;
    
    return ok({
      id: item.id,
      activityId: item.activityId,
      activityTitle: item.activityTitle,
      submitterId: item.submitterId,
      submitterName: item.submitterName,
      classId: item.classId,
      className: item.className,
      content: item.content,
      attachments: item.attachments || [],
      status: item.status,
      submittedAt: item.submittedAt,
      reviewedAt: item.reviewedAt,
      reviewerId: item.reviewerId,
      reviewerName: item.reviewerName,
      reviewComment: item.reviewComment,
    });
  } catch (error) {
    console.error('获取提交详情失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新提交（审核）
 */
export const PUT = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const submissionService = getService<MoralActivitySubmissionService>(SERVICE_IDENTIFIERS.MoralActivitySubmissionService);
    const body = await request.json();
    
    const result = await submissionService.update(id as string, {
      status: body.status,
      reviewerId: body.reviewerId,
      reviewerName: body.reviewerName,
      reviewComment: body.reviewComment,
      reviewedAt: new Date().toISOString(),
    });
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('提交不存在');
      }
      return fail(result.error || '审核失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('审核提交失败:', error);
    return serverError('服务器错误');
  }
});
