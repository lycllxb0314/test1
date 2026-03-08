'use client';

/**
 * 德育处习惯养成管理页面 - 优化版
 * 
 * 功能：
 * - 目标库管理：管理八大类别习惯目标
 * - 规则配置：配置打卡周期、截止日期等规则
 * - 习惯之星：每月评选习惯之星
 * - 年级班级情况：查看各年级、各班级的习惯养成统计数据
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { HABIT_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, DIFFICULTY_LABELS } from '@/config/habit';
import {
  Target,
  Settings,
  Star,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  BookOpen,
  Trophy,
  Zap,
  Layers,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  School,
  Building2,
  Eye,
  ArrowRight,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 目标类型
interface HabitGoal {
  id: string;
  category: string;
  code: string | null;
  title: string;
  description: string | null;
  gradeRange: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 规则类型
interface HabitRule {
  id: string;
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  monthlyDeadline: number;
  checkFrequency: 'daily' | 'weekly';
  makeUpDays: number;
  passThreshold: number;
  starQuotaPerClass: number;
  isActive: boolean;
}

// 习惯之星类型
interface HabitStar {
  id: string;
  classId: string;
  studentId: string;
  month: string;
  academicYear: string;
  category: string;
  score: number | null;
  rank: number | null;
  nominationReason: string | null;
  photoUrl: string | null;
  createdAt: string;
}

// 班级统计类型
interface ClassStatistics {
  id: string;
  name: string;
  grade: number;
  gradeName: string;
  classNumber: number;
  headTeacherName: string | null;
  studentCount: number;
  status: string;
  habitStats: {
    goalsTotal: number;
    goalsApproved: number;
    goalsByCategory: Record<string, number>;
    recordsCompleted: number;
    recordsMissed: number;
    completionRate: number;
    starsCount: number;
    starsByCategory: Record<string, number>;
  };
}

// 年级统计类型
interface GradeStatistics {
  classCount: number;
  studentCount: number;
  goalsTotal: number;
  completionRate: number;
  starsCount: number;
}

// 难度配置
const DIFFICULTY_CONFIG = {
  easy: { label: '简单', color: 'text-green-600', bg: 'bg-green-50', icon: '🌱' },
  medium: { label: '中等', color: 'text-amber-600', bg: 'bg-amber-50', icon: '🌿' },
  hard: { label: '困难', color: 'text-red-600', bg: 'bg-red-50', icon: '🌳' },
};

// 年级名称
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// 年级颜色
const GRADE_COLORS: Record<number, string> = {
  1: 'from-rose-500 to-pink-600',
  2: 'from-orange-500 to-amber-600',
  3: 'from-yellow-500 to-amber-600',
  4: 'from-emerald-500 to-teal-600',
  5: 'from-cyan-500 to-blue-600',
  6: 'from-violet-500 to-purple-600',
};

export default function HabitManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // 目标库状态
  const [goals, setGoals] = useState<HabitGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<HabitGoal | null>(null);
  const [goalForm, setGoalForm] = useState({
    category: '文明习惯',
    code: '',
    title: '',
    description: '',
    gradeRange: '1-6',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 规则配置状态
  const [rules, setRules] = useState<HabitRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    academicYear: '2024-2025',
    semester: '1',
    startDate: '',
    endDate: '',
    monthlyDeadline: 25,
    checkFrequency: 'daily' as 'daily' | 'weekly',
    makeUpDays: 3,
    passThreshold: 80,
    starQuotaPerClass: 5,
  });
  
  // 习惯之星状态
  const [stars, setStars] = useState<HabitStar[]>([]);
  const [starsLoading, setStarsLoading] = useState(true);
  const [starMonth, setStarMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // 班级统计状态
  const [classStats, setClassStats] = useState<ClassStatistics[]>([]);
  const [classStatsLoading, setClassStatsLoading] = useState(true);
  const [classStatsMonth, setClassStatsMonth] = useState(new Date().toISOString().slice(0, 7));
  const [gradeFilter, setGradeFilter] = useState('all');
  const [expandedGrade, setExpandedGrade] = useState<number | null>(null);
  
  // 加载目标库
  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      const res = await fetch(`/api/habit/goals?${params}`);
      const data = await res.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('获取目标列表失败:', error);
    } finally {
      setGoalsLoading(false);
    }
  };
  
  // 加载规则配置
  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch('/api/habit/rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (error) {
      console.error('获取规则配置失败:', error);
    } finally {
      setRulesLoading(false);
    }
  };
  
  // 加载习惯之星
  const fetchStars = async () => {
    setStarsLoading(true);
    try {
      const res = await fetch(`/api/habit/stars?month=${starMonth}`);
      const data = await res.json();
      if (data.success) {
        setStars(data.data);
      }
    } catch (error) {
      console.error('获取习惯之星失败:', error);
    } finally {
      setStarsLoading(false);
    }
  };
  
  // 加载班级统计
  const fetchClassStats = async () => {
    setClassStatsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('month', classStatsMonth);
      if (gradeFilter !== 'all') {
        params.set('grade', gradeFilter);
      }
      const res = await fetch(`/api/habit/class-statistics?${params}`);
      const data = await res.json();
      if (data.success) {
        setClassStats(data.data);
      }
    } catch (error) {
      console.error('获取班级统计失败:', error);
    } finally {
      setClassStatsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGoals();
  }, [categoryFilter]);
  
  useEffect(() => {
    fetchRules();
  }, []);
  
  useEffect(() => {
    fetchStars();
  }, [starMonth]);
  
  useEffect(() => {
    fetchClassStats();
  }, [classStatsMonth, gradeFilter]);
  
  // 创建/更新目标
  const handleSaveGoal = async () => {
    if (!goalForm.title) {
      alert('请输入目标标题');
      return;
    }
    
    try {
      const url = editingGoal 
        ? `/api/habit/goals/${editingGoal.id}`
        : '/api/habit/goals';
      
      const res = await fetch(url, {
        method: editingGoal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalForm),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchGoals();
        setGoalDialogOpen(false);
        setEditingGoal(null);
        setGoalForm({
          category: '文明习惯',
          code: '',
          title: '',
          description: '',
          gradeRange: '1-6',
          difficulty: 'medium',
        });
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存目标失败:', error);
      alert('保存失败');
    }
  };
  
  // 删除目标
  const handleDeleteGoal = async (id: string) => {
    if (!confirm('确定要删除此目标吗？')) return;
    
    try {
      const res = await fetch(`/api/habit/goals/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        fetchGoals();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除目标失败:', error);
      alert('删除失败');
    }
  };
  
  // 切换目标状态
  const handleToggleGoal = async (goal: HabitGoal) => {
    try {
      const res = await fetch(`/api/habit/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !goal.isActive }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchGoals();
      }
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  };
  
  // 保存规则配置
  const handleSaveRule = async () => {
    try {
      const res = await fetch('/api/habit/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRules();
        setRuleDialogOpen(false);
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存规则失败:', error);
      alert('保存失败');
    }
  };
  
  // 打开编辑目标对话框
  const handleEditGoal = (goal: HabitGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      category: goal.category,
      code: goal.code || '',
      title: goal.title,
      description: goal.description || '',
      gradeRange: goal.gradeRange,
      difficulty: goal.difficulty,
    });
    setGoalDialogOpen(true);
  };
  
  // 统计数据
  const statistics = useMemo(() => {
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.isActive).length;
    const categoryCount = new Set(goals.map(g => g.category)).size;
    const totalStars = stars.length;
    
    // 按类别分组
    const byCategory: Record<string, number> = {};
    goals.forEach(g => {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
    });
    
    return { totalGoals, activeGoals, categoryCount, totalStars, byCategory };
  }, [goals, stars]);
  
  // 筛选后的目标
  const filteredGoals = useMemo(() => {
    if (!searchKeyword) return goals;
    const keyword = searchKeyword.toLowerCase();
    return goals.filter(g => 
      g.title.toLowerCase().includes(keyword) ||
      g.category.toLowerCase().includes(keyword) ||
      (g.code && g.code.toLowerCase().includes(keyword))
    );
  }, [goals, searchKeyword]);
  
  // 按年级分组的班级数据
  const classByGrade = useMemo(() => {
    const grouped: Record<number, ClassStatistics[]> = {};
    classStats.forEach(c => {
      if (!grouped[c.grade]) {
        grouped[c.grade] = [];
      }
      grouped[c.grade].push(c);
    });
    return grouped;
  }, [classStats]);
  
  // 年级汇总统计
  const gradeSummaries = useMemo(() => {
    const summaries: Record<number, { classCount: number; studentCount: number; avgRate: number; totalStars: number }> = {};
    
    Object.keys(classByGrade).forEach(grade => {
      const gradeNum = parseInt(grade);
      const classes = classByGrade[gradeNum];
      const classCount = classes.length;
      const studentCount = classes.reduce((sum, c) => sum + c.studentCount, 0);
      const rates = classes.filter(c => c.habitStats.goalsTotal > 0).map(c => c.habitStats.completionRate);
      const avgRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
      const totalStars = classes.reduce((sum, c) => sum + c.habitStats.starsCount, 0);
      
      summaries[gradeNum] = { classCount, studentCount, avgRate, totalStars };
    });
    
    return summaries;
  }, [classByGrade]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 rounded-b-[3rem] -z-10" />
      
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                <Target className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                习惯养成管理
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              八大行为习惯 · 目标库管理 · 习惯之星评选 · 班级情况
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-emerald-200 text-emerald-700 bg-emerald-50/50">
              <Users className="h-3.5 w-3.5" />
              {user?.name}
            </Badge>
          </div>
        </div>
        
        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 p-1 rounded-xl">
            <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4" />
              年级班级情况
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Target className="h-4 w-4" />
              目标库管理
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Settings className="h-4 w-4" />
              规则配置
            </TabsTrigger>
            <TabsTrigger value="stars" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Star className="h-4 w-4" />
              习惯之星
            </TabsTrigger>
          </TabsList>
          
          {/* 年级班级情况 */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* 筛选栏 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <Label className="text-gray-600">月份</Label>
                    <Input
                      type="month"
                      value={classStatsMonth}
                      onChange={e => setClassStatsMonth(e.target.value)}
                      className="w-40 bg-white border-gray-200"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-gray-500" />
                    <Label className="text-gray-600">年级</Label>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger className="w-32 bg-white border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部年级</SelectItem>
                        {[1, 2, 3, 4, 5, 6].map(g => (
                          <SelectItem key={g} value={String(g)}>{GRADE_NAMES[g]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1" />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchClassStats()}
                    className="gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    刷新数据
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* 汇总统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs font-medium">参与班级</p>
                      <p className="text-3xl font-bold mt-0.5">{classStats.length}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/20">
                      <Building2 className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-xs font-medium">参与学生</p>
                      <p className="text-3xl font-bold mt-0.5">
                        {classStats.reduce((sum, c) => sum + c.studentCount, 0)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/20">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-xs font-medium">平均完成率</p>
                      <p className="text-3xl font-bold mt-0.5">
                        {Object.keys(gradeSummaries).length > 0 
                          ? Math.round(Object.values(gradeSummaries).reduce((sum, s) => sum + s.avgRate, 0) / Object.keys(gradeSummaries).length)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/20">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-purple-500/10 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs font-medium">习惯之星</p>
                      <p className="text-3xl font-bold mt-0.5">
                        {classStats.reduce((sum, c) => sum + c.habitStats.starsCount, 0)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/20">
                      <Star className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 年级列表 */}
            {classStatsLoading ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center text-gray-500">
                  <div className="animate-pulse space-y-3">
                    <div className="h-8 w-32 bg-gray-200 rounded mx-auto" />
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ) : classStats.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <School className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无班级数据</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.keys(classByGrade).sort((a, b) => parseInt(a) - parseInt(b)).map(grade => {
                  const gradeNum = parseInt(grade);
                  const classes = classByGrade[gradeNum];
                  const summary = gradeSummaries[gradeNum];
                  const isExpanded = expandedGrade === gradeNum;
                  const gradeColor = GRADE_COLORS[gradeNum] || 'from-gray-500 to-gray-600';
                  
                  return (
                    <Card key={grade} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                      {/* 年级头部 */}
                      <div 
                        className={cn(
                          'p-4 cursor-pointer transition-all hover:bg-gray-50/50',
                          isExpanded && 'bg-gray-50/30'
                        )}
                        onClick={() => setExpandedGrade(isExpanded ? null : gradeNum)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg',
                              `bg-gradient-to-br ${gradeColor}`
                            )}>
                              {gradeNum}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{GRADE_NAMES[gradeNum]}</h3>
                              <p className="text-sm text-gray-500">
                                {summary.classCount} 个班级 · {summary.studentCount} 名学生
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            {/* 完成率进度 */}
                            <div className="flex items-center gap-3 w-48">
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-500">平均完成率</span>
                                  <span className={cn(
                                    'font-bold',
                                    summary.avgRate >= 80 ? 'text-emerald-600' :
                                    summary.avgRate >= 60 ? 'text-amber-600' : 'text-red-600'
                                  )}>{summary.avgRate}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      summary.avgRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                      summary.avgRate >= 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                      'bg-gradient-to-r from-red-400 to-rose-500'
                                    )}
                                    style={{ width: `${summary.avgRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* 习惯之星数量 */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-amber-700">{summary.totalStars}</span>
                            </div>
                            
                            {/* 展开按钮 */}
                            <ChevronsRight className={cn(
                              'h-5 w-5 text-gray-400 transition-transform',
                              isExpanded && 'rotate-90'
                            )} />
                          </div>
                        </div>
                      </div>
                      
                      {/* 班级列表（展开时显示） */}
                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {classes.map(cls => (
                              <div 
                                key={cls.id}
                                className="group p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all bg-white"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                                      {cls.classNumber}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{cls.name}</p>
                                      <p className="text-xs text-gray-500">{cls.headTeacherName || '暂无班主任'}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {cls.studentCount}人
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  {/* 目标数和打卡率 */}
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">月度目标</span>
                                    <span className="font-medium">{cls.habitStats.goalsTotal} 个</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">打卡完成率</span>
                                    <span className={cn(
                                      'font-bold',
                                      cls.habitStats.completionRate >= 80 ? 'text-emerald-600' :
                                      cls.habitStats.completionRate >= 60 ? 'text-amber-600' : 'text-red-600'
                                    )}>
                                      {cls.habitStats.completionRate}%
                                    </span>
                                  </div>
                                  
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        cls.habitStats.completionRate >= 80 ? 'bg-emerald-500' :
                                        cls.habitStats.completionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                      )}
                                      style={{ width: `${cls.habitStats.completionRate}%` }}
                                    />
                                  </div>
                                  
                                  {/* 习惯之星 */}
                                  {cls.habitStats.starsCount > 0 && (
                                    <div className="flex items-center gap-1 pt-1">
                                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                      <span className="text-xs text-amber-600 font-medium">
                                        {cls.habitStats.starsCount} 位习惯之星
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* 目标库管理 */}
          <TabsContent value="goals" className="space-y-4 mt-4">
            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">目标总数</p>
                      <p className="text-3xl font-bold mt-1">{statistics.totalGoals}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Target className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">启用目标</p>
                      <p className="text-3xl font-bold mt-1">{statistics.activeGoals}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Check className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-purple-500/10 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">习惯类别</p>
                      <p className="text-3xl font-bold mt-1">{statistics.categoryCount}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Layers className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">启用率</p>
                      <p className="text-3xl font-bold mt-1">
                        {statistics.totalGoals > 0 
                          ? Math.round((statistics.activeGoals / statistics.totalGoals) * 100) 
                          : 0}%
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Zap className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 类别分布 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  目标类别分布（点击筛选）
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {HABIT_CATEGORIES.map(cat => {
                    const count = statistics.byCategory[cat.value] || 0;
                    const colors = CATEGORY_COLORS[cat.value] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                    return (
                      <div 
                        key={cat.value}
                        className={cn(
                          'relative p-3 rounded-xl text-center transition-all cursor-pointer',
                          'hover:scale-105 hover:shadow-md',
                          categoryFilter === cat.value 
                            ? `${colors.bg} ring-2 ring-offset-2 ring-emerald-400` 
                            : 'bg-gray-50 hover:bg-gray-100'
                        )}
                        onClick={() => setCategoryFilter(categoryFilter === cat.value ? 'all' : cat.value)}
                      >
                        <span className="text-2xl">{CATEGORY_ICONS[cat.value]}</span>
                        <p className={cn('text-xs font-medium mt-1', colors.text)}>{cat.label}</p>
                        <p className="text-lg font-bold text-gray-900">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索目标标题、编码..."
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="pl-9 bg-white/80 border-gray-200"
                />
              </div>
              <Button 
                onClick={() => {
                  setEditingGoal(null);
                  setGoalForm({
                    category: '文明习惯',
                    code: '',
                    title: '',
                    description: '',
                    gradeRange: '1-6',
                    difficulty: 'medium',
                  });
                  setGoalDialogOpen(true);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加目标
              </Button>
            </div>
            
            {/* 目标卡片网格 */}
            {goalsLoading ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center text-gray-500">
                  <div className="animate-pulse space-y-3">
                    <div className="h-8 w-32 bg-gray-200 rounded mx-auto" />
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredGoals.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无目标数据</p>
                  <p className="text-sm text-gray-400 mt-1">点击"添加目标"创建第一个习惯目标</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGoals.map(goal => {
                  const colors = CATEGORY_COLORS[goal.category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                  const difficultyConfig = DIFFICULTY_CONFIG[goal.difficulty];
                  const icon = CATEGORY_ICONS[goal.category];
                  
                  return (
                    <Card 
                      key={goal.id} 
                      className={cn(
                        'group relative overflow-hidden border-0 shadow-lg transition-all duration-300',
                        'hover:shadow-xl hover:-translate-y-1',
                        goal.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                      )}
                    >
                      <div className={cn('h-1.5', colors.bg.replace('bg-', 'bg-gradient-to-r from-').replace('-50', '-400 to-' + colors.bg.split('-')[1] + '-500'))} />
                      
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{icon}</span>
                            <Badge className={cn(colors.bg, colors.text, 'border-0 font-medium')}>
                              {goal.category}
                            </Badge>
                          </div>
                          <Switch
                            checked={goal.isActive}
                            onCheckedChange={() => handleToggleGoal(goal)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-1">
                          {goal.title}
                        </h4>
                        
                        {goal.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {goal.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {goal.code && (
                              <span className="font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                {goal.code}
                              </span>
                            )}
                            <span className="text-gray-500">{goal.gradeRange}年级</span>
                          </div>
                          <span className={cn('flex items-center gap-1', difficultyConfig.color)}>
                            <span>{difficultyConfig.icon}</span>
                            {difficultyConfig.label}
                          </span>
                        </div>
                        
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit className="h-3.5 w-3.5 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-red-50 shadow-sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* 规则配置 */}
          <TabsContent value="rules" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                配置习惯养成的打卡周期、截止日期、合格率等规则
              </p>
              <Button 
                onClick={() => setRuleDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
              >
                <Settings className="h-4 w-4 mr-2" />
                配置规则
              </Button>
            </div>
            
            {rulesLoading ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center text-gray-500">
                  加载中...
                </CardContent>
              </Card>
            ) : rules.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无规则配置</p>
                  <p className="text-sm text-gray-400 mt-1">点击"配置规则"创建习惯养成规则</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {rules.map(rule => (
                  <Card key={rule.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {rule.academicYear}学年 第{rule.semester}学期
                        </CardTitle>
                        {rule.isActive && (
                          <Badge className="bg-emerald-500 text-white">
                            生效中
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-blue-50">
                          <p className="text-xs text-blue-600 font-medium">打卡周期</p>
                          <p className="text-lg font-bold text-blue-700">
                            {rule.checkFrequency === 'daily' ? '每日' : '每周'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-50">
                          <p className="text-xs text-amber-600 font-medium">月度截止</p>
                          <p className="text-lg font-bold text-amber-700">
                            每月{rule.monthlyDeadline}日
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50">
                          <p className="text-xs text-purple-600 font-medium">补卡天数</p>
                          <p className="text-lg font-bold text-purple-700">
                            {rule.makeUpDays}天
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-50">
                          <p className="text-xs text-emerald-600 font-medium">合格率</p>
                          <p className="text-lg font-bold text-emerald-700">
                            {rule.passThreshold}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          <span className="text-sm text-amber-700">
                            每班习惯之星名额：<strong>{rule.starQuotaPerClass}</strong> 人
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* 习惯之星 */}
          <TabsContent value="stars" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-gray-600">选择月份</Label>
                <Input
                  type="month"
                  value={starMonth}
                  onChange={e => setStarMonth(e.target.value)}
                  className="w-44 bg-white/80 border-gray-200"
                />
              </div>
            </div>
            
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  {starMonth} 习惯之星
                </CardTitle>
                <CardDescription>
                  共评选出 <strong className="text-amber-600">{stars.length}</strong> 位习惯之星
                </CardDescription>
              </CardHeader>
              <CardContent>
                {starsLoading ? (
                  <p className="text-gray-500 text-center py-8">加载中...</p>
                ) : stars.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-amber-400" />
                    </div>
                    <p className="text-gray-500">本月暂无习惯之星数据</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stars.map(star => {
                      const colors = CATEGORY_COLORS[star.category] || { bg: 'bg-gray-50', text: 'text-gray-700' };
                      const icon = CATEGORY_ICONS[star.category];
                      
                      return (
                        <div 
                          key={star.id} 
                          className="group relative p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <Star className="h-5 w-5 text-white fill-white" />
                          </div>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">
                              {icon}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">学生ID: {star.studentId.slice(0, 8)}...</p>
                              <p className="text-xs text-gray-500">班级: {star.classId.slice(0, 8)}...</p>
                            </div>
                          </div>
                          
                          <Badge className={cn(colors.bg, colors.text, 'border-0')}>
                            {star.category}
                          </Badge>
                          
                          {star.score && (
                            <div className="mt-3 flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span className="text-sm font-medium text-amber-700">{star.score}分</span>
                            </div>
                          )}
                          
                          {star.nominationReason && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {star.nominationReason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* 目标编辑对话框 */}
        <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
          <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingGoal ? '编辑目标' : '添加目标'}</DialogTitle>
              <DialogDescription>
                填写习惯养成目标信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>类别 *</Label>
                <Select value={goalForm.category} onValueChange={v => setGoalForm({ ...goalForm, category: v })}>
                  <SelectTrigger className="bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <span>{CATEGORY_ICONS[cat.value]}</span>
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>编码</Label>
                <Input
                  placeholder="如：WM-001"
                  value={goalForm.code}
                  onChange={e => setGoalForm({ ...goalForm, code: e.target.value })}
                  className="bg-white/80"
                />
              </div>
              <div className="space-y-2">
                <Label>目标标题 *</Label>
                <Input
                  placeholder="输入目标标题"
                  value={goalForm.title}
                  onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="bg-white/80"
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  placeholder="输入目标描述"
                  value={goalForm.description}
                  onChange={e => setGoalForm({ ...goalForm, description: e.target.value })}
                  className="bg-white/80"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>适用年级</Label>
                  <Select value={goalForm.gradeRange} onValueChange={v => setGoalForm({ ...goalForm, gradeRange: v })}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2年级</SelectItem>
                      <SelectItem value="3-4">3-4年级</SelectItem>
                      <SelectItem value="5-6">5-6年级</SelectItem>
                      <SelectItem value="1-6">1-6年级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>难度</Label>
                  <Select value={goalForm.difficulty} onValueChange={v => setGoalForm({ ...goalForm, difficulty: v as 'easy' | 'medium' | 'hard' })}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🌱 简单</SelectItem>
                      <SelectItem value="medium">🌿 中等</SelectItem>
                      <SelectItem value="hard">🌳 困难</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>取消</Button>
              <Button 
                onClick={handleSaveGoal}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 规则配置对话框 */}
        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">配置习惯养成规则</DialogTitle>
              <DialogDescription>
                设置打卡周期、截止日期、合格率等规则
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>学年</Label>
                  <Select value={ruleForm.academicYear} onValueChange={v => setRuleForm({ ...ruleForm, academicYear: v })}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>学期</Label>
                  <Select value={ruleForm.semester} onValueChange={v => setRuleForm({ ...ruleForm, semester: v })}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">第一学期</SelectItem>
                      <SelectItem value="2">第二学期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={ruleForm.startDate}
                    onChange={e => setRuleForm({ ...ruleForm, startDate: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={ruleForm.endDate}
                    onChange={e => setRuleForm({ ...ruleForm, endDate: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>打卡周期</Label>
                  <Select value={ruleForm.checkFrequency} onValueChange={v => setRuleForm({ ...ruleForm, checkFrequency: v as 'daily' | 'weekly' })}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每日打卡</SelectItem>
                      <SelectItem value="weekly">每周打卡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>月度截止日</Label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={ruleForm.monthlyDeadline}
                    onChange={e => setRuleForm({ ...ruleForm, monthlyDeadline: parseInt(e.target.value) })}
                    className="bg-white/80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>补卡天数</Label>
                  <Input
                    type="number"
                    min={0}
                    max={7}
                    value={ruleForm.makeUpDays}
                    onChange={e => setRuleForm({ ...ruleForm, makeUpDays: parseInt(e.target.value) })}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>合格率(%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={ruleForm.passThreshold}
                    onChange={e => setRuleForm({ ...ruleForm, passThreshold: parseInt(e.target.value) })}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>班级名额</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={ruleForm.starQuotaPerClass}
                    onChange={e => setRuleForm({ ...ruleForm, starQuotaPerClass: parseInt(e.target.value) })}
                    className="bg-white/80"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>取消</Button>
              <Button 
                onClick={handleSaveRule}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                保存配置
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
