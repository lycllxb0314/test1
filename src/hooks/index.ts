/**
 * React Hooks 统一入口
 * 
 * 只导出 Hook 函数，类型和常量请从以下位置导入：
 * - 类型：@/types
 * - 常量：@/lib/data/teaching-rules 等
 * 
 * @module hooks
 */

// ============================================
// 核心 Hooks
// ============================================

export { useQuery, usePaginatedQuery, useMutation, useQueryClient } from './core/use-query';

// ============================================
// 业务 Hooks
// ============================================

// 教师
export { useTeachers } from './useTeachers';

// 学生
export { useStudents } from './useStudents';

// 班级
export { useClasses } from './useClasses';

// 审批
export { useApprovals } from './useApprovals';

// 认证
export { useAuth } from './useAuth';

// 缓存
export { useCache } from './useCache';

// 群组
export { useGroups } from './useGroups';

// 请假调整
export { useLeaveAdjust } from './useLeaveAdjust';

// 请假审批
export { useLeaveApproval } from './useLeaveApproval';

// 消息
export { useMessages } from './useMessages';

// 官方课表
export { useOfficialSchedule } from './useOfficialSchedule';

// 家长档案
export { useParentProfile } from './useParentProfile';

// 家长
export { useParents } from './useParents';

// 权限
export { usePermissions } from './usePermissions';

// 课表草稿
export { useScheduleDraft } from './useScheduleDraft';

// 学校统计
export { useSchoolStats } from './useSchoolStats';

// 移动端检测
export { useIsMobile } from './use-mobile';

// 前端分页
export { useFrontendPagination } from './useApi';

// ============================================
// 类型导出（向后兼容，逐步迁移到 @/types）
// ============================================

// 注意：这些类型将在未来版本中移除，请从 @/types 导入
export type {
  TeacherInfo,
  TeacherRecord,
  TeacherHonor,
  TeacherTraining,
  TeacherAchievement,
  TeacherRole,
  AdministrativeRole,
  TeacherRoleConfig,
} from './useTeachers';

// 注意：这些常量将在未来版本中移除，请从 @/lib/data/teaching-rules 导入
export {
  TEACHER_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
  ADMINISTRATIVE_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_COLORS,
} from './useTeachers';

// 分页相关
export { PAGINATION } from '@/lib/pagination-config';
