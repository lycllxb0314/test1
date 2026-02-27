'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Users,
  Calendar,
  FileText,
  Video,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  BookOpen,
  Upload,
  Download,
  Eye,
  Edit,
  Plus,
  ChevronRight,
  Mic,
  BookMarked,
  Target,
  Lightbulb,
  AlertCircle,
  Star,
  BarChart3,
  Award,
  Play,
  ThumbsUp,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

// 模拟备课组
const mockLessonGroups = [
  { id: 'lg001', name: '四年级语文备课组', subject: '语文', members: 4, leader: '王老师' },
  { id: 'lg002', name: '四年级数学备课组', subject: '数学', members: 3, leader: '刘老师' },
];

// 模拟备课活动
const mockLessonActivities = [
  {
    id: 'la001', groupId: 'lg001', topic: '《草原》集体备课', lesson: '草原', unit: '第一单元',
    mainPreparer: '王老师', mainSpeaker: '李老师', date: '2024-03-20', status: 'completed',
    participants: 4, resources: 3, conclusions: ['重点：感受草原美景', '难点：理解作者情感'],
  },
  {
    id: 'la002', groupId: 'lg001', topic: '《古诗词三首》集体备课', lesson: '古诗词三首', unit: '第一单元',
    mainPreparer: '李老师', mainSpeaker: '张老师', date: '2024-03-25', status: 'in_progress',
    participants: 4, resources: 1, conclusions: [],
  },
  {
    id: 'la003', groupId: 'lg001', topic: '《白鹅》集体备课', lesson: '白鹅', unit: '第二单元',
    mainPreparer: '张老师', mainSpeaker: '赵老师', date: '2024-03-28', status: 'scheduled',
    participants: 4, resources: 0, conclusions: [],
  },
];

// 评价维度
const evaluationDimensions = [
  { id: 'objective', name: '教学目标', maxScore: 20 },
  { id: 'content', name: '教学内容', maxScore: 20 },
  { id: 'method', name: '教学方法', maxScore: 20 },
  { id: 'quality', name: '教师素养', maxScore: 20 },
  { id: 'effect', name: '教学效果', maxScore: 20 },
];

