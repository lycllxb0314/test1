'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Users,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  UserCircle,
  BookOpen,
  Award,
  Eye,
} from 'lucide-react';

// 模拟教师数据
const mockTeachers = [
  { id: 1, name: '王明华', gender: '男', subject: '语文', title: '高级教师', department: '语文组', phone: '138****1234', email: 'wang@lysf.edu.cn', status: 'active', teachYears: 15 },
  { id: 2, name: '李芳', gender: '女', subject: '数学', title: '一级教师', department: '数学组', phone: '139****5678', email: 'li@lysf.edu.cn', status: 'active', teachYears: 10 },
  { id: 3, name: '张强', gender: '男', subject: '英语', title: '二级教师', department: '英语组', phone: '137****9012', email: 'zhang@lysf.edu.cn', status: 'active', teachYears: 5 },
  { id: 4, name: '刘洋', gender: '女', subject: '科学', title: '一级教师', department: '科学组', phone: '136****3456', email: 'liu@lysf.edu.cn', status: 'active', teachYears: 8 },
  { id: 5, name: '陈红', gender: '女', subject: '音乐', title: '二级教师', department: '艺术组', phone: '135****7890', email: 'chen@lysf.edu.cn', status: 'active', teachYears: 6 },
  { id: 6, name: '赵刚', gender: '男', subject: '体育', title: '一级教师', department: '体育组', phone: '134****2345', email: 'zhao@lysf.edu.cn', status: 'active', teachYears: 12 },
  { id: 7, name: '孙丽', gender: '女', subject: '美术', title: '二级教师', department: '艺术组', phone: '133****6789', email: 'sun@lysf.edu.cn', status: 'on_leave', teachYears: 4 },
  { id: 8, name: '周伟', gender: '男', subject: '信息技术', title: '二级教师', department: '信息组', phone: '132****0123', email: 'zhou@lysf.edu.cn', status: 'active', teachYears: 3 },
];

export default function TeachersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">在职</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-700">请假</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTeachers = mockTeachers.filter(t => {
    const matchesSearch = t.name.includes(searchTerm) || t.email.includes(searchTerm);
    const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  // 按学科统计
  const subjectStats = mockTeachers.reduce((acc, t) => {
    acc[t.subject] = (acc[t.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教师管理</h1>
          <p className="text-gray-500 mt-1">教师信息查询与管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            添加教师
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教师总数</p>
                <p className="text-2xl font-bold text-blue-600">168</p>
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
                <p className="text-sm text-gray-500">高级教师</p>
                <p className="text-2xl font-bold text-purple-600">32</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班主任</p>
                <p className="text-2xl font-bold text-green-600">56</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <UserCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教研组</p>
                <p className="text-2xl font-bold text-orange-600">8</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <BookOpen className="h-5 w-5 text-orange-600" />
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
                placeholder="搜索教师姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="学科" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部学科</SelectItem>
                <SelectItem value="语文">语文</SelectItem>
                <SelectItem value="数学">数学</SelectItem>
                <SelectItem value="英语">英语</SelectItem>
                <SelectItem value="科学">科学</SelectItem>
                <SelectItem value="音乐">音乐</SelectItem>
                <SelectItem value="体育">体育</SelectItem>
                <SelectItem value="美术">美术</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 教师列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>学科</TableHead>
                <TableHead>职称</TableHead>
                <TableHead>教研组</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>教龄</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow 
                  key={teacher.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => router.push(`/academic/teachers/${teacher.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {teacher.name}
                      <Eye className="h-3 w-3 text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={teacher.gender === '男' ? 'text-blue-600' : 'text-pink-600'}>
                      {teacher.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{teacher.subject}</TableCell>
                  <TableCell>{teacher.title}</TableCell>
                  <TableCell>{teacher.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {teacher.phone}
                    </div>
                  </TableCell>
                  <TableCell>{teacher.teachYears}年</TableCell>
                  <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
