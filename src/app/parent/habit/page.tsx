'use client';

/**
 * 家长端习惯打卡页面
 * 
 * 功能：
 * - 查看子女月度习惯目标
 * - 每日打卡
 * - 上传打卡照片
 * - 查看打卡记录和统计
 */

import React, { useState, useEffect, useMemo } from 'react';
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

// 类别颜色映射
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
  
  // 加载子女列表
  const fetchChildren = async () => {
    setChildrenLoading(true);
    try {
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
  const getGoalProgress = (goalId: string) => {
    const goalRecords = records.filter(r => r.monthlyGoalId === goalId);
    const completed = goalRecords.filter(r => r.status === 'completed').length;
    const total = getMonthDays(currentMonth).length;
    return Math.round((completed / total) * 100);
  };
  
  // 获取某日期的打卡状态
  const getRecordStatus = (goalId: string, date: string) => {
    const record = records.find(r => r.monthlyGoalId === goalId && r.checkDate === date);
    return record?.status || 'pending';
  };
  
  // 统计数据
  const statistics = useMemo(() => {
    const completed = records.filter(r => r.status === 'completed').length;
    const total = monthlyGoals.length * getMonthDays(currentMonth).length;
    return {
      completed,
      total: total || 1,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [records, monthlyGoals, currentMonth]);
  
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-cyan-50/30 via-white to-blue-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">习惯打卡</h1>
          <p className="text-gray-500 mt-1">
            八大行为习惯 · 每日打卡 · 习惯养成
          </p>
        </div>
      </div>
      
      {/* 子女选择 */}
      {children.length > 1 && (
        <div className="flex items-center gap-4">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                selectedChild?.id === child.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={child.avatar} />
                <AvatarFallback>{child.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{child.name}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月目标</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyGoals.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已打卡</p>
                <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">完成率</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.rate}%</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 主要内容 */}
      {childrenLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            加载中...
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            暂无子女信息，请先在个人资料中添加子女信息
          </CardContent>
        </Card>
      ) : goalsLoading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            加载目标中...
          </CardContent>
        </Card>
      ) : monthlyGoals.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center text-gray-500">
            本月暂无习惯目标，请联系班主任设置
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 月份选择 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const [year, month] = currentMonth.split('-').map(Number);
                const newMonth = month === 1 ? 12 : month - 1;
                const newYear = month === 1 ? year - 1 : year;
                setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">{currentMonth}</span>
              <Button variant="outline" size="sm" onClick={() => {
                const [year, month] = currentMonth.split('-').map(Number);
                const newMonth = month === 12 ? 1 : month + 1;
                const newYear = month === 12 ? year + 1 : year;
                setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 目标列表 */}
          {monthlyGoals.map(goal => {
            const colors = goal.goal ? CATEGORY_COLORS[goal.goal.category] : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
            const icon = goal.goal ? CATEGORY_ICONS[goal.goal.category] : '📋';
            const progress = getGoalProgress(goal.id);
            const todayStatus = getRecordStatus(goal.id, getToday());
            
            return (
              <Card key={goal.id} className="border-0 shadow-md overflow-hidden">
                <CardHeader className={cn(colors.bg, 'pb-3')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <CardTitle className="text-lg">{goal.customTitle || goal.goal?.title}</CardTitle>
                        <CardDescription className={colors.text}>
                          {goal.goal?.category}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => openCheckInDialog(goal)}
                      disabled={todayStatus === 'completed'}
                      className={todayStatus === 'completed' ? 'bg-green-500' : ''}
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
                </CardHeader>
                <CardContent className="pt-4">
                  {/* 进度 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">月度进度</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {/* 日历视图 */}
                  <div className="grid grid-cols-7 gap-1">
                    {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                      <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
                    ))}
                    {getMonthDays(currentMonth).map((date, idx) => {
                      const status = getRecordStatus(goal.id, date);
                      const day = parseInt(date.slice(8));
                      const isToday = date === getToday();
                      const dayOfWeek = new Date(date).getDay();
                      
                      // 第一行填充空白
                      if (idx === 0 && dayOfWeek > 0) {
                        return (
                          <React.Fragment key={`empty-${date}`}>
                            {Array.from({ length: dayOfWeek }).map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            <div
                              key={date}
                              className={cn(
                                'aspect-square flex items-center justify-center rounded text-sm',
                                status === 'completed' ? 'bg-green-100 text-green-700' :
                                status === 'missed' ? 'bg-red-50 text-red-500' :
                                isToday ? 'bg-primary/10 text-primary font-bold border border-primary' :
                                'bg-gray-50 text-gray-400'
                              )}
                            >
                              {day}
                            </div>
                          </React.Fragment>
                        );
                      }
                      
                      return (
                        <div
                          key={date}
                          className={cn(
                            'aspect-square flex items-center justify-center rounded text-sm',
                            status === 'completed' ? 'bg-green-100 text-green-700' :
                            status === 'missed' ? 'bg-red-50 text-red-500' :
                            isToday ? 'bg-primary/10 text-primary font-bold border border-primary' :
                            'bg-gray-50 text-gray-400'
                          )}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 说明 */}
                  {goal.goal?.description && (
                    <p className="text-sm text-gray-500 mt-3">{goal.goal.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* 打卡对话框 */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>习惯打卡</DialogTitle>
            <DialogDescription>
              {selectedGoal?.customTitle || selectedGoal?.goal?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">打卡日期</label>
              <input
                type="date"
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
                max={getToday()}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">打卡说明（可选）</label>
              <Textarea
                placeholder="记录一下今天的习惯养成情况..."
                value={checkInDescription}
                onChange={e => setCheckInDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">上传照片（可选）</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500 hover:border-gray-400 cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">点击上传照片</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>取消</Button>
            <Button onClick={handleCheckIn} disabled={checkInSubmitting}>
              {checkInSubmitting ? '提交中...' : '确认打卡'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
