'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole, ModuleType, Permission } from '@/types';
import {
  canAccessModule as checkModuleAccess,
  hasPermission as checkPermission,
  getRoleModules,
  getModulePermissions,
  isAdminRole,
  isTeacherRole,
  isDirectorRole,
} from '@/lib/auth/permissions';

/**
 * 权限检查 Hook
 * 提供便捷的权限检查方法
 */
export function usePermissions() {
  const { user } = useAuth();

  const role = user?.role;

  return useMemo(() => {
    const currentRole = role;

    /**
     * 检查是否有指定模块的访问权限
     */
    const canAccessModule = (module: ModuleType): boolean => {
      if (!currentRole) return false;
      return checkModuleAccess(currentRole, module);
    };

    /**
     * 检查是否有指定权限
     */
    const hasPermission = (module: ModuleType, permission: Permission): boolean => {
      if (!currentRole) return false;
      return checkPermission(currentRole, module, permission);
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
      return getModulePermissions(currentRole, module);
    };

    /**
     * 检查是否为管理员
     */
    const isAdmin = (): boolean => {
      if (!currentRole) return false;
      return isAdminRole(currentRole);
    };

    /**
     * 检查是否为教师
     */
    const isTeacher = (): boolean => {
      if (!currentRole) return false;
      return isTeacherRole(currentRole);
    };

    /**
     * 检查是否为部门负责人
     */
    const isDirector = (): boolean => {
      if (!currentRole) return false;
      return isDirectorRole(currentRole);
    };

    /**
     * 检查是否为班主任
     */
    const isHeadTeacher = (): boolean => {
      return currentRole === 'head_teacher' || currentRole === 'grade_leader';
    };

    /**
     * 检查是否为年段长
     */
    const isGradeLeader = (): boolean => {
      return currentRole === 'grade_leader';
    };

    /**
     * 检查是否可以查看指定班级
     */
    const canViewClass = (classId: string): boolean => {
      if (!currentRole || !user) return false;
      
      // 管理员可以查看所有班级
      if (isAdmin()) return true;
      
      // 班主任只能查看自己的班级
      if (currentRole === 'head_teacher' && user.classId === classId) {
        return true;
      }
      
      // 年段长可以查看管理的年级的班级
      if (currentRole === 'grade_leader') {
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
      
      // 管理员和教务人员可以编辑
      if (isAdmin() || currentRole === 'academic_director' || currentRole === 'academic_staff') {
        return true;
      }
      
      // 班主任只能编辑自己班级的学生
      if (currentRole === 'head_teacher' && user?.classId === studentClassId) {
        return true;
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
      user,
      isAuthenticated: !!currentRole,
      
      // 权限检查方法
      canAccessModule,
      hasPermission,
      hasRole,
      getAccessibleModules,
      getPermissions,
      
      // 角色检查方法
      isAdmin,
      isTeacher,
      isDirector,
      isHeadTeacher,
      isGradeLeader,
      
      // 业务检查方法
      canViewClass,
      canEditStudent,
      canApprove,
    };
  }, [role, user]);
}

/**
 * 导出类型
 */
export type PermissionsHook = ReturnType<typeof usePermissions>;
