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
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// 模拟考试数据
const mockExams = [
  { id: 1, name: '2024年期中考试', type: '期中考试', grade: '全校', startDate: '2024-04-15', endDate: '2024-04-17', subjects: '语文、数学、英语、科学', status: 'upcoming', students: 2800 },
  { id: 2, name: '三年级语文单元测试', type: '单元测试', grade: '三年级', startDate: '2024-03-20', endDate: '2024-03-20', subjects: '语文', status: 'completed', students: 450 },
  { id: 3, name: '五年级数学竞赛', type: '竞赛', grade: '五年级', startDate: '2024-03-25', endDate: '2024-03-25', subjects: '数学', status: 'completed', students: 100 },
  { id: 4, name: '六年级毕业模拟考', type: '模拟考试', grade: '六年级', startDate: '2024-05-10', endDate: '2024-05-12', subjects: '语文、数学、英语', status: 'planning', students: 480 },
  { id: 5, name: '英语口语测试', type: '技能测试', grade: '四-六年级', startDate: '2024-04-01', endDate: '2024-04-05', subjects: '英语口语', status: 'in_progress', students: 1400 },
];

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge className="bg-gray-100 text-gray-700">计划中</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700">即将开始</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-700">进行中</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredExams = mockExams.filter(e => {
    const matchesSearch = e.name.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
          <p className="text-gray-500 mt-1">考试安排与成绩管理</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新增考试
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月考试</p>
                <p className="text-2xl font-bold text-blue-600">5</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-2xl font-bold text-orange-600">1</p>
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
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-green-600">12</p>
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
                <p className="text-sm text-gray-500">参与人次</p>
                <p className="text-2xl font-bold text-purple-600">5,230</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索考试名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="planning">计划中</SelectItem>
                <SelectItem value="upcoming">即将开始</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 考试列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>考试名称</TableHead>
                <TableHead>考试类型</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>考试科目</TableHead>
                <TableHead>考试时间</TableHead>
                <TableHead>参考人数</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>{exam.type}</TableCell>
                  <TableCell>{exam.grade}</TableCell>
                  <TableCell>{exam.subjects}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {exam.startDate} ~ {exam.endDate}
                    </div>
                  </TableCell>
                  <TableCell>{exam.students}人</TableCell>
                  <TableCell>{getStatusBadge(exam.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
