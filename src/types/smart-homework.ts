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
  | 'apply'      // 运用
  | 'analyze'    // 分析
  | 'evaluate'   // 评价
  | 'create';    // 创造

export const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, string> = {
  remember: '识记',
  understand: '理解',
  apply: '运用',
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
  /** 题目配图URL（数学图形题等） */
  imageUrl?: string;
  /** 题目配图说明 */
  imageAlt?: string;
  createdAt: string;
  updatedAt: string;
};

export type QuestionOption = {
  label: string;
  content: string;
  isCorrect: boolean;
};

// ==================== 命题双向细目表 ====================

/**
 * 命题双向细目表（教育测量学规范）
 *
 * 双向含义：
 * - 纵向（为什么评）：能力层级 / 认知水平（识记、理解、运用、分析、评价、创造）
 * - 横向（评什么）：具体知识内容（细化到单元-课-知识点）
 *
 * 细目含义：
 * 1. 知识细化：将"本学期所学内容"细化为"第X单元-第X课-具体知识点"
 * 2. 能力细化：将"考查学生能力"细化为"识记、理解、运用、分析、评价、创造"等层级
 * 3. 规划与分配细化：将"出一份卷子"细化为每个知识点及素养怎么评的精确规划
 */

/** 知识内容条目（横向：评什么） */
export type KnowledgeContent = {
  /** 知识点编号，如 "1.1" */
  code: string;
  /** 知识点名称，如 "平行四边形面积公式推导" */
  name: string;
  /** 所属单元，如 "第六单元" */
  unit: string;
  /** 所属课/节，如 "第1课" */
  lesson: string;
  /** 该知识点在本次评价中的权重百分比 */
  weight: number;
  /** 该知识点的总分 */
  totalScore: number;
  /** 该知识点在各认知层次的分配详情 */
  cognitiveAllocations: CognitiveAllocation[];
};

/** 认知层次分配（纵向×横向交叉单元格） */
export type CognitiveAllocation = {
  /** 认知层次 */
  level: CognitiveLevel;
  /** 该知识点在该层次的题数 */
  questionCount: number;
  /** 每题分值（必须为整数） */
  scorePerQuestion: number;
  /** 该知识点在该层次的分值 = questionCount × scorePerQuestion（必须为整数） */
  score: number;
  /** 该知识点在该层次建议使用的题型 */
  suggestedQuestionTypes: QuestionType[];
  /** 全局题号列表，如 [3, 4] 表示第3题和第4题 */
  questionNumbers: number[];
  /**
   * 填空题每题空数（仅填空题需要）
   * - 选择/判断/其他题型：不设置（undefined）
   * - 填空题：必须设置，表示每道填空题包含几个空
   * - 填空题的 scorePerQuestion = blanksPerQuestion × scorePerBlank（每空分值）
   */
  blanksPerQuestion?: number;
};

/** 能力层级汇总（纵向：为什么评） */
export type CognitiveSummary = {
  /** 认知层次 */
  level: CognitiveLevel;
  /** 该层次总题数 */
  totalQuestions: number;
  /** 该层次总分值 */
  totalScore: number;
  /** 占比百分比 */
  percentage: number;
};

/** 题型规划 */
export type QuestionTypePlan = {
  /** 题型 */
  questionType: QuestionType;
  /** 该题型题数 */
  count: number;
  /** 每题分值（整数，选择题同卷统一；填空题=blanksPerQuestion×scorePerBlank） */
  scorePerQuestion: number;
  /** 该题型总分 */
  totalScore: number;
  /** 该题型覆盖的知识点 */
  knowledgePoints: string[];
  /** 该题型对应的认知层次 */
  cognitiveLevels: CognitiveLevel[];
  /** 难度 */
  difficulty: Difficulty;
  /**
   * 填空题每空分值（仅填空题有值）
   * 同一份试卷所有填空题的每空分值统一
   */
  scorePerBlank?: number;
  /**
   * 填空题总空数（仅填空题有值）
   * = count × 平均blanksPerQuestion
   */
  totalBlanks?: number;
  /**
   * 填空题每题空数（仅填空题有值）
   * 同一份试卷所有填空题的每题空数统一
   */
  blanksPerQuestion?: number;
};

