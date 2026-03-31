/**
 * API 路由装饰器工厂
 * 
 * 强制架构一致性：
 * 1. 必须通过 Service 层访问数据
 * 2. 禁止在 API 层直接操作数据库
 * 3. 统一响应格式
 * 
 * @module lib/api/decorators
 */

import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/types';
import { withAuth, type AuthOptions, type ApiHandler } from '@/lib/auth/middleware';
import { ok, fail, serverError, paginated, type ApiResponse, type Pagination, ErrorCode } from '@/lib/api';

// ==================== 类型定义 ====================

/**
 * 分页参数
 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 查询参数
 */
export interface QueryParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters: Record<string, string>;
}

/**
 * API 路由选项
 */
export interface RouteOptions extends AuthOptions {
  /** 是否缓存响应 */
  cache?: boolean;
  /** 缓存时间（秒） */
  cacheTTL?: number;
  /** 是否记录请求日志 */
  logRequest?: boolean;
  /** 请求体验证 schema（Zod） */
  validateBody?: unknown;
  /** 是否允许 Mock 降级 */
  allowMockFallback?: boolean;
}

/**
 * 分页路由选项
 */
export interface ListRouteOptions<T> extends RouteOptions {
  /** 默认每页数量 */
  defaultPageSize?: number;
  /** 最大每页数量 */
  maxPageSize?: number;
  /** 数据转换函数 */
  transform?: (item: unknown) => T;
  /** 统计计算函数 */
  statistics?: (items: T[], total: number) => Record<string, unknown>;
}

/**
 * 详情路由选项
 */
export interface DetailRouteOptions<T> extends RouteOptions {
  /** 数据转换函数 */
  transform?: (item: unknown) => T;
}

/**
 * 创建路由选项
 */
export interface CreateRouteOptions<T, D = unknown> extends RouteOptions {
  /** 验证函数 */
  validate?: (data: D) => string | null;
  /** 数据转换函数 */
  transform?: (item: unknown) => T;
}

// ==================== 查询参数解析 ====================

/**
 * 解析分页参数
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    pageSize: Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))),
  };
}

/**
 * 解析完整查询参数
 */
