/**
 * 备课中心 API Routes
 * 
 * GET  /api/lesson-prep/subjects    - 获取学科配置
 * GET  /api/lesson-prep             - 分页查询备课文档
 * POST /api/lesson-prep             - 创建备课文档
 */

import { NextRequest, NextResponse } from 'next/server';
import { lessonPrepService } from '@/services/lesson-prep.service';
import type { PrepDocumentQueryParams, CreatePrepDocumentParams } from '@/types/lesson-prep';

/**
 * 获取学科配置列表
 * GET /api/lesson-prep/subjects
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // 获取学科配置
  if (action === 'subjects') {
    const result = lessonPrepService.getSubjectConfigs();
    return NextResponse.json({ success: true, data: result.data });
  }

  // 获取单个学科配置
  if (action === 'subject') {
    const subject = searchParams.get('subject');
    if (!subject) {
      return NextResponse.json({ success: false, error: '缺少学科参数' }, { status: 400 });
    }
    const result = lessonPrepService.getSubjectConfig(subject as 'chinese' | 'math' | 'english' | 'science' | 'morality' | 'music' | 'art' | 'pe');
    return NextResponse.json({ success: true, data: result.data });
  }

  // 获取教师统计
  if (action === 'statistics') {
    const teacherId = searchParams.get('teacherId');
    if (!teacherId) {
      return NextResponse.json({ success: false, error: '缺少教师ID' }, { status: 400 });
    }
    const result = await lessonPrepService.getTeacherStatistics(teacherId);
    return NextResponse.json({ success: result.success, data: result.data, error: result.error });
  }

  // 分页查询备课文档
  const params: PrepDocumentQueryParams = {
    teacherId: searchParams.get('teacherId') || undefined,
    subject: searchParams.get('subject') as PrepDocumentQueryParams['subject'] || undefined,
    docType: searchParams.get('docType') as PrepDocumentQueryParams['docType'] || undefined,
    status: searchParams.get('status') as PrepDocumentQueryParams['status'] || undefined,
    grade: searchParams.get('grade') ? parseInt(searchParams.get('grade') as string) : undefined,
    keyword: searchParams.get('keyword') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1,
    pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 20,
  };

  const result = await lessonPrepService.queryDocuments(params);
  
  return NextResponse.json({
    success: result.success,
    data: result.data,
    pagination: result.pagination,
    error: result.error,
  });
}

/**
 * 创建备课文档
 * POST /api/lesson-prep
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // 创建文本解读文档
    if (action === 'createTextInterpretation') {
      const result = await lessonPrepService.createTextInterpretation(params);
      return NextResponse.json({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    }

    // 创建教学设计文档
    if (action === 'createLessonDesign') {
      const result = await lessonPrepService.createLessonDesign(params);
      return NextResponse.json({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    }

    // 创建课堂策略文档
    if (action === 'createClassroomStrategy') {
      const result = await lessonPrepService.createClassroomStrategy(params);
      return NextResponse.json({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    }

    // 默认创建备课文档
    const result = await lessonPrepService.createDocument(params as CreatePrepDocumentParams);
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    console.error('[API] lesson-prep POST error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
