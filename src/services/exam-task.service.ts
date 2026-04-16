/**
 * 命题任务 Service（AI全自动命题工作流）
 *
 * 教师确认细目表后一键启动，AI自动完成：
 * 1. 按交叉格逐一命题
 * 2. 自动审阅（检查知识点/认知层次/分值一致性）
 * 3. 审阅不通过自动重新命题（最多3次）
 * 4. 全部通过后自动排版组卷
 * 5. 生成HTML预览 + Word文档下载
 *
 * @module services/exam-task.service
 */

import { BaseService, ServiceResult } from './base.service';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import katex from 'katex';
import { normalizeLatex } from '@/lib/latex-normalize';
import { examTaskRepository } from '@/repositories/exam-task.repository';
import type { ExamTaskRow } from '@/repositories/exam-task.repository';
import type {
  ExamTask,
  ExamTaskStatus,
  CellProgress,
  CreateExamTaskRequest,
  SpecificationTable,
  KnowledgeContent,
  CognitiveAllocation,
  Question,
  QuestionType,
  CognitiveLevel,
  Difficulty,
  QuestionOption,
  PaperQuestion,
} from '@/types/smart-homework';

import {
  COGNITIVE_LEVEL_LABELS as COG_LABELS,
  QUESTION_TYPE_LABELS as QT_LABELS,
  DIFFICULTY_LABELS as DIFF_LABELS,
  EXAM_TYPE_LABELS,
} from '@/types/smart-homework';

/** 题型出场顺序 */
const TYPE_ORDER: QuestionType[] = ['choice', 'judge', 'fill', 'short_answer', 'calculation', 'application', 'reading', 'writing', 'other'];

/** 认知层次难度梯度 */
const LEVEL_ORDER: CognitiveLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

/** 最大审阅重试次数 */
const MAX_REVIEW_RETRIES = 3;

/**
 * 命题任务服务
 */
export class ExamTaskService extends BaseService {
  private llmClient: LLMClient;

  constructor(customHeaders?: Record<string, string>) {
    super();
    const config = new Config();
    this.llmClient = new LLMClient(config, customHeaders);
  }

  // ==================== 1. 创建任务 ====================

  /**
   * 创建命题任务并立即启动AI全自动工作流
   */
  async createAndStart(req: CreateExamTaskRequest, creatorId: string, creatorName: string): Promise<ServiceResult<ExamTask>> {
    try {
      // 从细目表推导交叉格进度列表
      const cellProgress = this.buildCellProgress(req.specification);

      const { data, error } = await this.client
        .from('exam_tasks')
        .insert({
          title: req.title,
          subject: req.subject,
          grade: req.grade,
          semester: req.semester,
          exam_type: req.examType,
          total_score: req.totalScore,
          duration: req.duration,
          specification: req.specification as unknown as Record<string, unknown>,
          status: 'pending',
          creator_id: creatorId,
          creator_name: creatorName,
          cell_progress: cellProgress as unknown,
          questions: [] as unknown,
          progress: 0,
          current_step: '准备启动...',
          notes: req.notes || null,
        } as never)
        .select()
        .single();

      if (error) {
        console.error('[ExamTaskService] createAndStart error:', error.message);
        return this.fail('创建任务失败', 'CREATE_ERROR');
      }

      const task = examTaskRepository.toExamTask(data as ExamTaskRow);

      // 异步启动工作流（不阻塞返回）
      this.executeWorkflow(task.id, req.specification).catch(err => {
        console.error('[ExamTaskService] 工作流异常:', err);
      });

      return this.ok(task);
    } catch (err) {
      console.error('[ExamTaskService] createAndStart error:', err);
      return this.fail('创建任务失败', 'CREATE_ERROR');
    }
  }

  // ==================== 2. 查询任务 ====================

  async getTask(taskId: string): Promise<ServiceResult<ExamTask>> {
    const { data, error } = await this.client
      .from('exam_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !data) {
      return this.fail('任务不存在', 'NOT_FOUND');
    }

    return this.ok(examTaskRepository.toExamTask(data as ExamTaskRow));
  }

  async getTasksByCreator(creatorId: string, options?: { status?: string; page?: number; pageSize?: number }): Promise<ServiceResult<{ items: ExamTask[]; total: number }>> {
    const result = await examTaskRepository.findByCreator(creatorId, options);
    return this.ok({
      items: result.items.map(row => examTaskRepository.toExamTask(row)),
      total: result.total,
    });
  }

  // ==================== 3. 重试失败/审阅未通过任务 ====================

  /**
   * 重试任务
   * - 失败的任务：重新启动全流程
   * - 审阅未通过的任务：仅重新命题审核未通过的交叉格
   */
  async retryTask(taskId: string): Promise<ServiceResult<ExamTask>> {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success || !taskResult.data) return taskResult;

    const task = taskResult.data;

    if (task.status === 'failed') {
      // 完全失败的任务：重置进度，重新启动全流程
      const cellProgress = task.cellProgress.map(cp => ({
        ...cp,
        cellStatus: 'pending' as const,
        reviewResult: 'pending' as const,
        completedCount: 0,
        retryCount: 0,
      }));

      await examTaskRepository.updateStatus(taskId, 'pending', {
        progress: 0,
        currentStep: '准备重试...',
        errorMessage: undefined,
        cellProgress,
        questions: [],
      });

      // 异步启动工作流
      this.executeWorkflow(taskId, task.specification).catch(err => {
        console.error('[ExamTaskService] 重试工作流异常:', err);
      });

      return this.getTask(taskId);
    }

