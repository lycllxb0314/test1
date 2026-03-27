/**
 * 班级 SOP 智能台账 Repository 层
 * 
 * 负责数据库操作，将数据库行转换为业务模型
 * 使用 Supabase 作为数据库
 * 
 * @module repositories/class-sop.repository
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  SOPTemplateRow,
  SOPTemplate,
  SOPExecutionRow,
  SOPExecution,
  LedgerEntryRow,
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
  SOPStep,
  StepExecution,
  StepStatus,
  Attachment,
  Signature,
} from '@/types/class-sop';

// ==================== 工具函数 ====================

/** 驼峰转蛇形 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/** 对象键驼峰转蛇形 */
function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

/** 蛇形转驼峰 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** 对象键蛇形转驼峰 */
function toCamelCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => toCamelCase(item)) as T;
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = value && typeof value === 'object' && !Array.isArray(value) 
      ? toCamelCase(value as Record<string, unknown>) 
      : Array.isArray(value) 
        ? value.map(item => typeof item === 'object' && item !== null ? toCamelCase(item as Record<string, unknown>) : item)
        : value;
  }
  return result as T;
}

// ==================== SOP 模板 Repository ====================

export const sopTemplateRepository = {
  /** 查询 SOP 模板列表 */
  async findMany(params: SOPTemplateQueryParams = {}): Promise<SOPTemplate[]> {
    const client = getSupabaseClient();
    const { category, isActive, isSystem, search } = params;
    
    let query = client
      .from('sop_templates')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }
    if (isSystem !== undefined) {
      query = query.eq('is_system', isSystem);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching SOP templates:', error);
      return [];
    }
    
    return (data || []).map(row => toCamelCase<SOPTemplate>(row as Record<string, unknown>));
  },

  /** 根据 ID 查询 SOP 模板 */
  async findById(id: string): Promise<SOPTemplate | null> {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('sop_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching SOP template:', error);
      return null;
    }
    
    return data ? toCamelCase<SOPTemplate>(data as Record<string, unknown>) : null;
  },

  /** 创建 SOP 模板 */
  async create(params: CreateSOPTemplateParams & { creatorId?: string; schoolId?: string }): Promise<SOPTemplate> {
    const client = getSupabaseClient();
    
    const data = {
      name: params.name,
      category: params.category,
      description: params.description,
      steps: params.steps,
      applicable_roles: params.applicableRoles || ['班主任'],
      evidence_required: params.evidenceRequired ?? true,
      timeout_minutes: params.timeoutMinutes ?? null,
      is_system: false,
      creator_id: params.creatorId ?? null,
      school_id: params.schoolId ?? null,
      is_active: true,
      usage_count: 0,
    };
    
    const { data: result, error } = await client
      .from('sop_templates')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create SOP template: ${error.message}`);
    }
    
    return toCamelCase<SOPTemplate>(result as Record<string, unknown>);
  },

  /** 更新 SOP 模板 */
  async update(id: string, params: UpdateSOPTemplateParams): Promise<SOPTemplate> {
    const client = getSupabaseClient();
    
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (params.name !== undefined) data.name = params.name;
    if (params.category !== undefined) data.category = params.category;
    if (params.description !== undefined) data.description = params.description;
    if (params.steps !== undefined) data.steps = params.steps;
    if (params.applicableRoles !== undefined) data.applicable_roles = params.applicableRoles;
    if (params.evidenceRequired !== undefined) data.evidence_required = params.evidenceRequired;
    if (params.timeoutMinutes !== undefined) data.timeout_minutes = params.timeoutMinutes;
    if (params.isActive !== undefined) data.is_active = params.isActive;
    
    const { data: result, error } = await client
      .from('sop_templates')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update SOP template: ${error.message}`);
    }
    
    return toCamelCase<SOPTemplate>(result as Record<string, unknown>);
  },

  /** 删除 SOP 模板（软删除） */
  async delete(id: string): Promise<void> {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('sop_templates')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete SOP template: ${error.message}`);
    }
  },

  /** 增加使用次数 */
  async incrementUsage(id: string): Promise<void> {
    const client = getSupabaseClient();
    
    // 先获取当前计数
    const { data: template, error: fetchError } = await client
      .from('sop_templates')
      .select('usage_count')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching template usage count:', fetchError);
      return;
    }
    
    // 更新计数
    const { error } = await client
      .from('sop_templates')
      .update({ 
        usage_count: (template?.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error incrementing usage count:', error);
    }
  },
};

// ==================== 执行记录 Repository ====================

export const sopExecutionRepository = {
  /** 查询执行记录列表 */
  async findMany(params: ExecutionQueryParams = {}): Promise<SOPExecution[]> {
    const client = getSupabaseClient();
    const { templateId, classId, executorId, category, status, startDate, endDate } = params;
    
    let query = client
      .from('sop_executions')
      .select('*')
      .order('started_at', { ascending: false });
    
    if (templateId) {
      query = query.eq('template_id', templateId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (executorId) {
      query = query.eq('executor_id', executorId);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    if (endDate) {
      query = query.lte('started_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching executions:', error);
      return [];
    }
    
    return (data || []).map(row => toCamelCase<SOPExecution>(row as Record<string, unknown>));
  },

  /** 根据 ID 查询执行记录 */
  async findById(id: string): Promise<SOPExecution | null> {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('sop_executions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching execution:', error);
      return null;
    }
    
    return data ? toCamelCase<SOPExecution>(data as Record<string, unknown>) : null;
  },

  /** 创建执行记录 */
  async create(params: CreateExecutionParams & {
    templateName: string;
    category: string;
    executorId: string;
    executorName: string;
    className: string;
    steps: SOPExecution['steps'];
  }): Promise<SOPExecution> {
    const client = getSupabaseClient();
    
    const data = {
      template_id: params.templateId,
      template_name: params.templateName,
      category: params.category,
      executor_id: params.executorId,
      executor_name: params.executorName,
      class_id: params.classId,
      class_name: params.className,
      started_at: new Date().toISOString(),
      completed_at: null,
      status: 'in_progress',
      steps: params.steps,
      summary: null,
      attachments: [],
      signatures: [],
      metadata: null,
    };
    
    const { data: result, error } = await client
      .from('sop_executions')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create execution: ${error.message}`);
    }
    
    return toCamelCase<SOPExecution>(result as Record<string, unknown>);
  },

  /** 更新步骤执行状态 */
  async updateStep(params: UpdateStepExecutionParams): Promise<SOPExecution> {
    const client = getSupabaseClient();
    
    const execution = await sopExecutionRepository.findById(params.executionId);
    if (!execution) {
      throw new Error('执行记录不存在');
    }
    
    const steps = execution.steps.map((step: StepExecution) => {
      if (step.stepOrder === params.stepOrder) {
        return {
          ...step,
          status: params.status,
          content: params.content,
          attachments: params.attachments || step.attachments,
          completedAt: params.status === 'completed' ? new Date().toISOString() : step.completedAt,
          startedAt: params.status === 'in_progress' && !step.startedAt 
            ? new Date().toISOString() 
            : step.startedAt,
        };
      }
      return step;
    });
    
    const { data: result, error } = await client
      .from('sop_executions')
      .update({
        steps: steps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.executionId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update step: ${error.message}`);
    }
    
    return toCamelCase<SOPExecution>(result as Record<string, unknown>);
  },

  /** 完成执行 */
  async complete(params: CompleteExecutionParams): Promise<SOPExecution> {
    const client = getSupabaseClient();
    
    const data: Record<string, unknown> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      summary: params.summary,
      updated_at: new Date().toISOString(),
    };
    
    if (params.signatures && params.signatures.length > 0) {
      data.signatures = params.signatures;
    }
    
    const { data: result, error } = await client
      .from('sop_executions')
      .update(data)
      .eq('id', params.executionId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to complete execution: ${error.message}`);
    }
    
    return toCamelCase<SOPExecution>(result as Record<string, unknown>);
  },

  /** 中止执行 */
  async abort(id: string): Promise<SOPExecution> {
    const client = getSupabaseClient();
    
    const { data: result, error } = await client
      .from('sop_executions')
      .update({
        status: 'aborted',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to abort execution: ${error.message}`);
    }
    
    return toCamelCase<SOPExecution>(result as Record<string, unknown>);
  },
};

// ==================== 台账条目 Repository ====================

export const ledgerEntryRepository = {
  /** 查询台账条目列表 */
  async findMany(params: LedgerQueryParams = {}): Promise<LedgerEntry[]> {
    const client = getSupabaseClient();
    const { type, classId, status, severity, handlerId, startDate, endDate, followUpRequired, search } = params;
    
    let query = client
      .from('ledger_entries')
      .select('*')
      .order('occurred_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (handlerId) {
      query = query.eq('handler_id', handlerId);
    }
    if (startDate) {
      query = query.gte('occurred_at', startDate);
    }
    if (endDate) {
      query = query.lte('occurred_at', endDate);
    }
    if (followUpRequired !== undefined) {
      query = query.eq('follow_up_required', followUpRequired);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching ledger entries:', error);
      return [];
    }
    
    return (data || []).map(row => toCamelCase<LedgerEntry>(row as Record<string, unknown>));
  },

  /** 根据 ID 查询台账条目 */
  async findById(id: string): Promise<LedgerEntry | null> {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('ledger_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching ledger entry:', error);
      return null;
    }
    
    return data ? toCamelCase<LedgerEntry>(data as Record<string, unknown>) : null;
  },

  /** 创建台账条目 */
  async create(params: CreateLedgerEntryParams & { className: string }): Promise<LedgerEntry> {
    const client = getSupabaseClient();
    
    const data = {
      type: params.type,
      title: params.title,
      description: params.description,
      class_id: params.classId,
      class_name: params.className,
      involved_persons: params.involvedPersons || [],
      execution_id: params.executionId ?? null,
      occurred_at: params.occurredAt ?? new Date().toISOString(),
      resolved_at: null,
      status: 'open',
      severity: params.severity ?? 'medium',
      handler_id: params.handlerId,
      handler_name: params.handlerName,
      follow_up_required: params.followUpRequired ?? false,
      follow_up_date: params.followUpDate ?? null,
      follow_up_notes: null,
      tags: params.tags || [],
      metadata: null,
    };
    
    const { data: result, error } = await client
      .from('ledger_entries')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create ledger entry: ${error.message}`);
    }
    
    return toCamelCase<LedgerEntry>(result as Record<string, unknown>);
  },

  /** 更新台账条目 */
  async update(id: string, params: UpdateLedgerEntryParams): Promise<LedgerEntry> {
    const client = getSupabaseClient();
    
    const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (params.title !== undefined) data.title = params.title;
    if (params.description !== undefined) data.description = params.description;
    if (params.involvedPersons !== undefined) data.involved_persons = params.involvedPersons;
    if (params.severity !== undefined) data.severity = params.severity;
    if (params.status !== undefined) data.status = params.status;
    if (params.resolvedAt !== undefined) data.resolved_at = params.resolvedAt;
    if (params.followUpRequired !== undefined) data.follow_up_required = params.followUpRequired;
    if (params.followUpDate !== undefined) data.follow_up_date = params.followUpDate;
    if (params.followUpNotes !== undefined) data.follow_up_notes = params.followUpNotes;
    if (params.tags !== undefined) data.tags = params.tags;
    
    const { data: result, error } = await client
      .from('ledger_entries')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update ledger entry: ${error.message}`);
    }
    
    return toCamelCase<LedgerEntry>(result as Record<string, unknown>);
  },

  /** 删除台账条目 */
  async delete(id: string): Promise<void> {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('ledger_entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete ledger entry: ${error.message}`);
    }
  },

  /** 获取统计数据 */
  async getStatistics(classId?: string): Promise<LedgerStatistics> {
    const client = getSupabaseClient();
    
    let baseQuery = client.from('ledger_entries').select('*');
    if (classId) {
      baseQuery = baseQuery.eq('class_id', classId);
    }
    
    const { data, error } = await baseQuery;
    
    if (error) {
      console.error('Error fetching statistics:', error);
      return {
        total: 0,
        byType: {} as LedgerStatistics['byType'],
        byStatus: {} as LedgerStatistics['byStatus'],
        bySeverity: {} as LedgerStatistics['bySeverity'],
        followUpPending: 0,
        resolvedThisMonth: 0,
      };
    }
    
    const entries = data || [];
    
    const byType = entries.reduce((acc: Record<string, number>, entry) => {
      const type = entry.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) as LedgerStatistics['byType'];
    
    const byStatus = entries.reduce((acc: Record<string, number>, entry) => {
      const status = entry.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) as LedgerStatistics['byStatus'];
    
    const bySeverity = entries.reduce((acc: Record<string, number>, entry) => {
      const severity = entry.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {}) as LedgerStatistics['bySeverity'];
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const followUpPending = entries.filter((entry: Record<string, unknown>) => 
      entry.follow_up_required === true && 
      (!entry.follow_up_date || new Date(entry.follow_up_date as string) >= now)
    ).length;
    
    const resolvedThisMonth = entries.filter((entry: Record<string, unknown>) => 
      entry.resolved_at && new Date(entry.resolved_at as string) >= firstDayOfMonth
    ).length;
    
    return {
      total: entries.length,
      byType,
      byStatus,
      bySeverity,
      followUpPending,
      resolvedThisMonth,
    };
  },
};

// ==================== SOP 使用统计 Repository ====================

export const sopUsageRepository = {
  /** 获取 SOP 使用统计 */
  async getUsageStatistics(startDate?: string, endDate?: string): Promise<SOPUsageStatistics[]> {
    const client = getSupabaseClient();
    
    let query = client
      .from('sop_executions')
      .select('template_id, template_name, category, status, started_at, completed_at');
    
    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    if (endDate) {
      query = query.lte('started_at', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching usage statistics:', error);
      return [];
    }
    
    const executions = data || [];
    
    // 按模板分组统计
    const templateStats = new Map<string, {
      templateId: string;
      templateName: string;
      category: string;
      executions: Record<string, unknown>[];
    }>();
    
    executions.forEach((exec: Record<string, unknown>) => {
      const templateId = exec.template_id as string;
      if (!templateStats.has(templateId)) {
        templateStats.set(templateId, {
          templateId,
          templateName: exec.template_name as string,
          category: exec.category as string,
          executions: [],
        });
      }
      templateStats.get(templateId)!.executions.push(exec);
    });
    
    return Array.from(templateStats.values()).map(stat => {
      const completed = stat.executions.filter((e: Record<string, unknown>) => e.status === 'completed');
      
      let totalTime = 0;
      let count = 0;
      completed.forEach((e: Record<string, unknown>) => {
        if (e.started_at && e.completed_at) {
          const start = new Date(e.started_at as string).getTime();
          const end = new Date(e.completed_at as string).getTime();
          totalTime += (end - start) / (1000 * 60); // 转换为分钟
          count++;
        }
      });
      
      return {
        templateId: stat.templateId,
        templateName: stat.templateName,
        category: stat.category as SOPCategory,
        executionCount: stat.executions.length,
        completedCount: completed.length,
        avgCompletionTime: count > 0 ? totalTime / count : undefined,
      };
    }).sort((a, b) => b.executionCount - a.executionCount);
  },
};

// ==================== 导出 ====================

export const classSopRepository = {
  template: sopTemplateRepository,
  execution: sopExecutionRepository,
  ledger: ledgerEntryRepository,
  usage: sopUsageRepository,
};
