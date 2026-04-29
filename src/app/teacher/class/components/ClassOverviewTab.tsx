'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, AlertCircle, BarChart3, Calendar, Award,
  TrendingUp, TrendingDown, Loader2, ChevronRight,
  MessageCircle, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalStudents: number;
  presentCount: number;
  leaveCount: number;
  maleCount: number;
  femaleCount: number;
}

interface CategoryScoreItem {
  category: string;
  score: number;
  maxScore: number;
}

interface RoutineData {
  today: string;
  loading: boolean;
  totalScore: number;
  maxTotalScore: number;
  scoreRate: number;
  categoryScores: CategoryScoreItem[];
  weeklyEvaluation: { level: string; [key: string]: unknown } | null;
}

interface Props {
  stats: Stats;
  routine: RoutineData;
  onSwitchTab: (tab: string) => void;
}

const ROUTINE_CATEGORY_LABELS: Record<string, string> = {
  hygiene: '卫生',
  discipline: '纪律',
  etiquette: '礼仪',
  safety: '安全',
  activity: '活动',
};

export function ClassOverviewTab({ stats, routine, onSwitchTab }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="学生总数" value={stats.totalStudents} icon={<Users className="h-5 w-5 text-blue-600" />} bg="bg-blue-100" />
        <StatCard title="在校人数" value={stats.presentCount} icon={<UserCheck className="h-5 w-5 text-green-600" />} bg="bg-green-100" color="text-green-600" />
        <StatCard title="请假人数" value={stats.leaveCount} icon={<AlertCircle className="h-5 w-5 text-yellow-600" />} bg="bg-yellow-100" color="text-yellow-600" />
        <StatCard title="男女比例" value={`${stats.maleCount}:${stats.femaleCount}`} icon={<Users className="h-5 w-5 text-purple-600" />} bg="bg-purple-100" color="text-purple-600" />
      </div>

      {/* 常规评比卡片 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                班级常规评比
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3.5 w-3.5" /> 今日评分 ({routine.today})
              </CardDescription>
            </div>
            {routine.weeklyEvaluation && (
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">本周评比：{routine.weeklyEvaluation.level}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {routine.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground">今日总评分</p>
                  <p className="text-2xl font-bold text-primary">{routine.totalScore.toFixed(1)} / {routine.maxTotalScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">得分率</p>
                  <div className="flex items-center gap-2">
                    {routine.scoreRate >= 90 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-orange-600" />}
                    <span className={`text-2xl font-bold ${routine.scoreRate >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                      {routine.scoreRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {routine.categoryScores.map((item) => (
                  <div key={item.category} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">{ROUTINE_CATEGORY_LABELS[item.category] || item.category}</p>
                    <p className="text-lg font-bold">{item.score}<span className="text-sm text-muted-foreground">/{item.maxScore}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快捷操作 */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-lg">快捷操作</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <QuickActionButton icon={<Users className="text-blue-500" />} label="学生管理" onClick={() => onSwitchTab('students')} />
            <QuickActionButton icon={<Users className="text-green-500" />} label="家长通讯" onClick={() => onSwitchTab('parents')} />
            <QuickActionButton icon={<Star className="text-amber-500" />} label="习惯养成" onClick={() => router.push('/teacher/habit')} />
            <QuickActionButton icon={<MessageCircle className="text-purple-500" />} label="家校沟通" onClick={() => router.push('/teacher/communication')} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, bg, color = 'text-gray-900' }: { title: string; value: string | number; icon: React.ReactNode; bg: string; color?: string }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="w-12 h-12 rounded-full bg-muted/80 flex items-center justify-center">{icon}</div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </button>
  );
}
