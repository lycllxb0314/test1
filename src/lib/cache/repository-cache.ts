/**
 * Repository 层缓存装饰器
 * 
 * 特性：
 * 1. 自动缓存查询结果
 * 2. 支持缓存失效（写入操作自动清除相关缓存）
 * 3. 支持 TTL 配置
 * 
 * @module lib/cache/repository-cache
 */

// ==================== 类型定义 ====================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

export interface CacheConfig {
  /** 缓存时间（秒），默认 60 秒 */
  ttl?: number;
  /** 缓存标签（用于批量失效） */
  tags?: string[];
  /** 是否启用缓存 */
  enabled?: boolean;
}

export interface RepositoryCacheOptions {
  /** 实体名称（用于缓存键前缀） */
  entityName: string;
  /** 默认 TTL（秒） */
  defaultTtl?: number;
}

// ==================== 缓存存储 ====================

const cacheStore = new Map<string, CacheEntry<unknown>>();
const tagIndex = new Map<string, Set<string>>(); // tag -> cache keys

const DEFAULT_TTL = 60; // 60秒
const DEFAULT_MAX_SIZE = 1000;

// ==================== 缓存工具函数 ====================

/**
 * 生成缓存键
 */
function generateCacheKey(entityName: string, method: string, args: unknown[]): string {
  const argsHash = JSON.stringify(args).split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return `${entityName}:${method}:${Math.abs(argsHash).toString(36)}`;
}

/**
 * 清理过期缓存
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt < now) {
      removeEntry(key, entry.tags);
    }
  }
}

/**
 * 删除缓存条目
 */
function removeEntry(key: string, tags: string[]): void {
  cacheStore.delete(key);
  // 从标签索引中移除
  for (const tag of tags) {
    tagIndex.get(tag)?.delete(key);
  }
}

/**
 * 限制缓存大小
 */
function enforceMaxSize(maxSize: number): void {
  if (cacheStore.size > maxSize) {
    const keys = Array.from(cacheStore.keys());
    const toDelete = keys.slice(0, cacheStore.size - maxSize);
    for (const key of toDelete) {
      const entry = cacheStore.get(key);
      if (entry) {
        removeEntry(key, entry.tags);
      }
    }
  }
}

// ==================== 导出函数 ====================

/**
 * 从缓存获取数据
 */
export function getFromRepositoryCache<T>(
  entityName: string,
  method: string,
  args: unknown[]
): T | null {
  const key = generateCacheKey(entityName, method, args);
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) return null;
  
  if (entry.expiresAt < Date.now()) {
    removeEntry(key, entry.tags);
    return null;
  }
  
  return entry.data;
}

/**
 * 存入缓存
 */
export function setToRepositoryCache<T>(
  entityName: string,
  method: string,
  args: unknown[],
  data: T,
  options: CacheConfig = {}
): void {
  if (options.enabled === false) return;
  
  const ttl = options.ttl || DEFAULT_TTL;
  const tags = options.tags || [entityName];
  const key = generateCacheKey(entityName, method, args);
  
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
    tags,
  });
  
  // 更新标签索引
  for (const tag of tags) {
    if (!tagIndex.has(tag)) {
      tagIndex.set(tag, new Set());
    }
    tagIndex.get(tag)!.add(key);
  }
  
  // 清理
  cleanupExpired();
  enforceMaxSize(DEFAULT_MAX_SIZE);
}

/**
 * 清除指定标签的所有缓存
 */
export function invalidateCacheByTag(tag: string): void {
  const keys = tagIndex.get(tag);
  if (keys) {
    for (const key of keys) {
      const entry = cacheStore.get(key);
      if (entry) {
        cacheStore.delete(key);
      }
    }
    tagIndex.delete(tag);
  }
}

/**
 * 清除指定实体的所有缓存
 */
export function invalidateEntityCache(entityName: string): void {
  invalidateCacheByTag(entityName);
}

/**
 * 清除所有缓存
 */
export function clearRepositoryCache(): void {
  cacheStore.clear();
  tagIndex.clear();
}

/**
 * 获取缓存统计
 */
export function getRepositoryCacheStats(): {
  size: number;
  tags: string[];
  entries: { key: string; ttl: number }[];
} {
  const now = Date.now();
  return {
    size: cacheStore.size,
    tags: Array.from(tagIndex.keys()),
    entries: Array.from(cacheStore.entries()).map(([key, entry]) => ({
      key,
      ttl: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
    })),
  };
}

// ==================== 缓存装饰器 ====================

/**
 * 创建带缓存的 Repository 方法
 * 
 * @example
 * ```ts
 * const cachedFindById = withRepositoryCache(
 *   'User',
 *   'findById',
 *   (id: string) => userRepository.findById(id),
 *   { ttl: 300 }
 * );
 * ```
 */
export function withRepositoryCache<T, Args extends unknown[]>(
  entityName: string,
  methodName: string,
  fn: (...args: Args) => Promise<T>,
  options: CacheConfig = {}
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    // 检查缓存
    const cached = getFromRepositoryCache<T>(entityName, methodName, args);
    if (cached !== null) {
      return cached;
    }
    
    // 执行原函数
    const result = await fn(...args);
    
    // 存入缓存
    setToRepositoryCache(entityName, methodName, args, result, options);
    
    return result;
  };
}

/**
 * 创建自动失效的写入方法
 * 
 * @example
 * ```ts
 * const cachedUpdate = withCacheInvalidation(
 *   'User',
 *   (id: string, data: Partial<User>) => userRepository.update(id, data)
 * );
 * ```
 */
export function withCacheInvalidation<T, Args extends unknown[]>(
  entityName: string,
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const result = await fn(...args);
    // 写入操作后清除该实体的所有缓存
    invalidateEntityCache(entityName);
    return result;
  };
}

/**
 * Repository 缓存增强器
 * 
 * 为 Repository 对象自动添加缓存
 * 
 * @example
 * ```ts
 * const cachedUserRepo = enhanceRepositoryWithCache(userRepository, {
 *   entityName: 'User',
 *   defaultTtl: 300,
 *   cacheMethods: ['findById', 'findAll', 'findByEmail'],
 *   invalidateMethods: ['create', 'update', 'delete'],
 * });
 * ```
 */
export function enhanceRepositoryWithCache<T extends Record<string, Function>>(
  repository: T,
  options: {
    entityName: string;
    defaultTtl?: number;
    cacheMethods?: string[];
    invalidateMethods?: string[];
  }
): T {
  const { entityName, defaultTtl = DEFAULT_TTL, cacheMethods = [], invalidateMethods = [] } = options;
  
  const enhanced = { ...repository } as Record<string, Function>;
  
  // 为查询方法添加缓存
  for (const method of cacheMethods) {
    if (typeof repository[method] === 'function') {
      enhanced[method] = withRepositoryCache(
        entityName,
        method,
        repository[method].bind(repository),
        { ttl: defaultTtl }
      );
    }
  }
  
  // 为写入方法添加缓存失效
  for (const method of invalidateMethods) {
    if (typeof repository[method] === 'function') {
      enhanced[method] = withCacheInvalidation(
        entityName,
        repository[method].bind(repository)
      );
    }
  }
  
  return enhanced as T;
}
