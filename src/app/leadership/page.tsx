'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  UserCircle,
  Mail,
  Phone,
} from 'lucide-react';

// 领导班子数据
const leaders = [
  {
    name: '江立旺',
    title: '党支部书记',
    level: '书记',
    description: '主持学校党支部全面工作，负责学校党建、思想政治工作和精神文明建设。',
    image: '/images/leaders/placeholder.png',
    responsibilities: ['党建工作', '思想政治', '精神文明', '工会工作'],
  },
  {
    name: '赖丽华',
    title: '校长',
    level: '校长',
    description: '主持学校行政全面工作，负责学校发展规划、教育教学改革和师资队伍建设。',
    image: '/images/leaders/placeholder.png',
    responsibilities: ['行政全面工作', '发展规划', '教学改革', '师资建设'],
  },
  {
    name: '林珊舸',
    title: '副校长',
    level: '副校长',
    description: '协助校长工作，分管教务教研工作，负责教学管理、课程建设和教研活动。',
    image: '/images/leaders/placeholder.png',
    responsibilities: ['教务教研', '教学管理', '课程建设', '教研活动'],
  },
  {
    name: '张翠昭',
    title: '副校长',
    level: '副校长',
    description: '协助校长工作，分管德育工作，负责学生管理、班主任队伍建设和家校沟通。',
    image: '/images/leaders/placeholder.png',
    responsibilities: ['德育工作', '学生管理', '班主任建设', '家校沟通'],
  },
  {
    name: '陈祝英',
    title: '副校长',
    level: '副校长',
    description: '协助校长工作，分管总务后勤工作，负责校园安全、后勤保障和资产管理。',
    image: '/images/leaders/placeholder.png',
    responsibilities: ['总务后勤', '校园安全', '后勤保障', '资产管理'],
  },
];

export default function LeadershipPage() {
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
              <Link href="/leadership" className="px-4 py-2 text-sm bg-white/10 rounded-md">现任领导</Link>
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-sm text-[#8B5A2B]/70 mb-6">
          <Link href="/" className="hover:text-[#8B5A2B]">首页</Link>
          <span>/</span>
          <span className="text-[#3D2314] font-medium">现任领导</span>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4A574]" />
            <div className="w-2 h-2 bg-[#D4A574] rounded-full" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4A574]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#3D2314] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
            现任领导
          </h1>
          <p className="text-[#8B5A2B]/70 text-sm max-w-xl mx-auto">
            团结奋进、务实创新的领导班子，引领学校高质量发展
          </p>
        </div>

        {/* 领导列表 */}
        <div className="space-y-6">
          {leaders.map((leader, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-[#E8DDD0]/40 overflow-hidden hover:shadow-lg hover:shadow-[#D4A574]/10 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* 头像区域 */}
                <div className="md:w-48 shrink-0 bg-gradient-to-b from-[#F5EDE4] to-[#E8DDD0]/50 flex items-center justify-center p-6">
                  <div className="relative">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                      <UserCircle className="w-20 h-20 text-[#D4A574]" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#8B5A2B] text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
                      {leader.level}
                    </div>
                  </div>
                </div>
                
                {/* 信息区域 */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#3D2314] mb-1">{leader.name}</h2>
                      <p className="text-[#D4A574] font-medium">{leader.title}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#8B5A2B]/70 leading-relaxed mb-4">
                    {leader.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {leader.responsibilities.map((resp, i) => (
                      <span 
                        key={i}
                        className="text-xs px-3 py-1 bg-[#F5EDE4] text-[#8B5A2B] rounded-full"
                      >
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#8B5A2B]/50">
            以上信息以学校官方公布为准，如有更新请以最新发布为准
          </p>
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
