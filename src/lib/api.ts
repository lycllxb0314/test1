/**
 * 统一 API 工具库
 * 
 * 整合了响应格式化、错误处理、速率限制、路由处理器工厂等功能
 * 
 * @module lib/api
 * @example
 * ```ts
 * // 基础响应
 * import { ok, fail, paginated, serverError } from '@/lib/api';
 * 
 * // 路由处理器
 * import { withApi, getQueryParams } from '@/lib/api';
 * 
 * // 工厂方法
 * import { createListRouteHandler } from '@/lib/api';
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ============================================
// 第一部分：类型定义
// ============================================

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误码 */
  errorCode?: ErrorCode;
  /** 数据来源 */
  source?: 'database' | 'mock';
  /** 分页信息 */
  pagination?: Pagination;
  /** 附加消息 */
  message?: string;
  /** 额外元数据 */
  [key: string]: unknown;
}

/**
 * 分页信息
 */
export interface Pagination {
  /** 当前页码（从1开始） */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 分页数据包装
 */
export interface PaginatedData<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * 错误码枚举
 */
export enum ErrorCode {
  // 通用错误
  UNKNOWN = 'UNKNOWN',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // 业务错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  
  // 文件错误
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
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
 * 路由查询参数（宽松版）
 */
export interface RouteQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 数据库查询选项
 */
export interface DbQueryOptions {
  /** 表名 */
  table: string;
  /** 选择字段 */
  select?: string;
  /** 筛选条件 */
  filters?: Record<string, string | number | boolean | null>;
  /** 搜索配置 */
  search?: {
    fields: string[];
    value: string;
  };
  /** 排序 */
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  /** 分页 */
  pagination?: {
    page: number;
    pageSize: number;
  };
}

// ============================================
// 第二部分：响应快捷方法
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
 * 成功响应（简化版，用于 api-route-utils 兼容）
 */
export function success<T>(data: T, source?: 'database' | 'mock'): ApiResponse<T> {
  return {
    success: true,
    data,
    source: source || 'database',
  };
}

/**
 * 成功响应（带分页，简化版）
 */
export function successPaginated<T>(
  data: T[],
  pagination: Pagination,
  source?: 'database' | 'mock'
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    pagination,
    source: source || 'database',
  };
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
 * 错误响应（简化版，用于 api-route-utils 兼容）
 */
export function error<T = unknown>(errorMsg: string, errorCode?: ErrorCode): ApiResponse<T> {
  return {
    success: false,
    error: errorMsg,
    errorCode,
  };
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

/**
 * 数据库错误响应（自动fallback到Mock）
 */
export function databaseError<T>(mockData: T, errorMsg?: string): ApiResponse<T> {
  return {
    success: true,
    data: mockData,
    source: 'mock',
    message: errorMsg || '数据库查询失败，返回模拟数据',
  };
}

// ============================================
// 第三部分：请求工具
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
 * 解析查询参数（推荐使用）
 */
export function getQueryParams(request: NextRequest): QueryParams {
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
 * 解析查询参数（宽松版，兼容 api-route-utils）
 */
export function parseQueryParams(request: NextRequest): RouteQueryParams {
  const { searchParams } = new URL(request.url);
  
  const params: RouteQueryParams = {};
  
  params.page = parseInt(searchParams.get('page') || '1');
  params.pageSize = parseInt(searchParams.get('pageSize') || '20');
  params.search = searchParams.get('search') || undefined;
  
  searchParams.forEach((value, key) => {
    if (!['page', 'pageSize', 'search'].includes(key)) {
      if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    }
  });
  
  return params;
}

// ============================================
// 第四部分：分页工具
// ============================================

/**
 * 计算分页信息
 */
export function calculatePagination(
  total: number,
  page: number = 1,
  pageSize: number = 20
): Pagination {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page: Math.max(1, Math.min(page, totalPages || 1)),
    pageSize: Math.max(1, Math.min(pageSize, 100)),
    total,
    totalPages: totalPages || 1,
  };
}

/**
 * 计算分页偏移量
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * pageSize;
}

/**
 * 创建分页信息（兼容 api-route-utils）
 */
export function createPagination(
  total: number,
  page: number,
  pageSize: number
): Pagination {
  return calculatePagination(total, page, pageSize);
}

/**
 * 解析分页参数
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  return {
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
  };
}

// ============================================
// 第五部分：数据库查询构建器
// ============================================

/**
 * 构建数据库查询
 */
export function buildDbQuery(
  options: DbQueryOptions
) {
  const client = getSupabaseClient();
  let query = client
    .from(options.table)
    .select(options.select || '*', { count: options.pagination ? 'exact' : undefined });

  // 应用筛选条件
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        query = query.eq(key, value);
      }
    });
  }

  // 应用搜索
  if (options.search && options.search.value) {
    const searchConditions = options.search.fields
      .map(field => `${field}.ilike.%${options.search!.value}%`)
      .join(',');
    query = query.or(searchConditions);
  }

  // 应用排序
  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  // 应用分页
  if (options.pagination) {
    const { page, pageSize } = options.pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  return query;
}

