/**
 * 习作教学 Service
 * 
 * 全流程备课：情境创设、提纲、素材、分层任务、评改指导、常见问题
 * 采用并行生成策略提升效率
 * 
 * @module services/writing-teaching.service
 */

import { BaseService, ServiceResult } from './base.service';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type {
  WritingType,
  WritingOutline,
  GoodExpressions,
  TieredTask,
  EvaluationGuide,
  WritingIssue,
  WritingRequest,
  WritingResponse,
} from '@/types/chinese-prep';

/**
 * 习作教学服务
 */
export class WritingTeachingService extends BaseService {
  private llmClient: LLMClient;

  constructor(customHeaders?: Record<string, string>) {
    super();
    const config = new Config();
    this.llmClient = new LLMClient(config, customHeaders);
  }

  /**
   * 生成完整习作备课方案 - 并行生成策略
   */
  async generateWritingPlan(request: WritingRequest): Promise<ServiceResult<WritingResponse>> {
    const { unit, writingType, grade, topic } = request;

    try {
      // 并行生成各模块
      const [outlineResult, expressionsResult, tasksResult, evaluationResult, issuesResult] = await Promise.all([
        this.generateOutline(unit, writingType, grade, topic),
        this.generateExpressions(unit, writingType, grade, topic),
        this.generateTieredTasks(unit, writingType, grade, topic),
        this.generateEvaluationGuide(unit, writingType, grade, topic),
        this.generateCommonIssues(unit, writingType, grade, topic),
      ]);

      const result: WritingResponse = {
        topic: topic || unit,
        writingType,
        outline: outlineResult.outline,
        expressions: expressionsResult.expressions,
        tieredTasks: tasksResult.tieredTasks,
        evaluationGuide: evaluationResult.evaluationGuide,
        commonIssues: issuesResult.commonIssues,
        sampleFramework: '',
      };

      return this.ok(result);
    } catch (error) {
      console.error('[WritingTeachingService] generateWritingPlan error:', error);
      return this.fail('生成习作备课方案失败', 'GENERATION_FAILED');
    }
  }

