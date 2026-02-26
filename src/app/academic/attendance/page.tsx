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
  CheckSquare,
  Search,
  Download,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// 模拟考勤数据
const mockAttendance = [
  { id: 1, name: '王明华', department: '语文组', date: '2024-03-15', checkIn: '07:45', checkOut: '17:30', status: 'normal', hours: 8 },
  { id: 2, name: '李芳', department: '数学组', date: '2024-03-15', checkIn: '08:05', checkOut: '17:30', status: 'late', hours: 8 },
  { id: 3, name: '张强', department: '英语组', date: '2024-03-15', checkIn: '07:50', checkOut: '16:00', status: 'early', hours: 7 },
  { id: 4, name: '刘洋', department: '科学组', date: '2024-03-15', checkIn: '-', checkOut: '-', status: 'absent', hours: 0 },
  { id: 5, name: '陈红', department: '艺术组', date: '2024-03-15', checkIn: '07:48', checkOut: '17:35', status: 'normal', hours: 8 },
  { id: 6, name: '赵刚', department: '体育组', date: '2024-03-15', checkIn: '07:52', checkOut: '17:28', status: 'normal', hours: 8 },
  { id: 7, name: '孙丽', department: '艺术组', date: '2024-03-15', checkIn: '07:55', checkOut: '17:30', status: 'normal', hours: 8 },
  { id: 8, name: '周伟', department: '信息组', date: '2024-03-15', checkIn: '08:15', checkOut: '17:40', status: 'late', hours: 8 },
];

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-700">正常</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-700">迟到</Badge>;
      case 'early':
        return <Badge className="bg-orange-100 text-orange-700">早退</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700">缺勤</Badge>;
      case 'leave':
        return <Badge className="bg-blue-100 text-blue-700">请假</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAttendance = mockAttendance.filter(a => {
    const matchesSearch = a.name.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计
  const stats = {
    normal: mockAttendance.filter(a => a.status === 'normal').length,
    late: mockAttendance.filter(a => a.status === 'late').length,
    early: mockAttendance.filter(a => a.status === 'early').length,
    absent: mockAttendance.filter(a => a.status === 'absent').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教师考勤</h1>
          <p className="text-gray-500 mt-1">教师出勤记录与统计</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">正常出勤</p>
                <p className="text-2xl font-bold text-green-600">{stats.normal}</p>
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
                <p className="text-sm text-gray-500">迟到</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
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
                <p className="text-sm text-gray-500">早退</p>
                <p className="text-2xl font-bold text-orange-600">{stats.early}</p>
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
                <p className="text-sm text-gray-500">缺勤</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
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
                placeholder="搜索教师姓名..."
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
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="late">迟到</SelectItem>
                <SelectItem value="early">早退</SelectItem>
                <SelectItem value="absent">缺勤</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 考勤列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>姓名</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>签到时间</TableHead>
                <TableHead>签退时间</TableHead>
                <TableHead>工作时长</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.checkIn}</TableCell>
                  <TableCell>{item.checkOut}</TableCell>
                  <TableCell>{item.hours}小时</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
