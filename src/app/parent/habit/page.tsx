'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Star,
  Calendar,
  TrendingUp,
  Award,
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  CheckCircle,
  Clock,
  Target,
  FileSignature,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { 
  useStudentGoals, 
  useCheckIns,
  type StudentGoalData,
  type CheckInData,
} from '@/hooks/useHabitData';
import { HabitCategory, habitCategoryNames } from '@/types';

// 习惯类别配置
const habitCategories: { key: HabitCategory; name: string; icon: React.ElementType; color: string }[] = [
  { key: 'civilization', name: '文明习惯', icon: Heart, color: 'text-red-600 bg-red-50' },
  { key: 'writing', name: '书写习惯', icon: Pen, color: 'text-blue-600 bg-blue-50' },
  { key: 'reading', name: '阅读习惯', icon: BookOpen, color: 'text-green-600 bg-green-50' },
  { key: 'sports', name: '运动习惯', icon: Trophy, color: 'text-orange-600 bg-orange-50' },
  { key: 'safety', name: '安全习惯', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  { key: 'hygiene', name: '卫生习惯', icon: Sparkles, color: 'text-teal-600 bg-teal-50' },
  { key: 'aesthetic', name: '审美习惯', icon: Palette, color: 'text-pink-600 bg-pink-50' },
  { key: 'labor', name: '劳动习惯', icon: Hammer, color: 'text-amber-600 bg-amber-50' },
];

// 模拟当前学生信息（TODO: 从登录状态获取）
const currentStudent = {
  id: 'student-001',
  name: '张小明',
  className: '四年级(1)班',
};

// 当前月份
const currentMonth = new Date().toISOString().slice(0, 7);

// 模拟家长信息
const currentParent = {
  id: 'parent-001',
  name: '张爸爸',
};

export default function ParentHabitPage() {
  const [activeTab, setActiveTab] = useState('goals');
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<StudentGoalData | null>(null);
  const [checkNotes, setCheckNotes] = useState('');
  const [confirmSignature, setConfirmSignature] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  // 获取学生小目标
  const { 
    data: goals, 
    loading: goalsLoading, 
    error: goalsError,
    refetch: refetchGoals 
  } = useStudentGoals(currentStudent.id, currentMonth);

  // 获取打卡记录
  const { 
    data: checkIns, 
    loading: checkInsLoading, 
    refetch: refetchCheckIns,
    checkIn,
    hasCheckedToday,
  } = useCheckIns(currentStudent.id, currentMonth);

  // 计算完成率
  const stats = useMemo(() => {
    const totalCompleted = (goals || []).reduce((sum, g) => sum + g.completedCount, 0);
    const totalTarget = (goals || []).reduce((sum, g) => sum + g.targetCount, 0);
    const rate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    return { totalCompleted, totalTarget, rate };
  }, [goals]);

  // 获取类别信息
  const getCategoryInfo = (key: HabitCategory) => {
    return habitCategories.find(c => c.key === key) || habitCategories[0];
  };

  // 打卡
  const handleCheckIn = async () => {
    if (!selectedGoal) return;

    try {
      setCheckingIn(true);
      await checkIn({
        studentId: currentStudent.id,
        studentGoalId: selectedGoal.id,
        category: selectedGoal.category,
        notes: checkNotes || undefined,
        checkedBy: currentParent.id,
        checkedByType: 'parent',
        checkedByName: currentParent.name,
      });
      
      toast.success('打卡成功！');
      setShowCheckDialog(false);
      setCheckNotes('');
      setSelectedGoal(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '打卡失败');
    } finally {
      setCheckingIn(false);
    }
  };

  // 快速打卡（从列表直接打卡）
  const handleQuickCheckIn = async (goal: StudentGoalData) => {
    if (hasCheckedToday(goal.id)) {
      toast.info('今日已打卡');
      return;
    }

    try {
      await checkIn({
        studentId: currentStudent.id,
        studentGoalId: goal.id,
        category: goal.category,
        checkedBy: currentParent.id,
        checkedByType: 'parent',
        checkedByName: currentParent.name,
      });
      toast.success(`${goal.title} 打卡成功！`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '打卡失败');
    }
  };

  // 月度确认
  const handleConfirm = async () => {
    if (!confirmSignature.trim()) {
      toast.error('请输入确认签名');
      return;
    }

    try {
      const response = await fetch('/api/habit/monthly-confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.id,
          month: currentMonth,
          parentSignature: confirmSignature,
          parentNotes: `${currentStudent.name}本月习惯养成情况良好，家长确认签字。`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('月度确认已提交，等待班主任审核');
        setShowConfirmDialog(false);
        setConfirmSignature('');
      } else {
        throw new Error(result.error || '提交失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const isLoading = goalsLoading || checkInsLoading;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-cyan-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">习惯养成</h1>
          </div>
          <p className="text-gray-500 mt-1">{currentStudent.name} · {currentStudent.className} · {currentMonth.replace('-', '年')}月</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { refetchGoals(); refetchCheckIns(); }} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowConfirmDialog(true)}>
            <FileSignature className="h-4 w-4" />
            月度确认
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-teal-100 text-sm">本月达成率</span>
              <TrendingUp className="h-4 w-4 text-teal-200" />
            </div>
            <div className="text-3xl font-bold">{stats.rate}%</div>
            <Progress value={stats.rate} className="h-2 mt-2 bg-teal-400/30" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{goals?.length || 0}</p>
            <p className="text-xs text-gray-500">进行中目标</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.totalCompleted}</p>
            <p className="text-xs text-gray-500">已完成次数</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              <p className="text-lg font-bold text-gray-900">习惯之星</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">努力中</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="goals">月度小目标</TabsTrigger>
          <TabsTrigger value="records">打卡记录</TabsTrigger>
        </TabsList>

        {/* 月度小目标 */}
        <TabsContent value="goals" className="mt-4 space-y-4">
          {goalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : goalsError ? (
            <div className="text-center py-12 text-red-500">
              {goalsError}
            </div>
          ) : !goals || goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>本月暂无小目标</p>
              <p className="text-sm mt-1">请联系班主任设置本月习惯养成目标</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {goals.map((goal) => {
                const category = getCategoryInfo(goal.category);
                const Icon = category.icon;
                const checkedToday = hasCheckedToday(goal.id);
                
                return (
                  <Card key={goal.id} className={`border-0 shadow-md hover:shadow-lg transition-all ${checkedToday ? 'ring-2 ring-green-200' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${category.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900">{goal.title}</h3>
                            <div className="flex items-center gap-2">
                              {checkedToday && (
                                <Badge className="bg-green-600 text-white text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  今日已打卡
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant={checkedToday ? "outline" : "default"}
                                className={checkedToday ? "" : "bg-teal-600 hover:bg-teal-700"}
                                onClick={() => handleQuickCheckIn(goal)}
                                disabled={checkedToday}
                              >
                                {checkedToday ? '已完成' : '打卡'}
                              </Button>
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-gray-500 mb-2">{goal.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mb-3">{category.name}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">完成进度</span>
                              <span className="font-medium">{goal.completedCount}/{goal.targetCount}</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 打卡记录 */}
        <TabsContent value="records" className="mt-4">
          {checkInsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !checkIns || checkIns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无打卡记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkIns.slice(0, 20).map((record) => {
                const category = getCategoryInfo(record.category);
                const Icon = category.icon;
                
                return (
                  <Card key={record.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(record.checkDate)}
                            </span>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>打卡人：{record.checkedByName || '家长'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 打卡对话框 */}
      <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>打卡确认</DialogTitle>
            <DialogDescription>
              为「{selectedGoal?.title}」添加今日打卡记录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">打卡备注（可选）</Label>
              <Textarea
                id="notes"
                placeholder="记录今天的表现或心得..."
                value={checkNotes}
                onChange={(e) => setCheckNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCheckIn} disabled={checkingIn} className="bg-teal-600 hover:bg-teal-700">
              {checkingIn && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认打卡
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 月度确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-teal-600" />
              月度确认签字
            </DialogTitle>
            <DialogDescription>
              请确认 {currentStudent.name} 本月习惯养成情况后签字
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 本月统计摘要 */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-teal-600">{stats.rate}%</p>
                    <p className="text-xs text-muted-foreground">达成率</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{goals?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">参与目标</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
                    <p className="text-xs text-muted-foreground">完成次数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 签名输入 */}
            <div className="space-y-2">
              <Label htmlFor="signature">家长签名 *</Label>
              <Input
                id="signature"
                placeholder="请输入您的姓名作为电子签名"
                value={confirmSignature}
                onChange={(e) => setConfirmSignature(e.target.value)}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              点击确认后，班主任将收到审核通知，审核通过后本月习惯养成记录将归档。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!confirmSignature.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              确认签字
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
