'use client';

/**
 * 学生荣誉管理页面
 * 
 * 德育处专用功能：
 * - Tab 1: 可视化展示全校学生荣誉获奖状况
 * - Tab 2: 荣誉管理（CRUD）
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Download,
  Filter,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Crown,
  Target,
  Loader2,
  ChevronLeft,
  Eye,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CHART_COLORS,
} from '@/components/charts/DynamicCharts';
import { useAuth } from '@/contexts/AuthContext';

// ==================== 类型定义 ====================

type HonorLevel = '国家级' | '省级' | '市级' | '区级' | '校级' | '班级';
type HonorCategory = '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';

interface StudentHonor {
  id: string;
  studentId: string;
  studentName: string;
  studentNo?: string;
  classId?: string;
  className?: string;
  grade?: number;
  title: string;
  level: HonorLevel;
  category: HonorCategory;
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
  createdAt: string;
}

interface HonorStatistics {
  total: number;
  uniqueStudents: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  byGrade: Record<number, number>;
  byMonth: Record<string, number>;
  topStudents: Array<{ studentId: string; studentName: string; count: number }>;
}

interface Student {
  id: string;
  name: string;
  studentNo: string;
  grade: number;
  classId: string;
  className: string;
}

// ==================== 配置 ====================

const HONOR_LEVELS: HonorLevel[] = ['国家级', '省级', '市级', '区级', '校级', '班级'];
const HONOR_CATEGORIES: HonorCategory[] = ['综合', '学习', '德育', '体育', '艺术', '劳动', '科技'];
const GRADES = [1, 2, 3, 4, 5, 6];

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

export default function StudentHonorsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('visualization');
  
  // === 数据状态 ===
  const [honors, setHonors] = useState<StudentHonor[]>([]);
  const [statistics, setStatistics] = useState<HonorStatistics | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // === 筛选状态 ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  
  // === 分页状态 ===
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // === 批量操作状态 ===
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchMode, setBatchMode] = useState<'edit' | 'delete'>('edit');
  const [batchFormData, setBatchFormData] = useState({
    level: '' as HonorLevel | '',
    category: '' as HonorCategory | '',
    issuer: '',
  });
  
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

  // 加载荣誉列表
  const loadHonors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('statistics', 'true');
      if (filterLevel !== 'all') params.set('level', filterLevel);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterGrade !== 'all') params.set('grade', filterGrade);
      if (filterYear) params.set('year', filterYear);
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/student-honors?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        // API 返回 { data: { data: [], pagination: {} } }，需要处理嵌套结构
        const honorsData = result.data?.data || result.data || [];
        setHonors(Array.isArray(honorsData) ? honorsData : []);
        setTotal(result.data?.pagination?.total || result.pagination?.total || 0);
        setTotalPages(result.data?.pagination?.totalPages || result.pagination?.totalPages || 1);
        setStatistics(result.statistics || result.data?.statistics);
      } else {
        toast.error(result.error || '加载失败');
      }
    } catch (err) {
      console.error('加载荣誉列表失败:', err);
      toast.error('加载荣誉列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterLevel, filterCategory, filterGrade, filterYear, searchTerm]);

  // 加载学生列表（用于选择）
  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students?pageSize=1000', {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setStudents((result.data || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
          studentNo: s.studentNo,
          grade: s.grade,
          classId: s.classId,
          className: s.className,
        })));
      }
    } catch (err) {
      console.error('加载学生列表失败:', err);
    }
  }, []);

  useEffect(() => {
    loadHonors();
  }, [loadHonors]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

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
      
      const res = await fetch(url, {
        method: dialogMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
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

  // ==================== 批量操作 ====================

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(honors.map(h => h.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 单个选择
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  // 打开批量编辑对话框
  const handleBatchEdit = () => {
    if (selectedIds.length === 0) {
      toast.error('请选择要编辑的荣誉记录');
      return;
    }
    setBatchMode('edit');
    setBatchFormData({
      level: '',
      category: '',
      issuer: '',
    });
    setBatchDialogOpen(true);
  };

  // 打开批量删除确认
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('请选择要删除的荣誉记录');
      return;
    }
    setBatchMode('delete');
    setBatchDialogOpen(true);
  };

  // 执行批量操作
  const handleBatchSubmit = async () => {
    if (batchMode === 'delete') {
      try {
        const res = await fetch('/api/student-honors/batch', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids: selectedIds }),
        });
        
        const result = await res.json();
        
        if (result.success) {
          toast.success(`成功删除 ${result.data.count} 条记录`);
          setBatchDialogOpen(false);
          setSelectedIds([]);
          loadHonors();
        } else {
          toast.error(result.error || '批量删除失败');
        }
      } catch (err) {
        console.error('批量删除失败:', err);
        toast.error('批量删除失败');
      }
    } else {
      // 批量编辑
      const updateData: Record<string, string> = {};
      if (batchFormData.level) updateData.level = batchFormData.level;
      if (batchFormData.category) updateData.category = batchFormData.category;
      if (batchFormData.issuer) updateData.issuer = batchFormData.issuer;
      
      if (Object.keys(updateData).length === 0) {
        toast.error('请至少选择一项要修改的内容');
        return;
      }
      
      try {
        const res = await fetch('/api/student-honors/batch', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids: selectedIds, data: updateData }),
        });
        
        const result = await res.json();
        
        if (result.success) {
          toast.success(`成功更新 ${result.data.count} 条记录`);
          setBatchDialogOpen(false);
          setSelectedIds([]);
          loadHonors();
        } else {
          toast.error(result.error || '批量更新失败');
        }
      } catch (err) {
        console.error('批量更新失败:', err);
        toast.error('批量更新失败');
      }
    }
  };

  // 导出数据
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      
      // 如果有选中记录，只导出选中的
      if (selectedIds.length > 0) {
        params.set('ids', selectedIds.join(','));
      } else {
        // 否则按筛选条件导出
        if (filterLevel !== 'all') params.set('level', filterLevel);
        if (filterCategory !== 'all') params.set('category', filterCategory);
        if (filterGrade !== 'all') params.set('grade', filterGrade);
        if (filterYear) params.set('year', filterYear);
      }
      
      if (format === 'csv') {
        // 直接下载 CSV
        const res = await fetch(`/api/student-honors/export?${params.toString()}`, {
          credentials: 'include',
        });
        
        if (!res.ok) {
          toast.error('导出失败');
          return;
        }
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_honors_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('导出成功');
      } else {
        // Excel 格式需要前端处理
        const res = await fetch(`/api/student-honors/export?${params.toString()}`, {
          credentials: 'include',
        });
        
        const result = await res.json();
        
        if (result.success) {
          // 动态导入 xlsx 库生成 Excel
          const XLSX = await import('xlsx');
          const ws = XLSX.utils.json_to_sheet(result.data.rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, '学生荣誉');
          XLSX.writeFile(wb, result.data.filename);
          toast.success('导出成功');
        } else {
          toast.error(result.error || '导出失败');
        }
      }
    } catch (err) {
      console.error('导出失败:', err);
      toast.error('导出失败');
    }
  };

  // ==================== 图表数据转换 ====================

  const levelChartData = statistics ? HONOR_LEVELS.map(level => ({
    name: level,
    value: statistics.byLevel[level] || 0,
    fill: LEVEL_COLORS[level],
  })) : [];

  const categoryChartData = statistics ? HONOR_CATEGORIES.map(cat => ({
    name: cat,
    value: statistics.byCategory[cat] || 0,
  })) : [];

  const gradeChartData = statistics ? GRADES.map(g => ({
    name: `${g}年级`,
    value: statistics.byGrade[g] || 0,
  })) : [];

  const monthChartData = statistics ? Object.entries(statistics.byMonth).map(([month, count]) => ({
    name: `${month}月`,
    value: count,
  })) : [];

  // ==================== 渲染 ====================

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/moral')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">学生荣誉管理</h1>
            <p className="text-gray-500 mt-1">
              管理学生获奖荣誉，可视化展示全校荣誉状况
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            添加荣誉
          </Button>
        </div>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="visualization" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            可视化展示
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2">
            <Trophy className="h-4 w-4" />
            荣誉管理
          </TabsTrigger>
        </TabsList>

        {/* ========== Tab 1: 可视化展示 ========== */}
        <TabsContent value="visualization" className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-rose-500 to-pink-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">荣誉总数</p>
                    <p className="text-3xl font-bold">{statistics?.total || 0}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">获奖学生</p>
                    <p className="text-3xl font-bold">{statistics?.uniqueStudents || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">高级别荣誉</p>
                    <p className="text-3xl font-bold">
                      {(statistics?.byLevel?.['国家级'] || 0) + (statistics?.byLevel?.['省级'] || 0)}
                    </p>
                  </div>
                  <Crown className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">本年度新增</p>
                    <p className="text-3xl font-bold">{statistics?.total || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-white/60" />
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
                {statistics ? (
                  <ResponsiveContainer width="100%" height={300}>
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
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
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
                {statistics ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 按年级统计 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  按年级统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 按月份统计 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  按月份统计（本年度）
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
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
                获奖之星（TOP 10）
              </CardTitle>
              <CardDescription>获奖次数最多的学生</CardDescription>
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

        {/* ========== Tab 2: 荣誉管理 ========== */}
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
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="年份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年份</SelectItem>
                    {[2025, 2024, 2023, 2022, 2021].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g.toString()}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => loadHonors()}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 批量操作栏 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedIds.length === honors.length && honors.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm cursor-pointer">
                      全选
                    </Label>
                  </div>
                  {selectedIds.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      已选 {selectedIds.length} 项
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleBatchEdit}
                    disabled={selectedIds.length === 0}
                  >
                    <Edit className="h-4 w-4" />
                    批量修改
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={handleBatchDelete}
                    disabled={selectedIds.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    批量删除
                  </Button>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleExport('csv')}
                  >
                    <Download className="h-4 w-4" />
                    导出 CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleExport('excel')}
                  >
                    <Download className="h-4 w-4" />
                    导出 Excel
                  </Button>
                </div>
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
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.length === honors.length && honors.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>学生</TableHead>
                      <TableHead>班级</TableHead>
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
                          <Checkbox
                            checked={selectedIds.includes(honor.id)}
                            onCheckedChange={(checked) => handleSelectOne(honor.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{honor.studentName}</p>
                            <p className="text-xs text-gray-500">{honor.studentNo}</p>
                          </div>
                        </TableCell>
                        <TableCell>{honor.className || '-'}</TableCell>
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

      {/* ========== 新增/编辑对话框 ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              {dialogMode === 'create' ? '添加荣誉' : '编辑荣誉'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? '为学生添加获奖荣誉记录' : '修改荣誉信息'}
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
                            s.studentNo?.includes(studentSearchTerm) ||
                            s.className?.includes(studentSearchTerm)
                          )
                          .slice(0, 50) // 限制显示数量
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
                                {s.studentNo} · {s.className}
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

      {/* ========== 删除确认对话框 ========== */}
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

      {/* ========== 批量操作对话框 ========== */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {batchMode === 'delete' ? '批量删除确认' : '批量修改'}
            </DialogTitle>
            <DialogDescription>
              {batchMode === 'delete' 
                ? `确定要删除选中的 ${selectedIds.length} 条荣誉记录吗？此操作不可撤销。`
                : `将对选中的 ${selectedIds.length} 条记录进行修改，留空的字段保持不变。`
              }
            </DialogDescription>
          </DialogHeader>
          
          {batchMode === 'edit' && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>荣誉级别</Label>
                <Select 
                  value={batchFormData.level} 
                  onValueChange={(v) => setBatchFormData(prev => ({ ...prev, level: v as HonorLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="不修改" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不修改</SelectItem>
                    {HONOR_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>荣誉类别</Label>
                <Select 
                  value={batchFormData.category} 
                  onValueChange={(v) => setBatchFormData(prev => ({ ...prev, category: v as HonorCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="不修改" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不修改</SelectItem>
                    {HONOR_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>颁发单位</Label>
                <Input
                  placeholder="留空则不修改"
                  value={batchFormData.issuer}
                  onChange={(e) => setBatchFormData(prev => ({ ...prev, issuer: e.target.value }))}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleBatchSubmit}
              className={batchMode === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {batchMode === 'delete' ? '确认删除' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
