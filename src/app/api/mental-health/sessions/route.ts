/**
 * 会话管理 API
 * GET /api/mental-health/sessions           - 所有会话列表（分页）
 * GET /api/mental-health/sessions?studentId - 学生会话列表
 * GET /api/mental-health/sessions?sessionId - 会话详情（含消息）
 * GET /api/mental-health/sessions?classId   - 班级学生心理摘要
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, successPaginated, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';

// 学生会话列表
export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sessionId = searchParams.get('sessionId');
    const classId = searchParams.get('classId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 班级学生心理摘要
    if (classId) {
      const summaries = await mentalHealthService.getClassStudentSummaries(classId);
      return NextResponse.json(success(summaries, 'database'));
    }

    // 会话详情
    if (sessionId) {
      const detail = await mentalHealthService.getSessionDetail(sessionId);
      if (!detail) {
        return NextResponse.json(error('会话不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(detail, 'database'));
    }

    // 学生会话列表
    if (studentId) {
      const sessions = await mentalHealthService.getStudentSessions(studentId);
      return NextResponse.json(success(sessions, 'database'));
    }

    // 所有会话列表（分页）
    const result = await mentalHealthService.getAllSessions(page, pageSize);
    return NextResponse.json(successPaginated(result.sessions, {
      page,
      pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / pageSize),
    }));
  } catch (err) {
    console.error('[MentalHealth Sessions GET Error]:', err);
    return NextResponse.json(error('获取会话失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
