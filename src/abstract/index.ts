/**
 * 架构抽象层
 * 
 * 定义系统的核心抽象接口，确保各层的解耦和一致性
 * 
 * 六层架构：
 * 1. Repository层 - 数据访问抽象
 * 2. Service层 - 业务逻辑抽象
 * 3. API层 - HTTP接口抽象
 * 4. API Client层 - 请求封装抽象
 * 5. Hook层 - React框架适配
 * 6. Component层 - UI展示
 * 
 * @module abstract
 */

// ============================================
// 数据访问抽象
// ============================================

export type {
  IRepository,
  ISoftDeleteRepository,
  ITreeRepository,
  ITimeRangeRepository,
  QueryOptions,
  PaginatedResult,
} from './interfaces/repository.interface';

// ============================================
// 业务逻辑抽象
// ============================================

/**
 * 服务层接口
 */
export interface IService {
  /**
   * 服务名称
   */
  readonly name: string;
}

/**
 * 可审计服务接口
 */
export interface IAuditableService extends IService {
  /**
   * 记录操作日志
   */
  log(action: string, data: Record<string, unknown>): Promise<void>;
}

/**
 * 可缓存服务接口
 */
export interface ICacheableService extends IService {
  /**
   * 获取缓存
   */
  getCache<T>(key: string): Promise<T | null>;

  /**
   * 设置缓存
   */
  setCache<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 清除缓存
   */
  clearCache(key: string): Promise<void>;
}

// ============================================
// HTTP客户端抽象
// ============================================

/**
 * HTTP请求配置
 */
export interface HttpRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * HTTP响应
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * HTTP客户端接口
 */
export interface IHttpClient {
  /**
   * 发送请求
   */
  request<T>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;

  /**
   * GET请求
   */
  get<T>(url: string, params?: Record<string, unknown>): Promise<HttpResponse<T>>;

  /**
   * POST请求
   */
  post<T>(url: string, data?: unknown): Promise<HttpResponse<T>>;

  /**
   * PUT请求
   */
  put<T>(url: string, data?: unknown): Promise<HttpResponse<T>>;

  /**
   * DELETE请求
   */
  delete<T>(url: string): Promise<HttpResponse<T>>;

  /**
   * 添加请求拦截器
   */
  interceptRequest(interceptor: (config: HttpRequestConfig) => HttpRequestConfig): void;

  /**
   * 添加响应拦截器
   */
  interceptResponse<T>(interceptor: (response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>): void;
}

// ============================================
// 数据获取抽象（Hook层使用）
// ============================================

/**
 * 查询状态
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 查询结果
 */
export interface QueryResult<T> {
  /** 数据 */
  data: T | null;
  /** 错误信息 */
  error: Error | null;
  /** 状态 */
  status: QueryStatus;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在获取 */
  isFetching: boolean;
  /** 是否成功 */
  isSuccess: boolean;
  /** 是否失败 */
  isError: boolean;
  /** 重新获取 */
  refetch: () => Promise<void>;
}

/**
 * 变更结果
 */
export interface MutationResult<T, P> {
  /** 执行变更 */
  mutate: (params: P) => Promise<T | null>;
  /** 异步执行 */
  mutateAsync: (params: P) => Promise<T>;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: Error | null;
}

/**
 * 数据获取器接口（Hook层的核心抽象）
 */
export interface IDataFetcher {
  /**
   * 获取单条数据
   */
  fetchOne<T>(key: string, url: string): Promise<T | null>;

  /**
   * 获取列表数据
   */
  fetchList<T>(key: string, url: string, params?: Record<string, unknown>): Promise<{ data: T[]; total: number }>;

  /**
   * 创建数据
   */
  create<T>(url: string, data: unknown): Promise<T | null>;

  /**
   * 更新数据
   */
  update<T>(url: string, id: string, data: unknown): Promise<T | null>;

  /**
   * 删除数据
   */
  delete(url: string, id: string): Promise<boolean>;

  /**
   * 使缓存失效
   */
  invalidate(key: string): void;

  /**
   * 预取数据
   */
  prefetch<T>(key: string, url: string): Promise<void>;
}
