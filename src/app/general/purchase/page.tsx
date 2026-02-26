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
  ShoppingCart,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  FileText,
} from 'lucide-react';

// 模拟采购数据
const mockPurchases = [
  { id: 'PO-2024-001', item: '办公文具一批', category: '办公用品', quantity: 50, unit: '套', estimatedPrice: 2500, requester: '李明', department: '教务处', status: 'pending', createTime: '2024-03-15' },
  { id: 'PO-2024-002', item: '教学用投影仪', category: '教学设备', quantity: 2, unit: '台', estimatedPrice: 8000, requester: '王芳', department: '信息中心', status: 'approved', createTime: '2024-03-14' },
  { id: 'PO-2024-003', item: '体育器材', category: '体育用品', quantity: 20, unit: '件', estimatedPrice: 3000, requester: '张强', department: '体育组', status: 'completed', createTime: '2024-03-12' },
  { id: 'PO-2024-004', item: '实验室试剂', category: '实验用品', quantity: 10, unit: '盒', estimatedPrice: 1500, requester: '刘洋', department: '科学组', status: 'rejected', createTime: '2024-03-10' },
  { id: 'PO-2024-005', item: '清洁用品', category: '后勤用品', quantity: 100, unit: '件', estimatedPrice: 2000, requester: '陈红', department: '总务处', status: 'pending', createTime: '2024-03-15' },
];

export default function PurchasePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">待审批</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-700">已批准</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPurchases = mockPurchases.filter(p => {
    const matchesSearch = p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.requester.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-gray-500 mt-1">物资采购申请与审批</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建采购申请
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
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
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月完成</p>
                <p className="text-2xl font-bold text-green-600">25</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月金额</p>
                <p className="text-2xl font-bold text-gray-900">¥58,600</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <DollarSign className="h-5 w-5 text-orange-600" />
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
                placeholder="搜索采购物品或申请人..."
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
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 采购列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>采购单号</TableHead>
                <TableHead>物品名称</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>预估金额</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{purchase.id}</TableCell>
                  <TableCell>{purchase.item}</TableCell>
                  <TableCell>{purchase.category}</TableCell>
                  <TableCell>{purchase.quantity} {purchase.unit}</TableCell>
                  <TableCell>¥{purchase.estimatedPrice.toLocaleString()}</TableCell>
                  <TableCell>{purchase.requester}</TableCell>
                  <TableCell>{purchase.department}</TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell>{purchase.createTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
