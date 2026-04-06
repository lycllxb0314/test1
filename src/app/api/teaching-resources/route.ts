/**
 * 教学资源库 API Route
 * 
 * 六层架构第三层：API层
 * 负责HTTP请求处理和响应格式化
 * 
 * @module api/teaching-resources
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { teachingResourceService } from '@/services/teaching-resource.service';
import type { CreateResourceRequest, ResourceQueryParams } from '@/types/teaching-resource';

/**
 * GET /api/teaching-resources
 * 查询资源列表
 */
export const GET = protectedRoute(async (request, { user }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: ResourceQueryParams = {
      category: searchParams.get('category') as ResourceQueryParams['category'] || undefined,
      type: searchParams.get('type') as ResourceQueryParams['type'] || undefined,
      grade: searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined,
      status: searchParams.get('status') as ResourceQueryParams['status'] || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
      sortBy: searchParams.get('sortBy') as ResourceQueryParams['sortBy'] || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as ResourceQueryParams['sortOrder'] || 'desc',
    };

    // 使用认证用户的 ID 过滤资源
    const teacherId = user.id;

    const result = await teachingResourceService.getResources(teacherId, params);

    return NextResponse.json({
      success: true,
      data: result.items,
      total: result.total,
      page: params.page,
      pageSize: params.pageSize,
    });
  } catch (error) {
    console.error('[Teaching Resources API Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/teaching-resources
 * 创建资源
 */
export const POST = protectedRoute(async (request, { user }) => {
  try {
    const body = await request.json();

    // 使用认证用户信息
    const teacherId = user.id;
    const teacherName = user.name || '教师';

    // 判断是否为生字专项资源
    if (body.characters && body.grade && body.content) {
      // 生字专项资源保存
      const resource = await teachingResourceService.saveCharacterResource(
        teacherId,
        teacherName,
        {
          characters: body.characters,
          grade: body.grade,
          content: body.content,
        }
      );

      return NextResponse.json({
        success: true,
        data: resource,
        message: '资源保存成功',
      });
    }

    // 判断是否为朗读教学资源
    if (body.lessonInfo && body.readingContent) {
      // 朗读教学资源保存
      const resource = await teachingResourceService.saveReadingResource(
        teacherId,
        teacherName,
        {
          lessonInfo: body.lessonInfo,
          content: body.readingContent,
        }
      );

      return NextResponse.json({
        success: true,
        data: resource,
        message: '资源保存成功',
      });
    }

    // 判断是否为习作教学资源
    if (body.lessonInfo && body.writingContent) {
      // 习作教学资源保存
      const resource = await teachingResourceService.saveWritingResource(
        teacherId,
        teacherName,
        {
          lessonInfo: body.lessonInfo,
          writingContent: body.writingContent,
        }
      );

      return NextResponse.json({
        success: true,
        data: resource,
        message: '资源保存成功',
      });
    }

    // 通用资源创建
    const createRequest: CreateResourceRequest = {
      category: body.category,
      type: body.type,
      subject: body.subject,
      grade: body.grade,
      title: body.title,
      description: body.description,
      content: body.content,
      tags: body.tags,
      lessonTitle: body.lessonTitle,
      sourceId: body.sourceId,
    };

    const resource = await teachingResourceService.createResource(
      teacherId,
      teacherName,
      createRequest
    );

    return NextResponse.json({
      success: true,
      data: resource,
      message: '资源创建成功',
    });
  } catch (error) {
    console.error('[Teaching Resources API Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
});