/** 细目表整体结构 */
export type SpecificationTable = {
  /** 学科 */
  subject: string;
  /** 年级 */
  grade: number;
  /** 学期 */
  semester: string;
  /** 考试类型 */
  examType: ExamType;
  /** 总分 */
  totalScore: number;
  /** 时长(分钟) */
  duration: number;
  /** 评价范围描述，如 "人教版五年级上册 第六单元 多边形的面积" */
  scope: string;
  /**
   * 横向：知识内容维度（评什么）
   * 细化到单元-课-知识点
   */
  knowledgeContents: KnowledgeContent[];
  /**
   * 纵向：认知水平汇总（为什么评）
   * 各认知层次的题数/分值/占比
   */
  cognitiveSummary: CognitiveSummary[];
  /**
   * 题型规划
   * 每种题型的详细分配方案
   */
  questionTypePlans: QuestionTypePlan[];
  /** 难度分布 */
  difficultyDistribution: DifficultyDistribution;
  /** 教师确认状态 */
  confirmed: boolean;
};

/** @deprecated 旧版兼容，后续移除 */
export type KnowledgeDimension = KnowledgeContent;

/** @deprecated 旧版兼容，后续移除 */
export type CognitiveLevelAllocation = CognitiveAllocation;

/** @deprecated 旧版兼容，后续移除 */
export type QuestionAllocation = QuestionTypePlan;

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
  /** 期望总题量（AI推断或用户指定） */
  totalQuestionCount: number;
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
  /** 题目配图URL（数学图形题等） */
  imageUrl?: string;
  /** 题目配图说明 */
  imageAlt?: string;
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


/**
 * 命题任务状态（AI全自动执行）
 *
 * 流转：pending → generating → reviewing → formatting → completed
 *                ↓              ↓
 *            failed        revision → generating（审阅不通过时AI自动重新命题）
 */
export type ExamTaskStatus =
  | 'pending'      // 已创建，等待启动
  | 'generating'   // AI正在按交叉格逐个命题
  | 'reviewing'    // AI正在审阅题目质量
  | 'revision'     // 审阅发现问题，AI重新命题
  | 'formatting'   // AI正在排版组卷
  | 'completed'    // 全部完成，可预览/下载
  | 'failed';      // 执行失败

/**
 * 单个交叉格的命题进度
 */
export type CellProgress = {
  /** 知识点编码 */
  knowledgeCode: string;
  /** 知识点名称 */
  knowledgeName: string;
  /** 认知层次 */
  cognitiveLevel: CognitiveLevel;
  /** 题型 */
  questionType: QuestionType;
  /** 要求题数 */
  requiredCount: number;
  /** 已完成题数 */
  completedCount: number;
  /** 状态：pending/generating/done/failed */
  cellStatus: 'pending' | 'generating' | 'done' | 'failed';
  /** 审阅结果：pending/approved/rejected */
  reviewResult: 'pending' | 'approved' | 'rejected';
  /** 审阅意见 */
  reviewComment?: string;
  /** 重试次数 */
  retryCount: number;
};

/**
 * 命题任务（AI全自动执行）
 *
 * 教师确认细目表后一键启动，AI自动完成：
 * 1. 按交叉格逐一命题（分配→出题）
 * 2. 自动审阅（检查知识点/认知层次/分值一致性）
 * 3. 审阅不通过自动重新命题
 * 4. 全部通过后自动排版组卷
 */
export type ExamTask = {
  id: string;
  /** 任务标题 */
  title: string;
  /** 学科 */
  subject: string;
  /** 年级 */
  grade: number;
  /** 学期 */
  semester: string;
  /** 考试类型 */
  examType: ExamType;
  /** 总分 */
  totalScore: number;
  /** 时长(分钟) */
  duration: number;
  /** 命题双向细目表 */
  specification: SpecificationTable;
  /** 任务状态 */
  status: ExamTaskStatus;
  /** 创建者ID */
  creatorId: string;
  /** 创建者姓名 */
  creatorName: string;
  /** 各交叉格命题进度 */
  cellProgress: CellProgress[];
  /** 最终生成的所有题目 */
  questions: Question[];
  /** 最终试卷HTML */
  paperHtml?: string;
  /** 最终Word文件URL */
  paperDocxUrl?: string;
  /** 最终组卷ID */
  finalPaperId?: string;
  /** 进度百分比(0-100) */
  progress: number;
  /** 当前步骤描述 */
  currentStep?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 备注 */
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 创建命题任务请求
 */
export type CreateExamTaskRequest = {
  title: string;
  subject: string;
  grade: number;
  semester: string;
  examType: ExamType;
  totalScore: number;
  duration: number;
  specification: SpecificationTable;
  notes?: string;
};
