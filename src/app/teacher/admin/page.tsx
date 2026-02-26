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
  FileText,
  Plus,
  Search,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

// 模拟行政材料数据
const mockMaterials = [
  { id: 1, type: '工作计划', title: '2024年春季学期班主任工作计划', status: 'submitted', submitTime: '2024-02-25', reviewer: '德育处' },
  { id: 2, type: '工作总结', title: '2023年秋季学期班主任工作总结', status: 'approved', submitTime: '2024-01-15', reviewer: '德育处' },
  { id: 3, type: '班级总结', title: '三月份班级工作总结', status: 'draft', submitTime: '-', reviewer: '-' },
  { id: 4, type: '学生评语', title: '期末学生评语', status: 'submitted', submitTime: '2024-01-10', reviewer: '德育处' },
  { id: 5, type: '活动方案', title: '班级春游活动方案', status: 'approved', submitTime: '2024-03-10', reviewer: '教务处' },
];

// AI模板
const aiTemplates = [
  { id: 1, title: '班主任工作计划模板', description: '基于班级情况自动生成学期工作计划' },
  { id: 2, title: '学生评语生成', description: '根据学生表现自动生成个性化评语' },
  { id: 3, title: '班级总结模板', description: '一键生成班级工作总结报告' },
];

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">草稿</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700">已提交</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">已通过</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">需修改</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredMaterials = mockMaterials.filter(m => {
    const matchesSearch = m.title.includes(searchTerm);
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">行政材料</h1>
          <p className="text-gray-500 mt-1">计划、总结、评语等材料管理</p>
        </div>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建材料
        </Button>
      </div>

      {/* AI辅助 */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-6 w-6" />
            <h3 className="text-lg font-bold">AI智能辅助</h3>
          </div>
          <p className="text-white/80 mb-4">一键生成工作计划、学生评语、班级总结等材料</p>
          <div className="grid gap-3 md:grid-cols-3">
            {aiTemplates.map((template) => (
              <Button key={template.id} variant="secondary" className="h-auto py-3 flex-col bg-white/20 hover:bg-white/30 text-white border-0">
                <span className="font-medium">{template.title}</span>
                <span className="text-xs text-white/70 mt-1">{template.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">材料总数</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已通过</p>
                <p className="text-2xl font-bold text-green-600">8</p>
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
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">草稿</p>
                <p className="text-2xl font-bold text-gray-600">2</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
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
                placeholder="搜索材料名称..."
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
                <SelectItem value="工作计划">工作计划</SelectItem>
                <SelectItem value="工作总结">工作总结</SelectItem>
                <SelectItem value="班级总结">班级总结</SelectItem>
                <SelectItem value="学生评语">学生评语</SelectItem>
                <SelectItem value="活动方案">活动方案</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 材料列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>材料类型</TableHead>
                <TableHead>材料名称</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>审核人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.submitTime}</TableCell>
                  <TableCell>{item.reviewer}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">查看</Button>
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
