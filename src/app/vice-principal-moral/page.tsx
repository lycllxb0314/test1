'use client';

/**
 * 德育副校长工作台
 * 
 * 部门领导工作台特点：
 * - 部门通知：接收上级通知和本部门重要消息
 * - 待办事项：需要本人审批的事项
 * - 业务概况：德育相关业务数据统计
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
import { ApprovalActionDialog, ApprovalCard } from '@/components/approval/ApprovalActionDialog';
import type { ApprovalInstance } from '@/types/approval';
import Link from 'next/link';
import {
  Bell,
  Users,
  Heart,
  CheckCircle,
  Clock,
  FileText,
  Award,
  AlertCircle,
  Activity,
  ArrowRight,
  Settings,
  Calendar,
} from 'lucide-react';

export default function VicePrincipalMoralDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [selectedInstance, setSelectedInstance] = useState<ApprovalInstance | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  // 消息 Hook - 传入部门参数
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
  } = useMessages('vice-principal-moral');

  // 审批 Hook - 传入部门参数
  const {
    approvals,
    loading: approvalsLoading,
    fetchApprovals,
    approveApproval,
    rejectApproval,
    returnApproval,
    withdrawApproval,
    statistics: approvalStats,
  } = useApprovals('pending', 'vice-principal-moral');

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchApprovals('pending');
    }
  }, [activeTab, fetchApprovals]);

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
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-pink-50/30 via-white to-rose-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">德育副校长工作台</h1>
          <p className="text-gray-500 mt-1">
            龙岩师范附属小学 · 德育管理 · 审批决策
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          <Badge className="bg-pink-500 text-white gap-1">
            <Heart className="h-3 w-3" />
            德育副校长
          </Badge>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/vice-principal-moral/honor-approval" className="block">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">荣誉审批</p>
                  <p className="text-2xl font-bold text-purple-600">{approvalStats.pending}</p>
                  <p className="text-xs text-gray-400 mt-1">待审批</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-purple-600">
                <span>前往审批</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('messages')}>
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
                <p className="text-sm text-gray-500">本月活动</p>
                <p className="text-2xl font-bold text-pink-600">0</p>
                <p className="text-xs text-gray-400 mt-1">德育活动</p>
              </div>
              <div className="p-2 rounded-lg bg-pink-100">
                <Activity className="h-5 w-5 text-pink-600" />
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
        </TabsList>

        {/* 部门通知 */}
        <TabsContent value="messages">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">部门通知</CardTitle>
              <CardDescription>
                来自校长室等上级部门的通知，以及德育相关的重要通知
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
                    需要德育副校长审批的事项，如荣誉评选终审等
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
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
      </Tabs>

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
