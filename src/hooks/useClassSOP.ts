/**
 * 班级 SOP 智能台账 Hook 层
 * 
 * 提供数据获取和操作能力
 * 
 * @module hooks/useClassSOP
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  SOPTemplate,
  SOPExecution,
  LedgerEntry,
  SOPTemplateQueryParams,
  ExecutionQueryParams,
  LedgerQueryParams,
  CreateSOPTemplateParams,
  UpdateSOPTemplateParams,
  CreateExecutionParams,
  UpdateStepExecutionParams,
  CompleteExecutionParams,
  CreateLedgerEntryParams,
  UpdateLedgerEntryParams,
  LedgerStatistics,
  SOPUsageStatistics,
  SOPCategory,
  ExecutionStatus,
  StepStatus,
  Attachment,
  Signature,
} from '@/types/class-sop';

// ==================== 工具函数 ====================

async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    return response.json();
  } catch (error) {
    console.error('API 请求失败:', error);
    return { success: false, error: '网络请求失败' };
  }
}

// ==================== SOP 模板 Hooks ====================

/** 获取 SOP 模板列表 */
export function useSOPTemplates(params?: SOPTemplateQueryParams) {
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
    if (params?.isSystem !== undefined) queryParams.set('isSystem', String(params.isSystem));
    if (params?.search) queryParams.set('search', params.search);
    
    const result = await fetchApi<SOPTemplate[]>(
      `/api/class-sop/templates?${queryParams.toString()}`
    );
    
    if (result.success && result.data) {
      setTemplates(result.data);
    } else {
      setError(result.error || '获取模板列表失败');
    }
    
    setLoading(false);
  }, [params?.category, params?.isActive, params?.isSystem, params?.search]);
  
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
  };
}

/** 获取单个 SOP 模板 */
export function useSOPTemplate(id: string | null) {
  const [template, setTemplate] = useState<SOPTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) {
      setTemplate(null);
      setLoading(false);
      return;
    }
    
    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);
      
      const result = await fetchApi<SOPTemplate>(`/api/class-sop/templates/${id}`);
      
      if (result.success && result.data) {
        setTemplate(result.data);
      } else {
        setError(result.error || '获取模板详情失败');
      }
      
      setLoading(false);
    };
    
    fetchTemplate();
  }, [id]);
  
  return { template, loading, error };
}

/** SOP 模板操作 */
export function useSOPTemplateActions() {
  const createTemplate = useCallback(async (params: CreateSOPTemplateParams) => {
    const result = await fetchApi<SOPTemplate>('/api/class-sop/templates', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    return result;
  }, []);
  
  const updateTemplate = useCallback(async (id: string, params: UpdateSOPTemplateParams) => {
    const result = await fetchApi<SOPTemplate>(`/api/class-sop/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
    
    return result;
  }, []);
  
  const deleteTemplate = useCallback(async (id: string) => {
    const result = await fetchApi<void>(`/api/class-sop/templates/${id}`, {
      method: 'DELETE',
    });
    
    return result;
  }, []);
  
  return {
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

// ==================== 执行记录 Hooks ====================

/** 获取执行记录列表 */
export function useSOPExecutions(params?: ExecutionQueryParams) {
  const [executions, setExecutions] = useState<SOPExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const queryParams = new URLSearchParams();
    if (params?.templateId) queryParams.set('templateId', params.templateId);
    if (params?.classId) queryParams.set('classId', params.classId);
    if (params?.executorId) queryParams.set('executorId', params.executorId);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    
    const result = await fetchApi<SOPExecution[]>(
      `/api/class-sop/executions?${queryParams.toString()}`
    );
    
    if (result.success && result.data) {
      setExecutions(result.data);
    } else {
      setError(result.error || '获取执行记录列表失败');
    }
    
    setLoading(false);
  }, [
    params?.templateId,
    params?.classId,
    params?.executorId,
    params?.category,
    params?.status,
    params?.startDate,
    params?.endDate,
  ]);
  
  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);
  
  return {
    executions,
    loading,
    error,
    refresh: fetchExecutions,
  };
}

/** 获取单个执行记录 */
export function useSOPExecution(id: string | null) {
  const [execution, setExecution] = useState<SOPExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchExecution = useCallback(async () => {
    if (!id) {
      setExecution(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const result = await fetchApi<SOPExecution>(`/api/class-sop/executions/${id}`);
    
    if (result.success && result.data) {
      setExecution(result.data);
    } else {
      setError(result.error || '获取执行记录详情失败');
    }
    
    setLoading(false);
  }, [id]);
  
  useEffect(() => {
    fetchExecution();
  }, [fetchExecution]);
  
  return { execution, loading, error, refresh: fetchExecution };
}

/** 执行记录操作 */
export function useSOPExecutionActions() {
  const startExecution = useCallback(async (params: CreateExecutionParams & {
    executorId: string;
    executorName: string;
    className: string;
  }) => {
    const result = await fetchApi<SOPExecution>('/api/class-sop/executions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    return result;
  }, []);
  
  const updateStep = useCallback(async (
    executionId: string,
    stepOrder: number,
    action: 'start' | 'complete' | 'skip',
    data?: { content?: string; attachments?: Attachment[] }
  ) => {
    const result = await fetchApi<SOPExecution>(
      `/api/class-sop/executions/${executionId}/steps`,
      {
        method: 'POST',
        body: JSON.stringify({
          action,
          stepOrder,
          content: data?.content,
          attachments: data?.attachments,
        }),
      }
    );
    
    return result;
  }, []);
  
  const completeExecution = useCallback(async (
    executionId: string,
    summary: string,
    signatures?: Signature[]
  ) => {
    const result = await fetchApi<SOPExecution>(
      `/api/class-sop/executions/${executionId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ summary, signatures }),
      }
    );
    
    return result;
  }, []);
  
  const abortExecution = useCallback(async (executionId: string) => {
    const result = await fetchApi<SOPExecution>(
      `/api/class-sop/executions/${executionId}`,
      { method: 'DELETE' }
    );
    
    return result;
  }, []);
  
  return {
    startExecution,
    updateStep,
    completeExecution,
    abortExecution,
  };
}

