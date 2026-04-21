'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
} from 'lucide-react';
import type { CarouselItem } from './types';

export type HeroCarouselProps = {
  items: CarouselItem[];
  onPlayVideo: (item: CarouselItem) => void;
};

/**
 * HeroCarousel — 门户首页轮播图
 *
 * 自含自动轮播 (5s)、前后翻页、B站视频播放入口。
 */
export function HeroCarousel({ items, onPlayVideo }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 自动轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const goNext = () => setCurrentSlide((prev) => (prev + 1) % items.length);
  const goPrev = () => setCurrentSlide((prev) => (prev - 1 + items.length) % items.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  const handleCarouselClick = (item: CarouselItem) => {
    if ((item.type === 'video' && item.videoUrl) || (item.type === 'bilibili' && item.bilibiliUrl)) {
      onPlayVideo(item);
    }
  };

  return (
    <section className="relative min-h-[500px] md:min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        {items.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />

            {/* B站视频可点击区域 */}
            {item.type === 'bilibili' && item.bilibiliUrl && index === currentSlide && (
              <button
                onClick={() => handleCarouselClick(item)}
                className="absolute inset-0 z-[15] cursor-pointer"
                aria-label="点击播放视频"
              />
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md text-white text-xs px-4 py-1.5 rounded-full mb-5 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-white/90" />
              福建省示范小学 · 创建于1914年
            </div>
            <h1
              className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              福建省龙岩师范附属小学
            </h1>
            <p
              className="text-lg md:text-xl text-white mb-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              珍视童心，张扬个性，全面发展
            </p>
            <p className="text-white/90 text-sm mb-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">当有情怀的老师，办有温度的学校</p>

            {/* 当前轮播项信息 + 视频播放按钮 */}
            <div className="flex items-center gap-4 flex-wrap pointer-events-auto">
              {items[currentSlide] && (
                <>
                  <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 inline-flex items-center gap-3 border border-white/10">
                    {items[currentSlide].tag && (
                      <span className="text-xs bg-gradient-to-r from-[#C9A96E] to-[#B89B6E] text-white px-3 py-1 rounded-full font-medium">
                        {items[currentSlide].tag}
                      </span>
                    )}
                    <span className="text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{items[currentSlide].title}</span>
                    {items[currentSlide].subtitle && (
                      <span className="text-white/70 text-sm">· {items[currentSlide].subtitle}</span>
                    )}
                  </div>

                  {/* B站视频播放按钮 */}
                  {items[currentSlide].type === 'bilibili' && items[currentSlide].bilibiliUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayVideo(items[currentSlide]);
                      }}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition font-medium shadow-lg hover:scale-105 active:scale-95"
                    >
                      <Play className="h-5 w-5 fill-white" />
                      播放视频
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-auto">
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: '60', label: '教学班', unit: '个' },
                { num: '3000+', label: '学生', unit: '' },
                { num: '194', label: '教师', unit: '人' },
                { num: '112', label: '办学历史', unit: '年' },
              ].map((item, i) => (
                <div key={i} className="bg-black/40 backdrop-blur-md rounded-xl p-4 text-center text-white min-w-[90px] border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all duration-300">
                  <div className="text-2xl font-bold tracking-tight">
                    {item.num}<span className="text-sm font-normal ml-0.5">{item.unit}</span>
                  </div>
                  <div className="text-xs text-white/90 mt-1 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 左右箭头 */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20 hover:border-white/40"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20 hover:border-white/40"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 吉祥物指示器 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-end gap-3">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? 'h-12 w-12 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] scale-110'
                : 'h-8 w-8 opacity-50 hover:opacity-75'
            }`}
          >
            <img src="/mascot-white.png?v=2" alt="" className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </section>
  );
}
