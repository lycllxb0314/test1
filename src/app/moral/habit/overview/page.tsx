'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Award,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Download,
  RefreshCw,
  LineChart,
  ChevronUp,
  ChevronDown,
  Medal,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';
import {
  useSchoolHabitStats,
} from '@/hooks/useHabitData';

// 习惯类别图标映射
const habitIcons: Record<HabitCategory, React.ElementType> = {
  civilization: Heart,
  writing: Pen,
  reading: BookOpen,
  sports: Trophy,
  safety: Shield,
  hygiene: Sparkles,
  aesthetic: Palette,
  labor: Hammer,
};

// 简易柱状图组件
function SimpleBarChart({ data, height = 120 }: { data: Array<{ label: string; value: number; color?: string }>; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full rounded-t transition-all duration-300"
            style={{ 
              height: `${(item.value / maxValue) * 100}%`,
              minHeight: '4px',
              backgroundColor: item.color || '#10b981'
            }}
          />
          <span className="text-xs text-muted-foreground truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// 趋势折线图组件
function TrendChart({ data, height = 80 }: { data: Array<{ month: string; rate: number }>; height?: number }) {
  const maxRate = Math.max(...data.map(d => d.rate), 100);
  const minRate = Math.min(...data.map(d => d.rate), 0);
  const range = maxRate - minRate || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.rate - minRate) / range) * 100;
    return { x, y, ...d };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* 网格线 */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        {/* 趋势线 */}
        <path
          d={pathD}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* 数据点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#10b981"
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>
      {/* X轴标签 */}
      <div className="flex justify-between mt-1">
        {data.slice(0, 4).map((d, i) => (
          <span key={i} className="text-xs text-muted-foreground">{d.month}</span>
        ))}
      </div>
    </div>
  );
}

// 模拟数据
const monthlyTrend = [
  { month: '9月', rate: 78.2, stars: 142 },
  { month: '10月', rate: 80.5, stars: 156 },
  { month: '11月', rate: 82.1, stars: 164 },
  { month: '12月', rate: 83.8, stars: 172 },
  { month: '1月', rate: 84.5, stars: 178 },
  { month: '2月', rate: 85.2, stars: 182 },
  { month: '3月', rate: 86.3, stars: 186 },
];

const classRanking = [
  { rank: 1, name: '四(1)班', rate: 92.5, stars: 8, trend: 'up' as const },
  { rank: 2, name: '三(2)班', rate: 91.8, stars: 7, trend: 'up' as const },
  { rank: 3, name: '五(3)班', rate: 90.2, stars: 7, trend: 'stable' as const },
  { rank: 4, name: '六(2)班', rate: 89.5, stars: 6, trend: 'up' as const },
  { rank: 5, name: '二(1)班', rate: 88.3, stars: 5, trend: 'down' as const },
];

const gradeComparison = [
  { label: '一年级', value: 82.5, color: '#f97316' },
  { label: '二年级', value: 84.2, color: '#eab308' },
  { label: '三年级', value: 86.8, color: '#84cc16' },
  { label: '四年级', value: 89.5, color: '#10b981' },
  { label: '五年级', value: 87.3, color: '#06b6d4' },
  { label: '六年级', value: 85.1, color: '#8b5cf6' },
];

