// hooks/useAfterSchoolAI.ts
// 课后服务 AI 边车 - React Hooks 层
// 支持 SSE 流式读取 + 非流式调用

import { useState, useCallback, useRef } from 'react';
import type {
  ChatMessage,
  CopilotRequest,
  PredictionRequest,
  CoursePrediction,
  CourseGenerationRequest,
  GeneratedCourseContent,
  StudentFeedbackInput,
  AIAction,
} from '@/types/after-school-ai';

// ==================== SSE 流式读取工具 ====================

async function readSSEStream(
  url: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      onError((errData as Record<string, string>).error || `请求失败 (${response.status})`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('无法读取响应流');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch {
            // 忽略无法解析的行
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error.message : '网络异常');
  }
}

// ==================== Feature 1: 智能客服 Hook ====================

export function useCopilotChat(studentGrade: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<boolean>(false);

  const sendMessage = useCallback(
    async (userContent: string) => {
      const userMessage: ChatMessage = { role: 'user', content: userContent };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // 添加空的 assistant 消息用于流式填充
      const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
      setMessages([...updatedMessages, assistantMessage]);
      setIsStreaming(true);
      abortRef.current = false;

      const payload: CopilotRequest = {
        messages: updatedMessages,
        studentGrade,
      };

      await readSSEStream(
        '/api/after-school/ai',
        { action: 'chat', payload, stream: true },
        (text) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
              newMsgs[lastIdx] = {
                ...newMsgs[lastIdx],
                content: newMsgs[lastIdx].content + text,
              };
            }
            return newMsgs;
          });
        },
        () => {
          setIsStreaming(false);
        },
        (error) => {
          setMessages((prev) => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
              newMsgs[lastIdx] = {
                ...newMsgs[lastIdx],
                content: newMsgs[lastIdx].content || `[错误: ${error}]`,
              };
            }
            return newMsgs;
          });
          setIsStreaming(false);
        }
      );
    },
    [messages, studentGrade]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming, clearMessages };
}

// ==================== Feature 2: 需求预测 Hook ====================

export function useCoursePrediction() {
  const [predictions, setPredictions] = useState<CoursePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (request?: PredictionRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/after-school/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'predict', payload: request || {}, stream: false }),
      });
      const result = await response.json();
      if (result.success) {
        setPredictions(result.data || []);
      } else {
        setError(result.error || '预测失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络异常');
    } finally {
      setLoading(false);
    }
  }, []);

  return { predictions, loading, error, predict };
}

// ==================== Feature 3: 课程内容生成 Hook ====================

export function useCourseGeneration() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedCourseContent | null>(null);
  const [streamText, setStreamText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (request: CourseGenerationRequest) => {
    setIsGenerating(true);
    setGeneratedContent(null);
    setStreamText('');

    // 先用流式展示生成过程
    await readSSEStream(
      '/api/after-school/ai',
      { action: 'generate-content', payload: request, stream: true },
      (text) => {
        setStreamText((prev) => prev + text);
      },
      async () => {
        // 流式完成后，再用非流式获取结构化结果用于回填
        try {
          const response = await fetch('/api/after-school/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-content', payload: request, stream: false }),
          });
          const result = await response.json();
          if (result.success && result.data) {
            setGeneratedContent(result.data as GeneratedCourseContent);
          }
        } catch {
          // 非流式获取失败不影响，流式文本已展示
        }
        setIsGenerating(false);
      },
      (error) => {
        setStreamText((prev) => prev || `[生成失败: ${error}]`);
        setIsGenerating(false);
      }
    );
  }, []);

  const clearContent = useCallback(() => {
    setGeneratedContent(null);
    setStreamText('');
  }, []);

  return { generatedContent, streamText, isGenerating, generate, clearContent };
}

// ==================== Feature 4: 智能评语 Hook ====================

export function useFeedbackGeneration() {
  const [feedback, setFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (input: StudentFeedbackInput) => {
    setIsGenerating(true);
    setFeedback('');

    await readSSEStream(
      '/api/after-school/ai',
      { action: 'generate-feedback', payload: input, stream: true },
      (text) => {
        setFeedback((prev) => prev + text);
      },
      () => {
        setIsGenerating(false);
      },
      (error) => {
        setFeedback((prev) => prev || `[生成失败: ${error}]`);
        setIsGenerating(false);
      }
    );
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback('');
  }, []);

  return { feedback, isGenerating, generate, clearFeedback };
}
