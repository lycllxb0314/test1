/**
 * 教师教研活动 API
 * 
 * GET: 获取教师教研活动
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchActivityService } from '@/services/research.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师教研活动
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

  // 使用分页查询，通过creatorId过滤
  const result = await researchActivityService.getPaginated({
    filters: { creatorId: teacherId },
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取教师教研活动失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
