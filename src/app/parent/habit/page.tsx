'use client';

import React, { useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';

// 习惯类别配置
const habitCategories = [
  { key: 'civilization', name: '文明习惯', icon: Heart, color: 'text-red-600 bg-red-50' },
  { key: 'writing', name: '书写习惯', icon: Pen, color: 'text-blue-600 bg-blue-50' },
  { key: 'reading', name: '阅读习惯', icon: BookOpen, color: 'text-green-600 bg-green-50' },
  { key: 'sports', name: '运动习惯', icon: Trophy, color: 'text-orange-600 bg-orange-50' },
  { key: 'safety', name: '安全习惯', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  { key: 'hygiene', name: '卫生习惯', icon: Sparkles, color: 'text-teal-600 bg-teal-50' },
  { key: 'aesthetic', name: '审美习惯', icon: Palette, color: 'text-pink-600 bg-pink-50' },
  { key: 'labor', name: '劳动习惯', icon: Hammer, color: 'text-amber-600 bg-amber-50' },
];

// 模拟孩子的月度小目标
const monthlyGoals = [
  { id: 'g1', name: '每天阅读30分钟', category: 'reading', frequency: 'daily', completed: 18, total: 30, status: 'active' },
  { id: 'g2', name: '规范书写姿势', category: 'writing', frequency: 'daily', completed: 22, total: 30, status: 'active' },
  { id: 'g3', name: '课间文明游戏', category: 'civilization', frequency: 'weekly', completed: 3, total: 4, status: 'active' },
  { id: 'g4', name: '坚持体育锻炼', category: 'sports', frequency: 'daily', completed: 15, total: 30, status: 'active' },
];

// 模拟打卡记录
const checkRecords = [
  { date: '2024-03-18', goals: 4, completed: 3, notes: '今天表现很棒！' },
  { date: '2024-03-17', goals: 4, completed: 4, notes: '全部完成' },
  { date: '2024-03-16', goals: 4, completed: 2, notes: '阅读时间不足' },
];

export default function ParentHabitPage() {
  const [activeTab, setActiveTab] = useState('goals');
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<typeof monthlyGoals[0] | null>(null);
  const [checkNotes, setCheckNotes] = useState('');
  const [confirmSignature, setConfirmSignature] = useState('');
  
  // 计算完成率
  const totalCompleted = monthlyGoals.reduce((sum, g) => sum + g.completed, 0);
  const totalGoal = monthlyGoals.reduce((sum, g) => sum + g.total, 0);
  const completionRate = Math.round((totalCompleted / totalGoal) * 100);

  // 获取类别信息
  const getCategoryInfo = (key: string) => {
    return habitCategories.find(c => c.key === key) || habitCategories[0];
  };

  // 打卡
  const handleCheckIn = () => {
    toast.success('打卡成功！');
    setShowCheckDialog(false);
    setCheckNotes('');
  };

  // 月度确认
  const handleConfirm = () => {
    if (!confirmSignature) {
      toast.error('请输入确认签名');
      return;
    }
    toast.success('月度确认已提交，等待班主任审核');
    setShowConfirmDialog(false);
    setConfirmSignature('');
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-cyan-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">习惯养成</h1>
          </div>
          <p className="text-gray-500 mt-1">张小明 · 四年级(1)班 · 2024年3月</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowConfirmDialog(true)}>
            <FileSignature className="h-4 w-4" />
            月度确认
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setShowCheckDialog(true)}>
            <CheckCircle className="h-4 w-4" />
            今日打卡
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-teal-100 text-sm">本月达成率</span>
              <TrendingUp className="h-4 w-4 text-teal-200" />
            </div>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2 bg-teal-400/30" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{monthlyGoals.length}</p>
            <p className="text-xs text-gray-500">进行中目标</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{totalCompleted}</p>
            <p className="text-xs text-gray-500">已完成次数</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              <p className="text-lg font-bold text-gray-900">进步之星</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">2月获得</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="goals">月度小目标</TabsTrigger>
          <TabsTrigger value="records">打卡记录</TabsTrigger>
          <TabsTrigger value="history">成长轨迹</TabsTrigger>
        </TabsList>

        {/* 月度小目标 */}
        <TabsContent value="goals" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {monthlyGoals.map((goal) => {
              const category = getCategoryInfo(goal.category);
              const Icon = category.icon;
              const rate = Math.round((goal.completed / goal.total) * 100);
              return (
                <Card key={goal.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${category.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900">{goal.name}</h3>
                          <Badge variant={goal.frequency === 'daily' ? 'default' : 'secondary'} className="text-xs">
                            {goal.frequency === 'daily' ? '每日' : '每周'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{category.name}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">完成进度</span>
                            <span className="font-medium">{goal.completed}/{goal.total}</span>
                          </div>
                          <Progress value={rate} className="h-2" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className={`text-lg font-bold ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {rate}%
                      </span>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => { setSelectedGoal(goal); setShowCheckDialog(true); }}>
                        <CheckCircle className="h-4 w-4" />
                        打卡
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 打卡记录 */}
        <TabsContent value="records" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">最近打卡记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkRecords.map((record, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 border rounded-xl">
                    <div className={`p-2 rounded-lg ${record.completed === record.goals ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {record.completed === record.goals ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{record.date}</span>
                        <Badge variant={record.completed === record.goals ? 'default' : 'secondary'}>
                          {record.completed}/{record.goals} 完成
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{record.notes}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成长轨迹 */}
        <TabsContent value="history" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 八大习惯达成情况 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">八大习惯达成情况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {habitCategories.map((cat) => {
                    const Icon = cat.icon;
                    const rate = Math.floor(60 + Math.random() * 35);
                    return (
                      <div key={cat.key} className="text-center">
                        <div className={`p-2 rounded-lg ${cat.color} inline-flex mb-1`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-gray-500">{cat.name}</p>
                        <p className={`font-bold text-sm ${rate >= 80 ? 'text-green-600' : rate >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {rate}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 荣誉墙 */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  习惯之星荣誉
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { month: '2024年2月', title: '进步之星', desc: '达成率提升25%' },
                    { month: '2023年12月', title: '阅读之星', desc: '连续30天阅读打卡' },
                    { month: '2023年11月', title: '文明之星', desc: '文明习惯达成95%' },
                  ].map((honor, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{honor.title}</span>
                          <span className="text-xs text-gray-400">{honor.month}</span>
                        </div>
                        <p className="text-sm text-gray-500">{honor.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 打卡对话框 */}
      <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>今日打卡</DialogTitle>
            <DialogDescription>记录孩子今日的习惯表现</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">目标</p>
              <p className="font-medium">{selectedGoal?.name || '每天阅读30分钟'}</p>
            </div>
            <div className="space-y-2">
              <Label>今日表现</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="completed" />
                  <label htmlFor="completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    已完成
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>具体表现（可选）</Label>
              <Textarea
                value={checkNotes}
                onChange={(e) => setCheckNotes(e.target.value)}
                placeholder="记录孩子的具体表现..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckDialog(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleCheckIn}>确认打卡</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 月度确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>月度确认</DialogTitle>
            <DialogDescription>确认孩子本月习惯养成情况，签字后提交班主任审核</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-teal-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">本月达成率</span>
                <span className="text-2xl font-bold text-teal-600">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>完成 {totalCompleted} 次</span>
                <span>目标 {totalGoal} 次</span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                我已了解孩子本月的习惯养成情况，确认以上数据真实有效。
              </p>
              <div className="space-y-2">
                <Label>家长签名</Label>
                <Input
                  value={confirmSignature}
                  onChange={(e) => setConfirmSignature(e.target.value)}
                  placeholder="请输入您的姓名"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>稍后确认</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleConfirm}>确认提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
