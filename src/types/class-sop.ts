/**
 * 班级 SOP 智能台账类型定义
 * 
 * 核心概念：
 * 1. SOP 模板 - 标准化操作流程模板
 * 2. 执行记录 - 一次具体的 SOP 执行过程，留痕的核心
 * 3. 台账条目 - 结构化的工作记录，支持查询、统计、导出
 * 
 * 设计理念：
 * - 标准化缺失 → SOP模板库 → "怎么做有章可循"
 * - 留痕缺失 → 执行记录+证据附件 → "做了什么有据可查"
 * - 责任边界模糊 → 时间线+责任人+签字 → "谁来负责一目了然"
 * 
 * @module types/class-sop
 */

// ==================== 枚举类型 ====================

/** SOP 模板类别 */
export type SOPCategory = 
  | 'hygiene'         // 卫生检查
  | 'safety'          // 安全排查
  | 'conflict'        // 矛盾处理
  | 'communication'   // 家校沟通
  | 'discipline'      // 违纪处理
  | 'attendance'      // 考勤管理
  | 'activity'        // 活动组织
  | 'emergency';      // 应急处置

/** 执行状态 */
export type ExecutionStatus = 
  | 'in_progress'     // 进行中
  | 'completed'       // 已完成
  | 'timeout'         // 超时未完成
  | 'aborted';        // 已中止

/** 台账条目类型 */
export type LedgerType = 
  | 'routine'         // 日常工作
  | 'incident'        // 突发事件
  | 'safety'          // 安全事项
  | 'communication'   // 家校沟通
  | 'discipline';     // 违纪处理

/** 台账条目状态 */
export type LedgerStatus = 
  | 'open'            // 待处理
  | 'investigating'   // 调查中
  | 'resolved'        // 已解决
  | 'closed';         // 已关闭

/** 严重程度 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/** 证据类型 */
export type EvidenceType = 'photo' | 'signature' | 'text' | 'video' | 'audio' | 'document';

/** 步骤执行状态 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// ==================== 标签映射 ====================

/** SOP 类别标签 */
export const SOP_CATEGORY_LABELS: Record<SOPCategory, string> = {
  hygiene: '卫生检查',
  safety: '安全排查',
  conflict: '矛盾处理',
  communication: '家校沟通',
  discipline: '违纪处理',
  attendance: '考勤管理',
  activity: '活动组织',
  emergency: '应急处置',
};

/** SOP 类别图标 */
export const SOP_CATEGORY_ICONS: Record<SOPCategory, string> = {
  hygiene: 'sparkles',
  safety: 'shield',
  conflict: 'users',
  communication: 'message-circle',
  discipline: 'alert-triangle',
  attendance: 'clipboard-check',
  activity: 'calendar',
  emergency: 'siren',
};

/** 执行状态标签 */
export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  timeout: '超时',
  aborted: '已中止',
};

/** 执行状态颜色 */
export const EXECUTION_STATUS_COLORS: Record<ExecutionStatus, string> = {
  in_progress: 'blue',
  completed: 'green',
  timeout: 'orange',
  aborted: 'gray',
};

/** 台账类型标签 */
export const LEDGER_TYPE_LABELS: Record<LedgerType, string> = {
  routine: '日常工作',
  incident: '突发事件',
  safety: '安全事项',
  communication: '家校沟通',
  discipline: '违纪处理',
};

/** 台账状态标签 */
export const LEDGER_STATUS_LABELS: Record<LedgerStatus, string> = {
  open: '待处理',
  investigating: '调查中',
  resolved: '已解决',
  closed: '已关闭',
};

/** 严重程度标签 */
export const SEVERITY_LABELS: Record<Severity, string> = {
  low: '轻微',
  medium: '一般',
  high: '严重',
  critical: '紧急',
};

/** 严重程度颜色 */
export const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

// ==================== SOP 模板 ====================

/** SOP 步骤 */
export type SOPStep = {
  /** 步骤序号 */
  order: number;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** 是否必填 */
  isRequired: boolean;
  /** 预估时间（分钟） */
  estimatedMinutes?: number;
  /** 证据类型 */
  evidenceType?: EvidenceType;
  /** 检查要点 */
  checkpoints?: string[];
};

