/**
 * 高阶路由包装器 (Route Wrapper)
 *
 * 接管所有 API 路由的"脏活累活"：
 * 1. 统一鉴权拦截（复用现有 authenticateRequest）
 * 2. 角色权限拦截
 * 3. Zod 参数校验（Body / Query）
 * 4. 统一 try-catch + 统一 JSON 返回格式
 *
 * 前后端契约：{ success: true, data: ... } / { success: false, error: ... }
 *
 * @example
 * ```ts
 * // 最简单的 GET 接口
 * export const GET = withRoute(
 *   async (req, ctx, user) => {
 *     return await classService.getClasses();
 *   },
 *   { requireAuth: true }
 * );
 *
 * // 带分页 + 自定义元数据
 * export const GET = withRoute(
 *   async (req, ctx, user) => {
 *     const { data, total } = await classService.listClasses(filters);
 *     return { data, pagination: { page, pageSize, total, totalPages }, statistics };
 *   },
 *   { requireAuth: true }
 * );
 *
 * // POST 接口 + Zod 校验
 * const schema = z.object({ name: z.string().min(1) });
 * export const POST = withRoute(
 *   async (req, ctx, user) => {
 *     const body = ctx.body as z.infer<typeof schema>;
 *     return await classService.createClass(body);
 *   },
 *   { requireAuth: true, schema }
 * );
 *
 * // 动态路由 [id]
 * export const GET = withRoute(
 *   async (req, ctx, user) => {
 *     const { id } = ctx.params;
 *     return await classService.getClass(id);
 *   },
 *   { requireAuth: true }
 * );
 * ```
 *
 * @module lib/api/route-wrapper
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { ApiError } from '@/lib/api-error';
import { authenticateRequest, createAuthErrorResponse } from '@/lib/auth/auth-middleware';
import { checkModuleAccess, checkPermission } from '@/lib/auth/auth-middleware';
import { isAdminRole } from '@/lib/auth/permissions';
import type { User, UserRole, ModuleType, Permission } from '@/types';
import type { Pagination } from '@/lib/api';

// ==================== 类型定义 ====================

/** 解析后的路由参数 */
type RouteParams = Record<string, string | string[]>;

/** 路由处理器上下文 */
export interface RouteContext {
  /** 解析后的动态路由参数 */
  params: RouteParams;
  /** 已解析并校验的请求体（仅在配置了 schema 时可用） */
  body?: unknown;
}

/** 路由处理器返回值中可包含分页信息的结构 */
export interface PaginatedResult<T = unknown> {
  data: T[];
  pagination: Pagination;
  [key: string]: unknown;
}

/** 路由配置 */
export interface RouteConfig {
  /** 是否需要认证（默认 true） */
  requireAuth?: boolean;
  /** 允许的角色列表 */
  requiredRoles?: UserRole[];
  /** 需要的模块访问权限 */
  module?: ModuleType;
  /** 需要的具体权限 */
  permission?: Permission;
  /** Zod Schema：验证 POST/PUT/PATCH 的请求体 */
  schema?: ZodSchema;
  /** Zod Schema：验证 GET 的 URL 查询参数 */
  querySchema?: ZodSchema;
}

/** 路由处理器函数签名 */
type RouteHandler<T = unknown> = (
  req: NextRequest,
  ctx: RouteContext,
  user: User | null
) => Promise<T>;

/** Next.js App Router 的原生路由上下文 */
type NativeContext = { params: Promise<RouteParams> };

// ==================== 辅助函数 ====================

/**
 * 判断返回值是否为分页结果（含 data + pagination 字段）
 */
function isPaginatedResult(value: unknown): value is PaginatedResult {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.data) && typeof obj.pagination === 'object' && obj.pagination !== null;
}

// ==================== 核心包装器 ====================

/**
 * 高阶路由包装器
 *
 * 自动处理鉴权、参数校验、异常捕获和响应格式化，
 * 让业务处理器只需关注核心逻辑。
 */
