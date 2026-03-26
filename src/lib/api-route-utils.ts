/**
 * API路由工具函数 - 已废弃
 * 
 * @deprecated 请使用 '@/lib/api' 替代
 * 此文件将在未来版本中删除
 * 
 * 迁移指南:
 * ```ts
 * // 旧导入
 * import { success, error, parseQueryParams } from '@/lib/api-route-utils';
 * 
 * // 新导入
 * import { success, error, parseQueryParams } from '@/lib/api';
 * ```
 */

// 从新位置重新导出所有内容
export * from './api';
