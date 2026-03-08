'use client';

/**
 * 家长端习惯打卡页面 - 优化版
 * 
 * 功能：
 * - 查看子女月度习惯目标
 * - 每日打卡
 * - 上传打卡照片
 * - 查看打卡记录和统计
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/config/habit';
import {
  Target,
  Camera,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Upload,
  Sparkles,
  Trophy,
  Flame,
  X,
  Image as ImageIcon,
  Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 子女类型
interface Child {
  id: string;
  name: string;
  studentNumber: string;
  className?: string;
  avatar?: string;
}

// 月度目标类型
interface MonthlyGoal {
  id: string;
  classId: string;
  studentId: string;
  month: string;
  academicYear: string;
  goalId: string;
  customTitle?: string;
  customDescription?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  approvalStatus: 'pending' | 'approved' | 'rejected';
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
  checkDate: string;
  month: string;
  status: 'completed' | 'pending' | 'missed' | 'make_up';
  photoUrl?: string;
  description?: string;
  parentComment?: string;
  teacherComment?: string;
}

// 获取当月日期列表
const getMonthDays = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    days.push(date);
  }
  return days;
};

// 获取今天日期
const getToday = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

// 获取星期几
const getWeekDay = (dateStr: string) => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[new Date(dateStr).getDay()];
};

// 获取连续打卡天数
const getStreakDays = (records: HabitRecord[], goalId: string) => {
  const goalRecords = records
    .filter(r => r.monthlyGoalId === goalId && r.status === 'completed')
    .sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime());
  
  if (goalRecords.length === 0) return 0;
  
  let streak = 0;
  const today = new Date(getToday());
  
  for (let i = 0; i < goalRecords.length; i++) {
    const checkDate = new Date(goalRecords[i].checkDate);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (checkDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

export default function ParentHabitPage() {
  const { user } = useAuth();
  
  // 子女列表
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  
  // 月度目标
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  
  // 打卡记录
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  
  // 当前月份
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // 打卡对话框
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<MonthlyGoal | null>(null);
  const [checkInDate, setCheckInDate] = useState(getToday());
  const [checkInDescription, setCheckInDescription] = useState('');
  const [checkInPhoto, setCheckInPhoto] = useState('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  
  // 打卡成功动画
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 记录详情对话框
  const [recordDetailOpen, setRecordDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HabitRecord | null>(null);
  
  // 加载子女列表
  const fetchChildren = async () => {
    setChildrenLoading(true);
    try {
      // 优先使用登录时获取的子女信息
      if (user?.children && user.children.length > 0) {
        const childrenData = user.children.map(c => ({
          id: c.id,
          name: c.name,
          studentNumber: '',
          className: c.className,
        }));
        setChildren(childrenData);
        setSelectedChild(childrenData[0]);
        setChildrenLoading(false);
        return;
      }
      
      // 如果登录信息中没有，尝试从 API 获取
      const res = await fetch(`/api/parents/user/${user?.id}/children`);
      const data = await res.json();
      if (data.success && data.children?.length > 0) {
        setChildren(data.children);
        setSelectedChild(data.children[0]);
      }
    } catch (error) {
      console.error('获取子女列表失败:', error);
    } finally {
      setChildrenLoading(false);
    }
  };
  
  // 加载月度目标
  const fetchMonthlyGoals = async (studentId: string) => {
    setGoalsLoading(true);
    try {
      const res = await fetch(`/api/habit/monthly-goals?studentId=${studentId}&month=${currentMonth}`);
      const data = await res.json();
      if (data.success) {
        setMonthlyGoals(data.data);
      }
    } catch (error) {
      console.error('获取月度目标失败:', error);
    } finally {
      setGoalsLoading(false);
    }
  };
  
  // 加载打卡记录
  const fetchRecords = async (studentId: string) => {
    setRecordsLoading(true);
    try {
      const res = await fetch(`/api/habit/records?studentId=${studentId}&month=${currentMonth}`);
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
      fetchChildren();
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (selectedChild?.id) {
      fetchMonthlyGoals(selectedChild.id);
      fetchRecords(selectedChild.id);
    }
  }, [selectedChild?.id, currentMonth]);
  
  // 打卡
  const handleCheckIn = async () => {
    if (!selectedGoal || !selectedChild) return;
    
    setCheckInSubmitting(true);
    try {
      const res = await fetch('/api/habit/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyGoalId: selectedGoal.id,
          studentId: selectedChild.id,
          checkDate: checkInDate,
          month: currentMonth,
          description: checkInDescription,
          photoUrl: checkInPhoto,
          createdBy: user?.id,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRecords(selectedChild.id);
        setCheckInDialogOpen(false);
        setCheckInDescription('');
        setCheckInPhoto('');
        setSelectedGoal(null);
        
        // 显示成功动画
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        alert(data.error || '打卡失败');
      }
    } catch (error) {
      console.error('打卡失败:', error);
      alert('打卡失败');
    } finally {
      setCheckInSubmitting(false);
    }
  };
  
  // 打开打卡对话框
  const openCheckInDialog = (goal: MonthlyGoal) => {
    setSelectedGoal(goal);
    setCheckInDate(getToday());
    setCheckInDescription('');
    setCheckInPhoto('');
    setCheckInDialogOpen(true);
  };
  
  // 计算打卡进度
  const getGoalProgress = useCallback((goalId: string) => {
    const goalRecords = records.filter(r => r.monthlyGoalId === goalId);
    const completed = goalRecords.filter(r => r.status === 'completed').length;
    const total = getMonthDays(currentMonth).length;
    return Math.round((completed / total) * 100);
  }, [records, currentMonth]);
  
  // 获取某日期的打卡状态
  const getRecordStatus = useCallback((goalId: string, date: string) => {
    const record = records.find(r => r.monthlyGoalId === goalId && r.checkDate === date);
    return record?.status || 'pending';
  }, [records]);
  
  // 获取某日期的记录
  const getRecord = useCallback((goalId: string, date: string) => {
    return records.find(r => r.monthlyGoalId === goalId && r.checkDate === date);
  }, [records]);
  
  // 统计数据
  const statistics = useMemo(() => {
    const completed = records.filter(r => r.status === 'completed').length;
    const missed = records.filter(r => r.status === 'missed').length;
    const total = monthlyGoals.length * getMonthDays(currentMonth).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // 计算总连续打卡天数
    let maxStreak = 0;
    monthlyGoals.forEach(goal => {
      const streak = getStreakDays(records, goal.id);
      maxStreak = Math.max(maxStreak, streak);
    });
    
    return { completed, missed, total, rate, maxStreak };
  }, [records, monthlyGoals, currentMonth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/50 via-white to-blue-50/50">
      {/* 打卡成功动画 */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
        </div>
      )}
      
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-indigo-500/10 rounded-b-[3rem] -z-10" />
      
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                <Target className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-700 to-blue-600 bg-clip-text text-transparent">
                习惯打卡
              </h1>
            </div>
            <p className="text-muted-foreground ml-14">
              八大行为习惯 · 每日打卡 · 习惯养成
            </p>
          </div>
        </div>
        
        {/* 子女选择 */}
        {children.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all whitespace-nowrap',
                  selectedChild?.id === child.id
                    ? 'border-cyan-300 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                )}
              >
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                  <AvatarImage src={child.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-600 font-medium">
                    {child.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{child.name}</p>
                  <p className="text-xs text-gray-500">{child.className}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* 本月目标 */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">本月目标</p>
                  <p className="text-3xl font-bold mt-0.5">{monthlyGoals.length}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 已打卡 */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium">已打卡</p>
                  <p className="text-3xl font-bold mt-0.5">{statistics.completed}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 连续天数 */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-orange-500/10 bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">连续打卡</p>
                  <p className="text-3xl font-bold mt-0.5">{statistics.maxStreak}</p>
                  <p className="text-orange-100 text-xs">天</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20">
                  <Flame className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 完成率 */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-purple-500/10 bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">完成率</p>
                  <p className="text-3xl font-bold mt-0.5">{statistics.rate}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 主要内容 */}
        {childrenLoading ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto" />
                <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
              </div>
            </CardContent>
          </Card>
        ) : !selectedChild ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无子女信息</p>
              <p className="text-sm text-gray-400 mt-1">请先在个人资料中添加子女信息</p>
            </CardContent>
          </Card>
        ) : goalsLoading ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-32 bg-gray-200 rounded mx-auto" />
                <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
              </div>
            </CardContent>
          </Card>
        ) : monthlyGoals.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-gray-500">本月暂无习惯目标</p>
              <p className="text-sm text-gray-400 mt-1">请联系班主任设置习惯目标</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 月份选择 */}
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full bg-white/80 hover:bg-white shadow-sm"
                onClick={() => {
                  const [year, month] = currentMonth.split('-').map(Number);
                  const newMonth = month === 1 ? 12 : month - 1;
                  const newYear = month === 1 ? year - 1 : year;
                  setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/30">
                {currentMonth}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full bg-white/80 hover:bg-white shadow-sm"
                onClick={() => {
                  const [year, month] = currentMonth.split('-').map(Number);
                  const newMonth = month === 12 ? 1 : month + 1;
                  const newYear = month === 12 ? year + 1 : year;
                  setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 目标卡片列表 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {monthlyGoals.map(goal => {
                const colors = goal.goal ? CATEGORY_COLORS[goal.goal.category] : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                const icon = goal.goal ? CATEGORY_ICONS[goal.goal.category] : '📋';
                const progress = getGoalProgress(goal.id);
                const todayStatus = getRecordStatus(goal.id, getToday());
                const streakDays = getStreakDays(records, goal.id);
                
                return (
                  <Card 
                    key={goal.id} 
                    className="group border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* 顶部类别条 */}
                    <div className={cn('h-2', colors.bg.replace('-50', '-400'))} />
                    
                    <CardContent className="p-5">
                      {/* 标题和打卡按钮 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl', colors.bg)}>
                            {icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {goal.customTitle || goal.goal?.title}
                            </h3>
                            <Badge className={cn(colors.bg, colors.text, 'border-0 mt-1')}>
                              {goal.goal?.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => openCheckInDialog(goal)}
                          disabled={todayStatus === 'completed'}
                          className={cn(
                            'rounded-xl shadow-md transition-all',
                            todayStatus === 'completed'
                              ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/30'
                          )}
                        >
                          {todayStatus === 'completed' ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              已打卡
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              今日打卡
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* 进度和连续天数 */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-gray-500">月度进度</span>
                            <span className="font-bold text-gray-900">{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        
                        {streakDays > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-bold text-orange-600">{streakDays}天</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 日历视图 */}
                      <div className="bg-gray-50/50 rounded-xl p-3">
                        <div className="grid grid-cols-7 gap-1">
                          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                              {d}
                            </div>
                          ))}
                          {(() => {
                            const days = getMonthDays(currentMonth);
                            const firstDay = new Date(days[0]).getDay();
                            const today = getToday();
                            
                            return (
                              <>
                                {/* 第一行空白填充 */}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                  <div key={`empty-${i}`} className="aspect-square" />
                                ))}
                                {/* 日期格子 */}
                                {days.map(date => {
                                  const status = getRecordStatus(goal.id, date);
                                  const day = parseInt(date.slice(8));
                                  const isToday = date === today;
                                  const isFuture = new Date(date) > new Date(today);
                                  const record = getRecord(goal.id, date);
                                  
                                  return (
                                    <button
                                      key={date}
                                      disabled={isFuture || !record}
                                      onClick={() => {
                                        if (record) {
                                          setSelectedRecord(record);
                                          setRecordDetailOpen(true);
                                        }
                                      }}
                                      className={cn(
                                        'aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all relative',
                                        status === 'completed' && 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm',
                                        status === 'missed' && 'bg-red-100 text-red-500',
                                        status === 'make_up' && 'bg-amber-100 text-amber-600',
                                        status === 'pending' && !isFuture && 'bg-gray-100 text-gray-400',
                                        isFuture && 'text-gray-300',
                                        isToday && status === 'pending' && 'ring-2 ring-cyan-400 ring-offset-1',
                                        !isFuture && record && 'cursor-pointer hover:scale-110 hover:shadow-md'
                                      )}
                                    >
                                      {day}
                                      {status === 'completed' && (
                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white shadow-sm" />
                                      )}
                                    </button>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* 目标说明 */}
                      {goal.goal?.description && (
                        <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                          {goal.goal.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 打卡对话框 */}
        <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  <Camera className="h-4 w-4" />
                </div>
                习惯打卡
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedGoal?.customTitle || selectedGoal?.goal?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">打卡日期</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  max={getToday()}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">打卡说明</label>
                <Textarea
                  placeholder="记录一下今天的习惯养成情况..."
                  value={checkInDescription}
                  onChange={e => setCheckInDescription(e.target.value)}
                  rows={3}
                  className="bg-gray-50/50 border-gray-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 resize-none rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">上传照片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-cyan-300 hover:bg-cyan-50/30 cursor-pointer transition-all">
                  {checkInPhoto ? (
                    <div className="relative">
                      <img 
                        src={checkInPhoto} 
                        alt="打卡照片" 
                        className="max-h-32 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => setCheckInPhoto('')}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">点击上传照片</p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCheckInDialogOpen(false)} className="rounded-xl">
                取消
              </Button>
              <Button 
                onClick={handleCheckIn} 
                disabled={checkInSubmitting}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30"
              >
                {checkInSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    确认打卡
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* 记录详情对话框 */}
        <Dialog open={recordDetailOpen} onOpenChange={setRecordDetailOpen}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl">打卡详情</DialogTitle>
              <DialogDescription>
                {selectedRecord?.checkDate} 星期{getWeekDay(selectedRecord?.checkDate || '')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {selectedRecord?.photoUrl && (
                <div className="rounded-xl overflow-hidden">
                  <img src={selectedRecord.photoUrl} alt="打卡照片" className="w-full" />
                </div>
              )}
              
              {selectedRecord?.description && (
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-1">打卡说明</p>
                  <p className="text-sm text-gray-600">{selectedRecord.description}</p>
                </div>
              )}
              
              {selectedRecord?.parentComment && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-1">家长留言</p>
                  <p className="text-sm text-blue-600">{selectedRecord.parentComment}</p>
                </div>
              )}
              
              {selectedRecord?.teacherComment && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-700 mb-1">班主任评语</p>
                  <p className="text-sm text-emerald-600">{selectedRecord.teacherComment}</p>
                </div>
              )}
              
              <div className="flex items-center justify-center">
                <Badge className={cn(
                  'px-4 py-2 text-base',
                  selectedRecord?.status === 'completed' && 'bg-emerald-500 text-white',
                  selectedRecord?.status === 'missed' && 'bg-red-100 text-red-700',
                  selectedRecord?.status === 'make_up' && 'bg-amber-100 text-amber-700',
                )}>
                  {selectedRecord?.status === 'completed' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {selectedRecord?.status === 'completed' ? '已完成' : 
                   selectedRecord?.status === 'missed' ? '缺卡' : '补卡'}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecordDetailOpen(false)} className="rounded-xl">
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
