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
  Play,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleConfigs, administrativeRoleConfigs } from '@/config/roles';

// 轮播项类型定义
interface CarouselItem {
  id?: string;
  type: 'image' | 'video' | 'bilibili';
  image: string;
  videoUrl?: string;
  bilibiliUrl?: string;
  bilibiliBvid?: string; // B站视频BV号，用于跳转高清播放
  title: string;
  subtitle?: string;
  tag?: string;
}

// 默认轮播图数据（作为后备）
const defaultCarouselItems: CarouselItem[] = [
  {
    type: 'bilibili',
    image: '/images/campus/science-academy-opening.png',
    bilibiliUrl: 'https://player.bilibili.com/player.html?bvid=BV1WdPczBEVv&page=1&high_quality=1&danmaku=0&autoplay=1',
    bilibiliBvid: 'BV1WdPczBEVv',
    title: '少年科学院成立',
    subtitle: '中科院谢华安院士亲自指导',
    tag: '科创特色',
  },
  {
    type: 'image',
    image: '/images/campus/art-festival.png',
    title: '校园艺术节',
    subtitle: '全国艺术教育先进单位',
    tag: '艺术教育',
  },
  {
    type: 'image',
    image: '/images/campus/sports-start.jpg',
    title: '阳光体育运动',
    subtitle: '体质健康合格率全市第一梯队',
    tag: '阳光体育',
  },
  {
    type: 'image',
    image: '/images/campus/young-pioneers.png',
    title: '少先队活动',
    subtitle: '有效德育引领童心成长',
    tag: '德育实践',
  },
  {
    type: 'image',
    image: '/images/campus/classroom-teaching.jpg',
    title: '高效课堂',
    subtitle: '高效课堂发展童心智慧',
    tag: '教学特色',
  },
];

// 童心教育路径类型定义
interface ChildHeartPathItem {
  id?: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
}

// 默认童心教育六大路径（作为后备）
const defaultChildHeartPaths: ChildHeartPathItem[] = [
  { icon: 'Shield', title: '有效德育引领童心', subtitle: '以德育心', image: '/images/campus/scarf-ceremony.png' },
  { icon: 'Lightbulb', title: '高效课堂发展童心', subtitle: '以智启心', image: '/images/campus/chinese-teaching-seminar.jpg' },
  { icon: 'Palette', title: '多彩活动点亮童心', subtitle: '以趣悦心', image: '/images/campus/dance-performance.png' },
  { icon: 'Heart', title: '心理健康呵护童心', subtitle: '以爱护心', image: '/images/campus/safety-roleplay.png' },
  { icon: 'BookHeart', title: '快乐阅读涵养童心', subtitle: '以书润心', image: '/images/campus/recitation-grade5.jpg' },
  { icon: 'TreePine', title: '校园文化润泽童心', subtitle: '以境育心', image: '/images/campus/school-assembly.png' },
];

// 校训
const schoolMotto = [
  { character: '修身', meaning: '修身立德' },
  { character: '力学', meaning: '勤奋学习' },
  { character: '博雅', meaning: '博采众长' },
  { character: '聪慧', meaning: '聪敏睿智' },
];

// 新闻动态（带图片）- 默认静态数据，会被 API 数据覆盖
interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  level?: string;
  image: string;
}

interface NoticeItem {
  id?: string;
  title: string;
  date: string;
}

const defaultNewsItems: NewsItem[] = [
  { title: '我校少年科学院正式成立，中科院谢华安院士出席揭牌仪式', summary: '中国科学院谢华安院士亲临学校，为少年科学院揭牌，激励同学们勇攀科学高峰。', date: '2025-12-15', category: '校园新闻', image: '/images/campus/science-academy-opening.png' },
  { title: '2025年全国学生数字素养大赛斩获"创新之星"最高奖', summary: '我校学子在全国学生数字素养大赛中表现出色，荣获最高荣誉"创新之星"奖项。', date: '2025-11-20', category: '荣誉喜报', image: '/images/campus/art-festival.png' },
  { title: '童心教育实践成果入选福建省小学特色办学标杆案例', summary: '学校"童心教育"办学理念与实践成果获得省级认可，成为全省小学特色办学标杆。', date: '2025-10-15', category: '教育教学', image: '/images/campus/classroom-teaching.jpg' },
  { title: '【学习强国】龙岩师范附小：百年老校的童心教育探索', summary: '学习强国平台专题报道我校百年办学历程与童心教育理念，展现百年名校风采。', date: '2025-12-10', category: '媒体附小', level: '国家级', image: '/images/campus/young-pioneers.png' },
  { title: '【福建日报】传承红色基因，培育时代新人', summary: '福建日报深度报道我校红色教育实践，传承革命精神，培育新时代接班人。', date: '2025-11-28', category: '媒体附小', level: '省级', image: '/images/campus/sports-start.jpg' },
  { title: '【闽西日报】智慧校园建设助力教育高质量发展', summary: '闽西日报报道我校智慧校园建设成果，数字化赋能教育教学，提升办学品质。', date: '2025-11-15', category: '媒体附小', level: '市级', image: '/images/campus/school-assembly.png' },
];

