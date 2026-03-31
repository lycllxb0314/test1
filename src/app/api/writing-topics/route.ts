/**
 * 作文题目 API
 * 
 * GET: 获取作文题目列表
 * POST: 创建作文题目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取作文题目列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  const category = searchParams.get('category') || 'chinese_writing';

  if (!teacherId) {
    return NextResponse.json(
      error('缺少教师ID', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await teachingResourceRepository.findMany({
    teacherId,
    category: category as any,
  });

  // 返回资源列表
  return NextResponse.json(success(result.items));
}

/**
 * POST - 创建作文题目
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const resource = await teachingResourceRepository.create({
    teacherId: body.teacherId,
    teacherName: body.teacherName,
    category: 'chinese_writing',
    type: 'writing_task',
    subject: '语文',
    grade: body.grade,
    title: body.title,
    description: body.description,
    content: body.content,
    lessonTitle: body.lessonTitle,
  });

  if (!resource) {
    return NextResponse.json(
      error('创建作文题目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(resource));
}
