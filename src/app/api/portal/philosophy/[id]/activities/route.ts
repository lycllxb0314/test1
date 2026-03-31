/**
 * 童心教育活动内容 API
 * 
 * 获取指定板块下的活动内容列表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { philosophyActivityService } from '@/services/portal.service';

interface ActivityItem {
  id: string;
  categoryId: string;
  title: string;
  image: string;
  date?: string;
  summary?: string;
  content?: string;
  sortOrder: number;
}

/**
 * 获取指定板块下的活动内容
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await philosophyActivityService.getByCategory(id, limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取活动内容失败',
      }, { status: 500 });
    }

    if (!result.data?.category) {
      return NextResponse.json({
        success: false,
        error: '板块不存在',
      }, { status: 404 });
    }

    const activities: ActivityItem[] = (result.data.activities || []).map(item => ({
      id: item.id,
      categoryId: item.category_id,
      title: item.title,
      image: item.image,
      date: item.date,
      summary: item.summary,
      content: item.content,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: {
        category: {
          id: result.data.category.id,
          title: result.data.category.title,
          subtitle: result.data.category.subtitle,
          icon: result.data.category.icon,
        },
        activities,
      },
    });
  } catch (error) {
    console.error('Activities API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
