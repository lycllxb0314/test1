/**
 * 公告新闻管理 API
 * 
 * 遵循六层架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAnnouncementService } from '@/services/admin-portal.service';

/**
 * GET - 获取公告/新闻列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');

  const result = await adminAnnouncementService.getList({ type, category, limit });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * POST - 创建公告/新闻
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const data = {
    title: body.title,
    summary: body.summary || '',
    content: body.content || '',
    type: body.type || 'announcement',
    category: body.category || null,
    publishStatus: body.publishStatus || 'pending',
  };

  const result = await adminAnnouncementService.create(data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * PUT - 更新公告/新闻
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const data: Record<string, any> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.content !== undefined) data.content = body.content;
  if (body.type !== undefined) data.type = body.type;
  if (body.category !== undefined) data.category = body.category;
  if (body.publishStatus !== undefined) data.publishStatus = body.publishStatus;

  const result = await adminAnnouncementService.update(body.id, data);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

/**
 * DELETE - 删除公告/新闻
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
  }

  const result = await adminAnnouncementService.delete(id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
