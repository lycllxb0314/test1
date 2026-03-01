'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Activity,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  School,
  Shield,
  Heart,
  Flag,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Trophy,
  Loader2,
} from 'lucide-react';
import { useSchoolStats } from '@/hooks/useSchoolStats';

export default function MoralPage() {
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { data: apiStats, loading, error } = useSchoolStats();

  // 德育数据（基于API返回）
  const schoolStats = apiStats ? {
    totalStudents: apiStats.students.total,
    totalClasses: apiStats.classes.total,
    praiseCount: 3420,
    criticismCount: 156,
    activityCount: 89,
    activityParticipationRate: 92,
    excellentClassCount: Math.round(apiStats.classes.total * 0.3),
    warningClassCount: 3,
  } : {
    totalStudents: 0,
    totalClasses: 0,
    praiseCount: 0,
    criticismCount: 0,
    activityCount: 0,
    activityParticipationRate: 0,
    excellentClassCount: 0,
    warningClassCount: 0,
  };

  // 年级对比数据
  const gradeComparisonData = [
    { grade: '一年级', praise: 520, criticism: 12, score: 95, activityRate: 96 },
    { grade: '二年级', praise: 580, criticism: 18, score: 94, activityRate: 95 },
    { grade: '三年级', praise: 550, criticism: 22, score: 93, activityRate: 93 },
    { grade: '四年级', praise: 600, criticism: 28, score: 91, activityRate: 91 },
    { grade: '五年级', praise: 570, criticism: 35, score: 89, activityRate: 90 },
    { grade: '六年级', praise: 600, criticism: 41, score: 87, activityRate: 88 },
  ];

  // 班级德育排行
  const classRankingData = [
    { rank: 1, class: '三(1)班', score: 98, praise: 85, criticism: 0, trend: 'up' },
    { rank: 2, class: '二(3)班', score: 97, praise: 92, criticism: 1, trend: 'up' },
    { rank: 3, class: '一(2)班', score: 96, praise: 78, criticism: 0, trend: 'up' },
    { rank: 46, class: '六(4)班', score: 72, praise: 45, criticism: 28, trend: 'down' },
    { rank: 47, class: '五(5)班', score: 68, praise: 38, criticism: 32, trend: 'down' },
    { rank: 48, class: '四(6)班', score: 65, praise: 35, criticism: 35, trend: 'down' },
  ];

  // 实时预警数据
  const warningData = [
    { id: '1', type: '违纪', class: '六(4)班', count: 28, trend: '连续3周上升', level: 'high' },
    { id: '2', type: '活动参与', class: '五(5)班', rate: 65, trend: '低于平均水平', level: 'medium' },
    { id: '3', type: '违纪', class: '四(6)班', count: 35, trend: '本周新增12次', level: 'high' },
  ];

  // 德育类型分布
  const moralTypeData = [
    { name: '好人好事', value: 42, color: '#10b981' },
    { name: '学习优秀', value: 28, color: '#3b82f6' },
    { name: '纪律表现', value: 18, color: '#f59e0b' },
    { name: '活动参与', value: 8, color: '#8b5cf6' },
    { name: '其他', value: 4, color: '#6b7280' },
  ];

  // 本周趋势数据
  const weeklyTrendData = [
    { day: '周一', praise: 85, criticism: 8 },
    { day: '周二', praise: 92, criticism: 12 },
    { day: '周三', praise: 78, criticism: 5 },
    { day: '周四', praise: 88, criticism: 10 },
    { day: '周五', praise: 95, criticism: 15 },
  ];

  // 优秀班级
  const excellentClasses = [
    { id: '1', class: '三(1)班', grade: '三年级', teacher: '张老师', highlight: '连续4周排名第一' },
    { id: '2', class: '二(3)班', grade: '二年级', teacher: '李老师', highlight: '活动参与率100%' },
    { id: '3', class: '一(2)班', grade: '一年级', teacher: '王老师', highlight: '零违纪记录' },
  ];

  // 获取趋势图标
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // 获取警告级别颜色
  const getWarningLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">德育管理</h1>
          <p className="text-gray-500 mt-1">少先队管理 · 德育活动 · 学生评价 · 成长档案</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="semester">本学期</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 功能模块导航 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Link href="/moral/assessment">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5 text-center">
              <div className="inline-flex p-3 bg-emerald-100 rounded-xl mb-3">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">日常行为</h3>
              <p className="text-xs text-gray-500 mt-1">行为评价 · 习惯养成</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/moral/activities">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5 text-center">
              <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">德育活动</h3>
              <p className="text-xs text-gray-500 mt-1">活动管理 · 德育计划</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/moral/honors">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5 text-center">
              <div className="inline-flex p-3 bg-amber-100 rounded-xl mb-3">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">成长荣誉</h3>
              <p className="text-xs text-gray-500 mt-1">荣誉管理 · 成长轨迹</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/moral/alerts">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5 text-center">
              <div className="inline-flex p-3 bg-red-100 rounded-xl mb-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">预警管理</h3>
              <p className="text-xs text-gray-500 mt-1">违纪预警 · 行为关注</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/moral/analytics">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5 text-center">
              <div className="inline-flex p-3 bg-purple-100 rounded-xl mb-3">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">德育分析</h3>
              <p className="text-xs text-gray-500 mt-1">数据分析 · 趋势报告</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">全校学生</p>
                <p className="text-3xl font-bold text-gray-900">{schoolStats.totalStudents}</p>
                <p className="text-xs text-gray-500">共 {schoolStats.totalClasses} 个班级</p>
              </div>
              <div className="p-4 bg-green-100 rounded-xl">
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">表扬次数</p>
                <p className="text-3xl font-bold text-green-600">{schoolStats.praiseCount}</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  较上月 +12%
                </p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-xl">
                <Award className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">批评次数</p>
                <p className="text-3xl font-bold text-red-600">{schoolStats.criticismCount}</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  较上月 -8%
                </p>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活动参与率</p>
                <p className="text-3xl font-bold text-blue-600">{schoolStats.activityParticipationRate}%</p>
                <p className="text-xs text-gray-500">本学期共 {schoolStats.activityCount} 场活动</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-xl">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 双栏布局 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 班级德育排行 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">班级德育排行</CardTitle>
              <CardDescription>本月德育积分排名</CardDescription>
            </div>
            <Link href="/moral/assessment">
              <Button variant="ghost" size="sm" className="text-green-600">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* 优秀班级 */}
              {classRankingData.slice(0, 3).map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-50"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                    item.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                    item.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                    'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                  }`}>
                    {item.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.class}</p>
                    <p className="text-xs text-gray-500">表扬 {item.praise} · 批评 {item.criticism}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{item.score}</p>
                    <p className="text-xs text-gray-500">积分</p>
                  </div>
                </div>
              ))}
              
              {/* 分割线 */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-400">需关注班级</span>
                </div>
              </div>
              
              {/* 待改进班级 */}
              {classRankingData.slice(3).map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center gap-3 p-3 rounded-xl bg-red-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-red-700 font-bold text-sm">
                    {item.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.class}</p>
                    <p className="text-xs text-red-500">批评 {item.criticism} 次</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.score}</p>
                    <p className="text-xs text-gray-500">积分</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 实时预警 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">实时预警</CardTitle>
              <CardDescription>需要关注的德育问题</CardDescription>
            </div>
            <Link href="/moral/alerts">
              <Button variant="ghost" size="sm" className="text-green-600">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warningData.map((warning) => (
                <div
                  key={warning.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${getWarningLevelColor(warning.level)}`}
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{warning.type}</span>
                      <Badge variant="outline" className="text-xs">{warning.class}</Badge>
                    </div>
                    <p className="text-sm opacity-80">
                      {warning.type === '违纪' ? `违纪 ${warning.count} 次` : `参与率 ${warning.rate}%`}
                    </p>
                    <p className="text-xs opacity-60 mt-1">{warning.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 少先队活动 & 优秀班级 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 少先队活动 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" />
                少先队活动
              </CardTitle>
              <CardDescription>近期少先队活动安排</CardDescription>
            </div>
            <Link href="/moral/pioneer">
              <Button variant="ghost" size="sm" className="text-green-600">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: '升旗仪式', time: '周一 08:00', location: '操场', status: 'today' },
                { title: '入队仪式', time: '周三 14:00', location: '礼堂', status: 'upcoming' },
                { title: '少先队活动课', time: '周五 15:00', location: '各班教室', status: 'upcoming' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activity.status === 'today' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Flag className={`h-4 w-4 ${activity.status === 'today' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{activity.time}</p>
                    {activity.status === 'today' && (
                      <Badge className="bg-red-100 text-red-700 text-xs">今日</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 优秀班级展示 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              优秀班级
            </CardTitle>
            <CardDescription>德育表现突出班级</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {excellentClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold">
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{cls.class}</p>
                      <Badge variant="outline" className="text-xs">{cls.grade}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{cls.teacher} · {cls.highlight}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
