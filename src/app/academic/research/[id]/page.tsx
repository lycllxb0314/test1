'use client';

/**
 * 教研主题详情页面
 * 
 * 设计理念：
 * - 沉浸式头部，清晰的信息层次
 * - 教研活动为核心，教学设计关联到活动
 * - 资源库统一管理文件和成果
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Loader2,
  Activity,
  Plus,
  FolderOpen,
  ChevronRight,
  Play,
  User,
  FileText,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

import ResourceLibrary from '@/components/research/ResourceLibrary';
import StageManager from '@/components/research/StageManager';
import LessonDesignEditor from '@/components/research/LessonDesignEditor';
import TeacherSelector, { type SelectedTeacher } from '@/components/research/TeacherSelector';
import { useTeachers, type TeacherInfo } from '@/hooks/useTeachers';

import { 
  THEME_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  type ThemeType,
  type ThemeStatus,
  type ResearchStage,
  type ResearchActivity,
} from '@/types/research';

// ==================== 类型定义 ====================

interface LessonDesign {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: unknown;
  createdAt: string;
}

interface ActivityWithDesigns extends ResearchActivity {
  lessonDesigns?: LessonDesign[];
}

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
  activities: ActivityWithDesigns[];
  statistics?: {
    total_activities: number;
    completed_activities: number;
    resources_count: number;
  };
}

// ==================== 配置 ====================

const THEME_TYPE_CONFIG: Record<ThemeType, { label: string; icon: React.ElementType; gradient: string }> = {
  big_unit: { label: '大单元教学', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
  project: { label: '项目式教学', icon: Lightbulb, gradient: 'from-amber-500 to-orange-500' },
  practice: { label: '学科实践', icon: FlaskConical, gradient: 'from-emerald-500 to-teal-500' },
  ai_enabled: { label: 'AI赋能教学', icon: Cpu, gradient: 'from-violet-500 to-purple-500' },
  custom: { label: '自定义主题', icon: Target, gradient: 'from-slate-500 to-gray-500' },
};

const STATUS_CONFIG: Record<ThemeStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'text-gray-600' },
  pending: { label: '待审核', color: 'text-amber-600' },
  approved: { label: '已通过', color: 'text-blue-600' },
  in_progress: { label: '进行中', color: 'text-green-600' },
  completed: { label: '已完成', color: 'text-emerald-600' },
  archived: { label: '已归档', color: 'text-gray-500' },
};

// ==================== 组件 ====================

export default function ResearchThemeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const themeId = params.id as string;
  
  // 页面级别获取教师数据（避免 Dialog 内部懒加载导致数据未准备好）
  const { allTeachers, loading: teachersLoading } = useTeachers();
  
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithDesigns | null>(null);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  
  // 创建活动表单
  const [activityForm, setActivityForm] = useState({
    title: '',
    type: 'lesson_observation',
    location: '',
    scheduledAt: '',
    description: '',
    participantIds: [] as string[],
  });
  const [selectedTeachers, setSelectedTeachers] = useState<SelectedTeacher[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
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
  
  const handleStatusChange = async (newStatus: ThemeStatus) => {
    try {
      const res = await fetch(`/api/research/themes/${themeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('状态更新成功');
        loadTheme();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    }
  };
  
  const handleCreateActivity = async () => {
    if (!activityForm.title.trim()) {
      toast.error('请输入活动名称');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/research/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          title: activityForm.title,
          type: activityForm.type,
          location: activityForm.location,
          scheduledAt: activityForm.scheduledAt || null,
          description: activityForm.description,
          participantIds: activityForm.participantIds,
          participants: selectedTeachers.map(t => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
          })),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('活动创建成功');
        setActivityDialogOpen(false);
        setActivityForm({ 
          title: '', 
          type: 'lesson_observation', 
          location: '', 
          scheduledAt: '', 
          description: '',
          participantIds: [],
        });
        setSelectedTeachers([]);
        loadTheme();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (err) {
      toast.error('创建失败');
    } finally {
      setSubmitting(false);
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
  const statusConfig = STATUS_CONFIG[theme.status];
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
          <Button 
            variant="ghost" 
            onClick={() => router.push('/academic/research')}
            className="text-white/80 hover:text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <TypeIcon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{theme.title}</h1>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {statusConfig.label}
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
              
              {theme.objectives && theme.objectives.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {theme.objectives.slice(0, 3).map((obj, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white/15 text-white border-0">
                      <CheckCircle className="h-3 w-3 mr-1.5" />
                      {obj.length > 30 ? obj.slice(0, 30) + '...' : obj}
                    </Badge>
                  ))}
                </div>
              )}
              
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
              {theme.status === 'draft' && (
                <Button 
                  onClick={() => handleStatusChange('pending')}
                  className="bg-white text-slate-900 hover:bg-white/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  提交审核
                </Button>
              )}
              {theme.status === 'approved' && (
                <Button 
                  onClick={() => handleStatusChange('in_progress')}
                  className="bg-white text-slate-900 hover:bg-white/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  开始教研
                </Button>
              )}
              {theme.status === 'in_progress' && (
                <Button 
                  onClick={() => handleStatusChange('completed')}
                  className="bg-white text-slate-900 hover:bg-white/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  完成教研
                </Button>
              )}
              <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
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
                  <FolderOpen className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{theme.statistics?.resources_count || 0}</div>
                  <div className="text-xs text-slate-500">资源文件</div>
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
                { value: 'resources', label: '资源库', icon: FolderOpen },
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
            
            {/* 教研阶段管理 */}
            <StageManager 
              themeId={themeId}
              stages={theme.stages}
              onUpdate={loadTheme}
            />
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
                    <p className="text-slate-400 mb-4">暂无教研活动</p>
                    <Button size="sm" onClick={() => setActivityDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      新建活动
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {theme.activities.map(activity => (
                      <ActivityCard 
                        key={activity.id} 
                        activity={activity}
                        themeType={theme.type}
                        onClick={() => setSelectedActivity(activity)}
                        onUpdate={loadTheme}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 资源库 */}
          <TabsContent value="resources" className="mt-0">
            <ResourceLibrary themeId={themeId} themeType={theme.type} subject={theme.subject} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 创建活动对话框 - 横屏大卡片 */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 !flex !flex-row max-h-[85vh]">
          {/* 左侧：活动基本信息 */}
          <div className="w-[320px] shrink-0 border-r bg-slate-50/50 flex flex-col">
            <div className="p-6 border-b bg-white shrink-0">
              <DialogTitle className="text-xl">创建教研活动</DialogTitle>
              <DialogDescription className="mt-1.5">
                创建一个新的教研活动
              </DialogDescription>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700">活动名称 *</Label>
                <Input
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  placeholder="例如：第一次集体备课"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">活动类型</Label>
                <Select value={activityForm.type} onValueChange={(v) => setActivityForm({ ...activityForm, type: v })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson_observation">听课评课</SelectItem>
                    <SelectItem value="collective_prep">集体备课</SelectItem>
                    <SelectItem value="seminar">研讨会</SelectItem>
                    <SelectItem value="training">培训学习</SelectItem>
                    <SelectItem value="workshop">工作坊</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">活动地点</Label>
                <Input
                  value={activityForm.location}
                  onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                  placeholder="例如：三楼会议室"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">活动时间</Label>
                <Input
                  type="datetime-local"
                  value={activityForm.scheduledAt}
                  onChange={(e) => setActivityForm({ ...activityForm, scheduledAt: e.target.value })}
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">活动描述</Label>
                <Textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  placeholder="描述活动内容和安排..."
                  rows={4}
                  className="bg-white resize-none"
                />
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="p-4 border-t bg-white flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setActivityDialogOpen(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                onClick={handleCreateActivity} 
                disabled={submitting || !activityForm.title.trim()}
                className="flex-1"
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                创建活动
              </Button>
            </div>
          </div>
          
          {/* 右侧：教师选择 */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="p-6 border-b bg-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">选择参与教师</h3>
                  <p className="text-sm text-slate-500 mt-0.5">按年级和学科筛选教师</p>
                </div>
                {selectedTeachers.length > 0 && (
                  <Badge variant="secondary" className="px-3 py-1">
                    已选 {selectedTeachers.length} 人
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <TeacherSelector
                selectedIds={activityForm.participantIds}
                onChange={(ids, teachers) => {
                  setActivityForm({ ...activityForm, participantIds: ids });
                  setSelectedTeachers(teachers);
                }}
                defaultSubject={theme?.subject || 'all'}
                placeholder="选择参与本次活动的教师"
                teachers={allTeachers}
                loading={teachersLoading}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 活动详情对话框 */}
      {selectedActivity && (
        <ActivityDetailDialog
          activity={selectedActivity}
          themeId={themeId}
          themeType={theme.type}
          open={!!selectedActivity}
          onOpenChange={(open) => !open && setSelectedActivity(null)}
          onUpdate={loadTheme}
        />
      )}
    </div>
  );
}

// ==================== 子组件 ====================

function ActivityCard({ 
  activity, 
  themeType,
  onClick 
}: { 
  activity: ActivityWithDesigns;
  themeType: ThemeType;
  onClick: () => void;
  onUpdate: () => void;
}) {
  const typeConfig = THEME_TYPE_CONFIG[themeType];
  
  return (
    <div 
      className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 mb-1">{activity.title}</h4>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || activity.type}</span>
            {activity.location && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{activity.location}</span>
              </>
            )}
          </div>
        </div>
        <Badge variant="outline" className={
          activity.status === 'completed' 
            ? 'text-emerald-600 border-emerald-200' 
            : activity.status === 'in_progress'
            ? 'text-blue-600 border-blue-200'
            : 'text-slate-500'
        }>
          {ACTIVITY_STATUS_LABELS[activity.status as keyof typeof ACTIVITY_STATUS_LABELS] || activity.status}
        </Badge>
      </div>
      
      {activity.lessonDesigns && activity.lessonDesigns.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileText className="h-4 w-4" />
          <span>{activity.lessonDesigns.length} 份教学设计</span>
          {activity.lessonDesigns.slice(0, 2).map((d, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {d.teacherName}
            </Badge>
          ))}
          {activity.lessonDesigns.length > 2 && (
            <span className="text-xs">+{activity.lessonDesigns.length - 2}</span>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-sm">
        {activity.scheduledAt ? (
          <span className="text-slate-400">
            {new Date(activity.scheduledAt).toLocaleString('zh-CN', { 
              month: 'numeric', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        ) : (
          <span className="text-slate-400">时间待定</span>
        )}
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </div>
    </div>
  );
}

function ActivityDetailDialog({
  activity,
  themeId,
  themeType,
  open,
  onOpenChange,
  onUpdate,
}: {
  activity: ActivityWithDesigns;
  themeId: string;
  themeType: ThemeType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}) {
  const [addingDesign, setAddingDesign] = useState(false);
  const [designForm, setDesignForm] = useState({
    teacherName: '',
    title: '',
  });
  const [saving, setSaving] = useState(false);
  const [editingDesign, setEditingDesign] = useState<{
    id: string;
    title: string;
    teacherName: string;
    content: any;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const handleAddDesign = async () => {
    if (!designForm.teacherName.trim() || !designForm.title.trim()) {
      toast.error('请填写完整信息');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/research/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          themeId,
          teacherName: designForm.teacherName,
          title: designForm.title,
          designType: themeType,
          content: {}, // 初始内容为空
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success('教学设计添加成功');
        setAddingDesign(false);
        setDesignForm({ teacherName: '', title: '' });
        onUpdate();
      } else {
        toast.error(result.error || '添加失败');
      }
    } catch (err) {
      console.error('添加教学设计失败:', err);
      toast.error('添加失败');
    } finally {
      setSaving(false);
    }
  };
  
  const handleEditDesign = (design: { id: string; title: string; teacherName: string; content: any }) => {
    setEditingDesign(design);
    setEditorOpen(true);
  };
  
  const handleCreateAndEdit = async () => {
    if (!designForm.teacherName.trim() || !designForm.title.trim()) {
      toast.error('请填写完整信息');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/research/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          themeId,
          teacherName: designForm.teacherName,
          title: designForm.title,
          designType: themeType,
          content: {},
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        // 直接打开编辑器
        setEditingDesign({
          id: result.data.id,
          title: designForm.title,
          teacherName: designForm.teacherName,
          content: {},
        });
        setAddingDesign(false);
        setDesignForm({ teacherName: '', title: '' });
        setEditorOpen(true);
        onUpdate();
      } else {
        toast.error(result.error || '添加失败');
      }
    } catch (err) {
      console.error('添加教学设计失败:', err);
      toast.error('添加失败');
    } finally {
      setSaving(false);
    }
  };
  
  const typeConfig = THEME_TYPE_CONFIG[themeType];
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${typeConfig.gradient}`}>
              <Activity className="h-4 w-4 text-white" />
            </div>
            {activity.title}
          </DialogTitle>
          <DialogDescription>
            {ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS]}
            {activity.location && ` · ${activity.location}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 活动信息 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 bg-slate-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-slate-500 mb-1">活动时间</div>
                <div className="font-medium">
                  {activity.scheduledAt 
                    ? new Date(activity.scheduledAt).toLocaleString('zh-CN')
                    : '待定'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-slate-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-slate-500 mb-1">活动状态</div>
                <div className="font-medium">
                  {ACTIVITY_STATUS_LABELS[activity.status as keyof typeof ACTIVITY_STATUS_LABELS]}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-slate-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-slate-500 mb-1">教学设计</div>
                <div className="font-medium">{activity.lessonDesigns?.length || 0} 份</div>
              </CardContent>
            </Card>
          </div>
          
          {activity.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">活动描述</h4>
              <p className="text-slate-600">{activity.description}</p>
            </div>
          )}
          
          {/* 教学设计列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">教学设计</h4>
              <Button size="sm" variant="outline" onClick={() => setAddingDesign(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加设计
              </Button>
            </div>
            
            {addingDesign && (
              <Card className="border-dashed border-2 mb-3">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label className="text-xs">授课教师</Label>
                      <Input
                        value={designForm.teacherName}
                        onChange={(e) => setDesignForm({ ...designForm, teacherName: e.target.value })}
                        placeholder="教师姓名"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">设计标题</Label>
                      <Input
                        value={designForm.title}
                        onChange={(e) => setDesignForm({ ...designForm, title: e.target.value })}
                        placeholder="例如：第一课时"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateAndEdit} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      添加并编辑
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleAddDesign} disabled={saving}>
                      仅添加
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingDesign(false)}>
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activity.lessonDesigns && activity.lessonDesigns.length > 0 ? (
              <div className="space-y-2">
                {activity.lessonDesigns.map((design, idx) => (
                  <div 
                    key={design.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:bg-slate-50"
                    onClick={() => handleEditDesign({
                      id: design.id,
                      title: design.title,
                      teacherName: design.teacherName,
                      content: design.content,
                    })}
                  >
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <FileText className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{design.title}</div>
                      <div className="text-sm text-slate-500">{design.teacherName}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      handleEditDesign({
                        id: design.id,
                        title: design.title,
                        teacherName: design.teacherName,
                        content: design.content,
                      });
                    }}>
                      编辑
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>暂无教学设计</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* 教学设计编辑器 */}
    <LessonDesignEditor
      open={editorOpen}
      onOpenChange={setEditorOpen}
      themeId={themeId}
      themeType={themeType}
      activityId={activity.id}
      design={editingDesign || undefined}
      onSave={() => {
        setEditorOpen(false);
        setEditingDesign(null);
        onUpdate();
      }}
    />
  </>
  );
}
