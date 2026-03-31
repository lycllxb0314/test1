/**
 * 成果分类管理 API
 * 
 * 遵循六层架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAchievementService } from '@/services/admin-portal.service';

/**
 * GET - 获取分类列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const result = await adminAchievementService.getCategories(includeInactive);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * POST - 创建分类
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await adminAchievementService.createCategory({
    name: body.name,
    slug: body.slug,
    icon: body.icon,
    tag: body.tag,
    description: body.description,
    sortOrder: body.sortOrder,
    isActive: body.isActive,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * PUT - 更新分类
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const result = await adminAchievementService.updateCategory(body.id, {
    name: body.name,
    slug: body.slug,
    icon: body.icon,
    tag: body.tag,
    description: body.description,
    sortOrder: body.sortOrder,
    isActive: body.isActive,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * DELETE - 删除分类
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const result = await adminAchievementService.deleteCategory(id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
