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
  Sparkles,
  DoorOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleConfigs, administrativeRoleConfigs } from '@/config/roles';

export type HomeHeaderProps = {
  scrolled: boolean;
};

/**
 * HomeHeader — 门户首页顶部导航栏
 *
 * 自含 scrolled 监听，对外仅暴露 scrolled prop 以便外部联动。
 * 包含：Logo、导航菜单、卓越教师/附小少年下拉、登录按钮。
 */
export function HomeHeader({ scrolled }: HomeHeaderProps) {
  const { user } = useAuth();

  return (
    <header className={`fixed top-0 left-0 right-0 text-white z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-gradient-to-r from-[#C9A96E] to-[#B89B6E] backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/10'
        : 'border-b border-transparent'
    }`}>
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className={`rounded-lg p-1.5 transition-all duration-500 ${
              scrolled ? 'bg-white' : 'bg-white/15 backdrop-blur-sm'
            }`}>
              <img
                src="/logo-school.png"
                alt="福建省龙岩师范附属小学"
                className="h-9 w-auto"
              />
            </div>
            <div className="hidden md:block border-l border-white/20 pl-6">
              <span className="text-base font-medium">福建省龙岩师范附属小学</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 transition-all duration-500">
            <a href="#" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
              scrolled ? 'bg-white/10' : ''
            }`}>首 页</a>
            <Link href="/philosophy" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
              scrolled ? 'hover:bg-white/10' : ''
            }`}>办学理念</Link>
            <Link href="/leadership" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
              scrolled ? 'hover:bg-white/10' : ''
            }`}>现任领导</Link>

            {/* 卓越教师 - 下拉菜单 */}
            <div className="relative group">
              <Link href="/teacher-excellence" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}>
                卓越教师
              </Link>
              <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[140px]">
                  <Link href="/teacher-excellence/profiles" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Star className="h-4 w-4" /> 名师风采
                  </Link>
                  <Link href="/teacher-excellence/teams" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Users className="h-4 w-4" /> 教师团队
                  </Link>
                  <Link href="/teacher-excellence/awards" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Award className="h-4 w-4" /> 教师获奖
                  </Link>
                </div>
              </div>
            </div>

            {/* 附小少年 - 下拉菜单 */}
            <div className="relative group">
              <Link href="/student-showcase" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
                scrolled ? 'hover:bg-white/10' : ''
              }`}>
                附小少年
              </Link>
              <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[140px]">
                  <Link href="/student-showcase/virtue" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Heart className="h-4 w-4" /> 善行少年
                  </Link>
                  <Link href="/student-showcase/wisdom" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Lightbulb className="h-4 w-4" /> 求知少年
                  </Link>
                  <Link href="/student-showcase/vitality" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Sun className="h-4 w-4" /> 阳光少年
                  </Link>
                  <Link href="/student-showcase/art" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Palette className="h-4 w-4" /> 艺韵少年
                  </Link>
                  <Link href="/student-showcase/practice" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#C9A96E]/5 hover:text-[#C9A96E] transition-colors">
                    <Sprout className="h-4 w-4" /> 躬行少年
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/news" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
              scrolled ? 'hover:bg-white/10' : ''
            }`}>新闻中心</Link>
            <Link href="/notices" className={`px-4 py-2 text-base rounded-md transition-all duration-300 ${
              scrolled ? 'hover:bg-white/10' : ''
            }`}>校园公告</Link>
            <Link href="/visitor-apply" className={`px-4 py-2 text-base rounded-md transition-all duration-300 flex items-center gap-1 ${
              scrolled ? 'hover:bg-white/10' : ''
            }`}><DoorOpen className="h-4 w-4" />访客预约</Link>
          </nav>

          <div className="flex items-center gap-4 transition-all duration-500">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-base">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-white/60">|</span>
                  <span className="text-white/90">
                    {roleConfigs[user.role]?.name || user.role}
                    {user.additionalRoles && user.additionalRoles.length > 0 && (
                      <span className="text-white/70 ml-1">
                        （兼任：{administrativeRoleConfigs[user.additionalRoles[0]]?.name || user.additionalRoles[0]}）
                      </span>
                    )}
                  </span>
                </div>
                <Link href={user.role === 'parent' ? '/parent' : '/teacher'}>
                  <Button className={`rounded-lg px-5 h-10 text-base font-medium transition-all duration-300 ${
                    scrolled
                      ? 'bg-white text-[#A0785A] hover:bg-white/95 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15'
                      : 'bg-transparent text-white hover:bg-white/10'
                  }`}>
                    进入工作台
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button className={`rounded-lg px-5 h-10 text-base font-medium transition-all duration-300 ${
                  scrolled
                    ? 'bg-white text-[#A0785A] hover:bg-white/95 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15'
                    : 'bg-transparent text-white hover:bg-white/10'
                }`}>
                  登录系统
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
