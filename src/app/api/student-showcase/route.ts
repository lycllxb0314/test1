/**
 * 附小少年 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentShowcaseService } from '@/services/student-showcase.service';
import type { ShowcaseCategory } from '@/types/student-showcase';

const VALID_CATEGORIES: ShowcaseCategory[] = ['virtue', 'wisdom', 'vitality', 'art', 'practice'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as ShowcaseCategory | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const admin = searchParams.get('admin') === 'true';

    if (admin) {
      const result = await studentShowcaseService.getListForAdmin(true, limit);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || '获取数据失败' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result.data || [] });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ success: false, error: '无效的类别' }, { status: 400 });
    }

    const result = await studentShowcaseService.getList(category || undefined, limit);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '获取数据失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error('[API] GET /student-showcase error:', error);
    return NextResponse.json({ success: false, error: '获取数据失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await studentShowcaseService.create(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '创建失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API] POST /student-showcase error:', error);
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}
