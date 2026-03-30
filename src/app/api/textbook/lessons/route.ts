/**
 * 课文数据 API
 * 
 * GET /api/textbook/lessons - 获取指定册别的课文列表（按单元分组）
 * GET /api/textbook/lessons/[id] - 获取指定课文的详细内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTextbookService } from '@/services/textbook.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * 获取课文列表
 * 
 * Query params:
 * - grade: 年级 (1-6)
 * - semester: 学期 (上册/下册)
 * - keyword: 搜索关键词（可选）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = parseInt(searchParams.get('grade') || '0');
  const semester = searchParams.get('semester') as '上册' | '下册' | null;
  const lessonId = searchParams.get('id');
  const keyword = searchParams.get('keyword');
  
  const textbookService = createTextbookService();
  
  // 如果指定了课文ID，获取单个课文
  if (lessonId) {
    const result = await textbookService.getLessonById(parseInt(lessonId));
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取课文内容失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
    
    if (!result.data) {
      return NextResponse.json(
        error('课文不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    return NextResponse.json(success(result.data));
  }
  
  // 如果有搜索关键词，执行搜索
  if (keyword) {
    const result = await textbookService.searchLessons(
      keyword,
      grade || undefined,
      semester || undefined
    );
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '搜索课文失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(result.data));
  }
  
  // 否则获取指定年级学期的课文列表
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
  
  const result = await textbookService.getLessonsByVolume(grade, semester);
  
  if (!result.success) {
    return NextResponse.json(
      error(result.error || '获取课文列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
  
  return NextResponse.json(success(result.data));
}
