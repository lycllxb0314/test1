/**
 * 教师日程 API
 * 
 * GET: 获取教师日程
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师日程
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId') || user.id;

  const result = await teacherService.getTeacher(teacherId);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取教师日程失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 返回教师的课程安排作为日程
  const schedule = result.data && typeof result.data === 'object' && 'schedule' in result.data 
    ? (result.data as { schedule?: unknown }).schedule 
    : [];
  
  return NextResponse.json(success({
    teacherId: result.data?.id,
    teacherName: result.data?.name,
    schedule: schedule || [],
  }));
});
