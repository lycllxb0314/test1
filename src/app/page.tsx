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
  Music,
  Leaf,
  Brain,
  BookHeart,
  Landmark,
  Star,
  Baby,
  Smile,
  Shield,
  Target,
  Lightbulb,
  Footprints,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 童心教育六大实施路径
const childHeartPaths = [
  {
    icon: Shield,
    title: '有效德育引领童心',
    subtitle: '以德育心',
    desc: '通过少先队活动、主题班会、社会实践等，培养学生的家国情怀与道德品质',
    color: '#C62828',
    examples: ['入队仪式', '红色教育', '主题班会', '社会实践'],
  },
  {
    icon: Lightbulb,
    title: '高效课堂发展童心',
    subtitle: '以智启心',
    desc: '打造高效课堂，激发学习兴趣，培养思维能力与创新精神',
    color: '#1565C0',
    examples: ['学科教学', '科技创新', '思维训练', '探究学习'],
  },
  {
    icon: Palette,
    title: '多彩活动点亮童心',
    subtitle: '以趣悦心',
    desc: '丰富校园活动，让孩子们在参与中体验快乐，在活动中绽放光彩',
    color: '#AD1457',
    examples: ['艺术节', '运动会', '科技节', '读书节'],
  },
  {
    icon: Heart,
    title: '心理健康呵护童心',
    subtitle: '以爱护心',
    desc: '关注学生心理健康，建立心理档案，开展心理辅导，守护孩子心灵成长',
    color: '#6A1B9A',
    examples: ['心理辅导', '情绪管理', '团体活动', '个体咨询'],
  },
  {
    icon: BookHeart,
    title: '快乐阅读涵养童心',
    subtitle: '以书润心',
    desc: '建设书香校园，培养阅读习惯，让书籍成为孩子成长的良伴',
    color: '#2E7D32',
    examples: ['阅读课程', '图书漂流', '读书分享', '经典诵读'],
  },
  {
    icon: Landmark,
    title: '校园文化润泽童心',
    subtitle: '以境育心',
    desc: '营造温馨和谐、富有童趣的校园环境，让每一面墙壁都会说话',
    color: '#E65100',
    examples: ['班级文化', '走廊文化', '校园景观', '文化传承'],
  },
];

// 校训内涵
const schoolMotto = [
  { 
    character: '修身', 
    meaning: '修身立德，涵养品格',
    desc: '培养健全人格，塑造美好心灵'
  },
  { 
    character: '力学', 
    meaning: '勤奋学习，追求卓越',
    desc: '激发学习热情，培养探究精神'
  },
  { 
    character: '博雅', 
    meaning: '博采众长，雅正通达',
    desc: '拓宽知识视野，提升综合素养'
  },
  { 
    character: '聪慧', 
    meaning: '聪敏睿智，灵动创新',
    desc: '发展思维能力，培养创新意识'
  },
];

// 教风
const teachingStyle = {
  title: '身正为范 博学善教 儒雅灵性',
  items: [
    { word: '身正为范', desc: '以德立身，为人师表' },
    { word: '博学善教', desc: '学识渊博，教法精湛' },
    { word: '儒雅灵性', desc: '温文尔雅，灵动智慧' },
  ],
};

// 学风
const studyStyle = {
  title: '品行高洁 好学善思 文雅活泼',
  items: [
    { word: '品行高洁', desc: '品德高尚，行为端正' },
    { word: '好学善思', desc: '热爱学习，善于思考' },
    { word: '文雅活泼', desc: '举止文雅，性格开朗' },
  ],
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
  { title: '全国文明校园', year: '连续8届', org: '中央文明办', highlight: true },
  { title: '全国心理健康教育特色学校', year: '', org: '教育部', highlight: false },
  { title: '全国艺术教育先进单位', year: '', org: '教育部', highlight: false },
  { title: '全国红旗大队', year: '', org: '共青团中央', highlight: false },
  { title: '全国少年军校示范校', year: '', org: '全国少工委', highlight: false },
  { title: '全国"三八"红旗集体', year: '', org: '全国妇联', highlight: false },
];

