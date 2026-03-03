'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Phone,
  MapPin,
  Sparkles,
  Sun,
  Palette,
  Shield,
  Lightbulb,
  BookHeart,
  Landmark,
  Star,
  Baby,
  Award,
  Crown,
  GraduationCap,
  Music,
  Leaf,
  Brain,
  TreePine,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Claymorphism 配色 - 柔和温暖
const colors = {
  peach: '#FFEEE4',
  peachDark: '#FDBCB4',
  mint: '#E8F5E9',
  mintDark: '#A5D6A7',
  sky: '#E3F2FD',
  skyDark: '#90CAF9',
  lavender: '#F3E5F5',
  lavenderDark: '#CE93D8',
  lemon: '#FFFDE7',
  lemonDark: '#FFF59D',
  coral: '#FFCCBC',
  coralDark: '#FF8A65',
};

// 童心教育六大路径 - 配合柔和色彩
const childHeartPaths = [
  {
    icon: Shield,
    title: '有效德育引领童心',
    subtitle: '以德育心',
    desc: '通过少先队活动、主题班会、社会实践，培养家国情怀与道德品质',
    bgColor: colors.peach,
    iconBg: colors.peachDark,
    examples: ['入队仪式', '红色教育', '主题班会', '社会实践'],
  },
  {
    icon: Lightbulb,
    title: '高效课堂发展童心',
    subtitle: '以智启心',
    desc: '打造高效课堂，激发学习兴趣，培养思维能力与创新精神',
    bgColor: colors.mint,
    iconBg: colors.mintDark,
    examples: ['学科教学', '科技创新', '思维训练', '探究学习'],
  },
  {
    icon: Palette,
    title: '多彩活动点亮童心',
    subtitle: '以趣悦心',
    desc: '丰富校园活动，让孩子们在参与中体验快乐，绽放光彩',
    bgColor: colors.lavender,
    iconBg: colors.lavenderDark,
    examples: ['艺术节', '运动会', '科技节', '读书节'],
  },
  {
    icon: Heart,
    title: '心理健康呵护童心',
    subtitle: '以爱护心',
    desc: '关注学生心理健康，建立心理档案，开展心理辅导',
    bgColor: colors.coral,
    iconBg: colors.coralDark,
    examples: ['心理辅导', '情绪管理', '团体活动', '个体咨询'],
  },
  {
    icon: BookHeart,
    title: '快乐阅读涵养童心',
    subtitle: '以书润心',
    desc: '建设书香校园，培养阅读习惯，让书籍成为成长良伴',
    bgColor: colors.sky,
    iconBg: colors.skyDark,
    examples: ['阅读课程', '图书漂流', '读书分享', '经典诵读'],
  },
  {
    icon: TreePine,
    title: '校园文化润泽童心',
    subtitle: '以境育心',
    desc: '营造温馨和谐、富有童趣的校园环境，让每面墙壁都会说话',
    bgColor: colors.lemon,
    iconBg: colors.lemonDark,
    examples: ['班级文化', '走廊文化', '校园景观', '文化传承'],
  },
];

// 校训
const schoolMotto = [
  { character: '修身', meaning: '修身立德，涵养品格' },
  { character: '力学', meaning: '勤奋学习，追求卓越' },
  { character: '博雅', meaning: '博采众长，雅正通达' },
  { character: '聪慧', meaning: '聪敏睿智，灵动创新' },
];

// 快速入口
const quickLinks = [
  { title: '总务后勤', desc: '后勤服务、报修管理', icon: Landmark, color: colors.peachDark },
  { title: '教务教研', desc: '课程管理、教学研究', icon: BookOpen, color: colors.mintDark },
  { title: '德育管理', desc: '学生管理、活动组织', icon: Heart, color: colors.coralDark },
  { title: '教师空间', desc: '个人中心、工作台', icon: Users, color: colors.skyDark },
];

// 核心数据
const coreStats = [
  { number: '1914', label: '建校年份', suffix: '年' },
  { number: '60', label: '教学班', suffix: '个' },
  { number: '3000+', label: '在校学生', suffix: '' },
  { number: '194', label: '教职员工', suffix: '人' },
];

