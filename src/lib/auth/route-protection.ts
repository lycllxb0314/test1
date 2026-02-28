/**
 * API 路由保护工具
 * 提供便捷的路由保护装饰器和工具函数
 * 
 * 使用方式：
 * 1. 使用 protectedRoute 包装器保护整个路由
 * 2. 使用 withAuth 高阶函数为单个方法添加认证
 * 3. 在前端使用 ProtectedRoute 组件保护页面
 */

import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, ModuleType, Permission } from '@/types';
import {
  authenticateRequest,
  createAuthErrorResponse,
  checkModuleAccess,
  checkPermission,
} from './auth-middleware';
import { isAdminRole, isTeacherRole, isDirectorRole } from './permissions';

/**
 * 认证上下文 - 包含用户信息的扩展上下文
 */
export interface AuthContext {
  user: User;
}

/**
 * 扩展的路由上下文 - Next.js原生参数 + 用户信息
 */
export interface ExtendedRouteContext extends AuthContext {
  params?: Promise<Record<string, string>>;
}

/**
 * 原生API路由参数类型
 */
export type NativeRouteContext = {
  params: Promise<Record<string, string>>;
};

/**
 * 受保护的路由处理器类型
 */
export type ProtectedRouteHandler = (
  request: NextRequest,
  context: ExtendedRouteContext
) => Promise<NextResponse>;

/**
 * 路由保护选项
 */
export interface ProtectionOptions {
  // 允许的角色列表
  roles?: UserRole[];
  // 需要的模块访问权限
  module?: ModuleType;
  // 需要的具体权限
  permission?: Permission;
  // 自定义权限检查函数
  customCheck?: (user: User) => boolean | Promise<boolean>;
  // 是否允许管理员绕过检查
  adminBypass?: boolean;
  // 是否可选认证（未登录也可访问，但user可能为null）
  optional?: boolean;
}

/**
 * 创建受保护的 API 路由处理器
 * 
 * @example
 * ```ts
 * // 基本认证保护
 * export const GET = protectedRoute(async (request, { user }) => {
 *   return NextResponse.json({ data: 'protected data' });
 * });
 * 
 * // 角色限制
 * export const GET = protectedRoute(
 *   async (request, { user }) => {
 *     return NextResponse.json({ data: 'admin data' });
 *   },
 *   { roles: ['principal', 'academic_director'] }
 * );
 * 
 * // 模块权限检查
 * export const GET = protectedRoute(
 *   async (request, { user }) => {
 *     return NextResponse.json({ data: 'academic data' });
 *   },
 *   { module: 'academic', permission: 'manage' }
 * );
 * 
 * // 可选认证（未登录也可访问）
 * export const GET = protectedRoute(
 *   async (request, { user }) => {
 *     // user 可能为 null
 *     return NextResponse.json({ data: 'public data' });
 *   },
 *   { optional: true }
 * );
 * ```
 */
export function protectedRoute(
  handler: ProtectedRouteHandler,
  options: ProtectionOptions = {}
) {
  // 返回符合Next.js原生签名的函数
  return async (
    request: NextRequest,
    context?: NativeRouteContext
  ): Promise<NextResponse> => {
    // 1. 认证检查
    const authResult = await authenticateRequest(request);
    
    // 可选认证模式：未登录时 user 为 null，但仍可继续
    if (options.optional && (!authResult.success || !authResult.user)) {
      return handler(request, { 
        user: null as unknown as User, 
        params: context?.params 
      });
    }
    
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // 2. 管理员绕过检查（如果启用）
    if (options.adminBypass !== false && isAdminRole(user.role)) {
      return handler(request, { user, params: context?.params });
    }

    // 3. 角色检查
    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: '权限不足，无法访问此资源',
            code: 'FORBIDDEN',
            requiredRoles: options.roles,
          },
          { status: 403 }
        );
      }
    }

    // 4. 模块访问检查
    if (options.module) {
      if (!checkModuleAccess(user, options.module)) {
        return NextResponse.json(
          {
            success: false,
            error: `您没有访问 ${options.module} 模块的权限`,
            code: 'MODULE_FORBIDDEN',
          },
          { status: 403 }
        );
      }

      // 5. 具体权限检查
      if (options.permission) {
        if (!checkPermission(user, options.module, options.permission)) {
          return NextResponse.json(
            {
              success: false,
              error: '您没有执行此操作的权限',
              code: 'PERMISSION_DENIED',
            },
            { status: 403 }
          );
        }
      }
    }

    // 6. 自定义检查
    if (options.customCheck) {
      const checkResult = await options.customCheck(user);
      if (!checkResult) {
        return NextResponse.json(
          {
            success: false,
            error: '自定义权限检查未通过',
            code: 'CUSTOM_CHECK_FAILED',
          },
          { status: 403 }
        );
      }
    }

    // 7. 执行处理器
    return handler(request, { user, params: context?.params });
  };
}

