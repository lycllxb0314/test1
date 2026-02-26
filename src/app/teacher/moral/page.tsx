'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Plus,
  Search,
  Award,
  AlertTriangle,
  TrendingUp,
  Users,
} from 'lucide-react';

// 模拟德育数据
const mockMoral = [
  { id: 1, studentId: '2024001', name: '张小明', rewards: 5, punishments: 0, behaviors: 3, moralScore: 92, trend: 'up' },
  { id: 2, studentId: '2024002', name: '李小红', rewards: 4, punishments: 0, behaviors: 2, moralScore: 90, trend: 'up' },
  { id: 3, studentId: '2024003', name: '王小刚', rewards: 2, punishments: 1, behaviors: 1, moralScore: 78, trend: 'same' },
  { id: 4, studentId: '2024004', name: '赵小芳', rewards: 3, punishments: 0, behaviors: 2, moralScore: 85, trend: 'up' },
  { id: 5, studentId: '2024005', name: '刘小华', rewards: 1, punishments: 2, behaviors: 0, moralScore: 65, trend: 'down' },
];

// 奖惩记录
const mockRecords = [
  { id: 1, student: '张小明', type: '奖励', reason: '主动帮助同学', points: 5, date: '2024-03-15' },
  { id: 2, student: '王小刚', type: '惩罚', reason: '上课讲话', points: -3, date: '2024-03-14' },
  { id: 3, student: '李小红', type: '奖励', reason: '积极参加活动', points: 5, date: '2024-03-13' },
  { id: 4, student: '刘小华', type: '惩罚', reason: '未完成作业', points: -2, date: '2024-03-12' },
];

export default function TeacherMoralPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'record'>('overview');

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Badge className="bg-green-100 text-green-700"><TrendingUp className="h-3 w-3 mr-1" />进步</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-700">退步</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">持平</Badge>;
    }
  };

  const filteredMoral = mockMoral.filter(m => 
    m.name.includes(searchTerm) || m.studentId.includes(searchTerm)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成长德育</h1>
          <p className="text-gray-500 mt-1">学生奖惩、行为习惯、心理关注</p>
        </div>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          添加记录
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级人数</p>
                <p className="text-2xl font-bold text-purple-600">50</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月奖励</p>
                <p className="text-2xl font-bold text-green-600">28</p>
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
                <p className="text-sm text-gray-500">本月惩罚</p>
                <p className="text-2xl font-bold text-orange-600">5</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">德育优良率</p>
                <p className="text-2xl font-bold text-blue-600">92%</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          德育概览
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'record' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('record')}
        >
          奖惩记录
        </button>
      </div>

      {/* 德育概览 */}
      {activeTab === 'overview' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>学号</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>奖励次数</TableHead>
                  <TableHead>惩罚次数</TableHead>
                  <TableHead>行为记录</TableHead>
                  <TableHead>德育分</TableHead>
                  <TableHead>趋势</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMoral.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.studentId}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{item.rewards}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{item.punishments}</span>
                    </TableCell>
                    <TableCell>{item.behaviors}</TableCell>
                    <TableCell className="font-bold">{item.moralScore}</TableCell>
                    <TableCell>{getTrendBadge(item.trend)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 奖惩记录 */}
      {activeTab === 'record' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>学生姓名</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>原因</TableHead>
                  <TableHead>分值</TableHead>
                  <TableHead>日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{record.student}</TableCell>
                    <TableCell>
                      <Badge className={record.type === '奖励' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.reason}</TableCell>
                    <TableCell className={record.points > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {record.points > 0 ? '+' : ''}{record.points}
                    </TableCell>
                    <TableCell>{record.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
