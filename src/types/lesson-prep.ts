/**
 * 备课中心类型定义
 * 
 * 学科备课支持系统，以语文学科为起点
 * 融合王崧舟老师"诗意语文"教学理念
 * 
 * @module types/lesson-prep
 */

// ==================== 学科配置 ====================

/** 学科类型 */
export type SubjectType = 
  | 'chinese'      // 语文
  | 'math'         // 数学
  | 'english'      // 英语
  | 'science'      // 科学
  | 'morality'     // 道德与法治
  | 'music'        // 音乐
  | 'art'          // 美术
  | 'pe';          // 体育

/** 学科配置 */
export type SubjectConfig = {
  type: SubjectType;
  name: string;
  icon: string;
  description: string;
  features: PrepFeature[];
  teachingMethods: TeachingMethod[];
};

/** 备课功能特性 */
export type PrepFeature = {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'design' | 'resource' | 'reflection';
};

/** 教学方法 */
export type TeachingMethod = {
  id: string;
  name: string;
  description: string;
  principles: string[];
  applicableGrades: number[];
};

// ==================== 备课文档 ====================

/** 备课文档类型 */
export type PrepDocType = 
  | 'text_interpretation'   // 文本解读
  | 'lesson_design'         // 教学设计
  | 'teaching_reflection'   // 教学反思
  | 'resource_material'     // 教学素材
  | 'classroom_strategy';   // 课堂策略

/** 备课文档状态 */
export type PrepDocStatus = 'draft' | 'reviewing' | 'published' | 'archived';

