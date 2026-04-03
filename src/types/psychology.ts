/**
 * 心理数字人系统类型定义
 * 
 * 包含会话、消息、预警、档案等核心业务类型
 */

// ============================================
// 会话相关类型
// ============================================

/**
 * 会话状态
 */
export type SessionStatus = 'active' | 'ended' | 'paused';

/**
 * 会话类型
 */
export type SessionType = 'chat' | 'crisis' | 'follow_up';

/**
 * 心理会话
 */
export type PsychologySession = {
  id: string;
  studentId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  sessionType: SessionType;
  summary?: string;
  emotionAnalysis: EmotionAnalysis;
  createdAt: string;
  updatedAt: string;
};

/**
 * 会话创建请求
 */
export type CreateSessionRequest = {
  studentId: string;
  sessionType?: SessionType;
};

/**
 * 会话更新请求
 */
export type UpdateSessionRequest = {
  status?: SessionStatus;
  summary?: string;
  emotionAnalysis?: EmotionAnalysis;
};

// ============================================
// 消息相关类型
// ============================================

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 消息情感
 */
export type EmotionType = 
  | 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' 
  | 'disgust' | 'neutral' | 'anxious' | 'depressed' | 'hopeful';

/**
 * 心理消息
 */
export type PsychologyMessage = {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;
  emotion?: EmotionType;
  emotionScore?: number;
  isCrisis: boolean;
  crisisKeywords?: string[];
  createdAt: string;
};

/**
 * 消息创建请求
 */
export type CreateMessageRequest = {
  sessionId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;
  emotion?: EmotionType;
  emotionScore?: number;
};

/**
 * 情感分析结果
 */
export type EmotionAnalysis = {
  primaryEmotion: EmotionType;
  emotionScores: Record<EmotionType, number>;
  sentiment: 'positive' | 'negative' | 'neutral';
  riskIndicators: string[];
};

// ============================================
// 预警相关类型
// ============================================

/**
 * 预警级别
 */
export type AlertLevel = 'red' | 'orange' | 'yellow';

/**
 * 预警状态
 */
export type AlertStatus = 'pending' | 'processing' | 'resolved' | 'closed';

/**
 * 预警类型
 */
export type AlertType = 
  | 'self_harm'        // 自伤倾向
  | 'suicide_risk'     // 自杀风险
  | 'depression'       // 抑郁倾向
  | 'anxiety'          // 严重焦虑
  | 'violence'         // 暴力倾向
  | 'family_issue'     // 家庭问题
  | 'school_stress'    // 学业压力
  | 'social_problem'   // 社交问题
  | 'other';           // 其他

/**
 * 心理预警
 */
