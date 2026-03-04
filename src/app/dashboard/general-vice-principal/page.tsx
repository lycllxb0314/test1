'use client';

/**
 * 总务副校长工作台
 * 
 * 学校总务后勤管理的统一工作台入口
 * 主要功能：
 * - 消息面板：消息通知、任务提醒
 * - 发布中心：发布总务相关公告
 * - 审批中心：处理待审批的请假申请、公告
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useApprovals } from '@/hooks/useApprovals';
import { useLeaveApproval } from '@/hooks/useLeaveApproval';
import { MessagePanel } from '@/components/messaging/MessagePanel';
import { PublishNotificationDialog } from '@/components/approval/PublishNotificationDialog';
import { ApprovalActionDialog, ApprovalCard } from '@/components/approval/ApprovalActionDialog';
import { LeaveApprovalCard } from '@/components/leave/LeaveApprovalCard';
import type { ApprovalInstance, SubmitApprovalRequest } from '@/types/approval';
import {
  Bell,
  Users,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Calendar,
} from 'lucide-react';

export default function GeneralVicePrincipalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('approvals');
  const [approvalSubTab, setApprovalSubTab] = useState<'announcement' | 'leave'>('leave');
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  // 消息 Hook
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    statistics,
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    refetch,
    markAsRead,
    markAsUnread,
    archiveMessage,
    deleteMessage,
    markAllAsRead,
  } = useMessages();

  // 审批 Hook（公告审批）
  const {
    approvals,
    loading: approvalsLoading,
    fetchApprovals,
    submitApproval,
    approveApproval,
    rejectApproval,
    returnApproval,
    withdrawApproval,
    statistics: approvalStats,
    refreshStatistics,
  } = useApprovals('pending');

  // 请假审批 Hook
  const {
    approvals: leaveApprovals,
    loading: leaveApprovalsLoading,
    statistics: leaveApprovalStats,
    fetchApprovals: fetchLeaveApprovals,
    approve: approveLeave,
    reject: rejectLeave,
  } = useLeaveApproval();

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'approvals') {
      if (approvalSubTab === 'announcement') {
        fetchApprovals('pending');
      } else {
        fetchLeaveApprovals('pending');
      }
    }
  }, [activeTab, approvalSubTab, fetchApprovals, fetchLeaveApprovals]);

  // 发布处理
  const handleSubmit = async (request: SubmitApprovalRequest) => {
    const result = await submitApproval(request);
    if (result.success) {
      refetch();
    }
    return result;
  };

  // 审批操作处理
  const handleApprove = async (instanceId: string, comment?: string) => {
    const success = await approveApproval(instanceId, comment);
    if (success) refreshStatistics();
    return success;
  };

  const handleReject = async (instanceId: string, comment?: string) => {
    const success = await rejectApproval(instanceId, comment);
    if (success) refreshStatistics();
    return success;
  };

  const handleReturn = async (instanceId: string, comment?: string) => {
    const success = await returnApproval(instanceId, comment);
    if (success) refreshStatistics();
    return success;
  };

  const handleWithdraw = async (instanceId: string) => {
    const success = await withdrawApproval(instanceId);
    if (success) refreshStatistics();
    return success;
  };

  // 打开审批详情
  const handleOpenApproval = (instance: ApprovalInstance) => {
    setSelectedInstance(instance);
    setApprovalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">总务副校长工作台</h1>
          <p className="text-gray-500 mt-1">
            龙岩师范附属小学 · 智慧校园管理平台
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          <Badge className="bg-amber-500 text-white gap-1">
            <Building2 className="h-3 w-3" />
            总务副校长
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('messages')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未读消息</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.unread}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setActiveTab('approvals'); setApprovalSubTab('leave'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">请假待审批</p>
                <p className="text-2xl font-bold text-purple-600">{leaveApprovalStats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setActiveTab('approvals'); setApprovalSubTab('announcement'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">公告待审批</p>
                <p className="text-2xl font-bold text-red-600">{approvalStats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已处理审批</p>
                <p className="text-2xl font-bold text-green-600">{approvalStats.processed}</p>
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
                <p className="text-sm text-gray-500">我发起</p>
                <p className="text-2xl font-bold text-cyan-600">{approvalStats.my}</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-100">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white shadow-sm border">
          <TabsTrigger value="approvals" className="gap-2">
            <FileText className="h-4 w-4" />
            审批中心
            {(leaveApprovalStats.pending + approvalStats.pending) > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs">
                {leaveApprovalStats.pending + approvalStats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <Bell className="h-4 w-4" />
            消息中心
            {statistics.unread > 0 && (
              <Badge className="ml-1 bg-orange-500 text-white text-xs">
                {statistics.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 审批中心 */}
        <TabsContent value="approvals" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100">
              <TabsTrigger 
                value="leave" 
                onClick={() => setApprovalSubTab('leave')}
                className={approvalSubTab === 'leave' ? 'bg-white shadow-sm' : ''}
              >
                请假审批
                {leaveApprovalStats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {leaveApprovalStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="announcement" 
                onClick={() => setApprovalSubTab('announcement')}
                className={approvalSubTab === 'announcement' ? 'bg-white shadow-sm' : ''}
              >
                公告审批
                {approvalStats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {approvalStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <Button onClick={() => setPublishOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              发布通知
            </Button>
          </div>

          {/* 请假审批列表 */}
          {approvalSubTab === 'leave' && (
            <div className="space-y-4">
              {leaveApprovalsLoading ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    加载中...
                  </CardContent>
                </Card>
              ) : leaveApprovals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>暂无待审批的请假申请</p>
                  </CardContent>
                </Card>
              ) : (
                leaveApprovals.map((item) => (
                  <LeaveApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={approveLeave}
                    onReject={rejectLeave}
                  />
                ))
              )}
            </div>
          )}

          {/* 公告审批列表 */}
          {approvalSubTab === 'announcement' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>待审批公告</CardTitle>
                    <CardDescription>需要您审批的公告/新闻</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchApprovals('pending')}>
                    刷新
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : approvals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无待审批内容</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvals.map((instance) => (
                      <ApprovalCard
                        key={instance.id}
                        instance={instance}
                        currentUserId={user?.id || ''}
                        onClick={() => handleOpenApproval(instance)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 消息中心 */}
        <TabsContent value="messages" className="mt-4">
          <MessagePanel
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            unreadCount={statistics.unread}
            statistics={statistics}
            pagination={{
              page,
              pageSize,
              total,
              totalPages,
            }}
            onRefresh={refetch}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onArchive={archiveMessage}
            onDelete={deleteMessage}
            onMarkAllAsRead={markAllAsRead}
            onPageChange={goToPage}
          />
        </TabsContent>
      </Tabs>

      {/* 发布通知对话框 */}
      <PublishNotificationDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSubmit={handleSubmit}
        department="general_office"
        showApprovalFlow={false}
        recipientTypes={['all', 'role', 'class', 'individual', 'group']}
      />

      {/* 审批详情对话框 */}
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
