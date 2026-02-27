'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Users,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Filter,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

// 习惯类别图标映射
const habitIcons: Record<HabitCategory, React.ElementType> = {
  civilization: Heart,
  writing: Pen,
  reading: BookOpen,
  sports: Trophy,
  safety: Shield,
  hygiene: Sparkles,
  aesthetic: Palette,
  labor: Hammer,
};

// 模拟班级学生列表
const mockStudents = [
  { id: 's001', name: '张小明', habitRate: 88.5, trend: 'up', habitStar: true },
  { id: 's002', name: '李小红', habitRate: 92.3, trend: 'up', habitStar: true },
  { id: 's003', name: '王小刚', habitRate: 78.2, trend: 'stable', habitStar: false },
  { id: 's004', name: '赵小芳', habitRate: 85.6, trend: 'up', habitStar: false },
  { id: 's005', name: '刘小伟', habitRate: 72.1, trend: 'down', habitStar: false },
  { id: 's006', name: '陈小丽', habitRate: 90.8, trend: 'up', habitStar: true },
  { id: 's007', name: '吴小强', habitRate: 68.5, trend: 'stable', habitStar: false },
  { id: 's008', name: '周小燕', habitRate: 86.3, trend: 'up', habitStar: false },
];

// 班级习惯统计
const mockClassStats = {
  totalStudents: 45,
  averageRate: 85.2,
  habitStarCount: 5,
  topCategories: ['reading', 'civilization', 'labor'] as HabitCategory[],
  improvementCategories: ['aesthetic', 'writing'] as HabitCategory[],
  categoryAverages: {
    civilization: 88,
    writing: 75,
    reading: 92,
    sports: 82,
    safety: 90,
    hygiene: 85,
    aesthetic: 72,
    labor: 88,
  },
};

// 模拟月度小目标
const mockMonthlyGoals = [
  { id: 'g001', category: 'civilization' as HabitCategory, title: '每天主动问好', rate: 91, achieved: true },
  { id: 'g002', category: 'reading' as HabitCategory, title: '每日阅读30分钟', rate: 86, achieved: true },
  { id: 'g003', category: 'sports' as HabitCategory, title: '每天运动1小时', rate: 82, achieved: true },
  { id: 'g004', category: 'writing' as HabitCategory, title: '书写工整', rate: 77, achieved: false },
  { id: 'g005', category: 'hygiene' as HabitCategory, title: '整理书包', rate: 91, achieved: true },
  { id: 'g006', category: 'labor' as HabitCategory, title: '做家务', rate: 55, achieved: false },
];

// 习惯之星榜单
const mockHabitStars = [
  { rank: 1, name: '李小红', achievements: '全习惯达标', monthlyStars: 6 },
  { rank: 2, name: '陈小丽', achievements: '7项达标', monthlyStars: 5 },
  { rank: 3, name: '张小明', achievements: '6项达标', monthlyStars: 5 },
];

