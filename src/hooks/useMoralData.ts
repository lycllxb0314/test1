/**
 * 德育管理数据获取Hooks
 * 
 * 使用统一的基础Hook库（useApi.ts）实现
 * 
 * @module hooks/useMoralData
 */

import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { apiClient } from '@/services/api-client';

// ============================================
// 类型定义
// ============================================

/** 评价类型 */
export type EvaluationType = 'excellent' | 'good' | 'qualified' | 'pending';

/** 德育评价 */
export interface MoralEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  semester: string;
  evaluationType: EvaluationType;
  totalScore: number;
  moralScore: number;
  studyScore: number;
  healthScore: number;
  artScore: number;
  laborScore: number;
  teacherComment?: string;
  schoolComment?: string;
  createdAt: string;
  updatedAt: string;
}

/** 奖励等级 */
export type RewardLevel = 'school' | 'district' | 'city' | 'province' | 'national';

/** 奖励类型 */
export interface StudentReward {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  rewardName: string;
  rewardLevel: RewardLevel;
  rewardType: string;
  issueUnit: string;
  issueDate: string;
  certificateUrl?: string;
  description?: string;
  recorderId: string;
  recorderName: string;
  createdAt: string;
}

/** 处分类型 */
export type PunishmentType = 'warning' | 'demerit' | 'serious_demerit' | 'probation';

/** 处分状态 */
export type PunishmentStatus = 'active' | 'revoked' | 'expired';

/** 学生处分记录 */
export interface StudentPunishment {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  punishmentType: PunishmentType;
  reason: string;
  description?: string;
  status: PunishmentStatus;
  revokeDate?: string;
  revokeReason?: string;
  recorderId: string;
  recorderName: string;
  createdAt: string;
}

/** 活动类型 */
export type ActivityStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

/** 德育活动 */
export interface MoralActivity {
  id: string;
  name: string;
  type: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  organizer: string;
  organizerId: string;
  participants: {
    grade?: number;
    classId?: string;
    className?: string;
    count: number;
  }[];
  status: ActivityStatus;
  photos: string[];
  attachments: string[];
  summary?: string;
  createdAt: string;
}

/** 学生参与活动记录 */
export interface StudentActivityParticipation {
  id: string;
  activityId: string;
  activityName: string;
  activityType: string;
  activityDate: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  performance: string;
  award?: string;
  hours: number;
  createdAt: string;
}

/** 行为记录类型 */
export type BehaviorType = 'positive' | 'negative';

/** 学生行为记录 */
export interface StudentBehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  type: BehaviorType;
  category: string;
  description: string;
  score: number;
  recorderId: string;
  recorderName: string;
  recordDate: string;
  createdAt: string;
}

// ============================================
// 德育评价Hooks
// ============================================

/**
 * 获取德育评价列表
 */
export function useMoralEvaluations(filters?: {
  studentId?: string;
  classId?: string;
  grade?: number;
  semester?: string;
  evaluationType?: EvaluationType;
}) {
  const params: QueryParams = {};
  if (filters?.studentId) params.studentId = filters.studentId;
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.grade) params.grade = filters.grade;
  if (filters?.semester) params.semester = filters.semester;
  if (filters?.evaluationType) params.evaluationType = filters.evaluationType;
  
  return useQuery<MoralEvaluation[]>(
    () => apiClient.get('/moral/evaluations', params),
    { deps: [params] }
  );
}

/**
 * 创建德育评价
 */
export function useCreateMoralEvaluation() {
  return useMutation<MoralEvaluation, Partial<MoralEvaluation>>(
    (data) => apiClient.post('/moral/evaluations', data)
  );
}

// ============================================
// 奖惩Hooks
// ============================================

/**
 * 获取学生奖励列表
 */
