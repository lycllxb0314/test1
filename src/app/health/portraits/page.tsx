'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type { StudentHealthPortrait } from '@/types/health-management';
import { GradeClassFilter, useClassesData } from '@/components/health/HealthFilters';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Shield,
  Eye,
  Heart,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

type PortraitWithInfo = StudentHealthPortrait & {
  studentName?: string;
  className?: string;
  classId?: string;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  excellent: { label: '优秀', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-4 w-4" /> },
  good: { label: '良好', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: <Heart className="h-4 w-4" /> },
  attention: { label: '关注', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Eye className="h-4 w-4" /> },
  warning: { label: '预警', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: <AlertTriangle className="h-4 w-4" /> },
};

function ScoreRing({ score, size = 64, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const strokeDash = circumference * progress;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/30" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-bold" style={{ color }}>{score}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function PortraitCard({ portrait }: { portrait: PortraitWithInfo }) {
  const config = statusConfig[portrait.overallStatus || 'good'] || statusConfig.good;
  const score = portrait.overallHealthScore ?? 0;

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg} ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{portrait.studentName || portrait.studentId}</h3>
            <p className="text-xs text-muted-foreground">{portrait.className || ''}</p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* AI 摘要 */}
      {portrait.aiSummary && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {portrait.aiSummary}
        </p>
      )}

      {/* 评分环 */}
      <div className="mt-4 flex items-center justify-around">
        {portrait.sleepScore !== undefined && <ScoreRing score={portrait.sleepScore} size={52} label="睡眠" />}
        {portrait.dietScore !== undefined && <ScoreRing score={portrait.dietScore} size={52} label="饮食" />}
        {portrait.exerciseHabitScore !== undefined && <ScoreRing score={portrait.exerciseHabitScore} size={52} label="运动" />}
        <ScoreRing score={score} size={52} label="综合" />
      </div>

      {/* 风险/优势标签 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(portrait.riskFactors || []).map(r => (
          <span key={r} className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600">
            {r}
          </span>
        ))}
        {(portrait.strengths || []).map(s => (
          <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            {s}
          </span>
        ))}
      </div>

      {/* BMI & 体质 */}
      <div className="mt-3 flex gap-2 text-[10px] text-muted-foreground">
        {portrait.bmiStatus && (
          <span className="rounded bg-muted px-1.5 py-0.5">
            BMI: {portrait.bmiStatus === 'normal' ? '正常' : portrait.bmiStatus === 'underweight' ? '偏瘦' : portrait.bmiStatus === 'overweight' ? '偏胖' : '肥胖'}
          </span>
        )}
        {portrait.fitnessLevel && (
          <span className="rounded bg-muted px-1.5 py-0.5">
            体质: {portrait.fitnessLevel === 'excellent' ? '优秀' : portrait.fitnessLevel === 'good' ? '良好' : portrait.fitnessLevel === 'pass' ? '及格' : '不及格'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PortraitsPage() {
  const [portraits, setPortraits] = useState<PortraitWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [computing, setComputing] = useState(false);

  // 年级班级筛选
  const [grade, setGrade] = useState('all');
  const [classId, setClassId] = useState('all');
  const { classes } = useClassesData();

  const loadPortraits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.get<{ portraits: PortraitWithInfo[]; total: number }>(
        `/health/portraits?${params.toString()}`
      );
      if (res.success && res.data) {
        let list = res.data.portraits || [];
        // 年级前端筛选
        if (grade !== 'all') {
          const gradeNum = Number(grade);
          const gradeClassIds = new Set(
            classes.filter(c => c.gradeNumber === gradeNum).map(c => c.id)
          );
          list = list.filter(p => gradeClassIds.has(p.classId || ''));
        }
        setPortraits(list);
      }
    } catch (err) {
      console.error('[PortraitsPage] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, classId, grade, classes]);

  useEffect(() => { loadPortraits(); }, [loadPortraits]);

  const computeAll = async () => {
    setComputing(true);
    try {
      // 对每个学生触发画像计算
      for (const p of portraits) {
        await apiClient.post(`/health/portraits?studentId=${p.studentId}`);
      }
      await loadPortraits();
    } finally {
      setComputing(false);
    }
  };

  const filtered = portraits.filter(p =>
    !searchQuery || p.studentName?.includes(searchQuery) || p.studentId.includes(searchQuery)
  );

  const filterTabs = [
    { key: '', label: '全部' },
    { key: 'excellent', label: '优秀' },
    { key: 'good', label: '良好' },
    { key: 'attention', label: '关注' },
    { key: 'warning', label: '预警' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">学生健康画像</h1>
              <p className="text-xs text-muted-foreground">基于多数据源的AI综合健康分析与画像</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={computeAll}
                disabled={computing}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${computing ? 'animate-spin' : ''}`} />
                {computing ? '计算中...' : '刷新画像'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* 筛选栏 */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border bg-card p-1">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <GradeClassFilter
            grade={grade}
            onGradeChange={setGrade}
            classId={classId}
            onClassIdChange={setClassId}
          />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索学生姓名或学号..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <span className="text-xs text-muted-foreground">
            共 {filtered.length} 名学生
          </span>
        </div>

        {/* 画像卡片网格 */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">暂无画像数据</p>
            <p className="mt-1 text-xs text-muted-foreground/70">请先导入体质数据或等待家长提交观察数据</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => (
              <PortraitCard key={p.id} portrait={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
