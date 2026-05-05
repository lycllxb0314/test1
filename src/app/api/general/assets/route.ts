/**
 * 资产管理 API
 * GET: 获取资产列表
 * POST: 创建资产
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { assetService } from '@/services/asset.service';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      location: searchParams.get('location') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
    };

    const result = await assetService.getList(params);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取资产列表失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Assets API] GET error:', err);
    return NextResponse.json(error('获取资产列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    if (!body.name || !body.category) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    // 生成资产编号
    const assetNo = body.assetNo || `LY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const result = await assetService.create({
      ...body,
      id: `asset-${Date.now()}`,
      assetNo,
      status: body.status || '在用',
    });

    if (!result.success) {
      return NextResponse.json(error(result.error || '创建资产失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Assets API] POST error:', err);
    return NextResponse.json(error('创建资产失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
