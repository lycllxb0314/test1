'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  BookOpen,
  Star,
  Award,
  Sparkles,
  Music,
  ChevronRight,
} from 'lucide-react';
import type {
  ChildHeartPathItem,
  SchoolHonor,
  AchievementCategoryState,
} from './types';
import { schoolMotto, defaultChildHeartPaths } from './types';
import { getIconComponent } from './types';

export type PhilosophySectionProps = {
  loading: boolean;
  childHeartPaths: ChildHeartPathItem[];
  honors: SchoolHonor[];
  achievementCategories: AchievementCategoryState[];
};

/**
 * PhilosophySection — 核心叙事板块：百年传承 · 童心育人
 *
 * 包含三个篇章：
 * 1. 源起 · 百年校训
 * 2. 理念 · 童心教育
 * 3. 成果 · 特色办学 + 办学荣誉
 */
export function PhilosophySection({ loading, childHeartPaths, honors, achievementCategories }: PhilosophySectionProps) {
  const [activePath, setActivePath] = useState(0);

  // 童心教育自动切换
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePath((prev) => (prev + 1) % childHeartPaths.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [childHeartPaths.length]);

  return (
    <section id="philosophy" className="py-16 bg-gradient-to-b from-[#FEFBF6] via-[#FDF8F2] to-[#FDF9F3]">
      <div className="max-w-7xl mx-auto px-4">

        {/* 板块标题 */}
        <div className="text-center mb-12">
          <h2
            className="text-2xl md:text-3xl font-bold text-[#5C4A3A] mb-3 tracking-wide"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            百年传承 · 童心育人
          </h2>
          <div className="w-16 h-0.5 bg-[#A0785A] mx-auto mb-3" />
          <p className="text-[#A0785A]/70 text-sm max-w-2xl mx-auto">
            从1914年到今天，我们始终坚守教育的初心，用爱心浇灌每一颗童心
          </p>
        </div>

        {/* ── 第一篇章：源起 · 百年校训 ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5 border-b-2 border-[#A0785A] pb-2">
            <BookOpen className="h-5 w-5 text-[#A0785A]" />
            <h3 className="text-lg font-bold text-[#5C4A3A]" style={{ fontFamily: 'var(--font-serif)' }}>
              源起 · 百年校训
            </h3>
            <span className="text-xs text-[#A0785A]/50 ml-auto">1914年建校</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#E6DDD3]/40 shadow-lg shadow-[#C9A96E]/5 overflow-hidden hover:shadow-xl hover:shadow-[#C9A96E]/10 transition-shadow duration-300">
            <div className="grid md:grid-cols-5">
              {/* 左侧图片 */}
              <div className="relative md:col-span-2 h-56 md:h-72">
                <img
                  src="/images/campus/teacher-group-photo.png"
                  alt="教师风采"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-white/60"></div>
              </div>

              {/* 右侧内容 */}
              <div className="md:col-span-3 p-6 md:p-8">
                <div className="text-center md:text-left mb-6">
                  <h4
                    className="text-2xl md:text-3xl font-bold text-[#A0785A] tracking-[0.2em] mb-2"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    修身 · 力学 · 博雅 · 聪慧
                  </h4>
                  <p className="text-[#A0785A]/60 text-sm">百年校训，代代相传</p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {schoolMotto.map((item, index) => (
                    <div key={index} className="text-center p-3 bg-[#FEFBF6] rounded-xl">
                      <div
                        className="text-2xl font-bold text-[#5C4A3A] mb-1"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {item.character}
                      </div>
                      <p className="text-xs text-[#A0785A]/60">{item.meaning}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-[#FDF9F3]/50 rounded-xl">
                    <BookOpen className="h-5 w-5 text-[#A0785A]" />
                    <div>
                      <span className="text-xs text-[#A0785A]/60 block">教风</span>
                      <span className="text-sm font-medium text-[#5C4A3A]">身正为范 博学善教</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[#FDF9F3]/50 rounded-xl">
                    <Star className="h-5 w-5 text-[#C9A96E]" />
                    <div>
                      <span className="text-xs text-[#A0785A]/60 block">学风</span>
                      <span className="text-sm font-medium text-[#5C4A3A]">品行高洁 好学善思</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 第二篇章：理念 · 童心教育 ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5 border-b-2 border-[#A0785A] pb-2">
            <Heart className="h-5 w-5 text-[#A0785A]" />
            <h3 className="text-lg font-bold text-[#5C4A3A]" style={{ fontFamily: 'var(--font-serif)' }}>
              理念 · 童心教育
            </h3>
            <span className="text-xs text-[#A0785A]/50 ml-auto">核心办学品牌</span>
          </div>

          <div className="bg-white/60 rounded-2xl border border-[#E6DDD3]/30 overflow-hidden">
            <div className="bg-[#FEFBF6]/70 px-6 py-4 border-b border-[#E6DDD3]/30">
              <p className="text-center text-[#A0785A]/80 text-sm">
                &ldquo;珍视童心，张扬个性，全面发展&rdquo; —— 以六大路径践行童心教育理念
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-0 items-center">
              {/* 左侧大图 */}
              <Link href="/philosophy" className="relative h-64 md:h-80 overflow-hidden bg-[#FDF9F3] self-center block">
                <img
                  key={activePath}
                  src={childHeartPaths[activePath].image}
                  alt={childHeartPaths[activePath].title}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#A0785A] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                      点击查看更多
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block text-xs bg-[#C9A96E] text-[#5C4A3A] px-3 py-1 rounded-full mb-2">
                      {childHeartPaths[activePath].subtitle}
                    </span>
                    <p className="text-white text-lg font-medium">{childHeartPaths[activePath].title}</p>
                  </div>
                </div>
              </Link>

              {/* 右侧六宫格 */}
              <div className="grid grid-cols-2 gap-3 p-4 md:p-6">
                {childHeartPaths.map((path, index) => {
                  const Icon = getIconComponent(path.icon);
                  const isActive = index === activePath;
                  return (
                    <div
                      key={path.id || index}
                      onClick={() => setActivePath(index)}
                      className={`p-4 rounded-xl text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A0785A] text-white shadow-lg scale-105'
                          : 'bg-white border border-[#E6DDD3]/50 hover:border-[#C9A96E] hover:shadow-md'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition ${
                        isActive ? 'bg-white/20' : 'bg-[#FDF9F3]'
                      }`}>
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#A0785A]'}`} />
                      </div>
                      <h4 className={`font-medium text-sm mb-1 ${isActive ? 'text-white' : 'text-[#5C4A3A]'}`}>
                        {path.title.replace('引领童心', '').replace('发展童心', '').replace('点亮童心', '').replace('呵护童心', '').replace('涵养童心', '').replace('润泽童心', '')}
                      </h4>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-[#C9A96E]'}`}>{path.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 第三篇章：成果 · 特色与荣誉 ── */}
        <div>
          <div className="flex items-center gap-3 mb-5 border-b-2 border-[#A0785A] pb-2">
            <Award className="h-5 w-5 text-[#A0785A]" />
            <h3 className="text-lg font-bold text-[#5C4A3A]" style={{ fontFamily: 'var(--font-serif)' }}>
              成果 · 特色办学
            </h3>
            <span className="text-xs text-[#A0785A]/50 ml-auto">区域标杆，全国领先</span>
          </div>

          <div className="flex justify-center gap-12">
            {loading ? (
              <div className="flex justify-center gap-12 w-full">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[320px] bg-white/80 rounded-2xl overflow-hidden shadow-lg">
                    <Skeleton className="w-full h-48" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded" />
                      </div>
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-2/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : achievementCategories.length > 0 ? (
              achievementCategories.map((category, index) => {
                const IconComponent = getIconComponent(category.icon);
                const isFirstCard = index === 0;

                if (isFirstCard) {
                  return (
                    <div key={category.id} className="w-[320px] bg-gradient-to-br from-[#5C4A3A] to-[#7A6352] rounded-2xl overflow-hidden text-white flex flex-col shadow-lg">
                      <Link href={`/achievements?category=${category.slug}`} className="relative h-48 block">
                        <img
                          src={category.slug === 'science' ? '/images/campus/robot-award.jpg' : '/images/campus/school-assembly.png'}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#5C4A3A] via-[#5C4A3A]/30 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#5C4A3A] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                            点击查看更多
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-[#C9A96E]" />
                          <span className="font-bold">{category.name}</span>
                          {category.tag && (
                            <span className="text-xs bg-[#C9A96E] text-[#5C4A3A] px-2 py-0.5 rounded-full ml-1">{category.tag}</span>
                          )}
                        </div>
                      </Link>
                      <div className="p-5 flex-1 flex flex-col gap-4">
                        {category.description && (
                          <p className="text-sm text-white/70">{category.description}</p>
                        )}
                        {category.featuredAwardTitle && (
                          <div className="bg-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="h-4 w-4 text-[#C9A96E]" />
                              <span className="text-sm font-medium text-[#C9A96E]">{category.featuredAwardTitle}</span>
                            </div>
                            {category.featuredAwardContent && (
                              <p className="text-lg font-bold">{category.featuredAwardContent}</p>
                            )}
                          </div>
                        )}
                        {category.stats && category.stats.length > 0 && (
                          <div className="flex gap-4 mt-auto">
                            {category.stats.map((stat, statIdx) => (
                              <div key={statIdx} className="bg-white/10 rounded-xl p-3 text-center flex-1">
                                <div className="text-2xl font-bold text-[#C9A96E]">{stat.value}</div>
                                <div className="text-xs text-white/50">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // 其他卡片使用浅色主题
                return (
                  <div key={category.id} className="w-[320px] bg-white/80 rounded-2xl border border-[#E6DDD3]/50 overflow-hidden flex flex-col hover:shadow-lg transition shadow-md">
                    <Link href={`/achievements?category=${category.slug}`} className="relative h-48 block">
                      <img
                        src={category.slug === 'moral' ? '/images/campus/teacher-day-award.png' : category.slug === 'art' ? '/images/campus/orchestra.png' : '/images/campus/school-assembly.png'}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#5C4A3A] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                          点击查看更多
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-white" />
                        <span className="font-bold text-white">{category.name}</span>
                        {category.tag && (
                          <span className="text-xs bg-white/90 text-[#5C4A3A] px-2 py-0.5 rounded-full ml-1">{category.tag}</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      {category.description && (
                        <p className="text-sm text-[#A0785A]/70">{category.description}</p>
                      )}
                      {category.honorsList && category.honorsList.length > 0 && (
                        <div className="space-y-3 mt-1">
                          {category.honorsList.map((honor, honorIdx) => (
                            <div key={honorIdx} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-[#C9A96E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Award className="h-3.5 w-3.5 text-[#C9A96E]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#5C4A3A]">{honor.title}</p>
                                {honor.subtitle && (
                                  <p className="text-xs text-[#A0785A]/60">{honor.subtitle}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* 默认静态数据作为后备 */
              <>
                {/* 科创教育 */}
                <div className="w-[320px] bg-gradient-to-br from-[#5C4A3A] to-[#7A6352] rounded-2xl overflow-hidden text-white flex flex-col shadow-lg">
                  <Link href="/achievements?category=science" className="relative h-48 block">
                    <img src="/images/campus/robot-award.jpg" alt="科创获奖" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#5C4A3A] via-[#5C4A3A]/30 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#5C4A3A] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                        点击查看更多 <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#C9A96E]" />
                      <span className="font-bold">科创教育</span>
                      <span className="text-xs bg-[#C9A96E] text-[#5C4A3A] px-2 py-0.5 rounded-full ml-1">王牌特色</span>
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <p className="text-sm text-white/70">2025年成立龙岩市首个小学少年科学院，中科院谢华安院士亲自指导</p>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-[#C9A96E]" />
                        <span className="text-sm font-medium text-[#C9A96E]">2025年全国学生数字素养大赛</span>
                      </div>
                      <p className="text-lg font-bold">斩获&ldquo;创新之星&rdquo;最高奖项</p>
                    </div>
                    <div className="flex gap-4 mt-auto">
                      <div className="bg-white/10 rounded-xl p-3 text-center flex-1">
                        <div className="text-2xl font-bold text-[#C9A96E]">7</div>
                        <div className="text-xs text-white/50">国家级奖项</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center flex-1">
                        <div className="text-2xl font-bold text-[#C9A96E]">58</div>
                        <div className="text-xs text-white/50">省级奖项</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 人文德育 */}
                <div className="w-[320px] bg-white/80 rounded-2xl border border-[#E6DDD3]/50 overflow-hidden flex flex-col hover:shadow-lg transition shadow-md">
                  <Link href="/achievements?category=moral" className="relative h-48 block">
                    <img src="/images/campus/teacher-day-award.png" alt="人文德育" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#5C4A3A] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                        点击查看更多 <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-white" />
                      <span className="font-bold text-white">人文德育</span>
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <p className="text-sm text-[#A0785A]/70">以&ldquo;小目标促成长&rdquo;为载体，培养学生良好品德与行为习惯</p>
                    <div className="space-y-3 mt-1">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#C9A96E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Award className="h-3.5 w-3.5 text-[#C9A96E]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#5C4A3A]">省级德育典型案例</p>
                          <p className="text-xs text-[#A0785A]/60">&ldquo;小目标促成长&rdquo;育人模式</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#C9A96E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Award className="h-3.5 w-3.5 text-[#C9A96E]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#5C4A3A]">演讲征文比赛</p>
                          <p className="text-xs text-[#A0785A]/60">多项一等奖</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 艺体心理 */}
                <div className="w-[320px] bg-white/80 rounded-2xl border border-[#E6DDD3]/50 overflow-hidden flex flex-col hover:shadow-lg transition shadow-md">
                  <Link href="/achievements?category=art" className="relative h-48 block">
                    <img src="/images/campus/orchestra.png" alt="艺体心理" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#5C4A3A] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white transition shadow-lg">
                        点击查看更多 <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Music className="h-5 w-5 text-white" />
                      <span className="font-bold text-white">艺体心理</span>
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <p className="text-sm text-[#A0785A]/70">艺术体育与心理健康教育并重，促进学生身心全面发展</p>
                    <div className="space-y-3 mt-1">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#C9A96E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Award className="h-3.5 w-3.5 text-[#C9A96E]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#5C4A3A]">全国艺术教育先进单位</p>
                          <p className="text-xs text-[#A0785A]/60">艺术教育成果显著</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#C9A96E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Award className="h-3.5 w-3.5 text-[#C9A96E]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#5C4A3A]">心理健康教育特色学校</p>
                          <p className="text-xs text-[#A0785A]/60">全省领先</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 办学荣誉 */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-32 rounded-full" />
              ))
            ) : honors.map((honor, index) => (
              <div
                key={honor.id || index}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full border border-[#E6DDD3]/50 hover:shadow-md transition"
              >
                <Award className="h-4 w-4 text-[#C9A96E]" />
                <span className="text-sm text-[#5C4A3A]">{honor.title}</span>
                {honor.year && (
                  <span className="text-xs text-[#C9A96E] font-medium">{honor.year}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
