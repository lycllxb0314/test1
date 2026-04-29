/**
 * 标准 API 错误类
 *
 * 在业务逻辑任何地方抛出此错误，路由包装器 (withRoute) 都能捕获
 * 并自动转化为正确的 HTTP 状态码和统一 JSON 格式。
 *
 * @example
 * ```ts
 * // 在 Service 层抛出
 * throw ApiError.NotFound('班级不存在');
 *
 * // 在 API Route 中抛出
 * throw ApiError.Forbidden('您没有权限执行此操作');
 *
 * // 自定义状态码
 * throw new ApiError('操作过于频繁', 429);
 * ```
 *
 * @module lib/api-error
 */

import { ErrorCode } from '@/lib/api';
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly data?: unknown;
  public readonly errorCode?: ErrorCode;
  /** 错误码字符串（兼容旧代码） */
  public readonly code: string;
  /** 错误详情（兼容旧代码） */
  public readonly details?: unknown;
  /** 是否为已知业务错误 */
  public readonly isKnown: boolean = true;

  constructor(
    message: string,
    statusCode: number = 400,
    data?: unknown,
    errorCode?: ErrorCode
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    this.details = data;
    this.errorCode = errorCode;
    this.code = errorCode ?? 'UNKNOWN';

    // 维持原型链（TypeScript 继承 Error 的常见要求）
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** 400 - 参数错误 */
  static BadRequest(message: string = '参数错误', data?: unknown): ApiError {
    return new ApiError(message, 400, data, ErrorCode.BAD_REQUEST);
  }

  /** 小写别名（兼容旧测试代码） */
  static badRequest = ApiError.BadRequest;

  /** 401 - 未认证 */
  static Unauthorized(message: string = '请先登录'): ApiError {
    return new ApiError(message, 401, undefined, ErrorCode.UNAUTHORIZED);
  }

  /** 小写别名（兼容旧测试代码） */
  static unauthorized = ApiError.Unauthorized;

  /** 403 - 无权限 */
  static Forbidden(message: string = '无权访问'): ApiError {
    return new ApiError(message, 403, undefined, ErrorCode.FORBIDDEN);
  }

  /** 404 - 资源不存在 */
  static NotFound(message: string = '资源不存在'): ApiError {
    // 兼容旧测试：如果 message 不是以"不存在"结尾，自动拼接
    if (!message.endsWith('不存在')) {
      return new ApiError(`${message}不存在`, 404, undefined, ErrorCode.NOT_FOUND);
    }
    return new ApiError(message, 404, undefined, ErrorCode.NOT_FOUND);
  }

  /** 小写别名（兼容旧测试代码） */
  static notFound = ApiError.NotFound;

  /** 409 - 资源冲突（重复创建等） */
  static Conflict(message: string = '资源已存在', data?: unknown): ApiError {
    return new ApiError(message, 409, data, ErrorCode.RESOURCE_CONFLICT);
  }

  /** 422 - 数据验证失败 */
  static Validation(message: string = '数据验证失败', data?: unknown): ApiError {
    return new ApiError(message, 422, data, ErrorCode.VALIDATION_ERROR);
  }

  /** 500 - 服务器内部错误 */
  static Internal(message: string = '服务器内部错误'): ApiError {
    return new ApiError(message, 500, undefined, ErrorCode.INTERNAL_ERROR);
  }
}

// ==================== 兼容旧测试的辅助函数 ====================

/**
 * 类型守卫：判断是否为 ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 将任意错误转换为 ApiError
 *
 * - 已是 ApiError → 原样返回
 * - 数据库唯一约束冲突 → 409 Conflict
 * - 其他 Error → 500 Internal
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // 数据库唯一约束冲突
    if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('violates unique')) {
      return ApiError.Conflict('数据已存在，请检查是否重复提交');
    }

    return new ApiError(error.message, 500, undefined, ErrorCode.INTERNAL_ERROR);
  }

  return ApiError.Internal('未知错误');
}

/**
 * 从 ApiError 生成 NextResponse 错误响应
 */
export function errorResponse(error: ApiError): NextResponse {
  const body: Record<string, unknown> = {
    success: false,
    error: error.message,
    code: error.code,
  };
  if (error.data !== undefined) {
    body.data = error.data;
  }
  return NextResponse.json(body, { status: error.statusCode });
}

/**
 * 生成成功响应
 */
export function successResponse<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data });
}

/**
 * 验证必填字段
 */
export function validateRequired(
  obj: Record<string, unknown>,
  fields: string[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errors[field] = `${field} 为必填项`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 验证字段类型
 */
export function validateTypes(
  obj: Record<string, unknown>,
  schema: Record<string, string>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = obj[field];
    if (value === undefined || value === null) continue; // 跳过未提供的字段
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== expectedType) {
      errors[field] = `${field} 应为 ${expectedType}，实际为 ${actualType}`;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * 验证并抛出错误
 */
export function validateOrThrow(
  obj: Record<string, unknown>,
  options: { required?: string[]; types?: Record<string, string> }
): void {
  if (options.required) {
    const { valid, errors } = validateRequired(obj, options.required);
    if (!valid) {
      throw ApiError.BadRequest(Object.values(errors).join('; '));
    }
  }
  if (options.types) {
    const { valid, errors } = validateTypes(obj, options.types);
    if (!valid) {
      throw ApiError.BadRequest(Object.values(errors).join('; '));
    }
  }
}

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