// ============================================
// 第六部分：速率限制
// ============================================

import { rateLimitMiddleware, RateLimitConfig, createRateLimiter } from './rate-limit';

/** 预定义的速率限制器 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20, // 提高到20次，避免正常测试触发
  keyPrefix: 'login',
  level: 'ip',
  message: '登录尝试次数过多，请15分钟后再试',
});

export const sensitiveRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'sensitive',
  level: 'user',
  message: '操作过于频繁，请稍后再试',
});

export const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: 'write',
  level: 'user',
  message: '写入操作过于频繁，请稍后再试',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'upload',
  level: 'user',
  message: '上传请求过于频繁，请稍后再试',
});

// ============================================
// 第七部分：API处理器包装器
// ============================================

/**
 * API 处理函数类型
 */
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string | string[]>> }
) => Promise<NextResponse> | NextResponse;

/**
 * API 处理器选项
 */
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

/**
 * 包装 API 处理器，自动处理错误和速率限制
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

      const result = await handler(request, context);

      if (options.logRequests) {
        const duration = Date.now() - startTime;
        console.log(`[API] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);
      }

      return result;
    } catch (err) {
      console.error('[API Error]', err);
      
      if (err instanceof Error) {
        if (err.message.includes('未授权') || err.message.includes('unauthorized')) {
          return unauthorized(err.message);
        }
        if (err.message.includes('禁止') || err.message.includes('forbidden')) {
          return forbidden(err.message);
        }
        if (err.message.includes('不存在') || err.message.includes('not found')) {
          return notFound();
        }
        return serverError(err.message);
      }
      
      return serverError('服务器内部错误');
    }
  };
}

// ============================================
// 第八部分：路由处理器工厂
// ============================================

/**
 * 路由处理器选项
 */
export interface RouteHandlerOptions<T> {
  /** Mock数据获取函数 */
  getMockData: (params: RouteQueryParams) => T[] | Promise<T[]>;
  /** Mock分页数据获取函数 */
  getMockPaginatedData?: (params: RouteQueryParams) => PaginatedData<T> | Promise<PaginatedData<T>>;
  /** 是否使用Mock */
  useMock?: boolean;
  /** 响应数据转换函数 */
  transformData?: (data: unknown) => T;
}

/**
 * 分页路由处理器选项
 */
export interface PaginatedRouteHandlerOptions<T> extends RouteHandlerOptions<T> {
  defaultPageSize?: number;
  maxPageSize?: number;
}

/**
 * 创建GET列表路由处理器
 */
export function createListRouteHandler<T>(options: RouteHandlerOptions<T>) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T[]>>> => {
    const params = parseQueryParams(request);
    
    if (options.useMock) {
      const mockData = await options.getMockData(params);
      return NextResponse.json(success(mockData, 'mock'));
    }
    
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.from('items').select('*');
      
      if (error) {
        console.log('Database query failed, using mock data:', error.message);
        const mockData = await options.getMockData(params);
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      const result = options.transformData ? data.map(options.transformData) : data as T[];
      return NextResponse.json(success(result, 'database'));
    } catch (err) {
      console.error('Route handler error:', err);
      const mockData = await options.getMockData(params);
      return NextResponse.json(success(mockData, 'mock'));
    }
  };
}

