/**
 * 教师日程 API
 * 
 * GET: 获取教师日程
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师日程
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
      error(result.error || '获取教师日程失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 返回教师的课程安排作为日程
  return NextResponse.json(success({
    teacherId: result.data.id,
    teacherName: result.data.name,
    schedule: (result.data as any).schedule || [],
  }));
}
