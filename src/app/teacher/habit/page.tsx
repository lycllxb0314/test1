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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Users,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Eye,
  MessageSquare,
} from 'lucide-react';
import {
  HabitCategory,
  habitCategoryNames,
  habitCategoryColors,
} from '@/types';

// 习惯类别图标
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

// 模拟班级学生
const mockStudents = [
  { id: 's001', name: '张小明', avatar: '', habitRate: 88.5, trend: 'up', habitStar: true, goals: 5, achieved: 4 },
  { id: 's002', name: '李小红', avatar: '', habitRate: 92.3, trend: 'up', habitStar: true, goals: 6, achieved: 6 },
  { id: 's003', name: '王小刚', avatar: '', habitRate: 78.2, trend: 'stable', habitStar: false, goals: 5, achieved: 3 },
  { id: 's004', name: '赵小芳', avatar: '', habitRate: 85.6, trend: 'up', habitStar: false, goals: 5, achieved: 4 },
  { id: 's005', name: '刘小伟', avatar: '', habitRate: 72.1, trend: 'down', habitStar: false, goals: 5, achieved: 2 },
  { id: 's006', name: '陈小丽', avatar: '', habitRate: 90.8, trend: 'up', habitStar: true, goals: 6, achieved: 5 },
  { id: 's007', name: '吴小强', avatar: '', habitRate: 68.5, trend: 'stable', habitStar: false, goals: 5, achieved: 2 },
  { id: 's008', name: '周小燕', avatar: '', habitRate: 86.3, trend: 'up', habitStar: false, goals: 5, achieved: 4 },
];

// 需关注学生
const attentionStudents = mockStudents.filter(s => s.habitRate < 75);

// 待审核的小目标
const pendingReviews = [
  { id: 'pr001', studentName: '张小明', month: '2024-03', goals: 5, achieved: 4, parentSigned: true },
  { id: 'pr002', studentName: '李小红', month: '2024-03', goals: 6, achieved: 6, parentSigned: true },
];

export default function TeacherHabitPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-7 w-7 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">习惯养成</h1>
            <Badge className="bg-green-100 text-green-700">班级德育</Badge>
          </div>
          <p className="text-gray-500 mt-1">四年级(1)班 · 八大行为习惯管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowReviewDialog(true)}>
            <CheckCircle className="h-4 w-4" />
            待审核 ({pendingReviews.length})
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            添加评价
          </Button>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{mockStudents.length}</p>
            <p className="text-xs text-gray-500">学生人数</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">85.2%</p>
            <p className="text-xs text-gray-500">平均达成率</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{mockStudents.filter(s => s.habitStar).length}</p>
            <p className="text-xs text-gray-500">习惯之星</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{mockStudents.filter(s => s.trend === 'up').length}</p>
            <p className="text-xs text-gray-500">进步人数</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{attentionStudents.length}</p>
            <p className="text-xs text-gray-500">需关注</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="overview">班级概览</TabsTrigger>
          <TabsTrigger value="students">学生管理</TabsTrigger>
          <TabsTrigger value="goals">小目标审核</TabsTrigger>
        </TabsList>

        {/* 班级概览 */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 八大习惯班级雷达 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">班级习惯雷达</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => {
                    const Icon = habitIcons[cat];
                    const avg = Math.floor(70 + Math.random() * 25);
                    return (
                      <div key={cat} className="text-center p-2">
                        <div className={`p-2 rounded-lg ${habitCategoryColors[cat]} inline-flex mb-1`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs text-gray-500">{habitCategoryNames[cat]}</p>
                        <p className={`font-bold ${avg >= 85 ? 'text-green-600' : avg >= 75 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {avg}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 需关注学生 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  需关注学生
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attentionStudents.length > 0 ? (
                  <div className="space-y-2">
                    {attentionStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100"
                        onClick={() => { setSelectedStudent(student); setShowStudentDialog(true); }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-orange-200 text-orange-700 text-xs">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-gray-500">达成率 {student.habitRate}%</p>
                        </div>
                        {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">暂无需要特别关注的学生</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 本月习惯之星 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                本月习惯之星
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {mockStudents.filter(s => s.habitStar).map((student, idx) => (
                  <div key={student.id} className="flex items-center gap-2 bg-white rounded-lg px-4 py-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.habitRate}%</p>
                    </div>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 学生管理 */}
        <TabsContent value="students" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">学生习惯档案</CardTitle>
                <Input placeholder="搜索学生..." className="w-48 h-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setSelectedStudent(student); setShowStudentDialog(true); }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.name}</span>
                        {student.habitStar && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        {student.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>小目标 {student.achieved}/{student.goals}</span>
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={student.habitRate} className="h-2" />
                    </div>
                    <span className={`font-medium w-14 text-right ${
                      student.habitRate >= 85 ? 'text-green-600' :
                      student.habitRate >= 75 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {student.habitRate}%
                    </span>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 小目标审核 */}
        <TabsContent value="goals" className="mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">待审核的小目标</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{review.studentName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{review.studentName}</p>
                      <p className="text-sm text-gray-500">
                        {review.month} · 达成 {review.achieved}/{review.goals} 项目标
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.parentSigned ? (
                        <Badge className="bg-green-100 text-green-700">家长已签字</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500">待家长签字</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        审核
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 学生详情对话框 */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name} · 习惯档案</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-green-100 text-green-700 text-xl">
                    {selectedStudent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{selectedStudent.name}</p>
                    {selectedStudent.habitStar && <Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-sm text-gray-500">四年级(1)班</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedStudent.habitRate}%</p>
                  <p className="text-xs text-gray-500">总体达成率</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedStudent.achieved}/{selectedStudent.goals}</p>
                  <p className="text-xs text-gray-500">月度目标</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>各习惯得分</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => {
                    const Icon = habitIcons[cat];
                    const score = Math.floor(65 + Math.random() * 30);
                    return (
                      <div key={cat} className="text-center p-2 border rounded">
                        <div className={`p-1 rounded ${habitCategoryColors[cat]} inline-flex mb-1`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <p className="text-xs text-gray-500">{habitCategoryNames[cat]}</p>
                        <p className="font-bold text-sm">{score}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStudentDialog(false)}>关闭</Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              家校沟通
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加评价对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加习惯评价</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择学生</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger>
                <SelectContent>
                  {mockStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>习惯类别</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择类别" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(habitCategoryNames) as HabitCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>{habitCategoryNames[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>评价内容</Label>
              <Textarea placeholder="描述学生的行为表现..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-green-600 hover:bg-green-700">提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审核对话框 */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>小目标审核</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">审核说明</p>
              <p className="text-sm text-gray-600">
                审核学生月度小目标达成情况，确认是否评选为"习惯之星"。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>稍后处理</Button>
            <Button className="bg-green-600 hover:bg-green-700">开始审核</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
