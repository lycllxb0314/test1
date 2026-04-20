/**
 * 教师团队 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherTeamService } from '@/services/teacher-excellence.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const admin = searchParams.get('admin') === 'true';

    const result = admin
      ? await teacherTeamService.getListForAdmin(true, limit)
      : await teacherTeamService.getList(limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取教师团队数据失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error('[API] GET /teacher-excellence/teams error:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师团队数据失败',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await teacherTeamService.create(body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '创建教师团队失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] POST /teacher-excellence/teams error:', error);
    return NextResponse.json({
      success: false,
      error: '创建教师团队失败',
    }, { status: 500 });
  }
}
