/**
 * 课文数据 API
 * 
 * GET /api/textbook/lessons - 获取指定册别的课文列表
 * GET /api/textbook/lesson - 获取指定课文的详细内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createTextbookService } from '@/services/textbook.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * 获取课文列表
 * 
 * Query params:
 * - grade: 年级 (1-6)
 * - semester: 学期 (上册/下册)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = parseInt(searchParams.get('grade') || '0');
  const semester = searchParams.get('semester') as '上册' | '下册' | null;
  const title = searchParams.get('title');
  
  if (!grade || grade < 1 || grade > 6) {
    return NextResponse.json(
      error('请提供有效的年级 (1-6)', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  if (!semester || !['上册', '下册'].includes(semester)) {
    return NextResponse.json(
      error('请提供有效的学期 (上册/下册)', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const textbookService = createTextbookService(customHeaders);
  
  // 如果指定了课文标题，获取课文内容
  if (title) {
    const result = await textbookService.searchLessonContent(title, grade, semester);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取课文内容失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(result.data));
  }
  
  // 否则获取课文列表
  const result = await textbookService.searchLessonsByVolume(grade, semester);
  
  if (!result.success) {
    return NextResponse.json(
      error(result.error || '获取课文列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
  
  return NextResponse.json(success(result.data));
}
