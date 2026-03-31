/**
 * 课程 API
 * 
 * GET: 获取课程列表
 * POST: 创建课程
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services/course.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { CourseType } from '@/types/course';

/**
 * GET - 获取课程列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as CourseType | undefined;
  const isMain = searchParams.get('isMain') === 'true' ? true : undefined;

  const result = await courseService.getList({ type, isMain });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取课程列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * POST - 创建课程
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await courseService.create({
    name: body.name,
    code: body.code,
    type: body.type as CourseType,
    isMain: body.isMain,
    description: body.description,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建课程失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