export function useStudentRewards(filters?: {
  studentId?: string;
  classId?: string;
  rewardLevel?: RewardLevel;
  rewardType?: string;
}) {
  const params: QueryParams = {};
  if (filters?.studentId) params.studentId = filters.studentId;
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.rewardLevel) params.rewardLevel = filters.rewardLevel;
  if (filters?.rewardType) params.rewardType = filters.rewardType;
  
  return useQuery<StudentReward[]>(
    () => apiClient.get('/moral/rewards', params),
    { deps: [params] }
  );
}

/**
 * 获取学生处分列表
 */
export function useStudentPunishments(filters?: {
  studentId?: string;
  classId?: string;
  punishmentType?: PunishmentType;
  status?: PunishmentStatus;
}) {
  const params: QueryParams = {};
  if (filters?.studentId) params.studentId = filters.studentId;
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.punishmentType) params.punishmentType = filters.punishmentType;
  if (filters?.status) params.status = filters.status;
  
  return useQuery<StudentPunishment[]>(
    () => apiClient.get('/moral/punishments', params),
    { deps: [params] }
  );
}

/**
 * 添加学生奖励
 */
export function useAddStudentReward() {
  return useMutation<StudentReward, Partial<StudentReward>>(
    (data) => apiClient.post('/moral/rewards', data)
  );
}

/**
 * 添加学生处分
 */
export function useAddStudentPunishment() {
  return useMutation<StudentPunishment, Partial<StudentPunishment>>(
    (data) => apiClient.post('/moral/punishments', data)
  );
}

/**
 * 撤销学生处分
 */
export function useRevokePunishment() {
  return useMutation<StudentPunishment, { id: string; revokeReason: string }>(
    ({ id, revokeReason }) => apiClient.patch(`/moral/punishments/${id}/revoke`, { revokeReason })
  );
}

// ============================================
// 活动Hooks
// ============================================

/**
 * 获取德育活动列表
 */
export function useMoralActivities(filters?: {
  type?: string;
  status?: ActivityStatus;
  startDate?: string;
  endDate?: string;
}) {
  const params: QueryParams = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.status) params.status = filters.status;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  
  return useQuery<MoralActivity[]>(
    () => apiClient.get('/moral/activities', params),
    { deps: [params] }
  );
}

/**
 * 获取活动参与记录
 */
export function useActivityParticipations(activityId: string | null) {
  return useQuery<StudentActivityParticipation[]>(
    () => activityId ? apiClient.get(`/moral/activities/${activityId}/participants`) : Promise.resolve({ success: true, data: [] }),
    { deps: [activityId], enabled: !!activityId }
  );
}

/**
 * 创建德育活动
 */
export function useCreateMoralActivity() {
  return useMutation<MoralActivity, Partial<MoralActivity>>(
    (data) => apiClient.post('/moral/activities', data)
  );
}

/**
 * 添加活动参与记录
 */
export function useAddActivityParticipation() {
  return useMutation<StudentActivityParticipation, Partial<StudentActivityParticipation>>(
    (data) => apiClient.post('/moral/activities/participants', data)
  );
}

// ============================================
// 行为记录Hooks
// ============================================

/**
 * 获取学生行为记录
 */
export function useStudentBehaviors(filters?: {
  studentId?: string;
  classId?: string;
  type?: BehaviorType;
  category?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params: QueryParams = {};
  if (filters?.studentId) params.studentId = filters.studentId;
  if (filters?.classId) params.classId = filters.classId;
  if (filters?.type) params.type = filters.type;
  if (filters?.category) params.category = filters.category;
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  
  return useQuery<StudentBehaviorRecord[]>(
    () => apiClient.get('/moral/behaviors', params),
    { deps: [params] }
  );
}

/**
 * 添加行为记录
 */
export function useAddBehaviorRecord() {
  return useMutation<StudentBehaviorRecord, Partial<StudentBehaviorRecord>>(
    (data) => apiClient.post('/moral/behaviors', data)
  );
}

// ============================================
// 导出
// ============================================

// 从useApi重新导出兼容的hooks
export { useClasses } from './useApi';
