'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare, Shield, Key } from 'lucide-react';
import { useMentalStats, useWarnings } from '@/hooks/useMentalHealth';

const severityConfig: Record<string, { label: string; variant: 'destructive' | 'outline' | 'secondary' }> = {
  red: { label: '红色预警', variant: 'destructive' },
  yellow: { label: '黄色预警', variant: 'outline' },
};

export default function MentalHealthPage() {
  const { stats, loading: statsLoading, fetchStats } = useMentalStats();
  const { warnings, loading: warningsLoading, fetchWarnings, markAsRead, handleWarning } = useWarnings();

  useEffect(() => {
    fetchStats();
    fetchWarnings({ isHandled: false });
  }, [fetchStats, fetchWarnings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">学生心理健康管理</h1>
        <p className="text-muted-foreground mt-1">监控学生心理状态，管理预警信息和授权密钥</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃会话</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '-' : stats?.activeSessions ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              今日新增 {stats?.todaySessions ?? 0} 个对话
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未读预警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '-' : stats?.unreadWarnings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              共 {stats?.totalWarnings ?? 0} 条预警
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">红色预警</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsLoading ? '-' : stats?.redWarnings ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              需要立即处理
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总对话数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '-' : stats?.totalSessions ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              累计心理咨询对话
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 预警列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            待处理预警
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warningsLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : warnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无待处理预警</div>
          ) : (
            <div className="space-y-3">
              {warnings.map((w) => (
                <div
                  key={w.id}
                  className={`flex items-start justify-between p-4 rounded-lg border ${!w.isRead ? 'bg-muted/50 border-primary/30' : 'bg-card'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={severityConfig[w.severity]?.variant ?? 'outline'}>
                        {severityConfig[w.severity]?.label ?? w.severity}
                      </Badge>
                      <span className="text-sm font-medium">{w.title}</span>
                      {!w.isRead && (
                        <Badge variant="secondary" className="text-xs">未读</Badge>
                      )}
                    </div>
                    {w.description && (
                      <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                    )}
                    {w.keywords && w.keywords.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {w.keywords.map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(w.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!w.isRead && (
                      <button
                        onClick={() => markAsRead(w.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        标记已读
                      </button>
                    )}
                    {!w.isHandled && (
                      <button
                        onClick={() => handleWarning(w.id, '已处理')}
                        className="text-sm text-primary hover:underline"
                      >
                        处理
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
