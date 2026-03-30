/**
 * 语文学科专项备课类型定义
 * 
 * 包含：生字专项、朗读教学、习作专项
 */

// ==================== 生字专项 ====================

/** 单字信息 */
export type CharacterInfo = {
  /** 汉字 */
  char: string;
  /** 拼音 */
  pinyin: string;
  /** 部首 */
  radical: string;
  /** 结构（上下、左右、独体等） */
  structure: '独体字' | '左右结构' | '上下结构' | '左中右结构' | '上中下结构' | '半包围结构' | '全包围结构';
  /** 笔画数 */
  strokeCount: number;
  /** 笔顺（笔画名称数组） */
  strokeOrder: string[];
  /** 笔顺 SVG 路径数据 */
  strokePaths: string[];
  /** 笔画书写指导 */
  strokeGuide: Array<{
    name: string;
    position: string;
    tip: string;
  }>;
  /** 组词 */
  words: string[];
};

/** 字源信息 */
export type CharacterOrigin = {
  char: string;
  origin: string; // 字源（甲骨文、金文等）
  evolution: string[]; // 演变过程
  culturalStory: string; // 文化故事
  memoryMethod: string; // 记忆方法
};

/** 造句项（按年级分层） */
export type SentenceItem = {
  sentence: string;
  type: 'simple' | 'compound' | 'complex' | 'rhetorical'; // 简单句、并列句、复杂句、修辞句
  analysis?: string; // 句式分析（中高年级）
  keyWords?: string[]; // 关键词标注
};

/** 本体论推导 */
export type OntologyDerivation = {
  char: string;
  // 认知阶段
  recognition: {
    formAnalysis: string; // 字形分析
    phoneticClue: string; // 读音线索
    writingGuide: string; // 书写要点
  };
  // 理解阶段
  understanding: {
    meaning: string; // 字义
    meaningEvolution: string; // 字义演变
    semanticField: string[]; // 语义场（相关词）
    collocation: string[]; // 词语搭配
  };
  // 应用阶段
  application: {
    basicWords: string[]; // 基础组词
    advancedWords: string[]; // 拓展组词
    sentences: SentenceItem[]; // 造句（按年级分层）
  };
  // 拓展阶段
  extension: {
    relatedCharacters: string[]; // 相关字
    culturalContext: string; // 文化背景
    readingSuggestion: string; // 阅读建议
  };
};

/** 年级句子要求 */
export type GradeSentenceRequirement = {
  grade: number;
  sentenceCount: number;
  sentenceType: string;
  requirements: string[];
};

/** 形近字组 */
export type SimilarCharGroup = {
  /** 基准字 */
  baseChar: string;
  /** 形近字列表 */
  similarChars: Array<{
    char: string;
    pinyin: string;
    difference: string; // 区别说明
    example: string; // 组词示例
  }>;
  /** 辨析要点 */
  analysis: string;
};

/** 多音字 */
export type PolyphonicChar = {
  char: string;
  readings: Array<{
    pinyin: string;
    meaning: string;
    example: string;
  }>;
 记忆口诀?: string;
};

/** 田字格范写 */
export type GridWriting = {
  char: string;
  /** SVG 路径 */
  svgPath: string;
  /** 关键笔画位置说明 */
  keyStrokes: Array<{
    name: string;
    position: string;
    tip: string;
  }>;
};

/** 听写清单项（组词听写） */
export type DictationItem = {
  word: string;           // 听写词语
  pinyin: string;         // 词语拼音
  mainChar: string;       // 本课生字（在词语中的位置）
  charPinyin: string;     // 生字拼音
  difficulty: 'easy' | 'medium' | 'hard';
};

/** 练习类型 */
export type ExerciseType = 
  | 'fill_blank' // 填空题
  | 'multiple_choice' // 选择题
  | 'matching' // 连线题
  | 'correction' // 改错题
  | 'pinyin_write' // 看拼音写汉字
  | 'stroke_order' // 笔顺排序
  | 'word_formation' // 组词
  | 'sentence_completion' // 补充句子
  | 'sentence_writing'; // 写句子

/** 练习题 */
export type ExerciseItem = {
  id: string;
  type: ExerciseType;
  typeName: string;
  instruction: string;
  content: string;
  options?: string[]; // 选择题选项
  answer: string | string[];
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  relatedChar?: string; // 关联生字
};

/** 配套练习 */
export type ExerciseSet = {
  title: string;
  grade: number;
  totalScore: number;
  timeSuggestion: string;
  exercises: ExerciseItem[];
  answerKey: string;
};

