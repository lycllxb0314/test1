'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  Calendar,
} from 'lucide-react';

// 模拟德育分析数据
const monthlyStats = [
  { month: '1月', activities: 8, participants: 1200 },
  { month: '2月', activities: 6, participants: 800 },
  { month: '3月', activities: 10, participants: 2500 },
  { month: '4月', activities: 12, participants: 2800 },
  { month: '5月', activities: 15, participants: 3200 },
];

const gradeAnalysis = [
  { grade: '一年级', excellent: 45, good: 40, pass: 15, needImprove: 0 },
  { grade: '二年级', excellent: 42, good: 38, pass: 18, needImprove: 2 },
  { grade: '三年级', excellent: 38, good: 35, pass: 22, needImprove: 5 },
  { grade: '四年级', excellent: 35, good: 32, pass: 25, needImprove: 8 },
  { grade: '五年级', excellent: 32, good: 30, pass: 28, needImprove: 10 },
  { grade: '六年级', excellent: 30, good: 28, pass: 30, needImprove: 12 },
];

const typeStats = [
  { type: '志愿服务', count: 25, trend: 'up' },
  { type: '主题教育', count: 18, trend: 'up' },
  { type: '安全教育', count: 15, trend: 'same' },
  { type: '感恩教育', count: 12, trend: 'up' },
  { type: '环保教育', count: 10, trend: 'down' },
];

export default function AnalyticsPage() {
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
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
          <p className="text-gray-500 mt-1">德育工作数据统计与分析</p>
        </div>
      </div>

      {/* 总体统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本学期活动</p>
                <p className="text-2xl font-bold text-green-600">51</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">累计参与</p>
                <p className="text-2xl font-bold text-blue-600">10,500</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">优秀学生</p>
                <p className="text-2xl font-bold text-purple-600">980</p>
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
                <p className="text-sm text-gray-500">德育优良率</p>
                <p className="text-2xl font-bold text-orange-600">87%</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 月度活动趋势 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>月度活动趋势</CardTitle>
            <CardDescription>本学期德育活动开展情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((item) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="w-8 text-sm font-medium">{item.month}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                          style={{ width: `${(item.activities / 15) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.activities}场</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.participants}人次参与</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 活动类型统计 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>活动类型分布</CardTitle>
            <CardDescription>各类德育活动开展情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeStats.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{item.type}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-600">{item.count}场</span>
                    {getTrendIcon(item.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 年级德育分析 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>各年级德育评价分析</CardTitle>
          <CardDescription>学生德育综合素质等级分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            {gradeAnalysis.map((item) => (
              <div key={item.grade} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="font-medium mb-2">{item.grade}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-700 text-xs">优秀</Badge>
                    <span>{item.excellent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">良好</Badge>
                    <span>{item.good}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">及格</Badge>
                    <span>{item.pass}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-100 text-red-700 text-xs">待提高</Badge>
                    <span>{item.needImprove}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
