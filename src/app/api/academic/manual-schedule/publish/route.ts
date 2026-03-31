/**
 * 手动排课 - 发布课表 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 发布草稿
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { draftId } = body;
    
    if (!draftId) {
      return NextResponse.json(error('缺少草稿ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const result = await draftService.publish(draftId);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '发布失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '发布成功' });
  } catch (err) {
    console.error('发布课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
