/**
 * 班级 SOP 智能台账管理页面
 * 
 * 核心功能：
 * 1. SOP 模板管理 - 创建、查看、使用标准操作流程
 * 2. 执行记录 - 按步骤执行、留痕、签字确认
 * 3. 台账管理 - 查询、统计、导出
 */

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  SOP_CATEGORY_LABELS,
  EXECUTION_STATUS_LABELS,
  LEDGER_TYPE_LABELS,
  LEDGER_STATUS_LABELS,
  SEVERITY_LABELS,
  SOPCategory,
  SOPTemplate,
  SOPExecution,
  LedgerEntry,
  StepExecution,
  SOPStep,
} from '@/types/class-sop';
import {
  Sparkles,
  Shield,
  Users,
  MessageCircle,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Siren,
  Play,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Plus,
  MoreHorizontal,
  FileText,
  BarChart3,
  History,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  Camera,
  FileSignature,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Circle,
  SkipForward,
  Upload,
  X,
  Info,
  TrendingUp,
  Activity,
} from 'lucide-react';

// ==================== 图标映射 ====================

const categoryIconMap: Record<SOPCategory, React.ElementType> = {
  hygiene: Sparkles,
  safety: Shield,
  conflict: Users,
  communication: MessageCircle,
  discipline: AlertTriangle,
  attendance: ClipboardCheck,
  activity: Calendar,
  emergency: Siren,
};

const categoryColorMap: Record<SOPCategory, string> = {
  hygiene: 'text-yellow-600 bg-yellow-50',
  safety: 'text-blue-600 bg-blue-50',
  conflict: 'text-purple-600 bg-purple-50',
  communication: 'text-green-600 bg-green-50',
  discipline: 'text-red-600 bg-red-50',
  attendance: 'text-indigo-600 bg-indigo-50',
  activity: 'text-pink-600 bg-pink-50',
  emergency: 'text-orange-600 bg-orange-50',
};

const CategoryIcon: React.FC<{ category: SOPCategory; className?: string }> = ({ 
  category, 
  className = 'h-4 w-4' 
}) => {
  const Icon = categoryIconMap[category];
  return <Icon className={className} />;
};

// ==================== 统计卡片 ====================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend, color = 'bg-primary/10' }) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} rounded-full -translate-y-8 translate-x-8 opacity-50`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className={`h-3 w-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </div>
      )}
    </CardContent>
  </Card>
);

// ==================== 主页面 ====================

