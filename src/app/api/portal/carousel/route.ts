/**
 * 轮播图 API
 * 
 * 获取学校主页门户的轮播图数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { carouselService } from '@/services/portal.service';

/** 轮播项类型 */
export type CarouselType = 'image' | 'video' | 'bilibili';

/** 轮播项 */
export interface CarouselItem {
  id: string;
  type: CarouselType;
  image: string;
  videoUrl?: string;
  bilibiliUrl?: string;
  bilibiliBvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  sortOrder: number;
}

/**
 * 获取轮播图数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await carouselService.getList(limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取轮播图数据失败',
      }, { status: 500 });
    }

    const items: CarouselItem[] = (result.data || []).map(item => ({
      id: item.id,
      type: item.type as CarouselType,
      image: item.image,
      videoUrl: item.video_url,
      bilibiliUrl: item.bilibili_url,
      bilibiliBvid: item.bilibili_bvid,
      title: item.title,
      subtitle: item.subtitle,
      tag: item.tag,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Carousel API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
