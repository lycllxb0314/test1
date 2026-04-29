'use client';

/**
 * 教师工作台
 * 
 * 班主任和科任教师的统一工作台入口
 * 主要功能：
 * - 消息面板：消息通知、任务提醒
 * - 发布通知：发布班级事件给家长
 * - 调课中心：年段长专属功能
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useApprovals } from '@/hooks/useApprovals';
import { MessagePanel } from '@/components/messaging/MessagePanel';
import { PublishNotificationDialog } from '@/components/approval/PublishNotificationDialog';
import { CourseAdjustmentDialog } from '@/components/course-adjustment/CourseAdjustmentDialog';
import { PublishedTab } from '@/components/teacher/PublishedTab';
import { CourseAdjustmentTab } from '@/components/teacher/CourseAdjustmentTab';
import type { CourseAdjustment } from '@/components/course-adjustment/CourseAdjustmentDialog';
import type { SubmitApprovalRequest } from '@/types/approval';
import {
  Bell, Sparkles, Users, Plus, Send, CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [publishOpen, setPublishOpen] = useState(false);
  
  // 调课相关状态
  const [adjustments, setAdjustments] = useState<CourseAdjustment[]>([]);
  const [completedAdjustments, setCompletedAdjustments] = useState<CourseAdjustment[]>([]);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [adjustViewMode, setAdjustViewMode] = useState<'pending' | 'completed'>('pending');
  const [selectedAdjust, setSelectedAdjust] = useState<CourseAdjustment | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

  // 判断角色类型
  const isHeadTeacher = user?.role === 'head_teacher';
  const isLeader = ['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal'].includes(user?.role || '');
  const isGradeLeader = user?.additionalRoles?.includes('grade_leader');

  // 消息 Hook
  const {
    messages, loading: messagesLoading, error: messagesError, statistics,
    page, pageSize, total, totalPages, goToPage, refetch,
    markAsRead, markAsUnread, archiveMessage, deleteMessage, markAllAsRead, sendMessage,
  } = useMessages();

  // 审批 Hook
  const {
    approvals, loading: approvalsLoading, fetchApprovals, submitApproval, statistics: approvalStats,
  } = useApprovals('my');

  // 调课统计数据
  const adjustStats = {
    pending: adjustments.length,
    completed: completedAdjustments.length,
  };

  // 获取待处理调课列表
  const fetchPendingAdjustments = async () => {
    setAdjustmentLoading(true);
    try {
      const response = await fetch('/api/course-adjustments/process?status=pending');
      const data = await response.json();
      if (data.success) setAdjustments(data.data || []);
    } catch (error) {
      console.error('获取调课列表失败:', error);
      toast.error('获取调课列表失败');
    } finally {
      setAdjustmentLoading(false);
    }
  };

  // 获取已处理调课列表
  const fetchCompletedAdjustments = async () => {
    setCompletedLoading(true);
    try {
      const response = await fetch('/api/course-adjustments/process?status=completed');
      const data = await response.json();
      if (data.success) setCompletedAdjustments(data.data || []);
    } catch (error) {
      console.error('获取已处理调课列表失败:', error);
      toast.error('获取已处理调课列表失败');
    } finally {
      setCompletedLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'published') {
      fetchApprovals('my');
    } else if (activeTab === 'adjust' && isGradeLeader) {
      fetchPendingAdjustments();
      fetchCompletedAdjustments();
    }
  }, [activeTab, isGradeLeader]);

  // 处理调课成功
  const handleAdjustSuccess = () => {
    setShowAdjustDialog(false);
    setSelectedAdjust(null);
    fetchPendingAdjustments();
    fetchCompletedAdjustments();
    toast.success('调课处理成功');
  };

  // 发布处理
  const handleSubmit = async (request: SubmitApprovalRequest) => {
    const result = await submitApproval({
      ...request,
      department: 'teacher',
      isExternal: false,
    });
    if (result.success) refetch();
    return result;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLeader ? '个人工作台' : isHeadTeacher ? '班主任工作台' : '教师工作台'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isLeader
              ? `${user?.name} · 个人事务管理`
              : isHeadTeacher
                ? `${user?.className || '我的班级'} · 班级管理与家校沟通`
                : `${user?.department || '教学组'} · 教学与教研工作`
            }
            {isGradeLeader && ' · 年段长'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {user?.name}
          </Badge>
          {isGradeLeader && (
            <Badge className="bg-amber-500 text-white gap-1">
              <CalendarClock className="h-3 w-3" />
              年段长
            </Badge>
          )}
          <Badge className="bg-purple-500 text-white gap-1">
            <Sparkles className="h-3 w-3" />
            AI 助手
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className={`grid gap-4 ${isGradeLeader ? 'md:grid-cols-5' : isHeadTeacher ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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
                <p className="text-2xl font-bold text-blue-600">{total}</p>
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
                <p className="text-2xl font-bold text-green-600">{total - statistics.unread}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {isHeadTeacher && (
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
        )}
        {isGradeLeader && (
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('adjust')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待调课</p>
                  <p className="text-2xl font-bold text-amber-600">{adjustStats.pending}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-100">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 发布按钮 - 仅班主任 */}
      {isHeadTeacher && (
        <div className="flex justify-end">
          <Button onClick={() => setPublishOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            发布班级通知
          </Button>
        </div>
      )}

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages" className="gap-2">
            <Bell className="h-4 w-4" />消息中心
          </TabsTrigger>
          {isHeadTeacher && (
            <TabsTrigger value="published" className="gap-2">
              <Send className="h-4 w-4" />我发布的
            </TabsTrigger>
          )}
          {isGradeLeader && (
            <TabsTrigger value="adjust" className="gap-2">
              <CalendarClock className="h-4 w-4" />调课中心
              {adjustStats.pending > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white text-xs">{adjustStats.pending}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* 消息面板 */}
        <TabsContent value="messages" className="mt-4">
          <MessagePanel
            messages={messages}
            loading={messagesLoading}
            error={messagesError}
            unreadCount={statistics.unread}
            statistics={statistics}
            pagination={{ page, pageSize, total, totalPages }}
            onRefresh={refetch}
            onMarkAsRead={markAsRead}
            onMarkAsUnread={markAsUnread}
            onArchive={archiveMessage}
            onDelete={deleteMessage}
            onMarkAllAsRead={markAllAsRead}
            onPageChange={goToPage}
          />
        </TabsContent>

        {/* 我发布的 - 班主任专属 */}
        {isHeadTeacher && (
          <TabsContent value="published" className="mt-4">
            <PublishedTab
              approvals={approvals}
              loading={approvalsLoading}
              onRefresh={() => fetchApprovals('my')}
            />
          </TabsContent>
        )}

        {/* 调课中心 - 年段长专属 */}
        {isGradeLeader && (
          <TabsContent value="adjust" className="mt-4">
            <CourseAdjustmentTab
              adjustViewMode={adjustViewMode}
              setAdjustViewMode={setAdjustViewMode}
              adjustStats={adjustStats}
              adjustments={adjustments}
              completedAdjustments={completedAdjustments}
              adjustmentLoading={adjustmentLoading}
              completedLoading={completedLoading}
              onRefreshPending={fetchPendingAdjustments}
              onRefreshCompleted={fetchCompletedAdjustments}
              onOpenAdjustDialog={(adjust) => { setSelectedAdjust(adjust); setShowAdjustDialog(true); }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* 发布对话框 */}
      <PublishNotificationDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onSubmit={handleSubmit}
        department="teacher"
        showApprovalFlow={false}
        recipientTypes={['class']}
      />

      {/* 智能调课处理对话框 */}
      <CourseAdjustmentDialog
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        adjustment={selectedAdjust}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  );
}
