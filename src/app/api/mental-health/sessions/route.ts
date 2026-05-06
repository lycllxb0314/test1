/**
 * 会话管理 API
 * GET /api/mental-health/sessions           - 学生会话列表（按学生ID）
 * GET /api/mental-health/sessions/:id        - 会话详情（含消息）
 * GET /api/mental-health/sessions/class/:id  - 班级学生心理摘要
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute } from '@/lib/auth';

// 学生会话列表
export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sessionId = searchParams.get('sessionId');
    const classId = searchParams.get('classId');

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

    return NextResponse.json(error('请提供查询参数', ErrorCode.BAD_REQUEST), { status: 400 });
  } catch (err) {
    console.error('[MentalHealth Sessions GET Error]:', err);
    return NextResponse.json(error('获取会话失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
