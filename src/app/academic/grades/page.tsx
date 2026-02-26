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
  BookOpen,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from 'lucide-react';

// 模拟成绩数据
const mockGrades = [
  { id: 1, studentId: '2024001', name: '张小明', class: '三年级1班', chinese: 92, math: 95, english: 88, science: 90, total: 365, average: 91.3, rank: 1, trend: 'up' },
  { id: 2, studentId: '2024002', name: '李小红', class: '三年级1班', chinese: 88, math: 92, english: 95, science: 85, total: 360, average: 90.0, rank: 2, trend: 'up' },
  { id: 3, studentId: '2024003', name: '王小刚', class: '三年级1班', chinese: 85, math: 88, english: 82, science: 90, total: 345, average: 86.3, rank: 3, trend: 'same' },
  { id: 4, studentId: '2024004', name: '赵小芳', class: '三年级1班', chinese: 90, math: 78, english: 85, science: 88, total: 341, average: 85.3, rank: 4, trend: 'down' },
  { id: 5, studentId: '2024005', name: '刘小华', class: '三年级1班', chinese: 78, math: 85, english: 80, science: 82, total: 325, average: 81.3, rank: 5, trend: 'up' },
];

export default function GradesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGradeBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-700">优秀</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-700">良好</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-700">及格</Badge>;
    return <Badge className="bg-red-100 text-red-700">不及格</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩管理</h1>
          <p className="text-gray-500 mt-1">学生成绩录入与查询</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出成绩
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <BookOpen className="h-4 w-4" />
            成绩录入
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">参考人数</p>
                <p className="text-2xl font-bold text-blue-600">450</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">平均分</p>
                <p className="text-2xl font-bold text-green-600">86.5</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">优秀率</p>
                <p className="text-2xl font-bold text-purple-600">32%</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">及格率</p>
                <p className="text-2xl font-bold text-orange-600">95%</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
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
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="科目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部科目</SelectItem>
                <SelectItem value="chinese">语文</SelectItem>
                <SelectItem value="math">数学</SelectItem>
                <SelectItem value="english">英语</SelectItem>
                <SelectItem value="science">科学</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 成绩列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>语文</TableHead>
                <TableHead>数学</TableHead>
                <TableHead>英语</TableHead>
                <TableHead>科学</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>平均分</TableHead>
                <TableHead>排名</TableHead>
                <TableHead>趋势</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockGrades.map((grade) => (
                <TableRow key={grade.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{grade.studentId}</TableCell>
                  <TableCell>{grade.name}</TableCell>
                  <TableCell>{grade.class}</TableCell>
                  <TableCell>{grade.chinese}</TableCell>
                  <TableCell>{grade.math}</TableCell>
                  <TableCell>{grade.english}</TableCell>
                  <TableCell>{grade.science}</TableCell>
                  <TableCell className="font-bold">{grade.total}</TableCell>
                  <TableCell>{grade.average.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">第{grade.rank}名</Badge>
                  </TableCell>
                  <TableCell>{getTrendIcon(grade.trend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
