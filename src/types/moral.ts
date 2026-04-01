/**
 * 德育活动类型定义
 * 
 * @module types/moral
 */

// ==================== 德育活动类型 ====================

/** 德育活动类型 */
export type MoralActivityType =
  | 'theme_class'       // 主题班会
  | 'flag_raising'      // 升旗仪式
  | 'community_service' // 社区服务
  | 'competition'       // 德育竞赛
  | 'lecture'           // 德育讲座
  | 'practice';         // 社会实践

/** 德育活动状态 */
export type MoralActivityStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

/** 德育活动 */
export interface MoralActivity {
  id: string;
  title: string;
  type?: MoralActivityType;
  description?: string;
  content?: string;
  organizerId: string;
  organizerName: string;
  targetGrades?: number[];
  targetClasses?: string[];
  targetRoles?: string[];
  requireSubmission?: boolean;
  submissionConfig?: {
    requireText?: boolean;
    requireAttachment?: boolean;
    allowedTypes?: string[];
    maxFiles?: number;
  };
  submissionDeadline?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status: MoralActivityStatus;
  participantCount?: number;
  attachments?: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

/** 提交状态 */
export type SubmissionReviewStatus = 'pending' | 'approved' | 'rejected';

/** 德育活动提交 */
export interface MoralActivitySubmission {
  id: string;
  activityId: string;
  classId?: string;
  className?: string;
  grade?: number;
  studentId?: string;
  submitterId: string;
  submitterName: string;
  submitterRole?: string;
  content?: string;
  textContent?: string;
  images?: string[];
  attachments?: string[];
  status: SubmissionReviewStatus;
  reviewComments?: string;
  reviewComment?: string;
  score?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerId?: string;
  reviewerName?: string;
  activityTitle?: string;
}

/** 德育活动查询参数 */
export interface MoralActivityQueryParams {
  page?: number;
  pageSize?: number;
  type?: MoralActivityType;
  status?: MoralActivityStatus;
  organizerId?: string;
  search?: string;
}

/** 德育活动统计 */
export interface MoralActivityStatistics {
  total: number;
  byType: Record<MoralActivityType, number>;
  byStatus: Record<MoralActivityStatus, number>;
  thisMonth: number;
}

/** 提交统计 */
export interface SubmissionStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
