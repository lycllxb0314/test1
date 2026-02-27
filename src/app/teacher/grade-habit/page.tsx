'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Users,
  Award,
  AlertTriangle,
  BarChart3,
  Eye,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

// 习惯类别图标
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

// 模拟年级各班级数据
const mockGradeClasses = [
  { id: 'c001', name: '四(1)班', teacher: '王老师', studentCount: 45, avgRate: 85.2, trend: 'up', habitStars: 5, attentionCount: 2 },
  { id: 'c002', name: '四(2)班', teacher: '李老师', studentCount: 44, avgRate: 88.5, trend: 'up', habitStars: 6, attentionCount: 1 },
  { id: 'c003', name: '四(3)班', teacher: '张老师', studentCount: 46, avgRate: 82.1, trend: 'stable', habitStars: 4, attentionCount: 3 },
  { id: 'c004', name: '四(4)班', teacher: '赵老师', studentCount: 43, avgRate: 79.8, trend: 'down', habitStars: 3, attentionCount: 5 },
  { id: 'c005', name: '四(5)班', teacher: '刘老师', studentCount: 45, avgRate: 86.7, trend: 'up', habitStars: 5, attentionCount: 2 },
  { id: 'c006', name: '四(6)班', teacher: '陈老师', studentCount: 44, avgRate: 83.4, trend: 'stable', habitStars: 4, attentionCount: 3 },
];

// 年级整体统计
const gradeStats = {
  totalStudents: mockGradeClasses.reduce((sum, c) => sum + c.studentCount, 0),
  averageRate: (mockGradeClasses.reduce((sum, c) => sum + c.avgRate, 0) / mockGradeClasses.length).toFixed(1),
  totalHabitStars: mockGradeClasses.reduce((sum, c) => sum + c.habitStars, 0),
  totalAttention: mockGradeClasses.reduce((sum, c) => sum + c.attentionCount, 0),
  categoryAverages: {
    civilization: 86,
    writing: 78,
    reading: 91,
    sports: 83,
    safety: 89,
    hygiene: 84,
    aesthetic: 75,
    labor: 87,
  },
};

export default function GradeHabitPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">年级习惯养成统计</h1>
            <Badge className="bg-purple-100 text-purple-700">四年级</Badge>
          </div>
          <p className="text-gray-500 mt-1">查看年级各班级习惯养成情况，横向对比分析</p>
        </div>
        <Select defaultValue="2024-03">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-03">2024年3月</SelectItem>
            <SelectItem value="2024-02">2024年2月</SelectItem>
            <SelectItem value="2024-01">2024年1月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 年级整体统计 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{gradeStats.totalStudents}</p>
            <p className="text-xs text-gray-500">年级学生</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{gradeStats.averageRate}%</p>
            <p className="text-xs text-gray-500">年级平均</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{gradeStats.totalHabitStars}</p>
            <p className="text-xs text-gray-500">习惯之星</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{mockGradeClasses.filter(c => c.trend === 'up').length}</p>
            <p className="text-xs text-gray-500">进步班级</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{gradeStats.totalAttention}</p>
            <p className="text-xs text-gray-500">需关注学生</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="overview">年级概览</TabsTrigger>
          <TabsTrigger value="classes">班级对比</TabsTrigger>
          <TabsTrigger value="categories">习惯分析</TabsTrigger>
        </TabsList>

        {/* 年级概览 */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* 班级排名 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">班级排名（按达成率）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...mockGradeClasses].sort((a, b) => b.avgRate - a.avgRate).map((cls, idx) => (
                  <div key={cls.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{cls.name}</span>
                        <span className="text-sm text-gray-500">班主任：{cls.teacher}</span>
                        {cls.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {cls.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{cls.studentCount}名学生</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {cls.habitStars}颗星
                        </span>
                        {cls.attentionCount > 0 && (
                          <span className="text-orange-500">{cls.attentionCount}人需关注</span>
                        )}
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={cls.avgRate} className="h-2" />
                    </div>
                    <span className="font-bold w-12 text-right">{cls.avgRate}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 班级对比 */}
        <TabsContent value="classes" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mockGradeClasses.map((cls) => (
              <Card key={cls.id} className={`border-0 shadow-md ${cls.avgRate < 80 ? 'ring-2 ring-orange-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{cls.name}</h3>
                      <p className="text-sm text-gray-500">{cls.teacher}</p>
                    </div>
                    {cls.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {cls.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">达成率</span>
                      <span className={`font-bold ${cls.avgRate >= 85 ? 'text-green-600' : cls.avgRate >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {cls.avgRate}%
                      </span>
                    </div>
                    <Progress value={cls.avgRate} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{cls.studentCount}名学生</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {cls.habitStars}
                      </span>
                    </div>
                    {cls.attentionCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        {cls.attentionCount}名学生需关注
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 习惯分析 */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          {/* 年级习惯雷达 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">年级八大习惯达成率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {(Object.keys(habitCategoryNames) as HabitCategory[]).map((category) => {
                  const Icon = habitIcons[category];
                  const avg = gradeStats.categoryAverages[category];
                  return (
                    <div
                      key={category}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        avg < 80 ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`p-2 rounded-lg ${habitCategoryColors[category]} mb-2`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{habitCategoryNames[category]}</span>
                        <span className={`text-sm font-bold mt-1 ${
                          avg >= 85 ? 'text-green-600' : avg >= 80 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {avg}%
                        </span>
                        {avg < 80 && <AlertTriangle className="h-3 w-3 text-orange-500 mt-1" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 各班级习惯对比 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">各班级习惯达成对比</CardTitle>
                <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as HabitCategory | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择习惯" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部习惯</SelectItem>
                    {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>{habitCategoryNames[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockGradeClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-4">
                    <span className="w-20 font-medium">{cls.name}</span>
                    <div className="flex-1 grid grid-cols-8 gap-1">
                      {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => {
                        const score = Math.floor(70 + Math.random() * 25);
                        return (
                          <div
                            key={cat}
                            className={`text-center p-1 rounded text-xs ${
                              score >= 85 ? 'bg-green-100 text-green-700' :
                              score >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {score}
                          </div>
                        );
                      })}
                    </div>
                    <span className="font-bold w-12 text-right">{cls.avgRate}%</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <span className="w-20 text-sm text-gray-500">图例</span>
                  <div className="flex-1 grid grid-cols-8 gap-1 text-xs">
                    {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => (
                      <div key={cat} className="text-center text-gray-500">
                        {habitCategoryNames[cat].slice(0, 2)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
