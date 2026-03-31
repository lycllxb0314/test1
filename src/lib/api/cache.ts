/**
 * API 响应缓存
 * 
 * 特性：
 * 1. 内存缓存，自动过期
 * 2. 支持按用户、按参数缓存
 * 3. 缓存键自动生成
 * 
 * @module lib/api/cache
 */

import { NextRequest, NextResponse } from 'next/server';

// ==================== 类型定义 ====================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  etag: string;
}

export interface CacheOptions {
  /** 缓存时间（秒），默认 60 秒 */
  ttl?: number;
  /** 是否按用户隔离 */
  byUser?: boolean;
  /** 是否按查询参数隔离 */
  byQuery?: boolean;
  /** 最大缓存条目数 */
  maxSize?: number;
}

// ==================== 缓存存储 ====================

const cacheStore = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL = 60; // 60秒
const DEFAULT_MAX_SIZE = 500;

// ==================== 缓存工具函数 ====================

/**
 * 生成缓存键
 */
function generateCacheKey(
  request: NextRequest,
  options: CacheOptions,
  userId?: string
): string {
  const parts: string[] = [request.nextUrl.pathname];
  
  if (options.byUser && userId) {
    parts.push(`user:${userId}`);
  }
  
  if (options.byQuery) {
    const queryString = request.nextUrl.search;
    if (queryString) {
      parts.push(`query:${queryString}`);
    }
  }
  
  return parts.join('|');
}

/**
 * 生成 ETag
 */
function generateETag(data: unknown): string {
  const hash = JSON.stringify(data).split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * 清理过期缓存
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt < now) {
      cacheStore.delete(key);
    }
  }
}

/**
 * 限制缓存大小
 */
function enforceMaxSize(maxSize: number): void {
  if (cacheStore.size > maxSize) {
    // 删除最旧的条目
    const keys = Array.from(cacheStore.keys());
    const toDelete = keys.slice(0, cacheStore.size - maxSize);
    toDelete.forEach(key => cacheStore.delete(key));
  }
}

// ==================== 导出函数 ====================

/**
 * 从缓存获取数据
 */
export function getFromCache<T>(
  request: NextRequest,
  options: CacheOptions = {},
  userId?: string
): { data: T; etag: string } | null {
  const key = generateCacheKey(request, options, userId);
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) return null;
  
  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  
  return { data: entry.data, etag: entry.etag };
}

/**
 * 存入缓存
 */
export function setToCache<T>(
  request: NextRequest,
  data: T,
  options: CacheOptions = {},
  userId?: string
): string {
  const ttl = options.ttl || DEFAULT_TTL;
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  
  const key = generateCacheKey(request, options, userId);
  const etag = generateETag(data);
  
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
    etag,
  });
  
  // 清理
  cleanupExpired();
  enforceMaxSize(maxSize);
  
  return etag;
}

/**
 * 清除缓存
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cacheStore.size,
    keys: Array.from(cacheStore.keys()),
  };
}

/**
 * 缓存装饰器
 * 
 * @example
 * ```ts
 * export const GET = withCache(
 *   async (request) => {
 *     const data = await someService.getData();
 *     return ok(data);
 *   },
 *   { ttl: 300, byUser: true }
 * );
 * ```
 */
export function withCache<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: CacheOptions = {}
): (request: NextRequest) => Promise<NextResponse<T>> {
  return async (request: NextRequest) => {
    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return handler(request);
    }
    
    // 检查 If-None-Match 头
    const ifNoneMatch = request.headers.get('If-None-Match');
    const cached = getFromCache<T>(request, options);
    
    if (cached) {
      if (ifNoneMatch === cached.etag) {
        // 304 Not Modified
        return new NextResponse(null, { status: 304 }) as NextResponse<T>;
      }
      
      // 返回缓存数据
      const response = NextResponse.json(cached.data);
      response.headers.set('ETag', cached.etag);
      response.headers.set('Cache-Control', `max-age=${options.ttl || DEFAULT_TTL}`);
      return response;
    }
    
    // 执行处理器
    const response = await handler(request);
    
    // 缓存成功响应
    if (response.ok) {
      try {
        const data = await response.clone().json();
        if (data.success) {
          const etag = setToCache(request, data, options);
          response.headers.set('ETag', etag);
          response.headers.set('Cache-Control', `max-age=${options.ttl || DEFAULT_TTL}`);
        }
      } catch {
        // 忽略解析错误
      }
    }
    
    return response;
  };
}

/**
 * 短期缓存（30秒）
 */
export function withShortCache<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T>> {
  return withCache(handler, { ttl: 30 });
}

/**
 * 中期缓存（5分钟）
 */
export function withMediumCache<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T>> {
  return withCache(handler, { ttl: 300 });
}

/**
 * 长期缓存（1小时）
 */
export function withLongCache<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T>> {
  return withCache(handler, { ttl: 3600 });
}
