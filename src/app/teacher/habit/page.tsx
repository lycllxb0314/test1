'use client';

/**
 * 班主任习惯养成管理页面 - 优化版
 * 
 * 功能：
 * - 为班级学生制定月度习惯目标
 * - 查看学生打卡记录和统计
 * - 审核补打卡申请
 * - 班级习惯之星推荐
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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { HABIT_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, STATUS_LABELS, APPROVAL_STATUS_LABELS } from '@/config/habit';
import {
  Target,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Star,
  Plus,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Trophy,
  Zap,
  Activity,
  BarChart3,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 学生类型
interface Student {
  id: string;
  name: string;
  studentNumber: string;
  classId?: string;
  avatar?: string;
}

// API 返回的学生类型
interface StudentFromApi {
  id: string;
  name: string;
  studentNo?: string;
  studentNumber?: string;
  classId?: string;
  avatar?: string;
}

// 月度目标类型
interface MonthlyGoal {
  id: string;
  classId: string;
  studentId: string;
  studentName?: string;
  month: string;
  academicYear: string;
  goalId: string;
  customTitle?: string;
  customDescription?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalComment?: string;
  goal?: {
    id: string;
    category: string;
    code: string;
    title: string;
    description: string;
    difficulty: string;
  };
}

// 打卡记录类型
interface HabitRecord {
  id: string;
  monthlyGoalId: string;
  studentId: string;
  studentName?: string;
  checkDate: string;
  month: string;
  status: 'completed' | 'pending' | 'missed' | 'make_up';
  photoUrl?: string;
  description?: string;
  parentComment?: string;
  teacherComment?: string;
  makeUpDate?: string;
}

// 获取当月天数
const getDaysInMonth = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon, 0).getDate();
};

// 获取当前日期
const getCurrentDay = () => {
  return new Date().getDate();
};

// 获取今天是本月的第几天
const getTodayInMonth = (month: string) => {
  const today = new Date().toISOString().slice(0, 7);
  if (today === month) {
    return new Date().getDate();
  }
  return getDaysInMonth(month);
};

export default function TeacherHabitPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // 学生列表
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  
  // 目标库
  const [goals, setGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  
  // 月度目标
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [monthlyGoalsLoading, setMonthlyGoalsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // 打卡记录
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  
  // 对话框状态
  const [addGoalDialogOpen, setAddGoalDialogOpen] = useState(false);
  const [viewRecordsDialogOpen, setViewRecordsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HabitRecord | null>(null);
  const [teacherComment, setTeacherComment] = useState('');
  
  // 表单状态
  const [selectedCategory, setSelectedCategory] = useState('文明习惯');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  
  // 加载学生列表
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/students?teacherId=${user?.id}&pageSize=100`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.map((s: StudentFromApi) => ({
          id: s.id,
          name: s.name,
          studentNumber: s.studentNo || s.studentNumber || '',
          classId: s.classId,
          avatar: s.avatar,
        })));
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    } finally {
      setStudentsLoading(false);
    }
  };
  
  // 加载目标库
  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const res = await fetch('/api/habit/goals?isActive=true');
      const data = await res.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('获取目标库失败:', error);
    } finally {
      setGoalsLoading(false);
    }
  };
  
  // 加载月度目标
  const fetchMonthlyGoals = async () => {
    setMonthlyGoalsLoading(true);
    try {
      const res = await fetch(`/api/habit/monthly-goals?month=${currentMonth}`);
      const data = await res.json();
      if (data.success) {
        setMonthlyGoals(data.data);
      }
    } catch (error) {
      console.error('获取月度目标失败:', error);
    } finally {
      setMonthlyGoalsLoading(false);
    }
  };
  
  // 加载打卡记录
  const fetchRecords = async (studentId?: string) => {
    setRecordsLoading(true);
    try {
      const params = new URLSearchParams({ month: currentMonth });
      if (studentId) {
        params.set('studentId', studentId);
      }
      const res = await fetch(`/api/habit/records?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('获取打卡记录失败:', error);
    } finally {
      setRecordsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.id) {
      fetchStudents();
      fetchGoals();
    }
  }, [user?.id]);
  
  useEffect(() => {
    fetchMonthlyGoals();
    fetchRecords();
  }, [currentMonth]);
  
  // 根据类别筛选目标
  const filteredGoals = useMemo(() => {
    return goals.filter(g => g.category === selectedCategory);
  }, [goals, selectedCategory]);
  
  // 统计数据
  const statistics = useMemo(() => {
    const total = monthlyGoals.length;
    const approved = monthlyGoals.filter(g => g.approvalStatus === 'approved').length;
    const completed = monthlyGoals.filter(g => g.status === 'completed').length;
    const active = monthlyGoals.filter(g => g.status === 'active').length;
    
    // 计算班级整体打卡率
    const completedRecords = records.filter(r => r.status === 'completed').length;
    const totalDays = getTodayInMonth(currentMonth);
    const expectedRecords = total * totalDays;
    const completionRate = expectedRecords > 0 ? Math.round((completedRecords / expectedRecords) * 100) : 0;
    
    return { total, approved, completed, active, completionRate };
  }, [monthlyGoals, records, currentMonth]);
  
  // 学生打卡进度
  const studentProgress = useMemo(() => {
    const progressMap: Record<string, { completed: number; total: number; rate: number }> = {};
    
    students.forEach(student => {
      const studentRecords = records.filter(r => r.studentId === student.id);
      const completed = studentRecords.filter(r => r.status === 'completed').length;
      const total = studentRecords.length || 1;
      progressMap[student.id] = {
        completed,
        total,
        rate: Math.round((completed / total) * 100),
      };
    });
    
    return progressMap;
  }, [students, records]);
  
  // 创建月度目标
  const handleCreateMonthlyGoals = async () => {
    if (!selectedGoalId || selectedStudentIds.length === 0) {
      alert('请选择目标和学生');
      return;
    }
    
    try {
      const academicYear = currentMonth.slice(0, 4) + '-' + (parseInt(currentMonth.slice(0, 4)) + 1);
      
      // 获取选中学生的班级ID（所有学生应该在同一个班级）
      const firstStudent = students.find(s => s.id === selectedStudentIds[0]);
      const classId = firstStudent?.classId || user?.classId || '';
      
      const goalsData = selectedStudentIds.map(studentId => ({
        classId,
        studentId,
        month: currentMonth,
        academicYear,
        goalId: selectedGoalId,
        customTitle: customTitle || undefined,
        customDescription: customDescription || undefined,
      }));
      
      const res = await fetch('/api/habit/monthly-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: goalsData }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchMonthlyGoals();
        setAddGoalDialogOpen(false);
        setSelectedStudentIds([]);
        setCustomTitle('');
        setCustomDescription('');
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建月度目标失败:', error);
      alert('创建失败');
    }
  };
  
  // 查看学生打卡记录
  const handleViewRecords = (student: Student) => {
    setSelectedStudent(student);
    fetchRecords(student.id);
    setViewRecordsDialogOpen(true);
  };
  
  // 添加班主任评语
  const handleAddComment = async () => {
    if (!selectedRecord || !teacherComment.trim()) return;
    
    try {
      const res = await fetch(`/api/habit/records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherComment }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRecords(selectedStudent?.id);
        setCommentDialogOpen(false);
        setSelectedRecord(null);
        setTeacherComment('');
      }
    } catch (error) {
      console.error('添加评语失败:', error);
    }
  };
  
  // 打开评语对话框
  const openCommentDialog = (record: HabitRecord) => {
    setSelectedRecord(record);
    setTeacherComment(record.teacherComment || '');
    setCommentDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-purple-50/50">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 rounded-b-[3rem] -z-10" />
      
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30">
                <Target className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-transparent">
                习惯养成管理
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              制定班级月度习惯目标 · 查看打卡进度 · 审核补打卡
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="month"
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              className="w-40 bg-white/80 border-gray-200"
            />
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">本月目标</p>
                  <p className="text-2xl font-bold mt-0.5">{statistics.total}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/20">
                  <Target className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium">已通过</p>
                  <p className="text-2xl font-bold mt-0.5">{statistics.approved}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/20">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs font-medium">进行中</p>
                  <p className="text-2xl font-bold mt-0.5">{statistics.active}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/20">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-purple-500/10 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">已完成</p>
                  <p className="text-2xl font-bold mt-0.5">{statistics.completed}</p>
                </div>
                <div className="p-2 rounded-xl bg-white/20">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-pink-500/10 bg-gradient-to-br from-pink-500 to-rose-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-xs font-medium">打卡率</p>
                  <p className="text-2xl font-bold mt-0.5">{statistics.completionRate}%</p>
                </div>
                <div className="p-2 rounded-xl bg-white/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 p-1 rounded-xl">
            <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Activity className="h-4 w-4" />
              数据概览
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Target className="h-4 w-4" />
              目标制定
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4" />
              打卡进度
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Calendar className="h-4 w-4" />
              打卡记录
            </TabsTrigger>
          </TabsList>
          
          {/* 数据概览 */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 班级打卡概览 */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-500" />
                    班级打卡概览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-6">
                    {/* 环形进度 */}
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="#f3f4f6"
                          strokeWidth="16"
                          fill="none"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="url(#gradient)"
                          strokeWidth="16"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${statistics.completionRate * 5.03} 503`}
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                          {statistics.completionRate}%
                        </span>
                        <span className="text-sm text-gray-500">班级打卡率</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-600">{students.length}</p>
                      <p className="text-xs text-gray-500">参与学生</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{records.filter(r => r.status === 'completed').length}</p>
                      <p className="text-xs text-gray-500">完成打卡</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{records.filter(r => r.status === 'missed').length}</p>
                      <p className="text-xs text-gray-500">缺卡次数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 类别分布 */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-500" />
                    目标类别分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {HABIT_CATEGORIES.map(cat => {
                      const count = monthlyGoals.filter(g => g.goal?.category === cat.value).length;
                      const percentage = statistics.total > 0 ? Math.round((count / statistics.total) * 100) : 0;
                      const colors = CATEGORY_COLORS[cat.value] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                      
                      return (
                        <div key={cat.value} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{CATEGORY_ICONS[cat.value]}</span>
                              <span className="font-medium text-gray-700">{cat.label}</span>
                            </div>
                            <span className="text-gray-500">{count} 个目标 ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={cn('h-full rounded-full transition-all duration-500', colors.bg.replace('-50', '-400'))}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 快捷操作 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  快捷操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <button
                    onClick={() => setAddGoalDialogOpen(true)}
                    className="group p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 hover:border-violet-200 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-violet-100 group-hover:bg-violet-200 transition-colors">
                        <Plus className="h-5 w-5 text-violet-600" />
                      </div>
                      <span className="font-semibold text-gray-900">添加月度目标</span>
                    </div>
                    <p className="text-sm text-gray-500">为学生制定本月习惯养成目标</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('progress')}
                    className="group p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:border-emerald-200 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="font-semibold text-gray-900">查看打卡进度</span>
                    </div>
                    <p className="text-sm text-gray-500">查看每位学生的打卡完成情况</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('records')}
                    className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 hover:border-amber-200 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                        <MessageSquare className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="font-semibold text-gray-900">添加班主任评语</span>
                    </div>
                    <p className="text-sm text-gray-500">为学生打卡记录添加评语和鼓励</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 目标制定 */}
          <TabsContent value="goals" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                为班级学生制定月度习惯目标
              </p>
              <Button 
                onClick={() => setAddGoalDialogOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加月度目标
              </Button>
            </div>
            
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-purple-500" />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left p-4 font-medium text-gray-600">学生</th>
                        <th className="text-left p-4 font-medium text-gray-600">习惯类别</th>
                        <th className="text-left p-4 font-medium text-gray-600">目标标题</th>
                        <th className="text-left p-4 font-medium text-gray-600">状态</th>
                        <th className="text-left p-4 font-medium text-gray-600">审核</th>
                        <th className="text-right p-4 font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyGoalsLoading ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-500">
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
                              <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
                            </div>
                          </td>
                        </tr>
                      ) : monthlyGoals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
                              <Target className="h-8 w-8 text-violet-400" />
                            </div>
                            <p className="text-gray-500">本月暂无目标</p>
                            <p className="text-sm text-gray-400 mt-1">点击"添加月度目标"为学生制定习惯目标</p>
                          </td>
                        </tr>
                      ) : (
                        monthlyGoals.map(goal => {
                          const colors = goal.goal ? CATEGORY_COLORS[goal.goal.category] : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                          const icon = goal.goal ? CATEGORY_ICONS[goal.goal.category] : '📋';
                          
                          return (
                            <tr key={goal.id} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 font-medium">
                                      {goal.studentName?.charAt(0)?.toUpperCase() || 'S'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900">{goal.studentName || '未知学生'}</p>
                                    <p className="text-xs text-gray-500">ID: {goal.studentId.slice(0, 12)}...</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge className={cn(colors.bg, colors.text, 'border-0')}>
                                  <span className="mr-1">{icon}</span>
                                  {goal.goal?.category || '-'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <p className="font-medium text-gray-900">{goal.customTitle || goal.goal?.title || '-'}</p>
                                {goal.customDescription && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{goal.customDescription}</p>
                                )}
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className={cn(
                                  goal.status === 'completed' && 'border-emerald-200 text-emerald-700 bg-emerald-50',
                                  goal.status === 'active' && 'border-blue-200 text-blue-700 bg-blue-50',
                                  goal.status === 'pending' && 'border-gray-200 text-gray-700 bg-gray-50',
                                  goal.status === 'failed' && 'border-red-200 text-red-700 bg-red-50',
                                )}>
                                  {STATUS_LABELS[goal.status]}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge className={cn(
                                  goal.approvalStatus === 'approved' && 'bg-emerald-500 text-white',
                                  goal.approvalStatus === 'rejected' && 'bg-red-500 text-white',
                                  goal.approvalStatus === 'pending' && 'bg-gray-100 text-gray-600',
                                )}>
                                  {APPROVAL_STATUS_LABELS[goal.approvalStatus]}
                                </Badge>
                              </td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="sm" className="hover:bg-violet-50 hover:text-violet-600">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 打卡进度 */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  班级学生打卡进度
                </CardTitle>
                <CardDescription>
                  查看每位学生的习惯养成打卡完成情况
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    加载中...
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">暂无学生数据</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {students.map(student => {
                      const progress = studentProgress[student.id] || { completed: 0, total: 1, rate: 0 };
                      
                      return (
                        <div 
                          key={student.id} 
                          className="group p-4 rounded-xl border border-gray-100 bg-white hover:shadow-lg hover:border-violet-200 transition-all cursor-pointer"
                          onClick={() => handleViewRecords(student)}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm group-hover:shadow-md transition-shadow">
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 font-medium">
                                {student.name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.studentNumber}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">打卡进度</span>
                              <span className={cn(
                                'font-bold',
                                progress.rate >= 80 ? 'text-emerald-600' :
                                progress.rate >= 60 ? 'text-amber-600' : 'text-red-600'
                              )}>
                                {progress.rate}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  progress.rate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                  progress.rate >= 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                  'bg-gradient-to-r from-red-400 to-rose-500'
                                )}
                                style={{ width: `${progress.rate}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>已完成 {progress.completed} 次</span>
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 打卡记录 */}
          <TabsContent value="records" className="space-y-4 mt-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  打卡记录列表
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="text-left p-4 font-medium text-gray-600">学生</th>
                        <th className="text-left p-4 font-medium text-gray-600">日期</th>
                        <th className="text-left p-4 font-medium text-gray-600">状态</th>
                        <th className="text-left p-4 font-medium text-gray-600">家长留言</th>
                        <th className="text-left p-4 font-medium text-gray-600">班主任评语</th>
                        <th className="text-right p-4 font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsLoading ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-500">加载中...</td>
                        </tr>
                      ) : records.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                              <Calendar className="h-8 w-8 text-amber-400" />
                            </div>
                            <p className="text-gray-500">暂无打卡记录</p>
                          </td>
                        </tr>
                      ) : (
                        records.slice(0, 30).map(record => (
                          <tr key={record.id} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <span className="font-medium">{record.studentName || '未知学生'}</span>
                            </td>
                            <td className="p-4 text-gray-600">{record.checkDate}</td>
                            <td className="p-4">
                              <Badge className={cn(
                                record.status === 'completed' && 'bg-emerald-500 text-white',
                                record.status === 'missed' && 'bg-red-100 text-red-700',
                                record.status === 'make_up' && 'bg-amber-100 text-amber-700',
                                record.status === 'pending' && 'bg-gray-100 text-gray-600',
                              )}>
                                {record.status === 'completed' ? '已完成' : 
                                 record.status === 'missed' ? '缺卡' :
                                 record.status === 'make_up' ? '补卡' : '待打卡'}
                              </Badge>
                            </td>
                            <td className="p-4 max-w-[200px]">
                              <p className="text-sm text-gray-600 truncate">{record.parentComment || '-'}</p>
                            </td>
                            <td className="p-4 max-w-[200px]">
                              <p className="text-sm text-gray-600 truncate">{record.teacherComment || '-'}</p>
                            </td>
                            <td className="p-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-violet-50 hover:text-violet-600"
                                onClick={() => openCommentDialog(record)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* 添加月度目标对话框 */}
        <Dialog open={addGoalDialogOpen} onOpenChange={setAddGoalDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">添加月度习惯目标</DialogTitle>
              <DialogDescription>
                为学生制定本月习惯养成目标
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* 选择类别 */}
              <div className="space-y-2">
                <Label className="text-gray-700">习惯类别</Label>
                <div className="grid grid-cols-4 gap-2">
                  {HABIT_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      className={cn(
                        'p-3 rounded-xl border text-center transition-all',
                        selectedCategory === cat.value 
                          ? 'border-violet-300 bg-violet-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setSelectedGoalId('');
                      }}
                    >
                      <span className="text-xl">{CATEGORY_ICONS[cat.value]}</span>
                      <p className="text-xs font-medium text-gray-700 mt-1">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 选择目标 */}
              <div className="space-y-2">
                <Label className="text-gray-700">选择目标</Label>
                {goalsLoading ? (
                  <p className="text-gray-500 text-sm">加载中...</p>
                ) : filteredGoals.length === 0 ? (
                  <p className="text-gray-500 text-sm">该类别暂无目标</p>
                ) : (
                  <div className="grid gap-2 max-h-40 overflow-y-auto pr-2">
                    {filteredGoals.map(goal => (
                      <div
                        key={goal.id}
                        className={cn(
                          'p-3 rounded-xl border cursor-pointer transition-all',
                          selectedGoalId === goal.id 
                            ? 'border-violet-300 bg-violet-50 shadow-sm' 
                            : 'border-gray-200 hover:border-violet-200'
                        )}
                        onClick={() => setSelectedGoalId(goal.id)}
                      >
                        <p className="font-medium text-gray-900">{goal.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 自定义标题和描述 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">自定义标题（可选）</Label>
                  <Input
                    placeholder="覆盖默认标题"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">自定义描述（可选）</Label>
                  <Input
                    placeholder="覆盖默认描述"
                    value={customDescription}
                    onChange={e => setCustomDescription(e.target.value)}
                    className="bg-white/80"
                  />
                </div>
              </div>
              
              {/* 选择学生 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700">选择学生</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                    onClick={() => {
                      if (selectedStudentIds.length === students.length) {
                        setSelectedStudentIds([]);
                      } else {
                        setSelectedStudentIds(students.map(s => s.id));
                      }
                    }}
                  >
                    {selectedStudentIds.length === students.length ? '取消全选' : '全选'}
                  </Button>
                </div>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-xl p-3 bg-gray-50/50">
                  {studentsLoading ? (
                    <p className="text-gray-500 text-sm">加载中...</p>
                  ) : (
                    students.map(student => (
                      <label 
                        key={student.id} 
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                          selectedStudentIds.includes(student.id) ? 'bg-violet-50' : 'hover:bg-gray-100'
                        )}
                      >
                        <Checkbox
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setSelectedStudentIds([...selectedStudentIds, student.id]);
                            } else {
                              setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-violet-100 text-violet-600">
                            {student.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-700">{student.name}</span>
                        <span className="text-xs text-gray-400">{student.studentNumber}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  已选择 <strong className="text-violet-600">{selectedStudentIds.length}</strong> 名学生
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddGoalDialogOpen(false)}>取消</Button>
              <Button 
                onClick={handleCreateMonthlyGoals}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
              >
                确定添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 查看学生打卡记录对话框 */}
        <Dialog open={viewRecordsDialogOpen} onOpenChange={setViewRecordsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-100 text-violet-600">
                    {selectedStudent?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {selectedStudent?.name} 的打卡记录
              </DialogTitle>
              <DialogDescription>
                查看学生的习惯养成打卡详情
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {recordsLoading ? (
                <p className="text-gray-500 text-center py-8">加载中...</p>
              ) : (
                <div className="space-y-3">
                  {records
                    .filter(r => r.studentId === selectedStudent?.id)
                    .slice(0, 20)
                    .map(record => {
                      const colors = CATEGORY_COLORS[record.monthlyGoalId] || { bg: 'bg-gray-50' };
                      
                      return (
                        <div 
                          key={record.id} 
                          className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{record.checkDate}</span>
                            <Badge className={cn(
                              record.status === 'completed' && 'bg-emerald-500 text-white',
                              record.status === 'missed' && 'bg-red-100 text-red-700',
                              record.status === 'make_up' && 'bg-amber-100 text-amber-700',
                            )}>
                              {record.status === 'completed' ? '已完成' : 
                               record.status === 'missed' ? '缺卡' : '补卡'}
                            </Badge>
                          </div>
                          {record.description && (
                            <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                          )}
                          {record.parentComment && (
                            <div className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-2">
                              <span className="font-medium">家长留言：</span>{record.parentComment}
                            </div>
                          )}
                          {record.teacherComment && (
                            <div className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                              <span className="font-medium">班主任评语：</span>{record.teacherComment}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewRecordsDialogOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 添加评语对话框 */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">添加班主任评语</DialogTitle>
              <DialogDescription>
                为这条打卡记录添加评语和鼓励
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="写下您的评语和鼓励..."
                value={teacherComment}
                onChange={e => setTeacherComment(e.target.value)}
                rows={4}
                className="bg-white/80"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>取消</Button>
              <Button 
                onClick={handleAddComment}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                发送评语
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
