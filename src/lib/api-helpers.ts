/**
 * API辅助工具
 * @deprecated 请直接使用 '@/services/api-client'
 * 此文件仅为保持向后兼容而存在
 */

// 重新导出统一API客户端的所有内容
export {
  apiClient,
  authApi,
  userApi,
  teacherApi,
  type ApiResponse,
  type PaginationParams,
  type PaginatedResponse,
  type QueryParams,
} from '@/services/api-client';

export default (await import('@/services/api-client')).apiClient;
