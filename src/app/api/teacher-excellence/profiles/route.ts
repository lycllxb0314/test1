/**
 * 名师风采 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherProfileService } from '@/services/teacher-excellence.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const admin = searchParams.get('admin') === 'true';

    const result = admin
      ? await teacherProfileService.getListForAdmin(true, limit)
      : await teacherProfileService.getList(limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取名师风采数据失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error('[API] GET /teacher-excellence/profiles error:', error);
    return NextResponse.json({
      success: false,
      error: '获取名师风采数据失败',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await teacherProfileService.create(body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '创建名师风采失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('[API] POST /teacher-excellence/profiles error:', error);
    return NextResponse.json({
      success: false,
      error: '创建名师风采失败',
    }, { status: 500 });
  }
}
