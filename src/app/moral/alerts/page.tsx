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
  AlertTriangle,
  Search,
  Bell,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// 模拟预警数据
const mockAlerts = [
  { id: 1, studentId: '2024015', name: '王小明', class: '四年级2班', type: '学业预警', level: 'high', description: '连续两次考试不及格', status: 'pending', createTime: '2024-03-15' },
  { id: 2, studentId: '2024023', name: '李小红', class: '三年级1班', type: '行为预警', level: 'medium', description: '近期多次迟到早退', status: 'in_progress', createTime: '2024-03-14' },
  { id: 3, studentId: '2024038', name: '张小刚', class: '五年级3班', type: '心理预警', level: 'high', description: '情绪波动较大，需关注', status: 'pending', createTime: '2024-03-13' },
  { id: 4, studentId: '2024045', name: '刘小芳', class: '六年级1班', type: '出勤预警', level: 'low', description: '本周缺勤超过3天', status: 'completed', createTime: '2024-03-12' },
  { id: 5, studentId: '2024052', name: '陈小强', class: '二年级2班', type: '学业预警', level: 'medium', description: '作业多次未完成', status: 'in_progress', createTime: '2024-03-11' },
];

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500 text-white">高风险</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500 text-white">中风险</Badge>;
      case 'low':
        return <Badge className="bg-yellow-500 text-white">低风险</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">待处理</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">处理中</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '学业预警':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case '行为预警':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case '心理预警':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      case '出勤预警':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredAlerts = mockAlerts.filter(a => {
    const matchesSearch = a.name.includes(searchTerm) || a.studentId.includes(searchTerm);
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 统计
  const stats = {
    total: mockAlerts.length,
    high: mockAlerts.filter(a => a.level === 'high').length,
    pending: mockAlerts.filter(a => a.status === 'pending').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预警管理</h1>
          <p className="text-gray-500 mt-1">学生异常情况预警与干预</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
          <Bell className="h-4 w-4" />
          新建预警
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">预警总数</p>
                <p className="text-2xl font-bold text-red-600">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">高风险</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月解决</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
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
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="学业预警">学业预警</SelectItem>
                <SelectItem value="行为预警">行为预警</SelectItem>
                <SelectItem value="心理预警">心理预警</SelectItem>
                <SelectItem value="出勤预警">出勤预警</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 预警列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>预警类型</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>预警描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发现时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{alert.studentId}</TableCell>
                  <TableCell>{alert.name}</TableCell>
                  <TableCell>{alert.class}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(alert.type)}
                      {alert.type}
                    </div>
                  </TableCell>
                  <TableCell>{getLevelBadge(alert.level)}</TableCell>
                  <TableCell>{alert.description}</TableCell>
                  <TableCell>{getStatusBadge(alert.status)}</TableCell>
                  <TableCell>{alert.createTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
