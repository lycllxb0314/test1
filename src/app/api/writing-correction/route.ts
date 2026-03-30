/**
 * 作文批改 API
 * 
 * POST /api/writing-correction
 * 
 * 使用 Kimi K2.5 视觉模型识别学生习作图片
 * 基于备课方案的评改标准进行客观批改
 * SSE 流式输出批改结果
 */

import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { EvaluationGuide, WritingIssue } from '@/types/chinese-prep';

/** 内容部分 */
type ContentPart = {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'high' | 'low';
  };
};

/** 请求体 */
type CorrectionRequest = {
  images: string[]; // base64 图片数组
  lessonInfo: {
    title: string;
    grade: number;
    writingType: string;
    unit: string;
  };
  writingContent: {
    evaluationGuide?: EvaluationGuide;
    commonIssues?: WritingIssue[];
  };
};

/**
 * 构建批改提示词
 */
function buildCorrectionPrompt(
  lessonInfo: CorrectionRequest['lessonInfo'],
  writingContent: CorrectionRequest['writingContent']
): string {
  const { evaluationGuide, commonIssues } = writingContent;
  
  let standardsText = '';
  
  // 添加教师评价量表
  if (evaluationGuide?.teacherRubric && evaluationGuide.teacherRubric.length > 0) {
    standardsText += '\n【教师评价量表】\n';
    evaluationGuide.teacherRubric.forEach(item => {
      standardsText += `\n**${item.dimension}**\n`;
      standardsText += `- 优秀：${item.excellent}\n`;
      standardsText += `- 良好：${item.good}\n`;
      standardsText += `- 待提高：${item.improving}\n`;
    });
  }
  
  // 添加学生自查清单
  if (evaluationGuide?.selfCheck && evaluationGuide.selfCheck.length > 0) {
    standardsText += '\n【学生自查清单】\n';
    evaluationGuide.selfCheck.forEach((item, idx) => {
      standardsText += `${idx + 1}. **${item.aspect}**\n`;
      item.questions.forEach((q, i) => {
        standardsText += `   ${i + 1}. ${q}\n`;
      });
    });
  }
  
  // 添加常见问题预警
  if (commonIssues && commonIssues.length > 0) {
    standardsText += '\n【常见问题预警】\n';
    commonIssues.slice(0, 8).forEach((issue, idx) => {
      standardsText += `${idx + 1}. **${issue.issue}**：${issue.manifestation}\n`;
      standardsText += `   → 指导策略：${issue.correctionGuide}\n`;
    });
  }

  return `你是心心的作文批改助手，一位专业的语文教师助手。你的任务是客观、公正地批改学生习作。

【习作信息】
- 题目：${lessonInfo.title}
- 年级：${lessonInfo.grade}年级
- 类型：${lessonInfo.writingType}
- 单元：${lessonInfo.unit}

【评改标准】
${standardsText || '（未提供评改标准，请根据小学语文教学标准进行批改）'}

【批改要求】
1. **先仔细阅读学生习作**：识别习作内容，理解学生想表达的意思
2. **对照评改标准**：根据上述评价量表逐项评价
3. **客观公正**：不吝啬表扬，也不回避问题
4. **具体明确**：指出具体哪些地方写得好/不好，引用原文例句
5. **建设性意见**：给出可操作的修改建议

【批改格式】
请按以下格式输出批改结果（使用 Markdown 格式）：

---
## 📝 习作内容识别

（简要复述学生习作的主要内容，识别题目是否符合作文要求）

---

## ⭐ 总体评价

（给出总体印象，评价等级：优秀/良好/及格/待提高）

---

## 📊 分项评价

### 1. 内容质量
- **评价**：（优秀/良好/待提高）
- **亮点**：（具体指出哪些内容写得好，引用原文）
- **问题**：（具体指出哪些内容需要改进）

### 2. 结构条理
- **评价**：（优秀/良好/待提高）
- **亮点**：
- **问题**：

### 3. 语言表达
- **评价**：（优秀/良好/待提高）
- **亮点**：（摘录精彩语句）
- **问题**：（指出表达不清或语病）

### 4. 标点规范
- **评价**：（优秀/良好/待提高）
- **问题**：（具体指出标点错误）

---

## 💡 修改建议

（列出3-5条具体的修改建议，每条建议都要给出示例）

---

## 🌟 鼓励语

（给学生的鼓励话语，温暖、有力量、具体）

---

【特别注意】
- 如果图片不清晰或无法识别，请说明情况并请求重新上传
- 如果习作与题目无关，请委婉指出
- 如果习作明显字数不足或未完成，请提醒
- 不要编造内容，要基于实际看到的内容批改`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CorrectionRequest = await request.json();
    const { images, lessonInfo, writingContent } = body;

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: '请上传习作图片' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 初始化 LLM Client
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建消息内容
    const content: ContentPart[] = [
      {
        type: 'text',
        text: buildCorrectionPrompt(lessonInfo, writingContent),
      },
    ];

    // 添加图片
    images.forEach(imageUrl => {
      content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: 'high',
        },
      });
    });

    const messages = [
      {
        role: 'user' as const,
        content,
      },
    ];

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // 使用 Kimi K2.5 模型（支持视觉，能力强）
          const llmStream = client.stream(messages, {
            model: 'kimi-k2-5-260127',
            temperature: 0.3, // 较低的温度保证批改的客观性和一致性
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
          console.error('[Correction Stream Error]:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '批改生成失败，请重试' })}\n\n`));
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
    console.error('[Correction API Error]:', error);
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
