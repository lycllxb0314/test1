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
  Shield,
  Lightbulb,
  Palette,
  BookHeart,
  Landmark,
  Star,
  Award,
  Crown,
  TreePine,
  ChevronRight,
  Calendar,
  Bell,
  Newspaper,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 童心教育六大路径
const childHeartPaths = [
  {
    icon: Shield,
    title: '有效德育引领童心',
    subtitle: '以德育心',
    desc: '通过少先队活动、主题班会、社会实践，培养学生的家国情怀与道德品质',
  },
  {
    icon: Lightbulb,
    title: '高效课堂发展童心',
    subtitle: '以智启心',
    desc: '打造高效课堂，激发学习兴趣，培养思维能力与创新精神',
  },
  {
    icon: Palette,
    title: '多彩活动点亮童心',
    subtitle: '以趣悦心',
    desc: '丰富校园活动，让孩子们在参与中体验快乐，绽放光彩',
  },
  {
    icon: Heart,
    title: '心理健康呵护童心',
    subtitle: '以爱护心',
    desc: '关注学生心理健康，建立心理档案，开展心理辅导',
  },
  {
    icon: BookHeart,
    title: '快乐阅读涵养童心',
    subtitle: '以书润心',
    desc: '建设书香校园，培养阅读习惯，让书籍成为成长的良伴',
  },
  {
    icon: TreePine,
    title: '校园文化润泽童心',
    subtitle: '以境育心',
    desc: '营造温馨和谐、富有童趣的校园环境',
  },
];

// 校训
const schoolMotto = [
  { character: '修身', meaning: '修身立德，涵养品格' },
  { character: '力学', meaning: '勤奋学习，追求卓越' },
  { character: '博雅', meaning: '博采众长，雅正通达' },
  { character: '聪慧', meaning: '聪敏睿智，灵动创新' },
];

// 新闻动态（模拟数据）
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

