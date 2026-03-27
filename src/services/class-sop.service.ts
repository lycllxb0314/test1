/**
 * 班级 SOP 智能台账 Service 层
 * 
 * 核心业务逻辑：
 * 1. SOP 模板管理 - 创建、编辑、分享标准操作流程
 * 2. 执行记录管理 - 按步骤执行、留痕、签字确认
 * 3. 台账管理 - 自动生成、查询、统计、导出
 * 4. 提醒机制 - 时间/事件触发的工作提醒
 * 
 * @module services/class-sop.service
 */

import { classSopRepository } from '@/repositories/class-sop.repository';
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
  SOPStep,
  StepExecution,
  StepStatus,
} from '@/types/class-sop';

// ==================== SOP 模板 Service ====================

export const sopTemplateService = {
  /** 获取 SOP 模板列表 */
  async getTemplates(params: SOPTemplateQueryParams = {}): Promise<SOPTemplate[]> {
    return classSopRepository.template.findMany(params);
  },

  /** 获取单个 SOP 模板 */
  async getTemplate(id: string): Promise<SOPTemplate | null> {
    return classSopRepository.template.findById(id);
  },

  /** 创建 SOP 模板 */
  async createTemplate(
    params: CreateSOPTemplateParams,
    context?: { creatorId?: string; schoolId?: string }
  ): Promise<SOPTemplate> {
    // 验证步骤顺序
    const steps = params.steps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));
    
    return classSopRepository.template.create({
      ...params,
      steps,
      creatorId: context?.creatorId,
      schoolId: context?.schoolId,
    });
  },

  /** 更新 SOP 模板 */
  async updateTemplate(id: string, params: UpdateSOPTemplateParams): Promise<SOPTemplate> {
    // 如果更新步骤，重新排序
    if (params.steps) {
      params.steps = params.steps.map((step, index) => ({
        ...step,
        order: index + 1,
      }));
    }
    
    return classSopRepository.template.update(id, params);
  },

  /** 删除 SOP 模板（软删除） */
  async deleteTemplate(id: string): Promise<void> {
    return classSopRepository.template.delete(id);
  },

  /** 复制 SOP 模板 */
  async duplicateTemplate(id: string, newName?: string): Promise<SOPTemplate> {
    const original = await classSopRepository.template.findById(id);
    if (!original) {
      throw new Error('SOP 模板不存在');
    }
    
    return this.createTemplate({
      name: newName || `${original.name}（副本）`,
      category: original.category,
      description: original.description,
      steps: original.steps,
      applicableRoles: original.applicableRoles,
      evidenceRequired: original.evidenceRequired,
      timeoutMinutes: original.timeoutMinutes,
    });
  },

  /** 获取热门 SOP 模板 */
  async getPopularTemplates(limit: number = 10): Promise<SOPTemplate[]> {
    const templates = await classSopRepository.template.findMany({ isActive: true });
    return templates.slice(0, limit);
  },
};

// ==================== 执行记录 Service ====================

