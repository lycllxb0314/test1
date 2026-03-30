/**
 * 共享教学资源类型定义
 * 
 * @module types/shared-resource
 */

/**
 * 共享资源类型
 */
export type SharedResourceCategory = 'reading' | 'writing' | 'math';

/**
 * 共享资源实体
 */
export interface SharedResource {
  id: string;
  category: SharedResourceCategory;
  grade: number;
  topicKey: string;
  title: string;
  unit: string | null;
  content: Record<string, unknown>;
  useCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  createdByName: string | null;
}

/**
 * 共享资源查询参数
 */
export interface SharedResourceQuery {
  category: SharedResourceCategory;
  grade: number;
  topicKey: string;
}

/**
 * 创建共享资源请求
 */
export interface CreateSharedResourceRequest {
  category: SharedResourceCategory;
  grade: number;
  topicKey: string;
  title: string;
  unit?: string;
  content: Record<string, unknown>;
  createdBy?: string;
  createdByName?: string;
}

/**
 * 共享资源使用统计更新
 */
export interface SharedResourceUsageUpdate {
  id: string;
  incrementUseCount: boolean;
}