// 校园公告 - 默认静态数据，会被 API 数据覆盖
const defaultNotices: NoticeItem[] = [
  { title: '2026年春季学期开学通知', date: '2026-02-01' },
  { title: '寒假安全致家长一封信', date: '2026-01-15' },
  { title: '期末考试安排及寒假放假通知', date: '2026-01-10' },
  { title: '2025-2026学年第一学期期末工作安排', date: '2026-01-05' },
];

// 办学荣誉类型定义
interface SchoolHonor {
  id?: string;
  title: string;
  year?: string;
}

// 默认办学荣誉（作为后备）
const defaultHonors: SchoolHonor[] = [
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

// 图标名称到组件的映射
const iconMap: Record<string, any> = {
  Shield,
  Lightbulb,
  Palette,
  Heart,
  BookHeart,
  TreePine,
  Award,
  Star,
  BookOpen,
  Users,
};

// 根据图标名称获取图标组件
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Shield;
};

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activePath, setActivePath] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<CarouselItem | null>(null);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  
  // 动态数据状态
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(defaultCarouselItems);
  const [childHeartPaths, setChildHeartPaths] = useState<ChildHeartPathItem[]>(defaultChildHeartPaths);
  const [honors, setHonors] = useState<SchoolHonor[]>(defaultHonors);
  const [newsItems, setNewsItems] = useState(defaultNewsItems);
  const [notices, setNotices] = useState(defaultNotices);
  const [dataLoading, setDataLoading] = useState(true);
  
  // 成果特色办学分类数据
  interface AchievementCategoryData {
    id: string;
    name: string;
    slug: string;
    icon: string;
    tag?: string;
    description?: string;
    featuredAwardTitle?: string;
    featuredAwardContent?: string;
    stats?: { label: string; value: string }[];
    honorsList?: { title: string; subtitle?: string }[];
  }
  const [achievementCategories, setAchievementCategories] = useState<AchievementCategoryData[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取门户数据
  const fetchPortalData = async () => {
    try {
      // 并行获取所有数据
      const [announcementsRes, carouselRes, philosophyRes, honorsRes] = await Promise.all([
        fetch('/api/portal/announcements?limit=10'),
        fetch('/api/portal/carousel?limit=10'),
        fetch('/api/portal/philosophy?limit=10'),
        fetch('/api/portal/honors?limit=10'),
      ]);

      // 处理公告和新闻数据
      const announcementsResult = await announcementsRes.json();
      if (announcementsResult.success) {
        // 映射新闻数据
        if (announcementsResult.data.news && announcementsResult.data.news.length > 0) {
          setNewsItems(announcementsResult.data.news.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary || '',
            date: item.publishedAt ? item.publishedAt.split('T')[0] : '',
            category: item.category || '校园新闻',
            level: item.mediaLevel,
            image: item.coverImage || '/images/campus/school-assembly.png',
          })));
        }
        
        // 映射公告数据
        if (announcementsResult.data.announcements && announcementsResult.data.announcements.length > 0) {
          setNotices(announcementsResult.data.announcements.map((item: any) => ({
            id: item.id,
            title: item.title,
            date: item.publishedAt ? item.publishedAt.split('T')[0] : '',
          })));
        }
      }

      // 处理轮播图数据
      const carouselResult = await carouselRes.json();
      if (carouselResult.success && carouselResult.data && carouselResult.data.length > 0) {
        setCarouselItems(carouselResult.data.map((item: any) => ({
          id: item.id,
          type: item.type,
          image: item.image,
          videoUrl: item.videoUrl,
          bilibiliUrl: item.bilibiliUrl,
          bilibiliBvid: item.bilibiliBvid,
          title: item.title,
          subtitle: item.subtitle || '',
          tag: item.tag || '',
        })));
      }

      // 处理童心教育数据
      const philosophyResult = await philosophyRes.json();
      if (philosophyResult.success && philosophyResult.data && philosophyResult.data.length > 0) {
        setChildHeartPaths(philosophyResult.data.map((item: any) => ({
          id: item.id,
          icon: item.icon,
          title: item.title,
          subtitle: item.subtitle,
          image: item.image,
        })));
      }

      // 处理办学荣誉数据
      const honorsResult = await honorsRes.json();
      if (honorsResult.success && honorsResult.data && honorsResult.data.length > 0) {
        setHonors(honorsResult.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          year: item.year || '',
        })));
      }
      
      // 获取成果特色办学分类数据
      const achievementsRes = await fetch('/api/portal/achievements/categories');
      const achievementsResult = await achievementsRes.json();
      if (achievementsResult.success && achievementsResult.data && achievementsResult.data.length > 0) {
        setAchievementCategories(achievementsResult.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          icon: item.icon,
          tag: item.tag,
          description: item.description,
          featuredAwardTitle: item.featured_award_title,
          featuredAwardContent: item.featured_award_content,
          stats: item.stats || [],
          honorsList: item.honors_list || [],
        })));
      }
    } catch (error) {
      console.error('Failed to fetch portal data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // 初始加载门户数据
  useEffect(() => {
    fetchPortalData();
  }, []);

  // 自动轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 童心教育自动切换
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePath((prev) => (prev + 1) % childHeartPaths.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 新闻自动轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNewsIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [newsItems.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const goPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleCarouselClick = (item: CarouselItem) => {
    if ((item.type === 'video' && item.videoUrl) || (item.type === 'bilibili' && item.bilibiliUrl)) {
      setPlayingVideo(item);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-14" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      
      {/* 顶部导航 - 固定 */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white z-50 backdrop-blur-sm border-b border-white/10">
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
              <Link href="/philosophy" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">办学理念</Link>
              <Link href="/leadership" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">现任领导</Link>
              <Link href="/news" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">新闻中心</Link>
              <Link href="/notices" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">校园公告</Link>
            </nav>

            {user ? (
              <div className="flex items-center gap-4">
                {/* 用户信息显示 */}
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-white/60">|</span>
                  <span className="text-white/90">
                    {roleConfigs[user.role]?.name || user.role}
                    {user.additionalRoles && user.additionalRoles.length > 0 && (
                      <span className="text-white/70 ml-1">
                        （兼任：{administrativeRoleConfigs[user.additionalRoles[0]]?.name || user.additionalRoles[0]}）
                      </span>
                    )}
                  </span>
                </div>
                <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                  <Button className="bg-white text-[#8B5A2B] hover:bg-white/95 rounded-lg px-5 h-9 text-sm font-medium shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
                    进入工作台
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-[#8B5A2B] hover:bg-white/95 rounded-lg px-5 h-9 text-sm font-medium shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 轮播图 */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
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
              
              {/* B站视频可点击区域 */}
              {item.type === 'bilibili' && item.bilibiliUrl && index === currentSlide && (
                <button
                  onClick={() => handleCarouselClick(item)}
                  className="absolute inset-0 z-[15] cursor-pointer"
                  aria-label="点击播放视频"
                />
              )}
            </div>
          ))}
        </div>

        <div className="relative z-20 h-full flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-xs px-4 py-1.5 rounded-full mb-5 border border-white/20 shadow-lg shadow-black/10">
                <Sparkles className="h-3.5 w-3.5 text-white/80" />
                福建省示范小学 · 创建于1914年
              </div>
              <h1 
                className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg tracking-tight"
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
              
              {/* 当前轮播项信息 + 视频播放按钮 */}
              <div className="flex items-center gap-4 flex-wrap pointer-events-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 inline-flex items-center gap-3 border border-white/20 shadow-lg shadow-black/10">
                  <span className="text-xs bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white px-3 py-1 rounded-full font-medium shadow-sm">
                    {carouselItems[currentSlide].tag}
                  </span>
                  <span className="text-white font-medium">{carouselItems[currentSlide].title}</span>
                  <span className="text-white/60 text-sm">· {carouselItems[currentSlide].subtitle}</span>
                </div>
                
                {/* B站视频播放按钮 - 更明显的样式 */}
                {carouselItems[currentSlide].type === 'bilibili' && carouselItems[currentSlide].bilibiliUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCarouselClick(carouselItems[currentSlide]);
                    }}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition font-medium shadow-lg hover:scale-105 active:scale-95"
                  >
                    <Play className="h-5 w-5 fill-white" />
                    播放视频
                  </button>
                )}
              </div>
            </div>
            
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-auto">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { num: '60', label: '教学班', unit: '个' },
                  { num: '3000+', label: '学生', unit: '' },
                  { num: '194', label: '教师', unit: '人' },
                  { num: '112', label: '办学历史', unit: '年' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center text-white min-w-[90px] border border-white/20 shadow-lg shadow-black/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
                    <div className="text-2xl font-bold tracking-tight">
                      {item.num}<span className="text-sm font-normal ml-0.5">{item.unit}</span>
                    </div>
                    <div className="text-xs text-white/80 mt-1 font-medium">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20 hover:border-white/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20 hover:border-white/40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2 bg-white shadow-lg shadow-black/20' 
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60 border border-white/30'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 新闻中心 + 校园公告 */}
      <section id="news" className="py-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_320px] gap-5">
            {/* 左侧：校园公告 */}
            <div className="bg-white/90 rounded-2xl shadow-lg shadow-[#D4A574]/5 border border-[#E8DDD0]/40 overflow-hidden backdrop-blur-sm hover:shadow-xl hover:shadow-[#D4A574]/10 transition-shadow duration-300">
              <div className="flex items-center justify-between p-4 border-b border-[#E8DDD0]/50 bg-[#FDF8F3]/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#8B5A2B]" />
                  <h2 className="font-bold text-[#3D2314]">校园公告</h2>
                </div>
                <Link href="/notices" className="text-sm text-[#8B5A2B]/70 hover:text-[#8B5A2B]">更多 &gt;&gt;</Link>
              </div>
              <div className="divide-y divide-[#E8DDD0]/30">
                {notices.map((item, index) => (
                  <Link 
                    key={item.id || index} 
                    href={item.id ? `/notices/${item.id}` : '#'}
                    className="flex items-center justify-between p-4 hover:bg-[#FDF8F3]/50 transition group"
                  >
                    <span className="text-sm text-[#3D2314] truncate group-hover:text-[#8B5A2B]">
                      {item.title}
                    </span>
                    <span className="text-xs text-[#8B5A2B]/50 ml-2 whitespace-nowrap">{item.date}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 中间：新闻大图轮播 */}
            <div className="rounded-2xl overflow-hidden shadow-lg shadow-[#D4A574]/10 bg-white flex flex-col">
              {/* 图片区域 */}
              <div className="relative flex-1 min-h-[200px]">
                {newsItems.map((item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === activeNewsIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                  </div>
                ))}
                {/* 轮播指示器 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {newsItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveNewsIndex(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === activeNewsIndex 
                          ? 'w-5 h-1.5 bg-white shadow-sm' 
                          : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* 标题+摘要区域 */}
              <div className="p-4 bg-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    newsItems[activeNewsIndex].category === '媒体附小' 
                      ? 'bg-[#D4A574] text-white' 
                      : 'bg-[#8B5A2B] text-white'
                  }`}>
                    {newsItems[activeNewsIndex].category === '媒体附小' 
                      ? newsItems[activeNewsIndex].level 
                      : newsItems[activeNewsIndex].category}
                  </span>
                  <span className="text-xs text-[#8B5A2B]/50">{newsItems[activeNewsIndex].date}</span>
                </div>
                <h3 className="font-bold text-[#3D2314] text-base leading-snug mb-1.5 hover:text-[#8B5A2B] cursor-pointer transition line-clamp-1">
                  {newsItems[activeNewsIndex].title}
                </h3>
                <p className="text-sm text-[#8B5A2B]/60 leading-relaxed line-clamp-2">
                  {newsItems[activeNewsIndex].summary}
                </p>
              </div>
            </div>

            {/* 右侧：新闻中心 */}
            <div className="bg-white/90 rounded-2xl shadow-lg shadow-[#D4A574]/5 border border-[#E8DDD0]/40 overflow-hidden backdrop-blur-sm hover:shadow-xl hover:shadow-[#D4A574]/10 transition-shadow duration-300">
              <div className="flex items-center justify-between p-4 border-b border-[#E8DDD0]/50 bg-[#FDF8F3]/50">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-[#8B5A2B]" />
                  <h2 className="font-bold text-[#3D2314]">新闻中心</h2>
                </div>
                <Link href="/news" className="text-sm text-[#8B5A2B]/70 hover:text-[#8B5A2B]">更多 &gt;&gt;</Link>
              </div>
              <div className="divide-y divide-[#E8DDD0]/30">
                {newsItems.slice(0, 5).map((item, index) => (
                  <Link 
                    key={item.id || index} 
                    href={item.id ? `/news/${item.id}` : '#'}
                    onClick={(e) => { if (!item.id) { e.preventDefault(); setActiveNewsIndex(index); } }}
                    className={`flex items-start gap-3 p-4 transition group ${
                      index === activeNewsIndex ? 'bg-[#D4A574]/10' : 'hover:bg-[#FDF8F3]/50'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E8DDD0]/50">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          item.category === '媒体附小' 
                            ? 'bg-[#D4A574]/20 text-[#8B5A2B]' 
                            : 'bg-[#F5EDE4] text-[#8B5A2B]'
                        }`}>
                          {item.category === '媒体附小' ? item.level : item.category}
                        </span>
                      </div>
                      <p className="text-sm text-[#3D2314] line-clamp-2 group-hover:text-[#8B5A2B]">
                        {item.title}
                      </p>
                      <span className="text-xs text-[#8B5A2B]/50">{item.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 核心叙事板块：百年传承 · 童心育人 ==================== */}
      <section id="philosophy" className="py-16 bg-gradient-to-b from-[#FDF8F3] via-[#FAF6F0] to-[#F5EDE4] relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#D4A574]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#8B5A2B]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          
          {/* 板块标题 */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4A574]" />
              <div className="w-2 h-2 bg-[#D4A574] rounded-full" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4A574]" />
            </div>
            <h2 
              className="text-2xl md:text-3xl font-bold text-[#3D2314] mb-3 tracking-wide"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              百年传承 · 童心育人
            </h2>
            <p className="text-[#8B5A2B]/70 text-sm max-w-2xl mx-auto">
              从1914年到今天，我们始终坚守教育的初心，用爱心浇灌每一颗童心
            </p>
          </div>

          

          {/* 第一篇章：源起 - 校训 */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#D4A574] tracking-widest">CHAPTER</span>
                <span className="text-3xl font-bold text-[#8B5A2B]" style={{ fontFamily: 'var(--font-serif)' }}>壹</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>
                    源起 · 百年校训
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#D4A574] to-transparent"></div>
                </div>
                <span className="text-xs text-[#8B5A2B]/50 mt-1 block">1914年建校</span>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#E8DDD0]/40 shadow-lg shadow-[#D4A574]/5 overflow-hidden hover:shadow-xl hover:shadow-[#D4A574]/10 transition-shadow duration-300">
              <div className="grid md:grid-cols-5">
                {/* 左侧图片 */}
                <div className="relative md:col-span-2 h-56 md:h-72">
                  <img
                    src="/images/campus/teacher-group-photo.png"
                    alt="教师风采"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-white/60"></div>
                </div>
                
                {/* 右侧内容 */}
                <div className="md:col-span-3 p-6 md:p-8">
                  <div className="text-center md:text-left mb-6">
                    <h4 
                      className="text-2xl md:text-3xl font-bold text-[#8B5A2B] tracking-[0.2em] mb-2"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      修身 · 力学 · 博雅 · 聪慧
                    </h4>
                    <p className="text-[#8B5A2B]/60 text-sm">百年校训，代代相传</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {schoolMotto.map((item, index) => (
                      <div key={index} className="text-center p-3 bg-[#FDF8F3] rounded-xl">
                        <div 
                          className="text-2xl font-bold text-[#3D2314] mb-1" 
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {item.character}
                        </div>
                        <p className="text-xs text-[#8B5A2B]/60">{item.meaning}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-[#F5EDE4]/50 rounded-xl">
                      <BookOpen className="h-5 w-5 text-[#8B5A2B]" />
                      <div>
                        <span className="text-xs text-[#8B5A2B]/60 block">教风</span>
                        <span className="text-sm font-medium text-[#3D2314]">身正为范 博学善教</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#F5EDE4]/50 rounded-xl">
                      <Star className="h-5 w-5 text-[#B8860B]" />
                      <div>
                        <span className="text-xs text-[#8B5A2B]/60 block">学风</span>
                        <span className="text-sm font-medium text-[#3D2314]">品行高洁 好学善思</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 第二篇章：理念 - 童心教育 */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#D4A574] tracking-widest">CHAPTER</span>
                <span className="text-3xl font-bold text-[#8B5A2B]" style={{ fontFamily: 'var(--font-serif)' }}>贰</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>
                    理念 · 童心教育
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#D4A574] to-transparent"></div>
                </div>
                <span className="text-xs text-[#8B5A2B]/50 mt-1 block">核心办学品牌</span>
              </div>
            </div>
            
            <div className="bg-white/60 rounded-2xl border border-[#E8DDD0]/30 overflow-hidden">
              <div className="bg-[#FDF8F3]/70 px-6 py-4 border-b border-[#E8DDD0]/30">
                <p className="text-center text-[#8B5A2B]/80 text-sm">
                  "珍视童心，张扬个性，全面发展" —— 以六大路径践行童心教育理念
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-0 items-center">
                {/* 左侧大图 */}
                <Link href="/philosophy" className="relative h-64 md:h-80 overflow-hidden bg-[#F5EDE4] self-center block">
                  <img
                    key={activePath}
                    src={childHeartPaths[activePath].image}
                    alt={childHeartPaths[activePath].title}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                    {/* 右上角查看更多 */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#8B5A2B] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                        点击查看更多
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="inline-block text-xs bg-[#D4A574] text-[#3D2314] px-3 py-1 rounded-full mb-2">
                        {childHeartPaths[activePath].subtitle}
                      </span>
                      <p className="text-white text-lg font-medium">{childHeartPaths[activePath].title}</p>
                    </div>
                  </div>
                </Link>
                
                {/* 右侧六宫格 */}
                <div className="grid grid-cols-2 gap-3 p-4 md:p-6">
                  {childHeartPaths.map((path, index) => {
                    const Icon = getIconComponent(path.icon);
                    const isActive = index === activePath;
                    return (
                      <div
                        key={path.id || index}
                        onClick={() => setActivePath(index)}
                        className={`p-4 rounded-xl text-center transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#8B5A2B] text-white shadow-lg scale-105' 
                            : 'bg-white border border-[#E8DDD0]/50 hover:border-[#D4A574] hover:shadow-md'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition ${
                          isActive ? 'bg-white/20' : 'bg-[#F5EDE4]'
                        }`}>
                          <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#8B5A2B]'}`} />
                        </div>
                        <h4 className={`font-medium text-sm mb-1 ${isActive ? 'text-white' : 'text-[#3D2314]'}`}>
                          {path.title.replace('引领童心', '').replace('发展童心', '').replace('点亮童心', '').replace('呵护童心', '').replace('涵养童心', '').replace('润泽童心', '')}
                        </h4>
                        <p className={`text-xs ${isActive ? 'text-white/80' : 'text-[#B8860B]'}`}>{path.subtitle}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 第三篇章：成果 - 特色与荣誉 */}
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#D4A574] tracking-widest">CHAPTER</span>
                <span className="text-3xl font-bold text-[#8B5A2B]" style={{ fontFamily: 'var(--font-serif)' }}>叁</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>
                    成果 · 特色办学
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#D4A574] to-transparent"></div>
                </div>
                <span className="text-xs text-[#8B5A2B]/50 mt-1 block">区域标杆，全国领先</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-5">
              {achievementCategories.length > 0 ? (
                achievementCategories.map((category, index) => {
                  const IconComponent = getIconComponent(category.icon);
                  const isFirstCard = index === 0;
                  
                  // 第一张卡片（科创教育）使用深色主题
                  if (isFirstCard) {
                    return (
                      <div key={category.id} className="bg-gradient-to-br from-[#3D2314] to-[#5D3A1A] rounded-2xl overflow-hidden text-white flex flex-col">
                        <Link href={`/achievements?category=${category.slug}`} className="relative h-48 block">
                          <img
                            src={category.slug === 'science' ? '/images/campus/robot-award.jpg' : '/images/campus/school-assembly.png'}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#3D2314] via-[#3D2314]/30 to-transparent"></div>
                          <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#3D2314] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                              点击查看更多
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <IconComponent className="h-5 w-5 text-[#D4A574]" />
                            <span className="font-bold">{category.name}</span>
                            {category.tag && (
                              <span className="text-xs bg-[#D4A574] text-[#3D2314] px-2 py-0.5 rounded-full ml-1">{category.tag}</span>
                            )}
                          </div>
                        </Link>
                        
                        <div className="p-5 flex-1 flex flex-col">
                          {category.description && (
                            <p className="text-sm text-white/70 mb-4">{category.description}</p>
                          )}
                          
                          {category.featuredAwardTitle && (
                            <div className="bg-white/10 rounded-xl p-4 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4 text-[#D4A574]" />
                                <span className="text-sm font-medium text-[#D4A574]">{category.featuredAwardTitle}</span>
                              </div>
                              {category.featuredAwardContent && (
                                <p className="text-lg font-bold">{category.featuredAwardContent}</p>
                              )}
                            </div>
                          )}
                          
                          {category.stats && category.stats.length > 0 && (
                            <div className="flex gap-4 mt-auto">
                              {category.stats.map((stat, statIdx) => (
                                <div key={statIdx} className="bg-white/10 rounded-xl p-3 text-center flex-1">
                                  <div className="text-2xl font-bold text-[#D4A574]">{stat.value}</div>
                                  <div className="text-xs text-white/50">{stat.label}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // 其他卡片使用浅色主题
                  return (
                    <div key={category.id} className="bg-white/80 rounded-2xl border border-[#E8DDD0]/50 overflow-hidden flex flex-col hover:shadow-lg transition">
                      <Link href={`/achievements?category=${category.slug}`} className="relative h-48 block">
                        <img
                          src={category.slug === 'moral' ? '/images/campus/teacher-day-award.png' : category.slug === 'art' ? '/images/campus/orchestra.png' : '/images/campus/school-assembly.png'}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#3D2314] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                            点击查看更多
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-white" />
                          <span className="font-bold text-white">{category.name}</span>
                          {category.tag && (
                            <span className="text-xs bg-white/90 text-[#3D2314] px-2 py-0.5 rounded-full ml-1">{category.tag}</span>
                          )}
                        </div>
                      </Link>
                      <div className="p-5 flex-1">
                        {category.description && (
                          <p className="text-sm text-[#8B5A2B]/70 mb-4">{category.description}</p>
                        )}
                        {category.honorsList && category.honorsList.length > 0 && (
                          <div className="space-y-3">
                            {category.honorsList.map((honor, honorIdx) => (
                              <div key={honorIdx} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-[#D4A574]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Award className="h-3.5 w-3.5 text-[#B8860B]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#3D2314]">{honor.title}</p>
                                  {honor.subtitle && (
                                    <p className="text-xs text-[#8B5A2B]/60">{honor.subtitle}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // 默认静态数据作为后备
                <>
                  {/* 科创教育 - 王牌特色 */}
                  <div className="bg-gradient-to-br from-[#3D2314] to-[#5D3A1A] rounded-2xl overflow-hidden text-white flex flex-col">
                    <Link href="/achievements?category=science" className="relative h-48 block">
                      <img
                        src="/images/campus/robot-award.jpg"
                        alt="科创获奖"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#3D2314] via-[#3D2314]/30 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#3D2314] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                          点击查看更多
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#D4A574]" />
                        <span className="font-bold">科创教育</span>
                        <span className="text-xs bg-[#D4A574] text-[#3D2314] px-2 py-0.5 rounded-full ml-1">王牌特色</span>
                      </div>
                    </Link>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-sm text-white/70 mb-4">
                        2025年成立龙岩市首个小学少年科学院，中科院谢华安院士亲自指导
                      </p>
                      
                      <div className="bg-white/10 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-[#D4A574]" />
                          <span className="text-sm font-medium text-[#D4A574]">2025年全国学生数字素养大赛</span>
                        </div>
                        <p className="text-lg font-bold">斩获"创新之星"最高奖项</p>
                      </div>
                      
                      <div className="flex gap-4 mt-auto">
                        <div className="bg-white/10 rounded-xl p-3 text-center flex-1">
                          <div className="text-2xl font-bold text-[#D4A574]">7</div>
                          <div className="text-xs text-white/50">国家级奖项</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center flex-1">
                          <div className="text-2xl font-bold text-[#D4A574]">58</div>
                          <div className="text-xs text-white/50">省级奖项</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 人文德育 */}
                  <div className="bg-white/80 rounded-2xl border border-[#E8DDD0]/50 overflow-hidden flex flex-col hover:shadow-lg transition">
                    <Link href="/achievements?category=moral" className="relative h-48 block">
                      <img
                        src="/images/campus/teacher-day-award.png"
                        alt="人文德育"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#3D2314] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                          点击查看更多
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-white" />
                        <span className="font-bold text-white">人文德育</span>
                      </div>
                    </Link>
                    <div className="p-5 flex-1">
                      <p className="text-sm text-[#8B5A2B]/70 mb-4">
                        以"小目标促成长"为载体，培养学生良好品德与行为习惯
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#D4A574]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Award className="h-3.5 w-3.5 text-[#B8860B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#3D2314]">省级德育典型案例</p>
                            <p className="text-xs text-[#8B5A2B]/60">"小目标促成长"育人模式</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#D4A574]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Award className="h-3.5 w-3.5 text-[#B8860B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#3D2314]">演讲征文比赛</p>
                            <p className="text-xs text-[#8B5A2B]/60">多项一等奖</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 艺体心理 */}
                  <div className="bg-white/80 rounded-2xl border border-[#E8DDD0]/50 overflow-hidden flex flex-col hover:shadow-lg transition">
                    <Link href="/achievements?category=art" className="relative h-48 block">
                      <img
                        src="/images/campus/orchestra.png"
                        alt="艺体心理"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#3D2314] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                          点击查看更多
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Music className="h-5 w-5 text-white" />
                        <span className="font-bold text-white">艺体心理</span>
                      </div>
                    </Link>
                    <div className="p-5 flex-1">
                      <p className="text-sm text-[#8B5A2B]/70 mb-4">
                        艺术体育与心理健康教育并重，促进学生身心全面发展
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#D4A574]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Award className="h-3.5 w-3.5 text-[#B8860B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#3D2314]">全国艺术教育先进单位</p>
                            <p className="text-xs text-[#8B5A2B]/60">艺术教育成果显著</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#D4A574]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Award className="h-3.5 w-3.5 text-[#B8860B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#3D2314]">心理健康教育特色学校</p>
                            <p className="text-xs text-[#8B5A2B]/60">全省领先</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* 办学荣誉 */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {honors.map((honor, index) => (
                <div
                  key={honor.id || index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full border border-[#E8DDD0]/50 hover:shadow-md transition"
                >
                  <Award className="h-4 w-4 text-[#B8860B]" />
                  <span className="text-sm text-[#3D2314]">{honor.title}</span>
                  {honor.year && (
                    <span className="text-xs text-[#B8860B] font-medium">{honor.year}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 智慧校园入口 */}
      <section id="quick-links" className="py-12 bg-gradient-to-b from-[#F5EDE4] to-[#FDF8F3]">
        <div className="max-w-7xl mx-auto px-4">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#8B5A2B]/10 px-4 py-1.5 rounded-full mb-3">
              <Sparkles className="h-4 w-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#8B5A2B]">数字化 · 智能化 · 一体化</span>
            </div>
            <h2 className="text-2xl font-bold text-[#3D2314] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              智慧校园服务平台
            </h2>
            <p className="text-[#8B5A2B]/70 text-sm max-w-xl mx-auto">
              统一门户、统一身份认证、统一数据管理，为教师、家长提供一站式智慧服务
            </p>
          </div>

          {/* 入口卡片 */}
          <div className="grid md:grid-cols-4 gap-5">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={index} href="/login">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-xl hover:shadow-[#D4A574]/10 transition-all duration-300 cursor-pointer group border border-[#E8DDD0]/40 hover:border-[#D4A574]/60 hover:-translate-y-1">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#F5EDE4] to-[#E8DDD0] rounded-2xl flex items-center justify-center mb-4 group-hover:from-[#D4A574]/20 group-hover:to-[#D4A574]/10 transition-all duration-300 shadow-sm">
                        <Icon className="h-7 w-7 text-[#8B5A2B] group-hover:text-[#B8860B] transition" />
                      </div>
                      <h3 className="font-bold text-[#3D2314] mb-1">{link.title}</h3>
                      <p className="text-sm text-[#8B5A2B]/60 mb-3">{link.desc}</p>
                      <div className="flex items-center gap-1 text-[#D4A574] text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                        <span>进入系统</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 底部说明 */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[#8B5A2B]/60">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>安全认证</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>角色权限</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>智能分析</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>数据互通</span>
            </div>
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
                  <span>0597-2135008</span>
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
              <div className="w-28 h-28 bg-white rounded-lg p-1 shadow-lg">
                <img src="/qrcode.png" alt="公众号二维码" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 bg-gradient-to-r from-[#A67C52] via-[#9B7530] to-[#8B6914] text-white/80 text-sm relative overflow-hidden">
        {/* 装饰光效 */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span>© 2026 福建省龙岩师范附属小学 版权所有</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors duration-300">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors duration-300">使用条款</a>
              <a href="#" className="hover:text-white transition-colors duration-300">技术支持</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 视频播放弹窗 */}
      {playingVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPlayingVideo(null)}
        >
          <div 
            className="relative w-full max-w-5xl mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* 视频标题 + B站高清链接 */}
            <div className="absolute top-4 left-4 right-16 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#D4A574] text-[#3D2314] px-2 py-1 rounded-full">
                  {playingVideo.tag}
                </span>
                <span className="text-white font-medium">{playingVideo.title}</span>
              </div>
              
              {/* B站高清观看按钮 */}
              {playingVideo.type === 'bilibili' && playingVideo.bilibiliBvid && (
                <a
                  href={`https://www.bilibili.com/video/${playingVideo.bilibiliBvid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#FB7299] hover:bg-[#E85D87] text-white px-3 py-1.5 rounded-lg transition text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  B站高清
                </a>
              )}
            </div>
            
            {/* B站视频播放器 */}
            {playingVideo.type === 'bilibili' && playingVideo.bilibiliUrl && (
              <iframe
                src={playingVideo.bilibiliUrl}
                className="w-full aspect-video"
                scrolling="no"
                frameBorder="no"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
            
            {/* 自托管视频播放器 - 支持高清 */}
            {playingVideo.type === 'video' && playingVideo.videoUrl && (
              <video
                src={playingVideo.videoUrl}
                controls
                autoPlay
                className="w-full aspect-video"
                poster={playingVideo.image}
              >
                您的浏览器不支持视频播放
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
