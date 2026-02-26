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
  School,
  Plus,
  Search,
  Users,
  UserCircle,
  Building2,
  Award,
} from 'lucide-react';

// 模拟班级数据
const mockClasses = [
  { id: 1, name: '一年级1班', grade: '一年级', classNum: '1班', students: 50, headTeacher: '王明华', classroom: '教学楼A101', status: 'active' },
  { id: 2, name: '一年级2班', grade: '一年级', classNum: '2班', students: 49, headTeacher: '李芳', classroom: '教学楼A102', status: 'active' },
  { id: 3, name: '二年级1班', grade: '二年级', classNum: '1班', students: 48, headTeacher: '张强', classroom: '教学楼A201', status: 'active' },
  { id: 4, name: '二年级2班', grade: '二年级', classNum: '2班', students: 51, headTeacher: '刘洋', classroom: '教学楼A202', status: 'active' },
  { id: 5, name: '三年级1班', grade: '三年级', classNum: '1班', students: 52, headTeacher: '陈红', classroom: '教学楼A301', status: 'active' },
  { id: 6, name: '三年级2班', grade: '三年级', classNum: '2班', students: 50, headTeacher: '赵刚', classroom: '教学楼A302', status: 'active' },
  { id: 7, name: '四年级1班', grade: '四年级', classNum: '1班', students: 47, headTeacher: '孙丽', classroom: '教学楼B401', status: 'active' },
  { id: 8, name: '四年级2班', grade: '四年级', classNum: '2班', students: 49, headTeacher: '周伟', classroom: '教学楼B402', status: 'active' },
  { id: 9, name: '五年级1班', grade: '五年级', classNum: '1班', students: 50, headTeacher: '吴华', classroom: '教学楼B501', status: 'active' },
  { id: 10, name: '六年级1班', grade: '六年级', classNum: '1班', students: 48, headTeacher: '郑文', classroom: '教学楼B601', status: 'active' },
];

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  const filteredClasses = mockClasses.filter(c => {
    const matchesSearch = c.name.includes(searchTerm) || c.headTeacher.includes(searchTerm);
    const matchesGrade = gradeFilter === 'all' || c.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // 按年级统计
  const gradeStats = mockClasses.reduce((acc, c) => {
    acc[c.grade] = (acc[c.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalStudents = mockClasses.reduce((sum, c) => sum + c.students, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
          <p className="text-gray-500 mt-1">班级信息查询与管理</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新增班级
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级总数</p>
                <p className="text-2xl font-bold text-blue-600">{mockClasses.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <School className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学生总数</p>
                <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
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
                <p className="text-sm text-gray-500">平均班额</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(totalStudents / mockClasses.length)}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <UserCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">年级数</p>
                <p className="text-2xl font-bold text-orange-600">{Object.keys(gradeStats).length}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Building2 className="h-5 w-5 text-orange-600" />
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
                placeholder="搜索班级名称或班主任..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                <SelectItem value="一年级">一年级</SelectItem>
                <SelectItem value="二年级">二年级</SelectItem>
                <SelectItem value="三年级">三年级</SelectItem>
                <SelectItem value="四年级">四年级</SelectItem>
                <SelectItem value="五年级">五年级</SelectItem>
                <SelectItem value="六年级">六年级</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 班级列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>班级名称</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>学生人数</TableHead>
                <TableHead>班主任</TableHead>
                <TableHead>教室位置</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => (
                <TableRow key={cls.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.grade}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {cls.students}人
                    </Badge>
                  </TableCell>
                  <TableCell>{cls.headTeacher}</TableCell>
                  <TableCell>{cls.classroom}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">正常</Badge>
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
