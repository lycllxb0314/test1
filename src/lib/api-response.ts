/**
 * 统一API响应工具库
 * 
 * 设计原则：
 * 1. 统一响应格式 - 所有API返回相同的结构
 * 2. 统一错误处理 - 标准化错误码和消息
 * 3. 统一数据源标识 - 明确数据来自数据库还是Mock
 * 4. 类型安全 - 完整的TypeScript支持
 */

import { NextResponse } from 'next/server';

// ============================================
// 核心类型定义
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
  /** 额外元数据（如统计信息） */
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
 * 错误码对应的消息
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN]: '未知错误',
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.FORBIDDEN]: '禁止访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCode.DUPLICATE_ERROR]: '数据重复',
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [ErrorCode.RESOURCE_CONFLICT]: '资源冲突',
  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.DATABASE_CONNECTION_ERROR]: '数据库连接失败',
  [ErrorCode.FILE_UPLOAD_ERROR]: '文件上传失败',
  [ErrorCode.FILE_NOT_FOUND]: '文件不存在',
};

// ============================================
// 响应构建器
// ============================================

/**
 * API响应构建器类
 */
export class ApiResponseBuilder<T> {
  private response: ApiResponse<T> = {
    success: true,
  };

  /** 设置成功数据 */
  data(data: T): this {
    this.response.success = true;
    this.response.data = data;
    return this;
  }

  /** 设置错误信息 */
  error(error: string, errorCode?: ErrorCode): this {
    this.response.success = false;
    this.response.error = error;
    if (errorCode) {
      this.response.errorCode = errorCode;
    }
    return this;
  }

  /** 设置数据来源 */
  source(source: 'database' | 'mock'): this {
    this.response.source = source;
    return this;
  }

  /** 设置分页信息 */
  pagination(pagination: Pagination): this {
    this.response.pagination = pagination;
    return this;
  }

  /** 设置消息 */
  message(message: string): this {
    this.response.message = message;
    return this;
  }

  /** 构建响应对象 */
  build(): ApiResponse<T> {
    return this.response;
  }

  /** 构建NextResponse */
  toNextResponse(status?: number): NextResponse {
    const statusCode = status ?? (this.response.success ? 200 : 400);
    return NextResponse.json(this.response, { status: statusCode });
  }
}

// ============================================
// 快捷方法
// ============================================

/**
 * 成功响应
 */
export function success<T>(data: T, source?: 'database' | 'mock'): ApiResponse<T> {
  return new ApiResponseBuilder<T>().data(data).source(source || 'database').build();
}

/**
 * 成功响应（带分页）
 */
export function successPaginated<T>(
  data: T[],
  pagination: Pagination,
  source?: 'database' | 'mock'
): ApiResponse<T[]> {
  return new ApiResponseBuilder<T[]>()
    .data(data)
    .pagination(pagination)
    .source(source || 'database')
    .build();
}

/**
 * 错误响应
 */
export function error<T = unknown>(errorMsg: string, errorCode?: ErrorCode): ApiResponse<T> {
  return new ApiResponseBuilder<T>().error(errorMsg, errorCode).build();
}

/**
 * 数据库错误响应（自动fallback到Mock）
 */
export function databaseError<T>(mockData: T, errorMsg?: string): ApiResponse<T> {
  return new ApiResponseBuilder<T>()
    .data(mockData)
    .source('mock')
    .message(errorMsg || '数据库查询失败，返回模拟数据')
    .build();
}

/**
 * 未找到响应
 */
export function notFound<T = unknown>(resource?: string): ApiResponse<T> {
  return error<T>(
    `${resource || '资源'}不存在`,
    ErrorCode.NOT_FOUND
  );
}

/**
 * 验证错误响应
 */
export function validationError(message: string): ApiResponse {
  return error(message, ErrorCode.VALIDATION_ERROR);
}

/**
 * 未授权响应
 */
export function unauthorized(): ApiResponse {
  return error('未授权访问', ErrorCode.UNAUTHORIZED);
}

/**
 * 禁止访问响应
 */
export function forbidden(): ApiResponse {
  return error('禁止访问', ErrorCode.FORBIDDEN);
}

// ============================================
// 分页工具
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

// ============================================
// 查询参数解析
// ============================================

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

/**
 * 解析筛选参数
 */
export function parseFilterParams(
  searchParams: URLSearchParams,
  allowedFields: string[]
): Record<string, string> {
  const filters: Record<string, string> = {};
  
  for (const field of allowedFields) {
    const value = searchParams.get(field);
    if (value) {
      filters[field] = value;
    }
  }
  
  return filters;
}

/**
 * 解析搜索参数
 */
export function parseSearchParams(searchParams: URLSearchParams): {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} {
  return {
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  };
}

// ============================================
// API处理器包装器
// ============================================

/**
 * API处理器选项
 */
export interface ApiHandlerOptions {
  /** 是否允许Mock fallback */
  allowMockFallback?: boolean;
  /** 需要认证 */
  requireAuth?: boolean;
  /** 允许的角色 */
  allowedRoles?: string[];
}

/**
 * 包装API处理器，统一错误处理
 */
export function withErrorHandler<T>(
  handler: () => Promise<ApiResponse<T>>,
  options: ApiHandlerOptions = {}
): () => Promise<ApiResponse<T>> {
  return async () => {
    try {
      return await handler();
    } catch (err) {
      console.error('API处理错误:', err);
      
      const errorMsg = err instanceof Error ? err.message : '服务器内部错误';
      return error<T>(errorMsg, ErrorCode.INTERNAL_ERROR);
    }
  };
}

// ============================================
// 导出所有
// ============================================

// 类型已在前方定义并导出，此处不再重复导出
