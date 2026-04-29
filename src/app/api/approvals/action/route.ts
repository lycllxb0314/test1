/**
 * 审批操作 API
 * 
 * PUT: 执行审批操作（通过/驳回/退回/撤回）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth/session';
import { ok, fail, serverError, unauthorized } from '@/lib/api';
import { ApprovalActionRequest } from '@/types/approval';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { ApprovalService } from '@/services/approval.service';

/**
 * 执行审批操作
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return unauthorized('未登录，请先登录');
    }

    const body: ApprovalActionRequest = await request.json();
    const { instanceId, action, comment } = body;
    
    if (!instanceId) {
      return NextResponse.json(fail('缺少审批实例ID'), { status: 400 });
    }
    
    console.log('[Approval Action] Request:', { instanceId, action, comment, userId: user.id });

    // 通过 DI 获取 Service
    const approvalService = getService<ApprovalService>(SERVICE_IDENTIFIERS.ApprovalService);

    const result = await approvalService.executeAction({
      instanceId,
      action,
      comment: comment || undefined,
      userId: user.id,
      userName: user.name || '',
    });

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 :
                         result.code === 'FORBIDDEN' ? 403 :
                         result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(fail(result.error || '操作失败'), { status: statusCode });
    }

    return ok(result.data);

  } catch (error) {
    console.error('Approval action error:', error);
    return serverError(error instanceof Error ? error.message : '审批操作失败');
  }
}
