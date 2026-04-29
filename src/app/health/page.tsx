'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type { HealthStatsOverview } from '@/types/health-management';
import { GradeClassFilter, useClassesData } from '@/components/health/HealthFilters';
import { LazyChart } from '@/components/health/HealthPerformance';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Heart,
  Users,
  FileCheck,
  Apple,
  Stethoscope,
  Pill,
  BarChart3,
  ChevronRight,
  Sparkles,
  Shield,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
  border: string;
};

function StatCard({ icon, label, value, sub, color, bg, border }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${border} bg-card p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-lg ${bg} p-2.5`}>{icon}</div>
      </div>
    </div>
  );
}

type DistributionBarProps = {
  items: { label: string; count: number; color: string }[];
  title: string;
};

function DistributionBar({ items, title }: DistributionBarProps) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex h-6 overflow-hidden rounded-full bg-muted">
        {items.map((item) => (
          <div
            key={item.label}
            className={`transition-all duration-500 ${item.color}`}
            style={{ width: `${(item.count / total) * 100}%` }}
            title={`${item.label}: ${item.count}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type QuickActionProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  badge?: string;
  color: string;
};

function QuickAction({ icon, title, description, href, badge, color }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className={`rounded-lg ${color} p-3 text-white`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground">{title}</h4>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function HealthDashboardPage() {
  const [stats, setStats] = useState<HealthStatsOverview | null>(null);
  const [_loading, setLoading] = useState(true);

  // 年级班级筛选
  const [grade, setGrade] = useState('all');
  const [classId, setClassId] = useState('all');
  const { gradeOptions, classesByGrade, loading: classesLoading } = useClassesData();

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId && classId !== 'all') params.set('classId', classId);
      if (grade && grade !== 'all') params.set('grade', grade);

      const res = await apiClient.get<HealthStatsOverview>(
        `/health/stats?${params.toString()}`
      );
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('[HealthDashboard] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [grade, classId]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-3 text-white shadow-lg shadow-teal-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">学生体育健康管理</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                体质监测 · 运动记录 · 健康档案 · AI智能处方
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI赋能
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* 筛选栏 */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">数据范围</span>
          <GradeClassFilter
            grade={grade}
            onGradeChange={setGrade}
            classId={classId}
            onClassChange={setClassId}
            gradeOptions={gradeOptions}
            classOptions={classesByGrade}
            loading={classesLoading}
          />
          <span className="ml-auto text-xs text-muted-foreground">
            {grade !== 'all' || classId !== 'all' ? '已筛选' : '全校数据'}
          </span>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-teal-600" />}
            label="已建档学生"
            value={stats?.profiledStudents ?? '-'}
            sub={stats?.totalStudents ? `共 ${stats.totalStudents} 名学生` : ''}
            color="text-teal-700"
            bg="bg-teal-50"
            border="border-teal-100"
          />
          <StatCard
            icon={<Heart className="h-5 w-5 text-rose-600" />}
            label="健康关注"
            value={stats?.attentionCount ?? '-'}
            sub={stats?.warningCount ? `其中预警 ${stats.warningCount} 人` : ''}
            color="text-rose-700"
            bg="bg-rose-50"
            border="border-rose-100"
          />
          <StatCard
            icon={<FileCheck className="h-5 w-5 text-emerald-600" />}
            label="优秀/良好"
            value={`${stats?.excellentCount ?? 0}/${stats?.goodCount ?? 0}`}
            sub="体质综合评价"
            color="text-emerald-700"
            bg="bg-emerald-50"
            border="border-emerald-100"
          />
          <StatCard
            icon={<Pill className="h-5 w-5 text-amber-600" />}
            label="生效处方"
            value={stats?.prescriptionActiveCount ?? '-'}
            sub="AI膳食+运动处方"
            color="text-amber-700"
            bg="bg-amber-50"
            border="border-amber-100"
          />
        </div>

        {/* 分布图 + 快捷入口 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* 体质等级分布 */}
          <LazyChart height={140}>
            <DistributionBar
              title="体质等级分布"
              items={[
                { label: '优秀', count: stats?.fitnessDistribution?.[0]?.count ?? 0, color: 'bg-emerald-500' },
                { label: '良好', count: stats?.fitnessDistribution?.[1]?.count ?? 0, color: 'bg-teal-400' },
                { label: '及格', count: stats?.fitnessDistribution?.[2]?.count ?? 0, color: 'bg-amber-400' },
                { label: '不及格', count: stats?.fitnessDistribution?.[3]?.count ?? 0, color: 'bg-rose-400' },
              ]}
            />
          </LazyChart>

          {/* BMI 分布 */}
          <LazyChart height={140}>
            <DistributionBar
              title="BMI 体型分布"
              items={[
                { label: '偏瘦', count: stats?.bmiDistribution?.[0]?.count ?? 0, color: 'bg-sky-400' },
                { label: '正常', count: stats?.bmiDistribution?.[1]?.count ?? 0, color: 'bg-emerald-500' },
                { label: '偏胖', count: stats?.bmiDistribution?.[2]?.count ?? 0, color: 'bg-amber-400' },
                { label: '肥胖', count: stats?.bmiDistribution?.[3]?.count ?? 0, color: 'bg-rose-400' },
              ]}
            />
          </LazyChart>
        </div>

        {/* 快捷入口 */}
        <div className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">快捷操作</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={<Stethoscope className="h-5 w-5" />}
              title="体质数据"
              description="导入体质测评与体检数据"
              href="/health/fitness"
              color="bg-gradient-to-br from-teal-500 to-teal-600"
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              title="健康画像"
              description="学生综合健康画像与AI分析"
              href="/health/portraits"
              badge="AI"
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <QuickAction
              icon={<Pill className="h-5 w-5" />}
              title="健康处方"
              description="膳食建议与运动处方"
              href="/health/prescriptions"
              badge="AI"
              color="bg-gradient-to-br from-amber-500 to-amber-600"
            />
            <QuickAction
              icon={<Apple className="h-5 w-5" />}
              title="家长观察"
              description="查看家长每日观察数据"
              href="/health/observations"
              color="bg-gradient-to-br from-rose-400 to-rose-500"
            />
            <QuickAction
              icon={<Eye className="h-5 w-5" />}
              title="体检管理"
              description="学生体检数据管理"
              href="/health/checkup"
              color="bg-gradient-to-br from-sky-500 to-sky-600"
            />
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              title="周期报告"
              description="周/月/学期健康报告"
              href="/health/reports"
              badge="AI"
              color="bg-gradient-to-br from-violet-500 to-violet-600"
            />
            <QuickAction
              icon={<Shield className="h-5 w-5" />}
              title="健康档案"
              description="学生健康档案与过敏史"
              href="/health/portraits"
              color="bg-gradient-to-br from-slate-500 to-slate-600"
            />
            <QuickAction
              icon={<AlertTriangle className="h-5 w-5" />}
              title="预警学生"
              description="健康预警与重点关注"
              href="/health/portraits?status=warning"
              color="bg-gradient-to-br from-red-500 to-red-600"
            />
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">AI赋能说明</p>
              <p className="mt-1">
                健康画像与处方由AI基于体质数据、家长观察、运动打卡等多数据源综合生成，
                仅供参考。建议结合校医和体育老师专业判断，为学生提供更精准的健康指导。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
