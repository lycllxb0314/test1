/**
 * 智慧作业 Service
 *
 * 本体论推导设计：
 * - 管理对象：试题(Question)、试卷(Paper)、细目表(Specification)
 * - 管理行为：
 *   1. 需求对话 → 因果推理揣测教师意图
 *   2. 细目表生成 → 基于布鲁姆认知分类的双向细目表
 *   3. 智能命题 → 按细目表约束出题
 *   4. 选题组卷 → 试题篮 + 排版出卷
 * - 管理组织：知识维度 × 认知维度 × 难度维度
 *
 * @module services/smart-homework.service
 */

import { BaseService, ServiceResult } from './base.service';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { questionBankRepository } from '@/repositories/question-bank.repository';
import { examPaperRepository } from '@/repositories/exam-paper.repository';
import type {
  SpecificationTable,
  KnowledgeContent,
  CognitiveAllocation,
  CognitiveSummary,
  QuestionTypePlan,
  DifficultyDistribution,
  InferredRequirements,
  DialogMessage,
  ChatRequest,
  Question,
  QuestionType,
  Difficulty,
  CognitiveLevel,
  ExamType,
  QuestionOption,
  PaperQuestion,
  PaperLayoutConfig,
  ExamPaper,
  ImportQuestionRequest,
  ComposePaperRequest,
  QuestionBankQuery,
} from '@/types/smart-homework';

import {
  COGNITIVE_LEVEL_LABELS as COG_LABELS,
  QUESTION_TYPE_LABELS as QT_LABELS,
  DIFFICULTY_LABELS as DIFF_LABELS,
  EXAM_TYPE_LABELS,
  QUESTION_TYPE_LABELS,
  COGNITIVE_LEVEL_LABELS,
} from '@/types/smart-homework';

// ==================== 常量 ====================

/** 学科知识点体系（核心学科） */
const SUBJECT_KNOWLEDGE: Record<string, Record<number, string[]>> = {
  '语文': {
    1: ['拼音', '识字', '词语', '简单句子', '看图写话'],
    2: ['字词积累', '近义词反义词', '句式变换', '阅读理解基础', '写话'],
    3: ['词语理解', '段落理解', '修辞手法', '记叙文写作', '古诗文入门'],
    4: ['词语运用', '篇章理解', '说明文基础', '习作表达', '古诗文鉴赏'],
    5: ['词句赏析', '文章结构', '议论文入门', '创意写作', '文言文基础'],
    6: ['深度阅读', '文学鉴赏', '议论文写作', '综合表达', '文言文理解'],
  },
  '数学': {
    1: ['10以内加减法', '20以内加减法', '认识图形', '认识钟表', '分类比较'],
    2: ['100以内加减法', '乘法口诀', '长度单位', '角的认识', '数据收集'],
    3: ['万以内加减法', '多位数乘一位数', '长方形正方形', '分数初步', '时分秒'],
    4: ['大数认识', '三位数乘两位数', '除数是两位数除法', '平行四边形梯形', '条形统计图'],
    5: ['小数乘除法', '简易方程', '多边形面积', '因数倍数', '折线统计图'],
    6: ['分数乘除法', '圆', '百分数', '比的认识', '圆柱圆锥'],
  },
  '英语': {
    1: ['字母认读', '简单问候', '颜色数字', '常见动物', '家庭成员'],
    2: ['日常交际', '方位介词', '食物饮料', '身体部位', '天气表达'],
    3: ['一般现在时', '名词单复数', '简单阅读', '基础写作', '情景对话'],
    4: ['现在进行时', '一般过去时入门', '短篇阅读', '句型转换', '看图写作'],
    5: ['一般过去时', '情态动词', '阅读理解', '书面表达', '听力策略'],
    6: ['现在完成时入门', '被动语态入门', '综合阅读', '话题写作', '交际运用'],
  },
};

/**
 * 智慧作业服务
 */
export class SmartHomeworkService extends BaseService {
  private llmClient: LLMClient;

  constructor(customHeaders?: Record<string, string>) {
    super();
    const config = new Config();
    this.llmClient = new LLMClient(config, customHeaders);
  }

  // ==================== 1. 需求对话（因果推理） ====================

