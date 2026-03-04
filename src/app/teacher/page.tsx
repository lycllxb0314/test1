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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useApprovals } from '@/hooks/useApprovals';
import { useLeaveAdjust } from '@/hooks/useLeaveAdjust';
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
  CalendarClock,
  CheckCircle,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';

// 请假类型标签
const LEAVE_TYPE_LABELS: Record<string, string> = {
  sick: '病假',
  personal: '事假',
  official: '公假',
  maternity: '产假',
  marriage: '婚假',
  funeral: '丧假',
};

export default function TeacherPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [publishOpen, setPublishOpen] = useState(false);

  // 判断是否是班主任
  const isHeadTeacher = user?.role === 'head_teacher' || user?.role === 'principal' || user?.role === 'academic_vice_principal' || user?.role === 'moral_vice_principal' || user?.role === 'general_vice_principal';
  
  // 判断是否是年段长（兼任角色）
  const additionalRoles = user?.additionalRoles;
  const isGradeLeader = additionalRoles?.includes('grade_leader');

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

  // 调课 Hook - 年段长使用
  const {
    pendingAdjustments,
    adjustmentLoading,
    fetchPendingAdjustments,
    processAdjustment,
  } = useLeaveAdjust();
  
  // 调课统计数据（计算）
  const adjustStats = {
    pending: pendingAdjustments.filter((a: any) => a.status === 'pending').length,
    completed: pendingAdjustments.filter((a: any) => a.status === 'completed').length,
  };

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'published') {
      fetchApprovals('my');
    } else if (activeTab === 'adjust' && isGradeLeader) {
      fetchPendingAdjustments();
    }
  }, [activeTab, isGradeLeader, fetchApprovals, fetchPendingAdjustments]);

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
      <div className={`grid gap-4 ${isGradeLeader ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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
        {/* 年段长专属：待调课统计 */}
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
          {/* 年段长专属：调课中心 */}
          {isGradeLeader && (
            <TabsTrigger value="adjust" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              调课中心
              {adjustStats.pending > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white text-xs">
                  {adjustStats.pending}
                </Badge>
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

        {/* 我发布的 */}
        <TabsContent value="published" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>我发布的通知</CardTitle>
                  <CardDescription>查看您发布的班级通知</CardDescription>
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
                </div>
              ) : (
                <div className="space-y-3">
                  {approvals.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                          {item.status === 'approved' ? '已发布' : '待审批'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 调课中心 - 年段长专属 */}
        {isGradeLeader && (
          <TabsContent value="adjust" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* 待处理调课列表 */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>待处理调课</CardTitle>
                        <CardDescription>需要安排代课教师的课程</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fetchPendingAdjustments()}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        刷新
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {adjustmentLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : pendingAdjustments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>暂无待处理调课</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingAdjustments.map((adjust) => (
                          <AdjustCard 
                            key={adjust.id} 
                            adjust={adjust} 
                            onProcess={processAdjustment}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 操作说明 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">调课处理说明</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>• <strong>代课</strong>：安排其他教师代课</p>
                    <p>• <strong>取消</strong>：该节课取消不上</p>
                    <p>• 处理完成后会自动通知相关教师</p>
                    <p>• 教师工作量会自动更新</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">统计数据</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">待处理</span>
                      <Badge className="bg-amber-100 text-amber-700">{adjustStats.pending}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">已完成</span>
                      <Badge className="bg-green-100 text-green-700">{adjustStats.completed}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
    </div>
  );
}

// 调课卡片组件
function AdjustCard({ adjust, onProcess }: { 
  adjust: any; 
  onProcess: (request: { adjustmentId: string; action: 'substitute' | 'cancel'; substituteEmployeeId?: string; substituteName?: string }) => Promise<boolean> 
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [substituteId, setSubstituteId] = useState('');
  const [substituteName, setSubstituteName] = useState('');
  const [loading, setLoading] = useState(false);

  const weekDayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const handleProcess = async (action: 'substitute' | 'cancel') => {
    if (action === 'substitute' && !substituteId) {
      return;
    }
    setLoading(true);
    const success = await onProcess({
      adjustmentId: adjust.id,
      action,
      substituteEmployeeId: substituteId || undefined,
      substituteName: substituteName || undefined,
    });
    setLoading(false);
    if (success) {
      setShowDialog(false);
      setSubstituteId('');
      setSubstituteName('');
    }
  };

  return (
    <>
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  {LEAVE_TYPE_LABELS[adjust.reasonType] || adjust.reasonType}
                </Badge>
                <span className="text-sm text-gray-500">
                  {adjust.applicant_name} 请假
                </span>
              </div>
              
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-500">时间：</span>
                  {weekDayNames[adjust.week_day]} 第{adjust.period_index + 1}节
                </p>
                <p>
                  <span className="text-gray-500">班级：</span>
                  {adjust.class_name}
                </p>
                <p>
                  <span className="text-gray-500">科目：</span>
                  {adjust.subject}
                </p>
              </div>
            </div>
            
            <Button size="sm" onClick={() => setShowDialog(true)}>
              处理
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 处理弹窗 - 简化版，实际可用Dialog组件 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>处理调课</CardTitle>
              <CardDescription>
                {adjust.applicant_name} - {weekDayNames[adjust.week_day]} 第{adjust.period_index + 1}节
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">代课教师工号</label>
                <input 
                  type="text" 
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={substituteId}
                  onChange={(e) => setSubstituteId(e.target.value)}
                  placeholder="输入代课教师工号"
                />
              </div>
              <div>
                <label className="text-sm font-medium">代课教师姓名</label>
                <input 
                  type="text" 
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={substituteName}
                  onChange={(e) => setSubstituteName(e.target.value)}
                  placeholder="输入代课教师姓名"
                />
              </div>
            </CardContent>
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleProcess('cancel')}
                disabled={loading}
              >
                取消课程
              </Button>
              <Button 
                onClick={() => handleProcess('substitute')}
                disabled={loading || !substituteId}
              >
                确认代课
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
