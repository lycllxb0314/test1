/**
 * 听课评课 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { lessonObservationService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取听课评课列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await lessonObservationService.getList({
      teacherId: searchParams.get('teacherId') || undefined,
      observerId: searchParams.get('observerId') || undefined,
      subject: searchParams.get('subject') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取听课评课列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        data: result.data,
        total: result.pagination?.total || 0,
        page: result.pagination?.page,
        pageSize: result.pagination?.pageSize,
        totalPages: result.pagination?.totalPages,
      },
    });
  } catch (err) {
    console.error('Failed to fetch lesson observations:', err);
    return NextResponse.json(error('获取听课评课列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建听课评课
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const result = await lessonObservationService.create(body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建听课评课失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '听课评课创建成功',
    });
  } catch (err) {
    console.error('Failed to create lesson observation:', err);
    return NextResponse.json(error('创建听课评课失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
