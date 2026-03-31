/**
 * 童心教育 API
 * 
 * 获取童心教育六大路径数据
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { childHeartPathService } from '@/services/portal.service';

/** 童心教育路径 */
export interface ChildHeartPath {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  sortOrder: number;
}

/**
 * 获取童心教育路径数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await childHeartPathService.getList(limit);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取童心教育数据失败',
      }, { status: 500 });
    }

    const paths: ChildHeartPath[] = (result.data || []).map(item => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      image: item.image,
      description: item.description,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json({
      success: true,
      data: paths,
    });
  } catch (error) {
    console.error('Philosophy API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败',
    }, { status: 500 });
  }
}
