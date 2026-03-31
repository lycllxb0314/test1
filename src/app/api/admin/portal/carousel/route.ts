/**
 * 轮播图管理 API
 * 
 * 遵循六层架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminCarouselService } from '@/services/admin-portal.service';

/**
 * GET - 获取轮播图列表
 * Query: includeInactive=true 获取所有（包括未激活）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const result = await adminCarouselService.getList(includeInactive, limit);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * POST - 创建轮播图
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 驼峰转下划线
  const data = {
    type: body.type || 'image',
    image: body.image,
    video_url: body.videoUrl || '',
    bilibili_url: body.bilibiliUrl || '',
    bilibili_bvid: body.bilibiliBvid || '',
    title: body.title,
    subtitle: body.subtitle || '',
    tag: body.tag || '',
    sort_order: body.sortOrder || 0,
    is_active: body.isActive ?? true,
  };

  const result = await adminCarouselService.create(data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * PUT - 更新轮播图
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  // 驼峰转下划线
  const data: Record<string, any> = {};
  if (body.type !== undefined) data.type = body.type;
  if (body.image !== undefined) data.image = body.image;
  if (body.videoUrl !== undefined) data.video_url = body.videoUrl;
  if (body.bilibiliUrl !== undefined) data.bilibili_url = body.bilibiliUrl;
  if (body.bilibiliBvid !== undefined) data.bilibili_bvid = body.bilibiliBvid;
  if (body.title !== undefined) data.title = body.title;
  if (body.subtitle !== undefined) data.subtitle = body.subtitle;
  if (body.tag !== undefined) data.tag = body.tag;
  if (body.sortOrder !== undefined) data.sort_order = body.sortOrder;
  if (body.isActive !== undefined) data.is_active = body.isActive;

  const result = await adminCarouselService.update(body.id, data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * DELETE - 删除轮播图
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const result = await adminCarouselService.delete(id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