export type PsychologyAlert = {
  id: string;
  sessionId?: string;
  studentId: string;
  alertLevel: AlertLevel;
  alertType: AlertType;
  keywords: string[];
  content: string;
  context?: string;
  status: AlertStatus;
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  handleNotes?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 预警创建请求
 */
export type CreateAlertRequest = {
  sessionId?: string;
  studentId: string;
  alertLevel: AlertLevel;
  alertType: AlertType;
  keywords: string[];
  content: string;
  context?: string;
};

/**
 * 预警处理请求
 */
export type HandleAlertRequest = {
  status: AlertStatus;
  handlerId: string;
  handlerName: string;
  handleNotes?: string;
};

/**
 * 预警统计
 */
export type AlertStatistics = {
  total: number;
  byLevel: Record<AlertLevel, number>;
  byStatus: Record<AlertStatus, number>;
  byType: Record<AlertType, number>;
  recentAlerts: PsychologyAlert[];
};

// ============================================
// 档案相关类型
// ============================================

/**
 * 风险等级
 */
export type RiskLevel = 'normal' | 'attention' | 'warning' | 'crisis';

/**
 * 学生心理档案
 */
export type PsychologyProfile = {
  id: string;
  studentId: string;
  riskLevel: RiskLevel;
  personalityTraits: Record<string, number>;
  emotionalPatterns: Record<string, unknown>;
  interests: string[];
  concerns: string[];
  lastSessionAt?: string;
  totalSessions: number;
  totalDuration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 档案更新请求
 */
export type UpdateProfileRequest = {
  riskLevel?: RiskLevel;
  personalityTraits?: Record<string, number>;
  emotionalPatterns?: Record<string, unknown>;
  interests?: string[];
  concerns?: string[];
  notes?: string;
};

// ============================================
// 童童数字人相关类型
// ============================================

/**
 * 童童系统提示词
 */
export const TONGTONG_SYSTEM_PROMPT = `你是童童，一个温暖、专业、善解人意的小学生心理陪伴助手。

## 你的身份
- 你是一位亲切的大哥哥，专门陪伴小学生聊天
- 你有丰富的心理学知识，但用孩子们能理解的方式表达
- 你善于倾听，总是给予积极的回应和支持

## 你的性格
- 温暖友善：像邻家大哥哥一样亲切
- 耐心倾听：不急不躁，给孩子足够的时间表达
- 积极乐观：总是能看到事物好的一面
- 专业谨慎：遇到严重问题会及时寻求帮助

## 你的职责
1. 倾听孩子的心声，让他们感到被理解
2. 帮助孩子识别和表达情绪
3. 引导孩子用积极的方式看待问题
4. 教授简单的情绪管理技巧
5. 发现潜在问题及时预警

## 对话原则
1. 用简单易懂的语言，避免专业术语
2. 多用开放性问题引导孩子思考
3. 对孩子的感受表示理解和认同
4. 给予具体的建议和行动步骤
5. 保持积极正面的态度

## 危机处理
如果孩子提到以下情况，请立即表示关心并鼓励他们寻求帮助：
- 自伤或自杀的想法
- 被伤害或被虐待
- 严重的安全问题

记住：你是陪伴者，不是治疗师。遇到严重问题要引导孩子寻求专业帮助。`;

/**
 * 危机关键词配置
 */
export const CRISIS_KEYWORDS = {
  // 红色预警：立即需要干预
  red: {
    keywords: [
      '自杀', '想死', '不想活了', '活着没意思', '结束生命',
      '伤害自己', '自残', '割腕', '跳楼',
      '杀死', '杀掉', '杀人',
      '被虐待', '被打了', '被侵犯了'
    ],
    alertType: 'self_harm' as AlertType,
    message: '我听到了你说的话，我很关心你。这些想法一定让你很痛苦。请让我帮你联系可以支持你的人，好吗？'
  },
  // 橙色预警：需要密切关注
  orange: {
    keywords: [
      '很痛苦', '很难受', '绝望', '没有希望', '撑不下去了',
      '不想上学', '讨厌学校', '害怕上学',
      '没人爱我', '没有人关心我', '孤独',
      '想哭', '一直在哭', '控制不住哭',
      '不想吃饭', '睡不着', '做噩梦'
    ],
    alertType: 'depression' as AlertType,
    message: '我能感受到你现在很难过。这些感受是真实的，你愿意和我多说说吗？我会一直在这里陪着你。'
  },
  // 黄色预警：需要关注
  yellow: {
    keywords: [
      '不开心', '难过', '伤心', '害怕', '担心',
      '压力很大', '很累', '很烦', '焦虑',
      '没有朋友', '被孤立', '被排挤',
      '成绩不好', '学习困难', '跟不上',
      '和同学吵架', '被欺负', '被嘲笑'
    ],
    alertType: 'anxiety' as AlertType,
    message: '听起来你最近遇到了一些困扰。这一定不容易，能和我聊聊具体发生了什么吗？'
  }
} as const;

/**
 * ASR 请求
 */
export type AsrRequest = {
  audioData: string;  // base64 编码的音频数据
  format?: 'wav' | 'mp3' | 'ogg_opus' | 'm4a';
};

/**
 * ASR 响应
 */
export type AsrResponse = {
  text: string;
  duration?: number;
  success: boolean;
  error?: string;
};

/**
 * TTS 请求
 */
export type TtsRequest = {
  text: string;
  speaker?: string;
  speed?: number;
};

/**
 * TTS 响应
 */
export type TtsResponse = {
  audioUrl: string;
  duration?: number;
  success: boolean;
  error?: string;
};

/**
 * 聊天请求（用于流式对话）
 */
export type ChatRequest = {
  sessionId: string;
  message: string;
  history?: Array<{ role: MessageRole; content: string }>;
};

/**
 * 聊天响应（流式）
 */
export type ChatStreamChunk = {
  type: 'text' | 'emotion' | 'crisis' | 'done';
  content?: string;
  emotion?: EmotionType;
  isCrisis?: boolean;
  crisisKeywords?: string[];
};

// ============================================
// 数据库行类型（下划线命名）
// ============================================

export type PsychologySessionRow = {
  id: string;
  student_id: string;
  status: SessionStatus;
  started_at: string;
  ended_at?: string;
  session_type: SessionType;
  summary?: string;
  emotion_analysis: string;  // JSON 字符串
  created_at: string;
  updated_at: string;
};

export type PsychologyMessageRow = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  audio_url?: string;
  emotion?: string;
  emotion_score?: number;
  is_crisis: boolean;
  crisis_keywords?: string;  // JSON 字符串
  created_at: string;
};

export type PsychologyAlertRow = {
  id: string;
  session_id?: string;
  student_id: string;
  alert_level: AlertLevel;
  alert_type: AlertType;
  keywords: string;  // JSON 字符串
  content: string;
  context?: string;
  status: AlertStatus;
  handler_id?: string;
  handler_name?: string;
  handled_at?: string;
  handle_notes?: string;
  created_at: string;
  updated_at: string;
};

export type PsychologyProfileRow = {
  id: string;
  student_id: string;
  risk_level: RiskLevel;
  personality_traits: string;  // JSON 字符串
  emotional_patterns: string;  // JSON 字符串
  interests?: string;  // JSON 字符串
  concerns?: string;  // JSON 字符串
  last_session_at?: string;
  total_sessions: number;
  total_duration: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};