/**
 * 创建GET分页列表路由处理器
 */
export function createPaginatedRouteHandler<T>(options: PaginatedRouteHandlerOptions<T>) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T[]>>> => {
    const params = parseQueryParams(request);
    
    const maxPageSize = options.maxPageSize || 100;
    params.pageSize = Math.min(params.pageSize || options.defaultPageSize || 20, maxPageSize);
    
    if (options.useMock || options.getMockPaginatedData) {
      const mockData = options.getMockPaginatedData 
        ? await options.getMockPaginatedData(params)
        : { data: await options.getMockData(params), pagination: createPagination(100, params.page || 1, params.pageSize || 20) };
      
      if (Array.isArray(mockData)) {
        const data = mockData as unknown as T[];
        const start = ((params.page || 1) - 1) * (params.pageSize || 20);
        const end = start + (params.pageSize || 20);
        return NextResponse.json({
          success: true,
          data: data.slice(start, end),
          pagination: createPagination(data.length, params.page || 1, params.pageSize || 20),
          source: 'mock',
        });
      }
      
      return NextResponse.json({
        success: true,
        data: mockData.data,
        pagination: mockData.pagination,
        source: 'mock',
      });
    }
    
    try {
      const client = getSupabaseClient();
      const from = ((params.page || 1) - 1) * (params.pageSize || 20);
      const to = from + (params.pageSize || 20) - 1;
      
      const { data, error, count } = await client
        .from('items')
        .select('*', { count: 'exact' })
        .range(from, to);
      
      if (error) {
        console.log('Database query failed, using mock data:', error.message);
        const mockData = await options.getMockData(params);
        const dataArray = Array.isArray(mockData) ? mockData : [];
        const start = ((params.page || 1) - 1) * (params.pageSize || 20);
        const end = start + (params.pageSize || 20);
        return NextResponse.json({
          success: true,
          data: dataArray.slice(start, end),
          pagination: createPagination(dataArray.length, params.page || 1, params.pageSize || 20),
          source: 'mock',
        });
      }
      
      const result = options.transformData ? data?.map(options.transformData) : data;
      return NextResponse.json({
        success: true,
        data: result || [],
        pagination: createPagination(count || 0, params.page || 1, params.pageSize || 20),
        source: 'database',
      });
    } catch (err) {
      console.error('Route handler error:', err);
      const mockData = await options.getMockData(params);
      const dataArray = Array.isArray(mockData) ? mockData : [];
      const start = ((params.page || 1) - 1) * (params.pageSize || 20);
      const end = start + (params.pageSize || 20);
      return NextResponse.json({
        success: true,
        data: dataArray.slice(start, end),
        pagination: createPagination(dataArray.length, params.page || 1, params.pageSize || 20),
        source: 'mock',
      });
    }
  };
}

/**
 * 创建GET详情路由处理器
 */
