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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  User,
  Phone,
} from 'lucide-react';
import { mockRepairRequests } from '@/data/mock';

export default function RepairsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">待处理</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">处理中</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">已拒绝</Badge>;
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

  const filteredRepairs = mockRepairRequests.filter(repair => {
    const matchesSearch = (repair.item || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (repair.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报修管理</h1>
          <p className="text-gray-500 mt-1">设施设备维修申请与处理</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          新建报修
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-yellow-600">15</p>
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
                <p className="text-2xl font-bold text-blue-600">8</p>
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
                <p className="text-sm text-gray-500">本月完成</p>
                <p className="text-2xl font-bold text-green-600">42</p>
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
                <p className="text-sm text-gray-500">平均响应</p>
                <p className="text-2xl font-bold text-gray-900">2.5h</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Clock className="h-5 w-5 text-gray-600" />
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
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="in_progress">处理中</SelectItem>
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
                <TableHead>状态</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.map((repair) => (
                <TableRow key={repair.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{repair.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{repair.item}</p>
                      <p className="text-xs text-gray-500">{repair.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {repair.location || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(repair.priority || 'normal')}</TableCell>
                  <TableCell>{getStatusBadge(repair.status || 'pending')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-400" />
                      {repair.applicantName || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {(repair.createdAt || '').split(' ')[0] || '-'}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">详情</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新建报修对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建报修申请</DialogTitle>
            <DialogDescription>填写报修信息，提交后将有专人处理</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">报修物品</label>
              <Input placeholder="如：投影仪、空调、桌椅等" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">所在位置</label>
              <Input placeholder="如：教学楼301教室" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">问题描述</label>
              <textarea 
                className="w-full rounded-lg border border-gray-200 p-3 text-sm"
                placeholder="详细描述问题情况..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">紧急程度</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择紧急程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="normal">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                提交申请
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
