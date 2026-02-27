'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  Star,
  Heart,
  Pen,
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Palette,
  Hammer,
  Plus,
  Check,
  X,
  Edit,
  Eye,
  Users,
  Clock,
  Award,
  Target,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
  StudentMonthlyGoal,
  MonthlyGoalItem,
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

// 模拟月度小目标数据
const mockMonthlyGoals: StudentMonthlyGoal[] = [
  {
    id: 'mg001',
    studentId: 's001', studentName: '张小明', classId: 'c001', className: '四年级(1)班', grade: 4,
    month: '2024-03',
    goals: [
      {
        id: 'g001', category: 'civilization', goalId: 'C01', title: '每天主动问好',
        description: '见到老师、同学、保安叔叔主动问好',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: Math.random() > 0.1,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 20:00`,
        })),
        totalDays: 22, achievedDays: 20, achievementRate: 91, isAchieved: true,
      },
      {
        id: 'g002', category: 'reading', goalId: 'R01', title: '每日阅读30分钟',
        description: '坚持每天阅读课外书籍30分钟',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: Math.random() > 0.15,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 21:00`,
        })),
        totalDays: 22, achievedDays: 19, achievementRate: 86, isAchieved: true,
      },
      {
        id: 'g003', category: 'sports', goalId: 'S01', title: '每天运动1小时',
        description: '保证每天运动时间不少于1小时',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: Math.random() > 0.2,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 19:00`,
        })),
        totalDays: 22, achievedDays: 18, achievementRate: 82, isAchieved: true,
      },
      {
        id: 'g004', category: 'writing', goalId: 'W01', title: '书写工整',
        description: '作业书写工整，字迹清晰',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: Math.random() > 0.25,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 18:00`,
        })),
        totalDays: 22, achievedDays: 17, achievementRate: 77, isAchieved: false,
      },
      {
        id: 'g005', category: 'hygiene', goalId: 'H01', title: '整理书包',
        description: '每天睡前整理好书包和书桌',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: Math.random() > 0.1,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 21:30`,
        })),
        totalDays: 22, achievedDays: 20, achievementRate: 91, isAchieved: true,
      },
      {
        id: 'g006', category: 'labor', goalId: 'L01', title: '做家务',
        description: '每周帮助父母做2次以上家务',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: i % 3 === 0 || i % 4 === 0,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 22:00`,
        })),
        totalDays: 22, achievedDays: 12, achievementRate: 55, isAchieved: false,
      },
      {
        id: 'g007', category: 'safety', goalId: 'SA01', title: '安全意识',
        description: '遵守交通规则，不追逐打闹',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: true,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 20:00`,
        })),
        totalDays: 22, achievedDays: 22, achievementRate: 100, isAchieved: true,
      },
      {
        id: 'g008', category: 'aesthetic', goalId: 'A01', title: '艺术欣赏',
        description: '每周欣赏一首名曲或一幅名画',
        records: Array.from({ length: 22 }, (_, i) => ({
          date: `2024-03-${String(i + 1).padStart(2, '0')}`,
          achieved: i % 7 === 0,
          recordedBy: 'parent' as const,
          recordedAt: `2024-03-${String(i + 1).padStart(2, '0')} 20:00`,
        })),
        totalDays: 22, achievedDays: 4, achievementRate: 18, isAchieved: false,
      },
    ],
    parentSignature: '王小明（家长）',
    parentEvaluation: '本月孩子在文明习惯和安全习惯方面表现很好，阅读和运动习惯也在逐步养成，书写和审美习惯还需加强。',
    teacherReview: '张小明同学本月整体表现良好，建议继续坚持阅读和运动习惯，书写方面需要加强练习。',
    isHabitStar: true,
    totalGoals: 8, achievedGoals: 5, achievementRate: 62.5,
    createdAt: '2024-03-01 08:00', updatedAt: '2024-03-22 18:00',
  },
];

// 习惯目标库（根据PDF内容）
const habitGoalLibrary: Record<HabitCategory, { code: string; title: string; description: string }[]> = {
  civilization: [
    { code: 'C01', title: '主动问好', description: '见到老师、同学、保安叔叔主动问好' },
    { code: 'C02', title: '乐于助人', description: '主动帮助有需要的人' },
    { code: 'C03', title: '诚实守信', description: '不说谎，答应的事要做到' },
    { code: 'C04', title: '尊重劳动', description: '珍惜他人劳动成果，不浪费' },
    { code: 'C05', title: '网络文明', description: '文明上网，不传播不良信息' },
  ],
  writing: [
    { code: 'W01', title: '书写工整', description: '作业书写工整，字迹清晰' },
    { code: 'W02', title: '姿势正确', description: '保持正确的读写姿势' },
    { code: 'W03', title: '自觉练字', description: '每天坚持练字15分钟' },
  ],
  reading: [
    { code: 'R01', title: '每日阅读', description: '坚持每天阅读课外书籍30分钟' },
    { code: 'R02', title: '阅读推荐', description: '向同学推荐一本好书并说明理由' },
    { code: 'R03', title: '读后感', description: '每月撰写一篇读后感' },
    { code: 'R04', title: '背诵积累', description: '每周背诵一首古诗或一篇美文' },
  ],
  sports: [
    { code: 'S01', title: '每日运动', description: '保证每天运动时间不少于1小时' },
    { code: 'S02', title: '跳绳练习', description: '每天跳绳200个以上' },
    { code: 'S03', title: '专项爱好', description: '坚持一项体育运动爱好' },
  ],
  safety: [
    { code: 'SA01', title: '安全意识', description: '遵守交通规则，不追逐打闹' },
    { code: 'SA02', title: '网络安全', description: '控制上网时间，不轻信网络信息' },
    { code: 'SA03', title: '自我保护', description: '学会基本的自我保护方法' },
  ],
  hygiene: [
    { code: 'H01', title: '整理物品', description: '每天整理书包和书桌' },
    { code: 'H02', title: '个人卫生', description: '勤洗手、勤剪指甲' },
    { code: 'H03', title: '作息规律', description: '按时作息，保证充足睡眠' },
  ],
  aesthetic: [
    { code: 'A01', title: '艺术欣赏', description: '每周欣赏一首名曲或一幅名画' },
    { code: 'A02', title: '创意设计', description: '参与班级板报或海报设计' },
    { code: 'A03', title: '艺术表达', description: '学习一种艺术表达方式' },
  ],
  labor: [
    { code: 'L01', title: '做家务', description: '每周帮助父母做2次以上家务' },
    { code: 'L02', title: '班级值日', description: '认真完成班级值日工作' },
    { code: 'L03', title: '生活技能', description: '学习一项生活技能' },
  ],
};

export default function HabitGoalsPage() {
  const [currentMonth, setCurrentMonth] = useState('2024-03');
  const [selectedGoal, setSelectedGoal] = useState<StudentMonthlyGoal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [newGoalCategory, setNewGoalCategory] = useState<HabitCategory>('civilization');

  const currentGoal = mockMonthlyGoals[0];

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

  // 统计达成情况
  const stats = {
    total: currentGoal.goals.length,
    achieved: currentGoal.goals.filter(g => g.isAchieved).length,
    rate: currentGoal.achievementRate,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-7 w-7 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">小目标促成长</h1>
          </div>
          <p className="text-gray-500 mt-1">每月制定习惯小目标，坚持记录成长足迹</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2" onClick={() => setShowAddGoalDialog(true)}>
          <Plus className="h-4 w-4" />
          制定新目标
        </Button>
      </div>

      {/* 月份切换 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => changeMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-xl font-bold">{currentMonth.split('-')[0]}年{parseInt(currentMonth.split('-')[1])}月</p>
                <p className="text-sm text-gray-500">
                  {currentGoal.studentName} · {currentGoal.className}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={() => changeMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.achieved}/{stats.total}</p>
                <p className="text-xs text-gray-500">达成目标</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.rate}%</p>
                <p className="text-xs text-gray-500">整体达成率</p>
              </div>
              {currentGoal.isHabitStar && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">习惯之星</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：目标列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 八个习惯小目标卡片 */}
          <div className="grid gap-4 md:grid-cols-2">
            {currentGoal.goals.map((goal) => {
              const Icon = habitIcons[goal.category];
              return (
                <Card
                  key={goal.id}
                  className={`border-0 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                    goal.isAchieved ? 'ring-2 ring-green-400' : ''
                  }`}
                  onClick={() => { setSelectedGoal(currentGoal); setShowDetailDialog(true); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${habitCategoryColors[goal.category]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{goal.title}</span>
                          {goal.isAchieved ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{goal.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${goal.isAchieved ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${goal.achievementRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{goal.achievementRate}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          达标 {goal.achievedDays}/{goal.totalDays} 天
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 过程记录详情 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                过程记载
              </CardTitle>
              <CardDescription>每日记录达标情况（☆达标，△未达标）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentGoal.goals.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{goal.title}</span>
                      <Badge className={
                        goal.isAchieved ? 'bg-green-100 text-green-700 text-xs' : 'bg-orange-100 text-orange-700 text-xs'
                      }>
                        {goal.isAchieved ? '已达成' : '未达成'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {goal.records.slice(0, 22).map((record, idx) => (
                        <div
                          key={idx}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                            record.achieved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                          title={`${record.date}: ${record.achieved ? '达标' : '未达标'}`}
                        >
                          {record.achieved ? '☆' : '△'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：评价与审核 */}
        <div className="space-y-6">
          {/* 达成统计 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">本月达成情况</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* 按类别统计 */}
                {currentGoal.goals.map((goal) => {
                  const Icon = habitIcons[goal.category];
                  return (
                    <div key={goal.id} className="flex items-center gap-2">
                      <div className={`p-1 rounded ${habitCategoryColors[goal.category]}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm flex-1">{goal.title}</span>
                      <span className={`text-sm font-medium ${goal.isAchieved ? 'text-green-600' : 'text-orange-600'}`}>
                        {goal.achievementRate}%
                      </span>
                      {goal.isAchieved ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 家长评价 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                家长评价
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentGoal.parentEvaluation ? (
                <div>
                  <p className="text-sm text-gray-700 mb-2">{currentGoal.parentEvaluation}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>家长签名：{currentGoal.parentSignature}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">家长尚未评价</p>
              )}
            </CardContent>
          </Card>

          {/* 班主任审核 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                班主任审核
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentGoal.teacherReview ? (
                <div>
                  <p className="text-sm text-gray-700 mb-3">{currentGoal.teacherReview}</p>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={currentGoal.isHabitStar} />
                    <span className="text-sm">评为月度"习惯之星"</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea placeholder="填写班主任评价..." rows={3} />
                  <div className="flex items-center gap-2">
                    <Checkbox />
                    <span className="text-sm">评为月度"习惯之星"</span>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">提交审核</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <p className="text-sm text-gray-600">本月达成率</p>
                <p className="text-3xl font-bold text-purple-600">{stats.rate}%</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  查看历史
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  编辑目标
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 制定新目标对话框 */}
      <Dialog open={showAddGoalDialog} onOpenChange={setShowAddGoalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>制定本月小目标</DialogTitle>
            <DialogDescription>从八个习惯中选择并制定本月的成长目标</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => {
                const Icon = habitIcons[cat];
                const isSelected = newGoalCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setNewGoalCategory(cat)}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
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
              <Label>选择目标</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择预设目标" />
                </SelectTrigger>
                <SelectContent>
                  {habitGoalLibrary[newGoalCategory].map((goal) => (
                    <SelectItem key={goal.code} value={goal.code}>
                      <div>
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-xs text-gray-500 ml-2">{goal.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button variant="outline" onClick={() => setShowAddGoalDialog(false)}>取消</Button>
            <Button className="bg-purple-600 hover:bg-purple-700">添加目标</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
