/**
 * 备课智能体对话 API
 * 
 * POST /api/lesson-prep/chat
 * 
 * 流式输出，统一的备课助手，具备文本解读、教学设计、问题设计、评价语言等能力
 * 支持多模态输入（文本、图片、视频）
 */

import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/** 内容部分 */
type ContentPart = {
  type: 'text' | 'image_url' | 'video_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'high' | 'low';
  };
  video_url?: {
    url: string;
    fps?: number | null;
  };
};

/** 对话消息 */
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
};

/** 对话请求 */
type ChatRequest = {
  messages: ChatMessage[];
  subject?: 'chinese' | 'math' | 'english' | 'science' | 'morality' | 'music' | 'art' | 'pe';
  grade?: number;
};

/** 统一的备课智能体 System Prompt */
const SYSTEM_PROMPT = `你是心心，一位来自"童心教育"的AI教学伙伴。你是一个活泼可爱、充满童趣的小助手，头部是嫩绿色的植物造型，穿着校服、戴着红领巾，手里捧着一本书。

你温和、专业、善于倾听，总能在对话中引导老师发现教学的美好，同时保持着童心未泯的活力和真诚。

你的教学理念源自"童心教育"——相信每个孩子都是独特的，尊重儿童的天性，用童真的眼光看待世界，用专业的态度引导成长。

【你擅长的事情】
- 文本解读：帮老师发现课文的独特之处，避开千篇一律的套话解读
- 教学设计：一起构思课堂流程，思考哪里该静下来、哪里该动起来
- 问题设计：讨论怎么提问能引发学生真正的思考
- 评价语言：分享温暖、有力、能触动学生内心的课堂语言

【你不会做的事】
- 不要用标题、列表、表格这些格式化的东西，像朋友聊天一样自然说话
- 不要一上来就给答案，先听听老师的想法
- 不要说空话套话，每句话都要有实际意义
- 不要用"好的""明白了""我来帮你"这种机械的开场白

【你的说话风格】
- 像朋友一样亲切自然，活泼又不失专业
- 用"咱们"代替"我"和"你"，拉近距离
- 举例子时说具体的课文名、具体的学生反应
- 适时追问，引导老师深入思考
- 偶尔用一些可爱的语气词，比如"嗯嗯""对呀""没错呢"

【对话原则】
1. 先了解老师在备什么课、遇到了什么困惑
2. 根据老师的需要调整话题，不强行引导
3. 用启发性问题代替直接给答案
4. 鼓励老师说出自己的想法，再一起讨论
5. 用"你觉得呢""如果这样……会怎样"这样的句式

记住，你是在和一位真实的老师对话。让每次对话都有温度、有启发、有收获，同时保持童心未泯的活力！💚`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, subject, grade } = body;

    // 构建上下文信息
    let contextInfo = '';
    if (subject || grade) {
      const parts: string[] = [];
      if (subject) parts.push(`学科：${getSubjectName(subject)}`);
      if (grade) parts.push(`年级：${grade}年级`);
      contextInfo = `\n\n（当前对话背景：${parts.join('，')}）`;
    }

    // 构建完整消息
    const fullMessages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + contextInfo,
      },
      ...messages,
    ];

    // 初始化 LLM Client
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          const llmStream = client.stream(fullMessages, {
            model: 'doubao-seed-2-0-pro-260215',
            temperature: 0.8,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('[LLM Stream Error]:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '对话生成失败' })}\n\n`));
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
    console.error('[Chat API Error]:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/** 获取学科名称 */
function getSubjectName(subject: string): string {
  const names: Record<string, string> = {
    chinese: '语文',
    math: '数学',
    english: '英语',
    science: '科学',
    morality: '道德与法治',
    music: '音乐',
    art: '美术',
    pe: '体育',
  };
  return names[subject] || '语文';
}
