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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';
import {
  SOP_CATEGORY_LABELS,
  LEDGER_TYPE_LABELS,
  SOPCategory,
  SOPTemplate,
  SOPExecution,
  LedgerEntry,
  SOPStep,
} from '@/types/class-sop';
import {
  Plus,
  Search,
  Play,
  Eye,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  FileText,
  Shield,
  Users,
  MessageCircle,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle,
  Circle,
  SkipForward,
  Copy,
  Star,
  StarOff,
  Lightbulb,
  ArrowRight,
  FileSignature,
  X,
  Upload,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  File,
  Loader2,
} from 'lucide-react';

// ==================== 附件类型 ====================

type AttachmentData = {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
  evidenceType: 'photo' | 'video' | 'audio' | 'document';
};

// ==================== 图标和颜色映射 ====================

const categoryConfig: Record<SOPCategory, { icon: React.ElementType; color: string; bg: string; gradient: string }> = {
  conflict: { 
    icon: Users, 
    color: 'text-rose-600', 
    bg: 'bg-rose-50', 
    gradient: 'from-rose-500 to-pink-500' 
  },
  safety: { 
    icon: Shield, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50', 
    gradient: 'from-orange-500 to-amber-500' 
  },
  discipline: { 
    icon: AlertTriangle, 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    gradient: 'from-red-500 to-rose-500' 
  },
  communication: { 
    icon: MessageCircle, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    gradient: 'from-blue-500 to-indigo-500' 
  },
  hygiene: { 
    icon: Sparkles, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50', 
    gradient: 'from-emerald-500 to-teal-500' 
  },
  attendance: { 
    icon: Calendar, 
    color: 'text-violet-600', 
    bg: 'bg-violet-50', 
    gradient: 'from-violet-500 to-purple-500' 
  },
  activity: { 
    icon: Calendar, 
    color: 'text-cyan-600', 
    bg: 'bg-cyan-50', 
    gradient: 'from-cyan-500 to-sky-500' 
  },
  emergency: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    gradient: 'from-red-600 to-rose-600' 
  },
};

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
            <TabButton 
              active={activeTab === 'templates'} 
              onClick={() => setActiveTab('templates')}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              流程模板
              <Badge variant="secondary" className="ml-1.5">{templates.length}</Badge>
            </TabButton>
            <TabButton 
              active={activeTab === 'executions'} 
              onClick={() => setActiveTab('executions')}
            >
              <Clock className="h-4 w-4 mr-1.5" />
              执行记录
              {inProgressCount > 0 && (
                <Badge className="ml-1.5 bg-blue-500">{inProgressCount} 进行中</Badge>
              )}
            </TabButton>
            <TabButton 
              active={activeTab === 'ledger'} 
              onClick={() => setActiveTab('ledger')}
            >
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

// ==================== 执行面板 ====================

