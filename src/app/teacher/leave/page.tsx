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
    draft: { label: '草稿', className: 'bg-muted text-muted-foreground' },
    submitted: { label: '审批中', className: 'bg-primary/10 text-primary' },
    approved: { label: '已通过', className: 'bg-green-500/10 text-green-600' },
    rejected: { label: '已驳回', className: 'bg-destructive/10 text-destructive' },
    cancelled: { label: '已撤销', className: 'bg-muted text-muted-foreground' },
  };
  const { label, className } = statusMap[status] || { label: status, className: 'bg-muted text-muted-foreground' };
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
      completed: 'approved', // completed 也映射为 approved
      rejected: 'rejected',
      cancelled: 'cancelled',
    };
    return map[status] || 'submitted';
  };

  // 从 API 数据构建流程节点
  const buildFlowNodesFromData = (item: Record<string, unknown>): ApprovalNodeItem[] => {
    // 简化：根据状态构建节点
    // API 返回驼峰格式，但也要兼容下划线格式
    const status = (item.status || item.leave_status) as string;
    const currentStep = (item.currentStep || item.current_step) as number;
    const adjustmentStatus = (item.adjustmentStatus || item.adjustment_status) as string;
    
    console.log('[buildFlowNodesFromData]', { 
      id: item.id, 
      status, 
      currentStep, 
      adjustmentStatus,
      needAdjustment: item.needAdjustment || item.need_adjustment 
    });
    
    const nodes: ApprovalNodeItem[] = [
      { id: 'start', name: '开始', type: 'start', status: 'approved' },
    ];
    
    // 审批人信息 - 支持两种字段名格式
    const approvers = (item.approverSelection || item.approver_selection || []) as Array<{ userName: string; employeeId: string }>;
    
    // 审批节点
    const approvalStatus = status === 'approved' || status === 'completed' ? 'approved' : 
                          status === 'rejected' ? 'rejected' : 
                          status === 'pending' ? 'processing' : 'pending';
    
    nodes.push({
      id: 'approval_1',
      name: approvers.length > 0 ? `${approvers[0]?.userName || '审批人'}审批` : '校长室审批',
      type: 'approval',
      status: approvalStatus,
      approverName: approvers[0]?.userName || '待审批',
      isCurrent: status === 'pending' && currentStep === 1,
    });
    
    // 调课节点 - 根据是否需要调课和当前步骤判断
    const needAdjustment = (item.needAdjustment || item.need_adjustment) as boolean;
    const affectedSlots = (item.affectedSlots || item.affected_slots || []) as unknown[];
    
    // 如果不需要调课，直接跳过调课和同步节点
    if (needAdjustment && affectedSlots.length > 0) {
      // 调课节点状态
      const adjustNodeStatus = adjustmentStatus === 'completed' ? 'approved' : 
                               adjustmentStatus === 'processing' ? 'processing' : 
                               currentStep >= 2 ? 'processing' : 'pending';
      
      nodes.push({
        id: 'arrange_class',
        name: '年段长调课安排',
        type: 'course_adjust',
        status: adjustNodeStatus,
        isCurrent: currentStep >= 2 && adjustmentStatus !== 'completed',
      });
      
      // 同步节点
      nodes.push(
        { 
          id: 'sync', 
          name: '数据同步', 
          type: 'sync', 
          status: adjustmentStatus === 'completed' ? 'approved' : 'pending' 
        },
        { 
          id: 'end', 
          name: '结束', 
          type: 'end', 
          status: status === 'completed' || (status === 'approved' && adjustmentStatus === 'completed') ? 'approved' : 'pending' 
        }
      );
    } else {
      // 不需要调课，直接到结束
      nodes.push(
        { id: 'end', name: '结束', type: 'end', status: status === 'approved' || status === 'completed' ? 'approved' : 'pending' }
      );
    }
    
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
    <div className="p-6 lg:p-8 space-y-6 bg-muted/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">请假调课</h1>
          </div>
          <p className="text-muted-foreground mt-1">提交请假申请，查看审批进度</p>
        </div>
        <Button 
          className="gap-2"
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
                <p className="text-sm text-muted-foreground">全部申请</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">审批中</p>
                <p className="text-3xl font-bold text-primary">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已驳回</p>
                <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
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
                <span className="text-sm text-muted-foreground">{selectedApp.createdAt}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">请假时间</Label>
                  <p className="font-medium">{selectedApp.startDate} 至 {selectedApp.endDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">请假天数</Label>
                  <p className="font-medium">{selectedApp.duration} 天</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">请假原因</Label>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">{selectedApp.reason}</p>
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
  // 使用与 LeaveFlowTracker 相同的步骤定义
  const flowSteps = [
    { key: 'submitted', title: '提交申请' },
    { key: 'approving', title: '审批中' },
    { key: 'approved', title: '审批通过' },
    { key: 'adjusting', title: '调课安排' },
    { key: 'completed', title: '流程完成' },
  ];

  // 计算当前步骤索引（与 convertToFlowStatus 逻辑一致）
  const getCurrentStepIndex = (): number => {
    if (app.status === 'approved') return 4;
    if (app.status === 'rejected') return 2;
    
    // submitted 状态
    const approvalNode = app.flowNodes.find(n => n.type === 'approval');
    const adjustNode = app.flowNodes.find(n => n.type === 'course_adjust');
    
    if (adjustNode?.status === 'processing' || adjustNode?.status === 'approved') {
      return 3; // 调课安排中
    }
    if (approvalNode?.status === 'approved') {
      return 2; // 审批通过
    }
    if (approvalNode?.status === 'processing') {
      return 1; // 审批中
    }
    return 0; // 刚提交
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentStep = flowSteps[currentStepIndex];

  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(app.status)}
              <Badge variant="outline">{app.type}</Badge>
              <span className="text-sm text-muted-foreground">{app.createdAt}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {app.startDate} 至 {app.endDate}
              </div>
              <span className="text-border">|</span>
              <span>{app.duration} 天</span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-1">{app.reason}</p>

            {/* 流程步骤 - 与详情页保持一致 */}
            <div className="mt-3">
              <div className="flex items-center gap-1">
                {flowSteps.map((step, index) => (
                  <React.Fragment key={step.key}>
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index < currentStepIndex
                          ? 'bg-green-500/10 text-green-600'
                          : index === currentStepIndex
                          ? app.status === 'rejected' && index === 2
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : index === currentStepIndex ? (
                        index + 1
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < flowSteps.length - 1 && (
                      <div className={`h-0.5 w-4 ${index < currentStepIndex ? 'bg-green-500/50' : 'bg-border'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Clock className="h-3 w-3 text-primary" />
                <span className={app.status === 'rejected' ? 'text-destructive' : 'text-primary'}>
                  当前：{app.status === 'rejected' ? '已驳回' : currentStep?.title || '已完成'}
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