// 模拟听课记录
const mockObservations = [
  {
    id: 'obs001', teacherName: '李老师', subject: '语文', lesson: '《草原》',
    observerName: '王老师', date: '2024-03-18', type: 'regular', status: 'completed',
    totalScore: 90, scores: { objective: 18, content: 19, method: 17, quality: 18, effect: 18 },
  },
  {
    id: 'obs002', teacherName: '赵老师', subject: '语文', lesson: '《古诗词三首》',
    observerName: '王老师', date: '2024-03-20', type: 'guidance', status: 'completed',
    totalScore: 80, scores: { objective: 16, content: 17, method: 15, quality: 16, effect: 16 },
  },
  {
    id: 'obs003', teacherName: '张老师', subject: '语文', lesson: '《白鹅》',
    observerName: '王老师', date: '2024-03-22', type: 'demonstration', status: 'scheduled',
    totalScore: null, scores: null,
  },
];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState('planning');
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [showObservationDialog, setShowObservationDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<typeof mockLessonActivities[0] | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<typeof mockObservations[0] | null>(null);

  const activityStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    scheduled: { label: '待开展', color: 'bg-blue-100 text-blue-700', icon: Clock },
    in_progress: { label: '进行中', color: 'bg-amber-100 text-amber-700', icon: Mic },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  };

  const observationTypeConfig: Record<string, { label: string; color: string }> = {
    regular: { label: '常规听课', color: 'bg-blue-100 text-blue-700' },
    guidance: { label: '指导听课', color: 'bg-purple-100 text-purple-700' },
    demonstration: { label: '示范课', color: 'bg-amber-100 text-amber-700' },
    open: { label: '公开课', color: 'bg-green-100 text-green-700' },
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">教研活动</h1>
            <Badge className="bg-teal-100 text-teal-700">智慧教研</Badge>
          </div>
          <p className="text-gray-500 mt-1">集体备课协同 · 听课评课管理 · 教研成果共享</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowObservationDialog(true)}>
            <Plus className="h-4 w-4" />
            预约听课
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setShowPlanningDialog(true)}>
            <Plus className="h-4 w-4" />
            发起备课
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-teal-600">{mockLessonGroups.length}</p>
            <p className="text-xs text-gray-500">备课组</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{mockLessonActivities.filter(a => a.status === 'completed').length}</p>
            <p className="text-xs text-gray-500">已完成备课</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{mockObservations.filter(o => o.status === 'completed').length}</p>
            <p className="text-xs text-gray-500">听课记录</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {mockObservations.filter(o => o.totalScore !== null).reduce((sum, o) => sum + (o.totalScore || 0), 0) / mockObservations.filter(o => o.totalScore !== null).length || 0}
            </p>
            <p className="text-xs text-gray-500">平均评分</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="planning">集体备课</TabsTrigger>
          <TabsTrigger value="observation">听课评课</TabsTrigger>
        </TabsList>

        {/* 集体备课 */}
        <TabsContent value="planning" className="mt-4 space-y-4">
          {/* 备课组选择 */}
          <div className="flex gap-3">
            {mockLessonGroups.map((group) => (
              <button
                key={group.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-teal-500 bg-teal-50 shadow-md"
              >
                <div className="p-2 rounded-lg bg-teal-100">
                  <BookOpen className="h-4 w-4 text-teal-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{group.name}</p>
                  <p className="text-xs text-gray-500">{group.members}人 · 组长：{group.leader}</p>
                </div>
              </button>
            ))}
          </div>

          {/* 备课活动列表 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">备课活动</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLessonActivities.map((activity) => {
                  const status = activityStatusConfig[activity.status];
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={activity.id}
                      className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer"
                      onClick={() => { setSelectedActivity(activity); setShowPlanningDialog(true); }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-teal-100">
                          <BookMarked className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{activity.topic}</span>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {activity.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              主备：{activity.mainPreparer}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {activity.participants}人参与
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {activity.resources}份资源
                            </span>
                          </div>
                          {activity.conclusions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {activity.conclusions.map((c, idx) => (
                                <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 听课评课 */}
        <TabsContent value="observation" className="mt-4 space-y-4">
          {/* 统计 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  评分分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['95-100', '90-94', '85-89', '80-84', '<80'].map((range, idx) => (
                    <div key={range} className="flex items-center gap-2">
                      <span className="text-xs w-14 text-gray-500">{range}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-purple-500 rounded-full h-3"
                          style={{ width: `${[20, 35, 25, 15, 5][idx]}%` }}
                        />
                      </div>
                      <span className="text-xs w-6">{[3, 5, 4, 2, 1][idx]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-500" />
                  维度评分
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {evaluationDimensions.map((dim) => {
                    const avg = 17 + Math.random() * 2;
                    return (
                      <div key={dim.id} className="flex items-center gap-2">
                        <span className="text-xs w-16 text-gray-500">{dim.name}</span>
                        <Progress value={avg} max={dim.maxScore} className="flex-1 h-1.5" />
                        <span className="text-xs font-medium text-indigo-600">{avg.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 听课记录 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">听课记录</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="regular">常规</SelectItem>
                      <SelectItem value="guidance">指导</SelectItem>
                      <SelectItem value="demonstration">示范</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockObservations.map((obs) => {
                  const type = observationTypeConfig[obs.type];
                  return (
                    <div
                      key={obs.id}
                      className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer"
                      onClick={() => { setSelectedObservation(obs); setShowObservationDialog(true); }}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">
                            {obs.teacherName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{obs.teacherName}</span>
                            <Badge className={type.color}>{type.label}</Badge>
                            {obs.totalScore !== null && (
                              <div className="flex items-center gap-1 ml-auto">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span className="font-bold text-amber-600">{obs.totalScore}分</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{obs.lesson}</span>
                            <span>{obs.date}</span>
                            <span>听课人：{obs.observerName}</span>
                          </div>
                          {obs.scores && (
                            <div className="flex gap-3 mt-2">
                              {Object.entries(obs.scores).map(([key, value]) => {
                                const dim = evaluationDimensions.find(d => d.id === key);
                                return (
                                  <span key={key} className="text-xs text-gray-400">
                                    {dim?.name}:{value}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 发起备课对话框 */}
      <Dialog open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发起集体备课</DialogTitle>
            <DialogDescription>创建新的集体备课活动</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>备课组</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择备课组" /></SelectTrigger>
                  <SelectContent>
                    {mockLessonGroups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>单元</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择单元" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit1">第一单元</SelectItem>
                    <SelectItem value="unit2">第二单元</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>课题</Label>
              <Input placeholder="如：草原" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主备人</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t1">王老师</SelectItem>
                    <SelectItem value="t2">李老师</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>主讲人</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t1">王老师</SelectItem>
                    <SelectItem value="t2">李老师</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>活动时间</Label>
              <Input type="datetime-local" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanningDialog(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700">创建活动</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预约听课对话框 */}
      <Dialog open={showObservationDialog} onOpenChange={setShowObservationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>预约听课</DialogTitle>
            <DialogDescription>创建新的听课活动</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>授课教师</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="选择教师" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="t1">李老师</SelectItem>
                  <SelectItem value="t2">张老师</SelectItem>
                  <SelectItem value="t3">赵老师</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>课程</Label>
              <Input placeholder="如：《草原》" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>听课类型</Label>
                <Select>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">常规听课</SelectItem>
                    <SelectItem value="guidance">指导听课</SelectItem>
                    <SelectItem value="demonstration">示范课</SelectItem>
                    <SelectItem value="open">公开课</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>节次</Label>
                <Select>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">第1节</SelectItem>
                    <SelectItem value="2">第2节</SelectItem>
                    <SelectItem value="3">第3节</SelectItem>
                    <SelectItem value="4">第4节</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>听课日期</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObservationDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">预约听课</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
