'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Users, Lightbulb, BookOpen } from 'lucide-react';
import { quickLinks } from './types';

/**
 * QuickLinksSection — 智慧校园服务平台入口
 */
export function QuickLinksSection() {
  return (
    <section id="quick-links" className="py-12 bg-gradient-to-b from-[#FDF9F3] to-[#FEFBF6]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8 border-b-2 border-[#A0785A] pb-2">
          <Sparkles className="h-5 w-5 text-[#A0785A]" />
          <h2 className="font-bold text-[#5C4A3A] text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
            智慧校园服务平台
          </h2>
          <span className="text-xs text-[#A0785A]/50 ml-auto">数字化 · 智能化 · 一体化</span>
        </div>

        <div className="flex justify-center gap-8 md:gap-16">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Link key={index} href="/login" className="group text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-[#FDF9F3] rounded-2xl flex items-center justify-center group-hover:bg-[#C9A96E]/20 transition-all duration-300">
                    <Icon className="h-8 w-8 text-[#A0785A] group-hover:text-[#C9A96E] transition" />
                  </div>
                  <span className="text-sm font-medium text-[#5C4A3A] group-hover:text-[#A0785A]">{link.title}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[#A0785A]/60">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>安全认证</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>角色权限</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <span>智能分析</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>数据互通</span>
          </div>
        </div>
      </div>
    </section>
  );
}
