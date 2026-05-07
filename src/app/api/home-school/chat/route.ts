import { NextRequest, NextResponse } from 'next/server';
import { homeSchoolService } from '@/services/home-school.service';
import { authenticateRequest } from '@/lib/auth/auth-middleware';
import { success, error, ErrorCode } from '@/lib/api';

// POST /api/home-school/chat - 家校沟通聊天
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  const teacherId = authResult.user.id;
  const body = await request.json();
  const { message, conversationId, classId, studentId, studentName, contextType } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json(error('消息内容不能为空', ErrorCode.BAD_REQUEST), { status: 400 });
  }

  // 创建 SSE 流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of homeSchoolService.chatStream(message, teacherId, {
          conversationId,
          classId,
          studentId,
          studentName,
          contextType,
        })) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.close();
      } catch (err) {
        console.error('[HomeSchool Chat API] Stream error:', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: '发生错误' })}\n\n`));
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
}
