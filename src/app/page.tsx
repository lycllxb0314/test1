'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Heart,
  BookOpen,
  Users,
  Trophy,
  Calendar,
  Bell,
  ArrowRight,
  Building2,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 五育数据
const fiveEducation = [
  {
    category: '德育',
    title: '立德树人',
    desc: '传承红色基因，培养品德高尚的新时代少年',
    color: '#B22222',
    images: [
      { src: '/images/campus/scarf-ceremony.png', title: '红领巾佩戴仪式' },
      { src: '/images/campus/young-pioneers.png', title: '少先队礼仪活动' },
      { src: '/images/campus/recitation-grade6.jpg', title: '红色朗诵比赛' },
      { src: '/images/campus/fire-safety-class.jpg', title: '消防安全教育' },
    ],
  },
  {
    category: '智育',
    title: '启迪智慧',
    desc: '科技引领未来，培养创新精神和实践能力',
    color: '#1565C0',
    images: [
      { src: '/images/campus/science-academy.png', title: '少年科学院成立' },
      { src: '/images/campus/robot-interaction.jpg', title: '机器人互动体验' },
      { src: '/images/campus/wrc-finals-team.jpg', title: '世界机器人大赛' },
      { src: '/images/campus/english-contest.png', title: '趣味英语竞赛' },
    ],
  },
  {
    category: '体育',
    title: '强健体魄',
    desc: '阳光体育，强健体魄，培养运动精神',
    color: '#E65100',
    images: [
      { src: '/images/campus/group-exercise.jpg', title: '广播体操比赛' },
      { src: '/images/campus/sports-race.jpg', title: '田径运动会' },
      { src: '/images/campus/sports-start.jpg', title: '起跑时刻' },
      { src: '/images/campus/eye-exercise.jpg', title: '眼保健操' },
    ],
  },
  {
    category: '美育',
    title: '陶冶情操',
    desc: '全面发展艺术素养，培养审美能力',
    color: '#6A1B9A',
    images: [
      { src: '/images/campus/dance-contest.png', title: '艺术节舞蹈' },
      { src: '/images/campus/orchestra.png', title: '器乐演奏' },
      { src: '/images/campus/festival-opening.png', title: '文艺汇演' },
      { src: '/images/campus/lion-dance-activity.jpg', title: '醒狮文化' },
    ],
  },
  {
    category: '劳育',
    title: '劳动光荣',
    desc: '劳动实践，培养动手能力和劳动精神',
    color: '#2E7D32',
    images: [
      { src: '/images/campus/labor-food-display.jpg', title: '劳动素养大赛' },
      { src: '/images/campus/labor-cooking.jpg', title: '烹饪实践' },
      { src: '/images/campus/planting.jpg', title: '校园种植' },
      { src: '/images/campus/succulent.jpg', title: '多肉种植' },
    ],
  },
];

// 教师发展
const teacherDevelopment = [
  { image: '/images/campus/conference-hall.png', title: '学术报告厅' },
  { image: '/images/campus/talent-meeting.png', title: '人才工作会议' },
  { image: '/images/campus/teacher-award.png', title: '教师表彰典礼' },
  { image: '/images/campus/brain-science-training.jpg', title: '脑科学教学培训' },
  { image: '/images/campus/researcher-guidance.png', title: '教研员入校指导' },
  { image: '/images/campus/qinglan-project.png', title: '青蓝工程' },
];

