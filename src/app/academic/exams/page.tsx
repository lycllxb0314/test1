'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

interface ExamSubject {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface Exam {
  id: string;
  name: string;
  type: string;
  semester: string;
  description?: string;
  grades: number[];
  subjects: ExamSubject[];
  startDate: string;
  endDate: string;
  status: 'planning' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  totalStudents: number;
  submittedCount: number;
  createdByName?: string;
  createdAt: string;
  publishedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data: Exam[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 考试类型
const EXAM_TYPES = [
  { value: 'all', label: '全部类型' },
  { value: '期中考试', label: '期中考试' },
  { value: '期末考试', label: '期末考试' },
  { value: '单元测试', label: '单元测试' },
  { value: '月考', label: '月考' },
  { value: '模拟考试', label: '模拟考试' },
  { value: '竞赛', label: '竞赛' },
  { value: '技能测试', label: '技能测试' },
];

// 考试状态
const EXAM_STATUS: Record<string, { label: string; color: string }> = {
  planning: { label: '计划中', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  published: { label: '已发布', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: '进行中', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 border-red-200' },
};

// 学期选项
const SEMESTERS = [
  { value: 'all', label: '全部学期' },
  { value: '2025-2026-2', label: '2025-2026第二学期' },
  { value: '2025-2026-1', label: '2025-2026第一学期' },
  { value: '2024-2025-2', label: '2024-2025第二学期' },
  { value: '2024-2025-1', label: '2024-2025第一学期' },
];

// ==================== 主组件 ====================

export default function ExamsPage() {
  const router = useRouter();
  
  // 数据状态
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  
  // 筛选状态
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  
  // 删除确认弹窗
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; exam: Exam | null }>({
    open: false,
    exam: null,
  });
  const [deleting, setDeleting] = useState(false);

  // 加载数据
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (keyword) params.append('keyword', keyword);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);

      const response = await fetch(`/api/exams?${params.toString()}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setExams(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } else {
        toast.error('获取考试列表失败');
      }
    } catch (err) {
      console.error('获取考试列表失败:', err);
      toast.error('获取考试列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, typeFilter, statusFilter, semesterFilter]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    fetchExams();
  };

  // 重置筛选
  const handleReset = () => {
    setKeyword('');
    setTypeFilter('all');
    setStatusFilter('all');
    setSemesterFilter('all');
    setPage(1);
  };

  // 删除考试
  const handleDelete = async () => {
    if (!deleteDialog.exam) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/exams/${deleteDialog.exam.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('删除成功');
        setDeleteDialog({ open: false, exam: null });
        fetchExams();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const config = EXAM_STATUS[status] || EXAM_STATUS.planning;
    return (
      <Badge variant="outline" className={cn('font-normal', config.color)}>
        {config.label}
      </Badge>
    );
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 统计数据
  const stats = {
    total: total,
    planning: exams.filter(e => e.status === 'planning').length,
    inProgress: exams.filter(e => e.status === 'in_progress').length,
    completed: exams.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
          <p className="text-gray-500 mt-1">考试安排与成绩管理</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          onClick={() => router.push('/academic/exams/new')}
        >
          <Plus className="h-4 w-4" />
          新增考试
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">全部考试</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">计划中</p>
                <p className="text-2xl font-bold text-gray-600">{stats.planning}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-100">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选区域 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索考试名称..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="考试类型" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(EXAM_STATUS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="学期" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleSearch}>
              查询
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 考试列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mb-4 text-gray-300" />
              <p>暂无考试数据</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => router.push('/academic/exams/new')}
              >
                创建第一个考试
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-medium">考试名称</TableHead>
                  <TableHead className="font-medium">类型</TableHead>
                  <TableHead className="font-medium">学期</TableHead>
                  <TableHead className="font-medium">年级</TableHead>
                  <TableHead className="font-medium">考试日期</TableHead>
                  <TableHead className="font-medium">参考人数</TableHead>
                  <TableHead className="font-medium">状态</TableHead>
                  <TableHead className="font-medium text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow 
                    key={exam.id} 
                    className="cursor-pointer hover:bg-blue-50/50"
                    onClick={() => router.push(`/academic/exams/${exam.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900">{exam.name}</div>
                      {exam.subjects.length > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {exam.subjects.map(s => s.name).join('、')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {exam.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{exam.semester || '-'}</TableCell>
                    <TableCell className="text-gray-600">
                      {exam.grades.length > 0 
                        ? exam.grades.map(g => `${g}年级`).join('、')
                        : '全校'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(exam.startDate)}
                        {exam.endDate && exam.endDate !== exam.startDate && (
                          <span> ~ {formatDate(exam.endDate)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="h-3.5 w-3.5" />
                        {exam.totalStudents || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/academic/exams/${exam.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/academic/exams/${exam.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/academic/exams/${exam.id}/grades`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            成绩录入
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteDialog({ open: true, exam })}
                            disabled={exam.status !== 'planning'}
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
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <div className="text-sm text-gray-600 px-3">
              第 {page} / {totalPages} 页
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, exam: deleteDialog.exam })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除考试「{deleteDialog.exam?.name}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, exam: null })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
