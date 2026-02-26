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
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  ChevronRight,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  CalendarClock,
  Send,
  History,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 请假类型
type LeaveType = '病假' | '事假' | '公假' | '婚假' | '产假' | '丧假';

// 审批状态
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'syncing';

// 审批节点
interface ApprovalNodeItem {
  id: string;
  name: string;
  type: 'start' | 'approval' | 'condition' | 'course_adjust' | 'sync' | 'end';
  status: ApprovalStatus;
  approver?: string;
  approverName?: string;
  approvedAt?: string;
  comment?: string;
  isCurrent?: boolean;
}

// 请假申请
interface LeaveApplication {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  attachments: string[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  // 审批流程节点
  flowNodes: ApprovalNodeItem[];
  currentNodeIndex: number;
}

// 请假类型配置
const leaveTypeConfig: Record<LeaveType, { 
  description: string; 
  requireAttachment: boolean;
  attachmentDesc: string;
}> = {
  '病假': { 
    description: '因病需要休息',
    requireAttachment: true,
    attachmentDesc: '请上传医院证明（诊断证明、病假条）',
  },
  '事假': { 
    description: '因私事需要请假',
    requireAttachment: false,
    attachmentDesc: '如有相关证明材料可上传',
  },
  '公假': { 
    description: '因公派任务请假',
    requireAttachment: true,
    attachmentDesc: '请上传公派任务通知或相关证明',
  },
  '婚假': { 
    description: '结婚请假',
    requireAttachment: true,
    attachmentDesc: '请上传结婚证复印件',
  },
  '产假': { 
    description: '生育请假',
    requireAttachment: true,
    attachmentDesc: '请上传医院产检证明或预产期证明',
  },
  '丧假': { 
    description: '直系亲属去世',
    requireAttachment: false,
    attachmentDesc: '如有需要可上传相关证明',
  },
};

// 模拟请假申请数据
const mockApplications: LeaveApplication[] = [
  {
    id: 'leave-001',
    type: '病假',
    startDate: '2024-03-18',
    endDate: '2024-03-19',
    duration: 2,
    reason: '身体不适，需就医检查',
    attachments: ['/uploads/sick-leave-001.pdf'],
    status: 'approved',
    createdAt: '2024-03-15 08:30:00',
    flowNodes: [
      { id: 'start', name: '开始', type: 'start', status: 'approved' },
      { id: 'approval_grade', name: '年级组长审批', type: 'approval', status: 'approved', approver: 'head_teacher', approverName: '张小燕', approvedAt: '2024-03-15 10:00:00', comment: '同意请假' },
      { id: 'condition', name: '判断请假类型', type: 'condition', status: 'approved' },
      { id: 'arrange_class', name: '年段长调课安排', type: 'course_adjust', status: 'approved', approver: 'grade_leader', approverName: '林国强', approvedAt: '2024-03-15 14:00:00' },
      { id: 'sync', name: '数据同步', type: 'sync', status: 'approved' },
      { id: 'end', name: '结束', type: 'end', status: 'approved' },
    ],
    currentNodeIndex: 5,
  },
  {
    id: 'leave-002',
    type: '事假',
    startDate: '2024-03-22',
    endDate: '2024-03-22',
    duration: 1,
    reason: '家中有事需要处理',
    attachments: [],
    status: 'submitted',
    createdAt: '2024-03-16 09:15:00',
    flowNodes: [
      { id: 'start', name: '开始', type: 'start', status: 'approved' },
      { id: 'approval_grade', name: '年级组长审批', type: 'approval', status: 'processing', approver: 'head_teacher', approverName: '张小燕', isCurrent: true },
      { id: 'condition', name: '判断请假类型', type: 'condition', status: 'pending' },
      { id: 'arrange_class', name: '年段长调课安排', type: 'course_adjust', status: 'pending' },
      { id: 'sync', name: '数据同步', type: 'sync', status: 'pending' },
      { id: 'end', name: '结束', type: 'end', status: 'pending' },
    ],
    currentNodeIndex: 1,
  },
  {
    id: 'leave-003',
    type: '公假',
    startDate: '2024-03-25',
    endDate: '2024-03-25',
    duration: 1,
    reason: '参加区教研活动',
    attachments: ['/uploads/meeting-notice.pdf'],
    status: 'submitted',
    createdAt: '2024-03-17 14:20:00',
    flowNodes: [
      { id: 'start', name: '开始', type: 'start', status: 'approved' },
      { id: 'approval_grade', name: '年级组长审批', type: 'approval', status: 'approved', approver: 'head_teacher', approverName: '张小燕', approvedAt: '2024-03-17 15:00:00', comment: '同意' },
      { id: 'condition', name: '判断请假类型', type: 'condition', status: 'approved' },
      { id: 'approval_dean', name: '教务主任审批', type: 'approval', status: 'processing', approver: 'academic_director', approverName: '刘婷婷', isCurrent: true },
      { id: 'arrange_class', name: '年段长调课安排', type: 'course_adjust', status: 'pending' },
      { id: 'sync', name: '数据同步', type: 'sync', status: 'pending' },
      { id: 'end', name: '结束', type: 'end', status: 'pending' },
    ],
    currentNodeIndex: 3,
  },
];

// 获取状态徽章
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
    submitted: { label: '审批中', className: 'bg-blue-100 text-blue-600' },
    approved: { label: '已通过', className: 'bg-green-100 text-green-600' },
    rejected: { label: '已驳回', className: 'bg-red-100 text-red-600' },
    cancelled: { label: '已撤销', className: 'bg-gray-100 text-gray-500' },
  };
  const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <Badge className={className}>{label}</Badge>;
};