  /**
   * 生成写作提纲 - 并行模块1
   */
  private async generateOutline(
    unit: string,
    writingType: WritingType,
    grade: number,
    topic?: string
  ): Promise<{ outline: WritingOutline }> {
    const prompt = `你是小学语文写作教学专家。请为以下习作设计写作提纲。

【习作信息】
单元主题：${unit}
习作类型：${writingType}
年级：${grade}年级
具体题目：${topic || '根据单元主题自定'}

【严格要求】
1. 结构设计要符合${grade}年级学生认知水平
2. 每个部分的具体内容要结合题目特点
3. 过渡语句要自然流畅

【输出JSON格式】
{
  "title": "习作标题",
  "structure": [
    {
      "section": "开头",
      "content": "具体写法指导",
      "keyPoints": ["要点1", "要点2"],
      "wordCount": "约XX字"
    },
    {
      "section": "中间（主体）",
      "content": "主体部分的写法指导",
      "keyPoints": ["具体事例", "细节描写", "情感表达"],
      "wordCount": "约XX字"
    },
    {
      "section": "结尾",
      "content": "结尾的写法指导",
      "keyPoints": ["总结升华"],
      "wordCount": "约XX字"
    }
  ],
  "transitionPhrases": ["过渡句1", "过渡句2", "过渡句3"]
}

只输出JSON。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'deepseek-v3-2-251201', temperature: 0.6 }
      );

      const data = this.extractJSON(response.content);
      
      return {
        outline: {
          title: (data.title as string) || topic || unit,
          structure: (data.structure as Array<{
            section: string;
            content: string;
            keyPoints: string[];
            wordCount: string;
          }>) || this.getDefaultOutline(),
          transitionPhrases: (data.transitionPhrases as string[]) || [],
        },
      };
    } catch (error) {
      console.error('[WritingTeachingService] generateOutline error:', error);
      return { outline: { title: topic || unit, structure: this.getDefaultOutline(), transitionPhrases: [] } };
    }
  }

  /**
   * 生成好词好句 - 并行模块2
   */
  private async generateExpressions(
    unit: string,
    writingType: WritingType,
    grade: number,
    topic?: string
  ): Promise<{ expressions: GoodExpressions }> {
    const prompt = `你是小学语文写作教学专家。请为以下习作准备好词好句素材。

【习作信息】
单元主题：${unit}
习作类型：${writingType}
年级：${grade}年级
具体题目：${topic || '根据单元主题自定'}

【严格要求】
1. 词语要适合${grade}年级学生使用
2. 句子要有示范性，包含修辞手法
3. 素材要与题目紧密相关

【输出JSON格式】
{
  "words": [
    {"word": "词语", "meaning": "意思解释", "usage": "造句示例"},
    {"word": "词语2", "meaning": "意思", "usage": "造句"}
  ],
  "sentences": [
    {"sentence": "精彩句子", "technique": "修辞手法", "imitation": "仿写示例"},
    {"sentence": "精彩句子2", "technique": "手法", "imitation": "仿写"}
  ],
  "paragraphs": [
    {"content": "开头范例段落", "analysis": "好在哪里"},
    {"content": "结尾范例段落", "analysis": "好在哪里"}
  ]
}

只输出JSON。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'deepseek-v3-2-251201', temperature: 0.6 }
      );

      const data = this.extractJSON(response.content);
      
      return {
        expressions: {
          words: (data.words as Array<{ word: string; meaning: string; usage: string }>) || [],
          sentences: (data.sentences as Array<{ sentence: string; technique: string; imitation: string }>) || [],
          paragraphs: (data.paragraphs as Array<{ content: string; analysis: string }>) || [],
        },
      };
    } catch (error) {
      console.error('[WritingTeachingService] generateExpressions error:', error);
      return { expressions: { words: [], sentences: [], paragraphs: [] } };
    }
  }

  /**
   * 生成分层任务 - 并行模块3
   */
  private async generateTieredTasks(
    unit: string,
    writingType: WritingType,
    grade: number,
    topic?: string
  ): Promise<{ tieredTasks: TieredTask[] }> {
    const prompt = `你是小学语文写作教学专家。请为以下习作设计分层训练任务。

【习作信息】
单元主题：${unit}
习作类型：${writingType}
年级：${grade}年级
具体题目：${topic || '根据单元主题自定'}

【严格要求】
1. 基础层：确保所有学生能完成基本写作任务
2. 提高层：在基础上有提升，增加细节要求
3. 拓展层：创意表达，个性化发挥

【输出JSON格式】
{
  "tieredTasks": [
    {
      "level": "basic",
      "levelName": "基础层",
      "task": "完成基本写作任务描述",
      "requirements": ["要求1：内容完整", "要求2：语句通顺", "要求3：标点正确"],
      "scaffold": "支架提示：帮助学生完成任务的提示",
      "evaluationCriteria": ["字数达标", "内容完整"]
    },
    {
      "level": "intermediate",
      "levelName": "提高层",
      "task": "提高层任务描述",
      "requirements": ["要求1：细节描写", "要求2：情感真实", "要求3：过渡自然"],
      "scaffold": "",
      "evaluationCriteria": ["描写生动", "情感真挚"]
    },
    {
      "level": "advanced",
      "levelName": "拓展层",
      "task": "拓展层任务描述",
      "requirements": ["要求1：创意表达", "要求2：个性鲜明", "要求3：手法多样"],
      "scaffold": "",
      "evaluationCriteria": ["立意新颖", "表达独特"]
    }
  ]
}

只输出JSON。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'deepseek-v3-2-251201', temperature: 0.6 }
      );

      const data = this.extractJSON(response.content);
      
      return {
        tieredTasks: (data.tieredTasks as TieredTask[]) || [],
      };
    } catch (error) {
      console.error('[WritingTeachingService] generateTieredTasks error:', error);
      return { tieredTasks: [] };
    }
  }

  /**
   * 生成评改指导 - 并行模块4
   */
  private async generateEvaluationGuide(
    unit: string,
    writingType: WritingType,
    grade: number,
    topic?: string
  ): Promise<{ evaluationGuide: EvaluationGuide }> {
    const prompt = `你是小学语文写作教学专家。请为以下习作设计评改指导方案。

【习作信息】
单元主题：${unit}
习作类型：${writingType}
年级：${grade}年级
具体题目：${topic || '根据单元主题自定'}

【严格要求】
1. 自查清单要具体，学生能对照检查
2. 互评模板要简单易操作
3. 教师评价标准要清晰明确

【输出JSON格式】
{
  "selfCheck": [
    {
      "aspect": "内容",
      "questions": ["我写清楚了吗？", "有没有遗漏重要内容？", "事例是否具体？"]
    },
    {
      "aspect": "结构",
      "questions": ["开头是否吸引人？", "段落是否清楚？", "结尾是否有力？"]
    },
    {
      "aspect": "语言",
      "questions": ["语句是否通顺？", "有没有用上好词好句？", "标点是否正确？"]
    }
  ],
  "peerReview": {
    "items": [
      {"criterion": "内容完整", "score": 5, "comment": ""},
      {"criterion": "语句通顺", "score": 5, "comment": ""},
      {"criterion": "书写工整", "score": 5, "comment": ""}
    ],
    "template": "我读了___的作文，觉得___写得特别好，建议___可以改进。"
  },
  "teacherRubric": [
    {
      "dimension": "内容",
      "excellent": "内容具体生动，有真情实感",
      "good": "内容较完整，有一定感情",
      "improving": "内容简单，缺乏细节"
    },
    {
      "dimension": "结构",
      "excellent": "结构完整，层次分明",
      "good": "结构较清晰",
      "improving": "结构不够完整"
    },
    {
      "dimension": "语言",
      "excellent": "语言生动，有文采",
      "good": "语句通顺流畅",
      "improving": "语句欠通顺"
    }
  ]
}

只输出JSON。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'deepseek-v3-2-251201', temperature: 0.6 }
      );

      const data = this.extractJSON(response.content);
      
      return {
        evaluationGuide: {
          selfCheck: (data.selfCheck as Array<{ aspect: string; questions: string[] }>) || [],
          peerReview: (data.peerReview as { items: Array<{ criterion: string; score: number; comment: string }>; template: string }) || { items: [], template: '' },
          teacherRubric: (data.teacherRubric as Array<{ dimension: string; excellent: string; good: string; improving: string }>) || [],
        },
      };
    } catch (error) {
      console.error('[WritingTeachingService] generateEvaluationGuide error:', error);
      return { evaluationGuide: { selfCheck: [], peerReview: { items: [], template: '' }, teacherRubric: [] } };
    }
  }

  /**
   * 生成常见问题 - 并行模块5
   */
  private async generateCommonIssues(
    unit: string,
    writingType: WritingType,
    grade: number,
    topic?: string
  ): Promise<{ commonIssues: WritingIssue[] }> {
    const prompt = `你是小学语文写作教学专家。请预设以下习作中学生可能出现的常见问题。

【习作信息】
单元主题：${unit}
习作类型：${writingType}
年级：${grade}年级
具体题目：${topic || '根据单元主题自定'}

【严格要求】
1. 问题要结合${grade}年级学生实际
2. 预防策略要具体可操作
3. 纠正指导要有针对性

【输出JSON格式】
{
  "commonIssues": [
    {
      "issue": "内容空洞",
      "manifestation": "没有具体事例，只有概括性描述",
      "cause": "缺乏素材积累，观察不够细致",
      "preventionStrategy": "课前引导学生回忆相关经历，列提纲时要求写出具体事例",
      "correctionGuide": "追问细节：当时看到了什么？听到了什么？心里怎么想的？"
    },
    {
      "issue": "条理不清",
      "manifestation": "想到哪写到哪，没有顺序",
      "cause": "缺乏整体规划意识",
      "preventionStrategy": "写作前画思维导图，明确写作顺序",
      "correctionGuide": "用连接词串联：首先、然后、最后"
    },
    {
      "issue": "情感虚假",
      "manifestation": "感情表达不真实，套话多",
      "cause": "为写而写，缺乏真实体验",
      "preventionStrategy": "选择学生有真实体验的话题",
      "correctionGuide": "引导回忆当时的真实感受"
    }
  ]
}

只输出JSON。`;

    try {
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'deepseek-v3-2-251201', temperature: 0.6 }
      );

      const data = this.extractJSON(response.content);
      
      return {
        commonIssues: (data.commonIssues as WritingIssue[]) || [],
      };
    } catch (error) {
      console.error('[WritingTeachingService] generateCommonIssues error:', error);
      return { commonIssues: [] };
    }
  }

  /**
   * 从响应中提取 JSON
   */
  private extractJSON(content: string): Record<string, unknown> {
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = content.slice(firstBrace, lastBrace + 1);
      }
    }
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1').replace(/[\x00-\x1F\x7F]/g, '');
    return JSON.parse(jsonStr);
  }

  /**
   * 获取默认提纲结构
   */
  private getDefaultOutline(): Array<{
    section: string;
    content: string;
    keyPoints: string[];
    wordCount: string;
  }> {
    return [
      { section: '开头', content: '引出主题', keyPoints: [], wordCount: '约50字' },
      { section: '中间', content: '具体描写', keyPoints: [], wordCount: '约300字' },
      { section: '结尾', content: '总结升华', keyPoints: [], wordCount: '约50字' },
    ];
  }
}

/** 习作教学服务实例工厂 */
export function createWritingTeachingService(customHeaders?: Record<string, string>): WritingTeachingService {
  return new WritingTeachingService(customHeaders);
}
