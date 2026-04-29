'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/services/api-client';
import { GradeClassFilter, PaginationControl, useClassesData } from '@/components/health/HealthFilters';
import { LazyChart } from '@/components/health/HealthPerformance';
import {
  Dumbbell,
  Calendar,
  Clock,
  Flame,
  TrendingUp,
  Search,
  X,
  Zap,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

type ExerciseRecord = {
  id: string;
  studentId: string;
  studentName: string;
  studentNo: string;
  className: string;
  checkDate: string;
  status: string;
  description: string | null;
  exerciseType: string;
  durationMin: number | null;
  intensity: string | null;
  createdAt: string;
};

type ExerciseStats = {
  totalRecords: number;
  totalDurationMin: number;
  exerciseTypes: Record<string, number>;
  intensityDist: Record<string, number>;
};

const INTENSITY_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-emerald-50 text-emerald-700' },
  medium: { label: '中', color: 'bg-amber-50 text-amber-700' },
  high: { label: '高', color: 'bg-rose-50 text-rose-700' },
};

export default function ExercisePage() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 年级班级筛选
  const [grade, setGrade] = useState('all');
  const [classId, setClassId] = useState('all');
  const { gradeOptions, classesByGrade, loading: classesLoading } = useClassesData();

  // 分页
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate, endDate,
        page: String(page), pageSize: String(pageSize),
      });
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.get<ExerciseRecord[]>(
        `/health/exercise?${params.toString()}`
      );
      if (res.success && res.data) {
        setRecords(res.data);
        setTotal(res.pagination?.total || 0);
        const rawStats = (res as unknown as { statistics?: ExerciseStats }).statistics;
        setStats(rawStats || null);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page, pageSize, classId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [startDate, endDate, grade, classId]);

  const filtered = useMemo(
    () => searchQuery
      ? records.filter(r => r.studentName.includes(searchQuery) || r.studentNo.includes(searchQuery) || r.className.includes(searchQuery))
      : records,
    [records, searchQuery]
  );

  const topExercise = stats?.exerciseTypes
    ? Object.entries(stats.exerciseTypes).sort((a, b) => b[1] - a[1])[0]
    : null;
  const avgDuration = stats?.totalRecords ? Math.round(stats.totalDurationMin / stats.totalRecords) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 text-white">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">锻炼打卡</h1>
              <p className="text-xs text-muted-foreground">学生日常锻炼打卡数据，来自习惯养成模块</p>
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

          <div className="h-6 w-px bg-border" />

          <GradeClassFilter
            grade={grade}
            onGradeChange={setGrade}
            classId={classId}
            onClassChange={setClassId}
            gradeOptions={gradeOptions}
            classOptions={classesByGrade}
            loading={classesLoading}
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={<Calendar className="h-5 w-5" />} label="打卡总次数" value={stats.totalRecords} unit="次" gradient="from-teal-500 to-emerald-500" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="累计运动时长" value={stats.totalDurationMin} unit="分钟" gradient="from-blue-500 to-cyan-500" />
            <StatCard icon={<Flame className="h-5 w-5" />} label="平均每次时长" value={avgDuration} unit="分钟" gradient="from-orange-500 to-amber-500" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="最热门运动" value={topExercise ? topExercise[0] : '-'} unit={topExercise ? `${topExercise[1]}次` : ''} gradient="from-rose-500 to-pink-500" isText />
          </div>
        )}

        {/* 运动类型分布条 */}
        {stats && Object.keys(stats.exerciseTypes).length > 0 && (
          <LazyChart height={200}>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">运动类型分布</h3>
            <div className="space-y-2">
              {Object.entries(stats.exerciseTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([type, count]) => {
                  const pct = Math.round((count / stats.totalRecords) * 100);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-muted-foreground truncate">{type}</span>
                      <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs text-muted-foreground">{count}次 ({pct}%)</span>
                    </div>
                  );
                })}
            </div>
            </div>
          </LazyChart>
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
              <Dumbbell className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p>暂无锻炼打卡数据</p>
              <p className="mt-1 text-xs text-muted-foreground/60">数据来自习惯养成模块的锻炼打卡记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">姓名</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">学号</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">班级</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">打卡日期</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">运动类型</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">时长(分钟)</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">强度</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.studentName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.studentNo}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.className}</td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">{row.checkDate}</td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          <Zap className="h-3 w-3" /> {row.exerciseType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-medium">{row.durationMin ?? '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        {row.intensity ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${INTENSITY_LABEL[row.intensity]?.color || 'bg-muted text-muted-foreground'}`}>
                            {INTENSITY_LABEL[row.intensity]?.label || row.intensity}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {row.status === 'completed' ? '已完成' : row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 统一分页 */}
          <PaginationControl
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, gradient, isText }: {
  icon: React.ReactNode; label: string; value: string | number; unit: string; gradient: string; isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`rounded-lg bg-gradient-to-br ${gradient} p-1.5 text-white`}>{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold text-foreground ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