export function withRoute<T = unknown>(handler: RouteHandler<T>, config: RouteConfig = {}) {
  return async (req: NextRequest, nativeCtx: NativeContext): Promise<NextResponse> => {
    try {
      let user: User | null = null;

      // ── 1. 统一鉴权拦截 ──────────────────────────────
      const needAuth = config.requireAuth !== false; // 默认需要认证
      if (needAuth || config.requiredRoles || config.module) {
        const authResult = await authenticateRequest(req);

        if (!authResult.success || !authResult.user) {
          throw new ApiError(
            authResult.error || '认证失败',
            authResult.statusCode || 401,
            undefined
          );
        }

        user = authResult.user;

        // ── 1a. 管理员绕过检查（与 protectedRoute 行为一致）──
        if (config.requiredRoles && !isAdminRole(user.role)) {
          const hasRole = config.requiredRoles.includes(user.role) ||
            user.additionalRoles?.some(r => config.requiredRoles!.includes(r as UserRole));

          if (!hasRole) {
            throw ApiError.Forbidden('您没有权限执行此操作');
          }
        }

        // ── 1b. 模块访问权限 ──
        if (config.module && !checkModuleAccess(user, config.module)) {
          throw ApiError.Forbidden(`您没有访问 ${config.module} 模块的权限`);
        }

        // ── 1c. 具体操作权限 ──
        if (config.module && config.permission && !checkPermission(user, config.module, config.permission)) {
          throw ApiError.Forbidden('您没有执行此操作的权限');
        }
      }

      // ── 2. 统一 Body 参数校验 (POST/PUT/PATCH) ──────
      let validatedBody: unknown;
      if (config.schema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        validatedBody = await req.json().catch(() => ({}));
        config.schema.parse(validatedBody); // 校验失败抛出 ZodError
      }

      // ── 3. 统一 Query 参数校验 (GET) ─────────────────
      if (config.querySchema && req.method === 'GET') {
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        config.querySchema.parse(queryParams); // 校验失败抛出 ZodError
      }

      // ── 4. 解析动态路由参数 ──────────────────────────
      const params = await nativeCtx.params;

      // ── 5. 执行核心业务逻辑 ──────────────────────────
      const result = await handler(req, { params, body: validatedBody }, user);

      // ── 6. 统一包装成功响应 ──────────────────────────
      // 如果 handler 已经返回 NextResponse，直接透传（向后兼容）
      if (result instanceof NextResponse) {
        return result;
      }

      // 如果是分页结果 { data, pagination, ...extra }，展开到顶层
      if (isPaginatedResult(result)) {
        const { data, pagination, ...extra } = result;
        return NextResponse.json({
          success: true,
          data,
          pagination,
          ...extra,
        });
      }

      // 普通返回值：包裹为 { success: true, data: ... }
      return NextResponse.json({
        success: true,
        data: result !== undefined ? result : null,
      });

    } catch (error: unknown) {
      // ── 7. 统一异常处理 ──────────────────────────────

      // Zod 校验错误
      if (error instanceof ZodError) {
        const issues = error.issues;
        const firstIssue = issues[0];
        const message = `${firstIssue.path.join('.')}: ${firstIssue.message}`;
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 }
        );
      }

      // 自定义业务错误
      if (error instanceof ApiError) {
        const response: Record<string, unknown> = {
          success: false,
          error: error.message,
        };
        if (error.data !== undefined) {
          response.data = error.data;
        }
        if (error.errorCode) {
          response.errorCode = error.errorCode;
        }
        return NextResponse.json(response, { status: error.statusCode });
      }

      // 未捕获的系统异常
      console.error(`[API Error] ${req.method} ${req.url}:`, error);
      return NextResponse.json(
        { success: false, error: '服务器内部错误，请稍后再试' },
        { status: 500 }
      );
    }
  };
}
