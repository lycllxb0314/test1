'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  GraduationCap,
  Home,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentsList, useStudentMutation, StudentListItem } from '@/hooks/useStudentData';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

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

// 获取性别样式
const getGenderStyle = (gender: string) => {
  return gender === 'male'
    ? { icon: '👨', color: 'text-blue-600', bg: 'bg-blue-50', label: '男' }
    : { icon: '👩', color: 'text-pink-600', bg: 'bg-pink-50', label: '女' };
};

export default function ClassManagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isHeadTeacher, canEditStudent } = usePermissions();

  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // 获取当前用户班级的学生
  const classId = user?.classId || '';
  const className = user?.className || '我的班级';

  // 使用统一 Hook 获取学生列表
  const { data: students, pagination, loading, error, refetch } = useStudentsList({
    search: searchTerm,
    classId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    pageSize: 10,
  });

  // 学生操作 Hook
  const { deleteStudent, loading: mutationLoading } = useStudentMutation();

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentListItem | null>(null);

  // 权限检查 - 只有班主任可以访问
  useEffect(() => {
    if (user && !isHeadTeacher()) {
      toast.error('您不是班主任，无法访问此页面');
      router.push('/teacher');
    }
  }, [user, isHeadTeacher, router]);

  // 查看详情
  const handleViewDetail = (studentId: string) => {
    router.push(`/teacher/class/students/${studentId}`);
  };

  // 编辑学生
  const handleEdit = (studentId: string) => {
    router.push(`/teacher/class/students/${studentId}?edit=true`);
  };

  // 确认删除
  const confirmDelete = (student: StudentListItem) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  // 执行删除
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
    const csvContent = [
      ['学号', '姓名', '性别', '班级', '状态', '联系电话'].join(','),
      ...students.map(s => [
        s.studentNo,
        s.name,
        s.gender === 'male' ? '男' : '女',
        s.className,
        s.status,
        ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${className}学生名单.csv`;
    link.click();
    toast.success('导出成功');
  };

  // 加载状态
  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">加载学生数据...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  // 统计数据
  const totalStudents = pagination.total;
  const presentCount = students.filter(s => s.status === '在校').length;
  const leaveCount = students.filter(s => s.status === '请假').length;
  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">班级学生管理</h1>
          </div>
          <p className="text-gray-500 mt-1">{className} · 学生信息维护</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            导出名单
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
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
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
                <p className="text-sm text-gray-500">请假人数</p>
                <p className="text-2xl font-bold text-yellow-600">{leaveCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">男女比例</p>
                <p className="text-2xl font-bold text-purple-600">{maleCount}:{femaleCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学生列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">学生列表</CardTitle>
            <div className="flex items-center gap-4">
              {/* 搜索框 */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索学生姓名或学号..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="在校">在校</SelectItem>
                  <SelectItem value="请假">请假</SelectItem>
                  <SelectItem value="休学">休学</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-4 text-gray-500">
                {searchTerm ? '没有找到匹配的学生' : '暂无学生数据'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>学号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>性别</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>班主任</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const genderStyle = getGenderStyle(student.gender);
                    return (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">{student.studentNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={genderStyle.bg}>
                                {student.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={genderStyle.color}>{genderStyle.label}</span>
                        </TableCell>
                        <TableCell>{student.gradeName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.headTeacherName || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>操作</DropdownMenuLabel>
                              <DropdownMenuSeparator />
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
                                onClick={() => confirmDelete(student)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
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
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
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

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除学生「{studentToDelete?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={mutationLoading}
            >
              {mutationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
