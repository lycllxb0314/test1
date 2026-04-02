/**
 * 发布评选活动 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';

// 发布评选活动
export const POST = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;

    const result = await honorCampaignService.publishCampaign(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '发布失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] POST /api/honor-campaigns/[id]/publish error:', err);
    return NextResponse.json(error('发布评选活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
