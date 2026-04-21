/**
 * 统一认证中间件（增强版）
 * 
 * 特性：
 * 1. JWT 认证 + 会话缓存
 * 2. 角色权限检查
 * 3. 可选认证支持
 * 4. 性能优化（用户信息缓存）
 * 
 * @module lib/auth/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, ModuleType, Permission } from '@/types';
import { validateSession as validateJwtSession, extractTokens, getUserFromSession } from './session';
import { hasPermission, canAccessModule } from './permissions';
import { extractUserIdLegacy, validateSessionLegacy } from './auth-middleware';

// ==================== 类型定义 ====================

/**
 * 认证结果
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  code?: string;
  statusCode?: number;
}

/**
 * API 处理器类型
 */
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: {
    user: User;
    params?: Record<string, string | string[]>;
  }
) => Promise<NextResponse> | NextResponse;

/**
 * 认证选项
 */
export interface AuthOptions {
  /** 是否必须认证（默认 true） */
  required?: boolean;
  /** 允许的角色列表 */
  roles?: UserRole[];
  /** 需要的模块权限 */
  module?: ModuleType;
  /** 需要的具体权限 */
  permission?: Permission;
  /** 是否缓存用户信息（默认 true） */
  cacheUser?: boolean;
  /** 是否记录访问日志 */
  logAccess?: boolean;
}

// ==================== 用户缓存 ====================

interface CachedUser {
  user: User;
  expiresAt: number;
}

// 内存缓存（5分钟过期）
const userCache = new Map<string, CachedUser>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

/**
 * 从缓存获取用户
 */
function getCachedUser(userId: string): User | null {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  userCache.delete(userId);
  return null;
}

/**
 * 缓存用户信息
 */
function setCachedUser(user: User): void {
  userCache.set(user.id, {
    user,
    expiresAt: Date.now() + CACHE_TTL,
  });
  
  // 限制缓存大小
  if (userCache.size > 1000) {
    const firstKey = userCache.keys().next().value;
    if (firstKey) userCache.delete(firstKey);
  }
}

/**
 * 清除用户缓存
 */
export function clearUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

// ==================== 认证核心 ====================

/**
 * 验证请求认证
 */
export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthResult> {
  const { required = true, cacheUser = true } = options;
  
  // 判断认证来源：Bearer header 还是 Cookie
  const authHeader = request.headers.get('Authorization');
  const isBearerAuth = !!authHeader?.startsWith('Bearer ');

  // 提取 Token
  const { accessToken, refreshToken } = extractTokens(request);
  
  // JWT 认证
  if (accessToken) {
    // 尝试从缓存获取
    const decoded = decodeTokenSimple(accessToken);
    if (decoded && cacheUser) {
      const cachedUser = getCachedUser(decoded.userId);
      if (cachedUser) {
        return { success: true, user: cachedUser };
      }
    }
    
    // 验证 JWT 会话
    const sessionResult = await validateJwtSession(accessToken, refreshToken || undefined);
    
    if (sessionResult.success && sessionResult.user) {
      // 缓存用户信息
      if (cacheUser) {
        setCachedUser(sessionResult.user);
      }
      return { success: true, user: sessionResult.user };
    }
    
    // Bearer Token 认证失败：直接返回 401，不降级到 Cookie
    // 原因：小程序/H5 代理场景下 Cookie 不可靠，降级会导致"时好时坏"的玄学问题
    // 前端应有 401 自动刷新 token 逻辑来处理此情况
    if (isBearerAuth) {
      return {
        success: false,
        error: '登录已过期，请重新登录',
        code: 'TOKEN_EXPIRED',
        statusCode: 401,
      };
    }
  }
  
  // Cookie JWT 认证失败，降级到传统认证方式（向后兼容 Web 浏览器）
  const userId = extractUserIdLegacy(request);
  if (userId) {
    const legacyResult = await validateSessionLegacy(userId);
    if (legacyResult.success && legacyResult.user) {
      return { success: true, user: legacyResult.user };
    }
  }
  
  // 认证失败
  if (!required) {
    return { success: true }; // 可选认证，允许无用户
  }
  
  return {
    success: false,
    error: '未登录，请先登录',
    code: 'UNAUTHORIZED',
    statusCode: 401,
  };
}

/**
 * 简单解码 Token（不验证签名）
 */
function decodeTokenSimple(token: string): { userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// ==================== 权限检查 ====================

/**
 * 检查角色权限
 */
function checkRoles(user: User, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * 检查模块访问权限
 */
function checkModule(user: User, module: ModuleType): boolean {
  return canAccessModule(user.role, module);
}

/**
 * 检查具体权限
 */
function checkPermission(user: User, module: ModuleType, permission: Permission): boolean {
  return hasPermission(user.role, module, permission);
}

// ==================== 响应构造 ====================

/**
 * 创建认证错误响应
 */
function createErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: result.error || '认证失败',
      errorCode: result.code || 'AUTH_FAILED',
    },
    { status: result.statusCode || 401 }
  );
}

