/**
 * 门禁统计面板组件
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useAccessStatistics } from '@/hooks/useAccessControl';
import { Users, LogIn, LogOut, ClipboardList, AlertCircle, UserCheck } from 'lucide-react';

const statCards = [
  { key: 'totalPersons', label: '已注册人员', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'todayRecords', label: '今日通行', icon: LogIn, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'pendingApplications', label: '待审批申请', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'activeVisitors', label: '今日访客', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
] as const;

export function AccessStatsPanel() {
  const { data, loading } = useAccessStatistics();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.key} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const values: Record<string, number> = {
    totalPersons: data?.totalPersons || 0,
    todayRecords: data?.todayRecords || 0,
    pendingApplications: data?.pendingApplications || 0,
    activeVisitors: data?.activeVisitors || 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold">{values[card.key]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 今日进出 + 人员分布 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">今日通行统计</h4>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-green-600" />
                  <span className="text-sm">进入</span>
                  <span className="text-lg font-bold text-green-600">{data.todayIn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">离开</span>
                  <span className="text-lg font-bold text-orange-600">{data.todayOut}</span>
                </div>
                {data.todayIn - data.todayOut > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">在校</span>
                    <span className="text-lg font-bold text-blue-600">{data.todayIn - data.todayOut}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">人员类型分布</h4>
              <div className="flex gap-4 flex-wrap">
                {data.personTypeDistribution.map((item) => {
                  const labels: Record<string, string> = { teacher: '教师', student: '学生', parent: '家长', visitor: '访客' };
                  const colors: Record<string, string> = { teacher: 'bg-blue-500', student: 'bg-green-500', parent: 'bg-amber-500', visitor: 'bg-purple-500' };
                  return (
                    <div key={item.type} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[item.type] || 'bg-gray-400'}`} />
                      <span className="text-sm">{labels[item.type] || item.type}</span>
                      <span className="text-sm font-bold">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
