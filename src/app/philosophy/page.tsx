'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lightbulb,
  Palette,
  Heart,
  BookHeart,
  TreePine,
} from 'lucide-react';

// 校训
const schoolMotto = [
  { character: '修身', meaning: '修身立德' },
  { character: '力学', meaning: '勤奋学习' },
  { character: '博雅', meaning: '博采众长' },
  { character: '聪慧', meaning: '聪敏睿智' },
];

// 童心教育六大路径
const childHeartPaths = [
  { icon: Shield, title: '有效德育引领童心', subtitle: '以德育心', desc: '通过有效的德育活动，培养学生良好的道德品质和行为习惯。', image: '/images/campus/scarf-ceremony.png' },
  { icon: Lightbulb, title: '高效课堂发展童心', subtitle: '以智启心', desc: '打造高效课堂，激发学生学习兴趣，发展智力潜能。', image: '/images/campus/chinese-teaching-seminar.jpg' },
  { icon: Palette, title: '多彩活动点亮童心', subtitle: '以趣悦心', desc: '开展丰富多彩的校园活动，让学生在活动中快乐成长。', image: '/images/campus/dance-performance.png' },
  { icon: Heart, title: '心理健康呵护童心', subtitle: '以爱护心', desc: '关注学生心理健康，提供专业的心理辅导和关怀。', image: '/images/campus/safety-roleplay.png' },
  { icon: BookHeart, title: '快乐阅读涵养童心', subtitle: '以书润心', desc: '营造浓厚的阅读氛围，培养学生良好的阅读习惯。', image: '/images/campus/recitation-grade5.jpg' },
  { icon: TreePine, title: '校园文化润泽童心', subtitle: '以境育心', desc: '建设优美的校园环境，让每一面墙壁都会说话。', image: '/images/campus/school-assembly.png' },
];

// 办学荣誉
const honors = [
  { title: '全国文明校园', year: '连续8届', icon: '🏆' },
  { title: '福建省示范小学', year: '', icon: '⭐' },
  { title: '全国心理健康教育特色学校', year: '', icon: '💚' },
  { title: '全国艺术教育先进单位', year: '', icon: '🎨' },
  { title: '福建省基础教育改革示范校', year: '', icon: '📚' },
  { title: '龙岩市素质教育先进学校', year: '', icon: '🌟' },
];

export default function PhilosophyPage() {
  const [activePath, setActivePath] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePath((prev) => (prev + 1) % childHeartPaths.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE4]">
      {/* 顶部导航 */}
      <header className="sticky top-0 bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white z-50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/" className="bg-white rounded-lg p-1.5">
                <img src="/logo-school.png" alt="福建省龙岩师范附属小学" className="h-8 w-auto" />
              </Link>
              <div className="hidden md:block border-l border-white/20 pl-6">
                <span className="text-sm font-medium">福建省龙岩师范附属小学</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">首 页</Link>
              <Link href="/philosophy" className="px-4 py-2 text-sm bg-white/10 rounded-md">办学理念</Link>
              <Link href="/leadership" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">现任领导</Link>
              <Link href="/news" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">新闻中心</Link>
              <Link href="/notices" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">校园公告</Link>
            </nav>

            <Link href="/login">
              <Button className="bg-white text-[#8B5A2B] hover:bg-white/95 rounded-lg px-5 h-9 text-sm font-medium shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
                登录系统
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main>
        {/* 学校简介 */}
        <section className="py-16 bg-gradient-to-b from-[#FDF8F3] to-[#FAF6F0]">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#D4A574]" />
              <div className="w-3 h-3 bg-[#D4A574] rounded-full" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#D4A574]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#3D2314] mb-4 tracking-wide" style={{ fontFamily: 'var(--font-serif)' }}>
              百年传承 · 童心育人
            </h1>
            <p className="text-[#8B5A2B]/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              从1914年到今天，福建省龙岩师范附属小学始终坚守教育的初心，
              以"珍视童心，张扬个性，全面发展"为办学理念，
              用爱心浇灌每一颗童心，培育时代新人。
            </p>
            <div className="w-24 h-px bg-[#D4A574]/30 mx-auto" />
          </div>
        </section>

        {/* 校训 */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3D2314] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                校训
              </h2>
              <p className="text-sm text-[#8B5A2B]/60">百年传承，代代相传</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-lg shadow-[#D4A574]/10 border border-[#E8DDD0]/40 p-8">
              <div className="text-center mb-8">
                <h3 
                  className="text-3xl md:text-4xl font-bold text-[#8B5A2B] tracking-[0.3em] mb-3"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  修身 · 力学 · 博雅 · 聪慧
                </h3>
                <p className="text-[#8B5A2B]/50 text-sm">百年校训，代代相传</p>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {schoolMotto.map((item, index) => (
                  <div key={index} className="text-center p-4 bg-[#FDF8F3] rounded-2xl hover:bg-[#F5EDE4] transition">
                    <div 
                      className="text-3xl font-bold text-[#3D2314] mb-2" 
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {item.character}
                    </div>
                    <div className="text-xs text-[#8B5A2B]/70">{item.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 童心教育六大路径 */}
        <section className="py-12 bg-gradient-to-b from-[#FAF6F0] to-[#FDF8F3]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-[#3D2314] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                童心教育六大路径
              </h2>
              <p className="text-sm text-[#8B5A2B]/60">"珍视童心，张扬个性，全面发展"</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* 左侧大图 */}
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                {childHeartPaths.map((path, index) => {
                  const Icon = path.icon;
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        index === activePath ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      <img
                        src={path.image}
                        alt={path.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-white" />
                          <span className="text-xs text-white/80">{path.subtitle}</span>
                        </div>
                        <h3 className="text-white text-xl font-bold">{path.title}</h3>
                        <p className="text-white/80 text-sm mt-2">{path.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 右侧六宫格 */}
              <div className="grid grid-cols-2 gap-4">
                {childHeartPaths.map((path, index) => {
                  const Icon = path.icon;
                  const isActive = index === activePath;
                  return (
                    <div
                      key={index}
                      onClick={() => setActivePath(index)}
                      className={`p-5 rounded-2xl cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-[#8B5A2B] text-white shadow-lg scale-105' 
                          : 'bg-white border border-[#E8DDD0]/50 hover:border-[#D4A574] hover:shadow-md'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        isActive ? 'bg-white/20' : 'bg-[#F5EDE4]'
                      }`}>
                        <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-[#8B5A2B]'}`} />
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${isActive ? 'text-white' : 'text-[#3D2314]'}`}>
                        {path.title.replace('引领童心', '').replace('发展童心', '').replace('点亮童心', '').replace('呵护童心', '').replace('涵养童心', '').replace('润泽童心', '')}
                      </h4>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-[#D4A574]'}`}>
                        {path.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 办学荣誉 */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#3D2314] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                办学荣誉
              </h2>
              <p className="text-sm text-[#8B5A2B]/60">百年积淀，硕果累累</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {honors.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-5 border border-[#E8DDD0]/40 hover:shadow-lg hover:shadow-[#D4A574]/10 transition-all duration-300 text-center group"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-[#3D2314] mb-1">{item.title}</h3>
                  {item.year && (
                    <p className="text-xs text-[#D4A574] font-medium">{item.year}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="py-8 bg-gradient-to-r from-[#A67C52] via-[#9B7530] to-[#8B6914] text-white/80 text-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 福建省龙岩师范附属小学 版权所有</p>
        </div>
      </footer>
    </div>
  );
}
