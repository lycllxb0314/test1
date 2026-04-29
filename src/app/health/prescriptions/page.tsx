'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Pill, Sparkles, RefreshCw, ChevronRight, Utensils, Dumbbell, AlertTriangle,
  CheckCircle2, Loader2, Moon, Sun, Activity, Target, Flame, Apple, Heart, TrendingUp, Lightbulb
} from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { GradeClassFilter, PaginationControl, useClassesData } from '@/components/health/HealthFilters';
import type { HealthPrescription, StudentHealthPortrait, ExerciseIntensity } from '@/types/health-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PrescriptionWithInfo = HealthPrescription & {
  studentName?: string;
  className?: string;
};

type PortraitWithInfo = StudentHealthPortrait & {
  studentName?: string;
  className?: string;
};

// ==================== 可视化组件 ====================

function NutrientBar({ label, value, max, color, unit, reason }: { label: string; value: number; max: number; color: string; unit: string; reason?: string }) {
  const percent = Math.min((value / max) * 100, 100);
  const colorClass: Record<string, string> = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    green: 'bg-emerald-500',
  };
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm"><strong>{value}</strong>{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass[color] || 'bg-gray-500'} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      {reason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}
    </div>
  );
}

function ExerciseRing({ frequency, duration, intensity }: { frequency: number; duration: number; intensity: string }) {
  const intensityScore = intensity === 'high' ? 90 : intensity === 'medium' ? 70 : 50;
  const score = Math.round((frequency / 7) * 50 + (duration / 60) * 20 + (intensityScore / 100) * 30);
  const size = 120;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const strokeDash = circumference * progress;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color }}>{score}</div>
          <div className="text-[10px] text-muted-foreground">运动指数</div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

// ==================== 处方详情弹窗 ====================

