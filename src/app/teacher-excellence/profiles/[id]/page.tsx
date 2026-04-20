'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, Quote, Award } from 'lucide-react';
import type { TeacherProfile } from '@/types/teacher-excellence';

export default function TeacherProfileDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/teacher-excellence/profiles/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FDF8F3 100%)' }}>
        <p className="text-[#8B7355]">未找到该教师信息</p>
        <Link href="/teacher-excellence/profiles" className="text-[#C9A96E] hover:underline">返回名师风采</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#C9A96E] to-[#B89B6E] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/teacher-excellence/profiles" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回列表</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">{profile.name}</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* 教师详情 */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        {/* 头部信息 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#C9A96E]/10 mb-8">
          <div className="bg-gradient-to-r from-[#C9A96E] to-[#8B7355] h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profile.image || '/images/teachers/placeholder.png'}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="pt-20 px-8 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-[#5C4A3A]">{profile.name}</h2>
              {profile.title && (
                <span className="text-sm bg-[#C9A96E] text-white px-3 py-1 rounded-full">{profile.title}</span>
              )}
            </div>
            {profile.subject && (
              <p className="text-[#8B7355] mb-4">{profile.subject}学科</p>
            )}
            {profile.motto && (
              <div className="flex items-start gap-2 bg-[#FEFBF6] rounded-xl p-4 mb-6 border border-[#C9A96E]/10">
                <Quote className="h-5 w-5 text-[#C9A96E] mt-0.5 flex-shrink-0" />
                <p className="text-[#5C4A3A] italic">{profile.motto}</p>
              </div>
            )}
            {profile.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#5C4A3A] mb-3">教师简介</h3>
                <p className="text-[#5C4A3A]/80 leading-relaxed whitespace-pre-line">{profile.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* 荣誉成就 */}
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#C9A96E]/10">
            <h3 className="text-lg font-semibold text-[#5C4A3A] mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#C9A96E]" />
              荣誉成就
            </h3>
            <div className="space-y-3">
              {profile.achievements.map((achievement, i) => (
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
