/**
 * 习作专项 API
 * 
 * POST /api/chinese-prep/writing
 * 
 * 生成习作提纲、好词好句、分层任务、评改指导、常见问题预设
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type {
  WritingType,
  WritingOutline,
  GoodExpressions,
  TieredTask,
  EvaluationGuide,
  WritingIssue,
  WritingRequest,
} from '@/types/chinese-prep';

export async function POST(request: NextRequest) {
  try {
    const body: WritingRequest = await request.json();
    const { unit, writingType, grade, topic } = body;

    if (!unit || !writingType) {
      return NextResponse.json(
        { success: false, error: '请提供单元主题和习作类型' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const prompt = buildWritingPrompt(unit, writingType, grade, topic);
    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.6 }
    );

    const result = parseWritingResponse(response.content, unit, writingType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Writing API Error]:', error);
    return NextResponse.json(getEmptyResult('', '写事'));
  }
}

/** 构建 prompt */
function buildWritingPrompt(
  unit: string,
  writingType: WritingType,
  grade: number,
  topic?: string
): string {
  return `作为小学语文写作教学专家，请为以下习作单元设计完整的备课方案。

单元主题：${unit}
习作类型：${writingType}
年级：${grade}年级
具体题目：${topic || '根据单元主题自定'}

请严格按以下JSON格式输出：

{
  "topic": "${topic || unit}",
  "writingType": "${writingType}",
  "outline": {
    "title": "",
    "structure": [
      {
        "section": "开头",
        "content": "开门见山，引出主题",
        "keyPoints": ["要点1"],
        "wordCount": "约50字"
      },
      {
        "section": "中间",
        "content": "详细描写",
        "keyPoints": ["具体事例", "细节描写"],
        "wordCount": "约300字"
      },
      {
        "section": "结尾",
        "content": "总结升华",
        "keyPoints": ["情感表达"],
        "wordCount": "约50字"
      }
    ],
    "transitionPhrases": ["过渡句1", "过渡句2"]
  },
  "expressions": {
    "words": [
      {"word": "词语", "meaning": "意思", "usage": "用法示例"}
    ],
    "sentences": [
      {"sentence": "精彩句子", "technique": "修辞手法", "imitation": "仿写"}
    ],
    "paragraphs": [
      {"content": "精彩段落", "analysis": "分析"}
    ]
  },
  "tieredTasks": [
    {
      "level": "basic",
      "levelName": "基础层",
      "task": "完成基本写作任务",
      "requirements": ["要求1", "要求2"],
      "scaffold": "支架提示",
      "evaluationCriteria": ["标准1"]
    },
    {
      "level": "intermediate",
      "levelName": "提高层",
      "task": "在基础上有提升",
      "requirements": ["要求1", "要求2"],
      "scaffold": "",
      "evaluationCriteria": ["标准1"]
    },
    {
      "level": "advanced",
      "levelName": "拓展层",
      "task": "创意表达",
      "requirements": ["要求1", "要求2"],
      "scaffold": "",
      "evaluationCriteria": ["标准1"]
    }
  ],
  "evaluationGuide": {
    "selfCheck": [
      {"aspect": "内容", "questions": ["是否写清楚了？", "有没有遗漏？"]}
    ],
    "peerReview": {
      "items": [
        {"criterion": "内容完整", "score": 5, "comment": ""}
      ],
      "template": "互评模板"
    },
    "teacherRubric": [
      {
        "dimension": "内容",
        "excellent": "内容具体生动",
        "good": "内容较完整",
        "improving": "内容简单"
      }
    ]
  },
  "commonIssues": [
    {
      "issue": "内容空洞",
      "manifestation": "没有具体事例",
      "cause": "缺乏素材积累",
      "preventionStrategy": "课前引导回忆",
      "correctionGuide": "补充细节"
    }
  ],
  "sampleFramework": "范文框架示例..."
}

只输出JSON，不要有其他内容。`;
}

/** 解析响应 */
function parseWritingResponse(
  content: string,
  unit: string,
  writingType: WritingType
) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getEmptyResult(unit, writingType);

    const data = JSON.parse(jsonMatch[0]);
    
    return {
      topic: data.topic || unit,
      writingType: data.writingType || writingType,
      outline: data.outline || getEmptyOutline(),
      expressions: data.expressions || { words: [], sentences: [], paragraphs: [] },
      tieredTasks: data.tieredTasks || [],
      evaluationGuide: data.evaluationGuide || getEmptyEvaluationGuide(),
      commonIssues: data.commonIssues || [],
      sampleFramework: data.sampleFramework || '',
    };
  } catch (e) {
    console.error('[Writing Parse Error]:', e);
    return getEmptyResult(unit, writingType);
  }
}

/** 空结果 */
function getEmptyResult(unit: string, writingType: WritingType) {
  return {
    topic: unit,
    writingType,
    outline: getEmptyOutline(),
    expressions: { words: [], sentences: [], paragraphs: [] },
    tieredTasks: [],
    evaluationGuide: getEmptyEvaluationGuide(),
    commonIssues: [],
    sampleFramework: '',
  };
}

/** 空提纲 */
function getEmptyOutline(): WritingOutline {
  return {
    title: '',
    structure: [
      { section: '开头', content: '', keyPoints: [], wordCount: '约50字' },
      { section: '中间', content: '', keyPoints: [], wordCount: '约300字' },
      { section: '结尾', content: '', keyPoints: [], wordCount: '约50字' },
    ],
    transitionPhrases: [],
  };
}

/** 空评改指导 */
function getEmptyEvaluationGuide(): EvaluationGuide {
  return {
    selfCheck: [],
    peerReview: { items: [], template: '' },
    teacherRubric: [],
  };
}
