/**
 * 门禁统计面板组件
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useAccessStatistics } from '@/hooks/useAccessControl';
import { Users, LogIn, LogOut, ClipboardList, UserCheck, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export function AccessStatsPanel() {
  const { data, loading } = useAccessStatistics();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-14 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const inSchool = Math.max(data.todayIn - data.todayOut, 0);

  const cards = [
    { label: '已注册人员', value: data.totalPersons, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: '今日通行', value: data.todayRecords, icon: LogIn, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
    { label: '待审批申请', value: data.pendingApplications, icon: ClipboardList, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
    { label: '今日访客', value: data.activeVisitors, icon: UserCheck, iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 今日实时状态条 */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground font-medium">今日实时</span>
            <div className="flex items-center gap-1.5">
              <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">进入</span>
              <span className="font-bold text-emerald-600">{data.todayIn}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">离开</span>
              <span className="font-bold text-orange-500">{data.todayOut}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">在校</span>
              <span className="font-bold text-primary">{inSchool}</span>
            </div>
            {data.personTypeDistribution.length > 0 && (
              <div className="ml-auto flex items-center gap-3">
                {data.personTypeDistribution.map((item) => {
                  const labels: Record<string, string> = { teacher: '教师', student: '学生', parent: '家长', visitor: '访客' };
                  const colors: Record<string, string> = { teacher: 'bg-primary', student: 'bg-emerald-500', parent: 'bg-amber-500', visitor: 'bg-violet-500' };
                  return (
                    <div key={item.type} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${colors[item.type] || 'bg-muted'}`} />
                      <span className="text-muted-foreground">{labels[item.type] || item.type}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
