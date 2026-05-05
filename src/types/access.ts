/**
 * 门禁类型定义
 * 
 * @module types/access
 * 
 * 核心业务类型定义，供前端页面和 hooks 使用
 */

/** 人员类型 */
export type PersonType = 'teacher' | 'student' | 'parent' | 'visitor';

/** 申请状态 */
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

/** 通行方向 */
export type Direction = 'in' | 'out';

/** 人员类型标签 */
export const personTypeLabels: Record<string, string> = {
  teacher: '教师',
  student: '学生',
  parent: '家长',
  visitor: '访客',
};

/** 申请状态标签 */
export const applicationStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
  expired: '已过期',
};

/** 通行方向标签 */
export const directionLabels: Record<string, string> = {
  in: '进入',
  out: '离开',
};
