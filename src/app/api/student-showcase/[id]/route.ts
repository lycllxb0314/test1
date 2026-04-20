/**
 * 附小少年详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentShowcaseService } from '@/services/student-showcase.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await studentShowcaseService.getById(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '获取详情失败' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API] GET /student-showcase/[id] error:', error);
    return NextResponse.json({ success: false, error: '获取详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await studentShowcaseService.update(id, body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API] PUT /student-showcase/[id] error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await studentShowcaseService.delete(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /student-showcase/[id] error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
