'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Camera,
  Filter,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
  HabitAssessment,
  StudentHabitProfile,
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

// 模拟学生习惯档案数据
const mockStudentProfile: StudentHabitProfile = {
  studentId: 's001',
  studentName: '张小明',
  classId: 'c001',
  className: '四年级(1)班',
  grade: 4,
  categoryScores: [
    { category: 'civilization', score: 92, maxScore: 100, rate: 92, trend: 'up' },
    { category: 'writing', score: 88, maxScore: 100, rate: 88, trend: 'stable' },
    { category: 'reading', score: 95, maxScore: 100, rate: 95, trend: 'up' },
    { category: 'sports', score: 85, maxScore: 100, rate: 85, trend: 'up' },
    { category: 'safety', score: 90, maxScore: 100, rate: 90, trend: 'stable' },
    { category: 'hygiene', score: 87, maxScore: 100, rate: 87, trend: 'up' },
    { category: 'aesthetic', score: 82, maxScore: 100, rate: 82, trend: 'stable' },
    { category: 'labor', score: 91, maxScore: 100, rate: 91, trend: 'up' },
  ],
  totalScore: 710,
  totalMaxScore: 800,
  overallRate: 88.75,
  level: '良好',
  habitStarCount: 3,
  monthlyStars: ['2024-01', '2024-02', '2024-03'],
  monthlyTrend: [
    { month: '2023-09', rate: 78 },
    { month: '2023-10', rate: 82 },
    { month: '2023-11', rate: 85 },
    { month: '2023-12', rate: 84 },
    { month: '2024-01', rate: 87 },
    { month: '2024-02', rate: 88 },
    { month: '2024-03', rate: 89 },
  ],
  highlights: [
    { category: 'reading', description: '本学期阅读量达15本，撰写读后感8篇' },
    { category: 'civilization', description: '主动参与社区志愿服务3次' },
  ],
  improvements: [
    { category: 'aesthetic', suggestion: '建议增加艺术鉴赏活动参与' },
  ],
  updatedAt: '2024-03-15',
};

// 模拟评价记录
const mockAssessments: HabitAssessment[] = [
  {
    id: 'a001',
    studentId: 's001', studentName: '张小明', classId: 'c001', className: '四年级(1)班',
    category: 'reading', type: 'praise', title: '阅读之星',
    content: '主动向同学推荐《三国演义》，分享精彩片段',
    score: 5, scene: 'classroom',
    recorderId: 't001', recorderName: '王老师', recorderRole: 'teacher',
    occurredAt: '2024-03-15 10:30', createdAt: '2024-03-15 10:35',
  },
  {
    id: 'a002',
    studentId: 's001', studentName: '张小明', classId: 'c001', className: '四年级(1)班',
    category: 'civilization', type: 'praise', title: '乐于助人',
    content: '主动帮助低年级同学捡起掉落的物品',
    score: 3, scene: 'campus',
    recorderId: 't002', recorderName: '李老师', recorderRole: 'teacher',
    occurredAt: '2024-03-14 14:20', createdAt: '2024-03-14 14:25',
  },
  {
    id: 'a003',
    studentId: 's001', studentName: '张小明', classId: 'c001', className: '四年级(1)班',
    category: 'writing', type: 'improve', title: '书写需加强',
    content: '作业书写不够工整，建议加强练字',
    score: -2, scene: 'classroom',
    recorderId: 't001', recorderName: '王老师', recorderRole: 'teacher',
    occurredAt: '2024-03-13 11:00', createdAt: '2024-03-13 11:05',
  },
  {
    id: 'a004',
    studentId: 's001', studentName: '张小明', classId: 'c001', className: '四年级(1)班',
    category: 'labor', type: 'praise', title: '劳动积极',
    content: '主动承担班级清洁工作，打扫干净整洁',
    score: 4, scene: 'classroom',
    recorderId: 't001', recorderName: '王老师', recorderRole: 'teacher',
    occurredAt: '2024-03-12 16:30', createdAt: '2024-03-12 16:35',
  },
];