// 荣誉
const honors = [
  { title: '全国文明校园', year: '连续8届' },
  { title: '福建省示范小学', year: '2018年' },
  { title: '全国心理健康教育特色学校', year: '' },
  { title: '福建省文明校园', year: '连续8届' },
  { title: '全国艺术教育先进单位', year: '' },
  { title: '福建省素质教育先进校', year: '' },
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      
      {/* 顶部导航 */}
      <header className="bg-[#8B4E6B] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <img 
                src="/logo-school.png" 
                alt="福建省龙岩师范附属小学" 
                className="h-8 w-auto brightness-0 invert"
              />
              <div className="hidden md:block border-l border-white/20 pl-6">
                <span className="text-sm">福建省龙岩师范附属小学</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <a href="#" className="px-4 py-2 text-sm bg-white/10 rounded">首 页</a>
              <a href="#news" className="px-4 py-2 text-sm hover:bg-white/10 rounded transition">新闻中心</a>
              <a href="#child-heart" className="px-4 py-2 text-sm hover:bg-white/10 rounded transition">童心教育</a>
              <a href="#honors" className="px-4 py-2 text-sm hover:bg-white/10 rounded transition">办学荣誉</a>
              <a href="#quick-links" className="px-4 py-2 text-sm hover:bg-white/10 rounded transition">快速入口</a>
            </nav>

            {user ? (
              <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                <Button className="bg-white text-[#8B4E6B] hover:bg-white/90 rounded px-5 h-8 text-sm">
                  进入工作台
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-white text-[#8B4E6B] hover:bg-white/90 rounded px-5 h-8 text-sm">
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="bg-gradient-to-r from-[#8B4E6B] to-[#6B4E8B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-block bg-white/20 text-white/90 text-xs px-3 py-1 rounded-full mb-4">
                福建省示范小学 · 创建于1914年
              </div>
              <h1 
                className="text-4xl md:text-5xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                福建省龙岩师范附属小学
              </h1>
              <p className="text-lg text-white/80 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                珍视童心，张扬个性，全面发展
              </p>
              <p className="text-white/60">当有情怀的老师，办有温度的学校</p>
            </div>
            
            {/* 数据统计 */}
            <div className="grid grid-cols-2 gap-4 text-center">
              {[
                { num: '60', label: '教学班', unit: '个' },
                { num: '3000+', label: '学生', unit: '' },
                { num: '194', label: '教师', unit: '人' },
                { num: '111', label: '办学历史', unit: '年' },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-4 min-w-[100px]">
                  <div className="text-2xl font-bold">
                    {item.num}<span className="text-sm font-normal">{item.unit}</span>
                  </div>
                  <div className="text-xs text-white/60">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 新闻中心 + 校园公告 */}
      <section id="news" className="py-8 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* 新闻中心 */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-[#8B4E6B]" />
                  <h2 className="font-bold text-gray-800">新闻中心</h2>
                </div>
                <a href="#" className="text-sm text-gray-500 hover:text-[#8B4E6B]">更多 &gt;&gt;</a>
              </div>
              <div className="divide-y">
                {newsItems.map((item, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-[#8B4E6B]/10 text-[#8B4E6B] rounded">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-700 truncate group-hover:text-[#8B4E6B]">
                          {item.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">{item.date}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* 校园公告 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#e587bc]" />
                  <h2 className="font-bold text-gray-800">校园公告</h2>
                </div>
                <a href="#" className="text-sm text-gray-500 hover:text-[#8B4E6B]">更多 &gt;&gt;</a>
              </div>
              <div className="divide-y">
                {notices.map((item, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition group"
                  >
                    <span className="text-sm text-gray-700 truncate group-hover:text-[#8B4E6B]">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{item.date}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 童心教育 */}
      <section id="child-heart" className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#8B4E6B]" />
              <h2 className="text-xl font-bold text-gray-800">童心教育</h2>
              <span className="text-sm text-gray-500 ml-2">核心办学品牌</span>
            </div>
            <a href="#" className="text-sm text-gray-500 hover:text-[#8B4E6B]">更多 &gt;&gt;</a>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {childHeartPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <div
                  key={index}
                  className="group bg-[#f9f9f9] hover:bg-[#8B4E6B] rounded-lg p-5 text-center transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition">
                    <Icon className="h-6 w-6 text-[#8B4E6B] group-hover:text-white transition" />
                  </div>
                  <h3 className="font-medium text-gray-800 group-hover:text-white text-sm mb-1 transition">
                    {path.title}
                  </h3>
                  <p className="text-xs text-[#8B4E6B] group-hover:text-white/80 transition">{path.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 校训 + 科创教育 */}
      <section className="py-8 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 校训 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-[#8B4E6B]" />
                <h2 className="font-bold text-gray-800">校训</h2>
              </div>
              
              <div className="text-center mb-6">
                <h3 
                  className="text-3xl font-bold text-[#8B4E6B] tracking-widest"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  修身·力学·博雅·聪慧
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {schoolMotto.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                      {item.character}
                    </div>
                    <p className="text-xs text-gray-500">{item.meaning}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 block mb-1">教风</span>
                  <span className="text-sm font-medium text-gray-700">身正为范 博学善教</span>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 block mb-1">学风</span>
                  <span className="text-sm font-medium text-gray-700">品行高洁 好学善思</span>
                </div>
              </div>
            </div>

            {/* 科创教育 */}
            <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-5 w-5 text-amber-400" />
                <h2 className="font-bold">科创教育</h2>
                <span className="text-xs text-white/50 ml-2">王牌特色</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 text-sm">龙岩市首个小学少年科学院</span>
                </div>
                <p className="text-sm text-white/60">
                  2025年12月正式成立，中科院谢华安院士指导
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { num: '7', label: '国家级奖项' },
                  { num: '58', label: '省级奖项' },
                  { num: '1', label: '创新之星' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 rounded p-3 text-center">
                    <div className="text-2xl font-bold">{item.num}</div>
                    <div className="text-xs text-white/50">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {['院士科普', '科创竞赛', '跨学科项目', '小院士评选'].map((tag, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-white/10 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 办学荣誉 */}
      <section id="honors" className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#8B4E6B]" />
              <h2 className="text-xl font-bold text-gray-800">办学荣誉</h2>
              <span className="text-sm text-gray-500 ml-2">国家、省、市三级认可</span>
            </div>
            <a href="#" className="text-sm text-gray-500 hover:text-[#8B4E6B]">更多 &gt;&gt;</a>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {honors.map((honor, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg text-center ${
                  honor.year && honor.year.includes('连续') 
                    ? 'bg-[#8B4E6B] text-white' 
                    : 'bg-[#f9f9f9] text-gray-700'
                }`}
              >
                <div className="font-medium text-sm mb-1">{honor.title}</div>
                {honor.year && (
                  <div className={`text-xs ${honor.year.includes('连续') ? 'text-white/70' : 'text-[#8B4E6B]'}`}>
                    {honor.year}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 快速入口 */}
      <section id="quick-links" className="py-8 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-5 w-5 text-[#8B4E6B]" />
            <h2 className="text-xl font-bold text-gray-800">快速入口</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={index} href="/login">
                  <div className="bg-white rounded-lg p-5 hover:shadow-md transition cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#8B4E6B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#8B4E6B] transition">
                        <Icon className="h-6 w-6 text-[#8B4E6B] group-hover:text-white transition" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{link.title}</h3>
                        <p className="text-sm text-gray-500">{link.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 ml-auto group-hover:text-[#8B4E6B] transition" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section className="py-10 bg-[#8B4E6B] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">联系我们</h3>
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4" />
                  <span>福建省龙岩市新罗区龙川东路11号</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4" />
                  <span>0597-2321234</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">办学理念</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                珍视童心，张扬个性，全面发展<br/>
                当有情怀的老师，办有温度的学校
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">关注我们</h3>
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-400">公众号二维码</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-6 bg-[#6B3E5B] text-white/60 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© 2024 福建省龙岩师范附属小学 版权所有</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/80">隐私政策</a>
              <a href="#" className="hover:text-white/80">使用条款</a>
              <a href="#" className="hover:text-white/80">技术支持</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
