/**
 * API 工具模块
 * 
 * 统一导出：
 * - 响应格式化工具（从 @/lib/api 重导出）
 * - 路由装饰器工厂
 * - 响应缓存
 * 
 * @module lib/api
 */

// ==================== 响应格式化（从主模块重导出）====================

export {
  ok,
  fail,
  serverError,
  paginated,
  success,
  successPaginated,
  error,
  unauthorized,
  forbidden,
  notFound,
  ErrorCode,
  type ApiResponse,
  type Pagination,
  type PaginatedData,
  type QueryParams,
  type RouteQueryParams,
} from '@/lib/api';

// ==================== 路由装饰器 ====================

export {
  parsePagination,
  parseQueryParams,
  ApiResponseBuilder,
  createListRoute,
  createDetailRoute,
  createCreateRoute,
  createUpdateRoute,
  createDeleteRoute,
} from './decorators';

// ==================== 响应缓存 ====================

export {
  getFromCache,
  setToCache,
  clearCache,
  getCacheStats,
  withCache,
  withShortCache,
  withMediumCache,
  withLongCache,
} from './cache';
