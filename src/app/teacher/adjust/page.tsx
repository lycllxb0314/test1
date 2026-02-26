'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CalendarClock,
  Bell,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  RefreshCw,
  Send,
  Eye,
  Filter,
} from 'lucide-react';

// 调课状态类型
type AdjustStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 调课单数据结构
interface CourseAdjustmentItem {
  id: string;
  // 关联信息
  workflowInstanceId?: string;
  leaveRequestId?: string;
  // 申请人信息（请假教师）
  applicantId: string;
  applicantName: string;
  applicantSubject: string;
  applicantGrade: number;
  // 请假信息
  leaveType: '病假' | '事假' | '公假';
  leaveDate: string;
  leavePeriod: string;
  leaveReason: string;
  // 原课程信息
  originalCourse: {
    classId: string;
    className: string;
    weekDay: string;
    periodIndex: number;
    periodName: string;
    courseId: string;
    courseName: string;
    subject: string;
  };
  // 调课状态
  status: AdjustStatus;
  adjustType?: 'substitute' | 'swap' | 'cancel' | 'makeup';
  // 代课教师
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  // 调课结果
  adjustResult?: {
    substituteTeacherId?: string;
    substituteTeacherName?: string;
    swapWithSlot?: {
      classId: string;
      className: string;
      weekDay: string;
      periodIndex: number;
    };
    makeupSlot?: {
      weekDay: string;
      periodIndex: number;
      date: string;
    };
  };
  // 时间
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  // 备注
  remark?: string;
}

// 模拟数据
const mockAdjustments: CourseAdjustmentItem[] = [
  {
    id: 'adj-001',
    workflowInstanceId: 'wf-001',
    leaveRequestId: 'leave-001',
    applicantId: 't001',
    applicantName: '张明华',
    applicantSubject: '语文',
    applicantGrade: 3,
    leaveType: '病假',
    leaveDate: '2024-03-18',
    leavePeriod: '第3-4节',
    leaveReason: '身体不适，需就医',
    originalCourse: {
      classId: 'c301',
      className: '三年1班',
      weekDay: '周一',
      periodIndex: 3,
      periodName: '第3节',
      courseId: 'course-语文',
      courseName: '语文',
      subject: '语文',
    },
    status: 'pending',
    createdAt: '2024-03-15 08:30:00',
  },
  {
    id: 'adj-002',
    workflowInstanceId: 'wf-002',
    leaveRequestId: 'leave-002',
    applicantId: 't002',
    applicantName: '李小红',
    applicantSubject: '数学',
    applicantGrade: 3,
    leaveType: '事假',
    leaveDate: '2024-03-19',
    leavePeriod: '第1-2节',
    leaveReason: '家中有事需处理',
    originalCourse: {
      classId: 'c302',
      className: '三年2班',
      weekDay: '周二',
      periodIndex: 1,
      periodName: '第1节',
      courseId: 'course-数学',
      courseName: '数学',
      subject: '数学',
    },
    status: 'processing',
    adjustType: 'substitute',
    substituteTeacherId: 't010',
    substituteTeacherName: '王建国',
    createdAt: '2024-03-15 09:15:00',
    updatedAt: '2024-03-15 10:00:00',
  },
  {
    id: 'adj-003',
    workflowInstanceId: 'wf-003',
    leaveRequestId: 'leave-003',
    applicantId: 't003',
    applicantName: '陈伟',
    applicantSubject: '英语',
    applicantGrade: 3,
    leaveType: '公假',
    leaveDate: '2024-03-20',
    leavePeriod: '全天',
    leaveReason: '参加区教研活动',
    originalCourse: {
      classId: 'c303',
      className: '三年3班',
      weekDay: '周三',
      periodIndex: 5,
      periodName: '第5节',
      courseId: 'course-英语',
      courseName: '英语',
      subject: '英语',
    },
    status: 'completed',
    adjustType: 'substitute',
    adjustResult: {
      substituteTeacherId: 't011',
      substituteTeacherName: '刘芳',
    },
    createdAt: '2024-03-14 14:20:00',
    completedAt: '2024-03-14 16:30:00',
    remark: '已安排刘芳老师代课',
  },
];

