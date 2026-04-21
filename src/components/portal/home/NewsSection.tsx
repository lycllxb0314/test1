'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Newspaper } from 'lucide-react';
import type { NewsItem, NoticeItem } from './types';

export type NewsSectionProps = {
  loading: boolean;
  newsItems: NewsItem[];
  notices: NoticeItem[];
};

/**
 * NewsSection — 新闻中心 + 通知公告
 *
 * 自含新闻大图轮播 (activeNewsIndex)。
 */
export function NewsSection({ loading, newsItems, notices }: NewsSectionProps) {
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);

  // 新闻自动轮播
  useEffect(() => {
    if (newsItems.length === 0) return;
    const timer = setInterval(() => {
      setActiveNewsIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [newsItems.length]);

  return (
    <section id="news" className="py-8 pt-24">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* 左侧：新闻大图轮播 */}
          <div className="rounded-2xl overflow-hidden shadow-lg shadow-[#C9A96E]/10 bg-white flex flex-col">
            {loading ? (
              <div className="min-h-[340px] flex items-center justify-center p-6">
                <div className="w-full space-y-4">
                  <Skeleton className="w-full h-[240px] rounded-xl" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ) : newsItems.length > 0 ? (
              <>
                <div className="relative min-h-[340px]">
                  {newsItems.map((item, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        index === activeNewsIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                  ))}
                  {/* 日期角标 + 标题 */}
                  {newsItems[activeNewsIndex] && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                      <div className="flex items-end gap-3">
                        {newsItems[activeNewsIndex].date && (
                          <div className="bg-[#A0785A] text-white px-3 py-2 rounded-lg text-center shrink-0">
                            <div className="text-2xl font-bold leading-tight">
                              {newsItems[activeNewsIndex].date.split('-')[2] || ''}
                            </div>
                            <div className="text-xs text-white/80">
                              {newsItems[activeNewsIndex].date.split('-')[0]}-{newsItems[activeNewsIndex].date.split('-')[1]}
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 hover:underline cursor-pointer">
                            {newsItems[activeNewsIndex].title}
                          </h3>
                          {newsItems[activeNewsIndex].summary && (
                            <p className="text-white/70 text-sm mt-1 line-clamp-1">{newsItems[activeNewsIndex].summary}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 轮播指示器 */}
                  <div className="absolute bottom-2 right-4 z-20 flex gap-1.5">
                    {newsItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveNewsIndex(index)}
                        className={`transition-all duration-300 rounded-full ${
                          index === activeNewsIndex
                            ? 'w-5 h-1.5 bg-white shadow-sm'
                            : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-[340px] flex items-center justify-center bg-[#FEFBF6]/50">
                <div className="text-center py-8">
                  <Newspaper className="w-12 h-12 text-[#C9A96E]/40 mx-auto mb-3" />
                  <p className="text-[#A0785A]/50 text-sm">暂无新闻内容</p>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：新闻列表 */}
          <div className="bg-white/90 rounded-2xl shadow-lg shadow-[#C9A96E]/5 border border-[#E6DDD3]/40 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b-2 border-[#A0785A] bg-[#FEFBF6]/50">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#A0785A]" />
                <h2 className="font-bold text-[#5C4A3A]">新闻中心</h2>
              </div>
              <Link href="/news" className="text-sm text-[#A0785A]/70 hover:text-[#A0785A]">更多 &gt;&gt;</Link>
            </div>
            <div>
              {loading ? (
                <div className="p-4 space-y-0">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-dashed border-[#E6DDD3]/50">
                      <Skeleton className="h-4 w-48 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  ))}
                </div>
              ) : newsItems.length > 0 ? (
                newsItems.slice(0, 7).map((item, index) => (
                  <Link
                    key={item.id || index}
                    href={item.id ? `/news/${item.id}` : '#'}
                    onClick={(e) => { if (!item.id) { e.preventDefault(); setActiveNewsIndex(index); } }}
                    className="flex items-center justify-between px-4 py-3 border-b border-dashed border-[#E6DDD3]/50 hover:bg-[#FEFBF6]/50 transition group"
                  >
                    <span className="text-sm text-[#5C4A3A] truncate group-hover:text-[#A0785A] flex-1">{item.title}</span>
                    <span className="text-xs text-[#A0785A]/50 ml-3 whitespace-nowrap">{item.date}</span>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Newspaper className="w-10 h-10 text-[#C9A96E]/40 mx-auto mb-2" />
                  <p className="text-[#A0785A]/50 text-sm">暂无新闻</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 通知公告 */}
        <div className="mt-5 bg-white/90 rounded-2xl shadow-lg shadow-[#C9A96E]/5 border border-[#E6DDD3]/40 overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between p-4 border-b-2 border-[#A0785A] bg-[#FEFBF6]/50">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#A0785A]" />
              <h2 className="font-bold text-[#5C4A3A]">通知公告</h2>
            </div>
            <Link href="/notices" className="text-sm text-[#A0785A]/70 hover:text-[#A0785A]">更多 &gt;&gt;</Link>
          </div>
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-[#E6DDD3]/30">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-dashed border-[#E6DDD3]/50">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : notices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-[#E6DDD3]/30">
                {notices.slice(0, 6).map((item, index) => (
                  <Link
                    key={item.id || index}
                    href={item.id ? `/notices/${item.id}` : '#'}
                    className="flex items-center justify-between px-4 py-3 border-b border-dashed border-[#E6DDD3]/50 hover:bg-[#FEFBF6]/50 transition group"
                  >
                    <span className="text-sm text-[#5C4A3A] truncate group-hover:text-[#A0785A] flex-1">{item.title}</span>
                    <span className="text-xs text-[#A0785A]/50 ml-3 whitespace-nowrap">{item.date}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-[#C9A96E]/40 mx-auto mb-2" />
                <p className="text-[#A0785A]/50 text-sm">暂无公告</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
