'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  Video,
  Calendar,
  Star,
  Users,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Edit,
  Plus,
  ChevronRight,
  User,
  BookOpen,
  TrendingUp,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Award,
  ClipboardList,
  Target,
  Sparkles,
} from 'lucide-react';

// 评价维度配置
const evaluationDimensions = [
  {
    id: 'objective',
    name: '教学目标',
    description: '目标明确、具体、可达成，符合课程标准和学情',
    maxScore: 20,
    indicators: [
      '目标明确具体，符合课程标准要求',
      '目标体现知识与能力、过程与方法、情感态度价值观',
      '目标切合学生实际，具有可操作性',
    ],
  },
  {
    id: 'content',
    name: '教学内容',
    description: '内容准确、重难点突出、容量适当',
    maxScore: 20,
    indicators: [
      '教学内容准确无误，无科学性错误',
      '重点突出，难点突破得当',
      '内容容量适中，密度合理',
    ],
  },
  {
    id: 'method',
    name: '教学方法',
    description: '方法得当、手段先进、师生互动良好',
    maxScore: 20,
    indicators: [
      '教学方法得当，灵活多样',
      '信息技术运用合理，辅助教学效果好',
      '师生互动充分，学生参与度高',
    ],
  },
  {
    id: 'quality',
    name: '教师素养',
    description: '教学基本功扎实、教态自然、语言规范',
    maxScore: 20,
    indicators: [
      '教学基本功扎实，课堂驾驭能力强',
      '教态自然大方，语言规范准确',
      '板书设计合理，书写工整美观',
    ],
  },
  {
    id: 'effect',
    name: '教学效果',
    description: '学生掌握良好、课堂氛围活跃、达成目标',
    maxScore: 20,
    indicators: [
      '学生知识掌握良好，能力得到提升',
      '课堂氛围活跃，学生思维积极',
      '教学目标达成度高',
    ],
  },
];

// 模拟听课记录
const mockObservations = [
  {
    id: 'obs001',
    teacherId: 't002',
    teacherName: '李老师',
    subject: '语文',
    grade: 4,
    lesson: '《草原》',
    observerId: 't001',
    observerName: '王老师',
    date: '2024-03-18',
    period: 2,
    type: 'regular',
    status: 'completed',
    scores: {
      objective: 18,
      content: 19,
      method: 17,
      quality: 18,
      effect: 18,
    },
    totalScore: 90,
    highlights: '教学设计思路清晰，导入环节用草原民歌引题，效果很好。朗读指导到位，学生情感投入。',
    suggestions: '可以适当增加学生自主探究的时间，让学生有更多思考空间。',
    overallComment: '一堂较为成功的课，教师专业素养较好，教学设计合理，学生参与度高。',
    createdAt: '2024-03-18 10:30',
  },
  {
    id: 'obs002',
    teacherId: 't004',
    teacherName: '赵老师',
    subject: '语文',
    grade: 4,
    lesson: '《古诗词三首》',
    observerId: 't001',
    observerName: '王老师',
    date: '2024-03-20',
    period: 3,
    type: 'guidance',
    status: 'completed',
    scores: {
      objective: 16,
      content: 17,
      method: 15,
      quality: 16,
      effect: 16,
    },
    totalScore: 80,
    highlights: '年轻教师态度认真，课前准备充分，教学流程完整。',
    suggestions: '课堂时间把控需要加强，前松后紧；提问技巧可以进一步提升，多给学生思考时间。',
    overallComment: '作为青年教师，教学基本素养良好，有较大发展空间。建议多听课学习，积累经验。',
    createdAt: '2024-03-20 15:30',
  },
  {
    id: 'obs003',
    teacherId: 't003',
    teacherName: '张老师',
    subject: '语文',
    grade: 4,
    lesson: '《白鹅》',
    observerId: 't001',
    observerName: '王老师',
    date: '2024-03-22',
    period: 1,
    type: 'demonstration',
    status: 'scheduled',
    scores: null,
    totalScore: null,
    highlights: '',
    suggestions: '',
    overallComment: '',
    createdAt: '2024-03-19 09:00',
  },
];

