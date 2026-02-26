'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Users,
  BookOpen,
  Award,
  Target,
} from 'lucide-react';

// 模拟教学质量分析数据
const subjectAnalysis = [
  { subject: '语文', avgScore: 85.2, passRate: 96, excellentRate: 35, trend: 'up' },
  { subject: '数学', avgScore: 82.5, passRate: 94, excellentRate: 28, trend: 'up' },
  { subject: '英语', avgScore: 80.8, passRate: 92, excellentRate: 25, trend: 'down' },
  { subject: '科学', avgScore: 83.6, passRate: 95, excellentRate: 30, trend: 'same' },
];

const gradeAnalysis = [
  { grade: '一年级', avgScore: 88.5, passRate: 98, excellentRate: 40 },
  { grade: '二年级', avgScore: 86.2, passRate: 97, excellentRate: 35 },
  { grade: '三年级', avgScore: 84.8, passRate: 96, excellentRate: 32 },
  { grade: '四年级', avgScore: 83.5, passRate: 95, excellentRate: 30 },
  { grade: '五年级', avgScore: 82.1, passRate: 94, excellentRate: 28 },
  { grade: '六年级', avgScore: 81.5, passRate: 93, excellentRate: 25 },
];

const classRanking = [
  { rank: 1, class: '一年级1班', avgScore: 91.2, headTeacher: '王明华' },
  { rank: 2, class: '二年级1班', avgScore: 89.8, headTeacher: '张强' },
  { rank: 3, class: '三年级2班', avgScore: 88.5, headTeacher: '刘洋' },
  { rank: 4, class: '四年级1班', avgScore: 87.2, headTeacher: '孙丽' },
  { rank: 5, class: '五年级2班', avgScore: 86.8, headTeacher: '吴华' },
];

export default function AnalysisPage() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 text-gray-400">—</div>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">质量分析</h1>
          <p className="text-gray-500 mt-1">教学质量数据统计与分析</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          导出报告
        </Button>
      </div>

      {/* 总体统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">全校平均分</p>
                <p className="text-2xl font-bold text-blue-600">84.5</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">及格率</p>
                <p className="text-2xl font-bold text-green-600">95.2%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Award className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">优秀率</p>
                <p className="text-2xl font-bold text-purple-600">32.8%</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">进步学生</p>
                <p className="text-2xl font-bold text-orange-600">156人</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 各学科分析 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>各学科教学质量</CardTitle>
            <CardDescription>各学科平均分与及格率分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectAnalysis.map((item) => (
                <div key={item.subject} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.subject}</span>
                    {getTrendIcon(item.trend)}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">平均分</p>
                      <p className="font-bold text-blue-600">{item.avgScore}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">及格率</p>
                      <p className="font-bold text-green-600">{item.passRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">优秀率</p>
                      <p className="font-bold text-purple-600">{item.excellentRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 年级分析 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>各年级成绩分析</CardTitle>
            <CardDescription>各年级平均分趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradeAnalysis.map((item) => (
                <div key={item.grade} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium">{item.grade}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${item.avgScore}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm font-bold text-blue-600">{item.avgScore}</span>
                  <Badge variant="outline" className="text-xs">{item.excellentRate}%优</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 班级排名 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>班级综合排名</CardTitle>
          <CardDescription>本学期班级综合成绩排名</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {classRanking.map((item) => (
              <div key={item.rank} className={`p-4 rounded-lg ${item.rank <= 3 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={item.rank <= 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}>
                    第{item.rank}名
                  </Badge>
                </div>
                <p className="font-medium text-gray-900">{item.class}</p>
                <p className="text-sm text-gray-500">{item.headTeacher}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{item.avgScore}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
