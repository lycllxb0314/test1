/**
 * 信息采集类型定义
 * 
 * @module types/information-collection
 */

// ==================== 信息采集类型 ====================

/** 采集状态 */
export type CollectionStatus = 'draft' | 'published' | 'closed' | 'archived';

/** 字段类型 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'image';

/** 表单字段验证规则 */
export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

/** 表单字段 */
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: FieldValidation;
  order: number;
}

/** 目标用户类型 */
export type TargetUserType = 'teacher' | 'parent' | 'student';

/** 信息采集表单 */
export interface InformationCollection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  creatorId: string;
  creatorName: string;
  targetUsers: TargetUserType[];
  targetGrades?: number[];
  targetClasses?: string[];
  deadline?: string;
  status: CollectionStatus;
  responseCount: number;
  allowMultiple: boolean;
  anonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 回答者类型 */
export type RespondentType = 'teacher' | 'parent' | 'student';

/** 采集响应 */
export interface CollectionResponse {
  id: string;
  collectionId: string;
  respondentId: string;
  respondentName: string;
  respondentType: RespondentType;
  classId?: string;
  className?: string;
  answers: Record<string, unknown>;
  submittedAt: string;
  ipAddress?: string;
}

/** 采集查询参数 */
export interface CollectionQueryParams {
  page?: number;
  pageSize?: number;
  status?: CollectionStatus;
  creatorId?: string;
  search?: string;
}

/** 创建采集参数 */
export interface CreateCollectionParams {
  title: string;
  description?: string;
  fields: FormField[];
  creatorId: string;
  creatorName: string;
  targetUsers: TargetUserType[];
  targetGrades?: number[];
  targetClasses?: string[];
  deadline?: string;
  allowMultiple?: boolean;
  anonymous?: boolean;
}

/** 提交响应参数 */
export interface SubmitResponseParams {
  collectionId: string;
  respondentId: string;
  respondentName: string;
  respondentType: RespondentType;
  answers: Record<string, unknown>;
  classId?: string;
  className?: string;
}

/** 采集统计 */
export interface CollectionStatistics {
  total: number;
  byType: Record<RespondentType, number>;
  byClass: Record<string, number>;
}
