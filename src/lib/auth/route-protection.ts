/**
 * API 路由保护工具
 * 提供便捷的路由保护装饰器和工具函数
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
 * API 路由上下文
 */
export interface RouteContext {
  user: User;
  params?: Record<string, string>;
}

/**
 * API 路由处理器类型
 */
export type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse>;

/**
 * Next.js 路由处理器类型
 */
type NextRouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
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
 * ```
 */
export function protectedRoute(
  handler: RouteHandler,
  options: ProtectionOptions = {}
): NextRouteHandler {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    // 1. 认证检查
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;
    
    // 解析路由参数
    const params = context?.params ? await context.params : undefined;

    // 2. 管理员绕过检查（如果启用）
    if (options.adminBypass !== false && isAdminRole(user.role)) {
      return handler(request, { user, params });
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
    return handler(request, { user, params });
  };
}

/**
 * 创建仅限管理员的 API 路由
 */
export function adminOnlyRoute(
  handler: RouteHandler
): NextRouteHandler {
  return protectedRoute(handler, {
    roles: ['principal', 'secretary', 'vice_principal', 'academic_director', 'moral_director', 'general_director'],
  });
}

/**
 * 创建教师专属的 API 路由
 */
export function teacherOnlyRoute(
  handler: RouteHandler
): NextRouteHandler {
  return protectedRoute(handler, {
    customCheck: (user) => isTeacherRole(user.role) || isAdminRole(user.role),
  });
}

/**
 * 创建班主任专属的 API 路由
 */
export function headTeacherOnlyRoute(
  handler: RouteHandler
): NextRouteHandler {
  return protectedRoute(handler, {
    roles: ['head_teacher', 'grade_leader'],
    adminBypass: true,
  });
}

/**
 * 创建教务相关 API 路由
 */
export function academicRoute(
  handler: RouteHandler,
  permission: Permission = 'view'
): NextRouteHandler {
  return protectedRoute(handler, {
    module: 'academic',
    permission,
  });
}

/**
 * 创建德育相关 API 路由
 */
export function moralRoute(
  handler: RouteHandler,
  permission: Permission = 'view'
): NextRouteHandler {
  return protectedRoute(handler, {
    module: 'moral',
    permission,
  });
}

/**
 * 创建总务相关 API 路由
 */
export function generalRoute(
  handler: RouteHandler,
  permission: Permission = 'view'
): NextRouteHandler {
  return protectedRoute(handler, {
    module: 'general',
    permission,
  });
}

/**
 * 组合多个路由保护
 */
export function composeProtection(
  ...handlers: ((handler: RouteHandler) => RouteHandler)[]
) {
  return (handler: RouteHandler): RouteHandler => {
    return handlers.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * 限制只能操作自己的资源
 */
export function selfOnly(
  getResourceUserId: (request: NextRequest, user: User) => Promise<string | null>
): (handler: RouteHandler) => NextRouteHandler {
  return (handler: RouteHandler): NextRouteHandler => {
    return protectedRoute(async (request, context) => {
      const resourceUserId = await getResourceUserId(request, context.user);
      
      if (resourceUserId && resourceUserId !== context.user.id) {
        // 只有管理员可以操作他人资源
        if (!isAdminRole(context.user.role)) {
          return NextResponse.json(
            {
              success: false,
              error: '您只能操作自己的资源',
              code: 'SELF_ONLY',
            },
            { status: 403 }
          );
        }
      }
      
      return handler(request, context);
    });
  };
}

/**
 * 检查班级访问权限
 * 班主任只能访问自己班级的数据
 */
export function classAccess(
  getClassId: (request: NextRequest) => Promise<string | null>
): (handler: RouteHandler) => NextRouteHandler {
  return (handler: RouteHandler): NextRouteHandler => {
    return protectedRoute(async (request, context) => {
      const targetClassId = await getClassId(request);
      
      if (targetClassId) {
        // 管理员可以访问所有班级
        if (isAdminRole(context.user.role)) {
          return handler(request, context);
        }
        
        // 年段长可以访问自己管理的年级
        if (context.user.role === 'grade_leader') {
          // TODO: 检查年段长管理的年级
          return handler(request, context);
        }
        
        // 班主任只能访问自己的班级
        if (context.user.role === 'head_teacher') {
          if (context.user.classId !== targetClassId) {
            return NextResponse.json(
              {
                success: false,
                error: '您没有访问此班级的权限',
                code: 'CLASS_FORBIDDEN',
              },
              { status: 403 }
            );
          }
        }
      }
      
      return handler(request, context);
    });
  };
}
