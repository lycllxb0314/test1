'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileSignature,
  CheckCircle,
  Clock,
  Search,
  Star,
  MessageSquare,
  RefreshCw,
  Loader2,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { habitCategoryNames, type HabitCategory } from '@/types';

// 确认记录类型
interface ConfirmationRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
  className?: string;
  month: string;
  parentConfirmed: boolean;
  parentConfirmedAt?: string;
  parentSignature: string;
  parentNotes?: string;
  teacherReviewed: boolean;
  teacherReviewedAt?: string;
  teacherId?: string;
  teacherName?: string;
  teacherNotes?: string;
  teacherRating?: number;
  totalScore: number;
  categoriesCompleted: string[];
  goalsCompleted: number;
  status: 'pending_parent' | 'pending_teacher' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 模拟当前教师信息
const currentTeacher = {
  id: 'teacher-001',
  name: '张老师',
  classId: 'class-001',
  className: '三年级(1)班',
};

export default function MonthlyConfirmationPage() {
  const [records, setRecords] = useState<ConfirmationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_teacher' | 'completed'>('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  
  // 审核对话框
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ConfirmationRecord | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [teacherRating, setTeacherRating] = useState<number>(4);
  const [reviewing, setReviewing] = useState(false);

  // 获取确认记录
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('month', monthFilter);
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/habit/monthly-confirmations?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        // 补充学生信息
        const studentIds = [...new Set(result.data.map((r: ConfirmationRecord) => r.studentId))];
        
        if (studentIds.length > 0) {
          const studentsResponse = await fetch('/api/students?' + studentIds.map(id => `ids=${id}`).join('&'));
          const studentsResult = await studentsResponse.json();
          
          if (studentsResult.success && studentsResult.data) {
            const studentMap = (studentsResult.data || []).reduce((acc: Record<string, { name: string; studentNumber: string; className: string }>, s: { id: string; name: string; studentNumber: string; className: string }) => {
              acc[s.id] = s;
              return acc;
            }, {});

            setRecords(result.data.map((r: ConfirmationRecord) => ({
              ...r,
              studentName: studentMap[r.studentId]?.name || '未知',
              studentNumber: studentMap[r.studentId]?.studentNumber || '',
              className: studentMap[r.studentId]?.className || '',
            })));
            return;
          }
        }

        setRecords(result.data);
      }
    } catch (error) {
      console.error('获取确认记录失败:', error);
      toast.error('获取确认记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [monthFilter, statusFilter]);

  // 筛选记录
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!searchTerm) return true;
      return r.studentName?.includes(searchTerm) || 
             r.studentNumber?.includes(searchTerm) ||
             r.parentSignature?.includes(searchTerm);
    });
  }, [records, searchTerm]);

  // 统计数据
  const stats = useMemo(() => {
    const pending = records.filter(r => r.status === 'pending_teacher').length;
    const completed = records.filter(r => r.status === 'completed').length;
    return { pending, completed, total: records.length };
  }, [records]);

  // 打开审核对话框
  const handleOpenReview = (record: ConfirmationRecord) => {
    setSelectedRecord(record);
    setTeacherNotes('');
    setTeacherRating(4);
    setShowReviewDialog(true);
  };

  // 提交审核
  const handleReview = async () => {
    if (!selectedRecord) return;

    try {
      setReviewing(true);
      const response = await fetch('/api/habit/monthly-confirmations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          teacherId: currentTeacher.id,
          teacherName: currentTeacher.name,
          teacherNotes,
          teacherRating,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('审核成功');
        setShowReviewDialog(false);
        fetchRecords();
      } else {
        throw new Error(result.error || '审核失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '审核失败');
    } finally {
      setReviewing(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 格式化月份
  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    return `${year}年${parseInt(m)}月`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">月度确认审核</h1>
          </div>
          <p className="text-gray-500 mt-1">{currentTeacher.className} · 家长签字后需班主任审核</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchRecords} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月总数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-[160px]"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'pending_teacher' | 'completed')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending_teacher">待审核</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 记录列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">确认记录</CardTitle>
          <CardDescription>{formatMonth(monthFilter)} 月度确认记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无确认记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>家长签字</TableHead>
                  <TableHead>得分</TableHead>
                  <TableHead>完成目标</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{record.studentName}</div>
                          <div className="text-xs text-muted-foreground">{record.studentNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{record.parentSignature}</span>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(record.parentConfirmedAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-lg">{record.totalScore}</span>
                      <span className="text-xs text-muted-foreground"> 分</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.goalsCompleted} 个</Badge>
                    </TableCell>
                    <TableCell>
                      {record.status === 'completed' ? (
                        <Badge className="bg-green-600">已完成</Badge>
                      ) : (
                        <Badge className="bg-amber-600">待审核</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.status === 'pending_teacher' ? (
                        <Button size="sm" onClick={() => handleOpenReview(record)}>
                          审核
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleOpenReview(record)}>
                          查看
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 审核对话框 */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord?.status === 'completed' ? '查看详情' : '审核确认'}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.studentName} · {formatMonth(selectedRecord?.month || '')}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {/* 家长信息 */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">家长签字</span>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(selectedRecord.parentConfirmedAt)}
                    </span>
                  </div>
                  <p className="font-bold text-lg">{selectedRecord.parentSignature}</p>
                  {selectedRecord.parentNotes && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedRecord.parentNotes}</p>
                  )}
                </CardContent>
              </Card>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{selectedRecord.totalScore}</p>
                  <p className="text-xs text-muted-foreground">总得分</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">{selectedRecord.goalsCompleted}</p>
                  <p className="text-xs text-muted-foreground">完成目标</p>
                </div>
              </div>

              {/* 完成的习惯类别 */}
              {selectedRecord.categoriesCompleted && selectedRecord.categoriesCompleted.length > 0 && (
                <div>
                  <Label className="text-sm mb-2 block">完成的习惯类别</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.categoriesCompleted.map((cat) => (
                      <Badge key={cat} variant="secondary">
                        {habitCategoryNames[cat as HabitCategory] || cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 审核信息 */}
              {selectedRecord.status === 'completed' ? (
                <div className="space-y-2">
                  <Label>审核评语</Label>
                  <p className="text-sm p-3 rounded-lg bg-muted/50">
                    {selectedRecord.teacherNotes || '无评语'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">评分：</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (selectedRecord.teacherRating || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherNotes">审核评语</Label>
                    <Textarea
                      id="teacherNotes"
                      placeholder="请输入对学生本月习惯养成的评价..."
                      value={teacherNotes}
                      onChange={(e) => setTeacherNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>评分</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setTeacherRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              star <= teacherRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              {selectedRecord?.status === 'completed' ? '关闭' : '取消'}
            </Button>
            {selectedRecord?.status !== 'completed' && (
              <Button onClick={handleReview} disabled={reviewing}>
                {reviewing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                确认审核
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
