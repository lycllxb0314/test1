'use client';

/**
 * 审批进度可视化组件
 * 
 * 显示审批流程的进度，包括：
 * - 当前审批节点
 * - 各节点的状态
 * - 审批人信息
 * - 审批时间线
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  ChevronRight,
  Users,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  ApprovalInstance,
  ApprovalNodeRecord,
  ApprovalStatus,
  ApprovalNodeType,
  ApprovalMode,
  ApproverLeaderRole,
} from '@/types/approval';

// ==================== 类型定义 ====================

interface ApprovalProgressProps {
  instance: ApprovalInstance;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
}

// ==================== 辅助函数 ====================

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600', icon: MinusCircle },
  pending: { label: '待提交', color: 'bg-gray-100 text-gray-600', icon: Clock },
  in_progress: { label: '审批中', color: 'bg-blue-100 text-blue-600', icon: Clock },
  approved: { label: '已通过', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-600', icon: XCircle },
  withdrawn: { label: '已撤回', color: 'bg-gray-100 text-gray-600', icon: MinusCircle },
};

const NODE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: '待审批', color: 'bg-amber-100 text-amber-600', icon: Clock },
  approved: { label: '已通过', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-600', icon: XCircle },
  skipped: { label: '已跳过', color: 'bg-gray-100 text-gray-600', icon: MinusCircle },
};

const LEADER_ROLE_LABELS: Record<ApproverLeaderRole, string> = {
  principal: '校长',
  secretary: '书记',
  academic_vice_principal: '教学副校长',
  moral_vice_principal: '德育副校长',
  general_vice_principal: '总务副校长',
};

// ==================== 组件实现 ====================

export function ApprovalProgress({ 
  instance, 
  showDetails = true,
  compact = false,
}: ApprovalProgressProps) {
  const { status, nodeRecords, selectedLeaders, approvalMode } = instance;
  const statusConfig = STATUS_CONFIG[status];

  // 按节点顺序排序
  const sortedRecords = [...(nodeRecords || [])].sort((a, b) => a.nodeOrder - b.nodeOrder);

  // 计算进度百分比
  const totalNodes = sortedRecords.length;
  const completedNodes = sortedRecords.filter(
    r => r.status === 'approved' || r.status === 'skipped'
  ).length;
  const progressPercent = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <statusConfig.icon className={cn("h-4 w-4", statusConfig.color.split(' ')[0].replace('bg-', 'text-'))} />
        <Badge variant="outline" className={statusConfig.color}>
          {statusConfig.label}
        </Badge>
        {status === 'in_progress' && (
          <span className="text-xs text-muted-foreground">
            {completedNodes}/{totalNodes}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 整体状态 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <statusConfig.icon className={cn("h-5 w-5", statusConfig.color.split(' ')[0].replace('bg-', 'text-'))} />
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
        {status === 'in_progress' && (
          <span className="text-sm text-muted-foreground">
            审批进度 {completedNodes}/{totalNodes}
          </span>
        )}
      </div>

      {/* 进度条 */}
      {status === 'in_progress' && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* 选定的审批领导 */}
      {selectedLeaders && selectedLeaders.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">审批人：</span>
          <div className="flex items-center gap-1">
            {selectedLeaders.map((leader, index) => (
              <React.Fragment key={leader}>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground mx-1">
                    {approvalMode === 'or_sign' ? '或' : '且'}
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {LEADER_ROLE_LABELS[leader]}
                </Badge>
              </React.Fragment>
            ))}
          </div>
          <Badge variant="outline" className="text-xs">
            {approvalMode === 'or_sign' ? '或签' : '会签'}
          </Badge>
        </div>
      )}

      {/* 节点时间线 */}
      {showDetails && sortedRecords.length > 0 && (
        <div className="space-y-3">
          {sortedRecords.map((record, index) => (
            <ApprovalNodeCard 
              key={record.id} 
              record={record}
              isLast={index === sortedRecords.length - 1}
              isCurrent={record.nodeOrder === instance.currentNodeOrder && status === 'in_progress'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 审批节点卡片 ====================

interface ApprovalNodeCardProps {
  record: ApprovalNodeRecord;
  isLast: boolean;
  isCurrent: boolean;
}

function ApprovalNodeCard({ record, isLast, isCurrent }: ApprovalNodeCardProps) {
  const nodeConfig = NODE_STATUS_CONFIG[record.status] || NODE_STATUS_CONFIG.pending;
  const { nodeName, nodeType, status, approvedBy, finishedAt } = record;

  return (
    <div className={cn(
      "relative pl-6 pb-4",
      !isLast && "border-l-2 border-gray-200 ml-3"
    )}>
      {/* 节点状态图标 */}
      <div className={cn(
        "absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center",
        isCurrent ? "bg-primary text-white" : nodeConfig.color
      )}>
        <nodeConfig.icon className="h-3.5 w-3.5" />
      </div>

      {/* 节点内容 */}
      <div className={cn(
        "ml-2 p-3 rounded-lg",
        isCurrent ? "bg-primary/5 border border-primary/20" : "bg-gray-50"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{nodeName}</span>
            <Badge variant="outline" className={cn("text-xs", nodeConfig.color)}>
              {nodeConfig.label}
            </Badge>
            {nodeType === 'or_sign' && (
              <Badge variant="outline" className="text-xs">或签</Badge>
            )}
            {nodeType === 'countersign' && (
              <Badge variant="outline" className="text-xs">会签</Badge>
            )}
          </div>
          {finishedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(finishedAt).toLocaleString('zh-CN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* 审批人信息 */}
        {approvedBy && approvedBy.length > 0 && (
          <div className="space-y-2">
            {approvedBy.map((action, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {action.userName.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span>{action.userName}</span>
                {action.action === 'approved' && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                    同意
                  </Badge>
                )}
                {action.action === 'rejected' && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                    驳回
                  </Badge>
                )}
                {action.action === 'returned' && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                    退回
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(action.time).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {action.comment && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    "{action.comment}"
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 待审批人 */}
        {status === 'pending' && record.approverIds && record.approverIds.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>待审批：{record.approverIds.length} 人</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 审批进度简化版 ====================

interface ApprovalProgressSimpleProps {
  status: ApprovalStatus;
  currentNode?: string;
  selectedLeaders?: ApproverLeaderRole[];
  approvalMode?: ApprovalMode;
}

export function ApprovalProgressSimple({ 
  status, 
  currentNode,
  selectedLeaders,
  approvalMode,
}: ApprovalProgressSimpleProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <statusConfig.icon className={cn("h-4 w-4", statusConfig.color.split(' ')[0].replace('bg-', 'text-'))} />
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </div>
      
      {status === 'in_progress' && currentNode && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronRight className="h-3 w-3" />
          <span>当前节点：{currentNode}</span>
        </div>
      )}

      {selectedLeaders && selectedLeaders.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronRight className="h-3 w-3" />
          <span>
            {selectedLeaders.map(l => LEADER_ROLE_LABELS[l]).join(approvalMode === 'or_sign' ? ' 或 ' : ' 且 ')}
          </span>
        </div>
      )}
    </div>
  );
}

export default ApprovalProgress;
