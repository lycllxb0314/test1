'use client';

/**
 * 校长工作台
 * 
 * 学校领导层的统一工作台入口
 * 主要展示消息面板，支持消息通知、任务提醒等功能
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { MessagePanel } from '@/components/messaging/MessagePanel';
import {
  Bell,
  Sparkles,
  Users,
  Building2,
} from 'lucide-react';

export default function PrincipalDashboard() {
  const { user } = useAuth();

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

  // 获取角色名称
  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      principal: '校长',
      secretary: '书记',
      vice_principal: '副校长',
    };
    return roleNames[role] || '领导';
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
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">归档消息</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.archived}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 消息面板 */}
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
    </div>
  );
}
