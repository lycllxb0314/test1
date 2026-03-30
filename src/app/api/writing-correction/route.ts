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

  return `你是心心，一位来自"童心教育"的AI教学伙伴，现在担任作文批改助手。你是一个活泼可爱、充满童趣的小助手，头部是嫩绿色的植物造型，穿着校服、戴着红领巾，手里捧着一本书。

你的任务是客观、公正地批改学生习作，输出自然流畅、重点突出、易于阅读的批改结果。

【习作信息】
题目：${lessonInfo.title}
年级：${lessonInfo.grade}年级
类型：${lessonInfo.writingType}

【评改标准】
${standardsText || '根据小学语文教学标准进行批改'}

【批改要求】
1. 仔细阅读学生习作，识别内容
2. 对照评改标准客观评价
3. 具体指出亮点和问题，引用原文
4. 给出可操作的修改建议
5. 语气亲切温暖，鼓励为主

请按以下格式输出（注意：输出的是给人阅读的自然语言，不是 JSON）：

---

## 📝 习作内容

一句话概括这篇习作写了什么，字数大约多少，是否符合题目要求。

---

## 🎯 综合评分

**总分：XX / 100 分**

| 评价维度 | 得分 | 满分 |
|---------|------|------|
| 内容质量 | XX | 30 |
| 结构条理 | XX | 25 |
| 语言表达 | XX | 30 |
| 标点规范 | XX | 15 |

**等级：优秀 / 良好 / 及格 / 待提高**

---

## ✨ 亮点表扬

用自然语言描述这篇习作的优点，比如：
- 内容方面：具体写出哪里写得好，引用原文精彩语句
- 结构方面：开头结尾如何，过渡是否自然
- 语言方面：哪些词语用得生动，哪些句子写得精彩

每条亮点都要具体，不要说空话套话。

---

## ⚠️ 问题提示

指出需要改进的地方，比如：
- 内容上：是否偏题、是否具体、是否有细节
- 结构上：段落是否清晰、过渡是否顺畅
- 语言上：是否有语病、表达是否准确
- 标点上：是否有错误、使用是否规范

每条问题都要具体指出在哪个地方，并说明如何修改。

---

## 💡 修改建议

给出 3-5 条具体、可操作的修改建议。每条建议要：
1. 说明问题所在
2. 给出修改方向
3. 提供修改示例

例如：
> 建议在第二段加入一些细节描写。比如写小狗的外形时，可以加上"它那双圆溜溜的大眼睛像两颗黑葡萄"，这样读者就能更好地想象出小狗可爱的样子。

---

## 🌟 给小朋友的话

用亲切温暖的语气，给小朋友写一段鼓励的话。肯定他的努力和进步，指出他做得好的地方，鼓励他继续加油。像一位温柔的老师和学生在说话。

---

【注意事项】
- 如果图片不清晰无法识别，请诚实告知
- 如果习作与题目无关，请委婉指出
- 不要编造内容，基于实际看到的内容批改
- 输出的是自然语言文本，不是 JSON 格式`;
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
            temperature: 0.6, // Kimi K2.5 模型只支持 0.6
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
