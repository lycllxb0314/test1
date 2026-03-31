/**
 * 成就分类 API
 * 
 * 获取成就分类列表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { achievementService } from '@/services/portal.service';

/**
 * 获取成就分类列表
 */
export async function GET(request: NextRequest) {
  try {
    const result = await achievementService.getCategories();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取成就分类失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Achievement categories API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