/** SOP 模板 - 数据库行 */
export type SOPTemplateRow = {
  id: string;
  name: string;
  category: SOPCategory;
  description: string;
  steps: SOPStep[];
  applicable_roles: string[];
  evidence_required: boolean;
  timeout_minutes: number | null;
  is_system: boolean;
  creator_id: string | null;
  school_id: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

/** SOP 模板 - 业务模型 */
export type SOPTemplate = {
  id: string;
  name: string;
  category: SOPCategory;
  description: string;
  steps: SOPStep[];
  applicableRoles: string[];
  evidenceRequired: boolean;
  timeoutMinutes?: number;
  isSystem: boolean;
  creatorId?: string;
  schoolId?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

// ==================== 执行记录 ====================

/** 附件 */
export type Attachment = {
  id: string;
  type: EvidenceType;
  url: string;
  name: string;
  size?: number;
  uploadedAt: string;
};

/** 签名记录 */
export type Signature = {
  id: string;
  signerId: string;
  signerName: string;
  signerRole: string;
  signedAt: string;
  signatureUrl?: string;
};

/** 步骤执行记录 */
export type StepExecution = {
  stepOrder: number;
  stepTitle: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  content?: string;
  attachments: Attachment[];
  operatorId?: string;
  operatorName?: string;
};

/** 执行记录 - 数据库行 */
export type SOPExecutionRow = {
  id: string;
  template_id: string;
  template_name: string;
  category: SOPCategory;
  executor_id: string;
  executor_name: string;
  class_id: string;
  class_name: string;
  started_at: string;
  completed_at: string | null;
  status: ExecutionStatus;
  steps: StepExecution[];
  summary: string | null;
  attachments: Attachment[];
  signatures: Signature[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** 执行记录 - 业务模型 */
export type SOPExecution = {
  id: string;
  templateId: string;
  templateName: string;
  category: SOPCategory;
  executorId: string;
  executorName: string;
  classId: string;
  className: string;
  startedAt: string;
  completedAt?: string;
  status: ExecutionStatus;
  steps: StepExecution[];
  summary?: string;
  attachments: Attachment[];
  signatures: Signature[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

// ==================== 台账条目 ====================

/** 涉及人员 */
export type InvolvedPerson = {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'parent' | 'other';
  className?: string;
};

/** 台账条目 - 数据库行 */
export type LedgerEntryRow = {
  id: string;
  type: LedgerType;
  title: string;
  description: string;
  class_id: string;
  class_name: string;
  involved_persons: InvolvedPerson[];
  execution_id: string | null;
  occurred_at: string;
  resolved_at: string | null;
  status: LedgerStatus;
  severity: Severity;
  handler_id: string;
  handler_name: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** 台账条目 - 业务模型 */
export type LedgerEntry = {
  id: string;
  type: LedgerType;
  title: string;
  description: string;
  classId: string;
  className: string;
  involvedPersons: InvolvedPerson[];
  executionId?: string;
  occurredAt: string;
  resolvedAt?: string;
  status: LedgerStatus;
  severity: Severity;
  handlerId: string;
  handlerName: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

// ==================== 查询参数 ====================

/** SOP 模板查询参数 */
export type SOPTemplateQueryParams = {
  category?: SOPCategory;
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
};

/** 执行记录查询参数 */
export type ExecutionQueryParams = {
  templateId?: string;
  classId?: string;
  executorId?: string;
  category?: SOPCategory;
  status?: ExecutionStatus;
  startDate?: string;
  endDate?: string;
};

/** 台账查询参数 */
export type LedgerQueryParams = {
  type?: LedgerType;
  classId?: string;
  status?: LedgerStatus;
  severity?: Severity;
  handlerId?: string;
  startDate?: string;
  endDate?: string;
  followUpRequired?: boolean;
  search?: string;
};

// ==================== 创建/更新参数 ====================

/** 创建 SOP 模板参数 */
export type CreateSOPTemplateParams = {
  name: string;
  category: SOPCategory;
  description: string;
  steps: SOPStep[];
  applicableRoles?: string[];
  evidenceRequired?: boolean;
  timeoutMinutes?: number;
};

/** 更新 SOP 模板参数 */
export type UpdateSOPTemplateParams = Partial<CreateSOPTemplateParams> & {
  isActive?: boolean;
};

/** 创建执行记录参数 */
export type CreateExecutionParams = {
  templateId: string;
  classId: string;
};

/** 更新步骤执行参数 */
export type UpdateStepExecutionParams = {
  executionId: string;
  stepOrder: number;
  status: StepStatus;
  content?: string;
  attachments?: Attachment[];
};

/** 完成执行参数 */
export type CompleteExecutionParams = {
  executionId: string;
  summary: string;
  signatures?: Signature[];
};

/** 创建台账条目参数 */
export type CreateLedgerEntryParams = {
  type: LedgerType;
  title: string;
  description: string;
  classId: string;
  involvedPersons?: InvolvedPerson[];
  executionId?: string;
  occurredAt?: string;
  severity?: Severity;
  handlerId: string;
  handlerName: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  tags?: string[];
};

/** 更新台账条目参数 */
export type UpdateLedgerEntryParams = Partial<Omit<CreateLedgerEntryParams, 'classId' | 'handlerId'>> & {
  status?: LedgerStatus;
  resolvedAt?: string;
  followUpNotes?: string;
};

// ==================== 统计类型 ====================

/** 台账统计 */
export type LedgerStatistics = {
  total: number;
  byType: Record<LedgerType, number>;
  byStatus: Record<LedgerStatus, number>;
  bySeverity: Record<Severity, number>;
  followUpPending: number;
  resolvedThisMonth: number;
  avgResolutionTime?: number; // 平均处理时长（小时）
};

/** SOP 使用统计 */
export type SOPUsageStatistics = {
  templateId: string;
  templateName: string;
  category: SOPCategory;
  executionCount: number;
  completedCount: number;
  avgCompletionTime?: number; // 平均完成时间（分钟）
};
