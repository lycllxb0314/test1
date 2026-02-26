'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Palette,
  Rocket,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 校园风光 - 使用真实校园活动图片
const campusGallery = [
  { id: 1, src: '/images/campus/festival-stage.png', title: '校园文化艺术节', desc: '第41届校园文化艺术节暨六一文艺汇演' },
  { id: 2, src: '/images/campus/robot-team.png', title: '机器人大赛', desc: '2025世界机器人大赛福州选拔赛获奖' },
  { id: 3, src: '/images/campus/school-assembly.png', title: '强国复兴有我', desc: '争当新时代好少年主题活动' },
  { id: 4, src: '/images/campus/sports-race.jpg', title: '田径运动会', desc: '阳光体育，强健体魄' },
  { id: 5, src: '/images/campus/planting.jpg', title: '劳动实践', desc: '校园种植实践活动' },
  { id: 6, src: '/images/campus/qinglan-project.png', title: '青蓝工程', desc: '师徒结对，共促成长' },
];

// 学生发展 - 德智体美劳
const studentDevelopment = [
  {
    category: '德',
    title: '德育为先',
    color: 'from-red-500 to-rose-400',
    images: [
      { src: '/images/campus/scarf-ceremony.png', title: '红领巾佩戴仪式' },
      { src: '/images/campus/young-pioneers.png', title: '少先队礼仪活动' },
      { src: '/images/campus/school-assembly.png', title: '强国复兴有我主题活动' },
      { src: '/images/campus/team-committee.jpg', title: '大队委竞选活动' },
      { src: '/images/campus/recitation-grade6.jpg', title: '红色朗诵比赛六年级专场' },
      { src: '/images/campus/recitation-nanjing.jpg', title: '南京大屠杀主题朗诵' },
      { src: '/images/campus/recitation-grade5.jpg', title: '红色朗诵比赛五年级颁奖' },
      { src: '/images/campus/recitation-grade4.jpg', title: '红色朗诵比赛四年级颁奖' },
      { src: '/images/campus/safety-roleplay.png', title: '课间安全我扮演' },
      { src: '/images/campus/fire-safety-class.jpg', title: '消防安全知识讲座' },
    ],
    desc: '立德树人，培养品德高尚的新时代少年',
  },
  {
    category: '智',
    title: '智育启慧',
    color: 'from-blue-500 to-cyan-400',
    images: [
      { src: '/images/campus/science-academy.png', title: '少年科学院成立' },
      { src: '/images/campus/science-academy-opening.png', title: '少年科学院揭牌' },
      { src: '/images/campus/tech-festival.jpg', title: '科技节闭幕式' },
      { src: '/images/campus/robot-interaction.jpg', title: '机器人互动体验' },
      { src: '/images/campus/robot-playground.jpg', title: '操场机器人科普' },
      { src: '/images/campus/science-lecture.png', title: '公益科普进校园' },
      { src: '/images/campus/robot-team.png', title: '机器人大赛获奖' },
      { src: '/images/campus/wrc-finals-team.jpg', title: '世界机器人大赛参赛队' },
      { src: '/images/campus/wrc-competition.jpg', title: '世界机器人大赛现场' },
      { src: '/images/campus/science-dryice.jpg', title: '干冰科学实验' },
      { src: '/images/campus/culture-class.jpg', title: '文化自信课堂' },
      { src: '/images/campus/classroom-teaching.jpg', title: '多媒体课堂教学' },
      { src: '/images/campus/math-star-contest.jpg', title: '数学思维之星竞赛' },
      { src: '/images/campus/english-contest.png', title: '趣味英语竞赛颁奖' },
      { src: '/images/campus/paperless-assessment.jpg', title: '二年级无纸化测评' },
    ],
    desc: '科技引领未来，培养创新精神和实践能力',
  },
  {
    category: '体',
    title: '体育强身',
    color: 'from-orange-500 to-yellow-400',
    images: [
      { src: '/images/campus/group-exercise.jpg', title: '广播体操活动' },
      { src: '/images/campus/sports-race.jpg', title: '田径比赛起跑' },
      { src: '/images/campus/sports-start.jpg', title: '短跑预备时刻' },
      { src: '/images/campus/eye-exercise.jpg', title: '眼保健操时间' },
    ],
    desc: '阳光体育，强健体魄，培养运动精神',
  },
  {
    category: '美',
    title: '美育润心',
    color: 'from-purple-500 to-pink-400',
    images: [
      { src: '/images/campus/dance-contest.png', title: '艺术节舞蹈比赛' },
      { src: '/images/campus/orchestra.png', title: '器乐表演' },
      { src: '/images/campus/festival-opening.png', title: '文艺汇演' },
    ],
    desc: '全面发展艺术素养，培养审美能力',
  },
  {
    category: '劳',
    title: '劳育强能',
    color: 'from-green-500 to-emerald-400',
    images: [
      { src: '/images/campus/labor-food-display.jpg', title: '劳动素养大赛美食展示' },
      { src: '/images/campus/labor-cooking.jpg', title: '劳动素养大赛烹饪实践' },
      { src: '/images/campus/planting.jpg', title: '校园种植观察' },
      { src: '/images/campus/succulent.jpg', title: '多肉植物种植' },
    ],
    desc: '劳动实践，培养动手能力和劳动精神',
  },
];

