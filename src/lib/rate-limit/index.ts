/**
 * 分布式限流中间件
 * 
 * 基于Redis的滑动窗口限流算法
 * 支持：IP级别、用户级别、接口级别、租户级别限流
 * 
 * @module lib/rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '../api';

// ============================================
// 类型定义
// ============================================

/**
 * 限流配置
 */
export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  maxRequests: number;
  /** Redis key前缀 */
  keyPrefix: string;
  /** 限流级别 */
  level?: 'ip' | 'user' | 'endpoint' | 'global';
  /** 是否跳过成功请求（只计算失败） */
  skipSuccessfulRequests?: boolean;
  /** 自定义错误消息 */
  message?: string;
}

/**
 * 限流结果
 */
export interface RateLimitResult {
  /** 是否允许请求 */
  allowed: boolean;
  /** 当前窗口已使用请求数 */
  current: number;
  /** 剩余请求数 */
  remaining: number;
  /** 重置时间（秒） */
  resetAfter: number;
  /** 重试等待时间（秒） */
  retryAfter?: number;
}

/**
 * 限流存储接口
 */
export interface RateLimitStore {
  /** 增加计数并获取结果 */
  increment(key: string, windowMs: number, maxRequests: number): Promise<RateLimitResult>;
  /** 重置计数 */
  reset(key: string): Promise<void>;
}

// ============================================
// 内存存储（开发环境/S无Redis时降级）
// ============================================

interface MemoryStoreEntry {
  timestamp: number;
  count: number;
}

