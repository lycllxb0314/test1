'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, UserPlus, Trash2, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { StudentBasicInfo } from '@/hooks/useClasses';

const PAGINATION = { DEFAULT_DISPLAY_PAGE_SIZE: 20 };

function useFrontendPagination(items: any[], opts: { defaultPageSize: number }) {
  const [page, setPage] = useState(1);
  const pageSize = opts.defaultPageSize;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, pageSize, totalPages, paginatedItems, total: items.length };
}

const getGenderStyle = (gender: string) => {
  switch (gender) {
    case 'male': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'female': return 'bg-pink-50 text-pink-700 border-pink-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case '在校': return 'bg-green-50 text-green-700 border-green-200';
    case '请假': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case '休学': return 'bg-red-50 text-red-700 border-red-200';
    case '转学': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

interface Props {
  students: StudentBasicInfo[];
  className: string;
  onDelete: (student: StudentBasicInfo) => Promise<boolean>;
  onViewDetail: (studentId: string) => void;
  onRefetch: () => void;
}

export function StudentsTab({ students, className, onDelete, onViewDetail, onRefetch }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentBasicInfo | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const filteredStudents = useMemo(() => {
    let filtered = [...students];
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.includes(searchTerm) || s.studentNo.includes(searchTerm)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    return filtered;
  }, [students, searchTerm, statusFilter]);

  const pagination = useFrontendPagination(filteredStudents, {
    defaultPageSize: PAGINATION.DEFAULT_DISPLAY_PAGE_SIZE,
  });

  const confirmDelete = (student: StudentBasicInfo) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setMutationLoading(true);
    const success = await onDelete(studentToDelete);
    setMutationLoading(false);
    if (success) {
      toast.success('学生已删除');
    } else {
      toast.error('删除失败，请重试');
    }
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

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

  return (
    <div className="space-y-4">
      {/* 搜索与筛选 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索学生姓名或学号..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="状态筛选" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="在校">在校</SelectItem>
            <SelectItem value="请假">请假</SelectItem>
            <SelectItem value="休学">休学</SelectItem>
            <SelectItem value="转学">转学</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />导出
          </Button>
          <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
            <UserPlus className="h-4 w-4 mr-1" />添加学生
          </Button>
        </div>
      </div>

      {/* 学生列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-16">学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead className="w-16">性别</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-32 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                    {searchTerm || statusFilter !== 'all' ? '没有匹配的学生' : '暂无学生数据'}
                  </TableCell>
                </TableRow>
              ) : (
                pagination.paginatedItems.map((student) => (
                  <TableRow key={student.id} className="hover:bg-purple-50/30 cursor-pointer" onClick={() => onViewDetail(student.id)}>
                    <TableCell className="text-gray-500 font-mono text-sm">{student.studentNo}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getGenderStyle(student.gender)}>
                        {student.gender === 'male' ? '男' : '女'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewDetail(student.id); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); confirmDelete(student); }} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => pagination.setPage(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => pagination.setPage(pagination.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除学生「{studentToDelete?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={mutationLoading}>
              {mutationLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
