/**
 * 成果项目管理 API
 * 
 * 遵循六层架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAchievementService } from '@/services/admin-portal.service';

/**
 * GET - 获取成果列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId') || undefined;
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const result = await adminAchievementService.getItems(categoryId, includeInactive, limit);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * POST - 创建成果
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const data = {
    category_id: body.categoryId || body.category_id,
    title: body.title,
    image: body.image || '',
    image_key: body.imageKey || '',
    date: body.date || '',
    summary: body.summary || '',
    highlights: body.highlights || null,
    sort_order: body.sortOrder || 0,
    is_active: body.isActive ?? true,
  };

  const result = await adminAchievementService.createItem(data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * PUT - 更新成果
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const data: Record<string, any> = {};
  if (body.categoryId !== undefined) data.category_id = body.categoryId;
  if (body.category_id !== undefined) data.category_id = body.category_id;
  if (body.title !== undefined) data.title = body.title;
  if (body.image !== undefined) data.image = body.image;
  if (body.imageKey !== undefined) data.image_key = body.imageKey;
  if (body.date !== undefined) data.date = body.date;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.highlights !== undefined) data.highlights = body.highlights;
  if (body.sortOrder !== undefined) data.sort_order = body.sortOrder;
  if (body.isActive !== undefined) data.is_active = body.isActive;

  const result = await adminAchievementService.updateItem(body.id, data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * DELETE - 删除成果
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const result = await adminAchievementService.deleteItem(id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
