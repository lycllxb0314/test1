'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// 公告数据
const notices = [
  { title: '2026年春季学期开学通知', date: '2026-02-01', type: '重要通知', content: '根据上级教育部门安排，我校2026年春季学期定于2月16日正式开学。请各位家长提前做好开学准备工作，确保学生按时返校。' },
  { title: '寒假安全致家长一封信', date: '2026-01-15', type: '安全提醒', content: '寒假即将来临，为确保学生度过一个安全、愉快的假期，请家长配合做好安全教育工作，注意交通安全、消防安全、网络安全等。' },
  { title: '期末考试安排及寒假放假通知', date: '2026-01-10', type: '教学安排', content: '本学期期末考试定于1月15日至17日进行，寒假放假时间为1月20日至2月15日。请家长督促学生做好复习准备。' },
  { title: '2025-2026学年第一学期期末工作安排', date: '2026-01-05', type: '工作安排', content: '各年级组、教研组需在期末前完成学期工作总结、教学资料整理归档等工作，确保期末各项工作有序进行。' },
  { title: '关于开展校园安全检查的通知', date: '2025-12-20', type: '安全通知', content: '为确保校园安全，学校将于12月25日开展全校安全大检查，请各部门提前做好自查工作，消除安全隐患。' },
  { title: '元旦放假安排通知', date: '2025-12-18', type: '放假通知', content: '根据国家法定节假日安排，2026年元旦放假时间为1月1日至3日，共3天。请各部门做好值班安排。' },
  { title: '关于组织教师参加市级培训的通知', date: '2025-12-10', type: '教师培训', content: '根据市教育局安排，我校将组织骨干教师参加市级新课程标准培训，请相关教师做好参训准备。' },
  { title: '冬季传染病预防温馨提示', date: '2025-12-05', type: '健康提示', content: '冬季是流感等传染病高发季节，请家长注意孩子个人卫生，保持室内通风，如发现发热等症状请及时就医并报告学校。' },
];

export default function NoticesPage() {
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
              <Link href="/philosophy" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">办学理念</Link>
              <Link href="/leadership" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">现任领导</Link>
              <Link href="/news" className="px-4 py-2 text-sm hover:bg-white/10 rounded-md transition">新闻中心</Link>
              <Link href="/notices" className="px-4 py-2 text-sm bg-white/10 rounded-md">校园公告</Link>
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm text-[#8B5A2B]/70 mb-6">
          <Link href="/" className="hover:text-[#8B5A2B]">首页</Link>
          <span>/</span>
          <span className="text-[#3D2314] font-medium">校园公告</span>
        </div>

        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#D4A574]/20 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#8B5A2B]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3D2314]" style={{ fontFamily: 'var(--font-serif)' }}>校园公告</h1>
            <p className="text-sm text-[#8B5A2B]/60">学校重要通知与公告信息</p>
          </div>
        </div>

        {/* 公告列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0]/40 overflow-hidden">
          {notices.map((item, index) => (
            <article 
              key={index}
              className="p-5 border-b border-[#E8DDD0]/30 last:border-b-0 hover:bg-[#FDF8F3]/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A574]/20 text-[#8B5A2B] font-medium">
                      {item.type}
                    </span>
                    <span className="text-xs text-[#8B5A2B]/50">{item.date}</span>
                  </div>
                  <h2 className="text-base font-bold text-[#3D2314] mb-2 group-hover:text-[#8B5A2B] transition">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[#8B5A2B]/60 line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#D4A574] opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
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
