'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Heart, Lightbulb, Sun, Palette, Sprout, Quote } from 'lucide-react';
import { CATEGORY_CONFIGS, getCategoryConfig } from '@/types/student-showcase';
import type { StudentShowcase, ShowcaseCategory, CategoryConfig } from '@/types/student-showcase';

const categoryIcons: Record<string, React.ElementType> = {
  virtue: Heart,
  wisdom: Lightbulb,
  vitality: Sun,
  art: Palette,
  practice: Sprout,
};

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as ShowcaseCategory;
  const [items, setItems] = useState<StudentShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>('all');

  const config: CategoryConfig = getCategoryConfig(category);
  const Icon = categoryIcons[category] || Heart;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/student-showcase?category=${category}`);
        const result = await response.json();
        if (result.success && result.data) {
          setItems(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch showcases:', error);
      } finally {
        setLoading(false);
      }
    };
    if (category) fetchData();
  }, [category]);

  const tags = ['all', ...config.tags];
  const filteredItems = activeTag === 'all'
    ? items
    : items.filter(item => item.tags?.includes(activeTag) || item.subtitle === activeTag);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className={`bg-gradient-to-r ${config.gradient} text-white sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/student-showcase" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold flex items-center justify-center gap-2">
                <Icon className="h-5 w-5" /> {config.name}
              </h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="relative h-[200px] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient}`} />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">{config.name}</h2>
                <p className="text-white/80 text-sm">{config.subtitle} · {config.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 标签筛选 */}
      <section className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                activeTag === tag
                  ? `bg-gradient-to-r ${config.gradient} text-white`
                  : 'bg-white text-[#8B7355] border border-[#C9A96E]/20 hover:bg-[#C9A96E]/5'
              }`}
            >
              {tag === 'all' ? '全部' : tag}
            </button>
          ))}
        </div>
      </section>

      {/* 少年卡片列表 */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-center py-20 text-[#8B7355]">加载中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-[#8B7355]/60">暂无数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Link key={item.id} href={`/student-showcase/${category}/${item.id}`}>
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#C9A96E]/10 hover:-translate-y-1 group h-full flex flex-col">
                  {/* 头像区域 */}
                  <div className={`h-44 bg-gradient-to-br ${config.gradient} relative overflow-hidden`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.studentName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-20 w-20 text-white/30" />
                      </div>
                    )}
                    {item.subtitle && (
                      <span className="absolute top-3 right-3 text-xs bg-white/90 text-[#5C4A3A] px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {/* 信息 */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-[#5C4A3A] group-hover:text-[#C9A96E] transition-colors">
                        {item.studentName}
                      </h3>
                      {item.className && (
                        <span className="text-xs bg-[#FEFBF6] text-[#8B7355] px-2 py-0.5 rounded-full border border-[#C9A96E]/10">
                          {item.className}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#8B7355] mb-2">{item.title}</p>
                    <p className="text-sm text-[#5C4A3A]/60 leading-relaxed line-clamp-2 flex-1 mb-3">
                      {item.description}
                    </p>
                    {item.achievements && item.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.achievements.slice(0, 2).map((a, i) => (
                          <span key={i} className="text-xs bg-[#FEFBF6] text-[#8B7355] px-2 py-0.5 rounded-full border border-[#C9A96E]/10">
                            {a}
                          </span>
                        ))}
                        {item.achievements.length > 2 && (
                          <span className="text-xs text-[#8B7355]/50">+{item.achievements.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="py-8 text-center text-[#8B7355]/60 text-sm">
        福建省龙岩师范附属小学 · {config.name}
      </footer>
    </div>
  );
}
