// 家校沟通助手类型定义

// 情绪等级
export type EmotionLevel = 'positive' | 'neutral' | 'concern' | 'alert';

// 沟通场景类型
export type ContextType = 
  | 'general'           // 日常沟通
  | 'learning'          // 学习情况
  | 'behavior'          // 行为表现
  | 'attendance'        // 出勤请假
  | 'health'            // 健康安全
  | 'activity'          // 活动通知
  | 'grade'             // 成绩反馈
  | 'discipline';       // 违纪处理

// 会话
export type HomeSchoolConversation = {
  id: string;
  teacherId: string;
  classId: string | null;
  title: string | null;
  studentId: string | null;
  studentName: string | null;
  contextType: ContextType;
  emotionLevel: EmotionLevel;
  teacherDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

// 消息
export type HomeSchoolMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  teacherDeleted: boolean;
  createdAt: string;
};

// 会话详情（含消息）
export type ConversationWithMessages = HomeSchoolConversation & {
  messages: HomeSchoolMessage[];
};

// 创建会话参数
export type CreateConversationParams = {
  teacherId: string;
  classId?: string;
  studentId?: string;
  studentName?: string;
  contextType?: ContextType;
};

// 发送消息参数
export type SendMessageParams = {
  conversationId?: string;
  teacherId: string;
  message: string;
  classId?: string;
  studentId?: string;
  studentName?: string;
  contextType?: ContextType;
};

// 预警触发类型
export type WarningTriggerType = 'legal_safety' | 'psychological';

// 预警风险等级
export type WarningRiskLevel = 'high' | 'medium';

// 别名导出（兼容 Repository）
export type RiskLevel = WarningRiskLevel;
export type TriggerType = WarningTriggerType;

// 家校沟通预警（脱敏结构化数据）
export type HomeSchoolWarning = {
  id: string;
  conversationId: string;
  teacherId: string;
  teacherName: string | null;
  classId: string | null;
  className: string | null;
  studentId: string | null;
  studentName: string | null;
  riskLevel: WarningRiskLevel;
  triggerType: WarningTriggerType;
  triggerSummary: string;
  recommendation: string | null;
  isHandled: boolean;
  handlerId: string | null;
  handlerName: string | null;
  handleNote: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// SSE 流事件
export type HomeSchoolStreamEvent = 
  | { type: 'session'; data: { sessionId: string } }
  | { type: 'content'; data: string }
  | { type: 'emotion'; data: { level: EmotionLevel; suggestion?: string } }
  | { type: 'warning'; data: { riskLevel: WarningRiskLevel; triggerType: WarningTriggerType; summary: string; sunshineMessage: string } }
  | { type: 'done'; data: { conversationId: string } };
