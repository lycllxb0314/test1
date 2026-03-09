'use client';

/**
 * 总务处工作台
 * 
 * 部门工作台特点：
 * - 部门通知：接收校长室等上级部门的通知
 * - 待办事项：本部门需要处理的审批和任务
 * - 业务概况：总务相关业务数据统计
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
  Wrench,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  AlertTriangle,
  Shield,
  AlertCircle,
  Package,
} from 'lucide-react';

export default function GeneralDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'announcement' | 'news' | 'internal_notice'>('announcement');
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  // 消息 Hook - 传入部门参数，只显示部门通知和总务相关业务通知
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
    sendMessage,
  } = useMessages('general');

  // 审批 Hook - 传入部门参数，只显示总务相关的审批
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
  } = useApprovals('pending', 'general');

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchApprovals('pending');
    }
  }, [activeTab, fetchApprovals]);

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
    return await approveApproval(instanceId, comment);
  };

  const handleReject = async (instanceId: string, comment?: string) => {
    return await rejectApproval(instanceId, comment);
  };

  const handleReturn = async (instanceId: string, comment?: string) => {
    return await returnApproval(instanceId, comment);
  };

  const handleWithdraw = async (instanceId: string) => {
    return await withdrawApproval(instanceId);
  };

  // 打开审批详情
  const handleOpenApproval = (instance: ApprovalInstance) => {
    setSelectedInstance(instance);
    setApprovalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">总务处工作台</h1>
          <p className="text-gray-500 mt-1">
            龙岩师范附属小学 · 后勤保障 · 资产管理 · 校园安全
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          <Badge className="bg-green-500 text-white gap-1">
            <Wrench className="h-3 w-3" />
            总务处
          </Badge>
        </div>
      </div>

      {/* 部门工作台统计卡片 - 部门视角 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">部门通知</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.unread}</p>
                <p className="text-xs text-gray-400 mt-1">未读通知</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('approvals')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待办事项</p>
                <p className="text-2xl font-bold text-red-600">{approvalStats.pending}</p>
                <p className="text-xs text-gray-400 mt-1">需处理审批</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">报修工单</p>
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-xs text-gray-400 mt-1">待处理</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Wrench className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">安全检查</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
                <p className="text-xs text-gray-400 mt-1">待完成</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="messages" className="gap-2">
            <Bell className="h-4 w-4" />
            部门通知
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            待办事项
          </TabsTrigger>
          <TabsTrigger value="publish" className="gap-2">
            <FileText className="h-4 w-4" />
            发布通知
          </TabsTrigger>
        </TabsList>

        {/* 部门通知 */}
        <TabsContent value="messages">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">部门通知</CardTitle>
              <CardDescription>
                来自校长室等上级部门的通知，以及总务相关的业务通知
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessagePanel
                messages={messages}
                loading={messagesLoading}
                error={messagesError}
                unreadCount={statistics.unread}
                statistics={{ total: statistics.total, unread: statistics.unread }}
                pagination={{ page, pageSize, total, totalPages }}
                onRefresh={refetch}
                onMarkAsRead={markAsRead}
                onMarkAsUnread={markAsUnread}
                onArchive={archiveMessage}
                onDelete={deleteMessage}
                onMarkAllAsRead={markAllAsRead}
                onPageChange={goToPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 待办事项 */}
        <TabsContent value="approvals">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">待办事项</CardTitle>
                  <CardDescription>
                    总务相关审批事项，如报修申请、资产采购等
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : approvals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无待办事项</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map((approval) => (
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
        </TabsContent>

        {/* 发布通知 */}
        <TabsContent value="publish">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">发布通知</CardTitle>
              <CardDescription>
                发布总务相关的公告、新闻或通知
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={() => { setSelectedType('announcement'); setPublishOpen(true); }}>
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-full bg-green-100 w-fit mx-auto mb-3">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium">校园公告</h3>
                    <p className="text-sm text-gray-500 mt-1">发布到学校主页</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={() => { setSelectedType('news'); setPublishOpen(true); }}>
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-full bg-purple-100 w-fit mx-auto mb-3">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium">新闻动态</h3>
                    <p className="text-sm text-gray-500 mt-1">发布到学校主页</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={() => { setSelectedType('internal_notice'); setPublishOpen(true); }}>
                  <CardContent className="p-6 text-center">
                    <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-3">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium">内部通知</h3>
                    <p className="text-sm text-gray-500 mt-1">仅校内可见</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 发布弹窗 */}
      <PublishNotificationDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSubmit={handleSubmit}
        department="总务处"
        defaultType={selectedType}
      />

      {/* 审批详情弹窗 */}
      <ApprovalActionDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        instance={selectedInstance}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
        onWithdraw={handleWithdraw}
        currentUserId={user?.id || ''}
      />
    </div>
  );
}
