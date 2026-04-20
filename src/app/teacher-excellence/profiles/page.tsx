'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Quote } from 'lucide-react';
import type { TeacherProfile } from '@/types/teacher-excellence';

export default function TeacherProfilesPage() {
  const [profiles, setProfiles] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/teacher-excellence/profiles');
        const result = await response.json();
        if (result.success && result.data) {
          setProfiles(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#C9A96E] to-[#B89B6E] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/teacher-excellence" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold flex items-center justify-center gap-2">
                <Star className="h-5 w-5" /> 名师风采
              </h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="relative h-[200px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C9A96E] to-[#8B7355]" />
        <div className="absolute inset-0 bg-[url('/images/campus/chinese-teaching-seminar.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">名师风采</h2>
            <p className="text-white/80 max-w-lg">学高为师，身正为范。展示我校特级教师、骨干教师的教学风采与教育理念。</p>
          </div>
        </div>
      </section>

      {/* 教师卡片列表 */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-[#8B7355]">加载中...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 text-[#8B7355]/60">暂无名师风采数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {profiles.map((profile) => (
              <Link key={profile.id} href={`/teacher-excellence/profiles/${profile.id}`}>
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#C9A96E]/10 hover:-translate-y-1 group">
                  <div className="flex">
                    {/* 头像 */}
                    <div className="w-40 flex-shrink-0 bg-gradient-to-b from-[#C9A96E]/20 to-[#C9A96E]/5 flex items-center justify-center p-6">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <img
                          src={profile.image || '/images/teachers/placeholder.png'}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* 信息 */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-[#5C4A3A] group-hover:text-[#C9A96E] transition-colors">
                          {profile.name}
                        </h3>
                        {profile.title && (
                          <span className="text-xs bg-[#C9A96E]/10 text-[#C9A96E] px-2 py-0.5 rounded-full">
                            {profile.title}
                          </span>
                        )}
                      </div>
                      {profile.subject && (
                        <p className="text-sm text-[#8B7355] mb-2">{profile.subject}学科</p>
                      )}
                      <p className="text-sm text-[#5C4A3A]/70 leading-relaxed line-clamp-2 mb-3">
                        {profile.description}
                      </p>
                      {profile.motto && (
                        <div className="flex items-start gap-1 text-[#C9A96E]/80 text-xs italic">
                          <Quote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{profile.motto}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 荣誉标签 */}
                  {profile.achievements && profile.achievements.length > 0 && (
                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                      {profile.achievements.map((achievement, i) => (
                        <span key={i} className="text-xs bg-[#FEFBF6] text-[#8B7355] px-2.5 py-1 rounded-full border border-[#C9A96E]/10">
                          {achievement}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="py-8 text-center text-[#8B7355]/60 text-sm">
        福建省龙岩师范附属小学 · 名师风采
      </footer>
    </div>
  );
}