// ==================== 中间件装饰器 ====================

/**
 * 认证中间件（核心）
 * 
 * @example
 * ```ts
 * // 基础认证
 * export const GET = withAuth(async (request, { user }) => {
 *   return ok({ userId: user.id });
 * });
 * 
 * // 可选认证
 * export const GET = withAuth(handler, { required: false });
 * 
 * // 角色限制
 * export const GET = withAuth(handler, { roles: ['admin', 'principal'] });
 * 
 * // 模块权限
 * export const GET = withAuth(handler, { module: 'academic' });
 * ```
 */
export function withAuth<T = unknown>(
  handler: ApiHandler<T>,
  options: AuthOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // 认证检查
    const authResult = await authenticateRequest(request, options);
    
    if (!authResult.success) {
      return createErrorResponse(authResult);
    }
    
    // 可选认证时可能没有用户
    if (!authResult.user && options.required !== false) {
      return createErrorResponse({
        success: false,
        error: '用户信息获取失败',
        code: 'USER_NOT_FOUND',
        statusCode: 401,
      });
    }
    
    // 角色检查
    if (options.roles && authResult.user && !checkRoles(authResult.user, options.roles)) {
      return createErrorResponse({
        success: false,
        error: '权限不足，无法访问此资源',
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    }
    
    // 模块权限检查
    if (options.module && authResult.user && !checkModule(authResult.user, options.module)) {
      return createErrorResponse({
        success: false,
        error: '无权访问此模块',
        code: 'MODULE_FORBIDDEN',
        statusCode: 403,
      });
    }
    
    // 具体权限检查
    if (options.module && options.permission && authResult.user) {
      if (!checkPermission(authResult.user, options.module, options.permission)) {
        return createErrorResponse({
          success: false,
          error: '权限不足',
          code: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
    }
    
    // 记录访问日志
    if (options.logAccess && authResult.user) {
      console.log(`[Auth] ${authResult.user.name}(${authResult.user.role}) accessed ${request.nextUrl.pathname}`);
    }
    
    // 调用处理器
    return handler(request, {
      user: authResult.user!,
      params: undefined,
    });
  };
}

/**
 * 角色限制中间件
 * 
 * @example
 * export const GET = withRole(['admin', 'principal'])(handler);
 */
export function withRole(roles: UserRole[]) {
  return <T = unknown>(handler: ApiHandler<T>) => withAuth(handler, { roles });
}

/**
 * 管理员专用中间件
 */
export function withAdmin<T = unknown>(handler: ApiHandler<T>) {
  return withAuth(handler, { 
    roles: ['admin', 'principal', 'secretary'] as UserRole[],
    logAccess: true,
  });
}

/**
 * 教师专用中间件
 */
export function withTeacher<T = unknown>(handler: ApiHandler<T>) {
  return withAuth(handler, {
    roles: ['admin', 'principal', 'head_teacher', 'subject_teacher'] as UserRole[],
  });
}

/**
 * 班主任专用中间件
 */
export function withHeadTeacher<T = unknown>(handler: ApiHandler<T>) {
  return withAuth(handler, {
    roles: ['admin', 'principal', 'head_teacher'] as UserRole[],
  });
}

/**
 * 可选认证中间件（允许未登录访问）
 */
export function withOptionalAuth<T = unknown>(handler: ApiHandler<T>) {
  return withAuth(handler, { required: false });
}

/**
 * 动态路由参数支持
 * 
 * @example
 * export const GET = withAuthAndParams(handler);
 */
export function withAuthAndParams<T = unknown>(
  handler: (
    request: NextRequest,
    context: { user: User; params: Record<string, string | string[]> }
  ) => Promise<NextResponse> | NextResponse,
  options: AuthOptions = {}
): (
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> }
) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: Promise<Record<string, string | string[]>> }) => {
    const params = await context.params;
    
    // 认证检查
    const authResult = await authenticateRequest(request, options);
    
    if (!authResult.success) {
      return createErrorResponse(authResult);
    }
    
    if (!authResult.user) {
      return createErrorResponse({
        success: false,
        error: '用户信息获取失败',
        code: 'USER_NOT_FOUND',
        statusCode: 401,
      });
    }
    
    // 角色检查
    if (options.roles && !checkRoles(authResult.user, options.roles)) {
      return createErrorResponse({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    }
    
    return handler(request, { user: authResult.user, params });
  };
}

// ==================== 导出 ====================

export {
  getCachedUser,
  setCachedUser,
};
