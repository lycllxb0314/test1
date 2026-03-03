'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Heart,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Building2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Sun,
  Palette,
  Shield,
  Target,
  Lightbulb,
  BookHeart,
  Landmark,
  Star,
  Baby,
  Award,
  Medal,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 童心教育六大实施路径
const childHeartPaths = [
  {
    icon: Shield,
    title: '有效德育引领童心',
    subtitle: '以德育心',
    desc: '通过少先队活动、主题班会、社会实践等，培养学生的家国情怀与道德品质',
    color: '#B5651D',
    examples: ['入队仪式', '红色教育', '主题班会', '社会实践'],
    images: [
      { src: '/images/campus/scarf-ceremony.png', title: '入队仪式' },
      { src: '/images/campus/young-pioneers.png', title: '少先队活动' },
      { src: '/images/campus/recitation-grade6.jpg', title: '红色教育' },
      { src: '/images/campus/fire-safety-class.jpg', title: '安全教育' },
    ],
  },
  {
    icon: Lightbulb,
    title: '高效课堂发展童心',
    subtitle: '以智启心',
    desc: '打造高效课堂，激发学习兴趣，培养思维能力与创新精神',
    color: '#2E7D32',
    examples: ['学科教学', '科技创新', '思维训练', '探究学习'],
    images: [
      { src: '/images/campus/science-academy.png', title: '少年科学院' },
      { src: '/images/campus/robot-interaction.jpg', title: '科技创新' },
      { src: '/images/campus/wrc-finals-team.jpg', title: '学科竞赛' },
      { src: '/images/campus/english-contest.png', title: '学科活动' },
    ],
  },
  {
    icon: Palette,
    title: '多彩活动点亮童心',
    subtitle: '以趣悦心',
    desc: '丰富校园活动，让孩子们在参与中体验快乐，在活动中绽放光彩',
    color: '#7B1FA2',
    examples: ['艺术节', '运动会', '科技节', '读书节'],
    images: [
      { src: '/images/campus/festival-stage.png', title: '校园艺术节' },
      { src: '/images/campus/dance-contest.png', title: '文艺汇演' },
      { src: '/images/campus/sports-race.jpg', title: '田径运动会' },
      { src: '/images/campus/group-exercise.jpg', title: '阳光大课间' },
    ],
  },
  {
    icon: Heart,
    title: '心理健康呵护童心',
    subtitle: '以爱护心',
    desc: '关注学生心理健康，建立心理档案，开展心理辅导，守护孩子心灵成长',
    color: '#C62828',
    examples: ['心理辅导', '情绪管理', '团体活动', '个体咨询'],
    images: [
      { src: '/images/campus/festival-opening.png', title: '心理健康周' },
      { src: '/images/campus/orchestra.png', title: '艺术疗愈' },
      { src: '/images/campus/eye-exercise.jpg', title: '健康教育' },
      { src: '/images/campus/lion-dance-activity.jpg', title: '传统文化' },
    ],
  },
  {
    icon: BookHeart,
    title: '快乐阅读涵养童心',
    subtitle: '以书润心',
    desc: '建设书香校园，培养阅读习惯，让书籍成为孩子成长的良伴',
    color: '#1565C0',
    examples: ['阅读课程', '图书漂流', '读书分享', '经典诵读'],
    images: [
      { src: '/images/campus/conference-hall.png', title: '阅读分享会' },
      { src: '/images/campus/teacher-award.png', title: '读书节活动' },
      { src: '/images/campus/brain-science-training.jpg', title: '经典诵读' },
      { src: '/images/campus/researcher-guidance.png', title: '作家进校园' },
    ],
  },
  {
    icon: Landmark,
    title: '校园文化润泽童心',
    subtitle: '以境育心',
    desc: '营造温馨和谐、富有童趣的校园环境，让每一面墙壁都会说话',
    color: '#E65100',
    examples: ['班级文化', '走廊文化', '校园景观', '文化传承'],
    images: [
      { src: '/images/campus/labor-food-display.jpg', title: '劳动技能大赛' },
      { src: '/images/campus/labor-cooking.jpg', title: '劳动实践' },
      { src: '/images/campus/planting.jpg', title: '校园种植' },
      { src: '/images/campus/succulent.jpg', title: '劳动教育' },
    ],
  },
];

