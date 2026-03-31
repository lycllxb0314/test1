/**
 * 同步教师班级 API
 * 
 * POST: 同步教师班级关系
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * POST - 同步教师班级关系
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { teacherId, classIds } = body;

  if (!teacherId || !Array.isArray(classIds)) {
    return NextResponse.json(
      error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await teacherService.batchUpdate({
    ids: [teacherId],
    updates: { class_ids: classIds },
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '同步教师班级失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ updated: true }));
}
