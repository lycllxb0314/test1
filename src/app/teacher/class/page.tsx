'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Plus,
  Upload,
  RefreshCw,
  Phone,
  Mail,
  MoreHorizontal,
  UserPlus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

// 模拟学生数据
const studentsData = [
  { id: '1', name: '张三', studentNo: '20240101', gender: '男', phone: '138****1234', status: '在校', tags: ['班干部'] },
  { id: '2', name: '李四', studentNo: '20240102', gender: '男', phone: '139****5678', status: '在校', tags: [] },
  { id: '3', name: '王芳', studentNo: '20240103', gender: '女', phone: '137****9012', status: '在校', tags: ['学习委员'] },
  { id: '4', name: '赵敏', studentNo: '20240104', gender: '女', phone: '136****3456', status: '请假', tags: [] },
  { id: '5', name: '孙强', studentNo: '20240105', gender: '男', phone: '135****7890', status: '在校', tags: ['体育委员'] },
  { id: '6', name: '周杰', studentNo: '20240106', gender: '男', phone: '134****1234', status: '在校', tags: [] },
  { id: '7', name: '吴婷', studentNo: '20240107', gender: '女', phone: '133****5678', status: '在校', tags: ['文艺委员'] },
  { id: '8', name: '郑浩', studentNo: '20240108', gender: '男', phone: '132****9012', status: '在校', tags: [] },
];

// 模拟家长数据
const parentsData = [
  { id: '1', studentName: '张三', parentName: '张建国', relationship: '父亲', phone: '138****1234', isPrimary: true, wechat: 'zhang_parent' },
  { id: '2', studentName: '张三', parentName: '李丽', relationship: '母亲', phone: '139****5678', isPrimary: false, wechat: 'lily_li' },
  { id: '3', studentName: '李四', parentName: '李伟', relationship: '父亲', phone: '137****9012', isPrimary: true, wechat: 'li_wei' },
  { id: '4', studentName: '王芳', parentName: '王明', relationship: '父亲', phone: '136****3456', isPrimary: true, wechat: 'wang_ming' },
];

export default function ClassPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  // 筛选学生
  const filteredStudents = studentsData.filter(
    (s) =>
      s.name.includes(searchTerm) ||
      s.studentNo.includes(searchTerm)
  );

  // 统计
  const studentCount = studentsData.length;
  const presentCount = studentsData.filter(s => s.status === '在校').length;
  const parentCount = parentsData.length;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
          <p className="text-gray-500 mt-1">{user?.className || '三年级1班'} · 学生与家长信息管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            同步企微
          </Button>
          <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
            <UserPlus className="h-4 w-4" />
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
                <p className="text-2xl font-bold text-gray-900">{studentCount}</p>
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
                <p className="text-sm text-gray-500">在校人数</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
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
                <p className="text-sm text-gray-500">家长总数</p>
                <p className="text-2xl font-bold text-purple-600">{parentCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">科任教师</p>
                <p className="text-2xl font-bold text-orange-600">5</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页内容 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="students">学生信息</TabsTrigger>
              <TabsTrigger value="parents">家长信息</TabsTrigger>
              <TabsTrigger value="teachers">教师信息</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 学生信息 */}
          <TabsContent value="students" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索学生姓名或学号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Upload className="h-4 w-4" />
                  批量导入
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  导出名单
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>学号</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">{student.studentNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={student.gender === '男' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}>
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <Badge className={student.status === '在校' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {student.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            编辑信息
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            联系家长
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* 家长信息 */}
          <TabsContent value="parents" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>学生姓名</TableHead>
                  <TableHead>家长姓名</TableHead>
                  <TableHead>关系</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>主要联系人</TableHead>
                  <TableHead>微信号</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentsData.map((parent) => (
                  <TableRow key={parent.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{parent.studentName}</TableCell>
                    <TableCell>{parent.parentName}</TableCell>
                    <TableCell>{parent.relationship}</TableCell>
                    <TableCell>{parent.phone}</TableCell>
                    <TableCell>
                      {parent.isPrimary && (
                        <Badge className="bg-purple-100 text-purple-700">主要</Badge>
                      )}
                    </TableCell>
                    <TableCell>{parent.wechat}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Phone className="h-3 w-3" />
                          拨打
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          发消息
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* 教师信息 */}
          <TabsContent value="teachers" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: '张老师', subject: '语文', role: '班主任', phone: '138****1111' },
                { name: '李老师', subject: '数学', role: '副班主任', phone: '139****2222' },
                { name: '王老师', subject: '英语', role: '科任教师', phone: '137****3333' },
                { name: '刘老师', subject: '体育', role: '科任教师', phone: '136****4444' },
                { name: '陈老师', subject: '音乐', role: '科任教师', phone: '135****5555' },
              ].map((teacher, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {teacher.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{teacher.name}</p>
                          {teacher.role === '班主任' && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">班主任</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{teacher.subject}教师</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-4 w-4" />
                      {teacher.phone}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}