/** 生字专项请求 */
export type CharacterRequest = {
  characters: string[]; // 生字列表
  grade: number;
  lessonTitle?: string; // 课文标题
  generateOptions: {
    strokeOrder: boolean; // 生成笔顺图
    gridWriting: boolean; // 生成田字格范写
    similarChars: boolean; // 生成形近字辨析
    polyphonic: boolean; // 生成多音字
    dictation: boolean; // 生成听写清单
    exercises: boolean; // 生成配套练习（含造句）
  };
};

/** 生字专项响应 */
export type CharacterResponse = {
  characters: CharacterInfo[];
  similarGroups: SimilarCharGroup[];
  polyphonicChars: PolyphonicChar[];
  dictationList: DictationItem[];
  ontology: OntologyDerivation[]; // 本体论推导（必要）
  exercises?: ExerciseSet; // 配套练习（含造句）
};

// ==================== 朗读教学 ====================
// 基于王崧舟老师朗读教学思想设计

/**
 * 本体论推导：为什么教朗读
 * - 破解"阴盛阳衰"的阅读教学（默读强、朗读弱）
 * - 朗读是语感培养的根本途径
 * - 让文字有"呼吸"和"温度"
 */

/** 文体朗读基调类型 */
export type ReadingToneType = 
  | '古诗'    // 韵律感强，节奏鲜明
  | '散文'    // 舒缓自然，情真意切
  | '童话'    // 生动活泼，富有童趣
  | '小说'    // 人物鲜明，情节跌宕
  | '说明文'  // 清晰准确，条理分明
  | '议论文'; // 逻辑严密，铿锵有力

/** 文体朗读特征 */
export type ReadingToneFeatures = {
  type: ReadingToneType;
  /** 节奏特征 */
  rhythm: string;
  /** 语调特征 */
  intonation: string;
  /** 停顿特征 */
  pause: string;
  /** 重音特征 */
  stress: string;
  /** 典型示例 */
  example: string;
};

/**
 * 朗读主体三要素（王崧舟公式）
 * 朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧
 */

/** 朗读意愿 - 从"要我读"到"我要读" */
export type ReadingWillingness = {
  /** 文本与自我的连接点 */
  selfConnection: string;
  /** 情感共鸣的触发点 */
  emotionalTrigger: string;
  /** 表达欲望的唤醒话术 */
  awakeningPhrases: string[];
  /** 导入语设计 */
  introductionScript: string;
};

/** 朗读体验 - 从文字到画面 */
export type ReadingExperience = {
  /** 倾听指导：如何听范读 */
  listeningGuide: {
    focusPoints: string[];     // 听什么
    guidance: string;          // 怎么听
    reflection: string;        // 听后思考
  };
  /** 想象还原：把文字变成画面 */
  imaginationRestore: {
    scenes: Array<{
      text: string;           // 原文片段
      scene: string;          // 画面描述
      sensoryDetails: string[]; // 感官细节（视觉、听觉、嗅觉等）
      emotionalAtmosphere: string; // 情感氛围
    }>;
    guidanceScript: string;    // 想象引导语
  };
  /** 情境还原：重建文本的情感世界 */
  situationRestore: {
    background: string;        // 情境背景
    characters: string[];      // 人物/角色
    emotionalJourney: string;  // 情感走向
  };
};

/** 朗读技巧 - 在真实语境中习得 */
export type ReadingSkills = {
  /** 重音技巧 */
  stress: {
    points: Array<{
      text: string;
      type: 'logic' | 'emotion' | 'grammar';
      reason: string;
      method: string;          // 强调方法
    }>;
    teachingScript: string;    // 教学话术
  };
  /** 节奏技巧 */
  rhythm: {
    overall: string;           // 整体节奏
    variations: Array<{
      segment: string;
      rhythm: string;
      reason: string;
    }>;
    teachingScript: string;
  };
  /** 语调技巧 */
  intonation: {
    emotionalTones: Array<{
      emotion: string;
      tone: string;
      example: string;
    }>;
    teachingScript: string;
  };
  /** 停顿技巧 */
  pause: {
    points: Array<{
      position: string;        // 停顿位置（原文片段）
      type: 'short' | 'medium' | 'long';
      reason: string;          // 停顿原因
      effect: string;          // 停顿效果
    }>;
    teachingScript: string;
  };
};

/**
 * 情感朗读模型（吴洁敏研究，王崧舟总结）
 * 五个闭环环节：感悟→想象→求气→创调→反听
 */

