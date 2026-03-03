'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  BookOpen,
  Users,
  Trophy,
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
  Bell,
  Newspaper,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

// 荣誉
const honors = [
  { title: '全国文明校园', year: '连续8届', highlight: true },
  { title: '福建省示范小学', year: '2018年', highlight: false },
  { title: '全国心理健康教育特色学校', year: '', highlight: false },
  { title: '福建省文明校园', year: '连续8届', highlight: true },
  { title: '全国艺术教育先进单位', year: '', highlight: false },
  { title: '福建省素质教育先进校', year: '', highlight: false },
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      
      {/* 顶部导航 - 使用温暖的棕色 */}
      <header className="bg-[#8B5A2B] text-white shadow-sm">
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
              <a href="#child-heart" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">童心教育</a>
              <a href="#honors" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">办学荣誉</a>
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

      {/* Banner - 温暖的渐变，不要那么深沉 */}
      <section className="bg-gradient-to-r from-[#C4956A] via-[#D4A574] to-[#C4956A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-block bg-white/20 text-white/95 text-xs px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
                福建省示范小学 · 创建于1914年
              </div>
              <h1 
                className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-sm"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                福建省龙岩师范附属小学
              </h1>
              <p className="text-lg text-white/90 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                珍视童心，张扬个性，全面发展
              </p>
              <p className="text-white/70 text-sm">当有情怀的老师，办有温度的学校</p>
            </div>
            
            {/* 数据统计 */}
            <div className="grid grid-cols-2 gap-4 text-center">
              {[
                { num: '60', label: '教学班', unit: '个' },
                { num: '3000+', label: '学生', unit: '' },
                { num: '194', label: '教师', unit: '人' },
                { num: '111', label: '办学历史', unit: '年' },
              ].map((item, i) => (
                <div key={i} className="bg-white/15 rounded-xl p-4 min-w-[100px] backdrop-blur-sm">
                  <div className="text-2xl font-bold">
                    {item.num}<span className="text-sm font-normal">{item.unit}</span>
                  </div>
                  <div className="text-xs text-white/70">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 新闻中心 + 校园公告 - 使用温暖的米色卡片 */}
      <section id="news" className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* 新闻中心 */}
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

            {/* 校园公告 */}
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

      {/* 童心教育 */}
      <section id="child-heart" className="py-10 bg-[#FDF8F3]/70">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#B8860B]" />
              <h2 className="text-xl font-bold text-[#3D2314]">童心教育</h2>
              <span className="text-sm text-[#8B5A2B]/60 ml-2">核心办学品牌</span>
            </div>
            <a href="#" className="text-sm text-[#8B5A2B]/70 hover:text-[#8B5A2B]">更多 &gt;&gt;</a>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {childHeartPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-xl p-5 text-center transition-all cursor-pointer hover:shadow-md border border-[#E8DDD0]/30 hover:border-[#D4A574]/50"
                >
                  <div className="w-12 h-12 bg-[#F5EDE4] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#D4A574]/20 transition">
                    <Icon className="h-6 w-6 text-[#8B5A2B] transition" />
                  </div>
                  <h3 className="font-medium text-[#3D2314] text-sm mb-1">
                    {path.title}
                  </h3>
                  <p className="text-xs text-[#B8860B]">{path.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 校训 + 科创教育 */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 校训 */}
            <div className="bg-white/80 rounded-xl shadow-sm border border-[#E8DDD0]/50 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-[#8B5A2B]" />
                <h2 className="font-bold text-[#3D2314]">校训</h2>
              </div>
              
              <div className="text-center mb-6">
                <h3 
                  className="text-3xl font-bold text-[#8B5A2B] tracking-widest"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  修身·力学·博雅·聪慧
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {schoolMotto.map((item, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="text-3xl font-bold text-[#3D2314] mb-1" 
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {item.character}
                    </div>
                    <p className="text-xs text-[#8B5A2B]/60">{item.meaning}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E8DDD0]/50">
                <div className="text-center p-3 bg-[#FDF8F3] rounded-lg">
                  <span className="text-xs text-[#8B5A2B]/60 block mb-1">教风</span>
                  <span className="text-sm font-medium text-[#3D2314]">身正为范 博学善教</span>
                </div>
                <div className="text-center p-3 bg-[#FDF8F3] rounded-lg">
                  <span className="text-xs text-[#8B5A2B]/60 block mb-1">学风</span>
                  <span className="text-sm font-medium text-[#3D2314]">品行高洁 好学善思</span>
                </div>
              </div>
            </div>

            {/* 科创教育 */}
            <div className="bg-gradient-to-br from-[#3D2314] to-[#5D3A1A] rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-[#D4A574]" />
                <h2 className="font-bold">少年科学院</h2>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">科学启智 · 创新育人</h3>
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
                  <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-[#D4A574]">{item.num}</div>
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
      <section id="honors" className="py-10 bg-[#FDF8F3]/70">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#B8860B]" />
              <h2 className="text-xl font-bold text-[#3D2314]">办学荣誉</h2>
              <span className="text-sm text-[#8B5A2B]/60 ml-2">国家、省、市三级认可</span>
            </div>
            <a href="#" className="text-sm text-[#8B5A2B]/70 hover:text-[#8B5A2B]">更多 &gt;&gt;</a>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {honors.map((honor, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl text-center transition hover:shadow-md ${
                  honor.highlight 
                    ? 'bg-gradient-to-br from-[#D4A574] to-[#C4956A] text-white shadow-sm' 
                    : 'bg-white border border-[#E8DDD0]/50 text-[#3D2314]'
                }`}
              >
                <div className="font-medium text-sm mb-1">{honor.title}</div>
                {honor.year && (
                  <div className={`text-xs ${honor.highlight ? 'text-white/80' : 'text-[#B8860B]'}`}>
                    {honor.year}
                  </div>
                )}
              </div>
            ))}
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

      {/* 联系方式 - 使用温暖的棕色 */}
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

      {/* 页脚 - 使用深棕色 */}
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