function PrescriptionDetailDialog({
  prescription,
  portrait,
  open,
  onClose,
}: {
  prescription: PrescriptionWithInfo | null;
  portrait: PortraitWithInfo | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!prescription) return null;

  const statusColor = prescription.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground';
  const statusLabel = prescription.status === 'active' ? '生效中' : prescription.status === 'superseded' ? '已替代' : '已完成';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-amber-500" />
            AI健康处方报告
          </DialogTitle>
        </DialogHeader>

        {/* 学生信息头部 */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Pill className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{prescription.studentName || prescription.studentId}</h2>
            <p className="text-sm text-muted-foreground">{prescription.className} · {statusLabel}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">{prescription.dailyCaloriesTarget ?? '--'}</div>
            <div className="text-xs text-muted-foreground">每日目标热量(kcal)</div>
          </div>
        </div>

        {/* AI 处方摘要 */}
        {prescription.aiSummary && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium text-sm">AI 处方摘要</span>
            </div>
            <p className="text-sm leading-relaxed">{prescription.aiSummary}</p>
          </div>
        )}

        {/* 健康画像概览 */}
        {portrait && (
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center gap-2 text-emerald-700 mb-3">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium text-sm">关联健康画像</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: '综合', value: portrait.overallHealthScore, icon: Heart },
                { label: '睡眠', value: portrait.sleepScore, icon: Moon },
                { label: '饮食', value: portrait.dietScore, icon: Utensils },
                { label: '运动', value: portrait.exerciseHabitScore, icon: Dumbbell },
                { label: '体质', value: portrait.fitnessLevel === 'excellent' ? 95 : portrait.fitnessLevel === 'good' ? 80 : portrait.fitnessLevel === 'pass' ? 60 : 40, icon: Activity },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-white/50 p-2">
                  <item.icon className="h-4 w-4 mx-auto text-muted-foreground" />
                  <div className="text-lg font-bold text-foreground">{item.value ?? '--'}</div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 饮食禁忌 */}
        {prescription.dietTaboos && prescription.dietTaboos.length > 0 && (
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/30">
            <div className="flex items-center gap-2 text-rose-700 mb-3">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">饮食禁忌</span>
            </div>
            <div className="space-y-2">
              {prescription.dietTaboos.map((taboo, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-rose-600 font-medium">{taboo}</span>
                    {prescription.dietTabooReasons?.[i] && (
                      <span className="text-muted-foreground ml-1">— {prescription.dietTabooReasons[i]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 营养目标可视化 */}
        {prescription.nutritionAdvice && (
          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <Target className="h-4 w-4 text-amber-500" />
              <span>每日营养目标</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {prescription.nutritionAdvice.carbs && (
                <NutrientBar label="碳水化合物" value={prescription.nutritionAdvice.carbs.target} max={350} color="amber" unit="g" reason={prescription.nutritionAdvice.carbs.reason} />
              )}
              {prescription.nutritionAdvice.protein && (
                <NutrientBar label="蛋白质" value={prescription.nutritionAdvice.protein.target} max={120} color="blue" unit="g" reason={prescription.nutritionAdvice.protein.reason} />
              )}
              {prescription.nutritionAdvice.fat && (
                <NutrientBar label="脂肪" value={prescription.nutritionAdvice.fat.target} max={80} color="rose" unit="g" reason={prescription.nutritionAdvice.fat.reason} />
              )}
            </div>
            {(prescription.nutritionAdvice.vitamins?.length || prescription.nutritionAdvice.minerals?.length) ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {prescription.nutritionAdvice.vitamins && prescription.nutritionAdvice.vitamins.length > 0 && (
                  <div className="rounded bg-amber-50 p-2">
                    <span className="text-amber-700 font-medium">推荐维生素：</span>
                    <span>{prescription.nutritionAdvice.vitamins.join('、')}</span>
                  </div>
                )}
                {prescription.nutritionAdvice.minerals && prescription.nutritionAdvice.minerals.length > 0 && (
                  <div className="rounded bg-blue-50 p-2">
                    <span className="text-blue-700 font-medium">推荐矿物质：</span>
                    <span>{prescription.nutritionAdvice.minerals.join('、')}</span>
                  </div>
                )}
              </div>
            ) : null}
            {prescription.nutritionAdvice.hydrationAdvice && (
              <div className="mt-3 p-2 rounded bg-cyan-50 text-xs text-cyan-700">
                <span className="font-medium">饮水建议：</span>{prescription.nutritionAdvice.hydrationAdvice}
              </div>
            )}
          </div>
        )}

        {/* 膳食建议 */}
        {prescription.mealSuggestions && (
          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <Apple className="h-4 w-4 text-emerald-500" />
              <span>每日膳食建议</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { label: '早餐', value: prescription.mealSuggestions.breakfast, icon: Sun, time: '7:00-8:00', color: 'bg-amber-50' },
                { label: '午餐', value: prescription.mealSuggestions.lunch, icon: Utensils, time: '11:30-12:30', color: 'bg-emerald-50' },
                { label: '晚餐', value: prescription.mealSuggestions.dinner, icon: Moon, time: '17:30-18:30', color: 'bg-blue-50' },
                { label: '加餐', value: prescription.mealSuggestions.snacks, icon: Apple, time: '15:00', color: 'bg-rose-50' },
              ].filter(item => item.value).map(item => (
                <div key={item.label} className={`rounded-lg ${item.color} p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{item.time}</span>
                  </div>
                  <p className="text-xs text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            {prescription.mealSuggestions.cookingTips && (
              <div className="mt-3 p-2 rounded bg-muted/30 text-xs">
                <Lightbulb className="inline h-3 w-3 text-amber-500 mr-1" />
                <span className="text-muted-foreground">烹饪建议：</span>{prescription.mealSuggestions.cookingTips}
              </div>
            )}
          </div>
        )}

        {/* 运动处方可视化 */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm font-medium mb-4">
            <Dumbbell className="h-4 w-4 text-blue-500" />
            <span>运动处方</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 运动指数环 */}
            <div className="flex flex-col items-center justify-center">
              <ExerciseRing
                frequency={prescription.exerciseFrequency ?? 3}
                duration={prescription.exerciseDurationMin ?? 30}
                intensity={prescription.exerciseIntensity ?? 'medium'}
              />
            </div>
            {/* 运动参数 */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                  <Flame className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-medium">{prescription.exerciseType || '有氧运动'}</div>
                  <div className="text-[10px] text-muted-foreground">运动类型</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                  <Activity className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-medium">{prescription.exerciseFrequency ?? '-'} 次/周</div>
                  <div className="text-[10px] text-muted-foreground">运动频率</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                  <ClockIcon className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-medium">{prescription.exerciseDurationMin ?? '-'} 分钟</div>
                  <div className="text-[10px] text-muted-foreground">每次时长</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                  <Target className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-medium">{formatIntensity(prescription.exerciseIntensity)}</div>
                  <div className="text-[10px] text-muted-foreground">运动强度</div>
                </div>
              </div>
            </div>
          </div>

          {/* 运动计划详情 */}
          {prescription.exercisePlan && (
            <div className="mt-4 rounded-lg bg-blue-50/50 p-4">
              <h4 className="text-sm font-medium text-blue-700 mb-3">详细运动计划</h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="rounded bg-white/50 p-2">
                  <span className="text-blue-600 font-medium">热身：</span>
                  <span className="text-foreground">{prescription.exercisePlan.warmUp}</span>
                </div>
                <div className="rounded bg-white/50 p-2">
                  <span className="text-blue-600 font-medium">主要内容：</span>
                  <span className="text-foreground">{prescription.exercisePlan.mainExercise}</span>
                </div>
                <div className="rounded bg-white/50 p-2">
                  <span className="text-blue-600 font-medium">放松：</span>
                  <span className="text-foreground">{prescription.exercisePlan.coolDown}</span>
                </div>
              </div>
              {prescription.exercisePlan.weeklySchedule && (
                <div className="mt-2 p-2 rounded bg-white/50 text-sm">
                  <span className="text-blue-600 font-medium">一周安排：</span>
                  <span className="text-foreground">{prescription.exercisePlan.weeklySchedule}</span>
                </div>
              )}
            </div>
          )}

          {prescription.exerciseNotes && (
            <div className="mt-3 p-2 rounded bg-amber-50 text-xs text-amber-700">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              <span className="font-medium">注意事项：</span>{prescription.exerciseNotes}
            </div>
          )}
        </div>

        {/* 预期效果 */}
        {prescription.expectedOutcomes && (
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium text-sm">预期改善效果</span>
            </div>
            <p className="text-sm text-foreground">{prescription.expectedOutcomes}</p>
          </div>
        )}

        {/* 底部时间信息 */}
        <div className="pt-4 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>处方周期：{prescription.periodStart} ~ {prescription.periodEnd}</span>
          <span>更新时间：{prescription.updatedAt ? new Date(prescription.updatedAt).toLocaleString() : '--'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== 主页面 ====================

export default function PrescriptionsPage() {
  const { gradeOptions, classesByGrade, loading: classesLoading } = useClassesData();

  const [grade, setGrade] = useState('all');
  const [classId, setClassId] = useState('all');

  const [prescriptions, setPrescriptions] = useState<PrescriptionWithInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ total: number; success: number; fail: number } | null>(null);

  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithInfo | null>(null);
  const [selectedPortrait, setSelectedPortrait] = useState<PortraitWithInfo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: 'admin',
        page: String(page),
        pageSize: String(pageSize),
      });
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.get<PrescriptionWithInfo[]>(`/health/prescriptions?${params}`);
      setPrescriptions(res.data || []);
      setTotal(res.pagination?.total ?? 0);
      setActiveCount((res as unknown as { stats?: { active: number } }).stats?.active ?? 0);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, classId]);

  useEffect(() => { loadPrescriptions(); }, [loadPrescriptions]);

  const handleGradeChange = (newGrade: string) => { setGrade(newGrade); setClassId('all'); setPage(1); };
  const handleClassChange = (newClassId: string) => { setClassId(newClassId); setPage(1); };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    // 超时保护：最长等待5分钟后自动重置状态
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
      setRefreshResult({ total: 0, success: 0, fail: 0 });
    }, 5 * 60 * 1000);
    try {
      const params = new URLSearchParams({ mode: 'regenerate' });
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.post<{ total: number; success: number; fail: number }>(`/health/prescriptions?${params}`, {});
      clearTimeout(timeoutId);
      setRefreshResult(res.data ?? null);
      await loadPrescriptions();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Failed to refresh prescriptions:', err);
    } finally {
      setRefreshing(false);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => setRefreshResult(null), 5000);
    }
  };

  const handleCardClick = async (rx: PrescriptionWithInfo) => {
    setSelectedPrescription(rx);
    setDetailOpen(true);

    try {
      const res = await apiClient.get<PortraitWithInfo>(`/health/portraits?studentId=${rx.studentId}`);
      if (res.success && res.data) {
        setSelectedPortrait(res.data);
      } else {
        setSelectedPortrait(null);
      }
    } catch {
      setSelectedPortrait(null);
    }
  };

  const classOptions = useMemo(() => {
    if (grade === 'all') return classesByGrade;
    return { [grade]: classesByGrade[grade] || [] };
  }, [grade, classesByGrade]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 text-white">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">健康处方</h1>
              <p className="text-xs text-muted-foreground">AI膳食建议与运动处方</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI生成
              </div>
              <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? '生成中...' : '刷新处方'}
              </button>
            </div>
          </div>
          {refreshResult && (
            <div className="mt-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
              处方生成完成：共 {refreshResult.total} 人，成功 {refreshResult.success} 人，失败 {refreshResult.fail} 人
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="mb-4">
          <GradeClassFilter grade={grade} onGradeChange={handleGradeChange} classId={classId} onClassChange={handleClassChange} gradeOptions={gradeOptions} classOptions={classOptions} loading={classesLoading} />
        </div>

        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>共 <strong className="text-foreground">{total}</strong> 条处方</span>
          <span>生效中 <strong className="text-primary">{activeCount}</strong></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Pill className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p>暂无处方数据</p>
            <p className="mt-1 text-xs text-muted-foreground/70">点击「刷新处方」按钮生成AI处方</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prescriptions.map((rx) => <PrescriptionCard key={rx.id} prescription={rx} onClick={() => handleCardClick(rx)} />)}
          </div>
        )}

        {total > pageSize && (
          <div className="mt-4">
            <PaginationControl page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
          </div>
        )}
      </div>

      <PrescriptionDetailDialog prescription={selectedPrescription} portrait={selectedPortrait} open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedPrescription(null); setSelectedPortrait(null); }} />
    </div>
  );
}

// ==================== 处方卡片 ====================

function PrescriptionCard({ prescription, onClick }: { prescription: PrescriptionWithInfo; onClick: () => void }) {
  const statusColor = prescription.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground';
  const statusLabel = prescription.status === 'active' ? '生效中' : prescription.status === 'superseded' ? '已替代' : '已完成';

  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <Pill className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{prescription.studentName || prescription.studentId}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{prescription.className}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-muted/30 px-2 py-1.5">
          <Utensils className="inline h-3 w-3 text-muted-foreground mr-1" />
          <span className="font-medium">{prescription.dailyCaloriesTarget ?? '-'}</span>
          <span className="text-muted-foreground"> kcal/日</span>
        </div>
        <div className="rounded bg-muted/30 px-2 py-1.5">
          <Dumbbell className="inline h-3 w-3 text-muted-foreground mr-1" />
          <span className="font-medium">{prescription.exerciseFrequency ?? '-'}次/周</span>
        </div>
      </div>
    </div>
  );
}

function formatIntensity(intensity?: ExerciseIntensity | string | null): string {
  const map: Record<string, string> = { low: '低强度', medium: '中等强度', high: '高强度' };
  return map[intensity || ''] || intensity || '-';
}
