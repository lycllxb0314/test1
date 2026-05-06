'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  MessageSquare, 
  Shield, 
  TrendingUp,
  Heart,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useMentalStats, useWarnings } from '@/hooks/useMentalHealth';
import Link from 'next/link';

const severityConfig: Record<string, { 
  label: string; 
  bgColor: string; 
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  red: { 
    label: '红色预警', 
    bgColor: 'bg-destructive/10', 
    textColor: 'text-destructive',
    borderColor: 'border-destructive/30',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  yellow: { 
    label: '黄色预警', 
    bgColor: 'bg-amber-500/10', 
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/30',
    icon: <Clock className="h-4 w-4" />
  },
};

export default function MentalHealthPage() {
  const { stats, loading: statsLoading, fetchStats } = useMentalStats();
  const { warnings, loading: warningsLoading, fetchWarnings, markAsRead, handleWarning } = useWarnings();

  useEffect(() => {
    fetchStats();
    fetchWarnings({ isHandled: false });
  }, [fetchStats, fetchWarnings]);

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-teal-50/50 dark:from-primary/10 dark:via-background dark:to-teal-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative px-6 py-10 sm:px-8 sm:py-14">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">学生心理健康管理</h1>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
              关注每一位学生的心理状态，用温暖守护成长，让每一颗心灵都能得到呵护
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-7xl mx-auto space-y-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 活跃会话 */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-card to-teal-50/30 dark:to-teal-950/20">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">活跃会话</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {statsLoading ? '—' : stats?.activeSessions ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">个</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    今日新增 <span className="text-primary font-medium">{stats?.todaySessions ?? 0}</span> 个对话
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>

          {/* 未读预警 */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-card to-amber-50/30 dark:to-amber-950/20">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">未读预警</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {statsLoading ? '—' : stats?.unreadWarnings ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">条</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    共 <span className="text-amber-600 font-medium">{stats?.totalWarnings ?? 0}</span> 条预警
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/15 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/40 via-amber-500 to-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>

          {/* 红色预警 */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-card to-destructive/5 dark:to-destructive/10">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">红色预警</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold text-destructive">
                      {statsLoading ? '—' : stats?.redWarnings ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">条</span>
                  </div>
                  <p className="text-xs text-destructive/80 font-medium">
                    需要立即处理
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10 group-hover:bg-destructive/15 transition-colors">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/40 via-destructive to-destructive/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>

          {/* 总对话数 */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-card to-primary/5 dark:to-primary/10">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">累计对话</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">
                      {statsLoading ? '—' : stats?.totalSessions ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">次</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    心理咨询累计服务
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/mental-health/warnings" className="group">
            <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-card to-amber-50/30 dark:to-amber-950/10 cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">预警管理</h3>
                    <p className="text-sm text-muted-foreground">查看和处理预警信息</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/mental-health/auth-keys" className="group">
            <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-card to-primary/5 dark:to-primary/10 cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">授权密钥</h3>
                    <p className="text-sm text-muted-foreground">管理班主任访问授权</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/mental-health" className="group">
            <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-card to-teal-50/30 dark:to-teal-950/10 cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-teal-500/10">
                    <Heart className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">班主任视角</h3>
                    <p className="text-sm text-muted-foreground">查看本班学生心理状态</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 预警列表 */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50/50 to-background dark:from-amber-950/20 dark:to-background px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">待处理预警</h2>
                  <p className="text-sm text-muted-foreground">需要关注的预警信息</p>
                </div>
              </div>
              {warnings.length > 0 && (
                <Link href="/mental-health/warnings">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    查看全部 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          <CardContent className="p-6">
            {warningsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : warnings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">暂无待处理预警</p>
                <p className="text-sm text-muted-foreground/60">学生心理状态良好</p>
              </div>
            ) : (
              <div className="space-y-3">
                {warnings.slice(0, 5).map((w, index) => {
                  const config = severityConfig[w.severity] || severityConfig.yellow;
                  return (
                    <div
                      key={w.id}
                      className={`group relative p-4 rounded-xl border ${config.borderColor} ${config.bgColor} hover:shadow-sm transition-all duration-200`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`${config.bgColor} ${config.textColor} border-current`}
                            >
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                            <span className="font-medium text-foreground">{w.title}</span>
                            {!w.isRead && (
                              <Badge variant="secondary" className="text-xs animate-pulse">
                                未读
                              </Badge>
                            )}
                          </div>
                          
                          {w.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {w.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(w.createdAt).toLocaleString('zh-CN')}
                            </span>
                            {w.keywords && w.keywords.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {w.keywords.slice(0, 3).map((kw, i) => (
                                  <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          {!w.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(w.id)}
                              className="text-xs hover:bg-background/80"
                            >
                              标记已读
                            </Button>
                          )}
                          {!w.isHandled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWarning(w.id, '已处理')}
                              className="text-xs"
                            >
                              处理
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
