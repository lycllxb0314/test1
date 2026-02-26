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
  Wrench,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User,
} from 'lucide-react';
import { mockRepairRequests } from '@/data/mock';

export default function RepairApprovalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">待审批</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">已批准</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">已拒绝</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-100 text-purple-700">处理中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500 text-white">紧急</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">高</Badge>;
      case 'normal':
        return <Badge className="bg-blue-500 text-white">中</Badge>;
      case 'low':
        return <Badge className="bg-gray-500 text-white">低</Badge>;
      default:
        return null;
    }
  };

  const filteredRepairs = mockRepairRequests.filter(r => {
    const matchesSearch = r.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计
  const stats = {
    pending: mockRepairRequests.filter(r => r.status === 'pending').length,
    inProgress: mockRepairRequests.filter(r => r.status === 'in_progress').length,
    completed: mockRepairRequests.filter(r => r.status === 'completed').length,
    rejected: mockRepairRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-red-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报修审批</h1>
          <p className="text-gray-500 mt-1">设施设备报修申请审批</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
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
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
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
                placeholder="搜索设备名称或位置..."
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
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 报修列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>单号</TableHead>
                <TableHead>报修物品</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.map((repair) => (
                <TableRow key={repair.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{repair.id}</TableCell>
                  <TableCell>{repair.item}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {repair.location}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(repair.priority)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-400" />
                      {repair.applicantName}
                    </div>
                  </TableCell>
                  <TableCell>{repair.createdAt}</TableCell>
                  <TableCell>{getStatusBadge(repair.status)}</TableCell>
                  <TableCell>
                    {repair.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">批准</Button>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-300">拒绝</Button>
                      </div>
                    )}
                    {repair.status !== 'pending' && (
                      <Button size="sm" variant="outline">查看</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
