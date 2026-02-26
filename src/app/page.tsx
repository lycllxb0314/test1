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
  Camera,
  Music,
  Palette,
  Bike,
  Leaf,
  Sun,
  CloudRain,
  Thermometer,
  Quote,
  Play,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 学校风采图片数据
const campusGallery = [
  { id: 1, src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop', title: '校园正门', desc: '百年名校，气势恢宏' },
  { id: 2, src: 'https://images.unsplash.com/photo-1562774053-701cf5babab6?w=800&h=600&fit=crop', title: '教学楼', desc: '现代化教学设施' },
  { id: 3, src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop', title: '图书馆', desc: '知识的海洋' },
  { id: 4, src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop', title: '科学实验室', desc: '探索科学奥秘' },
  { id: 5, src: 'https://images.unsplash.com/photo-1571260899307-0f5b8e5c1c1a?w=800&h=600&fit=crop', title: '运动场', desc: '阳光体育，健康成长' },
  { id: 6, src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop', title: '校园一角', desc: '绿树成荫，环境优美' },
];

// 办学特色
const schoolFeatures = [
  { 
    icon: BookOpen, 
    title: '书香校园', 
    desc: '传承百年文化，打造阅读特色学校',
    color: 'bg-blue-500',
    details: ['藏书5万余册的图书馆', '每月读书分享会', '经典诵读活动']
  },
  { 
    icon: Palette, 
    title: '艺术教育', 
    desc: '全面发展艺术素养，培养审美能力',
    color: 'bg-purple-500',
    details: ['合唱团、舞蹈队', '书法、绘画社团', '艺术节展演']
  },
  { 
    icon: Trophy, 
    title: '科技创新', 
    desc: '科技引领未来，培养创新精神',
    color: 'bg-green-500',
    details: ['创客实验室', '机器人编程', '科技竞赛获奖']
  },
  { 
    icon: Heart, 
    title: '德育为先', 
    desc: '立德树人，培养品德高尚的少年',
    color: 'bg-orange-500',
    details: ['红色基因传承', '德育主题活动', '行为习惯养成']
  },
];

// 校园活动
const campusActivities = [
  { 
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=400&fit=crop',
    title: '开学典礼', 
    date: '2024年9月1日',
    desc: '新学期新起点，全体师生共迎开学典礼'
  },
  { 
    image: 'https://images.unsplash.com/photo-1544531586-fde5e5e2a0f2?w=600&h=400&fit=crop',
    title: '运动会', 
    date: '2024年10月15-17日',
    desc: '阳光体育，快乐运动，全校师生积极参与'
  },
  { 
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
    title: '读书节', 
    date: '2024年11月',
    desc: '书香满校园，阅读伴成长，系列读书活动'
  },
  { 
    image: 'https://images.unsplash.com/photo-1571260899307-0f5b8e5c1c1a?w=600&h=400&fit=crop',
    title: '艺术节', 
    date: '2024年12月',
    desc: '艺术展示舞台，学生才艺绽放'
  },
];

// 荣誉展示
const honors = [
  { title: '全国文明校园', year: '2023', org: '中央文明办' },
  { title: '福建省示范小学', year: '2018', org: '福建省教育厅' },
  { title: '全国青少年校园足球特色学校', year: '2022', org: '教育部' },
  { title: '福建省德育工作先进学校', year: '2021', org: '福建省教育厅' },
  { title: '龙岩市教学质量先进单位', year: '2023', org: '龙岩市教育局' },
  { title: '全国优秀少先队集体', year: '2020', org: '共青团中央' },
];

// 新闻动态
const newsList = [
  { id: 1, title: '我校师生在省级科技创新大赛中荣获一等奖', date: '2024-03-15', type: '喜讯', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=300&fit=crop' },
  { id: 2, title: '学校开展"传承红色基因"主题教育活动', date: '2024-03-12', type: '活动', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop' },
  { id: 3, title: '著名教育专家到校指导教学工作', date: '2024-03-10', type: '新闻', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop' },
  { id: 4, title: '学校足球队荣获市级联赛冠军', date: '2024-03-08', type: '喜讯', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop' },
];

// 学校统计数据
const schoolStats = {
  totalStudents: 2800,
  totalTeachers: 168,
  totalClasses: 56,
  campusArea: 35000,
};

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentGallery, setCurrentGallery] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 自动轮播
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrentGallery((prev) => (prev + 1) % campusGallery.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [mounted]);

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
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
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
            <nav className="hidden md:flex items-center gap-8">
              <a href="#hero" className="text-sm text-gray-700 hover:text-primary transition-colors font-medium">首页</a>
              <a href="#about" className="text-sm text-gray-700 hover:text-primary transition-colors font-medium">学校概况</a>
              <a href="#gallery" className="text-sm text-gray-700 hover:text-primary transition-colors font-medium">校园风光</a>
              <a href="#features" className="text-sm text-gray-700 hover:text-primary transition-colors font-medium">办学特色</a>
              <a href="#news" className="text-sm text-gray-700 hover:text-primary transition-colors font-medium">新闻动态</a>
              <a href="#contact" className="text-sm text-gray-700 hover:text-primary transition-colors font-medium">联系我们</a>
            </nav>

            {/* 登录按钮 */}
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-orange-500/20">
                <GraduationCap className="h-4 w-4" />
                登录系统
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 - 全屏轮播 */}
      <section id="hero" className="relative h-screen overflow-hidden">
        {/* 背景图片轮播 */}
        <div className="absolute inset-0">
          {campusGallery.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentGallery ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            </div>
          ))}
        </div>

        {/* 内容 */}
        <div className="relative h-full flex flex-col justify-center items-center text-white px-4 pt-16">
          {/* 装饰徽章 */}
          <div className="mb-6 flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-6 py-2">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">福建省示范小学 · 百年名校</span>
            <Sparkles className="h-4 w-4 text-yellow-300" />
          </div>

          {/* 主标题 */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-center md:text-6xl lg:text-7xl drop-shadow-lg">
            龙岩师范附属小学
          </h1>

          <p className="mb-6 text-xl md:text-2xl text-white/90 font-light">
            明德 · 博学 · 笃行 · 创新
          </p>

          <p className="mb-10 max-w-2xl text-center text-white/80 md:text-lg">
            始建于1914年，百年薪火相传，培育时代新人
            <br className="hidden md:block" />
            以"温暖成长，智慧育人"为理念，打造有温度的智慧校园
          </p>

          {/* 统计数据 */}
          <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-12">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-3xl md:text-4xl font-bold">{schoolStats.totalStudents}</div>
              <div className="text-sm text-white/70">在校学生</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-3xl md:text-4xl font-bold">{schoolStats.totalTeachers}</div>
              <div className="text-sm text-white/70">优秀教师</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-3xl md:text-4xl font-bold">{schoolStats.totalClasses}</div>
              <div className="text-sm text-white/70">教学班级</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-3xl md:text-4xl font-bold">110</div>
              <div className="text-sm text-white/70">办学历史/年</div>
            </div>
          </div>

          {/* 快捷按钮 */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full px-8 h-12 shadow-xl shadow-orange-500/30">
                进入智慧校园
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#about">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20">
                了解更多
              </Button>
            </a>
          </div>

          {/* 轮播指示器 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {campusGallery.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentGallery(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentGallery ? 'w-8 bg-primary' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRightIcon className="h-8 w-8 text-white/50 rotate-90" />
        </div>
      </section>

      {/* 学校概况 */}
      <section id="about" className="py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">学校概况</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">百年名校，薪火相传</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              龙岩师范附属小学创建于1914年，是一所具有百年历史的省级示范小学
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 左侧图片 */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop"
                  alt="校园全景"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 装饰卡片 */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">110年</div>
                    <div className="text-sm text-gray-500">办学历史</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧内容 */}
            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed text-lg">
                龙岩师范附属小学位于福建省龙岩市新罗区，是龙岩市教育局直属小学。
                学校秉承"明德、博学、笃行、创新"的校训，坚持"以人为本、全面发展"的办学理念，
                致力于培养具有健全人格、创新精神和实践能力的社会主义建设者和接班人。
              </p>
              <p className="text-gray-600 leading-relaxed">
                学校占地面积约35亩，建筑面积2万余平方米。现有教学班56个，学生2800余人，
                教职工168人。学校拥有一支师德高尚、业务精湛的教师队伍，
                其中省级骨干教师15人，市级骨干教师32人，高级教师28人。
              </p>
              
              {/* 特色数据 */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-primary">15人</div>
                  <div className="text-xs text-gray-500">省级骨干教师</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-500">32人</div>
                  <div className="text-xs text-gray-500">市级骨干教师</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-500">28人</div>
                  <div className="text-xs text-gray-500">高级教师</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 校园风光 */}
      <section id="gallery" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Camera className="h-4 w-4" />
              <span className="text-sm font-medium">校园风光</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">美丽校园，成长乐园</h2>
            <p className="text-gray-600">绿树成荫，环境优美，是孩子们快乐成长的乐园</p>
          </div>

          {/* 图片网格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {campusGallery.map((item, index) => (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
              >
                <div className={`relative ${index === 0 ? 'h-96 md:h-auto' : 'h-48'}`}>
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <h3 className="text-white font-bold text-lg">{item.title}</h3>
                    <p className="text-white/80 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 办学特色 */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">办学特色</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">特色发展，全面育人</h2>
            <p className="text-gray-600">立足传统，面向未来，打造学校特色品牌</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white">
                  <CardContent className="p-6">
                    <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{feature.desc}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 校园活动 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">校园活动</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">精彩活动，快乐成长</h2>
            <p className="text-gray-600">丰富多彩的校园活动，让每个孩子都能绽放光彩</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {campusActivities.map((activity, index) => (
              <Card key={index} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary text-white">{activity.date}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{activity.title}</h3>
                  <p className="text-sm text-gray-600">{activity.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 荣誉展示 */}
      <section className="py-20 bg-gradient-to-r from-primary to-orange-400 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">荣誉展示</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">累累硕果，实至名归</h2>
            <p className="text-white/80">学校获得的各项荣誉，见证了百年名校的辉煌历程</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {honors.map((honor, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
                <div className="flex items-start gap-3">
                  <Trophy className="h-6 w-6 text-yellow-300 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">{honor.title}</h4>
                    <p className="text-sm text-white/70">{honor.org} · {honor.year}年</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 新闻动态 */}
      <section id="news" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">新闻动态</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">校园新闻</h2>
            <p className="text-gray-600">了解学校最新动态和资讯</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newsList.map((news) => (
              <Card key={news.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={news.type === '喜讯' ? 'default' : 'secondary'} 
                      className={news.type === '喜讯' ? 'bg-red-500 text-white' : ''}>
                      {news.type}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-xs text-gray-500">{news.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="gap-2">
              查看更多新闻
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 智慧校园平台入口 */}
      <section className="py-20 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm font-medium">智慧校园</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">智慧校园管理平台</h2>
            <p className="text-gray-600">统一门户 · 统一身份认证 · 统一数据管理</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-sm text-white/80">教师工作台、班级管理、家校沟通、日常管理</p>
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

          <div className="text-center mt-10">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full px-10 h-12 shadow-xl shadow-orange-500/20">
                立即登录使用
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">联系我们</h2>
              <p className="text-gray-400 mb-8">
                欢迎社会各界人士莅临指导，欢迎家长朋友咨询交流
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">学校地址</div>
                    <div>福建省龙岩市新罗区东城街道东宫下1号</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">联系电话</div>
                    <div>0597-2320XXX</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">办公时间</div>
                    <div>周一至周五 8:00 - 17:30</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop"
                  alt="校园地图"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-4 right-4">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  查看地图
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-950 text-gray-400 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="龙岩师范附属小学" className="h-8 w-8 rounded-lg object-contain bg-white/10 p-1" />
              <span className="text-white font-medium">龙岩师范附属小学</span>
            </div>
            <div className="text-sm">
              © 2024 龙岩师范附属小学 版权所有 | 闽ICP备XXXXXXXX号
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
