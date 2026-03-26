'use client';

/**
 * 教研活动管理页面
 * 
 * 设计理念：
 * - 专业学术风格，现代化界面
 * - 清晰的视觉层次，丰富的数据展示
 * - 流畅的交互体验
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  Plus,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Lightbulb,
  Cpu,
  FlaskConical,
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Award,
  FolderOpen,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  List,
  SortAsc,
} from 'lucide-react';
import { toast } from 'sonner';
import GlobalResourceManager from '@/components/research/GlobalResourceManager';

// ==================== 类型定义 ====================

type ThemeType = 'big_unit' | 'project' | 'practice' | 'ai_enabled' | 'custom';
type ThemeLevel = 'school' | 'grade' | 'subject_group';
type ThemeStatus = 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'archived';

interface ResearchTheme {
  id: string;
  title: string;
  type: ThemeType;
  typeLabel: string;
  subject: string;
  level: ThemeLevel;
  levelLabel: string;
  description?: string;
  status: ThemeStatus;
  creatorName: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  participantIds?: string[];
}

interface Statistics {
  overview: { label: string; value: number }[];
  typeStats: Record<string, number>;
}

// ==================== 配置 ====================

const THEME_TYPES: { value: ThemeType; label: string; icon: React.ElementType; gradient: string; description: string; features: string[] }[] = [
  { 
    value: 'big_unit', 
    label: '大单元教学', 
    icon: BookOpen, 
    gradient: 'from-blue-500 to-cyan-500',
    description: '单元整体设计，结构化教学',
    features: ['单元目标', '课时设计', '作业设计', '成效分析']
  },
  { 
    value: 'project', 
    label: '项目式教学', 
    icon: Lightbulb, 
    gradient: 'from-amber-500 to-orange-500',
    description: '驱动问题引领，跨学科协同',
    features: ['驱动问题', '阶段任务', '团队分工', '成果展示']
  },
  { 
    value: 'practice', 
    label: '学科实践', 
    icon: FlaskConical, 
    gradient: 'from-emerald-500 to-teal-500',
    description: '动手实践，问题攻坚',
    features: ['活动设计', '材料准备', '流程记录', '教学反思']
  },
  { 
    value: 'ai_enabled', 
    label: 'AI赋能教学', 
    icon: Cpu, 
    gradient: 'from-violet-500 to-purple-500',
    description: '智能辅助，效率提升',
    features: ['工具应用', '提示词设计', '课堂融合', '效果评估']
  },
];

const THEME_LEVELS: { value: ThemeLevel; label: string; desc: string }[] = [
  { value: 'school', label: '校级重点教研', desc: '全校范围，重点攻关' },
  { value: 'grade', label: '年级组教研', desc: '年级协同，统一进度' },
  { value: 'subject_group', label: '备课组微教研', desc: '小组研讨，精细打磨' },
];

const SUBJECTS = ['语文', '数学', '英语', '音乐', '体育', '美术', '科学', '道德与法治', '综合实践', '信息技术'];

const STATUS_CONFIG: Record<ThemeStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: '草稿', variant: 'secondary', color: 'text-gray-600' },
  in_progress: { label: '进行中', variant: 'default', color: 'text-green-600' },
  completed: { label: '已完成', variant: 'default', color: 'text-emerald-600' },
  archived: { label: '已归档', variant: 'secondary', color: 'text-gray-500' },
  pending: { label: '待审核', variant: 'outline', color: 'text-amber-600' },
  approved: { label: '已通过', variant: 'outline', color: 'text-blue-600' },
};

// ==================== 组件 ====================

export default function ResearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [themes, setThemes] = useState<ResearchTheme[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // 创建表单
  const [formData, setFormData] = useState({
    title: '',
    type: 'big_unit' as ThemeType,
    subject: '语文',
    level: 'subject_group' as ThemeLevel,
    description: '',
    objectives: '',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 加载数据
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [themesRes, statsRes] = await Promise.all([
        fetch('/api/research/themes?pageSize=50'),
        fetch('/api/research/statistics?type=overview'),
      ]);
      
      if (themesRes.ok) {
        const data = await themesRes.json();
        setThemes(data.data || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatistics(data.data);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 创建主题
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入主题名称');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/research/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          subject: formData.subject,
          level: formData.level,
          description: formData.description,
          objectives: formData.objectives.split('\n').filter(o => o.trim()),
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('教研主题创建成功');
        setCreateDialogOpen(false);
        setFormData({
          title: '',
          type: 'big_unit',
          subject: '语文',
          level: 'subject_group',
          description: '',
          objectives: '',
          startDate: '',
          endDate: '',
        });
        loadData();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (err) {
      console.error('创建失败:', err);
      toast.error('创建失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 筛选主题
  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (theme.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || theme.type === filterType;
    const matchesStatus = filterStatus === 'all' || theme.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // 按状态分组
  const themesByStatus = {
    in_progress: filteredThemes.filter(t => t.status === 'in_progress'),
    completed: filteredThemes.filter(t => t.status === 'completed'),
    other: filteredThemes.filter(t => !['in_progress', 'completed'].includes(t.status)),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">教研活动中心</h1>
              </div>
              <p className="text-slate-500 ml-14">主题化 · 专项化 · 学科化教研体系</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="搜索教研主题..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25">
                    <Plus className="h-4 w-4 mr-2" />
                    新建教研主题
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">创建教研主题</DialogTitle>
                    <DialogDescription className="text-base">
                      选择教研类型，开启专项教研之旅
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* 类型选择 */}
                  <div className="py-4">
                    <Label className="text-base font-medium mb-3 block">教研类型</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {THEME_TYPES.map(type => {
                        const isSelected = formData.type === type.value;
                        const Icon = type.icon;
                        return (
                          <div
                            key={type.value}
                            onClick={() => setFormData({ ...formData, type: type.value })}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${type.gradient} mb-2`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-slate-900">{type.label}</h4>
                            <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-5 w-5 text-indigo-500" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="title" className="text-base font-medium">主题名称 *</Label>
                      <Input
                        id="title"
                        placeholder="例如：三年级语文大单元教学研究"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-base font-medium">学科</Label>
                        <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label className="text-base font-medium">教研级别</Label>
                        <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v as ThemeLevel })}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {THEME_LEVELS.map(l => (
                              <SelectItem key={l.value} value={l.value}>
                                <div className="flex flex-col">
                                  <span>{l.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label className="text-base font-medium">主题描述</Label>
                      <Textarea
                        placeholder="描述教研主题的背景、意义、预期成果等"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label className="text-base font-medium">教研目标</Label>
                      <Textarea
                        placeholder="每行一个目标，例如：&#10;1. 掌握大单元教学设计方法&#10;2. 完成单元作业设计&#10;3. 形成可推广的教学模式"
                        value={formData.objectives}
                        onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-base font-medium">开始日期</Label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-base font-medium">结束日期</Label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="h-11 px-6">
                      取消
                    </Button>
                    <Button onClick={handleCreate} disabled={submitting} className="h-11 px-6 bg-gradient-to-r from-indigo-500 to-purple-600">
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      创建主题
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statistics?.overview.map((item, idx) => {
            const icons = [Target, TrendingUp, CheckCircle, Calendar, Award];
            const colors = ['from-indigo-500 to-blue-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-pink-500 to-rose-500', 'from-violet-500 to-purple-500'];
            const Icon = icons[idx] || Target;
            return (
              <Card key={idx} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className={`absolute inset-0 bg-gradient-to-br ${colors[idx]} opacity-5`} />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[idx]} shadow-sm`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* 专项教研入口 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">专项教研</h2>
              <p className="text-sm text-slate-500">选择教研类型，开始专项研究</p>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500">
              查看全部 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {THEME_TYPES.map(type => {
              const count = statistics?.typeStats?.[type.value] || 0;
              const Icon = type.icon;
              return (
                <Card 
                  key={type.value}
                  className="group relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setFilterType(type.value);
                    setActiveTab('themes');
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${type.gradient} opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />
                  
                  <CardContent className="pt-5 pb-4">
                    <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${type.gradient} shadow-lg mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{type.label}</h3>
                    <p className="text-xs text-slate-500 mb-3">{type.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {type.features.slice(0, 2).map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {f}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {count} <span className="text-slate-400 font-normal">个</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* 教研主题列表 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <TabsList className="bg-transparent p-0 h-auto">
              {[
                { value: 'overview', label: '全部主题', count: themes.length },
                { value: 'in_progress', label: '进行中', count: themesByStatus.in_progress.length },
                { value: 'completed', label: '已完成', count: themesByStatus.completed.length },
                { value: 'resources', label: '资源库', icon: FolderOpen },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 transition-colors"
                >
                  {tab.icon && <tab.icon className="h-4 w-4 mr-1.5" />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-9 bg-white border-slate-200">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex border border-slate-200 rounded-lg p-0.5 bg-white">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <TabsContent value="overview" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : filteredThemes.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-slate-100 mb-4">
                    <Target className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">暂无教研主题</h3>
                  <p className="text-slate-500 mb-4">点击右上角"新建教研主题"开始创建</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建教研主题
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredThemes.map(theme => {
                  const statusConfig = STATUS_CONFIG[theme.status];
                  const typeConfig = THEME_TYPES.find(t => t.value === theme.type);
                  return (
                    <Card 
                      key={theme.id}
                      className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => router.push(`/academic/research/${theme.id}`)}
                    >
                      <div className={`h-1.5 bg-gradient-to-r ${typeConfig?.gradient || 'from-gray-400 to-gray-500'}`} />
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant={statusConfig.variant} className="font-medium">
                            {statusConfig.label}
                          </Badge>
                          <span className="text-xs text-slate-400">{theme.subject}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {theme.title}
                        </h3>
                        {theme.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{theme.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{theme.typeLabel}</span>
                          <span>{theme.creatorName}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredThemes.map(theme => {
                    const statusConfig = STATUS_CONFIG[theme.status];
                    const typeConfig = THEME_TYPES.find(t => t.value === theme.type);
                    const Icon = typeConfig?.icon || Target;
                    return (
                      <div
                        key={theme.id}
                        className="group flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/academic/research/${theme.id}`)}
                      >
                        <div className={`flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${typeConfig?.gradient || 'from-gray-400 to-gray-500'} shadow-sm`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {theme.title}
                            </h3>
                            <Badge variant={statusConfig.variant} className="flex-shrink-0">
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span>{theme.typeLabel}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{theme.subject}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{theme.levelLabel}</span>
                          </div>
                          {theme.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{theme.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{theme.creatorName}</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in_progress" className="mt-0">
            {themesByStatus.in_progress.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                <CardContent className="py-12 text-center">
                  <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无进行中的教研主题</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {themesByStatus.in_progress.map(theme => (
                  <div
                    key={theme.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/academic/research/${theme.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{theme.title}</h3>
                      <p className="text-sm text-slate-500">{theme.subject} · {theme.typeLabel}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {themesByStatus.completed.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无已完成的教研主题</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {themesByStatus.completed.map(theme => (
                  <div
                    key={theme.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/academic/research/${theme.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{theme.title}</h3>
                      <p className="text-sm text-slate-500">{theme.subject} · {theme.typeLabel}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="resources" className="mt-0">
            <GlobalResourceManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
