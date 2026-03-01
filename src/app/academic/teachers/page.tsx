'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
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
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Clock,
  Settings,
} from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { BatchToolbar, SelectColumn, type BatchAction } from '@/components/common/BatchToolbar';
import { 
  TeacherScheduleConfigDialog, 
  type TeacherScheduleConfig 
} from '@/components/teacher/TeacherScheduleConfigDialog';

// 教师数据类型
interface Teacher {
  id: string;
  name: string;
  gender: string;
  subject: string;
  title: string;
  department: string;
  phone: string;
  email: string;
  status: string;
  teachYears: number;
  // 课时配置
  weeklyHours: number;        // 周课时量
  currentHours: number;       // 已安排课时
  teachableSubjects: string[]; // 可任教科目
  teachableGrades: number[];   // 可任教年级
  isHeadTeacher: boolean;      // 是否班主任
  headTeacherClassId?: string; // 班主任班级
}

// 性别选项
const genderOptions = ['男', '女'];
// 学科选项
const subjectOptions = ['语文', '数学', '英语', '科学', '音乐', '体育', '美术', '信息技术'];
// 职称选项
const titleOptions = ['二级教师', '一级教师', '高级教师', '正高级教师'];
// 状态选项
const statusOptions = [
  { value: 'active', label: '在职' },
  { value: 'on_leave', label: '请假' },
  { value: 'retired', label: '退休' },
];

