'use client';

/**
 * 德育处班级常规管理页面
 * 
 * 功能：
 * - Tab 1: 全校/年级情况总览
 * - Tab 2: 值日老师设置
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';
import {
  ClipboardCheck,
  Users,
  Calendar,
  BarChart3,
  Crown,
  Target,
  Loader2,
  ChevronLeft,
  Plus,
  Trash2,
  Edit,
  Check,
  ChevronsUpDown,
  Star,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CHART_COLORS,
} from '@/components/charts/DynamicCharts';

// ==================== 类型定义 ====================

type ScoreCategory = '文明礼仪' | '遵守纪律' | '班容班貌' | '环境卫生' | '文体活动' | '学习习惯';

interface ScoreRecord {
  id: string;
  classId: string;
  className: string;
  grade: number;
  date: string;
  category: ScoreCategory;
  score: number;
  maxScore: number;
  teacherId: string;
  teacherName: string;
  remark?: string;
  createdAt: string;
}

interface DutyTeacher {
  id: string;
  teacherId: string;
  teacherName: string;
  grade: number;
  weekDay: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface Teacher {
  id: string;
  name: string;
  employeeId?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
}

// ==================== 配置 ====================

const SCORE_CATEGORIES: ScoreCategory[] = ['文明礼仪', '遵守纪律', '班容班貌', '环境卫生', '文体活动', '学习习惯'];
const GRADES = [1, 2, 3, 4, 5, 6];
const WEEK_DAYS = [
  { value: 0, label: '每天' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
];

const CATEGORY_COLORS: Record<ScoreCategory, string> = {
  '文明礼仪': '#f43f5e',
  '遵守纪律': '#f97316',
  '班容班貌': '#eab308',
  '环境卫生': '#22c55e',
  '文体活动': '#3b82f6',
  '学习习惯': '#8b5cf6',
};

// ==================== 主组件 ====================

export default function ClassRoutinePage() {
  const router = useRouter();
  
  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('overview');
  
  // === 数据状态 ===
  const [scoreRecords, setScoreRecords] = useState<ScoreRecord[]>([]);
  const [dutyTeachers, setDutyTeachers] = useState<DutyTeacher[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // === 统计数据 ===
  const [summary, setSummary] = useState<{
    totalRecords: number;
    byCategory: Record<string, { totalScore: number; count: number }>;
    byGrade: Record<number, { totalScore: number; count: number }>;
    classRanking: Array<{ classId: string; className: string; grade: number; totalScore: number; count: number; avgScore: number }>;
  } | null>(null);
  
  // === 筛选状态 ===
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // === 对话框状态 ===
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<DutyTeacher | null>(null);
  
  // === 表单状态 ===
  const [formData, setFormData] = useState({
    teacherId: '',
    teacherName: '',
    grade: 0,
    weekDay: 0,
  });
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  // ==================== 数据加载 ====================

  // 加载评分记录
  const loadScores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('summary', 'true');
      if (filterGrade !== 'all') params.set('grade', filterGrade);
      if (filterDate) {
        params.set('startDate', filterDate);
        params.set('endDate', filterDate);
      }
      
      const res = await fetch(`/api/routine-scores?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setScoreRecords(result.data || []);
        setSummary(result.summary);
      } else {
        toast.error(result.error || '加载失败');
      }
    } catch (err) {
      console.error('加载评分记录失败:', err);
      toast.error('加载评分记录失败');
    } finally {
      setLoading(false);
    }
  }, [filterGrade, filterDate]);

  // 加载值日老师
  const loadDutyTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/duty-teachers?active=true', {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setDutyTeachers(result.data || []);
      }
    } catch (err) {
      console.error('加载值日老师失败:', err);
    }
  }, []);

  // 加载教师列表
  const loadTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/teachers?pageSize=200', {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setTeachers((result.data || []).map((t: Record<string, unknown>) => ({
          id: t.id,
          name: t.name,
          employeeId: t.employeeId as string,
        })));
      }
    } catch (err) {
      console.error('加载教师列表失败:', err);
    }
  }, []);

  // 加载班级列表
  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes?pageSize=100', {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setClasses((result.data || []).map((c: Record<string, unknown>) => ({
          id: c.id,
          name: c.name,
          grade: c.grade as number,
        })));
      }
    } catch (err) {
      console.error('加载班级列表失败:', err);
    }
  }, []);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  useEffect(() => {
    loadDutyTeachers();
    loadTeachers();
    loadClasses();
  }, [loadDutyTeachers, loadTeachers, loadClasses]);

  // ==================== 操作处理 ====================

  // 打开创建值日安排对话框
  const handleCreateDuty = () => {
    setEditingDuty(null);
    setFormData({
      teacherId: '',
      teacherName: '',
      grade: 0,
      weekDay: 0,
    });
    setTeacherSearchTerm('');
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEditDuty = (duty: DutyTeacher) => {
    setEditingDuty(duty);
    setFormData({
      teacherId: duty.teacherId,
      teacherName: duty.teacherName,
      grade: duty.grade,
      weekDay: duty.weekDay,
    });
    setTeacherSearchTerm(duty.teacherName);
    setDialogOpen(true);
  };

  // 提交值日安排
  const handleSubmitDuty = async () => {
    if (!formData.teacherId) {
      toast.error('请选择教师');
      return;
    }
    
    try {
      const url = editingDuty ? '/api/duty-teachers' : '/api/duty-teachers';
      const method = editingDuty ? 'PUT' : 'POST';
      const body = editingDuty 
        ? { id: editingDuty.id, ...formData }
        : { ...formData, isActive: true };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success(editingDuty ? '值日安排已更新' : '值日安排已创建');
        setDialogOpen(false);
        loadDutyTeachers();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (err) {
      console.error('提交失败:', err);
      toast.error('操作失败');
    }
  };

  // 删除值日安排
  const handleDeleteDuty = async (id: string) => {
    if (!confirm('确定要删除该值日安排吗？')) return;
    
    try {
      const res = await fetch(`/api/duty-teachers?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('已删除');
        loadDutyTeachers();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    }
  };

  // ==================== 图表数据转换 ====================

  const categoryChartData = SCORE_CATEGORIES.map(cat => ({
    name: cat,
    value: summary?.byCategory?.[cat]?.count || 0,
    avgScore: summary?.byCategory?.[cat] 
      ? Math.round((summary.byCategory[cat].totalScore / summary.byCategory[cat].count) * 10) / 10 
      : 0,
  }));

  const gradeChartData = GRADES.map(g => ({
    name: `${g}年级`,
    value: summary?.byGrade?.[g]?.count || 0,
    avgScore: summary?.byGrade?.[g]
      ? Math.round((summary.byGrade[g].totalScore / summary.byGrade[g].count) * 10) / 10
      : 0,
  }));

  const radarData = SCORE_CATEGORIES.map(cat => ({
    category: cat,
    score: summary?.byCategory?.[cat]
      ? Math.round((summary.byCategory[cat].totalScore / summary.byCategory[cat].count) * 10) / 10
      : 0,
    fullMark: 10,
  }));

  // 按年级分组班级排名
  const rankingByGrade = GRADES.reduce((acc, g) => {
    acc[g] = summary?.classRanking?.filter(c => c.grade === g) || [];
    return acc;
  }, {} as Record<number, Array<{ classId: string; className: string; grade: number; totalScore: number; count: number; avgScore: number }>>);

  // ==================== 渲染 ====================

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-green-50/30">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/moral')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">班级常规管理</h1>
            <p className="text-gray-500 mt-1">
              班级常规评比与值日老师管理
            </p>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            评比总览
          </TabsTrigger>
          <TabsTrigger value="duty" className="gap-2">
            <Calendar className="h-4 w-4" />
            值日老师
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 评比总览 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 筛选栏 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">日期：</span>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全校</SelectItem>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g.toString()}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => loadScores()}>
                  查询
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">今日评分</p>
                    <p className="text-3xl font-bold">{summary?.totalRecords || 0}</p>
                  </div>
                  <ClipboardCheck className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">参与班级</p>
                    <p className="text-3xl font-bold">{summary?.classRanking?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">值日老师</p>
                    <p className="text-3xl font-bold">{dutyTeachers.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-violet-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">平均分</p>
                    <p className="text-3xl font-bold">
                      {summary?.classRanking?.length 
                        ? (summary.classRanking.reduce((sum, c) => sum + c.avgScore, 0) / summary.classRanking.length).toFixed(1)
                        : '-'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-white/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 图表区域 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 各维度得分 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  各维度评分情况
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 雷达图 */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  综合评估雷达图
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary && radarData.some(d => d.score > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                      <Radar
                        name="平均分"
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.5}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 班级排名 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                班级排名
              </CardTitle>
              <CardDescription>按平均分从高到低排列</CardDescription>
            </CardHeader>
            <CardContent>
              {filterGrade === 'all' ? (
                // 全校排名 - 按年级分组显示
                GRADES.map(g => (
                  <div key={g} className="mb-6 last:mb-0">
                    <h4 className="font-medium mb-3 text-gray-700">{g}年级</h4>
                    {rankingByGrade[g]?.length > 0 ? (
                      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                        {rankingByGrade[g].map((c, idx) => (
                          <div 
                            key={c.classId}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              idx === 0 ? 'bg-yellow-500' :
                              idx === 1 ? 'bg-gray-400' :
                              idx === 2 ? 'bg-amber-600' :
                              'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{c.className}</p>
                              <p className="text-xs text-gray-500">均分: {c.avgScore.toFixed(1)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">暂无数据</p>
                    )}
                  </div>
                ))
              ) : (
                // 单年级排名
                (summary?.classRanking?.length ?? 0) > 0 ? (
                  <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                    {summary?.classRanking?.map((c, idx) => (
                      <div 
                        key={c.classId}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          idx === 0 ? 'bg-yellow-500' :
                          idx === 1 ? 'bg-gray-400' :
                          idx === 2 ? 'bg-amber-600' :
                          'bg-gray-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{c.className}</p>
                          <p className="text-xs text-gray-500">均分: {c.avgScore.toFixed(1)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    暂无数据
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 值日老师 */}
        <TabsContent value="duty" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">值日老师安排</CardTitle>
                <Button onClick={handleCreateDuty} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  添加值日老师
                </Button>
              </div>
              <CardDescription>设置各年级的值日老师，被安排的老师将看到"值日工作"入口</CardDescription>
            </CardHeader>
            <CardContent>
              {dutyTeachers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>教师姓名</TableHead>
                      <TableHead>负责年级</TableHead>
                      <TableHead>值日时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dutyTeachers.map((duty) => (
                      <TableRow key={duty.id}>
                        <TableCell className="font-medium">{duty.teacherName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {duty.grade === 0 ? '全校' : `${duty.grade}年级`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {WEEK_DAYS.find(w => w.value === duty.weekDay)?.label || '每天'}
                        </TableCell>
                        <TableCell>
                          <Badge className={duty.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {duty.isActive ? '有效' : '已停用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditDuty(duty)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteDuty(duty.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无值日老师安排</p>
                  <Button onClick={handleCreateDuty} variant="link" className="mt-2">
                    添加第一位值日老师
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加/编辑值日安排对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDuty ? '编辑值日安排' : '添加值日老师'}</DialogTitle>
            <DialogDescription>
              选择教师并设置其负责的年级和值日时间
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 教师选择 */}
            <div className="grid gap-2">
              <Label>教师 *</Label>
              <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={teacherSearchOpen}
                    className="justify-between font-normal"
                    disabled={!!editingDuty}
                  >
                    {formData.teacherName || '搜索选择教师...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="输入教师姓名搜索..." 
                      value={teacherSearchTerm}
                      onValueChange={setTeacherSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {teacherSearchTerm ? '未找到匹配的教师' : '请输入姓名搜索'}
                      </CommandEmpty>
                      <CommandGroup className="max-h-[250px] overflow-auto">
                        {teachers
                          .filter(t => 
                            !teacherSearchTerm || 
                            t.name.includes(teacherSearchTerm) ||
                            t.employeeId?.includes(teacherSearchTerm)
                          )
                          .map((t) => (
                            <CommandItem
                              key={t.id}
                              value={t.id}
                              onSelect={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  teacherId: t.id,
                                  teacherName: t.name,
                                }));
                                setTeacherSearchTerm(t.name);
                                setTeacherSearchOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.teacherId === t.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <span className="font-medium">{t.name}</span>
                              {t.employeeId && (
                                <span className="ml-2 text-muted-foreground text-sm">
                                  ({t.employeeId})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* 负责年级 */}
            <div className="grid gap-2">
              <Label>负责年级</Label>
              <Select 
                value={formData.grade.toString()} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, grade: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">全校</SelectItem>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g.toString()}>{g}年级</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 值日时间 */}
            <div className="grid gap-2">
              <Label>值日时间</Label>
              <Select 
                value={formData.weekDay.toString()} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, weekDay: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map(w => (
                    <SelectItem key={w.value} value={w.value.toString()}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmitDuty}>
              {editingDuty ? '保存修改' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
