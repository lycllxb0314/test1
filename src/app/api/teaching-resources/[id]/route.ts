/**
 * 教学资源详情 API Route
 * 
 * GET: 获取资源详情
 * PUT: 更新资源
 * DELETE: 删除资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { teachingResourceService } from '@/services/teaching-resource.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teaching-resources/[id]
 * 获取资源详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
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
}

/**
 * PUT /api/teaching-resources/[id]
 * 更新资源
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // TODO: 从认证获取教师ID
    const teacherId = 'teacher-001';

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
}

/**
 * DELETE /api/teaching-resources/[id]
 * 删除资源
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // TODO: 从认证获取教师ID
    const teacherId = 'teacher-001';

    await teachingResourceService.deleteResource(id, teacherId);

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
}
