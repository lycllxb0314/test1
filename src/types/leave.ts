/**
 * 请假类型定义
 * 
 * @module types/leave
 */

// ==================== 请假类型 ====================

/** 请假类型 */
export type LeaveType = 
  | 'sick'          // 病假
  | 'personal'      // 事假
  | 'official'      // 公假
  | 'marriage'      // 婚假
  | 'bereavement'   // 丧假
  | 'maternity'     // 产假
  | 'paternity'     // 陪产假
  | 'annual';       // 年假

/** 请假类型标签 */
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: '病假',
  personal: '事假',
  official: '公假',
  marriage: '婚假',
  bereavement: '丧假',
  maternity: '产假',
  paternity: '陪产假',
  annual: '年假',
};

// ==================== 请假申请 ====================

/** 请假申请状态 */
export type LeaveStatus = 
  | 'draft'         // 草稿
  | 'pending'       // 待审批
  | 'approved'      // 已批准
  | 'rejected'      // 已拒绝
  | 'cancelled';    // 已取消

/** 请假申请人类型 */
export type LeaveApplicantType = 'teacher' | 'student';

/** 请假申请 */
export interface LeaveApplication {
  id: string;
  applicantType: LeaveApplicantType;
  applicantId: string;
  applicantName: string;
  employeeId?: string;
  studentNo?: string;
  classId?: string;
  className?: string;
  grade?: number;
  
  // 请假信息
  type: LeaveType;
  startDate: string;
  endDate: string;
  duration: number; // 天数
  durationUnit: 'day' | 'hour';
  reason: string;
  attachments?: string[];
  
  // 代课安排（教师请假）
  substituteRequired: boolean;
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  substituteConfirmed?: boolean;
  
  // 审批流程
  status: LeaveStatus;
  approvalFlow: LeaveApprovalStep[];
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/** 创建请假申请请求 */
export interface CreateLeaveRequest {
  applicantType: LeaveApplicantType;
  type: LeaveType;
  startDate: string;
  endDate: string;
  duration: number;
  durationUnit?: 'day' | 'hour';
  reason: string;
  attachments?: string[];
  substituteRequired?: boolean;
  substituteTeacherId?: string;
}

// ==================== 审批流程 ====================

/** 请假审批步骤 */
export interface LeaveApprovalStep {
  id: string;
  order: number;
  approverType: 'head_teacher' | 'grade_leader' | 'director' | 'vice_principal' | 'principal';
  approverTypeName: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  actionAt?: string;
  comment?: string;
  isRequired: boolean;
}

/** 审批操作请求 */
export interface LeaveApprovalAction {
  leaveId: string;
  action: 'approve' | 'reject';
  comment?: string;
}

// ==================== 请假统计 ====================

/** 请假统计 */
export interface LeaveStatistics {
  applicantId: string;
  applicantName: string;
  semester: string;
  totalCount: number;
  totalDays: number;
  sickLeaveCount: number;
  sickLeaveDays: number;
  personalLeaveCount: number;
  personalLeaveDays: number;
  officialLeaveCount: number;
  officialLeaveDays: number;
  otherLeaveCount: number;
  otherLeaveDays: number;
}

/** 部门请假统计 */
export interface DepartmentLeaveStatistics {
  department: string;
  semester: string;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalDays: number;
  byType: Record<LeaveType, { count: number; days: number }>;
}

// ==================== 请假筛选 ====================

/** 请假筛选条件 */
export interface LeaveFilters {
  applicantType?: LeaveApplicantType | 'all';
  type?: LeaveType | 'all';
  status?: LeaveStatus | 'all';
  classId?: string;
  grade?: number | 'all';
  startDate?: string;
  endDate?: string;
}
