'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { apiClient } from '@/services/api-client';
import type { StudentHealthPortrait, HealthPrescription, PortraitDetailedAnalysis } from '@/types/health-management';
import { GradeClassFilter, PaginationControl, useClassesData } from '@/components/health/HealthFilters';
import {
  TrendingUp, AlertTriangle, CheckCircle2, Search, RefreshCw, Shield, Eye, Heart, Sparkles, Loader2,
  Moon, Utensils, Dumbbell, ChevronRight, X, Pill, Flame, Apple, Sun, Activity, Target, Lightbulb, BookOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PortraitWithInfo = StudentHealthPortrait & {
  studentName?: string;
  className?: string;
  classId?: string;
};

type PrescriptionWithInfo = HealthPrescription & {
  studentName?: string;
  className?: string;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  excellent: { label: '优秀', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-4 w-4" /> },
  good: { label: '良好', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: <Heart className="h-4 w-4" /> },
  attention: { label: '关注', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Eye className="h-4 w-4" /> },
  warning: { label: '预警', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: <AlertTriangle className="h-4 w-4" /> },
};

// ==================== 可视化组件 ====================

function ScoreRing({ score, size = 64, label, showValue = true }: { score: number; size?: number; label: string; showValue?: boolean }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDash = circumference * progress;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" />
      </svg>
      {showValue && <span className="text-lg font-bold" style={{ color }}>{score}</span>}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ScoreBar({ score, label, icon }: { score: number; label: string; icon?: React.ReactNode }) {
  const color = score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-teal-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{score}分</span>
        </div>
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 80;
  const levels = 4;

  const angleStep = (2 * Math.PI) / data.length;
  const points = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (d.value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      label: d.label,
      labelX: center + (maxRadius + 20) * Math.cos(angle),
      labelY: center + (maxRadius + 20) * Math.sin(angle),
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: levels }).map((_, level) => {
        const r = ((level + 1) / levels) * maxRadius;
        const gridPoints = data.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        });
        return <polygon key={level} points={gridPoints.join(' ')} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth={1} />;
      })}
      {data.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return <line key={i} x1={center} y1={center} x2={center + maxRadius * Math.cos(angle)} y2={center + maxRadius * Math.sin(angle)} stroke="currentColor" className="text-muted/30" strokeWidth={1} />;
      })}
      <path d={pathD} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth={2} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#10b981" />)}
      {points.map((p, i) => <text key={i} x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-muted-foreground">{data[i].label}</text>)}
    </svg>
  );
}

// ==================== 维度分析卡片 ====================

function DimensionAnalysisCard({
  title,
  icon,
  analysis,
  color = 'emerald',
}: {
  title: string;
  icon: React.ReactNode;
  analysis?: { status?: string; level?: string; pattern?: string; analysis: string; suggestion: string };
  color?: 'emerald' | 'amber' | 'blue' | 'rose';
}) {
  const colorClasses = {
    emerald: 'border-emerald-200 bg-emerald-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    rose: 'border-rose-200 bg-rose-50/50',
  };

  if (!analysis) return null;

  const statusLabel = analysis.status || analysis.level || analysis.pattern || '';

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-muted-foreground">{icon}</div>
        <h4 className="font-medium text-foreground">{title}</h4>
        {statusLabel && <span className="text-xs text-muted-foreground ml-auto">{statusLabel}</span>}
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">分析：</span>
          <span className="text-foreground">{analysis.analysis}</span>
        </div>
        <div className="flex items-start gap-1">
          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{analysis.suggestion}</span>
        </div>
      </div>
    </div>
  );
}

// ==================== 画像卡片 ====================