// 荣誉亮点
const honorHighlights = [
  { title: '全国文明校园', year: '连续8届' },
  { title: '福建省示范小学', year: '2018年' },
  { title: '全国心理健康教育特色学校', year: '' },
  { title: '福建省文明校园', year: '连续8届' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activePath, setActivePath] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #FFF 50%, #F8FFFE 100%)' }}>
      
      {/* 顶部导航 - 悬浮胶囊样式 */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <nav 
          className="max-w-5xl mx-auto px-6 py-3 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-school.png" 
                alt="福建省龙岩师范附属小学" 
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-800" style={{ fontFamily: 'var(--font-serif)' }}>
                  龙岩师范附小
                </h1>
                <p className="text-xs text-gray-500">创建于1914年</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {['童心教育', '科创特色', '校园荣誉', '快速入口'].map((item, index) => (
                <a
                  key={index}
                  href={`#${['child-heart', 'science', 'honors', 'quick-links'][index]}`}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {user ? (
              <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                <Button 
                  className="rounded-full px-6 text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #FF8A65 0%, #FFB74D 100%)',
                    color: 'white',
                    boxShadow: '0 4px 14px rgba(255, 138, 101, 0.4)',
                  }}
                >
                  进入工作台
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button 
                  className="rounded-full px-6 text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #FF8A65 0%, #FFB74D 100%)',
                    color: 'white',
                    boxShadow: '0 4px 14px rgba(255, 138, 101, 0.4)',
                  }}
                >
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero 区域 - 大而温暖 */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* 核心理念 */}
          <div className="text-center mb-16">
            {/* 装饰徽章 */}
            <div 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8"
              style={{
                background: colors.lemon,
                border: `3px solid ${colors.lemonDark}`,
                boxShadow: '0 4px 0 rgba(0, 0, 0, 0.05), inset 0 -2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">福建省示范小学 · 百年名校</span>
            </div>

            {/* 学校名称 */}
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              style={{ 
                fontFamily: 'var(--font-serif)',
                color: '#2D3748',
              }}
            >
              福建省龙岩师范
              <br />
              <span style={{ color: '#FF8A65' }}>附属小学</span>
            </h1>

            {/* 核心理念 */}
            <p 
              className="text-2xl md:text-3xl text-gray-600 mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              珍视童心，张扬个性，全面发展
            </p>

            {/* 办学愿景 */}
            <div 
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #FFE0B2 0%, #FFCCBC 100%)',
                border: '3px solid #FFB74D',
                boxShadow: '0 4px 0 rgba(255, 183, 77, 0.3)',
              }}
            >
              <Heart className="h-5 w-5 text-orange-600" />
              <span className="text-base font-medium text-orange-800">当有情怀的老师，办有温度的学校</span>
            </div>
          </div>

          {/* 核心数据 - Clay卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
            {coreStats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-3xl transition-transform hover:scale-105"
                style={{
                  background: 'white',
                  border: '3px solid #F0F0F0',
                  boxShadow: '0 8px 0 #F0F0F0, 0 8px 20px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div 
                  className="text-4xl md:text-5xl font-bold mb-2"
                  style={{ fontFamily: 'var(--font-serif)', color: '#FF8A65' }}
                >
                  {stat.number}
                  <span className="text-xl text-gray-400">{stat.suffix}</span>
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA 按钮 */}
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                <Button 
                  className="h-14 px-10 rounded-full text-lg font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #FF8A65 0%, #FFB74D 100%)',
                    color: 'white',
                    boxShadow: '0 6px 0 #E65100, 0 6px 20px rgba(255, 138, 101, 0.4)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  进入工作台
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button 
                    className="h-14 px-10 rounded-full text-lg font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #FF8A65 0%, #FFB74D 100%)',
                      color: 'white',
                      boxShadow: '0 6px 0 #E65100, 0 6px 20px rgba(255, 138, 101, 0.4)',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    进入智慧校园
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#child-heart">
                  <Button 
                    variant="outline"
                    className="h-14 px-10 rounded-full text-lg font-medium"
                    style={{
                      background: 'white',
                      color: '#666',
                      boxShadow: '0 6px 0 #E0E0E0',
                      border: '3px solid #E0E0E0',
                    }}
                  >
                    了解童心教育
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 童心教育 - 六大路径 */}
      <section id="child-heart" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-12">
            <div 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
              style={{
                background: colors.mint,
                border: `3px solid ${colors.mintDark}`,
              }}
            >
              <Star className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">核心办学品牌</span>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
            >
              童心教育
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              尊重儿童天真、纯朴、活泼、自然的生命状态，
              创设富有爱心、童趣、自由、和谐的育人环境
            </p>
          </div>

          {/* 六大路径卡片 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childHeartPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: path.bgColor,
                    border: `4px solid ${path.iconBg}`,
                    boxShadow: `0 8px 0 ${path.iconBg}40, 0 8px 20px rgba(0, 0, 0, 0.08)`,
                  }}
                  onMouseEnter={() => setActivePath(index)}
                  onMouseLeave={() => setActivePath(null)}
                >
                  {/* 图标 */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: path.iconBg,
                      boxShadow: `inset 0 -3px 0 rgba(0, 0, 0, 0.1)`,
                    }}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* 标题 */}
                  <h3 
                    className="text-xl font-bold mb-1"
                    style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
                  >
                    {path.title}
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: path.iconBg }}>
                    {path.subtitle}
                  </p>

                  {/* 描述 */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {path.desc}
                  </p>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2">
                    {path.examples.map((example, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{
                          background: 'white',
                          color: '#666',
                          border: `2px solid ${path.iconBg}40`,
                        }}
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
      </section>

      {/* 科创教育 */}
      <section id="science" className="py-20 px-6" style={{ background: 'linear-gradient(180deg, #FFF 0%, #F0F7FF 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
              style={{
                background: colors.sky,
                border: `3px solid ${colors.skyDark}`,
              }}
            >
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">王牌办学特色</span>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
            >
              科创教育
            </h2>
            <p className="text-lg text-gray-500">数字教育模式成为闽西区域标杆</p>
          </div>

          {/* 少年科学院 - 大卡片 */}
          <div
            className="p-8 md:p-12 rounded-3xl mb-8"
            style={{
              background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
              border: '4px solid #1A202C',
              boxShadow: '0 12px 0 #1A202C, 0 12px 30px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-white/80">龙岩市首个</span>
                </div>
                <h3 
                  className="text-3xl md:text-4xl font-bold text-white mb-4"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  小学少年科学院
                </h3>
                <p className="text-white/60 text-lg mb-6">
                  2025年12月正式成立，聘请中国科学院谢华安院士担任指导专家
                </p>
                <div className="flex flex-wrap gap-3">
                  {['院士科普', '科创竞赛', '跨学科项目', '小院士评选'].map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-full text-sm text-white/80"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 成果数据 */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { number: '7', unit: '项', label: '国家级奖项' },
                  { number: '58', unit: '项', label: '省级奖项' },
                  { number: '创新之星', unit: '', label: '全国最高奖' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="text-center p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                      {item.number}
                      <span className="text-sm text-white/60">{item.unit}</span>
                    </div>
                    <p className="text-xs text-white/50">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 校训 */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
              style={{
                background: colors.lavender,
                border: `3px solid ${colors.lavenderDark}`,
              }}
            >
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">百年传承</span>
            </div>
            <h2 
              className="text-5xl md:text-6xl font-bold mb-8"
              style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
            >
              修身·力学·博雅·聪慧
            </h2>
          </div>

          {/* 四字校训 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {schoolMotto.map((item, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-3xl transition-all hover:scale-105"
                style={{
                  background: 'white',
                  border: '4px solid #E8E8E8',
                  boxShadow: '0 8px 0 #E8E8E8',
                }}
              >
                <div
                  className="text-5xl md:text-6xl font-bold mb-4"
                  style={{ 
                    fontFamily: 'var(--font-serif)',
                    color: '#FF8A65',
                  }}
                >
                  {item.character}
                </div>
                <p className="text-sm text-gray-500">{item.meaning}</p>
              </div>
            ))}
          </div>

          {/* 教风学风 */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div
              className="p-8 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
                border: '4px solid #1A202C',
                boxShadow: '0 8px 0 #1A202C',
              }}
            >
              <span className="text-xs tracking-widest text-amber-400 mb-2 block">教风</span>
              <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                身正为范 博学善教 儒雅灵性
              </h3>
              <div className="flex flex-wrap gap-3">
                {['身正为范', '博学善教', '儒雅灵性'].map((item, i) => (
                  <span key={i} className="text-sm text-white/60">{item}</span>
                ))}
              </div>
            </div>
            <div
              className="p-8 rounded-3xl"
              style={{
                background: 'white',
                border: '4px solid #E8E8E8',
                boxShadow: '0 8px 0 #E8E8E8',
              }}
            >
              <span className="text-xs tracking-widest text-orange-500 mb-2 block">学风</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                品行高洁 好学善思 文雅活泼
              </h3>
              <div className="flex flex-wrap gap-3">
                {['品行高洁', '好学善思', '文雅活泼'].map((item, i) => (
                  <span key={i} className="text-sm text-gray-500">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 办学荣誉 */}
      <section id="honors" className="py-20 px-6" style={{ background: 'linear-gradient(180deg, #FFF 0%, #FFF9F5 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
              style={{
                background: colors.coral,
                border: `3px solid ${colors.coralDark}`,
              }}
            >
              <Trophy className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">百年名校</span>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
            >
              办学荣誉
            </h2>
            <p className="text-lg text-gray-500">国家、省、市三级权威认可</p>
          </div>

          {/* 荣誉卡片 */}
          <div className="grid md:grid-cols-2 gap-4">
            {honorHighlights.map((honor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-6 rounded-2xl transition-all hover:scale-[1.02]"
                style={{
                  background: 'white',
                  border: '3px solid #F0F0F0',
                  boxShadow: '0 6px 0 #F0F0F0',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: index % 2 === 0 ? colors.peach : colors.mint,
                    }}
                  >
                    <Award className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className="font-medium text-gray-800">{honor.title}</span>
                </div>
                {honor.year && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: colors.lemon,
                      color: '#B45309',
                    }}
                  >
                    {honor.year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 快速入口 */}
      <section id="quick-links" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
            >
              快速入口
            </h2>
            <p className="text-gray-500">智慧校园服务平台</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={index} href="/login">
                  <div
                    className="group p-6 rounded-3xl transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: 'white',
                      border: '4px solid #E8E8E8',
                      boxShadow: '0 8px 0 #E8E8E8',
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{
                        background: link.color,
                        boxShadow: 'inset 0 -3px 0 rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{link.title}</h3>
                    <p className="text-sm text-gray-500">{link.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-16 px-6" style={{ background: colors.peach }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 
                className="text-xl font-bold mb-6"
                style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
              >
                联系我们
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'white' }}
                  >
                    <MapPin className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-gray-600">福建省龙岩市新罗区龙川东路11号</span>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'white' }}
                  >
                    <Phone className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-gray-600">0597-2321234</span>
                </div>
              </div>
            </div>
            <div>
              <h3 
                className="text-xl font-bold mb-6"
                style={{ fontFamily: 'var(--font-serif)', color: '#2D3748' }}
              >
                关注我们
              </h3>
              <p className="text-gray-600 mb-4">扫描二维码关注学校微信公众号</p>
              <div
                className="inline-block p-4 rounded-2xl"
                style={{ background: 'white' }}
              >
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">二维码</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 px-6" style={{ background: '#2D3748' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo-school.png" alt="福建省龙岩师范附属小学" className="h-8 w-auto" />
              <span className="text-sm text-white/60">© 2024 福建省龙岩师范附属小学</span>
            </div>
            <div className="flex gap-6 text-xs text-white/40">
              <a href="#" className="hover:text-white/70 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white/70 transition-colors">使用条款</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
