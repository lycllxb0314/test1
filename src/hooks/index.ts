/**
 * 自定义 Hooks 导出
 */

export {
  useTeachers,
  useTeacherData,
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
} from './useTeachers';

export {
  useParents,
  useParentData,
  // 类型
  type ParentRelationship,
  type ParentInfo,
  type ParentFilterParams,
  type UseParentsReturn,
  // 常量
  PARENT_RELATIONSHIP_LABELS,
  PARENT_RELATIONSHIP_OPTIONS,
} from './useParents';
