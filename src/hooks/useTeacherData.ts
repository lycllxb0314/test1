import { useDataFetch, useSingleDataFetch, useDataMutation } from './useDataFetch';
import { useState, useEffect, useCallback } from 'react';

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

// 教师列表项类型
export interface TeacherListItem {
  id: string;
  name: string;
  gender: string;
  subject: string;
  title: string;
  department: string;
  phone: string;
  email: string;
  status: string;
  teachYears: number;
}

// 教师完整档案类型
export interface TeacherFullProfile {
  id: string;
  userId: string;
  
  name: string;
  gender: string;
  birthDate: string;
  idCard: string;
  ethnicity: string;
  politicalStatus: string;
  nativePlace: string;
  
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  
  employeeId: string;
  subjects: string[];
  title: string;
  titleDate: string;
  education: string;
  school: string;
  major: string;
  graduationDate: string;
  teachYears: number;
  joinDate: string;
  department: string;
  
  isHeadTeacher: boolean;
  className?: string;
  status: string;
  
  records: TeacherRecord[];
  honors: TeacherHonor[];
  trainings: TeacherTraining[];
  achievements: TeacherAchievement[];
  
  createdAt: string;
  updatedAt: string;
}

// 教师成长记录类型
export interface TeacherRecord {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  createdAt: string;
}

// 教师荣誉类型
export interface TeacherHonor {
  id: string;
  teacherId: string;
  title: string;
  level: string;
  category: string;
  issuer?: string;
  date: string;
  certificateNo?: string;
}

// 教师培训类型
export interface TeacherTraining {
  id: string;
  teacherId: string;
  name: string;
  type: string;
  organizer: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  certificate?: string;
}

// 教师成果类型
export interface TeacherAchievement {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  level: string;
  result?: string;
  date: string;
  description?: string;
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

/**
 * 教师列表数据Hook
 */
export function useTeachersList(search?: string, subject?: string, status?: string) {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (subject && subject !== 'all') params.subject = subject;
  if (status) params.status = status;
  return useDataFetch<TeacherListItem>('/api/teachers', params);
}

/**
 * 教师完整档案Hook
 */
export function useTeacherFullProfile(teacherId: string | null) {
  const [data, setData] = useState<TeacherFullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teachers/${teacherId}/full-profile`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '获取教师档案失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<TeacherFullProfile>) => {
    if (!teacherId) return false;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teachers/${teacherId}/full-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      
      if (result.success) {
        setData(prev => prev ? { ...prev, ...updates } : null);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  return { data, loading, error, refetch: fetchProfile, updateProfile };
}

/**
 * 教师操作Hook（增删改）
 */
export function useTeacherMutation() {
  return useDataMutation<Partial<TeacherListItem>, TeacherListItem>();
}