// 校训内涵
const schoolMotto = [
  { character: '修身', meaning: '修身立德，涵养品格' },
  { character: '力学', meaning: '勤奋学习，追求卓越' },
  { character: '博雅', meaning: '博采众长，雅正通达' },
  { character: '聪慧', meaning: '聪敏睿智，灵动创新' },
];

// 教风学风
const teachingStyle = {
  title: '身正为范 博学善教 儒雅灵性',
  items: ['身正为范', '博学善教', '儒雅灵性'],
};

const studyStyle = {
  title: '品行高洁 好学善思 文雅活泼',
  items: ['品行高洁', '好学善思', '文雅活泼'],
};

// 校园活动
const campusActivities = [
  { image: '/images/campus/festival-stage.png', title: '校园文化艺术节' },
  { image: '/images/campus/science-academy.png', title: '少年科学院成立' },
  { image: '/images/campus/tech-festival.jpg', title: '科技节活动' },
  { image: '/images/campus/sports-race.jpg', title: '田径运动会' },
];

// 国家级核心荣誉
const nationalHonors = [
  { title: '全国文明校园', year: '连续8届', highlight: true },
  { title: '全国心理健康教育特色学校', year: '' },
  { title: '全国艺术教育先进单位', year: '' },
  { title: '全国红旗大队', year: '' },
  { title: '全国少年军校示范校', year: '' },
  { title: '全国"三八"红旗集体', year: '' },
];

// 省级核心荣誉
const provincialHonors = [
  { title: '福建省示范小学', year: '2018', highlight: true },
  { title: '福建省文明校园', year: '连续8届', highlight: true },
  { title: '首批福建省素质教育先进校', year: '' },
  { title: '福建省心理健康教育基地校', year: '' },
  { title: '福建省绿色学校', year: '' },
  { title: '福建省校园文化艺术先进单位', year: '' },
];

// 2025年最新资质
const latestQualifications = [
  { title: '2025年福建省"智慧校园试点校"', desc: '龙岩市小学段数字教育标杆校', highlight: true },
  { title: '龙岩市首个小学少年科学院', desc: '中科院谢华安院士指导', highlight: false },
];

// 科创教育成果
const scienceTechAchievements = [
  { number: '7', unit: '项', label: '国家级科创奖项' },
  { number: '58', unit: '项', label: '省级科创奖项' },
  { number: '创新之星', unit: '', label: '2025年全国数字素养大赛最高奖' },
];

// 教师成果统计
const teacherStats = [
  { number: '4', label: '国家级表彰人次' },
  { number: '30+', label: '省级表彰人次' },
  { number: '70+', label: '市区级表彰人次' },
];

