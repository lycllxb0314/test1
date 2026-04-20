'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Lightbulb, Sun, Palette, Sprout, ArrowLeft } from 'lucide-react';
import { CATEGORY_CONFIGS } from '@/types/student-showcase';
import type { CategoryConfig } from '@/types/student-showcase';

const categoryIcons: Record<string, React.ElementType> = {
  virtue: Heart,
  wisdom: Lightbulb,
  vitality: Sun,
  art: Palette,
  practice: Sprout,
};

export default function StudentShowcasePage() {
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
              <h1 className="text-lg font-bold">附小少年</h1>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-3">附小少年</h2>
            <p className="text-white/80 text-lg max-w-xl">
              德智体美劳全面发展，童心校园里每一个闪闪发光的你。
            </p>
          </div>
        </div>
      </section>

      {/* 五育分类入口 */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {CATEGORY_CONFIGS.map((cat: CategoryConfig) => {
            const Icon = categoryIcons[cat.key] || Heart;
            return (
              <Link key={cat.key} href={`/student-showcase/${cat.key}`} className="group">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/50 group-hover:-translate-y-1">
                  <div className={`h-32 bg-gradient-to-br ${cat.gradient} relative flex items-center justify-center`}>
                    <Icon className="h-12 w-12 text-white/90" />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="text-lg font-bold text-[#5C4A3A] mb-1 group-hover:text-[#C9A96E] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[#8B7355] text-sm font-medium mb-2">{cat.subtitle}</p>
                    <p className="text-[#8B7355]/60 text-xs">{cat.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 五育理念说明 */}
      <section className="max-w-5xl mx-auto px-6 mt-20 mb-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-[#5C4A3A] mb-3">五育并举，童心绽放</h2>
          <p className="text-[#8B7355] max-w-2xl mx-auto leading-relaxed">
            学校秉持"珍视童心、张扬个性、全面发展"的办学理念，以德智体美劳五育为径，让每一个孩子都能在童心的田野上自由奔跑、拔节生长。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {CATEGORY_CONFIGS.map((cat: CategoryConfig) => (
            <div key={cat.key} className="text-center p-4">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br ${cat.gradient} mb-3`}>
                {React.createElement(categoryIcons[cat.key] || Heart, { className: 'h-7 w-7 text-white' })}
              </div>
              <h4 className="font-bold text-[#5C4A3A] text-sm mb-1">{cat.name}</h4>
              <p className="text-[#8B7355]/70 text-xs leading-relaxed">{cat.description}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {cat.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-[#FEFBF6] text-[#8B7355] px-2 py-0.5 rounded-full border border-[#C9A96E]/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 页脚 */}
      <footer className="mt-10 py-8 text-center text-[#8B7355]/60 text-sm">
        福建省龙岩师范附属小学 · 附小少年
      </footer>
    </div>
  );
}