// 可选代课教师列表
const availableTeachers = [
  { id: 't010', name: '王建国', subject: '数学', grade: 3, available: true },
  { id: 't011', name: '刘芳', subject: '英语', grade: 3, available: true },
  { id: 't012', name: '张丽', subject: '语文', grade: 3, available: true },
  { id: 't013', name: '李强', subject: '数学', grade: 2, available: true },
  { id: 't014', name: '周敏', subject: '语文', grade: 4, available: false },
];

export default function GradeLeaderAdjustPage() {
  const [adjustments, setAdjustments] = useState<CourseAdjustmentItem[]>(mockAdjustments);
  const [selectedAdjust, setSelectedAdjust] = useState<CourseAdjustmentItem | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // 处理表单状态
  const [processForm, setProcessForm] = useState({
    adjustType: 'substitute' as 'substitute' | 'swap' | 'cancel' | 'makeup',
    substituteTeacherId: '',
    remark: '',
  });

  // 获取状态徽章
  const getStatusBadge = (status: AdjustStatus) => {
    const statusMap = {
      pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      processing: { label: '处理中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-700 border-green-200' },
      failed: { label: '失败', color: 'bg-red-100 text-red-700 border-red-200' },
    };
    const { label, color } = statusMap[status];
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  // 获取调课类型名称
  const getAdjustTypeName = (type?: string) => {
    const typeMap: Record<string, string> = {
      substitute: '代课',
      swap: '调换',
      cancel: '取消',
      makeup: '补课',
    };
    return type ? typeMap[type] : '-';
  };

  // 统计数据
  const stats = {
    pending: adjustments.filter(a => a.status === 'pending').length,
    processing: adjustments.filter(a => a.status === 'processing').length,
    completed: adjustments.filter(a => a.status === 'completed').length,
    total: adjustments.length,
  };

  // 打开处理对话框
  const handleOpenProcess = (adjust: CourseAdjustmentItem) => {
    setSelectedAdjust(adjust);
    setProcessForm({
      adjustType: 'substitute',
      substituteTeacherId: '',
      remark: '',
    });
    setShowProcessDialog(true);
  };

  // 打开详情对话框
  const handleOpenDetail = (adjust: CourseAdjustmentItem) => {
    setSelectedAdjust(adjust);
    setShowDetailDialog(true);
  };

  // 提交处理
  const handleSubmitProcess = () => {
    if (!selectedAdjust) return;
    
    const teacher = availableTeachers.find(t => t.id === processForm.substituteTeacherId);
    
    setAdjustments(prev => prev.map(a => {
      if (a.id === selectedAdjust.id) {
        return {
          ...a,
          status: 'completed' as AdjustStatus,
          adjustType: processForm.adjustType,
          adjustResult: {
            substituteTeacherId: processForm.substituteTeacherId,
            substituteTeacherName: teacher?.name || '',
          },
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          remark: processForm.remark,
        };
      }
      return a;
    }));
    
    setShowProcessDialog(false);
    setSelectedAdjust(null);
  };

  // 推荐代课教师（模拟AI推荐）
  const getRecommendedTeachers = (adjust: CourseAdjustmentItem) => {
    return availableTeachers
      .filter(t => t.available && (t.subject === adjust.originalCourse.subject || t.grade === adjust.applicantGrade))
      .slice(0, 3);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">调课管理</h1>
          </div>
          <p className="text-gray-500 mt-1">处理年级教师请假调课申请，安排代课教师</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月总计</p>
                <p className="text-3xl font-bold text-gray-700">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 调课列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">调课申请列表</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="h-4 w-4" />
                待处理 ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="processing" className="gap-1">
                <RefreshCw className="h-4 w-4" />
                处理中 ({stats.processing})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1">
                <CheckCircle className="h-4 w-4" />
                已完成 ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1">
                <FileText className="h-4 w-4" />
                全部 ({stats.total})
              </TabsTrigger>
            </TabsList>

            {/* 待处理列表 */}
            <TabsContent value="pending" className="space-y-3">
              {adjustments.filter(a => a.status === 'pending').map(adjust => (
                <Card key={adjust.id} className="border border-yellow-200 bg-yellow-50/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            {adjust.leaveType}
                          </Badge>
                          <span className="text-sm text-gray-500">{adjust.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicantName}</span>
                            <span className="text-sm text-gray-500">({adjust.applicantSubject})</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {adjust.leaveDate} {adjust.leavePeriod}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">原课程：</span>
                          {adjust.originalCourse.className} · {adjust.originalCourse.weekDay} {adjust.originalCourse.periodName} · {adjust.originalCourse.courseName}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">请假原因：</span>{adjust.leaveReason}
                        </div>
                        
                        {/* AI推荐代课教师 */}
                        <div className="mt-3 p-3 bg-white rounded-lg border border-orange-100">
                          <div className="flex items-center gap-1 text-sm font-medium text-orange-600 mb-2">
                            <Users className="h-4 w-4" />
                            推荐代课教师
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getRecommendedTeachers(adjust).map(teacher => (
                              <Badge 
                                key={teacher.id} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-orange-100 border-orange-200"
                              >
                                {teacher.name}（{teacher.subject}）
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
                          onClick={() => handleOpenProcess(adjust)}
                        >
                          <Send className="h-4 w-4" />
                          处理调课
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenDetail(adjust)}>
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {adjustments.filter(a => a.status === 'pending').length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无待处理的调课申请</p>
                </div>
              )}
            </TabsContent>

            {/* 处理中列表 */}
            <TabsContent value="processing" className="space-y-3">
              {adjustments.filter(a => a.status === 'processing').map(adjust => (
                <Card key={adjust.id} className="border border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            {getAdjustTypeName(adjust.adjustType)}
                          </Badge>
                          <span className="text-sm text-gray-500">{adjust.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicantName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            代课教师：{adjust.substituteTeacherName}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {adjust.originalCourse.className} · {adjust.leaveDate}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenDetail(adjust)}>
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* 已完成列表 */}
            <TabsContent value="completed" className="space-y-3">
              {adjustments.filter(a => a.status === 'completed').map(adjust => (
                <Card key={adjust.id} className="border border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            {getAdjustTypeName(adjust.adjustType)}
                          </Badge>
                          <span className="text-sm text-gray-500">完成于 {adjust.completedAt}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicantName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            代课教师：{adjust.adjustResult?.substituteTeacherName}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {adjust.originalCourse.className} · {adjust.leaveDate}
                        </div>
                        {adjust.remark && (
                          <div className="text-sm text-gray-500 mt-1">
                            备注：{adjust.remark}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenDetail(adjust)}>
                        <Eye className="h-4 w-4" />
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* 全部列表 */}
            <TabsContent value="all" className="space-y-3">
              {adjustments.map(adjust => (
                <Card key={adjust.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          {adjust.adjustType && (
                            <Badge variant="outline">
                              {getAdjustTypeName(adjust.adjustType)}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">{adjust.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicantName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {adjust.originalCourse.className} · {adjust.leaveDate}
                          </div>
                        </div>
                      </div>
                      {adjust.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
                          onClick={() => handleOpenProcess(adjust)}
                        >
                          <Send className="h-4 w-4" />
                          处理调课
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 处理调课对话框 */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-orange-500" />
              处理调课申请
            </DialogTitle>
            <DialogDescription>
              为 {selectedAdjust?.applicantName} 老师的请假安排调课
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 原课程信息 */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">原课程信息</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">班级：</span>{selectedAdjust?.originalCourse.className}</div>
                <div><span className="text-gray-500">时间：</span>{selectedAdjust?.originalCourse.weekDay} {selectedAdjust?.originalCourse.periodName}</div>
                <div><span className="text-gray-500">课程：</span>{selectedAdjust?.originalCourse.courseName}</div>
                <div><span className="text-gray-500">请假日期：</span>{selectedAdjust?.leaveDate}</div>
              </div>
            </div>

            {/* 调课方式 */}
            <div className="space-y-2">
              <Label>调课方式</Label>
              <Select
                value={processForm.adjustType}
                onValueChange={(v) => setProcessForm(prev => ({ ...prev, adjustType: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="substitute">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>代课</span>
                      <span className="text-gray-400 text-xs">- 安排其他教师代上</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="swap">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>调换</span>
                      <span className="text-gray-400 text-xs">- 与其他时间互换</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancel">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>取消</span>
                      <span className="text-gray-400 text-xs">- 不上课</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="makeup">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>补课</span>
                      <span className="text-gray-400 text-xs">- 后续时间补上</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 代课教师选择（仅代课方式显示） */}
            {processForm.adjustType === 'substitute' && (
              <div className="space-y-2">
                <Label>代课教师</Label>
                <Select
                  value={processForm.substituteTeacherId}
                  onValueChange={(v) => setProcessForm(prev => ({ ...prev, substituteTeacherId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择代课教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.filter(t => t.available).map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        <div className="flex items-center gap-2">
                          <span>{teacher.name}</span>
                          <span className="text-gray-400 text-xs">({teacher.subject} · {teacher.grade}年级)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-gray-500">快速选择：</span>
                  {selectedAdjust && getRecommendedTeachers(selectedAdjust).map(teacher => (
                    <Badge
                      key={teacher.id}
                      variant={processForm.substituteTeacherId === teacher.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setProcessForm(prev => ({ ...prev, substituteTeacherId: teacher.id }))}
                    >
                      {teacher.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={processForm.remark}
                onChange={(e) => setProcessForm(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="填写调课安排说明..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>取消</Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSubmitProcess}
              disabled={processForm.adjustType === 'substitute' && !processForm.substituteTeacherId}
            >
              <Send className="h-4 w-4 mr-1" />
              确认安排
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>调课详情</DialogTitle>
          </DialogHeader>
          
          {selectedAdjust && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedAdjust.status)}
                <Badge variant="outline">{selectedAdjust.leaveType}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">申请人</Label>
                  <p className="font-medium">{selectedAdjust.applicantName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">任教学科</Label>
                  <p>{selectedAdjust.applicantSubject}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">请假日期</Label>
                  <p>{selectedAdjust.leaveDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">请假节次</Label>
                  <p>{selectedAdjust.leavePeriod}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">请假原因</Label>
                <p className="text-sm">{selectedAdjust.leaveReason}</p>
              </div>
              
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">原课程信息</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">班级：</span>{selectedAdjust.originalCourse.className}</div>
                    <div><span className="text-gray-500">时间：</span>{selectedAdjust.originalCourse.weekDay} {selectedAdjust.originalCourse.periodName}</div>
                    <div><span className="text-gray-500">课程：</span>{selectedAdjust.originalCourse.courseName}</div>
                  </div>
                </div>
              </div>
              
              {selectedAdjust.adjustResult && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">调课结果</Label>
                  <div className="mt-2 p-3 bg-green-50 rounded-lg text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">方式：</span>{getAdjustTypeName(selectedAdjust.adjustType)}</div>
                      {selectedAdjust.adjustResult.substituteTeacherName && (
                        <div><span className="text-gray-500">代课教师：</span>{selectedAdjust.adjustResult.substituteTeacherName}</div>
                      )}
                    </div>
                    {selectedAdjust.remark && (
                      <div className="mt-2"><span className="text-gray-500">备注：</span>{selectedAdjust.remark}</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 text-xs text-gray-500">
                <div>创建时间：{selectedAdjust.createdAt}</div>
                {selectedAdjust.completedAt && <div>完成时间：{selectedAdjust.completedAt}</div>}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
