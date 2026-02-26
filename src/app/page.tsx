'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  Award,
  Target,
  ChevronDown,
  Palette,
  Leaf,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 五育数据 - 统一每类4张
const fiveEducation = [
  {
    category: '德',
    title: '德育为先',
    subtitle: '立德树人',
    color: '#C41E3A',
    bgColor: '#FFF1F0',
    icon: Heart,
    images: [
      { src: '/images/campus/scarf-ceremony.png', title: '红领巾佩戴仪式', desc: '一年级新队员入队仪式' },
      { src: '/images/campus/young-pioneers.png', title: '少先队礼仪活动', desc: '规范礼仪教育' },
      { src: '/images/campus/recitation-grade6.jpg', title: '红色朗诵比赛', desc: '弘扬抗战精神' },
      { src: '/images/campus/fire-safety-class.jpg', title: '消防安全教育', desc: '安全意识培养' },
    ],
    desc: '传承红色基因，培养品德高尚的新时代少年',
  },
  {
    category: '智',
    title: '智育启慧',
    subtitle: '启迪智慧',
    color: '#1E4D8C',
    bgColor: '#F0F5FF',
    icon: BookOpen,
    images: [
      { src: '/images/campus/science-academy.png', title: '少年科学院成立', desc: '院士揭牌仪式' },
      { src: '/images/campus/robot-interaction.jpg', title: '机器人互动体验', desc: '科技创新实践' },
      { src: '/images/campus/wrc-finals-team.jpg', title: '世界机器人大赛', desc: '国际赛事获奖' },
      { src: '/images/campus/english-contest.png', title: '趣味英语竞赛', desc: '语言能力展示' },
    ],
    desc: '科技引领未来，培养创新精神和实践能力',
  },
  {
    category: '体',
    title: '体育强身',
    subtitle: '强健体魄',
    color: '#D4650A',
    bgColor: '#FFF7E6',
    icon: Trophy,
    images: [
      { src: '/images/campus/group-exercise.jpg', title: '广播体操比赛', desc: '阳光体育活动' },
      { src: '/images/campus/sports-race.jpg', title: '田径运动会', desc: '短跑精彩瞬间' },
      { src: '/images/campus/sports-start.jpg', title: '起跑时刻', desc: '拼搏竞技精神' },
      { src: '/images/campus/eye-exercise.jpg', title: '眼保健操', desc: '视力保护教育' },
    ],
    desc: '阳光体育，强健体魄，培养运动精神',
  },
  {
    category: '美',
    title: '美育润心',
    subtitle: '陶冶情操',
    color: '#722ED1',
    bgColor: '#F9F0FF',
    icon: Palette,
    images: [
      { src: '/images/campus/dance-contest.png', title: '艺术节舞蹈', desc: '第41届校园艺术节' },
      { src: '/images/campus/orchestra.png', title: '器乐演奏', desc: '音乐会表演' },
      { src: '/images/campus/festival-opening.png', title: '文艺汇演', desc: '六一儿童节演出' },
      { src: '/images/campus/lion-dance-activity.jpg', title: '醒狮文化', desc: '传统文化进校园' },
    ],
    desc: '全面发展艺术素养，培养审美能力',
  },
  {
    category: '劳',
    title: '劳育强能',
    subtitle: '劳动光荣',
    color: '#237804',
    bgColor: '#F6FFED',
    icon: Leaf,
    images: [
      { src: '/images/campus/labor-food-display.jpg', title: '劳动素养大赛', desc: '美食成果展示' },
      { src: '/images/campus/labor-cooking.jpg', title: '烹饪实践', desc: '劳动技能培养' },
      { src: '/images/campus/planting.jpg', title: '校园种植', desc: '植物观察记录' },
      { src: '/images/campus/succulent.jpg', title: '多肉种植', desc: '绿色植物养护' },
    ],
    desc: '劳动实践，培养动手能力和劳动精神',
  },
];

// 教师发展
const teacherDevelopment = [
  { image: '/images/campus/conference-hall.png', title: '学术报告厅', tag: '教学研讨' },
  { image: '/images/campus/talent-meeting.png', title: '人才工作会议', tag: '人才发展' },
  { image: '/images/campus/teacher-award.png', title: '教师表彰典礼', tag: '表彰典礼' },
  { image: '/images/campus/brain-science-training.jpg', title: '脑科学教学培训', tag: '专业培训' },
  { image: '/images/campus/researcher-guidance.png', title: '教研员入校指导', tag: '教研指导' },
  { image: '/images/campus/qinglan-project.png', title: '青蓝工程', tag: '教师成长' },
];

