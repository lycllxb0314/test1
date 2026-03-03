'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Newspaper,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// 新闻数据
const newsItems = [
  { title: '我校少年科学院正式成立，中科院谢华安院士出席揭牌仪式', summary: '中国科学院谢华安院士亲临学校，为少年科学院揭牌，激励同学们勇攀科学高峰。', date: '2025-12-15', category: '校园新闻', image: '/images/campus/science-academy-opening.png' },
  { title: '2025年全国学生数字素养大赛斩获"创新之星"最高奖', summary: '我校学子在全国学生数字素养大赛中表现出色，荣获最高荣誉"创新之星"奖项。', date: '2025-11-20', category: '荣誉喜报', image: '/images/campus/art-festival.png' },
  { title: '童心教育实践成果入选福建省小学特色办学标杆案例', summary: '学校"童心教育"办学理念与实践成果获得省级认可，成为全省小学特色办学标杆。', date: '2025-10-15', category: '教育教学', image: '/images/campus/classroom-teaching.jpg' },
  { title: '【学习强国】龙岩师范附小：百年老校的童心教育探索', summary: '学习强国平台专题报道我校百年办学历程与童心教育理念，展现百年名校风采。', date: '2025-12-10', category: '媒体附小', level: '国家级', image: '/images/campus/young-pioneers.png' },
  { title: '【福建日报】传承红色基因，培育时代新人', summary: '福建日报深度报道我校红色教育实践，传承革命精神，培育新时代接班人。', date: '2025-11-28', category: '媒体附小', level: '省级', image: '/images/campus/sports-start.jpg' },
  { title: '【闽西日报】智慧校园建设助力教育高质量发展', summary: '闽西日报报道我校智慧校园建设成果，数字化赋能教育教学，提升办学品质。', date: '2025-11-15', category: '媒体附小', level: '市级', image: '/images/campus/school-assembly.png' },
  { title: '龙岩师范附小庆祝建校112周年系列活动圆满举行', summary: '学校举办建校112周年系列庆祝活动，师生校友共襄盛举，传承百年办学精神。', date: '2025-09-10', category: '校园新闻', image: '/images/campus/school-assembly.png' },
  { title: '我校学生在龙岩市"福籽同心爱中华"演讲比赛中获一等奖', summary: '我校学子在市级演讲比赛中表现优异，荣获一等奖，展现新时代少年风采。', date: '2025-09-05', category: '荣誉喜报', image: '/images/campus/young-pioneers.png' },
];

export default function NewsPage() {
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
              <Link href="/news" className="px-4 py-2 text-sm bg-white/10 rounded-md">新闻中心</Link>
              <Link href="/philosophy" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">办学理念</Link>
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm text-[#8B5A2B]/70 mb-6">
          <Link href="/" className="hover:text-[#8B5A2B]">首页</Link>
          <span>/</span>
          <span className="text-[#3D2314] font-medium">新闻中心</span>
        </div>

        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#D4A574]/20 rounded-xl flex items-center justify-center">
            <Newspaper className="h-5 w-5 text-[#8B5A2B]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>新闻中心</h1>
            <p className="text-sm text-[#8B5A2B]/60">了解学校最新动态与重要资讯</p>
          </div>
        </div>

        {/* 新闻列表 */}
        <div className="space-y-4">
          {newsItems.map((item, index) => (
            <article 
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0]/40 overflow-hidden hover:shadow-lg hover:shadow-[#D4A574]/10 transition-all duration-300 group"
            >
              <div className="flex gap-5 p-5">
                {/* 图片 */}
                <div className="w-48 h-32 rounded-xl overflow-hidden shrink-0 border border-[#E8DDD0]/30">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* 内容 */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.category === '媒体附小' 
                          ? 'bg-[#D4A574] text-white' 
                          : 'bg-[#8B5A2B] text-white'
                      }`}>
                        {item.category === '媒体附小' ? `${item.level}媒体` : item.category}
                      </span>
                      <span className="text-xs text-[#8B5A2B]/50">{item.date}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#3D2314] mb-2 group-hover:text-[#8B5A2B] transition line-clamp-1">
                      {item.title}
                    </h2>
                    <p className="text-sm text-[#8B5A2B]/60 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-[#8B5A2B]/40">点击查看详情</span>
                    <ChevronRight className="h-4 w-4 text-[#D4A574] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button className="w-9 h-9 rounded-lg border border-[#E8DDD0] flex items-center justify-center text-[#8B5A2B] hover:bg-[#FDF8F3] transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="w-9 h-9 rounded-lg bg-[#8B5A2B] text-white font-medium">1</button>
          <button className="w-9 h-9 rounded-lg border border-[#E8DDD0] text-[#8B5A2B] hover:bg-[#FDF8F3] transition">2</button>
          <button className="w-9 h-9 rounded-lg border border-[#E8DDD0] text-[#8B5A2B] hover:bg-[#FDF8F3] transition">3</button>
          <button className="w-9 h-9 rounded-lg border border-[#E8DDD0] flex items-center justify-center text-[#8B5A2B] hover:bg-[#FDF8F3] transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
