/**
 * 学生荣誉评选活动 API
 *
 * GET: 获取评选活动列表
 * POST: 创建评选活动
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { CreateCampaignRequest, CampaignQueryParams } from '@/types/honor-campaign';

// 获取评选活动列表
export const GET = protectedRoute(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: CampaignQueryParams = {
      status: searchParams.get('status') as CampaignQueryParams['status'] || undefined,
      honorType: searchParams.get('honorType') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    const result = await honorCampaignService.getCampaigns(params);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success({
      data: result.data!.data,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total: result.data!.total,
      },
    }, 'database'));
  } catch (err) {
    console.error('[API] GET /api/honor-campaigns error:', err);
    return NextResponse.json(error('获取评选活动列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 创建评选活动
export const POST = protectedRoute(async (request: NextRequest, { user }) => {
  try {
    // 检查权限（德育副校长可以创建）
    const hasPermission = user.role === 'moral_vice_principal';
    
    if (!hasPermission) {
      return NextResponse.json(error('无权限创建评选活动', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const body: CreateCampaignRequest = await request.json();
    
    // 调试日志
    console.log('[API] POST /api/honor-campaigns body:', JSON.stringify(body, null, 2));

    // 验证必填字段
    if (!body.title || !body.honorType || !body.startDate || !body.endDate) {
      const missingFields = [];
      if (!body.title) missingFields.push('title');
      if (!body.honorType) missingFields.push('honorType');
      if (!body.startDate) missingFields.push('startDate');
      if (!body.endDate) missingFields.push('endDate');
      console.log('[API] Missing required fields:', missingFields);
      return NextResponse.json(error(`缺少必填字段: ${missingFields.join(', ')}`, ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await honorCampaignService.createCampaign(body, user.id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] POST /api/honor-campaigns error:', err);
    return NextResponse.json(error('创建评选活动失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
