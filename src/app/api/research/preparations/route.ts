/**
 * 集体备课 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectivePreparationService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取集体备课列表
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const grade = searchParams.get('grade');
    
    const result = await collectivePreparationService.getList({
      subject: searchParams.get('subject') || undefined,
      grade: grade ? parseInt(grade) : undefined,
      hostId: searchParams.get('hostId') || undefined,
      participantId: searchParams.get('participantId') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取集体备课列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
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
    console.error('Failed to fetch collective preparations:', err);
    return NextResponse.json(error('获取集体备课列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建集体备课
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const result = await collectivePreparationService.create(body);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建集体备课失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '集体备课创建成功',
    });
  } catch (err) {
    console.error('Failed to create collective preparation:', err);
    return NextResponse.json(error('创建集体备课失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
