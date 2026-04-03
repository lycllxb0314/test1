/**
 * 会话管理 API
 * 
 * GET: 获取会话列表
 * POST: 创建新会话
 */

import { NextRequest, NextResponse } from 'next/server';
import { ok, fail, success, error, getQueryParams } from '@/lib/api';
import { psychologySessionService, psychologyMessageService } from '@/services/psychology.service';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { StudentService } from '@/services/student.service';

export const runtime = 'nodejs';

/**
 * GET /api/psychology/sessions
 * 
 * 查询参数：
 * - studentId: string (学生 ID，必填)
 * - page?: number
 * - pageSize?: number
 */
export async function GET(request: NextRequest) {
  try {
    const params = getQueryParams(request);
    const studentId = params.filters.studentId as string;

    if (!studentId) {
      return NextResponse.json(
        error('缺少学生 ID'),
        { status: 400 }
      );
    }

    // 获取会话列表
    const result = await psychologySessionService.getStudentSessions(
      studentId,
      params.pageSize || 20
    );

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取会话列表失败'), { status: 400 });
    }

    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('[Sessions API] GET error:', err);
    return NextResponse.json(error('获取会话列表失败'), { status: 500 });
  }
}

/**
 * POST /api/psychology/sessions
 * 
 * 请求体：
 * - studentId: string (学生 ID)
 * - sessionType?: string (会话类型)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, sessionType } = body;

    if (!studentId) {
      return NextResponse.json(
        error('缺少学生 ID'),
        { status: 400 }
      );
    }

    // 获取或创建活跃会话
    const result = await psychologySessionService.getOrCreateActiveSession(studentId);

    if (!result.success) {
      return NextResponse.json(error(result.error || '创建会话失败'), { status: 400 });
    }

    // 获取会话消息历史
    const messagesResult = await psychologyMessageService.getSessionMessages(result.data!.id);
    
    return NextResponse.json(success({
      session: result.data,
      messages: messagesResult.success ? messagesResult.data : [],
    }));
  } catch (err) {
    console.error('[Sessions API] POST error:', err);
    return NextResponse.json(error('创建会话失败'), { status: 500 });
  }
}