const PortraitCard = React.memo(function PortraitCard({
  portrait,
  onClick,
}: {
  portrait: PortraitWithInfo;
  onClick: () => void;
}) {
  const config = statusConfig[portrait.overallStatus || 'good'] || statusConfig.good;
  const score = portrait.overallHealthScore ?? 0;

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg} ${config.color}`}>{config.icon}</div>
          <div>
            <h3 className="font-medium text-foreground">{portrait.studentName || portrait.studentId}</h3>
            <p className="text-xs text-muted-foreground">{portrait.className || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>{config.label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-around">
        {portrait.sleepScore !== undefined && <ScoreRing score={portrait.sleepScore} size={48} label="睡眠" />}
        {portrait.dietScore !== undefined && <ScoreRing score={portrait.dietScore} size={48} label="饮食" />}
        {portrait.exerciseHabitScore !== undefined && <ScoreRing score={portrait.exerciseHabitScore} size={48} label="运动" />}
        <ScoreRing score={score} size={48} label="综合" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(portrait.riskFactors || []).slice(0, 2).map(r => (
          <span key={r} className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600">{r}</span>
        ))}
        {(portrait.strengths || []).slice(0, 2).map(s => (
          <span key={s} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">{s}</span>
        ))}
      </div>
    </div>
  );
});

// ==================== 画像详情弹窗 ====================

function PortraitDetailDialog({
  portrait,
  prescription,
  open,
  onClose,
}: {
  portrait: PortraitWithInfo | null;
  prescription: PrescriptionWithInfo | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!portrait) return null;

  const config = statusConfig[portrait.overallStatus || 'good'] || statusConfig.good;

  const radarData = [
    { label: '睡眠', value: portrait.sleepScore ?? 70 },
    { label: '饮食', value: portrait.dietScore ?? 70 },
    { label: '运动', value: portrait.exerciseHabitScore ?? 70 },
    { label: '体质', value: portrait.fitnessLevel === 'excellent' ? 95 : portrait.fitnessLevel === 'good' ? 80 : portrait.fitnessLevel === 'pass' ? 60 : 40 },
    { label: 'BMI', value: portrait.bmiStatus === 'normal' ? 100 : portrait.bmiStatus === 'overweight' || portrait.bmiStatus === 'underweight' ? 60 : 40 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            学生健康画像报告
          </DialogTitle>
        </DialogHeader>

        {/* 学生信息头部 */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${config.bg} ${config.color}`}>{config.icon}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{portrait.studentName || portrait.studentId}</h2>
            <p className="text-sm text-muted-foreground">{portrait.className} · {config.label}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600">{portrait.overallHealthScore ?? '--'}</div>
            <div className="text-xs text-muted-foreground">综合健康分</div>
          </div>
        </div>

        {/* AI 综合摘要 */}
        {portrait.aiSummary && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium text-sm">AI 综合健康评价</span>
            </div>
            <p className="text-sm leading-relaxed">{portrait.aiSummary}</p>
          </div>
        )}

        {/* 五维雷达图 + 评分条 */}
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col items-center p-4 rounded-lg border border-border">
            <h3 className="text-sm font-medium mb-4">五维健康画像</h3>
            <RadarChart data={radarData} />
          </div>
          <div className="p-4 rounded-lg border border-border space-y-4">
            <h3 className="text-sm font-medium mb-2">各项评分</h3>
            <ScoreBar score={portrait.sleepScore ?? 70} label="睡眠质量" icon={<Moon className="h-4 w-4" />} />
            <ScoreBar score={portrait.dietScore ?? 70} label="饮食状况" icon={<Utensils className="h-4 w-4" />} />
            <ScoreBar score={portrait.exerciseHabitScore ?? 70} label="运动习惯" icon={<Dumbbell className="h-4 w-4" />} />
            <ScoreBar score={radarData[3].value} label="体质水平" icon={<Activity className="h-4 w-4" />} />
            <ScoreBar score={radarData[4].value} label="BMI指数" icon={<Target className="h-4 w-4" />} />
          </div>
        </div>

        {/* 详细维度分析 */}
        {portrait.detailedAnalysis && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              详细健康分析
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <DimensionAnalysisCard title="BMI分析" icon={<Target className="h-4 w-4" />} analysis={portrait.detailedAnalysis.bmi} color="emerald" />
              <DimensionAnalysisCard title="体质分析" icon={<Activity className="h-4 w-4" />} analysis={portrait.detailedAnalysis.fitness} color="blue" />
              <DimensionAnalysisCard title="睡眠分析" icon={<Moon className="h-4 w-4" />} analysis={portrait.detailedAnalysis.sleep} color="amber" />
              <DimensionAnalysisCard title="饮食分析" icon={<Utensils className="h-4 w-4" />} analysis={portrait.detailedAnalysis.diet} color="rose" />
            </div>
            <DimensionAnalysisCard title="运动分析" icon={<Dumbbell className="h-4 w-4" />} analysis={portrait.detailedAnalysis.exercise} color="blue" />
          </div>
        )}

        {/* 风险与优势 */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/50">
            <h3 className="text-sm font-medium text-rose-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> 需关注风险
            </h3>
            {(portrait.riskFactors || []).length > 0 ? (
              <ul className="space-y-1">
                {portrait.riskFactors!.map(r => (
                  <li key={r} className="text-sm text-rose-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">暂无明显风险</p>
            )}
          </div>
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
            <h3 className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> 健康优势
            </h3>
            {(portrait.strengths || []).length > 0 ? (
              <ul className="space-y-1">
                {portrait.strengths!.map(s => (
                  <li key={s} className="text-sm text-emerald-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">暂无明显优势记录</p>
            )}
          </div>
        </div>

        {/* 改进建议 */}
        {(portrait.improvementSuggestions || []).length > 0 && (
          <div className="mt-6 p-4 rounded-lg border border-amber-200 bg-amber-50/30">
            <h3 className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-1">
              <Lightbulb className="h-4 w-4" /> 改进建议
            </h3>
            <ul className="grid md:grid-cols-2 gap-2">
              {portrait.improvementSuggestions!.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 健康处方 */}
        {prescription && (
          <div className="mt-6 p-4 rounded-lg border border-amber-200 bg-amber-50/30">
            <h3 className="text-sm font-medium text-amber-700 mb-4 flex items-center gap-2">
              <Pill className="h-4 w-4" /> AI健康处方建议
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <Apple className="h-4 w-4" /> 膳食建议
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">每日热量</span><span className="font-medium">{prescription.dailyCaloriesTarget} kcal</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">碳水</span><span className="font-medium">{prescription.nutritionAdvice?.carbs?.target}g</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">蛋白质</span><span className="font-medium">{prescription.nutritionAdvice?.protein?.target}g</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">脂肪</span><span className="font-medium">{prescription.nutritionAdvice?.fat?.target}g</span></div>
                </div>
                {prescription.mealSuggestions && (
                  <div className="p-2 rounded bg-white/50 text-xs space-y-1">
                    <div><span className="text-muted-foreground">早餐：</span>{prescription.mealSuggestions.breakfast}</div>
                    <div><span className="text-muted-foreground">午餐：</span>{prescription.mealSuggestions.lunch}</div>
                    <div><span className="text-muted-foreground">晚餐：</span>{prescription.mealSuggestions.dinner}</div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Dumbbell className="h-4 w-4" /> 运动处方
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">运动类型</span><span className="font-medium">{prescription.exerciseType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">频率</span><span className="font-medium">{prescription.exerciseFrequency}次/周</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">时长</span><span className="font-medium">{prescription.exerciseDurationMin}分钟/次</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">强度</span><span className="font-medium">{prescription.exerciseIntensity === 'low' ? '低' : prescription.exerciseIntensity === 'medium' ? '中' : '高'}</span></div>
                </div>
                {prescription.exercisePlan && (
                  <div className="p-2 rounded bg-blue-50 text-xs text-blue-700 space-y-1">
                    <div><span className="font-medium">热身：</span>{prescription.exercisePlan.warmUp}</div>
                    <div><span className="font-medium">主要内容：</span>{prescription.exercisePlan.mainExercise}</div>
                    <div><span className="font-medium">放松：</span>{prescription.exercisePlan.coolDown}</div>
                  </div>
                )}
              </div>
            </div>
            {prescription.expectedOutcomes && (
              <div className="mt-3 p-2 rounded bg-emerald-50 text-xs text-emerald-700">
                <span className="font-medium">预期效果：</span>{prescription.expectedOutcomes}
              </div>
            )}
          </div>
        )}

        {/* 底部时间信息 */}
        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>数据来源：{portrait.dataSources?.join('、') || '体质测评、家长观察'}</span>
          <span>更新时间：{portrait.updatedAt ? new Date(portrait.updatedAt).toLocaleString() : '--'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== 主页面 ====================

export default function PortraitsPage() {
  const [portraits, setPortraits] = useState<PortraitWithInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [computing, setComputing] = useState(false);
  const [computeResult, setComputeResult] = useState<{ total: number; success: number; fail: number } | null>(null);

  const [selectedPortrait, setSelectedPortrait] = useState<PortraitWithInfo | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithInfo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [grade, setGrade] = useState('all');
  const [classId, setClassId] = useState('all');
  const { gradeOptions, classesByGrade, loading: classesLoading } = useClassesData();

  const computeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const classOptions = useMemo(() => {
    if (grade === 'all') return classesByGrade;
    return { [grade]: classesByGrade[grade] || [] };
  }, [grade, classesByGrade]);

  const loadPortraits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (statusFilter) params.set('status', statusFilter);
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.get<PortraitWithInfo[]>(`/health/portraits?${params.toString()}`);
      if (res.success) {
        setPortraits(res.data || []);
        setTotal(res.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('[PortraitsPage] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, classId]);

  useEffect(() => { loadPortraits(); }, [loadPortraits]);

  const handleStatusChange = (s: string) => { setStatusFilter(s); setPage(1); };
  const handleGradeChange = (g: string) => { setGrade(g); setClassId('all'); setPage(1); };
  const handleClassChange = (c: string) => { setClassId(c); setPage(1); };

  const handleRefresh = async () => {
    setComputing(true);
    setComputeResult(null);
    // 超时保护：最长等待5分钟后自动重置状态
    const timeoutId = setTimeout(() => {
      setComputing(false);
      setComputeResult({ total: 0, success: 0, fail: 0 });
    }, 5 * 60 * 1000);
    try {
      const params = new URLSearchParams({ mode: 'batch' });
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.post<{ total: number; success: number; fail: number }>(`/health/portraits?${params.toString()}`, {});
      clearTimeout(timeoutId);
      setComputeResult(res.data ?? null);
      await loadPortraits();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[PortraitsPage] batch compute error:', err);
    } finally {
      setComputing(false);
      if (computeTimerRef.current) clearTimeout(computeTimerRef.current);
      computeTimerRef.current = setTimeout(() => setComputeResult(null), 5000);
    }
  };

  const handleCardClick = async (portrait: PortraitWithInfo) => {
    setSelectedPortrait(portrait);
    setDetailOpen(true);

    try {
      const res = await apiClient.get<PrescriptionWithInfo>(`/health/prescriptions?studentId=${portrait.studentId}&status=active`);
      if (res.success && res.data) {
        setSelectedPrescription(res.data);
      } else {
        setSelectedPrescription(null);
      }
    } catch {
      setSelectedPrescription(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filtered = useMemo(
    () => portraits.filter(p => !searchQuery || p.studentName?.includes(searchQuery) || p.studentId.includes(searchQuery)),
    [portraits, searchQuery]
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
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI生成
              </div>
              <button onClick={handleRefresh} disabled={computing} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${computing ? 'animate-spin' : ''}`} />
                {computing ? '生成中...' : '刷新画像'}
              </button>
            </div>
          </div>
          {computeResult && (
            <div className="mt-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
              画像生成完成：共 {computeResult.total} 人，成功 {computeResult.success} 人，失败 {computeResult.fail} 人
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border bg-card p-1">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => handleStatusChange(tab.key)} className={`rounded-md px-3 py-1.5 text-sm transition-colors ${statusFilter === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <GradeClassFilter grade={grade} onGradeChange={handleGradeChange} classId={classId} onClassChange={handleClassChange} gradeOptions={gradeOptions} classOptions={classOptions} loading={classesLoading} />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索学生..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          <span className="text-xs text-muted-foreground">共 {total} 人</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">暂无画像数据</p>
            <p className="mt-1 text-xs text-muted-foreground/70">点击「刷新画像」按钮生成AI画像</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => <PortraitCard key={p.id} portrait={p} onClick={() => handleCardClick(p)} />)}
          </div>
        )}

        {total > pageSize && (
          <div className="mt-6">
            <PaginationControl page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
          </div>
        )}
      </div>

      <PortraitDetailDialog portrait={selectedPortrait} prescription={selectedPrescription} open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedPortrait(null); setSelectedPrescription(null); }} />
    </div>
  );
}
