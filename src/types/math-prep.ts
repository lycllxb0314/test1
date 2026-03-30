/**
 * 数学学科备课类型定义
 * 
 * 基于论文《小学数学教学"教什么"》本体论推导设计
 * 核心理念：本质、过程、思想、结构 + 教学路径
 * 
 * @module types/math-prep
 */

// ==================== 教学内容数据库 ====================

/** 知识领域 */
export type MathDomain = 
  | '数与代数'
  | '图形与几何'
  | '统计与概率'
  | '综合与实践';

/** 学期 */
export type Semester = '上册' | '下册';

/** 课时类型 */
export type LessonType = '新授课' | '练习课' | '复习课' | '活动课';

/** 数学教学内容 */
export type MathTeachingContent = {
  id: string;
  grade: number;                      // 年级 1-6
  semester: Semester;                  // 学期
  domain: MathDomain;                  // 知识领域
  unitName: string;                    // 单元名称
  unitOrder: number;                   // 单元顺序
  contentName: string;                 // 教学内容名称
  contentKey: string;                  // 内容唯一标识
  lessonType: LessonType;              // 课时类型
  priorKnowledge: string[];            // 前置知识
  subsequentExtension: string[];       // 后续延伸
  coreCompetencies: string[];          // 核心素养
  createdAt: string;
  updatedAt: string;
};

/** 数学教学内容数据库行 */
export type MathTeachingContentRow = {
  id: string;
  grade: number;
  semester: Semester;
  domain: MathDomain;
  unit_name: string;
  unit_order: number;
  content_name: string;
  content_key: string;
  lesson_type: LessonType;
  prior_knowledge: string[];
  subsequent_extension: string[];
  core_competencies: string[];
  created_at: string;
  updated_at: string;
};

// ==================== 四维分析 ====================

/** 本质挖掘 */
export type EssenceAnalysis = {
  /** 概念内核 */
  conceptCore: {
    /** 核心定义 */
    definition: string;
    /** 本质属性 */
    essentialAttributes: string[];
    /** 非本质属性 */
    nonEssentialAttributes: string[];
  };
  /** 内涵解析 */
  connotationAnalysis: {
    /** 核心要素 */
    coreElements: string[];
    /** 关键特征 */
    keyFeatures: string[];
    /** 理解难点 */
    difficultPoints: string[];
  };
  /** 外延界定 */
  extensionDefinition: {
    /** 适用范围 */
    scope: string;
    /** 特殊情况 */
    specialCases: string[];
    /** 边界说明 */
    boundaries: string;
  };
  /** 正反例 */
  examples: {
    /** 正例 */
    positiveExamples: Array<{
      content: string;
      explanation: string;
    }>;
    /** 反例 */
    negativeExamples: Array<{
      content: string;
      explanation: string;
    }>;
    /** 辨析要点 */
    distinctionPoints: string[];
  };
};

/** 过程还原 */
export type ProcessRestoration = {
  /** 知识发生 */
  knowledgeOrigin: {
    /** 历史背景 */
    historicalBackground: string;
    /** 产生原因 */
    causeOfEmergence: string;
    /** 解决的问题 */
    problemSolved: string;
  };
  /** 前人困惑 */
  predecessorConfusion: {
    /** 遇到的难题 */
    difficulties: string[];
    /** 尝试的方法 */
    attemptedMethods: string[];
    /** 失败原因 */
    failureReasons: string[];
  };
  /** 思维跃迁 */
  thinkingTransition: {
    /** 突破关键 */
    breakthroughKey: string;
    /** 思维转变 */
    mindsetShift: string;
    /** 方法创新 */
    methodInnovation: string;
  };
  /** 再创造设计 */
  recreationDesign: {
    /** 学生应经历的思考过程 */
    thinkingProcess: string[];
    /** 关键探究活动 */
    inquiryActivities: string[];
    /** 教师引导策略 */
    guidanceStrategies: string[];
  };
};

/** 思想显影 */
export type ThoughtRevelation = {
  /** 隐含思想 */
  implicitThoughts: Array<{
    name: string;                    // 思想名称
    description: string;             // 思想描述
    manifestation: string;           // 在本内容中的体现
    level: 'core' | 'secondary';     // 思想层级
  }>;
  /** 渗透节点 */
  infiltrationPoints: Array<{
    teachingPhase: string;           // 教学环节
    thought: string;                 // 渗透的思想
    method: string;                  // 渗透方法
    script: string;                  // 教学话术
  }>;
  /** 思想体系 */
  thoughtSystem: {
    /** 主线思想 */
    mainThread: string;
    /** 支撑思想 */
    supportingThoughts: string[];
    /** 思想网络图 */
    thoughtNetwork: string;
  };
};

