/**
 * 共享教学资源 API Route
 * 
 * 六层架构第三层：API层
 * 负责HTTP请求处理和响应格式化
 * 
 * @module api/shared-resources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSharedResourceService } from '@/services/shared-resource.service';
import type { SharedResourceCategory } from '@/types/shared-resource';

/**
 * GET /api/shared-resources
 * 查询匹配的共享资源
 * 
 * Query params:
 * - category: 'reading' | 'writing'
 * - grade: number
 * - topicKey: string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const category = searchParams.get('category') as SharedResourceCategory | null;
    const grade = searchParams.get('grade');
    const topicKey = searchParams.get('topicKey');

    if (!category || !grade || !topicKey) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const service = createSharedResourceService();
    const result = await service.findByTopic({
      category,
      grade: parseInt(grade),
      topicKey,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        exists: result.data !== null,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Shared Resources API Error]:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shared-resources
 * 创建共享资源（LLM生成后调用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { category, grade, topicKey, title, unit, content, teacherId, teacherName } = body;

    if (!category || !grade || !topicKey || !title || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const service = createSharedResourceService();
    const result = await service.createIfNotExists({
      category,
      grade,
      topicKey,
      title,
      unit,
      content,
      createdBy: teacherId || undefined,
      createdByName: teacherName || undefined,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: '共享资源创建成功',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Shared Resources API Error]:', error);
    return NextResponse.json(
      { success: false, error: '创建失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shared-resources
 * 更新使用次数
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少资源ID' },
        { status: 400 }
      );
    }

    const service = createSharedResourceService();
    const result = await service.useResource(id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '使用次数已更新',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Shared Resources API Error]:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}
