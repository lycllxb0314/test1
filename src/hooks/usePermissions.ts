'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole, AdministrativeRole, ModuleType, Permission, UserGroupMembership } from '@/types';
import {
  canAccessModule as checkModuleAccess,
  hasPermission as checkPermission,
  getMergedPermissions,
  getRoleModules,
  isAdminRole,
  isTeacherRole,
  isDirectorRole,
} from '@/lib/auth/permissions';

/**
 * 扩展的用户类型（包含兼任职务和群组）
 */
interface UserWithAdditionalRoles {
  id: string;
  name: string;
  role: UserRole;
  additionalRoles?: AdministrativeRole[];
  groups?: UserGroupMembership[];
  classId?: string;
  className?: string;
  children?: { id: string; name: string; classId: string; className: string }[];
}

/**
 * 权限检查 Hook
 * 提供便捷的权限检查方法
 */
export function usePermissions() {
  const { user } = useAuth();

  // 获取兼任职务
  const additionalRoles = (user as UserWithAdditionalRoles)?.additionalRoles;
  
  // 获取所属群组
  const groups = (user as UserWithAdditionalRoles)?.groups;

  return useMemo(() => {
    const currentRole = user?.role;
    const currentAdditionalRoles = additionalRoles;
    const currentGroups = groups;

    /**
     * 检查是否有指定模块的访问权限
     */
    const canAccessModule = (module: ModuleType): boolean => {
      if (!currentRole) return false;
      const permissions = getMergedPermissions(currentRole, currentAdditionalRoles, currentGroups);
      return module in permissions;
    };

    /**
     * 检查是否有指定权限
     */
    const hasPermission = (module: ModuleType, permission: Permission): boolean => {
      if (!currentRole) return false;
      const permissions = getMergedPermissions(currentRole, currentAdditionalRoles, currentGroups);
      return permissions[module]?.includes(permission) ?? false;
    };

    /**
     * 检查是否有任一指定角色
     */
    const hasRole = (roles: UserRole | UserRole[]): boolean => {
      if (!currentRole) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(currentRole);
    };

    /**
     * 检查是否有任一指定兼任职务
     */
    const hasAdditionalRole = (roles: AdministrativeRole | AdministrativeRole[]): boolean => {
      if (!currentAdditionalRoles || currentAdditionalRoles.length === 0) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.some(r => currentAdditionalRoles.includes(r));
    };

    /**
     * 获取当前用户可访问的所有模块
     */
    const getAccessibleModules = (): ModuleType[] => {
      if (!currentRole) return [];
      return getRoleModules(currentRole);
    };

    /**
     * 获取当前用户在指定模块的权限列表
     */
    const getPermissions = (module: ModuleType): Permission[] => {
      if (!currentRole) return [];
      const permissions = getMergedPermissions(currentRole, currentAdditionalRoles, currentGroups);
      return permissions[module] || [];
    };

    /**
     * 检查是否为管理员（领导层或兼任主任或群组管理员）
     */
    const isAdmin = (): boolean => {
      if (!currentRole) return false;
      // 检查是否有兼任主任职务
      if (isAdminRole(currentRole, currentAdditionalRoles)) return true;
      // 检查是否为群组管理员
      if (currentGroups?.some(g => g.isAdmin)) return true;
      return false;
    };

    /**
     * 检查是否为教师
     */
    const isTeacher = (): boolean => {
      if (!currentRole) return false;
      return isTeacherRole(currentRole);
    };

    /**
     * 检查是否为部门负责人（兼任主任职务或群组管理员）
     */
    const isDirector = (): boolean => {
      // 检查是否有兼任主任职务
      if (isDirectorRole(currentAdditionalRoles)) return true;
      // 检查是否为群组管理员
      if (currentGroups?.some(g => g.isAdmin)) return true;
      return false;
    };

    /**
     * 检查是否为群组管理员
     */
    const isGroupAdmin = (): boolean => {
      return currentGroups?.some(g => g.isAdmin) ?? false;
    };

    /**
     * 检查是否属于指定群组
     */
    const isInGroup = (groupType: string): boolean => {
      return currentGroups?.some(g => g.groupType === groupType) ?? false;
    };

    /**
     * 检查是否为班主任
     */
    const isHeadTeacher = (): boolean => {
      return currentRole === 'head_teacher';
    };

    /**
     * 检查是否为科任教师（副班主任）
     */
    const isSubTeacher = (): boolean => {
      return currentRole === 'subject_teacher';
    };

    /**
     * 检查是否可以访问班级管理（班主任或科任）
     */
    const canManageClass = (): boolean => {
      return isHeadTeacher() || isSubTeacher();
    };

    /**
     * 检查是否为年段长（兼任职务）
     */
    const isGradeLeader = (): boolean => {
      return hasAdditionalRole('grade_leader');
    };

    /**
     * 检查是否可以查看指定班级
     */
    const canViewClass = (classId: string): boolean => {
      if (!currentRole || !user) return false;
      
      // 管理员或群组管理员可以查看所有班级
      if (isAdmin()) return true;
      
      // 教务处成员可以查看所有班级
      if (isInGroup('academic_office')) return true;
      
      // 德育处成员可以查看所有班级
      if (isInGroup('moral_office')) return true;
      
      // 班主任只能查看自己的班级
      if (currentRole === 'head_teacher' && user.classId === classId) {
        return true;
      }
      
      // 科任教师可以查看自己负责的班级
      if (currentRole === 'subject_teacher' && user.subTeacherClasses) {
        return user.subTeacherClasses.some(c => c.classId === classId);
      }
      
      // 年段长可以查看管理的年级的班级
      if (isGradeLeader()) {
        // TODO: 实现年级检查
        return true;
      }
      
      return false;
    };

    /**
     * 检查是否可以编辑指定学生
     */
    const canEditStudent = (studentClassId: string): boolean => {
      if (!currentRole) return false;
      
      // 管理员可以编辑
      if (isAdmin()) return true;
      
      // 教务处成员可以编辑
      if (isInGroup('academic_office')) return true;
      
      // 德育处成员可以编辑
      if (isInGroup('moral_office')) return true;
      
      // 教务主任可以编辑
      if (hasAdditionalRole('academic_director')) return true;
      
      // 班主任只能编辑自己班级的学生
      if (currentRole === 'head_teacher' && user?.classId === studentClassId) {
        return true;
      }
      
      // 科任教师可以编辑自己负责班级的学生
      if (currentRole === 'subject_teacher' && user?.subTeacherClasses) {
        return user.subTeacherClasses.some(c => c.classId === studentClassId);
      }
      
      return false;
    };

    /**
     * 检查是否可以审批
     */
    const canApprove = (module: ModuleType): boolean => {
      return hasPermission(module, 'approve');
    };

    return {
      // 基础信息
      role: currentRole,
      additionalRoles: currentAdditionalRoles,
      user,
      isAuthenticated: !!currentRole,

      // 权限检查方法
      canAccessModule,
      hasPermission,
      hasRole,
      hasAdditionalRole,
      getAccessibleModules,
      getPermissions,

      // 角色检查方法
      isAdmin,
      isTeacher,
      isDirector,
      isHeadTeacher,
      isSubTeacher,
      canManageClass,
      isGradeLeader,
      isGroupAdmin,
      isInGroup,

      // 业务权限检查
      canViewClass,
      canEditStudent,
      canApprove,
    };
  }, [user, additionalRoles, groups]);
}
