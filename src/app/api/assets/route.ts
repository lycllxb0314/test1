import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取资产列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    let query = client
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((a: any) => ({
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
      })),
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({ success: false, error: '获取资产列表失败' }, { status: 500 });
  }
}

/**
 * POST - 创建资产
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('assets')
      .insert({
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

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({ success: false, error: '创建资产失败' }, { status: 500 });
  }
}