// 教师发展
const teacherDevelopment = [
  {
    image: '/images/campus/conference-hall.png',
    title: '学术报告厅',
    desc: '现代化教学研讨空间',
    tag: '教学研讨',
  },
  {
    image: '/images/campus/talent-meeting.png',
    title: '人才工作会议',
    desc: '高质量发展人才大会',
    tag: '人才发展',
  },
  {
    image: '/images/campus/teacher-award.png',
    title: '教师表彰典礼',
    desc: '优秀教育工作者表彰',
    tag: '表彰典礼',
  },
  {
    image: '/images/campus/teacher-congress.png',
    title: '教职工代表大会',
    desc: '第七届第三次教职工代表大会',
    tag: '民主管理',
  },
  {
    image: '/images/campus/teacher-group-photo.png',
    title: '教职工集体合影',
    desc: '学校教职工团队建设',
    tag: '团队建设',
  },
  {
    image: '/images/campus/brain-science-training.jpg',
    title: '脑科学教学培训',
    desc: '聚焦新课标，构建新课堂',
    tag: '专业培训',
  },
  {
    image: '/images/campus/chinese-teaching-seminar.jpg',
    title: '语文教学研讨',
    desc: '小学语文课堂教学研讨',
    tag: '教学研讨',
  },
  {
    image: '/images/campus/chinese-review-seminar.png',
    title: '语文复习专题研讨',
    desc: '汇智复习之道，共话提质增效',
    tag: '教学研讨',
  },
  {
    image: '/images/campus/researcher-guidance.png',
    title: '教研员入校指导',
    desc: '教研员1+N领航挂钩入校指导',
    tag: '教研指导',
  },
  {
    image: '/images/campus/teaching-seminar.png',
    title: '总校制办学教学研讨',
    desc: '总校制办学教育教学研讨活动',
    tag: '教学研讨',
  },
  {
    image: '/images/campus/ai-teaching.jpg',
    title: 'AI赋能教学观摩课',
    desc: '福建师范大学实习公开汇报课暨AI赋能教学观摩',
    tag: '教学观摩',
  },
  {
    image: '/images/campus/ai-research.png',
    title: 'AI辅助跨学科研究开题',
    desc: '生成式AI辅助跨学科主题学习设计与实施的研究开题活动',
    tag: '课题研究',
  },
  {
    image: '/images/campus/qinglan-project.png',
    title: '青蓝工程启动仪式',
    desc: '2025-2026学年师徒结对帮扶培养项目',
    tag: '教师成长',
  },
];

// 办学特色 - 精美卡片设计
const schoolFeatures = [
  { 
    icon: BookOpen, 
    title: '书香校园', 
    desc: '传承百年文化，打造阅读特色学校',
    gradient: 'from-blue-500 to-cyan-400',
    details: ['藏书5万余册的图书馆', '每月读书分享会', '经典诵读活动'],
    stats: '5万+藏书',
  },
  { 
    icon: Palette, 
    title: '艺术教育', 
    desc: '全面发展艺术素养，培养审美能力',
    gradient: 'from-purple-500 to-pink-400',
    details: ['合唱团、舞蹈队', '书法、绘画社团', '艺术节展演'],
    stats: '20+社团',
  },
  { 
    icon: Rocket, 
    title: '科技创新', 
    desc: '科技引领未来，培养创新精神',
    gradient: 'from-green-500 to-emerald-400',
    details: ['创客实验室', '机器人编程', '科技竞赛获奖'],
    stats: '省级获奖',
  },
  { 
    icon: Heart, 
    title: '德育为先', 
    desc: '立德树人，培养品德高尚的少年',
    gradient: 'from-orange-500 to-amber-400',
    details: ['红色基因传承', '德育主题活动', '行为习惯养成'],
    stats: '全国文明校园',
  },
];

