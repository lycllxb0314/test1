'use client';

/**
 * 教研主题详情页面
 * 
 * 设计理念：
 * - 沉浸式头部，清晰的信息层次
 * - 流畅的标签页导航
 * - 专项教研编辑器集成
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  BookOpen,
  Lightbulb,
  FlaskConical,
  Cpu,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Activity,
  Plus,
  Settings,
  MoreVertical,
  Eye,
  MessageSquare,
  Paperclip,
  Sparkles,
  TrendingUp,
  Award,
  FolderOpen,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
import { toast } from 'sonner';

import ActivityDialog from '@/components/research/ActivityDialog';
import ResourceManager from '@/components/research/ResourceManager';
import AchievementManager from '@/components/research/AchievementManager';
import BigUnitEditor from '@/components/research/BigUnitEditor';
import ProjectEditor from '@/components/research/ProjectEditor';
import PracticeEditor from '@/components/research/PracticeEditor';
import AITeachingEditor from '@/components/research/AITeachingEditor';

import { 
  THEME_TYPE_LABELS,
  THEME_LEVEL_LABELS,
  THEME_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  type ThemeType,
  type ThemeStatus,
  type ResearchStage,
  type ResearchActivity,
} from '@/types/research';

// ==================== 类型定义 ====================

interface ThemeDetail {
  id: string;
  title: string;
  type: ThemeType;
  typeLabel: string;
  subject: string;
  level: string;
  levelLabel: string;
  description?: string;
  objectives?: string[];
  keyPoints?: string[];
  status: ThemeStatus;
  creatorName: string;
  startDate?: string;
  endDate?: string;
  participantIds?: string[];
  stages: ResearchStage[];
  activities: ResearchActivity[];
  statistics?: {
    total_activities: number;
    completed_activities: number;
    achievements_count: number;
  };
  specialData?: unknown;
}

// ==================== 配置 ====================

const THEME_TYPE_CONFIG: Record<ThemeType, { label: string; icon: React.ElementType; gradient: string; features: string[] }> = {
  big_unit: { 
    label: '大单元教学', 
    icon: BookOpen, 
    gradient: 'from-blue-500 to-cyan-500',
    features: ['单元目标', '课时设计', '作业设计', '成效分析']
  },
  project: { 
    label: '项目式教学', 
    icon: Lightbulb, 
    gradient: 'from-amber-500 to-orange-500',
    features: ['驱动问题', '阶段任务', '团队分工', '成果展示']
  },
  practice: { 
    label: '学科实践', 
    icon: FlaskConical, 
    gradient: 'from-emerald-500 to-teal-500',
    features: ['活动设计', '材料准备', '流程记录', '教学反思']
  },
  ai_enabled: { 
    label: 'AI赋能教学', 
    icon: Cpu, 
    gradient: 'from-violet-500 to-purple-500',
    features: ['工具应用', '提示词设计', '课堂融合', '效果评估']
  },
  custom: { 
    label: '自定义主题', 
    icon: Target, 
    gradient: 'from-slate-500 to-gray-500',
    features: ['自定义内容']
  },
};

const STATUS_ACTIONS: Record<ThemeStatus, { canEdit: boolean; canSubmit: boolean; canApprove: boolean; canComplete: boolean }> = {
  draft: { canEdit: true, canSubmit: true, canApprove: false, canComplete: false },
  pending: { canEdit: false, canSubmit: false, canApprove: true, canComplete: false },
  approved: { canEdit: true, canSubmit: false, canApprove: false, canComplete: false },
  in_progress: { canEdit: true, canSubmit: false, canApprove: false, canComplete: true },
  completed: { canEdit: false, canSubmit: false, canApprove: false, canComplete: false },
  archived: { canEdit: false, canSubmit: false, canApprove: false, canComplete: false },
};

// ==================== 组件 ====================

export default function ResearchThemeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const themeId = params.id as string;
  
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  
  useEffect(() => {
    loadTheme();
  }, [themeId]);
  
  const loadTheme = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/research/themes/${themeId}`);
      const data = await res.json();
      
      if (data.success) {
        setTheme(data.data);
      } else {
        toast.error('加载失败');
        router.push('/academic/research');
      }
    } catch (err) {
      console.error('加载主题详情失败:', err);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/research/themes/${themeId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('已提交审核');
        loadTheme();
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (err) {
      toast.error('提交失败');
    }
  };
  
  const handleStart = async () => {
    try {
      const res = await fetch(`/api/research/themes/${themeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('已开始教研');
        loadTheme();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    }
  };
  
  const handleComplete = async () => {
    try {
      const res = await fetch(`/api/research/themes/${themeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('教研已完成');
        loadTheme();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (err) {
      toast.error('操作失败');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!theme) {
    return null;
  }
  
  const typeConfig = THEME_TYPE_CONFIG[theme.type];
  const statusActions = STATUS_ACTIONS[theme.status];
  const TypeIcon = typeConfig.icon;
  const progress = theme.statistics?.total_activities 
    ? Math.round((theme.statistics.completed_activities / theme.statistics.total_activities) * 100) 
    : 0;
  
  const getDaysRemaining = () => {
    if (!theme.endDate) return null;
    const end = new Date(theme.endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };
  
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 沉浸式头部 */}
      <div className={`bg-gradient-to-br ${typeConfig.gradient} text-white`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 返回按钮 */}
          <Button 
            variant="ghost" 
            onClick={() => router.push('/academic/research')}
            className="text-white/80 hover:text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          
          {/* 主题信息 */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <TypeIcon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{theme.title}</h1>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      {theme.status === 'in_progress' ? '进行中' : 
                       theme.status === 'completed' ? '已完成' :
                       theme.status === 'draft' ? '草稿' :
                       theme.status === 'pending' ? '待审核' :
                       theme.status === 'approved' ? '已通过' : '已归档'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span>{theme.typeLabel}</span>
                    <span>·</span>
                    <span>{theme.subject}</span>
                    <span>·</span>
                    <span>{theme.levelLabel}</span>
                  </div>
                </div>
              </div>
              
              {/* 目标标签 */}
              {theme.objectives && theme.objectives.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {theme.objectives.slice(0, 3).map((obj, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white/15 text-white border-0 hover:bg-white/25">
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      {obj.length > 30 ? obj.slice(0, 30) + '...' : obj}
                    </Badge>
                  ))}
                  {theme.objectives.length > 3 && (
                    <Badge variant="secondary" className="bg-white/15 text-white border-0">
                      +{theme.objectives.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* 时间信息 */}
              <div className="flex items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{theme.startDate || '未设定'} ~ {theme.endDate || '未设定'}</span>
                </div>
                {daysRemaining !== null && theme.status === 'in_progress' && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${daysRemaining > 7 ? 'bg-white/20' : 'bg-amber-500/80'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : '已过期'}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{theme.participantIds?.length || 0} 人参与</span>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {statusActions.canSubmit && (
                <Button 
                  onClick={handleSubmit}
                  className="bg-white text-slate-900 hover:bg-white/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  提交审核
                </Button>
              )}
              {statusActions.canComplete && (
                <Button 
                  onClick={handleComplete}
                  className="bg-white text-slate-900 hover:bg-white/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  完成教研
                </Button>
              )}
              {theme.status === 'approved' && (
                <Button 
                  onClick={handleStart}
                  className="bg-white text-slate-900 hover:bg-white/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  开始教研
                </Button>
              )}
              {statusActions.canEdit && (
                <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{theme.statistics?.total_activities || 0}</div>
                  <div className="text-xs text-slate-500">教研活动</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{theme.statistics?.completed_activities || 0}</div>
                  <div className="text-xs text-slate-500">已完成</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{theme.participantIds?.length || 0}</div>
                  <div className="text-xs text-slate-500">参与教师</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{theme.statistics?.achievements_count || 0}</div>
                  <div className="text-xs text-slate-500">教研成果</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 进度条 */}
      {theme.statistics && theme.statistics.total_activities > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">教研进度</span>
                <span className="text-sm font-bold text-indigo-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <TabsList className="w-full bg-transparent p-1 h-auto">
              {[
                { value: 'overview', label: '教研方案', icon: FileText },
                { value: 'activities', label: '教研活动', icon: Activity, count: theme.activities.length },
                { value: 'special', label: typeConfig.label, icon: TypeIcon },
                { value: 'resources', label: '资源库', icon: FolderOpen },
                { value: 'achievements', label: '成果库', icon: Award },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 py-3 text-sm font-medium text-slate-500 data-[state=active]:text-indigo-600 data-[state=active]:bg-indigo-50 rounded-lg transition-colors"
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {/* 教研方案 */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* 描述 */}
              <Card className="md:col-span-2 border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">主题描述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">
                    {theme.description || '暂无描述'}
                  </p>
                </CardContent>
              </Card>
              
              {/* 教研目标 */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">教研目标</CardTitle>
                </CardHeader>
                <CardContent>
                  {theme.objectives && theme.objectives.length > 0 ? (
                    <ul className="space-y-2">
                      {theme.objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">暂无目标</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* 教研阶段 */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">教研阶段</CardTitle>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    管理阶段
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {theme.stages.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">暂无教研阶段</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="h-4 w-4 mr-2" />
                      添加阶段
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
                    <div className="space-y-4">
                      {theme.stages.map((stage, idx) => (
                        <div key={stage.id} className="relative flex items-start gap-4 pl-4">
                          <div className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                            stage.status === 'completed' 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : stage.status === 'in_progress'
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-slate-300'
                          }`}>
                            {stage.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-white -m-0.5" />
                            )}
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-slate-900">{stage.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {stage.status === 'completed' ? '已完成' : stage.status === 'in_progress' ? '进行中' : '待开始'}
                              </Badge>
                            </div>
                            {stage.description && (
                              <p className="text-sm text-slate-500">{stage.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 教研活动 */}
          <TabsContent value="activities" className="mt-0">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">教研活动记录</CardTitle>
                  <Button size="sm" onClick={() => setActivityDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建活动
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {theme.activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400">暂无教研活动</p>
                    <Button size="sm" className="mt-3" onClick={() => setActivityDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      新建活动
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {theme.activities.map(activity => (
                      <div 
                        key={activity.id} 
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        <div className={`p-2 rounded-lg ${
                          activity.status === 'completed' 
                            ? 'bg-emerald-50' 
                            : activity.status === 'in_progress'
                            ? 'bg-blue-50'
                            : 'bg-slate-100'
                        }`}>
                          <Activity className={`h-5 w-5 ${
                            activity.status === 'completed' 
                              ? 'text-emerald-500' 
                              : activity.status === 'in_progress'
                              ? 'text-blue-500'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900">{activity.title}</h4>
                          <p className="text-sm text-slate-500">
                            {ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || activity.type}
                            {activity.location && ` · ${activity.location}`}
                          </p>
                        </div>
                        {activity.scheduledAt && (
                          <div className="text-sm text-slate-400">
                            {new Date(activity.scheduledAt).toLocaleDateString()}
                          </div>
                        )}
                        <Badge variant="outline" className={
                          activity.status === 'completed' 
                            ? 'text-emerald-600 border-emerald-200' 
                            : activity.status === 'in_progress'
                            ? 'text-blue-600 border-blue-200'
                            : 'text-slate-500'
                        }>
                          {activity.status === 'completed' ? '已完成' : activity.status === 'in_progress' ? '进行中' : '待进行'}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <ActivityDialog
              open={activityDialogOpen}
              onOpenChange={setActivityDialogOpen}
              themeId={themeId}
              onSuccess={loadTheme}
            />
          </TabsContent>
          
          {/* 专项教研 */}
          <TabsContent value="special" className="mt-0">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${typeConfig.gradient}`}>
                    <TypeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{typeConfig.label}设计</CardTitle>
                    <CardDescription>专项教研内容编辑</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {theme.type === 'big_unit' && (
                  <BigUnitEditor 
                    themeId={themeId} 
                    design={theme.specialData as any}
                    onSave={loadTheme}
                  />
                )}
                {theme.type === 'project' && (
                  <ProjectEditor 
                    themeId={themeId} 
                    design={theme.specialData as any}
                    onSave={loadTheme}
                  />
                )}
                {theme.type === 'practice' && (
                  <PracticeEditor 
                    themeId={themeId} 
                    activity={theme.specialData as any}
                    onSave={loadTheme}
                  />
                )}
                {theme.type === 'ai_enabled' && (
                  <AITeachingEditor 
                    themeId={themeId} 
                    app={theme.specialData as any}
                    onSave={loadTheme}
                  />
                )}
                {theme.type === 'custom' && (
                  <div className="text-center py-16">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${typeConfig.gradient} mb-4`}>
                      <Target className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">自定义主题</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      自定义主题可自由记录教研内容，通过添加活动和成果来沉淀教研资料
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 资源库 */}
          <TabsContent value="resources" className="mt-0">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <ResourceManager subject={theme.subject} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 成果库 */}
          <TabsContent value="achievements" className="mt-0">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <AchievementManager themeId={themeId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
