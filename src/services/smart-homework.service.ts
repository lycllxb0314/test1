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
  KnowledgeDimension,
  QuestionAllocation,
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
  COGNITIVE_LEVEL_LABELS,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
} from '@/types/smart-homework';

import {
  COGNITIVE_LEVEL_LABELS as COG_LABELS,
  QUESTION_TYPE_LABELS as QT_LABELS,
  DIFFICULTY_LABELS as DIFF_LABELS,
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

      // 获取该学科年级的知识点列表
      const knowledgeBase = SUBJECT_KNOWLEDGE[subject]?.[grade] || [];

      const systemPrompt = `你是「智慧命题助手」，一位精通教育测量学和命题理论的专家。

你的核心任务是与教师对话，精准理解教师的命题需求，最终生成命题双向细目表。

## 因果推理框架

你在对话中必须运用以下因果推理链：

1. **需求→知识点推断**：教师说"考第三单元"，你要推断该单元涉及哪些知识点
2. **考试类型→难度分布推断**：
   - 随堂测验：容易60% 中等30% 较难10%
   - 单元测试：容易40% 中等40% 较难20%
   - 期中/期末：容易30% 中等50% 较难20%
   - 模拟考试：容易20% 中等50% 较难30%
3. **年级→认知层次推断**：
   - 低年级(1-2)侧重：识记、理解
   - 中年级(3-4)侧重：理解、应用
   - 高年级(5-6)侧重：应用、分析
4. **题型→考查能力推断**：
   - 选择题：适合考查识记、理解
   - 填空题：适合考查识记、理解、应用
   - 计算题/应用题：适合考查应用、分析
   - 简答题/写作题：适合考查分析、评价、创造

## 当前上下文
- 学科：${subject}
- 年级：${grade}年级
- 可用知识点：${knowledgeBase.join('、')}

## 对话规则
1. 首次对话：友好问候，引导教师描述命题需求
2. 后续对话：基于教师输入，运用因果推理丰富需求，主动提出建议
3. 识别矛盾：如果教师要求与教育测量学原则冲突，温和提醒
4. 确认时机：当你认为需求已足够明确时，总结需求并询问教师是否确认
5. 说话简明专业，避免冗长

## 输出格式
在回复末尾，用以下JSON标记包裹你推断的需求（不要在正文中提及这个标记）：
<INFERRED>
{
  "subject": "${subject}",
  "grade": ${grade},
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
        subject,
        grade,
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
   * 基于确认的需求生成命题双向细目表
   *
   * 双向细目表设计原则：
   * - 横轴：知识点（权重分配）
   * - 纵轴：认知层次（布鲁姆六层级）
   * - 单元格：题型、题量、分值
   * - 难度分布：符合教育测量学规律
   */
  async generateSpecification(requirements: InferredRequirements): Promise<ServiceResult<SpecificationTable>> {
    try {
      const {
        subject, grade, semester, examType,
        knowledgePoints, difficultyPreference,
        questionTypes, totalScore, duration,
      } = requirements;

      // 1. 确定难度分布
      const difficultyDistribution = this.calculateDifficultyDistribution(examType, difficultyPreference);

      // 2. 为知识点分配权重
      const knowledgeDimensions = this.allocateKnowledgeWeights(
        knowledgePoints, totalScore, grade, examType
      );

      // 3. 为每种题型分配题目
      const questionAllocation = this.allocateQuestions(
        questionTypes, knowledgeDimensions, totalScore, difficultyDistribution
      );

      const specification: SpecificationTable = {
        subject,
        grade,
        semester,
        examType,
        totalScore,
        duration,
        knowledgeDimensions,
        questionAllocation,
        difficultyDistribution,
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
   * 策略：
   * 1. 先从校本题库匹配
   * 2. 题库不足的由 AI 生成
   */
  async generateQuestions(specification: SpecificationTable): Promise<ServiceResult<Question[]>> {
    try {
      const allQuestions: Question[] = [];

      for (const allocation of specification.questionAllocation) {
        // 1. 先查校本题库
        const bankResult = await questionBankRepository.findByQuery({
          subject: specification.subject,
          grade: specification.grade,
          questionType: allocation.questionType,
          difficulty: allocation.difficulty,
          knowledgePoint: allocation.knowledgePoints[0],
          pageSize: allocation.count,
        });

        const bankQuestions = bankResult.items.map(row => this.rowToQuestion(row));

        if (bankQuestions.length >= allocation.count) {
          // 题库够了
          allQuestions.push(...bankQuestions.slice(0, allocation.count));
        } else {
          // 题库不够，先用已有的
          allQuestions.push(...bankQuestions);

          // AI 生成剩余题目
          const remaining = allocation.count - bankQuestions.length;
          const aiQuestions = await this.generateAIQuestions(
            specification, allocation, remaining
          );
          allQuestions.push(...aiQuestions);
        }
      }

      return this.ok(allQuestions);
    } catch (err) {
      console.error('[SmartHomework] generateQuestions error:', err);
      return this.fail('命题失败', 'GENERATION_ERROR');
    }
  }

  /**
   * AI 生成题目
   */
  private async generateAIQuestions(
    specification: SpecificationTable,
    allocation: QuestionAllocation,
    count: number
  ): Promise<Question[]> {
    const questionTypeLabel = QT_LABELS[allocation.questionType];
    const difficultyLabel = DIFF_LABELS[allocation.difficulty];
    const cognitiveLabel = COG_LABELS[allocation.cognitiveLevel];

    const prompt = `你是专业的命题专家。请根据以下要求生成${count}道${questionTypeLabel}。

## 命题要求
- 学科：${specification.subject}
- 年级：${specification.grade}年级
- 知识点：${allocation.knowledgePoints.join('、')}
- 难度：${difficultyLabel}
- 认知层次：${cognitiveLabel}
- 每题分值：${allocation.scorePerQuestion}分

## 出题要求
1. 题目必须符合${specification.grade}年级学生的认知水平
2. 题目语言清晰、无歧义
3. 答案必须准确、唯一（选择题）
4. 选择题需提供4个选项，标明正确答案
5. 附带答案解析

## 输出格式
请用以下JSON格式输出（不要其他内容）：
<QUESTIONS>
[
  {
    "title": "题目标题（简短）",
    "content": "题目完整内容",
    "questionType": "${allocation.questionType}",
    "options": [{"label":"A","content":"选项内容","isCorrect":false}],
    "answer": "正确答案",
    "answerExplanation": "答案解析",
    "score": ${allocation.scorePerQuestion},
    "knowledgePoints": ${JSON.stringify(allocation.knowledgePoints)},
    "difficulty": "${allocation.difficulty}",
    "cognitiveLevel": "${allocation.cognitiveLevel}"
  }
]
</QUESTIONS>`;

    try {
      const messages = [
        {
          role: 'system' as const,
          content: '你是一位严谨的教育命题专家，擅长根据教学要求编制高质量试题。',
        },
        { role: 'user' as const, content: prompt },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-pro-260215',
        temperature: 0.8,
      });

      const match = response.content?.match(/<QUESTIONS>([\s\S]*?)<\/QUESTIONS>/);
      if (!match) return [];

      const parsed = JSON.parse(match[1].trim());
      const questions: Question[] = (Array.isArray(parsed) ? parsed : []).map((q: Record<string, unknown>, idx: number) => ({
        id: `ai_${Date.now()}_${idx}`,
        title: (q.title as string) || `第${idx + 1}题`,
        content: (q.content as string) || '',
        questionType: allocation.questionType,
        subject: specification.subject,
        grade: specification.grade,
        semester: specification.semester,
        knowledgePoints: allocation.knowledgePoints,
        difficulty: allocation.difficulty,
        difficultyScore: allocation.difficulty === 'easy' ? 0.3 : allocation.difficulty === 'hard' ? 0.8 : 0.5,
        discriminationScore: 0.4,
        cognitiveLevel: allocation.cognitiveLevel,
        options: (q.options as QuestionOption[]) || undefined,
        answer: (q.answer as string) || '',
        answerExplanation: (q.answerExplanation as string) || '',
        score: allocation.scorePerQuestion,
        tags: allocation.knowledgePoints,
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

  /** 为知识点分配权重 */
  private allocateKnowledgeWeights(
    knowledgePoints: string[],
    totalScore: number,
    grade: number,
    examType: ExamType
  ): KnowledgeDimension[] {
    if (knowledgePoints.length === 0) return [];

    // 均等分配基础权重
    const baseWeight = 1 / knowledgePoints.length;

    // 根据年级确定认知层次侧重
    const cognitiveFocus: CognitiveLevel[] = grade <= 2
      ? ['remember', 'understand']
      : grade <= 4
        ? ['understand', 'apply']
        : ['apply', 'analyze'];

    return knowledgePoints.map(kp => {
      const score = Math.round(totalScore * baseWeight);
      const dimensions: KnowledgeDimension = {
        name: kp,
        weight: Math.round(baseWeight * 100),
        cognitiveLevels: cognitiveFocus.map(level => ({
          level,
          score: Math.round(score / cognitiveFocus.length),
          questionCount: Math.max(1, Math.round(score / cognitiveFocus.length / 3)),
        })),
      };
      return dimensions;
    });
  }

  /** 为题型分配题目 */
  private allocateQuestions(
    questionTypes: QuestionType[],
    knowledgeDimensions: KnowledgeDimension[],
    totalScore: number,
    difficultyDistribution: DifficultyDistribution
  ): QuestionAllocation[] {
    if (questionTypes.length === 0) return [];

    // 每种题型的默认分值
    const defaultScorePerQuestion: Record<QuestionType, number> = {
      choice: 2, fill: 2, judge: 1, short_answer: 4,
      calculation: 5, application: 6, reading: 8, writing: 15, other: 3,
    };

    // 按题型分配总分的比例
    const typeWeights: Record<QuestionType, number> = {
      choice: 0.25, fill: 0.15, judge: 0.05, short_answer: 0.15,
      calculation: 0.15, application: 0.15, reading: 0.15, writing: 0.15, other: 0.05,
    };

    // 确保权重总和为1
    const totalWeight = questionTypes.reduce((s, t) => s + (typeWeights[t] || 0.1), 0);

    const allocations: QuestionAllocation[] = [];
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const cognitiveLevels: CognitiveLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

    for (const qt of questionTypes) {
      const weight = (typeWeights[qt] || 0.1) / totalWeight;
      const typeTotalScore = Math.round(totalScore * weight);
      const scorePerQ = defaultScorePerQuestion[qt];
      const count = Math.max(1, Math.round(typeTotalScore / scorePerQ));

      // 分配难度
      const diffIdx = allocations.length % 3;
      const difficulty = difficulties[diffIdx];

      // 分配认知层次
      const cogIdx = Math.min(allocations.length, cognitiveLevels.length - 1);
      const cognitiveLevel = cognitiveLevels[cogIdx];

      allocations.push({
        questionType: qt,
        count,
        scorePerQuestion: scorePerQ,
        totalScore: count * scorePerQ,
        knowledgePoints: knowledgeDimensions.slice(0, 2).map(kd => kd.name),
        difficulty,
        cognitiveLevel,
      });
    }

    return allocations;
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
