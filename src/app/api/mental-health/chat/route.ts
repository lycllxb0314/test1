/**
 * 暖心童童对话 API（SSE 流式）
 * POST /api/mental-health/chat
 *
 * 请求体: { sessionId?, message, studentId? }
 * studentId: 人脸验证后传入，多孩子时必须指定
 */

import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { authenticateRequest } from '@/lib/auth/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // 认证用户
    const authResult = await authenticateRequest(request);
    console.log('[Chat API] authResult:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      error: authResult.error,
      userId: authResult.user?.id,
    });
    if (!authResult.user) {
      return NextResponse.json({ error: authResult.error || '请先登录' }, { status: 401 });
    }
    const userId = authResult.user.id;

    const body = await request.json();
    const { sessionId, message, studentId: bodyStudentId } = body as {
      sessionId?: string;
      message?: string;
      studentId?: string;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    // 获取 studentId：优先用前端传入的（人脸验证后设定），否则从家长记录取
    let studentId = bodyStudentId || null;

    if (!studentId) {
      studentId = await getStudentIdFromParent(userId);
    } else {
      // 验证该学生确实属于该家长
      const isChild = await verifyChildBelongsToParent(userId, studentId);
      if (!isChild) {
        return NextResponse.json({ error: '无权访问该学生的数据' }, { status: 403 });
      }
    }

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

/** 通过家长 ID 获取关联学生 ID（取第一个） */
async function getStudentIdFromParent(parentId: string): Promise<string | null> {
  const { getSupabaseClient } = await import('@/storage/database/supabase-client');
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('parents')
    .select('student_id')
    .eq('account_id', parentId)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].student_id as string;
}

/** 验证学生是否属于该家长 */
async function verifyChildBelongsToParent(parentId: string, studentId: string): Promise<boolean> {
  const { getSupabaseClient } = await import('@/storage/database/supabase-client');
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('parents')
    .select('id')
    .eq('account_id', parentId)
    .eq('student_id', studentId)
    .limit(1);

  if (error || !data || data.length === 0) return false;
  return true;
}