    // 审阅未通过的任务：仅重新命题审核未通过的交叉格
    const rejectedCells = task.cellProgress.filter(cp => cp.reviewResult === 'rejected');
    if (rejectedCells.length > 0) {
      // 重置审核未通过的交叉格
      const cellProgress = task.cellProgress.map(cp => {
        if (cp.reviewResult === 'rejected') {
          return { ...cp, cellStatus: 'pending' as const, completedCount: 0 };
        }
        return cp;
      });

      await examTaskRepository.updateStatus(taskId, 'revision', {
        currentStep: '正在重新命题审核未通过的板块...',
        cellProgress,
      });

      // 异步重试仅审核未通过的
      this.regenerateRejectedCells(taskId, task.specification).catch(err => {
        console.error('[ExamTaskService] 重试审核未通过板块异常:', err);
      });

      return this.getTask(taskId);
    }

    return this.fail('该任务无需重试', 'INVALID_STATUS');
  }

  // ==================== 4. AI全自动工作流 ====================

  /**
   * AI全自动命题工作流
   *
   * 流程：并行命题 → 审阅 → 排版
   * 审阅不通过时仅重新命题审核未通过的交叉格（最多3次）
   */
  private async executeWorkflow(taskId: string, specification: SpecificationTable): Promise<void> {
    try {
      // 阶段1：按交叉格并行命题
      await examTaskRepository.updateStatus(taskId, 'generating', {
        currentStep: 'AI正在并行命题...',
      });

      const allQuestions = await this.generateAllQuestions(taskId, specification);

      // 阶段2：AI审阅
      await examTaskRepository.updateStatus(taskId, 'reviewing', {
        currentStep: 'AI正在审阅题目质量...',
        questions: allQuestions as unknown[],
      });

      const reviewResult = await this.reviewQuestions(specification, allQuestions, taskId);

      if (!reviewResult.approved) {
        // 审阅不通过，检查是否有交叉格超过最大重试次数
        const taskResult = await this.getTask(taskId);
        const task = taskResult.data;
        if (!task) return;

        // 检查审核未通过的交叉格是否超过最大重试次数
        const hasExceeded = task.cellProgress.some(cp => cp.reviewResult === 'rejected' && cp.retryCount >= MAX_REVIEW_RETRIES);
        if (hasExceeded) {
          await examTaskRepository.updateStatus(taskId, 'failed', {
            currentStep: '审阅多次未通过',
            errorMessage: '部分题目审阅多次仍未通过，请调整细目表后重试',
          });
          return;
        }

        // 标记需要修改的交叉格，仅重新命题审核未通过的
        await examTaskRepository.updateStatus(taskId, 'revision', {
          currentStep: '审阅发现问题，AI正在重新命题审核未通过的板块...',
          cellProgress: reviewResult.updatedCellProgress,
        });

        // 仅重新命题审核未通过的交叉格
        await this.regenerateRejectedCells(taskId, specification);
        return;
      }

      // 阶段3：排版组卷
      await examTaskRepository.updateStatus(taskId, 'formatting', {
        currentStep: 'AI正在排版组卷...',
        progress: 90,
      });

      const paperHtml = await this.generatePaperHtml(specification, allQuestions);

      // 保存HTML
      await examTaskRepository.updateStatus(taskId, 'completed', {
        currentStep: '命题完成',
        progress: 100,
        questions: allQuestions as unknown[],
        paperHtml,
      });

      console.log(`[ExamTaskService] 任务 ${taskId} 完成，共 ${allQuestions.length} 题`);
    } catch (err) {
      console.error('[ExamTaskService] 工作流执行失败:', err);
      await examTaskRepository.updateStatus(taskId, 'failed', {
        currentStep: '执行失败',
        errorMessage: err instanceof Error ? err.message : '未知错误',
      });
    }
  }

  // ==================== 5. 按题型板块并行命题 ====================

  /**
   * 按题型板块并行命题
   * - 不同题型板块同时进行（如选择题板块、填空题板块同时命题）
   * - 同一板块内的交叉格按顺序命题（保证题号连续）
   */
  private async generateAllQuestions(taskId: string, specification: SpecificationTable): Promise<Question[]> {
    // 收集所有交叉格
    const cells: Array<{ kc: KnowledgeContent; ca: CognitiveAllocation }> = [];
    for (const kc of specification.knowledgeContents) {
      for (const ca of kc.cognitiveAllocations) {
        if (ca.questionCount > 0) {
          cells.push({ kc, ca });
        }
      }
    }

    // 按题型分组（板块）
    const sectionMap = new Map<QuestionType, Array<{ kc: KnowledgeContent; ca: CognitiveAllocation }>>();
    for (const cell of cells) {
      const qt = cell.ca.suggestedQuestionTypes[0] || 'other' as QuestionType;
      if (!sectionMap.has(qt)) sectionMap.set(qt, []);
      sectionMap.get(qt)!.push(cell);
    }

    // 每个板块内按认知层次排序
    for (const [, sectionCells] of sectionMap) {
      sectionCells.sort((a, b) => {
        const aLevelIdx = LEVEL_ORDER.indexOf(a.ca.level);
        const bLevelIdx = LEVEL_ORDER.indexOf(b.ca.level);
        return (aLevelIdx >= 0 ? aLevelIdx : 99) - (bLevelIdx >= 0 ? bLevelIdx : 99);
      });
    }

    // 按题型出场顺序排序板块
    const sections = Array.from(sectionMap.entries()).sort((a, b) => {
      const aIdx = TYPE_ORDER.indexOf(a[0]);
      const bIdx = TYPE_ORDER.indexOf(b[0]);
      return (aIdx >= 0 ? aIdx : 99) - (bIdx >= 0 ? bIdx : 99);
    });

    const totalCells = cells.length;
    let completedCells = 0;

    // 更新状态
    await examTaskRepository.updateStatus(taskId, 'generating', {
      currentStep: `AI正在按题型板块并行命题（${sections.length}个板块）...`,
      progress: 5,
    });

    // 标记所有交叉格为 generating
    const allCellProgress = (await this.getTask(taskId)).data?.cellProgress || [];
    for (const cp of allCellProgress) {
      await this.updateCellProgress(taskId, cp.knowledgeCode, cp.cognitiveLevel, {
        cellStatus: 'generating',
      });
    }

    // 每个板块并行执行，板块内串行
    const sectionResults = await Promise.allSettled(
      sections.map(async ([questionType, sectionCells]) => {
        const sectionQuestions: Question[] = [];
        for (const cell of sectionCells) {
          try {
            const questions = await this.generateQuestionsForCell(specification, cell.kc, cell.ca);
            sectionQuestions.push(...questions);

            // 更新交叉格状态为 done
            completedCells++;
            await this.updateCellProgress(taskId, cell.kc.code, cell.ca.level, {
              cellStatus: 'done',
              completedCount: questions.length,
              reviewResult: 'approved',
            });

            // 更新整体进度
            const progress = Math.round((completedCells / totalCells) * 85);
            await examTaskRepository.updateStatus(taskId, 'generating', {
              currentStep: `命题进行中（${questionType === 'other' ? '其他' : QT_LABELS[questionType]}板块 ${completedCells}/${totalCells}）`,
              progress,
            });
          } catch (err) {
            completedCells++;
            console.error(`[ExamTaskService] 交叉格命题失败: ${cell.kc.name}/${cell.ca.level}`, err);
            await this.updateCellProgress(taskId, cell.kc.code, cell.ca.level, {
              cellStatus: 'failed',
            });
          }
        }
        return sectionQuestions;
      })
    );

    // 收集所有题目
    const allQuestions: Question[] = [];
    for (const result of sectionResults) {
      if (result.status === 'fulfilled') {
        allQuestions.push(...result.value);
      }
    }

    // 最终排序：按题型分组 + 同题型内按认知层次递增
    allQuestions.sort((a, b) => {
      const aTypeIdx = TYPE_ORDER.indexOf(a.questionType);
      const bTypeIdx = TYPE_ORDER.indexOf(b.questionType);
      if (aTypeIdx !== bTypeIdx) return (aTypeIdx >= 0 ? aTypeIdx : 99) - (bTypeIdx >= 0 ? bTypeIdx : 99);
      const aLevelIdx = LEVEL_ORDER.indexOf(a.cognitiveLevel);
      const bLevelIdx = LEVEL_ORDER.indexOf(b.cognitiveLevel);
      return (aLevelIdx >= 0 ? aLevelIdx : 99) - (bLevelIdx >= 0 ? bLevelIdx : 99);
    });

    return allQuestions;
  }

  // ==================== 6. AI命题（单交叉格） ====================

  /**
   * 为单个交叉格AI生成题目
   */
  private async generateQuestionsForCell(
    specification: SpecificationTable,
    kc: KnowledgeContent,
    ca: CognitiveAllocation
  ): Promise<Question[]> {
    const qtLabel = ca.suggestedQuestionTypes.map(qt => QT_LABELS[qt]).join('或');
    const cogLabel = COG_LABELS[ca.level];
    const isFill = ca.suggestedQuestionTypes[0] === 'fill';
    const fillHint = isFill && ca.blanksPerQuestion
      ? `\n- 每题空数：${ca.blanksPerQuestion}个空（每空${Math.round(ca.scorePerQuestion / ca.blanksPerQuestion)}分，共${ca.scorePerQuestion}分）`
      : '';

    const isMath = specification.subject === '数学' || specification.subject === 'math';
    const mathHint = isMath
      ? `
- ⚠️ 数学公式格式（必须严格遵守）：
  · 所有数学公式必须用 $...$ 包裹，例如 $\\frac{1}{2}$，不要省略 $
  · 分数必须使用 $\\frac{分子}{分母}$ 格式，例如 $\\frac{1}{2}$、$\\frac{3}{4}$
  · 绝对禁止用 a/b 或 (a)/(b) 这种纯文本格式表示分数
  · 上标用 $x^2$，下标用 $a_1$，根号用 $\\sqrt{x}$
  · 不要使用 $$...$$ 行间公式，统一用 $...$ 行内公式
  · 不要使用 \\dfrac，统一使用 \\frac
  · 如题目涉及几何图形，在 imageUrl 字段填空字符串，并在 imageAlt 中描述图形内容`
      : '';

    const prompt = `你是专业的命题专家。请严格根据以下约束生成${ca.questionCount}道试题。

## 严格约束（必须遵守）
- 学科：${specification.subject}
- 年级：${specification.grade}年级
- 具体知识点：${kc.name}（${kc.unit} ${kc.lesson}）
  ⚠️ 题目内容必须围绕"${kc.name}"出题，不得偏离到其他知识点
- 认知层次：${cogLabel}
  ⚠️ 题目必须考查${cogLabel}层级的能力，而非更低或更高的层级
- 题型：${qtLabel}
- 每题分值：${ca.scorePerQuestion}分${fillHint}${mathHint}

## 出题要求
1. 题目必须严格围绕"${kc.name}"，不得涉及其他知识点
2. 题目必须符合${cogLabel}的认知要求
3. 题目语言清晰、无歧义
4. 选择题需提供4个选项，标明正确答案
5. 填空题用"___"表示每个空，每题的空数必须为${ca.blanksPerQuestion || 1}个
6. 附带答案解析
${isMath ? `7. 数学公式必须使用 LaTeX 格式，且必须用 $...$ 包裹
8. 分数必须使用 $\\frac{分子}{分母}$ 格式，禁止用 a/b 或 (a)/(b) 纯文本格式
9. 不要使用 $$...$$ 行间公式，统一用 $...$ 行内公式
10. 不要使用 \\dfrac，统一使用 \\frac
11. 几何图形题须标注 imageUrl 和 imageAlt 字段` : ''}

## 输出格式
请用以下JSON格式输出（不要其他内容）：
<QUESTIONS>
[
  {
    "title": "题目标题（简短）",
    "content": "题目完整内容（数学公式必须用$...$包裹，分数用$\\frac{}{}$）",
    "questionType": "${ca.suggestedQuestionTypes[0]}",
    "options": [{"label":"A","content":"选项内容（数学公式用$...$包裹）","isCorrect":false}],
    "answer": "正确答案（数学公式用$...$包裹）",
    "answerExplanation": "答案解析（数学公式用$...$包裹）",
    "score": ${ca.scorePerQuestion},
    "knowledgePoints": ["${kc.name}"],
    "difficulty": "${specification.difficultyDistribution.hard > 0.25 ? 'hard' : 'medium'}",
    "cognitiveLevel": "${ca.level}"${isMath ? `,
    "imageUrl": "",
    "imageAlt": "图形描述（如涉及几何图形）"` : ''}
  }
]
</QUESTIONS>`;

    const messages = [
      {
        role: 'system' as const,
        content: isMath
          ? '你是一位严谨的教育命题专家。你必须严格围绕指定知识点出题，不得偏离。每道题都必须考查指定的知识点和认知层次。所有数学公式必须用$...$包裹，分数必须用$\\frac{}{}$格式，禁止使用纯文本分数如a/b。'
          : '你是一位严谨的教育命题专家。你必须严格围绕指定知识点出题，不得偏离。每道题都必须考查指定的知识点和认知层次。',
      },
      { role: 'user' as const, content: prompt },
    ];

    const response = await this.llmClient.invoke(messages, {
      model: 'deepseek-v3-2-251201',
      temperature: 0.7,
    });

    const content = response.content || '';
    const match = content.match(/<QUESTIONS>([\s\S]*?)<\/QUESTIONS>/);
    if (!match) {
      // 尝试恢复被截断的JSON
      const jsonStart = content.indexOf('[');
      if (jsonStart !== -1) {
        const jsonPart = content.substring(jsonStart);
        const lastBrace = jsonPart.lastIndexOf('}');
        if (lastBrace > 0) {
          const candidate = jsonPart.substring(0, lastBrace + 1) + ']';
          try {
            JSON.parse(candidate);
            const parsed = JSON.parse(candidate);
            return this.parseAIQuestions(parsed, specification, kc, ca);
          } catch {
            // 无法恢复
          }
        }
      }
      throw new Error(`AI命题输出格式异常: ${kc.name}/${ca.level}`);
    }

    const parsed = JSON.parse(match[1].trim());
    return this.parseAIQuestions(parsed, specification, kc, ca);
  }

  /**
   * 解析AI返回的题目
   */
  private parseAIQuestions(
    parsed: unknown[],
    specification: SpecificationTable,
    kc: KnowledgeContent,
    ca: CognitiveAllocation
  ): Question[] {
    return (Array.isArray(parsed) ? parsed : []).map((rawQ, idx: number) => {
      const q = rawQ as Record<string, unknown>;
      return {
        id: `ai_${ca.questionNumbers[idx] || Date.now()}_${idx}`,
        title: (q.title as string) || `${kc.name}第${idx + 1}题`,
        content: (q.content as string) || '',
        questionType: (q.questionType as QuestionType) || ca.suggestedQuestionTypes[0],
        subject: specification.subject,
        grade: specification.grade,
        semester: specification.semester,
        knowledgePoints: [kc.name],
        difficulty: (q.difficulty as Difficulty) || (specification.difficultyDistribution.hard > 0.25 ? 'hard' : 'medium'),
        difficultyScore: specification.difficultyDistribution.hard > 0.25 ? 0.7 : 0.5,
        discriminationScore: 0.4,
        cognitiveLevel: ca.level,
        options: (q.options as QuestionOption[]) || undefined,
        answer: (q.answer as string) || '',
        answerExplanation: (q.answerExplanation as string) || '',
        score: ca.scorePerQuestion,
        tags: [kc.name, kc.unit, kc.lesson].filter(Boolean),
        source: 'ai_generated',
        sourceInfo: {},
        createdBy: 'ai',
        createdByName: 'AI命题',
        isShared: false,
        useCount: 0,
        imageUrl: (q.imageUrl as string) || undefined,
        imageAlt: (q.imageAlt as string) || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  // ==================== 7. AI审阅 ====================

  /**
   * AI审阅所有题目
   *
   * 检查：
   * 1. 每道题是否围绕指定知识点
   * 2. 认知层次是否符合要求
   * 3. 分值是否正确
   * 4. 题型是否正确
   * 5. 选项/答案是否合理
   */
  private async reviewQuestions(
    specification: SpecificationTable,
    questions: Question[],
    taskId: string
  ): Promise<{ approved: boolean; updatedCellProgress: CellProgress[] }> {
    // 获取当前进度
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success || !taskResult.data) {
      return { approved: true, updatedCellProgress: [] };
    }
    const cellProgress = [...taskResult.data.cellProgress];

    // 构建审阅prompt
    const questionSummary = questions.map((q, i) => ({
      index: i + 1,
      content: q.content.substring(0, 100),
      knowledgePoints: q.knowledgePoints,
      cognitiveLevel: q.cognitiveLevel,
      questionType: q.questionType,
      score: q.score,
      answer: q.answer.substring(0, 50),
    }));

    const specSummary = specification.knowledgeContents.map(kc => ({
      name: kc.name,
      code: kc.code,
      allocations: kc.cognitiveAllocations.map(ca => ({
        level: ca.level,
        questionCount: ca.questionCount,
        score: ca.score,
        scorePerQuestion: ca.scorePerQuestion,
        types: ca.suggestedQuestionTypes,
      })),
    }));

    const prompt = `你是教育测量学审题专家。请审阅以下试题是否符合命题双向细目表的要求。

## 细目表摘要
${JSON.stringify(specSummary, null, 2)}

## 试题摘要
${JSON.stringify(questionSummary, null, 2)}

## 审阅要点
1. 每道题的知识点是否与细目表交叉格对应
2. 认知层次是否符合要求
3. 分值是否正确（选择题统一、填空题统一）
4. 题型是否正确
5. 答案是否合理（非空、非明显错误）
6. 选项是否有4个（选择题）

## 输出格式
直接输出JSON：
<REVIEW>
{
  "approved": true或false,
  "issues": [
    {"questionIndex": 1, "knowledgeCode": "1.1", "cognitiveLevel": "remember", "issue": "问题描述"}
  ]
}
</REVIEW>

如果所有题目都符合要求，approved为true。只有存在严重问题时才为false。`;

    try {
      const messages = [
        { role: 'system' as const, content: '你是严谨的审题专家。只检查严重问题，轻微表述差异不算问题。' },
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'deepseek-v3-2-251201',
        temperature: 0.3,
      });

      const content = response.content || '';
      const match = content.match(/<REVIEW>([\s\S]*?)<\/REVIEW>/);
      if (!match) {
        // 无法解析审阅结果，默认通过
        return { approved: true, updatedCellProgress: cellProgress };
      }

      const parsed = JSON.parse(match[1].trim());

      if (parsed.approved) {
        // 全部通过
        for (const cp of cellProgress) {
          cp.reviewResult = 'approved';
        }
        return { approved: true, updatedCellProgress: cellProgress };
      }

      // 标记有问题的交叉格
      const issues = parsed.issues || [];
      const failedCodes = new Set<string>();
      for (const issue of issues) {
        if (issue.knowledgeCode) {
          failedCodes.add(issue.knowledgeCode);
        }
      }

      for (const cp of cellProgress) {
        if (failedCodes.has(cp.knowledgeCode)) {
          cp.reviewResult = 'rejected';
          cp.retryCount += 1;
          cp.cellStatus = 'pending'; // 重置为待命题
        } else {
          cp.reviewResult = 'approved';
        }
      }

      // 如果问题不超过20%，直接通过（宽松策略）
      const failRatio = issues.length / Math.max(questions.length, 1);
      if (failRatio <= 0.2) {
        for (const cp of cellProgress) {
          cp.reviewResult = 'approved';
        }
        return { approved: true, updatedCellProgress: cellProgress };
      }

      return { approved: false, updatedCellProgress: cellProgress };
    } catch (err) {
      console.error('[ExamTaskService] 审阅异常，默认通过:', err);
      return { approved: true, updatedCellProgress: cellProgress };
    }
  }

  // ==================== 8. 排版组卷 ====================

  /**
   * 生成试卷HTML
   * 服务端用 KaTeX 渲染数学公式为静态 HTML，确保公式正确显示
   */
  private async generatePaperHtml(specification: SpecificationTable, questions: Question[]): Promise<string> {
    const examTypeLabel = EXAM_TYPE_LABELS[specification.examType] || specification.examType;
    const totalScore = specification.totalScore;
    const duration = specification.duration;

    // 按题型分组
    const sections = this.groupQuestionsByType(questions);

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${specification.scope || '试卷'}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
  @page { size: A4 portrait; margin: 20mm 20mm 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "SimSun", "宋体", serif; font-size: 12pt; line-height: 2; color: #000; }
  .paper { max-width: 100%; padding: 0; }
  .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; }
  .header h1 { font-size: 20pt; font-weight: bold; margin-bottom: 6px; letter-spacing: 4px; }
  .header .info { font-size: 11pt; display: flex; justify-content: space-between; margin-top: 6px; }
  .header .info span { display: inline-block; min-width: 120px; }
  .student-info { display: flex; justify-content: space-between; border: 1px solid #000; padding: 6px 12px; margin-bottom: 12px; font-size: 11pt; }
  .student-info span { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 13pt; font-weight: bold; margin-bottom: 8px; padding: 3px 0; border-bottom: 1px solid #333; }
  .section-title .score-info { font-size: 11pt; font-weight: normal; float: right; }
  .question { margin-bottom: 12px; page-break-inside: avoid; }
  .question-stem { font-weight: normal; margin-bottom: 4px; }
  .question-stem .q-num { font-weight: bold; }
  .question-stem .q-score { font-size: 10pt; color: #555; }
  .question-image { max-width: 80%; max-height: 180px; margin: 6px 0; border: 1px solid #ddd; }
  .options { margin-left: 2em; margin-top: 2px; }
  .option { margin-bottom: 2px; }
  .blank { display: inline-block; min-width: 50px; border-bottom: 1px solid #000; margin: 0 4px; }
  .answer-space { margin-top: 4px; }
  .answer-line { border-bottom: 1px solid #ccc; min-width: 60px; display: inline-block; margin-right: 20px; }
  .answer-sheet { margin-top: 16px; page-break-before: always; }
  .answer-sheet h2 { text-align: center; margin-bottom: 8px; }
  .answer-content { margin-top: 8px; }
  .answer-item { margin-bottom: 6px; }
  .answer-item .label { font-weight: bold; }
  .divider { border-top: 1px dashed #999; margin: 8px 0; }
  .katex { font-size: 1.05em; }
  .katex-display { margin: 4px 0; }
</style>
</head>
<body>
<div class="paper">
  <div class="header">
    <h1>${this.escapeHtml(specification.scope || '试卷')}</h1>
    <div class="info">
      <span>考试时间：${duration}分钟</span>
      <span>满分：${totalScore}分</span>
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
      ${this.numberToChinese(section.order)}、${this.escapeHtml(typeLabel)}
      <span class="score-info">（共${section.questions.length}题，共${sectionScore}分）</span>
    </div>`;

      for (const q of section.questions) {
        const contentHtml = this.renderLatexToHtml(q.content);

        html += `
    <div class="question">
      <div class="question-stem">
        <span class="q-num">${globalIdx}.</span> ${contentHtml}
        <span class="q-score">（${q.score}分）</span>
      </div>`;

        // 题目配图
        if (q.imageUrl) {
          html += `<img class="question-image" src="${this.escapeHtml(q.imageUrl)}" alt="${this.escapeHtml(q.imageAlt || '题目图片')}" />`;
        }

        if (section.questionType === 'choice' && q.options?.length) {
          html += `<div class="options">`;
          for (const opt of q.options) {
            html += `<div class="option">${opt.label}. ${this.renderLatexToHtml(opt.content)}</div>`;
          }
          html += `</div>`;
        }

        if (section.questionType === 'fill') {
          html += `<div class="answer-space"></div>`;
        }

        if (['short_answer', 'calculation', 'application', 'reading', 'writing'].includes(section.questionType)) {
          const lines = section.questionType === 'writing' ? 8 : section.questionType === 'reading' ? 5 : 3;
          html += `<div class="answer-space">${Array(lines).fill('<div class="answer-line"></div>').join('')}</div>`;
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
      for (const q of section.questions) {
        const answerHtml = this.renderLatexToHtml(q.answer);
        html += `<div class="answer-item"><span class="label">${ansIdx}.</span> ${answerHtml}`;
        if (q.answerExplanation) {
          html += `<span style="color:#666;font-size:10pt">（${this.renderLatexToHtml(q.answerExplanation)}）</span>`;
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

    return html;
  }

  /**
   * 将 LaTeX 公式渲染为 KaTeX HTML
   * - 行内公式：$...$
   * - 行间公式：$$...$$
   * - 先提取公式再 escapeHtml，避免转义破坏 LaTeX 语法
   */
  private renderLatexToHtml(text: string): string {
    if (!text) return '';

    // 先规范化 LaTeX（处理 LLM 不规范输出）
    let result = normalizeLatex(text);

    // 提取所有公式段，用占位符替换，避免 escapeHtml 破坏公式
    const formulas: string[] = [];

    // 提取行间公式 $$...$$（规范化后应该不存在了，但保留安全处理）
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
      const idx = formulas.length;
      try {
        formulas.push(katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false, strict: false }));
      } catch {
        formulas.push(`<span style="color:#d32f2f">${this.escapeHtml(formula.trim())}</span>`);
      }
      return `%%FORMULA_${idx}%%`;
    });

    // 提取行内公式 $...$（支持公式内含 \n 以外的内容）
    result = result.replace(/\$([^$\n]+?)\$/g, (_match, formula: string) => {
      const idx = formulas.length;
      try {
        formulas.push(katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false, strict: false }));
      } catch {
        // KaTeX 渲染失败时，尝试修复常见问题后重试
        const repaired = this.repairLatex(formula.trim());
        try {
          formulas.push(katex.renderToString(repaired, { displayMode: false, throwOnError: false, strict: false }));
        } catch {
          formulas.push(`<span style="color:#d32f2f">${this.escapeHtml(formula.trim())}</span>`);
        }
      }
      return `%%FORMULA_${idx}%%`;
    });

    // 对非公式部分执行 HTML 转义
    result = this.escapeHtml(result);

    // 还原公式占位符（公式 HTML 不需要再转义，KaTeX 输出已是安全的 HTML）
    result = result.replace(/%%FORMULA_(\d+)%%/g, (_match, idx: string) => {
      return formulas[parseInt(idx)] || '';
    });

    // 处理转义后占位符可能被 escapeHtml 修改的情况（%%不会被修改，但以防万一）
    result = result.replace(/%%FORMULA_(\d+)%%/g, (_match, idx: string) => {
      return formulas[parseInt(idx)] || '';
    });

    // 换行处理
    result = result.replace(/\n/g, '<br/>');

    return result;
  }

  /**
   * 修复常见的 LaTeX 语法问题
   * 用于 KaTeX 渲染失败时的二次尝试
   */
  private repairLatex(formula: string): string {
    let repaired = formula;

    // \dfrac → \frac
    repaired = repaired.replace(/\\dfrac/g, '\\frac');

    // \frac 后缺少花括号：\frac12 → \frac{1}{2}
    repaired = repaired.replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}');

    // \frac 后缺少花括号：\frac1{2} → \frac{1}{2}
    repaired = repaired.replace(/\\frac(\d)\{/g, '\\frac{$1}{');
    repaired = repaired.replace(/\\frac\{(\d+)\}(\d)/g, '\\frac{$1}{$2}');

    // 去除多余空格
    repaired = repaired.replace(/\\frac\s+\{/g, '\\frac{');

    // 未闭合的花括号：补充
    const openCount = (repaired.match(/\{/g) || []).length;
    const closeCount = (repaired.match(/\}/g) || []).length;
    if (openCount > closeCount) {
      repaired += '}'.repeat(openCount - closeCount);
    }

    return repaired;
  }

  /** HTML 转义 */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==================== 辅助方法 ====================

  /** 获取 Supabase 客户端 */
  private get client() {
    const { getSupabaseClient } = require('@/storage/database/supabase-client');
    return getSupabaseClient();
  }

  /** 从细目表构建交叉格进度列表 */
  private buildCellProgress(specification: SpecificationTable): CellProgress[] {
    const progress: CellProgress[] = [];
    for (const kc of specification.knowledgeContents) {
      for (const ca of kc.cognitiveAllocations) {
        if (ca.questionCount > 0) {
          progress.push({
            knowledgeCode: kc.code,
            knowledgeName: kc.name,
            cognitiveLevel: ca.level,
            questionType: ca.suggestedQuestionTypes[0] || 'other',
            requiredCount: ca.questionCount,
            completedCount: 0,
            cellStatus: 'pending',
            reviewResult: 'pending',
            retryCount: 0,
          });
        }
      }
    }
    return progress;
  }

  /**
   * 仅重新命题审核未通过的交叉格
   * 保留已通过的题目，只替换审核未通过的
   * 审阅时只审阅新命题的题目，已通过的不重复审阅
   */
  private async regenerateRejectedCells(taskId: string, specification: SpecificationTable): Promise<void> {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success || !taskResult.data) return;

    const task = taskResult.data;

    // 收集审核未通过的交叉格
    const rejectedCells = task.cellProgress.filter(cp => cp.reviewResult === 'rejected');
    if (rejectedCells.length === 0) {
      // 无需重试，直接进入排版
      const paperHtml = await this.generatePaperHtml(specification, task.questions);
      await examTaskRepository.updateStatus(taskId, 'completed', {
        currentStep: '命题完成',
        progress: 100,
        paperHtml,
      });
      return;
    }

    // 更新状态为重新命题
    await examTaskRepository.updateStatus(taskId, 'generating', {
      currentStep: `AI正在重新命题${rejectedCells.length}个审核未通过的板块...`,
    });

    // 构建交叉格对应的细目信息
    const cellMap = new Map<string, { kc: KnowledgeContent; ca: CognitiveAllocation }>();
    for (const kc of specification.knowledgeContents) {
      for (const ca of kc.cognitiveAllocations) {
        if (ca.questionCount > 0) {
          cellMap.set(`${kc.code}_${ca.level}`, { kc, ca });
        }
      }
    }

    // 按题型板块分组，板块内串行，板块间并行
    const rejectedByType = new Map<QuestionType, Array<{ cell: CellProgress; kc: KnowledgeContent; ca: CognitiveAllocation }>>();
    for (const cell of rejectedCells) {
      const cellInfo = cellMap.get(`${cell.knowledgeCode}_${cell.cognitiveLevel}`);
      if (!cellInfo) continue;
      const qt = cell.questionType || cellInfo.ca.suggestedQuestionTypes[0] || 'other' as QuestionType;
      if (!rejectedByType.has(qt)) rejectedByType.set(qt, []);
      rejectedByType.get(qt)!.push({ cell, ...cellInfo });
    }

    // 标记审核未通过的交叉格为 generating
    for (const cell of rejectedCells) {
      await this.updateCellProgress(taskId, cell.knowledgeCode, cell.cognitiveLevel, {
        cellStatus: 'generating',
      });
    }

    // 按题型板块并行重新命题
    const sectionResults = await Promise.allSettled(
      Array.from(rejectedByType.entries()).map(async ([, sectionCells]) => {
        const sectionQuestions: Question[] = [];
        for (const { cell, kc, ca } of sectionCells) {
          try {
            const questions = await this.generateQuestionsForCell(specification, kc, ca);
            sectionQuestions.push(...questions);

            // 更新交叉格状态
            await this.updateCellProgress(taskId, cell.knowledgeCode, cell.cognitiveLevel, {
              cellStatus: 'done',
              completedCount: questions.length,
              reviewResult: 'approved',
              retryCount: cell.retryCount, // 保持重试计数不变（审阅通过后不再增加）
            });
          } catch (err) {
            console.error(`[ExamTaskService] 重新命题失败: ${kc.name}/${ca.level}`, err);
            await this.updateCellProgress(taskId, cell.knowledgeCode, cell.cognitiveLevel, {
              cellStatus: 'failed',
              retryCount: cell.retryCount + 1,
            });
          }
        }
        return sectionQuestions;
      })
    );

    // 收集新命题的题目
    const newQuestions: Question[] = [];
    for (const result of sectionResults) {
      if (result.status === 'fulfilled') {
        newQuestions.push(...result.value);
      }
    }

    // 获取最新的任务数据
    const updatedTaskResult = await this.getTask(taskId);
    if (!updatedTaskResult.success || !updatedTaskResult.data) return;
    const updatedTask = updatedTaskResult.data;

    // 只保留已通过审阅的旧题目（排除之前被rejected的）
    const approvedKnowledgeCodes = new Set(
      updatedTask.cellProgress
        .filter(cp => cp.reviewResult === 'approved' && cp.cellStatus === 'done')
        .map(cp => cp.knowledgeCode)
    );

    const keptQuestions = updatedTask.questions.filter(q =>
      approvedKnowledgeCodes.has(q.knowledgePoints[0] || '')
    );

    // 合并：已通过的旧题 + 新命题的题
    const allQuestions = [...keptQuestions, ...newQuestions];

    // 只审阅新命题的题目，已通过的不重复审阅
    if (newQuestions.length > 0) {
      await examTaskRepository.updateStatus(taskId, 'reviewing', {
        currentStep: 'AI正在审阅重新命题的题目...',
        questions: allQuestions as unknown[],
      });

      // 只审阅新命题的题目
      const newReviewResult = await this.reviewNewQuestions(specification, newQuestions, taskId);

      if (!newReviewResult.approved) {
        // 检查是否超过最大重试次数
        const latestTask = (await this.getTask(taskId)).data;
        if (!latestTask) return;

        const hasExceeded = latestTask.cellProgress.some(cp => cp.reviewResult === 'rejected' && cp.retryCount >= MAX_REVIEW_RETRIES);
        if (hasExceeded) {
          await examTaskRepository.updateStatus(taskId, 'failed', {
            currentStep: '审阅多次未通过',
            errorMessage: '部分题目审阅多次仍未通过，请调整细目表后重试',
          });
          return;
        }

        // 继续重试仅审核未通过的
        await examTaskRepository.updateStatus(taskId, 'revision', {
          currentStep: '审阅发现问题，AI正在重新命题审核未通过的板块...',
          cellProgress: newReviewResult.updatedCellProgress,
        });
        await this.regenerateRejectedCells(taskId, specification);
        return;
      }
    }

    // 全部通过，排版组卷
    await examTaskRepository.updateStatus(taskId, 'formatting', {
      currentStep: 'AI正在排版组卷...',
      progress: 90,
    });

    const paperHtml = await this.generatePaperHtml(specification, allQuestions);

    await examTaskRepository.updateStatus(taskId, 'completed', {
      currentStep: '命题完成',
      progress: 100,
      questions: allQuestions as unknown[],
      paperHtml,
    });

    console.log(`[ExamTaskService] 任务 ${taskId} 完成，共 ${allQuestions.length} 题`);
  }

  /**
   * 只审阅新命题的题目（不审阅已通过的）
   * 只会标记新题目对应的交叉格
   */
  private async reviewNewQuestions(
    specification: SpecificationTable,
    newQuestions: Question[],
    taskId: string
  ): Promise<{ approved: boolean; updatedCellProgress: CellProgress[] }> {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success || !taskResult.data) {
      return { approved: true, updatedCellProgress: [] };
    }
    const cellProgress = [...taskResult.data.cellProgress];

    // 只审阅新题目
    const questionSummary = newQuestions.map((q, i) => ({
      index: i + 1,
      content: q.content.substring(0, 100),
      knowledgePoints: q.knowledgePoints,
      cognitiveLevel: q.cognitiveLevel,
      questionType: q.questionType,
      score: q.score,
      answer: q.answer.substring(0, 50),
    }));

    const specSummary = specification.knowledgeContents.map(kc => ({
      name: kc.name,
      code: kc.code,
      allocations: kc.cognitiveAllocations.map(ca => ({
        level: ca.level,
        questionCount: ca.questionCount,
        score: ca.score,
        scorePerQuestion: ca.scorePerQuestion,
        types: ca.suggestedQuestionTypes,
      })),
    }));

    const prompt = `你是教育测量学审题专家。请审阅以下重新命题的试题是否符合要求。

## 细目表摘要
${JSON.stringify(specSummary, null, 2)}

## 重新命题的试题摘要
${JSON.stringify(questionSummary, null, 2)}

## 审阅要点
1. 每道题的知识点是否正确
2. 认知层次是否符合要求
3. 分值是否正确
4. 题型是否正确
5. 答案是否合理
6. 选项是否有4个（选择题）

## 输出格式
直接输出JSON：
<REVIEW>
{
  "approved": true或false,
  "issues": [
    {"questionIndex": 1, "knowledgeCode": "1.1", "cognitiveLevel": "remember", "issue": "问题描述"}
  ]
}
</REVIEW>

如果所有题目都符合要求，approved为true。只有存在严重问题时才为false。`;

    try {
      const messages = [
        { role: 'system' as const, content: '你是严谨的审题专家。只检查严重问题，轻微表述差异不算问题。已通过审阅的题目不再重复审阅。' },
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'deepseek-v3-2-251201',
        temperature: 0.3,
      });

      const content = response.content || '';
      const match = content.match(/<REVIEW>([\s\S]*?)<\/REVIEW>/);
      if (!match) {
        // 无法解析，默认通过
        return { approved: true, updatedCellProgress: cellProgress };
      }

      const parsed = JSON.parse(match[1].trim());

      if (parsed.approved) {
        // 新题目全部通过
        return { approved: true, updatedCellProgress: cellProgress };
      }

      // 标记有问题的交叉格（只标记新题目对应的）
      const issues = parsed.issues || [];
      const failedCodes = new Set<string>();
      for (const issue of issues) {
        if (issue.knowledgeCode) {
          failedCodes.add(issue.knowledgeCode);
        }
      }

      for (const cp of cellProgress) {
        // 只修改之前被rejected后重新命题的交叉格
        if (cp.cellStatus === 'done' && cp.reviewResult === 'approved') {
          // 已通过的不动
          continue;
        }
        if (failedCodes.has(cp.knowledgeCode)) {
          cp.reviewResult = 'rejected';
          cp.retryCount += 1;
          cp.cellStatus = 'pending';
        } else {
          cp.reviewResult = 'approved';
        }
      }

      // 宽松策略：问题不超过20%直接通过
      const failRatio = issues.length / Math.max(newQuestions.length, 1);
      if (failRatio <= 0.2) {
        for (const cp of cellProgress) {
          if (cp.cellStatus !== 'done' || cp.reviewResult !== 'approved') {
            cp.reviewResult = 'approved';
          }
        }
        return { approved: true, updatedCellProgress: cellProgress };
      }

      return { approved: false, updatedCellProgress: cellProgress };
    } catch (err) {
      console.error('[ExamTaskService] 审阅异常，默认通过:', err);
      return { approved: true, updatedCellProgress: cellProgress };
    }
  }

  /** 更新单个交叉格进度 */
  private async updateCellProgress(
    taskId: string,
    knowledgeCode: string,
    cognitiveLevel: CognitiveLevel,
    updates: Partial<CellProgress>
  ): Promise<void> {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success || !taskResult.data) return;

    const cellProgress = taskResult.data.cellProgress.map(cp => {
      if (cp.knowledgeCode === knowledgeCode && cp.cognitiveLevel === cognitiveLevel) {
        return { ...cp, ...updates };
      }
      return cp;
    });

    await examTaskRepository.updateStatus(taskId, taskResult.data.status, {
      cellProgress,
    });
  }

  /** 按题型分组题目 */
  private groupQuestionsByType(questions: Question[]): {
    order: number;
    questionType: string;
    questions: Question[];
  }[] {
    const sectionMap = new Map<string, { order: number; questionType: string; questions: Question[] }>();
    let order = 0;

    for (const q of questions) {
      const key = q.questionType;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, { order: ++order, questionType: key, questions: [] });
      }
      sectionMap.get(key)!.questions.push(q);
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
export function createExamTaskService(customHeaders?: Record<string, string>): ExamTaskService {
  return new ExamTaskService(customHeaders);
}
