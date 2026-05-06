// ==================== 学生心理健康系统类型定义 ====================

// ─── 授权密钥 ──────────────────────────────────────────────────

export type AuthKeyScope = 'class' | 'student' | 'all';

export type AuthorizationKey = {
  id: string;
  keyCode: string;
  createdBy: string;
  createdByName: string;
  description: string | null;
  scope: AuthKeyScope;
  targetClassId: string | null;
  targetStudentId: string | null;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
};

export type CreateAuthKeyRequest = {
  description?: string;
  scope: AuthKeyScope;
  targetClassId?: string;
  targetStudentId?: string;
  maxUses?: number;
  validHours?: number; // 有效时长（小时）
};

export type VerifyAuthKeyRequest = {
  keyCode: string;
  classId?: string;
  studentId?: string;
};

// ─── 聊天会话 ──────────────────────────────────────────────────

export type EmotionLevel = 'green' | 'yellow' | 'red';

export type ChatSession = {
  id: string;
  studentId: string;
  anonymousId: string;
  title: string | null;
  emotionLevel: EmotionLevel;
  emotionSummary: string | null;
  turnCount: number;
  isClosed: boolean;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // 前端展示用（关联查询填充）
  studentName?: string;
  className?: string;
};

export type MentalChatMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  desensitizedContent: string | null;
  sensitivityFlag: SensitivityFlag | null;
  sensitivityTags: string[] | null;
  createdAt: string;
};

export type SensitivityFlag = 'safe' | 'sensitive' | 'critical';

// ─── 预警 ──────────────────────────────────────────────────────

export type WarningType = 'red_line' | 'sensitive' | 'trend';

export type WarningSeverity = 'yellow' | 'red';

export type MentalHealthWarning = {
  id: string;
  studentId: string;
  sessionId: string | null;
  warningType: WarningType;
  severity: WarningSeverity;
  title: string;
  description: string | null;
  keywords: string[] | null;
  isRead: boolean;
  readBy: string | null;
  readAt: string | null;
  isHandled: boolean;
  handledBy: string | null;
  handledAt: string | null;
  handleNote: string | null;
  createdAt: string;
  // 关联数据
  studentName?: string;
  className?: string;
};

export type HandleWarningRequest = {
  handleNote: string;
};

// ─── 统计概览 ──────────────────────────────────────────────────

export type MentalHealthStats = {
  totalSessions: number;
  activeSessions: number;
  totalWarnings: number;
  unreadWarnings: number;
  redWarnings: number;
  yellowWarnings: number;
  todaySessions: number;
};

// ─── 聊天请求 ──────────────────────────────────────────────────

export type ChatRequest = {
  sessionId?: string; // 不传则创建新会话
  message: string;
};

export type ChatStreamChunk = {
  type: 'content' | 'session' | 'emotion' | 'warning' | 'done';
  data: string | ChatSession | EmotionLevel | MentalHealthWarning | null;
};

// ─── 班主任学生列表项 ───────────────────────────────────────────

export type StudentMentalHealthSummary = {
  studentId: string;
  studentName: string;
  studentNo: string;
  latestEmotion: string;
  totalSessions: number;
  totalWarnings: number;
  redWarnings: number;
  yellowWarnings: number;
  unreadWarnings: number;
  lastChatTime: string | null;
};
