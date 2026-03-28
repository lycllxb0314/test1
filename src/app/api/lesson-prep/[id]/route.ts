/**
 * 备课文档详情 API Routes
 * 
 * GET    /api/lesson-prep/[id] - 获取备课文档详情
 * PUT    /api/lesson-prep/[id] - 更新备课文档
 * DELETE /api/lesson-prep/[id] - 删除备课文档
 */

import { NextRequest, NextResponse } from 'next/server';
import { lessonPrepService } from '@/services/lesson-prep.service';
import type { UpdatePrepDocumentParams } from '@/types/lesson-prep';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取备课文档详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const result = await lessonPrepService.getDocument(id);
  
  return NextResponse.json({
    success: result.success,
    data: result.data,
    error: result.error,
  });
}

/**
 * 更新备课文档
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { action, ...updateParams } = body;

    // 发布文档
    if (action === 'publish') {
      const result = await lessonPrepService.publishDocument(id);
      return NextResponse.json({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    }

    // 归档文档
    if (action === 'archive') {
      const result = await lessonPrepService.archiveDocument(id);
      return NextResponse.json({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    }

    // 更新文档
    const result = await lessonPrepService.updateDocument(id, updateParams as UpdatePrepDocumentParams);
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error('[API] lesson-prep PUT error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}

/**
 * 删除备课文档
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const result = await lessonPrepService.deleteDocument(id);
  
  return NextResponse.json({
    success: result.success,
    error: result.error,
  });
}
