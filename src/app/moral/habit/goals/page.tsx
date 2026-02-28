'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Eye,
  Search,
  Users,
  Calendar,
  Download,
  GraduationCap,
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

// 模拟小目标实例数据
const goalsData = [
  { 
    id: 'g001', 
    name: '每天阅读30分钟', 
    category: 'reading' as HabitCategory, 
    target: '连续30天', 
    deadline: '2024-04-15', 
    publisher: '王老师',
    grade: '三年级',
    className: '三(1)班',
    students: 45, 
    completed: 38, 
    rate: 84.4, 
    status: 'active',
    startDate: '2024-03-15',
  },
  { 
    id: 'g002', 
    name: '规范书写姿势', 
    category: 'writing' as HabitCategory, 
    target: '每日练习', 
    deadline: '2024-04-30', 
    publisher: '李老师',
    grade: '二年级',
    className: '二(3)班',
    students: 42, 
    completed: 25, 
    rate: 59.5, 
    status: 'active',
    startDate: '2024-03-01',
  },
  { 
    id: 'g003', 
    name: '课间文明游戏', 
    category: 'civilization' as HabitCategory, 
    target: '每周5次', 
    deadline: '2024-03-31', 
    publisher: '张老师',
    grade: '一年级',
    className: '一(2)班',
    students: 40, 
    completed: 36, 
    rate: 90.0, 
    status: 'completed',
    startDate: '2024-03-01',
  },
  { 
    id: 'g004', 
    name: '坚持体育锻炼', 
    category: 'sports' as HabitCategory, 
    target: '每日1小时', 
    deadline: '2024-05-01', 
    publisher: '陈老师',
    grade: '四年级',
    className: '四(5)班',
    students: 43, 
    completed: 30, 
    rate: 69.8, 
    status: 'active',
    startDate: '2024-04-01',
  },
  { 
    id: 'g005', 
    name: '保持个人卫生', 
    category: 'hygiene' as HabitCategory, 
    target: '每日检查', 
    deadline: '2024-04-20', 
    publisher: '刘老师',
    grade: '全校',
    className: '全校',
    students: 1896, 
    completed: 1706, 
    rate: 89.9, 
    status: 'active',
    startDate: '2024-03-20',
  },
  { 
    id: 'g006', 
    name: '参与劳动实践', 
    category: 'labor' as HabitCategory, 
    target: '每周2次', 
    deadline: '2024-04-25', 
    publisher: '赵老师',
    grade: '五年级',
    className: '五(1)班',
    students: 44, 
    completed: 31, 
    rate: 70.5, 
    status: 'active',
    startDate: '2024-03-25',
  },
];

// 年级数据
const grades = ['全部', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '全校'];

export default function GoalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('全部');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // 过滤目标
  const filteredGoals = goalsData.filter(goal => {
    if (searchQuery && !goal.name.includes(searchQuery)) {
      return false;
    }
    if (selectedCategory !== 'all' && goal.category !== selectedCategory) {
      return false;
    }
    if (selectedGrade !== '全部' && goal.grade !== selectedGrade) {
      return false;
    }
    if (selectedStatus !== 'all' && goal.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // 统计数据
  const stats = {
    totalGoals: goalsData.length,
    activeGoals: goalsData.filter(g => g.status === 'active').length,
    completedGoals: goalsData.filter(g => g.status === 'completed').length,
    totalStudents: goalsData.reduce((sum, g) => sum + g.students, 0),
    avgCompletion: (goalsData.reduce((sum, g) => sum + g.rate, 0) / goalsData.length).toFixed(1),
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
            <p className="text-gray-500 mt-0.5">查看全校小目标发布与完成情况</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            导出数据
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
            <div className="text-sm text-gray-500">参与学生人次</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avgCompletion}%</div>
            <div className="text-sm text-gray-500">平均完成率</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选区域 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
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
              <SelectTrigger className="w-36">
                <SelectValue placeholder="习惯类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                {(Object.keys(habitCategoryNames) as HabitCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>{habitCategoryNames[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="年级" />
              </SelectTrigger>
              <SelectContent>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500">
              共 {filteredGoals.length} 个目标
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 目标列表 */}
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

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    {goal.grade}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {goal.className}
                  </span>
                  <span>发布人: {goal.publisher}</span>
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
                    <Eye className="h-4 w-4" />
                    查看详情
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无符合条件的小目标</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