/** 结构贯通 */
export type StructureConnection = {
  /** 纵向联系 */
  verticalConnection: {
    /** 前置知识链接 */
    priorLink: {
      content: string;
      connectionPoint: string;
      bridgingMethod: string;
    };
    /** 后续知识延伸 */
    subsequentLink: {
      content: string;
      connectionPoint: string;
      extensionDirection: string;
    };
    /** 知识发展脉络 */
    developmentContext: string;
  };
  /** 横向联系 */
  horizontalConnection: {
    /** 相关知识 */
    relatedKnowledge: Array<{
      content: string;
      commonality: string;
      difference: string;
    }>;
    /** 方法迁移 */
    methodTransfer: string[];
  };
  /** 统一框架 */
  unifiedFramework: {
    /** 上位概念 */
    superordinateConcept: string;
    /** 统一结构 */
    unifiedStructure: string;
    /** 概括性理解 */
    generalUnderstanding: string;
  };
};

// ==================== 教学路径 ====================

/** 教学目标 */
export type TeachingObjective = {
  dimension: 'knowledge' | 'ability' | 'emotion' | 'thinking';
  content: string;
  behavior: string;
  degree: string;
};

/** 教学重难点 */
export type KeyDifficulty = {
  /** 重点 */
  keyPoints: Array<{
    content: string;
    reason: string;
    strategy: string;
  }>;
  /** 难点 */
  difficulties: Array<{
    content: string;
    cause: string;
    breakthrough: string;
  }>;
};

/** 教学环节 */
export type TeachingPhase = {
  name: string;                      // 环节名称
  duration: number;                  // 时长（分钟）
  purpose: string;                   // 目的
  activities: string[];              // 学生活动
  teacherActions: string[];          // 教师行为
  keyQuestions: string[];            // 关键提问
  designIntent: string;              // 设计意图
};

/** 教学路径 */
export type TeachingPath = {
  /** 教学目标 */
  objectives: TeachingObjective[];
  /** 重难点 */
  keyDifficulty: KeyDifficulty;
  /** 教学环节 */
  phases: TeachingPhase[];
  /** 关键提问设计 */
  keyQuestionDesign: Array<{
    question: string;
    purpose: string;
    expectedResponse: string;
    followUp: string;
  }>;
  /** 学生活动设计 */
  studentActivityDesign: Array<{
    activity: string;
    form: 'individual' | 'pair' | 'group' | 'whole_class';
    materials: string[];
    guidance: string;
  }>;
  /** 评价建议 */
  evaluationSuggestions: Array<{
    aspect: string;
    method: string;
    criteria: string;
  }>;
};

// ==================== 完整方案 ====================

/** 数学备课方案 */
export type MathPrepPlan = {
  /** 教学内容信息 */
  contentInfo: {
    grade: number;
    semester: Semester;
    domain: MathDomain;
    unitName: string;
    contentName: string;
  };
  /** 本质挖掘 */
  essence: EssenceAnalysis;
  /** 过程还原 */
  process: ProcessRestoration;
  /** 思想显影 */
  thought: ThoughtRevelation;
  /** 结构贯通 */
  structure: StructureConnection;
  /** 教学路径 */
  teachingPath: TeachingPath;
};

/** 数学备课请求 */
export type MathPrepRequest = {
  /** 教学内容ID */
  contentId: string;
  /** 年级 */
  grade: number;
  /** 学期 */
  semester: Semester;
  /** 知识领域 */
  domain: MathDomain;
  /** 单元名称 */
  unitName: string;
  /** 教学内容名称 */
  contentName: string;
  /** 教学内容标识 */
  contentKey: string;
};

/** 数学备课响应 */
export type MathPrepResponse = {
  success: boolean;
  data?: MathPrepPlan;
  error?: string;
};

// ==================== API 相关 ====================

/** 单元分组 */
export type UnitGroup = {
  unitOrder: number;
  unitName: string;
  domain: MathDomain;
  contents: MathTeachingContent[];
};

/** 年级学期查询参数 */
export type MathContentQueryParam = {
  grade: number;
  semester: Semester;
};
