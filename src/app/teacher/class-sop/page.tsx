/**
 * 班级 SOP 智能台账
 * 
 * 设计理念：
 * 1. SOP 是经验的固化，不是形式主义
 * 2. 核心价值：风险预警 + 证据留痕 + 自我保护
 * 3. 支持班主任自定义流程
 * 4. 界面简洁高效，不增加工作负担
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SOPCategory,
  SOPTemplate,
  SOPExecution,
  LedgerEntry,
} from '@/types/class-sop';
import { Plus, Search, Clock, FileText, CheckCircle2 } from 'lucide-react';

import { AttachmentData } from './lib/constants';
import { CreateTemplateDialog } from './components/CreateTemplateDialog';
import { ExecutionSheet } from './components/ExecutionSheet';
import { TemplateDetailDialog } from './components/TemplateDetailDialog';
import { TemplatesTab } from './components/TemplatesTab';
import { ExecutionsTab } from './components/ExecutionsTab';
import { LedgerTab } from './components/LedgerTab';

// ==================== Tab 按钮 ====================

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

// ==================== 主页面 ====================

export default function ClassSOPPage() {
  // 数据状态
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [executions, setExecutions] = useState<SOPExecution[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // UI 状态
  const [activeTab, setActiveTab] = useState<'templates' | 'executions' | 'ledger'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<SOPCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null);
  const [currentExecution, setCurrentExecution] = useState<SOPExecution | null>(null);

  // ==================== 数据获取 ====================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, executionsRes, entriesRes] = await Promise.all([
        fetch('/api/class-sop/templates'),
        fetch('/api/class-sop/executions'),
        fetch('/api/class-sop/ledger'),
      ]);

      const [templatesData, executionsData, entriesData] = await Promise.all([
        templatesRes.json(),
        executionsRes.json(),
        entriesRes.json(),
      ]);

      if (templatesData.success) setTemplates(templatesData.data || []);
      if (executionsData.success) setExecutions(executionsData.data || []);
      if (entriesData.success) setEntries(entriesData.data || []);
    } catch (e) {
      console.error('获取数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ==================== 操作函数 ====================

  const startExecution = useCallback(async (template: SOPTemplate) => {
    try {
      const res = await fetch('/api/class-sop/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          classId: 'demo-class-1',
          executorId: 'demo-teacher-1',
          executorName: '演示教师',
          className: '一年级1班',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentExecution(data.data);
        setShowExecutionSheet(true);
        fetchData();
      }
    } catch (e) {
      console.error('启动执行失败:', e);
    }
  }, [fetchData]);

  const updateStep = useCallback(async (
    executionId: string,
    stepOrder: number,
    action: 'start' | 'complete' | 'skip',
    content?: string,
    attachments?: AttachmentData[]
  ) => {
    try {
      const res = await fetch(`/api/class-sop/executions/${executionId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          stepOrder,
          content,
          attachments: attachments?.map(a => ({
            id: a.key,
            type: a.type,
            url: a.url,
            name: a.name,
            size: a.size,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentExecution(data.data);
        fetchData();
      }
    } catch (e) {
      console.error('更新步骤失败:', e);
    }
  }, [fetchData]);

  const completeExecution = useCallback(async (executionId: string, summary: string) => {
    try {
      const res = await fetch(`/api/class-sop/executions/${executionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      if (data.success) {
        setShowExecutionSheet(false);
        setCurrentExecution(null);
        fetchData();
      }
    } catch (e) {
      console.error('完成执行失败:', e);
    }
  }, [fetchData]);

  const deleteTemplate = useCallback(async (id: string) => {
    if (!confirm('确定删除此模板？')) return;
    try {
      await fetch(`/api/class-sop/templates/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error('删除失败:', e);
    }
  }, [fetchData]);

  // ==================== 计算数据 ====================

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [templates, selectedCategory, searchQuery]);

  const inProgressCount = useMemo(() =>
    executions.filter(e => e.status === 'in_progress').length, [executions]);

  const myTemplates = useMemo(() =>
    templates.filter(t => !t.isSystem), [templates]);

  const systemTemplates = useMemo(() =>
    templates.filter(t => t.isSystem), [templates]);

  // ==================== 渲染 ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">SOP 工作台</h1>
              <p className="text-sm text-slate-500 mt-0.5">标准流程 · 证据留痕 · 自我保护</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 focus:w-64 transition-all"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                创建流程
              </Button>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="flex items-center gap-6 mt-4">
            <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>
              <FileText className="h-4 w-4 mr-1.5" />
              流程模板
              <Badge variant="secondary" className="ml-1.5">{templates.length}</Badge>
            </TabButton>
            <TabButton active={activeTab === 'executions'} onClick={() => setActiveTab('executions')}>
              <Clock className="h-4 w-4 mr-1.5" />
              执行记录
              {inProgressCount > 0 && (
                <Badge className="ml-1.5 bg-blue-500">{inProgressCount} 进行中</Badge>
              )}
            </TabButton>
            <TabButton active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              工作台账
              <Badge variant="secondary" className="ml-1.5">{entries.length}</Badge>
            </TabButton>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'templates' && (
          <TemplatesTab
            templates={filteredTemplates}
            myTemplates={myTemplates}
            systemTemplates={systemTemplates}
            loading={loading}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onExecute={startExecution}
            onView={(t) => { setSelectedTemplate(t); setShowDetailDialog(true); }}
            onEdit={(t) => { setSelectedTemplate(t); setShowCreateDialog(true); }}
            onDelete={deleteTemplate}
            onCreateNew={() => setShowCreateDialog(true)}
          />
        )}

        {activeTab === 'executions' && (
          <ExecutionsTab
            executions={executions}
            loading={loading}
            onContinue={(e) => { setCurrentExecution(e); setShowExecutionSheet(true); }}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerTab entries={entries} loading={loading} />
        )}
      </div>

      {/* 弹窗与侧边栏 */}
      <ExecutionSheet
        open={showExecutionSheet}
        onOpenChange={setShowExecutionSheet}
        execution={currentExecution}
        onUpdateStep={updateStep}
        onComplete={completeExecution}
      />

      <TemplateDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        template={selectedTemplate}
        onExecute={startExecution}
      />

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        template={selectedTemplate?.isSystem ? null : selectedTemplate}
        onSuccess={fetchData}
      />
    </div>
  );
}
