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
  Calendar,
  Plus,
  Search,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  Star,
} from 'lucide-react';

// 模拟德育活动数据
const mockActivities = [
  { id: 1, title: '学雷锋志愿服务活动', type: '志愿服务', organizer: '少先队大队', participants: 200, date: '2024-03-05', location: '社区', status: 'completed' },
  { id: 2, title: '清明节祭扫活动', type: '主题教育', organizer: '德育处', participants: 500, date: '2024-04-03', location: '烈士陵园', status: 'upcoming' },
  { id: 3, title: '母亲节感恩活动', type: '感恩教育', organizer: '少先队大队', participants: 2800, date: '2024-05-12', location: '各班级', status: 'planning' },
  { id: 4, title: '植树节环保活动', type: '环保教育', organizer: '科学组', participants: 150, date: '2024-03-12', location: '校园', status: 'completed' },
  { id: 5, title: '防震减灾演练', type: '安全教育', organizer: '安保处', participants: 2800, date: '2024-03-18', location: '全校', status: 'completed' },
  { id: 6, title: '读书节系列活动', type: '书香校园', organizer: '教务处', participants: 2800, date: '2024-04-15', location: '图书馆', status: 'upcoming' },
];

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge className="bg-gray-100 text-gray-700">计划中</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-700">即将开始</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      '志愿服务': 'bg-red-100 text-red-700',
      '主题教育': 'bg-blue-100 text-blue-700',
      '感恩教育': 'bg-pink-100 text-pink-700',
      '环保教育': 'bg-green-100 text-green-700',
      '安全教育': 'bg-orange-100 text-orange-700',
      '书香校园': 'bg-purple-100 text-purple-700',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>{type}</Badge>;
  };

  const filteredActivities = mockActivities.filter(a => 
    a.title.includes(searchTerm) || a.type.includes(searchTerm)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">德育活动</h1>
          <p className="text-gray-500 mt-1">德育活动组织与管理</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建活动
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月活动</p>
                <p className="text-2xl font-bold text-green-600">6</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">参与人次</p>
                <p className="text-2xl font-bold text-blue-600">9,250</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">精彩活动</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索活动名称或类型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 活动列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>活动名称</TableHead>
                <TableHead>活动类型</TableHead>
                <TableHead>组织者</TableHead>
                <TableHead>参与人数</TableHead>
                <TableHead>活动时间</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>{getTypeBadge(activity.type)}</TableCell>
                  <TableCell>{activity.organizer}</TableCell>
                  <TableCell>{activity.participants}人</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {activity.date}
                    </div>
                  </TableCell>
                  <TableCell>{activity.location}</TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
