/**
 * 全局错误处理 Hook
 * 
 * 提供统一的错误处理、日志记录和用户通知
 * 
 * @module hooks/useError
 */

'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ============================================
// 类型定义
// ============================================

export interface AppError extends Error {
  /** 错误代码 */
  code?: string;
  /** HTTP 状态码 */
  status?: number;
  /** 错误来源 */
  source?: 'api' | 'client' | 'network' | 'unknown';
  /** 原始错误 */
  cause?: unknown;
  /** 是否可重试 */
  retryable?: boolean;
  /** 用户友好消息 */
  userMessage?: string;
}

export interface ErrorLogEntry {
  id: string;
  error: AppError;
  timestamp: string;
  url: string;
  userAgent: string;
  componentStack?: string;
}

// ============================================
// 错误工厂函数
// ============================================

/**
 * 创建应用错误
 */
export function createAppError(
  error: unknown,
  options: Partial<AppError> = {}
): AppError {
  if (error instanceof Error) {
    const appError = error as AppError;
    return Object.assign(appError, {
      code: options.code || appError.code,
      status: options.status || appError.status,
      source: options.source || 'unknown',
      cause: options.cause || error.cause,
      retryable: options.retryable ?? isRetryable(error),
      userMessage: options.userMessage || getUserFriendlyMessage(error),
    });
  }

  const appError = new Error(String(error)) as AppError;
  return Object.assign(appError, {
    code: options.code || 'UNKNOWN_ERROR',
    source: options.source || 'unknown',
    retryable: options.retryable ?? false,
    userMessage: options.userMessage || '操作失败，请稍后重试',
  });
}

/**
 * 判断错误是否可重试
 */
function isRetryable(error: Error): boolean {
  // 网络错误可重试
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return true;
  }
  // 超时错误可重试
  if (error.message.includes('timeout')) {
    return true;
  }
  // 5xx 服务器错误可重试
  const status = (error as AppError).status;
  if (status && status >= 500 && status < 600) {
    return true;
  }
  return false;
}

/**
 * 获取用户友好的错误消息
 */
function getUserFriendlyMessage(error: Error): string {
  const status = (error as AppError).status;

  // 根据状态码返回友好消息
  switch (status) {
    case 400:
      return '请求参数有误，请检查后重试';
    case 401:
      return '登录已过期，请重新登录';
    case 403:
      return '您没有权限执行此操作';
    case 404:
      return '请求的资源不存在';
    case 409:
      return '数据冲突，请刷新后重试';
    case 429:
      return '请求过于频繁，请稍后重试';
    case 500:
      return '服务器内部错误，请稍后重试';
    case 502:
    case 503:
    case 504:
      return '服务暂时不可用，请稍后重试';
    default:
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return '网络连接失败，请检查网络后重试';
      }
      return '操作失败，请稍后重试';
  }
}

// ============================================
// 错误日志
// ============================================

const errorLog: ErrorLogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

function addToLog(error: AppError, componentStack?: string): void {
  const entry: ErrorLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    error,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    componentStack,
  };

  errorLog.unshift(entry);
  if (errorLog.length > MAX_LOG_ENTRIES) {
    errorLog.pop();
  }
}

/**
 * 获取错误日志
 */
export function getErrorLog(): ErrorLogEntry[] {
  return [...errorLog];
}

/**
 * 清空错误日志
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

// ============================================
// Hook 实现
// ============================================

export interface UseErrorReturn {
  /** 处理错误 */
  handleError: (error: unknown, options?: HandleErrorOptions) => AppError;
  /** 异步操作包装器 */
  wrapAsync: <T>(
    fn: () => Promise<T>,
    options?: HandleErrorOptions
  ) => Promise<T | null>;
  /** 重试操作 */
  retry: <T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ) => Promise<T | null>;
  /** 显示错误提示 */
  showError: (error: AppError) => void;
  /** 清除错误 */
  clearError: () => void;
}

export interface HandleErrorOptions {
  /** 是否显示 toast 提示 */
  showToast?: boolean;
  /** 自定义错误消息 */
  message?: string;
  /** 错误代码 */
  code?: string;
  /** 错误来源 */
  source?: AppError['source'];
  /** 错误回调 */
  onError?: (error: AppError) => void;
}

export interface RetryOptions extends HandleErrorOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否指数退避 */
  exponentialBackoff?: boolean;
}

/**
 * 错误处理 Hook
 */
export function useError(): UseErrorReturn {
  const retryCountRef = useRef(0);

  /**
   * 处理错误
   */
  const handleError = useCallback(
    (error: unknown, options: HandleErrorOptions = {}): AppError => {
      const {
        showToast = true,
        message,
        code,
        source,
        onError,
      } = options;

      const appError = createAppError(error, {
        code,
        source,
        userMessage: message,
      });

      // 记录日志
      addToLog(appError);

      // 显示 toast
      if (showToast) {
        toast.error(appError.userMessage || '操作失败');
      }

      // 调用回调
      onError?.(appError);

      // 控制台输出
      console.error('[useError]', appError);

      return appError;
    },
    []
  );

  /**
   * 异步操作包装器
   */
  const wrapAsync = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options: HandleErrorOptions = {}
    ): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        handleError(error, options);
        return null;
      }
    },
    [handleError]
  );

  /**
   * 重试操作
   */
  const retry = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T | null> => {
      const {
        maxRetries = 3,
        retryDelay = 1000,
        exponentialBackoff = true,
        ...errorOptions
      } = options;

      let lastError: AppError | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          retryCountRef.current = attempt;
          return await fn();
        } catch (error) {
          lastError = createAppError(error);

          // 最后一次尝试或不可重试
          if (attempt === maxRetries || !lastError.retryable) {
            handleError(error, errorOptions);
            return null;
          }

          // 延迟重试
          const delay = exponentialBackoff
            ? retryDelay * Math.pow(2, attempt)
            : retryDelay;

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      return null;
    },
    [handleError]
  );

  /**
   * 显示错误提示
   */
  const showError = useCallback((error: AppError): void => {
    toast.error(error.userMessage || error.message || '操作失败');
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback((): void => {
    retryCountRef.current = 0;
  }, []);

  return {
    handleError,
    wrapAsync,
    retry,
    showError,
    clearError,
  };
}

// ============================================
// 全局错误处理器
// ============================================

/**
 * 设置全局错误处理器
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // 处理未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    const error = createAppError(event.reason, {
      source: 'client',
      code: 'UNHANDLED_REJECTION',
    });

    addToLog(error);
    console.error('[GlobalErrorHandler] 未处理的 Promise 错误:', error);

    // 显示提示
    toast.error(error.userMessage);

    // 阻止默认行为
    event.preventDefault();
  });

  // 处理全局错误
  window.addEventListener('error', (event) => {
    const error = createAppError(event.error, {
      source: 'client',
      code: 'GLOBAL_ERROR',
    });

    addToLog(error);
    console.error('[GlobalErrorHandler] 全局错误:', error);

    // 对于资源加载错误，不显示提示
    if (event.target !== window) {
      return;
    }

    toast.error(error.userMessage);
  });
}

export default useError;
