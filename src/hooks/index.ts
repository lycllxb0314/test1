/**
 * 自定义 Hooks 导出
 * 
 * 核心实体 Hook：
 * - useTeachers: 教师管理（角色、课时、履历、荣誉、培训、成就）
 * - useStudents: 学生管理（基础信息、完整档案、习惯、德育）
 * - useClasses: 班级管理（班主任、科任、学生、家长容器）
 * 
 * 通用 Hook：
 * - useAuth: 认证
 * - usePermissions: 权限
 * - useApi: API 封装
 * - useMobile: 响应式设计
 */

// ==================== 核心实体 Hook ====================

export {
  useTeachers,
  useTeachers as useTeacherData, // 兼容旧名称
  // 类型
  type TeacherRole,
  type AdministrativeRole,
  type TeacherInfo,
  type TeacherRoleConfig,
  type UseTeachersReturn,
  // 常量
  TEACHER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
  ADMINISTRATIVE_ROLE_COLORS,
} from './useTeachers';

export {
  useStudents,
  useStudents as useStudentData, // 兼容旧名称
  // 类型
  type StudentInfo,
  type StudentStatistics,
  type StudentFilters,
  type PaginationInfo,
  type UseStudentsReturn,
} from './useStudents';

export {
  useClasses,
  // 类型
  type ClassContainer,
  type StudentBasicInfo,
  type ParentInfo,
  type TeacherCandidate,
  type UseClassesReturn,
} from './useClasses';

// ==================== 通用 Hook ====================

export { useAuth } from './useAuth';
export { usePermissions } from './usePermissions';
export { useQuery, useMutation, usePaginatedQuery, type UseQueryOptions, type UseQueryResult, type UseMutationResult, type UsePaginatedResult } from './useApi';
export { useIsMobile, useIsMobile as useMobile } from './use-mobile';
