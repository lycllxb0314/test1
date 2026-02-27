'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Star,
  BookOpen,
  Bell,
  UserPlus,
  TrendingUp,
  Calendar,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function ParentDashboard() {
  const { user } = useAuth();

  // 模拟子女数据
  const children: Array<{ id: string; name: string; classId: string; className: string; avatar?: string }> = 
    user?.children?.map(c => ({ ...c, avatar: '👦' })) || [
      {
        id: 's001',
        name: '张小明',
        classId: 'c001',
        className: '三年(1)班',
        avatar: '👦',
      },
    ];

  // 快捷功能
  const quickActions = [
    { 
      name: '子女信息', 
      icon: Users, 
      color: 'bg-blue-100 text-blue-600', 
      path: '/parent/children',
      description: '查看和管理子女基本信息' 
    },
    { 
      name: '习惯养成', 
      icon: Star, 
      color: 'bg-amber-100 text-amber-600', 
      path: '/parent/habit',
      description: '记录孩子习惯养成情况',
      badge: '特色' 
    },
    { 
      name: '成绩查看', 
      icon: BookOpen, 
      color: 'bg-green-100 text-green-600', 
      path: '/parent/grades',
      description: '查看孩子考试成绩' 
    },
    { 
      name: '通知公告', 
      icon: Bell, 
      color: 'bg-purple-100 text-purple-600', 
      path: '/parent/announcements',
      description: '学校通知公告' 
    },
    { 
      name: '新生注册', 
      icon: UserPlus, 
      color: 'bg-cyan-100 text-cyan-600', 
      path: '/parent/enrollment',
      description: '新生入学注册',
      badge: '9月' 
    },
  ];

  // 最近习惯记录
  const recentHabits = [
    { date: '2024-03-15', category: '阅读习惯', content: '今日阅读30分钟', score: 5 },
    { date: '2024-03-14', category: '运动习惯', content: '参加跳绳训练', score: 4 },
    { date: '2024-03-13', category: '书写习惯', content: '作业书写工整', score: 5 },
  ];

  // 最新通知
  const latestNotices = [
    { id: 1, title: '关于开展春季研学活动的通知', time: '2024-03-15', isRead: false },
    { id: 2, title: '期中考试时间安排', time: '2024-03-14', isRead: false },
    { id: 3, title: '家长会通知', time: '2024-03-12', isRead: true },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">家长工作台</h1>
            <p className="text-white/80 mt-1">欢迎，{user?.name || '家长'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">今日</p>
            <p className="text-lg font-medium">{new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* 子女信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-600" />
            我的子女
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {children.map((child) => (
              <div 
                key={child.id} 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{child.avatar || '👦'}</div>
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-muted-foreground">{child.className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    在校
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/parent/children?id=${child.id}`}>
                      查看详情
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 快捷功能 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickActions.map((action) => (
          <Link key={action.path} href={action.path}>
            <Card className="h-full hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
              <CardContent className="pt-6 text-center">
                <div className={`w-12 h-12 rounded-xl ${action.color} mx-auto flex items-center justify-center mb-3`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <p className="font-medium">{action.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                {action.badge && (
                  <Badge className="mt-2 bg-amber-100 text-amber-700 text-xs">
                    {action.badge}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 习惯养成概况 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                习惯养成
              </CardTitle>
              <CardDescription>本月习惯养成记录</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/habit">
                查看更多
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentHabits.map((habit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="text-amber-500">
                    {'⭐'.repeat(habit.score)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{habit.content}</p>
                    <p className="text-xs text-muted-foreground">{habit.category}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{habit.date}</div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" asChild>
              <Link href="/parent/habit">
                <Star className="h-4 w-4 mr-2" />
                添加习惯记录
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 最新通知 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-500" />
                最新通知
              </CardTitle>
              <CardDescription>学校公告通知</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/announcements">
                查看更多
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    notice.isRead ? 'bg-muted/30' : 'bg-purple-50'
                  }`}
                >
                  {!notice.isRead && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${!notice.isRead ? 'font-medium' : ''}`}>{notice.title}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{notice.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学习概况 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              学习概况
            </CardTitle>
            <CardDescription>最近一次考试成绩概览</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/parent/grades">
              查看详情
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">语文</p>
              <p className="text-sm text-muted-foreground mt-1">92分</p>
              <Badge className="mt-2 bg-blue-100 text-blue-700">优秀</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">数学</p>
              <p className="text-sm text-muted-foreground mt-1">95分</p>
              <Badge className="mt-2 bg-green-100 text-green-700">优秀</Badge>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">英语</p>
              <p className="text-sm text-muted-foreground mt-1">88分</p>
              <Badge className="mt-2 bg-amber-100 text-amber-700">良好</Badge>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">综合</p>
              <p className="text-sm text-muted-foreground mt-1">班级第5名</p>
              <Badge className="mt-2 bg-purple-100 text-purple-700">进步中</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
