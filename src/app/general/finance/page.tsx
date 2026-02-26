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
  DollarSign,
  Plus,
  Search,
  Clock,
  CheckCircle,
  FileText,
  Receipt,
  TrendingUp,
  Calendar,
} from 'lucide-react';

// 模拟财务数据
const mockFinances = [
  { id: 'FN-2024-001', type: '报销', category: '办公用品', amount: 1500, applicant: '李明', department: '教务处', status: 'pending', createTime: '2024-03-15', description: '教学办公用品采购' },
  { id: 'FN-2024-002', type: '报销', category: '差旅费', amount: 2800, applicant: '王芳', department: '德育处', status: 'approved', createTime: '2024-03-14', description: '外出培训差旅' },
  { id: 'FN-2024-003', type: '支出', category: '设备维修', amount: 3500, applicant: '张强', department: '总务处', status: 'completed', createTime: '2024-03-12', description: '空调维修费用' },
  { id: 'FN-2024-004', type: '报销', category: '活动经费', amount: 5000, applicant: '刘洋', department: '少先队', status: 'pending', createTime: '2024-03-10', description: '少先队活动支出' },
  { id: 'FN-2024-005', type: '支出', category: '水电费', amount: 12000, applicant: '陈红', department: '总务处', status: 'completed', createTime: '2024-03-08', description: '3月份水电费' },
];

export default function FinancePage() {
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

  const filteredFinances = mockFinances.filter(f => {
    const matchesSearch = f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.applicant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">财务管理</h1>
          <p className="text-gray-500 mt-1">费用报销与财务支出管理</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建报销申请
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-yellow-600">8</p>
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
                <p className="text-sm text-gray-500">本月支出</p>
                <p className="text-2xl font-bold text-red-600">¥128,500</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月报销</p>
                <p className="text-2xl font-bold text-blue-600">¥35,200</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">预算余额</p>
                <p className="text-2xl font-bold text-green-600">¥256,800</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
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
                placeholder="搜索报销事项或申请人..."
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 财务列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>单号</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>摘要</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinances.map((finance) => (
                <TableRow key={finance.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{finance.id}</TableCell>
                  <TableCell>{finance.type}</TableCell>
                  <TableCell>{finance.category}</TableCell>
                  <TableCell className="text-red-600 font-medium">¥{finance.amount.toLocaleString()}</TableCell>
                  <TableCell>{finance.description}</TableCell>
                  <TableCell>{finance.applicant}</TableCell>
                  <TableCell>{finance.department}</TableCell>
                  <TableCell>{getStatusBadge(finance.status)}</TableCell>
                  <TableCell>{finance.createTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
