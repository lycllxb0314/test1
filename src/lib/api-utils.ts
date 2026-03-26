/**
 * API 工具函数 - 简化 API 路由编写
 * 
 * 统一的响应格式、错误处理、速率限制
 * 
 * @module lib/api-utils
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  ApiResponse, 
  Pagination, 
  ErrorCode,
  calculatePagination,
  calculateOffset,
  parsePaginationParams,
} from './api-response';
import { rateLimitMiddleware, RateLimitConfig, createRateLimiter } from './rate-limit';

// ============================================
// 类型定义
// ============================================

/**
 * API 处理函数类型（宽松版本，允许中间件返回通用响应）
 */
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string | string[]>> }
) => Promise<NextResponse> | NextResponse;

/** API 处理器选项 */
export interface ApiOptions {
  /** 速率限制配置 */
  rateLimit?: RateLimitConfig | boolean;
  /** 需要认证 */
  requireAuth?: boolean;
  /** 允许的角色 */
  allowedRoles?: string[];
  /** 是否记录请求日志 */
  logRequests?: boolean;
}

// ============================================
// 响应快捷方法
// ============================================

/**
 * 成功响应
 */
export function ok<T>(data: T, meta?: Partial<ApiResponse<T>>): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...meta,
  });
}

/**
 * 成功响应（带分页）
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number = 1,
  pageSize: number = 20,
  meta?: Partial<ApiResponse<T[]>>
): NextResponse<ApiResponse<T[]>> {
  const pagination = calculatePagination(total, page, pageSize);
  return NextResponse.json({
    success: true,
    data,
    pagination,
    ...meta,
  });
}

/**
 * 错误响应
 */
export function fail(
  error: string, 
  code?: ErrorCode, 
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      errorCode: code,
    },
    { status }
  );
}

/**
 * 未授权响应
 */
export function unauthorized(message: string = '未授权访问'): NextResponse<ApiResponse> {
  return fail(message, ErrorCode.UNAUTHORIZED, 401);
}

/**
 * 禁止访问响应
 */
export function forbidden(message: string = '禁止访问'): NextResponse<ApiResponse> {
  return fail(message, ErrorCode.FORBIDDEN, 403);
}

/**
 * 未找到响应
 */
export function notFound(resource: string = '资源'): NextResponse<ApiResponse> {
  return fail(`${resource}不存在`, ErrorCode.NOT_FOUND, 404);
}

/**
 * 服务器错误响应
 */
export function serverError(error: string | Error): NextResponse<ApiResponse> {
  const message = error instanceof Error ? error.message : error;
  console.error('[API Error]', error);
  return fail(message, ErrorCode.INTERNAL_ERROR, 500);
}

/**
 * 验证错误响应
 */
export function validationError(message: string): NextResponse<ApiResponse> {
  return fail(message, ErrorCode.VALIDATION_ERROR, 400);
}

// ============================================
// 请求工具
// ============================================

/**
 * 获取请求体 JSON（带错误处理）
 */
export async function getJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * 解析查询参数
 */
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    filters: Object.fromEntries(
      Array.from(searchParams.entries()).filter(
        ([key]) => !['page', 'pageSize', 'search', 'sortBy', 'sortOrder'].includes(key)
      )
    ),
  };
}

/**
 * 计算分页偏移
 */
export { calculateOffset };

// ============================================
// API 处理器包装器
// ============================================

/**
 * 包装 API 处理器，自动处理错误和速率限制
 * 
 * @example
 * ```ts
 * export const GET = withApi(async (request) => {
 *   const data = await fetchData();
 *   return ok(data);
 * }, { rateLimit: true });
 * ```
 */
export function withApi<T>(
  handler: ApiHandler<T>,
  options: ApiOptions = {}
): ApiHandler<T> {
  return async (request, context) => {
    const startTime = Date.now();
    
    try {
      // 速率限制
      if (options.rateLimit) {
        const rateLimitResult = await rateLimitMiddleware(request);
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // 执行处理器
      const result = await handler(request, context);

      // 请求日志
      if (options.logRequests) {
        const duration = Date.now() - startTime;
        console.log(`[API] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);
      }

      return result;
    } catch (error) {
      console.error('[API Error]', error);
      
      // 判断错误类型
      if (error instanceof Error) {
        if (error.message.includes('未授权') || error.message.includes('unauthorized')) {
          return unauthorized(error.message);
        }
        if (error.message.includes('禁止') || error.message.includes('forbidden')) {
          return forbidden(error.message);
        }
        if (error.message.includes('不存在') || error.message.includes('not found')) {
          return notFound();
        }
        return serverError(error.message);
      }
      
      return serverError('服务器内部错误');
    }
  };
}

/**
 * 创建带有预设配置的 API 处理器工厂
 */
export function createApiFactory(defaultOptions: ApiOptions) {
  return <T>(handler: ApiHandler<T>, options?: ApiOptions) => 
    withApi(handler, { ...defaultOptions, ...options });
}

// ============================================
// 预定义的速率限制器
// ============================================

/** 登录速率限制器 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5,
  keyPrefix: 'login',
  level: 'ip',
  message: '登录尝试次数过多，请15分钟后再试',
});

/** 敏感操作速率限制器 */
export const sensitiveRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 10,
  keyPrefix: 'sensitive',
  level: 'user',
  message: '操作过于频繁，请稍后再试',
});

/** 写入操作速率限制器 */
export const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 30,
  keyPrefix: 'write',
  level: 'user',
  message: '写入操作过于频繁，请稍后再试',
});

/** 上传速率限制器 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 20,
  keyPrefix: 'upload',
  level: 'user',
  message: '上传请求过于频繁，请稍后再试',
});

// ============================================
// 导出
// ============================================

export { calculatePagination, parsePaginationParams };
export type { ApiResponse, Pagination };
