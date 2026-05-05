'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  BookOpen,
  Users,
  Lightbulb,
  Palette,
  Star,
  Award,
  Sun,
  Sprout,
  DoorOpen,
  Menu,
  X,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleConfigs, administrativeRoleConfigs } from '@/config/roles';

export type HomeHeaderProps = {
  scrolled: boolean;
};

const teacherDropdown = [
  { href: '/teacher-excellence/profiles', icon: Star, label: '名师风采' },
  { href: '/teacher-excellence/teams', icon: Users, label: '教师团队' },
  { href: '/teacher-excellence/awards', icon: Award, label: '教师获奖' },
];

const studentDropdown = [
  { href: '/student-showcase/virtue', icon: Heart, label: '善行少年' },
  { href: '/student-showcase/wisdom', icon: Lightbulb, label: '求知少年' },
  { href: '/student-showcase/vitality', icon: Sun, label: '阳光少年' },
  { href: '/student-showcase/art', icon: Palette, label: '艺韵少年' },
  { href: '/student-showcase/practice', icon: Sprout, label: '躬行少年' },
];

function DropdownMenu({ items }: { items: typeof teacherDropdown }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      <div className="bg-white rounded-xl shadow-2xl shadow-black/8 border border-gray-100/80 py-1.5 min-w-[150px] overflow-hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#C9A96E]/5 hover:text-[#B89B6E] transition-colors"
          >
            <item.icon className="h-3.5 w-3.5 opacity-60" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HomeHeader({ scrolled }: HomeHeaderProps) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 text-white z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#B89B6E]/95 backdrop-blur-md shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* 主导航行 */}
        <div className="flex items-center justify-between h-16">
          {/* Logo + 校名 */}
          <div className="flex items-center gap-4 shrink-0">
            <div
              className={`rounded-lg p-1 transition-all duration-500 ${
                scrolled ? 'bg-white' : 'bg-white/15 backdrop-blur-sm'
              }`}
            >
              <img src="/logo-school.png" alt="福建省龙岩师范附属小学" className="h-9 w-auto" />
            </div>
            <div className="hidden lg:block">
              <span className="text-[15px] font-medium tracking-wide">福建省龙岩师范附属小学</span>
            </div>
          </div>

          {/* 桌面导航 */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <a
              href="#"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                scrolled ? 'bg-white/12' : ''
              }`}
            >
              首页
            </a>
            <div className="w-px h-4 bg-white/15 mx-1" />
            <Link
              href="/philosophy"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}
            >
              办学理念
            </Link>
            <Link
              href="/leadership"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}
            >
              现任领导
            </Link>
            <div className="w-px h-4 bg-white/15 mx-1" />

            {/* 卓越教师 */}
            <div className="relative group">
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                  scrolled ? 'hover:bg-white/10' : ''
                }`}
              >
                卓越教师
                <ChevronDown className="h-3 w-3 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <DropdownMenu items={teacherDropdown} />
            </div>

            {/* 附小少年 */}
            <div className="relative group">
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                  scrolled ? 'hover:bg-white/10' : ''
                }`}
              >
                附小少年
                <ChevronDown className="h-3 w-3 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <DropdownMenu items={studentDropdown} />
            </div>

            <div className="w-px h-4 bg-white/15 mx-1" />
            <Link
              href="/news"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}
            >
              新闻中心
            </Link>
            <Link
              href="/notices"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}
            >
              校园公告
            </Link>
            <div className="w-px h-4 bg-white/15 mx-1" />
            <Link
              href="/visitor-apply"
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              访客预约
            </Link>
          </nav>

          {/* 右侧：用户/登录 + 移动菜单 */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                <span className="text-sm text-white/80">
                  {user.name}
                  <span className="mx-1.5 text-white/30">·</span>
                  {roleConfigs[user.role]?.name || user.role}
                </span>
                <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                  <Button
                    className={`rounded-lg px-4 h-8 text-sm font-medium transition-all duration-300 ${
                      scrolled
                        ? 'bg-white text-[#A0785A] hover:bg-white/90 shadow-md shadow-black/5'
                        : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                    }`}
                  >
                    进入工作台
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login" className="hidden lg:block">
                <Button
                  className={`rounded-lg px-4 h-8 text-sm font-medium transition-all duration-300 ${
                    scrolled
                      ? 'bg-white text-[#A0785A] hover:bg-white/90 shadow-md shadow-black/5'
                      : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  登录
                </Button>
              </Link>
            )}

            {/* 移动端汉堡菜单 */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单面板 */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#B89B6E]/98 backdrop-blur-md border-t border-white/10 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
            <a href="#" className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">首页</a>
            <Link href="/philosophy" className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>办学理念</Link>
            <Link href="/leadership" className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>现任领导</Link>

            <div className="pl-3 border-l-2 border-white/20 ml-3 space-y-1">
              <p className="px-3 py-1 text-xs text-white/50 uppercase tracking-wider">卓越教师</p>
              {teacherDropdown.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <item.icon className="h-3.5 w-3.5 opacity-60" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pl-3 border-l-2 border-white/20 ml-3 space-y-1">
              <p className="px-3 py-1 text-xs text-white/50 uppercase tracking-wider">附小少年</p>
              {studentDropdown.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <item.icon className="h-3.5 w-3.5 opacity-60" />
                  {item.label}
                </Link>
              ))}
            </div>

            <Link href="/news" className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>新闻中心</Link>
            <Link href="/notices" className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>校园公告</Link>
            <Link href="/visitor-apply" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <DoorOpen className="h-3.5 w-3.5" />
              访客预约
            </Link>

            <div className="border-t border-white/10 pt-3 mt-2">
              {user ? (
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm text-white/80">{user.name} · {roleConfigs[user.role]?.name || user.role}</span>
                  <Link href={user.role === 'parent' ? '/parent' : '/teacher'} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="bg-white text-[#A0785A] hover:bg-white/90 rounded-lg px-4 h-8 text-sm font-medium">进入工作台</Button>
                  </Link>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-white text-[#A0785A] hover:bg-white/90 rounded-lg h-9 text-sm font-medium">
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                    登录系统
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
