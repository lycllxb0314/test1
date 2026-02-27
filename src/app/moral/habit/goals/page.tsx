'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  Users,
  Calendar,
  Download,
  RefreshCw,
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

// 模拟小目标数据
const goalsData = [
  { id: 'g001', name: '每天阅读30分钟', category: 'reading' as HabitCategory, target: '连续30天', deadline: '2024-04-15', students: 456, completed: 389, rate: 85.3, status: 'active' },
  { id: 'g002', name: '规范书写姿势', category: 'writing' as HabitCategory, target: '每日练习', deadline: '2024-04-30', students: 320, completed: 180, rate: 56.3, status: 'active' },
  { id: 'g003', name: '课间文明游戏', category: 'civilization' as HabitCategory, target: '每周5次', deadline: '2024-03-31', students: 280, completed: 252, rate: 90.0, status: 'completed' },
  { id: 'g004', name: '坚持体育锻炼', category: 'sports' as HabitCategory, target: '每日1小时', deadline: '2024-05-01', students: 520, completed: 364, rate: 70.0, status: 'active' },
  { id: 'g005', name: '保持个人卫生', category: 'hygiene' as HabitCategory, target: '每日检查', deadline: '2024-04-20', students: 1896, completed: 1706, rate: 89.9, status: 'active' },
  { id: 'g006', name: '参与劳动实践', category: 'labor' as HabitCategory, target: '每周2次', deadline: '2024-04-25', students: 150, completed: 105, rate: 70.0, status: 'active' },
];

// 模板数据
const templatesData = [
  { id: 't001', name: '阅读习惯养成模板', category: 'reading' as HabitCategory, goals: 5, usage: 28, description: '适合培养每日阅读习惯' },
  { id: 't002', name: '书写规范模板', category: 'writing' as HabitCategory, goals: 3, usage: 15, description: '规范书写姿势与字体' },
  { id: 't003', name: '体育锻炼模板', category: 'sports' as HabitCategory, goals: 4, usage: 22, description: '每日运动打卡计划' },
  { id: 't004', name: '文明行为模板', category: 'civilization' as HabitCategory, goals: 6, usage: 18, description: '课间文明、礼貌待人' },
];

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState('goals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 过滤目标
  const filteredGoals = goalsData.filter(goal => {
    if (searchQuery && !goal.name.includes(searchQuery)) {
      return false;
    }
    if (selectedCategory !== 'all' && goal.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // 统计数据
  const stats = {
    totalGoals: goalsData.length,
    activeGoals: goalsData.filter(g => g.status === 'active').length,
    completedGoals: goalsData.filter(g => g.status === 'completed').length,
    totalStudents: 1896,
    avgCompletion: 76.8,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 min-h-screen">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
            <Target className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">小目标管理</h1>
            <p className="text-gray-500 mt-0.5">管理学生习惯养成小目标，跟踪完成进度</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            新建目标
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalGoals}</div>
            <div className="text-sm text-gray-500">总目标数</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeGoals}</div>
            <div className="text-sm text-gray-500">进行中</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completedGoals}</div>
            <div className="text-sm text-gray-500">已完成</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalStudents}</div>
            <div className="text-sm text-gray-500">参与学生</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avgCompletion}%</div>
            <div className="text-sm text-gray-500">平均完成率</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="goals" className="data-[state=active]:bg-white">目标列表</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-white">目标模板</TabsTrigger>
        </TabsList>

        {/* 目标列表 */}
        <TabsContent value="goals" className="space-y-4">
          {/* 筛选 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索目标名称..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="习惯类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    {(Object.keys(habitCategoryNames) as HabitCategory[]).map(cat => (
                      <SelectItem key={cat} value={cat}>{habitCategoryNames[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 目标卡片 */}
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredGoals.map((goal) => {
              const Icon = habitIcons[goal.category];
              return (
                <Card key={goal.id} className={`border-0 shadow-md hover:shadow-lg transition-all ${
                  goal.status === 'completed' ? 'bg-green-50/50' : ''
                }`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${habitCategoryColors[goal.category]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{goal.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{habitCategoryNames[goal.category]}</span>
                            <span>·</span>
                            <span>{goal.target}</span>
                          </div>
                        </div>
                      </div>
                      {goal.status === 'completed' ? (
                        <Badge className="bg-green-100 text-green-700">已完成</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700">进行中</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">完成进度</span>
                        <span className="font-medium">{goal.completed}/{goal.students} 人</span>
                      </div>
                      <Progress value={goal.rate} className="h-2" />
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${
                          goal.rate >= 80 ? 'text-green-600' :
                          goal.rate >= 60 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {goal.rate}%
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>截止: {goal.deadline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Users className="h-4 w-4" />
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 目标模板 */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {templatesData.map((template) => {
              const Icon = habitIcons[template.category];
              return (
                <Card key={template.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${habitCategoryColors[template.category]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            <Target className="inline h-4 w-4 mr-1" />
                            {template.goals} 个目标
                          </span>
                          <span className="text-gray-500">
                            <Users className="inline h-4 w-4 mr-1" />
                            {template.usage} 次使用
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        使用
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* 创建新模板 */}
            <Card className="border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-purple-50 mb-4">
                  <Plus className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">创建新模板</h3>
                <p className="text-sm text-gray-500">创建可复用的小目标模板</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 创建目标弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>创建小目标</DialogTitle>
            <DialogDescription>
              为学生创建新的习惯养成小目标
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>目标名称</Label>
              <Input placeholder="例如：每天阅读30分钟" className="mt-1.5" />
            </div>
            <div>
              <Label>所属习惯类别</Label>
              <Select>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="选择习惯类别" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(habitCategoryNames) as HabitCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>{habitCategoryNames[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>目标要求</Label>
              <Input placeholder="例如：连续30天" className="mt-1.5" />
            </div>
            <div>
              <Label>截止日期</Label>
              <Input type="date" className="mt-1.5" />
            </div>
            <div>
              <Label>适用对象</Label>
              <Select>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="选择适用对象" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全校学生</SelectItem>
                  <SelectItem value="grade">指定年级</SelectItem>
                  <SelectItem value="class">指定班级</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button onClick={() => setShowCreateDialog(false)}>创建目标</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
