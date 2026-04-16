/**
 * 智慧作业/练习 类型定义
 *
 * 本体论推导：
 * - 管理对象：试题(Question)、试卷(Paper)、命题细目表(Specification)
 * - 管理行为：需求对话(Dialog)、智能命题(Generation)、选题组卷(Composition)、排版预览(Layout)
 * - 管理组织：知识维度(Knowledge)、认知维度(Cognition)、难度维度(Difficulty)
 *
 * @module types/smart-homework
 */

// ==================== 题型 ====================

export type QuestionType =
  | 'choice'       // 选择题
  | 'fill'         // 填空题
  | 'judge'        // 判断题
  | 'short_answer'  // 简答题
  | 'calculation'   // 计算题
  | 'application'   // 应用题
  | 'reading'       // 阅读理解
  | 'writing'       // 写作题
  | 'other';        // 其他

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  choice: '选择题',
  fill: '填空题',
  judge: '判断题',
  short_answer: '简答题',
  calculation: '计算题',
  application: '应用题',
  reading: '阅读理解',
  writing: '写作题',
  other: '其他',
};

// ==================== 难度 ====================

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '容易',
  medium: '中等',
  hard: '较难',
};

// ==================== 认知层次（布鲁姆分类） ====================

export type CognitiveLevel =
  | 'remember'   // 识记
  | 'understand' // 理解
  | 'apply'      // 应用
  | 'analyze'    // 分析
  | 'evaluate'   // 评价
  | 'create';    // 创造

export const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, string> = {
  remember: '识记',
  understand: '理解',
  apply: '应用',
  analyze: '分析',
  evaluate: '评价',
  create: '创造',
};

// ==================== 试卷类型 ====================

export type ExamType = 'quiz' | 'unit_test' | 'midterm' | 'final' | 'mock' | 'homework' | 'practice';

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  quiz: '随堂测验',
  unit_test: '单元测试',
  midterm: '期中考试',
  final: '期末考试',
  mock: '模拟考试',
  homework: '作业',
  practice: '练习',
};

// ==================== 试题 ====================

export type Question = {
  id: string;
  title: string;
  content: string;
  questionType: QuestionType;
  subject: string;
  grade: number;
  semester: string;
  knowledgePoints: string[];
  difficulty: Difficulty;
  difficultyScore: number;
  discriminationScore: number;
  cognitiveLevel: CognitiveLevel;
  options?: QuestionOption[];
  answer: string;
  answerExplanation: string;
  score: number;
  tags: string[];
  source: string;
  sourceInfo: Record<string, unknown>;
  createdBy: string;
  createdByName: string;
  isShared: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
};

export type QuestionOption = {
  label: string;
  content: string;
  isCorrect: boolean;
};

// ==================== 命题双向细目表 ====================

export type SpecificationTable = {
  subject: string;
  grade: number;
  semester: string;
  examType: ExamType;
  totalScore: number;
  duration: number;
  /** 知识点维度 */
  knowledgeDimensions: KnowledgeDimension[];
  /** 题目分配 */
  questionAllocation: QuestionAllocation[];
  /** 难度分布 */
  difficultyDistribution: DifficultyDistribution;
  /** 教师确认状态 */
  confirmed: boolean;
};

export type KnowledgeDimension = {
  name: string;
  weight: number; // 权重百分比
  cognitiveLevels: CognitiveLevelAllocation[];
};

export type CognitiveLevelAllocation = {
  level: CognitiveLevel;
  score: number;
  questionCount: number;
};

export type QuestionAllocation = {
  questionType: QuestionType;
  count: number;
  scorePerQuestion: number;
  totalScore: number;
  knowledgePoints: string[];
  difficulty: Difficulty;
  cognitiveLevel: CognitiveLevel;
};

export type DifficultyDistribution = {
  easy: number;    // 容易题占比
  medium: number;  // 中等题占比
  hard: number;    // 较难题占比
};

// ==================== 需求对话 ====================

export type DialogMessage = {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: string;
};

export type RequirementDialog = {
  id: string;
  teacherId: string;
  messages: DialogMessage[];
  /** AI 推断出的需求摘要 */
  inferredRequirements: InferredRequirements;
  /** 对话状态 */
  status: 'active' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export type InferredRequirements = {
  subject: string;
  grade: number;
  semester: string;
  examType: ExamType;
  knowledgePoints: string[];
  difficultyPreference: Difficulty;
  questionTypes: QuestionType[];
  totalScore: number;
  duration: number;
  /** AI 因果推理说明 */
  reasoning: string;
  /** AI 建议调整项 */
  suggestions: string[];
};

// ==================== 试卷 ====================

export type ExamPaper = {
  id: string;
  title: string;
  subject: string;
  grade: number;
  semester: string;
  examType: ExamType;
  totalScore: number;
  duration: number;
  specification: SpecificationTable;
  questions: PaperQuestion[];
  layoutConfig: PaperLayoutConfig;
  paperHtml: string;
  status: 'draft' | 'confirmed' | 'published' | 'archived';
  createdBy: string;
  createdByName: string;
  isShared: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PaperQuestion = {
  questionId: string;
  order: number;
  section: string;
  score: number;
  /** 试题完整数据 */
  data: Question;
};

export type PaperLayoutConfig = {
  pageSize: 'A4' | 'A3' | 'B4';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number };
  fontSize: number;
  showAnswerSheet: boolean;
  columns: 1 | 2;
};

// ==================== 试题篮 ====================

export type BasketItem = {
  questionId: string;
  question: Question;
  addedAt: string;
  assignedScore: number;
  section: string;
};

// ==================== API 请求/响应 ====================

export type GenerateSpecificationRequest = {
  subject: string;
  grade: number;
  semester: string;
  examType: ExamType;
  knowledgePoints?: string[];
  totalScore?: number;
  duration?: number;
  difficultyPreference?: Difficulty;
  /** 教师自由描述的需求 */
  freeDescription?: string;
};

export type ChatRequest = {
  message: string;
  /** 已有的对话历史 */
  history: DialogMessage[];
  /** 当前推断的需求 */
  currentRequirements?: InferredRequirements;
  subject: string;
  grade: number;
};

export type GenerateQuestionsRequest = {
  specification: SpecificationTable;
  count?: number;
};

export type ImportQuestionRequest = {
  title: string;
  content: string;
  questionType: QuestionType;
  subject: string;
  grade: number;
  semester: string;
  knowledgePoints?: string[];
  difficulty?: Difficulty;
  cognitiveLevel?: CognitiveLevel;
  options?: QuestionOption[];
  answer: string;
  answerExplanation?: string;
  score?: number;
  tags?: string[];
};

export type ComposePaperRequest = {
  title: string;
  subject: string;
  grade: number;
  semester: string;
  examType: ExamType;
  totalScore: number;
  duration: number;
  specification: SpecificationTable;
  questions: PaperQuestion[];
  layoutConfig?: Partial<PaperLayoutConfig>;
};

export type QuestionBankQuery = {
  subject?: string;
  grade?: number;
  semester?: string;
  questionType?: QuestionType;
  difficulty?: Difficulty;
  knowledgePoint?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};
