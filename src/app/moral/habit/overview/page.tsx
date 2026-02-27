'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';
import {
  useSchoolHabitStats,
  habitCategoryNames as hookCategoryNames,
  habitCategoryColors as hookCategoryColors,
  type HabitCategory as HookHabitCategory,
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

// 月度趋势模拟数据（TODO: 从API获取）
const monthlyTrend = [
  { month: '9月', rate: 78.2, stars: 142 },
  { month: '10月', rate: 80.5, stars: 156 },
  { month: '11月', rate: 82.1, stars: 164 },
  { month: '12月', rate: 83.8, stars: 172 },
  { month: '1月', rate: 84.5, stars: 178 },
  { month: '2月', rate: 85.2, stars: 182 },
  { month: '3月', rate: 86.3, stars: 186 },
];

// 预警班级模拟数据（TODO: 从API获取）
const alertClasses = [
  { id: 'c601', name: '六(1)班', teacher: '张老师', issue: '运动习惯下降明显', rate: 72.3, change: -5.2 },
  { id: 'c102', name: '一(2)班', teacher: '李老师', issue: '书写习惯待提升', rate: 75.8, change: -2.1 },
  { id: 'c205', name: '二(5)班', teacher: '王老师', issue: '审美习惯达标率低', rate: 68.5, change: -1.8 },
];

// 近期优秀学生模拟数据（TODO: 从API获取）
const outstandingStudents = [
  { name: '李小明', grade: '四年级', class: '四(1)班', achievements: '全习惯达标·阅读之星', avatar: '' },
  { name: '张小红', grade: '三年级', class: '三(2)班', achievements: '7项习惯优秀', avatar: '' },
  { name: '王小刚', grade: '五年级', class: '五(3)班', achievements: '劳动习惯突出', avatar: '' },
  { name: '赵小芳', grade: '四年级', class: '四(4)班', achievements: '文明习惯优秀', avatar: '' },
];

export default function HabitOverviewPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null);
  
  // 使用Hook获取数据
  const { data: statsData, loading, error, refetch } = useSchoolHabitStats();
  
  // 解构数据
  const schoolOverview = statsData?.overview || {
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    averageRate: 0,
    rateChange: 0,
    habitStars: 0,
    starsChange: 0,
    attentionStudents: 0,
    attentionChange: 0,
    monthlyEvaluations: 0,
    goalsCompletion: 0,
  };
  
  const habitCategoryData = statsData?.categoryStats || [];
  const gradeData = statsData?.gradeStats || [];
  
  // 计算习惯之星排行
  const habitStarRanking = gradeData
    .map((g, idx) => ({
      rank: idx + 1,
      grade: g.grade,
      students: g.stars,
      rate: g.students > 0 ? parseFloat(((g.stars / g.students) * 100).toFixed(1)) : 0,
      trend: g.trend,
    }))
    .sort((a, b) => b.students - a.students);

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
              <h1 className="text-2xl font-bold text-gray-900">全校总览</h1>
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
        {/* 总体达成率 */}
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

        {/* 学生总数 */}
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

        {/* 习惯之星 */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">习惯之星</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{schoolOverview.habitStars}</span>
              <span className="text-sm text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                +{schoolOverview.starsChange}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">占比 {((schoolOverview.habitStars / schoolOverview.totalStudents) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>

        {/* 需关注学生 */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-400">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">需关注学生</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{schoolOverview.attentionStudents}</span>
              <span className="text-sm text-green-600 flex items-center">
                <ArrowDownRight className="h-3 w-3" />
                {schoolOverview.attentionChange}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">较上月减少 {Math.abs(schoolOverview.attentionChange)} 人</div>
          </CardContent>
        </Card>

        {/* 本月评价 */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">本月评价次数</span>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{schoolOverview.monthlyEvaluations.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">人均 {((schoolOverview.monthlyEvaluations / schoolOverview.totalStudents) * 10).toFixed(1)} 条</div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：核心数据 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 八大习惯雷达 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-green-600" />
                    八大习惯达成情况
                  </CardTitle>
                  <CardDescription>全校各习惯类别达成率及趋势分析</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> 上升
                    <span className="w-2 h-2 rounded-full bg-gray-400 ml-2" /> 持平
                    <span className="w-2 h-2 rounded-full bg-red-500 ml-2" /> 下降
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {habitCategoryData.map((item) => {
                  const Icon = habitIcons[item.category];
                  return (
                    <div
                      key={item.category}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                        item.rate >= 85 ? 'border-green-200 bg-green-50/50' :
                        item.rate >= 75 ? 'border-blue-200 bg-blue-50/50' :
                        'border-orange-200 bg-orange-50/50'
                      }`}
                      onClick={() => setSelectedCategory(item.category)}
                    >
                      {/* 趋势指示器 */}
                      <div className={`absolute -top-1 -right-1 p-1 rounded-full ${
                        item.trend === 'up' ? 'bg-green-500' :
                        item.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                      }`}>
                        {item.trend === 'up' ? <TrendingUp className="h-3 w-3 text-white" /> :
                         item.trend === 'down' ? <TrendingDown className="h-3 w-3 text-white" /> :
                         <Minus className="h-3 w-3 text-white" />}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div className={`p-2.5 rounded-xl ${habitCategoryColors[item.category]} mb-2 shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 mb-1">{habitCategoryNames[item.category]}</span>
                        <span className={`text-2xl font-bold ${
                          item.rate >= 85 ? 'text-green-600' :
                          item.rate >= 75 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {item.rate}%
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          {item.change > 0 ? (
                            <span className="text-xs text-green-600">+{item.change}%</span>
                          ) : item.change < 0 ? (
                            <span className="text-xs text-red-600">{item.change}%</span>
                          ) : (
                            <span className="text-xs text-gray-400">持平</span>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>优:{item.topGrade || '-'}</span>
                            <span>弱:{item.weakGrade || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 年级对比分析 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    年级对比分析
                  </CardTitle>
                  <CardDescription>各年级习惯养成达成率横向对比</CardDescription>
                </div>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {gradeData.map(g => (
                      <SelectItem key={g.grade} value={g.grade}>{g.grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gradeData.map((grade, idx) => (
                  <div key={grade.grade} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="w-16 font-medium">{grade.grade}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Progress value={grade.avgRate} className="flex-1 h-2.5" />
                        <span className={`font-bold w-14 text-right ${
                          grade.avgRate >= 88 ? 'text-green-600' :
                          grade.avgRate >= 84 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {grade.avgRate}%
                        </span>
                        {grade.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {grade.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {grade.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span>{grade.stars}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        <span>{grade.attention}</span>
                      </div>
                      <div className="text-xs">
                        {grade.topHabit && <span className="text-green-600">优:{grade.topHabit}</span>}
                        {grade.topHabit && grade.weakHabit && <span className="mx-1">·</span>}
                        {grade.weakHabit && <span className="text-orange-600">弱:{grade.weakHabit}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 月度趋势 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-purple-600" />
                学期发展趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {monthlyTrend.map((item, idx) => {
                  const height = ((item.rate - 75) / 15) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">{item.rate}%</div>
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg transition-all hover:from-green-600 hover:to-emerald-500"
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-xs text-gray-400 mt-2">{item.month}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">达成率持续上升</span>
                </div>
                <div className="text-sm text-gray-500">
                  本学期累计<span className="font-bold text-green-600"> +8.1%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：预警与荣誉 */}
        <div className="space-y-6">
          {/* 预警提醒 */}
          <Card className="border-0 shadow-lg border-l-4 border-l-orange-400">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                重点预警
                <Badge className="bg-orange-100 text-orange-700 ml-auto">{alertClasses.length}项</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertClasses.map((cls) => (
                  <div key={cls.id} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{cls.name}</span>
                      <span className="text-xs text-gray-500">{cls.teacher}</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-2">{cls.issue}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">达成率 {cls.rate}%</span>
                      <span className="text-red-600 flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3" />
                        {cls.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3 text-orange-600 hover:bg-orange-50">
                查看全部预警 →
              </Button>
            </CardContent>
          </Card>

          {/* 习惯之星排行 */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5 text-amber-500" />
                年级习惯之星排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {habitStarRanking.map((item) => (
                  <div key={item.grade} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.rank === 1 ? 'bg-amber-400 text-white' :
                      item.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      item.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {item.rank}
                    </div>
                    <span className="font-medium text-sm flex-1">{item.grade}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold">{item.students}</span>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">{item.rate}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 近期优秀学生 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-green-600" />
                近期优秀学生
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outstandingStudents.map((student, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{student.name}</span>
                        <span className="text-xs text-gray-400">{student.class}</span>
                      </div>
                      <p className="text-xs text-gray-500">{student.achievements}</p>
                    </div>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
