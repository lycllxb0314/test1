'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolStats } from '@/hooks/useSchoolStats';

export default function TeacherPage() {
  const { user } = useAuth();
  const { data: schoolStats, loading: statsLoading } = useSchoolStats();

  // 判断是否是班主任
  const isHeadTeacher = user?.role === 'head_teacher' || user?.role === 'principal' || user?.role === 'vice_principal';

  // 待办事项 - 从API获取或使用默认数据
  const [todosData, setTodosData] = useState([
    { id: '1', title: '批改期中试卷', priority: 'high', status: 'processing', deadline: '周四', source: '教学任务' },
    { id: '2', title: '参加教研组会议', priority: 'medium', status: 'pending', deadline: '周五 15:00', source: '教研组' },
    { id: '3', title: '完成教案编写', priority: 'medium', status: 'pending', deadline: '下周一', source: '教学任务' },
    { id: '4', title: '提交教学反思', priority: 'low', status: 'pending', deadline: '下周', source: '学期任务' },
  ]);

  // 班主任专属待办
  const headTeacherTodos = [
    { id: 'ht1', title: '上报流感缺课情况统计表', priority: 'high', status: 'pending', deadline: '明天 10:00', source: '段长工作群' },
    { id: 'ht2', title: '组织家长会', priority: 'medium', status: 'pending', deadline: '下周五', source: '德育处' },
    { id: 'ht3', title: '完成学生评语撰写', priority: 'medium', status: 'pending', deadline: '下周五', source: '学期任务' },
  ];

  // 通知提醒
  const notificationsData = [
    { id: '1', title: '教研组活动通知', time: '10分钟前', type: 'info', isRead: false },
    { id: '2', title: '期末工作安排', time: '1小时前', type: 'info', isRead: false },
    { id: '3', title: '教学资料更新', time: '2小时前', type: 'info', isRead: true },
  ];

  // 今日考勤（班主任专属）- 基于API数据
  const todayAttendance = useMemo(() => {
    if (!schoolStats) return { present: 0, absent: 0, late: 0, total: 0 };
    const classInfo = schoolStats.classes.list.find(c => c.headTeacherId === user?.id);
    if (!classInfo) return { present: 0, absent: 0, late: 0, total: 0 };
    const total = classInfo.studentCount;
    return {
      present: total - 2,
      absent: 2,
      late: 0,
      total,
    };
  }, [schoolStats, user]);

  // 班级概况（班主任专属）- 基于API数据
  const classOverview = useMemo(() => {
    if (!schoolStats) return { studentCount: 0, parentCount: 0, teacherCount: 0, activityRate: 0, moralScore: 0 };
    const classInfo = schoolStats.classes.list.find(c => c.headTeacherId === user?.id);
    if (!classInfo) return { studentCount: 0, parentCount: 0, teacherCount: 0, activityRate: 0, moralScore: 0 };
    return {
      studentCount: classInfo.studentCount,
      parentCount: classInfo.studentCount * 2,
      teacherCount: 5,
      activityRate: 96,
      moralScore: 95,
    };
  }, [schoolStats, user]);

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

  // 今日课表数据
  const todaySchedule = [
    { period: '第一节', time: '8:00-8:40', subject: '语文', class: '三年级1班', location: '教学楼301' },
    { period: '第二节', time: '8:50-9:30', subject: '语文', class: '三年级2班', location: '教学楼302' },
    { period: '第三节', time: '9:50-10:30', subject: '阅读', class: '三年级1班', location: '教学楼301' },
    { period: '第四节', time: '10:40-11:20', subject: '', class: '', location: '' }, // 空课
    { period: '第五节', time: '14:00-14:40', subject: '语文', class: '三年级3班', location: '教学楼303' },
    { period: '第六节', time: '14:50-15:30', subject: '', class: '', location: '' }, // 空课
  ];

  // 获取当前是第几节课（模拟）
  const currentPeriod = 2;

  // 统计
  const pendingCount = todosData.filter(t => t.status === 'pending').length + (isHeadTeacher ? headTeacherTodos.filter(t => t.status === 'pending').length : 0);
  const processingCount = todosData.filter(t => t.status === 'processing').length;
  const urgentCount = notificationsData.filter(n => !n.isRead && n.type === 'urgent').length;

  // 教师通用功能 - 普通教师只能看到课表、通知、请假调课
  const commonFunctions = [
    { name: '我的课表', icon: Calendar, color: 'bg-blue-100 text-blue-600', path: '/academic/schedule', desc: '查看课程安排' },
    { name: '通知公告', icon: Bell, color: 'bg-amber-100 text-amber-600', path: '/workflow/announcements', desc: '查看通知公告' },
    { name: '请假调课', icon: FileText, color: 'bg-green-100 text-green-600', path: '/workflow/leave', desc: '提交请假申请' },
  ];

  // 班主任专属功能
  const headTeacherFunctions = [
    { name: '班级管理', icon: Users, color: 'bg-blue-100 text-blue-600', path: '/teacher/class' },
    { name: '信息收集', icon: ClipboardList, color: 'bg-cyan-100 text-cyan-600', path: '/teacher/collect' },
    { name: '日常管理', icon: Calendar, color: 'bg-orange-100 text-orange-600', path: '/teacher/daily' },
    { name: '家校沟通', icon: MessageSquare, color: 'bg-purple-100 text-purple-600', path: '/teacher/communication', badge: 'AI' },
    { name: '成长德育', icon: Heart, color: 'bg-pink-100 text-pink-600', path: '/teacher/moral' },
    { name: '学情作业', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600', path: '/teacher/homework' },
    { name: '行政材料', icon: FileText, color: 'bg-amber-100 text-amber-600', path: '/teacher/admin', badge: 'AI' },
    { name: '安全应急', icon: Shield, color: 'bg-red-100 text-red-600', path: '/teacher/safety' },
  ];

  // 校长专属功能
  const principalFunctions = [
    { name: '首页管理', icon: LayoutDashboard, color: 'bg-rose-100 text-rose-600', path: '/admin/carousel', desc: '轮播图与视频' },
    { name: '学校统计', icon: BarChart3, color: 'bg-emerald-100 text-emerald-600', path: '/teacher/grade', desc: '数据概览' },
    { name: '教师管理', icon: Users, color: 'bg-blue-100 text-blue-600', path: '/teacher/profile', desc: '教师信息' },
  ];

  // 判断是否是校长
  const isPrincipal = user?.role === 'principal' || user?.role === 'vice_principal';

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isHeadTeacher ? '班主任工作台' : '教师工作台'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isHeadTeacher ? `${user?.className || '三年级1班'} · 班级管理与家校沟通` : `${user?.department || '教学组'} · 教学与教研工作`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isHeadTeacher && (
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              读取群消息
            </Button>
          )}
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
                <p className="text-sm text-gray-500">未读通知</p>
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
                <p className="text-sm text-gray-500">
                  {isHeadTeacher ? '德育积分' : '教学工作量'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {isHeadTeacher ? classOverview.moralScore : '96%'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                {isHeadTeacher ? <Heart className="h-5 w-5 text-green-600" /> : <GraduationCap className="h-5 w-5 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 今日课表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              今日课表
            </CardTitle>
            <CardDescription>星期三 · 今天有 {todaySchedule.filter(s => s.subject).length} 节课</CardDescription>
          </div>
          <Link href="/teacher/schedule">
            <Button variant="ghost" size="sm" className="text-blue-600">
              查看完整课表 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {todaySchedule.map((item, index) => (
              <div
                key={index}
                className={`relative p-3 rounded-xl border transition-all ${
                  item.subject
                    ? currentPeriod === index + 1
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    : 'bg-gray-50/50 border-gray-100'
                }`}
              >
                <div className="text-center">
                  <p className={`text-xs font-medium ${currentPeriod === index + 1 ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.period}
                  </p>
                  <p className={`text-xs ${currentPeriod === index + 1 ? 'text-blue-100' : 'text-gray-400'}`}>
                    {item.time.split('-')[0]}
                  </p>
                </div>
                {item.subject && (
                  <div className="mt-2 text-center">
                    <p className={`font-bold ${currentPeriod === index + 1 ? 'text-white' : 'text-gray-900'}`}>
                      {item.subject}
                    </p>
                    <p className={`text-xs mt-1 ${currentPeriod === index + 1 ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.class}
                    </p>
                  </div>
                )}
                {currentPeriod === index + 1 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-700">当前：第二节 · 语文 · 三年级2班</span>
              </div>
              <span className="text-xs text-blue-600">距离下课还有 15 分钟</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 班主任专属：班级概况 */}
      {isHeadTeacher && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                <h3 className="font-semibold">班级概况 · {user?.className || '三年级1班'}</h3>
              </div>
              <Link href="/teacher/class">
                <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  查看详情
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/10 rounded-xl">
                <p className="text-2xl font-bold">{classOverview.studentCount}</p>
                <p className="text-sm text-white/80">学生人数</p>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl">
                <p className="text-2xl font-bold">{classOverview.parentCount}</p>
                <p className="text-sm text-white/80">家长人数</p>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl">
                <p className="text-2xl font-bold">{classOverview.activityRate}%</p>
                <p className="text-sm text-white/80">活动参与率</p>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-xl">
                <p className="text-2xl font-bold">{classOverview.moralScore}</p>
                <p className="text-sm text-white/80">德育积分</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要内容 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 待办事项 */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">待办事项</CardTitle>
              <CardDescription>需要处理的工作任务</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* 班主任专属待办 */}
              {isHeadTeacher && headTeacherTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer border border-purple-100"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    todo.priority === 'high' ? 'bg-red-500' :
                    todo.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{todo.title}</p>
                      <Badge className="text-xs bg-purple-100 text-purple-700">班主任</Badge>
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
              
              {/* 通用待办 */}
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

      {/* 班主任专属：今日考勤 */}
      {isHeadTeacher && (
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
      )}

      {/* 快捷功能 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 校长专属功能 */}
        {isPrincipal && (
          <Card className="border-0 shadow-md bg-gradient-to-r from-rose-500 to-orange-500 text-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-white/20">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">校长工作台</CardTitle>
                  <CardDescription className="text-white/80">学校管理与系统配置</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {principalFunctions.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className="flex flex-col items-center p-4 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${item.color} mb-2`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-white">{item.name}</span>
                    <span className="text-[10px] text-white/70">{item.desc}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 班主任专属功能 */}
        {isHeadTeacher && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-purple-100">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">班主任系统</CardTitle>
                  <CardDescription>班级管理专属功能</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {headTeacherFunctions.map((item, index) => (
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
        )}

        {/* 教师通用功能 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-blue-100">
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">教学工作</CardTitle>
                <CardDescription>教学与教研常用功能</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {commonFunctions.map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${item.color} mb-2`}>
                    <item.icon className="h-5 w-5" />
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
                <p className="text-white/80 text-sm">
                  {isHeadTeacher 
                    ? '智能生成评语、通知文案、工作计划，让班主任工作更轻松'
                    : '智能生成教案、课件、教学反思，助力教学创新'}
                </p>
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