/** 情感朗读模型 */
export type EmotionalReadingModel = {
  /** 感悟：理解文本情感 */
  comprehension: {
    /** 情感基调 */
    emotionalTone: string;
    /** 情感线索 */
    emotionalThread: string;
    /** 关键情感词 */
    emotionalKeywords: string[];
    /** 感悟引导语 */
    guidanceScript: string;
  };
  /** 想象：还原画面与情境 */
  imagination: {
    /** 核心画面 */
    coreScenes: string[];
    /** 想象引导语 */
    guidanceScript: string;
  };
  /** 求气：通过再造想象唤起情感，获得肺气流 */
  breathControl: {
    /** 气息类型 */
    breathType: string;
    /** 气息要点 */
    breathPoints: string[];
    /** 练习方法 */
    practiceMethod: string;
    /** 指导语 */
    guidanceScript: string;
  };
  /** 创调：语调、语速、语流 */
  toneCreation: {
    /** 语速建议 */
    speed: string;
    /** 语调走向 */
    intonation: string;
    /** 语流特征 */
    flow: string;
    /** 具体指导 */
    guidanceScript: string;
  };
  /** 反听：监听反思，及时调整 */
  selfMonitoring: {
    /** 反听要点 */
    checkpoints: string[];
    /** 自评标准 */
    selfEvalCriteria: string[];
    /** 改进建议 */
    improvementTips: string[];
    /** 反听指导语 */
    guidanceScript: string;
  };
};

/**
 * 四大教学策略
 */

/** 示范策略：教师范读 */
export type DemonstrationStrategy = {
  /** 范读要点 */
  keyPoints: string[];
  /** 示范前引导语 */
  beforeScript: string;
  /** 示范后讨论语 */
  afterScript: string;
  /** 学生观察要点 */
  observationPoints: string[];
};

/** 备课策略：朗读笔记 */
export type PreparationStrategy = {
  /** 情感走向预设 */
  emotionalArc: string;
  /** 语速变化预设 */
  speedChanges: Array<{
    position: string;
    speed: string;
    reason: string;
  }>;
  /** 重音标记预设 */
  stressMarks: Array<{
    text: string;
    type: string;
    reason: string;
  }>;
  /** 停顿设计 */
  pauseDesign: Array<{
    position: string;
    duration: string;
    reason: string;
  }>;
  /** 朗读笔记模板 */
  noteTemplate: string;
};

/** 文体意识策略 */
export type GenreAwarenessStrategy = {
  /** 文体类型 */
  genre: ReadingToneType;
  /** 该文体朗读特征 */
  features: ReadingToneFeatures;
  /** 典型误读警示 */
  commonMistakes: string[];
  /** 优秀范读特点 */
  excellentExamples: string[];
};

/** 融合策略：朗读融入阅读教学全过程 */
export type IntegrationStrategy = {
  /** 初读环节设计 */
  firstReading: {
    purpose: string;
    method: string;
    guidanceScript: string;
  };
  /** 精读环节设计 */
  intensiveReading: {
    purpose: string;
    method: string;
    guidanceScript: string;
  };
  /** 品读环节设计 */
  appreciativeReading: {
    purpose: string;
    method: string;
    guidanceScript: string;
  };
  /** 熟读环节设计 */
  fluentReading: {
    purpose: string;
    method: string;
    guidanceScript: string;
  };
};

/** 朗读标注（保留原功能，作为技巧教学的一部分） */
export type ReadingAnnotation = {
  text: string;
  pauses: Array<{
    position: number;
    type: 'short' | 'medium' | 'long';
    reason: string;
  }>;
  stresses: Array<{
    start: number;
    end: number;
    text: string;
    type: 'logic' | 'emotion' | 'grammar';
    reason: string;
  }>;
  emotionPoints: Array<{
    position: number;
    emotion: string;
    intensity: 'light' | 'medium' | 'strong';
  }>;
};

/** 范读音频（保留原功能） */
export type ReadingAudio = {
  speed: 'slow' | 'standard' | 'expressive';
  audioUrl: string;
  duration: number;
  annotation: ReadingAnnotation;
};

/** 朗读指导话术（保留并增强） */
export type ReadingGuidance = {
  /** 整体指导 */
  overallGuide: string;
  /** 分段指导 */
  segmentGuides: Array<{
    segment: string;
    guidance: string;
    keyPoints: string[];
  }>;
  /** 齐读组织话术 */
  chorusGuide: {
    preparation: string;
    startSignal: string;
    duringReading: string[];
    ending: string;
  };
  /** 常见问题及应对 */
  commonIssues: Array<{
    issue: string;
    cause: string;
    solution: string;
    exampleCorrection: string;
  }>;
};

