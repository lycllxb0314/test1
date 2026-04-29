'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import {
  Apple,
  Calendar,
  Moon,
  Utensils,
  Sun,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

type ObservationRecord = {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  className: string;
  parentId: string;
  observationDate: string;
  sleepQuality: string;
  sleepQualityLabel: string;
  dietQuality: string;
  dietQualityLabel: string;
  energyLevel: string;
  energyLevelLabel: string;
  note: string | null;
  createdAt: string;
};

type ObservationStats = {
  totalRecords: number;
  sleepDist: Record<string, number>;
  dietDist: Record<string, number>;
  energyDist: Record<string, number>;
};

const SLEEP_STYLES: Record<string, { label: string; color: string }> = {
  sufficient: { label: '充足', color: 'bg-emerald-50 text-emerald-700' },
  normal: { label: '一般', color: 'bg-amber-50 text-amber-700' },
  insufficient: { label: '不足', color: 'bg-rose-50 text-rose-700' },
};

const DIET_STYLES: Record<string, { label: string; color: string }> = {
  balanced: { label: '均衡', color: 'bg-emerald-50 text-emerald-700' },
  normal: { label: '一般', color: 'bg-amber-50 text-amber-700' },
  overeating: { label: '暴食', color: 'bg-rose-50 text-rose-700' },
};

const ENERGY_STYLES: Record<string, { label: string; color: string }> = {
  energetic: { label: '充沛', color: 'bg-emerald-50 text-emerald-700' },
  normal: { label: '正常', color: 'bg-amber-50 text-amber-700' },
  tired: { label: '疲惫', color: 'bg-rose-50 text-rose-700' },
};

function distPercent(dist: Record<string, number>, key: string): number {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  return total ? Math.round(((dist[key] || 0) / total) * 100) : 0;
}

export default function ObservationsPage() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [records, setRecords] = useState<ObservationRecord[]>([]);
  const [stats, setStats] = useState<ObservationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ObservationRecord[]>(
        `/health/observations?mode=admin&startDate=${startDate}&endDate=${endDate}&page=${page}&pageSize=${pageSize}`
      );
      if (res.success && res.data) {
        setRecords(res.data);
        setTotal(res.pagination?.total || 0);
        const rawStats = (res as unknown as { statistics?: ObservationStats }).statistics;
        setStats(rawStats || null);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [startDate, endDate]);

  const filtered = searchQuery
    ? records.filter(r => r.studentName.includes(searchQuery) || r.studentNo.includes(searchQuery) || r.className.includes(searchQuery))
    : records;

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 p-2.5 text-white">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">家长观察数据</h1>
              <p className="text-xs text-muted-foreground">家长每日提交的睡眠、饮食、精神状态观察</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-5 space-y-5">
        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> 时间范围
          </div>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <span className="text-muted-foreground">至</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />

          <div className="relative ml-auto w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索姓名/学号/班级..."
              className="pl-9 h-9 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && stats.totalRecords > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* 睡眠统计 */}
            <DistCard
              icon={<Moon className="h-5 w-5" />}
              title="睡眠质量"
              total={stats.totalRecords}
              dist={stats.sleepDist}
              styles={SLEEP_STYLES}
              gradient="from-indigo-500 to-blue-500"
            />
            {/* 饮食统计 */}
            <DistCard
              icon={<Utensils className="h-5 w-5" />}
              title="饮食状况"
              total={stats.totalRecords}
              dist={stats.dietDist}
              styles={DIET_STYLES}
              gradient="from-emerald-500 to-teal-500"
            />
            {/* 精神统计 */}
            <DistCard
              icon={<Sun className="h-5 w-5" />}
              title="精神状态"
              total={stats.totalRecords}
              dist={stats.energyDist}
              styles={ENERGY_STYLES}
              gradient="from-amber-500 to-orange-500"
            />
          </div>
        )}

        {/* 数据表格 */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              加载中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Apple className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p>暂无家长观察数据</p>
              <p className="mt-1 text-xs text-muted-foreground/60">家长通过家长端提交每日观察，管理端可查看数据汇总</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">姓名</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">学号</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">班级</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">观察日期</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">睡眠</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">饮食</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">精神</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {row.studentName}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.studentNo}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.className}</td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">{row.observationDate}</td>
                      <td className="px-4 py-2.5 text-center">
                        <QualityBadge quality={row.sleepQuality} styles={SLEEP_STYLES} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <QualityBadge quality={row.dietQuality} styles={DIET_STYLES} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <QualityBadge quality={row.energyLevel} styles={ENERGY_STYLES} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="rounded-md border border-border px-2 py-1 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm text-muted-foreground">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="rounded-md border border-border px-2 py-1 text-sm disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 质量徽章 ====================

function QualityBadge({ quality, styles }: { quality: string; styles: Record<string, { label: string; color: string }> }) {
  const s = styles[quality];
  if (!s) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

// ==================== 分布统计卡片 ====================

function DistCard({ icon, title, total, dist, styles, gradient }: {
  icon: React.ReactNode;
  title: string;
  total: number;
  dist: Record<string, number>;
  styles: Record<string, { label: string; color: string }>;
  gradient: string;
}) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`rounded-lg bg-gradient-to-br ${gradient} p-1.5 text-white`}>{icon}</div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">共 {total} 条</span>
      </div>
      <div className="space-y-2">
        {entries.map(([key, count]) => {
          const pct = distPercent(dist, key);
          const s = styles[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-12 text-xs text-muted-foreground">{s?.label || key}</span>
              <div className="flex-1 h-4 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: key === entries[0]?.[0]
                      ? 'linear-gradient(to right, var(--color-primary), var(--color-primary-soft, #94a3b8))'
                      : 'var(--color-muted-foreground, #94a3b8)',
                    opacity: key === entries[0]?.[0] ? 0.8 : 0.4,
                  }}
                />
              </div>
              <span className="w-16 text-right text-xs text-muted-foreground">{count}次 ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