  /**
   * 与教师进行需求确认对话
   *
   * AI 因果推理逻辑：
   * 1. 从教师描述中提取显性需求（科目、年级、题型等）
   * 2. 基于教育学因果链推断隐性需求（认知层次、难度分布等）
   * 3. 识别潜在矛盾并主动询问
   * 4. 生成建议调整项
   */
  async chatWithTeacher(request: ChatRequest): Promise<ServiceResult<{
    reply: string;
    inferredRequirements: InferredRequirements;
    isReady: boolean;
  }>> {
    try {
      const { message, history, currentRequirements, subject, grade } = request;

      // 根据当前是否已确认学科，决定知识点提示
      const hasSubject = !!subject;
      const knowledgeBase = hasSubject ? (SUBJECT_KNOWLEDGE[subject]?.[grade] || []) : [];
      const subjectHint = hasSubject
        ? `当前已确认：\n- 学科：${subject}\n- 年级：${grade}年级\n- 可用知识点：${knowledgeBase.join('、')}`
        : `尚未确认学科和年级，请从教师的描述中推断学科和年级。\n可用学科：语文、数学、英语\n可用年级：1-6年级`;

      const systemPrompt = `你是「智慧命题助手」，一位精通教育测量学和命题理论的专家。

你的核心任务是与教师对话，精准理解教师的命题需求，最终生成命题双向细目表。

## 因果推理框架

你在对话中必须运用以下因果推理链：

1. **需求→学科年级推断**：从教师的描述中推断学科和年级。例如提到"平行四边形面积"→数学、五年级；提到"古诗文鉴赏"→语文、5-6年级。如果教师没有明确说明学科和年级，必须主动询问或从内容推断。
2. **需求→知识点推断**：教师说"考第三单元"，你要推断该单元涉及哪些知识点
3. **考试类型→难度分布推断**：
   - 随堂测验：容易60% 中等30% 较难10%
   - 单元测试：容易40% 中等40% 较难20%
   - 期中/期末：容易30% 中等50% 较难20%
   - 模拟考试：容易20% 中等50% 较难30%
4. **年级→认知层次推断**：
   - 低年级(1-2)侧重：识记、理解
   - 中年级(3-4)侧重：理解、应用
   - 高年级(5-6)侧重：应用、分析
5. **题型→考查能力推断**：
   - 选择题：适合考查识记、理解
   - 填空题：适合考查识记、理解、应用
   - 计算题/应用题：适合考查应用、分析
   - 简答题/写作题：适合考查分析、评价、创造

## 当前上下文
${subjectHint}

## 对话规则
1. 首次对话：友好问候，引导教师描述命题需求
2. 后续对话：基于教师输入，运用因果推理丰富需求，主动提出建议
3. 学科推断：从教师描述的内容推断学科，不要假设是某个特定学科。如果教师描述的是数学内容（如面积、计算、方程等），应将学科推断为数学；如果是语文内容（如阅读、写作、古诗文等），推断为语文
4. 识别矛盾：如果教师要求与教育测量学原则冲突，温和提醒
5. 确认时机：当你认为需求已足够明确时，总结需求并询问教师是否确认
6. 说话简明专业，避免冗长

## 输出格式
在回复末尾，用以下JSON标记包裹你推断的需求（不要在正文中提及这个标记）：
<INFERRED>
{
  "subject": "语文/数学/英语（从对话中推断）",
  "grade": 0（从对话中推断，1-6）,
  "semester": "上册或下册",
  "examType": "quiz/unit_test/midterm/final/mock/homework/practice",
  "knowledgePoints": ["知识点1", "知识点2"],
  "difficultyPreference": "easy/medium/hard",
  "questionTypes": ["choice", "fill"],
  "totalScore": 100,
  "duration": 60,
  "reasoning": "你的因果推理过程",
  "suggestions": ["建议1", "建议2"]
}
</INFERRED>`;

      // 构建消息历史
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: message },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.7,
      });

      const replyText = response.content || '';

      // 解析推断的需求
      const inferredMatch = replyText.match(/<INFERRED>([\s\S]*?)<\/INFERRED>/);
      let inferredReqs: InferredRequirements = currentRequirements || {
        subject: subject || '',
        grade: grade || 0,
        semester: '上册',
        examType: 'unit_test',
        knowledgePoints: [],
        difficultyPreference: 'medium',
        questionTypes: ['choice', 'fill'],
        totalScore: 100,
        duration: 60,
        reasoning: '',
        suggestions: [],
      };

      if (inferredMatch) {
        try {
          const parsed = JSON.parse(inferredMatch[1].trim());
          inferredReqs = { ...inferredReqs, ...parsed };
        } catch {
          // 解析失败，保持原有需求
        }
      }

      // 判断是否准备好生成细目表
      const isReady = inferredReqs.knowledgePoints.length > 0
        && inferredReqs.questionTypes.length > 0
        && inferredReqs.examType !== undefined;

      // 清理回复中的INFERRED标记
      const cleanReply = replyText.replace(/<INFERRED>[\s\S]*?<\/INFERRED>/, '').trim();

      return this.ok({
        reply: cleanReply,
        inferredRequirements: inferredReqs,
        isReady,
      });
    } catch (err) {
      console.error('[SmartHomework] chatWithTeacher error:', err);
      return this.fail('对话失败，请重试', 'CHAT_ERROR');
    }
  }

  // ==================== 2. 命题双向细目表生成 ====================

  /**
   * 基于确认的需求，由 LLM 生成命题双向细目表
   *
   * 教育测量学规范：
   * - 横向（评什么）：知识内容细化到单元-课-知识点
   * - 纵向（为什么评）：认知水平（识记、理解、运用、分析、评价、创造）
   * - 交叉格：题数/分值/建议题型
   * - 行列小计必须与总分一致
   */
  async generateSpecification(requirements: InferredRequirements): Promise<ServiceResult<SpecificationTable>> {
    try {
      const {
        subject, grade, semester, examType,
        knowledgePoints, difficultyPreference,
        questionTypes, totalScore, duration,
      } = requirements;

      const examTypeLabel = EXAM_TYPE_LABELS[examType] || examType;
      const diffLabel = DIFF_LABELS[difficultyPreference];
      const qtLabels = questionTypes.map(qt => QT_LABELS[qt]).join('、');
      const kpList = knowledgePoints.join('、');

      // 各考试类型对应的建议难度分布
      const diffGuide: Record<string, string> = {
        quiz: '容易60% 中等30% 较难10%',
        unit_test: '容易40% 中等40% 较难20%',
        midterm: '容易30% 中等50% 较难20%',
        final: '容易30% 中等50% 较难20%',
        mock: '容易20% 中等50% 较难30%',
        homework: '容易50% 中等35% 较难15%',
        practice: '容易40% 中等40% 较难20%',
      };

      // 各年级对应的建议认知侧重
      const cogGuide: Record<string, string> = {
        '1-2': '侧重识记和理解，少量运用',
        '3-4': '侧重理解和运用，少量分析和评价',
        '5-6': '侧重运用和分析，适量评价和创造',
      };
      const cogKey = grade <= 2 ? '1-2' : grade <= 4 ? '3-4' : '5-6';

      const prompt = `你是教育测量学命题专家。请根据以下需求生成命题双向细目表。

## 教师需求
- 学科：${subject}，年级：${grade}年级，学期：${semester || '请推断'}
- 考试类型：${examTypeLabel}
- 知识点：${kpList}
- 难度：${diffLabel}，建议分布：${diffGuide[examType] || diffGuide.practice}
- 题型：${qtLabels || '请推荐'}，总分：${totalScore}分，时长：${duration}分钟
- 认知侧重：${cogGuide[cogKey]}

## 硬性规则
1. 知识细化：每个知识点标注 code/name/unit/lesson/weight/totalScore
2. 认知层次：remember/understand/apply/analyze/evaluate/create，不需每个知识点覆盖所有层次
3. 交叉格字段：level, questionCount, scorePerQuestion(正整数), score(=questionCount×scorePerQuestion), suggestedQuestionTypes, blanksPerQuestion
4. 选择题：同卷所有选择题scorePerQuestion必须相同
5. 填空题：同卷所有填空题每空分值必须相同；blanksPerQuestion=每题空数(1-3)；scorePerQuestion=blanksPerQuestion×每空分值
6. 非填空题的blanksPerQuestion不设置或为null
7. 客观题(选择/判断/填空)每题分值低于主观题(简答/计算/应用/写作)
8. score/questionCount/scorePerQuestion均为正整数
9. 各知识点cognitiveAllocations的score之和=该知识点totalScore
10. 所有知识点totalScore之和=${totalScore}

## 输出格式
直接输出JSON，用<SPECIFICATION>和</SPECIFICATION>包裹：
<SPECIFICATION>
{"scope":"评价范围","knowledgeContents":[{"code":"1.1","name":"知识点","unit":"单元","lesson":"课","weight":30,"totalScore":30,"cognitiveAllocations":[{"level":"remember","questionCount":2,"scorePerQuestion":2,"score":4,"suggestedQuestionTypes":["choice"]},{"level":"apply","questionCount":2,"scorePerQuestion":5,"score":10,"suggestedQuestionTypes":["calculation"]}]}],"difficultyDistribution":{"easy":0.4,"medium":0.4,"hard":0.2}}
</SPECIFICATION>

注意：只需输出knowledgeContents和difficultyDistribution，不需要cognitiveSummary和questionTypePlans`;

      const messages = [
        {
          role: 'system' as const,
          content: '你是严谨的教育测量学专家，精通布鲁姆认知分类和命题双向细目表编制。确保数据一致、权重合理。选择/填空每题分值统一，客观题分值低于主观题。所有分值必须为整数。',
        },
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.4,
      });

      const content = response.content || '';
      // 尝试匹配完整的SPECIFICATION标记
      let match = content.match(/<SPECIFICATION>([\s\S]*?)<\/SPECIFICATION>/);
      // 如果没有闭合标签，可能是输出被截断，尝试取从开始标签到最后的JSON
      if (!match) {
        const startIdx = content.indexOf('<SPECIFICATION>');
        if (startIdx !== -1) {
          const jsonPart = content.substring(startIdx + '<SPECIFICATION>'.length);
          // 尝试找到最后一个完整的 } 来闭合JSON
          const lastBrace = jsonPart.lastIndexOf('}');
          if (lastBrace > 0) {
            const candidate = jsonPart.substring(0, lastBrace + 1);
            try {
              JSON.parse(candidate);
              // 解析成功，说明截断后仍可恢复
              match = [candidate, candidate] as RegExpMatchArray;
              console.warn('[SmartHomework] LLM输出被截断，但成功恢复JSON');
            } catch {
              // 无法恢复
            }
          }
        }
      }
      if (!match) {
        // 最后尝试：直接查找JSON对象（以 {"scope" 开头）
        const jsonStart = content.indexOf('{');
        if (jsonStart !== -1) {
          const jsonPart = content.substring(jsonStart);
          const lastBrace = jsonPart.lastIndexOf('}');
          if (lastBrace > 0) {
            const candidate = jsonPart.substring(0, lastBrace + 1);
            try {
              const test = JSON.parse(candidate);
              if (test.knowledgeContents) {
                match = [candidate, candidate] as RegExpMatchArray;
                console.warn('[SmartHomework] 通过直接JSON匹配恢复输出');
              }
            } catch {
              // 无法恢复
            }
          }
        }
      }
      if (!match) {
        console.error('[SmartHomework] LLM未返回SPECIFICATION标记，原始输出前500字:', content.substring(0, 500));
        return this.fail('生成细目表失败：AI输出格式异常', 'SPECIFICATION_ERROR');
      }

      const parsed = JSON.parse(match[1].trim());

      // ==================== 后处理：唯一真实来源是交叉格 ====================
      //
      // 核心原则：
      //   交叉格 = 唯一真实分值来源
      //   score = questionCount × scorePerQuestion（必须为整数）
      //   选择题：同卷所有选择题 scorePerQuestion 统一
      //   填空题：同卷所有填空题 每空分值(scorePerBlank) 统一
      //   行小计、列小计、题型规划 全部从交叉格推导，不存在第二套分值
      //

      // ---- Step 0: 解析LLM输出 ----
      const knowledgeContents: KnowledgeContent[] = (parsed.knowledgeContents || []).map(
        (kc: Record<string, unknown>) => {
          const allocations = ((kc.cognitiveAllocations || []) as CognitiveAllocation[]).map(
            (ca: CognitiveAllocation) => {
              const caRaw = ca as Record<string, unknown>;
              // 从LLM输出中提取 scorePerQuestion（可能缺失或为小数）
              let spq = caRaw.scorePerQuestion as number;
              const qCount = ca.questionCount || 0;
              const rawScore = ca.score || 0;

              // 确保 scorePerQuestion 为正整数
              if (!spq || spq <= 0) {
                spq = qCount > 0 ? Math.round(rawScore / qCount) : 1;
              }
              spq = Math.max(1, Math.round(spq));

              // 解析 blanksPerQuestion（填空题专用）
              let bpq: number | undefined;
              if (ca.suggestedQuestionTypes?.includes('fill')) {
                bpq = caRaw.blanksPerQuestion as number;
                if (!bpq || bpq <= 0) bpq = 1;
                bpq = Math.round(bpq); // 整数
              }

              return {
                level: ca.level,
                questionCount: qCount,
                scorePerQuestion: spq,
                score: qCount * spq, // 以 scorePerQuestion 为准重算
                suggestedQuestionTypes: ca.suggestedQuestionTypes || [],
                questionNumbers: [] as number[],
                blanksPerQuestion: bpq,
              };
            }
          ).filter((ca) => ca.questionCount > 0);

          return {
            code: (kc.code as string) || '',
            name: (kc.name as string) || '',
            unit: (kc.unit as string) || '',
            lesson: (kc.lesson as string) || '',
            weight: (kc.weight as number) || 0,
            totalScore: (kc.totalScore as number) || 0,
            cognitiveAllocations: allocations,
          };
        }
      );

      // ---- Step 1: 统一选择题每题分值 ----
      // 找出所有选择题交叉格，统一 scorePerQuestion 为加权众数
      {
        const choiceAllocations: { ca: CognitiveAllocation; kc: KnowledgeContent }[] = [];
        for (const kc of knowledgeContents) {
          for (const ca of kc.cognitiveAllocations) {
            if (ca.suggestedQuestionTypes[0] === 'choice') {
              choiceAllocations.push({ ca, kc });
            }
          }
        }
        if (choiceAllocations.length > 0) {
          // 加权众数：按题数加权，选出现最多的 scorePerQuestion
          const freq = new Map<number, number>();
          for (const { ca } of choiceAllocations) {
            freq.set(ca.scorePerQuestion, (freq.get(ca.scorePerQuestion) || 0) + ca.questionCount);
          }
          let unifiedSpq = 2; // 默认选择题2分
          let maxFreq = 0;
          for (const [spq, count] of freq) {
            if (count > maxFreq) { maxFreq = count; unifiedSpq = spq; }
          }
          // 统一所有选择题交叉格
          for (const { ca, kc } of choiceAllocations) {
            ca.scorePerQuestion = unifiedSpq;
            ca.score = ca.questionCount * ca.scorePerQuestion;
          }
        }
      }

      // ---- Step 2: 统一填空题每空分值 ----
      // 找出所有填空题交叉格，统一 scorePerBlank = scorePerQuestion / blanksPerQuestion
      {
        const fillAllocations: { ca: CognitiveAllocation; kc: KnowledgeContent }[] = [];
        for (const kc of knowledgeContents) {
          for (const ca of kc.cognitiveAllocations) {
            if (ca.suggestedQuestionTypes[0] === 'fill') {
              fillAllocations.push({ ca, kc });
            }
          }
        }
        if (fillAllocations.length > 0) {
          // 计算每个交叉格的 scorePerBlank，取加权众数统一
          const freq = new Map<number, number>();
          for (const { ca } of fillAllocations) {
            const bpq = ca.blanksPerQuestion || 1;
            const spb = Math.round(ca.scorePerQuestion / bpq);
            freq.set(spb, (freq.get(spb) || 0) + ca.questionCount);
          }
          let unifiedSpb = 1; // 默认每空1分
          let maxFreq = 0;
          for (const [spb, count] of freq) {
            if (count > maxFreq) { maxFreq = count; unifiedSpb = spb; }
          }
          // 统一所有填空题交叉格的每空分值
          for (const { ca } of fillAllocations) {
            const bpq = ca.blanksPerQuestion || 1;
            ca.scorePerQuestion = bpq * unifiedSpb; // 每题分值 = 空数 × 每空分值
            ca.score = ca.questionCount * ca.scorePerQuestion;
          }
        }
      }

      // ---- Step 3: 一致性修正——确保每个知识点的认知分值之和 = 知识点总分 ----
      //    以交叉格 score 之和为准，修正知识点 totalScore
      for (const kc of knowledgeContents) {
        const allocatedScore = kc.cognitiveAllocations.reduce((s, a) => s + a.score, 0);
        kc.totalScore = allocatedScore;
      }

      // ---- Step 4: 一致性修正——确保所有知识点总分之和 = 整卷总分 ----
      //    差值分配到各知识点，再分配到其最大交叉格
      const currentTotal = knowledgeContents.reduce((s, kc) => s + kc.totalScore, 0);
      if (currentTotal !== totalScore && knowledgeContents.length > 0) {
        const diff = totalScore - currentTotal;
        const totalWeight = knowledgeContents.reduce((s, kc) => s + kc.weight, 0) || 1;
        let remaining = diff;

        for (let i = 0; i < knowledgeContents.length; i++) {
          const kc = knowledgeContents[i];
          if (kc.cognitiveAllocations.length === 0) continue;

          let adjust: number;
          if (i === knowledgeContents.length - 1) {
            adjust = remaining;
          } else {
            adjust = Math.round(diff * kc.weight / totalWeight);
            remaining -= adjust;
          }
          if (adjust === 0) continue;

          // 找到非选择/填空的最大交叉格（优先调主观题），或退而求其次
          const adjustableAllocs = kc.cognitiveAllocations.filter(
            a => a.suggestedQuestionTypes[0] !== 'choice' && a.suggestedQuestionTypes[0] !== 'fill'
          );
          const targetAllocs = adjustableAllocs.length > 0 ? adjustableAllocs : kc.cognitiveAllocations;
          const maxAlloc = targetAllocs.reduce((best, a) => a.score > best.score ? a : best, targetAllocs[0]);

          const newTotalScore = maxAlloc.score + adjust;
          if (maxAlloc.suggestedQuestionTypes[0] === 'fill' && maxAlloc.blanksPerQuestion) {
            // 填空题：调整每空分值后重算
            const bpq = maxAlloc.blanksPerQuestion;
            const newSpb = Math.max(1, Math.round(newTotalScore / (maxAlloc.questionCount * bpq)));
            maxAlloc.scorePerQuestion = bpq * newSpb;
            maxAlloc.score = maxAlloc.questionCount * maxAlloc.scorePerQuestion;
          } else if (maxAlloc.suggestedQuestionTypes[0] === 'choice') {
            // 选择题不能单独调，跳过到下一个
            continue;
          } else {
            const newSpq = Math.max(1, Math.round(newTotalScore / maxAlloc.questionCount));
            maxAlloc.scorePerQuestion = newSpq;
            maxAlloc.score = maxAlloc.questionCount * maxAlloc.scorePerQuestion;
          }

          kc.totalScore = kc.cognitiveAllocations.reduce((s, a) => s + a.score, 0);
        }

        // 最终兜底：如果仍有差异，调最后一个知识点的最后一个非选择/填空交叉格
        const finalTotal = knowledgeContents.reduce((s, kc) => s + kc.totalScore, 0);
        const finalDiff = totalScore - finalTotal;
        if (finalDiff !== 0) {
          // 找到最后一个可调的交叉格
          for (let ki = knowledgeContents.length - 1; ki >= 0; ki--) {
            const kc = knowledgeContents[ki];
            for (let ai = kc.cognitiveAllocations.length - 1; ai >= 0; ai--) {
              const alloc = kc.cognitiveAllocations[ai];
              if (alloc.suggestedQuestionTypes[0] === 'choice') continue; // 选择题不动
              if (alloc.suggestedQuestionTypes[0] === 'fill') continue;  // 填空题不动（每空分值已统一）
              alloc.score += finalDiff;
              alloc.scorePerQuestion = Math.max(1, Math.round(alloc.score / alloc.questionCount));
              alloc.score = alloc.questionCount * alloc.scorePerQuestion;
              kc.totalScore = kc.cognitiveAllocations.reduce((s, a) => s + a.score, 0);
              break;
            }
            if (finalDiff !== 0) break;
          }
        }
      }

      // ---- Step 5: 分配全局题号 ----
      let questionNumber = 1;
      for (const kc of knowledgeContents) {
        for (const ca of kc.cognitiveAllocations) {
          ca.questionNumbers = [];
          for (let i = 0; i < ca.questionCount; i++) {
            ca.questionNumbers.push(questionNumber++);
          }
        }
      }

      // 4. 从交叉格推导认知层次汇总（不再依赖LLM输出）
      const allLevels: CognitiveLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
      const cognitiveSummary: CognitiveSummary[] = allLevels.map(level => {
        let totalQuestions = 0;
        let totalScoreForLevel = 0;
        for (const kc of knowledgeContents) {
          for (const ca of kc.cognitiveAllocations) {
            if (ca.level === level) {
              totalQuestions += ca.questionCount;
              totalScoreForLevel += ca.score;
            }
          }
        }
        return {
          level,
          totalQuestions,
          totalScore: totalScoreForLevel,
          percentage: totalScore > 0 ? Math.round(totalScoreForLevel / totalScore * 100) : 0,
        };
      }).filter(cs => cs.totalQuestions > 0);

      // 5. 从交叉格推导题型规划（唯一分值来源，保证一致性）
      const questionTypePlanMap = new Map<QuestionType, QuestionTypePlan>();
      for (const kc of knowledgeContents) {
        for (const ca of kc.cognitiveAllocations) {
          const primaryType = ca.suggestedQuestionTypes[0] || 'choice' as QuestionType;
          if (!questionTypePlanMap.has(primaryType)) {
            questionTypePlanMap.set(primaryType, {
              questionType: primaryType,
              count: 0,
              scorePerQuestion: 0,
              totalScore: 0,
              knowledgePoints: [],
              cognitiveLevels: [],
              difficulty: difficultyPreference,
              scorePerBlank: undefined,
              totalBlanks: undefined,
              blanksPerQuestion: undefined,
            });
          }
          const plan = questionTypePlanMap.get(primaryType)!;
          plan.count += ca.questionCount;
          plan.totalScore += ca.score;
          if (!plan.knowledgePoints.includes(kc.name)) {
            plan.knowledgePoints.push(kc.name);
          }
          if (!plan.cognitiveLevels.includes(ca.level)) {
            plan.cognitiveLevels.push(ca.level);
          }
          // 填空题：收集空数信息
          if (primaryType === 'fill' && ca.blanksPerQuestion) {
            plan.totalBlanks = (plan.totalBlanks || 0) + ca.questionCount * ca.blanksPerQuestion;
            plan.blanksPerQuestion = ca.blanksPerQuestion; // 同卷统一
          }
        }
      }
      for (const plan of questionTypePlanMap.values()) {
        plan.scorePerQuestion = plan.count > 0 ? Math.round(plan.totalScore / plan.count) : 0;
        // 填空题：计算每空分值
        if (plan.questionType === 'fill' && plan.totalBlanks && plan.totalBlanks > 0) {
          plan.scorePerBlank = Math.round(plan.totalScore / plan.totalBlanks);
        }
      }
      const questionTypePlans = Array.from(questionTypePlanMap.values());

      const specification: SpecificationTable = {
        subject,
        grade,
        semester: semester || parsed.scope?.match?.(/(上册|下册)/)?.[1] || '上册',
        examType,
        totalScore,
        duration,
        scope: parsed.scope || `${subject}${grade}年级${semester}`,
        knowledgeContents,
        cognitiveSummary,
        questionTypePlans,
        difficultyDistribution: parsed.difficultyDistribution || this.calculateDifficultyDistribution(examType, difficultyPreference),
        confirmed: false,
      };

      return this.ok(specification);
    } catch (err) {
      console.error('[SmartHomework] generateSpecification error:', err);
      return this.fail('生成细目表失败', 'SPECIFICATION_ERROR');
    }
  }

  // ==================== 3. 智能命题 ====================

  /**
   * 根据细目表智能命题
   *
   * 核心原则：按细目矩阵的**每个交叉格**遍历命题
   * 每个交叉格 = 一个知识点 × 一个认知层次，约束了题型、题数、分值、题号
   * 这样生成的试题与细目表一一对应
   */
  async generateQuestions(specification: SpecificationTable): Promise<ServiceResult<Question[]>> {
    try {
      const allQuestions: Question[] = [];

      for (const kc of specification.knowledgeContents) {
        for (const ca of kc.cognitiveAllocations) {
          if (ca.questionCount <= 0) continue;

          // 该交叉格的命题任务（直接使用交叉格的整数 scorePerQuestion）
          const task = {
            knowledgePoint: kc.name,
            unit: kc.unit,
            lesson: kc.lesson,
            cognitiveLevel: ca.level,
            questionTypes: ca.suggestedQuestionTypes,
            count: ca.questionCount,
            scorePerQuestion: ca.scorePerQuestion, // 已保证为整数
            totalScore: ca.score,
            questionNumbers: ca.questionNumbers,
            blanksPerQuestion: ca.blanksPerQuestion, // 填空题每题空数
          };

          // 1. 先查校本题库
          let bankQuestions: Question[] = [];
          for (const qt of task.questionTypes) {
            if (bankQuestions.length >= task.count) break;
            const result = await questionBankRepository.findByQuery({
              subject: specification.subject,
              grade: specification.grade,
              questionType: qt,
              difficulty: specification.difficultyDistribution.hard > 0.25 ? 'hard' : 'medium',
              knowledgePoint: task.knowledgePoint,
              pageSize: task.count - bankQuestions.length,
            });
            bankQuestions.push(...result.items.map(row => this.rowToQuestion(row)));
          }

          // 将题库题目调整到交叉格要求
          const usedBankQuestions = bankQuestions.slice(0, task.count).map((q, idx) => ({
            ...q,
            knowledgePoints: [task.knowledgePoint],
            cognitiveLevel: task.cognitiveLevel,
            score: task.scorePerQuestion,
            tags: [task.knowledgePoint, task.unit, task.lesson].filter(Boolean),
          }));

          allQuestions.push(...usedBankQuestions);

          // 2. 题库不够，AI补生成
          const remaining = task.count - usedBankQuestions.length;
          if (remaining > 0) {
            const aiQuestions = await this.generateAIQuestionsForCell(
              specification, task, remaining
            );
            allQuestions.push(...aiQuestions);
          }
        }
      }

      // 按题号排序
      allQuestions.sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      return this.ok(allQuestions);
    } catch (err) {
      console.error('[SmartHomework] generateQuestions error:', err);
      return this.fail('命题失败', 'GENERATION_ERROR');
    }
  }

  /**
   * 为单个交叉格AI生成题目
   *
   * 关键：prompt 严格约束知识点和认知层次
   */
  private async generateAIQuestionsForCell(
    specification: SpecificationTable,
    task: {
      knowledgePoint: string;
      unit: string;
      lesson: string;
      cognitiveLevel: CognitiveLevel;
      questionTypes: QuestionType[];
      count: number;
      scorePerQuestion: number;
      totalScore: number;
      questionNumbers: number[];
      blanksPerQuestion?: number;
    },
    count: number
  ): Promise<Question[]> {
    const qtLabel = task.questionTypes.map(qt => QT_LABELS[qt]).join('或');
    const cogLabel = COG_LABELS[task.cognitiveLevel];
    const diffLabel = specification.difficultyDistribution.hard > 0.25 ? '较难' : '中等';
    const isFill = task.questionTypes[0] === 'fill';
    const fillHint = isFill && task.blanksPerQuestion
      ? `\n- 每题空数：${task.blanksPerQuestion}个空（每空${Math.round(task.scorePerQuestion / task.blanksPerQuestion)}分，共${task.scorePerQuestion}分）`
      : '';

    const prompt = `你是专业的命题专家。请严格根据以下约束生成${count}道试题。

## 严格约束（必须遵守）
- 学科：${specification.subject}
- 年级：${specification.grade}年级
- 具体知识点：${task.knowledgePoint}（${task.unit} ${task.lesson}）
  ⚠️ 题目内容必须围绕"${task.knowledgePoint}"出题，不得偏离到其他知识点
- 认知层次：${cogLabel}
  ⚠️ 题目必须考查${cogLabel}层级的能力，而非更低或更高的层级
- 题型：${qtLabel}
- 每题分值：${task.scorePerQuestion}分${fillHint}
- 难度：${diffLabel}

## 出题要求
1. 题目必须严格围绕"${task.knowledgePoint}"，不得涉及其他知识点
2. 题目必须符合${cogLabel}的认知要求
3. 题目语言清晰、无歧义
4. 选择题需提供4个选项，标明正确答案
5. 填空题用"___"表示每个空，每题的空数必须为${task.blanksPerQuestion || 1}个
6. 附带答案解析

## 输出格式
请用以下JSON格式输出（不要其他内容）：
<QUESTIONS>
[
  {
    "title": "题目标题（简短）",
    "content": "题目完整内容",
    "questionType": "${task.questionTypes[0]}",
    "options": [{"label":"A","content":"选项内容","isCorrect":false}],
    "answer": "正确答案",
    "answerExplanation": "答案解析",
    "score": ${task.scorePerQuestion},
    "knowledgePoints": ["${task.knowledgePoint}"],
    "difficulty": "${specification.difficultyDistribution.hard > 0.25 ? 'hard' : 'medium'}",
    "cognitiveLevel": "${task.cognitiveLevel}"
  }
]
</QUESTIONS>`;

    try {
      const messages = [
        {
          role: 'system' as const,
          content: `你是一位严谨的教育命题专家。你必须严格围绕指定知识点出题，不得偏离。每道题都必须考查指定的知识点和认知层次。`,
        },
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.7,
      });

      const match = response.content?.match(/<QUESTIONS>([\s\S]*?)<\/QUESTIONS>/);
      if (!match) return [];

      const parsed = JSON.parse(match[1].trim());
      const questions: Question[] = (Array.isArray(parsed) ? parsed : []).map((q: Record<string, unknown>, idx: number) => ({
        id: `ai_${task.questionNumbers[idx] || Date.now()}_${idx}`,
        title: (q.title as string) || `${task.knowledgePoint}第${idx + 1}题`,
        content: (q.content as string) || '',
        questionType: (q.questionType as QuestionType) || task.questionTypes[0],
        subject: specification.subject,
        grade: specification.grade,
        semester: specification.semester,
        knowledgePoints: [task.knowledgePoint],
        difficulty: (q.difficulty as Difficulty) || (specification.difficultyDistribution.hard > 0.25 ? 'hard' : 'medium'),
        difficultyScore: specification.difficultyDistribution.hard > 0.25 ? 0.7 : 0.5,
        discriminationScore: 0.4,
        cognitiveLevel: task.cognitiveLevel,
        options: (q.options as QuestionOption[]) || undefined,
        answer: (q.answer as string) || '',
        answerExplanation: (q.answerExplanation as string) || '',
        score: task.scorePerQuestion,
        tags: [task.knowledgePoint, task.unit, task.lesson].filter(Boolean),
        source: 'ai_generated',
        sourceInfo: {},
        createdBy: 'ai',
        createdByName: 'AI命题',
        isShared: false,
        useCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return questions;
    } catch (err) {
      console.error('[SmartHomework] AI生成题目失败:', err);
      return [];
    }
  }

  // ==================== 4. 试卷排版 ====================

  /**
   * 生成标准试卷排版 HTML
   */
  async generatePaperHtml(paper: ComposePaperRequest): Promise<ServiceResult<string>> {
    try {
      const layout = paper.layoutConfig || {};
      const config: PaperLayoutConfig = {
        pageSize: layout.pageSize || 'A4',
        orientation: layout.orientation || 'portrait',
        margins: layout.margins || { top: 25, bottom: 20, left: 25, right: 25 },
        fontSize: layout.fontSize || 12,
        showAnswerSheet: layout.showAnswerSheet ?? true,
        columns: layout.columns || 1,
      };

      const examTypeLabel = QT_LABELS[paper.examType as keyof typeof QT_LABELS] || paper.examType;

      // 按题型分组
      const sections = this.groupQuestionsByType(paper.questions);

      let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${paper.title}</title>
<style>
  @page { size: ${config.pageSize} ${config.orientation}; margin: ${config.margins.top}mm ${config.margins.right}mm ${config.margins.bottom}mm ${config.margins.left}mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "SimSun", "宋体", serif; font-size: ${config.fontSize}pt; line-height: 1.8; color: #000; }
  .paper { max-width: 100%; padding: 0; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
  .header h1 { font-size: 22pt; font-weight: bold; margin-bottom: 8px; letter-spacing: 4px; }
  .header .info { font-size: 11pt; display: flex; justify-content: space-between; margin-top: 8px; }
  .header .info span { display: inline-block; min-width: 150px; }
  .student-info { display: flex; justify-content: space-between; border: 1px solid #000; padding: 8px 12px; margin-bottom: 15px; font-size: 11pt; }
  .student-info span { display: inline-block; border-bottom: 1px solid #000; min-width: 120px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 4px 0; border-bottom: 1px solid #333; }
  .section-title .score-info { font-size: 11pt; font-weight: normal; float: right; }
  .question { margin-bottom: 16px; page-break-inside: avoid; }
  .question-stem { font-weight: normal; margin-bottom: 6px; }
  .question-stem .q-num { font-weight: bold; }
  .question-stem .q-score { font-size: 10pt; color: #555; }
  .options { margin-left: 2em; margin-top: 4px; }
  .option { margin-bottom: 4px; }
  .answer-line { border-bottom: 1px solid #ccc; min-width: 80px; display: inline-block; }
  .blank { display: inline-block; min-width: 60px; border-bottom: 1px solid #000; margin: 0 4px; }
  .answer-area { margin-top: 6px; border: 1px solid #ddd; min-height: 60px; padding: 4px; }
  .answer-sheet { margin-top: 20px; page-break-before: always; }
  .answer-sheet h2 { text-align: center; margin-bottom: 10px; }
  .answer-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .answer-table th, .answer-table td { border: 1px solid #000; padding: 4px 8px; text-align: center; }
  .answer-content { margin-top: 10px; }
  .answer-item { margin-bottom: 10px; }
  .answer-item .label { font-weight: bold; }
  .divider { border-top: 1px dashed #999; margin: 10px 0; }
</style>
</head>
<body>
<div class="paper">
  <div class="header">
    <h1>${paper.title}</h1>
    <div class="info">
      <span>考试时间：${paper.duration}分钟</span>
      <span>满分：${paper.totalScore}分</span>
      <span>试卷类型：${examTypeLabel}</span>
    </div>
  </div>
  <div class="student-info">
    <span>姓名：__________</span>
    <span>班级：__________</span>
    <span>学号：__________</span>
    <span>成绩：__________</span>
  </div>`;

      // 题目部分
      let globalIdx = 1;
      for (const section of sections) {
        const sectionScore = section.questions.reduce((s, q) => s + q.score, 0);
        const typeLabel = QT_LABELS[section.questionType as keyof typeof QT_LABELS] || section.questionType;
        html += `
  <div class="section">
    <div class="section-title">
      ${this.numberToChinese(section.order)}、${typeLabel}
      <span class="score-info">（共${section.questions.length}题，共${sectionScore}分）</span>
    </div>`;

        for (const pq of section.questions) {
          html += `
    <div class="question">
      <div class="question-stem">
        <span class="q-num">${globalIdx}.</span> ${pq.data.content}
        <span class="q-score">（${pq.score}分）</span>
      </div>`;

          // 选择题选项
          if (section.questionType === 'choice' && pq.data.options?.length) {
            html += `<div class="options">`;
            for (const opt of pq.data.options) {
              html += `<div class="option">${opt.label}. ${opt.content}</div>`;
            }
            html += `</div>`;
          }

          // 填空题下划线
          if (section.questionType === 'fill') {
            html += `<div class="answer-area" style="min-height:30px"></div>`;
          }

          // 简答题/应用题答题区
          if (['short_answer', 'calculation', 'application', 'reading', 'writing'].includes(section.questionType)) {
            const height = section.questionType === 'writing' ? 200 : section.questionType === 'reading' ? 150 : 80;
            html += `<div class="answer-area" style="min-height:${height}px"></div>`;
          }

          html += `</div>`;
          globalIdx++;
        }

        html += `</div>`;
      }

      // 答案部分
      html += `
  <div class="answer-sheet">
    <h2>参考答案</h2>
    <div class="divider"></div>
    <div class="answer-content">`;

      let ansIdx = 1;
      for (const section of sections) {
        for (const pq of section.questions) {
          html += `<div class="answer-item"><span class="label">${ansIdx}.</span> ${pq.data.answer}`;
          if (pq.data.answerExplanation) {
            html += `<span style="color:#666;font-size:10pt">（${pq.data.answerExplanation}）</span>`;
          }
          html += `</div>`;
          ansIdx++;
        }
      }

      html += `
    </div>
  </div>
</div>
</body>
</html>`;

      return this.ok(html);
    } catch (err) {
      console.error('[SmartHomework] generatePaperHtml error:', err);
      return this.fail('试卷排版失败', 'LAYOUT_ERROR');
    }
  }

  // ==================== 5. 题库管理 ====================

  /**
   * 导入题目到校本题库
   */
  async importQuestion(req: ImportQuestionRequest, teacherId: string, teacherName: string): Promise<ServiceResult<Question>> {
    try {
      const { data, error } = await this.client
        .from('school_question_bank')
        .insert({
          title: req.title,
          content: req.content,
          question_type: req.questionType,
          subject: req.subject,
          grade: req.grade,
          semester: req.semester,
          knowledge_points: req.knowledgePoints || [],
          difficulty: req.difficulty || 'medium',
          difficulty_score: req.difficulty === 'easy' ? 0.3 : req.difficulty === 'hard' ? 0.8 : 0.5,
          discrimination_score: 0.4,
          cognitive_level: req.cognitiveLevel || 'understand',
          options: req.options || null,
          answer: req.answer,
          answer_explanation: req.answerExplanation || '',
          score: req.score || 2,
          tags: req.tags || [],
          source: 'manual',
          source_info: {},
          created_by: teacherId,
          created_by_name: teacherName,
          is_shared: true,
          use_count: 0,
        } as never)
        .select()
        .single();

      if (error) {
        console.error('[SmartHomework] importQuestion error:', error.message);
        return this.fail('导入题目失败', 'IMPORT_ERROR');
      }

      return this.ok(this.rowToQuestion(data as Record<string, unknown>));
    } catch (err) {
      console.error('[SmartHomework] importQuestion error:', err);
      return this.fail('导入题目失败', 'IMPORT_ERROR');
    }
  }

  /**
   * 查询题库
   */
  async queryQuestionBank(query: QuestionBankQuery): Promise<ServiceResult<{ items: Question[]; total: number }>> {
    const result = await questionBankRepository.findByQuery(query);
    return this.ok({
      items: result.items.map(row => this.rowToQuestion(row)),
      total: result.total,
    });
  }

  // ==================== 6. 试卷管理 ====================

  /**
   * 组卷保存
   */
  async composePaper(req: ComposePaperRequest, teacherId: string, teacherName: string): Promise<ServiceResult<ExamPaper>> {
    try {
      const { data, error } = await this.client
        .from('exam_papers')
        .insert({
          title: req.title,
          subject: req.subject,
          grade: req.grade,
          semester: req.semester,
          exam_type: req.examType,
          total_score: req.totalScore,
          duration: req.duration,
          specification: req.specification as unknown as Record<string, unknown>,
          questions: req.questions as unknown as Record<string, unknown>[],
          layout_config: (req.layoutConfig || {}) as unknown as Record<string, unknown>,
          paper_html: '',
          status: 'draft',
          created_by: teacherId,
          created_by_name: teacherName,
          is_shared: false,
          use_count: 0,
        } as never)
        .select()
        .single();

      if (error) {
        console.error('[SmartHomework] composePaper error:', error.message);
        return this.fail('组卷失败', 'COMPOSE_ERROR');
      }

      return this.ok(this.rowToExamPaper(data as Record<string, unknown>));
    } catch (err) {
      console.error('[SmartHomework] composePaper error:', err);
      return this.fail('组卷失败', 'COMPOSE_ERROR');
    }
  }

  /**
   * 获取教师的试卷列表
   */
  async getTeacherPapers(teacherId: string, options?: { status?: string; page?: number; pageSize?: number }): Promise<ServiceResult<{ items: ExamPaper[]; total: number }>> {
    const result = await examPaperRepository.findByCreator(teacherId, options);
    return this.ok({
      items: result.items.map(row => this.rowToExamPaper(row)),
      total: result.total,
    });
  }

  // ==================== 辅助方法 ====================

  /** 获取 Supabase 客户端 */
  private get client() {
    const { getSupabaseClient } = require('@/storage/database/supabase-client');
    return getSupabaseClient();
  }

  /** 计算难度分布 */
  private calculateDifficultyDistribution(examType: ExamType, preference: Difficulty): DifficultyDistribution {
    const baseDistribution: Record<ExamType, DifficultyDistribution> = {
      quiz: { easy: 0.6, medium: 0.3, hard: 0.1 },
      unit_test: { easy: 0.4, medium: 0.4, hard: 0.2 },
      midterm: { easy: 0.3, medium: 0.5, hard: 0.2 },
      final: { easy: 0.3, medium: 0.5, hard: 0.2 },
      mock: { easy: 0.2, medium: 0.5, hard: 0.3 },
      homework: { easy: 0.5, medium: 0.35, hard: 0.15 },
      practice: { easy: 0.4, medium: 0.4, hard: 0.2 },
    };

    const dist = { ...baseDistribution[examType] };

    // 根据教师偏好微调
    if (preference === 'easy') {
      dist.easy += 0.1;
      dist.hard -= 0.1;
    } else if (preference === 'hard') {
      dist.easy -= 0.1;
      dist.hard += 0.1;
    }

    return dist;
  }

  /** 数据库行转 Question */
  private rowToQuestion(row: Record<string, unknown>): Question {
    return {
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      questionType: row.question_type as QuestionType,
      subject: row.subject as string,
      grade: row.grade as number,
      semester: row.semester as string,
      knowledgePoints: (row.knowledge_points as string[]) || [],
      difficulty: row.difficulty as Difficulty,
      difficultyScore: (row.difficulty_score as number) || 0.5,
      discriminationScore: (row.discrimination_score as number) || 0.4,
      cognitiveLevel: row.cognitive_level as CognitiveLevel,
      options: (row.options as QuestionOption[]) || undefined,
      answer: (row.answer as string) || '',
      answerExplanation: (row.answer_explanation as string) || '',
      score: (row.score as number) || 2,
      tags: (row.tags as string[]) || [],
      source: (row.source as string) || 'manual',
      sourceInfo: (row.source_info as Record<string, unknown>) || {},
      createdBy: row.created_by as string,
      createdByName: (row.created_by_name as string) || '',
      isShared: (row.is_shared as boolean) || false,
      useCount: (row.use_count as number) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  /** 数据库行转 ExamPaper */
  private rowToExamPaper(row: Record<string, unknown>): ExamPaper {
    return {
      id: row.id as string,
      title: row.title as string,
      subject: row.subject as string,
      grade: row.grade as number,
      semester: row.semester as string,
      examType: row.exam_type as ExamType,
      totalScore: (row.total_score as number) || 100,
      duration: (row.duration as number) || 60,
      specification: row.specification as SpecificationTable,
      questions: (row.questions as PaperQuestion[]) || [],
      layoutConfig: (row.layout_config as PaperLayoutConfig) || {} as PaperLayoutConfig,
      paperHtml: (row.paper_html as string) || '',
      status: row.status as ExamPaper['status'],
      createdBy: row.created_by as string,
      createdByName: (row.created_by_name as string) || '',
      isShared: (row.is_shared as boolean) || false,
      useCount: (row.use_count as number) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  /** 按题型分组题目 */
  private groupQuestionsByType(questions: PaperQuestion[]): {
    order: number;
    questionType: string;
    questions: PaperQuestion[];
  }[] {
    const sectionMap = new Map<string, { order: number; questionType: string; questions: PaperQuestion[] }>();
    let order = 0;

    for (const pq of questions) {
      const key = pq.data.questionType;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, { order: ++order, questionType: key, questions: [] });
      }
      sectionMap.get(key)!.questions.push(pq);
    }

    return Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
  }

  /** 数字转中文数字 */
  private numberToChinese(n: number): string {
    const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    return chars[n] || String(n);
  }
}

/** 创建服务实例 */
export function createSmartHomeworkService(customHeaders?: Record<string, string>): SmartHomeworkService {
  return new SmartHomeworkService(customHeaders);
}
