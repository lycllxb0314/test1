/**
 * 教师获奖 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherAwardService } from '@/services/teacher-excellence.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const admin = searchParams.get('admin') === 'true';

    const result = admin
      ? await teacherAwardService.getListForAdmin(true, limit)
      : await teacherAwardService.getList(limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取教师获奖数据失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error('[API] GET /teacher-excellence/awards error:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师获奖数据失败',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await teacherAwardService.create(body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '创建教师获奖失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] POST /teacher-excellence/awards error:', error);
    return NextResponse.json({
      success: false,
      error: '创建教师获奖失败',
    }, { status: 500 });
  }
}
