/**
 * 教师团队详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherTeamService } from '@/services/teacher-excellence.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await teacherTeamService.getById(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取教师团队详情失败',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] GET /teacher-excellence/teams/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师团队详情失败',
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
    const result = await teacherTeamService.update(id, body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '更新教师团队失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] PUT /teacher-excellence/teams/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: '更新教师团队失败',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await teacherTeamService.delete(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '删除教师团队失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[API] DELETE /teacher-excellence/teams/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: '删除教师团队失败',
    }, { status: 500 });
  }
}
