'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  RefreshCw,
  Download,
  Plus,
} from 'lucide-react';

// 模拟课程表数据
const scheduleData = {
  '一年级1班': {
    '周一': ['语文', '数学', '体育', '音乐', '美术', '自习'],
    '周二': ['数学', '语文', '英语', '科学', '道德', '自习'],
    '周三': ['语文', '数学', '体育', '音乐', '美术', '自习'],
    '周四': ['数学', '语文', '英语', '科学', '道德', '自习'],
    '周五': ['语文', '数学', '体育', '音乐', '阅读', '班会'],
  },
};

const timeSlots = [
  { period: '第一节', time: '08:00-08:40' },
  { period: '第二节', time: '08:50-09:30' },
  { period: '第三节', time: '10:00-10:40' },
  { period: '第四节', time: '10:50-11:30' },
  { period: '第五节', time: '14:00-14:40' },
  { period: '第六节', time: '14:50-15:30' },
];

const weekDays = ['周一', '周二', '周三', '周四', '周五'];

const subjectColors: Record<string, string> = {
  '语文': 'bg-red-100 text-red-700 border-red-200',
  '数学': 'bg-blue-100 text-blue-700 border-blue-200',
  '英语': 'bg-green-100 text-green-700 border-green-200',
  '体育': 'bg-orange-100 text-orange-700 border-orange-200',
  '音乐': 'bg-purple-100 text-purple-700 border-purple-200',
  '美术': 'bg-pink-100 text-pink-700 border-pink-200',
  '科学': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '道德': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '阅读': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '班会': 'bg-gray-100 text-gray-700 border-gray-200',
  '自习': 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function SchedulePage() {
  const classSchedule = scheduleData['一年级1班'];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能排课</h1>
          <p className="text-gray-500 mt-1">课程表管理与自动排课</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出课表
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            智能排课
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            手动调整
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级总数</p>
                <p className="text-2xl font-bold text-blue-600">56</p>
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
                <p className="text-sm text-gray-500">课程科目</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">周课时数</p>
                <p className="text-2xl font-bold text-purple-600">30</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">排课完成率</p>
                <p className="text-2xl font-bold text-orange-600">100%</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 课程表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>一年级1班 课程表</CardTitle>
              <CardDescription>2024-2025学年第二学期</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">上一班级</Button>
              <Button variant="outline" size="sm">下一班级</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left bg-gray-50 border font-medium text-gray-700">节次/时间</th>
                  {weekDays.map(day => (
                    <th key={day} className="p-3 text-center bg-gray-50 border font-medium text-gray-700">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, index) => (
                  <tr key={index}>
                    <td className="p-3 border bg-gray-50">
                      <div className="font-medium text-gray-700">{slot.period}</div>
                      <div className="text-xs text-gray-500">{slot.time}</div>
                    </td>
                    {weekDays.map(day => (
                      <td key={day} className="p-2 border text-center">
                        <div className={`p-2 rounded-lg border ${subjectColors[classSchedule[day as keyof typeof classSchedule]?.[index]] || 'bg-gray-50'}`}>
                          {classSchedule[day as keyof typeof classSchedule]?.[index] || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 课程统计 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>本周课时分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries({
                '语文': 8, '数学': 8, '英语': 4, '体育': 4, '音乐': 2, '美术': 2, '科学': 2, '道德': 2
              }).map(([subject, hours]) => (
                <div key={subject} className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-sm ${subjectColors[subject] || 'bg-gray-100'}`}>{subject}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(hours / 8) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{hours}节</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>排课提示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <div>
                  <p className="font-medium text-green-700">课程安排合理</p>
                  <p className="text-sm text-green-600">主科课时符合课程标准要求</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p className="font-medium text-blue-700">无时间冲突</p>
                  <p className="text-sm text-blue-600">所有教师课程时间无重叠</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                <div>
                  <p className="font-medium text-yellow-700">场地分配完整</p>
                  <p className="text-sm text-yellow-600">功能教室使用安排合理</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
