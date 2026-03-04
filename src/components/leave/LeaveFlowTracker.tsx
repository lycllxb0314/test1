'use client';

/**
 * 请假流程状态追踪组件
 * 
 * 可视化展示请假申请的完整流程状态：
 * 1. 提交申请
 * 2. 审批中
 * 3. 审批通过/驳回
 * 4. 调课安排
 * 5. 数据同步
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  FileText,
  UserCheck,
  CalendarClock,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// 流程步骤定义
export const FLOW_STEPS = [
  {
    key: 'submitted',
    title: '提交申请',
    description: '填写请假信息并提交',
    icon: FileText,
  },
  {
    key: 'approving',
    title: '审批中',
    description: '等待审批人审核',
    icon: UserCheck,
  },
  {
    key: 'approved',
    title: '审批通过',
    description: '审批人已批准',
    icon: CheckCircle,
  },
  {
    key: 'adjusting',
    title: '调课安排',
    description: '年段长安排课程调整',
    icon: CalendarClock,
  },
  {
    key: 'completed',
    title: '流程完成',
    description: '数据已同步',
    icon: Database,
  },
] as const;

export type FlowStepKey = typeof FLOW_STEPS[number]['key'];

export interface LeaveFlowStatus {
  currentStep: number; // 当前步骤索引 (0-4)
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  
  // 提交信息
  submittedAt?: string;
  applicantName?: string;
  
  // 审批信息
  approverName?: string;
  approverRole?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  
  // 调课信息
  adjusterName?: string;
  adjustmentCount?: number;
  completedAdjustments?: number;
  adjustedAt?: string;
  
  // 同步信息
  syncedAt?: string;
}

interface LeaveFlowTrackerProps {
  status: LeaveFlowStatus;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function LeaveFlowTracker({
  status,
  showDetails = true,
  compact = false,
  className,
}: LeaveFlowTrackerProps) {
  const { currentStep, status: leaveStatus } = status;
  
  // 计算每个步骤的状态
  const getStepState = (index: number): 'completed' | 'current' | 'pending' | 'error' => {
    if (leaveStatus === 'rejected' && index === 2) {
      return 'error'; // 审批驳回
    }
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };
  
  // 获取当前步骤显示信息
  const getCurrentStatusText = () => {
    if (leaveStatus === 'rejected') {
      return `已驳回：${status.rejectReason || '无原因'}`;
    }
    
    const step = FLOW_STEPS[currentStep];
    switch (step.key) {
      case 'submitted':
        return '申请已提交，等待进入审批流程';
      case 'approving':
        return `等待 ${status.approverName || '审批人'} 审批`;
      case 'approved':
        return `${status.approverName || '审批人'} 已批准`;
      case 'adjusting':
        if (status.adjustmentCount && status.adjustmentCount > 0) {
          const completed = status.completedAdjustments || 0;
          return `调课安排中 (${completed}/${status.adjustmentCount})`;
        }
        return '等待年段长安排调课';
      case 'completed':
        return '流程已完成，数据已同步';
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {FLOW_STEPS.map((step, index) => {
          const state = getStepState(index);
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.key}>
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all',
                  state === 'completed' && 'bg-green-100 text-green-600',
                  state === 'current' && 'bg-primary text-white',
                  state === 'pending' && 'bg-gray-100 text-gray-400',
                  state === 'error' && 'bg-red-100 text-red-600'
                )}
              >
                {state === 'completed' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : state === 'current' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : state === 'error' ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {index < FLOW_STEPS.length - 1 && (
                <ArrowRight className={cn(
                  'h-4 w-4',
                  index < currentStep ? 'text-green-500' : 'text-gray-300'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">流程进度</CardTitle>
          <Badge
            variant={leaveStatus === 'completed' ? 'default' : leaveStatus === 'rejected' ? 'destructive' : 'secondary'}
          >
            {leaveStatus === 'pending' && '进行中'}
            {leaveStatus === 'approved' && '已批准'}
            {leaveStatus === 'rejected' && '已驳回'}
            {leaveStatus === 'completed' && '已完成'}
          </Badge>
        </div>
        <CardDescription>{getCurrentStatusText()}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 步骤列表 */}
        <div className="relative">
          {/* 连接线 */}
          <div className="absolute left-[15px] top-[30px] bottom-[30px] w-[2px] bg-gray-200" />
          
          <div className="space-y-4">
            {FLOW_STEPS.map((step, index) => {
              const state = getStepState(index);
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex items-start gap-4 relative">
                  {/* 步骤图标 */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all',
                      state === 'completed' && 'bg-green-100 text-green-600 ring-2 ring-green-500',
                      state === 'current' && 'bg-primary text-white ring-2 ring-primary ring-offset-2',
                      state === 'pending' && 'bg-gray-100 text-gray-400',
                      state === 'error' && 'bg-red-100 text-red-600 ring-2 ring-red-500'
                    )}
                  >
                    {state === 'completed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : state === 'current' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : state === 'error' ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* 步骤内容 */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        'font-medium',
                        state === 'completed' && 'text-green-700',
                        state === 'current' && 'text-primary',
                        state === 'pending' && 'text-gray-400',
                        state === 'error' && 'text-red-600'
                      )}>
                        {step.title}
                      </h4>
                      {state === 'current' && (
                        <Badge variant="outline" className="text-xs">当前</Badge>
                      )}
                    </div>
                    <p className={cn(
                      'text-sm mt-0.5',
                      state === 'pending' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {step.description}
                    </p>
                    
                    {/* 详细信息 */}
                    {showDetails && state !== 'pending' && (
                      <StepDetails step={step.key} status={status} state={state} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 步骤详情组件
function StepDetails({ 
  step, 
  status, 
  state 
}: { 
  step: FlowStepKey; 
  status: LeaveFlowStatus;
  state: 'completed' | 'current' | 'error' | 'pending';
}) {
  const renderDetails = () => {
    switch (step) {
      case 'submitted':
        return (
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <p>申请人：{status.applicantName || '-'}</p>
            <p>提交时间：{status.submittedAt ? formatTime(status.submittedAt) : '-'}</p>
          </div>
        );
      
      case 'approving':
        if (status.approverName) {
          return (
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>审批人：{status.approverName} ({status.approverRole || '审批人'})</p>
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" />
                <span>等待审批中...</span>
              </div>
            </div>
          );
        }
        return null;
      
      case 'approved':
        if (status.approvedAt) {
          return (
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>审批人：{status.approverName}</p>
              <p>审批时间：{formatTime(status.approvedAt)}</p>
            </div>
          );
        }
        if (status.rejectedAt) {
          return (
            <div className="mt-2 text-sm text-red-500 space-y-1">
              <p>驳回人：{status.approverName}</p>
              <p>驳回时间：{formatTime(status.rejectedAt)}</p>
              {status.rejectReason && (
                <p>驳回原因：{status.rejectReason}</p>
              )}
            </div>
          );
        }
        return null;
      
      case 'adjusting':
        return (
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            {status.adjusterName && <p>调课负责人：{status.adjusterName}</p>}
            {status.adjustmentCount && status.adjustmentCount > 0 && (
              <p>
                调课进度：{status.completedAdjustments || 0} / {status.adjustmentCount} 节
              </p>
            )}
            {state === 'current' && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" />
                <span>等待年段长处理...</span>
              </div>
            )}
          </div>
        );
      
      case 'completed':
        return (
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <p>完成时间：{status.syncedAt ? formatTime(status.syncedAt) : formatTime(status.adjustedAt || '')}</p>
            <p className="text-green-600">工作量数据已同步更新</p>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return <>{renderDetails()}</>;
}

// 格式化时间
function formatTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default LeaveFlowTracker;
