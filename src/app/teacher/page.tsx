'use client';

/**
 * 教师工作台
 * 
 * 班主任和科任教师的统一工作台入口
 * 主要功能：
 * - 消息面板：消息通知、任务提醒
 * - 发布通知：发布班级事件给家长
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useApprovals } from '@/hooks/useApprovals';
import { MessagePanel } from '@/components/messaging/MessagePanel';
import { PublishNotificationDialog } from '@/components/approval/PublishNotificationDialog';
import type { SubmitApprovalRequest } from '@/types/approval';
import {
  Bell,
  Sparkles,
  Users,
  Plus,
  Send,
  GraduationCap,
} from 'lucide-react';

export default function TeacherPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [publishOpen, setPublishOpen] = useState(false);

  // 判断是否是班主任
  const isHeadTeacher = user?.role === 'head_teacher' || user?.role === 'principal' || user?.role === 'vice_principal';

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

  // 审批 Hook - 用于查看我发起的
  const {
    approvals,
    loading: approvalsLoading,
    fetchApprovals,
    submitApproval,
    statistics: approvalStats,
  } = useApprovals('my');

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'published') {
      fetchApprovals('my');
    }
  }, [activeTab, fetchApprovals]);

  // 发布处理 - 教师只能发布班级通知给家长
  const handleSubmit = async (request: SubmitApprovalRequest) => {
    // 教师发布的通知只发给家长，不需要审批
    const result = await submitApproval({
      ...request,
      department: 'teacher', // 教师发布的标识
      isExternal: false, // 教师不能发布到外部
    });
    if (result.success) {
      refetch();
    }
    return result;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isHeadTeacher ? '班主任工作台' : '教师工作台'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isHeadTeacher 
              ? `${user?.className || '我的班级'} · 班级管理与家校沟通` 
              : `${user?.department || '教学组'} · 教学与教研工作`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          <Badge className="bg-purple-500 text-white gap-1">
            <Sparkles className="h-3 w-3" />
            AI 助手
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
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
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已读消息</p>
                <p className="text-2xl font-bold text-green-600">{statistics.read}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('published')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">我发布的</p>
                <p className="text-2xl font-bold text-purple-600">{approvalStats.my}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 发布按钮 */}
      <div className="flex justify-end">
        <Button onClick={() => setPublishOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          发布班级通知
        </Button>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages" className="gap-2">
            <Bell className="h-4 w-4" />
            消息中心
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-2">
            <Send className="h-4 w-4" />
            我发布的
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
            onSendMessage={sendMessage}
            showSendButton={true}
          />
        </TabsContent>

        {/* 我发布的 */}
        <TabsContent value="published" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>我发布的通知</CardTitle>
                  <CardDescription>您发布的班级通知记录</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchApprovals('my')}>
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
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无发布记录</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 gap-2"
                    onClick={() => setPublishOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    发布第一条通知
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map((instance) => (
                    <div
                      key={instance.id}
                      className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{instance.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {instance.businessType === 'announcement' ? '班级通知' : '班级动态'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {new Date(instance.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 发布对话框 - 教师只能发布给班级家长 */}
      <PublishNotificationDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSubmit={handleSubmit}
        department="teacher"
        showExternalOption={false}
        showApprovalFlow={false}
        recipientTypes={['class']}
      />
    </div>
  );
}
