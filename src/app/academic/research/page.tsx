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
  Target,
  Plus,
  Search,
  Calendar,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
} from 'lucide-react';

// 模拟教研活动数据
const mockResearch = [
  { id: 1, title: '语文组公开课活动', type: '公开课', organizer: '语文组', leader: '王明华', participants: 15, date: '2024-03-20', location: '录播室', status: 'completed' },
  { id: 2, title: '数学新课标研讨', type: '教研研讨', organizer: '数学组', leader: '李芳', participants: 12, date: '2024-03-22', location: '会议室', status: 'completed' },
  { id: 3, title: '英语教学观摩', type: '教学观摩', organizer: '英语组', leader: '张强', participants: 8, date: '2024-03-25', location: '三年级教室', status: 'upcoming' },
  { id: 4, title: '信息技术融合教学培训', type: '培训', organizer: '信息中心', leader: '周伟', participants: 50, date: '2024-03-28', location: '多媒体教室', status: 'upcoming' },
  { id: 5, title: '青年教师教学比赛', type: '比赛', organizer: '教务处', leader: '校长室', participants: 20, date: '2024-04-01', location: '报告厅', status: 'planning' },
];

export default function ResearchPage() {
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

  const filteredResearch = mockResearch.filter(r => 
    r.title.includes(searchTerm) || r.organizer.includes(searchTerm)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教研活动</h1>
          <p className="text-gray-500 mt-1">教学研究与教师培训管理</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
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
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">参与人次</p>
                <p className="text-2xl font-bold text-green-600">268</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">公开课</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-orange-600">5</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <CheckCircle className="h-5 w-5 text-orange-600" />
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
              placeholder="搜索活动名称或组织者..."
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
                <TableHead>负责人</TableHead>
                <TableHead>参与人数</TableHead>
                <TableHead>活动时间</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResearch.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.organizer}</TableCell>
                  <TableCell>{item.leader}</TableCell>
                  <TableCell>{item.participants}人</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {item.date}
                    </div>
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
