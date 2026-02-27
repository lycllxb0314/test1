'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users,
  Calendar,
  FileText,
  Video,
  Link as LinkIcon,
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
} from 'lucide-react';

// 模拟备课组数据
const mockLessonGroups = [
  {
    id: 'lg001',
    name: '四年级语文备课组',
    subject: '语文',
    grade: 4,
    leaderId: 't001',
    leaderName: '王老师',
    members: [
      { id: 't001', name: '王老师', role: '备课组长' },
      { id: 't002', name: '李老师', role: '主讲教师' },
      { id: 't003', name: '张老师', role: '骨干教师' },
      { id: 't004', name: '赵老师', role: '青年教师' },
    ],
    totalLessons: 12,
    completedLessons: 5,
  },
  {
    id: 'lg002',
    name: '四年级数学备课组',
    subject: '数学',
    grade: 4,
    leaderId: 't005',
    leaderName: '刘老师',
    members: [
      { id: 't005', name: '刘老师', role: '备课组长' },
      { id: 't006', name: '陈老师', role: '主讲教师' },
      { id: 't007', name: '吴老师', role: '骨干教师' },
    ],
    totalLessons: 10,
    completedLessons: 4,
  },
];

// 模拟集体备课活动
const mockLessonActivities = [
  {
    id: 'la001',
    groupId: 'lg001',
    groupName: '四年级语文备课组',
    topic: '《草原》集体备课',
    lesson: '草原',
    unit: '第一单元',
    mainPreparerId: 't001',
    mainPreparerName: '王老师',
    mainSpeakerId: 't002',
    mainSpeakerName: '李老师',
    scheduledDate: '2024-03-20 14:00',
    duration: 90,
    status: 'completed',
    participants: ['t001', 't002', 't003', 't004'],
    agenda: [
      { content: '主备人分享教学设计', duration: 20 },
      { content: '集体讨论教学重难点', duration: 30 },
      { content: '资源与作业设计研讨', duration: 20 },
      { content: '确定最终方案', duration: 20 },
    ],
    resources: [
      { name: '草原-教学设计.docx', type: 'docx', uploader: '王老师', size: '2.3MB' },
      { name: '草原-课件.pptx', type: 'pptx', uploader: '王老师', size: '15.6MB' },
      { name: '草原-教学视频.mp4', type: 'video', uploader: '李老师', size: '120MB' },
    ],
    conclusions: [
      '重点：引导学生感受草原美景，体会作者情感表达方法',
      '难点：理解"蒙汉情深何忍别，天涯碧草话斜阳"的含义',
      '作业设计：分层布置，必做题为基础字词，选做题为仿写练笔',
    ],
    discussionNotes: '李老师建议增加朗读指导环节，赵老师提出可以结合草原民歌进行导入...',
    createdAt: '2024-03-15 10:00',
  },
  {
    id: 'la002',
    groupId: 'lg001',
    groupName: '四年级语文备课组',
    topic: '《古诗词三首》集体备课',
    lesson: '古诗词三首',
    unit: '第一单元',
    mainPreparerId: 't002',
    mainPreparerName: '李老师',
    mainSpeakerId: 't003',
    mainSpeakerName: '张老师',
    scheduledDate: '2024-03-25 14:00',
    duration: 90,
    status: 'in_progress',
    participants: ['t001', 't002', 't003', 't004'],
    agenda: [
      { content: '主备人分享教学设计', duration: 20 },
      { content: '集体讨论教学重难点', duration: 30 },
      { content: '资源与作业设计研讨', duration: 20 },
      { content: '确定最终方案', duration: 20 },
    ],
    resources: [
      { name: '古诗词三首-教学设计.docx', type: 'docx', uploader: '李老师', size: '1.8MB' },
    ],
    conclusions: [],
    discussionNotes: '',
    createdAt: '2024-03-18 09:00',
  },
  {
    id: 'la003',
    groupId: 'lg001',
    groupName: '四年级语文备课组',
    topic: '《白鹅》集体备课',
    lesson: '白鹅',
    unit: '第二单元',
    mainPreparerId: 't003',
    mainPreparerName: '张老师',
    mainSpeakerId: 't004',
    mainSpeakerName: '赵老师',
    scheduledDate: '2024-03-28 14:00',
    duration: 90,
    status: 'scheduled',
    participants: ['t001', 't002', 't003', 't004'],
    agenda: [
      { content: '主备人分享教学设计', duration: 20 },
      { content: '集体讨论教学重难点', duration: 30 },
      { content: '资源与作业设计研讨', duration: 20 },
      { content: '确定最终方案', duration: 20 },
    ],
    resources: [],
    conclusions: [],
    discussionNotes: '',
    createdAt: '2024-03-19 14:00',
  },
];