export default function HabitOverviewPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null);
  
  // 使用Hook获取数据
  const { data: statsData, loading, error, refetch } = useSchoolHabitStats();
  
  // 解构数据
  const schoolOverview = statsData?.overview || {
    totalStudents: 2800,
    totalClasses: 48,
    totalTeachers: 120,
    averageRate: 85.6,
    rateChange: 2.3,
    habitStars: 186,
    starsChange: 8,
    attentionStudents: 45,
    attentionChange: -5,
    monthlyEvaluations: 1250,
    goalsCompletion: 78.5,
  };
  
  const habitCategoryData = statsData?.categoryStats || [];
  const gradeData = statsData?.gradeStats || [];
  
  // 构建类别柱状图数据
  const categoryChartData = (habitCategoryData.length > 0 ? habitCategoryData : [
    { category: 'civilization', rate: 88.5 },
    { category: 'writing', rate: 82.3 },
    { category: 'reading', rate: 91.2 },
    { category: 'sports', rate: 79.8 },
    { category: 'safety', rate: 95.1 },
    { category: 'hygiene', rate: 87.6 },
    { category: 'aesthetic', rate: 76.4 },
    { category: 'labor', rate: 83.9 },
  ]).map(c => ({
    label: habitCategoryNames[c.category as HabitCategory]?.slice(0, 2) || c.category.slice(0, 2),
    value: c.rate,
    color: '#10b981',
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-green-50/30 min-h-screen">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
            <Star className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">全校统计看板</h1>
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm">
                八大行为习惯
              </Badge>
            </div>
            <p className="text-gray-500 mt-0.5">龙岩师范附属小学德育特色 · 全校习惯养成情况总览</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <RefreshCw className="h-3 w-3 animate-spin text-gray-500" />
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-700">数据已同步</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            导出报告
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-green-100 text-sm">全校达成率</span>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">+{schoolOverview.rateChange}%</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-1">{schoolOverview.averageRate}%</div>
            <div className="text-green-100 text-xs">较上月提升 {schoolOverview.rateChange} 个百分点</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">在校学生</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{schoolOverview.totalStudents.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">{schoolOverview.totalClasses}个班级</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">习惯之星</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-600">{schoolOverview.habitStars}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>较上月 +{schoolOverview.starsChange}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">关注学生</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600">{schoolOverview.attentionStudents}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowDownRight className="h-3 w-3" />
              <span>较上月 {schoolOverview.attentionChange}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">月度评价</span>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{schoolOverview.monthlyEvaluations}</div>
            <div className="text-xs text-gray-400 mt-1">本月评价总数</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 八大习惯达成率 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-green-600" />
              八大习惯达成率
            </CardTitle>
            <CardDescription>各习惯类别达成情况对比</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={categoryChartData} height={140} />
          </CardContent>
        </Card>

        {/* 月度趋势 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="h-4 w-4 text-green-600" />
              月度达成率趋势
            </CardTitle>
            <CardDescription>近7个月全校达成率变化</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={monthlyTrend} height={120} />
          </CardContent>
        </Card>

        {/* 年级对比 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              年级达成率对比
            </CardTitle>
            <CardDescription>各年级习惯养成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={gradeComparison} height={140} />
          </CardContent>
        </Card>
      </div>

      {/* 排行榜与预警 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 班级排行 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="h-4 w-4 text-amber-500" />
              班级达成率排行
            </CardTitle>
            <CardDescription>本月表现优秀的班级</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">排名</TableHead>
                  <TableHead>班级</TableHead>
                  <TableHead className="text-right">达成率</TableHead>
                  <TableHead className="text-right">之星</TableHead>
                  <TableHead className="w-16">趋势</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classRanking.map((cls) => (
                  <TableRow key={cls.rank}>
                    <TableCell>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        cls.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        cls.rank === 2 ? 'bg-gray-100 text-gray-600' :
                        cls.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {cls.rank}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-green-600">{cls.rate}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{cls.stars}</Badge>
                    </TableCell>
                    <TableCell>
                      {cls.trend === 'up' ? (
                        <ChevronUp className="h-4 w-4 text-green-600" />
                      ) : cls.trend === 'down' ? (
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 习惯之星榜单 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              习惯之星榜单
            </CardTitle>
            <CardDescription>本月表现优秀的学生</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: '李小明', class: '四(1)班', achievements: '全习惯达标', score: 98 },
                { name: '张小红', class: '三(2)班', achievements: '阅读之星', score: 95 },
                { name: '王小刚', class: '五(3)班', achievements: '劳动之星', score: 93 },
                { name: '赵小芳', class: '四(4)班', achievements: '文明之星', score: 91 },
              ].map((student, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                    idx === 2 ? 'bg-orange-400 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-xs text-muted-foreground">{student.class}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{student.achievements}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">{student.score}</span>
                    <span className="text-xs text-muted-foreground"> 分</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              查看完整榜单
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              <span>习惯之星评选</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <span>预警管理</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <span>评价录入</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Download className="h-6 w-6 text-green-500" />
              <span>导出报告</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
