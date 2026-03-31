/**
 * 办学荣誉 API
 * 
 * 获取学校办学荣誉数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { schoolHonorService } from '@/services/portal.service';

/** 办学荣誉 */
export interface SchoolHonor {
  id: string;
  title: string;
  year?: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

/**
 * 获取办学荣誉数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await schoolHonorService.getList(limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取办学荣誉数据失败',
      }, { status: 500 });
    }

    const honors: SchoolHonor[] = (result.data || []).map(item => ({
      id: item.id,
      title: item.title,
      year: item.year,
      description: item.description,
      icon: item.icon,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: honors,
    });
  } catch (error) {
    console.error('Honors API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
