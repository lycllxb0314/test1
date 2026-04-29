'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  StudentHealthPortrait,
  ParentDailyObservation,
  HealthPrescription,
  SleepQuality,
  DietQuality,
  EnergyLevel,
} from '@/types/health-management';
import {
  Heart,
  Moon,
  Apple,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Sun,
  Sunset,
  Check,
  Send,
  AlertTriangle,
  Activity,
  Pill,
  Eye,
} from 'lucide-react';

// ==================== 评分环组件 ====================
function ScoreRing({ score, size = 80, label, icon }: {
  score: number; size?: number; label: string; icon?: React.ReactNode;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const strokeDash = circumference * progress;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/20" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={5}
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <span className="mb-0.5" style={{ color }}>{icon}</span>}
          <span className="text-xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ==================== 趋势标签 ====================
function TrendBadge({ trend }: { trend?: string }) {
  if (!trend) return null;
  if (trend === 'improving') return <span className="flex items-center gap-0.5 text-emerald-600 text-xs"><TrendingUp className="h-3 w-3" />改善中</span>;
  if (trend === 'worsening' || trend === 'declining') return <span className="flex items-center gap-0.5 text-rose-600 text-xs"><TrendingDown className="h-3 w-3" />需关注</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="h-3 w-3" />稳定</span>;
}

// ==================== 家长每日观察提交卡片 ====================
function DailyObservationCard({ studentId, onSubmitted }: { studentId: string; onSubmitted: () => void }) {
  const [sleep, setSleep] = useState<SleepQuality>('normal');
  const [diet, setDiet] = useState<DietQuality>('normal');
  const [energy, setEnergy] = useState<EnergyLevel>('normal');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post('/health/observations', {
        studentId,
        observationDate: today,
        sleepQuality: sleep,
        dietQuality: diet,
        energyLevel: energy,
        note: note || undefined,
      });
      if (res.success) {
        setSubmitted(true);
        onSubmitted();
        setTimeout(() => setSubmitted(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const options3 = (current: string, setter: (v: never) => void, items: { value: string; label: string; icon: React.ReactNode; color: string }[]) => (
    <div className="flex gap-2">
      {items.map(item => (
        <button
          key={item.value}
          onClick={() => setter(item.value as never)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg border-2 py-2 text-xs font-medium transition-all ${
            current === item.value
              ? `${item.color} border-current shadow-sm`
              : 'border-border text-muted-foreground hover:border-muted-foreground/30'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 p-2 text-white">
          <Sun className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-foreground">今日观察</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{today}</span>
      </div>

      {/* 睡眠 */}
      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Moon className="h-3.5 w-3.5" /> 睡眠情况
        </label>
        {options3(sleep, setSleep as (v: never) => void, [
          { value: 'sufficient', label: '充足', icon: <Check className="h-3 w-3" />, color: 'text-emerald-600 bg-emerald-50' },
          { value: 'normal', label: '一般', icon: <Minus className="h-3 w-3" />, color: 'text-amber-600 bg-amber-50' },
          { value: 'insufficient', label: '不足', icon: <AlertTriangle className="h-3 w-3" />, color: 'text-rose-600 bg-rose-50' },
        ])}
      </div>

      {/* 饮食 */}
      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Apple className="h-3.5 w-3.5" /> 饮食情况
        </label>
        {options3(diet, setDiet as (v: never) => void, [
          { value: 'balanced', label: '均衡', icon: <Check className="h-3 w-3" />, color: 'text-emerald-600 bg-emerald-50' },
          { value: 'normal', label: '一般', icon: <Minus className="h-3 w-3" />, color: 'text-amber-600 bg-amber-50' },
          { value: 'overeating', label: '暴食', icon: <AlertTriangle className="h-3 w-3" />, color: 'text-rose-600 bg-rose-50' },
        ])}
      </div>

      {/* 精神 */}
      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Sunset className="h-3.5 w-3.5" /> 精神状态
        </label>
        {options3(energy, setEnergy as (v: never) => void, [
          { value: 'energetic', label: '充沛', icon: <Check className="h-3 w-3" />, color: 'text-emerald-600 bg-emerald-50' },
          { value: 'normal', label: '正常', icon: <Minus className="h-3 w-3" />, color: 'text-amber-600 bg-amber-50' },
          { value: 'tired', label: '疲惫', icon: <AlertTriangle className="h-3 w-3" />, color: 'text-rose-600 bg-rose-50' },
        ])}
      </div>

      {/* 补充 */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="补充说明（选填）..."
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none"
        rows={2}
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || submitted}
        className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium text-white transition-all ${
          submitted
            ? 'bg-emerald-500'
            : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md shadow-teal-500/20'
        }`}
      >
        {submitted ? <><Check className="h-4 w-4" /> 已提交</> : <><Send className="h-4 w-4" /> 提交观察</>}
      </button>
    </div>
  );
}

// ==================== 主页面 ====================
export default function ParentHealthPage() {
  const { user } = useAuth();
  const [portrait, setPortrait] = useState<StudentHealthPortrait | null>(null);
  const [observations, setObservations] = useState<ParentDailyObservation[]>([]);
  const [prescription, setPrescription] = useState<HealthPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取家长关联的子女信息
      const childrenRes = await apiClient.get<{ id: string; name: string; classId: string; className: string }[]>(`/parent/children`);
      const children = childrenRes.data || [];
      if (children.length > 0) {
        // 取第一个子女（如果有多个子女需要切换功能可以后续扩展）
        const child = children[0];
        const sid = child.id;
        setStudentId(sid);
        // 并行加载数据
        const [portraitRes, obsRes, prescRes] = await Promise.all([
          apiClient.get<StudentHealthPortrait>(`/health/portraits?studentId=${sid}`),
          apiClient.get<ParentDailyObservation[]>(`/health/observations?studentId=${sid}&days=30`),
          apiClient.get<HealthPrescription>(`/health/prescriptions?studentId=${sid}&status=active`),
        ]);
        if (portraitRes.success) setPortrait(portraitRes.data ?? null);
        if (obsRes.success) setObservations(obsRes.data || []);
        if (prescRes.success) setPrescription(prescRes.data ?? null);
      }
    } catch (err) {
      console.error('[ParentHealthPage] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const overallScore = portrait?.overallHealthScore ?? 0;
  const overallStatus = portrait?.overallStatus;

  const statusMap: Record<string, { label: string; color: string; desc: string }> = {
    excellent: { label: '优秀', color: '#10b981', desc: '孩子健康状况非常好！' },
    good: { label: '良好', color: '#14b8a6', desc: '孩子健康状况良好' },
    attention: { label: '需关注', color: '#f59e0b', desc: '部分指标需要关注' },
    warning: { label: '预警', color: '#ef4444', desc: '建议尽快咨询校医' },
  };

  const currentStatus = statusMap[overallStatus || 'good'] || statusMap.good;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Activity className="mx-auto mb-3 h-8 w-8 animate-pulse text-teal-500" />
          <p>加载健康数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 pb-6 pt-6">
        <div className="mx-auto max-w-lg px-5">
          <div className="flex items-center gap-3 text-white">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">体育健康</h1>
              <p className="text-xs text-white/70">AI智能健康画像 · 膳食与运动处方</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 py-4">
        {/* 综合健康分卡片 */}
        <div className="-mt-2 rounded-2xl border border-border bg-card p-5 shadow-lg">
          <div className="flex items-center gap-5">
            <ScoreRing
              score={overallScore}
              size={90}
              label="综合健康分"
              icon={<Heart className="h-4 w-4" />}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {currentStatus.label}
                </span>
                <TrendBadge trend={portrait?.bmiTrend} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{currentStatus.desc}</p>
              {portrait?.aiSummary && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {portrait.aiSummary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 维度评分 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3">
            <Moon className="mb-1 h-4 w-4 text-indigo-500" />
            <span className="text-lg font-bold text-foreground">{portrait?.sleepScore ?? '-'}</span>
            <span className="text-[10px] text-muted-foreground">睡眠评分</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3">
            <Apple className="mb-1 h-4 w-4 text-emerald-500" />
            <span className="text-lg font-bold text-foreground">{portrait?.dietScore ?? '-'}</span>
            <span className="text-[10px] text-muted-foreground">饮食评分</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-3">
            <Dumbbell className="mb-1 h-4 w-4 text-amber-500" />
            <span className="text-lg font-bold text-foreground">{portrait?.exerciseHabitScore ?? '-'}</span>
            <span className="text-[10px] text-muted-foreground">运动评分</span>
          </div>
        </div>

        {/* 标签 */}
        {(portrait?.riskFactors?.length || portrait?.strengths?.length) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(portrait?.riskFactors || []).map(r => (
              <span key={r} className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600">
                ⚠ {r}
              </span>
            ))}
            {(portrait?.strengths || []).map(s => (
              <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                ✓ {s}
              </span>
            ))}
          </div>
        )}

        {/* 健康处方 */}
        {prescription && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-2 text-white">
                <Pill className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI健康处方</h3>
                <p className="text-[10px] text-muted-foreground">
                  {prescription.periodStart} ~ {prescription.periodEnd}
                </p>
              </div>
              <Sparkles className="ml-auto h-4 w-4 text-primary" />
            </div>

            {prescription.dailyCaloriesTarget && (
              <div className="mb-3 rounded-lg bg-amber-50 p-3">
                <span className="text-xs text-amber-700">每日建议摄入</span>
                <span className="ml-2 text-sm font-bold text-amber-800">{prescription.dailyCaloriesTarget} kcal</span>
              </div>
            )}

            {prescription.exerciseType && (
              <div className="mb-3 rounded-lg bg-teal-50 p-3">
                <span className="text-xs text-teal-700">推荐运动</span>
                <span className="ml-2 text-sm font-bold text-teal-800">{prescription.exerciseType}</span>
                {prescription.exerciseFrequency && (
                  <span className="ml-1 text-xs text-teal-600">每周{prescription.exerciseFrequency}次</span>
                )}
                {prescription.exerciseDurationMin && (
                  <span className="ml-1 text-xs text-teal-600">每次{prescription.exerciseDurationMin}分钟</span>
                )}
              </div>
            )}

            {prescription.exerciseNotes && (
              <p className="text-xs text-muted-foreground">{prescription.exerciseNotes}</p>
            )}
          </div>
        )}

        {/* 每日观察提交 */}
        {studentId && (
          <div className="mt-6">
            <DailyObservationCard studentId={studentId} onSubmitted={loadData} />
          </div>
        )}

        {/* 近期观察记录 */}
        {observations.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="h-4 w-4 text-muted-foreground" /> 近期观察记录
            </h3>
            <div className="space-y-2">
              {observations.slice(0, 7).map(obs => (
                <div key={obs.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-xs">
                  <span className="text-muted-foreground">{obs.observationDate}</span>
                  <span className={obs.sleepQuality === 'sufficient' ? 'text-emerald-600' : obs.sleepQuality === 'insufficient' ? 'text-rose-600' : 'text-amber-600'}>
                    🌙 {obs.sleepQuality === 'sufficient' ? '充足' : obs.sleepQuality === 'insufficient' ? '不足' : '一般'}
                  </span>
                  <span className={obs.dietQuality === 'balanced' ? 'text-emerald-600' : obs.dietQuality === 'overeating' ? 'text-rose-600' : 'text-amber-600'}>
                    🍎 {obs.dietQuality === 'balanced' ? '均衡' : obs.dietQuality === 'overeating' ? '暴食' : '一般'}
                  </span>
                  <span className={obs.energyLevel === 'energetic' ? 'text-emerald-600' : obs.energyLevel === 'tired' ? 'text-rose-600' : 'text-amber-600'}>
                    ⚡ {obs.energyLevel === 'energetic' ? '充沛' : obs.energyLevel === 'tired' ? '疲惫' : '正常'}
                  </span>
                  {obs.note && <span className="flex-1 truncate text-muted-foreground">{obs.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部说明 */}
        <div className="mt-8 rounded-xl bg-muted/30 p-4">
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>
              健康画像和处方由AI基于体质数据、家长观察等多数据源综合生成，仅供参考。
              建议结合校医和体育老师专业判断，为孩子提供更精准的健康指导。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
