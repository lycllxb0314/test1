/**
 * 资产管理 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams,
  ErrorCode 
} from '@/lib/api-route-utils';

/**
 * GET - 获取资产列表
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.category) query = query.eq('category', params.category);
    if (params.status) query = query.eq('status', params.status);
    if (params.location) query = query.ilike('location', `%${params.location}%`);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((a: Record<string, unknown>) => ({
      id: a.id,
      name: a.name,
      assetNumber: a.asset_number,
      category: a.category,
      brand: a.brand,
      model: a.model,
      purchaseDate: a.purchase_date,
      purchasePrice: a.purchase_price,
      location: a.location,
      manager: a.manager,
      status: a.status,
      lastMaintenance: a.last_maintenance,
      nextMaintenance: a.next_maintenance,
      createdAt: a.created_at,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch assets:', err);
    return NextResponse.json(
      error('获取资产列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建资产
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    if (!body.name || !body.category) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const { data, error: dbError } = await client
      .from('assets')
      .insert({
        id: `asset-${Date.now()}`,
        name: body.name,
        asset_number: body.assetNumber,
        category: body.category,
        brand: body.brand,
        model: body.model,
        purchase_date: body.purchaseDate,
        purchase_price: body.purchasePrice,
        location: body.location,
        manager: body.manager,
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建资产失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      name: data.name,
      category: data.category,
      status: data.status,
    }));
  } catch (err) {
    console.error('Failed to create asset:', err);
    return NextResponse.json(
      error('创建资产失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