export const sopExecutionService = {
  /** 获取执行记录列表 */
  async getExecutions(params: ExecutionQueryParams = {}): Promise<SOPExecution[]> {
    return classSopRepository.execution.findMany(params);
  },

  /** 获取单个执行记录 */
  async getExecution(id: string): Promise<SOPExecution | null> {
    return classSopRepository.execution.findById(id);
  },

  /** 开始执行 SOP */
  async startExecution(
    params: CreateExecutionParams,
    context: {
      executorId: string;
      executorName: string;
      className: string;
    }
  ): Promise<SOPExecution> {
    // 获取 SOP 模板
    const template = await classSopRepository.template.findById(params.templateId);
    if (!template) {
      throw new Error('SOP 模板不存在');
    }
    
    // 初始化步骤执行记录
    const steps: StepExecution[] = template.steps.map(step => ({
      stepOrder: step.order,
      stepTitle: step.title,
      status: 'pending' as StepStatus,
      attachments: [],
    }));
    
    // 增加使用次数
    await classSopRepository.template.incrementUsage(params.templateId);
    
    // 创建执行记录
    return classSopRepository.execution.create({
      templateId: params.templateId,
      templateName: template.name,
      category: template.category,
      executorId: context.executorId,
      executorName: context.executorName,
      classId: params.classId,
      className: context.className,
      steps,
    });
  },

  /** 更新步骤执行状态 */
  async updateStep(params: UpdateStepExecutionParams): Promise<SOPExecution> {
    return classSopRepository.execution.updateStep(params);
  },

  /** 开始执行某个步骤 */
  async startStep(executionId: string, stepOrder: number): Promise<SOPExecution> {
    return classSopRepository.execution.updateStep({
      executionId,
      stepOrder,
      status: 'in_progress',
    });
  },

  /** 完成某个步骤 */
  async completeStep(
    executionId: string,
    stepOrder: number,
    content?: string,
    attachments?: SOPExecution['steps'][0]['attachments']
  ): Promise<SOPExecution> {
    return classSopRepository.execution.updateStep({
      executionId,
      stepOrder,
      status: 'completed',
      content,
      attachments,
    });
  },

  /** 跳过某个步骤 */
  async skipStep(executionId: string, stepOrder: number, reason: string): Promise<SOPExecution> {
    return classSopRepository.execution.updateStep({
      executionId,
      stepOrder,
      status: 'skipped',
      content: reason,
    });
  },

  /** 完成整个执行 */
  async complete(params: CompleteExecutionParams): Promise<SOPExecution> {
    const execution = await classSopRepository.execution.complete(params);
    
    // 自动创建台账条目
    await ledgerEntryService.createLedgerFromExecution(execution);
    
    return execution;
  },

  /** 中止执行 */
  async abort(executionId: string): Promise<SOPExecution> {
    return classSopRepository.execution.abort(executionId);
  },

  /** 获取当前用户的进行中执行 */
  async getInProgressByUser(userId: string): Promise<SOPExecution[]> {
    return classSopRepository.execution.findMany({
      executorId: userId,
      status: 'in_progress',
    });
  },

  /** 获取班级的执行历史 */
  async getHistoryByClass(classId: string, limit: number = 20): Promise<SOPExecution[]> {
    const executions = await classSopRepository.execution.findMany({ classId });
    return executions.slice(0, limit);
  },
};

// ==================== 台账 Service ====================

export const ledgerEntryService = {
  /** 获取台账条目列表 */
  async getLedgerEntries(params: LedgerQueryParams = {}): Promise<LedgerEntry[]> {
    return classSopRepository.ledger.findMany(params);
  },

  /** 获取单个台账条目 */
  async getLedgerEntry(id: string): Promise<LedgerEntry | null> {
    return classSopRepository.ledger.findById(id);
  },

  /** 创建台账条目 */
  async createLedgerEntry(
    params: CreateLedgerEntryParams,
    className: string
  ): Promise<LedgerEntry> {
    return classSopRepository.ledger.create({
      ...params,
      className,
    });
  },

  /** 从执行记录自动创建台账条目 */
  async createLedgerFromExecution(execution: SOPExecution): Promise<LedgerEntry | null> {
    // 只有特定类型才自动创建台账
    const autoCreateCategories = ['conflict', 'safety', 'discipline', 'emergency'];
    if (!autoCreateCategories.includes(execution.category)) {
      return null;
    }
    
    // 提取涉及人员
    const involvedPersons = execution.signatures.map(sig => ({
      id: sig.signerId,
      name: sig.signerName,
      role: sig.signerRole as 'student' | 'teacher' | 'parent' | 'other',
    }));
    
    // 确定严重程度
    const severity = this.determineSeverity(execution);
    
    // 确定是否需要后续跟进
    const followUpRequired = execution.category === 'conflict' || 
                            execution.category === 'safety' ||
                            execution.category === 'emergency';
    
    return classSopRepository.ledger.create({
      type: this.mapCategoryToLedgerType(execution.category),
      title: `${execution.templateName} - ${execution.className}`,
      description: execution.summary || `由 SOP 执行记录自动生成 (${execution.id})`,
      classId: execution.classId,
      className: execution.className,
      involvedPersons,
      executionId: execution.id,
      occurredAt: execution.startedAt,
      severity,
      handlerId: execution.executorId,
      handlerName: execution.executorName,
      followUpRequired,
      followUpDate: followUpRequired 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后跟进
        : undefined,
      tags: [execution.category],
    });
  },

  /** 更新台账条目 */
  async updateLedgerEntry(id: string, params: UpdateLedgerEntryParams): Promise<LedgerEntry> {
    return classSopRepository.ledger.update(id, params);
  },

  /** 删除台账条目 */
  async deleteLedgerEntry(id: string): Promise<void> {
    return classSopRepository.ledger.delete(id);
  },

  /** 解决台账条目 */
  async resolveLedgerEntry(id: string, notes?: string): Promise<LedgerEntry> {
    return classSopRepository.ledger.update(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      followUpNotes: notes,
    });
  },

  /** 关闭台账条目 */
  async closeLedgerEntry(id: string): Promise<LedgerEntry> {
    return classSopRepository.ledger.update(id, {
      status: 'closed',
    });
  },

  /** 获取统计数据 */
  async getStatistics(classId?: string): Promise<LedgerStatistics> {
    return classSopRepository.ledger.getStatistics(classId);
  },

  /** 获取待跟进的台账 */
  async getPendingFollowUps(classId?: string): Promise<LedgerEntry[]> {
    return classSopRepository.ledger.findMany({
      classId,
      followUpRequired: true,
      status: 'resolved',
    });
  },

  /** 映射 SOP 类别到台账类型 */
  mapCategoryToLedgerType(category: string): LedgerEntry['type'] {
    const mapping: Record<string, LedgerEntry['type']> = {
      conflict: 'incident',
      safety: 'safety',
      discipline: 'discipline',
      communication: 'communication',
      hygiene: 'routine',
      attendance: 'routine',
      activity: 'routine',
      emergency: 'incident',
    };
    return mapping[category] || 'routine';
  },

  /** 根据执行情况确定严重程度 */
  determineSeverity(execution: SOPExecution): LedgerEntry['severity'] {
    // 如果有超时，提高严重程度
    if (execution.status === 'timeout') {
      return 'high';
    }
    
    // 如果有跳过的必填步骤，提高严重程度
    const skippedRequired = execution.steps.filter(
      s => s.status === 'skipped'
    ).length;
    if (skippedRequired > 0) {
      return 'medium';
    }
    
    // 根据类别默认值
    const categorySeverity: Record<string, LedgerEntry['severity']> = {
      emergency: 'critical',
      safety: 'high',
      conflict: 'medium',
      discipline: 'medium',
      communication: 'low',
      hygiene: 'low',
      attendance: 'low',
      activity: 'low',
    };
    
    return categorySeverity[execution.category] || 'medium';
  },
};