export default function CollectiveLessonPlanningPage() {
  const [selectedGroup, setSelectedGroup] = useState(mockLessonGroups[0]);
  const [selectedActivity, setSelectedActivity] = useState<typeof mockLessonActivities[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('activities');

  // 按状态分组
  const activitiesByStatus = {
    scheduled: mockLessonActivities.filter(a => a.status === 'scheduled'),
    in_progress: mockLessonActivities.filter(a => a.status === 'in_progress'),
    completed: mockLessonActivities.filter(a => a.status === 'completed'),
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    scheduled: { label: '待开展', color: 'bg-blue-100 text-blue-700', icon: Clock },
    in_progress: { label: '进行中', color: 'bg-amber-100 text-amber-700', icon: Mic },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">集体备课协同</h1>
          </div>
          <p className="text-gray-500 mt-1">备课组协作平台，共创优质教学资源</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          发起备课活动
        </Button>
      </div>

      {/* 备课组选择 */}
      <div className="flex gap-3">
        {mockLessonGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              selectedGroup.id === group.id
                ? 'border-teal-500 bg-teal-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="p-2 rounded-lg bg-teal-100">
              <BookOpen className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{group.name}</p>
              <p className="text-xs text-gray-500">{group.members.length}人 · 已完成{group.completedLessons}次</p>
            </div>
          </button>
        ))}
      </div>

      {/* 主内容区 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：活动列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{activitiesByStatus.scheduled.length}</p>
                <p className="text-xs text-gray-500">待开展</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{activitiesByStatus.in_progress.length}</p>
                <p className="text-xs text-gray-500">进行中</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{activitiesByStatus.completed.length}</p>
                <p className="text-xs text-gray-500">已完成</p>
              </CardContent>
            </Card>
          </div>

          {/* 活动列表 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">备课活动</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8">
                    <TabsTrigger value="activities" className="text-xs">全部</TabsTrigger>
                    <TabsTrigger value="schedule" className="text-xs">日程</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLessonActivities.map((activity) => {
                  const status = statusConfig[activity.status];
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={activity.id}
                      className="p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer"
                      onClick={() => { setSelectedActivity(activity); setShowDetailDialog(true); }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-teal-100">
                          <BookMarked className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{activity.topic}</span>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {activity.scheduledDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              主备：{activity.mainPreparerName}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">第{activity.unit}</span>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Users className="h-3 w-3" />
                              {activity.participants.length}人参与
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <FileText className="h-3 w-3" />
                              {activity.resources.length}份资源
                            </div>
                          </div>
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

        {/* 右侧：备课组成员与资源 */}
        <div className="space-y-6">
          {/* 备课组成员 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-500" />
                备课组成员
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedGroup.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 共享资源 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  共享资源
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Upload className="h-3 w-3 mr-1" />
                  上传
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockLessonActivities[0].resources.map((resource, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`p-1.5 rounded ${
                      resource.type === 'docx' ? 'bg-blue-100' :
                      resource.type === 'pptx' ? 'bg-orange-100' : 'bg-purple-100'
                    }`}>
                      <FileText className={`h-4 w-4 ${
                        resource.type === 'docx' ? 'text-blue-600' :
                        resource.type === 'pptx' ? 'text-orange-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{resource.name}</p>
                      <p className="text-xs text-gray-400">{resource.size} · {resource.uploader}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 备课流程指引 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-teal-600" />
                备课流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: 1, title: '主备人准备', desc: '教学设计初稿' },
                  { step: 2, title: '集体研讨', desc: '讨论修改完善' },
                  { step: 3, title: '形成定案', desc: '确定最终方案' },
                  { step: 4, title: '课堂实践', desc: '主讲教师授课' },
                  { step: 5, title: '反思改进', desc: '总结优化提升' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 活动详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedActivity?.topic}</DialogTitle>
            <DialogDescription>{selectedActivity?.groupName} · {selectedActivity?.scheduledDate}</DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">主备人</p>
                  <p className="font-medium">{selectedActivity.mainPreparerName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">主讲人</p>
                  <p className="font-medium">{selectedActivity.mainSpeakerName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">时长</p>
                  <p className="font-medium">{selectedActivity.duration}分钟</p>
                </div>
              </div>

              {/* 议程安排 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  议程安排
                </h4>
                <div className="space-y-2">
                  {selectedActivity.agenda.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                        {idx + 1}
                      </div>
                      <span className="flex-1">{item.content}</span>
                      <span className="text-sm text-gray-400">{item.duration}分钟</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 备课资源 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  备课资源
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedActivity.resources.map((resource, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`p-2 rounded ${
                        resource.type === 'docx' ? 'bg-blue-100' :
                        resource.type === 'pptx' ? 'bg-orange-100' : 'bg-purple-100'
                      }`}>
                        <FileText className={`h-4 w-4 ${
                          resource.type === 'docx' ? 'text-blue-600' :
                          resource.type === 'pptx' ? 'text-orange-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resource.name}</p>
                        <p className="text-xs text-gray-400">{resource.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 结论与要点 */}
              {selectedActivity.conclusions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    备课结论
                  </h4>
                  <div className="space-y-2">
                    {selectedActivity.conclusions.map((conclusion, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{conclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 讨论记录 */}
              {selectedActivity.discussionNotes && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    讨论记录
                  </h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{selectedActivity.discussionNotes}</p>
                  </div>
                </div>
              )}

              {/* 参与人员 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-500" />
                  参与人员
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedActivity.participants.map((pId) => {
                    const member = selectedGroup.members.find(m => m.id === pId);
                    return member ? (
                      <Badge key={pId} variant="secondary" className="px-3 py-1">
                        {member.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建备课活动对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发起集体备课活动</DialogTitle>
            <DialogDescription>创建新的集体备课活动，邀请备课组成员参与</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>备课组</Label>
                <Select defaultValue={selectedGroup.id}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectItem value="unit3">第三单元</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>课题 *</Label>
              <Input placeholder="如：草原" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主备人</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择主备人" /></SelectTrigger>
                  <SelectContent>
                    {selectedGroup.members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>主讲人</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择主讲人" /></SelectTrigger>
                  <SelectContent>
                    {selectedGroup.members.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>活动时间</Label>
                <Input type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label>预计时长</Label>
                <Select defaultValue="90">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60分钟</SelectItem>
                    <SelectItem value="90">90分钟</SelectItem>
                    <SelectItem value="120">120分钟</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700">创建活动</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
