/**
 * 教学资源详情 API Route
 * 
 * GET: 获取资源详情
 * PUT: 更新资源
 * DELETE: 删除资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { teachingResourceService } from '@/services/teaching-resource.service';

/**
 * GET /api/teaching-resources/[id]
 * 获取资源详情
 */
export const GET = protectedRoute(async (request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少资源ID' },
        { status: 400 }
      );
    }
    
    const resource = await teachingResourceService.getResource(id);

    if (!resource) {
      return NextResponse.json(
        { success: false, error: '资源不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('[Teaching Resource API Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/teaching-resources/[id]
 * 更新资源
 */
export const PUT = protectedRoute(async (request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少资源ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();

    // 使用认证用户 ID
    const teacherId = user.id;

    const resource = await teachingResourceService.updateResource(id, teacherId, body);

    return NextResponse.json({
      success: true,
      data: resource,
      message: '更新成功',
    });
  } catch (error) {
    console.error('[Teaching Resource API Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/teaching-resources/[id]
 * 删除资源
 */
export const DELETE = protectedRoute(async (request, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少资源ID' },
        { status: 400 }
      );
    }

    // 使用认证用户 ID
    const teacherId = user.id;

    await teachingResourceService.deleteResource(id, teacherId, false);

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('[Teaching Resource API Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
});
