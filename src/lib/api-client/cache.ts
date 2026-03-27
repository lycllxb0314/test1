/**
 * API客户端 - 缓存模块
 * 
 * 提供请求结果缓存能力，减少重复请求
 * 
 * @module api-client/cache
 */

import type { CacheEntry, CacheConfig } from './types';

/**
 * 默认缓存配置
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5分钟
  maxSize: 100,
  enabled: true,
};

/**
 * 内存缓存实现
 */
export class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * 生成缓存键
   */
  static generateKey(url: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + (ttl ?? this.config.defaultTTL),
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 删除匹配的缓存
   */
  deletePattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    return Date.now() <= entry.expiresAt;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 移除最旧的缓存
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * 全局缓存实例
 */
export const globalCache = new ApiCache();

/**
 * 定期清理过期缓存
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup();
  }, 60 * 1000); // 每分钟清理一次
}