// 省级核心荣誉
const provincialHonors = [
  { title: '福建省示范小学', year: '2018', org: '福建省教育厅', highlight: true },
  { title: '福建省文明校园', year: '连续8届', org: '福建省委省政府', highlight: true },
  { title: '首批福建省素质教育先进校', year: '', org: '福建省教育厅', highlight: false },
  { title: '福建省心理健康教育基地校', year: '', org: '福建省教育厅', highlight: false },
  { title: '福建省绿色学校', year: '', org: '福建省教育厅', highlight: false },
  { title: '福建省校园文化艺术先进单位', year: '', org: '福建省教育厅', highlight: false },
];

// 2025年最新资质
const latestQualifications = [
  { 
    title: '2025年福建省"智慧校园试点校"', 
    desc: '龙岩市小学段数字教育与智慧校园建设标杆校',
    icon: '🏫',
  },
  { 
    title: '龙岩市首个小学少年科学院', 
    desc: '中国科学院谢华安院士担任指导，2025年12月成立',
    icon: '🔬',
  },
];

// 科创教育成果
const scienceTechAchievements = [
  {
    title: '全国学生数字素养提升实践活动',
    award: '创新之星（最高奖项）',
    year: '2025年7月',
    desc: '邓昕宇、李昊坛同学在第26届全国赛中斩获小学组创意编程项目最高荣誉',
    level: 'national',
  },
  {
    title: '科创类累计获奖',
    award: '国家级7项 · 省级58项',
    year: '截至2025年8月',
    desc: '获奖数量与质量稳居龙岩市小学首位',
    level: 'total',
  },
  {
    title: '少年科学院成立',
    award: '龙岩市首个',
    year: '2025年12月',
    desc: '中国科学院谢华安院士担任指导，搭建完整科创培养体系',
    level: 'special',
  },
];

// 教师发展成果
const teacherAchievements = [
  { name: '张美珍', achievement: '福建省小学STEM优秀教学案例', year: '2025' },
  { name: '黄艳婷', achievement: '福建省"基础教育精品课"', year: '2025' },
  { name: '唐丹华、谢玲玲', achievement: '福建省师生信息素养提升实践活动省级三等奖', year: '2025' },
  { name: '陈昀、陈婉玲', achievement: '龙岩市大中小学学科德育精品项目', year: '2025' },
];

// 教师培养体系
const teacherTrainingSystem = [
  { title: '青蓝工程', desc: '师徒结对，以老带新，加速青年教师成长' },
  { title: '名师领航', desc: '名师工作室引领，骨干教师梯队培养' },
  { title: '校本教研', desc: '分学科、分年级常态化集体备课磨课' },
  { title: 'AI融合教学', desc: '深化AI智能技术与学科教学深度融合' },
];

// 学生德育人文成果
const studentHumanitiesAchievements = [
  { title: '龙岩市"福籽同心爱中华"演讲大赛', award: '一等奖3名', type: '朗诵' },
  { title: '"弘扬抗战精神 赓续红色血脉"读书活动', award: '一等奖3名', type: '征文' },
  { title: '龙岩市首届"海峡教育杯"作文比赛', award: '一等奖2名、二等奖2名', type: '作文' },
  { title: '福建省中华经典诵写讲大赛', award: '小学组省级二等奖', type: '朗诵' },
];

// 德育品牌
const moralEducationBrands = [
  { title: '小目标促成长', desc: '家校社协同落地，福建省小学德育典型案例' },
  { title: '八大良好习惯', desc: '分学段落实学生行为与学习习惯培养' },
  { title: '仪式教育', desc: '入队仪式、十岁成长礼等，强化成长印记' },
];

// 新闻动态
const newsList = [
  { id: 1, title: '我校师生在省级科技创新大赛中荣获一等奖', date: '2024-03-15', type: '喜讯' },
  { id: 2, title: '学校开展"传承红色基因"主题教育活动', date: '2024-03-12', type: '活动' },
  { id: 3, title: '著名教育专家到校指导教学工作', date: '2024-03-10', type: '新闻' },
  { id: 4, title: '学校足球队荣获市级联赛冠军', date: '2024-03-08', type: '喜讯' },
];

