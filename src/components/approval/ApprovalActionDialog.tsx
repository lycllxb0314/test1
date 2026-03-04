'use client';

/**
 * 审批处理组件
 * 
 * 用于审批人查看待审批内容并执行审批操作
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Building2,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalInstance } from '@/types/approval';
import { 
  getApprovalStatusLabel, 
  getApprovalStatusColor,
  canUserApprove,
  canUserWithdraw,
} from '@/hooks/useApprovals';

// ==================== 类型定义 ====================

export interface ApprovalActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: ApprovalInstance | null;
  currentUserId: string;
  onApprove: (instanceId: string, comment?: string) => Promise<boolean>;
  onReject: (instanceId: string, comment?: string) => Promise<boolean>;
  onReturn: (instanceId: string, comment?: string) => Promise<boolean>;
  onWithdraw: (instanceId: string) => Promise<boolean>;
}

// ==================== 组件实现 ====================

export function ApprovalActionDialog({
  open,
  onOpenChange,
  instance,
  currentUserId,
  onApprove,
  onReject,
  onReturn,
  onWithdraw,
}: ApprovalActionDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!instance) return null;

  const canApprove = canUserApprove(instance, currentUserId);
  const canWithdraw = canUserWithdraw(instance, currentUserId);
  const currentNode = instance.nodeRecords?.find(
    (n) => n.nodeOrder === instance.currentNodeOrder
  );

  const handleAction = async () => {
    if (!action) return;

    setLoading(true);
    let success = false;

    switch (action) {
      case 'approve':
        success = await onApprove(instance.id, comment);
        break;
      case 'reject':
        success = await onReject(instance.id, comment);
        break;
      case 'return':
        success = await onReturn(instance.id, comment);
        break;
    }

    setLoading(false);

    if (success) {
      setAction(null);
      setComment('');
      onOpenChange(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    const success = await onWithdraw(instance.id);
    setLoading(false);

    if (success) {
      onOpenChange(false);
    }
  };

  // 判断是否为请假类型
  const isLeaveRequest = instance.businessType === 'leave_request';
  // 使用类型断言来处理联合类型
  const leaveInfo = isLeaveRequest ? (instance.business as any) : null;
  
  // 获取业务类型显示名称
  const getBusinessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'leave_request': '请假审批',
      'announcement': '校园公告',
      'news': '新闻动态',
      'internal_notice': '内部通知',
      'parent_notice': '家长通知',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            审批详情
          </DialogTitle>
          <DialogDescription>
            审批编号：{instance.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{instance.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {instance.applicantName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {instance.applicantDepartment}
                    </span>
                  </div>
                </div>
                <Badge className={getApprovalStatusColor(instance.status)}>
                  {getApprovalStatusLabel(instance.status)}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">业务类型：</span>
                  <span>{getBusinessTypeLabel(instance.businessType)}</span>
                </div>
                <div>
                  <span className="text-gray-500">提交时间：</span>
                  <span>{new Date(instance.submitAt || instance.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 请假类型的详细信息 */}
          {isLeaveRequest && leaveInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">请假信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">请假类型：</span>
                    <span className="font-medium">{leaveInfo.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">请假时长：</span>
                    <span>{leaveInfo.duration} {leaveInfo.durationUnit === 'day' ? '天' : '小时'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">开始时间：</span>
                    <span>{leaveInfo.startDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">结束时间：</span>
                    <span>{leaveInfo.endDate}</span>
                  </div>
                </div>
                <Separator />
                <div className="text-sm">
                  <span className="text-gray-500">请假原因：</span>
                  <p className="mt-1 whitespace-pre-wrap">{leaveInfo.reason}</p>
                </div>
                {leaveInfo.needAdjustment && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>需要调课安排</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* 公告/新闻类型的审批内容 */}
          {!isLeaveRequest && instance.business && 'content' in instance.business && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">审批内容</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{instance.business.content}</p>
                </div>
                {'coverImage' in instance.business && instance.business.coverImage && (
                  <div className="mt-4">
                    <img
                      src={instance.business.coverImage}
                      alt="封面图片"
                      className="rounded-lg max-h-48 object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 审批流程 */}
          {!isLeaveRequest && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">审批流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {instance.nodeRecords
                  ?.sort((a, b) => a.nodeOrder - b.nodeOrder)
                  .map((node, index) => {
                    const isCurrent = node.nodeOrder === instance.currentNodeOrder;
                    const isPast = node.nodeOrder < instance.currentNodeOrder;

                    return (
                      <div
                        key={node.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg',
                          isCurrent && 'bg-blue-50 border border-blue-200',
                          isPast && 'bg-gray-50'
                        )}
                      >
                        {/* 状态图标 */}
                        <div
                          className={cn(
                            'p-1 rounded-full',
                            node.status === 'approved' && 'bg-green-100 text-green-600',
                            node.status === 'rejected' && 'bg-red-100 text-red-600',
                            node.status === 'pending' && 'bg-gray-100 text-gray-400',
                            isCurrent && node.status === 'pending' && 'bg-blue-100 text-blue-600'
                          )}
                        >
                          {node.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                          {node.status === 'rejected' && <XCircle className="h-4 w-4" />}
                          {node.status === 'pending' && <Clock className="h-4 w-4" />}
                        </div>

                        {/* 节点信息 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{node.nodeName}</span>
                            {isCurrent && (
                              <Badge variant="outline" className="text-xs">
                                当前节点
                              </Badge>
                            )}
                            {node.nodeType === 'or_sign' && (
                              <Badge variant="secondary" className="text-xs">
                                或签
                              </Badge>
                            )}
                            {node.nodeType === 'countersign' && (
                              <Badge variant="secondary" className="text-xs">
                                会签
                              </Badge>
                            )}
                          </div>

                          {/* 审批人信息 */}
                          {node.status === 'pending' && (
                            <p className="text-xs text-gray-500 mt-1">
                              待审批：{node.approverIds.length} 人
                              {node.nodeType === 'countersign' && (
                                <span className="ml-2">
                                  （已审批：{node.approvedBy.length} 人）
                                </span>
                              )}
                            </p>
                          )}

                          {/* 已审批记录 */}
                          {node.approvedBy && node.approvedBy.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {node.approvedBy.map((record, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="text-gray-600">{record.userName}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      record.action === 'approved' && 'text-green-600 border-green-300',
                                      record.action === 'rejected' && 'text-red-600 border-red-300',
                                      record.action === 'returned' && 'text-orange-600 border-orange-300'
                                    )}
                                  >
                                    {record.action === 'approved' && '通过'}
                                    {record.action === 'rejected' && '驳回'}
                                    {record.action === 'returned' && '退回'}
                                  </Badge>
                                  {record.comment && (
                                    <span className="text-gray-500">"{record.comment}"</span>
                                  )}
                                  <span className="text-gray-400">
                                    {new Date(record.time).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
          )}

          {/* 审批操作 */}
          {canApprove && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  审批操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 操作选择 */}
                <div className="flex gap-3">
                  <Button
                    variant={action === 'approve' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 gap-2',
                      action === 'approve' && 'bg-green-600 hover:bg-green-700'
                    )}
                    onClick={() => setAction('approve')}
                  >
                    <CheckCircle className="h-4 w-4" />
                    通过
                  </Button>
                  <Button
                    variant={action === 'reject' ? 'destructive' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setAction('reject')}
                  >
                    <XCircle className="h-4 w-4" />
                    驳回
                  </Button>
                  <Button
                    variant={action === 'return' ? 'secondary' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => setAction('return')}
                  >
                    <RotateCcw className="h-4 w-4" />
                    退回
                  </Button>
                </div>

                {/* 审批意见 */}
                {action && (
                  <div className="space-y-2">
                    <Label htmlFor="comment">
                      审批意见{action !== 'approve' && ' *'}
                    </Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        action === 'approve'
                          ? '可选填写审批意见'
                          : '请填写驳回/退回原因'
                      }
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 撤回操作 */}
          {canWithdraw && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={handleWithdraw}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4" />
                撤回申请
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {action && canApprove && (
            <Button
              onClick={handleAction}
              disabled={loading || (action !== 'approve' && !comment.trim())}
              className={cn(
                action === 'approve' && 'bg-green-600 hover:bg-green-700',
                action === 'reject' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {loading ? '处理中...' : '确认'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== 审批列表卡片组件 ====================

export interface ApprovalCardProps {
  instance: ApprovalInstance;
  currentUserId: string;
  onClick: () => void;
}

export function ApprovalCard({ instance, currentUserId, onClick }: ApprovalCardProps) {
  const canApprove = canUserApprove(instance, currentUserId);
  const currentNode = instance.nodeRecords?.find(
    (n) => n.nodeOrder === instance.currentNodeOrder
  );
  
  // 处理请假类型的审批
  const isLeaveRequest = instance.businessType === 'leave_request';
  // 使用类型断言来处理联合类型
  const leaveInfo = isLeaveRequest ? (instance.business as any) : null;
  const approvers = isLeaveRequest ? (instance.metadata?.approvers as any[] || []) : [];
  
  // 获取请假类型显示名称
  const getBusinessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'leave_request': '请假审批',
      'announcement': '公告审批',
      'news': '新闻审批',
      'internal_notice': '内部通知',
      'parent_notice': '家长通知',
    };
    return labels[type] || type;
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
        canApprove && 'border-l-4 border-l-blue-500 bg-blue-50/30'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getBusinessTypeLabel(instance.businessType)}
            </Badge>
            <h4 className="font-medium">{instance.title}</h4>
            {canApprove && (
              <Badge className="bg-blue-500 text-white text-xs">待我审批</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {instance.applicantName} · {instance.applicantDepartment}
          </p>
          
          {/* 请假类型显示详细信息 */}
          {isLeaveRequest && leaveInfo && (
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p>
                请假类型：{leaveInfo.type} · 
                时间：{leaveInfo.startDate} 至 {leaveInfo.endDate} · 
                共 {leaveInfo.duration} {leaveInfo.durationUnit === 'day' ? '天' : '小时'}
              </p>
              {leaveInfo.needAdjustment && (
                <p className="text-orange-600">需要调课安排</p>
              )}
            </div>
          )}
          
          {/* 公告/新闻类型显示当前节点 */}
          {!isLeaveRequest && currentNode && (
            <p className="text-xs text-gray-400 mt-1">
              当前节点：{currentNode.nodeName}
            </p>
          )}
          
          {/* 请假类型显示审批人 */}
          {isLeaveRequest && approvers.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              审批人：{approvers.map((a: any) => a.userName || a.name).join('、')}
            </p>
          )}
        </div>
        <div className="text-right">
          <Badge className={getApprovalStatusColor(instance.status)}>
            {getApprovalStatusLabel(instance.status)}
          </Badge>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(instance.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
