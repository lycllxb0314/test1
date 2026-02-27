import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock资产数据
const mockAssets = [
  { id: 'asset1', name: '教师办公电脑', assetNumber: 'ZC-2024-001', category: '办公设备', brand: '联想', model: 'ThinkCentre M720', purchaseDate: '2024-01-15', purchasePrice: 5000, location: '办公室201', manager: '李明', status: 'active', lastMaintenance: '2024-06-01', nextMaintenance: '2024-12-01', createdAt: '2024-01-15' },
  { id: 'asset2', name: '多媒体投影仪', assetNumber: 'ZC-2024-002', category: '教学设备', brand: '爱普生', model: 'CB-X50', purchaseDate: '2024-02-20', purchasePrice: 8000, location: '多媒体教室1', manager: '王芳', status: 'active', lastMaintenance: '2024-07-15', nextMaintenance: '2025-01-15', createdAt: '2024-02-20' },
  { id: 'asset3', name: '空调', assetNumber: 'ZC-2023-015', category: '电器设备', brand: '格力', model: 'KFR-35GW', purchaseDate: '2023-08-10', purchasePrice: 3500, location: '六年级1班', manager: '张华', status: 'active', lastMaintenance: '2024-05-20', nextMaintenance: '2025-05-20', createdAt: '2023-08-10' },
  { id: 'asset4', name: '打印机', assetNumber: 'ZC-2024-003', category: '办公设备', brand: '惠普', model: 'LaserJet Pro', purchaseDate: '2024-03-01', purchasePrice: 2800, location: '教务处', manager: '李强', status: 'maintenance', lastMaintenance: '2024-09-01', nextMaintenance: '2024-11-01', createdAt: '2024-03-01' },
];

/**
 * GET - 获取资产列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    const client = getSupabaseClient();
    
    let query = client
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockAssets];
      if (category) filteredData = filteredData.filter(a => a.category === category);
      if (status) filteredData = filteredData.filter(a => a.status === status);
      if (location) filteredData = filteredData.filter(a => a.location.includes(location));

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((a: Record<string, unknown>) => ({
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
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({ success: true, data: mockAssets, source: 'mock' });
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `asset-${Date.now()}`, ...body, status: 'active' },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({ success: false, error: '创建资产失败' }, { status: 500 });
  }
}
