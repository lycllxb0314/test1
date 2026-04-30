// app/api/after-school/ai/route.ts
// 课后服务 AI 边车 - 统一 API 入口
// 支持 SSE 流式输出（chat/generate-content/generate-feedback）和非流式（predict）

import { NextRequest, NextResponse } from 'next/server';
import {
  streamCopilotChat,
  copilotChat,
  predictCourseDemand,
  streamGenerateCourseContent,
  generateCourseContent,
  streamGenerateFeedback,
  generateFeedback,
} from '@/services/after-school-ai.service';
import type { AIAction, CopilotRequest, PredictionRequest, CourseGenerationRequest, StudentFeedbackInput } from '@/types/after-school-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload, stream = true } = body as {
      action: AIAction;
      payload: CopilotRequest | PredictionRequest | CourseGenerationRequest | StudentFeedbackInput;
      stream?: boolean;
    };

    switch (action) {
      // ==================== Feature 1: 智能客服 (流式优先) ====================
      case 'chat': {
        const chatPayload = payload as CopilotRequest;

        if (stream) {
          // SSE 流式输出
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamCopilotChat(chatPayload, request)) {
                  const data = JSON.stringify({ content: chunk });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'AI 服务异常';
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
                );
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }

        // 非流式降级
        const reply = await copilotChat(chatPayload, request);
        return NextResponse.json({ success: true, data: { reply } });
      }

      // ==================== Feature 2: 需求预测 (非流式) ====================
      case 'predict': {
        const predictPayload = payload as PredictionRequest;
        const predictions = await predictCourseDemand(predictPayload, request);
        return NextResponse.json({ success: true, data: predictions });
      }

      // ==================== Feature 3: 课程内容生成 (流式优先) ====================
      case 'generate-content': {
        const genPayload = payload as CourseGenerationRequest;

        if (stream) {
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamGenerateCourseContent(genPayload, request)) {
                  const data = JSON.stringify({ content: chunk });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'AI 服务异常';
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
                );
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }

        // 非流式
        const content = await generateCourseContent(genPayload, request);
        return NextResponse.json({ success: true, data: content });
      }

      // ==================== Feature 4: 智能评语反馈 (流式优先) ====================
      case 'generate-feedback': {
        const feedbackPayload = payload as StudentFeedbackInput;

        if (stream) {
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamGenerateFeedback(feedbackPayload, request)) {
                  const data = JSON.stringify({ content: chunk });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'AI 服务异常';
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
                );
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }

        // 非流式
        const feedback = await generateFeedback(feedbackPayload, request);
        return NextResponse.json({ success: true, data: { feedback } });
      }

      default:
        return NextResponse.json(
          { success: false, error: `未知的 AI action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AfterSchoolAI] POST error:', error);
    const message = error instanceof Error ? error.message : 'AI 服务异常';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
