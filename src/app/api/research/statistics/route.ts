/**
 * 教研统计 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchStatisticsService } from '@/services/research.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取教研统计数据
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const themeId = searchParams.get('themeId');
    
    if (type === 'overview') {
      const result = await researchStatisticsService.getOverview();
      
      if (!result.success) {
        return NextResponse.json(error(result.error || '获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    if (type === 'theme' || themeId) {
      if (!themeId) {
        return NextResponse.json(error('缺少主题ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }
      
      const result = await researchStatisticsService.getThemeStats(themeId);
      
      if (!result.success) {
        return NextResponse.json(error(result.error || '获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      
      return NextResponse.json({ success: true, data: result.data });
    }
    
    // 默认返回总览
    const result = await researchStatisticsService.getOverview();
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('教研统计API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