// 智慧校园系统
const smartCampusSystems = [
  { 
    icon: Building2, 
    title: '总务后勤', 
    desc: '资产管理、后勤保障',
    forWho: '总务人员',
    color: '#8B4513' 
  },
  { 
    icon: GraduationCap, 
    title: '教务教研', 
    desc: '教学管理、教研活动',
    forWho: '教师、教研组',
    color: '#1565C0' 
  },
  { 
    icon: Heart, 
    title: '德育管理', 
    desc: '学生管理、成长档案',
    forWho: '班主任、德育处',
    color: '#B22222' 
  },
  { 
    icon: Users, 
    title: '教师空间', 
    desc: '工作台、家校沟通',
    forWho: '全体教师',
    color: '#6A1B9A' 
  },
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
    <div className="min-h-screen bg-white">
      
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-school.png" 
                alt="福建省龙岩师范附属小学" 
                className="h-12 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>福建省龙岩师范附属小学</h1>
                <p className="text-xs text-gray-500">创建于1914年 · 福建省示范小学</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {['童心教育', '科创特色', '办学荣誉', '师资队伍'].map((item, index) => (
                <a
                  key={index}
                  href={`#${['child-heart', 'science-tech', 'honors', 'teacher'][index]}`}
                  className="text-sm text-gray-600 hover:text-amber-700"
                >
                  {item}
                </a>
              ))}
            </nav>

            {user ? (
              <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                <Button className="h-9 px-5 bg-amber-700 hover:bg-amber-800 text-white text-sm">
                  进入工作台
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-5 bg-amber-700 hover:bg-amber-800 text-white text-sm">
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero 区域 - 童心教育核心理念 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {/* 装饰元素 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* 办学宗旨 */}
              <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-800 px-4 py-1.5 rounded-full text-sm mb-6">
                <Sparkles className="h-4 w-4" />
                <span>为每个儿童的身心发展奠基</span>
              </div>
              
              {/* 学校名称 */}
              <h1 
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                福建省龙岩师范附属小学
              </h1>
              
              {/* 核心办学理念 */}
              <div className="mb-6">
                <p 
                  className="text-2xl md:text-3xl text-gray-800 font-medium mb-2"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  珍视童心，张扬个性，全面发展
                </p>
                <div className="flex items-center gap-2 text-amber-700">
                  <Baby className="h-5 w-5" />
                  <span className="text-lg font-medium">童心教育</span>
                </div>
              </div>
              
              {/* 办学核心方向 */}
              <div className="bg-white/60 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4 mb-8">
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="text-amber-700 font-medium">办学核心方向：</span>
                  当有情怀的老师，办有温度的学校
                </p>
              </div>

              {/* 行动按钮 */}
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                    <Button className="h-12 px-8 bg-amber-700 hover:bg-amber-800 text-white text-base">
                      进入工作台
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button className="h-12 px-8 bg-amber-700 hover:bg-amber-800 text-white text-base">
                        进入智慧校园
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <a href="#child-heart">
                      <Button variant="outline" className="h-12 px-8 border-amber-300 text-amber-700 hover:bg-amber-50">
                        了解童心教育
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* 右侧图片墙 */}
            <div className="grid grid-cols-2 gap-3">
              {campusActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="relative bg-gray-100 overflow-hidden rounded-lg shadow-lg"
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                      <Baby className="h-8 w-8 text-amber-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium">{activity.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 童心教育 - 核心办学品牌 */}
      <section id="child-heart" className="py-20 bg-gradient-to-b from-amber-50 via-orange-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* 品牌定位 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm mb-6">
              <Star className="h-4 w-4" />
              <span>核心办学品牌 · 福建省小学特色办学标杆案例</span>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              童心教育
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                尊重儿童<span className="text-amber-700 font-semibold">天真</span>、
                <span className="text-amber-700 font-semibold">纯朴</span>、
                <span className="text-amber-700 font-semibold">活泼</span>、
                <span className="text-amber-700 font-semibold">自然</span>的生命状态，
                创设富有<span className="text-amber-700 font-semibold">爱心</span>、
                <span className="text-amber-700 font-semibold">童趣</span>、
                <span className="text-amber-700 font-semibold">自由</span>、
                <span className="text-amber-700 font-semibold">和谐</span>的育人环境
              </p>
              <p className="text-base text-gray-500">
                立足儿童实际、遵循身心发展规律，让孩子<span className="text-amber-700 font-medium">本真</span>、
                <span className="text-amber-700 font-medium">快乐</span>、
                <span className="text-amber-700 font-medium">阳光</span>地成长
              </p>
            </div>
          </div>

          {/* 办学宗旨与方向 */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="font-bold text-gray-900">办学宗旨</h3>
              </div>
              <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>
                为每个儿童的身心发展奠基
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="font-bold text-gray-900">办学方向</h3>
              </div>
              <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>
                当有情怀的老师，办有温度的学校
              </p>
            </div>
          </div>

          {/* 六大实施路径 */}
          <div className="mb-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
                <Target className="h-4 w-4" />
                <span>十余年持续优化的核心执行标准</span>
              </div>
              <h3 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                六大实施路径
              </h3>
              <p className="text-gray-500 text-sm mt-2">贯穿校本部所有教学、管理、德育工作的核心框架</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childHeartPaths.map((path, index) => {
                const Icon = path.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ background: path.color }}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                          {path.title}
                        </h4>
                        <p className="text-sm font-medium" style={{ color: path.color }}>{path.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {path.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {path.examples.map((example, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: `${path.color}15`, color: path.color }}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 成果印证 */}
          <div className="mt-12 p-6 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-amber-600" />
              <h4 className="font-bold text-gray-900">品牌成果</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              "童心教育"形成完整的理论与实践体系，配套六大实施路径深耕十余年，成为<span className="text-amber-700 font-medium">福建省小学特色办学标杆案例</span>，
              德育成果被《中国德育》《福建教育》专题报道，形成了可复制、可推广的小学育人模式。
            </p>
          </div>
        </div>
      </section>

      {/* 校训教风学风 - 价值主张 */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* 校训 */}
          <div className="text-center mb-12">
            <p className="text-amber-400 text-sm mb-4">百年传承 · 育人根本</p>
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              修身 · 力学 · 博雅 · 聪慧
            </h2>
            <p className="text-gray-400 mb-8">校训精神，引领童心成长</p>

            <div className="grid md:grid-cols-4 gap-6">
              {schoolMotto.map((item, index) => (
                <div key={index} className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ fontFamily: 'var(--font-serif)', color: '#D4A574' }}
                  >
                    {item.character}
                  </div>
                  <p className="text-sm font-medium text-gray-300 mb-1">{item.meaning}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 教风与学风 */}
          <div className="grid md:grid-cols-2 gap-8 mt-12 pt-12 border-t border-gray-800">
            {/* 教风 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-amber-400 text-sm mb-3">
                <Users className="h-4 w-4" />
                <span>教风</span>
              </div>
              <h3 
                className="text-xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                身正为范 · 博学善教 · 儒雅灵性
              </h3>
              <div className="flex justify-center gap-6">
                {teachingStyle.items.map((item, index) => (
                  <div key={index} className="text-center">
                    <p className="text-amber-300 font-medium text-sm">{item.word}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 学风 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-amber-400 text-sm mb-3">
                <BookOpen className="h-4 w-4" />
                <span>学风</span>
              </div>
              <h3 
                className="text-xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                品行高洁 · 好学善思 · 文雅活泼
              </h3>
              <div className="flex justify-center gap-6">
                {studyStyle.items.map((item, index) => (
                  <div key={index} className="text-center">
                    <p className="text-amber-300 font-medium text-sm">{item.word}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 学校概况 */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
              <Building2 className="h-4 w-4" />
              <span>百年名校</span>
            </div>
            <h2 
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              学校概况
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="bg-gray-100 aspect-[4/3] mb-4 rounded-lg overflow-hidden">
                {!imageErrors['about-main'] ? (
                  <img
                    src="/images/campus/festival-stage.png"
                    alt="校园风采"
                    className="w-full h-full object-cover"
                    onError={() => handleImageError('about-main')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                    <Building2 className="h-12 w-12 text-amber-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* 历史沿革 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-700 rounded-full" />
                  历史沿革
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  福建省龙岩师范附属小学创建于1914年，坐落于福建省龙岩市新罗区龙川东路，
                  是龙岩市教育局直属小学，福建省示范小学。学校占地面积约35亩，
                  建筑面积2万余平方米。
                </p>
              </div>
              
              {/* 办学规模 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-700 rounded-full" />
                  办学规模
                </h3>
                <div className="flex gap-6">
                  <div>
                    <span className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>60</span>
                    <span className="text-sm text-gray-600 ml-1">个教学班</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>2800</span>
                    <span className="text-sm text-gray-600 ml-1">余名学生</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>168</span>
                    <span className="text-sm text-gray-600 ml-1">名教职工</span>
                  </div>
                </div>
              </div>

              {/* 师资力量 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-700 rounded-full" />
                  师资力量
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  学校拥有一支师德高尚、业务精湛的教师队伍。
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-3 border-l-3 border-red-700">
                    <span className="text-lg font-bold text-red-700">15人</span>
                    <p className="text-xs text-gray-500">省级骨干教师</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 border-l-3 border-blue-800">
                    <span className="text-lg font-bold text-blue-800">32人</span>
                    <p className="text-xs text-gray-500">市级骨干教师</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 border-l-3 border-amber-700">
                    <span className="text-lg font-bold text-amber-700">28人</span>
                    <p className="text-xs text-gray-500">高级教师</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 科创教育 - 王牌特色 */}
      <section id="science-tech" className="py-16 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-200 px-4 py-1.5 rounded-full text-sm mb-4">
              <Sparkles className="h-4 w-4" />
              <span>王牌办学特色 · 区域标杆</span>
            </div>
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              科创教育
            </h2>
            <p className="text-blue-200 text-lg">
              数字教育模式成为闽西区域标杆，全国领先
            </p>
          </div>

          {/* 2025年重磅成果 */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {scienceTechAchievements.map((item, index) => (
              <div 
                key={index} 
                className={`p-6 rounded-xl ${
                  item.level === 'national' 
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30' 
                    : item.level === 'special'
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30'
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {item.level === 'national' && <Trophy className="h-5 w-5 text-amber-400" />}
                  {item.level === 'special' && <Star className="h-5 w-5 text-purple-400" />}
                  {item.level === 'total' && <Target className="h-5 w-5 text-blue-300" />}
                  <span className="text-xs text-gray-300">{item.year}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className={`text-xl font-bold mb-2 ${
                  item.level === 'national' ? 'text-amber-400' : 
                  item.level === 'special' ? 'text-purple-300' : 'text-blue-300'
                }`}>
                  {item.award}
                </p>
                <p className="text-sm text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 少年科学院 */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl">
                🔬
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-2">龙岩市首个小学少年科学院</h3>
                <p className="text-gray-300 mb-3">
                  2025年12月正式成立，聘请中国科学院谢华安院士担任指导专家
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {['院士科普', '科创竞赛', '跨学科项目', '小院士评选'].map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 办学资质与荣誉 */}
      <section id="honors" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
              <Trophy className="h-4 w-4" />
              <span>百年名校 · 权威认可</span>
            </div>
            <h2 
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              办学资质与荣誉
            </h2>
            <p className="text-gray-600">国家、省、市三级权威认可</p>
          </div>

          {/* 2025年最新资质 */}
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {latestQualifications.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-3xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 国家级荣誉 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-red-600 rounded-full" />
              国家级核心荣誉
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {nationalHonors.map((honor, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    honor.highlight 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {honor.highlight && <Trophy className="h-4 w-4 text-red-600" />}
                    <h4 className="font-medium text-gray-900">{honor.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{honor.org} {honor.year && `· ${honor.year}`}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 省级荣誉 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full" />
              省级核心荣誉
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {provincialHonors.map((honor, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    honor.highlight 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {honor.highlight && <Trophy className="h-4 w-4 text-blue-600" />}
                    <h4 className="font-medium text-gray-900">{honor.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{honor.org} {honor.year && `· ${honor.year}`}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 教师队伍建设成果 */}
      <section id="teacher" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
              <Users className="h-4 w-4" />
              <span>当有情怀的老师</span>
            </div>
            <h2 
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              教师队伍建设成果
            </h2>
            <p className="text-gray-600">青蓝工程+名师领航双轨培养体系</p>
          </div>

          {/* 教师获奖统计 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">4人次</div>
              <p className="text-sm text-gray-500">国家级表彰</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">30+人次</div>
              <p className="text-sm text-gray-500">省级表彰</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">70+人次</div>
              <p className="text-sm text-gray-500">市区级表彰</p>
            </div>
          </div>

          {/* 2025年教师成果 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-4">2025年教师获奖成果</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {teacherAchievements.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.achievement}</p>
                    <p className="text-xs text-gray-500">{item.name} · {item.year}年</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 教师培养体系 */}
          <div className="grid md:grid-cols-4 gap-4">
            {teacherTrainingSystem.map((item, index) => (
              <div key={index} className="bg-white p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 学生五育融合成果 */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>五育并举</span>
            </div>
            <h2 
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              学生培养成果
            </h2>
            <p className="text-gray-600">为每个儿童的身心发展奠基</p>
          </div>

          {/* 人文德育成果 */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-4">人文与德育成果</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {studentHumanitiesAchievements.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-amber-600 font-medium">{item.award}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 德育品牌 */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-4">德育品牌项目</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {moralEducationBrands.map((item, index) => (
                <div key={index} className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                  <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 艺体与心理健康 */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">艺体与心理健康教育</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">艺术节 · 体育节 · 读书节 · 科技节</h4>
                <p className="text-sm text-gray-600">全国艺术教育先进单位，多次在全国、全省中小学艺术展演中斩获佳绩</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">心理健康教育体系全省领先</h4>
                <p className="text-sm text-gray-600">标准化心理辅导室、心理辅导热线、校园心理剧，相关经验在全省推广</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 示范引领与社会影响力 */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              示范引领与社会影响力
            </h2>
            <p className="text-gray-400">龙岩市小学教育龙头校，带动区域协同发展</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="font-bold text-white mb-2">区域教育示范</h3>
              <p className="text-sm text-gray-400">
                数字教育、课后服务、德育管理、心理健康教育等办学模式成为全市中小学示范样板
              </p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">家校社协同育人</h3>
              <p className="text-sm text-gray-400">
                三级家委会、法制副校长、校外辅导员形成育人合力，获评龙岩市家庭教育工作先进集体
              </p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="font-bold text-white mb-2">教育公益关爱</h3>
              <p className="text-sm text-gray-400">
                "大爱龙岩·同心育苗"关爱行动，党员教师一对一结对帮扶，获评福建省关爱农村留守儿童工作先进集体
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 新闻动态 */}
      <section id="news" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
              <BookOpen className="h-4 w-4" />
              <span>校园动态</span>
            </div>
            <h2 
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              新闻动态
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {newsList.map((news) => (
              <div key={news.id} className="flex gap-4 p-4 border border-gray-200 bg-white rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <span 
                    className="inline-block px-2 py-1 text-xs text-white rounded"
                    style={{ background: news.type === '喜讯' ? '#B22222' : '#666' }}
                  >
                    {news.type}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{news.title}</h3>
                  <p className="text-xs text-gray-500">{news.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 智慧校园入口 */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-amber-700 text-sm mb-2">
              <Sparkles className="h-4 w-4" />
              <span>数字化赋能</span>
            </div>
            <h2 
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              智慧校园
            </h2>
            <p className="text-gray-600">信息化赋能教育管理，助力育人目标实现</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {smartCampusSystems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} href="/login">
                  <div className="bg-white p-6 border border-gray-200 rounded-lg h-full hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: item.color }}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
                    <p className="text-xs text-gray-400">适用：{item.forWho}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>联系我们</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span className="text-gray-600">福建省龙岩市新罗区龙川东路11号</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-600" />
                  <span className="text-gray-600">0597-2321234</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-amber-600" />
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
                alt="福建省龙岩师范附属小学" 
                className="h-8 w-auto"
              />
              <span className="text-sm text-gray-400">© 2024 福建省龙岩师范附属小学</span>
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
