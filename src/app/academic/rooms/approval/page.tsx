'use client';

/**
 * 教室预约审批页面
 * 
 * 与部门待办事项共用相同的审批API，保证数据一致性
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  Search,
  FileText,
  AlertTriangle,
  User,
  Building,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalActionDialog, ApprovalCard } from '@/components/approval/ApprovalActionDialog';
import type { ApprovalInstance } from '@/types/approval';

// 类型定义
type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'in_progress';
type BookingPurpose = 'teaching' | 'meeting' | 'training' | 'activity' | 'exam' | 'defense' | 'competition' | 'other';

// 状态映射
const statusMap: Record<BookingStatus, { label: string; color: string; icon: any }> = {
  pending: { label: '待审批', color: 'text-orange-600 bg-orange-50', icon: Clock },
  approved: { label: '已批准', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50', icon: XCircle },
  cancelled: { label: '已取消', color: 'text-gray-600 bg-gray-50', icon: AlertTriangle },
  completed: { label: '已完成', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  in_progress: { label: '进行中', color: 'text-purple-600 bg-purple-50', icon: Clock },
};

// 用途映射
const purposeMap: Record<BookingPurpose, { label: string; color: string }> = {
  teaching: { label: '教学活动', color: 'text-blue-600 bg-blue-50' },
  meeting: { label: '教研会议', color: 'text-green-600 bg-green-50' },
  training: { label: '培训讲座', color: 'text-purple-600 bg-purple-50' },
  activity: { label: '学生活动', color: 'text-pink-600 bg-pink-50' },
  exam: { label: '考试', color: 'text-orange-600 bg-orange-50' },
  defense: { label: '答辩', color: 'text-teal-600 bg-teal-50' },
  competition: { label: '比赛', color: 'text-indigo-600 bg-indigo-50' },
  other: { label: '其他', color: 'text-gray-600 bg-gray-50' },
};

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function RoomApprovalPage() {
  const { user } = useAuth();
  
  // 数据状态
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  
  // 审批详情弹窗
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 获取教室预约审批列表
  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取教室预约类型的待审批列表
      const res = await fetch('/api/approvals?type=pending&department=academic');
      const data: ApiResponse<{ instances: ApprovalInstance[] }> = await res.json();
      
      if (data.success && data.data) {
        // 过滤只显示教室预约类型
        const roomBookingApprovals = (data.data as any).instances?.filter(
          (inst: ApprovalInstance) => inst.businessType === 'room_booking'
        ) || [];
        setApprovals(roomBookingApprovals);
      } else {
        setError(data.error || '获取审批列表失败');
      }
    } catch (err) {
      console.error('获取审批列表失败:', err);
      setError('获取审批列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // 执行审批操作
  const handleApprovalAction = async (
    action: 'approve' | 'reject' | 'return',
    comment?: string
  ) => {
    if (!selectedInstance) return false;
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/approvals/action', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: selectedInstance.id,
          action,
          comment,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 刷新列表
        await fetchApprovals();
        setApprovalOpen(false);
        setSelectedInstance(null);
        return true;
      } else {
        alert(data.error || '操作失败');
        return false;
      }
    } catch (err) {
      console.error('审批操作失败:', err);
      alert('操作失败，请重试');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // 审批操作处理函数
  const handleApprove = async (instanceId: string, comment?: string) => {
    return handleApprovalAction('approve', comment);
  };

  const handleReject = async (instanceId: string, comment?: string) => {
    return handleApprovalAction('reject', comment);
  };

  const handleReturn = async (instanceId: string, comment?: string) => {
    return handleApprovalAction('return', comment);
  };

  const handleWithdraw = async (instanceId: string) => {
    // 教室预约审批人不允许撤回
    alert('审批人无法撤回审批');
    return false;
  };

  // 过滤审批列表
  const filteredApprovals = approvals.filter((approval) => {
    const matchSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (approval.applicantName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || approval.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 统计
  const stats = {
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  };

  // 打开审批详情
  const handleOpenApproval = (instance: ApprovalInstance) => {
    setSelectedInstance(instance);
    setApprovalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">预约审批</h1>
          </div>
          <p className="text-gray-500 mt-1">审批教师提交的教室预约申请</p>
        </div>
        <Button variant="outline" onClick={fetchApprovals}>
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选区 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索预约标题、申请人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 审批列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>预约列表</CardTitle>
          <CardDescription>
            点击查看详情并进行审批操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-red-300" />
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchApprovals}>
                重试
              </Button>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>暂无{statusFilter === 'pending' ? '待审批的' : ''}预约申请</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  instance={approval}
                  currentUserId={user?.id || ''}
                  onClick={() => handleOpenApproval(approval)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审批详情弹窗 */}
      <ApprovalActionDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        instance={selectedInstance}
        currentUserId={user?.id || ''}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}
