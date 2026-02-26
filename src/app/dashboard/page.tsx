'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  GraduationCap,
  Heart,
  Users,
  Bell,
  Calendar,
  FileText,
  Wrench,
  ShoppingCart,
  DollarSign,
  Shield,
  Package,
  BookOpen,
  ClipboardList,
  Award,
  Flag,
  Target,
  MessageSquare,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
  ChevronRight,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { moduleNames, roleConfigs } from '@/config/roles';
import { mockAnnouncements, mockLeaveRequests, mockRepairRequests, schoolStats } from '@/data/mock';

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  const roleConfig = roleConfigs[user.role];
  const isHeadTeacher = user.role === 'head_teacher';
  const isLeader = ['principal', 'secretary', 'vice_principal'].includes(user.role);
  const isAdmin = ['principal', 'secretary', 'vice_principal', 'admin'].includes(user.role);

  // 获取当前时间问候
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 待办事项
  const pendingTasks = [
    { id: 1, title: '审批张小燕老师的请假申请', type: '审批', urgent: true, time: '10分钟前' },
    { id: 2, title: '查看本周教学质量报告', type: '查看', urgent: false, time: '1小时前' },
    { id: 3, title: '确认本周教研活动安排', type: '确认', urgent: false, time: '2小时前' },
    { id: 4, title: '审核采购申请单', type: '审批', urgent: true, time: '3小时前' },
  ];

  // 快捷操作
  const quickActions = [
    { name: '请假申请', icon: FileText, color: 'bg-blue-100 text-blue-600', path: '/workflow/leave' },
    { name: '报修申请', icon: Wrench, color: 'bg-orange-100 text-orange-600', path: '/general/repairs' },
    { name: '采购申请', icon: ShoppingCart, color: 'bg-green-100 text-green-600', path: '/general/purchase' },
    { name: '费用报销', icon: DollarSign, color: 'bg-purple-100 text-purple-600', path: '/general/finance' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 欢迎区域 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 p-8 text-white shadow-xl shadow-primary/20">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium text-white/80">智慧校园管理平台</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{getGreeting()}，{user.name}</h1>
          <p className="text-white/80 text-lg">
            {roleConfig.name} · {user.department || '龙岩师范附属小学'}
          </p>
        </div>
        {/* 装饰元素 */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="absolute right-20 top-10 h-32 w-32 rounded-full bg-white blur-3xl" />
          <div className="absolute right-40 bottom-10 h-40 w-40 rounded-full bg-white blur-3xl" />
        </div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rotate-12 rounded-2xl bg-white/10 backdrop-blur-sm" />
      </div>

      {/* 统计卡片 */}
      {isLeader && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">在校学生</p>
                  <p className="text-3xl font-bold text-gray-900">{schoolStats.totalStudents}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">教师总数</p>
                  <p className="text-3xl font-bold text-gray-900">{schoolStats.totalTeachers}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">班级数量</p>
                  <p className="text-3xl font-bold text-gray-900">{schoolStats.totalClasses}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待处理事项</p>
                  <p className="text-3xl font-bold text-primary">8</p>
                </div>
                <div className="p-3 rounded-xl bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 系统入口 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roleConfig.modules.includes('general') && (
          <Link href="/general">
            <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">总务后勤</h3>
                    <p className="text-sm text-gray-500">资产·报修·采购·安保</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {roleConfig.modules.includes('academic') && (
          <Link href="/academic">
            <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">教务教研</h3>
                    <p className="text-sm text-gray-500">课程·成绩·教研·考勤</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {roleConfig.modules.includes('moral') && (
          <Link href="/moral">
            <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 to-green-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-green-500 text-white">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">德育管理</h3>
                    <p className="text-sm text-gray-500">少先队·活动·评价·档案</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isHeadTeacher && (
          <Link href="/teacher">
            <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">教师空间</h3>
                    <p className="text-sm text-gray-500">班主任工作台（专属）</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-600 text-xs">AI</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isAdmin && (
          <Link href="/workflow">
            <Card className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white">
                    <Workflow className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">审批中心</h3>
                    <p className="text-sm text-gray-500">请假·报修·采购审批</p>
                  </div>
                  <Badge className="bg-red-100 text-red-600 text-xs">3</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* 快捷操作 & 待办事项 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 快捷操作 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">快捷操作</CardTitle>
            <CardDescription>常用功能快速入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.path}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${action.color} mb-2`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 待办事项 */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">待办事项</CardTitle>
              <CardDescription>需要您处理的事项</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              查看全部 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${task.urgent ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {task.type === '审批' ? (
                      <CheckSquare className={`h-4 w-4 ${task.urgent ? 'text-red-600' : 'text-blue-600'}`} />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{task.type}</Badge>
                      <span className="text-xs text-gray-500">{task.time}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 通知公告 & 最近活动 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 通知公告 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">通知公告</CardTitle>
              <CardDescription>学校最新通知</CardDescription>
            </div>
            <Bell className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAnnouncements.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${
                    item.type === '通知' ? 'bg-blue-100' : 
                    item.type === '活动' ? 'bg-green-100' : 
                    item.type === '新闻' ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <Bell className={`h-4 w-4 ${
                      item.type === '通知' ? 'text-blue-600' : 
                      item.type === '活动' ? 'text-green-600' : 
                      item.type === '新闻' ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate text-sm">{item.title}</p>
                      {item.isImportant && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">重要</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.publishAt.split(' ')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 今日课程 / 教师专属 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {isHeadTeacher ? '今日课程' : '最近动态'}
              </CardTitle>
              <CardDescription>
                {isHeadTeacher ? `${user.className || '三年级1班'} 今日课程安排` : '系统活动记录'}
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            {isHeadTeacher ? (
              <div className="space-y-2">
                {[
                  { time: '08:00', subject: '语文', teacher: '张老师' },
                  { time: '09:00', subject: '数学', teacher: '李老师' },
                  { time: '10:30', subject: '英语', teacher: '王老师' },
                  { time: '14:00', subject: '美术', teacher: '刘老师' },
                  { time: '15:00', subject: '体育', teacher: '陈老师' },
                ].map((course, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
                      {course.time.split(':')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{course.subject}</p>
                      <p className="text-xs text-gray-500">{course.time} · {course.teacher}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {mockRepairRequests.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <div className={`p-2 rounded-lg ${
                      item.status === 'pending' ? 'bg-yellow-100' : 
                      item.status === 'in_progress' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Wrench className={`h-4 w-4 ${
                        item.status === 'pending' ? 'text-yellow-600' : 
                        item.status === 'in_progress' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.item}</p>
                      <p className="text-xs text-gray-500">{item.location}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.status === 'pending' ? '待处理' : item.status === 'in_progress' ? '处理中' : '已完成'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
