'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Pill, Sparkles, RefreshCw, ChevronDown, ChevronUp, Utensils, Dumbbell, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { GradeClassFilter, PaginationControl, useClassesData } from '@/components/health/HealthFilters';
import type { HealthPrescription, NutritionAdvice, MealSuggestion, ExerciseIntensity } from '@/types/health-management';

type PrescriptionWithInfo = HealthPrescription & {
  studentName?: string;
  className?: string;
};

export default function PrescriptionsPage() {
  const { gradeOptions, classesByGrade, loading: classesLoading } = useClassesData();

  // 筛选状态
  const [grade, setGrade] = useState('all');
  const [classId, setClassId] = useState('all');

  // 数据状态
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  // 刷新状态
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ total: number; success: number; fail: number } | null>(null);

  // 展开的处方
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 计时器：刷新结果3秒后消失
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

      const res = await apiClient.get<PrescriptionWithInfo[]>(`/api/health/prescriptions?${params}`);
      setPrescriptions(res.data || []);
      const pg = (res as unknown as { pagination?: { total: number } }).pagination;
      setTotal(pg?.total ?? 0);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, classId]);

  useEffect(() => { loadPrescriptions(); }, [loadPrescriptions]);

  // 年级变化时重置班级和页码
  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    setClassId('all');
    setPage(1);
  };
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    setPage(1);
  };

  // 刷新处方
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const params = new URLSearchParams({ mode: 'regenerate' });
      if (classId && classId !== 'all') params.set('classId', classId);

      const res = await apiClient.post<{ total: number; success: number; fail: number }>(`/api/health/prescriptions?${params}`, {});
      setRefreshResult(res.data ?? null);
      // 刷新后重新加载
      await loadPrescriptions();
    } catch (err) {
      console.error('Failed to refresh prescriptions:', err);
    } finally {
      setRefreshing(false);
      // 3秒后消失
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => setRefreshResult(null), 3000);
    }
  };

  // 年级对应班级列表
  const classOptions = useMemo(() => {
    if (grade === 'all') return classesByGrade;
    return { [grade]: classesByGrade[grade] || [] };
  }, [grade, classesByGrade]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-background">
      {/* 页头 */}
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
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? '生成中...' : '刷新处方'}
              </button>
            </div>
          </div>
          {/* 刷新结果提示 */}
          {refreshResult && (
            <div className="mt-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
              处方生成完成：共 {refreshResult.total} 人，成功 {refreshResult.success} 人，失败 {refreshResult.fail} 人
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-4">
        {/* 筛选器 */}
        <div className="mb-4">
          <GradeClassFilter
            grade={grade}
            classId={classId}
            gradeOptions={gradeOptions}
            classOptions={classOptions}
            onGradeChange={handleGradeChange}
            onClassChange={handleClassChange}
            loading={classesLoading}
          />
        </div>

        {/* 统计栏 */}
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>共 <strong className="text-foreground">{total}</strong> 条处方</span>
          <span>生效中 <strong className="text-primary">{prescriptions.filter(p => p.status === 'active').length}</strong></span>
        </div>

        {/* 处方列表 */}
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
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <PrescriptionCard
                key={rx.id}
                prescription={rx}
                expanded={expandedId === rx.id}
                onToggle={() => setExpandedId(expandedId === rx.id ? null : rx.id)}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div className="mt-4">
            <PaginationControl
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 处方卡片组件 ====================

function PrescriptionCard({
  prescription,
  expanded,
  onToggle,
}: {
  prescription: PrescriptionWithInfo;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusColor = prescription.status === 'active'
    ? 'bg-emerald-500/10 text-emerald-600'
    : prescription.status === 'superseded'
      ? 'bg-muted text-muted-foreground'
      : 'bg-muted text-muted-foreground';
  const statusLabel = prescription.status === 'active' ? '生效中'
    : prescription.status === 'superseded' ? '已替代'
    : '已完成';

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* 卡片头部 */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/30"
        onClick={onToggle}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <Pill className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{prescription.studentName || prescription.studentId}</span>
            <span className="text-xs text-muted-foreground">{prescription.className || ''}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Utensils className="h-3 w-3" />{prescription.dailyCaloriesTarget ?? '-'} kcal/日</span>
            <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" />{prescription.exerciseType || '-'} {prescription.exerciseFrequency ?? '-'}次/周</span>
            <span>{prescription.periodStart} ~ {prescription.periodEnd}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* 风险提示 */}
          {prescription.dietTaboos && prescription.dietTaboos.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> 饮食禁忌
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prescription.dietTaboos.map((taboo, i) => (
                  <span key={i} className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs text-red-600">{taboo}</span>
                ))}
              </div>
            </div>
          )}

          {/* 营养建议 */}
          {prescription.nutritionAdvice && (
            <NutritionSection advice={prescription.nutritionAdvice} />
          )}

          {/* 膳食建议 */}
          {prescription.mealSuggestions && (
            <MealSection meals={prescription.mealSuggestions} />
          )}

          {/* 运动处方 */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Dumbbell className="h-4 w-4 text-blue-500" /> 运动处方
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoTile label="运动类型" value={prescription.exerciseType || '-'} />
              <InfoTile label="频率" value={`${prescription.exerciseFrequency ?? '-'}次/周`} />
              <InfoTile label="时长" value={`${prescription.exerciseDurationMin ?? '-'}分钟/次`} />
              <InfoTile label="强度" value={formatIntensity(prescription.exerciseIntensity)} />
            </div>
            {prescription.exerciseNotes && (
              <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">{prescription.exerciseNotes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 营养建议 ====================

function NutritionSection({ advice }: { advice: NutritionAdvice }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 营养建议
      </div>
      <div className="grid grid-cols-3 gap-3">
        {advice.carbs && <NutrientCard label="碳水" target={advice.carbs.target} unit={advice.carbs.unit} desc={advice.carbs.description} color="amber" />}
        {advice.protein && <NutrientCard label="蛋白质" target={advice.protein.target} unit={advice.protein.unit} desc={advice.protein.description} color="blue" />}
        {advice.fat && <NutrientCard label="脂肪" target={advice.fat.target} unit={advice.fat.unit} desc={advice.fat.description} color="rose" />}
      </div>
      {(advice.vitamins && advice.vitamins.length > 0) && (
        <div className="mt-2 text-xs text-muted-foreground">
          推荐维生素：{advice.vitamins.join('、')}
        </div>
      )}
      {(advice.minerals && advice.minerals.length > 0) && (
        <div className="mt-1 text-xs text-muted-foreground">
          推荐矿物质：{advice.minerals.join('、')}
        </div>
      )}
    </div>
  );
}

function NutrientCard({ label, target, unit, desc, color }: { label: string; target: number; unit: string; desc: string; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-600',
    blue: 'bg-blue-500/10 text-blue-600',
    rose: 'bg-rose-500/10 text-rose-600',
  };
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className={`text-lg font-bold ${colorClasses[color] || ''}`}>{target}</span>
        <span className="text-xs text-muted-foreground">{unit}/日</span>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

// ==================== 膳食建议 ====================

function MealSection({ meals }: { meals: MealSuggestion }) {
  const items = [
    { label: '早餐', value: meals.breakfast, icon: '🌅' },
    { label: '午餐', value: meals.lunch, icon: '☀️' },
    { label: '晚餐', value: meals.dinner, icon: '🌙' },
    { label: '加餐', value: meals.snacks, icon: '🍎' },
  ].filter(item => item.value);

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Utensils className="h-4 w-4 text-emerald-500" /> 膳食建议
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map(item => (
          <div key={item.label} className="rounded-md bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">{item.icon} {item.label}</div>
            <div className="mt-0.5 text-sm text-foreground">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 辅助组件 ====================

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function formatIntensity(intensity?: ExerciseIntensity | string | null): string {
  const map: Record<string, string> = { low: '低强度', medium: '中等强度', high: '高强度' };
  return map[intensity || ''] || intensity || '-';
}