// 模拟教师统计数据
const mockTeacherStats = {
  totalObservations: 15,
  averageScore: 88.5,
  recentTrend: 'up',
  scoreDistribution: [
    { range: '95-100', count: 3 },
    { range: '90-94', count: 5 },
    { range: '85-89', count: 4 },
    { range: '80-84', count: 2 },
    { range: '<80', count: 1 },
  ],
  dimensionAverages: {
    objective: 17.5,
    content: 18.2,
    method: 17.8,
    quality: 17.6,
    effect: 17.4,
  },
};

export default function LessonObservationPage() {
  const [selectedObservation, setSelectedObservation] = useState<typeof mockObservations[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEvaluateDialog, setShowEvaluateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // 评价表单状态
  const [evaluateForm, setEvaluateForm] = useState({
    objective: 18,
    content: 18,
    method: 18,
    quality: 18,
    effect: 18,
    highlights: '',
    suggestions: '',
    overallComment: '',
  });

  const typeConfig: Record<string, { label: string; color: string }> = {
    regular: { label: '常规听课', color: 'bg-blue-100 text-blue-700' },
    guidance: { label: '指导听课', color: 'bg-purple-100 text-purple-700' },
    demonstration: { label: '示范课', color: 'bg-amber-100 text-amber-700' },
    open: { label: '公开课', color: 'bg-green-100 text-green-700' },
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    scheduled: { label: '待听课', color: 'bg-gray-100 text-gray-700', icon: Clock },
    in_progress: { label: '进行中', color: 'bg-amber-100 text-amber-700', icon: Play },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  };

  // 计算总分
  const calculateTotal = () => {
    return evaluateForm.objective + evaluateForm.content + evaluateForm.method + evaluateForm.quality + evaluateForm.effect;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Video className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">听课评课</h1>
          </div>
          <p className="text-gray-500 mt-1">听课记录与课堂教学评价</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          预约听课
        </Button>
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：听课记录 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-indigo-600">{mockTeacherStats.totalObservations}</p>
                <p className="text-xs text-gray-500">听课次数</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{mockTeacherStats.averageScore}</p>
                <p className="text-xs text-gray-500">平均评分</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-3xl font-bold text-blue-600">3</p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-gray-500">本周待听</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">2</p>
                <p className="text-xs text-gray-500">待评价</p>
              </CardContent>
            </Card>
          </div>

          {/* 听课记录列表 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">听课记录</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8">
                    <TabsTrigger value="list" className="text-xs">列表</TabsTrigger>
                    <TabsTrigger value="calendar" className="text-xs">日历</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockObservations.map((obs) => {
                  const type = typeConfig[obs.type];
                  const status = statusConfig[obs.status];
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={obs.id}
                      className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer"
                      onClick={() => { setSelectedObservation(obs); setShowDetailDialog(true); }}
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
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <span>{obs.lesson}</span>
                            <span>{obs.grade}年级</span>
                            <span>{obs.date}</span>
                            <span>第{obs.period}节</span>
                          </div>
                          {obs.status === 'completed' && (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span className="font-medium text-amber-600">{obs.totalScore}分</span>
                              </div>
                              {obs.scores && (
                                <div className="flex gap-2">
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
        </div>

        {/* 右侧：统计与评价 */}
        <div className="space-y-6">
          {/* 评价维度说明 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-500" />
                评价维度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluationDimensions.map((dim) => (
                  <div key={dim.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{dim.name}</span>
                      <span className="text-xs text-gray-400">满分{dim.maxScore}分</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={mockTeacherStats.dimensionAverages[dim.id as keyof typeof mockTeacherStats.dimensionAverages]} max={dim.maxScore} className="flex-1 h-1.5" />
                      <span className="text-xs font-medium text-indigo-600">
                        {mockTeacherStats.dimensionAverages[dim.id as keyof typeof mockTeacherStats.dimensionAverages]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 分数分布 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                分数分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockTeacherStats.scoreDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs w-16 text-gray-500">{item.range}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div
                        className="bg-indigo-500 rounded-full h-4"
                        style={{ width: `${(item.count / mockTeacherStats.totalObservations) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 快捷评价入口 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">我的平均得分</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-4xl font-bold text-indigo-600">{mockTeacherStats.averageScore}</p>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowEvaluateDialog(true)}>
                  <Edit className="h-3 w-3 mr-1" />
                  填写评价
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  我的课
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 最近评价 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                最近评价
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockObservations.filter(o => o.status === 'completed').slice(0, 2).map((obs) => (
                  <div key={obs.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{obs.lesson}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-sm font-medium">{obs.totalScore}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{obs.overallComment}</p>
                    <p className="text-xs text-gray-400 mt-1">{obs.observerName} · {obs.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 听课详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>听课详情</DialogTitle>
            <DialogDescription>
              {selectedObservation?.teacherName} · {selectedObservation?.lesson} · {selectedObservation?.date}
            </DialogDescription>
          </DialogHeader>

          {selectedObservation && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
                    {selectedObservation.teacherName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-lg">{selectedObservation.teacherName}</span>
                    <Badge className={typeConfig[selectedObservation.type].color}>
                      {typeConfig[selectedObservation.type].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{selectedObservation.subject}</span>
                    <span>{selectedObservation.grade}年级</span>
                    <span>{selectedObservation.lesson}</span>
                  </div>
                </div>
                {selectedObservation.totalScore && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">{selectedObservation.totalScore}</p>
                    <p className="text-xs text-gray-400">总分</p>
                  </div>
                )}
              </div>

              {selectedObservation.status === 'completed' && selectedObservation.scores && (
                <>
                  {/* 分数详情 */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-500" />
                      各维度评分
                    </h4>
                    <div className="grid grid-cols-5 gap-3">
                      {evaluationDimensions.map((dim) => (
                        <div key={dim.id} className="text-center p-3 border rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">{dim.name}</p>
                          <p className="text-xl font-bold text-indigo-600">{selectedObservation.scores![dim.id as keyof typeof selectedObservation.scores]}</p>
                          <p className="text-xs text-gray-400">/{dim.maxScore}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 亮点 */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      教学亮点
                    </h4>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-green-800">{selectedObservation.highlights}</p>
                    </div>
                  </div>

                  {/* 建议 */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      改进建议
                    </h4>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">{selectedObservation.suggestions}</p>
                    </div>
                  </div>

                  {/* 总评 */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      综合评价
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedObservation.overallComment}</p>
                    </div>
                  </div>
                </>
              )}

              {selectedObservation.status === 'scheduled' && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">课程尚未开始</p>
                  <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowEvaluateDialog(true)}>
                    开始评价
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            {selectedObservation?.status === 'completed' && (
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Edit className="h-4 w-4 mr-2" />
                修改评价
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 评价填写对话框 */}
      <Dialog open={showEvaluateDialog} onOpenChange={setShowEvaluateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>填写课堂评价</DialogTitle>
            <DialogDescription>对课堂教学进行多维度评价</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 各维度评分 */}
            <div className="space-y-4">
              {evaluationDimensions.map((dim) => (
                <div key={dim.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{dim.name}</span>
                      <p className="text-xs text-gray-500">{dim.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={dim.maxScore}
                        value={evaluateForm[dim.id as keyof typeof evaluateForm]}
                        onChange={(e) => setEvaluateForm(prev => ({ ...prev, [dim.id]: Number(e.target.value) }))}
                        className="w-16 text-center"
                      />
                      <span className="text-sm text-gray-400">/{dim.maxScore}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dim.indicators.map((ind, idx) => (
                      <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 总分 */}
            <div className="p-4 bg-indigo-50 rounded-xl text-center">
              <p className="text-sm text-gray-500 mb-1">总分</p>
              <p className="text-4xl font-bold text-indigo-600">{calculateTotal()}</p>
              <p className="text-xs text-gray-400 mt-1">满分100分</p>
            </div>

            {/* 亮点 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                教学亮点
              </Label>
              <Textarea
                value={evaluateForm.highlights}
                onChange={(e) => setEvaluateForm(prev => ({ ...prev, highlights: e.target.value }))}
                placeholder="记录课堂教学的亮点和精彩之处..."
                rows={2}
              />
            </div>

            {/* 建议 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-blue-500" />
                改进建议
              </Label>
              <Textarea
                value={evaluateForm.suggestions}
                onChange={(e) => setEvaluateForm(prev => ({ ...prev, suggestions: e.target.value }))}
                placeholder="提出改进建议..."
                rows={2}
              />
            </div>

            {/* 总评 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                综合评价
              </Label>
              <Textarea
                value={evaluateForm.overallComment}
                onChange={(e) => setEvaluateForm(prev => ({ ...prev, overallComment: e.target.value }))}
                placeholder="撰写综合评价意见..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvaluateDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">提交评价</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
