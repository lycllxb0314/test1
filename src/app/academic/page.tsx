'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  GraduationCap,
  School,
  CalendarDays,
  BookOpen,
  ClipboardList,
  BarChart3,
  Award,
  TrendingUp,
  Target,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useSchoolStats } from '@/hooks/useSchoolStats';

export default function AcademicPage() {
  const { data: statsData, loading, error } = useSchoolStats();
  
  // 统计数据（基于API返回）
  const schoolStats = statsData ? {
    totalStudents: statsData.students.total,
    totalTeachers: statsData.teachers.total,
    totalClasses: statsData.classes.total,
    name: statsData.school.name,
  } : { totalStudents: 0, totalTeachers: 0, totalClasses: 0, name: '龙岩师范附属小学' };

  const stats = [
    { title: '学生总数', value: schoolStats.totalStudents, change: '+12', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { title: '教师总数', value: schoolStats.totalTeachers, change: '+3', icon: GraduationCap, gradient: 'from-purple-500 to-pink-500' },
    { title: '班级数量', value: schoolStats.totalClasses, icon: School, gradient: 'from-orange-500 to-yellow-500' },
    { title: '本周课程', value: 540, suffix: '节', icon: CalendarDays, gradient: 'from-green-500 to-emerald-500' },
  ];

  // 今日课程
  const todaySchedule = [
    { time: '08:00', subject: '语文', class: '三年级1班', teacher: '王老师' },
    { time: '09:00', subject: '数学', class: '三年级1班', teacher: '李老师' },
    { time: '10:30', subject: '英语', class: '三年级2班', teacher: '张老师' },
    { time: '14:00', subject: '科学', class: '四年级1班', teacher: '刘老师' },
    { time: '15:00', subject: '体育', class: '四年级2班', teacher: '陈老师' },
  ];

  // 优秀学生
  const topStudents = [
    { rank: 1, name: '王小明', class: '六年级1班', score: 298 },
    { rank: 2, name: '李小红', class: '六年级2班', score: 296 },
    { rank: 3, name: '张小刚', class: '五年级1班', score: 295 },
  ];

  // 最近活动
  const recentActivities = [
    { id: 1, type: 'grade', content: '三年级1班数学成绩已录入', time: '10分钟前', icon: BookOpen },
    { id: 2, type: 'schedule', content: '四年级课表调整完成', time: '30分钟前', icon: CalendarDays },
    { id: 3, type: 'notice', content: '发布期中考试通知', time: '1小时前', icon: ClipboardList },
    { id: 4, type: 'teacher', content: '新教师李芳芳入职', time: '2小时前', icon: GraduationCap },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教务教研管理</h1>
          <p className="text-gray-500 mt-1">课程安排 · 成绩管理 · 教研活动 · 教师发展</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            考试安排
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Sparkles className="h-4 w-4" />
            AI助手
          </Button>
        </div>
      </div>

      {/* 欢迎横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-500/20">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium text-white/80">智慧教务系统</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">欢迎回来，教务管理员</h1>
          <p className="text-white/80 text-lg">今天是2024年3月18日 星期一</p>
        </div>
        {/* 装饰 */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="absolute right-20 top-10 h-32 w-32 rounded-full bg-white blur-3xl" />
          <div className="absolute right-40 bottom-10 h-40 w-40 rounded-full bg-white blur-3xl" />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group cursor-pointer">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                    {stat.suffix && <span className="text-gray-500">{stat.suffix}</span>}
                    {stat.change && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        {stat.change}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 主要内容区域 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 今日课程 */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">今日课程安排</CardTitle>
              <CardDescription>学校今日课程概览</CardDescription>
            </div>
            <Link href="/academic/schedule">
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 rounded-xl bg-gray-50 p-4 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 font-bold text-blue-600 group-hover:from-blue-500 group-hover:to-cyan-500 group-hover:text-white transition-all duration-200">
                    {item.time.split(':')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.subject}</p>
                    <p className="text-sm text-gray-500">{item.class} · {item.teacher}</p>
                  </div>
                  <Badge variant="outline">{item.time}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 本月之星 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              本月之星
            </CardTitle>
            <CardDescription>优秀学生榜</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStudents.map((student, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                    'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                  }`}>
                    {student.rank}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-500 truncate">{student.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{student.score}</p>
                    <p className="text-xs text-gray-500">总分</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近动态 & 教研活动 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最近动态 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">最近动态</CardTitle>
            <CardDescription>教务相关活动记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-blue-100">
                    <activity.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.content}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 教研活动 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">教研活动</CardTitle>
              <CardDescription>近期教研安排</CardDescription>
            </div>
            <Link href="/academic/research">
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: '语文组集体备课', time: '今天 14:00', location: '会议室A', status: 'today' },
                { title: '数学组教学研讨', time: '明天 09:00', location: '会议室B', status: 'upcoming' },
                { title: '英语组公开课', time: '周三 10:00', location: '多媒体教室', status: 'upcoming' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activity.status === 'today' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Lightbulb className={`h-4 w-4 ${activity.status === 'today' ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{activity.time}</p>
                    {activity.status === 'today' && (
                      <Badge className="bg-green-100 text-green-700 text-xs">今日</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
