/**
 * 班级 SOP 智能台账管理页面
 * 
 * 核心功能：
 * 1. SOP 模板管理 - 创建、查看、使用标准操作流程
 * 2. 执行记录 - 按步骤执行、留痕、签字确认
 * 3. 台账管理 - 查询、统计、导出
 * 4. 统计看板 - 数据可视化
 */

'use client';

import React, { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SOP_CATEGORY_LABELS,
  SOP_CATEGORY_ICONS,
  EXECUTION_STATUS_LABELS,
  EXECUTION_STATUS_COLORS,
  LEDGER_TYPE_LABELS,
  LEDGER_STATUS_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  SOPCategory,
  SOPTemplate,
  SOPExecution,
  LedgerEntry,
} from '@/types/class-sop';
import {
  useSOPTemplates,
  useSOPExecutions,
  useLedgerEntries,
  useSOPStatistics,
  useSOPTemplateActions,
  useSOPExecutionActions,
  useLedgerActions,
} from '@/hooks/useClassSOP';
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
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';

// ==================== 图标映射 ====================

const CategoryIcon: React.FC<{ category: SOPCategory; className?: string }> = ({ 
  category, 
  className = 'h-4 w-4' 
}) => {
  const icons: Record<SOPCategory, React.ReactNode> = {
    hygiene: <Sparkles className={className} />,
    safety: <Shield className={className} />,
    conflict: <Users className={className} />,
    communication: <MessageCircle className={className} />,
    discipline: <AlertTriangle className={className} />,
    attendance: <ClipboardCheck className={className} />,
    activity: <Calendar className={className} />,
    emergency: <Siren className={className} />,
  };
  return <>{icons[category]}</>;
};