/** 备课文档 */
export type PrepDocument = {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: SubjectType;
  docType: PrepDocType;
  title: string;
  content: Record<string, unknown>;
  metadata: PrepDocMetadata;
  status: PrepDocStatus;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

/** 备课文档元数据 */
export type PrepDocMetadata = {
  grade?: number;
  semester?: number;
  unit?: string;
  lesson?: string;
  textbook?: string;
  teachingHours?: number;
  targetStudents?: string;
};

// ==================== 文本解读（语文学科核心） ====================

/** 文本解读方法（王崧舟理念） */
export type TextInterpretationMethod = 
  | 'avoid_stereotype'       // 规避套板反应
  | 'narrative_deep'         // 叙事性文本深度解读
  | 'triple_role'            // 三重角色融合
  | 'four_systems'           // 研读教材四系统
  | 'text_sensitivity'       // 提高文字敏感度
  | 'teaching_value';        // 读出教学价值

/** 文本解读结果 */
export type TextInterpretation = {
  id: string;
  documentId: string;
  textTitle: string;
  textContent?: string;
  interpretation: {
    /** 规避套板反应 */
    avoidStereotype: {
      identifiedPatterns: string[];
      uniquePoints: string[];
      deepMeaning: string;
    };
    /** 叙事性文本分析（如适用） */
    narrativeAnalysis?: {
      characters: CharacterAnalysis[];
      plot: PlotAnalysis;
      environment: EnvironmentAnalysis;
      theme: ThemeAnalysis;
    };
    /** 三重角色融合 */
    tripleRole: {
      readerPerspective: string;
      teacherPerspective: string;
      studentPerspective: string;
      integration: string;
    };
    /** 四系统分析 */
    fourSystems: {
      themeSystem: string;
      contentSystem: string;
      methodSystem: string;
      emotionSystem: string;
    };
    /** 文字敏感度 */
    textSensitivity: {
      keyWords: WordSensitivity[];
      rhetoric: RhetoricAnalysis[];
      punctuation: PunctuationAnalysis[];
      blanks: BlankAnalysis[];
    };
    /** 教学价值 */
    teachingValue: {
      firstLevel: string;
      secondLevel: string;
      thirdLevel: string;
      application: string;
    };
  };
  teachingPoints: TeachingPoint[];
  createdAt: string;
  updatedAt: string;
};

/** 人物分析 */
export type CharacterAnalysis = {
  name: string;
  appearance: string;
  language: string;
  action: string;
  psychology: string;
  significance: string;
};

/** 情节分析 */
export type PlotAnalysis = {
  structure: string;
  development: string[];
  climax: string;
  turningPoints: string[];
  deepMeaning: string;
};

/** 环境分析 */
export type EnvironmentAnalysis = {
  description: string;
  function: string;
  symbolism: string;
  relationToCharacter: string;
};

/** 主题分析 */
export type ThemeAnalysis = {
  surfaceTheme: string;
  deepTheme: string;
  humanisticSpirit: string;
  socialSignificance: string;
};

/** 词语敏感度 */
export type WordSensitivity = {
  word: string;
  context: string;
  deepMeaning: string;
  teachingUse: string;
};

/** 修辞分析 */
export type RhetoricAnalysis = {
  type: string;
  example: string;
  effect: string;
  teachingSuggestion: string;
};

/** 标点分析 */
export type PunctuationAnalysis = {
  punctuation: string;
  context: string;
  emotionalFunction: string;
  rhythmEffect: string;
};

/** 留白分析 */
export type BlankAnalysis = {
  location: string;
  type: string;
  meaning: string;
  teachingUse: string;
};

/** 教学要点 */
export type TeachingPoint = {
  id: string;
  type: 'knowledge' | 'ability' | 'emotion' | 'method';
  content: string;
  priority: 'core' | 'important' | 'supplementary';
  teachingStrategy: string;
  estimatedTime: number;
};

// ==================== 教学设计 ====================

/** 教学设计 */
export type LessonDesign = {
  id: string;
  documentId: string;
  grade: number;
  subject: SubjectType;
  lessonTitle: string;
  teachingObjectives: TeachingObjective[];
  keyPoints: string[];
  difficulties: string[];
  teachingMethods: string[];
  teachingProcess: TeachingStep[];
  boardDesign: string;
  homeworkDesign: string[];
  reflection: string;
  createdAt: string;
  updatedAt: string;
};

/** 教学目标 */
export type TeachingObjective = {
  id: string;
  dimension: 'knowledge' | 'ability' | 'emotion' | 'method';
  content: string;
  behavior: string;
  condition: string;
  degree: string;
};

/** 教学步骤 */
export type TeachingStep = {
  id: string;
  order: number;
  name: string;
  duration: number;
  type: 'import' | 'new_content' | 'practice' | 'discussion' | 'summary' | 'homework';
  activities: TeachingActivity[];
  teacherActions: string[];
  studentActions: string[];
  designIntent: string;
  stateRhythm?: {
    type: 'dynamic' | 'static';
    purpose: string;
  };
};

/** 教学活动 */
export type TeachingActivity = {
  id: string;
  type: 'reading' | 'writing' | 'discussion' | 'practice' | 'demonstration' | 'game' | 'multimedia';
  content: string;
  materials: string[];
  duration: number;
};

// ==================== 课堂策略（王崧舟理念） ====================

/** 课堂节奏类型 */
export type ClassroomRhythmType = 'dynamic' | 'static' | 'transitional';

/** 课堂状态策略 */
export type ClassroomStateStrategy = {
  type: '沉静启动' | '深度探究' | '想象体验' | '表达沉淀' | '沉浸体验';
  purpose: string;
  implementation: string;
  duration: number;
  followUp: string;
};

/** 课堂结构策略 */
export type ClassroomStructureStrategy = {
  surfaceContent: string;
  focusPoints: {
    firstLevel: string;
    secondLevel: string;
    selectionReason: string;
  };
  progressionLogic: string;
};

/** 课堂节奏策略 */
export type ClassroomRhythmStrategy = {
  risingPoints: {
    trigger: string;
    method: 'unexpected' | 'visual' | 'physical' | 'emotional';
    implementation: string;
  }[];
  settlingZones: {
    type: '思考沉淀' | '情感内化' | '表达整理';
    purpose: string;
    duration: number;
  }[];
  transition: string;
};

/** 课堂策略综合 */
export type ClassroomStrategy = {
  id: string;
  documentId: string;
  stateStrategy: ClassroomStateStrategy[];
  structureStrategy: ClassroomStructureStrategy;
  rhythmStrategy: ClassroomRhythmStrategy;
  questionDesign: QuestionDesign[];
  evaluationLanguage: EvaluationLanguage[];
  createdAt: string;
  updatedAt: string;
};

/** 问题设计 */
export type QuestionDesign = {
  id: string;
  content: string;
  type: 'closed' | 'open' | 'guiding' | 'provocative';
  timing: string;
  purpose: string;
  expectedResponse: string;
  followUpStrategy: string;
};

/** 评价语言 */
export type EvaluationLanguage = {
  id: string;
  scenario: string;
  style: 'literary' | 'passionate' | 'humorous';
  content: string;
  purpose: string;
};

// ==================== 查询参数 ====================

/** 备课文档查询参数 */
export type PrepDocumentQueryParams = {
  teacherId?: string;
  subject?: SubjectType;
  docType?: PrepDocType;
  status?: PrepDocStatus;
  grade?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

/** 创建备课文档参数 */
export type CreatePrepDocumentParams = {
  teacherId: string;
  teacherName: string;
  subject: SubjectType;
  docType: PrepDocType;
  title: string;
  content: Record<string, unknown>;
  metadata?: PrepDocMetadata;
  tags?: string[];
};

/** 更新备课文档参数 */
export type UpdatePrepDocumentParams = {
  title?: string;
  content?: Record<string, unknown>;
  metadata?: PrepDocMetadata;
  tags?: string[];
  status?: PrepDocStatus;
};

// ==================== 数据库行类型 ====================

/** 备课文档数据库行 */
export type PrepDocumentRow = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  subject: SubjectType;
  doc_type: PrepDocType;
  title: string;
  content: Record<string, unknown>;
  metadata: PrepDocMetadata;
  status: PrepDocStatus;
  version: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at?: string;
};

// ==================== 学科知识库配置 ====================

/** 语文学科教学理念（王崧舟诗意语文） */
export const CHINESE_TEACHING_PHILOSOPHY = {
  /** 文本解读六法 */
  textInterpretationMethods: [
    {
      id: 'avoid_stereotype',
      name: '规避套板反应',
      description: '识别套板化的解读框架，发现文本的异质性',
      principles: [
        '警惕常见解读框架（如"中心思想-写作手法-语言特色"）',
        '规避常见套板（如"勤劳勇敢""无私奉献""热爱祖国"）',
        '发现文本的独特性，找到独特解读点',
      ],
    },
    {
      id: 'narrative_deep',
      name: '叙事性文本深度解读',
      description: '从人物、情节、环境、主题四维度深入分析',
      principles: [
        '人物形象分析：外貌、语言、动作、心理',
        '情节结构梳理：发展脉络、深层含义',
        '环境描写赏析：作用、象征意义',
        '主题意蕴挖掘：深层主题、人文精神',
      ],
    },
    {
      id: 'triple_role',
      name: '三重角色融合',
      description: '读者、教师、学生三重视角的融合',
      principles: [
        '读者角色：情感共鸣、审美体验',
        '教师角色：教学目标、价值引导',
        '学生角色：理解障碍、兴趣点',
        '三重融合：确保教学导向与可行性',
      ],
    },
    {
      id: 'four_systems',
      name: '研读教材四系统',
      description: '主题、内容、方法、情感四系统分析',
      principles: [
        '主题系统：核心立意和思想内涵',
        '内容系统：重点难点梳理',
        '方法系统：教学方法和策略',
        '情感系统：情感基调和价值取向',
      ],
    },
    {
      id: 'text_sensitivity',
      name: '提高文字敏感度',
      description: '对关键词、修辞、标点、留白的敏感',
      principles: [
        '敏感关键词：抓住文本密码',
        '敏感修辞：发现文本之美',
        '敏感标点：感受文本节奏',
        '敏感空白：理解留白意义',
      ],
    },
    {
      id: 'teaching_value',
      name: '读出教学价值',
      description: '从解读到教学设计的转化',
      principles: [
        '第一重：理解字面意思',
        '第二重：理解深层含义',
        '第三重：理解教学价值',
        '应用：基于教学价值设计教学',
      ],
    },
  ],
  /** 课堂状态设计 */
  classroomStateDesign: [
    {
      type: '沉静启动之静',
      purpose: '快速进入学习状态',
      forms: ['整体感知任务', '前测诊断任务', '聚焦问题任务'],
    },
    {
      type: '深度探究之静',
      purpose: '为动蓄积势能',
      forms: ['文本细读静思', '问题探究静思', '证据搜寻静思'],
    },
    {
      type: '想象体验之静',
      purpose: '促进深度理解',
      forms: ['闭目想象还原', '对比想象连接', '角色共情想象'],
    },
    {
      type: '表达沉淀之静',
      purpose: '推动意义生成',
      forms: ['即时书写表达', '创意写作表达', '结构化梳理表达'],
    },
    {
      type: '沉浸体验之静',
      purpose: '实现情感升华',
      forms: ['视频观看体验', '音乐聆听体验', '图像凝视体验'],
    },
  ],
  /** 课堂结构设计 */
  classroomStructureDesign: {
    principles: [
      '点面相成：聚焦核心语段，由点激活面',
      '双层聚焦：第一层选核心段落，第二层抓关键词',
      '取舍智慧：敢于不教某些内容',
      '回归整体：点的学习最终回归面的理解',
    ],
    focusCriteria: [
      '承载主旨：蕴含核心思想',
      '激发情感：触动学生情感',
      '引导行动：可转化为行动指引',
    ],
  },
  /** 课堂节奏设计 */
  classroomRhythmDesign: {
    risingTriggers: [
      { type: 'unexpected', name: '意外的呈现', description: '打破常规认知' },
      { type: 'visual', name: '形象的转化', description: '抽象转具象' },
      { type: 'physical', name: '身体的参与', description: '肢体参与学习' },
      { type: 'emotional', name: '情感的激发', description: '触动内在情感' },
    ],
    settlingTypes: [
      { type: '思考沉淀', description: '给思考以充分时间' },
      { type: '情感内化', description: '让情感得以沉淀' },
      { type: '表达整理', description: '让成果外显化' },
    ],
  },
} as const;

/** 学科配置列表 */
export const SUBJECT_CONFIGS: SubjectConfig[] = [
  {
    type: 'chinese',
    name: '语文',
    icon: 'BookOpen',
    description: '诗意语文，文本解读，人文滋养',
    features: [
      { id: 'text_interpretation', name: '文本解读', description: '六法解读文本深层意蕴', category: 'analysis' },
      { id: 'lesson_design', name: '教学设计', description: '点面结合，动静相生', category: 'design' },
      { id: 'classroom_strategy', name: '课堂策略', description: '节奏把控，理答艺术', category: 'design' },
      { id: 'teaching_reflection', name: '教学反思', description: '课堂叙事，成长记录', category: 'reflection' },
    ],
    teachingMethods: [
      { id: 'poetic_chinese', name: '诗意语文', description: '王崧舟老师教学理念', principles: ['文本细读', '三重角色', '点面相生', '动静相生'], applicableGrades: [1, 2, 3, 4, 5, 6] },
    ],
  },
  {
    type: 'math',
    name: '数学',
    icon: 'Calculator',
    description: '逻辑思维，问题解决',
    features: [
      { id: 'concept_analysis', name: '概念分析', description: '数学概念深度解读', category: 'analysis' },
      { id: 'problem_design', name: '问题设计', description: '层次递进的问题串', category: 'design' },
      { id: 'thinking_process', name: '思维过程', description: '展现思维路径', category: 'design' },
    ],
    teachingMethods: [],
  },
  {
    type: 'english',
    name: '英语',
    icon: 'Languages',
    description: '语言习得，跨文化理解',
    features: [
      { id: 'text_analysis', name: '文本分析', description: '语篇理解与分析', category: 'analysis' },
      { id: 'activity_design', name: '活动设计', description: '交际活动设计', category: 'design' },
    ],
    teachingMethods: [],
  },
];
