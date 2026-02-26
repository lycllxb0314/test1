'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  UserCheck,
  Plus,
  Search,
  Users,
  GraduationCap,
  Briefcase,
  Clock,
  MapPin,
  Eye,
  Edit,
  Shield,
  UserPlus,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  DoorOpen,
  Calendar,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccessPerson, PersonType, AccessPermission } from '@/types';

// 模拟学生数据
const mockStudents: AccessPerson[] = [
  { id: 'p001', personId: 's001', personType: 'student', name: '张三', gender: '男', organization: '三年1班', organizationId: 'c001', grade: 3, phone: '138****1234', credentials: [], permissions: [], status: 'active', lastAccess: { deviceId: 'dev-001', deviceName: '东校门入口', time: '2024-03-15 08:12:35', direction: 'in' }, createdAt: '2023-09-01', updatedAt: '2024-03-15' },
  { id: 'p002', personId: 's002', personType: 'student', name: '李四', gender: '女', organization: '三年1班', organizationId: 'c001', grade: 3, credentials: [], permissions: [], status: 'active', lastAccess: { deviceId: 'dev-001', deviceName: '东校门入口', time: '2024-03-15 08:12:58', direction: 'in' }, createdAt: '2023-09-01', updatedAt: '2024-03-15' },
  { id: 'p003', personId: 's003', personType: 'student', name: '王五', gender: '男', organization: '五年2班', organizationId: 'c002', grade: 5, credentials: [], permissions: [], status: 'active', createdAt: '2021-09-01', updatedAt: '2024-03-15' },
  { id: 'p004', personId: 's004', personType: 'student', name: '赵六', gender: '女', organization: '五年2班', organizationId: 'c002', grade: 5, credentials: [], permissions: [], status: 'active', lastAccess: { deviceId: 'dev-001', deviceName: '东校门入口', time: '2024-03-15 08:23:41', direction: 'in' }, createdAt: '2021-09-01', updatedAt: '2024-03-15' },
  { id: 'p005', personId: 's005', personType: 'student', name: '陈小明', gender: '男', organization: '五年2班', organizationId: 'c002', grade: 5, credentials: [], permissions: [], status: 'inactive', createdAt: '2021-09-01', updatedAt: '2024-03-10' },
];

// 模拟教师数据
const mockTeachers: AccessPerson[] = [
  { id: 'p101', personId: 't001', personType: 'teacher', name: '王老师', gender: '男', organization: '语文组', organizationId: 'dept001', credentials: [], permissions: [], status: 'active', lastAccess: { deviceId: 'dev-005', deviceName: '教学楼A栋入口', time: '2024-03-15 07:45:22', direction: 'in' }, createdAt: '2020-09-01', updatedAt: '2024-03-15' },
  { id: 'p102', personId: 't002', personType: 'teacher', name: '林老师', gender: '女', organization: '数学组', organizationId: 'dept002', credentials: [], permissions: [], status: 'active', lastAccess: { deviceId: 'dev-006', deviceName: '教学楼B栋入口', time: '2024-03-15 07:58:12', direction: 'in' }, createdAt: '2018-09-01', updatedAt: '2024-03-15' },
  { id: 'p103', personId: 't003', personType: 'teacher', name: '张老师', gender: '男', organization: '英语组', organizationId: 'dept003', credentials: [], permissions: [], status: 'active', createdAt: '2015-09-01', updatedAt: '2024-03-15' },
  { id: 'p104', personId: 't004', personType: 'teacher', name: '刘老师', gender: '女', organization: '语文组', organizationId: 'dept001', credentials: [], permissions: [], status: 'active', createdAt: '2019-09-01', updatedAt: '2024-03-15' },
];

// 模拟后勤人员数据
const mockStaff: AccessPerson[] = [
  { id: 'p201', personId: 'staff001', personType: 'staff', name: '赵师傅', gender: '男', organization: '后勤部', organizationId: 'dept101', phone: '139****5678', credentials: [], permissions: [], status: 'active', lastAccess: { deviceId: 'dev-003', deviceName: '西校门入口', time: '2024-03-15 07:30:15', direction: 'in' }, createdAt: '2022-03-01', updatedAt: '2024-03-15' },
  { id: 'p202', personId: 'staff002', personType: 'staff', name: '钱阿姨', gender: '女', organization: '保洁部', organizationId: 'dept102', credentials: [], permissions: [], status: 'active', createdAt: '2021-06-01', updatedAt: '2024-03-15' },
  { id: 'p203', personId: 'staff003', personType: 'staff', name: '孙师傅', gender: '男', organization: '保安部', organizationId: 'dept103', credentials: [], permissions: [], status: 'active', createdAt: '2020-01-01', updatedAt: '2024-03-15' },
  { id: 'p204', personId: 'staff004', personType: 'staff', name: '李阿姨', gender: '女', organization: '食堂', organizationId: 'dept104', credentials: [], permissions: [], status: 'active', createdAt: '2019-09-01', updatedAt: '2024-03-15' },
];