// 校园活动
const campusActivities = [
  { image: '/images/campus/festival-stage.png', title: '校园文化艺术节', date: '2025年5月', desc: '第41届艺术节暨六一文艺汇演' },
  { image: '/images/campus/science-academy.png', title: '少年科学院成立', date: '2025年12月', desc: '与院士同行，赴科学之约' },
  { image: '/images/campus/tech-festival.jpg', title: '科技节活动', date: '2025年', desc: '科创少年，智领未来' },
  { image: '/images/campus/sports-race.jpg', title: '田径运动会', date: '2025年秋季', desc: '阳光体育，强健体魄' },
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
  { id: 1, title: '我校师生在省级科技创新大赛中荣获一等奖', date: '2024-03-15', type: '喜讯' },
  { id: 2, title: '学校开展"传承红色基因"主题教育活动', date: '2024-03-12', type: '活动' },
  { id: 3, title: '著名教育专家到校指导教学工作', date: '2024-03-10', type: '新闻' },
  { id: 4, title: '学校足球队荣获市级联赛冠军', date: '2024-03-08', type: '喜讯' },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeEdu, setActiveEdu] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, user, router]);

  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [mounted]);

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (!mounted) return null;

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFFAF0 0%, #FFF8F0 100%)' }}>
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 mx-auto" style={{ borderColor: '#8B4513', borderTopColor: 'transparent' }} />
          <p className="mt-4" style={{ color: '#6B5B4F' }}>正在跳转到工作台...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFFAF0' }}>
      
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(255, 250, 240, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E8DDD0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div 
                className="h-14 w-14 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B4513 0%, #B8860B 100%)' }}
              >
                <span className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>龙</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>龙岩师范附属小学</h1>
                <p className="text-sm" style={{ color: '#8B7355' }}>百年名校 · 薪火相传</p>
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="hidden lg:flex items-center gap-8">
              {['学校概况', '五育并举', '教师发展', '校园活动', '新闻动态'].map((item, index) => (
                <a
                  key={index}
                  href={`#${['about', 'education', 'teacher', 'activity', 'news'][index]}`}
                  className="text-base font-medium transition-colors duration-200 hover:opacity-70"
                  style={{ color: '#4A3728' }}
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* 登录按钮 */}
            <Link href="/login">
              <Button 
                className="h-11 px-6 text-white font-medium rounded-lg"
                style={{ background: 'linear-gradient(135deg, #8B4513 0%, #B8860B 100%)' }}
              >
                登录系统
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative min-h-screen pt-20 flex items-center">
        {/* 背景 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <svg viewBox="0 0 200 200" className="w-full h-full" style={{ color: '#8B4513' }}>
              <path fill="currentColor" d="M100,10 L190,100 L100,190 L10,100 Z" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #B8860B 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左侧文字 */}
            <div className="space-y-8">
              {/* 校训徽章 */}
              <div 
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full"
                style={{ background: 'rgba(139, 69, 19, 0.1)', border: '1px solid rgba(139, 69, 19, 0.2)' }}
              >
                <Star className="h-4 w-4" style={{ color: '#B8860B' }} />
                <span className="text-sm font-medium" style={{ color: '#8B4513' }}>福建省示范小学 · 始建于1914年</span>
              </div>

              {/* 主标题 */}
              <h1 
                className="text-5xl lg:text-6xl font-bold leading-tight"
                style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}
              >
                龙岩师范附属小学
              </h1>

              {/* 校训 */}
              <p className="text-2xl font-medium" style={{ fontFamily: 'var(--font-serif)', color: '#8B4513' }}>
                明德 · 博学 · 笃行 · 创新
              </p>

              {/* 描述 */}
              <p className="text-lg leading-relaxed" style={{ color: '#5A4A3A' }}>
                百年薪火相传，以"温暖成长，智慧育人"为理念，<br />
                培育德智体美劳全面发展的新时代少年。
              </p>

              {/* 统计数据 */}
              <div className="grid grid-cols-4 gap-6 pt-4">
                {[
                  { value: '110', unit: '年', label: '办学历史' },
                  { value: '2800', unit: '人', label: '在校学生' },
                  { value: '168', unit: '人', label: '优秀教师' },
                  { value: '56', unit: '个', label: '教学班级' },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: '#8B4513' }}>{stat.value}</span>
                      <span className="text-sm" style={{ color: '#8B7355' }}>{stat.unit}</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: '#8B7355' }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* 按钮组 */}
              <div className="flex gap-4 pt-4">
                <Link href="/login">
                  <Button 
                    size="lg"
                    className="h-14 px-8 text-white font-medium rounded-lg"
                    style={{ background: 'linear-gradient(135deg, #8B4513 0%, #B8860B 100%)' }}
                  >
                    进入智慧校园
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#about">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 font-medium rounded-lg"
                    style={{ borderColor: '#8B4513', color: '#8B4513' }}
                  >
                    了解更多
                  </Button>
                </a>
              </div>
            </div>

            {/* 右侧图片展示 */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {campusActivities.map((activity, index) => (
                  <div 
                    key={index}
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    style={{ 
                      aspectRatio: index === 0 ? '4/3' : '1/1',
                      border: '3px solid #E8DDD0'
                    }}
                  >
                    {!imageErrors[`hero-${index}`] ? (
                      <img
                        src={activity.image}
                        alt={activity.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(`hero-${index}`)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#F5EDE4' }}>
                        <GraduationCap className="h-12 w-12" style={{ color: '#C4A77D' }} />
                      </div>
                    )}
                    {/* 标题 */}
                    <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(transparent, rgba(44, 24, 16, 0.8))' }}>
                      <p className="text-white font-medium text-sm">{activity.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* 装饰元素 */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-30" style={{ background: '#B8860B' }} />
            </div>
          </div>
        </div>

        {/* 向下滚动 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8" style={{ color: '#C4A77D' }} />
        </div>
      </section>

      {/* 学校概况 */}
      <section id="about" className="py-24" style={{ background: '#FFF8F0' }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <Building2 className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>
              百年名校 · 薪火相传
            </h2>
            <p className="text-lg" style={{ color: '#5A4A3A' }}>
              龙岩师范附属小学创建于1914年，是一所具有百年历史的省级示范小学
            </p>
          </div>

          {/* 内容区域 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 左侧大图 */}
            <div className="relative">
              <div 
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ border: '4px solid #E8DDD0' }}
              >
                <img
                  src="/images/campus/festival-stage.png"
                  alt="校园风采"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
              {/* 装饰标签 */}
              <div 
                className="absolute -bottom-6 -right-6 px-8 py-6 rounded-xl shadow-xl"
                style={{ background: 'linear-gradient(135deg, #8B4513 0%, #B8860B 100%)' }}
              >
                <div className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>110年</div>
                <div className="text-white/80 text-sm">办学历史</div>
              </div>
            </div>

            {/* 右侧介绍 */}
            <div className="space-y-6">
              <p className="text-lg leading-relaxed" style={{ color: '#3D3027' }}>
                龙岩师范附属小学位于福建省龙岩市新罗区，是龙岩市教育局直属小学。
                学校秉承"明德、博学、笃行、创新"的校训，坚持"以人为本、全面发展"的办学理念，
                致力于培养具有健全人格、创新精神和实践能力的社会主义建设者和接班人。
              </p>
              <p className="text-lg leading-relaxed" style={{ color: '#3D3027' }}>
                学校占地面积约35亩，建筑面积2万余平方米。学校拥有一支师德高尚、业务精湛的教师队伍，
                其中省级骨干教师15人，市级骨干教师32人，高级教师28人。
              </p>
              
              {/* 师资数据 */}
              <div className="grid grid-cols-3 gap-6 pt-6">
                {[
                  { value: '15', label: '省级骨干教师', color: '#C41E3A' },
                  { value: '32', label: '市级骨干教师', color: '#1E4D8C' },
                  { value: '28', label: '高级教师', color: '#D4650A' },
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="text-center p-6 rounded-xl"
                    style={{ background: 'white', border: '2px solid #E8DDD0' }}
                  >
                    <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: item.color }}>{item.value}人</div>
                    <div className="text-sm mt-2" style={{ color: '#6B5B4F' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 五育并举 - 核心展示区 */}
      <section id="education" className="py-24" style={{ background: '#FFFAF0' }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <Target className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>
              五育并举 · 全面发展
            </h2>
            <p className="text-lg" style={{ color: '#5A4A3A' }}>
              德智体美劳全面发展，培养新时代好少年
            </p>
          </div>

          {/* 五育切换标签 */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {fiveEducation.map((edu, index) => {
              const Icon = edu.icon;
              return (
                <button
                  key={index}
                  onClick={() => setActiveEdu(index)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer"
                  style={{
                    background: activeEdu === index ? edu.color : 'white',
                    color: activeEdu === index ? 'white' : edu.color,
                    border: `2px solid ${edu.color}`,
                    boxShadow: activeEdu === index ? `0 4px 20px ${edu.color}40` : 'none'
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span style={{ fontFamily: 'var(--font-serif)' }}>{edu.category}</span>
                </button>
              );
            })}
          </div>

          {/* 五育内容展示 */}
          {fiveEducation.map((edu, eduIndex) => (
            <div
              key={eduIndex}
              className={`transition-all duration-500 ${activeEdu === eduIndex ? 'block' : 'hidden'}`}
            >
              <div 
                className="rounded-2xl p-8"
                style={{ background: edu.bgColor, border: `2px solid ${edu.color}20` }}
              >
                {/* 标题行 */}
                <div className="flex items-center gap-6 mb-8">
                  <div 
                    className="w-20 h-20 rounded-xl flex items-center justify-center"
                    style={{ background: edu.color }}
                  >
                    <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>{edu.category}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>{edu.title}</h3>
                    <p className="text-base mt-1" style={{ color: '#5A4A3A' }}>{edu.desc}</p>
                  </div>
                </div>

                {/* 图片网格 - 统一4张 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {edu.images.map((img, imgIndex) => (
                    <div 
                      key={imgIndex}
                      className="group bg-white rounded-xl overflow-hidden cursor-pointer"
                      style={{ border: `2px solid ${edu.color}20` }}
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        {!imageErrors[`edu-${eduIndex}-${imgIndex}`] ? (
                          <img
                            src={img.src}
                            alt={img.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => handleImageError(`edu-${eduIndex}-${imgIndex}`)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: edu.bgColor }}>
                            <edu.icon className="h-12 w-12" style={{ color: edu.color }} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-base mb-1" style={{ color: '#2C1810' }}>{img.title}</h4>
                        <p className="text-sm" style={{ color: '#6B5B4F' }}>{img.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 教师发展 */}
      <section id="teacher" className="py-24" style={{ background: '#FFF8F0' }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <Users className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>
              强师兴教 · 专业成长
            </h2>
            <p className="text-lg" style={{ color: '#5A4A3A' }}>
              打造高素质专业化教师队伍，助力教师专业发展
            </p>
          </div>

          {/* 教师发展卡片 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teacherDevelopment.map((item, index) => (
              <div 
                key={index}
                className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{ border: '2px solid #E8DDD0' }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {!imageErrors[`teacher-${index}`] ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => handleImageError(`teacher-${index}`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: '#F5EDE4' }}>
                      <Users className="h-12 w-12" style={{ color: '#C4A77D' }} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge style={{ background: '#8B4513', color: 'white', border: 'none' }}>{item.tag}</Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 校园活动 */}
      <section id="activity" className="py-24" style={{ background: '#FFFAF0' }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <Calendar className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>
              精彩活动 · 快乐成长
            </h2>
            <p className="text-lg" style={{ color: '#5A4A3A' }}>
              丰富多彩的校园活动，让每个孩子都能绽放光彩
            </p>
          </div>

          {/* 活动卡片 - 大图展示 */}
          <div className="grid md:grid-cols-2 gap-8">
            {campusActivities.map((activity, index) => (
              <div 
                key={index}
                className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{ border: '2px solid #E8DDD0' }}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  {!imageErrors[`activity-${index}`] ? (
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => handleImageError(`activity-${index}`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: '#F5EDE4' }}>
                      <Calendar className="h-12 w-12" style={{ color: '#C4A77D' }} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(transparent, rgba(44, 24, 16, 0.8))' }}>
                    <Badge style={{ background: '#B8860B', color: 'white', border: 'none' }}>{activity.date}</Badge>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>{activity.title}</h3>
                  <p className="text-base" style={{ color: '#6B5B4F' }}>{activity.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 荣誉展示 */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2F4F4F 0%, #1E3A3A 100%)' }}>
        {/* 装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full" style={{ background: 'white' }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full" style={{ background: 'white' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <Award className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'rgba(255,255,255,0.3)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-serif)' }}>
              累累硕果 · 实至名归
            </h2>
            <p className="text-lg text-white/70">
              学校获得的各项荣誉，见证了百年名校的辉煌历程
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {honors.map((honor, index) => (
              <div 
                key={index}
                className="group p-6 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(184, 134, 11, 0.3)' }}>
                    <Trophy className="h-6 w-6" style={{ color: '#B8860B' }} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{honor.title}</h4>
                    <p className="text-sm text-white/60">{honor.org} · {honor.year}年</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 新闻动态 */}
      <section id="news" className="py-24" style={{ background: '#FFFAF0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <Bell className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>
              新闻动态
            </h2>
            <p className="text-lg" style={{ color: '#5A4A3A' }}>了解学校最新动态和资讯</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newsList.map((news) => (
              <div 
                key={news.id}
                className="group bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{ border: '2px solid #E8DDD0' }}
              >
                <Badge 
                  className="mb-4"
                  style={{ 
                    background: news.type === '喜讯' ? '#C41E3A' : '#8B4513', 
                    color: 'white', 
                    border: 'none' 
                  }}
                >
                  {news.type}
                </Badge>
                <h3 className="text-base font-bold mb-3 line-clamp-2 group-hover:opacity-70 transition-opacity" style={{ color: '#2C1810' }}>
                  {news.title}
                </h3>
                <p className="text-sm" style={{ color: '#8B7355' }}>{news.date}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline"
              className="h-12 px-8 rounded-lg font-medium"
              style={{ borderColor: '#8B4513', color: '#8B4513' }}
            >
              查看更多新闻
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 智慧校园入口 */}
      <section className="py-24" style={{ background: '#FFF8F0' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #B8860B)' }} />
              <GraduationCap className="h-6 w-6" style={{ color: '#B8860B' }} />
              <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #B8860B, transparent)' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>
              智慧校园管理平台
            </h2>
            <p className="text-lg" style={{ color: '#5A4A3A' }}>
              统一门户 · 统一身份认证 · 统一数据管理
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: '总务后勤', desc: '资产管理、报修维护、采购管理、安全保障' },
              { icon: GraduationCap, title: '教务教研', desc: '课程安排、成绩管理、教研活动、教师发展' },
              { icon: Heart, title: '德育管理', desc: '少先队管理、德育活动、学生评价、成长档案' },
              { icon: Users, title: '教师空间', desc: '教师工作台、班级管理、家校沟通、日常管理' },
            ].map((item, index) => {
              const Icon = item.icon;
              const colors = ['#8B4513', '#1E4D8C', '#237804', '#722ED1'];
              return (
                <Link key={index} href="/login">
                  <div 
                    className="group p-8 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2"
                    style={{ background: 'white', border: `2px solid #E8DDD0` }}
                  >
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                      style={{ background: colors[index] }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif)', color: '#2C1810' }}>{item.title}</h3>
                    <p className="text-sm" style={{ color: '#6B5B4F' }}>{item.desc}</p>
                    <div className="mt-4 flex items-center gap-2" style={{ color: colors[index] }}>
                      <span className="text-sm font-medium">进入系统</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/login">
              <Button 
                size="lg"
                className="h-14 px-10 text-white font-medium rounded-lg"
                style={{ background: 'linear-gradient(135deg, #8B4513 0%, #B8860B 100%)' }}
              >
                立即登录使用
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section id="contact" className="py-24" style={{ background: '#2C1810' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
                联系我们
              </h2>
              <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.7)' }}>
                欢迎社会各界人士莅临指导，欢迎家长朋友咨询交流
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <MapPin className="h-6 w-6" style={{ color: '#B8860B' }} />
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>学校地址</div>
                    <div className="text-white font-medium">福建省龙岩市新罗区龙川东路11号</div>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <Phone className="h-6 w-6" style={{ color: '#B8860B' }} />
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>联系电话</div>
                    <div className="text-white font-medium">0597-2321234</div>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <Clock className="h-6 w-6" style={{ color: '#B8860B' }} />
                  </div>
                  <div>
                    <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>办公时间</div>
                    <div className="text-white font-medium">周一至周五 8:00 - 17:30</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-serif)' }}>快速入口</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '总务后勤', icon: Building2 },
                  { label: '教务教研', icon: GraduationCap },
                  { label: '德育管理', icon: Heart },
                  { label: '教师空间', icon: Users },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link key={index} href="/login">
                      <div className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <Icon className="h-5 w-5" style={{ color: '#B8860B' }} />
                        <span className="text-sm font-medium text-white/80">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8" style={{ background: '#1A1410' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B4513 0%, #B8860B 100%)' }}>
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-serif)' }}>龙</span>
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                © 2024 龙岩师范附属小学 · 智慧校园管理平台
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <a href="#" className="hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors">使用条款</a>
              <a href="#" className="hover:text-white transition-colors">技术支持</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