// ==================== 台账 Hooks ====================

/** 获取台账列表 */
export function useLedgerEntries(params?: LedgerQueryParams) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);
    if (params?.classId) queryParams.set('classId', params.classId);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.handlerId) queryParams.set('handlerId', params.handlerId);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.followUpRequired !== undefined) {
      queryParams.set('followUpRequired', String(params.followUpRequired));
    }
    if (params?.search) queryParams.set('search', params.search);
    
    const result = await fetchApi<LedgerEntry[]>(
      `/api/class-sop/ledger?${queryParams.toString()}`
    );
    
    if (result.success && result.data) {
      setEntries(result.data);
    } else {
      setError(result.error || '获取台账列表失败');
    }
    
    setLoading(false);
  }, [
    params?.type,
    params?.classId,
    params?.status,
    params?.severity,
    params?.handlerId,
    params?.startDate,
    params?.endDate,
    params?.followUpRequired,
    params?.search,
  ]);
  
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);
  
  return {
    entries,
    loading,
    error,
    refresh: fetchEntries,
  };
}

/** 获取单个台账条目 */
export function useLedgerEntry(id: string | null) {
  const [entry, setEntry] = useState<LedgerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) {
      setEntry(null);
      setLoading(false);
      return;
    }
    
    const fetchEntry = async () => {
      setLoading(true);
      setError(null);
      
      const result = await fetchApi<LedgerEntry>(`/api/class-sop/ledger/${id}`);
      
      if (result.success && result.data) {
        setEntry(result.data);
      } else {
        setError(result.error || '获取台账详情失败');
      }
      
      setLoading(false);
    };
    
    fetchEntry();
  }, [id]);
  
  return { entry, loading, error };
}

/** 台账操作 */
export function useLedgerActions() {
  const createEntry = useCallback(async (
    params: CreateLedgerEntryParams & { className: string }
  ) => {
    const result = await fetchApi<LedgerEntry>('/api/class-sop/ledger', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    return result;
  }, []);
  
  const updateEntry = useCallback(async (id: string, params: UpdateLedgerEntryParams) => {
    const result = await fetchApi<LedgerEntry>(`/api/class-sop/ledger/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
    
    return result;
  }, []);
  
  const deleteEntry = useCallback(async (id: string) => {
    const result = await fetchApi<void>(`/api/class-sop/ledger/${id}`, {
      method: 'DELETE',
    });
    
    return result;
  }, []);
  
  const resolveEntry = useCallback(async (id: string, notes?: string) => {
    const result = await fetchApi<LedgerEntry>(
      `/api/class-sop/ledger/${id}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    );
    
    return result;
  }, []);
  
  return {
    createEntry,
    updateEntry,
    deleteEntry,
    resolveEntry,
  };
}

// ==================== 统计 Hooks ====================

/** 获取统计数据 */
export function useSOPStatistics(classId?: string) {
  const [statistics, setStatistics] = useState<{
    ledger: LedgerStatistics;
    usage: SOPUsageStatistics[];
    efficiency: {
      avgCompletionTime: number;
      completionRate: number;
      timeoutRate: number;
      skipRate: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (classId) queryParams.set('classId', classId);
      
      const result = await fetchApi<{
        ledger: LedgerStatistics;
        usage: SOPUsageStatistics[];
        efficiency: {
          avgCompletionTime: number;
          completionRate: number;
          timeoutRate: number;
          skipRate: number;
        };
      }>(`/api/class-sop/statistics?${queryParams.toString()}`);
      
      if (result.success && result.data) {
        setStatistics(result.data);
      } else {
        setError(result.error || '获取统计数据失败');
      }
      
      setLoading(false);
    };
    
    fetchStatistics();
  }, [classId]);
  
  return { statistics, loading, error };
}

// ==================== 组合 Hook ====================

/** 班级 SOP 智能台账主 Hook */
export function useClassSOP(classId?: string) {
  const templateActions = useSOPTemplateActions();
  const executionActions = useSOPExecutionActions();
  const ledgerActions = useLedgerActions();
  
  const { templates, loading: templatesLoading, refresh: refreshTemplates } = useSOPTemplates({
    isActive: true,
  });
  
  const { executions, loading: executionsLoading, refresh: refreshExecutions } = useSOPExecutions({
    classId,
  });
  
  const { entries, loading: entriesLoading, refresh: refreshEntries } = useLedgerEntries({
    classId,
  });
  
  const { statistics, loading: statisticsLoading } = useSOPStatistics(classId);
  
  return {
    // 数据
    templates,
    executions,
    entries,
    statistics,
    
    // 加载状态
    loading: templatesLoading || executionsLoading || entriesLoading || statisticsLoading,
    
    // 刷新
    refreshTemplates,
    refreshExecutions,
    refreshEntries,
    
    // 操作
    templateActions,
    executionActions,
    ledgerActions,
  };
}