// 校园活动
const campusActivities = [
  { image: '/images/campus/festival-stage.png', title: '校园文化艺术节', date: '2025年5月' },
  { image: '/images/campus/science-academy.png', title: '少年科学院成立', date: '2025年12月' },
  { image: '/images/campus/tech-festival.jpg', title: '科技节活动', date: '2025年' },
  { image: '/images/campus/sports-race.jpg', title: '田径运动会', date: '2025年秋季' },
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

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (!mounted) return null;

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-700 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">正在跳转到工作台...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo-school.png" 
                alt="龙岩师范附属小学" 
                className="h-12 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>龙岩师范附属小学</h1>
                <p className="text-xs text-gray-500">百年名校 · 省级示范</p>
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="hidden md:flex items-center gap-8">
              {['学校概况', '五育并举', '教师发展', '新闻动态'].map((item, index) => (
                <a
                  key={index}
                  href={`#${['about', 'education', 'teacher', 'news'][index]}`}
                  className="text-sm text-gray-600 hover:text-amber-700"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* 登录按钮 */}
            <Link href="/login">
              <Button className="h-9 px-5 bg-amber-700 hover:bg-amber-800 text-white text-sm">
                登录系统
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="bg-amber-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 左侧文字 */}
            <div>
              <h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                龙岩师范附属小学
              </h1>
              <p className="text-xl text-amber-700 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                明德 · 博学 · 笃行 · 创新
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                创建于1914年，福建省示范小学。百年薪火相传，以"温暖成长，智慧育人"为理念，
                培育德智体美劳全面发展的新时代少年。
              </p>
              
              {/* 统计数据 */}
              <div className="flex gap-8 mb-8">
                <div>
                  <div className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>110年</div>
                  <div className="text-xs text-gray-500">办学历史</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>2800人</div>
                  <div className="text-xs text-gray-500">在校学生</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>168人</div>
                  <div className="text-xs text-gray-500">教师队伍</div>
                </div>
              </div>

              <Link href="/login">
                <Button className="h-11 px-6 bg-amber-700 hover:bg-amber-800 text-white">
                  进入智慧校园
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* 右侧图片 */}
            <div className="grid grid-cols-2 gap-3">
              {campusActivities.slice(0, 4).map((activity, index) => (
                <div 
                  key={index}
                  className="relative bg-gray-100 overflow-hidden"
                  style={{ aspectRatio: '4/3' }}
                >
                  {!imageErrors[`hero-${index}`] ? (
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(`hero-${index}`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <GraduationCap className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                    <p className="text-white text-xs truncate">{activity.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 学校概况 */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-amber-700 inline-block"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            学校概况
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="bg-gray-100 aspect-[4/3] mb-4">
                {!imageErrors['about-main'] ? (
                  <img
                    src="/images/campus/festival-stage.png"
                    alt="校园风采"
                    className="w-full h-full object-cover"
                    onError={() => handleImageError('about-main')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">第41届校园文化艺术节</p>
            </div>

            <div>
              <p className="text-gray-700 leading-relaxed mb-4">
                龙岩师范附属小学位于福建省龙岩市新罗区，是龙岩市教育局直属小学，
                创建于1914年，是一所具有百年历史的省级示范小学。
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                学校秉承"明德、博学、笃行、创新"的校训，坚持"以人为本、全面发展"的办学理念，
                致力于培养具有健全人格、创新精神和实践能力的社会主义建设者和接班人。
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                学校占地面积约35亩，建筑面积2万余平方米。现有教学班56个，学生2800余人，
                教职工168人，其中省级骨干教师15人，市级骨干教师32人，高级教师28人。
              </p>
              
              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 p-4 border-l-4 border-red-700">
                  <div className="text-xl font-bold text-red-700" style={{ fontFamily: 'var(--font-serif)' }}>15人</div>
                  <div className="text-xs text-gray-500">省级骨干教师</div>
                </div>
                <div className="flex-1 bg-gray-50 p-4 border-l-4 border-blue-800">
                  <div className="text-xl font-bold text-blue-800" style={{ fontFamily: 'var(--font-serif)' }}>32人</div>
                  <div className="text-xs text-gray-500">市级骨干教师</div>
                </div>
                <div className="flex-1 bg-gray-50 p-4 border-l-4 border-amber-700">
                  <div className="text-xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>28人</div>
                  <div className="text-xs text-gray-500">高级教师</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 五育并举 - 重新设计 */}
      <section id="education" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-12 pb-2 border-b-2 border-amber-700 inline-block"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            五育并举
          </h2>

          <div className="space-y-16">
            {fiveEducation.map((edu, eduIndex) => (
              <div key={eduIndex} className="grid md:grid-cols-12 gap-6 items-start">
                {/* 左侧标题区域 */}
                <div className="md:col-span-3 flex md:flex-col items-center md:items-start gap-4 md:gap-2">
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0"
                    style={{ background: edu.color }}
                  >
                    <span 
                      className="text-3xl md:text-4xl font-bold text-white"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {edu.category.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{edu.category}</h3>
                    <p className="text-sm text-gray-500">{edu.title}</p>
                  </div>
                </div>

                {/* 右侧图片区域 */}
                <div className="md:col-span-9">
                  <p className="text-gray-600 mb-4 text-sm">{edu.desc}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {edu.images.map((img, imgIndex) => (
                      <div key={imgIndex}>
                        <div className="aspect-[4/3] bg-gray-200">
                          {!imageErrors[`edu-${eduIndex}-${imgIndex}`] ? (
                            <img
                              src={img.src}
                              alt={img.title}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(`edu-${eduIndex}-${imgIndex}`)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1.5 truncate">{img.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 教师发展 */}
      <section id="teacher" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-amber-700 inline-block"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            教师发展
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {teacherDevelopment.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200">
                <div className="aspect-[16/10] bg-gray-100">
                  {!imageErrors[`teacher-${index}`] ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(`teacher-${index}`)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 荣誉展示 */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-white mb-8 pb-2 border-b-2 border-amber-500 inline-block"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            学校荣誉
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {honors.map((honor, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-700/50">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{honor.title}</h4>
                  <p className="text-gray-400 text-xs">{honor.org} · {honor.year}年</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 新闻动态 */}
      <section id="news" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-amber-700 inline-block"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            新闻动态
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {newsList.map((news) => (
              <div key={news.id} className="flex gap-4 p-4 border border-gray-200 bg-white">
                <div className="flex-shrink-0">
                  <span 
                    className="inline-block px-2 py-1 text-xs text-white"
                    style={{ background: news.type === '喜讯' ? '#B22222' : '#666' }}
                  >
                    {news.type}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{news.title}</h3>
                  <p className="text-xs text-gray-500">{news.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 智慧校园入口 */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b-2 border-amber-700 inline-block"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            智慧校园管理平台
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Building2, title: '总务后勤', color: '#8B4513' },
              { icon: GraduationCap, title: '教务教研', color: '#1565C0' },
              { icon: Heart, title: '德育管理', color: '#B22222' },
              { icon: Users, title: '教师空间', color: '#6A1B9A' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} href="/login">
                  <div className="bg-white p-6 border border-gray-200">
                    <div className="w-10 h-10 rounded flex items-center justify-center mb-3" style={{ background: item.color }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                    <span className="text-xs text-amber-700">进入系统 →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>联系方式</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">福建省龙岩市新罗区龙川东路11号</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">0597-2321234</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">周一至周五 8:00 - 17:30</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>快速入口</h3>
              <div className="grid grid-cols-2 gap-2">
                {['总务后勤', '教务教研', '德育管理', '教师空间'].map((item, index) => (
                  <Link key={index} href="/login">
                    <div className="text-sm text-amber-700 hover:text-amber-800">{item} →</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-6 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-school.png" 
                alt="龙岩师范附属小学" 
                className="h-8 w-auto"
              />
              <span className="text-sm text-gray-400">© 2024 龙岩师范附属小学</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300">隐私政策</a>
              <a href="#" className="hover:text-gray-300">使用条款</a>
              <a href="#" className="hover:text-gray-300">技术支持</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
