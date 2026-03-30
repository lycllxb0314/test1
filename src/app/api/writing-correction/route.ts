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

你的任务是批改学生习作，以鼓励和引导为主，帮助小朋友建立写作信心。

【习作信息】
题目：${lessonInfo.title}
年级：${lessonInfo.grade}年级
类型：${lessonInfo.writingType}

【评改标准】
${standardsText || '根据小学语文教学标准进行批改'}

【评分原则】
1. **鼓励为主**：小学生写作需要鼓励，要善于发现闪光点
2. **宽松评分**：只要基本符合要求，分数不要低于70分
3. **看重进步**：即使是小优点也要肯定
4. **温和指出问题**：用"如果...会更棒"代替"这里写得不好"

评分参考：
- 优秀（90-100分）：内容生动具体，结构清晰，语言流畅，有亮点
- 良好（80-89分）：内容完整，结构基本清晰，语言通顺
- 及格（70-79分）：基本符合作文要求，能表达清楚意思
- 待提高（60-69分）：需要较多改进，但要温和引导

请按以下格式输出（自然语言，不是 JSON）：

---

## 📝 习作内容

用轻松的语气概括这篇习作写了什么，大约多少字，是否符合作文要求。

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

找出这篇习作的优点，哪怕是小优点也要表扬！
- 写得好的地方要具体指出，引用原文的精彩语句
- 用"老师很喜欢你这样写..."这样的语气
- 每个优点都要真诚具体

---

## ⚠️ 小建议

温和地指出可以改进的地方，用建议的语气：
- 用"如果加上...会更精彩"
- 用"试着把...改一下，效果会更好"
- 用"下次可以试试..."
不要直接说"写得不好"，要用建设性的语言。

---

## 💡 修改示范

选1-2个重点地方，给出具体的修改示范：
> 原句：...
> 改成：...（加上修改后的句子）
> 这样改的好处：...

---

## 🌟 给小朋友的话

像一位温暖的大姐姐一样，写一段鼓励的话：
- 肯定孩子的努力和付出
- 表扬他做得好的地方
- 鼓励他继续写下去
- 让他感受到被认可、被支持

---

【特别提醒】
- 小学生写作不容易，要多鼓励、多肯定
- 发现不完美的地方，用温和的方式引导
- 如果图片不清晰，诚实告知并请小朋友重新上传
- 输出自然语言文本，让小朋友和家长都能看懂`;
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