export default function TeachersPage() {
  const router = useRouter();
  
  // 数据状态
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  
  // 选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scheduleConfigOpen, setScheduleConfigOpen] = useState(false);
  
  // 当前编辑/删除的教师
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState<TeacherScheduleConfig | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<Partial<Teacher>>({});
  
  // 班级列表（从API获取）
  const [classes, setClasses] = useState<{ id: string; name: string; grade: number }[]>([]);

  // 从API获取教师数据
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/teachers');
        const result = await response.json();
        
        if (result.success && result.data) {
          // 转换API数据到页面格式
          const formattedTeachers: Teacher[] = result.data.map((t: {
            id: string;
            name: string;
            gender?: string;
            subjects?: string[];
            title?: string;
            department?: string;
            phone?: string;
            email?: string;
            status?: string;
            teachYears?: number;
            isHeadTeacher?: boolean;
            classId?: string;
            className?: string;
          }) => ({
            id: t.id,
            name: t.name,
            gender: t.gender === 'male' ? '男' : t.gender === 'female' ? '女' : t.gender || '男',
            subject: t.subjects?.[0] || '语文',
            title: t.title || '二级教师',
            department: t.department || `${t.subjects?.[0] || '语文'}组`,
            phone: t.phone || '',
            email: t.email || '',
            status: t.status || 'active',
            teachYears: t.teachYears || 0,
            weeklyHours: 14,
            currentHours: 0,
            teachableSubjects: t.subjects || ['语文'],
            teachableGrades: [1, 2, 3, 4, 5, 6],
            isHeadTeacher: t.isHeadTeacher || false,
            headTeacherClassId: t.classId,
          }));
          setTeachers(formattedTeachers);
        }
      } catch (error) {
        console.error('获取教师数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        const result = await response.json();
        
        if (result.success && result.data) {
          setClasses(result.data.map((c: { id: string; name: string; grade: number }) => ({
            id: c.id,
            name: c.name,
            grade: c.grade,
          })));
        }
      } catch (error) {
        console.error('获取班级数据失败:', error);
      }
    };

    fetchTeachers();
    fetchClasses();
  }, []);

  // 统计数据
  const stats = {
    total: teachers.length,
    senior: teachers.filter(t => t.title === '高级教师' || t.title === '正高级教师').length,
    headTeachers: teachers.filter(t => t.isHeadTeacher).length,
    departments: new Set(teachers.map(t => t.department)).size,
    unconfigured: teachers.filter(t => t.teachableSubjects.length === 0).length,
    overHours: teachers.filter(t => t.currentHours > t.weeklyHours).length,
  };

  // 筛选后的教师列表
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.includes(searchTerm) || t.email.includes(searchTerm);
    const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: '在职' },
      on_leave: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '请假' },
      retired: { bg: 'bg-gray-100', text: 'text-gray-700', label: '退休' },
    };
    const s = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    return <Badge className={`${s.bg} ${s.text}`}>{s.label}</Badge>;
  };

  // 选择操作
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTeachers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTeachers.map(t => t.id)));
    }
  }, [selectedIds.size, filteredTeachers]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 打开编辑对话框
  const openEditDialog = useCallback((teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setFormData({ ...teacher });
    setEditDialogOpen(true);
  }, []);

  // 打开删除对话框
  const openDeleteDialog = useCallback((teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setDeleteDialogOpen(true);
  }, []);

  // 打开课时配置对话框
  const openScheduleConfigDialog = useCallback((teacher: Teacher) => {
    const isSkillTeacher = !['语文', '数学', '英语'].includes(teacher.subject);
    setScheduleConfig({
      teacherId: teacher.id,
      teacherName: teacher.name,
      role: teacher.isHeadTeacher ? 'head_teacher' : (isSkillTeacher ? 'skill_teacher' : 'subject_head'),
      primarySubject: teacher.subject,
      secondarySubjects: teacher.teachableSubjects?.filter(s => s !== teacher.subject) || [],
      mainClassCount: teacher.weeklyHours > 8 ? 2 : 1,
      mainSubjectHours: teacher.weeklyHours,
      totalWeeklyHours: teacher.weeklyHours,
      currentHours: teacher.currentHours,
      teachableGrades: teacher.teachableGrades,
      headTeacherClassId: teacher.headTeacherClassId,
    });
    setScheduleConfigOpen(true);
  }, []);

  // 保存课时配置
  const handleSaveScheduleConfig = useCallback((config: TeacherScheduleConfig) => {
    setTeachers(prev => prev.map(t => 
      t.id === config.teacherId 
        ? {
            ...t,
            weeklyHours: config.totalWeeklyHours,
            teachableSubjects: [config.primarySubject, ...config.secondarySubjects],
            teachableGrades: config.teachableGrades,
            isHeadTeacher: config.role === 'head_teacher',
            headTeacherClassId: config.headTeacherClassId,
          }
        : t
    ));
  }, []);

  // 打开新增对话框
  const openAddDialog = useCallback(() => {
    setCurrentTeacher(null);
    setFormData({
      gender: '男',
      subject: '语文',
      title: '二级教师',
      status: 'active',
      teachYears: 0,
    });
    setAddDialogOpen(true);
  }, []);

  // 保存教师（新增/编辑）
  const handleSave = useCallback(async () => {
    setLoading(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentTeacher) {
      // 编辑
      setTeachers(prev => prev.map(t => 
        t.id === currentTeacher.id ? { ...t, ...formData } as Teacher : t
      ));
    } else {
      // 新增
      const newTeacher: Teacher = {
        id: String(Date.now()),
        name: formData.name || '',
        gender: formData.gender || '男',
        subject: formData.subject || '语文',
        title: formData.title || '二级教师',
        department: `${formData.subject || '语文'}组`,
        phone: formData.phone || '',
        email: formData.email || '',
        status: formData.status || 'active',
        teachYears: formData.teachYears || 0,
        weeklyHours: 14,
        currentHours: 0,
        teachableSubjects: [formData.subject || '语文'],
        teachableGrades: [1, 2, 3, 4, 5, 6],
        isHeadTeacher: false,
      };
      setTeachers(prev => [...prev, newTeacher]);
    }
    
    setLoading(false);
    setEditDialogOpen(false);
    setAddDialogOpen(false);
    setFormData({});
  }, [currentTeacher, formData]);

  // 删除教师
  const handleDelete = useCallback(async () => {
    if (!currentTeacher) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTeachers(prev => prev.filter(t => t.id !== currentTeacher.id));
    setLoading(false);
    setDeleteDialogOpen(false);
    setCurrentTeacher(null);
  }, [currentTeacher]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTeachers(prev => prev.filter(t => !selectedIds.has(t.id)));
    setLoading(false);
    setBatchDeleteDialogOpen(false);
    clearSelection();
  }, [selectedIds, clearSelection]);

  // 批量更新状态
  const handleBatchUpdateStatus = useCallback(async (status: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTeachers(prev => prev.map(t => 
      selectedIds.has(t.id) ? { ...t, status } : t
    ));
    setLoading(false);
    clearSelection();
  }, [selectedIds, clearSelection]);

  // 批量操作按钮
  const batchActions: BatchAction[] = [
    {
      key: 'delete',
      label: '批量删除',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setBatchDeleteDialogOpen(true),
      destructive: true,
    },
    {
      key: 'status-active',
      label: '设为在职',
      icon: <UserCircle className="h-4 w-4" />,
      onClick: () => handleBatchUpdateStatus('active'),
    },
    {
      key: 'status-leave',
      label: '设为请假',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => handleBatchUpdateStatus('on_leave'),
    },
  ];

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
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            onClick={openAddDialog}
          >
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
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
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
                <p className="text-2xl font-bold text-purple-600">{stats.senior}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.headTeachers}</p>
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
                <p className="text-2xl font-bold text-orange-600">{stats.departments}</p>
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
                {subjectOptions.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作工具栏 */}
      <BatchToolbar
        selectedCount={selectedIds.size}
        totalCount={filteredTeachers.length}
        isAllSelected={selectedIds.size === filteredTeachers.length && filteredTeachers.length > 0}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={clearSelection}
        actions={batchActions}
        processing={loading}
      />

      {/* 教师列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredTeachers.length && filteredTeachers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>学科</TableHead>
                <TableHead>职称</TableHead>
                <TableHead>教研组</TableHead>
                <TableHead>课时配置</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>教龄</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow 
                  key={teacher.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <SelectColumn
                      selected={selectedIds.has(teacher.id)}
                      onToggle={() => toggleSelect(teacher.id)}
                    />
                  </TableCell>
                  <TableCell 
                    className="font-medium"
                    onClick={() => router.push(`/academic/teachers/${teacher.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      {teacher.name}
                      <Eye className="h-3 w-3 text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>
                    <Badge variant="outline" className={teacher.gender === '男' ? 'text-blue-600' : 'text-pink-600'}>
                      {teacher.gender}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>{teacher.subject}</TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>{teacher.title}</TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>{teacher.department}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className={`text-sm ${
                          teacher.currentHours > teacher.weeklyHours ? 'text-red-600 font-medium' :
                          teacher.currentHours === teacher.weeklyHours ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {teacher.currentHours}/{teacher.weeklyHours} 节
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-0.5">
                        {teacher.teachableSubjects.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {s}
                          </Badge>
                        ))}
                        {teacher.isHeadTeacher && (
                          <Badge className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-700">班主任</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {teacher.phone}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>{teacher.teachYears}年</TableCell>
                  <TableCell onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>{getStatusBadge(teacher.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openScheduleConfigDialog(teacher)}>
                          <Settings className="h-4 w-4 mr-2" />
                          课时配置
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/academic/teachers/${teacher.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(teacher)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setFormData({});
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentTeacher ? '编辑教师' : '新增教师'}</DialogTitle>
            <DialogDescription>
              {currentTeacher ? '修改教师信息' : '填写新教师信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">性别</Label>
                <Select
                  value={formData.gender || '男'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">学科</Label>
                <Select
                  value={formData.subject || '语文'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value, department: `${value}组` }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">职称</Label>
                <Select
                  value={formData.title || '二级教师'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {titleOptions.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入电话"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teachYears">教龄（年）</Label>
                <Input
                  id="teachYears"
                  type="number"
                  value={formData.teachYears || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, teachYears: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
            }}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.name}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="确认删除教师"
        description={`确定要删除教师"${currentTeacher?.name}"吗？此操作不可撤销。`}
        loading={loading}
      />

      {/* 批量删除确认对话框 */}
      <DeleteConfirmDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        onConfirm={handleBatchDelete}
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedIds.size} 名教师吗？此操作不可撤销。`}
        loading={loading}
      />

      {/* 课时配置对话框 */}
      <TeacherScheduleConfigDialog
        open={scheduleConfigOpen}
        onOpenChange={setScheduleConfigOpen}
        config={scheduleConfig}
        onSave={handleSaveScheduleConfig}
        classes={classes}
      />
    </div>
  );
}
