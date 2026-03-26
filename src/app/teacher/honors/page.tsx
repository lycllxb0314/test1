'use client';

/**
 * 教师端荣誉管理页面
 * 
 * 班主任/副班主任专用：
 * - 管理本班学生荣誉
 * - 查看本班荣誉统计
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Award,
  Trophy,
  Medal,
  Star,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Users,
  Calendar,
  BarChart3,
  Crown,
  Target,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

// ==================== 类型定义 ====================

type HonorLevel = '国家级' | '省级' | '市级' | '区级' | '校级' | '班级';
type HonorCategory = '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';

interface StudentHonor {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  grade?: string;
  title: string;
  level: HonorLevel;
  category: HonorCategory;
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  studentNo: string;
  className: string;
}

// ==================== 配置 ====================

const HONOR_LEVELS: HonorLevel[] = ['国家级', '省级', '市级', '区级', '校级', '班级'];
const HONOR_CATEGORIES: HonorCategory[] = ['综合', '学习', '德育', '体育', '艺术', '劳动', '科技'];

const LEVEL_COLORS: Record<HonorLevel, string> = {
  '国家级': '#f43f5e',
  '省级': '#f97316',
  '市级': '#eab308',
  '区级': '#22c55e',
  '校级': '#3b82f6',
  '班级': '#8b5cf6',
};

const CATEGORY_COLORS: Record<HonorCategory, string> = {
  '综合': '#f43f5e',
  '学习': '#3b82f6',
  '德育': '#22c55e',
  '体育': '#f97316',
  '艺术': '#a855f7',
  '劳动': '#eab308',
  '科技': '#06b6d4',
};

const PIE_COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4'];

// ==================== 主组件 ====================

export default function TeacherHonorsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('overview');
  
  // === 数据状态 ===
  const [honors, setHonors] = useState<StudentHonor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // === 班级信息 ===
  const [classInfo, setClassInfo] = useState<{ id: string; name: string } | null>(null);
  
  // === 统计数据 ===
  const [statistics, setStatistics] = useState<{
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    topStudents: Array<{ studentId: string; studentName: string; count: number }>;
  } | null>(null);
  
  // === 筛选状态 ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // === 分页状态 ===
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // === 对话框状态 ===
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedHonor, setSelectedHonor] = useState<StudentHonor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [honorToDelete, setHonorToDelete] = useState<StudentHonor | null>(null);
  
  // === 表单状态 ===
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    title: '',
    level: '校级' as HonorLevel,
    category: '综合' as HonorCategory,
    issuer: '',
    date: new Date().toISOString().split('T')[0],
    certificateNo: '',
    description: '',
  });
  
  // === 学生搜索状态 ===
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // ==================== 数据加载 ====================

  // 加载本班学生
  const loadStudents = useCallback(async () => {
    if (!user?.classId) return;
    
    try {
      const res = await fetch(`/api/students?classId=${user.classId}&pageSize=100`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        const studentList = (result.data || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
          studentNo: s.studentNo,
          className: s.className,
        }));
        setStudents(studentList);
        
        // 设置班级信息
        if (studentList.length > 0) {
          setClassInfo({
            id: user.classId,
            name: studentList[0].className,
          });
        }
      }
    } catch (err) {
      console.error('加载学生列表失败:', err);
      toast.error('加载学生列表失败');
    }
  }, [user?.classId]);

  // 加载本班荣誉
  const loadHonors = useCallback(async () => {
    if (!user?.classId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('classId', user.classId);
      if (filterLevel !== 'all') params.set('level', filterLevel);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/student-honors?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setHonors(result.data || []);
        setTotal(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
        
        // 计算本班统计
        const honorList = result.data || [];
        const byLevel: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        const studentCount: Record<string, { name: string; count: number }> = {};
        
        honorList.forEach((h: StudentHonor) => {
          byLevel[h.level] = (byLevel[h.level] || 0) + 1;
          byCategory[h.category] = (byCategory[h.category] || 0) + 1;
          if (!studentCount[h.studentId]) {
            studentCount[h.studentId] = { name: h.studentName, count: 0 };
          }
          studentCount[h.studentId].count++;
        });
        
        const topStudents = Object.entries(studentCount)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id, data]) => ({ studentId: id, studentName: data.name, count: data.count }));
        
        setStatistics({
          total: honorList.length,
          byLevel,
          byCategory,
          topStudents,
        });
      } else {
        toast.error(result.error || '加载失败');
      }
    } catch (err) {
      console.error('加载荣誉列表失败:', err);
      toast.error('加载荣誉列表失败');
    } finally {
      setLoading(false);
    }
  }, [user?.classId, page, pageSize, filterLevel, filterCategory, searchTerm]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (user?.classId) {
      loadHonors();
    }
  }, [loadHonors, user?.classId]);

  // ==================== 操作处理 ====================

  // 打开创建对话框
  const handleCreate = () => {
    setDialogMode('create');
    setFormData({
      studentId: '',
      studentName: '',
      title: '',
      level: '校级',
      category: '综合',
      issuer: '',
      date: new Date().toISOString().split('T')[0],
      certificateNo: '',
      description: '',
    });
    setStudentSearchTerm('');
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (honor: StudentHonor) => {
    setDialogMode('edit');
    setSelectedHonor(honor);
    setFormData({
      studentId: honor.studentId,
      studentName: honor.studentName,
      title: honor.title,
      level: honor.level,
      category: honor.category,
      issuer: honor.issuer || '',
      date: honor.date,
      certificateNo: honor.certificateNo || '',
      description: honor.description || '',
    });
    setStudentSearchTerm(honor.studentName);
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证
    if (!formData.studentId) {
      toast.error('请选择学生');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('请输入荣誉名称');
      return;
    }
    
    setSubmitting(true);
    try {
      const url = dialogMode === 'create' 
        ? '/api/student-honors' 
        : `/api/student-honors/${selectedHonor?.id}`;
      
      const submitData = {
        ...formData,
        className: classInfo?.name,
      };
      
      const res = await fetch(url, {
        method: dialogMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success(dialogMode === 'create' ? '荣誉添加成功' : '荣誉更新成功');
        setDialogOpen(false);
        loadHonors();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err) {
      console.error('提交失败:', err);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除荣誉
  const handleDelete = async () => {
    if (!honorToDelete) return;
    
    try {
      const res = await fetch(`/api/student-honors/${honorToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('荣誉删除成功');
        setDeleteDialogOpen(false);
        setHonorToDelete(null);
        loadHonors();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    }
  };

  // ==================== 图表数据转换 ====================

  const levelChartData = statistics ? HONOR_LEVELS
    .filter(level => statistics.byLevel[level] > 0)
    .map(level => ({
      name: level,
      value: statistics.byLevel[level] || 0,
      fill: LEVEL_COLORS[level],
    })) : [];

  const categoryChartData = statistics ? HONOR_CATEGORIES
    .filter(cat => statistics.byCategory[cat] > 0)
    .map(cat => ({
      name: cat,
      value: statistics.byCategory[cat] || 0,
    })) : [];

  // ==================== 渲染 ====================

  // 未分配班级提示
  if (!user?.classId) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teacher')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">荣誉管理</h1>
            <p className="text-gray-500">管理本班学生荣誉</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">您尚未分配班级，无法使用荣誉管理功能</p>
            <p className="text-sm text-muted-foreground mt-2">请联系管理员为您分配班级</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teacher')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">荣誉管理</h1>
            <p className="text-gray-500 mt-1">
              {classInfo ? `${classInfo.name} - 学生荣誉管理` : '管理本班学生荣誉'}
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          添加荣誉
        </Button>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            统计概览
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2">
            <Trophy className="h-4 w-4" />
            荣誉管理
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 统计概览 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">本班荣誉</p>
                    <p className="text-3xl font-bold">{statistics?.total || 0}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">获奖学生</p>
                    <p className="text-3xl font-bold">{statistics?.topStudents?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">高级别荣誉</p>
                    <p className="text-3xl font-bold">
                      {(statistics?.byLevel?.['国家级'] || 0) + (statistics?.byLevel?.['省级'] || 0) + (statistics?.byLevel?.['市级'] || 0)}
                    </p>
                  </div>
                  <Crown className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 图表区域 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 按级别统计 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Medal className="h-5 w-5 text-amber-500" />
                  按级别统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics && levelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={levelChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {levelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 按类别统计 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  按类别统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics && categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 获奖之星 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                获奖之星
              </CardTitle>
              <CardDescription>本班获奖最多的学生</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics?.topStudents && statistics.topStudents.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-5">
                  {statistics.topStudents.map((student, index) => (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.studentName}</p>
                        <p className="text-sm text-amber-600">{student.count} 次获奖</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 荣誉管理 */}
        <TabsContent value="management" className="space-y-4">
          {/* 筛选栏 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索学生姓名、荣誉名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    {HONOR_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    {HONOR_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => loadHonors()}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 荣誉列表 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">荣誉列表</CardTitle>
                <p className="text-sm text-gray-500">共 {total} 条记录</p>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : honors.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无荣誉记录</p>
                  <Button onClick={handleCreate} variant="link" className="mt-2">
                    添加第一条荣誉
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生</TableHead>
                      <TableHead>荣誉名称</TableHead>
                      <TableHead>级别</TableHead>
                      <TableHead>类别</TableHead>
                      <TableHead>获奖日期</TableHead>
                      <TableHead>颁发单位</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {honors.map((honor) => (
                      <TableRow key={honor.id}>
                        <TableCell>
                          <p className="font-medium">{honor.studentName}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{honor.title}</p>
                          {honor.certificateNo && (
                            <p className="text-xs text-gray-500">证书号: {honor.certificateNo}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: LEVEL_COLORS[honor.level] + '20', color: LEVEL_COLORS[honor.level] }}
                          >
                            {honor.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ color: CATEGORY_COLORS[honor.category] }}>
                            {honor.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{honor.date}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{honor.issuer || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(honor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setHonorToDelete(honor);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-gray-500">
                    第 {page} / {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              {dialogMode === 'create' ? '添加荣誉' : '编辑荣誉'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? '为本班学生添加获奖荣誉记录' : '修改荣誉信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* 学生选择 - 搜索式 */}
            <div className="grid gap-2">
              <Label>学生 *</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentSearchOpen}
                    className="justify-between font-normal"
                    disabled={dialogMode === 'edit'}
                  >
                    {formData.studentName || '搜索选择学生...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="输入学生姓名或学号搜索..." 
                      value={studentSearchTerm}
                      onValueChange={setStudentSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {studentSearchTerm ? '未找到匹配的学生' : '请输入姓名或学号搜索'}
                      </CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {students
                          .filter(s => 
                            !studentSearchTerm || 
                            s.name.includes(studentSearchTerm) || 
                            s.studentNo?.includes(studentSearchTerm)
                          )
                          .map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.id}
                              onSelect={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  studentId: s.id,
                                  studentName: s.name,
                                }));
                                setStudentSearchTerm(s.name);
                                setStudentSearchOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.studentId === s.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <span className="font-medium">{s.name}</span>
                              <span className="ml-2 text-muted-foreground text-sm">
                                {s.studentNo}
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {dialogMode === 'edit' && (
                <p className="text-xs text-muted-foreground">编辑时不可更改学生</p>
              )}
            </div>

            {/* 荣誉名称 */}
            <div className="grid gap-2">
              <Label>荣誉名称 *</Label>
              <Input
                placeholder="如：三好学生、优秀少先队员..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* 级别和类别 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>荣誉级别 *</Label>
                <Select 
                  value={formData.level} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, level: v as HonorLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HONOR_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>荣誉类别 *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as HonorCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HONOR_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 获奖日期和颁发单位 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>获奖日期 *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>颁发单位</Label>
                <Input
                  placeholder="如：市教育局、区团委..."
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                />
              </div>
            </div>

            {/* 证书编号 */}
            <div className="grid gap-2">
              <Label>证书编号</Label>
              <Input
                placeholder="证书编号（选填）"
                value={formData.certificateNo}
                onChange={(e) => setFormData(prev => ({ ...prev, certificateNo: e.target.value }))}
              />
            </div>

            {/* 描述 */}
            <div className="grid gap-2">
              <Label>备注说明</Label>
              <Textarea
                placeholder="荣誉说明或其他备注信息..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogMode === 'create' ? '添加' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{honorToDelete?.title}」这条荣誉记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
