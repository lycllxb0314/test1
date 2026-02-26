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
  Shield,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';

// 模拟安全数据
const mockSafety = [
  { id: 1, type: '安全教育', title: '防溺水安全教育记录', date: '2024-03-15', status: 'completed', person: '王老师' },
  { id: 2, type: '安全检查', title: '教室安全隐患排查', date: '2024-03-14', status: 'completed', person: '张老师' },
  { id: 3, type: '应急演练', title: '消防疏散演练', date: '2024-03-18', status: 'upcoming', person: '李老师' },
  { id: 4, type: '隐患整改', title: '操场围栏修复', date: '2024-03-12', status: 'in_progress', person: '后勤部' },
];

// 隐患台账
const mockHazards = [
  { id: 1, location: '教室A301', description: '窗户把手松动', level: 'low', status: 'fixed', fixTime: '2024-03-14' },
  { id: 2, location: '操场西侧', description: '围栏破损', level: 'medium', status: 'fixing', fixTime: '-' },
  { id: 3, location: '走廊B区', description: '地砖松动', level: 'low', status: 'pending', fixTime: '-' },
  { id: 4, location: '楼梯口', description: '应急灯不亮', level: 'high', status: 'fixed', fixTime: '2024-03-13' },
];

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState<'records' | 'hazards'>('records');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700">即将进行</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-700">进行中</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-700">待处理</Badge>;
      case 'fixing':
        return <Badge className="bg-orange-100 text-orange-700">整改中</Badge>;
      case 'fixed':
        return <Badge className="bg-green-100 text-green-700">已整改</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500 text-white">高</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500 text-white">中</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white">低</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">安全应急</h1>
          <p className="text-gray-500 mt-1">安全教育、隐患排查、应急管理</p>
        </div>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建记录
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">安全活动</p>
                <p className="text-2xl font-bold text-purple-600">8</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">隐患排查</p>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已整改</p>
                <p className="text-2xl font-bold text-green-600">10</p>
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
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'records' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('records')}
        >
          安全记录
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'hazards' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('hazards')}
        >
          隐患台账
        </button>
      </div>

      {/* 安全记录 */}
      {activeTab === 'records' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>类型</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSafety.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.person}</TableCell>
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
      )}

      {/* 隐患台账 */}
      {activeTab === 'hazards' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>位置</TableHead>
                  <TableHead>隐患描述</TableHead>
                  <TableHead>危险等级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>整改时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHazards.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.location}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{getLevelBadge(item.level)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.fixTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
