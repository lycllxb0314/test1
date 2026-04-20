'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Medal, Trophy } from 'lucide-react';
import type { TeacherAward } from '@/types/teacher-excellence';

const levelColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  '国家级': { bg: 'bg-red-50', text: 'text-red-700', icon: Trophy },
  '省级': { bg: 'bg-amber-50', text: 'text-amber-700', icon: Medal },
  '市级': { bg: 'bg-blue-50', text: 'text-blue-700', icon: Award },
  '区级': { bg: 'bg-green-50', text: 'text-green-700', icon: Award },
};

export default function TeacherAwardsPage() {
  const [awards, setAwards] = useState<TeacherAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/teacher-excellence/awards');
        const result = await response.json();
        if (result.success && result.data) {
          setAwards(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch awards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const levels = ['all', ...Array.from(new Set(awards.map(a => a.awardLevel).filter(Boolean)))];
  const filteredAwards = filterLevel === 'all' ? awards : awards.filter(a => a.awardLevel === filterLevel);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#A08060] to-[#8B6B45] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/teacher-excellence" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold flex items-center justify-center gap-2">
                <Award className="h-5 w-5" /> 教师获奖
              </h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="relative h-[200px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#A08060] to-[#6B5B45]" />
        <div className="absolute inset-0 bg-[url('/images/campus/school-assembly.png')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">教师获奖</h2>
            <p className="text-white/80 max-w-lg">春华秋实，硕果累累。展示我校教师在各级各类评选中的荣誉成果。</p>
          </div>
        </div>
      </section>

      {/* 筛选栏 */}
      <section className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                filterLevel === level
                  ? 'bg-[#A08060] text-white'
                  : 'bg-white text-[#8B7355] border border-[#A08060]/20 hover:bg-[#A08060]/5'
              }`}
            >
              {level === 'all' ? '全部' : level}
            </button>
          ))}
        </div>
      </section>

      {/* 获奖列表 */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-[#8B7355]">加载中...</div>
        ) : filteredAwards.length === 0 ? (
          <div className="text-center py-20 text-[#8B7355]/60">暂无教师获奖数据</div>
        ) : (
          <div className="space-y-4">
            {filteredAwards.map((award) => {
              const config = levelColors[award.awardLevel] || levelColors['区级'];
              const LevelIcon = config.icon;
              return (
                <Link key={award.id} href={`/teacher-excellence/awards/${award.id}`}>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-[#A08060]/5 hover:border-[#A08060]/20 group">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <LevelIcon className={`h-6 w-6 ${config.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#5C4A3A] group-hover:text-[#A08060] transition-colors">
                            {award.awardName}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                            {award.awardLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#8B7355]">
                          <span>{award.teacherName}</span>
                          {award.subject && <span>· {award.subject}</span>}
                          {award.awardDate && <span>· {award.awardDate}</span>}
                        </div>
                        {award.description && (
                          <p className="text-sm text-[#5C4A3A]/60 mt-1 line-clamp-1">{award.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="py-8 text-center text-[#8B7355]/60 text-sm">
        福建省龙岩师范附属小学 · 教师获奖
      </footer>
    </div>
  );
}
