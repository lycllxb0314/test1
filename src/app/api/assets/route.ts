/**
 * 资产 API
 * 
 * GET: 获取资产列表
 * POST: 创建资产
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { assetService } from '@/services/asset.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取资产列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const status = searchParams.get('status') || undefined;
  const location = searchParams.get('location') || undefined;

  const result = await assetService.getList({ category, status, location });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取资产列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((asset) => ({
    id: asset.id,
    name: asset.name,
    assetNumber: asset.asset_number || '',
    category: asset.category,
    model: asset.model || undefined,
    brand: asset.brand || undefined,
    purchaseDate: asset.purchase_date || undefined,
    purchasePrice: asset.purchase_price || undefined,
    location: asset.location || undefined,
    manager: asset.manager || undefined,
    status: asset.status,
    lastMaintenance: asset.last_maintenance || undefined,
    nextMaintenance: asset.next_maintenance || undefined,
    createdAt: asset.created_at,
  }));

  return NextResponse.json(success(formattedData));
});

/**
 * POST - 创建资产
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const body = await request.json();

  const result = await assetService.create({
    name: body.name,
    asset_number: body.assetNumber,
    category: body.category,
    model: body.model,
    brand: body.brand,
    purchase_date: body.purchaseDate,
    purchase_price: body.purchasePrice,
    location: body.location,
    manager: body.manager,
    status: body.status || 'active',
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建资产失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});
