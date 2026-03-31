/**
 * 成就详情 API
 * 
 * 获取单个成就详情
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { achievementService } from '@/services/portal.service';

/**
 * 获取成就详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await achievementService.getById(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取成就详情失败',
      }, { status: 404 });
    }

    const item = result.data!;
    const achievement = {
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      image: item.image,
      achievementDate: item.achievement_date,
      participants: item.participants,
      awards: item.awards,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
    };

    return NextResponse.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    console.error('Achievement detail API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
