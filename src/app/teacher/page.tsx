'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Calendar,
  MessageSquare,
  Heart,
  BookOpen,
  FileText,
  Shield,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Bell,
  Send,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherPage() {
  const { user } = useAuth();

  // 待办事项
  const todosData = [
    { id: '1', title: '上报流感缺课情况统计表', priority: 'high', status: 'pending', deadline: '明天 10:00', source: '段长工作群' },
    { id: '2', title: '参加年级例会', priority: 'medium', status: 'pending', deadline: '周五 15:00', source: '段长工作群' },
    { id: '3', title: '批改期中试卷', priority: 'medium', status: 'processing', deadline: '周四', source: '教学任务' },
    { id: '4', title: '完成学生评语撰写', priority: 'low', status: 'pending', deadline: '下周五', source: '学期任务' },
  ];

  // 通知提醒
  const notificationsData = [
    { id: '1', title: '流感缺课统计表提醒', time: '10分钟前', type: 'urgent', isRead: false },
    { id: '2', title: '家长会时间变更', time: '1小时前', type: 'info', isRead: false },
    { id: '3', title: '作业提交情况', time: '2小时前', type: 'info', isRead: true },
  ];

  // 今日考勤
  const todayAttendance = {
    present: 43,
    absent: 2,
    late: 0,
    total: 45,
  };

  // 班级概况
  const classOverview = {
    studentCount: 45,
    parentCount: 86,
    teacherCount: 5,
    activityRate: 96,
    moralScore: 95,
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'bg-gray-50';
    }
  };

  // 统计
  const pendingCount = todosData.filter(t => t.status === 'pending').length;
  const processingCount = todosData.filter(t => t.status === 'processing').length;
  const urgentCount = notificationsData.filter(n => !n.isRead && n.type === 'urgent').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">班主任工作台</h1>
          <p className="text-gray-500 mt-1">{user?.className || '三年级1班'} · 班级管理与家校沟通</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            读取群消息
          </Button>
          <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
            <Sparkles className="h-4 w-4" />
            AI助手
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">进行中</p>
                <p className="text-2xl font-bold text-blue-600">{processingCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">紧急通知</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">德育积分</p>
                <p className="text-2xl font-bold text-green-600">{classOverview.moralScore}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 待办事项 */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">待办事项</CardTitle>
              <CardDescription>需要处理的班级事务</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todosData.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    todo.priority === 'high' ? 'bg-red-500' :
                    todo.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{todo.title}</p>
                      <Badge className={`text-xs ${getPriorityColor(todo.priority)}`}>
                        {todo.priority === 'high' ? '紧急' : todo.priority === 'medium' ? '中等' : '一般'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {todo.deadline}
                      </span>
                      <span>来源：{todo.source}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(todo.status)}>
                    {todo.status === 'pending' ? '待处理' : todo.status === 'processing' ? '进行中' : '已完成'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 通知提醒 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">通知提醒</CardTitle>
            <CardDescription>最新消息推送</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notificationsData.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    notification.isRead ? 'bg-gray-50' : 'bg-purple-50 hover:bg-purple-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    {notification.type === 'urgent' && (
                      <Badge className="bg-red-100 text-red-700 text-xs">紧急</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 班级概况与快捷操作 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 今日考勤 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">今日考勤</CardTitle>
              <CardDescription>{user?.className || '三年级1班'} 今日出勤情况</CardDescription>
            </div>
            <Link href="/teacher/daily">
              <Button variant="ghost" size="sm" className="text-purple-600">
                详情 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{todayAttendance.present}</p>
                <p className="text-sm text-gray-500">出勤</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{todayAttendance.absent}</p>
                <p className="text-sm text-gray-500">缺勤</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{todayAttendance.late}</p>
                <p className="text-sm text-gray-500">迟到</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{todayAttendance.total}</p>
                <p className="text-sm text-gray-500">总计</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">出勤率</span>
                <span className="font-medium text-green-600">
                  {((todayAttendance.present / todayAttendance.total) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(todayAttendance.present / todayAttendance.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 快捷功能 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">快捷功能</CardTitle>
            <CardDescription>常用功能入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: '班级管理', icon: Users, color: 'bg-blue-100 text-blue-600', path: '/teacher/class' },
                { name: '信息收集', icon: ClipboardList, color: 'bg-cyan-100 text-cyan-600', path: '/teacher/collect' },
                { name: '日常管理', icon: Calendar, color: 'bg-orange-100 text-orange-600', path: '/teacher/daily' },
                { name: '家校沟通', icon: MessageSquare, color: 'bg-purple-100 text-purple-600', path: '/teacher/communication', badge: 'AI' },
                { name: '成长德育', icon: Heart, color: 'bg-pink-100 text-pink-600', path: '/teacher/moral' },
                { name: '学情作业', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600', path: '/teacher/homework' },
                { name: '行政材料', icon: FileText, color: 'bg-amber-100 text-amber-600', path: '/teacher/admin', badge: 'AI' },
                { name: '安全应急', icon: Shield, color: 'bg-red-100 text-red-600', path: '/teacher/safety' },
                { name: '请假申请', icon: FileText, color: 'bg-green-100 text-green-600', path: '/workflow/leave' },
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${item.color} mb-2 relative`}>
                    <item.icon className="h-5 w-5" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI助手提示 */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">AI智能助手</h3>
                <p className="text-white/80 text-sm">智能生成评语、通知文案、工作计划，让班主任工作更轻松</p>
              </div>
            </div>
            <Button className="bg-white text-purple-600 hover:bg-white/90 gap-2">
              <Sparkles className="h-4 w-4" />
              立即体验
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
