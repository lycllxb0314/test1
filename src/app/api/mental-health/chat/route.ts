/**
 * 暖心童童对话 API（SSE 流式）
 * POST /api/mental-health/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';

export async function POST(request: NextRequest) {
  try {
    // 简单认证：从请求头获取用户信息
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    // 通过家长身份获取关联学生的 ID
    const studentId = await getStudentIdFromParent(userId);
    if (!studentId) {
      return NextResponse.json({ error: '未找到关联的学生信息' }, { status: 403 });
    }

    // 流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of mentalHealthService.chatStream(
            studentId,
            sessionId || null,
            message,
            request,
          )) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.close();
        } catch (error) {
          console.error('[MentalHealth Chat Stream Error]:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: '对话失败' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[MentalHealth Chat API Error]:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

/** 通过家长 ID 获取关联学生 ID */
async function getStudentIdFromParent(parentId: string): Promise<string | null> {
  const { getSupabaseClient } = await import('@/storage/database/supabase-client');
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('parents')
    .select('student_id')
    .eq('user_id', parentId)
    .single();

  if (error || !data) return null;
  return data.student_id as string;
}
