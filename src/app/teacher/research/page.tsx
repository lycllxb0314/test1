'use client';

/**
 * 教师空间 - 教研活动页面
 * 
 * 功能：
 * - 显示我参与的教研活动
 * - 查看教研主题和活动详情
 * - 进入资源库查看/上传资源
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  Cpu,
  Target,
  Calendar,
  Users,
  FolderOpen,
  ChevronRight,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

interface ResearchActivity {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  description?: string;
  location?: string;
  scheduledAt?: string;
  status: string;
  statusLabel: string;
  themeId: string;
  themeTitle: string;
  themeType: string;
  themeTypeLabel: string;
  subject: string;
  participants: Array<{ id: string; name: string; subject: string }>;
  resourceCount: number;
  createdAt: string;
}

interface ResearchTheme {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  subject: string;
  status: string;
  statusLabel: string;
  activityCount: number;
  resourceCount: number;
  activities: ResearchActivity[];
}

// ==================== 配置 ====================

const THEME_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string }> = {
  big_unit: { label: '大单元教学', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
  project: { label: '项目式教学', icon: Lightbulb, gradient: 'from-amber-500 to-orange-500' },
  practice: { label: '学科实践', icon: FlaskConical, gradient: 'from-emerald-500 to-teal-500' },
  ai_enabled: { label: 'AI赋能教学', icon: Cpu, gradient: 'from-violet-500 to-purple-500' },
  custom: { label: '自定义主题', icon: Target, gradient: 'from-slate-500 to-gray-500' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: '已安排', color: 'text-blue-600 bg-blue-50' },
  in_progress: { label: '进行中', color: 'text-green-600 bg-green-50' },
  completed: { label: '已完成', color: 'text-emerald-600 bg-emerald-50' },
  cancelled: { label: '已取消', color: 'text-gray-600 bg-gray-50' },
};

// ==================== 组件 ====================

export default function TeacherResearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [themes, setThemes] = useState<ResearchTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    loadMyResearch();
  }, [user?.id]);
  
  const loadMyResearch = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/research?teacherId=${user.id}`);
      const data = await res.json();
      
      if (data.success) {
        setThemes(data.data || []);
      }
    } catch (err) {
      console.error('加载教研数据失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 进入活动详情
  const handleEnterActivity = (activity: ResearchActivity) => {
    router.push(`/teacher/research/${activity.id}`);
  };
  
  // 统计
  const stats = {
    totalThemes: themes.length,
    totalActivities: themes.reduce((sum, t) => sum + t.activityCount, 0),
    inProgress: themes.reduce((sum, t) => 
      sum + t.activities.filter(a => a.status === 'in_progress').length, 0),
    completed: themes.reduce((sum, t) => 
      sum + t.activities.filter(a => a.status === 'completed').length, 0),
  };
  
  // 筛选后的主题
  const filteredThemes = themes.filter(theme => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_progress') {
      return theme.activities.some(a => a.status === 'in_progress');
    }
    if (activeTab === 'completed') {
      return theme.activities.some(a => a.status === 'completed');
    }
    return true;
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                教研活动
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              查看我参与的教研活动 · 访问资源库
            </p>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalThemes}</div>
              <div className="text-sm text-slate-500">参与主题</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-purple-600">{stats.totalActivities}</div>
              <div className="text-sm text-slate-500">教研活动</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-green-600">{stats.inProgress}</div>
              <div className="text-sm text-slate-500">进行中</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
              <div className="text-sm text-slate-500">已完成</div>
            </CardContent>
          </Card>
        </div>
        
        {/* 活动列表 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="in_progress">进行中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                  <p className="text-slate-500 mt-4">加载中...</p>
                </CardContent>
              </Card>
            ) : filteredThemes.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">暂无参与的教研活动</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredThemes.map(theme => {
                  const typeConfig = THEME_TYPE_CONFIG[theme.type] || THEME_TYPE_CONFIG.custom;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <Card key={theme.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                      <div className={cn('h-1.5 bg-gradient-to-r', typeConfig.gradient)} />
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg bg-gradient-to-br text-white', typeConfig.gradient)}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{theme.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <span>{typeConfig.label}</span>
                                <span className="text-slate-300">·</span>
                                <span>{theme.subject}</span>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <FolderOpen className="h-3 w-3 mr-1" />
                              {theme.resourceCount} 资源
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {theme.activityCount} 活动
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {theme.activities.map(activity => {
                            const statusConfig = STATUS_CONFIG[activity.status] || STATUS_CONFIG.scheduled;
                            
                            return (
                              <div
                                key={activity.id}
                                onClick={() => handleEnterActivity(activity)}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-indigo-100">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-900">{activity.title}</div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                      <span>{activity.typeLabel}</span>
                                      {activity.location && (
                                        <>
                                          <span className="text-slate-300">·</span>
                                          <span>{activity.location}</span>
                                        </>
                                      )}
                                      {activity.scheduledAt && (
                                        <>
                                          <span className="text-slate-300">·</span>
                                          <span>{new Date(activity.scheduledAt).toLocaleDateString()}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <Badge className={cn('text-xs', statusConfig.color)}>
                                    {statusConfig.label}
                                  </Badge>
                                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
