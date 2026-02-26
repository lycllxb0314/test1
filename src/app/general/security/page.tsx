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
  Shield,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Calendar,
  MapPin,
} from 'lucide-react';

// 模拟安全巡查数据
const mockSecurityRecords = [
  { id: 'SC-2024-001', type: '日常巡查', area: '教学楼A区', inspector: '张安保', issues: 0, status: 'completed', time: '2024-03-15 08:30' },
  { id: 'SC-2024-002', type: '消防检查', area: '实验楼', inspector: '李安全', issues: 2, status: 'pending', time: '2024-03-15 09:00' },
  { id: 'SC-2024-003', type: '门卫检查', area: '校门', inspector: '王门卫', issues: 0, status: 'completed', time: '2024-03-15 07:00' },
  { id: 'SC-2024-004', type: '日常巡查', area: '操场', inspector: '赵安保', issues: 1, status: 'in_progress', time: '2024-03-15 10:00' },
  { id: 'SC-2024-005', type: '消防检查', area: '食堂', inspector: '李安全', issues: 0, status: 'completed', time: '2024-03-14 15:00' },
];

// 安全隐患
const mockHazards = [
  { id: 'HZ-001', location: '实验楼2楼', description: '灭火器压力不足', level: 'medium', status: 'pending', createTime: '2024-03-15' },
  { id: 'HZ-002', location: '实验楼3楼', description: '应急照明灯损坏', level: 'low', status: 'pending', createTime: '2024-03-15' },
  { id: 'HZ-003', location: '操场西侧', description: '围栏破损', level: 'high', status: 'in_progress', createTime: '2024-03-15' },
];

export default function SecurityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'patrol' | 'hazard'>('patrol');

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

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500 text-white">高</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500 text-white">中</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white">低</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">安全管理</h1>
          <p className="text-gray-500 mt-1">校园安全巡查与隐患排查</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建巡查记录
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日巡查</p>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理隐患</p>
                <p className="text-2xl font-bold text-red-600">5</p>
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
                <p className="text-sm text-gray-500">本月整改</p>
                <p className="text-2xl font-bold text-green-600">18</p>
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
                <p className="text-sm text-gray-500">安全等级</p>
                <p className="text-2xl font-bold text-green-600">良好</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'patrol' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('patrol')}
        >
          巡查记录
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'hazard' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('hazard')}
        >
          隐患排查
        </button>
      </div>

      {/* 巡查记录 */}
      {activeTab === 'patrol' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>巡查编号</TableHead>
                  <TableHead>巡查类型</TableHead>
                  <TableHead>巡查区域</TableHead>
                  <TableHead>巡查人员</TableHead>
                  <TableHead>发现问题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>巡查时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSecurityRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{record.id}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.area}</TableCell>
                    <TableCell>{record.inspector}</TableCell>
                    <TableCell>
                      {record.issues > 0 ? (
                        <Badge className="bg-red-100 text-red-700">{record.issues}个问题</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">无问题</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{record.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 隐患排查 */}
      {activeTab === 'hazard' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>隐患编号</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>问题描述</TableHead>
                  <TableHead>危险等级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发现时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHazards.map((hazard) => (
                  <TableRow key={hazard.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{hazard.id}</TableCell>
                    <TableCell>{hazard.location}</TableCell>
                    <TableCell>{hazard.description}</TableCell>
                    <TableCell>{getLevelBadge(hazard.level)}</TableCell>
                    <TableCell>{getStatusBadge(hazard.status)}</TableCell>
                    <TableCell>{hazard.createTime}</TableCell>
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
