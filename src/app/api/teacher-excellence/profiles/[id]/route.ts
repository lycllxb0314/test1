/**
 * 名师风采详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherProfileService } from '@/services/teacher-excellence.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await teacherProfileService.getById(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取名师风采详情失败',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] GET /teacher-excellence/profiles/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: '获取名师风采详情失败',
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await teacherProfileService.update(id, body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '更新名师风采失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] PUT /teacher-excellence/profiles/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: '更新名师风采失败',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await teacherProfileService.delete(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '删除名师风采失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[API] DELETE /teacher-excellence/profiles/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: '删除名师风采失败',
    }, { status: 500 });
  }
}
