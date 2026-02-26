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
  GraduationCap,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  UserPlus,
  CalendarClock,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 教师信息
interface GradeTeacher {
  id: string;
  name: string;
  subject: string;
  classId?: string;
  className?: string;
  phone: string;
  status: '在岗' | '请假' | '外出';
  leaveDays: number;
  substituteCount: number;
}

// 班级信息
interface GradeClass {
  id: string;
  name: string;
  headTeacherId: string;
  headTeacherName: string;
  studentCount: number;
  todaySubstitute: number;
}

// 模拟数据 - 三年级
const mockTeachers: GradeTeacher[] = [
  { id: 't1', name: '张小燕', subject: '语文', classId: '3-1', className: '三年1班', phone: '138****1007', status: '在岗', leaveDays: 2, substituteCount: 1 },
  { id: 't2', name: '李文博', subject: '数学', classId: '3-2', className: '三年2班', phone: '138****1008', status: '在岗', leaveDays: 0, substituteCount: 2 },
  { id: 't3', name: '王丽萍', subject: '英语', phone: '138****1009', status: '请假', leaveDays: 5, substituteCount: 0 },
  { id: 't4', name: '陈大明', subject: '科学', phone: '138****1015', status: '在岗', leaveDays: 1, substituteCount: 0 },
  { id: 't5', name: '周小芳', subject: '音乐', phone: '138****1016', status: '在岗', leaveDays: 0, substituteCount: 1 },
  { id: 't6', name: '吴强', subject: '体育', phone: '138****1017', status: '在岗', leaveDays: 0, substituteCount: 0 },
  { id: 't7', name: '赵美玲', subject: '美术', phone: '138****1018', status: '外出', leaveDays: 1, substituteCount: 0 },
  { id: 't8', name: '孙伟', subject: '语文', classId: '3-3', className: '三年3班', phone: '138****1019', status: '在岗', leaveDays: 0, substituteCount: 1 },
  { id: 't9', name: '钱华', subject: '数学', classId: '3-4', className: '三年4班', phone: '138****1020', status: '在岗', leaveDays: 2, substituteCount: 0 },
  { id: 't10', name: '郑敏', subject: '英语', classId: '3-5', className: '三年5班', phone: '138****1021', status: '在岗', leaveDays: 1, substituteCount: 1 },
];

const mockClasses: GradeClass[] = [
  { id: '3-1', name: '三年1班', headTeacherId: 't1', headTeacherName: '张小燕', studentCount: 45, todaySubstitute: 0 },
  { id: '3-2', name: '三年2班', headTeacherId: 't2', headTeacherName: '李文博', studentCount: 43, todaySubstitute: 1 },
  { id: '3-3', name: '三年3班', headTeacherId: 't8', headTeacherName: '孙伟', studentCount: 44, todaySubstitute: 0 },
  { id: '3-4', name: '三年4班', headTeacherId: 't9', headTeacherName: '钱华', studentCount: 46, todaySubstitute: 0 },
  { id: '3-5', name: '三年5班', headTeacherId: 't10', headTeacherName: '郑敏', studentCount: 42, todaySubstitute: 2 },
];

export default function GradeManagementPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [grade] = useState(3); // 当前管理的年级

  // 过滤教师
  const filteredTeachers = mockTeachers.filter(t => {
    const matchesSearch = t.name.includes(searchTerm) || t.subject.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计数据
  const stats = {
    totalTeachers: mockTeachers.length,
    onDuty: mockTeachers.filter(t => t.status === '在岗').length,
    onLeave: mockTeachers.filter(t => t.status === '请假').length,
    totalClasses: mockClasses.length,
    totalStudents: mockClasses.reduce((sum, c) => sum + c.studentCount, 0),
    todaySubstitute: mockClasses.reduce((sum, c) => sum + c.todaySubstitute, 0),
    monthLeaveDays: mockTeachers.reduce((sum, t) => sum + t.leaveDays, 0),
    monthSubstituteCount: mockTeachers.reduce((sum, t) => sum + t.substituteCount, 0),
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      '在岗': { label: '在岗', className: 'bg-green-100 text-green-700' },
      '请假': { label: '请假', className: 'bg-yellow-100 text-yellow-700' },
      '外出': { label: '外出', className: 'bg-blue-100 text-blue-700' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-500" />
            <h1 className="text-2xl font-bold text-gray-900">年级管理</h1>
          </div>
          <p className="text-gray-500 mt-1">管理三年级教师、班级信息，查看请假调课统计</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-teal-100 text-teal-700 text-base px-4 py-1">
            {grade}年级
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">年级教师</p>
                <p className="text-3xl font-bold text-gray-700">{stats.totalTeachers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.onDuty} 在岗
              </span>
              <span className="text-yellow-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats.onLeave} 请假
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">年级班级</p>
                <p className="text-3xl font-bold text-gray-700">{stats.totalClasses}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              共 {stats.totalStudents} 名学生
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日代课</p>
                <p className="text-3xl font-bold text-teal-600">{stats.todaySubstitute}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                <CalendarClock className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              涉及 {mockClasses.filter(c => c.todaySubstitute > 0).length} 个班级
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月请假</p>
                <p className="text-3xl font-bold text-amber-600">{stats.monthLeaveDays} 天</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <TrendingDown className="h-3 w-3 text-green-500" />
              较上月减少 2 天
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 教师列表 */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-500" />
                教师名单
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索教师..."
                    className="pl-9 w-48 h-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="在岗">在岗</SelectItem>
                    <SelectItem value="请假">请假</SelectItem>
                    <SelectItem value="外出">外出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>学科</TableHead>
                  <TableHead>班主任</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>本月请假</TableHead>
                  <TableHead>代课次数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map(teacher => (
                  <TableRow key={teacher.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>
                      {teacher.className ? (
                        <Badge variant="outline" className="text-teal-600 border-teal-200">
                          {teacher.className}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                    <TableCell>
                      {teacher.leaveDays > 0 ? (
                        <span className="text-amber-600">{teacher.leaveDays} 天</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.substituteCount > 0 ? (
                        <span className="text-teal-600">{teacher.substituteCount} 次</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 班级列表 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              班级列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockClasses.map(cls => (
                <div 
                  key={cls.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-xs text-gray-500">
                      班主任：{cls.headTeacherName}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {cls.studentCount} 名学生
                    </div>
                  </div>
                  <div className="text-right">
                    {cls.todaySubstitute > 0 ? (
                      <div className="flex items-center gap-1 text-amber-600">
                        <CalendarClock className="h-4 w-4" />
                        <span className="text-sm font-medium">{cls.todaySubstitute} 节代课</span>
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        正常
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度统计 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            本月请假调课统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">{stats.monthLeaveDays}</div>
              <div className="text-sm text-gray-600 mt-1">请假总天数</div>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-3xl font-bold text-teal-600">{stats.monthSubstituteCount}</div>
              <div className="text-sm text-gray-600 mt-1">代课安排次数</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600 mt-1">待处理申请</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">12</div>
              <div className="text-sm text-gray-600 mt-1">已完成处理</div>
            </div>
          </div>

          {/* 简易图表 - 按学科统计 */}
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-3">各学科请假天数</div>
            <div className="space-y-2">
              {['语文', '数学', '英语', '科学', '体育', '音乐', '美术'].map(subject => {
                const days = Math.floor(Math.random() * 5) + 1;
                const maxDays = 5;
                return (
                  <div key={subject} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-gray-600">{subject}</div>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                        style={{ width: `${(days / maxDays) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm text-gray-500 text-right">{days}天</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
