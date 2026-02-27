'use client';

import React, { useState } from 'react';
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
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Calendar,
  FileText,
  Printer,
  Share2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

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

// 模拟报表数据
const semesterData = {
  overall: { rate: 86.3, change: 8.1, students: 1896, stars: 186 },
  categories: [
    { category: 'civilization' as HabitCategory, rate: 89.2, change: 2.3, trend: 'up' },
    { category: 'writing' as HabitCategory, rate: 78.5, change: 0.5, trend: 'stable' },
    { category: 'reading' as HabitCategory, rate: 92.1, change: 3.8, trend: 'up' },
    { category: 'sports' as HabitCategory, rate: 83.7, change: 1.2, trend: 'up' },
    { category: 'safety' as HabitCategory, rate: 91.5, change: 0.2, trend: 'stable' },
    { category: 'hygiene' as HabitCategory, rate: 85.8, change: 1.5, trend: 'up' },
    { category: 'aesthetic' as HabitCategory, rate: 72.3, change: -1.2, trend: 'down' },
    { category: 'labor' as HabitCategory, rate: 87.6, change: 2.1, trend: 'up' },
  ],
  grades: [
    { grade: '一年级', rate: 82.1, change: 6.5, trend: 'up' },
    { grade: '二年级', rate: 84.5, change: 5.8, trend: 'up' },
    { grade: '三年级', rate: 89.2, change: 9.2, trend: 'up' },
    { grade: '四年级', rate: 88.7, change: 8.8, trend: 'up' },
    { grade: '五年级', rate: 86.3, change: 7.6, trend: 'up' },
    { grade: '六年级', rate: 85.1, change: 7.1, trend: 'up' },
  ],
  monthlyTrend: [
    { month: '9月', rate: 78.2 },
    { month: '10月', rate: 80.5 },
    { month: '11月', rate: 82.1 },
    { month: '12月', rate: 83.8 },
    { month: '1月', rate: 84.5 },
    { month: '2月', rate: 85.2 },
    { month: '3月', rate: 86.3 },
  ],
};

// 报表类型
const reportTypes = [
  { id: 'semester', name: '学期报表', icon: Calendar, description: '本学期习惯养成综合分析' },
  { id: 'monthly', name: '月度报表', icon: BarChart3, description: '各月习惯养成情况对比' },
  { id: 'grade', name: '年级报表', icon: Layers, description: '各年级习惯养成对比分析' },
  { id: 'category', name: '习惯类别报表', icon: PieChart, description: '八大习惯分类分析' },
];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2024-1');
  const [selectedReport, setSelectedReport] = useState('semester');

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据报表</h1>
            <p className="text-gray-500 mt-0.5">习惯养成数据统计分析与报表导出</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-1">2024学年第一学期</SelectItem>
              <SelectItem value="2023-2">2023学年第二学期</SelectItem>
              <SelectItem value="2023-1">2023学年第一学期</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            打印
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            分享
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 报表类型选择 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    selectedReport === type.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{type.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 综合概览 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">全校达成率</span>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">+{semesterData.overall.change}%</span>
              </div>
            </div>
            <div className="text-4xl font-bold">{semesterData.overall.rate}%</div>
            <div className="text-green-100 text-sm mt-1">本学期提升 {semesterData.overall.change} 个百分点</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">在校学生</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{semesterData.overall.students.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">参与习惯养成评价</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">习惯之星</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{semesterData.overall.stars}</div>
            <div className="text-sm text-gray-400 mt-1">占比 {((semesterData.overall.stars / semesterData.overall.students) * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">优秀习惯类别</span>
              <Badge className="bg-green-100 text-green-700">阅读</Badge>
            </div>
            <div className="text-3xl font-bold text-green-600">92.1%</div>
            <div className="text-sm text-gray-400 mt-1">达成率最高</div>
          </CardContent>
        </Card>
      </div>

      {/* 主图表区 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 八大习惯达成率 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-600" />
              八大习惯达成率分布
            </CardTitle>
            <CardDescription>各类习惯达成率对比分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {semesterData.categories.map((item) => {
                const Icon = habitIcons[item.category];
                return (
                  <div key={item.category} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${habitCategoryColors[item.category]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{habitCategoryNames[item.category]}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            item.rate >= 85 ? 'text-green-600' :
                            item.rate >= 75 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {item.rate}%
                          </span>
                          {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                          {item.trend === 'stable' && <Minus className="h-3 w-3 text-gray-400" />}
                        </div>
                      </div>
                      <Progress value={item.rate} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 年级对比 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              各年级达成率对比
            </CardTitle>
            <CardDescription>年级间习惯养成情况对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {semesterData.grades.map((item, idx) => (
                <div key={item.grade} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="w-16 font-medium text-sm">{item.grade}</div>
                  <div className="flex-1">
                    <Progress value={item.rate} className="h-2.5" />
                  </div>
                  <div className="flex items-center gap-2 w-20 justify-end">
                    <span className={`font-bold ${
                      item.rate >= 88 ? 'text-green-600' :
                      item.rate >= 84 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {item.rate}%
                    </span>
                    {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度趋势 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-purple-600" />
            学期达成率趋势
          </CardTitle>
          <CardDescription>本学期各月达成率变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-48">
            {semesterData.monthlyTrend.map((item, idx) => {
              const height = ((item.rate - 75) / 15) * 100;
              const prevRate = idx > 0 ? semesterData.monthlyTrend[idx - 1].rate : item.rate;
              const isUp = item.rate > prevRate;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="text-sm text-gray-500 mb-1 font-medium">{item.rate}%</div>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isUp
                        ? 'bg-gradient-to-t from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500'
                        : 'bg-gradient-to-t from-gray-400 to-gray-300'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-sm text-gray-600 mt-2 font-medium">{item.month}</div>
                  {idx > 0 && (
                    <div className={`text-xs mt-1 ${isUp ? 'text-green-600' : 'text-gray-400'}`}>
                      {isUp ? <ArrowUpRight className="inline h-3 w-3" /> : <Minus className="inline h-3 w-3" />}
                      {(item.rate - prevRate).toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">达成率持续上升</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">本学期累计提升 <span className="font-bold text-green-600">+8.1%</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 报表下载区 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            报表下载
          </CardTitle>
          <CardDescription>导出详细数据报表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: '学期综合报表', format: 'Excel', size: '2.3MB', icon: BarChart3 },
              { name: '年级对比报表', format: 'PDF', size: '1.8MB', icon: Layers },
              { name: '习惯类别报表', format: 'Excel', size: '1.5MB', icon: PieChart },
            ].map((report, idx) => {
              const Icon = report.icon;
              return (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="p-3 rounded-lg bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-500">{report.format} · {report.size}</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
