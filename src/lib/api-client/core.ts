/**
 * API客户端 - 核心实现
 * 
 * 提供统一的HTTP请求封装，包含：
 * - 请求/响应拦截器
 * - 自动错误处理
 * - 请求缓存
 * - 重试机制
 * - 超时控制
 * 
 * @module api-client/core
 */

import type {
  ApiResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiClientConfig,
} from './types';
import { ApiCache, globalCache } from './cache';

/**
 * API客户端类
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private cache: ApiCache;

  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config?: ApiClientConfig) {
    this.baseUrl = config?.baseUrl || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config?.defaultHeaders,
    };
    this.timeout = config?.timeout || 30000;
    this.maxRetries = config?.retry?.maxRetries || 3;
    this.retryDelay = config?.retry?.delay || 1000;
    this.cache = config?.cache ? new ApiCache(config.cache) : globalCache;
  }

  /**
   * 获取默认请求配置（包含 credentials 以发送 Cookie）
   */
  private getDefaultRequestConfig(): RequestInit {
    return {
      credentials: 'include', // 关键：确保 Cookie 随请求发送
    };
  }

  /**
   * 添加请求拦截器
   */
  interceptRequest(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 添加响应拦截器
   */
  interceptResponse(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 添加错误拦截器
   */
  interceptError(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 构建完整URL
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    // 过滤掉undefined和null值
    const filteredParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    return filteredParams ? `${url}?${filteredParams}` : url;
  }

  /**
   * 应用请求拦截器
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * 应用响应拦截器
   */
  private async applyResponseInterceptors<T>(
    response: ApiResponse<T>
  ): Promise<ApiResponse<T>> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  /**
   * 应用错误拦截器
   */
  private async applyErrorInterceptors(error: Error): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 发起请求（带重试）
   */
  private async fetchWithRetry<T>(
    url: string,
    config: RequestConfig,
    retriesLeft: number = this.maxRetries
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

      const response = await fetch(url, {
        ...this.getDefaultRequestConfig(),
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 解析响应
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = {
          success: response.ok,
          data: text as unknown as T,
          error: response.ok ? undefined : text,
        };
      }

      // HTTP错误处理
      if (!response.ok) {
        const error = new Error(data.error || `HTTP Error: ${response.status}`);
        (error as Error & { status: number }).status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      // 网络错误或超时，尝试重试
      if (
        retriesLeft > 0 &&
        (error instanceof TypeError || (error as Error).name === 'AbortError')
      ) {
        await this.delay(this.retryDelay);
        return this.fetchWithRetry<T>(url, config, retriesLeft - 1);
      }

      throw error;
    }
  }

  /**
   * 发起请求
   */
  async request<T>(path: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    // 构建请求配置
    let requestConfig: RequestConfig = {
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
      },
    };

    // 应用请求拦截器
    requestConfig = await this.applyRequestInterceptors(requestConfig);

    // 构建URL
    const url = this.buildUrl(path, requestConfig.params);
    const cacheKey = ApiCache.generateKey(url, { method: config.method || 'GET' });

    // 检查缓存（仅GET请求）
    if (!config.method || config.method === 'GET') {
      const cached = this.cache.get<ApiResponse<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 发起请求
    try {
      const response = await this.fetchWithRetry<T>(url, requestConfig);

      // 应用响应拦截器
      const processedResponse = await this.applyResponseInterceptors(response);

      // 缓存成功的GET请求
      if ((!config.method || config.method === 'GET') && processedResponse.success) {
        this.cache.set(cacheKey, processedResponse, config.cacheTime);
      }

      return processedResponse;
    } catch (error) {
      // 应用错误拦截器
      await this.applyErrorInterceptors(error as Error);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * GET请求
   */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'GET',
      params,
    });
  }

  /**
   * POST请求
   */
  async post<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT请求
   */
  async put<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH请求
   */
  async patch<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }

  /**
   * 使缓存失效
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cache.deletePattern(pattern);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 预取数据
   */
  async prefetch<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<void> {
    await this.get<T>(path, params);
  }
}

/**
 * 默认API客户端实例
 */
export const apiClient = new ApiClient();
