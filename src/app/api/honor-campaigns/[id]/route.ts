/**
 * 单个评选活动 API
 *
 * GET: 获取评选活动详情
 * PUT: 更新评选活动
 * DELETE: 删除评选活动
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { UpdateCampaignRequest } from '@/types/honor-campaign';

// 获取评选活动详情
export const GET = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;

    const result = await honorCampaignService.getCampaign(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '评选活动不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] GET /api/honor-campaigns/[id] error:', err);
    return NextResponse.json(error('获取评选活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 更新评选活动
export const PUT = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;
    const body: UpdateCampaignRequest = await request.json();

    const result = await honorCampaignService.updateCampaign(id, body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '更新失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] PUT /api/honor-campaigns/[id] error:', err);
    return NextResponse.json(error('更新评选活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 删除评选活动
export const DELETE = protectedRoute(async (request: NextRequest, context) => {
  try {
    if (!context.params) {
      return NextResponse.json(error('缺少参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const params = await context.params;
    const id = params.id as string;

    const result = await honorCampaignService.deleteCampaign(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '删除失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(true, 'database'));
  } catch (err) {
    console.error('[API] DELETE /api/honor-campaigns/[id] error:', err);
    return NextResponse.json(error('删除评选活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
