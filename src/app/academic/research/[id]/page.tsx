'use client';

/**
 * 教研主题详情页面
 * 
 * 功能：
 * - 主题信息展示
 * - 教研阶段管理
 * - 教研活动记录
 * - 专项教研设计
 * - 教研成果沉淀
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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

const THEME_TYPE_CONFIG: Record<ThemeType, { label: string; icon: React.ElementType; color: string }> = {
  big_unit: { label: '大单元教学', icon: BookOpen, color: 'text-blue-600' },
  project: { label: '项目式教学', icon: Lightbulb, color: 'text-amber-600' },
  practice: { label: '学科实践', icon: FlaskConical, color: 'text-green-600' },
  ai_enabled: { label: 'AI赋能教学', icon: Cpu, color: 'text-purple-600' },
  custom: { label: '自定义主题', icon: Target, color: 'text-gray-600' },
};

const STATUS_CONFIG: Record<ThemeStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-600' },
  approved: { label: '已通过', color: 'bg-blue-100 text-blue-600' },
  in_progress: { label: '进行中', color: 'bg-green-100 text-green-600' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-600' },
  archived: { label: '已归档', color: 'bg-gray-100 text-gray-500' },
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
  
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => router.push('/academic/research')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回列表
      </Button>
      
      {/* 主题信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gray-50`}>
                <TypeIcon className={`h-8 w-8 ${typeConfig.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{theme.title}</h1>
                  <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <TypeIcon className="h-4 w-4" />
                    {theme.typeLabel}
                  </span>
                  <span>·</span>
                  <span>{theme.subject}</span>
                  <span>·</span>
                  <span>{theme.levelLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {theme.status === 'draft' && (
                <Button onClick={handleSubmit}>提交审核</Button>
              )}
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">主题描述</h3>
              <p className="text-gray-700">{theme.description || '暂无描述'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">教研目标</h3>
              <ul className="space-y-1">
                {theme.objectives?.map((obj, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {obj}
                  </li>
                ))}
                {(!theme.objectives || theme.objectives.length === 0) && (
                  <li className="text-sm text-gray-400">暂无目标</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">时间安排</h3>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4" />
                {theme.startDate || '未设定'} ~ {theme.endDate || '未设定'}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">完成进度</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{theme.statistics?.total_activities || 0}</div>
                <div className="text-xs text-gray-500">教研活动</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{theme.statistics?.completed_activities || 0}</div>
                <div className="text-xs text-gray-500">已完成</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{theme.participantIds?.length || 0}</div>
                <div className="text-xs text-gray-500">参与教师</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{theme.statistics?.achievements_count || 0}</div>
                <div className="text-xs text-gray-500">教研成果</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 详情标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">教研方案</TabsTrigger>
          <TabsTrigger value="activities">教研活动</TabsTrigger>
          <TabsTrigger value="special">专项教研</TabsTrigger>
          <TabsTrigger value="resources">教研资源</TabsTrigger>
          <TabsTrigger value="achievements">教研成果</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* 教研阶段 */}
          <Card>
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
                <p className="text-gray-400 text-center py-4">暂无教研阶段，点击"管理阶段"添加</p>
              ) : (
                <div className="space-y-3">
                  {theme.stages.map((stage, idx) => (
                    <div key={stage.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{stage.name}</h4>
                        {stage.description && (
                          <p className="text-sm text-gray-500">{stage.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {stage.status === 'completed' ? '已完成' : stage.status === 'in_progress' ? '进行中' : '待开始'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="mt-4">
          <Card>
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
                <p className="text-gray-400 text-center py-4">暂无教研活动，点击"新建活动"开始</p>
              ) : (
                <div className="space-y-3">
                  {theme.activities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-500">
                          {ACTIVITY_TYPE_LABELS[activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || activity.type}
                          {activity.location && ` · ${activity.location}`}
                        </p>
                      </div>
                      {activity.scheduledAt && (
                        <span className="text-sm text-gray-500">
                          {new Date(activity.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant="outline">
                        {activity.status === 'completed' ? '已完成' : activity.status === 'in_progress' ? '进行中' : '待进行'}
                      </Badge>
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
        
        <TabsContent value="special" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{typeConfig.label}设计</CardTitle>
              <CardDescription>专项教研设计内容</CardDescription>
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
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">自定义主题可自由记录教研内容</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-4">
          <ResourceManager subject={theme.subject} />
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-4">
          <AchievementManager themeId={themeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
