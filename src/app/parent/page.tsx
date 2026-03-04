'use client';

/**
 * 家长工作台
 * 
 * 家长的统一工作台入口
 * 主要展示消息面板，支持接收学校通知、班级消息等
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { MessagePanel } from '@/components/messaging/MessagePanel';
import {
  Bell,
  Users,
  Calendar,
} from 'lucide-react';

export default function ParentDashboard() {
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
  } = useMessages();

  // 子女信息
  const children = user?.children || [];

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gradient-to-br from-cyan-50/30 via-white to-teal-50/30">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">家长工作台</h1>
            <p className="text-white/80 mt-1">欢迎，{user?.name || '家长'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">今日</p>
            <p className="text-lg font-medium">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {/* 子女信息卡片 */}
      {children.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-cyan-100">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">子女</p>
                <div className="flex items-center gap-2 mt-1">
                  {children.map((child, index) => (
                    <Badge key={index} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                      {child.name} · {child.className}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-sm text-gray-500">今日</p>
                <p className="text-lg font-bold text-cyan-600">
                  {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-100">
                <Calendar className="h-5 w-5 text-cyan-600" />
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
      />
    </div>
  );
}
