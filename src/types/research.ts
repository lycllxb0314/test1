/**
 * 教研模块统一类型定义
 * 
 * 包含：教研主题、教研活动、教研资源、教研成果、专项教研等所有类型
 */

// ==================== 枚举类型 ====================

/** 教研主题类型 */
export type ThemeType = 'big_unit' | 'project' | 'practice' | 'ai_enabled' | 'custom';

/** 教研主题级别 */
export type ThemeLevel = 'school' | 'grade' | 'subject_group';

/** 教研主题状态 */
export type ThemeStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'archived';

/** 教研活动类型 */
export type ActivityType = 'seminar' | 'lesson_observation' | 'collective_prep' | 'training' | 'workshop' | 'salon';

/** 教研活动状态 */
export type ActivityStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/** 教研阶段状态 */
export type StageStatus = 'pending' | 'in_progress' | 'completed';

/** 资源类型 */
export type ResourceType = 'template' | 'lesson_case' | 'tool' | 'guide' | 'video' | 'document';

/** 成果类型 */
export type AchievementType = 'lesson_plan' | 'lesson_case' | 'paper' | 'student_work' | 'report' | 'video';

/** 成果状态 */
export type AchievementStatus = 'draft' | 'pending' | 'published';

/** 参与者角色 */
export type ParticipantRole = 'host' | 'speaker' | 'recorder' | 'participant';

/** AI工具类型 */
export type AIToolType = 'lesson_prep' | 'teaching' | 'grading' | 'analysis' | 'content_gen';

/** 学科实践活动类型 */
export type PracticeActivityType = 'oral' | 'experiment' | 'measurement' | 'skill_training' | 'handicraft';

// ==================== 标签映射 ====================

/** 主题类型标签 */
export const THEME_TYPE_LABELS: Record<ThemeType, string> = {
  big_unit: '大单元教学',
  project: '项目式教学',
  practice: '学科实践',
  ai_enabled: 'AI赋能教学',
  custom: '自定义主题',
};

/** 主题级别标签 */
export const THEME_LEVEL_LABELS: Record<ThemeLevel, string> = {
  school: '校级重点教研',
  grade: '年级组教研',
  subject_group: '备课组微教研',
};

/** 主题状态标签 */
export const THEME_STATUS_LABELS: Record<ThemeStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  approved: '已通过',
  in_progress: '进行中',
  completed: '已完成',
  archived: '已归档',
};

/** 活动类型标签 */
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  seminar: '研讨会',
  lesson_observation: '听课评课',
  collective_prep: '集体备课',
  training: '培训学习',
  workshop: '工作坊',
  salon: '教学沙龙',
};

/** 活动状态标签 */
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  scheduled: '已安排',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

/** 资源类型标签 */
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  template: '模板',
  lesson_case: '课例',
  tool: '工具',
  guide: '指南',
  video: '视频',
  document: '文档',
};

/** 成果类型标签 */
export const ACHIEVEMENT_TYPE_LABELS: Record<AchievementType, string> = {
  lesson_plan: '教案',
  lesson_case: '课例',
  paper: '论文',
  student_work: '学生作品',
  report: '报告',
  video: '视频',
};

/** 参与者角色标签 */
export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  host: '主持人',
  speaker: '主讲人',
  recorder: '记录人',
  participant: '参与者',
};

/** AI工具类型标签 */
export const AI_TOOL_TYPE_LABELS: Record<AIToolType, string> = {
  lesson_prep: '备课辅助',
  teaching: '课堂教学',
  grading: '作业批改',
  analysis: '学情分析',
  content_gen: '内容生成',
};

/** 学科实践活动类型标签 */
export const PRACTICE_ACTIVITY_TYPE_LABELS: Record<PracticeActivityType, string> = {
  oral: '口语表达',
  experiment: '实验操作',
  measurement: '测量活动',
  skill_training: '技能训练',
  handicraft: '手工制作',
};

// ==================== 接口定义 ====================

