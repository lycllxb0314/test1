/**
 * 更新教师配置 API
 * 
 * POST: 更新教师配置
 * GET: 获取教师配置
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * POST - 更新教师配置
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { teacherId, config } = body;

  if (!teacherId || !config) {
    return NextResponse.json(
      error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await teacherService.batchUpdate({
    ids: [teacherId],
    updates: { config },
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '更新教师配置失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ updated: true }));
}

/**
 * GET - 获取教师配置
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  if (!teacherId) {
    return NextResponse.json(
      error('缺少教师ID', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await teacherService.getTeacher(teacherId);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取教师配置失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success((result.data as any).config || {}));
}
