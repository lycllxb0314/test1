/**
 * 审批实例 API - 重构版
 * 
 * GET: 获取审批列表（我发起的/待我审批的/我已处理的）
 * POST: 提交新的审批申请
 * 
 * 路由层职责：
 * - 解析请求参数
 * - 调用 Service 层
 * - 格式化响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { User } from '@/types';
import { ok, fail, serverError, paginated } from '@/lib/api';
import { approvalService, ApprovalListParams, SubmitApprovalParams } from '@/services/approval.service';

/**
 * GET /api/approvals
 * 
 * Query params:
 * - type: 'my' (我发起的) | 'pending' (待我审批的) | 'processed' (我已处理的)
 * - status: 筛选状态
 * - page: 页码
 * - pageSize: 每页数量
 * - department: 部门过滤
 */
const handleGetApprovals = async (
  request: NextRequest, 
  context: { user: User }
): Promise<NextResponse> => {
  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const params: ApprovalListParams = {
      type: (searchParams.get('type') as 'my' | 'pending' | 'processed') || 'pending',
      status: searchParams.get('status') || undefined,
      department: searchParams.get('department') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
    };

    // 调用服务层
    const result = await approvalService.getApprovalList(context.user.id, params);

    // 返回结果
    if (!result.success) {
      return fail(result.error || '查询失败');
    }

    return paginated(
      result.data || [],
      result.pagination?.total || 0,
      result.pagination?.page || 1,
      result.pagination?.pageSize || 10
    );

  } catch (error) {
    console.error('[Approvals API] GET error:', error);
    return serverError('获取审批列表失败');
  }
};

/**
 * POST /api/approvals
 * 
 * 提交新的审批申请
 * 支持类型：announcement, news, internal_notice, parent_notice
 */
const handleSubmitApproval = async (
  request: NextRequest,
  context: { user: User }
): Promise<NextResponse> => {
  try {
    // 解析请求体
    const body = await request.json();
    
    const params: SubmitApprovalParams = {
      title: body.title,
      summary: body.summary,
      content: body.content,
      type: body.type,
      category: body.category,
      mediaLevel: body.mediaLevel,
      department: body.department,
      coverImage: body.coverImage,
      images: body.images,
      attachments: body.attachments,
      isExternal: body.isExternal,
      scheduledPublishAt: body.scheduledPublishAt,
      autoUnpublish: body.autoUnpublish,
      autoUnpublishAt: body.autoUnpublishAt,
      isPinned: body.isPinned,
      recipients: body.recipients,
      customFlow: body.customFlow,
    };

    // 调用服务层
    const result = await approvalService.submitApproval(
      context.user.id,
      (context.user as any).name || context.user.id,
      params
    );

    // 返回结果
    if (!result.success) {
      return fail(result.error || '提交失败');
    }

    return ok(result.data, { message: result.data?.message });

  } catch (error) {
    console.error('[Approvals API] POST error:', error);
    return serverError('提交审批失败');
  }
};

export const GET = withAuth(handleGetApprovals);
export const POST = withAuth(handleSubmitApproval);
