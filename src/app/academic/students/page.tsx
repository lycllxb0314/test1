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
  Users,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  User,
  GraduationCap,
} from 'lucide-react';
import { mockStudents } from '@/data/mock';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const filteredStudents = mockStudents.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.studentId.includes(searchTerm);
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    const matchesClass = classFilter === 'all' || s.class === classFilter;
    return matchesSearch && matchesGrade && matchesClass;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 mt-1">学生信息查询与管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            添加学生
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学生总数</p>
                <p className="text-2xl font-bold text-blue-600">2,800</p>
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
                <p className="text-sm text-gray-500">男生</p>
                <p className="text-2xl font-bold text-cyan-600">1,456</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-100">
                <User className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">女生</p>
                <p className="text-2xl font-bold text-pink-600">1,344</p>
              </div>
              <div className="p-2 rounded-lg bg-pink-100">
                <User className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级数</p>
                <p className="text-2xl font-bold text-green-600">56</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <GraduationCap className="h-5 w-5 text-green-600" />
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
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[120px]">
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
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                <SelectItem value="1班">1班</SelectItem>
                <SelectItem value="2班">2班</SelectItem>
                <SelectItem value="3班">3班</SelectItem>
                <SelectItem value="4班">4班</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>班主任</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{student.studentId}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={student.gender === '男' ? 'text-blue-600' : 'text-pink-600'}>
                      {student.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.homeroomTeacher}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {student.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">在读</Badge>
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
