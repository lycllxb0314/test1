'use client';

import React, { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, ModuleType, Permission, AdministrativeRole } from '@/types';
import { canAccessModule, hasPermission, getMergedPermissions } from '@/lib/auth/permissions';
import { Loader2 } from 'lucide-react';

/**
 * 路由保护组件属性
 */
interface ProtectedRouteProps {
  children: ReactNode;
  // 允许的主要角色列表
  roles?: UserRole[];
  // 需要的模块访问权限
  module?: ModuleType;
  // 需要的具体权限
  permission?: Permission;
  // 自定义权限检查函数
  customCheck?: (user: NonNullable<ReturnType<typeof useAuth>['user']>) => boolean;
  // 未授权时的重定向路径
  redirectTo?: string;
  // 加载中显示的组件
  loadingComponent?: ReactNode;
  // 无权限时显示的组件
  fallbackComponent?: ReactNode;
}

/**
 * 受保护的路由组件
 * 用于保护前端页面路由
 * 
 * @example
 * ```tsx
 * // 基本认证保护
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // 角色限制
 * <ProtectedRoute roles={['principal', 'vice_principal']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * // 模块权限检查
 * <ProtectedRoute module="academic" permission="manage">
 *   <AcademicManagement />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  roles,
  module,
  permission,
  customCheck,
  redirectTo = '/login',
  loadingComponent,
  fallbackComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // 加载中状态
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">验证权限中...</p>
          </div>
        </div>
      )
    );
  }

  // 未登录
  if (!user) {
    // 保存当前路径用于登录后跳转
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', pathname);
    }
    router.push(redirectTo);
    return null;
  }

  // 角色检查
  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      return fallbackComponent || <NoPermission />;
    }
  }

  // 模块访问检查
  if (module) {
    // 获取合并后的权限（主要角色 + 兼任职务）
    const additionalRoles = (user as any).additionalRoles as AdministrativeRole[] | undefined;
    const modulePermissions = getMergedPermissions(user.role, additionalRoles);
    
    if (!modulePermissions[module]) {
      return fallbackComponent || <NoPermission />;
    }

    // 具体权限检查
    if (permission) {
      if (!modulePermissions[module]?.includes(permission)) {
        return fallbackComponent || <NoPermission />;
      }
    }
  }

  // 自定义检查
  if (customCheck) {
    if (!customCheck(user)) {
      return fallbackComponent || <NoPermission />;
    }
  }

  return <>{children}</>;
}

/**
 * 无权限提示组件
 */
function NoPermission() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">权限不足</h3>
        <p className="text-muted-foreground mb-4">
          您没有访问此页面的权限，请联系管理员获取相应权限。
        </p>
        <button
          onClick={() => window.history.back()}
          className="text-primary hover:underline"
        >
          返回上一页
        </button>
      </div>
    </div>
  );
}

/**
 * 简化版认证保护组件
 * 仅检查是否登录
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/**
 * 角色保护组件
 */
export function RequireRole({ 
  children, 
  roles 
}: { 
  children: ReactNode; 
  roles: UserRole[] 
}) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

/**
 * 管理员保护组件（学校领导层）
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      roles={['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 教师保护组件（包括班主任、科任教师、技能课教师）
 */
export function RequireTeacher({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      roles={['head_teacher', 'subject_teacher', 'skill_teacher']}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 德育相关人员保护组件
 */
export function RequireMoral({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      roles={['principal', 'secretary', 'moral_vice_principal', 'head_teacher']}
      customCheck={(user) => {
        // 检查是否有兼任德育相关职务
        const additionalRoles = (user as any).additionalRoles as AdministrativeRole[] | undefined;
        if (additionalRoles?.includes('moral_director') || 
            additionalRoles?.includes('young_pioneer_counselor')) {
          return true;
        }
        return ['principal', 'secretary', 'moral_vice_principal', 'head_teacher'].includes(user.role);
      }}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 教务相关人员保护组件
 */
export function RequireAcademic({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      roles={['principal', 'academic_vice_principal']}
      customCheck={(user) => {
        // 检查是否有任教务相关职务
        const additionalRoles = (user as any).additionalRoles as AdministrativeRole[] | undefined;
        if (additionalRoles?.includes('academic_director') || 
            additionalRoles?.includes('grade_leader') ||
            additionalRoles?.includes('research_group_leader') ||
            additionalRoles?.includes('research_group_deputy_leader')) {
          return true;
        }
        return ['principal', 'academic_vice_principal'].includes(user.role);
      }}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * 家长保护组件
 */
export function RequireParent({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      roles={['parent']}
    >
      {children}
    </ProtectedRoute>
  );
}
