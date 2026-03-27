/**
 * API 错误处理工具
 * 
 * 提供统一的 API 错误处理、响应标准化和错误中间件
 * 
 * @module lib/api-error
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

// ============================================
// 类型定义
// ============================================

export interface ApiError extends Error {
  /** HTTP 状态码 */
  statusCode: number;
  /** 错误代码 */
  code: string;
  /** 错误详情 */
  details?: Record<string, unknown>;
  /** 是否为已知错误 */
  isKnown: boolean;
}

export interface ErrorMiddlewareOptions {
  /** 是否记录错误日志 */
  logErrors?: boolean;
  /** 自定义错误处理 */
  onError?: (error: ApiError, request: Request) => void;
}

// ============================================
// API 错误类
// ============================================

/**
 * API 错误类
 */
export class ApiErrorClass extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;
  isKnown: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isKnown = true;
  }

  /**
   * 创建 400 错误
   */
  static badRequest(message: string, details?: Record<string, unknown>): ApiErrorClass {
    return new ApiErrorClass(400, 'BAD_REQUEST', message, details);
  }

  /**
   * 创建 401 错误
   */
  static unauthorized(message = '未授权访问'): ApiErrorClass {
    return new ApiErrorClass(401, 'UNAUTHORIZED', message);
  }

  /**
   * 创建 403 错误
   */
  static forbidden(message = '禁止访问'): ApiErrorClass {
    return new ApiErrorClass(403, 'FORBIDDEN', message);
  }

  /**
   * 创建 404 错误
   */
  static notFound(resource: string): ApiErrorClass {
    return new ApiErrorClass(404, 'NOT_FOUND', `${resource}不存在`);
  }

  /**
   * 创建 409 错误
   */
  static conflict(message: string, details?: Record<string, unknown>): ApiErrorClass {
    return new ApiErrorClass(409, 'CONFLICT', message, details);
  }

  /**
   * 创建 422 错误
   */
  static unprocessableEntity(message: string, details?: Record<string, unknown>): ApiErrorClass {
    return new ApiErrorClass(422, 'UNPROCESSABLE_ENTITY', message, details);
  }

  /**
   * 创建 429 错误
   */
  static tooManyRequests(message = '请求过于频繁'): ApiErrorClass {
    return new ApiErrorClass(429, 'TOO_MANY_REQUESTS', message);
  }

  /**
   * 创建 500 错误
   */
  static internalError(message = '服务器内部错误'): ApiErrorClass {
    return new ApiErrorClass(500, 'INTERNAL_ERROR', message);
  }

  /**
   * 创建 503 错误
   */
  static serviceUnavailable(message = '服务暂时不可用'): ApiErrorClass {
    return new ApiErrorClass(503, 'SERVICE_UNAVAILABLE', message);
  }
}

// ============================================
// 错误处理函数
// ============================================

/**
 * 判断是否为 API 错误
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiErrorClass ||
    (error instanceof Error && 'statusCode' in error && 'code' in error)
  );
}

/**
 * 将错误转换为 API 错误
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // 数据库错误
    if (error.message.includes('duplicate key')) {
      return ApiErrorClass.conflict('数据已存在');
    }
    if (error.message.includes('foreign key')) {
      return ApiErrorClass.badRequest('关联数据不存在');
    }
    if (error.message.includes('not found')) {
      return ApiErrorClass.notFound('资源');
    }

    return new ApiErrorClass(500, 'INTERNAL_ERROR', error.message, {
      originalError: error.message,
    });
  }

  return ApiErrorClass.internalError(String(error));
}

/**
 * 创建错误响应
 */
export function errorResponse<T = unknown>(
  error: ApiError,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  // 构造错误消息，包含代码
  const errorMessage = error.details 
    ? `${error.message} (${error.code})`
    : `${error.message} (${error.code})`;
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      message: error.message,
      meta: {
        code: error.code,
        timestamp: new Date().toISOString(),
        requestId,
        details: error.details,
      },
    },
    { status: error.statusCode }
  );
}

/**
 * 创建成功响应
 */
export function successResponse<T>(
  data: T,
  options: {
    message?: string;
    requestId?: string;
    meta?: Record<string, unknown>;
  } = {}
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message: options.message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options.requestId,
      ...options.meta,
    },
  });
}

// ============================================
// 错误中间件
// ============================================

/**
 * API 错误处理中间件
 */
export function withErrorHandler(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>,
  options: ErrorMiddlewareOptions = {}
) {
  const { logErrors = true, onError } = options;

  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const apiError = toApiError(error);

      // 记录错误日志
      if (logErrors) {
        console.error('[API Error]', {
          path: request.url,
          method: request.method,
          error: apiError,
          timestamp: new Date().toISOString(),
        });
      }

      // 调用自定义错误处理
      onError?.(apiError, request);

      // 返回错误响应
      return errorResponse(apiError);
    }
  };
}

// ============================================
// 输入验证
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

/**
 * 验证必填字段
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): ValidationResult {
  const errors: Record<string, string[]> = {};

  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors[field] = [`${field} 是必填字段`];
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 验证字段类型
 */
export function validateTypes(
  data: Record<string, unknown>,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
): ValidationResult {
  const errors: Record<string, string[]> = {};

  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    if (value === undefined || value === null) continue;

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== expectedType) {
      errors[field] = [`${field} 应该是 ${expectedType} 类型，实际是 ${actualType}`];
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 验证并抛出错误
 */
export function validateOrThrow(
  data: Record<string, unknown>,
  options: {
    required?: string[];
    types?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
  }
): void {
  const { required = [], types = {} } = options;

  const requiredResult = validateRequired(data, required);
  const typeResult = validateTypes(data, types);

  const allErrors = { ...requiredResult.errors, ...typeResult.errors };

  if (Object.keys(allErrors).length > 0) {
    throw ApiErrorClass.badRequest('输入验证失败', allErrors);
  }
}

// ============================================
// 请求 ID 生成
// ============================================

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// 导出便捷函数
// ============================================

export const ApiError = ApiErrorClass;

export default {
  ApiError: ApiErrorClass,
  isApiError,
  toApiError,
  errorResponse,
  successResponse,
  withErrorHandler,
  validateRequired,
  validateTypes,
  validateOrThrow,
  generateRequestId,
};