/**
 * 创建仅限管理员的 API 路由
 */
export function adminOnlyRoute(handler: ProtectedRouteHandler) {
  return protectedRoute(handler, {
    roles: ['principal', 'secretary', 'vice_principal', 'academic_director', 'moral_director', 'general_director'],
  });
}

/**
 * 创建教师专属的 API 路由
 */
export function teacherOnlyRoute(handler: ProtectedRouteHandler) {
  return protectedRoute(handler, {
    customCheck: (user) => isTeacherRole(user.role) || isAdminRole(user.role),
  });
}

/**
 * 创建班主任专属的 API 路由
 */
export function headTeacherOnlyRoute(handler: ProtectedRouteHandler) {
  return protectedRoute(handler, {
    roles: ['head_teacher', 'grade_leader'],
    adminBypass: true,
  });
}

/**
 * 创建教务相关 API 路由
 */
export function academicRoute(handler: ProtectedRouteHandler, permission: Permission = 'view') {
  return protectedRoute(handler, {
    module: 'academic',
    permission,
  });
}

/**
 * 创建德育相关 API 路由
 */
export function moralRoute(handler: ProtectedRouteHandler, permission: Permission = 'view') {
  return protectedRoute(handler, {
    module: 'moral',
    permission,
  });
}

/**
 * 创建总务相关 API 路由
 */
export function generalRoute(handler: ProtectedRouteHandler, permission: Permission = 'view') {
  return protectedRoute(handler, {
    module: 'general',
    permission,
  });
}

/**
 * 组合多个保护条件
 */
export function composeProtection(
  handler: ProtectedRouteHandler,
  protections: ProtectionOptions[]
) {
  let result = handler;
  for (let i = protections.length - 1; i >= 0; i--) {
    result = protectedRoute(result, protections[i]) as ProtectedRouteHandler;
  }
  return result;
}

/**
 * 检查是否为自己的数据（用于自我访问控制）
 */
export function selfOnly(
  getUserId: (context: ExtendedRouteContext) => string
): (user: User, context: ExtendedRouteContext) => boolean {
  return (user: User, context: ExtendedRouteContext) => {
    const targetUserId = getUserId(context);
    return user.id === targetUserId || isAdminRole(user.role);
  };
}

/**
 * 检查班级访问权限（班主任只能访问自己的班级）
 */
export function classAccess(
  getClassId: (context: ExtendedRouteContext) => string
): (user: User, context: ExtendedRouteContext) => boolean {
  return (user: User, context: ExtendedRouteContext) => {
    const targetClassId = getClassId(context);
    return user.classId === targetClassId || isDirectorRole(user.role) || isAdminRole(user.role);
  };
}

/**
 * 创建限制访问自己资源的路由保护器
 */
export function createSelfOnlyProtection(
  getResourceUserId: (request: NextRequest, user: User) => Promise<string | null>
): ProtectionOptions {
  return {
    customCheck: async (user: User) => {
      // 这个检查需要在实际请求上下文中进行
      // 这里只是一个占位符，实际使用时需要在handler中调用
      return true;
    },
  };
}