// ==================== 统计卡片 ====================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {trend && (
        <p className={`text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
    </CardContent>
  </Card>
);

// ==================== SOP 模板卡片 ====================

interface TemplateCardProps {
  template: SOPTemplate;
  onUse: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onUse,
  onView,
  onEdit,
  onDelete,
}) => (
  <Card className="group hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CategoryIcon category={template.category} className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{template.name}</CardTitle>
            <CardDescription className="text-xs">
              {SOP_CATEGORY_LABELS[template.category]}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {template.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{template.steps.length} 步骤</span>
          <Separator orientation="vertical" className="h-4" />
          <span>使用 {template.usageCount} 次</span>
        </div>
        <Button size="sm" onClick={onUse}>
          <Play className="h-3 w-3 mr-1" />
          执行
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ==================== 执行记录卡片 ====================

interface ExecutionCardProps {
  execution: SOPExecution;
  onView: () => void;
  onContinue: () => void;
}

const ExecutionCard: React.FC<ExecutionCardProps> = ({ execution, onView, onContinue }) => {
  const statusConfig = {
    in_progress: { icon: <Clock className="h-4 w-4" />, color: 'bg-blue-500' },
    completed: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500' },
    timeout: { icon: <XCircle className="h-4 w-4" />, color: 'bg-orange-500' },
    aborted: { icon: <XCircle className="h-4 w-4" />, color: 'bg-gray-500' },
  };
  
  const config = statusConfig[execution.status];
  const completedSteps = execution.steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / execution.steps.length) * 100;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${config.color} text-white`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-sm">{execution.templateName}</CardTitle>
              <CardDescription className="text-xs">
                {execution.className} · {new Date(execution.startedAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
            {EXECUTION_STATUS_LABELS[execution.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">执行进度</span>
            <span className="font-medium">{completedSteps}/{execution.steps.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              执行人: {execution.executorName}
            </span>
            {execution.status === 'in_progress' ? (
              <Button size="sm" variant="outline" onClick={onContinue}>
                继续
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onView}>
                查看
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 台账条目卡片 ====================

interface LedgerCardProps {
  entry: LedgerEntry;
  onView: () => void;
  onResolve: () => void;
}

const LedgerCard: React.FC<LedgerCardProps> = ({ entry, onView, onResolve }) => {
  const severityColors: Record<string, string> = {
    low: 'bg-green-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${severityColors[entry.severity]}`} />
            <div>
              <CardTitle className="text-sm">{entry.title}</CardTitle>
              <CardDescription className="text-xs">
                {LEDGER_TYPE_LABELS[entry.type]} · {entry.className}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline">
            {LEDGER_STATUS_LABELS[entry.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {entry.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {new Date(entry.occurredAt).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onView}>
              <Eye className="h-3 w-3" />
            </Button>
            {entry.status !== 'closed' && (
              <Button size="sm" variant="outline" onClick={onResolve}>
                <CheckCircle className="h-3 w-3 mr-1" />
                解决
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 主页面组件 ====================

export default function ClassSOPPage() {
  // 状态
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState<SOPCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 数据 Hooks
  const { templates, loading: templatesLoading, refresh: refreshTemplates } = useSOPTemplates({
    isActive: true,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
  });
  
  const { executions, loading: executionsLoading, refresh: refreshExecutions } = useSOPExecutions();
  
  const { entries, loading: entriesLoading, refresh: refreshEntries } = useLedgerEntries();
  
  const { statistics, loading: statsLoading } = useSOPStatistics();
  
  // 操作 Hooks
  const templateActions = useSOPTemplateActions();
  const executionActions = useSOPExecutionActions();
  const ledgerActions = useLedgerActions();
  
  // 对话框状态
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<SOPExecution | null>(null);
  
  // 筛选后的模板
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);
  
  // 进行中的执行
  const inProgressExecutions = useMemo(() => {
    return executions.filter(e => e.status === 'in_progress');
  }, [executions]);
  
  // 待处理的台账
  const pendingEntries = useMemo(() => {
    return entries.filter(e => e.status === 'open' || e.status === 'investigating');
  }, [entries]);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">班级 SOP 智能台账</h1>
          <p className="text-muted-foreground">标准化操作流程 · 自动留痕 · 责任追溯</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            refreshTemplates();
            refreshExecutions();
            refreshEntries();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建 SOP
          </Button>
        </div>
      </div>
      
      {/* 统计看板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="SOP 模板"
          value={templates.length}
          description={`${templates.filter(t => t.isSystem).length} 个系统模板`}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="执行记录"
          value={executions.length}
          description={`${inProgressExecutions.length} 个进行中`}
          icon={<History className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="台账条目"
          value={entries.length}
          description={`${pendingEntries.length} 个待处理`}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="本月完成"
          value={statistics?.ledger.resolvedThisMonth || 0}
          description="已解决事项"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      
      {/* 进行中的执行提醒 */}
      {inProgressExecutions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              进行中的任务 ({inProgressExecutions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {inProgressExecutions.slice(0, 3).map(execution => (
                <Card key={execution.id} className="min-w-[280px]">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{execution.templateName}</span>
                      <Badge variant="secondary">进行中</Badge>
                    </div>
                    <Progress 
                      value={execution.steps.filter(s => s.status === 'completed').length / execution.steps.length * 100}
                      className="h-1 mb-2"
                    />
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSelectedExecution(execution);
                        setShowExecutionDialog(true);
                      }}
                    >
                      继续执行
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 主标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            SOP 模板
          </TabsTrigger>
          <TabsTrigger value="executions">
            <History className="h-4 w-4 mr-2" />
            执行记录
          </TabsTrigger>
          <TabsTrigger value="ledger">
            <BarChart3 className="h-4 w-4 mr-2" />
            台账管理
          </TabsTrigger>
        </TabsList>
        
        {/* SOP 模板 */}
        <TabsContent value="templates" className="space-y-4">
          {/* 筛选栏 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索 SOP 模板..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v as SOPCategory | 'all')}>
              <SelectTrigger className="w-[180px]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                暂无 SOP 模板，点击上方按钮创建
              </div>
            ) : (
              filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => {
                    setSelectedTemplate(template);
                    setShowExecutionDialog(true);
                  }}
                  onView={() => {
                    setSelectedTemplate(template);
                    setShowTemplateDialog(true);
                  }}
                  onEdit={() => {
                    setSelectedTemplate(template);
                    setShowTemplateDialog(true);
                  }}
                  onDelete={() => {
                    if (confirm('确定删除此 SOP 模板？')) {
                      templateActions.deleteTemplate(template.id);
                      refreshTemplates();
                    }
                  }}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        {/* 执行记录 */}
        <TabsContent value="executions" className="space-y-4">
          <div className="flex gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="执行状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(EXECUTION_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executionsLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : executions.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                暂无执行记录
              </div>
            ) : (
              executions.map(execution => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  onView={() => {
                    setSelectedExecution(execution);
                    setShowExecutionDialog(true);
                  }}
                  onContinue={() => {
                    setSelectedExecution(execution);
                    setShowExecutionDialog(true);
                  }}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        {/* 台账管理 */}
        <TabsContent value="ledger" className="space-y-4">
          <div className="flex gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="台账类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(LEDGER_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="处理状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(LEDGER_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entriesLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : entries.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                暂无台账记录
              </div>
            ) : (
              entries.map(entry => (
                <LedgerCard
                  key={entry.id}
                  entry={entry}
                  onView={() => {
                    // TODO: 查看详情
                  }}
                  onResolve={() => {
                    if (confirm('确定标记为已解决？')) {
                      ledgerActions.resolveEntry(entry.id);
                      refreshEntries();
                    }
                  }}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 执行对话框 */}
      <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedExecution?.status === 'in_progress' ? '继续执行' : '开始执行'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name || selectedExecution?.templateName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              {/* 执行步骤列表 */}
              <div className="space-y-3">
                {selectedExecution.steps.map((step, index) => (
                  <Card key={index} className={
                    step.status === 'in_progress' ? 'border-primary' : ''
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`
                          flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                          ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                            step.status === 'in_progress' ? 'bg-primary text-white' :
                            step.status === 'skipped' ? 'bg-gray-300 text-gray-600' :
                            'bg-muted text-muted-foreground'}
                        `}>
                          {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.stepTitle}</div>
                          {step.content && (
                            <p className="text-sm text-muted-foreground mt-1">{step.content}</p>
                          )}
                          {step.attachments.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {step.attachments.map(att => (
                                <Badge key={att.id} variant="outline">
                                  <Camera className="h-3 w-3 mr-1" />
                                  {att.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {step.status === 'pending' && selectedExecution.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              await executionActions.updateStep(
                                selectedExecution.id,
                                step.stepOrder,
                                'start'
                              );
                              // 刷新执行记录
                            }}
                          >
                            开始
                          </Button>
                        )}
                        {step.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              await executionActions.updateStep(
                                selectedExecution.id,
                                step.stepOrder,
                                'complete',
                                { content: '已完成' }
                              );
                              // 刷新执行记录
                            }}
                          >
                            完成
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* 完成按钮 */}
              {selectedExecution.status === 'in_progress' && 
               selectedExecution.steps.every(s => s.status !== 'pending') && (
                <div className="pt-4 border-t">
                  <Textarea 
                    placeholder="请输入执行总结..."
                    className="mb-4"
                  />
                  <Button className="w-full">
                    <FileSignature className="h-4 w-4 mr-2" />
                    完成执行并签字
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
