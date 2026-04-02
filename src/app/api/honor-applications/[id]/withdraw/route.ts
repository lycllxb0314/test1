/**
 * 撤回申报 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';

// 撤回申报
export const POST = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;

    const result = await honorCampaignService.withdrawApplication(id, context.user.id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '撤回失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] POST /api/honor-applications/[id]/withdraw error:', err);
    return NextResponse.json(error('撤回失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
