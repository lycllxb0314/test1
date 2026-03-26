'use client';

/**
 * 教研活动管理 Hook
 * 
 * 整合教研主题、活动、阶段、资源、成果等数据的统一管理
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

// 教研主题类型
export type ThemeType = 'big_unit' | 'project' | 'practice' | 'ai_enabled' | 'custom';
export type ThemeLevel = 'school' | 'grade' | 'subject_group';
export type ThemeStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

// 活动类型
export type ActivityType = 'seminar' | 'lesson_observation' | 'collective_prep' | 'training' | 'workshop' | 'salon';
export type ActivityStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

// 资源类型
export type ResourceType = 'lesson_design' | 'excellent_case' | 'academic_paper' | 'courseware' | 'other';

// 教研主题
export interface ResearchTheme {
  id: string;
  title: string;
  type: ThemeType;
  typeLabel: string;
  subject: string;
  level: ThemeLevel;
  levelLabel: string;
  description?: string;
  objectives?: string[];
  keyPoints?: string[];
  startDate?: string;
  endDate?: string;
  status: ThemeStatus;
  creatorId: string;
  creatorName: string;
  participantIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// 教研活动
export interface ResearchActivity {
  id: string;
  themeId: string;
  stageId?: string;
  title: string;
  type: ActivityType;
  typeLabel: string;
  description?: string;
  location?: string;
  scheduledAt?: string;
  duration?: number;
  hostId?: string;
  hostName?: string;
  participantIds?: string[];
  actualParticipantIds?: string[];
  status: ActivityStatus;
  meetingMinutes?: string;
  attachments?: any[];
  createdAt: string;
}

// 教研阶段
export interface ResearchStage {
  id: string;
  themeId: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: 'pending' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// 教研资源
export interface ResearchResource {
  id: string;
  title: string;
  resourceType: ResourceType;
  themeId: string;
  activityId?: string;
  fileKey?: string;
  fileUrl?: string;
  fileName?: string;
  type?: string;
  size?: number;
  teacherName?: string;
  activityTitle?: string;
  sourceType?: 'activity' | 'theme_direct';
  createdAt: string;
}

// 统计数据
export interface ResearchStatistics {
  overview: { label: string; value: number }[];
  typeStats: Record<string, number>;
}

// ==================== 配置常量 ====================

export const THEME_TYPE_LABELS: Record<ThemeType, string> = {
  big_unit: '大单元教学',
  project: '项目式教学',
  practice: '学科实践',
  ai_enabled: 'AI赋能教学',
  custom: '自定义主题',
};

export const THEME_LEVEL_LABELS: Record<ThemeLevel, string> = {
  school: '校级重点教研',
  grade: '年级组教研',
  subject_group: '备课组微教研',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  seminar: '研讨会',
  lesson_observation: '听课评课',
  collective_prep: '集体备课',
  training: '培训学习',
  workshop: '工作坊',
  salon: '教学沙龙',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  lesson_design: '教学设计',
  excellent_case: '优秀课例',
  academic_paper: '学术论文',
  courseware: '课件资源',
  other: '其他资源',
};

export const SUBJECTS = ['语文', '数学', '英语', '音乐', '体育', '美术', '科学', '道德与法治', '综合实践', '信息技术'];

// ==================== 通用请求函数 ====================

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    const json = await res.json();
    
    if (json.success) {
      return { data: json.data };
    }
    
    return { error: json.error || '请求失败' };
  } catch (err) {
    console.error('API请求错误:', err);
    return { error: '网络错误' };
  }
}

// ==================== 教研主题 Hook ====================

export function useResearchThemes() {
  const [themes, setThemes] = useState<ResearchTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载主题列表
  const loadThemes = useCallback(async (params?: {
    type?: ThemeType;
    subject?: string;
    status?: ThemeStatus;
    page?: number;
    pageSize?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.subject) searchParams.set('subject', params.subject);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    
    const { data, error } = await fetchAPI<ResearchTheme[]>(`/api/research/themes?${searchParams}`);
    
    setLoading(false);
    
    if (error) {
      setError(error);
      toast.error(error);
      return;
    }
    
    setThemes(data || []);
  }, []);

  // 创建主题
  const createTheme = useCallback(async (themeData: Partial<ResearchTheme>) => {
    const { data, error } = await fetchAPI<ResearchTheme>('/api/research/themes', {
      method: 'POST',
      body: JSON.stringify({
        title: themeData.title,
        type: themeData.type,
        subject: themeData.subject,
        level: themeData.level,
        description: themeData.description,
        objectives: themeData.objectives,
        startDate: themeData.startDate,
        endDate: themeData.endDate,
      }),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('教研主题创建成功');
    await loadThemes();
    return data;
  }, [loadThemes]);

  // 更新主题状态
  const updateThemeStatus = useCallback(async (themeId: string, status: ThemeStatus) => {
    const { error } = await fetchAPI(`/api/research/themes/${themeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    toast.success('状态更新成功');
    await loadThemes();
    return true;
  }, [loadThemes]);

  // 删除主题
  const deleteTheme = useCallback(async (themeId: string) => {
    const { error } = await fetchAPI(`/api/research/themes/${themeId}`, {
      method: 'DELETE',
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    toast.success('教研主题已删除');
    await loadThemes();
    return true;
  }, [loadThemes]);

  return {
    themes,
    loading,
    error,
    loadThemes,
    createTheme,
    updateThemeStatus,
    deleteTheme,
  };
}

// ==================== 单个教研主题 Hook ====================

export function useResearchTheme(themeId: string | null) {
  const [theme, setTheme] = useState<ResearchTheme | null>(null);
  const [stages, setStages] = useState<ResearchStage[]>([]);
  const [activities, setActivities] = useState<ResearchActivity[]>([]);
  const [resources, setResources] = useState<ResearchResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载主题详情
  const loadTheme = useCallback(async () => {
    if (!themeId) return;
    
    setLoading(true);
    setError(null);
    
    const { data, error } = await fetchAPI<{
      theme: ResearchTheme;
      stages: ResearchStage[];
      activities: ResearchActivity[];
      statistics: any;
    }>(`/api/research/themes/${themeId}`);
    
    setLoading(false);
    
    if (error) {
      setError(error);
      return;
    }
    
    if (data) {
      setTheme(data.theme);
      setStages(data.stages || []);
      setActivities(data.activities || []);
    }
  }, [themeId]);

  // 加载主题资源
  const loadResources = useCallback(async () => {
    if (!themeId) return;
    
    const { data } = await fetchAPI<ResearchResource[]>(`/api/research/resources?themeId=${themeId}`);
    setResources(data || []);
  }, [themeId]);

  // 更新主题
  const updateTheme = useCallback(async (updates: Partial<ResearchTheme>) => {
    if (!themeId) return null;
    
    const { data, error } = await fetchAPI<ResearchTheme>(`/api/research/themes/${themeId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('主题更新成功');
    setTheme(data || null);
    return data;
  }, [themeId]);

  // 创建阶段
  const createStage = useCallback(async (stageData: Partial<ResearchStage>) => {
    if (!themeId) return null;
    
    const { data, error } = await fetchAPI<ResearchStage>('/api/research/stages', {
      method: 'POST',
      body: JSON.stringify({
        themeId,
        ...stageData,
      }),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('阶段创建成功');
    await loadTheme();
    return data;
  }, [themeId, loadTheme]);

  // 创建活动
  const createActivity = useCallback(async (activityData: Partial<ResearchActivity>) => {
    if (!themeId) return null;
    
    const { data, error } = await fetchAPI<ResearchActivity>('/api/research/activities', {
      method: 'POST',
      body: JSON.stringify({
        themeId,
        ...activityData,
      }),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('活动创建成功');
    await loadTheme();
    return data;
  }, [themeId, loadTheme]);

  // 上传资源
  const uploadResource = useCallback(async (resourceData: Partial<ResearchResource>) => {
    if (!themeId) return null;
    
    const { data, error } = await fetchAPI<ResearchResource>('/api/research/resources', {
      method: 'POST',
      body: JSON.stringify({
        themeId,
        ...resourceData,
      }),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('资源上传成功');
    await loadResources();
    return data;
  }, [themeId, loadResources]);

  useEffect(() => {
    if (themeId) {
      loadTheme();
      loadResources();
    }
  }, [themeId, loadTheme, loadResources]);

  return {
    theme,
    stages,
    activities,
    resources,
    loading,
    error,
    loadTheme,
    loadResources,
    updateTheme,
    createStage,
    createActivity,
    uploadResource,
  };
}

// ==================== 教研活动 Hook ====================

export function useResearchActivities() {
  const [activities, setActivities] = useState<ResearchActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载活动列表
  const loadActivities = useCallback(async (params?: {
    themeId?: string;
    stageId?: string;
    type?: ActivityType;
    status?: ActivityStatus;
  }) => {
    setLoading(true);
    setError(null);
    
    const searchParams = new URLSearchParams();
    if (params?.themeId) searchParams.set('themeId', params.themeId);
    if (params?.stageId) searchParams.set('stageId', params.stageId);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.status) searchParams.set('status', params.status);
    
    const { data, error } = await fetchAPI<ResearchActivity[]>(`/api/research/activities?${searchParams}`);
    
    setLoading(false);
    
    if (error) {
      setError(error);
      return;
    }
    
    setActivities(data || []);
  }, []);

  // 创建活动
  const createActivity = useCallback(async (activityData: Partial<ResearchActivity>) => {
    const { data, error } = await fetchAPI<ResearchActivity>('/api/research/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('活动创建成功');
    return data;
  }, []);

  return {
    activities,
    loading,
    error,
    loadActivities,
    createActivity,
  };
}

// ==================== 单个教研活动 Hook ====================

export function useResearchActivity(activityId: string | null) {
  const [activity, setActivity] = useState<ResearchActivity | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载活动详情
  const loadActivity = useCallback(async () => {
    if (!activityId) return;
    
    setLoading(true);
    setError(null);
    
    const { data, error } = await fetchAPI<{
      activity: ResearchActivity;
      participants: any[];
      theme: ResearchTheme;
      stage?: ResearchStage;
    }>(`/api/research/activities/${activityId}`);
    
    setLoading(false);
    
    if (error) {
      setError(error);
      return;
    }
    
    if (data) {
      setActivity(data.activity);
      setParticipants(data.participants || []);
    }
  }, [activityId]);

  // 更新活动
  const updateActivity = useCallback(async (updates: Partial<ResearchActivity>) => {
    if (!activityId) return null;
    
    const { data, error } = await fetchAPI<ResearchActivity>(`/api/research/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('活动更新成功');
    setActivity(data || null);
    return data;
  }, [activityId]);

  // 完成活动
  const completeActivity = useCallback(async (meetingMinutes?: string, attachments?: any[]) => {
    if (!activityId) return false;
    
    const { error } = await fetchAPI(`/api/research/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'completed',
        meetingMinutes,
        attachments,
      }),
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    toast.success('活动已完成');
    await loadActivity();
    return true;
  }, [activityId, loadActivity]);

  // 删除活动
  const deleteActivity = useCallback(async () => {
    if (!activityId) return false;
    
    const { error } = await fetchAPI(`/api/research/activities/${activityId}`, {
      method: 'DELETE',
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    toast.success('活动已删除');
    return true;
  }, [activityId]);

  useEffect(() => {
    if (activityId) {
      loadActivity();
    }
  }, [activityId, loadActivity]);

  return {
    activity,
    participants,
    loading,
    error,
    loadActivity,
    updateActivity,
    completeActivity,
    deleteActivity,
  };
}

// ==================== 教研资源 Hook ====================

export function useResearchResources() {
  const [resources, setResources] = useState<ResearchResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载资源列表
  const loadResources = useCallback(async (params?: {
    themeId?: string;
    activityId?: string;
    resourceType?: ResourceType;
  }) => {
    setLoading(true);
    setError(null);
    
    const searchParams = new URLSearchParams();
    if (params?.themeId) searchParams.set('themeId', params.themeId);
    if (params?.activityId) searchParams.set('activityId', params.activityId);
    if (params?.resourceType) searchParams.set('resourceType', params.resourceType);
    
    const { data, error } = await fetchAPI<ResearchResource[]>(`/api/research/resources?${searchParams}`);
    
    setLoading(false);
    
    if (error) {
      setError(error);
      return;
    }
    
    setResources(data || []);
  }, []);

  // 上传资源
  const uploadResource = useCallback(async (resourceData: Partial<ResearchResource>) => {
    const { data, error } = await fetchAPI<ResearchResource>('/api/research/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('资源上传成功');
    return data;
  }, []);

  // 删除资源
  const deleteResource = useCallback(async (resourceId: string) => {
    const { error } = await fetchAPI(`/api/research/resources/${resourceId}`, {
      method: 'DELETE',
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    toast.success('资源已删除');
    setResources(prev => prev.filter(r => r.id !== resourceId));
    return true;
  }, []);

  return {
    resources,
    loading,
    error,
    loadResources,
    uploadResource,
    deleteResource,
  };
}

// ==================== 教研统计 Hook ====================

export function useResearchStatistics() {
  const [statistics, setStatistics] = useState<ResearchStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载统计数据
  const loadStatistics = useCallback(async (type: 'overview' | 'subject' | 'theme' = 'overview', themeId?: string) => {
    setLoading(true);
    
    const searchParams = new URLSearchParams();
    searchParams.set('type', type);
    if (themeId) searchParams.set('themeId', themeId);
    
    const { data } = await fetchAPI<ResearchStatistics>(`/api/research/statistics?${searchParams}`);
    
    setLoading(false);
    setStatistics(data || null);
  }, []);

  return {
    statistics,
    loading,
    loadStatistics,
  };
}

// ==================== 教研阶段 Hook ====================

export function useResearchStages() {
  const [stages, setStages] = useState<ResearchStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载阶段列表
  const loadStages = useCallback(async (themeId: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await fetchAPI<ResearchStage[]>(`/api/research/stages?themeId=${themeId}`);
    
    setLoading(false);
    
    if (error) {
      setError(error);
      return;
    }
    
    setStages(data || []);
  }, []);

  // 创建阶段
  const createStage = useCallback(async (stageData: Partial<ResearchStage>) => {
    const { data, error } = await fetchAPI<ResearchStage>('/api/research/stages', {
      method: 'POST',
      body: JSON.stringify(stageData),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('阶段创建成功');
    return data;
  }, []);

  // 更新阶段
  const updateStage = useCallback(async (stageId: string, updates: Partial<ResearchStage>) => {
    const { data, error } = await fetchAPI<ResearchStage>(`/api/research/stages/${stageId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    if (error) {
      toast.error(error);
      return null;
    }
    
    toast.success('阶段更新成功');
    return data;
  }, []);

  // 删除阶段
  const deleteStage = useCallback(async (stageId: string) => {
    const { error } = await fetchAPI(`/api/research/stages/${stageId}`, {
      method: 'DELETE',
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    toast.success('阶段已删除');
    return true;
  }, []);

  // 重新排序阶段
  const reorderStages = useCallback(async (stageIds: string[]) => {
    const { error } = await fetchAPI('/api/research/stages/reorder', {
      method: 'POST',
      body: JSON.stringify({ stageIds }),
    });
    
    if (error) {
      toast.error(error);
      return false;
    }
    
    return true;
  }, []);

  return {
    stages,
    loading,
    error,
    loadStages,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
}
