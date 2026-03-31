/**
 * 德育活动提交列表 API
 * 
 * GET: 获取提交列表
 * POST: 创建提交
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import type { MoralActivitySubmissionService } from '@/services/moral.service';

/**
 * GET: 获取提交列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId') || undefined;
  const studentId = searchParams.get('studentId') || undefined;

  try {
    const submissionService = getService<MoralActivitySubmissionService>(SERVICE_IDENTIFIERS.MoralActivitySubmissionService);
    
    const result = await submissionService.getList({
      activityId,
      studentId,
    });
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    const formattedData = (result.data || []).map((s: unknown) => {
      const item = s as Record<string, unknown>;
      return {
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
      };
    });
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取提交列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建提交
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const submissionService = getService<MoralActivitySubmissionService>(SERVICE_IDENTIFIERS.MoralActivitySubmissionService);
    const body = await request.json();
    
    if (!body.activityId || !body.submitterId) {
      return fail('缺少必要参数');
    }
    
    const result = await submissionService.create({
      activityId: body.activityId,
      submitterId: body.submitterId,
      submitterName: body.submitterName,
      classId: body.classId,
      className: body.className,
      content: body.content,
      attachments: body.attachments || [],
      status: 'pending',
    });
    
    if (!result.success) {
      return fail(result.error || '提交失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('创建提交失败:', error);
    return serverError('服务器错误');
  }
});
