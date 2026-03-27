/**
 * API客户端 - 类型定义
 * 
 * 定义API客户端相关的类型和接口
 * 
 * @module api-client/types
 */

// ============================================
// API响应类型
// ============================================

/**
 * 统一API响应格式
 */
export interface ApiResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T | null;
  /** 错误信息 */
  error?: string | null;
  /** 分页信息 */
  pagination?: Pagination;
}

/**
 * 分页信息
 */
export interface Pagination {
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 列表数据响应
 */
export interface ListResponse<T> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: Pagination;
}

// ============================================
// 请求配置类型
// ============================================

/**
 * 请求配置
 */
export interface RequestConfig extends RequestInit {
  /** 请求参数 */
  params?: Record<string, string | number | boolean | undefined>;
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 缓存时间（毫秒），0表示不缓存 */
  cacheTime?: number;
  /** 缓存键 */
  cacheKey?: string;
}

/**
 * 请求拦截器
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/**
 * 响应拦截器
 */
export type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

/**
 * 错误拦截器
 */
export type ErrorInterceptor = (error: Error) => void | Promise<void>;

// ============================================
// 缓存类型
// ============================================

/**
 * 缓存条目
 */
export interface CacheEntry<T = unknown> {
  /** 缓存数据 */
  data: T;
  /** 过期时间 */
  expiresAt: number;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 默认缓存时间（毫秒） */
  defaultTTL: number;
  /** 最大缓存数量 */
  maxSize: number;
  /** 是否启用缓存 */
  enabled: boolean;
}

// ============================================
// 客户端配置
// ============================================

/**
 * API客户端配置
 */
export interface ApiClientConfig {
  /** 基础URL */
  baseUrl?: string;
  /** 默认请求头 */
  defaultHeaders?: Record<string, string>;
  /** 默认超时（毫秒） */
  timeout?: number;
  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number;
    /** 重试延迟（毫秒） */
    delay: number;
  };
  /** 缓存配置 */
  cache?: Partial<CacheConfig>;
}

// ============================================
// 分页查询参数
// ============================================

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 当前页 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 搜索参数
 */
export interface SearchParams {
  /** 搜索关键词 */
  keyword?: string;
}

/**
 * 查询参数（合并）
 */
export interface QueryParams extends PaginationParams, SortParams, SearchParams {
  /** 其他参数 */
  [key: string]: unknown;
}
