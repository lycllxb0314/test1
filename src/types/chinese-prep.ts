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
  /** 组词 */
  words: string[];
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

/** 听写清单项 */
export type DictationItem = {
  char: string;
  pinyin: string;
  words: string[];
  difficulty: 'easy' | 'medium' | 'hard';
};

/** 生字专项请求 */
export type CharacterRequest = {
  characters: string[]; // 生字列表
  grade: number;
  generateOptions: {
    strokeOrder: boolean; // 生成笔顺图
    gridWriting: boolean; // 生成田字格范写
    similarChars: boolean; // 生成形近字辨析
    polyphonic: boolean; // 生成多音字
    dictation: boolean; // 生成听写清单
  };
};

/** 生字专项响应 */
export type CharacterResponse = {
  characters: CharacterInfo[];
  similarGroups: SimilarCharGroup[];
  polyphonicChars: PolyphonicChar[];
  dictationList: DictationItem[];
};

// ==================== 朗读教学 ====================

/** 朗读速度类型 */
export type ReadingSpeed = 'slow' | 'standard' | 'expressive';

/** 停顿标注 */
export type PauseMark = {
  position: number; // 字符位置
  type: 'short' | 'medium' | 'long'; // 停顿类型
  reason: string; // 停顿原因
};

/** 重音标注 */
export type StressMark = {
  start: number;
  end: number;
  text: string;
  type: 'logic' | 'emotion' | 'grammar'; // 逻辑重音、情感重音、语法重音
  reason: string;
};

/** 朗读标注 */
export type ReadingAnnotation = {
  text: string;
  pauses: PauseMark[];
  stresses: StressMark[];
  emotionPoints: Array<{
    position: number;
    emotion: string;
    intensity: 'light' | 'medium' | 'strong';
  }>;
};

/** 范读音频 */
export type ReadingAudio = {
  speed: ReadingSpeed;
  audioUrl: string;
  duration: number;
  annotation: ReadingAnnotation;
};

/** 朗读指导话术 */
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
    preparation: string; // 准备话术
    startSignal: string; // 起始信号
    duringReading: string[]; // 过程中提示
    ending: string; // 结束话术
  };
  /** 常见问题及应对 */
  commonIssues: Array<{
    issue: string;
    cause: string;
    solution: string;
    exampleCorrection: string;
  }>;
};

/** 朗读教学请求 */
export type ReadingRequest = {
  text: string; // 课文内容
  title: string; // 课文标题
  grade: number;
  generateOptions: {
    slowReading: boolean;
    standardReading: boolean;
    expressiveReading: boolean;
    annotation: boolean;
    guidance: boolean;
  };
};

/** 朗读教学响应 */
export type ReadingResponse = {
  title: string;
  audios: ReadingAudio[];
  fullAnnotation: ReadingAnnotation;
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