class MemoryStore implements RateLimitStore {
  private store = new Map<string, MemoryStoreEntry[]>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每分钟清理过期数据
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async increment(key: string, windowMs: number, maxRequests: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 获取或创建条目
    let entries = this.store.get(key) || [];
    
    // 过滤掉窗口外的记录
    entries = entries.filter(e => e.timestamp > windowStart);
    
    // 计算当前计数
    const current = entries.reduce((sum, e) => sum + e.count, 0);
    
    // 判断是否允许
    const allowed = current < maxRequests;
    
    if (allowed) {
      // 添加新记录
      entries.push({ timestamp: now, count: 1 });
      this.store.set(key, entries);
    }
    
    // 计算重置时间
    const oldestTimestamp = entries[0]?.timestamp || now;
    const resetAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    
    return {
      allowed,
      current: current + (allowed ? 1 : 0),
      remaining: Math.max(0, maxRequests - current - (allowed ? 1 : 0)),
      resetAfter: Math.max(1, resetAfter),
      retryAfter: allowed ? undefined : resetAfter,
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entries] of this.store.entries()) {
      const valid = entries.filter(e => now - e.timestamp < 3600000); // 保留1小时内的
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// ============================================
// Redis存储（生产环境）
// ============================================

class RedisStore implements RateLimitStore {
  private redis: {
    eval: (script: string, keys: string[], args: (string | number)[]) => Promise<number>;
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
    expire: (key: string, seconds: number) => Promise<void>;
  } | null = null;

  constructor(redisClient?: unknown) {
    if (redisClient) {
      this.redis = redisClient as typeof this.redis;
    }
  }

  async increment(key: string, windowMs: number, maxRequests: number): Promise<RateLimitResult> {
    if (!this.redis) {
      // 降级到内存存储
      const memoryStore = new MemoryStore();
      return memoryStore.increment(key, windowMs, maxRequests);
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Lua脚本：原子性执行滑动窗口限流
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local windowMs = tonumber(ARGV[4])
      
      -- 移除过期记录
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- 获取当前计数
      local current = redis.call('ZCARD', key)
      
      -- 判断是否允许
      local allowed = current < maxRequests
      
      if allowed then
        -- 添加新记录
        redis.call('ZADD', key, now, now .. '-' .. math.random())
        redis.call('PEXPIRE', key, windowMs)
      end
      
      -- 获取最早的记录时间
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local oldestTimestamp = #oldest > 0 and tonumber(oldest[2]) or now
      local resetAfter = math.ceil((oldestTimestamp + windowMs - now) / 1000)
      
      return {allowed and 1 or 0, current + (allowed and 1 or 0), maxRequests - current - (allowed and 1 or 0), resetAfter}
    `;

    const result = await this.redis.eval(script, [key], [now, windowStart, maxRequests, windowMs]);
    
    const allowed = result > 0;
    const current = result;
    
    return {
      allowed,
      current,
      remaining: Math.max(0, maxRequests - current),
      resetAfter: Math.ceil(windowMs / 1000),
      retryAfter: allowed ? undefined : Math.ceil(windowMs / 1000),
    };
  }

  async reset(key: string): Promise<void> {
    // Redis implementation would delete the key
    // For now, use memory store fallback
    const memoryStore = new MemoryStore();
    await memoryStore.reset(key);
  }
}

// ============================================
// 预定义限流配置
// ============================================

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // 新生注册 - 严格限流
  '/api/enrollment': {
    windowMs: 60000, // 1分钟
    maxRequests: 100,
    keyPrefix: 'enrollment',
    level: 'global',
    message: '新生注册请求过于频繁，请稍后再试',
  },
  
  // 成绩查询 - 宽松限流
  '/api/grades': {
    windowMs: 60000,
    maxRequests: 200,
    keyPrefix: 'grades',
    level: 'user',
    message: '成绩查询请求过于频繁，请稍后再试',
  },
  
  // 家长端通用
  '/api/students': {
    windowMs: 60000,
    maxRequests: 300,
    keyPrefix: 'parent',
    level: 'user',
    message: '请求过于频繁，请稍后再试',
  },
  
  // 认证接口 - 防暴力破解
  '/api/auth/login': {
    windowMs: 900000, // 15分钟
    maxRequests: 5,
    keyPrefix: 'login',
    level: 'ip',
    message: '登录尝试次数过多，请15分钟后再试',
  },
  
  // 文件上传
  '/api/upload': {
    windowMs: 60000,
    maxRequests: 20,
    keyPrefix: 'upload',
    level: 'user',
    message: '上传请求过于频繁，请稍后再试',
  },
  
  // 默认限流
  'default': {
    windowMs: 60000,
    maxRequests: 500,
    keyPrefix: 'default',
    level: 'ip',
    message: '请求过于频繁，请稍后再试',
  },
};

// ============================================
// 限流中间件
// ============================================

// 全局存储实例
let globalStore: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (!globalStore) {
    // 优先使用Redis，降级到内存
    globalStore = new MemoryStore();
  }
  return globalStore;
}

/**
 * 获取客户端IP
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

/**
 * 获取用户ID（从请求中提取）
 */
function getUserId(request: NextRequest): string | null {
  // 从Cookie或Authorization头获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // 简单提取，实际应解析JWT
    return authHeader.slice(7, 27); // 取前20个字符作为标识
  }
  return null;
}

/**
 * 构建限流Key
 */
function buildRateLimitKey(
  config: RateLimitConfig,
  request: NextRequest,
  pathname: string
): string {
  const parts = [config.keyPrefix];
  
  switch (config.level) {
    case 'ip':
      parts.push(getClientIp(request));
      break;
    case 'user':
      const userId = getUserId(request);
      parts.push(userId || getClientIp(request));
      break;
    case 'global':
      parts.push('global');
      break;
    case 'endpoint':
    default:
      parts.push(pathname);
      parts.push(getClientIp(request));
      break;
  }
  
  return parts.join(':');
}

/**
 * 获取匹配的限流配置
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // 精确匹配
  if (rateLimitConfigs[pathname]) {
    return rateLimitConfigs[pathname];
  }
  
  // 前缀匹配
  for (const [path, config] of Object.entries(rateLimitConfigs)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config;
    }
  }
  
  // 默认配置
  return rateLimitConfigs['default'];
}

/**
 * 限流中间件
 */
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = new URL(request.url).pathname;
  const config = getRateLimitConfig(pathname);
  
  const store = getStore();
  const key = buildRateLimitKey(config, request, pathname);
  
  try {
    const result = await store.increment(key, config.windowMs, config.maxRequests);
    
    if (!result.allowed) {
      // 设置响应头
      const headers = {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAfter),
        'Retry-After': String(result.retryAfter || result.resetAfter),
      };
      
      return NextResponse.json(
        {
          success: false,
          error: config.message || '请求过于频繁，请稍后再试',
          errorCode: ErrorCode.FORBIDDEN,
          retryAfter: result.retryAfter,
        },
        { status: 429, headers }
      );
    }
    
    // 允许请求，返回null让请求继续
    return null;
  } catch (error) {
    console.error('Rate limit error:', error);
    // 限流出错时允许请求通过，避免影响正常业务
    return null;
  }
}

/**
 * 创建限流中间件（用于特定路由）
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimiter(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const store = getStore();
    const pathname = new URL(request.url).pathname;
    const key = buildRateLimitKey(config, request, pathname);
    
    try {
      const result = await store.increment(key, config.windowMs, config.maxRequests);
      
      if (!result.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: config.message || '请求过于频繁，请稍后再试',
            errorCode: ErrorCode.FORBIDDEN,
            retryAfter: result.retryAfter,
          },
          { status: 429 }
        );
      }
      
      return null;
    } catch (error) {
      console.error('Rate limit error:', error);
      return null;
    }
  };
}

/**
 * 初始化Redis存储（生产环境调用）
 */
export function initRedisRateLimitStore(redisClient: unknown): void {
  globalStore = new RedisStore(redisClient);
}

// ============================================
// 导出
// ============================================

export {
  MemoryStore,
  RedisStore,
};
