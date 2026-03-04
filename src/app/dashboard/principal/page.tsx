'use client';

/**
 * 校长工作台
 * 
 * 学校领导层的统一工作台入口
 * 主要功能：
 * - 消息面板：消息通知、任务提醒
 * - 发布中心：发布校级重大事件公告/新闻
 * - 审批中心：处理待审批的公告/新闻
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useApprovals } from '@/hooks/useApprovals';
import { MessagePanel } from '@/components/messaging/MessagePanel';
import { PublishNotificationDialog } from '@/components/approval/PublishNotificationDialog';
import { ApprovalActionDialog, ApprovalCard } from '@/components/approval/ApprovalActionDialog';
import type { ApprovalInstance, SubmitApprovalRequest } from '@/types/approval';
import {
  Bell,
  Users,
  Building2,
  Send,
  CheckCircle,
  Clock,
  FileText,
  Plus,
} from 'lucide-react';

export default function PrincipalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  // 消息 Hook
  const {
    messages,
    loading: messagesLoading,
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
    sendMessage,
  } = useMessages();

  // 审批 Hook
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

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchApprovals('pending');
    }
  }, [activeTab, fetchApprovals]);

  // 获取角色名称
  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      principal: '校长',
      secretary: '书记',
      academic_vice_principal: '教学副校长',
      moral_vice_principal: '德育副校长',
      general_vice_principal: '总务副校长',
    };
    return roleNames[role] || '领导';
  };

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
    if (success) {
      refreshStatistics();
    }
    return success;
  };

  const handleReject = async (instanceId: string, comment?: string) => {
    const success = await rejectApproval(instanceId, comment);
    if (success) {
      refreshStatistics();
    }
    return success;
  };

  const handleReturn = async (instanceId: string, comment?: string) => {
    const success = await returnApproval(instanceId, comment);
    if (success) {
      refreshStatistics();
    }
    return success;
  };

  const handleWithdraw = async (instanceId: string) => {
    const success = await withdrawApproval(instanceId);
    if (success) {
      refreshStatistics();
    }
    return success;
  };

  // 打开审批详情
  const handleOpenApproval = (instance: ApprovalInstance) => {
    setSelectedInstance(instance);
    setApprovalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getRoleName(user?.role || '')}工作台
          </h1>
          <p className="text-gray-500 mt-1">
            龙岩师范附属小学 · 智慧校园管理平台
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          <Badge className="bg-blue-500 text-white gap-1">
            <Building2 className="h-3 w-3" />
            校长室
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md">
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
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总消息数</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('approvals')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-red-600">{approvalStats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <CheckCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已处理</p>
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
                <p className="text-2xl font-bold text-purple-600">{approvalStats.my}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 发布按钮 */}
      <div className="flex justify-end">
        <Button onClick={() => setPublishOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          发布公告/新闻
        </Button>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages" className="gap-2">
            <Bell className="h-4 w-4" />
            消息中心
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            审批中心
            {approvalStats.pending > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs">
                {approvalStats.pending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 消息面板 */}
        <TabsContent value="messages" className="mt-4">
          <MessagePanel
            messages={messages}
            loading={messagesLoading}
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

        {/* 审批中心 */}
        <TabsContent value="approvals" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 待审批列表 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>待审批</CardTitle>
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
            </div>

            {/* 快捷操作 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">快捷操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      fetchApprovals('processed');
                      // 切换到已处理视图
                    }}
                  >
                    <Clock className="h-4 w-4" />
                    查看已处理
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      fetchApprovals('my');
                      // 切换到我发起的视图
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    我发起的
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">审批说明</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>• <strong>或签</strong>：任一审批人通过即可</p>
                  <p>• <strong>会签</strong>：所有审批人都需通过</p>
                  <p>• <strong>驳回</strong>：直接结束流程</p>
                  <p>• <strong>退回</strong>：退回申请人修改</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 发布对话框 */}
      <PublishNotificationDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSubmit={handleSubmit}
        department="principal_office"
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
