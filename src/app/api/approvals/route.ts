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

import { NextRequest } from 'next/server';
import { getUserFromSession } from '@/lib/auth/session';
import { ok, fail, serverError, paginated, unauthorized } from '@/lib/api';
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
export async function GET(request: NextRequest) {
  try {
    // 1. 身份验证
    const user = await getUserFromSession(request);
    if (!user) {
      return unauthorized('未登录，请先登录');
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const params: ApprovalListParams = {
      type: (searchParams.get('type') as 'my' | 'pending' | 'processed') || 'pending',
      status: searchParams.get('status') || undefined,
      department: searchParams.get('department') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
    };

    // 3. 调用服务层
    const result = await approvalService.getApprovalList(user.id, params);

    // 4. 返回结果
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
}

/**
 * POST /api/approvals
 * 
 * 提交新的审批申请
 * 支持类型：announcement, news, internal_notice, parent_notice
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const user = await getUserFromSession(request);
    if (!user) {
      return unauthorized('未登录，请先登录');
    }

    // 2. 解析请求体
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

    // 3. 调用服务层
    const result = await approvalService.submitApproval(
      user.id,
      (user as any).name || user.id,
      params
    );

    // 4. 返回结果
    if (!result.success) {
      return fail(result.error || '提交失败');
    }

    return ok(result.data, { message: result.data?.message });

  } catch (error) {
    console.error('[Approvals API] POST error:', error);
    return serverError('提交审批失败');
  }
}

/**
 * 重构对比：
 * 
 * 原版：1136 行
 * - 200+ 行数据库查询
 * - 300+ 行业务逻辑
 * - 200+ 行数据映射
 * - 200+ 行通知发送
 * - 所有代码混在一起
 * 
 * 重构版：约 110 行
 * - 路由只负责请求解析和响应格式化
 * - 业务逻辑在 Service 层
 * - 数据访问在 Repository 层
 * - 代码清晰，易于维护和测试
 */