// 获取节点状态图标
const getNodeStatusIcon = (status: ApprovalStatus) => {
  const iconMap = {
    approved: <CheckCircle className="h-5 w-5 text-green-500" />,
    rejected: <XCircle className="h-5 w-5 text-red-500" />,
    pending: <Clock className="h-5 w-5 text-gray-300" />,
    processing: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
    syncing: <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />,
  };
  return iconMap[status] || <Clock className="h-5 w-5 text-gray-300" />;
};

// 获取节点类型颜色
const getNodeTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    start: 'border-emerald-300 bg-emerald-50',
    approval: 'border-blue-300 bg-blue-50',
    condition: 'border-amber-300 bg-amber-50',
    course_adjust: 'border-teal-300 bg-teal-50',
    sync: 'border-indigo-300 bg-indigo-50',
    end: 'border-gray-300 bg-gray-50',
  };
  return colorMap[type] || 'border-gray-300 bg-gray-50';
};

export default function TeacherLeavePage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaveApplication[]>(mockApplications);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  
  // 新申请表单
  const [newForm, setNewForm] = useState({
    type: '' as LeaveType,
    startDate: '',
    endDate: '',
    duration: 1,
    reason: '',
    attachments: [] as string[],
  });

  // 计算请假天数
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // 提交新申请
  const handleSubmit = () => {
    if (!newForm.type || !newForm.startDate || !newForm.endDate || !newForm.reason) {
      return;
    }

    // 根据请假类型和天数构建流程节点
    const flowNodes = buildFlowNodes(newForm.type, newForm.duration);

    const newApp: LeaveApplication = {
      id: `leave-${Date.now()}`,
      type: newForm.type,
      startDate: newForm.startDate,
      endDate: newForm.endDate,
      duration: newForm.duration,
      reason: newForm.reason,
      attachments: newForm.attachments,
      status: 'submitted',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      flowNodes,
      currentNodeIndex: 1,
    };

    setApplications([newApp, ...applications]);
    setShowNewDialog(false);
    setNewForm({
      type: '' as LeaveType,
      startDate: '',
      endDate: '',
      duration: 1,
      reason: '',
      attachments: [],
    });
  };

  // 根据请假类型和天数构建流程节点
  const buildFlowNodes = (type: LeaveType, duration: number): ApprovalNodeItem[] => {
    const baseNodes: ApprovalNodeItem[] = [
      { id: 'start', name: '开始', type: 'start', status: 'approved' },
      { id: 'approval_grade', name: '年级组长审批', type: 'approval', status: 'processing', approver: 'head_teacher', approverName: '张小燕', isCurrent: true },
    ];

    // 根据请假类型和天数判断是否需要教务主任审批
    const needDeanApproval = 
      (type === '病假' && duration > 3) ||
      (type === '事假' && duration > 3) ||
      type === '公假';

    if (needDeanApproval) {
      baseNodes.push(
        { id: 'condition', name: '判断请假类型', type: 'condition', status: 'pending' },
        { id: 'approval_dean', name: '教务主任审批', type: 'approval', status: 'pending', approver: 'academic_director', approverName: '刘婷婷' }
      );
    }

    baseNodes.push(
      { id: 'arrange_class', name: '年段长调课安排', type: 'course_adjust', status: 'pending', approver: 'grade_leader', approverName: '林国强' },
      { id: 'sync', name: '数据同步', type: 'sync', status: 'pending' },
      { id: 'end', name: '结束', type: 'end', status: 'pending' }
    );

    return baseNodes;
  };

  // 撤销申请
  const handleCancel = (id: string) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: 'cancelled' as const } : app
    ));
  };

  // 查看详情
  const handleViewDetail = (app: LeaveApplication) => {
    setSelectedApp(app);
    setShowDetailDialog(true);
  };

  // 统计
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'submitted').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">请假调课</h1>
          </div>
          <p className="text-gray-500 mt-1">提交请假申请，查看审批进度</p>
        </div>
        <Button 
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="h-4 w-4" />
          新建申请
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">全部申请</p>
                <p className="text-3xl font-bold text-gray-700">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">审批中</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已通过</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
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
                <p className="text-sm text-gray-500">已驳回</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 申请列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">我的申请</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="pending">审批中</TabsTrigger>
              <TabsTrigger value="approved">已通过</TabsTrigger>
              <TabsTrigger value="rejected">已驳回</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {applications.map(app => (
                <ApplicationCard 
                  key={app.id} 
                  app={app} 
                  onViewDetail={handleViewDetail}
                  onCancel={handleCancel}
                />
              ))}
            </TabsContent>
            <TabsContent value="pending" className="space-y-3">
              {applications.filter(a => a.status === 'submitted').map(app => (
                <ApplicationCard 
                  key={app.id} 
                  app={app} 
                  onViewDetail={handleViewDetail}
                  onCancel={handleCancel}
                />
              ))}
            </TabsContent>
            <TabsContent value="approved" className="space-y-3">
              {applications.filter(a => a.status === 'approved').map(app => (
                <ApplicationCard 
                  key={app.id} 
                  app={app} 
                  onViewDetail={handleViewDetail}
                  onCancel={handleCancel}
                />
              ))}
            </TabsContent>
            <TabsContent value="rejected" className="space-y-3">
              {applications.filter(a => a.status === 'rejected').map(app => (
                <ApplicationCard 
                  key={app.id} 
                  app={app} 
                  onViewDetail={handleViewDetail}
                  onCancel={handleCancel}
                />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 新建申请对话框 */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              新建请假申请
            </DialogTitle>
            <DialogDescription>
              填写请假信息，提交后将按照审批流程进行处理
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 请假类型 */}
            <div className="space-y-2">
              <Label>请假类型 <span className="text-red-500">*</span></Label>
              <Select
                value={newForm.type}
                onValueChange={(v) => setNewForm(prev => ({ ...prev, type: v as LeaveType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择请假类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div>
                        <span className="font-medium">{type}</span>
                        <span className="text-gray-400 text-xs ml-2">{config.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newForm.type && (
                <p className="text-xs text-gray-500 mt-1">
                  {leaveTypeConfig[newForm.type].attachmentDesc}
                </p>
              )}
            </div>

            {/* 请假时间 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={newForm.startDate}
                  onChange={(e) => {
                    const duration = calculateDuration(e.target.value, newForm.endDate);
                    setNewForm(prev => ({ ...prev, startDate: e.target.value, duration }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={newForm.endDate}
                  onChange={(e) => {
                    const duration = calculateDuration(newForm.startDate, e.target.value);
                    setNewForm(prev => ({ ...prev, endDate: e.target.value, duration }));
                  }}
                />
              </div>
            </div>

            {/* 请假天数 */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-blue-700">
                请假天数：<strong>{newForm.duration}</strong> 天
              </span>
            </div>

            {/* 请假原因 */}
            <div className="space-y-2">
              <Label>请假原因 <span className="text-red-500">*</span></Label>
              <Textarea
                value={newForm.reason}
                onChange={(e) => setNewForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="请详细说明请假原因..."
                rows={3}
              />
            </div>

            {/* 附件上传 */}
            <div className="space-y-2">
              <Label>
                附件材料
                {newForm.type && leaveTypeConfig[newForm.type].requireAttachment && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽上传附件</p>
                <p className="text-xs text-gray-400 mt-1">支持 PDF、JPG、PNG 格式</p>
              </div>
            </div>

            {/* 流程预览 */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">审批流程预览</Label>
              <div className="flex items-center gap-1 text-xs text-gray-500 overflow-x-auto pb-2">
                {newForm.type ? (
                  <>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">开始</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">年级组长</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    {((newForm.type === '病假' && newForm.duration > 3) ||
                      (newForm.type === '事假' && newForm.duration > 3) ||
                      newForm.type === '公假') && (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">教务主任</span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      </>
                    )}
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded">调课安排</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">数据同步</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">结束</span>
                  </>
                ) : (
                  <span className="text-gray-400">请选择请假类型后查看流程</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>取消</Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSubmit}
              disabled={!newForm.type || !newForm.startDate || !newForm.endDate || !newForm.reason}
            >
              <Send className="h-4 w-4 mr-1" />
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedApp.status)}
                  <Badge variant="outline">{selectedApp.type}</Badge>
                </div>
                <span className="text-sm text-gray-500">{selectedApp.createdAt}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">请假时间</Label>
                  <p className="font-medium">{selectedApp.startDate} 至 {selectedApp.endDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">请假天数</Label>
                  <p className="font-medium">{selectedApp.duration} 天</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">请假原因</Label>
                <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">{selectedApp.reason}</p>
              </div>

              {/* 审批进度 */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-700 mb-4 block">审批进度</Label>
                <div className="space-y-3">
                  {selectedApp.flowNodes.map((node, index) => (
                    <div 
                      key={node.id}
                      className={`relative flex items-start gap-3 ${index < selectedApp.flowNodes.length - 1 ? 'pb-4' : ''}`}
                    >
                      {/* 连接线 */}
                      {index < selectedApp.flowNodes.length - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      
                      {/* 状态图标 */}
                      <div className="relative z-10">
                        {getNodeStatusIcon(node.status)}
                      </div>
                      
                      {/* 节点内容 */}
                      <div className={`flex-1 p-3 rounded-lg border ${getNodeTypeColor(node.type)} ${node.isCurrent ? 'ring-2 ring-blue-300' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{node.name}</span>
                            {node.isCurrent && (
                              <Badge className="bg-blue-500 text-white text-xs">当前</Badge>
                            )}
                          </div>
                          {node.approverName && (
                            <span className="text-xs text-gray-500">{node.approverName}</span>
                          )}
                        </div>
                        {node.approvedAt && (
                          <p className="text-xs text-gray-500 mt-1">{node.approvedAt}</p>
                        )}
                        {node.comment && (
                          <p className="text-xs text-gray-600 mt-1 bg-white/50 p-2 rounded">
                            "{node.comment}"
                          </p>
                        )}
                        {node.type === 'sync' && node.status === 'approved' && (
                          <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            已同步至教师课表、班级课表、电子白板、教师考勤
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

// 申请卡片组件
function ApplicationCard({ 
  app, 
  onViewDetail, 
  onCancel 
}: { 
  app: LeaveApplication; 
  onViewDetail: (app: LeaveApplication) => void;
  onCancel: (id: string) => void;
}) {
  const currentNode = app.flowNodes[app.currentNodeIndex];

  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(app.status)}
              <Badge variant="outline">{app.type}</Badge>
              <span className="text-sm text-gray-500">{app.createdAt}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {app.startDate} 至 {app.endDate}
              </div>
              <span className="text-gray-400">|</span>
              <span>{app.duration} 天</span>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-1">{app.reason}</p>

            {/* 进度条 */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>审批进度</span>
                <span>{app.currentNodeIndex + 1} / {app.flowNodes.length}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${((app.currentNodeIndex + 1) / app.flowNodes.length) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600">
                  当前：{currentNode?.name || '已完成'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => onViewDetail(app)}
            >
              <Eye className="h-4 w-4" />
              查看详情
            </Button>
            {app.status === 'submitted' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 text-red-600 hover:text-red-700"
                onClick={() => onCancel(app.id)}
              >
                <Trash2 className="h-4 w-4" />
                撤销
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