// ==================== 使用统计 Service ====================

export const sopUsageService = {
  /** 获取 SOP 使用统计 */
  async getUsageStatistics(
    startDate?: string,
    endDate?: string
  ): Promise<SOPUsageStatistics[]> {
    return classSopRepository.usage.getUsageStatistics(startDate, endDate);
  },

  /** 获取执行效率分析 */
  async getEfficiencyAnalysis(
    templateId?: string,
    classId?: string
  ): Promise<{
    avgCompletionTime: number;
    completionRate: number;
    timeoutRate: number;
    skipRate: number;
  }> {
    const params: ExecutionQueryParams = {
      templateId,
      classId,
    };
    
    const executions = await classSopRepository.execution.findMany(params);
    
    if (executions.length === 0) {
      return {
        avgCompletionTime: 0,
        completionRate: 0,
        timeoutRate: 0,
        skipRate: 0,
      };
    }
    
    const completed = executions.filter(e => e.status === 'completed');
    const timeout = executions.filter(e => e.status === 'timeout');
    
    // 计算平均完成时间
    let totalTime = 0;
    let count = 0;
    for (const execution of completed) {
      if (execution.completedAt && execution.startedAt) {
        const start = new Date(execution.startedAt).getTime();
        const end = new Date(execution.completedAt).getTime();
        totalTime += (end - start) / (1000 * 60); // 转换为分钟
        count++;
      }
    }
    
    // 计算跳过率
    let totalSteps = 0;
    let skippedSteps = 0;
    for (const execution of executions) {
      totalSteps += execution.steps.length;
      skippedSteps += execution.steps.filter(s => s.status === 'skipped').length;
    }
    
    return {
      avgCompletionTime: count > 0 ? totalTime / count : 0,
      completionRate: completed.length / executions.length,
      timeoutRate: timeout.length / executions.length,
      skipRate: totalSteps > 0 ? skippedSteps / totalSteps : 0,
    };
  },
};

// ==================== 提醒 Service ====================

export const sopReminderService = {
  /** 获取待提醒事项 */
  async getPendingReminders(userId: string): Promise<{
    inProgressExecutions: SOPExecution[];
    followUpLedgers: LedgerEntry[];
  }> {
    const inProgressExecutions = await classSopRepository.execution.findMany({
      executorId: userId,
      status: 'in_progress',
    });
    
    const followUpLedgers = await classSopRepository.ledger.findMany({
      handlerId: userId,
      followUpRequired: true,
      status: 'resolved',
    });
    
    return {
      inProgressExecutions,
      followUpLedgers,
    };
  },
};

// ==================== 导出 ====================

export const classSopService = {
  template: sopTemplateService,
  execution: sopExecutionService,
  ledger: ledgerEntryService,
  usage: sopUsageService,
  reminder: sopReminderService,
};
