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
  Award,
  Search,
  Star,
  Heart,
  Shield,
  Users,
  TrendingUp,
} from 'lucide-react';

// 模拟德育评价数据
const mockAssessments = [
  { id: 1, studentId: '2024001', name: '张小明', class: '三年级1班', moral: 95, behavior: 92, activity: 88, social: 90, total: 91.5, level: '优秀' },
  { id: 2, studentId: '2024002', name: '李小红', class: '三年级1班', moral: 92, behavior: 95, activity: 90, social: 88, total: 91.3, level: '优秀' },
  { id: 3, studentId: '2024003', name: '王小刚', class: '三年级1班', moral: 88, behavior: 85, activity: 82, social: 80, total: 83.8, level: '良好' },
  { id: 4, studentId: '2024004', name: '赵小芳', class: '三年级1班', moral: 90, behavior: 88, activity: 85, social: 82, total: 86.3, level: '良好' },
  { id: 5, studentId: '2024005', name: '刘小华', class: '三年级1班', moral: 85, behavior: 80, activity: 78, social: 75, total: 79.5, level: '及格' },
  { id: 6, studentId: '2024006', name: '陈小强', class: '三年级1班', moral: 78, behavior: 75, activity: 70, social: 72, total: 73.8, level: '及格' },
];

export default function AssessmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const getLevelBadge = (level: string) => {
    switch (level) {
      case '优秀':
        return <Badge className="bg-green-100 text-green-700">优秀</Badge>;
      case '良好':
        return <Badge className="bg-blue-100 text-blue-700">良好</Badge>;
      case '及格':
        return <Badge className="bg-yellow-100 text-yellow-700">及格</Badge>;
      case '待提高':
        return <Badge className="bg-red-100 text-red-700">待提高</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const filteredAssessments = mockAssessments.filter(a => {
    const matchesSearch = a.name.includes(searchTerm) || a.studentId.includes(searchTerm);
    const matchesLevel = levelFilter === 'all' || a.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // 统计
  const stats = {
    excellent: mockAssessments.filter(a => a.level === '优秀').length,
    good: mockAssessments.filter(a => a.level === '良好').length,
    pass: mockAssessments.filter(a => a.level === '及格').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">德育评价</h1>
          <p className="text-gray-500 mt-1">学生德育综合素质评价</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
          <Award className="h-4 w-4" />
          评价录入
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">评价人数</p>
                <p className="text-2xl font-bold text-green-600">2,800</p>
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
                <p className="text-sm text-gray-500">优秀学生</p>
                <p className="text-2xl font-bold text-purple-600">{stats.excellent}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">良好学生</p>
                <p className="text-2xl font-bold text-blue-600">{stats.good}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">优秀率</p>
                <p className="text-2xl font-bold text-orange-600">35%</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 评价维度说明 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">评价维度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-400" />
              <span>思想品德：爱国、诚信、友善</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-400" />
              <span>行为习惯：纪律、卫生、礼仪</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-400" />
              <span>活动参与：社团、竞赛、志愿</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-400" />
              <span>社会实践：劳动、调研、服务</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="等级筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="优秀">优秀</SelectItem>
                <SelectItem value="良好">良好</SelectItem>
                <SelectItem value="及格">及格</SelectItem>
                <SelectItem value="待提高">待提高</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 评价列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>思想品德</TableHead>
                <TableHead>行为习惯</TableHead>
                <TableHead>活动参与</TableHead>
                <TableHead>社会实践</TableHead>
                <TableHead>综合分</TableHead>
                <TableHead>等级</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.studentId}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.class}</TableCell>
                  <TableCell>{item.moral}</TableCell>
                  <TableCell>{item.behavior}</TableCell>
                  <TableCell>{item.activity}</TableCell>
                  <TableCell>{item.social}</TableCell>
                  <TableCell className="font-bold">{item.total}</TableCell>
                  <TableCell>{getLevelBadge(item.level)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
