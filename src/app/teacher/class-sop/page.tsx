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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SOP_CATEGORY_LABELS,
  LEDGER_TYPE_LABELS,
  SOPCategory,
  SOPTemplate,
  SOPExecution,
  LedgerEntry,
} from '@/types/class-sop';
import {
  Plus, Search, Play, Eye, Edit3, Trash2,
  Clock, CheckCircle2, FileText, Star, Lightbulb,
  ArrowRight, Copy,
} from 'lucide-react';

import { categoryConfig, AttachmentData } from './lib/constants';
import { CreateTemplateDialog } from './components/CreateTemplateDialog';
import { ExecutionSheet } from './components/ExecutionSheet';
import { TemplateDetailDialog } from './components/TemplateDetailDialog';

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
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
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
              <h1 className="text-xl font-semibold text-slate-900">
                SOP 工作台
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                标准流程 · 证据留痕 · 自我保护
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 focus:w-64 transition-all"
                />
              </div>
              
              {/* 新建按钮 */}
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
      
      {/* 执行面板 */}
      <ExecutionSheet
        open={showExecutionSheet}
        onOpenChange={setShowExecutionSheet}
        execution={currentExecution}
        onUpdateStep={updateStep}
        onComplete={completeExecution}
      />
      
      {/* 模板详情 */}
      <TemplateDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        template={selectedTemplate}
        onExecute={startExecution}
      />
      
      {/* 创建/编辑模板 */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        template={selectedTemplate?.isSystem ? null : selectedTemplate}
        onSuccess={fetchData}
      />
    </div>
  );
}

// ==================== 子组件 ====================