const ExecutionSheet: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  execution: SOPExecution | null;
  onUpdateStep: (id: string, order: number, action: 'start' | 'complete' | 'skip', content?: string, attachments?: AttachmentData[]) => void;
  onComplete: (id: string, summary: string) => void;
}> = ({ open, onOpenChange, execution, onUpdateStep, onComplete }) => {
  const [summary, setSummary] = useState('');
  const [stepContents, setStepContents] = useState<Record<number, string>>({});
  const [stepAttachments, setStepAttachments] = useState<Record<number, AttachmentData[]>>({});
  
  useEffect(() => {
    if (execution) {
      setSummary('');
      setStepContents({});
      setStepAttachments({});
    }
  }, [execution?.id]);
  
  if (!execution) return null;
  
  const completed = execution.steps.filter(s => s.status === 'completed').length;
  const total = execution.steps.length;
  const allDone = execution.steps.every(s => s.status !== 'pending');
  const config = categoryConfig[execution.category];
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <SheetTitle>{execution.templateName}</SheetTitle>
              <p className="text-sm text-slate-500">{execution.className}</p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* 进度 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">执行进度</span>
              <span className="text-sm font-medium">{completed}/{total}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.gradient} transition-all`}
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
          
          {/* 步骤 */}
          <div className="space-y-3">
            {execution.steps.map((step, index) => (
              <StepCard
                key={index}
                step={{
                  ...step,
                  attachments: step.attachments?.map(a => ({
                    key: a.id,
                    url: a.url,
                    name: a.name,
                    size: a.size || 0,
                    type: a.type,
                    evidenceType: a.type.startsWith('image') ? 'photo' : 
                                  a.type.startsWith('video') ? 'video' : 
                                  a.type.startsWith('audio') ? 'audio' : 'document',
                  })),
                }}
                index={index}
                isActive={execution.status === 'in_progress'}
                content={stepContents[step.stepOrder] || ''}
                attachments={stepAttachments[step.stepOrder] || []}
                onContentChange={(c) => setStepContents(prev => ({ ...prev, [step.stepOrder]: c }))}
                onAttachmentsChange={(a) => setStepAttachments(prev => ({ ...prev, [step.stepOrder]: a }))}
                onStart={() => onUpdateStep(execution.id, step.stepOrder, 'start')}
                onComplete={() => onUpdateStep(
                  execution.id, 
                  step.stepOrder, 
                  'complete', 
                  stepContents[step.stepOrder],
                  stepAttachments[step.stepOrder]
                )}
                onSkip={(reason) => onUpdateStep(execution.id, step.stepOrder, 'skip', reason)}
                executionId={execution.id}
              />
            ))}
          </div>
          
          {/* 完成 */}
          {execution.status === 'in_progress' && allDone && (
            <div className="pt-4 border-t space-y-4">
              <div>
                <Label className="text-sm text-slate-600">执行总结</Label>
                <Textarea
                  placeholder="请总结本次执行情况..."
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => summary && onComplete(execution.id, summary)}
                disabled={!summary}
              >
                <FileSignature className="h-4 w-4 mr-2" />
                完成并归档
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// 步骤卡片
const StepCard: React.FC<{
  step: { stepOrder: number; stepTitle: string; status: string; content?: string; attachments?: AttachmentData[] };
  index: number;
  isActive: boolean;
  content: string;
  attachments: AttachmentData[];
  onContentChange: (c: string) => void;
  onAttachmentsChange: (a: AttachmentData[]) => void;
  onStart: () => void;
  onComplete: () => void;
  onSkip: (reason: string) => void;
  executionId?: string;
}> = ({ step, index, isActive, content, attachments, onContentChange, onAttachmentsChange, onStart, onComplete, onSkip, executionId }) => {
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const statusConfig = {
    pending: { icon: Circle, bg: 'bg-slate-200 text-slate-400', label: '待处理' },
    in_progress: { icon: Clock, bg: 'bg-blue-500 text-white', label: '进行中' },
    completed: { icon: CheckCircle, bg: 'bg-emerald-500 text-white', label: '已完成' },
    skipped: { icon: SkipForward, bg: 'bg-slate-400 text-white', label: '已跳过' },
  };
  
  const config = statusConfig[step.status as keyof typeof statusConfig];
  const Icon = config.icon;
  
  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !executionId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('executionId', executionId);
      formData.append('stepOrder', String(step.stepOrder));
      
      const res = await fetch('/api/class-sop/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        onAttachmentsChange([...attachments, data.data]);
      } else {
        alert(data.error || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // 删除附件
  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // 获取附件图标
  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image')) return ImageIcon;
    if (type.startsWith('video')) return FileVideo;
    if (type.startsWith('audio')) return FileAudio;
    return File;
  };
  
  return (
    <div className={`rounded-xl border ${
      step.status === 'in_progress' 
        ? 'border-blue-500 bg-blue-50/50' 
        : 'border-slate-200 bg-white'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${step.status === 'in_progress' ? 'animate-spin' : ''}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">{step.stepTitle}</span>
              <Badge variant="outline" className="text-xs">{config.label}</Badge>
            </div>
            
            {/* 已完成/跳过 */}
            {(step.status === 'completed' || step.status === 'skipped') && step.content && (
              <p className="text-sm text-slate-500 mt-2">{step.content}</p>
            )}
            
            {/* 显示已有附件 */}
            {step.attachments && step.attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {step.attachments.map((att, i) => {
                  const AttIcon = getAttachmentIcon(att.type);
                  return (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 p-1.5 bg-blue-50 rounded-lg"
                    >
                      <AttIcon className="h-3.5 w-3.5" />
                      <span className="truncate flex-1">{att.name}</span>
                      <span className="text-slate-400">{formatFileSize(att.size)}</span>
                    </a>
                  );
                })}
              </div>
            )}
            
            {/* 进行中 */}
            {step.status === 'in_progress' && isActive && (
              <div className="mt-3 space-y-3">
                <Textarea
                  placeholder="记录执行内容..."
                  value={content}
                  onChange={e => onContentChange(e.target.value)}
                  rows={2}
                />
                
                {/* 上传区域 */}
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={FILE_TYPE_CONFIGS.teaching.accept}
                    className="hidden"
                  />
                  
                  {/* 已上传的附件 */}
                  {attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {attachments.map((att, i) => {
                        const AttIcon = getAttachmentIcon(att.type);
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                            <AttIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate flex-1 text-slate-600">{att.name}</span>
                            <span className="text-slate-400">{formatFileSize(att.size)}</span>
                            <button
                              onClick={() => removeAttachment(i)}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1.5" />
                        上传材料留痕
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-slate-400 text-center">
                    支持图片、视频、音频、文档（最大 50MB）
                  </p>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={onComplete}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    完成
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSkip(!showSkip)}>
                    <SkipForward className="h-3 w-3 mr-1" />
                    跳过
                  </Button>
                </div>
                {showSkip && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="跳过原因..."
                      value={skipReason}
                      onChange={e => setSkipReason(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => skipReason && onSkip(skipReason)}
                      disabled={!skipReason}
                    >
                      确认
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* 待处理 */}
            {step.status === 'pending' && isActive && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={onStart}>
                  <Play className="h-3 w-3 mr-1" />
                  开始
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 模板详情对话框 ====================

const TemplateDetailDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: SOPTemplate | null;
  onExecute: (t: SOPTemplate) => void;
}> = ({ open, onOpenChange, template, onExecute }) => {
  if (!template) return null;
  
  const config = categoryConfig[template.category];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <DialogDescription>{template.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Badge variant="secondary">{SOP_CATEGORY_LABELS[template.category]}</Badge>
            <span>{template.steps.length} 个步骤</span>
            {template.usageCount > 0 && <span>已使用 {template.usageCount} 次</span>}
          </div>
          
          <div className="space-y-3">
            {template.steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{step.title}</div>
                  {step.description && (
                    <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                  )}
                  {step.checkpoints && step.checkpoints.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {step.checkpoints.map((cp, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{cp}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
          <Button onClick={() => { onOpenChange(false); onExecute(template); }}>
            <Play className="h-4 w-4 mr-1.5" />
            开始执行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== 创建模板对话框 ====================

const CreateTemplateDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: SOPTemplate | null;
  onSuccess: () => void;
}> = ({ open, onOpenChange, template, onSuccess }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SOPCategory>('conflict');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Omit<SOPStep, 'order'>[]>([
    { title: '', description: '', isRequired: true, checkpoints: [] }
  ]);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setDescription(template.description || '');
      setSteps(template.steps.map(s => ({
        title: s.title,
        description: s.description || '',
        isRequired: s.isRequired,
        checkpoints: s.checkpoints || [],
      })));
    } else {
      setName('');
      setCategory('conflict');
      setDescription('');
      setSteps([{ title: '', description: '', isRequired: true, checkpoints: [] }]);
    }
  }, [template, open]);
  
  const addStep = () => {
    setSteps([...steps, { title: '', description: '', isRequired: true, checkpoints: [] }]);
  };
  
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };
  
  const updateStep = (index: number, field: string, value: unknown) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };
  
  const handleSave = async () => {
    if (!name.trim() || steps.some(s => !s.title.trim())) {
      alert('请填写流程名称和所有步骤标题');
      return;
    }
    
    setSaving(true);
    try {
      const url = template 
        ? `/api/class-sop/templates/${template.id}`
        : '/api/class-sop/templates';
      const method = template ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          steps: steps.map((s, i) => ({ ...s, order: i + 1 })),
        }),
      });
      
      if (res.ok) {
        onOpenChange(false);
        onSuccess();
      }
    } catch (e) {
      console.error('保存失败:', e);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? '编辑流程' : '创建新流程'}</DialogTitle>
          <DialogDescription>
            设计您自己的标准化操作流程，帮助规范工作、留存证据
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <Label>流程名称 *</Label>
              <Input
                placeholder="如：学生冲突处理流程"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label>类别</Label>
              <Select value={category} onValueChange={v => setCategory(v as SOPCategory)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOP_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>描述</Label>
              <Textarea
                placeholder="简要描述这个流程的用途..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
          
          {/* 步骤 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>执行步骤</Label>
              <Button size="sm" variant="outline" onClick={addStep}>
                <Plus className="h-3 w-3 mr-1" />
                添加步骤
              </Button>
            </div>
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="步骤标题 *"
                        value={step.title}
                        onChange={e => updateStep(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="步骤说明（可选）"
                        value={step.description || ''}
                        onChange={e => updateStep(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    {steps.length > 1 && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removeStep(index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