// 学生成果
const studentAchievements = [
  { title: '全国学生数字素养大赛', award: '创新之星（最高奖）', icon: Trophy },
  { title: '龙岩市"福籽同心爱中华"演讲', award: '一等奖3名', icon: Award },
  { title: '福建省中华经典诵写讲大赛', award: '小学组省级二等奖', icon: BookOpen },
];

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      
      {/* 顶部导航 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E8E4DD] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo-school.png" 
                alt="福建省龙岩师范附属小学" 
                className="h-11 w-auto"
              />
              <div className="hidden sm:block border-l border-[#E8E4DD] pl-4">
                <h1 className="text-base font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                  福建省龙岩师范附属小学
                </h1>
                <p className="text-xs text-[#8B8680]">创建于1914年 · 福建省示范小学</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {['童心教育', '科创特色', '办学荣誉', '师资队伍'].map((item, index) => (
                <a
                  key={index}
                  href={`#${['child-heart', 'science-tech', 'honors', 'teacher'][index]}`}
                  className="text-sm text-[#5C5852] hover:text-[#B5651D] transition-colors duration-200"
                >
                  {item}
                </a>
              ))}
            </nav>

            {user ? (
              <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                <Button className="h-9 px-5 bg-[#B5651D] hover:bg-[#9A5515] text-white text-sm rounded-full">
                  进入工作台
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-5 bg-[#B5651D] hover:bg-[#9A5515] text-white text-sm rounded-full">
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FDF8F3] to-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* 标签 */}
              <div className="inline-flex items-center gap-2 bg-[#B5651D]/10 text-[#B5651D] px-4 py-1.5 rounded-full text-sm mb-6">
                <Star className="h-4 w-4" />
                <span>为每个儿童的身心发展奠基</span>
              </div>
              
              {/* 学校名称 */}
              <h1 
                className="text-4xl md:text-5xl font-bold text-[#2D2A26] mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                福建省龙岩师范<br />附属小学
              </h1>
              
              {/* 核心理念 */}
              <p 
                className="text-2xl text-[#5C5852] mb-6"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                珍视童心，张扬个性，全面发展
              </p>
              
              {/* 办学方向 */}
              <div className="flex items-center gap-2 text-[#B5651D] mb-8">
                <Heart className="h-5 w-5" />
                <span className="text-lg">当有情怀的老师，办有温度的学校</span>
              </div>

              {/* 按钮 */}
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                    <Button className="h-12 px-8 bg-[#B5651D] hover:bg-[#9A5515] text-white text-base rounded-full shadow-lg shadow-[#B5651D]/20">
                      进入工作台
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button className="h-12 px-8 bg-[#B5651D] hover:bg-[#9A5515] text-white text-base rounded-full shadow-lg shadow-[#B5651D]/20">
                        进入智慧校园
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <a href="#child-heart">
                      <Button variant="outline" className="h-12 px-8 border-[#D4C4A8] text-[#5C5852] hover:bg-[#F5F0E1] rounded-full">
                        了解童心教育
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* 右侧图片 */}
            <div className="grid grid-cols-2 gap-4">
              {campusActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="relative bg-white rounded-2xl overflow-hidden shadow-lg shadow-[#2D2A26]/5"
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
                    <div className="w-full h-full flex items-center justify-center bg-[#F5F0E1]">
                      <Baby className="h-10 w-10 text-[#C67B5C]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2D2A26]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium">{activity.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 童心教育核心品牌 */}
      <section id="child-heart" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* 标题区 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#B5651D]/10 text-[#B5651D] px-4 py-1.5 rounded-full text-sm mb-4">
              <Target className="h-4 w-4" />
              <span>核心办学品牌 · 福建省小学特色办学标杆案例</span>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#2D2A26] mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              童心教育
            </h2>
            <p className="text-lg text-[#5C5852] max-w-2xl mx-auto">
              尊重儿童<span className="text-[#B5651D] font-medium">天真</span>、
              <span className="text-[#B5651D] font-medium">纯朴</span>、
              <span className="text-[#B5651D] font-medium">活泼</span>、
              <span className="text-[#B5651D] font-medium">自然</span>的生命状态，
              创设富有<span className="text-[#B5651D] font-medium">爱心</span>、
              <span className="text-[#B5651D] font-medium">童趣</span>、
              <span className="text-[#B5651D] font-medium">自由</span>、
              <span className="text-[#B5651D] font-medium">和谐</span>的育人环境
            </p>
          </div>

          {/* 六大实施路径 */}
          <div className="space-y-8">
            {childHeartPaths.map((path, pathIndex) => {
              const Icon = path.icon;
              return (
                <div 
                  key={pathIndex} 
                  className="bg-[#FAF8F5] rounded-2xl overflow-hidden border border-[#E8E4DD] hover:shadow-xl hover:shadow-[#2D2A26]/5 transition-all duration-300"
                >
                  <div className="grid lg:grid-cols-5 gap-6">
                    {/* 左侧：标题和描述 */}
                    <div className="lg:col-span-2 p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                          style={{ background: path.color }}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 
                            className="text-xl font-bold text-[#2D2A26]"
                            style={{ fontFamily: 'var(--font-serif)' }}
                          >
                            {path.title}
                          </h3>
                          <p className="text-sm font-medium" style={{ color: path.color }}>{path.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-[#5C5852] mb-4 leading-relaxed">
                        {path.desc}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {path.examples.map((example, i) => (
                          <span 
                            key={i}
                            className="text-xs px-3 py-1 rounded-full font-medium bg-white border border-[#E8E4DD] text-[#5C5852]"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 右侧：图片展示 */}
                    <div className="lg:col-span-3 p-6 bg-white">
                      <div className="grid grid-cols-4 gap-3">
                        {path.images.map((img, imgIndex) => (
                          <div key={imgIndex} className="group">
                            <div className="aspect-[4/3] bg-[#F5F0E1] rounded-lg overflow-hidden">
                              {!imageErrors[`path-${pathIndex}-${imgIndex}`] ? (
                                <img
                                  src={img.src}
                                  alt={img.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={() => handleImageError(`path-${pathIndex}-${imgIndex}`)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <GraduationCap className="h-6 w-6 text-[#C67B5C]" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-[#5C5852] mt-2 text-center">{img.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 品牌成果 */}
          <div className="mt-12 p-8 bg-gradient-to-r from-[#B5651D]/5 to-[#C67B5C]/5 rounded-2xl border border-[#E8E4DD]">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="h-5 w-5 text-[#B5651D]" />
              <h4 className="font-bold text-[#2D2A26]">品牌成果</h4>
            </div>
            <p className="text-[#5C5852] leading-relaxed">
              "童心教育"形成完整的理论与实践体系，配套六大实施路径深耕十余年，成为
              <span className="text-[#B5651D] font-medium">福建省小学特色办学标杆案例</span>，
              德育成果被《中国德育》《福建教育》专题报道，形成了可复制、可推广的小学育人模式。
            </p>
          </div>
        </div>
      </section>

      {/* 科创教育特色 - Bento Grid 风格 */}
      <section id="science-tech" className="py-24 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-[#B5651D]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C67B5C]/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          {/* 大标题 - 杂志风格 */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[#B5651D]/30 max-w-[60px]" />
              <span className="text-[#B5651D] text-sm font-medium tracking-wider">FEATURED PROGRAM</span>
            </div>
            <h2 
              className="text-6xl md:text-7xl font-bold text-[#2D2A26] leading-none"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              科创教育
            </h2>
            <p className="text-xl text-[#8B8680] mt-4 max-w-xl">
              数字教育模式成为闽西区域标杆，全国领先
            </p>
          </div>

          {/* Bento Grid 布局 */}
          <div className="grid grid-cols-12 gap-5">
            {/* 大卡片 - 少年科学院 */}
            <div className="col-span-12 md:col-span-7 row-span-2 relative group">
              <div className="h-full bg-gradient-to-br from-[#2D2A26] via-[#3D3A36] to-[#4D4A46] rounded-3xl p-8 md:p-10 overflow-hidden">
                {/* 装饰图形 */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B5651D]/20 rounded-full blur-2xl group-hover:bg-[#B5651D]/30 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 border border-white/10 rounded-full" />
                <div className="absolute top-20 right-20 w-32 h-32 border border-[#B5651D]/30 rounded-full" />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm mb-6">
                      <Crown className="h-4 w-4 text-[#C67B5C]" />
                      <span>龙岩市首个</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                      小学少年科学院
                    </h3>
                    <p className="text-white/60 text-lg">
                      2025年12月正式成立，中科院谢华安院士指导
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mt-8">
                    {['院士科普', '科创竞赛', '跨学科项目', '小院士评选'].map((tag, i) => (
                      <span key={i} className="px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80 border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 数据卡片组 */}
            <div className="col-span-12 md:col-span-5 grid grid-rows-3 gap-5">
              {scienceTechAchievements.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl p-6 border border-[#E8E4DD] flex items-center gap-5 hover:border-[#B5651D]/30 hover:shadow-lg hover:shadow-[#B5651D]/5 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#B5651D] to-[#C67B5C] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#B5651D]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {item.number}{item.unit}
                    </div>
                    <p className="text-[#8B8680] text-sm">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 校训教风学风 - 杂志风格 */}
      <section className="py-24 relative overflow-hidden">
        {/* 背景纹理 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 text-[20rem] font-bold text-[#B5651D]/5 leading-none" style={{ fontFamily: 'var(--font-serif)' }}>修</div>
          <div className="absolute bottom-10 right-10 text-[20rem] font-bold text-[#C67B5C]/5 leading-none" style={{ fontFamily: 'var(--font-serif)' }}>慧</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* 校训 - 超大展示 */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1 bg-[#2D2A26] text-white text-xs tracking-widest mb-8">
              百年传承 · 育人根本
            </span>
            
            <h2 
              className="text-7xl md:text-8xl lg:text-9xl font-bold text-[#2D2A26] leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              修身<span className="text-[#B5651D]">·</span>力学<span className="text-[#B5651D]">·</span>博雅<span className="text-[#B5651D]">·</span>聪慧
            </h2>
          </div>

          {/* 四个校训解读 - 横向排列 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-20">
            {schoolMotto.map((item, index) => (
              <div key={index} className="group bg-white p-8 border border-[#E8E4DD] hover:bg-[#2D2A26] transition-all duration-500 cursor-default">
                <div 
                  className="text-6xl md:text-7xl font-bold mb-4 group-hover:text-white transition-colors"
                  style={{ fontFamily: 'var(--font-serif)', color: '#B5651D' }}
                >
                  {item.character}
                </div>
                <div className="h-px w-12 bg-[#B5651D] mb-4 group-hover:bg-white/50 transition-colors" />
                <p className="text-sm text-[#8B8680] group-hover:text-white/70 transition-colors leading-relaxed">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>

          {/* 教风与学风 - 并排对比 */}
          <div className="grid md:grid-cols-2 gap-0 border border-[#E8E4DD] overflow-hidden">
            {/* 教风 */}
            <div className="bg-[#2D2A26] p-10 md:p-12 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#B5651D]/10 rounded-full blur-2xl group-hover:bg-[#B5651D]/20 transition-all duration-700" />
              <div className="relative z-10">
                <span className="text-xs tracking-widest text-[#C67B5C] mb-4 block">教风 TEACHING STYLE</span>
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-6 leading-relaxed"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  身正为范<br/>博学善教<br/>儒雅灵性
                </h3>
                <div className="flex flex-wrap gap-3">
                  {teachingStyle.items.map((item, i) => (
                    <span key={i} className="text-sm text-white/60 border-b border-white/20 pb-1">{item}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 学风 */}
            <div className="bg-white p-10 md:p-12 relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#B5651D]/5 rounded-full blur-2xl group-hover:bg-[#B5651D]/10 transition-all duration-700" />
              <div className="relative z-10">
                <span className="text-xs tracking-widest text-[#B5651D] mb-4 block">学风 STUDY STYLE</span>
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-6 leading-relaxed text-[#2D2A26]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  品行高洁<br/>好学善思<br/>文雅活泼
                </h3>
                <div className="flex flex-wrap gap-3">
                  {studyStyle.items.map((item, i) => (
                    <span key={i} className="text-sm text-[#8B8680] border-b border-[#E8E4DD] pb-1">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 办学资质与荣誉 - 荣誉墙设计 */}
      <section id="honors" className="py-24 bg-[#2D2A26] relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#B5651D]/20 to-transparent" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#C67B5C]/20 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* 标题区 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[#B5651D]" />
              <span className="text-[#C67B5C] text-sm tracking-widest">HONORS & AWARDS</span>
              <div className="h-px w-12 bg-[#B5651D]" />
            </div>
            <h2 
              className="text-5xl md:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              办学荣誉
            </h2>
            <p className="text-white/50 text-lg">百年名校 · 国家、省、市三级权威认可</p>
          </div>

          {/* 2025最新资质 - 突出展示 */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {latestQualifications.map((item, index) => (
              <div 
                key={index} 
                className="group relative bg-gradient-to-br from-[#B5651D] to-[#C67B5C] p-8 rounded-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-white/70 text-xs tracking-wider">2025 NEW</span>
                    <Trophy className="h-8 w-8 text-white/80" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 荣誉分类展示 */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* 国家级荣誉 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-[#C62828] rounded-full animate-pulse" />
                <h3 className="text-white font-bold tracking-wide">国家级核心荣誉</h3>
              </div>
              <div className="space-y-px">
                {nationalHonors.map((honor, index) => (
                  <div 
                    key={index} 
                    className="group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border-l-2 border-transparent hover:border-[#B5651D] transition-all duration-300 cursor-default"
                  >
                    <span className="text-white/90 group-hover:text-white transition-colors">{honor.title}</span>
                    {honor.year && (
                      <span className="text-xs text-[#B5651D] bg-[#B5651D]/10 px-3 py-1 rounded-full">
                        {honor.year}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 省级荣誉 */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-[#B5651D] rounded-full animate-pulse" />
                <h3 className="text-white font-bold tracking-wide">省级核心荣誉</h3>
              </div>
              <div className="space-y-px">
                {provincialHonors.map((honor, index) => (
                  <div 
                    key={index} 
                    className="group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border-l-2 border-transparent hover:border-[#C67B5C] transition-all duration-300 cursor-default"
                  >
                    <span className="text-white/90 group-hover:text-white transition-colors">{honor.title}</span>
                    {honor.year && (
                      <span className="text-xs text-[#C67B5C] bg-[#C67B5C]/10 px-3 py-1 rounded-full">
                        {honor.year}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 师资队伍建设 - 现代卡片设计 */}
      <section id="teacher" className="py-24 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#B5651D]/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* 标题 */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-[#B5651D]" />
              <span className="text-[#B5651D] text-sm tracking-wider">TEACHER DEVELOPMENT</span>
            </div>
            <h2 
              className="text-5xl md:text-6xl font-bold text-[#2D2A26] mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              师资队伍
            </h2>
            <p className="text-[#8B8680] text-lg">青蓝工程 + 名师领航双轨培养体系</p>
          </div>

          {/* 教师获奖统计 - 大数字展示 */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {teacherStats.map((item, index) => (
              <div key={index} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#B5651D] to-[#C67B5C] rounded-2xl transform group-hover:scale-105 transition-transform duration-300" style={{ opacity: 0.1 }} />
                <div className="relative bg-white p-10 rounded-2xl border border-[#E8E4DD] text-center group-hover:border-[#B5651D]/30 transition-all duration-300">
                  <div className="text-7xl font-bold text-[#B5651D] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                    {item.number}
                  </div>
                  <p className="text-[#5C5852]">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 学生成果 - 特色卡片 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#2D2A26] mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-[#B5651D]" />
              学生竞赛成果
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {studentAchievements.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index} 
                  className="group bg-white p-8 rounded-2xl border border-[#E8E4DD] hover:border-[#B5651D]/50 hover:shadow-xl hover:shadow-[#B5651D]/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-[#2D2A26] rounded-xl flex items-center justify-center">
                      <Icon className="h-7 w-7 text-[#C67B5C]" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#E8E4DD] group-hover:text-[#B5651D] group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-lg font-bold text-[#2D2A26] mb-2 group-hover:text-[#B5651D] transition-colors">{item.title}</h4>
                  <p className="text-[#B5651D] font-medium text-lg">{item.award}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-16 bg-white border-t border-[#E8E4DD]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold text-[#2D2A26] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                联系我们
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#B5651D]/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-[#B5651D]" />
                  </div>
                  <span className="text-[#5C5852]">福建省龙岩市新罗区龙川东路11号</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#B5651D]/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-[#B5651D]" />
                  </div>
                  <span className="text-[#5C5852]">0597-2321234</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#B5651D]/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[#B5651D]" />
                  </div>
                  <span className="text-[#5C5852]">周一至周五 8:00 - 17:30</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D2A26] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                快速入口
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['总务后勤', '教务教研', '德育管理', '教师空间'].map((item, index) => (
                  <Link key={index} href="/login">
                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E4DD] hover:bg-[#F5F0E1] transition-colors cursor-pointer">
                      <span className="text-[#5C5852] text-sm">{item}</span>
                      <ArrowRight className="h-4 w-4 text-[#B5651D] inline ml-2" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 bg-[#2D2A26]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo-school.png" alt="福建省龙岩师范附属小学" className="h-8 w-auto" />
              <span className="text-sm text-white/60">© 2024 福建省龙岩师范附属小学</span>
            </div>
            <div className="flex gap-6 text-xs text-white/40">
              <a href="#" className="hover:text-white/70 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white/70 transition-colors">使用条款</a>
              <a href="#" className="hover:text-white/70 transition-colors">技术支持</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
