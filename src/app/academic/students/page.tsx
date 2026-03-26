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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGlobalStudents, type StudentStatus, type StudentInfo } from '@/hooks/useGlobalData';
import { PAGINATION } from '@/lib/pagination-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  User,
  GraduationCap,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// 年级选项
const gradeOptions = [
  { value: 'all', label: '全部年级' },
  { value: '1', label: '一年级' },
  { value: '2', label: '二年级' },
  { value: '3', label: '三年级' },
  { value: '4', label: '四年级' },
  { value: '5', label: '五年级' },
  { value: '6', label: '六年级' },
];

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: '在校', label: '在校' },
  { value: '请假', label: '请假' },
  { value: '休学', label: '休学' },
];

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '在校': 'bg-green-100 text-green-700',
    '请假': 'bg-yellow-100 text-yellow-700',
    '休学': 'bg-red-100 text-red-700',
    '毕业': 'bg-blue-100 text-blue-700',
    '转学': 'bg-gray-100 text-gray-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
};

// 获取性别图标和颜色
const getGenderStyle = (gender: string) => {
  return gender === 'male' 
    ? { icon: '👨', color: 'text-blue-600', bg: 'bg-blue-50' }
    : { icon: '👩', color: 'text-pink-600', bg: 'bg-pink-50' };
};

export default function StudentsPage() {
  const router = useRouter();
  
  // 使用全局数据Hook获取学生列表（避免重复请求）
  const { 
    students,           // 当前页数据
    statistics, 
    pagination,         // 分页控制（内置）
    loading, 
    error, 
    refetch,
    deleteStudent,
    setFilters,
  } = useGlobalStudents();
  
  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentInfo | null>(null);
  
  // 筛选变化时更新Hook
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value || undefined });
  };
  
  const handleGradeChange = (value: string) => {
    setGradeFilter(value);
    setFilters({ grade: value === 'all' ? undefined : parseInt(value) });
  };
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setFilters({ 
      status: value === 'all' ? 'all' : value as StudentStatus 
    });
  };

  // 查看详情
  const handleViewDetail = (studentId: string) => {
    router.push(`/academic/students/${studentId}`);
  };

  // 编辑学生
  const handleEdit = (studentId: string) => {
    router.push(`/academic/students/${studentId}?edit=true`);
  };

  // 删除学生
  const handleDelete = async () => {
    if (!studentToDelete) return;
    
    const success = await deleteStudent(studentToDelete.id);
    if (success) {
      toast.success('学生已删除');
      refetch();
    } else {
      toast.error('删除失败，请重试');
    }
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  // 导出数据
  const handleExport = () => {
    toast.success('数据导出中，请稍候...');
    // TODO: 实现导出功能
  };

  // 添加学生
  const handleAddStudent = () => {
    toast.info('添加学生功能开发中...');
    // TODO: 实现添加学生功能
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">学生管理</h1>
          </div>
          <p className="text-muted-foreground mt-1">学生信息查询与管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            导出数据
          </Button>
          <Button className="gap-2" onClick={handleAddStudent}>
            <UserPlus className="h-4 w-4" />
            添加学生
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">学生总数</p>
                <p className="text-2xl font-bold text-primary">{statistics.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">男生</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.maleCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">女生</p>
                <p className="text-2xl font-bold text-pink-600">
                  {statistics.femaleCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-pink-50">
                <User className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">班级数</p>
                <p className="text-2xl font-bold text-green-600">{statistics.classCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={handleGradeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="年级" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">学生列表</CardTitle>
          <CardDescription>
            共 {statistics.total} 名学生
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {error}
              <Button variant="link" onClick={refetch}>重试</Button>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无学生数据
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">学号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>性别</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>班主任</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: StudentInfo) => {
                    const genderStyle = getGenderStyle(student.gender);
                    return (
                      <TableRow key={student.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleViewDetail(student.id)}>
                        <TableCell className="font-medium">{student.studentNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${genderStyle.bg}`}>
                              {genderStyle.icon}
                            </span>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={genderStyle.color}>
                            {student.gender === 'male' ? '男' : '女'}
                          </span>
                        </TableCell>
                        <TableCell>{student.gradeName}</TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell>{student.headTeacherName || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(student.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(student.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                编辑信息
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setStudentToDelete(student);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除学生
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* 分页 */}
              {pagination.total > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      显示 {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
                    </div>
                    <Select 
                      value={pagination.pageSize.toString()} 
                      onValueChange={(value) => pagination.setPageSize(parseInt(value))}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                          <SelectItem key={size} value={size.toString()}>{size} 条/页</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pagination.prevPage}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {pagination.page} / {pagination.totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pagination.nextPage}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除学生 <strong>{studentToDelete?.name}</strong> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
