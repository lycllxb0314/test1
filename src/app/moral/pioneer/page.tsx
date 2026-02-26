'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Flag,
  Users,
  Calendar,
  Trophy,
  Star,
  Award,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
} from 'lucide-react';

export default function PioneerPage() {
  // 少先队组织架构
  const organization = [
    { title: '大队辅导员', name: '黄老师', avatar: 'H' },
    { title: '大队长', name: '王小明', class: '六年级1班', avatar: 'W' },
    { title: '副大队长', name: '李小红', class: '六年级2班', avatar: 'L' },
  ];

  // 中队信息
  const squadList = [
    { grade: '一年级', squadCount: 3, memberCount: 135, excellentCount: 2 },
    { grade: '二年级', squadCount: 3, memberCount: 132, excellentCount: 3 },
    { grade: '三年级', squadCount: 3, memberCount: 138, excellentCount: 2 },
    { grade: '四年级', squadCount: 3, memberCount: 129, excellentCount: 2 },
    { grade: '五年级', squadCount: 3, memberCount: 130, excellentCount: 3 },
    { grade: '六年级', squadCount: 3, memberCount: 126, excellentCount: 4 },
  ];

  // 近期活动
  const recentActivities = [
    { id: 1, title: '新队员入队仪式', date: '2024-03-20', location: '学校礼堂', status: 'upcoming', participants: 150 },
    { id: 2, title: '红领巾志愿服务日', date: '2024-03-15', location: '校园周边', status: 'completed', participants: 80 },
    { id: 3, title: '升旗仪式', date: '2024-03-18', location: '学校操场', status: 'today', participants: 450 },
    { id: 4, title: '主题队会：学习雷锋精神', date: '2024-03-22', location: '各班教室', status: 'upcoming', participants: 450 },
  ];

  // 荣誉榜
  const honorList = [
    { name: '张小红', class: '五年级1班', honor: '市级优秀少先队员', date: '2024-03' },
    { name: '李明', class: '六年级2班', honor: '区级优秀少先队员', date: '2024-03' },
    { name: '王芳', class: '四年级3班', honor: '校级优秀少先队员', date: '2024-03' },
    { name: '刘强', class: '三年级1班', honor: '校级优秀少先队员', date: '2024-03' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-red-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flag className="h-7 w-7 text-red-500" />
            少先队管理
          </h1>
          <p className="text-gray-500 mt-1">少先队组织、活动与荣誉管理</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          发布活动
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">少先队员总数</p>
                <p className="text-3xl font-bold">1,856</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">中队数量</p>
                <p className="text-3xl font-bold text-gray-900">18</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Flag className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本学期活动</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">优秀队员</p>
                <p className="text-3xl font-bold text-gray-900">156</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 组织架构与活动 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 组织架构 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">组织架构</CardTitle>
            <CardDescription>少先队主要干部</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organization.map((person, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {person.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.title}</p>
                    {person.class && (
                      <p className="text-xs text-gray-400">{person.class}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 近期活动 */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">近期活动</CardTitle>
              <CardDescription>少先队活动安排</CardDescription>
            </div>
            <Link href="/moral/activities">
              <Button variant="ghost" size="sm" className="text-red-600">
                查看全部 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer ${
                    activity.status === 'today' 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${
                    activity.status === 'today' 
                      ? 'bg-red-500 text-white' 
                      : activity.status === 'upcoming' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Flag className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      {activity.status === 'today' && (
                        <Badge className="bg-red-500 text-white text-xs">今日</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </span>
                      <span>{activity.participants}人参与</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 中队概况与荣誉榜 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 各年级中队概况 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">各年级中队概况</CardTitle>
            <CardDescription>中队数量与队员分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {squadList.map((grade, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-600">{grade.grade}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">{grade.memberCount}名队员</span>
                      <span className="text-gray-500">{grade.squadCount}个中队</span>
                    </div>
                    <Progress value={(grade.memberCount / 140) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600">{grade.excellentCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 荣誉榜 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                荣誉榜
              </CardTitle>
              <CardDescription>优秀少先队员</CardDescription>
            </div>
            <Link href="/moral/growth">
              <Button variant="ghost" size="sm" className="text-red-600">
                查看全部 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {honorList.map((honor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{honor.name}</p>
                      <Badge variant="outline" className="text-xs">{honor.class}</Badge>
                    </div>
                    <p className="text-sm text-amber-600">{honor.honor}</p>
                  </div>
                  <span className="text-xs text-gray-500">{honor.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
