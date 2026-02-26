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
  Calendar,
  CheckCircle,
  Clock,
  Edit,
} from 'lucide-react';

// 模拟工作计划数据
const mockPlans = [
  { id: 1, title: '2024年春季学期德育工作计划', type: '学期计划', creator: '德育处', status: 'published', createTime: '2024-02-20', progress: 35 },
  { id: 2, title: '3月份主题教育活动安排', type: '月度计划', creator: '少先队', status: 'published', createTime: '2024-03-01', progress: 100 },
  { id: 3, title: '清明节祭扫活动方案', type: '活动方案', creator: '德育处', status: 'published', createTime: '2024-03-15', progress: 60 },
  { id: 4, title: '4月份德育工作重点', type: '月度计划', creator: '德育处', status: 'draft', createTime: '2024-03-20', progress: 0 },
  { id: 5, title: '学生行为习惯养成月方案', type: '专项方案', creator: '少先队', status: 'review', createTime: '2024-03-18', progress: 20 },
];

export default function PlansPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">草稿</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-700">审核中</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-700">已发布</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPlans = mockPlans.filter(p => {
    const matchesSearch = p.title.includes(searchTerm);
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作计划</h1>
          <p className="text-gray-500 mt-1">德育工作计划与方案管理</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建计划
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">计划总数</p>
                <p className="text-2xl font-bold text-green-600">15</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已发布</p>
                <p className="text-2xl font-bold text-blue-600">10</p>
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
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-2xl font-bold text-orange-600">5</p>
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
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-2xl font-bold text-yellow-600">2</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Edit className="h-5 w-5 text-yellow-600" />
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
                placeholder="搜索计划名称..."
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
                <SelectItem value="学期计划">学期计划</SelectItem>
                <SelectItem value="月度计划">月度计划</SelectItem>
                <SelectItem value="活动方案">活动方案</SelectItem>
                <SelectItem value="专项方案">专项方案</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 计划列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>计划名称</TableHead>
                <TableHead>计划类型</TableHead>
                <TableHead>创建者</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{plan.title}</TableCell>
                  <TableCell>{plan.type}</TableCell>
                  <TableCell>{plan.creator}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{plan.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell>{plan.createTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
