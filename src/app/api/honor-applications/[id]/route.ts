/**
 * 申报详情 API
 * 
 * GET: 获取单个申报记录详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';

// 获取申报详情
export const GET = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;

    const result = await honorCampaignService.getApplicationById(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取失败', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] GET /api/honor-applications/[id] error:', err);
    return NextResponse.json(error('获取申报详情失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
