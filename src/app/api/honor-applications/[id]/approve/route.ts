/**
 * 审批申报 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { ApproveApplicationRequest } from '@/types/honor-campaign';

// 审批申报
export const POST = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;
    const body: ApproveApplicationRequest = await request.json();

    const result = await honorCampaignService.approveApplication(
      id,
      context.user.id,
      context.user.name,
      body
    );
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '审批失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] POST /api/honor-applications/[id]/approve error:', err);
    return NextResponse.json(error('审批失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
