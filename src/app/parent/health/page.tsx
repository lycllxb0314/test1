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
  PortraitDetailedAnalysis,
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
  Target,
  Utensils,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Flame,
  Clock as ClockIcon,
} from 'lucide-react';

// ==================== 评分环组件 ====================
function ScoreRing({ score, size = 80, label, icon }: {
  score: number; size?: number; label: string; icon?: React.ReactNode;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const strokeDash = circumference * progress;
  const color = score >= 80 ? '#10b981' : score >= 65 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#ef4444';

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

// ==================== 雷达图组件 ====================
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 180;
  const center = size / 2;
  const radius = 65;
  const levels = 4;

  const angleStep = (2 * Math.PI) / data.length;
  const points = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (d.value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });

  const levelRings = Array.from({ length: levels }, (_, i) => (i + 1) * (radius / levels));
  const axisLines = data.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x2: center + radius * Math.cos(angle), y2: center + radius * Math.sin(angle) };
  });

  return (
    <svg width={size} height={size} className="overflow-visible">
      {levelRings.map((r, i) => (
        <circle key={i} cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth={0.5} className="text-muted/30" />
      ))}
      {axisLines.map((line, i) => (
        <line key={i} x1={center} y1={center} x2={line.x2} y2={line.y2} stroke="currentColor" strokeWidth={0.5} className="text-muted/30" />
      ))}
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(20, 184, 166, 0.2)"
        stroke="#14b8a6"
        strokeWidth={2}
      />
      {data.map((d, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = radius + 18;
        return (
          <text
            key={d.label}
            x={center + labelR * Math.cos(angle)}
            y={center + labelR * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ==================== 评分条组件 ====================
function ScoreBar({ score, label, icon }: { score: number; label: string; icon: React.ReactNode }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-teal-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{score}</span>
        </div>
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

// ==================== 维度分析卡片 ====================
function DimensionAnalysisCard({
  title,
  icon,
  analysis,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  analysis?: { status?: string; level?: string; pattern?: string; analysis?: string; suggestion?: string };
  color: 'emerald' | 'blue' | 'amber' | 'rose';
}) {
  const colorClasses = {
    emerald: 'border-emerald-200 bg-emerald-50/50',
    blue: 'border-blue-200 bg-blue-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    rose: 'border-rose-200 bg-rose-50/50',
  };

  if (!analysis) return null;
  const statusLabel = analysis.status || analysis.level || analysis.pattern || '';

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground scale-90">{icon}</div>
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
        {statusLabel && <span className="text-[10px] text-muted-foreground ml-auto">{statusLabel}</span>}
      </div>
      {analysis.analysis && (
        <div className="text-xs text-foreground mb-1.5">{analysis.analysis}</div>
      )}
      {analysis.suggestion && (
        <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
          <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
          <span>{analysis.suggestion}</span>
        </div>
      )}
    </div>
  );
}

// ==================== 运动强度环组件 ====================
function ExerciseRing({ frequency, duration, intensity }: { frequency: number; duration: number; intensity: string }) {
  const size = 100;
  const center = size / 2;
  const radius = 40;

  const freqProgress = Math.min(frequency / 7, 1);
  const durProgress = Math.min(duration / 60, 1);
  const intensityColors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const intensityColor = intensityColors[intensity] || intensityColors.medium;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/20" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={intensityColor} strokeWidth={6}
          strokeDasharray={`${(freqProgress * 0.7 + durProgress * 0.3) * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Flame className="h-4 w-4 mb-0.5" style={{ color: intensityColor }} />
        <span className="text-sm font-bold">{frequency}次/周</span>
        <span className="text-[10px] text-muted-foreground">{duration}分钟/次</span>
      </div>
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
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const childrenRes = await apiClient.get<{ id: string; name: string; classId: string; className: string }[]>(`/parent/children`);
      const children = childrenRes.data || [];
      if (children.length > 0) {
        const child = children[0];
        const sid = child.id;
        setStudentId(sid);
        setStudentName(child.name);
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

  const radarData = [
    { label: '睡眠', value: portrait?.sleepScore ?? 70 },
    { label: '饮食', value: portrait?.dietScore ?? 70 },
    { label: '运动', value: portrait?.exerciseHabitScore ?? 70 },
    { label: '体质', value: portrait?.fitnessLevel === 'excellent' ? 95 : portrait?.fitnessLevel === 'good' ? 80 : portrait?.fitnessLevel === 'pass' ? 60 : 40 },
    { label: 'BMI', value: portrait?.bmiStatus === 'normal' ? 100 : portrait?.bmiStatus === 'overweight' || portrait?.bmiStatus === 'underweight' ? 60 : 40 },
  ];

  const formatIntensity = (intensity?: string) => {
    const map: Record<string, string> = { high: '高强度', medium: '中等', low: '低强度' };
    return map[intensity || ''] || intensity || '中等';
  };

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

      <div className="mx-auto max-w-lg px-5 py-4 space-y-4">
        {/* 学生信息头部 */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{studentName || '学生'}</h2>
            <p className="text-xs text-muted-foreground">{currentStatus.label} · 综合健康分</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: currentStatus.color }}>{overallScore}</div>
          </div>
        </div>

        {/* AI 综合摘要 */}
        {portrait?.aiSummary && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium text-sm">AI 健康评价</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground">{portrait.aiSummary}</p>
          </div>
        )}

        {/* 五维雷达图 + 评分条 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-4 rounded-xl border border-border bg-card">
            <h3 className="text-xs font-medium mb-3 text-muted-foreground">五维健康画像</h3>
            <RadarChart data={radarData} />
          </div>
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">各项评分</h3>
            <ScoreBar score={portrait?.sleepScore ?? 70} label="睡眠质量" icon={<Moon className="h-3.5 w-3.5" />} />
            <ScoreBar score={portrait?.dietScore ?? 70} label="饮食状况" icon={<Utensils className="h-3.5 w-3.5" />} />
            <ScoreBar score={portrait?.exerciseHabitScore ?? 70} label="运动习惯" icon={<Dumbbell className="h-3.5 w-3.5" />} />
            <ScoreBar score={radarData[3].value} label="体质水平" icon={<Activity className="h-3.5 w-3.5" />} />
            <ScoreBar score={radarData[4].value} label="BMI指数" icon={<Target className="h-3.5 w-3.5" />} />
          </div>
        </div>

        {/* 详细维度分析 */}
        {portrait?.detailedAnalysis && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              详细健康分析
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DimensionAnalysisCard title="BMI分析" icon={<Target className="h-3.5 w-3.5" />} analysis={portrait.detailedAnalysis.bmi} color="emerald" />
              <DimensionAnalysisCard title="体质分析" icon={<Activity className="h-3.5 w-3.5" />} analysis={portrait.detailedAnalysis.fitness} color="blue" />
              <DimensionAnalysisCard title="睡眠分析" icon={<Moon className="h-3.5 w-3.5" />} analysis={portrait.detailedAnalysis.sleep} color="amber" />
              <DimensionAnalysisCard title="饮食分析" icon={<Utensils className="h-3.5 w-3.5" />} analysis={portrait.detailedAnalysis.diet} color="rose" />
            </div>
            <DimensionAnalysisCard title="运动分析" icon={<Dumbbell className="h-3.5 w-3.5" />} analysis={portrait.detailedAnalysis.exercise} color="blue" />
          </div>
        )}

        {/* 风险与优势 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <h3 className="text-xs font-medium text-rose-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> 需关注风险
            </h3>
            {(portrait?.riskFactors?.length ?? 0) > 0 ? (
              <ul className="space-y-1">
                {portrait!.riskFactors!.map(r => (
                  <li key={r} className="text-xs text-rose-600 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-rose-400" /> {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">暂无明显风险</p>
            )}
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <h3 className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 健康优势
            </h3>
            {(portrait?.strengths?.length ?? 0) > 0 ? (
              <ul className="space-y-1">
                {portrait!.strengths!.map(s => (
                  <li key={s} className="text-xs text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">暂无明显优势记录</p>
            )}
          </div>
        </div>

        {/* 改进建议 */}
        {portrait?.improvementSuggestions && portrait.improvementSuggestions.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
            <h3 className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" /> 改进建议
            </h3>
            <ul className="space-y-1">
              {portrait.improvementSuggestions.map((s, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 健康处方 */}
        {prescription && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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

            {/* AI摘要 */}
            {prescription.aiSummary && (
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground leading-relaxed">{prescription.aiSummary}</p>
              </div>
            )}

            {/* 饮食禁忌 */}
            {prescription.dietTaboos && prescription.dietTaboos.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                <h4 className="text-xs font-medium text-rose-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> 饮食禁忌
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {prescription.dietTaboos.map(t => (
                    <span key={t} className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-600">{t}</span>
                  ))}
                </div>
                {prescription.dietTabooReasons && prescription.dietTabooReasons.length > 0 && (
                  <p className="mt-2 text-[10px] text-rose-600/80">{prescription.dietTabooReasons.join('；')}</p>
                )}
              </div>
            )}

            {/* 营养目标 */}
            {prescription.nutritionAdvice && (
              <div className="mb-4 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Apple className="h-4 w-4 text-emerald-500" />
                  <span>营养目标</span>
                </div>
                {prescription.dailyCaloriesTarget && (
                  <div className="mb-2 flex items-center gap-2 p-2 rounded bg-amber-50">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-amber-700">每日热量目标：</span>
                    <span className="text-sm font-bold text-amber-800">{prescription.dailyCaloriesTarget} kcal</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-emerald-50">
                    <span className="text-emerald-700 font-medium">蛋白质：</span>
                    <span>{prescription.nutritionAdvice.protein?.description ?? prescription.nutritionAdvice.protein?.target ? `${prescription.nutritionAdvice.protein?.target}${prescription.nutritionAdvice.protein?.unit ?? ''}` : '-'}</span>
                  </div>
                  <div className="p-2 rounded bg-blue-50">
                    <span className="text-blue-700 font-medium">碳水：</span>
                    <span>{prescription.nutritionAdvice.carbs?.description ?? prescription.nutritionAdvice.carbs?.target ? `${prescription.nutritionAdvice.carbs?.target}${prescription.nutritionAdvice.carbs?.unit ?? ''}` : '-'}</span>
                  </div>
                  <div className="p-2 rounded bg-rose-50">
                    <span className="text-rose-700 font-medium">脂肪：</span>
                    <span>{prescription.nutritionAdvice.fat?.description ?? prescription.nutritionAdvice.fat?.target ? `${prescription.nutritionAdvice.fat?.target}${prescription.nutritionAdvice.fat?.unit ?? ''}` : '-'}</span>
                  </div>
                  <div className="p-2 rounded bg-cyan-50">
                    <span className="text-cyan-700 font-medium">饮水：</span>
                    <span>{prescription.nutritionAdvice.hydrationAdvice ?? '适量饮水'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 膳食建议 */}
            {prescription.mealSuggestions && (
              <div className="mb-4 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Utensils className="h-4 w-4 text-amber-500" />
                  <span>每日膳食建议</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '早餐', value: prescription.mealSuggestions.breakfast, icon: Sun, color: 'bg-amber-50' },
                    { label: '午餐', value: prescription.mealSuggestions.lunch, icon: Utensils, color: 'bg-emerald-50' },
                    { label: '晚餐', value: prescription.mealSuggestions.dinner, icon: Moon, color: 'bg-blue-50' },
                    { label: '加餐', value: prescription.mealSuggestions.snacks, icon: Apple, color: 'bg-rose-50' },
                  ].filter(item => item.value).map(item => (
                    <div key={item.label} className={`rounded-lg ${item.color} p-2.5`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <item.icon className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-xs">{item.label}</span>
                      </div>
                      <p className="text-[11px] text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {prescription.mealSuggestions.cookingTips && (
                  <div className="mt-2 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
                    <Lightbulb className="inline h-3 w-3 text-amber-500 mr-1" />
                    烹饪建议：{prescription.mealSuggestions.cookingTips}
                  </div>
                )}
              </div>
            )}

            {/* 运动处方 */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                <span>运动处方</span>
              </div>
              <div className="flex items-center gap-4">
                <ExerciseRing
                  frequency={prescription.exerciseFrequency ?? 3}
                  duration={prescription.exerciseDurationMin ?? 30}
                  intensity={prescription.exerciseIntensity ?? 'medium'}
                />
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                      <div className="text-xs font-medium">{prescription.exerciseType || '有氧运动'}</div>
                      <div className="text-[10px] text-muted-foreground">运动类型</div>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                      <div className="text-xs font-medium">{prescription.exerciseFrequency ?? '-'} 次/周</div>
                      <div className="text-[10px] text-muted-foreground">运动频率</div>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                      <div className="text-xs font-medium">{prescription.exerciseDurationMin ?? '-'} 分钟</div>
                      <div className="text-[10px] text-muted-foreground">每次时长</div>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                      <div className="text-xs font-medium">{formatIntensity(prescription.exerciseIntensity)}</div>
                      <div className="text-[10px] text-muted-foreground">运动强度</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 运动计划详情 */}
              {prescription.exercisePlan && (
                <div className="mt-3 rounded-lg bg-blue-50/50 p-3">
                  <h4 className="text-xs font-medium text-blue-700 mb-2">详细运动计划</h4>
                  <div className="space-y-1.5 text-xs">
                    {prescription.exercisePlan.warmUp && (
                      <div className="rounded bg-white/50 p-1.5">
                        <span className="text-blue-600 font-medium">热身：</span>
                        <span>{prescription.exercisePlan.warmUp}</span>
                      </div>
                    )}
                    {prescription.exercisePlan.mainExercise && (
                      <div className="rounded bg-white/50 p-1.5">
                        <span className="text-blue-600 font-medium">主要内容：</span>
                        <span>{prescription.exercisePlan.mainExercise}</span>
                      </div>
                    )}
                    {prescription.exercisePlan.coolDown && (
                      <div className="rounded bg-white/50 p-1.5">
                        <span className="text-blue-600 font-medium">放松：</span>
                        <span>{prescription.exercisePlan.coolDown}</span>
                      </div>
                    )}
                    {prescription.exercisePlan.weeklySchedule && (
                      <div className="rounded bg-white/50 p-1.5">
                        <span className="text-blue-600 font-medium">一周安排：</span>
                        <span>{prescription.exercisePlan.weeklySchedule}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {prescription.exerciseNotes && (
                <div className="mt-2 p-2 rounded bg-amber-50 text-[10px] text-amber-700">
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  注意事项：{prescription.exerciseNotes}
                </div>
              )}
            </div>

            {/* 预期效果 */}
            {prescription.expectedOutcomes && (
              <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50/30">
                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">预期改善效果</span>
                </div>
                <p className="text-xs text-foreground">{prescription.expectedOutcomes}</p>
              </div>
            )}
          </div>
        )}

        {/* 每日观察提交 */}
        {studentId && (
          <DailyObservationCard studentId={studentId} onSubmitted={loadData} />
        )}

        {/* 近期观察记录 */}
        {observations.length > 0 && (
          <div>
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
        <div className="rounded-xl bg-muted/30 p-4">
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
