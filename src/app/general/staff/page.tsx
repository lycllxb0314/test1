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
  Phone,
  Mail,
  Calendar,
  Award,
  Briefcase,
} from 'lucide-react';

// 模拟后勤人员数据
const mockStaff = [
  { id: 1, name: '王阿姨', position: '保洁员', department: '保洁组', phone: '138****1234', status: 'active', workYears: 5, area: '教学楼A区' },
  { id: 2, name: '李阿姨', position: '保洁员', department: '保洁组', phone: '139****5678', status: 'active', workYears: 3, area: '教学楼B区' },
  { id: 3, name: '张师傅', position: '维修工', department: '维修组', phone: '137****9012', status: 'active', workYears: 8, area: '全校' },
  { id: 4, name: '刘师傅', position: '保安', department: '安保组', phone: '136****3456', status: 'active', workYears: 6, area: '校门' },
  { id: 5, name: '赵师傅', position: '保安', department: '安保组', phone: '135****7890', status: 'active', workYears: 4, area: '后门' },
  { id: 6, name: '孙阿姨', position: '食堂员工', department: '食堂组', phone: '134****2345', status: 'active', workYears: 2, area: '第一食堂' },
  { id: 7, name: '周师傅', position: '绿化养护', department: '绿化组', phone: '133****6789', status: 'on_leave', workYears: 7, area: '全校绿化' },
  { id: 8, name: '吴阿姨', position: '保洁员', department: '保洁组', phone: '132****0123', status: 'active', workYears: 1, area: '实验楼' },
];

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">在职</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-700">请假</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700">离职</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredStaff = mockStaff.filter(s => {
    const matchesSearch = s.name.includes(searchTerm) || s.area.includes(searchTerm);
    const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // 按部门统计
  const deptStats = {
    '保洁组': mockStaff.filter(s => s.department === '保洁组').length,
    '维修组': mockStaff.filter(s => s.department === '维修组').length,
    '安保组': mockStaff.filter(s => s.department === '安保组').length,
    '食堂组': mockStaff.filter(s => s.department === '食堂组').length,
    '绿化组': mockStaff.filter(s => s.department === '绿化组').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">人员管理</h1>
          <p className="text-gray-500 mt-1">后勤人员信息与排班管理</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          添加人员
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">保洁组</p>
              <p className="text-2xl font-bold text-blue-600">{deptStats['保洁组']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">维修组</p>
              <p className="text-2xl font-bold text-orange-600">{deptStats['维修组']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">安保组</p>
              <p className="text-2xl font-bold text-green-600">{deptStats['安保组']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">食堂组</p>
              <p className="text-2xl font-bold text-purple-600">{deptStats['食堂组']}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">绿化组</p>
              <p className="text-2xl font-bold text-teal-600">{deptStats['绿化组']}</p>
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
                placeholder="搜索姓名或负责区域..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="部门筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部门</SelectItem>
                <SelectItem value="保洁组">保洁组</SelectItem>
                <SelectItem value="维修组">维修组</SelectItem>
                <SelectItem value="安保组">安保组</SelectItem>
                <SelectItem value="食堂组">食堂组</SelectItem>
                <SelectItem value="绿化组">绿化组</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 人员列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>姓名</TableHead>
                <TableHead>岗位</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>负责区域</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>工作年限</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((person) => (
                <TableRow key={person.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.position}</TableCell>
                  <TableCell>{person.department}</TableCell>
                  <TableCell>{person.area}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {person.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {person.workYears}年
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(person.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
