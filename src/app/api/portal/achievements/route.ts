/**
 * 成就展示 API
 * 
 * 获取学校成就展示数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { achievementService } from '@/services/portal.service';

/** 成就 */
export interface Achievement {
  id: string;
  title: string;
  category: string;
  description?: string;
  image?: string;
  achievementDate?: string;
  participants?: string[];
  awards?: string;
  sortOrder: number;
}

/**
 * 获取成就列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;

    const result = await achievementService.getList({
      category,
      limit,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取成就数据失败',
      }, { status: 500 });
    }

    const achievements: Achievement[] = (result.data || []).map(item => ({
      id: item.id,
      title: item.title,
      category: item.category_id || '',
      description: item.description,
      image: item.image,
      achievementDate: item.date,
      participants: item.highlights,
      awards: undefined,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
