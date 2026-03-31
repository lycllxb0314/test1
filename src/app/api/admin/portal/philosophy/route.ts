/**
 * 童心教育板块管理 API
 * 
 * 遵循六层架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminPhilosophyService } from '@/services/admin-portal.service';

/**
 * GET - 获取板块列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const result = await adminPhilosophyService.getCategories(includeInactive, limit);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * POST - 创建板块
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const data = {
    icon: body.icon || 'Shield',
    title: body.title,
    subtitle: body.subtitle || '',
    image: body.image,
    image_key: body.imageKey || '',
    description: body.description || '',
    sort_order: body.sortOrder || 0,
    is_active: body.isActive ?? true,
  };

  const result = await adminPhilosophyService.createCategory(data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * PUT - 更新板块
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const data: Record<string, any> = {};
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.title !== undefined) data.title = body.title;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle;
  if (body.image !== undefined) data.image = body.image;
  if (body.imageKey !== undefined) data.image_key = body.imageKey;
  if (body.description !== undefined) data.description = body.description;
  if (body.sortOrder !== undefined) data.sort_order = body.sortOrder;
  if (body.isActive !== undefined) data.is_active = body.isActive;

  const result = await adminPhilosophyService.updateCategory(body.id, data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * DELETE - 删除板块
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const result = await adminPhilosophyService.deleteCategory(id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
