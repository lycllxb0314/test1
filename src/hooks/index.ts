/**
 * 自定义 Hooks 导出
 * 
 * ==================== 四核心 Hook 架构 ====================
 * 
 * 1. useClasses（班级 Hook）：第一核心、聚合根
 *    - 学校所有业务都以班级为最小单位
 *    - 聚合班主任、科任、学生、家长信息
 *    - 学生、家长、教师的业务最终都落在班级上
 * 
 * 2. useTeachers（教师 Hook）：第二核心、独立实体
 *    - 教师有独立身份、账号、权限、个人业务
 *    - 与班级强相关：担任班主任、任课、跨班教学、管理年段
 *    - 本身是完整独立实体
 * 
 * 3. useStudents（学生 Hook）：完整实体，从属班级
 *    - 学生本身是完整实体（有个人信息、学籍、家庭、成长档案）
 *    - 必须归属班级，不能脱离班级存在
 * 
 * 4. useParents（家长 Hook）：完整实体，从属学生 → 从属班级
 *    - 家长有账号、有独立信息
 *    - 必须绑定学生，最终归属到班级
 *    - 不能脱离班级独立存在
 * 
 * ==================== 通用 Hook ====================
 * - useAuth: 认证
 * - usePermissions: 权限
 * - useApi: API 封装
 * - useMobile: 响应式设计
 */

// ==================== 核心实体 Hook ====================

// 1. 班级 Hook - 聚合根
export {
  useClasses,
  // 类型
  type ClassContainer,
  type ClassStatus,
  type StudentBasicInfo,
  type ParentBasicInfo,
  type TeacherBasicInfo,
  type TeacherCandidate,
  type ClassFilters,
  type ClassStatistics,
  type PaginationInfo as ClassPaginationInfo,
  type UseClassesReturn,
} from './useClasses';

// 2. 教师 Hook - 独立实体
export {
  useTeachers,
  useTeachers as useTeacherData, // 兼容旧名称
  // 类型
  type TeacherRole,
  type AdministrativeRole,
  type TeacherInfo,
  type TeacherRoleConfig,
  type TeacherFilters,
  type TeacherStatistics,
  type TeacherRecord,
  type TeacherHonor,
  type TeacherTraining,
  type TeacherAchievement,
  type UseTeachersReturn,
  // 常量
  TEACHER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
  ADMINISTRATIVE_ROLE_COLORS,
} from './useTeachers';

// 3. 学生 Hook - 从属班级
export {
  useStudents,
  useStudents as useStudentData, // 兼容旧名称
  // 类型
  type StudentStatus,
  type StudentInfo,
  type StudentFilters,
  type StudentStatistics,
  type PaginationInfo,
  type UseStudentsReturn,
} from './useStudents';

// 4. 家长 Hook - 从属学生 → 从属班级
export {
  useParents,
  // 类型
  type ParentRelation,
  type ParentInfo,
  type ParentFilters,
  type ParentStatistics,
  type ParentNotificationSettings,
  type ParentMessage,
  type UseParentsReturn,
} from './useParents';

// 家长个人信息 Hook
export {
  useParentProfile,
  // 类型
  type ParentProfile,
  type ParentProfileFormData,
  type UseParentProfileReturn,
} from './useParentProfile';

// ==================== 通用 Hook ====================

export { useAuth } from './useAuth';
export { usePermissions } from './usePermissions';
export { 
  useQuery, 
  useMutation, 
  usePaginatedQuery, 
  useFetchAll,
  useFrontendPagination,
  usePagination,
  type UseQueryOptions, 
  type UseQueryResult, 
  type UseMutationResult, 
  type UsePaginatedResult,
  type UseFetchAllResult,
  type UseFrontendPaginationResult,
  type UsePaginationOptions,
  type UsePaginationResult,
  PAGINATION,
} from './useApi';
export { useIsMobile, useIsMobile as useMobile } from './use-mobile';

// 消息系统 Hook
export {
  useMessages,
  // 类型
  type UserMessage,
  type SendMessageRequest,
  type MessageQueryParams,
  type MessageStatistics,
  type MessageEvent,
  type MessagePriority,
  type MessageStatus,
  type MessageRecipient,
  type UseMessagesReturn,
  // 辅助函数
  getMessageEventLabel,
  getMessagePriorityLabel,
  getMessagePriorityColor,
  getMessageStatusLabel,
  getMessageStatusColor,
} from './useMessages';
export { MESSAGE_EVENT_CONFIGS } from '@/types/messages';

// 审批系统 Hook
export {
  useApprovals,
  // 类型
  type ApprovalListType,
  type ApprovalStatistics,
  type UseApprovalsReturn,
  // 辅助函数
  getApprovalStatusLabel,
  getApprovalStatusColor,
  getApprovalStatusIcon,
  canUserApprove,
  canUserWithdraw,
  canUserView,
  getApprovalTypeLabel,
  getApprovalTypeColor,
} from './useApprovals';

// 群组系统 Hook
export {
  useGroups,
  // 类型
  type GroupType,
  type GroupInfo,
  type GroupMember,
  type GroupConfig,
  type GroupFilters,
  type GroupStatistics,
  type GroupCandidate,
  type UseGroupsReturn,
  // 辅助函数
  getGroupTypeLabel,
  getGroupTypeColor,
  isUserInGroup,
  isGroupAdmin,
  getGroupAdmins,
  getGroupRegularMembers,
} from './useGroups';
export { GROUP_CONFIGS, type UserGroupMembership } from '@/types';
