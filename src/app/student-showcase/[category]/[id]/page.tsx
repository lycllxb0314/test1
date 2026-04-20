'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Heart, Lightbulb, Sun, Palette, Sprout, Star, Award } from 'lucide-react';
import { getCategoryConfig } from '@/types/student-showcase';
import type { StudentShowcase, ShowcaseCategory, CategoryConfig } from '@/types/student-showcase';

const categoryIcons: Record<string, React.ElementType> = {
  virtue: Heart,
  wisdom: Lightbulb,
  vitality: Sun,
  art: Palette,
  practice: Sprout,
};

export default function ShowcaseDetailPage() {
  const params = useParams();
  const category = params.category as ShowcaseCategory;
  const id = params.id as string;
  const [item, setItem] = useState<StudentShowcase | null>(null);
  const [loading, setLoading] = useState(true);

  const config: CategoryConfig = getCategoryConfig(category);
  const Icon = categoryIcons[category] || Heart;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/student-showcase/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setItem(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch showcase:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FDF8F3 100%)' }}>
        <p className="text-[#8B7355]">加载中...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FDF8F3 100%)' }}>
        <p className="text-[#8B7355]">未找到该信息</p>
        <Link href={`/student-showcase/${category}`} className="text-[#C9A96E] hover:underline">返回列表</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className={`bg-gradient-to-r ${config.gradient} text-white sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href={`/student-showcase/${category}`} className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回列表</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">{item.studentName}</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {/* 头部信息 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#C9A96E]/10 mb-8">
          <div className={`bg-gradient-to-r ${config.gradient} h-32 relative`}>
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#FEFBF6] to-[#FFF8F0]">
                    <Icon className="h-14 w-14 text-[#8B7355]/30" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="pt-20 px-8 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-[#5C4A3A]">{item.studentName}</h2>
              {item.subtitle && (
                <span className={`text-sm bg-gradient-to-r ${config.gradient} text-white px-3 py-1 rounded-full`}>{item.subtitle}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8B7355] mb-4">
              {item.className && <span>{item.className}</span>}
              {item.grade && <span>· {item.grade}</span>}
            </div>
            <p className="text-lg font-medium text-[#5C4A3A] mb-2">{item.title}</p>
            {item.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#5C4A3A] mb-3">事迹介绍</h3>
                <p className="text-[#5C4A3A]/80 leading-relaxed whitespace-pre-line">{item.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* 荣誉成就 */}
        {item.achievements && item.achievements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#C9A96E]/10">
            <h3 className="text-lg font-semibold text-[#5C4A3A] mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#C9A96E]" />
              荣誉成就
            </h3>
            <div className="space-y-3">
              {item.achievements.map((achievement, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#FEFBF6] rounded-lg border border-[#C9A96E]/5">
                  <Star className="h-4 w-4 text-[#C9A96E] flex-shrink-0" />
                  <span className="text-[#5C4A3A]">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
