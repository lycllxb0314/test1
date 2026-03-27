/**
 * 请假审批卡片组件
 * 
 * 用于在审批中心展示待审批的请假申请
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import type { LeaveApprovalItem, ApproverSelection, AffectedSlot, ApprovalRecord } from '@/hooks/useLeaveApproval';

interface LeaveApprovalCardProps {
  item: LeaveApprovalItem;
  onApprove: (id: string) => Promise<{ success: boolean; message: string }>;
  onReject: (id: string, reason: string) => Promise<{ success: boolean; message: string }>;
}

// 请假类型标签
const LEAVE_TYPE_LABELS: Record<string, string> = {
  sick: '病假',
  personal: '事假',
  official: '公假',
  maternity: '产假',
  marriage: '婚假',
  funeral: '丧假',
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  sick: 'bg-red-100 text-red-700',
  personal: 'bg-blue-100 text-blue-700',
  official: 'bg-green-100 text-green-700',
  maternity: 'bg-purple-100 text-purple-700',
  marriage: 'bg-pink-100 text-pink-700',
  funeral: 'bg-gray-100 text-gray-700',
};

// 星期几
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function LeaveApprovalCard({ item, onApprove, onReject }: LeaveApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const result = await onApprove(item.id);
    setLoading(false);
    if (result.success) {
      setDetailDialogOpen(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    setLoading(true);
    const result = await onReject(item.id, rejectReason);
    setLoading(false);
    if (result.success) {
      setRejectDialogOpen(false);
      setDetailDialogOpen(false);
      setRejectReason('');
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
        onClick={() => setDetailDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={LEAVE_TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-700'}>
                  {LEAVE_TYPE_LABELS[item.type] || item.type}
                </Badge>
                {item.needAdjustment && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    需调课
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {item.applicantName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {item.startDate} 至 {item.endDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {item.duration}天
                </span>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                {item.reason}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                size="sm" 
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove();
                }}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                通过
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setRejectDialogOpen(true);
                }}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-1" />
                驳回
              </Button>
            </div>
          </div>
          
          {/* 审批人信息 */}
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            <span>审批人：</span>
            {item.approverSelection.map((a: ApproverSelection, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {a.name}
                {a.signType === 'countersign' ? '（会签）' : '（或签）'}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>请假申请详情</DialogTitle>
            <DialogDescription>
              {item.applicantName} 提交于 {new Date(item.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">请假类型</label>
                <p className="mt-1">
                  <Badge className={LEAVE_TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-700'}>
                    {LEAVE_TYPE_LABELS[item.type] || item.type}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">请假时长</label>
                <p className="mt-1 font-medium">{item.duration} {item.durationUnit === 'day' ? '天' : '小时'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">开始日期</label>
                <p className="mt-1 font-medium">{item.startDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">结束日期</label>
                <p className="mt-1 font-medium">{item.endDate}</p>
              </div>
            </div>
            
            {/* 请假原因 */}
            <div>
              <label className="text-sm font-medium text-gray-500">请假原因</label>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{item.reason}</p>
            </div>
            
            {/* 调课信息 */}
            {item.needAdjustment && item.affectedSlots.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">需调课节次</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.affectedSlots.map((slot: AffectedSlot, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      周{WEEKDAYS[slot.weekDay - 1]}第{slot.periodIndex + 1}节 - {slot.className} ({slot.subject})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* 审批人 */}
            <div>
              <label className="text-sm font-medium text-gray-500">审批人</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.approverSelection.map((a: ApproverSelection, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {a.name}
                    <span className="ml-1 text-xs text-gray-500">
                      {a.signType === 'countersign' ? '会签' : '或签'}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* 已审批记录 */}
            {item.approvedByList.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">审批记录</label>
                <div className="mt-2 space-y-2">
                  {item.approvedByList.map((a: ApprovalRecord, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{a.userName}</span>
                      <span className="text-gray-500">已于 {new Date(a.time).toLocaleString()} 同意</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setDetailDialogOpen(false);
                setRejectDialogOpen(true);
              }}
              disabled={loading}
            >
              驳回
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={loading}
            >
              {loading ? '处理中...' : '通过'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回请假申请</DialogTitle>
            <DialogDescription>
              请输入驳回原因，申请人将收到通知
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="请输入驳回原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={loading || !rejectReason.trim()}
            >
              {loading ? '处理中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