export function parseQueryParams(request: NextRequest): QueryParams {
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

// ==================== 响应构造器 ====================

/**
 * API 响应构造器
 */
export class ApiResponseBuilder {
  /**
   * 成功响应
   */
  static success<T>(data: T, meta?: Partial<ApiResponse<T>>): NextResponse<ApiResponse<T>> {
    return NextResponse.json({ success: true, data, ...meta });
  }
  
  /**
   * 分页响应
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
    meta?: Record<string, unknown>
  ): NextResponse<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / pageSize);
    const pagination: Pagination = {
      page: Math.max(1, Math.min(page, totalPages || 1)),
      pageSize: Math.max(1, pageSize),
      total,
      totalPages: totalPages || 1,
    };
    
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
  static error(message: string, code?: ErrorCode, status: number = 400): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
        errorCode: code,
      },
      { status }
    );
  }
  
  /**
   * 未找到响应
   */
  static notFound(resource: string = '资源'): NextResponse<ApiResponse> {
    return this.error(`${resource}不存在`, ErrorCode.NOT_FOUND, 404);
  }
  
  /**
   * 验证错误响应
   */
  static validationError(message: string): NextResponse<ApiResponse> {
    return this.error(message, ErrorCode.VALIDATION_ERROR, 400);
  }
}

// ==================== 路由工厂 ====================

/**
 * 创建 GET 列表路由处理器
 * 
 * @example
 * ```ts
 * // 在 Service 层实现查询逻辑
 * export const GET = createListRoute({
 *   serviceMethod: classService.getClasses,
 *   options: { roles: ['admin', 'head_teacher'] }
 * });
 * ```
 */
export function createListRoute<T>(config: {
  /** Service 方法（必须通过 Service 层） */
  serviceMethod: (params: QueryParams, user?: User) => Promise<{ data: T[]; total: number }>;
  /** 路由选项 */
  options?: ListRouteOptions<T>;
}) {
  const { serviceMethod, options = {} } = config;
  
  const handler = async (request: NextRequest, context: { user: User }) => {
    const params = parseQueryParams(request);
    
    // 限制页面大小
    const maxPageSize = options.maxPageSize || 100;
    params.pageSize = Math.min(params.pageSize, maxPageSize);
    
    try {
      // 调用 Service 层
      const { data, total } = await serviceMethod(params, context.user);
      
      // 数据转换
      const transformed = options.transform ? data.map(options.transform) : data;
      
      // 统计计算
      const statistics = options.statistics?.(transformed, total);
      
      return ApiResponseBuilder.paginated(
        transformed,
        total,
        params.page,
        params.pageSize,
        statistics ? { statistics } : undefined
      );
    } catch (error) {
      console.error('[API] List route error:', error);
      return ApiResponseBuilder.error(
        error instanceof Error ? error.message : '查询失败',
        ErrorCode.INTERNAL_ERROR,
        500
      );
    }
  };
  
  return withAuth(handler, options);
}

/**
 * 创建 GET 详情路由处理器
 * 
 * @example
 * ```ts
 * export const GET = createDetailRoute({
 *   serviceMethod: classService.getClass,
 *   options: { cache: true, cacheTTL: 60 }
 * });
 * ```
 */
export function createDetailRoute<T>(config: {
  /** Service 方法 */
  serviceMethod: (id: string, user?: User) => Promise<T | null>;
  /** 资源名称（用于错误提示） */
  resourceName?: string;
  /** 路由选项 */
  options?: DetailRouteOptions<T>;
}) {
  const { serviceMethod, resourceName = '资源', options = {} } = config;
  
  const handler = async (
    request: NextRequest,
    context: { user: User; params?: Record<string, string | string[]> }
  ) => {
    const id = context.params?.id as string;
    
    if (!id) {
      return ApiResponseBuilder.error('缺少资源ID', ErrorCode.BAD_REQUEST, 400);
    }
    
    try {
      const data = await serviceMethod(id, context.user);
      
      if (!data) {
        return ApiResponseBuilder.notFound(resourceName);
      }
      
      const transformed = options.transform ? options.transform(data) : data;
      
      return ApiResponseBuilder.success(transformed);
    } catch (error) {
      console.error('[API] Detail route error:', error);
      return ApiResponseBuilder.error(
        error instanceof Error ? error.message : '查询失败',
        ErrorCode.INTERNAL_ERROR,
        500
      );
    }
  };
  
  return withAuth(handler, options);
}

/**
 * 创建 POST 创建路由处理器
 * 
 * @example
 * ```ts
 * export const POST = createCreateRoute({
 *   serviceMethod: classService.createClass,
 *   validate: (data) => !data.name ? '名称不能为空' : null
 * });
 * ```
 */
export function createCreateRoute<T, D = Partial<T>>(config: {
  serviceMethod: (data: D, user: User) => Promise<T>;
  validate?: (data: D) => string | null;
  options?: CreateRouteOptions<T, D>;
}) {
  const { serviceMethod, validate, options = {} } = config;
  
  const handler = async (request: NextRequest, context: { user: User }) => {
    try {
      const body = await request.json() as D;
      
      // 验证
      if (validate) {
        const error = validate(body);
        if (error) {
          return ApiResponseBuilder.validationError(error);
        }
      }
      
      // 调用 Service 层
      const data = await serviceMethod(body, context.user);
      
      const transformed = options.transform ? options.transform(data) : data;
      
      return ApiResponseBuilder.success(transformed);
    } catch (error) {
      console.error('[API] Create route error:', error);
      return ApiResponseBuilder.error(
        error instanceof Error ? error.message : '创建失败',
        ErrorCode.INTERNAL_ERROR,
        500
      );
    }
  };
  
  return withAuth(handler, options);
}

/**
 * 创建 PUT 更新路由处理器
 */
export function createUpdateRoute<T, D = Partial<T>>(config: {
  serviceMethod: (id: string, data: D, user: User) => Promise<T | null>;
  validate?: (data: D) => string | null;
  resourceName?: string;
  options?: CreateRouteOptions<T, D>;
}) {
  const { serviceMethod, validate, resourceName = '资源', options = {} } = config;
  
  const handler = async (
    request: NextRequest,
    context: { user: User; params?: Record<string, string | string[]> }
  ) => {
    const id = context.params?.id as string;
    
    if (!id) {
      return ApiResponseBuilder.error('缺少资源ID', ErrorCode.BAD_REQUEST, 400);
    }
    
    try {
      const body = await request.json() as D;
      
      if (validate) {
        const error = validate(body);
        if (error) {
          return ApiResponseBuilder.validationError(error);
        }
      }
      
      const data = await serviceMethod(id, body, context.user);
      
      if (!data) {
        return ApiResponseBuilder.notFound(resourceName);
      }
      
      const transformed = options.transform ? options.transform(data) : data;
      
      return ApiResponseBuilder.success(transformed);
    } catch (error) {
      console.error('[API] Update route error:', error);
      return ApiResponseBuilder.error(
        error instanceof Error ? error.message : '更新失败',
        ErrorCode.INTERNAL_ERROR,
        500
      );
    }
  };
  
  return withAuth(handler, options);
}

/**
 * 创建 DELETE 删除路由处理器
 */
export function createDeleteRoute(config: {
  serviceMethod: (id: string, user: User) => Promise<boolean>;
  resourceName?: string;
  options?: RouteOptions;
}) {
  const { serviceMethod, resourceName = '资源', options = {} } = config;
  
  const handler = async (
    request: NextRequest,
    context: { user: User; params?: Record<string, string | string[]> }
  ) => {
    const id = context.params?.id as string;
    
    if (!id) {
      return ApiResponseBuilder.error('缺少资源ID', ErrorCode.BAD_REQUEST, 400);
    }
    
    try {
      const success = await serviceMethod(id, context.user);
      
      if (!success) {
        return ApiResponseBuilder.notFound(resourceName);
      }
      
      return ApiResponseBuilder.success({ id });
    } catch (error) {
      console.error('[API] Delete route error:', error);
      return ApiResponseBuilder.error(
        error instanceof Error ? error.message : '删除失败',
        ErrorCode.INTERNAL_ERROR,
        500
      );
    }
  };
  
  return withAuth(handler, options);
}
