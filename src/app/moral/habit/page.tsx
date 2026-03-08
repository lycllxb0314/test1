'use client';

/**
 * 德育处习惯养成管理页面
 * 
 * 功能：
 * - 目标库管理：管理八大类别习惯目标
 * - 规则配置：配置打卡周期、截止日期等规则
 * - 习惯之星：每月评选习惯之星
 */

import React, { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { HABIT_CATEGORIES, CATEGORY_COLORS, DIFFICULTY_LABELS } from '@/config/habit';
import {
  Target,
  Settings,
  Star,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  Award,
  TrendingUp,
  Users,
  Calendar,
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

export default function HabitManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('goals');
  
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
  
  useEffect(() => {
    fetchGoals();
  }, [categoryFilter]);
  
  useEffect(() => {
    fetchRules();
  }, []);
  
  useEffect(() => {
    fetchStars();
  }, [starMonth]);
  
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
  const statistics = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.isActive).length,
    categoryCount: new Set(goals.map(g => g.category)).size,
    totalStars: stars.length,
  };
  
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">习惯养成管理</h1>
          <p className="text-gray-500 mt-1">
            八大行为习惯 · 目标库管理 · 习惯之星评选
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          <Badge className="bg-green-500 text-white gap-1">
            <Target className="h-3 w-3" />
            德育处
          </Badge>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">目标总数</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.totalGoals}</p>
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
                <p className="text-sm text-gray-500">启用目标</p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeGoals}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">习惯类别</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.categoryCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月之星</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.totalStars}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            目标库管理
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="h-4 w-4" />
            规则配置
          </TabsTrigger>
          <TabsTrigger value="stars" className="gap-2">
            <Star className="h-4 w-4" />
            习惯之星
          </TabsTrigger>
        </TabsList>
        
        {/* 目标库管理 */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {HABIT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => {
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
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加目标
            </Button>
          </div>
          
          <Card className="border-0 shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类别</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>目标标题</TableHead>
                  <TableHead>适用年级</TableHead>
                  <TableHead>难度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : goals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无目标数据，请添加
                    </TableCell>
                  </TableRow>
                ) : (
                  goals.map(goal => {
                    const colors = CATEGORY_COLORS[goal.category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                    return (
                      <TableRow key={goal.id}>
                        <TableCell>
                          <Badge className={cn(colors.bg, colors.text, colors.border, 'border')}>
                            {goal.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{goal.code || '-'}</TableCell>
                        <TableCell className="font-medium">{goal.title}</TableCell>
                        <TableCell>{goal.gradeRange}年级</TableCell>
                        <TableCell>
                          <Badge variant="outline">{DIFFICULTY_LABELS[goal.difficulty]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={goal.isActive}
                            onCheckedChange={() => handleToggleGoal(goal)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        {/* 规则配置 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              配置习惯养成的打卡周期、截止日期、合格率等规则
            </p>
            <Button onClick={() => setRuleDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              配置规则
            </Button>
          </div>
          
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">当前生效规则</CardTitle>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <p className="text-gray-500">加载中...</p>
              ) : rules.length === 0 ? (
                <p className="text-gray-500">暂无规则配置，请先配置</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rules.map(rule => (
                    <div key={rule.id} className="p-4 rounded-lg border bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{rule.academicYear}学年 第{rule.semester}学期</span>
                        {rule.isActive && <Badge className="bg-green-500">生效中</Badge>}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>打卡周期：{rule.checkFrequency === 'daily' ? '每日' : '每周'}</p>
                        <p>月度截止：每月{rule.monthlyDeadline}日</p>
                        <p>补卡天数：{rule.makeUpDays}天</p>
                        <p>合格率：{rule.passThreshold}%</p>
                        <p>班级名额：每班{rule.starQuotaPerClass}人</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 习惯之星 */}
        <TabsContent value="stars" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>选择月份</Label>
              <Input
                type="month"
                value={starMonth}
                onChange={e => setStarMonth(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
          
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {starMonth} 习惯之星
              </CardTitle>
              <CardDescription>
                共评选出 {stars.length} 位习惯之星
              </CardDescription>
            </CardHeader>
            <CardContent>
              {starsLoading ? (
                <p className="text-gray-500">加载中...</p>
              ) : stars.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  本月暂无习惯之星数据
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stars.map(star => {
                    const colors = CATEGORY_COLORS[star.category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                    return (
                      <div key={star.id} className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">学生ID: {star.studentId}</p>
                            <p className="text-xs text-gray-500">班级ID: {star.classId}</p>
                          </div>
                        </div>
                        <Badge className={cn(colors.bg, colors.text, colors.border, 'border')}>
                          {star.category}
                        </Badge>
                        {star.score && (
                          <p className="text-sm text-gray-600 mt-2">得分：{star.score}分</p>
                        )}
                        {star.nominationReason && (
                          <p className="text-sm text-gray-600 mt-1">{star.nominationReason}</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? '编辑目标' : '添加目标'}</DialogTitle>
            <DialogDescription>
              填写习惯养成目标信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>类别 *</Label>
              <Select value={goalForm.category} onValueChange={v => setGoalForm({ ...goalForm, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
              />
            </div>
            <div className="space-y-2">
              <Label>目标标题 *</Label>
              <Input
                placeholder="输入目标标题"
                value={goalForm.title}
                onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                placeholder="输入目标描述"
                value={goalForm.description}
                onChange={e => setGoalForm({ ...goalForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>适用年级</Label>
                <Select value={goalForm.gradeRange} onValueChange={v => setGoalForm({ ...goalForm, gradeRange: v })}>
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">简单</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="hard">困难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveGoal}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 规则配置对话框 */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>配置习惯养成规则</DialogTitle>
            <DialogDescription>
              设置打卡周期、截止日期、合格率等规则
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>学年</Label>
                <Select value={ruleForm.academicYear} onValueChange={v => setRuleForm({ ...ruleForm, academicYear: v })}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={ruleForm.endDate}
                  onChange={e => setRuleForm({ ...ruleForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>打卡周期</Label>
                <Select value={ruleForm.checkFrequency} onValueChange={v => setRuleForm({ ...ruleForm, checkFrequency: v as 'daily' | 'weekly' })}>
                  <SelectTrigger>
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
                />
              </div>
              <div className="space-y-2">
                <Label>班级名额</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={ruleForm.starQuotaPerClass}
                  onChange={e => setRuleForm({ ...ruleForm, starQuotaPerClass: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveRule}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
