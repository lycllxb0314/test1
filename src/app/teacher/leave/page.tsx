'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { LeaveFlowTracker, type LeaveFlowStatus } from '@/components/leave/LeaveFlowTracker';

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
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);

  // 获取请假列表
  const fetchApplications = async () => {
    if (!user?.employeeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/leave-requests-v2?my=true`);
      const result = await response.json();
      
      if (result.success) {
        // 转换 API 数据为页面格式
        const mappedApps = (result.data || []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          type: item.type as LeaveType,
          startDate: (item.start_date || item.startDate) as string,
          endDate: (item.end_date || item.endDate) as string,
          duration: (item.duration || 1) as number,
          reason: (item.reason || '') as string,
          attachments: (item.attachments || []) as string[],
          status: mapStatus(item.status as string),
          createdAt: (item.created_at || item.createdAt) as string,
          flowNodes: buildFlowNodesFromData(item),
          currentNodeIndex: (item.current_step || 1) as number,
        }));
        setApplications(mappedApps);
      } else {
        setError(result.error || '获取请假列表失败');
      }
    } catch (err) {
      console.error('获取请假列表失败:', err);
      setError('获取请假列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 状态映射
  const mapStatus = (status: string): 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' => {
    const map: Record<string, 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'> = {
      draft: 'draft',
      pending: 'submitted',
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'cancelled',
    };
    return map[status] || 'submitted';
  };

  // 从 API 数据构建流程节点
  const buildFlowNodesFromData = (item: Record<string, unknown>): ApprovalNodeItem[] => {
    // 简化：根据状态构建节点
    const status = item.status as string;
    const nodes: ApprovalNodeItem[] = [
      { id: 'start', name: '开始', type: 'start', status: 'approved' },
    ];
    
    // 审批人信息
    const approvers = (item.approver_selection || []) as Array<{ userName: string; employeeId: string }>;
    if (approvers.length > 0) {
      nodes.push({
        id: 'approval_1',
        name: '校长室审批',
        type: 'approval',
        status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status === 'pending' ? 'processing' : 'pending',
        approverName: approvers[0]?.userName || '待审批',
        isCurrent: status === 'pending',
      });
    }
    
    // 调课节点
    const adjustmentStatus = item.adjustment_status as string;
    nodes.push({
      id: 'arrange_class',
      name: '年段长调课安排',
      type: 'course_adjust',
      status: adjustmentStatus === 'completed' ? 'approved' : adjustmentStatus === 'processing' ? 'processing' : 'pending',
    });
    
    nodes.push(
      { id: 'sync', name: '数据同步', type: 'sync', status: adjustmentStatus === 'completed' ? 'approved' : 'pending' },
      { id: 'end', name: '结束', type: 'end', status: status === 'approved' && adjustmentStatus === 'completed' ? 'approved' : 'pending' }
    );
    
    return nodes;
  };

  // 初始加载
  useEffect(() => {
    fetchApplications();
  }, [user?.employeeId]);

  // 计算请假天数
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // 跳转到新建申请页面
  const handleNewApplication = () => {
    router.push('/teacher/leave-apply');
  };

  // 撤销申请 - 调用API
  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests-v2/${id}/cancel`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        // 刷新列表
        fetchApplications();
      } else {
        alert(result.error || '撤销失败');
      }
    } catch (err) {
      console.error('撤销失败:', err);
      alert('撤销失败');
    }
  };

  // 查看详情
  const handleViewDetail = (app: LeaveApplication) => {
    setSelectedApp(app);
    setShowDetailDialog(true);
  };

  // 转换为流程状态
  const convertToFlowStatus = (app: LeaveApplication): LeaveFlowStatus => {
    // 计算当前步骤
    let currentStep = 0;
    let flowStatus: 'pending' | 'approved' | 'rejected' | 'completed' = 'pending';
    
    if (app.status === 'submitted') {
      // 检查审批状态
      const approvalNode = app.flowNodes.find(n => n.type === 'approval');
      if (approvalNode?.status === 'processing') {
        currentStep = 1; // 审批中
      } else if (approvalNode?.status === 'approved') {
        currentStep = 2; // 审批通过
        flowStatus = 'approved';
      }
      
      // 检查调课状态
      const adjustNode = app.flowNodes.find(n => n.type === 'course_adjust');
      if (adjustNode?.status === 'processing' || adjustNode?.status === 'approved') {
        currentStep = 3; // 调课中
      }
    } else if (app.status === 'approved') {
      currentStep = 4; // 已完成
      flowStatus = 'completed';
    } else if (app.status === 'rejected') {
      currentStep = 2;
      flowStatus = 'rejected';
    }
    
    // 提取审批人信息
    const approvalNode = app.flowNodes.find(n => n.type === 'approval');
    const adjustNode = app.flowNodes.find(n => n.type === 'course_adjust');
    
    return {
      currentStep,
      status: flowStatus,
      submittedAt: app.createdAt,
      applicantName: user?.name,
      approverName: approvalNode?.approverName,
      approverRole: '校长室',
      approvedAt: approvalNode?.approvedAt,
      rejectedAt: app.status === 'rejected' ? app.createdAt : undefined,
      rejectReason: approvalNode?.comment,
      adjusterName: adjustNode?.approverName || '年段长',
      adjustedAt: adjustNode?.approvedAt,
      syncedAt: app.status === 'approved' ? app.createdAt : undefined,
    };
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
          onClick={() => router.push('/teacher/leave-apply')}
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

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

              {/* 流程进度追踪 */}
              <LeaveFlowTracker 
                status={convertToFlowStatus(selectedApp)} 
                showDetails={true}
              />
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