// 班级习惯统计
const mockClassStats = {
  totalStudents: 45,
  averageRate: 85.2,
  habitStarCount: 5,
  topCategories: ['reading', 'civilization', 'labor'] as HabitCategory[],
  warningCount: 3,
};

export default function HabitAssessmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'praise' | 'improve'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentHabitProfile | null>(null);

  // 新评价表单
  const [assessmentForm, setAssessmentForm] = useState({
    category: 'civilization' as HabitCategory,
    type: 'praise' as 'praise' | 'improve',
    title: '',
    content: '',
    scene: 'classroom',
  });

  // 过滤评价记录
  const filteredAssessments = mockAssessments.filter(a => {
    const matchCategory = selectedCategory === 'all' || a.category === selectedCategory;
    const matchType = selectedType === 'all' || a.type === selectedType;
    return matchCategory && matchType;
  });

  // 统计表扬和待改进
  const stats = {
    praise: mockAssessments.filter(a => a.type === 'praise').length,
    improve: mockAssessments.filter(a => a.type === 'improve').length,
    totalScore: mockAssessments.reduce((sum, a) => sum + a.score, 0),
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-7 w-7 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">习惯养成评价</h1>
          </div>
          <p className="text-gray-500 mt-1">八大行为习惯养成评价与管理</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          添加评价
        </Button>
      </div>

      {/* 八大习惯概览 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            八大行为习惯
          </CardTitle>
          <CardDescription>基于学校德育特色，培养学生良好行为习惯</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {(Object.keys(habitCategoryNames) as HabitCategory[]).map((category) => {
              const Icon = habitIcons[category];
              const score = mockStudentProfile.categoryScores.find(s => s.category === category);
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
                    {score && (
                      <span className={`text-sm font-bold mt-1 ${
                        score.rate >= 90 ? 'text-green-600' : score.rate >= 80 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {score.rate}%
                      </span>
                    )}
                    {score?.trend === 'up' && (
                      <TrendingUp className="h-3 w-3 text-green-500 mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：学生档案 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 学生习惯档案卡片 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  学生习惯档案
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{mockStudentProfile.className}</span>
                  <Badge className="bg-blue-100 text-blue-700">{mockStudentProfile.level}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {mockStudentProfile.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{mockStudentProfile.studentName}</h3>
                      <p className="text-sm text-gray-500">
                        总评分 {mockStudentProfile.overallRate}% · 
                        习惯之星 × {mockStudentProfile.habitStarCount}
                      </p>
                    </div>
                  </div>

                  {/* 习惯得分条 */}
                  <div className="space-y-3">
                    {mockStudentProfile.categoryScores.map((score) => {
                      const Icon = habitIcons[score.category];
                      return (
                        <div key={score.category} className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${habitCategoryColors[score.category]}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm w-16 text-gray-600">{habitCategoryNames[score.category]}</span>
                          <Progress value={score.rate} className="flex-1 h-2" />
                          <span className="text-sm font-medium w-10 text-right">{score.rate}%</span>
                          {score.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : score.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 成长趋势 */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">本学期成长趋势</p>
                    <div className="flex items-end gap-1 h-12">
                      {mockStudentProfile.monthlyTrend.map((trend, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-green-400 to-green-500 rounded-t"
                          style={{ height: `${(trend.rate - 70) * 2}%` }}
                          title={`${trend.month}: ${trend.rate}%`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {mockStudentProfile.monthlyTrend.map((trend, idx) => (
                        <div key={idx} className="flex-1 text-center text-xs text-gray-400">
                          {trend.month.split('-')[1]}月
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 右侧：亮点与建议 */}
                <div className="w-48 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">突出表现</p>
                    {mockStudentProfile.highlights.map((h, idx) => (
                      <div key={idx} className="p-2 bg-green-50 rounded text-xs text-green-800 mb-2">
                        {h.description}
                      </div>
                    ))}
                  </div>
                  {mockStudentProfile.improvements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-700 mb-2">待改进</p>
                      {mockStudentProfile.improvements.map((im, idx) => (
                        <div key={idx} className="p-2 bg-orange-50 rounded text-xs text-orange-800">
                          {im.suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 评价记录列表 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  评价记录
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">表扬 {stats.praise}</Badge>
                  <Badge className="bg-orange-100 text-orange-700">待改进 {stats.improve}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 筛选 */}
              <div className="flex gap-2 mb-4">
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="praise">表扬</SelectItem>
                    <SelectItem value="improve">待改进</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 记录列表 */}
              <div className="space-y-3">
                {filteredAssessments.map((assessment) => {
                  const Icon = habitIcons[assessment.category];
                  return (
                    <div key={assessment.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`p-2 rounded-lg ${habitCategoryColors[assessment.category]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{assessment.title}</span>
                          <Badge className={
                            assessment.type === 'praise' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }>
                            {assessment.type === 'praise' ? '+' : ''}{assessment.score}分
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{assessment.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{habitCategoryNames[assessment.category]}</span>
                          <span>{assessment.recorderName}</span>
                          <span>{assessment.occurredAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：班级统计与快捷操作 */}
        <div className="space-y-6">
          {/* 班级统计 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">班级习惯统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{mockClassStats.totalStudents}</p>
                    <p className="text-xs text-gray-500">学生总数</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{mockClassStats.averageRate}%</p>
                    <p className="text-xs text-gray-500">平均达成率</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">本月习惯之星</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <span className="font-bold text-amber-600">{mockClassStats.habitStarCount}</span>
                    <span className="text-sm text-gray-500">人</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">优势习惯</p>
                  <div className="flex flex-wrap gap-1">
                    {mockClassStats.topCategories.map((cat) => (
                      <Badge key={cat} className={habitCategoryColors[cat]}>
                        {habitCategoryNames[cat]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {mockClassStats.warningCount > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {mockClassStats.warningCount} 名学生需关注
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 快捷入口 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-3 flex-col" asChild>
                  <a href="/moral/habit-goals">
                    <Calendar className="h-5 w-5 mb-1 text-purple-500" />
                    <span className="text-xs">小目标管理</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col" asChild>
                  <a href="/moral/habit-stars">
                    <Award className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs">习惯之星</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 习惯之星榜单 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                本月习惯之星
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['李小红', '王小明', '张小花'].map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-amber-600 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-medium text-sm">{name}</span>
                    <Badge className="bg-amber-100 text-amber-700 text-xs">全习惯</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加评价对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加习惯评价</DialogTitle>
            <DialogDescription>记录学生习惯养成的表扬或待改进事项</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>评价类型</Label>
              <div className="flex gap-2">
                <Button
                  variant={assessmentForm.type === 'praise' ? 'default' : 'outline'}
                  className={assessmentForm.type === 'praise' ? 'bg-green-600' : ''}
                  onClick={() => setAssessmentForm(prev => ({ ...prev, type: 'praise' }))}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  表扬
                </Button>
                <Button
                  variant={assessmentForm.type === 'improve' ? 'default' : 'outline'}
                  className={assessmentForm.type === 'improve' ? 'bg-orange-600' : ''}
                  onClick={() => setAssessmentForm(prev => ({ ...prev, type: 'improve' }))}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  待改进
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>习惯类别</Label>
              <Select value={assessmentForm.category} onValueChange={(v) => setAssessmentForm(prev => ({ ...prev, category: v as HabitCategory }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label>评价标题 *</Label>
              <Input
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="如：主动帮助同学、书写工整等"
              />
            </div>

            <div className="space-y-2">
              <Label>详细描述 *</Label>
              <Textarea
                value={assessmentForm.content}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="描述具体行为表现..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>发生场景</Label>
              <Select value={assessmentForm.scene} onValueChange={(v) => setAssessmentForm(prev => ({ ...prev, scene: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classroom">教室</SelectItem>
                  <SelectItem value="campus">校园</SelectItem>
                  <SelectItem value="home">家庭</SelectItem>
                  <SelectItem value="activity">活动</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
}