// 人员类型映射
const personTypeMap: Record<PersonType, { label: string; icon: any; color: string }> = {
  student: { label: '学生', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
  teacher: { label: '教师', icon: Users, color: 'text-green-600 bg-green-50' },
  staff: { label: '后勤', icon: Briefcase, color: 'text-orange-600 bg-orange-50' },
  visitor: { label: '访客', icon: Users, color: 'text-purple-600 bg-purple-50' },
};

// 状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '有效', color: 'text-green-600 bg-green-50' },
  inactive: { label: '停用', color: 'text-gray-600 bg-gray-50' },
  suspended: { label: '挂起', color: 'text-orange-600 bg-orange-50' },
  graduated: { label: '毕业', color: 'text-blue-600 bg-blue-50' },
};

export default function AccessPersonsPage() {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'staff'>('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<AccessPerson | null>(null);

  // 获取当前列表
  const getCurrentList = () => {
    switch (activeTab) {
      case 'student': return mockStudents;
      case 'teacher': return mockTeachers;
      case 'staff': return mockStaff;
      default: return [];
    }
  };

  // 过滤人员
  const filterPersons = (persons: AccessPerson[]) => {
    return persons.filter(person => {
      const matchSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          person.organization.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'student') {
        const matchGrade = gradeFilter === 'all' || person.grade?.toString() === gradeFilter;
        return matchSearch && matchGrade;
      } else {
        const matchDept = departmentFilter === 'all' || person.organizationId === departmentFilter;
        return matchSearch && matchDept;
      }
    });
  };

  const filteredPersons = filterPersons(getCurrentList());

  // 统计
  const stats = {
    student: { total: mockStudents.length, active: mockStudents.filter(p => p.status === 'active').length },
    teacher: { total: mockTeachers.length, active: mockTeachers.filter(p => p.status === 'active').length },
    staff: { total: mockStaff.length, active: mockStaff.filter(p => p.status === 'active').length },
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">人员授权</h1>
          </div>
          <p className="text-gray-500 mt-1">管理学生、教师、后勤人员的门禁权限</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowSyncDialog(true)}>
            <RefreshCw className="h-4 w-4" />
            数据同步
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setShowAuthDialog(true)}>
            <UserPlus className="h-4 w-4" />
            批量授权
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`border-0 shadow-md cursor-pointer transition-all ${activeTab === 'student' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setActiveTab('student')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学生授权</p>
                <p className="text-2xl font-bold text-blue-600">{stats.student.active}/{stats.student.total}</p>
                <p className="text-xs text-gray-400 mt-1">有效授权 / 总人数</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-md cursor-pointer transition-all ${activeTab === 'teacher' ? 'ring-2 ring-green-400' : ''}`} onClick={() => setActiveTab('teacher')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教师授权</p>
                <p className="text-2xl font-bold text-green-600">{stats.teacher.active}/{stats.teacher.total}</p>
                <p className="text-xs text-gray-400 mt-1">有效授权 / 总人数</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-md cursor-pointer transition-all ${activeTab === 'staff' ? 'ring-2 ring-orange-400' : ''}`} onClick={() => setActiveTab('staff')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">后勤授权</p>
                <p className="text-2xl font-bold text-orange-600">{stats.staff.active}/{stats.staff.total}</p>
                <p className="text-xs text-gray-400 mt-1">有效授权 / 总人数</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Briefcase className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据源提示 */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-teal-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">数据源对接</p>
              <p className="text-sm text-gray-500">
                {activeTab === 'student' && '学生数据自动从教务系统同步，包含在校学生的班级、年级信息'}
                {activeTab === 'teacher' && '教师数据自动从教务教研系统同步，包含教师任课、部门信息'}
                {activeTab === 'staff' && '后勤人员数据从人事系统同步，包含部门、岗位信息'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              立即同步
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={activeTab === 'student' ? '搜索学生姓名或班级...' : '搜索姓名或部门...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === 'student' ? (
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="年级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年级</SelectItem>
                  <SelectItem value="1">一年级</SelectItem>
                  <SelectItem value="2">二年级</SelectItem>
                  <SelectItem value="3">三年级</SelectItem>
                  <SelectItem value="4">四年级</SelectItem>
                  <SelectItem value="5">五年级</SelectItem>
                  <SelectItem value="6">六年级</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {activeTab === 'teacher' ? (
                    <>
                      <SelectItem value="dept001">语文组</SelectItem>
                      <SelectItem value="dept002">数学组</SelectItem>
                      <SelectItem value="dept003">英语组</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="dept101">后勤部</SelectItem>
                      <SelectItem value="dept102">保洁部</SelectItem>
                      <SelectItem value="dept103">保安部</SelectItem>
                      <SelectItem value="dept104">食堂</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
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
                <TableHead>性别</TableHead>
                <TableHead>{activeTab === 'student' ? '班级' : '部门'}</TableHead>
                {activeTab === 'student' && <TableHead>年级</TableHead>}
                <TableHead>授权状态</TableHead>
                <TableHead>最后通行</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersons.map(person => {
                const statusInfo = statusMap[person.status];
                return (
                  <TableRow key={person.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${person.gender === '男' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{person.name}</p>
                          {person.phone && <p className="text-xs text-gray-400">{person.phone}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{person.gender}</TableCell>
                    <TableCell>{person.organization}</TableCell>
                    {activeTab === 'student' && (
                      <TableCell>
                        <Badge variant="outline">{person.grade}年级</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {person.lastAccess ? (
                        <div className="text-sm">
                          <p className="text-gray-600">{person.lastAccess.time.split(' ')[1]}</p>
                          <p className="text-xs text-gray-400">{person.lastAccess.deviceName}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">暂无记录</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedPerson(person)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看权限
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑权限
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <DoorOpen className="h-4 w-4 mr-2" />
                            门禁权限配置
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Upload className="h-4 w-4 mr-2" />
                            上传照片
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          显示 {filteredPersons.length} 人，共 {getCurrentList().length} 人
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>上一页</Button>
          <Button variant="outline" size="sm">下一页</Button>
        </div>
      </div>

      {/* 批量授权对话框 */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              批量授权门禁权限
            </DialogTitle>
            <DialogDescription>
              为选中的人员批量配置门禁设备访问权限
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>授权人员范围</Label>
              <Select defaultValue="all_students">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_students">全部学生</SelectItem>
                  <SelectItem value="all_teachers">全部教师</SelectItem>
                  <SelectItem value="all_staff">全部后勤人员</SelectItem>
                  <SelectItem value="selected">已选人员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>授权设备</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox id="dev-gate" />
                  <label htmlFor="dev-gate" className="text-sm">校门闸机</label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox id="dev-building" />
                  <label htmlFor="dev-building" className="text-sm">教学楼门禁</label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox id="dev-office" />
                  <label htmlFor="dev-office" className="text-sm">办公室门禁</label>
                </div>
                <div className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox id="dev-other" />
                  <label htmlFor="dev-other" className="text-sm">其他区域</label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>有效期</Label>
              <Select defaultValue="permanent">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">永久有效</SelectItem>
                  <SelectItem value="semester">本学期有效</SelectItem>
                  <SelectItem value="year">本学年有效</SelectItem>
                  <SelectItem value="custom">自定义时间</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>通行时间限制</Label>
              <Select defaultValue="workday">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anytime">全天开放</SelectItem>
                  <SelectItem value="workday">工作日 (周一至周五)</SelectItem>
                  <SelectItem value="daytime">白天 (07:00-18:00)</SelectItem>
                  <SelectItem value="custom">自定义时段</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700">确认授权</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 数据同步对话框 */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-teal-600" />
              数据同步
            </DialogTitle>
            <DialogDescription>
              从各业务系统同步人员数据到门禁系统
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">教务系统</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-blue-700">学生、教师数据</p>
              <p className="text-xs text-blue-500 mt-1">最后同步：2024-03-15 08:00</p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">人事系统</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-green-700">后勤人员数据</p>
              <p className="text-xs text-green-500 mt-1">最后同步：2024-03-15 08:00</p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">同步设置</span>
              </div>
              <p className="text-sm text-gray-600">自动同步：每天 06:00</p>
              <p className="text-sm text-gray-600">增量同步：实时</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>关闭</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
              <RefreshCw className="h-4 w-4" />
              立即同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
