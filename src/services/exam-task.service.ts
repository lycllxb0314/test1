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

  // ==================== 5. 并行命题 ====================

  /**
   * 按细目矩阵并行命题（每个板块同时进行）
   * 同一交叉格内的题目仍按顺序生成（保证题号连续）
   * 不同交叉格之间并行执行（大幅提升效率）
   */
  private async generateAllQuestions(taskId: string, specification: SpecificationTable): Promise<Question[]> {
    // 收集所有交叉格并排序（按题型分组、同题型内按认知层次）
    const cells: Array<{ kc: KnowledgeContent; ca: CognitiveAllocation }> = [];
    for (const kc of specification.knowledgeContents) {
      for (const ca of kc.cognitiveAllocations) {
        if (ca.questionCount > 0) {
          cells.push({ kc, ca });
        }
      }
    }

    cells.sort((a, b) => {
      const aType = a.ca.suggestedQuestionTypes[0] || 'other';
      const bType = b.ca.suggestedQuestionTypes[0] || 'other';
      const aTypeIdx = TYPE_ORDER.indexOf(aType);
      const bTypeIdx = TYPE_ORDER.indexOf(bType);
      if (aTypeIdx !== bTypeIdx) return (aTypeIdx >= 0 ? aTypeIdx : 99) - (bTypeIdx >= 0 ? bTypeIdx : 99);
      const aLevelIdx = LEVEL_ORDER.indexOf(a.ca.level);
      const bLevelIdx = LEVEL_ORDER.indexOf(b.ca.level);
      return (aLevelIdx >= 0 ? aLevelIdx : 99) - (bLevelIdx >= 0 ? bLevelIdx : 99);
    });

    const totalCells = cells.length;

    // 更新所有交叉格状态为 generating
    await examTaskRepository.updateStatus(taskId, 'generating', {
      currentStep: `AI正在并行命题（${totalCells}个板块同时进行）...`,
      progress: 5,
    });

    // 并行执行：每个交叉格同时命题
    const results = await Promise.allSettled(
      cells.map((cell, i) => this.generateCellWithProgress(taskId, cell.kc, cell.ca, i, totalCells, specification))
    );

    // 收集成功的题目
    const allQuestions: Question[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        allQuestions.push(...result.value);
      } else {
        console.error(`[ExamTaskService] 交叉格命题失败: ${cells[i].kc.name}/${cells[i].ca.level}`, result.reason);
      }
    }

    // 按题型分组+同题型内难度递增排序
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

  /**
   * 为单个交叉格生成题目（含进度更新）
   */
  private async generateCellWithProgress(
    taskId: string,
    kc: KnowledgeContent,
    ca: CognitiveAllocation,
    cellIndex: number,
    totalCells: number,
    specification: SpecificationTable,
  ): Promise<Question[]> {
    // 更新当前交叉格状态为 generating
    await this.updateCellProgress(taskId, kc.code, ca.level, {
      cellStatus: 'generating',
    });

    try {
      // AI生成题目
      const questions = await this.generateQuestionsForCell(specification, kc, ca);

      // 更新当前交叉格状态为 done
      await this.updateCellProgress(taskId, kc.code, ca.level, {
        cellStatus: 'done',
        completedCount: questions.length,
        reviewResult: 'approved',
      });

      // 更新整体进度（取所有交叉格的完成比例）
      const progress = Math.round(((cellIndex + 1) / totalCells) * 85);
      await examTaskRepository.updateStatus(taskId, 'generating', {
        currentStep: `命题进行中（${cellIndex + 1}/${totalCells}）`,
        progress,
      });

      return questions;
    } catch (err) {
      console.error(`[ExamTaskService] 交叉格命题失败: ${kc.name}/${ca.level}`, err);
      await this.updateCellProgress(taskId, kc.code, ca.level, {
        cellStatus: 'failed',
      });
      throw err;
    }
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
      ? `\n- 数学公式使用 LaTeX 格式：行内公式用 $...$ 包裹，如 $x^2+y^2=r^2$；行间公式用 $$...$$ 包裹，如 $$\\frac{1}{2}$$
- 如题目涉及几何图形，在 imageUrl 字段填空字符串，并在 imageAlt 中描述图形内容（系统后续补充图片）`
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
${isMath ? `7. 数学公式必须使用 LaTeX 格式，确保公式正确渲染
8. 几何图形题须标注 imageUrl 和 imageAlt 字段` : ''}

## 输出格式
请用以下JSON格式输出（不要其他内容）：
<QUESTIONS>
[
  {
    "title": "题目标题（简短）",
    "content": "题目完整内容（数学公式用LaTeX）",
    "questionType": "${ca.suggestedQuestionTypes[0]}",
    "options": [{"label":"A","content":"选项内容（数学公式用LaTeX）","isCorrect":false}],
    "answer": "正确答案（数学公式用LaTeX）",
    "answerExplanation": "答案解析（数学公式用LaTeX）",
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
        content: '你是一位严谨的教育命题专家。你必须严格围绕指定知识点出题，不得偏离。每道题都必须考查指定的知识点和认知层次。',
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
   */
  private async generatePaperHtml(specification: SpecificationTable, questions: Question[]): Promise<string> {
    const examTypeLabel = EXAM_TYPE_LABELS[specification.examType] || specification.examType;
    const totalScore = specification.totalScore;
    const duration = specification.duration;
    const isMath = specification.subject === '数学' || specification.subject === 'math';

    // 按题型分组
    const sections = this.groupQuestionsByType(questions);

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${specification.scope || '试卷'}</title>
${isMath ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">' : ''}
<style>
  @page { size: A4 portrait; margin: 25mm 25mm 20mm 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "SimSun", "宋体", serif; font-size: 12pt; line-height: 1.8; color: #000; }
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
  .question-image { max-width: 100%; max-height: 250px; margin: 8px 0; border: 1px solid #ddd; }
  .options { margin-left: 2em; margin-top: 4px; }
  .option { margin-bottom: 4px; }
  .answer-line { border-bottom: 1px solid #ccc; min-width: 80px; display: inline-block; }
  .blank { display: inline-block; min-width: 60px; border-bottom: 1px solid #000; margin: 0 4px; }
  .answer-area { margin-top: 6px; border: 1px solid #ddd; min-height: 60px; padding: 4px; }
  .answer-sheet { margin-top: 20px; page-break-before: always; }
  .answer-sheet h2 { text-align: center; margin-bottom: 10px; }
  .answer-content { margin-top: 10px; }
  .answer-item { margin-bottom: 10px; }
  .answer-item .label { font-weight: bold; }
  .divider { border-top: 1px dashed #999; margin: 10px 0; }
  .katex-display { margin: 8px 0; }
</style>
${isMath ? '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>\n<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters:[{left:\'$$\',right:\'$$\',display:true},{left:\'$\',right:\'$\',display:false}]});"></script>' : ''}
</head>
<body>
<div class="paper">
  <div class="header">
    <h1>${specification.scope || '试卷'}</h1>
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
      ${this.numberToChinese(section.order)}、${typeLabel}
      <span class="score-info">（共${section.questions.length}题，共${sectionScore}分）</span>
    </div>`;

      for (const q of section.questions) {
        html += `
    <div class="question">
      <div class="question-stem">
        <span class="q-num">${globalIdx}.</span> ${q.content}
        <span class="q-score">（${q.score}分）</span>
      </div>`;

        // 题目配图
        if (q.imageUrl) {
          html += `<img class="question-image" src="${q.imageUrl}" alt="${q.imageAlt || '题目图片'}" />`;
        }

        if (section.questionType === 'choice' && q.options?.length) {
          html += `<div class="options">`;
          for (const opt of q.options) {
            html += `<div class="option">${opt.label}. ${opt.content}</div>`;
          }
          html += `</div>`;
        }

        if (section.questionType === 'fill') {
          html += `<div class="answer-area" style="min-height:30px"></div>`;
        }

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
      for (const q of section.questions) {
        html += `<div class="answer-item"><span class="label">${ansIdx}.</span> ${q.answer}`;
        if (q.answerExplanation) {
          html += `<span style="color:#666;font-size:10pt">（${q.answerExplanation}）</span>`;
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

    // 并行重新命题审核未通过的交叉格
    const regenerateResults = await Promise.allSettled(
      rejectedCells.map(cell => {
        const cellInfo = cellMap.get(`${cell.knowledgeCode}_${cell.cognitiveLevel}`);
        if (!cellInfo) return Promise.reject(new Error(`找不到交叉格: ${cell.knowledgeCode}/${cell.cognitiveLevel}`));
        return this.generateCellWithProgress(taskId, cellInfo.kc, cellInfo.ca, 0, rejectedCells.length, specification);
      })
    );

    // 获取最新的任务数据（包含已通过的题目）
    const updatedTaskResult = await this.getTask(taskId);
    if (!updatedTaskResult.success || !updatedTaskResult.data) return;
    const updatedTask = updatedTaskResult.data;

    // 合并题目：保留已通过的，加入新命题的
    const approvedKnowledgeCodes = new Set(
      updatedTask.cellProgress
        .filter(cp => cp.reviewResult === 'approved')
        .map(cp => cp.knowledgeCode)
    );

    // 保留审核通过的题目
    const keptQuestions = updatedTask.questions.filter(q =>
      approvedKnowledgeCodes.has(q.knowledgePoints[0] || '')
    );

    // 收集新命题的题目
    const newQuestions: Question[] = [];
    for (let i = 0; i < regenerateResults.length; i++) {
      const result = regenerateResults[i];
      if (result.status === 'fulfilled') {
        newQuestions.push(...result.value);
      }
    }

    const allQuestions = [...keptQuestions, ...newQuestions];

    // 再次审阅
    await examTaskRepository.updateStatus(taskId, 'reviewing', {
      currentStep: 'AI正在审阅重新命题的题目...',
      questions: allQuestions as unknown[],
    });

    const reviewResult = await this.reviewQuestions(specification, allQuestions, taskId);

    if (!reviewResult.approved) {
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
        cellProgress: reviewResult.updatedCellProgress,
      });
      await this.regenerateRejectedCells(taskId, specification);
      return;
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
