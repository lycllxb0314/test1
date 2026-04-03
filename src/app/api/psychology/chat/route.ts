/**
 * LLM 流式对话 API
 * 
 * 短生命周期函数：接收用户消息，流式返回 AI 回复
 * 使用 SSE (Server-Sent Events) 实现实时流式输出
 * 集成危机关键词检测
 */

import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { TONGTONG_SYSTEM_PROMPT, type ChatStreamChunk } from '@/types/psychology';
import { detectCrisis, psychologySessionService, psychologyMessageService, psychologyAlertService } from '@/services/psychology.service';

export const runtime = 'nodejs';
export const maxDuration = 30; // 最大执行时间 30 秒

/**
 * POST /api/psychology/chat
 * 
 * 请求体：
 * - sessionId: string (会话 ID)
 * - message: string (用户消息)
 * - studentId: string (学生 ID)
 * - history?: Array<{ role, content }> (对话历史)
 * 
 * 返回：SSE 流
 * - type: 'text' | 'emotion' | 'crisis' | 'done'
 * - content?: string
 * - emotion?: string
 * - isCrisis?: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, studentId, history = [] } = body;

    if (!message || !studentId) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 危机关键词检测
    const crisisResult = detectCrisis(message);

    // 构建 LLM 消息
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: TONGTONG_SYSTEM_PROMPT },
      ...history.slice(-10), // 保留最近 10 轮对话
      { role: 'user', content: message },
    ];

    // 如果检测到危机，添加特殊提示
    if (crisisResult.isCrisis && crisisResult.response) {
      messages.push({
        role: 'system',
        content: `[系统提示：检测到用户可能存在心理危机，关键词：${crisisResult.keywords.join('、')}。请优先表达关心，温和地引导用户寻求专业帮助，并提供以下回复参考：${crisisResult.response}]`,
      });
    }

    // 初始化 LLM 客户端
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    // 创建 SSE 流
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送危机检测结果（如果有）
          if (crisisResult.isCrisis) {
            const crisisChunk: ChatStreamChunk = {
              type: 'crisis',
              isCrisis: true,
              crisisKeywords: crisisResult.keywords,
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(crisisChunk)}\n\n`));
          }

          // 调用 LLM 流式生成
          const llmStream = llmClient.stream(messages, {
            model: 'doubao-seed-1-6-lite-251015', // 使用轻量模型，快速响应
            temperature: 0.8, // 稍高的温度，更自然的对话
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const content = chunk.content.toString();
              fullResponse += content;

              const textChunk: ChatStreamChunk = {
                type: 'text',
                content,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(textChunk)}\n\n`));
            }
          }

          // 保存消息到数据库（异步执行，不阻塞响应）
          saveMessagesAsync(sessionId, studentId, message, fullResponse, crisisResult);

          // 发送完成信号
          const doneChunk: ChatStreamChunk = {
            type: 'done',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));

          controller.close();
        } catch (error) {
          console.error('[Chat API] Stream error:', error);
          const errorChunk: ChatStreamChunk = {
            type: 'text',
            content: '抱歉，我遇到了一些问题，请稍后再试。',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
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
    console.error('[Chat API] Error:', error);
    
    return new Response(
      JSON.stringify({ error: '对话服务暂时不可用' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 异步保存消息到数据库
 */
async function saveMessagesAsync(
  sessionId: string | undefined,
  studentId: string,
  userMessage: string,
  assistantMessage: string,
  crisisResult: ReturnType<typeof detectCrisis>
) {
  try {
    // 如果没有 sessionId，创建新会话
    let actualSessionId = sessionId;
    if (!actualSessionId) {
      const sessionResult = await psychologySessionService.createSession(studentId);
      if (sessionResult.success && sessionResult.data) {
        actualSessionId = sessionResult.data.id;
      }
    }

    if (!actualSessionId) return;

    // 保存用户消息
    await psychologyMessageService.addMessage({
      sessionId: actualSessionId,
      role: 'user',
      content: userMessage,
      isCrisis: crisisResult.isCrisis,
      crisisKeywords: crisisResult.keywords,
    });

    // 保存助手消息
    await psychologyMessageService.addMessage({
      sessionId: actualSessionId,
      role: 'assistant',
      content: assistantMessage,
    });

    // 如果检测到危机，创建预警
    if (crisisResult.isCrisis && crisisResult.level) {
      await psychologyAlertService.autoCreateAlert(
        studentId,
        actualSessionId,
        crisisResult,
        userMessage
      );
    }
  } catch (error) {
    console.error('[Chat API] Save messages error:', error);
  }
}
