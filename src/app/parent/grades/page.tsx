'use client';

import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Eye,
} from 'lucide-react';

// 模拟成绩数据
const mockExams = [
  { id: 'e001', name: '2023-2024学年第一学期期中考试', date: '2023-11-10' },
  { id: 'e002', name: '2023-2024学年第一学期期末考试', date: '2024-01-15' },
  { id: 'e003', name: '2023-2024学年第二学期期中考试', date: '2024-04-10' },
];

const mockGrades = {
  'e001': [
    { subject: '语文', score: 90, classAvg: 85, rank: 5, level: '优秀', trend: 'up' },
    { subject: '数学', score: 92, classAvg: 88, rank: 3, level: '优秀', trend: 'up' },
    { subject: '英语', score: 85, classAvg: 82, rank: 8, level: '良好', trend: 'stable' },
    { subject: '科学', score: 88, classAvg: 84, rank: 6, level: '良好', trend: 'up' },
    { subject: '道德与法治', score: 95, classAvg: 88, rank: 2, level: '优秀', trend: 'up' },
  ],
  'e002': [
    { subject: '语文', score: 92, classAvg: 86, rank: 4, level: '优秀', trend: 'up' },
    { subject: '数学', score: 95, classAvg: 88, rank: 2, level: '优秀', trend: 'up' },
    { subject: '英语', score: 88, classAvg: 83, rank: 5, level: '良好', trend: 'up' },
    { subject: '科学', score: 90, classAvg: 85, rank: 4, level: '优秀', trend: 'up' },
    { subject: '道德与法治', score: 93, classAvg: 87, rank: 3, level: '优秀', trend: 'down' },
  ],
  'e003': [
    { subject: '语文', score: 91, classAvg: 87, rank: 5, level: '优秀', trend: 'stable' },
    { subject: '数学', score: 96, classAvg: 89, rank: 1, level: '优秀', trend: 'up' },
    { subject: '英语', score: 90, classAvg: 84, rank: 4, level: '优秀', trend: 'up' },
    { subject: '科学', score: 89, classAvg: 85, rank: 5, level: '良好', trend: 'stable' },
    { subject: '道德与法治', score: 94, classAvg: 88, rank: 3, level: '优秀', trend: 'up' },
  ],
};

export default function ParentGradesPage() {
  const [selectedExam, setSelectedExam] = useState(mockExams[2].id);

  const currentGrades = mockGrades[selectedExam as keyof typeof mockGrades] || [];
  const totalScore = currentGrades.reduce((sum, g) => sum + g.score, 0);
  const avgScore = (totalScore / currentGrades.length).toFixed(1);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case '优秀': return 'bg-green-100 text-green-700';
      case '良好': return 'bg-blue-100 text-blue-700';
      case '合格': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">成绩查看</h1>
          <p className="text-muted-foreground mt-1">查看孩子的考试成绩和学情分析</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="选择考试" />
            </SelectTrigger>
            <SelectContent>
              {mockExams.map(exam => (
                <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 总分概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">总分</p>
            <p className="text-3xl font-bold mt-1">{totalScore}</p>
            <p className="text-xs text-muted-foreground mt-1">满分500分</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">平均分</p>
            <p className="text-3xl font-bold mt-1">{avgScore}</p>
            <p className="text-xs text-muted-foreground mt-1">班级平均{(currentGrades.reduce((sum, g) => sum + g.classAvg, 0) / currentGrades.length).toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">班级排名</p>
            <p className="text-3xl font-bold mt-1">第5名</p>
            <p className="text-xs text-green-500 mt-1">较上次进步2名</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">年级排名</p>
            <p className="text-3xl font-bold mt-1">第28名</p>
            <p className="text-xs text-green-500 mt-1">较上次进步5名</p>
          </CardContent>
        </Card>
      </div>

      {/* 各科成绩 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            各科成绩
          </CardTitle>
          <CardDescription>
            {mockExams.find(e => e.id === selectedExam)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentGrades.map((grade, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-20">
                  <p className="font-medium">{grade.subject}</p>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">成绩</p>
                    <p className="text-xl font-bold">{grade.score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">班级平均</p>
                    <p className="text-lg font-medium">{grade.classAvg}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">班级排名</p>
                    <p className="text-lg font-medium">第{grade.rank}名</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className={getLevelColor(grade.level)}>{grade.level}</Badge>
                    {getTrendIcon(grade.trend)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 学情分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              优势学科
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">数学</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">96分</span>
                  <Badge className="bg-green-100 text-green-700">班级第1</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">道德与法治</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">94分</span>
                  <Badge className="bg-green-100 text-green-700">班级第3</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-500" />
              待提高学科
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="font-medium">科学</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">89分</span>
                  <Badge className="bg-amber-100 text-amber-700">良好</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                建议加强科学实验和观察记录，多参与科学实践活动
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 历史成绩趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">成绩趋势</CardTitle>
          <CardDescription>最近三次考试成绩对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-around gap-4">
            {mockExams.map((exam, index) => {
              const grades = mockGrades[exam.id as keyof typeof mockGrades];
              const avg = grades ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length) : 0;
              const height = (avg / 100) * 150;
              return (
                <div key={exam.id} className="flex flex-col items-center gap-2">
                  <div 
                    className="w-16 bg-gradient-to-t from-cyan-500 to-teal-400 rounded-t-lg transition-all"
                    style={{ height: `${height}px` }}
                  />
                  <div className="text-center">
                    <p className="text-lg font-bold">{avg.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.name.includes('期中') ? '期中' : '期末'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