export default function ClassSOPPage() {
  // 数据状态
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [executions, setExecutions] = useState<SOPExecution[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState({ templates: true, executions: true, entries: true });
  const [error, setError] = useState<string | null>(null);
  
  // UI 状态
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState<SOPCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null);
  const [currentExecution, setCurrentExecution] = useState<SOPExecution | null>(null);
  const [executionSummary, setExecutionSummary] = useState('');
  
  // ==================== 数据获取 ====================
  
  const fetchTemplates = useCallback(async () => {
    setLoading(l => ({ ...l, templates: true }));
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      
      const res = await fetch(`/api/class-sop/templates?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setTemplates(data.data || []);
      } else {
        setError(data.error || '获取模板失败');
      }
    } catch (e) {
      setError('网络请求失败');
    } finally {
      setLoading(l => ({ ...l, templates: false }));
    }
  }, [selectedCategory, searchQuery]);
  
  const fetchExecutions = useCallback(async () => {
    setLoading(l => ({ ...l, executions: true }));
    try {
      const res = await fetch('/api/class-sop/executions');
      const data = await res.json();
      if (data.success) {
        setExecutions(data.data || []);
      }
    } catch (e) {
      console.error('获取执行记录失败:', e);
    } finally {
      setLoading(l => ({ ...l, executions: false }));
    }
  }, []);
  
  const fetchEntries = useCallback(async () => {
    setLoading(l => ({ ...l, entries: true }));
    try {
      const res = await fetch('/api/class-sop/ledger');
      const data = await res.json();
      if (data.success) {
        setEntries(data.data || []);
      }
    } catch (e) {
      console.error('获取台账失败:', e);
    } finally {
      setLoading(l => ({ ...l, entries: false }));
    }
  }, []);
  
  useEffect(() => {
    fetchTemplates();
    fetchExecutions();
    fetchEntries();
  }, [fetchTemplates, fetchExecutions, fetchEntries]);
  
  // ==================== 计算数据 ====================
  
  const inProgressExecutions = useMemo(() => 
    executions.filter(e => e.status === 'in_progress'), [executions]);
  
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return executions.filter(e => 
      e.status === 'completed' && 
      e.completedAt && 
      new Date(e.completedAt) >= firstDay
    ).length;
  }, [executions]);
  
  const pendingEntries = useMemo(() =>
    entries.filter(e => e.status === 'open' || e.status === 'investigating'), [entries]);
  
  // ==================== 操作函数 ====================
  
  const startExecution = useCallback(async (template: SOPTemplate) => {
    try {
      // TODO: 从用户上下文获取真实信息
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
        fetchExecutions();
      } else {
        setError(data.error || '启动执行失败');
      }
    } catch (e) {
      setError('网络请求失败');
    }
  }, [fetchExecutions]);
  
  const updateStep = useCallback(async (
    executionId: string, 
    stepOrder: number, 
    action: 'start' | 'complete' | 'skip',
    content?: string
  ) => {
    try {
      const res = await fetch(`/api/class-sop/executions/${executionId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, stepOrder, content }),
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentExecution(data.data);
        fetchExecutions();
      }
    } catch (e) {
      console.error('更新步骤失败:', e);
    }
  }, [fetchExecutions]);
  
  const completeExecution = useCallback(async (executionId: string) => {
    if (!executionSummary.trim()) {
      setError('请填写执行总结');
      return;
    }
    
    try {
      const res = await fetch(`/api/class-sop/executions/${executionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: executionSummary }),
      });
      const data = await res.json();
      
      if (data.success) {
        setShowExecutionSheet(false);
        setCurrentExecution(null);
        setExecutionSummary('');
        fetchExecutions();
        fetchEntries();
      }
    } catch (e) {
      setError('完成执行失败');
    }
  }, [executionSummary, fetchExecutions, fetchEntries]);
  
  const continueExecution = useCallback((execution: SOPExecution) => {
    setCurrentExecution(execution);
    setShowExecutionSheet(true);
  }, []);
  
  // ==================== 渲染 ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto py-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">班级 SOP 智能台账</h1>
            <p className="text-muted-foreground">标准化操作流程 · 自动留痕 · 责任追溯</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                fetchTemplates();
                fetchExecutions();
                fetchEntries();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* 统计看板 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="SOP 模板"
            value={templates.length}
            description={`${templates.filter(t => t.isSystem).length} 个系统模板`}
            icon={<FileText className="h-4 w-4 text-primary" />}
            color="bg-blue-50"
          />
          <StatCard
            title="执行记录"
            value={executions.length}
            description={`${inProgressExecutions.length} 个进行中`}
            icon={<Activity className="h-4 w-4 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="本月完成"
            value={completedThisMonth}
            description="已解决事项"
            icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            title="台账条目"
            value={entries.length}
            description={`${pendingEntries.length} 个待处理`}
            icon={<BarChart3 className="h-4 w-4 text-purple-600" />}
            color="bg-purple-50"
          />
        </div>
        
        {/* 进行中的任务提醒 */}
        {inProgressExecutions.length > 0 && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                进行中的任务 ({inProgressExecutions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-4 overflow-x-auto pb-2">
                {inProgressExecutions.map(exec => {
                  const completed = exec.steps.filter(s => s.status === 'completed').length;
                  const total = exec.steps.length;
                  return (
                    <Card key={exec.id} className="min-w-[260px] bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">{exec.templateName}</span>
                          <Badge variant="secondary" className="text-xs">进行中</Badge>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>执行进度</span>
                            <span className="font-medium">{completed}/{total}</span>
                          </div>
                          <Progress value={(completed / total) * 100} className="h-2" />
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => continueExecution(exec)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          继续执行
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 主标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              SOP 模板
            </TabsTrigger>
            <TabsTrigger value="executions" className="gap-2">
              <History className="h-4 w-4" />
              执行记录
            </TabsTrigger>
            <TabsTrigger value="ledger" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              台账管理
            </TabsTrigger>
          </TabsList>
          
          {/* ==================== SOP 模板 ==================== */}
          <TabsContent value="templates" className="space-y-4">
            {/* 筛选栏 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索 SOP 模板..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v as SOPCategory | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {Object.entries(SOP_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={key as SOPCategory} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 模板网格 */}
            {loading.templates ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-4/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无 SOP 模板</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onExecute={() => startExecution(template)}
                    onView={() => {
                      setSelectedTemplate(template);
                      setShowDetailDialog(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* ==================== 执行记录 ==================== */}
          <TabsContent value="executions" className="space-y-4">
            {loading.executions ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : executions.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无执行记录</p>
                  <p className="text-sm text-muted-foreground mt-1">选择一个 SOP 模板开始执行</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {executions.map(execution => (
                  <ExecutionCard
                    key={execution.id}
                    execution={execution}
                    onContinue={() => continueExecution(execution)}
                    onView={() => {
                      setCurrentExecution(execution);
                      setShowExecutionSheet(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* ==================== 台账管理 ==================== */}
          <TabsContent value="ledger" className="space-y-4">
            {loading.entries ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : entries.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无台账记录</p>
                  <p className="text-sm text-muted-foreground mt-1">完成 SOP 执行后将自动生成台账</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entries.map(entry => (
                  <LedgerCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* ==================== 执行侧边栏 ==================== */}
      <Sheet open={showExecutionSheet} onOpenChange={setShowExecutionSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {currentExecution?.status === 'in_progress' ? (
                <>
                  <Clock className="h-5 w-5 text-blue-500" />
                  执行中
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  已完成
                </>
              )}
            </SheetTitle>
            <SheetDescription>
              {currentExecution?.templateName} · {currentExecution?.className}
            </SheetDescription>
          </SheetHeader>
          
          {currentExecution && (
            <div className="mt-6 space-y-4">
              {/* 进度概览 */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">执行进度</span>
                <span className="font-medium">
                  {currentExecution.steps.filter(s => s.status === 'completed').length} / {currentExecution.steps.length}
                </span>
              </div>
              
              {/* 步骤列表 */}
              <div className="space-y-3">
                {currentExecution.steps.map((step, index) => (
                  <StepCard
                    key={index}
                    step={step}
                    index={index}
                    isRunning={currentExecution.status === 'in_progress'}
                    onStart={() => updateStep(currentExecution.id, step.stepOrder, 'start')}
                    onComplete={(content) => updateStep(currentExecution.id, step.stepOrder, 'complete', content)}
                    onSkip={(reason) => updateStep(currentExecution.id, step.stepOrder, 'skip', reason)}
                  />
                ))}
              </div>
              
              {/* 完成区域 */}
              {currentExecution.status === 'in_progress' && (
                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label>执行总结</Label>
                    <Textarea
                      placeholder="请输入本次执行的总结..."
                      value={executionSummary}
                      onChange={e => setExecutionSummary(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => completeExecution(currentExecution.id)}
                    disabled={currentExecution.steps.some(s => s.status === 'pending')}
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    完成执行
                  </Button>
                  {currentExecution.steps.some(s => s.status === 'pending') && (
                    <p className="text-xs text-muted-foreground text-center">
                      请完成所有步骤后再提交
                    </p>
                  )}
                </div>
              )}
              
              {/* 已完成的总结 */}
              {currentExecution.status === 'completed' && currentExecution.summary && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">执行总结</Label>
                  <p className="mt-2 text-sm bg-muted p-3 rounded-lg">{currentExecution.summary}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      {/* ==================== 模板详情对话框 ==================== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <div className={`p-2 rounded-lg ${categoryColorMap[selectedTemplate.category]}`}>
                  <CategoryIcon category={selectedTemplate.category} className="h-5 w-5" />
                </div>
              )}
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{SOP_CATEGORY_LABELS[selectedTemplate.category]}</Badge>
                <span>{selectedTemplate.steps.length} 个步骤</span>
                <span>已使用 {selectedTemplate.usageCount} 次</span>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {selectedTemplate.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{step.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      {step.checkpoints && step.checkpoints.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {step.checkpoints.map((cp, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{cp}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {step.isRequired ? (
                          <Badge variant="default" className="text-xs">必填</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">选填</Badge>
                        )}
                        {step.evidenceType && (
                          <span className="flex items-center gap-1">
                            {step.evidenceType === 'photo' && <Camera className="h-3 w-3" />}
                            {step.evidenceType === 'signature' && <FileSignature className="h-3 w-3" />}
                            {step.evidenceType === 'text' && <FileText className="h-3 w-3" />}
                            需要{step.evidenceType === 'photo' ? '照片' : step.evidenceType === 'signature' ? '签字' : '文字'}证据
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            {selectedTemplate && (
              <Button onClick={() => {
                setShowDetailDialog(false);
                startExecution(selectedTemplate);
              }}>
                <Play className="h-4 w-4 mr-2" />
                开始执行
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== 子组件 ====================

// 模板卡片
const TemplateCard: React.FC<{
  template: SOPTemplate;
  onExecute: () => void;
  onView: () => void;
}> = ({ template, onExecute, onView }) => {
  const completedSteps = template.steps.filter(s => s.isRequired).length;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-t-4 border-t-transparent hover:border-t-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${categoryColorMap[template.category]}`}>
              <CategoryIcon category={template.category} className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {SOP_CATEGORY_LABELS[template.category]}
              </CardDescription>
            </div>
          </div>
          {template.isSystem && (
            <Badge variant="secondary" className="text-xs">系统</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
          {template.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {completedSteps} 必填
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {template.usageCount} 次
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={onExecute}>
              <Play className="h-3 w-3 mr-1" />
              执行
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 执行记录卡片
const ExecutionCard: React.FC<{
  execution: SOPExecution;
  onContinue: () => void;
  onView: () => void;
}> = ({ execution, onContinue, onView }) => {
  const statusConfig = {
    in_progress: { 
      icon: <Clock className="h-4 w-4" />, 
      color: 'bg-blue-500',
      badge: 'default',
      label: '进行中'
    },
    completed: { 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'bg-green-500',
      badge: 'outline',
      label: '已完成'
    },
    timeout: { 
      icon: <AlertCircle className="h-4 w-4" />, 
      color: 'bg-orange-500',
      badge: 'destructive',
      label: '超时'
    },
    aborted: { 
      icon: <XCircle className="h-4 w-4" />, 
      color: 'bg-gray-400',
      badge: 'secondary',
      label: '已中止'
    },
  };
  
  const config = statusConfig[execution.status];
  const completed = execution.steps.filter(s => s.status === 'completed').length;
  const total = execution.steps.length;
  const progress = (completed / total) * 100;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-full ${config.color} text-white shrink-0`}>
              {config.icon}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{execution.templateName}</CardTitle>
              <CardDescription className="text-xs">
                {execution.className} · {new Date(execution.startedAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={config.badge as 'default' | 'secondary' | 'outline' | 'destructive'} className="shrink-0">
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">执行进度</span>
            <span className="font-medium">{completed}/{total}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {execution.executorName}
          </span>
          {execution.status === 'in_progress' ? (
            <Button size="sm" onClick={onContinue}>
              继续
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={onView}>
              查看详情
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 台账卡片
const LedgerCard: React.FC<{ entry: LedgerEntry }> = ({ entry }) => {
  const severityConfig = {
    low: { color: 'bg-green-500', label: '轻微' },
    medium: { color: 'bg-blue-500', label: '一般' },
    high: { color: 'bg-orange-500', label: '严重' },
    critical: { color: 'bg-red-500', label: '紧急' },
  };
  
  const config = severityConfig[entry.severity];
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full ${config.color} shrink-0`} />
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{entry.title}</CardTitle>
              <CardDescription className="text-xs">
                {LEDGER_TYPE_LABELS[entry.type]} · {entry.className}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {LEDGER_STATUS_LABELS[entry.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
          {entry.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {new Date(entry.occurredAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{config.label}</Badge>
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 步骤卡片
const StepCard: React.FC<{
  step: StepExecution;
  index: number;
  isRunning: boolean;
  onStart: () => void;
  onComplete: (content?: string) => void;
  onSkip: (reason: string) => void;
}> = ({ step, index, isRunning, onStart, onComplete, onSkip }) => {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState(step.content || '');
  const [skipReason, setSkipReason] = useState('');
  const [showSkipInput, setShowSkipInput] = useState(false);
  
  const statusConfig = {
    pending: { 
      icon: <Circle className="h-4 w-4" />, 
      bg: 'bg-muted text-muted-foreground',
      label: '待处理'
    },
    in_progress: { 
      icon: <Clock className="h-4 w-4 animate-spin" />, 
      bg: 'bg-blue-500 text-white',
      label: '进行中'
    },
    completed: { 
      icon: <CheckCircle className="h-4 w-4" />, 
      bg: 'bg-green-500 text-white',
      label: '已完成'
    },
    skipped: { 
      icon: <SkipForward className="h-4 w-4" />, 
      bg: 'bg-gray-400 text-white',
      label: '已跳过'
    },
  };
  
  const config = statusConfig[step.status];
  
  return (
    <Card className={`${step.status === 'in_progress' ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full ${config.bg} shrink-0`}>
            {step.status === 'completed' || step.status === 'skipped' ? 
              config.icon : 
              <span className="text-sm font-medium">{index + 1}</span>
            }
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium">{step.stepTitle}</span>
              <Badge variant="outline" className="text-xs">{config.label}</Badge>
            </div>
            
            {/* 已完成显示内容 */}
            {step.status === 'completed' && step.content && (
              <p className="text-sm text-muted-foreground mt-2">{step.content}</p>
            )}
            
            {/* 已跳过显示原因 */}
            {step.status === 'skipped' && step.content && (
              <p className="text-sm text-muted-foreground mt-2">跳过原因: {step.content}</p>
            )}
            
            {/* 进行中显示输入 */}
            {step.status === 'in_progress' && isRunning && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="请输入执行内容..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onComplete(content)}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    完成
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShowSkipInput(!showSkipInput)}
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    跳过
                  </Button>
                </div>
                {showSkipInput && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="请输入跳过原因..."
                      value={skipReason}
                      onChange={e => setSkipReason(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => skipReason && onSkip(skipReason)}
                      disabled={!skipReason}
                    >
                      确认跳过
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* 待处理显示开始按钮 */}
            {step.status === 'pending' && isRunning && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={onStart}>
                  <Play className="h-3 w-3 mr-1" />
                  开始执行
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