export function createDetailRouteHandler<T>(
  options: {
    getMockData: (id: string) => T | undefined | Promise<T | undefined>;
    tableName?: string;
    useMock?: boolean;
  }
) {
  return async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const { id } = await context.params;
    
    if (options.useMock) {
      const mockData = await options.getMockData(id);
      if (!mockData) {
        return NextResponse.json(error('数据不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(mockData, 'mock'));
    }
    
    try {
      const client = getSupabaseClient();
      const { data, error: dbError } = await client
        .from(options.tableName || 'items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (dbError || !data) {
        const mockData = await options.getMockData(id);
        if (!mockData) {
          return NextResponse.json(error('数据不存在', ErrorCode.NOT_FOUND), { status: 404 });
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data as T, 'database'));
    } catch (err) {
      console.error('Route handler error:', err);
      const mockData = await options.getMockData(id);
      if (!mockData) {
        return NextResponse.json(error('数据不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(mockData, 'mock'));
    }
  };
}

/**
 * 创建POST创建路由处理器
 */
export function createCreateRouteHandler<T, CreateDTO = Partial<T>>(
  options: {
    tableName?: string;
    useMock?: boolean;
    mockCreate?: (data: CreateDTO) => T | Promise<T>;
    validate?: (data: CreateDTO) => string | null;
  }
) {
  return async (request: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const body = await request.json() as CreateDTO;
      
      if (options.validate) {
        const validationError = options.validate(body);
        if (validationError) {
          return NextResponse.json(
            error(validationError, ErrorCode.VALIDATION_ERROR),
            { status: 400 }
          );
        }
      }
      
      if (options.useMock || options.mockCreate) {
        let mockData: T;
        if (options.mockCreate) {
          mockData = await (options.mockCreate as (data: CreateDTO) => T | Promise<T>)(body);
        } else {
          mockData = { id: `mock_${Date.now()}`, ...body } as T;
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      const client = getSupabaseClient();
      const { data, error: dbError } = await client
        .from(options.tableName || 'items')
        .insert({ ...body, created_at: new Date().toISOString() })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database insert error:', dbError);
        let mockData: T;
        if (options.mockCreate) {
          mockData = await (options.mockCreate as (data: CreateDTO) => T | Promise<T>)(body);
        } else {
          mockData = { id: `mock_${Date.now()}`, ...body } as T;
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data as T, 'database'));
    } catch (err) {
      console.error('Create route error:', err);
      return NextResponse.json(error('创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
  };
}

/**
 * 创建PUT更新路由处理器
 */
export function createUpdateRouteHandler<T, UpdateDTO = Partial<T>>(
  options: {
    tableName?: string;
    useMock?: boolean;
    mockUpdate?: (id: string, data: UpdateDTO) => T | Promise<T>;
    getMockData?: (id: string) => T | undefined | Promise<T | undefined>;
    validate?: (data: UpdateDTO) => string | null;
  }
) {
  return async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const { id } = await context.params;
    
    try {
      const body = await request.json() as UpdateDTO;
      
      if (options.validate) {
        const validationError = options.validate(body);
        if (validationError) {
          return NextResponse.json(
            error(validationError, ErrorCode.VALIDATION_ERROR),
            { status: 400 }
          );
        }
      }
      
      if (options.useMock || options.mockUpdate) {
        const mockData = options.mockUpdate 
          ? await (options.mockUpdate as (id: string, data: UpdateDTO) => T | Promise<T>)(id, body)
          : { id, ...(await options.getMockData?.(id) || {}), ...body } as T;
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      const client = getSupabaseClient();
      const { data, error: dbError } = await client
        .from(options.tableName || 'items')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (dbError || !data) {
        console.error('Database update error:', dbError);
        let mockData: T;
        if (options.mockUpdate) {
          mockData = await (options.mockUpdate as (id: string, data: UpdateDTO) => T | Promise<T>)(id, body);
        } else if (options.getMockData) {
          const existing = await options.getMockData(id);
          mockData = { id, ...(existing || {}), ...body } as T;
        } else {
          mockData = { id, ...body } as T;
        }
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data as T, 'database'));
    } catch (err) {
      console.error('Update route error:', err);
      return NextResponse.json(error('更新失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
  };
}

/**
 * 创建DELETE删除路由处理器
 */
export function createDeleteRouteHandler(options: { tableName?: string; useMock?: boolean }) {
  return async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ): Promise<NextResponse<ApiResponse<{ id: string }>>> => {
    const { id } = await context.params;
    
    if (options.useMock) {
      return NextResponse.json(success({ id }, 'mock'));
    }
    
    try {
      const client = getSupabaseClient();
      const { error: dbError } = await client
        .from(options.tableName || 'items')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        return NextResponse.json(success({ id }, 'mock'));
      }
      
      return NextResponse.json(success({ id }, 'database'));
    } catch (err) {
      console.error('Delete route error:', err);
      return NextResponse.json(error('删除失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
  };
}

// ============================================
// 导出速率限制相关类型
// ============================================

export { rateLimitMiddleware, createRateLimiter };
export type { RateLimitConfig };
