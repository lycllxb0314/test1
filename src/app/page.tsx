'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  BookOpen,
  Users,
  Phone,
  MapPin,
  Shield,
  Lightbulb,
  Palette,
  BookHeart,
  Landmark,
  Star,
  TreePine,
  ChevronRight,
  ChevronLeft,
  Bell,
  Newspaper,
  GraduationCap,
  Sparkles,
  Award,
  Music,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 轮播图数据
const carouselItems = [
  {
    image: '/images/campus/science-academy-opening.png',
    title: '少年科学院成立',
    subtitle: '中科院谢华安院士亲自指导',
    tag: '科创特色',
  },
  {
    image: '/images/campus/art-festival.png',
    title: '校园艺术节',
    subtitle: '全国艺术教育先进单位',
    tag: '艺术教育',
  },
  {
    image: '/images/campus/sports-start.jpg',
    title: '阳光体育运动',
    subtitle: '体质健康合格率全市第一梯队',
    tag: '阳光体育',
  },
  {
    image: '/images/campus/young-pioneers.png',
    title: '少先队活动',
    subtitle: '有效德育引领童心成长',
    tag: '德育实践',
  },
  {
    image: '/images/campus/classroom-teaching.jpg',
    title: '高效课堂',
    subtitle: '高效课堂发展童心智慧',
    tag: '教学特色',
  },
];

// 童心教育六大路径
const childHeartPaths = [
  { icon: Shield, title: '有效德育引领童心', subtitle: '以德育心' },
  { icon: Lightbulb, title: '高效课堂发展童心', subtitle: '以智启心' },
  { icon: Palette, title: '多彩活动点亮童心', subtitle: '以趣悦心' },
  { icon: Heart, title: '心理健康呵护童心', subtitle: '以爱护心' },
  { icon: BookHeart, title: '快乐阅读涵养童心', subtitle: '以书润心' },
  { icon: TreePine, title: '校园文化润泽童心', subtitle: '以境育心' },
];

// 校训
const schoolMotto = [
  { character: '修身', meaning: '修身立德' },
  { character: '力学', meaning: '勤奋学习' },
  { character: '博雅', meaning: '博采众长' },
  { character: '聪慧', meaning: '聪敏睿智' },
];

// 新闻动态
const newsItems = [
  { title: '我校少年科学院正式成立，中科院谢华安院士出席揭牌仪式', date: '2025-12-15', category: '校园新闻' },
  { title: '2025年全国学生数字素养大赛斩获"创新之星"最高奖', date: '2025-11-20', category: '荣誉喜报' },
  { title: '童心教育实践成果入选福建省小学特色办学标杆案例', date: '2025-10-15', category: '教育教学' },
  { title: '龙岩师范附小庆祝建校111周年系列活动圆满举行', date: '2025-09-10', category: '校园新闻' },
  { title: '我校学生在龙岩市"福籽同心爱中华"演讲比赛中获一等奖', date: '2025-09-05', category: '荣誉喜报' },
];

// 校园公告
const notices = [
  { title: '2026年春季学期开学通知', date: '2026-02-01' },
  { title: '寒假安全致家长一封信', date: '2026-01-15' },
  { title: '期末考试安排及寒假放假通知', date: '2026-01-10' },
  { title: '2025-2026学年第一学期期末工作安排', date: '2026-01-05' },
];

// 办学荣誉
const honors = [
  { title: '全国文明校园', year: '连续8届' },
  { title: '福建省示范小学', year: '' },
  { title: '全国心理健康教育特色学校', year: '' },
  { title: '全国艺术教育先进单位', year: '' },
];

