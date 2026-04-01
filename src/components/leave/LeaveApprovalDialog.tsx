'use client';

/**
 * 请假审批弹窗组件
 * 
 * 用于审批人查看请假申请详情并进行审批/驳回操作
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// 请假申请数据类型
interface LeaveRequestData {
  id: string;
  applicant_id: string;
  applicant_name: string;
  type: string;
  start_date: string;
  end_date: string;
  duration: number;
  reason: string;
  attachments: Array<{ name: string; url: string }>;
  status: string;
  approver_selection: Array<{
    employeeId: string;
    userName: string;
    signType: string;
  }>;
  approved_by_list: Array<{
    employeeId: string;
    userName: string;
    action: string;
    time: string;
  }>;
  created_at: string;
}

interface LeaveApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequestId: string | null;
  currentUserEmployeeId: string;
  onSuccess?: () => void;
}

// 请假类型映射
const LEAVE_TYPE_MAP: Record<string, string> = {
  '病假': 'bg-red-100 text-red-700',
  '事假': 'bg-orange-100 text-orange-700',
  '公假': 'bg-blue-100 text-blue-700',
  '婚假': 'bg-pink-100 text-pink-700',
  '产假': 'bg-purple-100 text-purple-700',
  '丧假': 'bg-gray-100 text-gray-700',
};

export function LeaveApprovalDialog({
  open,
  onOpenChange,
  leaveRequestId,
  currentUserEmployeeId,
  onSuccess,
}: LeaveApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveData, setLeaveData] = useState<LeaveRequestData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  // 加载请假详情
  useEffect(() => {
    if (open && leaveRequestId) {
      fetchLeaveDetail();
    }
  }, [open, leaveRequestId]);

  const fetchLeaveDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leave-requests-v2/${leaveRequestId}`);
      const result = await response.json();
      
      if (result.success) {
        setLeaveData(result.data);
      } else {
        toast.error('获取请假详情失败');
      }
    } catch (err) {
      console.error('获取请假详情失败:', err);
      toast.error('获取请假详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 审批操作
  const handleApprove = async () => {
    if (!leaveRequestId) return;
    
    setSubmitting(true);
    setAction('approve');
    try {
      const response = await fetch(`/api/leave-requests-v2/${leaveRequestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('审批通过');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || '审批失败');
      }
    } catch (err) {
      console.error('审批失败:', err);
      toast.error('审批失败');
    } finally {
      setSubmitting(false);
      setAction(null);
    }
  };

  // 驳回操作
  const handleReject = async () => {
    if (!leaveRequestId) return;
    if (!rejectReason.trim()) {
      toast.error('请输入驳回原因');
      return;
    }
    
    setSubmitting(true);
    setAction('reject');
    try {
      const response = await fetch(`/api/leave-requests-v2/${leaveRequestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          rejectReason: rejectReason.trim(),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('已驳回');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || '驳回失败');
      }
    } catch (err) {
      console.error('驳回失败:', err);
      toast.error('驳回失败');
    } finally {
      setSubmitting(false);
      setAction(null);
    }
  };

  // 检查当前用户是否已审批
  const hasApproved = leaveData?.approved_by_list?.some(
    a => a.employeeId === currentUserEmployeeId
  );

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            请假审批
          </DialogTitle>
          <DialogDescription>
            查看请假申请详情并进行审批
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leaveData ? (
          <div className="space-y-4">
            {/* 申请人信息 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{leaveData.applicant_name}</span>
                  </div>
                  <Badge className={LEAVE_TYPE_MAP[leaveData.type] || 'bg-gray-100'}>
                    {leaveData.type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>开始：{formatDate(leaveData.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>结束：{formatDate(leaveData.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>时长：{leaveData.duration} 天</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>状态：
                      {leaveData.status === 'pending' ? '待审批' :
                       leaveData.status === 'approved' ? '已通过' :
                       leaveData.status === 'rejected' ? '已驳回' : leaveData.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 请假原因 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">请假原因</label>
              <p className="mt-1 text-sm bg-muted/50 rounded-md p-3">
                {leaveData.reason || '未填写'}
              </p>
            </div>

            {/* 审批人列表 */}
            {leaveData.approver_selection && leaveData.approver_selection.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">审批人</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {leaveData.approver_selection.map((approver, index) => {
                    const hasThisApproved = leaveData.approved_by_list?.some(
                      a => a.employeeId === approver.employeeId
                    );
                    const isCurrentUser = approver.employeeId === currentUserEmployeeId;
                    
                    return (
                      <Badge 
                        key={index}
                        variant={hasThisApproved ? 'default' : 'outline'}
                        className={isCurrentUser ? 'ring-2 ring-primary' : ''}
                      >
                        {approver.userName}
                        {hasThisApproved && ' ✓'}
                        {isCurrentUser && ' (我)'}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 已审批记录 */}
            {leaveData.approved_by_list && leaveData.approved_by_list.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">审批记录</label>
                <div className="mt-1 space-y-1">
                  {leaveData.approved_by_list.map((record, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      {record.action === 'approved' ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span>{record.userName}</span>
                      <span>{record.action === 'approved' ? '同意' : '驳回'}</span>
                      <span className="text-muted-foreground/60">
                        {formatDateTime(record.time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 驳回原因输入 */}
            {leaveData.status === 'pending' && !hasApproved && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  驳回原因（驳回时必填）
                </label>
                <Textarea
                  placeholder="请输入驳回原因..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            未找到请假申请
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {leaveData && leaveData.status === 'pending' && !hasApproved && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting && action === 'reject' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                驳回
              </Button>
              <Button
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting && action === 'approve' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                同意
              </Button>
            </>
          )}
          {hasApproved && (
            <Badge variant="secondary">您已审批过此申请</Badge>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LeaveApprovalDialog;
