import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取资产列表
 * 查询参数：
 * - category: 资产类别
 * - status: 状态
 * - department: 部门
 * - location: 存放位置
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const location = searchParams.get('location');

    // 构建查询
    let query = client
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((asset: any) => ({
      id: asset.id,
      assetCode: asset.asset_code,
      name: asset.name,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      specification: asset.specification,
      quantity: asset.quantity,
      unit: asset.unit,
      unitPrice: asset.unit_price,
      totalPrice: asset.total_price,
      purchaseDate: asset.purchase_date,
      warrantyExpiry: asset.warranty_expiry,
      department: asset.department,
      location: asset.location,
      responsiblePerson: asset.responsible_person,
      status: asset.status,
      lastMaintenanceDate: asset.last_maintenance_date,
      nextMaintenanceDate: asset.next_maintenance_date,
      notes: asset.notes,
      images: asset.images || [],
      createdAt: asset.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({
      success: false,
      error: '获取资产列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建资产
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      assetCode,
      name,
      category,
      brand,
      model,
      specification,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      purchaseDate,
      warrantyExpiry,
      department,
      location,
      responsiblePerson,
      notes,
      images,
    } = body;

    const { data, error } = await client
      .from('assets')
      .insert({
        asset_code: assetCode,
        name,
        category,
        brand,
        model,
        specification,
        quantity: quantity || 1,
        unit: unit || '件',
        unit_price: unitPrice,
        total_price: totalPrice || (unitPrice * (quantity || 1)),
        purchase_date: purchaseDate,
        warranty_expiry: warrantyExpiry,
        department,
        location,
        responsible_person: responsiblePerson,
        status: 'in_use',
        notes,
        images: images || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create asset:', error);
    return NextResponse.json({
      success: false,
      error: '创建资产失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新资产信息
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.responsiblePerson !== undefined) updateData.responsible_person = updates.responsiblePerson;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.lastMaintenanceDate !== undefined) updateData.last_maintenance_date = updates.lastMaintenanceDate;
    if (updates.nextMaintenanceDate !== undefined) updateData.next_maintenance_date = updates.nextMaintenanceDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await client
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update asset:', error);
    return NextResponse.json({
      success: false,
      error: '更新资产信息失败',
    }, { status: 500 });
  }
}

/**
 * DELETE - 删除资产
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少资产ID',
      }, { status: 400 });
    }

    const { error } = await client
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return NextResponse.json({
      success: false,
      error: '删除资产失败',
    }, { status: 500 });
  }
}
