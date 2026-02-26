'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Heart,
  BookOpen,
  Users,
  Trophy,
  Calendar,
  Bell,
  ArrowRight,
  ChevronRight,
  Building2,
  Star,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Target,
} from 'lucide-react';
import { schoolStats, newsList, mockAnnouncements } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 如果已登录，跳转到工作台
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">正在跳转到工作台...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="龙岩师范附属小学" className="h-10 w-10 rounded-lg object-contain" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">龙岩师范附属小学</h1>
                <p className="text-xs text-gray-500">智慧校园管理平台</p>
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#about" className="text-sm text-gray-700 hover:text-primary transition-colors">
                学校概况
              </Link>
              <Link href="#news" className="text-sm text-gray-700 hover:text-primary transition-colors">
                新闻动态
              </Link>
              <Link href="#features" className="text-sm text-gray-700 hover:text-primary transition-colors">
                校园风采
              </Link>
              <Link href="#contact" className="text-sm text-gray-700 hover:text-primary transition-colors">
                联系我们
              </Link>
            </nav>

            {/* 登录按钮 */}
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                <GraduationCap className="h-4 w-4" />
                登录系统
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-yellow-100/20 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            {/* 装饰徽章 */}
            <div className="mb-6 flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">福建省示范小学</span>
              <Sparkles className="h-4 w-4 text-orange-500" />
            </div>

            {/* 主标题 */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              <span className="text-primary">温暖</span>成长，{' '}
              <span className="text-blue-500">智慧</span>育人
            </h1>

            <p className="mb-8 max-w-2xl text-lg text-gray-600 md:text-xl">
              龙岩师范附属小学始建于1914年，百年名校，薪火相传。
              <br className="hidden md:block" />
              以"明德、博学、笃行、创新"为校训，培育时代新人。
            </p>

            {/* 统计数据 */}
            <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{schoolStats.totalStudents}</div>
                <div className="text-sm text-gray-500">在校学生</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 md:text-4xl">{schoolStats.totalTeachers}</div>
                <div className="text-sm text-gray-500">优秀教师</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 md:text-4xl">{schoolStats.totalClasses}</div>
                <div className="text-sm text-gray-500">教学班级</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 md:text-4xl">110</div>
                <div className="text-sm text-gray-500">办学历史/年</div>
              </div>
            </div>

            {/* 快捷入口 */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full px-8">
                  进入智慧校园
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#about">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-gray-300">
                  了解更多
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 系统入口 */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl mb-4">智慧校园平台</h2>
            <p className="text-gray-600">统一门户 · 统一身份认证 · 统一数据管理</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 总务后勤 */}
            <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-6 text-white">
                  <Building2 className="h-10 w-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">总务后勤</h3>
                  <p className="text-sm text-white/80">资产管理、报修维护、采购管理、安全保障</p>
                </div>
                <div className="p-4 bg-white group-hover:bg-orange-50 transition-colors">
                  <div className="flex items-center justify-between text-gray-600 group-hover:text-orange-600">
                    <span className="text-sm">进入系统</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 教务教研 */}
            <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-6 text-white">
                  <GraduationCap className="h-10 w-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">教务教研</h3>
                  <p className="text-sm text-white/80">课程安排、成绩管理、教研活动、教师发展</p>
                </div>
                <div className="p-4 bg-white group-hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between text-gray-600 group-hover:text-blue-600">
                    <span className="text-sm">进入系统</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 德育管理 */}
            <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-green-400 to-green-500 p-6 text-white">
                  <Heart className="h-10 w-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">德育管理</h3>
                  <p className="text-sm text-white/80">少先队管理、德育活动、学生评价、成长档案</p>
                </div>
                <div className="p-4 bg-white group-hover:bg-green-50 transition-colors">
                  <div className="flex items-center justify-between text-gray-600 group-hover:text-green-600">
                    <span className="text-sm">进入系统</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 教师空间 */}
            <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-6 text-white">
                  <Users className="h-10 w-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">教师空间</h3>
                  <p className="text-sm text-white/80">班主任工作台、家校沟通、班级管理（班主任专属）</p>
                </div>
                <div className="p-4 bg-white group-hover:bg-purple-50 transition-colors">
                  <div className="flex items-center justify-between text-gray-600 group-hover:text-purple-600">
                    <span className="text-sm">进入系统</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 新闻公告 */}
      <section id="news" className="py-16 bg-gradient-to-b from-white to-orange-50/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">新闻动态</h2>
              <p className="text-gray-600 mt-2">了解校园最新资讯</p>
            </div>
            <Button variant="outline" className="gap-2">
              查看更多
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockAnnouncements.slice(0, 3).map((item) => (
              <Card key={item.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={item.type === '通知' ? 'default' : item.type === '活动' ? 'secondary' : 'outline'}>
                      {item.type}
                    </Badge>
                    {item.isImportant && (
                      <Badge variant="destructive" className="text-xs">重要</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.content.substring(0, 100)}...</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.publisherName}</span>
                    <span>{item.publishAt.split(' ')[0]}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 学校荣誉 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl mb-4">学校荣誉</h2>
            <p className="text-gray-600">百年积淀，硕果累累</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {schoolStats.awards.map((award, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 px-6 py-3 text-orange-700"
              >
                <Award className="h-5 w-5" />
                <span className="font-medium">{award}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section id="contact" className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold mb-6 md:text-3xl">联系我们</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">学校地址</p>
                    <p className="font-medium">福建省龙岩市新罗区</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">联系电话</p>
                    <p className="font-medium">0597-2XXXXXX</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">办公时间</p>
                    <p className="font-medium">周一至周五 8:00 - 17:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6">快速链接</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/login" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                  教师登录
                </Link>
                <Link href="/login" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                  学生登录
                </Link>
                <Link href="/login" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                  家长登录
                </Link>
                <Link href="/login" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <ChevronRight className="h-4 w-4" />
                  后勤登录
                </Link>
              </div>
            </div>
          </div>

          {/* 底部版权 */}
          <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 福建省龙岩师范附属小学 智慧校园管理平台</p>
            <p className="mt-2">技术支持：智慧校园研发团队</p>
          </div>
        </div>
      </section>
    </div>
  );
}
