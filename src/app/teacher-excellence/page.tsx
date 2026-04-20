'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Users, Award, ArrowLeft } from 'lucide-react';

const categories = [
  {
    title: '名师风采',
    description: '展示我校特级教师、骨干教师的教学风采与教育理念',
    icon: Star,
    href: '/teacher-excellence/profiles',
    color: 'from-[#C9A96E] to-[#B08850]',
    image: '/images/campus/chinese-teaching-seminar.jpg',
  },
  {
    title: '教师团队',
    description: '各学科教研组的风采展示与团队建设成果',
    icon: Users,
    href: '/teacher-excellence/teams',
    color: 'from-[#8B7355] to-[#6B5B45]',
    image: '/images/campus/classroom-teaching.jpg',
  },
  {
    title: '教师获奖',
    description: '我校教师在各级各类比赛与评选中的荣誉成果',
    icon: Award,
    href: '/teacher-excellence/awards',
    color: 'from-[#A08060] to-[#8B6B45]',
    image: '/images/campus/school-assembly.png',
  },
];

export default function TeacherExcellencePage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#C9A96E] to-[#B89B6E] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回首页</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">卓越教师</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="relative h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5C4A3A] to-[#8B7355]" />
        <div className="absolute inset-0 bg-[url('/images/campus/school-assembly.png')] bg-cover bg-center opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">卓越教师</h2>
            <p className="text-white/80 text-lg max-w-xl">
              百年大计，教育为本；教育大计，教师为本。我校拥有一支师德高尚、业务精湛、充满活力的教师队伍。
            </p>
          </div>
        </div>
      </section>

      {/* 分类入口 */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.href} href={cat.href} className="group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#C9A96E]/10 group-hover:-translate-y-1">
                <div className={`h-40 bg-gradient-to-r ${cat.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundImage: `url('${cat.image}')` }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <cat.icon className="h-16 w-16 text-white/80" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#5C4A3A] mb-2 group-hover:text-[#C9A96E] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[#8B7355] text-sm leading-relaxed">{cat.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 页脚 */}
      <footer className="mt-20 py-8 text-center text-[#8B7355]/60 text-sm">
        福建省龙岩师范附属小学 · 卓越教师
      </footer>
    </div>
  );
}
