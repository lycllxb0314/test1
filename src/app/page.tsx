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
  Bell,
  ArrowRight,
  Building2,
  Phone,
  MapPin,
  Clock,
  Target,
  Lightbulb,
  Footprints,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 校训内涵
const schoolMotto = [
  { 
    character: '明德', 
    meaning: '明德修身，立德树人',
    desc: '以德为先，培养学生健全人格与家国情怀'
  },
  { 
    character: '博学', 
    meaning: '博学笃志，广闻强识',
    desc: '拓宽视野，培养学生终身学习的能力'
  },
  { 
    character: '笃行', 
    meaning: '笃行致远，知行合一',
    desc: '注重实践，培养学生解决问题的能力'
  },
  { 
    character: '创新', 
    meaning: '开拓进取，勇于创新',
    desc: '激发潜能，培养学生创新精神与实践能力'
  },
];

// 五育数据 - 与校训对应
const fiveEducation = [
  {
    category: '德育',
    motto: '明德',
    goal: '培养有理想、有道德、有担当的时代新人',
    practice: '少先队活动、主题班会、社会实践、红色教育',
    color: '#B22222',
    images: [
      { src: '/images/campus/scarf-ceremony.png', title: '入队仪式' },
      { src: '/images/campus/young-pioneers.png', title: '少先队活动' },
      { src: '/images/campus/recitation-grade6.jpg', title: '红色教育' },
      { src: '/images/campus/fire-safety-class.jpg', title: '安全教育' },
    ],
  },
  {
    category: '智育',
    motto: '博学',
    goal: '培养善思考、会学习、能创新的智慧少年',
    practice: '课堂教学、学科竞赛、科技创新、阅读工程',
    color: '#1565C0',
    images: [
      { src: '/images/campus/science-academy.png', title: '少年科学院' },
      { src: '/images/campus/robot-interaction.jpg', title: '科技创新' },
      { src: '/images/campus/wrc-finals-team.jpg', title: '学科竞赛' },
      { src: '/images/campus/english-contest.png', title: '学科活动' },
    ],
  },
  {
    category: '体育',
    motto: '笃行',
    goal: '培养体魄健、意志坚、精神强的阳光少年',
    practice: '体育课堂、阳光大课间、体育社团、田径运动会',
    color: '#E65100',
    images: [
      { src: '/images/campus/group-exercise.jpg', title: '阳光大课间' },
      { src: '/images/campus/sports-race.jpg', title: '田径运动会' },
      { src: '/images/campus/sports-start.jpg', title: '体育竞技' },
      { src: '/images/campus/eye-exercise.jpg', title: '健康教育' },
    ],
  },
  {
    category: '美育',
    motto: '创新',
    goal: '培养有审美、会表达、能创造的艺术素养',
    practice: '艺术课堂、社团活动、校园艺术节、传统文化',
    color: '#6A1B9A',
    images: [
      { src: '/images/campus/dance-contest.png', title: '校园艺术节' },
      { src: '/images/campus/orchestra.png', title: '艺术社团' },
      { src: '/images/campus/festival-opening.png', title: '文艺汇演' },
      { src: '/images/campus/lion-dance-activity.jpg', title: '传统文化' },
    ],
  },
  {
    category: '劳育',
    motto: '笃行',
    goal: '培养爱劳动、会劳动、懂劳动的时代新人',
    practice: '劳动课程、校园种植、家务劳动、劳动技能大赛',
    color: '#2E7D32',
    images: [
      { src: '/images/campus/labor-food-display.jpg', title: '劳动技能大赛' },
      { src: '/images/campus/labor-cooking.jpg', title: '劳动实践' },
      { src: '/images/campus/planting.jpg', title: '校园种植' },
      { src: '/images/campus/succulent.jpg', title: '劳动教育' },
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
  { image: '/images/campus/festival-stage.png', title: '校园文化艺术节' },
  { image: '/images/campus/science-academy.png', title: '少年科学院成立' },
  { image: '/images/campus/tech-festival.jpg', title: '科技节活动' },
  { image: '/images/campus/sports-race.jpg', title: '田径运动会' },
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
        // 教师角色直接跳转到教师空间
        if (user.role === 'subject_teacher' || user.role === 'skill_teacher' || user.role === 'head_teacher') {
          router.push('/teacher');
        } else if (user.role === 'parent') {
          router.push('/parent');
        } else {
          router.push('/dashboard');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, user, router]);

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (!mounted) return null;

  if (user) {
    const isTeacher = user.role === 'subject_teacher' || user.role === 'skill_teacher' || user.role === 'head_teacher';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-700 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">
            正在跳转到{isTeacher ? '教师空间' : user.role === 'parent' ? '家长端' : '工作台'}...
          </p>
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
              {['学校概况', '育人体系', '师资队伍', '新闻动态'].map((item, index) => (
                <a
                  key={index}
                  href={`#${['about', 'education', 'teacher', 'news'][index]}`}
                  className="text-sm text-gray-600 hover:text-amber-700"
                >
                  {item}
                </a>
              ))}
            </nav>

            <Link href="/login">
              <Button className="h-9 px-5 bg-amber-700 hover:bg-amber-800 text-white text-sm">
                登录系统
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 - 身份认同 */}
      <section className="bg-amber-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* 核心身份 */}
              <p className="text-sm text-amber-700 mb-3">福建省龙岩市教育局直属小学</p>
              <h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                福建省龙岩师范附属小学
              </h1>
              
              {/* 办学理念 - 核心价值主张 */}
              <p className="text-lg text-gray-700 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                温暖成长，智慧育人
              </p>
              
              {/* 存在价值 */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                一所百年名校的坚守：以&quot;明德、博学、笃行、创新&quot;为校训，
                培养德智体美劳全面发展的社会主义建设者和接班人。
              </p>

              <Link href="/login">
                <Button className="h-11 px-6 bg-amber-700 hover:bg-amber-800 text-white">
                  进入智慧校园
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* 右侧图片 - 办学成果展示 */}
            <div className="grid grid-cols-2 gap-3">
              {campusActivities.map((activity, index) => (
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

      {/* 校训 - 价值主张 */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              明德 · 博学 · 笃行 · 创新
            </h2>
            <p className="text-gray-600">校训精神，育人根本</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {schoolMotto.map((item, index) => (
              <div key={index} className="text-center md:text-left">
                <div 
                  className="text-4xl font-bold mb-2"
                  style={{ fontFamily: 'var(--font-serif)', color: '#B8860B' }}
                >
                  {item.character}
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">{item.meaning}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 学校概况 - 身份认同 */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 
            className="text-2xl font-bold text-gray-900 mb-8"
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
            </div>

            <div className="space-y-6">
              {/* 历史沿革 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">历史沿革</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  福建省龙岩师范附属小学创建于1914年，坐落于福建省龙岩市新罗区龙川东路，
                  是龙岩市教育局直属小学，福建省示范小学。学校占地面积约35亩，
                  建筑面积2万余平方米。
                </p>
              </div>
              
              {/* 办学规模 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">办学规模</h3>
                <div className="flex gap-6">
                  <div>
                    <span className="text-2xl font-bold text-amber-700" style={{ fontFamily: 'var(--font-serif)' }}>56</span>
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
                <h3 className="text-sm font-bold text-gray-800 mb-2">师资力量</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  学校拥有一支师德高尚、业务精湛的教师队伍。
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white p-3 border-l-3 border-red-700">
                    <span className="text-lg font-bold text-red-700">15人</span>
                    <p className="text-xs text-gray-500">省级骨干教师</p>
                  </div>
                  <div className="flex-1 bg-white p-3 border-l-3 border-blue-800">
                    <span className="text-lg font-bold text-blue-800">32人</span>
                    <p className="text-xs text-gray-500">市级骨干教师</p>
                  </div>
                  <div className="flex-1 bg-white p-3 border-l-3 border-amber-700">
                    <span className="text-lg font-bold text-amber-700">28人</span>
                    <p className="text-xs text-gray-500">高级教师</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 五育并举 - 育人路径 */}
      <section id="education" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              育人体系
            </h2>
            <p className="text-gray-600">五育并举，全面落实立德树人根本任务</p>
          </div>

          <div className="space-y-12">
            {fiveEducation.map((edu, eduIndex) => (
              <div key={eduIndex} className="grid md:grid-cols-12 gap-6">
                {/* 左侧 */}
                <div className="md:col-span-3">
                  <div 
                    className="w-16 h-16 flex items-center justify-center mb-3"
                    style={{ background: edu.color }}
                  >
                    <span 
                      className="text-3xl font-bold text-white"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {edu.category.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{edu.category}</h3>
                  <p className="text-sm text-gray-500">对应校训：{edu.motto}</p>
                </div>

                {/* 右侧 */}
                <div className="md:col-span-9">
                  <p className="text-sm text-gray-700 mb-2"><strong>育人目标：</strong>{edu.goal}</p>
                  <p className="text-sm text-gray-600 mb-4"><strong>实施路径：</strong>{edu.practice}</p>
                  <div className="grid grid-cols-4 gap-3">
                    {edu.images.map((img, imgIndex) => (
                      <div key={imgIndex}>
                        <div className="aspect-[4/3] bg-gray-100">
                          {!imageErrors[`edu-${eduIndex}-${imgIndex}`] ? (
                            <img
                              src={img.src}
                              alt={img.title}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(`edu-${eduIndex}-${imgIndex}`)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1.5">{img.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 教师发展 - 育人保障 */}
      <section id="teacher" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              师资队伍
            </h2>
            <p className="text-gray-600">强师兴教，以专业发展支撑高质量育人</p>
          </div>

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

      {/* 荣誉展示 - 办学成果 */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              办学成果
            </h2>
            <p className="text-gray-400">百年耕耘，硕果累累</p>
          </div>

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
            className="text-2xl font-bold text-gray-900 mb-8"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            新闻动态
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
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
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{news.title}</h3>
                  <p className="text-xs text-gray-500">{news.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 智慧校园入口 - 服务延伸 */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
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
                  <div className="bg-white p-6 border border-gray-200 h-full">
                    <div className="w-10 h-10 rounded flex items-center justify-center mb-3" style={{ background: item.color }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">{item.desc}</p>
                    <p className="text-xs text-gray-400">适用：{item.forWho}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>联系我们</h3>
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