// 快速入口
const quickLinks = [
  { title: '总务后勤', desc: '后勤服务', icon: Landmark },
  { title: '教务教研', desc: '教学管理', icon: BookOpen },
  { title: '德育管理', desc: '学生工作', icon: Heart },
  { title: '教师空间', desc: '个人中心', icon: Users },
];

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 自动轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const goPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      
      {/* 顶部导航 */}
      <header className="bg-[#8B5A2B] text-white shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <div className="bg-white rounded-lg p-1.5">
                <img 
                  src="/logo-school.png" 
                  alt="福建省龙岩师范附属小学" 
                  className="h-8 w-auto"
                />
              </div>
              <div className="hidden md:block border-l border-white/20 pl-6">
                <span className="text-sm font-medium">福建省龙岩师范附属小学</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <a href="#" className="px-4 py-2 text-sm bg-white/10 rounded-md">首 页</a>
              <a href="#news" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">新闻中心</a>
              <a href="#philosophy" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">办学理念</a>
              <a href="#quick-links" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">快速入口</a>
            </nav>

            {user ? (
              <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                <Button className="bg-white text-[#8B5A2B] hover:bg-white/90 rounded-md px-5 h-8 text-sm font-medium">
                  进入工作台
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-[#8B5A2B] hover:bg-white/90 rounded-md px-5 h-8 text-sm font-medium">
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 轮播图 */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* 图片层 */}
        <div className="absolute inset-0">
          {carouselItems.map((item, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            </div>
          ))}
        </div>

        {/* 内容层 */}
        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="max-w-xl">
              <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full mb-4">
                福建省示范小学 · 创建于1914年
              </div>
              <h1 
                className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                福建省龙岩师范附属小学
              </h1>
              <p 
                className="text-lg md:text-xl text-white/90 mb-2"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                珍视童心，张扬个性，全面发展
              </p>
              <p className="text-white/70 text-sm mb-6">当有情怀的老师，办有温度的学校</p>
              
              {/* 当前幻灯片信息 */}
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 inline-block">
                <span className="text-xs bg-[#D4A574] text-[#3D2314] px-2 py-0.5 rounded-full mr-2">
                  {carouselItems[currentSlide].tag}
                </span>
                <span className="text-white font-medium">{carouselItems[currentSlide].title}</span>
                <span className="text-white/60 text-sm ml-2">· {carouselItems[currentSlide].subtitle}</span>
              </div>
            </div>
            
            {/* 右侧数据统计 */}
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { num: '60', label: '教学班', unit: '个' },
                  { num: '3000+', label: '学生', unit: '' },
                  { num: '194', label: '教师', unit: '人' },
                  { num: '111', label: '办学历史', unit: '年' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-lg p-3 text-center text-white min-w-[80px]">
                    <div className="text-xl font-bold">
                      {item.num}<span className="text-xs font-normal">{item.unit}</span>
                    </div>
                    <div className="text-xs text-white/70">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 左右箭头 */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* 底部指示器 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 h-2 bg-white rounded-full' 
                  : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 新闻中心 + 校园公告 */}
      <section id="news" className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white/80 rounded-xl shadow-sm border border-[#E8DDD0]/50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#E8DDD0]/50 bg-[#FDF8F3]/50">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-[#8B5A2B]" />
                  <h2 className="font-bold text-[#3D2314]">新闻中心</h2>
                </div>
                <a href="#" className="text-sm text-[#8B5A2B]/70 hover:text-[#8B5A2B]">更多 &gt;&gt;</a>
              </div>
              <div className="divide-y divide-[#E8DDD0]/30">
                {newsItems.map((item, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className="flex items-center justify-between p-4 hover:bg-[#FDF8F3]/50 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-[#D4A574]/20 text-[#8B5A2B] rounded-md font-medium">
                          {item.category}
                        </span>
                        <span className="text-sm text-[#3D2314] truncate group-hover:text-[#8B5A2B]">
                          {item.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[#8B5A2B]/50 ml-4 whitespace-nowrap">{item.date}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white/80 rounded-xl shadow-sm border border-[#E8DDD0]/50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#E8DDD0]/50 bg-[#FDF8F3]/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#8B5A2B]" />
                  <h2 className="font-bold text-[#3D2314]">校园公告</h2>
                </div>
                <a href="#" className="text-sm text-[#8B5A2B]/70 hover:text-[#8B5A2B]">更多 &gt;&gt;</a>
              </div>
              <div className="divide-y divide-[#E8DDD0]/30">
                {notices.map((item, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className="flex items-center justify-between p-4 hover:bg-[#FDF8F3]/50 transition group"
                  >
                    <span className="text-sm text-[#3D2314] truncate group-hover:text-[#8B5A2B]">
                      {item.title}
                    </span>
                    <span className="text-xs text-[#8B5A2B]/50 ml-2 whitespace-nowrap">{item.date}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 核心叙事板块：百年传承 · 童心育人 ==================== */}
      <section id="philosophy" className="py-12 bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE4]">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* 板块标题 */}
          <div className="text-center mb-10">
            <h2 
              className="text-2xl md:text-3xl font-bold text-[#3D2314] mb-3"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              百年传承 · 童心育人
            </h2>
            <p className="text-[#8B5A2B]/70 text-sm max-w-2xl mx-auto">
              从1914年到今天，我们始终坚守教育的初心，用爱心浇灌每一颗童心
            </p>
          </div>

          {/* 叙事流程导航 */}
          <div className="flex justify-center items-center gap-2 md:gap-4 mb-10 flex-wrap">
            {[
              { label: '源起', sub: '校训' },
              { label: '理念', sub: '童心教育' },
              { label: '成果', sub: '特色荣誉' },
            ].map((item, i) => (
              <div key={i} className="flex items-center">
                <div className="text-center px-4 py-2 rounded-lg bg-[#8B5A2B] text-white">
                  <div className="text-xs font-medium">{item.label}</div>
                  <div className="text-xs opacity-70">{item.sub}</div>
                </div>
                {i < 2 && (
                  <ChevronRight className="h-4 w-4 text-[#D4A574] mx-1 hidden md:block" />
                )}
              </div>
            ))}
          </div>

          {/* 第一篇章：源起 - 校训 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#8B5A2B] rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <h3 className="text-lg font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>
                源起 · 百年校训
              </h3>
              <span className="text-xs text-[#8B5A2B]/50 ml-2">1914年建校</span>
            </div>
            
            <div className="bg-white/80 rounded-2xl p-6 md:p-8 border border-[#E8DDD0]/50 shadow-sm">
              <div className="text-center mb-8">
                <h4 
                  className="text-3xl md:text-4xl font-bold text-[#8B5A2B] tracking-[0.3em] mb-4"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  修身 · 力学 · 博雅 · 聪慧
                </h4>
                <p className="text-[#8B5A2B]/60 text-sm">百年校训，代代相传</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {schoolMotto.map((item, index) => (
                  <div key={index} className="text-center p-4 bg-[#FDF8F3] rounded-xl">
                    <div 
                      className="text-3xl font-bold text-[#3D2314] mb-2" 
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {item.character}
                    </div>
                    <p className="text-xs text-[#8B5A2B]/60">{item.meaning}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E8DDD0]/50">
                <div className="flex items-center gap-3 p-4 bg-[#F5EDE4]/50 rounded-xl">
                  <BookOpen className="h-5 w-5 text-[#8B5A2B]" />
                  <div>
                    <span className="text-xs text-[#8B5A2B]/60 block">教风</span>
                    <span className="text-sm font-medium text-[#3D2314]">身正为范 博学善教</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#F5EDE4]/50 rounded-xl">
                  <Star className="h-5 w-5 text-[#B8860B]" />
                  <div>
                    <span className="text-xs text-[#8B5A2B]/60 block">学风</span>
                    <span className="text-sm font-medium text-[#3D2314]">品行高洁 好学善思</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 第二篇章：理念 - 童心教育 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#8B5A2B] rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <h3 className="text-lg font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>
                理念 · 童心教育
              </h3>
              <span className="text-xs text-[#8B5A2B]/50 ml-2">核心办学品牌</span>
            </div>
            
            <div className="bg-white/60 rounded-2xl p-6 border border-[#E8DDD0]/30">
              <p className="text-center text-[#8B5A2B]/70 mb-6 text-sm">
                "珍视童心，张扬个性，全面发展" —— 以六大路径践行童心教育理念
              </p>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                {childHeartPaths.map((path, index) => {
                  const Icon = path.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-5 text-center transition-all cursor-pointer hover:shadow-md border border-[#E8DDD0]/30 hover:border-[#D4A574]/50 group"
                    >
                      <div className="w-12 h-12 bg-[#F5EDE4] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4A574]/20 transition">
                        <Icon className="h-6 w-6 text-[#8B5A2B] transition" />
                      </div>
                      <h4 className="font-medium text-[#3D2314] text-sm mb-1">
                        {path.title}
                      </h4>
                      <p className="text-xs text-[#B8860B]">{path.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 第三篇章：成果 - 特色与荣誉 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#8B5A2B] rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <h3 className="text-lg font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>
                成果 · 特色办学
              </h3>
              <span className="text-xs text-[#8B5A2B]/50 ml-2">区域标杆，全国领先</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* 科创教育 */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#3D2314] to-[#5D3A1A] rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-[#D4A574]" />
                  <h4 className="font-bold">科创教育</h4>
                  <span className="text-xs bg-[#D4A574] text-[#3D2314] px-2 py-0.5 rounded-full ml-2">王牌特色</span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-sm text-white/70 mb-4">
                      2025年成立龙岩市首个小学少年科学院，中科院谢华安院士亲自指导
                    </p>
                    
                    <div className="bg-white/10 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-[#D4A574]" />
                        <span className="text-sm font-medium text-[#D4A574]">2025年全国学生数字素养大赛</span>
                      </div>
                      <p className="text-lg font-bold">斩获"创新之星"最高奖项</p>
                      <p className="text-xs text-white/50">三年内第三次闯入国家级赛事，第二次摘得最高荣誉</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {['院士科普', '科创竞赛', '跨学科项目', '小院士评选'].map((tag, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-white/10 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm flex-1">
                      <div className="text-3xl font-bold text-[#D4A574]">7</div>
                      <div className="text-xs text-white/50">国家级奖项</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm flex-1">
                      <div className="text-3xl font-bold text-[#D4A574]">58</div>
                      <div className="text-xs text-white/50">省级奖项</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 右侧：人文德育 + 艺体心理 */}
              <div className="space-y-4">
                <div className="bg-white/80 rounded-xl p-5 border border-[#E8DDD0]/50">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-[#8B5A2B]" />
                    <h4 className="font-bold text-[#3D2314]">人文德育</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4A574] rounded-full"></div>
                      <span className="text-[#5D4037]">"小目标促成长"省级德育典型案例</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4A574] rounded-full"></div>
                      <span className="text-[#5D4037]">演讲征文比赛多项一等奖</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4A574] rounded-full"></div>
                      <span className="text-[#5D4037]">"八大良好习惯"养成教育</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/80 rounded-xl p-5 border border-[#E8DDD0]/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="h-5 w-5 text-[#8B5A2B]" />
                    <h4 className="font-bold text-[#3D2314]">艺体心理</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4A574] rounded-full"></div>
                      <span className="text-[#5D4037]">全国艺术教育先进单位</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4A574] rounded-full"></div>
                      <span className="text-[#5D4037]">心理健康教育全省领先</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#D4A574] rounded-full"></div>
                      <span className="text-[#5D4037]">体质健康合格率全市第一梯队</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 办学荣誉 */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {honors.map((honor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full border border-[#E8DDD0]/50"
                >
                  <Award className="h-4 w-4 text-[#B8860B]" />
                  <span className="text-sm text-[#3D2314]">{honor.title}</span>
                  {honor.year && (
                    <span className="text-xs text-[#B8860B]">{honor.year}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 快速入口 */}
      <section id="quick-links" className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-5 w-5 text-[#8B5A2B]" />
            <h2 className="text-xl font-bold text-[#3D2314]">快速入口</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={index} href="/login">
                  <div className="bg-white/80 rounded-xl p-5 hover:shadow-md transition cursor-pointer group border border-[#E8DDD0]/50 hover:border-[#D4A574]/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F5EDE4] rounded-xl flex items-center justify-center group-hover:bg-[#D4A574]/20 transition">
                        <Icon className="h-6 w-6 text-[#8B5A2B] transition" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#3D2314]">{link.title}</h3>
                        <p className="text-sm text-[#8B5A2B]/60">{link.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#E8DDD0] ml-auto group-hover:text-[#D4A574] transition" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-10 bg-[#C4956A] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4 text-white">联系我们</h3>
              <div className="space-y-3 text-sm text-white/85">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-white/60" />
                  <span>福建省龙岩市新罗区龙川东路11号</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-white/60" />
                  <span>0597-2321234</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-white">办学理念</h3>
              <p className="text-sm text-white/85 leading-relaxed">
                珍视童心，张扬个性，全面发展<br/>
                当有情怀的老师，办有温度的学校
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-white">关注我们</h3>
              <div className="w-24 h-24 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-xs text-white/70">公众号二维码</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-6 bg-[#5D3A1A] text-white/60 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© 2024 福建省龙岩师范附属小学 版权所有</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/80 transition">隐私政策</a>
              <a href="#" className="hover:text-white/80 transition">使用条款</a>
              <a href="#" className="hover:text-white/80 transition">技术支持</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
