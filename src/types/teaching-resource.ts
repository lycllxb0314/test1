/**
 * 教学资源库类型定义
 * 
 * 教师个人教学资源管理，支持保存各学科专项工具生成的教学素材
 * 
 * @module types/teaching-resource
 */

// ==================== 资源类型枚举 ====================

/** 资源大类 */
export type ResourceCategory = 
  | 'chinese_character'   // 语文学科-生字专项
  | 'chinese_reading'     // 语文学科-朗读教学
  | 'chinese_writing'     // 语文学科-习作专项
  | 'chinese_chat'        // 语文学科-备课智能体
  | 'math_concept'        // 数学学科-概念教学
  | 'math_problem'        // 数学学科-问题设计
  | 'other';              // 其他

/** 资源子类型 */
export type ResourceType = 
  // 生字专项
  | 'character_card'      // 生字卡片
  | 'stroke_animation'    // 笔顺动画
  | 'ontology_derivation' // 本体论推导
  | 'dictation_list'      // 听写清单
  | 'exercise_set'        // 配套练习
  // 朗读教学
  | 'reading_audio'       // 范读音频
  | 'reading_annotation'  // 朗读标注
  | 'reading_guidance'    // 朗读指导
  // 习作专项
  | 'writing_outline'     // 写作提纲
  | 'writing_material'    // 写作素材
  | 'writing_task'        // 分层任务
  // 备课智能体
  | 'text_analysis'       // 文本解读
  | 'lesson_design'       // 教学设计
  | 'question_design'     // 问题设计
  // 通用
  | 'full_package'        // 完整资源包
  | 'other';

// ==================== 资源状态 ====================

/** 资源状态 */
export type ResourceStatus = 
  | 'draft'       // 草稿
  | 'published'   // 已发布
  | 'archived';   // 已归档

// ==================== 资源标签 ====================

/** 资源标签 */
export interface ResourceTag {
  id: string;
  name: string;
  color?: string;
}

// ==================== 核心资源实体 ====================

/** 教学资源（主表） */
export interface TeachingResource {
  id: string;
  
  // 归属信息
  teacherId: string;              // 所属教师ID
  teacherName?: string;           // 教师姓名（冗余字段）
  
  // 分类信息
  category: ResourceCategory;     // 资源大类
  type: ResourceType;             // 资源子类型
  subject?: string;               // 学科
  grade?: number;                 // 适用年级
  
  // 基本信息
  title: string;                  // 资源标题
  description?: string;           // 资源描述
  
  // 内容数据（JSON格式存储具体内容）
  content: Record<string, unknown>;  // 资源内容
  
  // 标签
  tags?: string[];                // 标签ID列表
  
  // 统计信息
  viewCount?: number;             // 查看次数
  useCount?: number;              // 使用次数
  
  // 状态
  status: ResourceStatus;
  
  // 关联信息
  lessonTitle?: string;           // 关联课文标题
  sourceId?: string;              // 来源ID（如生成时的会话ID）
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// ==================== 生字专项资源内容 ====================

/** 生字专项资源内容结构 */
export interface CharacterResourceContent {
  /** 生字列表 */
  characters: Array<{
    char: string;
    pinyin: string;
    radical: string;
    structure: string;
    strokeCount: number;
    strokeOrder: string[];
    strokeGuide: Array<{
      name: string;
      position: string;
      tip: string;
    }>;
    words: string[];
  }>;
  
  /** 本体论推导 */
  ontology?: Array<{
    char: string;
    recognition: {
      formAnalysis: string;
      phoneticClue: string;
      writingGuide: string;
    };
    understanding: {
      meaning: string;
      meaningEvolution: string;
      semanticField: string[];
      collocation: string[];
    };
    application: {
      basicWords: string[];
      advancedWords: string[];
      sentences: Array<{
        sentence: string;
        type: string;
        analysis?: string;
      }>;
    };
    extension: {
      relatedCharacters: string[];
      culturalContext: string;
      readingSuggestion: string;
    };
  }>;
  
  /** 听写清单 */
  dictationList?: Array<{
    char: string;
    pinyin: string;
    words: string[];
    difficulty: string;
  }>;
  
  /** 配套练习 */
  exercises?: {
    title: string;
    grade: number;
    totalScore: number;
    timeSuggestion: string;
    exercises: Array<{
      id: string;
      type: string;
      typeName: string;
      instruction: string;
      content: string;
      options?: string[];
      answer: string | string[];
      difficulty: string;
      explanation?: string;
      relatedChar?: string;
    }>;
    answerKey: string;
  };
  
  /** 生成参数 */
  generateParams?: {
    characters: string[];
    grade: number;
    generateOptions: Record<string, boolean>;
  };
}

// ==================== DTO 类型 ====================

/** 创建资源请求 */
export interface CreateResourceRequest {
  category: ResourceCategory;
  type: ResourceType;
  subject?: string;
  grade?: number;
  title: string;
  description?: string;
  content: Record<string, unknown>;
  tags?: string[];
  lessonTitle?: string;
  sourceId?: string;
}

/** 更新资源请求 */
export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  content?: Record<string, unknown>;
  tags?: string[];
  status?: ResourceStatus;
}

/** 资源查询参数 */
export interface ResourceQueryParams {
  teacherId?: string;
  category?: ResourceCategory | 'all';
  type?: ResourceType | 'all';
  subject?: string;
  grade?: number;
  status?: ResourceStatus | 'all';
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'useCount';
  sortOrder?: 'asc' | 'desc';
}

/** 资源列表项（简化版） */
export interface ResourceListItem {
  id: string;
  category: ResourceCategory;
  type: ResourceType;
  title: string;
  description?: string;
  grade?: number;
  status: ResourceStatus;
  viewCount: number;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 资源统计 */
export interface ResourceStatistics {
  total: number;
  byCategory: Record<ResourceCategory, number>;
  byGrade: Record<number, number>;
  recentCount: number;        // 最近7天新增
  mostUsed: ResourceListItem[];  // 使用最多
}
