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
  BookOpen,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// 模拟作业数据
const mockHomework = [
  { id: 1, subject: '语文', title: '第三单元词语抄写', assignDate: '2024-03-15', dueDate: '2024-03-16', submitted: 48, total: 50, status: 'grading' },
  { id: 2, subject: '数学', title: '练习册P25-26', assignDate: '2024-03-15', dueDate: '2024-03-16', submitted: 50, total: 50, status: 'completed' },
  { id: 3, subject: '英语', title: 'Unit 3 单词背诵', assignDate: '2024-03-14', dueDate: '2024-03-15', submitted: 45, total: 50, status: 'completed' },
  { id: 4, subject: '语文', title: '作文：我的理想', assignDate: '2024-03-13', dueDate: '2024-03-16', submitted: 42, total: 50, status: 'active' },
];

// 学情分析
const mockLearning = [
  { id: 1, studentId: '2024001', name: '张小明', completionRate: 98, correctRate: 92, trend: 'up', weakPoints: '作文' },
  { id: 2, studentId: '2024002', name: '李小红', completionRate: 100, correctRate: 95, trend: 'up', weakPoints: '-' },
  { id: 3, studentId: '2024003', name: '王小刚', completionRate: 85, correctRate: 78, trend: 'same', weakPoints: '计算题' },
  { id: 4, studentId: '2024004', name: '赵小芳', completionRate: 92, correctRate: 88, trend: 'up', weakPoints: '阅读理解' },
  { id: 5, studentId: '2024005', name: '刘小华', completionRate: 70, correctRate: 65, trend: 'down', weakPoints: '多项' },
];

export default function HomeworkPage() {
  const [activeTab, setActiveTab] = useState<'homework' | 'learning'>('homework');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700">进行中</Badge>;
      case 'grading':
        return <Badge className="bg-yellow-100 text-yellow-700">批改中</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学情作业</h1>
          <p className="text-gray-500 mt-1">作业布置、错题分析、学情追踪</p>
        </div>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          布置作业
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本周作业</p>
                <p className="text-2xl font-bold text-purple-600">8</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">完成率</p>
                <p className="text-2xl font-bold text-green-600">95%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待批改</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">需关注</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'homework' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('homework')}
        >
          作业管理
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'learning' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('learning')}
        >
          学情分析
        </button>
      </div>

      {/* 作业管理 */}
      {activeTab === 'homework' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>科目</TableHead>
                  <TableHead>作业内容</TableHead>
                  <TableHead>布置日期</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>提交情况</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHomework.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Badge variant="outline">{item.subject}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.assignDate}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(item.submitted / item.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.submitted}/{item.total}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 学情分析 */}
      {activeTab === 'learning' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>学号</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>完成率</TableHead>
                  <TableHead>正确率</TableHead>
                  <TableHead>薄弱点</TableHead>
                  <TableHead>趋势</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLearning.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.studentId}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.completionRate >= 90 ? 'bg-green-500' : item.completionRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${item.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${item.correctRate >= 90 ? 'text-green-600' : item.correctRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {item.correctRate}%
                      </span>
                    </TableCell>
                    <TableCell>{item.weakPoints}</TableCell>
                    <TableCell>{getTrendIcon(item.trend)}</TableCell>
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