// 校园活动 - 使用真实活动图片
const campusActivities = [
  { 
    image: '/images/campus/festival-stage.png',
    title: '校园文化艺术节', 
    date: '2025年5月30日',
    desc: '第41届艺术节暨六一文艺汇演，童心闪耀放飞梦想'
  },
  { 
    image: '/images/campus/science-academy.png',
    title: '少年科学院成立', 
    date: '2025年12月5日',
    desc: '与院士同行，赴科学之约，少年科学院成立仪式'
  },
  { 
    image: '/images/campus/tech-festival.jpg',
    title: '科技节闭幕式', 
    date: '2025年',
    desc: '校园科技节活动闭幕，科技点亮梦想'
  },
  { 
    image: '/images/campus/fire-safety-class.jpg',
    title: '消防安全知识课堂', 
    date: '2025年',
    desc: '消防安全教育活动，增强安全意识'
  },
  { 
    image: '/images/campus/food-safety-class.jpg',
    title: '食品安全知识课堂', 
    date: '2025年',
    desc: '食品安全宣传教育，守护健康饮食'
  },
  { 
    image: '/images/campus/robot-team.png',
    title: '机器人竞赛获奖', 
    date: '2025年7月',
    desc: '世界机器人大赛福州选拔赛荣获佳绩'
  },
  { 
    image: '/images/campus/sports-race.jpg',
    title: '田径运动会', 
    date: '2025年秋季',
    desc: '阳光体育，短跑比赛精彩瞬间'
  },
  { 
    image: '/images/campus/tongxin-stage-award.jpg',
    title: '童心舞台颁奖', 
    date: '2025年',
    desc: '童心舞台活动获奖学生合影'
  },
  { 
    image: '/images/campus/lion-dance-activity.jpg',
    title: '醒狮文化活动', 
    date: '2025年',
    desc: '传统文化进校园，醒狮主题活动'
  },
  { 
    image: '/images/campus/school-opening.jpg',
    title: '开学迎新活动', 
    date: '2026年春季',
    desc: '新学期开学班级迎新活动'
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
  { id: 1, title: '我校师生在省级科技创新大赛中荣获一等奖', date: '2024-03-15', type: '喜讯', image: '/images/school-1.jpeg' },
  { id: 2, title: '学校开展"传承红色基因"主题教育活动', date: '2024-03-12', type: '活动', image: '/images/school-2.jpeg' },
  { id: 3, title: '著名教育专家到校指导教学工作', date: '2024-03-10', type: '新闻', image: '/images/school-1.jpeg' },
  { id: 4, title: '学校足球队荣获市级联赛冠军', date: '2024-03-08', type: '喜讯', image: '/images/school-2.jpeg' },
];

// 学校统计数据
const schoolStats = {
  totalStudents: 2800,
  totalTeachers: 168,
  totalClasses: 56,
  campusArea: 35000,
};

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentGallery, setCurrentGallery] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // 已登录用户自动跳转到工作台
  useEffect(() => {
    if (mounted && user) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, user, router]);

  // 自动轮播
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrentGallery((prev) => (prev + 1) % campusGallery.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [mounted]);

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-white font-bold text-lg">龙</span>
              </div>
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
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 shadow-lg shadow-orange-500/30">
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
              {!imageErrors[String(item.id)] ? (
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(String(item.id))}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
            </div>
          ))}
        </div>

        {/* 内容 */}
        <div className="relative h-full flex flex-col justify-center items-center text-white px-4 pt-16">
          {/* 装饰徽章 */}
          <div className="mb-6 flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-6 py-2 border border-white/20">
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
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {[
              { value: String(schoolStats.totalStudents), label: '在校学生' },
              { value: String(schoolStats.totalTeachers), label: '优秀教师' },
              { value: String(schoolStats.totalClasses), label: '教学班级' },
              { value: '110', label: '办学历史/年' },
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 快捷按钮 */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 rounded-full px-8 h-12 shadow-xl shadow-orange-500/30">
                进入智慧校园
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#about">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
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
                  index === currentGallery ? 'w-8 bg-orange-500' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-8 w-8 text-white/50 rotate-90" />
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
            <div className="relative mb-8 md:mb-0">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/school-1.jpeg"
                  alt="龙岩师范附属小学"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 装饰卡片 - 改为不超出容器 */}
              <div className="absolute -bottom-4 right-4 md:right-8 bg-white rounded-xl shadow-xl p-4 hidden md:flex items-center gap-3 z-10">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">110年</div>
                  <div className="text-sm text-gray-500">办学历史</div>
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
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className="text-2xl font-bold text-primary">15人</div>
                  <div className="text-xs text-gray-500">省级骨干教师</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-500">32人</div>
                  <div className="text-xs text-gray-500">市级骨干教师</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
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
                  index === 0 ? 'col-span-2 row-span-2 md:aspect-auto' : ''
                }`}
              >
                <div className={`${index === 0 ? 'h-80 md:h-full' : 'h-48'} relative`}>
                  {!imageErrors[String(item.id)] ? (
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(String(item.id))}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-300 to-amber-200 flex items-center justify-center">
                      <GraduationCap className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-bold text-lg">{item.title}</h3>
                    <p className="text-white/80 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 办学特色 - 全新精美卡片设计 */}
      <section id="features" className="py-20 bg-gradient-to-b from-white via-orange-50/50 to-white">
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
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-transparent hover:-translate-y-2"
                >
                  {/* 顶部渐变装饰条 */}
                  <div className={`h-2 w-full bg-gradient-to-r ${feature.gradient}`} />
                  
                  <div className="p-6">
                    {/* 图标 */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* 标题和描述 */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{feature.desc}</p>
                    
                    {/* 分隔线 */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />
                    
                    {/* 详情列表 */}
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                    
                    {/* 底部标签 */}
                    <div className="mt-5 flex items-center justify-between">
                      <span className={`text-xs font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                        {feature.stats}
                      </span>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${feature.gradient} bg-opacity-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                        <ChevronRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 学生发展 - 德智体美劳 */}
      <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full mb-4">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">学生发展</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">五育并举，全面发展</h2>
            <p className="text-gray-600">德智体美劳全面发展，培养新时代好少年</p>
          </div>

          <div className="space-y-12">
            {studentDevelopment.map((item, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-lg overflow-hidden">
                {/* 分类标题 */}
                <div className={`bg-gradient-to-r ${item.color} px-6 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{item.category}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      <p className="text-white/80 text-sm">{item.desc}</p>
                    </div>
                  </div>
                </div>
                
                {/* 图片网格 */}
                <div className={`grid gap-4 p-6 ${item.images.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
                  {item.images.map((img, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-xl">
                      <div className="aspect-[4/3] relative">
                        {!imageErrors[`student-${index}-${idx}`] ? (
                          <img
                            src={img.src}
                            alt={img.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={() => handleImageError(`student-${index}-${idx}`)}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                            <GraduationCap className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white text-sm font-medium">{img.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 教师发展 */}
      <section className="py-20 bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 px-4 py-2 rounded-full mb-4">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">教师发展</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">强师兴教，专业成长</h2>
            <p className="text-gray-600">打造高素质专业化教师队伍，助力教师专业发展</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {teacherDevelopment.map((item, index) => (
              <div key={index} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  {!imageErrors[`teacher-${index}`] ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(`teacher-${index}`)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-500 text-white border-0">{item.tag}</Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
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
                  {!imageErrors[`activity-${index}`] ? (
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(`activity-${index}`)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-300 to-amber-200 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">{activity.date}</Badge>
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
      <section className="py-20 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative">
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
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                  </div>
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
                  {!imageErrors[`news-${news.id}`] ? (
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => handleImageError(`news-${news.id}`)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-300 to-cyan-200 flex items-center justify-center">
                      <Bell className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant={news.type === '喜讯' ? 'default' : 'secondary'} 
                      className={news.type === '喜讯' ? 'bg-red-500 text-white border-0' : 'bg-white/90'}>
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
            <Button variant="outline" className="gap-2 rounded-full px-6">
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
            {[
              { icon: Building2, title: '总务后勤', desc: '资产管理、报修维护、采购管理、安全保障', gradient: 'from-orange-500 to-amber-400', href: '/general' },
              { icon: GraduationCap, title: '教务教研', desc: '课程安排、成绩管理、教研活动、教师发展', gradient: 'from-blue-500 to-cyan-400', href: '/academic' },
              { icon: Heart, title: '德育管理', desc: '少先队管理、德育活动、学生评价、成长档案', gradient: 'from-green-500 to-emerald-400', href: '/moral' },
              { icon: Users, title: '教师空间', desc: '教师工作台、班级管理、家校沟通、日常管理', gradient: 'from-purple-500 to-pink-400', href: '/teacher' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} href="/login">
                  <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-0">
                      <div className={`bg-gradient-to-br ${item.gradient} p-6 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <Icon className="h-10 w-10 mb-4 relative z-10" />
                        <h3 className="text-xl font-bold mb-2 relative z-10">{item.title}</h3>
                        <p className="text-sm text-white/80 relative z-10">{item.desc}</p>
                      </div>
                      <div className="p-4 bg-white group-hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between text-gray-600 group-hover:text-primary transition-colors">
                          <span className="text-sm font-medium">进入系统</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white gap-2 rounded-full px-10 h-12 shadow-xl shadow-orange-500/20">
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
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">学校地址</div>
                    <div>福建省龙岩市新罗区龙川东路11号</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">联系电话</div>
                    <div>0597-2320XXX</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
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
              <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">学校位置</p>
                  <p className="text-sm text-gray-600 mt-2">福建省龙岩市新罗区</p>
                </div>
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
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">龙</span>
              </div>
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
