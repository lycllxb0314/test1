'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Users,
  CheckCircle,
  Clock,
  Send,
  BarChart3,
} from 'lucide-react';

// 模拟信息收集数据
const mockCollections = [
  { id: 1, title: '学生家庭信息采集', status: 'completed', total: 50, submitted: 50, deadline: '2024-03-10', createTime: '2024-03-01' },
  { id: 2, title: '春游活动报名确认', status: 'in_progress', total: 50, submitted: 42, deadline: '2024-03-20', createTime: '2024-03-15' },
  { id: 3, title: '学生健康状况调查', status: 'in_progress', total: 50, submitted: 38, deadline: '2024-03-25', createTime: '2024-03-18' },
  { id: 4, title: '课后服务报名登记', status: 'pending', total: 50, submitted: 0, deadline: '2024-03-30', createTime: '2024-03-20' },
];

// 未提交学生
const mockNotSubmitted = [
  { studentId: '2024023', name: '王小明', parent: '王先生', phone: '138****1234' },
  { studentId: '2024035', name: '李小红', parent: '李女士', phone: '139****5678' },
  { studentId: '2024042', name: '张小刚', parent: '张先生', phone: '137****9012' },
];

export default function CollectPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-700">未开始</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">进行中</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信息收集</h1>
          <p className="text-gray-500 mt-1">企业微信信息采集与统计</p>
        </div>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建收集
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">收集任务</p>
                <p className="text-2xl font-bold text-purple-600">4</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">进行中</p>
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
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-green-600">1</p>
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
                <p className="text-sm text-gray-500">完成率</p>
                <p className="text-2xl font-bold text-orange-600">85%</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 收集任务列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>收集任务</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>收集名称</TableHead>
                <TableHead>收集进度</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCollections.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(item.submitted / item.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{item.submitted}/{item.total}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.deadline}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.createTime}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">查看详情</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 未提交提醒 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>未提交提醒</CardTitle>
            <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white gap-1">
              <Send className="h-3 w-3" />
              一键提醒
            </Button>
          </div>
          <CardDescription>春游活动报名确认 - 未提交学生名单</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>学号</TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>家长姓名</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockNotSubmitted.map((item) => (
                <TableRow key={item.studentId} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.studentId}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.parent}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">单独提醒</Button>
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