export default function HabitDevelopmentPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState('2024-03');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');

  // 评价表单
  const [assessmentForm, setAssessmentForm] = useState({
    studentId: '',
    category: 'civilization' as HabitCategory,
    type: 'praise' as 'praise' | 'improve',
    title: '',
    content: '',
  });

  // 切换月份
  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-7 w-7 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">习惯养成</h1>
            <Badge className="bg-green-100 text-green-700">德育特色</Badge>
          </div>
          <p className="text-gray-500 mt-1">八大行为习惯评价 · 小目标促成长 · 习惯之星评选</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowGoalDialog(true)}>
            <Target className="h-4 w-4" />
            制定小目标
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            添加评价
          </Button>
        </div>
      </div>

      {/* 八大习惯概览 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            八大行为习惯 · 班级整体情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {(Object.keys(habitCategoryNames) as HabitCategory[]).map((category) => {
              const Icon = habitIcons[category];
              const avg = mockClassStats.categoryAverages[category];
              return (
                <div
                  key={category}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory === category ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg ${habitCategoryColors[category]} mb-2`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{habitCategoryNames[category]}</span>
                    <span className={`text-sm font-bold mt-1 ${
                      avg >= 90 ? 'text-green-600' : avg >= 80 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {avg}%
                    </span>
                    {mockClassStats.improvementCategories.includes(category) && (
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab 切换内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="overview">概览统计</TabsTrigger>
          <TabsTrigger value="students">学生详情</TabsTrigger>
          <TabsTrigger value="goals">小目标管理</TabsTrigger>
          <TabsTrigger value="stars">习惯之星</TabsTrigger>
        </TabsList>

        {/* 概览统计 */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{mockClassStats.averageRate}%</p>
                <p className="text-xs text-gray-500 mt-1">班级平均达成率</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{mockClassStats.totalStudents}</p>
                <p className="text-xs text-gray-500 mt-1">学生总数</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{mockClassStats.habitStarCount}</p>
                <p className="text-xs text-gray-500 mt-1">本月习惯之星</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{mockStudents.filter(s => s.trend === 'up').length}</p>
                <p className="text-xs text-gray-500 mt-1">进步学生</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 优势习惯 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  班级优势习惯
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockClassStats.topCategories.map((cat) => {
                    const Icon = habitIcons[cat];
                    return (
                      <div key={cat} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                        <div className={`p-1.5 rounded ${habitCategoryColors[cat]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1 text-sm">{habitCategoryNames[cat]}</span>
                        <span className="font-medium text-green-600">{mockClassStats.categoryAverages[cat]}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 待提升习惯 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  需重点关注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockClassStats.improvementCategories.map((cat) => {
                    const Icon = habitIcons[cat];
                    return (
                      <div key={cat} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                        <div className={`p-1.5 rounded ${habitCategoryColors[cat]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1 text-sm">{habitCategoryNames[cat]}</span>
                        <span className="font-medium text-orange-600">{mockClassStats.categoryAverages[cat]}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 学生详情 */}
        <TabsContent value="students" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">学生习惯档案</CardTitle>
                <div className="flex items-center gap-2">
                  <Input placeholder="搜索学生..." className="w-48 h-8" />
                  <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as HabitCategory | 'all')}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue placeholder="筛选习惯" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>{habitCategoryNames[cat]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      student.habitStar ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedStudent(student.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{student.name}</span>
                      {student.habitStar && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={student.habitRate} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{student.habitRate}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>本月达成率</span>
                      {student.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : student.trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <span className="text-gray-300">→</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 小目标管理 */}
        <TabsContent value="goals" className="mt-4 space-y-4">
          {/* 月份选择 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => changeMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium">
                {currentMonth.split('-')[0]}年{parseInt(currentMonth.split('-')[1])}月
              </span>
              <Button variant="outline" size="icon" onClick={() => changeMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              已达成 {mockMonthlyGoals.filter(g => g.achieved).length}/{mockMonthlyGoals.length} 项目标
            </div>
          </div>

          {/* 目标列表 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mockMonthlyGoals.map((goal) => {
              const Icon = habitIcons[goal.category];
              return (
                <Card key={goal.id} className={`border-0 shadow-md ${goal.achieved ? 'ring-2 ring-green-400' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${habitCategoryColors[goal.category]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{goal.title}</span>
                          {goal.achieved ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={goal.rate} className="flex-1 h-1.5" />
                          <span className="text-xs font-medium">{goal.rate}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{habitCategoryNames[goal.category]}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 习惯之星 */}
        <TabsContent value="stars" className="mt-4 space-y-4">
          {/* 本月榜单 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                本月习惯之星
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {mockHabitStars.map((star) => (
                  <div
                    key={star.rank}
                    className={`p-4 rounded-xl text-center ${
                      star.rank === 1 ? 'bg-amber-100' :
                      star.rank === 2 ? 'bg-gray-100' : 'bg-orange-100'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold ${
                      star.rank === 1 ? 'bg-amber-400 text-white' :
                      star.rank === 2 ? 'bg-gray-300 text-gray-700' : 'bg-amber-600 text-white'
                    }`}>
                      {star.rank}
                    </div>
                    <p className="font-medium">{star.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{star.achievements}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600">累计{star.monthlyStars}次</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 评选标准 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                评选标准
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-purple-50 rounded-lg text-center">
                  <p className="font-medium text-purple-700">全习惯达标</p>
                  <p className="text-xs text-gray-500 mt-1">8项习惯全部≥80%</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="font-medium text-blue-700">月度小目标</p>
                  <p className="text-xs text-gray-500 mt-1">达成率≥80%</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="font-medium text-green-700">家长评价</p>
                  <p className="text-xs text-gray-500 mt-1">家长已签字确认</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <p className="font-medium text-amber-700">班主任审核</p>
                  <p className="text-xs text-gray-500 mt-1">综合评定通过</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加评价对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加习惯评价</DialogTitle>
            <DialogDescription>记录学生习惯养成的表扬或待改进事项</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择学生</Label>
              <Select value={assessmentForm.studentId} onValueChange={(v) => setAssessmentForm(prev => ({ ...prev, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger>
                <SelectContent>
                  {mockStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>评价类型</Label>
              <div className="flex gap-2">
                <Button
                  variant={assessmentForm.type === 'praise' ? 'default' : 'outline'}
                  className={assessmentForm.type === 'praise' ? 'bg-green-600' : ''}
                  onClick={() => setAssessmentForm(prev => ({ ...prev, type: 'praise' }))}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />表扬
                </Button>
                <Button
                  variant={assessmentForm.type === 'improve' ? 'default' : 'outline'}
                  className={assessmentForm.type === 'improve' ? 'bg-orange-600' : ''}
                  onClick={() => setAssessmentForm(prev => ({ ...prev, type: 'improve' }))}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />待改进
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>习惯类别</Label>
              <Select value={assessmentForm.category} onValueChange={(v) => setAssessmentForm(prev => ({ ...prev, category: v as HabitCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => {
                    const Icon = habitIcons[cat];
                    return (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {habitCategoryNames[cat]}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>评价标题</Label>
              <Input
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="如：主动帮助同学"
              />
            </div>
            <div className="space-y-2">
              <Label>详细描述</Label>
              <Textarea
                value={assessmentForm.content}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="描述具体行为表现..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className={assessmentForm.type === 'praise' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}>
              提交评价
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 制定小目标对话框 */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>制定月度小目标</DialogTitle>
            <DialogDescription>从八个习惯中选择并制定本月的成长目标</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => {
                const Icon = habitIcons[cat];
                return (
                  <button
                    key={cat}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`p-1.5 rounded ${habitCategoryColors[cat]} mb-1`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs">{habitCategoryNames[cat]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label>目标标题</Label>
              <Input placeholder="输入目标标题" />
            </div>
            <div className="space-y-2">
              <Label>具体要求</Label>
              <Textarea placeholder="描述具体要做的事情..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>取消</Button>
            <Button className="bg-green-600 hover:bg-green-700">添加目标</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
