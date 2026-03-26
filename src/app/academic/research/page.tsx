'use client';

/**
 * 教研活动管理页面
 * 
 * 功能：
 * - 教研主题管理
 * - 教研统计概览
 * - 四大专项教研入口
 * - 教研资源与成果
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Target,
  Plus,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Lightbulb,
  Cpu,
  FlaskConical,
  LayoutGrid,
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

const THEME_TYPES: { value: ThemeType; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { value: 'big_unit', label: '大单元教学', icon: BookOpen, color: 'text-blue-600', description: '单元整体设计、课时拆分、成效复盘' },
  { value: 'project', label: '项目式教学', icon: Lightbulb, color: 'text-amber-600', description: '项目选题、任务分解、跨学科协同' },
  { value: 'practice', label: '学科实践', icon: FlaskConical, color: 'text-green-600', description: '实践活动设计、问题攻坚、成果展示' },
  { value: 'ai_enabled', label: 'AI赋能教学', icon: Cpu, color: 'text-purple-600', description: 'AI工具应用、教学设计、课堂观摩' },
  { value: 'custom', label: '自定义主题', icon: Target, color: 'text-gray-600', description: '其他教研主题方向' },
];

const THEME_LEVELS: { value: ThemeLevel; label: string }[] = [
  { value: 'school', label: '校级重点教研' },
  { value: 'grade', label: '年级组教研' },
  { value: 'subject_group', label: '备课组微教研' },
];

const SUBJECTS = ['语文', '数学', '英语', '音乐', '体育', '美术', '科学', '道德与法治', '综合实践', '信息技术'];

const STATUS_CONFIG: Record<ThemeStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-600', icon: Clock },
  approved: { label: '已通过', color: 'bg-blue-100 text-blue-600', icon: CheckCircle },
  in_progress: { label: '进行中', color: 'bg-green-100 text-green-600', icon: Loader2 },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-500', icon: FileText },
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
        fetch('/api/research/themes?pageSize=20'),
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
  
  // 查看主题详情
  const handleViewTheme = (themeId: string) => {
    router.push(`/academic/research/${themeId}`);
  };
  
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教研活动管理</h1>
          <p className="text-gray-500 mt-1">主题化、专项化、学科化教研体系</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建教研主题
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建教研主题</DialogTitle>
              <DialogDescription>
                创建一个新的教研主题，选择主题类型、学科和级别
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">主题名称 *</Label>
                <Input
                  id="title"
                  placeholder="输入教研主题名称"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>主题类型</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ThemeType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>学科</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger>
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
                  <Label>教研级别</Label>
                  <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v as ThemeLevel })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>主题描述</Label>
                <Textarea
                  placeholder="描述教研主题的背景、目标等"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>教研目标（每行一个）</Label>
                <Textarea
                  placeholder="输入教研目标，每行一个"
                  value={formData.objectives}
                  onChange={e => setFormData({ ...formData, objectives: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* 统计概览 */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statistics.overview.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 四大专项教研入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">专项教研</CardTitle>
          <CardDescription>选择教研类型，开始专项教研</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {THEME_TYPES.slice(0, 4).map(type => {
              const count = statistics?.typeStats?.[type.value] || 0;
              return (
                <Card 
                  key={type.value} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setActiveTab('themes');
                    // TODO: 筛选对应类型
                  }}
                >
                  <CardContent className="pt-4">
                    <type.icon className={`h-8 w-8 ${type.color} mb-2`} />
                    <h3 className="font-semibold">{type.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-400">进行中</span>
                      <span className="ml-2 font-medium">{count}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* 主内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">全部主题</TabsTrigger>
          <TabsTrigger value="in_progress">进行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="resources">教研资源</TabsTrigger>
          <TabsTrigger value="achievements">教研成果</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : themes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">暂无教研主题</h3>
                <p className="text-gray-500 mt-1">点击右上角"新建教研主题"开始创建</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {themes.map(theme => {
                const statusConfig = STATUS_CONFIG[theme.status];
                const StatusIcon = statusConfig.icon;
                return (
                  <Card 
                    key={theme.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewTheme(theme.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{theme.title}</h3>
                            <Badge variant="outline" className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{theme.typeLabel}</span>
                            <span>·</span>
                            <span>{theme.subject}</span>
                            <span>·</span>
                            <span>{theme.levelLabel}</span>
                          </div>
                          {theme.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{theme.description}</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in_progress" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">进行中的教研主题</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">已完成的教研主题</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">教研资源库</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">教研成果库</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