/** 朗读教学完整方案 */
export type ReadingTeachingPlan = {
  /** 课文标题 */
  title: string;
  /** 文体类型 */
  genre: ReadingToneType;
  
  /** 本体论推导：为什么教这篇课文朗读 */
  ontology: {
    whyTeach: string;        // 为什么教朗读
    teachingPurpose: string; // 教学目的
    valueOrientation: string; // 价值取向
  };
  
  /** 朗读主体培育 */
  subjectCultivation: {
    willingness: ReadingWillingness;   // 朗读意愿
    experience: ReadingExperience;      // 朗读体验
    skills: ReadingSkills;              // 朗读技巧
  };
  
  /** 情感朗读模型 */
  emotionalModel: EmotionalReadingModel;
  
  /** 四大教学策略 */
  strategies: {
    demonstration: DemonstrationStrategy;    // 示范策略
    preparation: PreparationStrategy;        // 备课策略
    genreAwareness: GenreAwarenessStrategy;  // 文体意识
    integration: IntegrationStrategy;        // 融合策略
  };
  
  /** 范读音频 */
  audios: ReadingAudio[];
  
  /** 朗读标注 */
  annotation: ReadingAnnotation;
  
  /** 课堂指导话术 */
  guidance: ReadingGuidance;
};

/** 朗读教学请求 */
export type ReadingRequest = {
  text: string;
  title: string;
  grade: number;
  genre?: ReadingToneType;  // 可选，不填则自动判断
  generateOptions: {
    willingness: boolean;    // 生成朗读意愿
    experience: boolean;     // 生成朗读体验
    skills: boolean;         // 生成朗读技巧
    emotionalModel: boolean; // 生成情感朗读模型
    strategies: boolean;     // 生成四大策略
    audios: boolean;         // 生成范读音频
  };
};

/** 朗读教学响应 */
export type ReadingResponse = {
  title: string;
  genre: ReadingToneType;
  ontology: {
    whyTeach: string;
    teachingPurpose: string;
    valueOrientation: string;
  };
  subjectCultivation: {
    willingness: ReadingWillingness;
    experience: ReadingExperience;
    skills: ReadingSkills;
  };
  emotionalModel: EmotionalReadingModel;
  strategies: {
    demonstration: DemonstrationStrategy;
    preparation: PreparationStrategy;
    genreAwareness: GenreAwarenessStrategy;
    integration: IntegrationStrategy;
  };
  audios: ReadingAudio[];
  annotation: ReadingAnnotation;
  guidance: ReadingGuidance;
};

// ==================== 习作专项 ====================

/** 习作类型 */
export type WritingType = '写人' | '写事' | '写景' | '状物' | '想象' | '应用文';

/** 习作提纲 */
export type WritingOutline = {
  title: string;
  structure: Array<{
    section: string;
    content: string;
    keyPoints: string[];
    wordCount: string;
  }>;
  transitionPhrases: string[];
};

/** 好词好句 */
export type GoodExpressions = {
  words: Array<{
    word: string;
    meaning: string;
    usage: string;
  }>;
  sentences: Array<{
    sentence: string;
    technique: string;
    imitation: string;
  }>;
  paragraphs: Array<{
    content: string;
    analysis: string;
  }>;
};

/** 分层训练任务 */
export type TieredTask = {
  level: 'basic' | 'intermediate' | 'advanced';
  levelName: string;
  task: string;
  requirements: string[];
  scaffold: string; // 支架提示
  evaluationCriteria: string[];
};

/** 评改指导 */
export type EvaluationGuide = {
  selfCheck: Array<{
    aspect: string;
    questions: string[];
  }>;
  peerReview: {
    items: Array<{
      criterion: string;
      score: number;
      comment: string;
    }>;
    template: string;
  };
  teacherRubric: Array<{
    dimension: string;
    excellent: string;
    good: string;
    improving: string;
  }>;
};

/** 常见问题预设 */
export type WritingIssue = {
  issue: string;
  manifestation: string;
  cause: string;
  preventionStrategy: string;
  correctionGuide: string;
};

/** 习作专项请求 */
export type WritingRequest = {
  unit: string; // 单元主题
  writingType: WritingType;
  grade: number;
  topic?: string; // 具体题目（可选）
  generateOptions: {
    outline: boolean;
    expressions: boolean;
    tieredTasks: boolean;
    evaluationGuide: boolean;
    issues: boolean;
  };
};

/** 习作专项响应 */
export type WritingResponse = {
  topic: string;
  writingType: WritingType;
  outline: WritingOutline;
  expressions: GoodExpressions;
  tieredTasks: TieredTask[];
  evaluationGuide: EvaluationGuide;
  commonIssues: WritingIssue[];
  sampleFramework: string; // 范文框架
};

// ==================== API 统一响应 ====================

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