// Tab 按钮
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all
      ${active 
        ? 'bg-slate-900 text-white' 
        : 'text-slate-600 hover:bg-slate-100'}
    `}
  >
    {children}
  </button>
);

// ==================== 模板 Tab ====================

const TemplatesTab: React.FC<{
  templates: SOPTemplate[];
  myTemplates: SOPTemplate[];
  systemTemplates: SOPTemplate[];
  loading: boolean;
  selectedCategory: SOPCategory | 'all';
  onCategoryChange: (c: SOPCategory | 'all') => void;
  onExecute: (t: SOPTemplate) => void;
  onView: (t: SOPTemplate) => void;
  onEdit: (t: SOPTemplate) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}> = ({ templates, myTemplates, systemTemplates, loading, selectedCategory, onCategoryChange, onExecute, onView, onEdit, onDelete, onCreateNew }) => {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <CategoryFilter value={selectedCategory} onChange={onCategoryChange} />
      </div>
      
      {/* 我的模板 */}
      {myTemplates.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              我的流程
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onExecute={() => onExecute(template)}
                onView={() => onView(template)}
                onEdit={() => onEdit(template)}
                onDelete={() => onDelete(template.id)}
              />
            ))}
          </div>
        </section>
      )}
      
      {/* 系统模板 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            推荐模板
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onExecute={() => onExecute(template)}
              onView={() => onView(template)}
              onCopy={() => {/* TODO */}}
              isSystem
            />
          ))}
        </div>
      </section>
      
      {/* 空状态 */}
      {templates.length === 0 && (
        <Card className="py-16">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">暂无流程模板</p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              创建第一个流程
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 分类筛选
const CategoryFilter: React.FC<{
  value: SOPCategory | 'all';
  onChange: (v: SOPCategory | 'all') => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <button
      onClick={() => onChange('all')}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
        value === 'all' 
          ? 'bg-slate-900 text-white' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      全部
    </button>
    {Object.entries(SOP_CATEGORY_LABELS).map(([key, label]) => {
      const config = categoryConfig[key as SOPCategory];
      const Icon = config.icon;
      const isActive = value === key;
      
      return (
        <button
          key={key}
          onClick={() => onChange(key as SOPCategory)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
            isActive 
              ? `${config.bg} ${config.color}` 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      );
    })}
  </div>
);

// 模板卡片
const TemplateCard: React.FC<{
  template: SOPTemplate;
  onExecute: () => void;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  isSystem?: boolean;
}> = ({ template, onExecute, onView, onEdit, onDelete, onCopy, isSystem }) => {
  const config = categoryConfig[template.category];
  const Icon = config.icon;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-5">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 line-clamp-1">{template.name}</h3>
              <p className="text-xs text-slate-500">{SOP_CATEGORY_LABELS[template.category]}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onView}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <Eye className="h-4 w-4" />
            </button>
            {!isSystem && onEdit && (
              <button 
                onClick={onEdit}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            {isSystem && onCopy && (
              <button 
                onClick={onCopy}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* 描述 */}
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[40px]">
          {template.description}
        </p>
        
        {/* 底部 */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{template.steps.length} 步骤</span>
            {template.usageCount > 0 && (
              <>
                <span>·</span>
                <span>使用 {template.usageCount} 次</span>
              </>
            )}
          </div>
          
          <Button size="sm" onClick={onExecute} className="gap-1">
            <Play className="h-3 w-3" />
            执行
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 执行记录 Tab ====================

const ExecutionsTab: React.FC<{
  executions: SOPExecution[];
  loading: boolean;
  onContinue: (e: SOPExecution) => void;
}> = ({ executions, loading, onContinue }) => {
  
  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }
  
  if (executions.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-1">暂无执行记录</p>
          <p className="text-sm text-slate-400">选择一个流程开始执行</p>
        </CardContent>
      </Card>
    );
  }
  
  const inProgress = executions.filter(e => e.status === 'in_progress');
  const completed = executions.filter(e => e.status === 'completed');
  
  return (
    <div className="space-y-6">
      {/* 进行中 */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            进行中 ({inProgress.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map(exec => (
              <ExecutionCard key={exec.id} execution={exec} onContinue={onContinue} />
            ))}
          </div>
        </section>
      )}
      
      {/* 已完成 */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            已完成 ({completed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.slice(0, 6).map(exec => (
              <ExecutionCard key={exec.id} execution={exec} onContinue={onContinue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// 执行卡片
const ExecutionCard: React.FC<{
  execution: SOPExecution;
  onContinue: (e: SOPExecution) => void;
}> = ({ execution, onContinue }) => {
  const completed = execution.steps.filter(s => s.status === 'completed').length;
  const total = execution.steps.length;
  const progress = (completed / total) * 100;
  const config = categoryConfig[execution.category];
  
  return (
    <Card className={`hover:shadow-md transition-all ${
      execution.status === 'in_progress' ? 'ring-2 ring-blue-500/20 bg-blue-50/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{execution.templateName}</h3>
              <p className="text-xs text-slate-500">{execution.className}</p>
            </div>
          </div>
          
          <Badge variant={execution.status === 'in_progress' ? 'default' : 'secondary'}>
            {execution.status === 'in_progress' ? '进行中' : '已完成'}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>进度</span>
            <span>{completed}/{total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{execution.executorName}</span>
          {execution.status === 'in_progress' ? (
            <Button size="sm" variant="default" onClick={() => onContinue(execution)}>
              继续
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <span>{new Date(execution.completedAt || execution.startedAt).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 台账 Tab ====================

const LedgerTab: React.FC<{
  entries: LedgerEntry[];
  loading: boolean;
}> = ({ entries, loading }) => {
  
  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }
  
  if (entries.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-1">暂无台账记录</p>
          <p className="text-sm text-slate-400">完成流程执行后将自动生成台账</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(entry => (
        <Card key={entry.id} className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-900">{entry.title}</h3>
              <Badge variant="outline">{LEDGER_TYPE_LABELS[entry.type]}</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{entry.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{new Date(entry.occurredAt).toLocaleDateString()}</span>
              <span>{entry.handlerName}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
