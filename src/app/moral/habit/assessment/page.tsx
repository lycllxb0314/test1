'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  Plus,
  Search,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Calendar,
  User,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AssessmentDialog } from '@/components/habit/AssessmentDialog';
import { useHabitAssessments, type HabitAssessmentData } from '@/hooks/useHabitData';
import { HabitCategory, habitCategoryNames } from '@/types';

// 习惯类别配置
const habitCategories: { key: HabitCategory; name: string; icon: React.ElementType }[] = [
  { key: 'civilization', name: '文明习惯', icon: Heart },
  { key: 'writing', name: '书写习惯', icon: Pen },
  { key: 'reading', name: '阅读习惯', icon: BookOpen },
  { key: 'sports', name: '运动习惯', icon: Trophy },
  { key: 'safety', name: '安全习惯', icon: Shield },
  { key: 'hygiene', name: '卫生习惯', icon: Sparkles },
  { key: 'aesthetic', name: '审美习惯', icon: Palette },
  { key: 'labor', name: '劳动习惯', icon: Hammer },
];

// 模拟当前教师信息（TODO: 从登录状态获取）
const currentTeacher = {
  id: 'teacher-001',
  name: '张老师',
  classId: 'class-001',
  className: '三年级(1)班',
};

export default function HabitAssessmentPage() {
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'praise' | 'improve'>('all');
  const [students, setStudents] = useState<Array<{
    id: string;
    name: string;
    studentNumber: string;
    grade: number;
    className: string;
  }>>([]);

  // 获取评价记录
  const { data: assessments, loading, error, refetch } = useHabitAssessments({
    limit: 100,
  });

  // 获取班级学生列表
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/classes/${currentTeacher.classId}/students`);
        const result = await response.json();
        if (result.success && result.data) {
          setStudents(result.data);
        }
      } catch (err) {
        console.error('获取学生列表失败:', err);
      }
    };
    fetchStudents();
  }, []);

  // 筛选评价记录
  const filteredAssessments = useMemo(() => {
    return (assessments || []).filter(a => {
      const matchesSearch = !searchTerm || 
        a.studentName.includes(searchTerm) ||
        a.context?.includes(searchTerm);
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'praise' && a.score > 0) ||
        (typeFilter === 'improve' && a.score < 0);
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [assessments, searchTerm, categoryFilter, typeFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const total = filteredAssessments.length;
    const praise = filteredAssessments.filter(a => a.score > 0).length;
    const improve = filteredAssessments.filter(a => a.score < 0).length;
    return { total, praise, improve };
  }, [filteredAssessments]);

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 获取类别信息
  const getCategoryInfo = (key: HabitCategory) => {
    return habitCategories.find(c => c.key === key) || habitCategories[0];
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">评价记录录入</h1>
          <p className="text-gray-500 mt-1">{currentTeacher.className} · 八大行为习惯养成</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setShowAssessmentDialog(true)}>
            <Plus className="h-4 w-4" />
            添加评价
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总评价数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">表扬次数</p>
                <p className="text-3xl font-bold text-green-600">{stats.praise}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待改进次数</p>
                <p className="text-3xl font-bold text-amber-600">{stats.improve}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <ThumbsDown className="h-6 w-6 text-amber-600" />
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
                placeholder="搜索学生姓名或评价内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as HabitCategory | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="习惯类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                {habitCategories.map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'praise' | 'improve')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="评价类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="praise">表扬</SelectItem>
                <SelectItem value="improve">待改进</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 评价记录列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">评价记录</CardTitle>
          <CardDescription>最近的习惯评价记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无评价记录</p>
              <Button variant="link" className="mt-2" onClick={() => setShowAssessmentDialog(true)}>
                点击添加第一条评价
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>习惯类别</TableHead>
                  <TableHead>评价内容</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.slice(0, 20).map((assessment) => {
                  const categoryInfo = getCategoryInfo(assessment.category);
                  const Icon = categoryInfo.icon;
                  const isPraise = assessment.score > 0;
                  
                  return (
                    <TableRow key={assessment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{assessment.studentName}</div>
                            <div className="text-xs text-muted-foreground">{assessment.className}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={isPraise ? 'default' : 'secondary'}
                          className={`gap-1 ${isPraise ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                        >
                          {isPraise ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          {isPraise ? '表扬' : '待改进'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{categoryInfo.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm" title={assessment.context}>
                          {assessment.context}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(assessment.occurredAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 评价录入对话框 */}
      <AssessmentDialog
        open={showAssessmentDialog}
        onOpenChange={setShowAssessmentDialog}
        students={students}
        classId={currentTeacher.classId}
        evaluatorId={currentTeacher.id}
        evaluatorName={currentTeacher.name}
        onSuccess={() => {
          refetch();
          toast.success('评价记录已保存');
        }}
      />
    </div>
  );
}
