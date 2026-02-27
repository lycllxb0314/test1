import { useDataFetch, useSingleDataFetch, useDataMutation } from './useDataFetch';

// 作业相关类型
export interface Homework {
  id: string;
  title: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  dueDate: string;
  content: string;
  attachments: string[];
  submissionCount: number;
  totalStudents: number;
  status: string;
  createdAt: string;
}

// 数据采集任务相关类型
export interface DataCollectionTask {
  id: string;
  title: string;
  type: string;
  description: string;
  deadline: string;
  targetRoles: string[];
  submittedCount: number;
  totalCount: number;
  status: string;
  createdBy: string;
  createdAt: string;
}

// 通知消息相关类型
export interface Communication {
  id: string;
  title: string;
  type: string;
  content: string;
  senderId: string;
  senderName: string;
  recipientType: string;
  recipientIds: string[];
  priority: 'low' | 'medium' | 'high';
  status: string;
  readCount: number;
  totalRecipients: number;
  createdAt: string;
}

/**
 * 作业数据Hook
 */
export function useHomeworks(teacherId?: string, classId?: string, subject?: string) {
  const params: Record<string, string> = {};
  if (teacherId) params.teacherId = teacherId;
  if (classId) params.classId = classId;
  if (subject) params.subject = subject;
  return useDataFetch<Homework>('/api/homeworks', params);
}

/**
 * 数据采集任务Hook
 */
export function useDataCollectionTasks(status?: string, type?: string) {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (type) params.type = type;
  return useDataFetch<DataCollectionTask>('/api/data-collection', params);
}

/**
 * 通知消息Hook
 */
export function useCommunications(type?: string, status?: string) {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (status) params.status = status;
  return useDataFetch<Communication>('/api/communications', params);
}

/**
 * 作业操作Hook
 */
export function useHomeworkMutation() {
  return useDataMutation<Partial<Homework>, Homework>();
}

/**
 * 数据采集任务操作Hook
 */
export function useDataCollectionMutation() {
  return useDataMutation<Partial<DataCollectionTask>, DataCollectionTask>();
}
