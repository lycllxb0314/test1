'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { BatchToolbar, SelectColumn, type BatchAction } from '@/components/common/BatchToolbar';
import { 
  TeacherFullDetailDialog,
  type TeacherFullDetail,
} from '@/components/teacher/TeacherFullDetailDialog';
// 使用统一的 hook
import {
  useTeachers,
  type TeacherInfo,
  type TeacherRole,
  TEACHER_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
} from '@/hooks/useTeachers';

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
  headTeacherClassId?: string; // 班主任班级ID
  headTeacherClassName?: string; // 班主任班级名称
  subTeacherClasses?: Array<{ classId: string; className: string }>; // 科任班级列表
  // 角色
  role?: TeacherRole;         // 教师角色
}

// 角色筛选选项（领导层 + 教师角色 + 兼任职务）
const roleFilterOptions = [
  { value: 'all', label: '全部角色' },
  // 领导层
  { value: 'principal', label: '校长' },
  { value: 'secretary', label: '书记' },
  { value: 'vice_principal', label: '副校长' },
  // 教师角色
  { value: 'head_teacher', label: '班主任' },
  { value: 'subject_teacher', label: '科任教师' },
  { value: 'skill_teacher', label: '技能课教师' },
  // 兼任职务
  { value: 'grade_leader', label: '年段长（兼）' },
  { value: 'research_group_leader', label: '教研组组长（兼）' },
  { value: 'research_group_deputy_leader', label: '教研组副组长（兼）' },
  { value: 'young_pioneer_counselor', label: '少先队大队辅导员（兼）' },
];

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
  
  // 使用统一的 hook
  const {
    teachers: teacherList,
    loading,
    statistics,
    fetchTeachers,
    refetch,
    getTeacherById,
    updateTeacherRole,
    getRoleLabel,
    getRoleColor,
  } = useTeachers();
  
  // 分页状态
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // 选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // 当前编辑/删除的教师
  const [currentTeacher, setCurrentTeacher] = useState<TeacherInfo | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<Partial<TeacherInfo>>({});
  
  // 班级列表（从API获取）
  const [classes, setClasses] = useState<{ id: string; name: string; grade: number }[]>([]);

  // 获取班级数据
  useEffect(() => {
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

    fetchClasses();
  }, []);

  // 筛选后的教师列表
  const filteredTeachers = useMemo(() => {
    return teacherList.filter(t => {
      const matchesSearch = t.name.includes(searchTerm) || t.email.includes(searchTerm);
      const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
      const matchesRole = roleFilter === 'all' || 
        t.primaryRole === roleFilter || 
        t.additionalRoles.includes(roleFilter as any);
      return matchesSearch && matchesSubject && matchesRole;
    });
  }, [teacherList, searchTerm, subjectFilter, roleFilter]);

  // 分页后的教师列表
  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  const paginatedTeachers = filteredTeachers.slice((page - 1) * pageSize, page * pageSize);

  // 筛选条件变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [searchTerm, subjectFilter, roleFilter]);

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

  // 打开删除对话框
  const openDeleteDialog = useCallback((teacher: TeacherInfo) => {
    setCurrentTeacher(teacher);
    setDeleteDialogOpen(true);
  }, []);

  // 打开详情编辑对话框（统一整合基本信息、角色、课时配置）
  const openDetailDialog = useCallback((teacher: TeacherInfo) => {
    setCurrentTeacher(teacher);
    setDetailDialogOpen(true);
  }, []);

  // 保存教师详情（统一保存）
  const handleSaveDetail = useCallback(async (detail: TeacherFullDetail) => {
    try {
      // 调用API保存到数据库
      const response = await fetch(`/api/teachers/${detail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: detail.name,
          gender: detail.gender,
          birth_date: detail.birthDate,
          ethnicity: detail.ethnicity,
          political_status: detail.politicalStatus,
          native_place: detail.nativePlace,
          phone: detail.phone,
          email: detail.email,
          emergency_contact: detail.emergencyContact,
          emergency_phone: detail.emergencyPhone,
          address: detail.address,
          subject: detail.subject,
          title: detail.title,
          title_date: detail.titleDate,
          education: detail.education,
          school: detail.school,
          major: detail.major,
          graduation_date: detail.graduationDate,
          department: detail.department,
          status: detail.status,
          teach_years: detail.teachYears,
          join_date: detail.joinDate,
          primary_role: detail.primaryRole,
          additional_roles: detail.additionalRoles,
          weekly_hours: detail.weeklyHours,
          teachable_subjects: detail.teachableSubjects,
          teachable_grades: detail.teachableGrades,
          is_head_teacher: detail.isHeadTeacher,
          head_teacher_class_id: detail.headTeacherClassId,
        }),
      });
      
      if (response.ok) {
        await refetch();
      } else {
        console.error('保存教师信息失败');
      }
    } catch (error) {
      console.error('保存教师信息失败:', error);
    }
  }, [refetch]);

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

  // 保存教师（新增）
  const handleSave = useCallback(async () => {
    try {
      // 新增 - 调用API
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '',
          gender: formData.gender || '男',
          subject: formData.subject || '语文',
          title: formData.title || '二级教师',
          phone: formData.phone || '',
          email: formData.email || '',
          status: formData.status || 'active',
          teach_years: formData.teachYears || 0,
        }),
      });
      
      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('保存教师失败:', error);
    } finally {
      setAddDialogOpen(false);
      setFormData({});
    }
  }, [formData, refetch]);

  // 删除教师
  const handleDelete = useCallback(async () => {
    if (!currentTeacher) return;
    
    try {
      const response = await fetch(`/api/teachers/${currentTeacher.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await refetch();
      }
    } catch (error) {
      console.error('删除教师失败:', error);
    } finally {
      setDeleteDialogOpen(false);
      setCurrentTeacher(null);
    }
  }, [currentTeacher, refetch]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(id => 
          fetch(`/api/teachers/${id}`, { method: 'DELETE' })
        )
      );
      
      if (results.every(r => r.ok)) {
        await refetch();
        clearSelection();
      }
    } catch (error) {
      console.error('批量删除失败:', error);
    } finally {
      setBatchDeleteDialogOpen(false);
    }
  }, [selectedIds, clearSelection, refetch]);

  // 批量更新状态
  const handleBatchUpdateStatus = useCallback(async (status: string) => {
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(id => 
          fetch(`/api/teachers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      );
      
      if (results.every(r => r.ok)) {
        await refetch();
        clearSelection();
      }
    } catch (error) {
      console.error('批量更新状态失败:', error);
    }
  }, [selectedIds, clearSelection, refetch]);

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
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教师总数</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
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
                <p className="text-sm text-gray-500">领导层</p>
                <p className="text-2xl font-bold text-red-600">{statistics.leaders}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <UserCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班主任</p>
                <p className="text-2xl font-bold text-amber-600">{statistics.headTeachers}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <UserCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">科任教师</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.subjectTeachers}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <UserCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">技能课教师</p>
                <p className="text-2xl font-bold text-green-600">{statistics.skillTeachers}</p>
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
                <p className="text-sm text-gray-500">年段长（兼）</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.gradeLeaders}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <UserCircle className="h-5 w-5 text-purple-600" />
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                {roleFilterOptions.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
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
                <TableHead>角色</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>学科</TableHead>
                <TableHead>职称</TableHead>
                <TableHead>教研组</TableHead>
                <TableHead>课时配置</TableHead>
                <TableHead>任职班级</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>教龄</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeachers.map((teacher) => (
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
                    className="font-medium cursor-pointer hover:text-primary"
                    onClick={() => openDetailDialog(teacher)}
                  >
                    <div className="flex items-center gap-2">
                      {teacher.name}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                      <Badge className={`text-[10px] px-1 py-0 h-4 ${
                        TEACHER_ROLE_COLORS[teacher.primaryRole]?.bg || 'bg-gray-100'
                      } ${
                        TEACHER_ROLE_COLORS[teacher.primaryRole]?.text || 'text-gray-700'
                      }`}>
                        {getRoleLabel(teacher.primaryRole)}
                      </Badge>
                      {teacher.additionalRoles && teacher.additionalRoles.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {teacher.additionalRoles.slice(0, 2).map((role, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4 text-gray-500">
                              {getRoleLabel(role)}（兼）
                            </Badge>
                          ))}
                          {teacher.additionalRoles.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{teacher.additionalRoles.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>
                    <Badge variant="outline" className={teacher.gender === '男' ? 'text-blue-600' : 'text-pink-600'}>
                      {teacher.gender}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>{teacher.subject}</TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>{teacher.title}</TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>{teacher.department}</TableCell>
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
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>
                    <div className="flex flex-col gap-1 min-w-[100px]">
                      {teacher.isHeadTeacher && teacher.headTeacherClassName ? (
                        <div className="flex items-center gap-1">
                          <Badge className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-700">班主任</Badge>
                          <span className="text-xs text-gray-600">{teacher.headTeacherClassName}</span>
                        </div>
                      ) : null}
                      {teacher.subTeacherClasses && teacher.subTeacherClasses.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Badge className="text-[10px] px-1 py-0 h-4 bg-blue-100 text-blue-700">科任</Badge>
                          <span className="text-xs text-gray-600">{teacher.subTeacherClasses.map(c => c.className).join('、')}</span>
                        </div>
                      ) : null}
                      {!teacher.isHeadTeacher && (!teacher.subTeacherClasses || teacher.subTeacherClasses.length === 0) ? (
                        <span className="text-xs text-gray-400">-</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {teacher.phone}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>{teacher.teachYears}年</TableCell>
                  <TableCell onClick={() => openDetailDialog(teacher)}>{getStatusBadge(teacher.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetailDialog(teacher)}>
                          <Edit className="h-4 w-4 mr-2" />
                          查看/编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredTeachers.length)} 条，共 {filteredTeachers.length} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增教师对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增教师</DialogTitle>
            <DialogDescription>
              填写新教师基本信息
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
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
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

      {/* 统一详情编辑对话框（包含详情页全部内容） */}
      <TeacherFullDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        teacher={currentTeacher ? {
          id: currentTeacher.id,
          name: currentTeacher.name,
          gender: currentTeacher.gender,
          birthDate: currentTeacher.birthDate,
          idCard: currentTeacher.idCard,
          ethnicity: currentTeacher.ethnicity,
          politicalStatus: currentTeacher.politicalStatus,
          nativePlace: currentTeacher.nativePlace,
          phone: currentTeacher.phone,
          email: currentTeacher.email,
          emergencyContact: currentTeacher.emergencyContact,
          emergencyPhone: currentTeacher.emergencyPhone,
          address: currentTeacher.address,
          employeeId: currentTeacher.employeeId,
          subject: currentTeacher.subject,
          title: currentTeacher.title,
          titleDate: currentTeacher.titleDate,
          education: currentTeacher.education,
          school: currentTeacher.school,
          major: currentTeacher.major,
          graduationDate: currentTeacher.graduationDate,
          teachYears: currentTeacher.teachYears,
          joinDate: currentTeacher.joinDate,
          department: currentTeacher.department,
          status: currentTeacher.status,
          primaryRole: currentTeacher.primaryRole,
          additionalRoles: currentTeacher.additionalRoles || [],
          weeklyHours: currentTeacher.weeklyHours,
          currentHours: currentTeacher.currentHours,
          teachableSubjects: currentTeacher.teachableSubjects || [currentTeacher.subject],
          teachableGrades: currentTeacher.teachableGrades || [1, 2, 3, 4, 5, 6],
          isHeadTeacher: currentTeacher.isHeadTeacher,
          headTeacherClassId: currentTeacher.headTeacherClassId,
          headTeacherClassName: currentTeacher.headTeacherClassName,
          records: currentTeacher.records || [],
          honors: currentTeacher.honors || [],
          trainings: currentTeacher.trainings || [],
          achievements: currentTeacher.achievements || [],
        } : null}
        classes={classes}
        onSave={handleSaveDetail}
      />

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
    </div>
  );
}
