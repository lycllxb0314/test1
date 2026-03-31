/**
 * 缓存模块
 * 
 * 统一导出：
 * - Repository 层缓存
 * - API 响应缓存（从 api/cache.ts 重导出）
 * 
 * @module lib/cache
 */

// ==================== Repository 层缓存 ====================

export {
  getFromRepositoryCache,
  setToRepositoryCache,
  invalidateCacheByTag,
  invalidateEntityCache,
  clearRepositoryCache,
  getRepositoryCacheStats,
  withRepositoryCache,
  withCacheInvalidation,
  enhanceRepositoryWithCache,
} from './repository-cache';

// ==================== 类型重导出 ====================

export type { CacheConfig, RepositoryCacheOptions } from './repository-cache';