/** 教研主题 */
export interface ResearchTheme {
  id: string;
  title: string;
  type: ThemeType;
  typeLabel: string;
  subject: string;
  level: ThemeLevel;
  levelLabel: string;
  description?: string;
  objectives?: string[];
  keyPoints?: string[];
  startDate?: string;
  endDate?: string;
  status: ThemeStatus;
  statusLabel: string;
  creatorId: string;
  creatorName: string;
  participantIds?: string[];
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 教研阶段 */
export interface ResearchStage {
  id: string;
  themeId: string;
  name: string;
  description?: string;
  orderNum: number;
  startDate?: string;
  endDate?: string;
  status: StageStatus;
  tasks?: StageTask[];
  responsibleIds?: string[];
  createdAt: string;
  updatedAt: string;
}

/** 阶段任务 */
export interface StageTask {
  id: string;
  title: string;
  description?: string;
  assigneeIds?: string[];
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

/** 教研活动 */
export interface ResearchActivity {
  id: string;
  themeId: string;
  stageId?: string;
  title: string;
  type: ActivityType;
  typeLabel: string;
  description?: string;
  location?: string;
  scheduledAt?: string;
  duration?: number;
  hostId?: string;
  hostName?: string;
  participantIds?: string[];
  actualParticipantIds?: string[];
  status: ActivityStatus;
  statusLabel: string;
  meetingMinutes?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

/** 教研参与记录 */
export interface ResearchParticipation {
  id: string;
  activityId: string;
  teacherId: string;
  teacherName: string;
  role: ParticipantRole;
  roleLabel: string;
  signedIn: boolean;
  signedInAt?: string;
  speechContent?: string;
  speechDuration?: number;
  createdAt: string;
}

/** 教研资源 */
export interface ResearchResource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  typeLabel: string;
  themeType?: ThemeType;
  subject?: string;
  tags?: string[];
  fileUrl?: string;
  fileName?: string;
  content?: string;
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 教研成果 */
export interface ResearchAchievement {
  id: string;
  themeId?: string;
  title: string;
  type: AchievementType;
  typeLabel: string;
  subject?: string;
  description?: string;
  content?: Record<string, unknown>;
  fileUrl?: string;
  fileName?: string;
  authorIds?: string[];
  authorNames?: string[];
  status: AchievementStatus;
  viewCount: number;
  isPublic: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 教研统计 */
export interface ResearchStatistics {
  id: string;
  themeId: string;
  totalActivities: number;
  completedActivities: number;
  totalParticipants: number;
  averageAttendance: string;
  achievementsCount: number;
  resourcesCount: number;
  updatedAt: string;
}

// ==================== 专项教研接口 ====================

/** 大单元教学设计 */
export interface BigUnitDesign {
  id: string;
  themeId: string;
  unitName: string;
  grade: number;
  subject: string;
  unitGoals?: string[];
  coreKnowledge?: string[];
  keyCompetencies?: string[];
  difficultPoints?: string[];
  errorPronePoints?: string[];
  lessonCount?: number;
  lessonDesigns?: LessonDesign[];
  homeworkDesigns?: HomeworkDesign[];
  evaluationTasks?: EvaluationTask[];
  effectAnalysis?: EffectAnalysis;
  creatorId: string;
  creatorName: string;
  collaboratorIds?: string[];
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** 课时设计 */
export interface LessonDesign {
  order: number;
  title: string;
  objectives?: string[];
  keyPoints?: string[];
  activities?: string[];
  duration: number;
}

/** 作业设计 */
export interface HomeworkDesign {
  type: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
}

/** 评价任务 */
export interface EvaluationTask {
  name: string;
  type: string;
  criteria?: string[];
  rubric?: Record<string, unknown>;
}

/** 成效分析 */
export interface EffectAnalysis {
  overallEffect?: string;
  studentGrowth?: string[];
  improvements?: string[];
  suggestions?: string[];
}

/** 项目式教学设计 */
export interface ProjectDesign {
  id: string;
  themeId: string;
  projectName: string;
  grade: number;
  subjects: string[];
  drivingQuestion: string;
  projectGoal?: string;
  tasks?: ProjectTask[];
  timeline?: ProjectTimeline[];
  teamRoles?: TeamRole[];
  learningSheets?: LearningSheet[];
  evaluationRubrics?: EvaluationRubric[];
  implementationRecords?: ImplementationRecord[];
  studentWorks?: StudentWork[];
  reflection?: string;
  creatorId: string;
  creatorName: string;
  collaboratorIds?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** 项目任务 */
export interface ProjectTask {
  phase: string;
  name: string;
  description?: string;
  deliverables?: string[];
  duration: number;
}

/** 项目时间线 */
export interface ProjectTimeline {
  phase: string;
  startDate: string;
  endDate: string;
  activities: string[];
}

/** 团队角色 */
export interface TeamRole {
  role: string;
  responsibilities: string[];
  memberIds?: string[];
}

/** 学习单 */
export interface LearningSheet {
  name: string;
  content: string;
  fileType?: string;
  fileUrl?: string;
}

/** 评价量表 */
export interface EvaluationRubric {
  dimension: string;
  levels: Record<string, string>;
}

/** 实施记录 */
export interface ImplementationRecord {
  date: string;
  content: string;
  photos?: string[];
}

/** 学生作品 */
export interface StudentWork {
  studentName: string;
  title: string;
  description?: string;
  fileUrl?: string;
  createdAt: string;
}

/** 学科实践活动 */
export interface PracticeActivity {
  id: string;
  themeId: string;
  activityName: string;
  subject: string;
  grade: number;
  activityType: PracticeActivityType;
  activityTypeLabel: string;
  description?: string;
  objectives?: string[];
  materials?: Material[];
  procedure?: ActivityProcedure[];
  difficultyLevel?: string;
  timeRequired?: number;
  classManagement?: string;
  implementationRecords?: ImplementationRecord[];
  problems?: Problem[];
  solutions?: Solution[];
  studentWorks?: StudentWork[];
  photos?: string[];
  reflection?: string;
  creatorId: string;
  creatorName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** 活动材料 */
export interface Material {
  name: string;
  quantity: number;
  unit: string;
}

/** 活动流程 */
export interface ActivityProcedure {
  step: number;
  title: string;
  content: string;
  duration: number;
}

/** 问题记录 */
export interface Problem {
  description: string;
  severity: 'low' | 'medium' | 'high';
  discoveredAt: string;
}

/** 解决方案 */
export interface Solution {
  problemId: string;
  content: string;
  effect: string;
}

/** AI赋能教学应用 */
export interface AITeachingApp {
  id: string;
  themeId: string;
  appName: string;
  subject: string;
  aiToolType: AIToolType;
  aiToolTypeLabel: string;
  aiToolName?: string;
  description?: string;
  useCase?: string;
  operationSteps?: OperationStep[];
  prompts?: PromptTemplate[];
  generatedContent?: Record<string, unknown>;
  optimizedContent?: Record<string, unknown>;
  classroomIntegration?: string;
  effectAnalysis?: AIEffectAnalysis;
  videoUrl?: string;
  lessonCase?: LessonCase;
  creatorId: string;
  creatorName: string;
  collaboratorIds?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** 操作步骤 */
export interface OperationStep {
  step: number;
  title: string;
  description: string;
  screenshot?: string;
}

/** 提示词模板 */
export interface PromptTemplate {
  name: string;
  prompt: string;
  description?: string;
}

/** AI效果分析 */
export interface AIEffectAnalysis {
  timeSaved?: number;
  qualityImprovement?: string;
  studentEngagement?: string;
  suggestions?: string[];
}

/** 课例 */
export interface LessonCase {
  title: string;
  grade: number;
  subject: string;
  objectives?: string[];
  procedure?: string;
  aiIntegrationPoints?: string[];
}

// ==================== 辅助类型 ====================

/** 附件 */
export interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

/** 分页查询参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API响应 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== 学科列表 ====================

export const SUBJECTS = [
  '语文', '数学', '英语', '音乐', '体育', '美术',
  '科学', '道德与法治', '综合实践', '信息技术'
] as const;

export type Subject = typeof SUBJECTS[number];
