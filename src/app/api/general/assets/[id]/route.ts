/**
 * 资产详情 API
 * GET: 获取资产详情
 * PUT: 更新资产
 * DELETE: 删除资产
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { assetService } from '@/services/asset.service';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少资产ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await assetService.getById(id);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '资产不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Assets API] GET error:', err);
    return NextResponse.json(error('获取资产详情失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const PUT = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少资产ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const body = await request.json();
    
    const result = await assetService.update(id, body);

    if (!result.success) {
      return NextResponse.json(error(result.error || '更新资产失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Assets API] PUT error:', err);
    return NextResponse.json(error('更新资产失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const DELETE = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少资产ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await assetService.delete(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '删除资产失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success({ id }, 'database'));
  } catch (err) {
    console.error('[Assets API] DELETE error:', err);
    return NextResponse.json(error('删除资产失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
