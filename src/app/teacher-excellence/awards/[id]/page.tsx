'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Award, Trophy, Medal, Calendar, User } from 'lucide-react';
import type { TeacherAward } from '@/types/teacher-excellence';

const levelConfig: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  '国家级': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: Trophy },
  '省级': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Medal },
  '市级': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Award },
  '区级': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: Award },
};

export default function TeacherAwardDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [award, setAward] = useState<TeacherAward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/teacher-excellence/awards/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setAward(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch award:', error);
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

  if (!award) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FDF8F3 100%)' }}>
        <p className="text-[#8B7355]">未找到该获奖信息</p>
        <Link href="/teacher-excellence/awards" className="text-[#A08060] hover:underline">返回教师获奖</Link>
      </div>
    );
  }

  const config = levelConfig[award.awardLevel] || levelConfig['区级'];
  const LevelIcon = config.icon;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#A08060] to-[#8B6B45] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/teacher-excellence/awards" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回列表</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">获奖详情</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#A08060]/10">
          {/* 奖项等级头部 */}
          <div className={`${config.bg} p-8 text-center border-b ${config.border}`}>
            <LevelIcon className={`h-16 w-16 ${config.text} mx-auto mb-4`} />
            <h2 className="text-2xl font-bold text-[#5C4A3A] mb-2">{award.awardName}</h2>
            <span className={`inline-block text-sm px-4 py-1 rounded-full ${config.bg} ${config.text} border ${config.border}`}>
              {award.awardLevel}
            </span>
          </div>

          <div className="p-8">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-[#FEFBF6] rounded-xl">
                <User className="h-5 w-5 text-[#A08060]" />
                <div>
                  <p className="text-xs text-[#8B7355]">获奖教师</p>
                  <p className="font-medium text-[#5C4A3A]">{award.teacherName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#FEFBF6] rounded-xl">
                <Calendar className="h-5 w-5 text-[#A08060]" />
                <div>
                  <p className="text-xs text-[#8B7355]">获奖时间</p>
                  <p className="font-medium text-[#5C4A3A]">{award.awardDate || '未记录'}</p>
                </div>
              </div>
              {award.subject && (
                <div className="flex items-center gap-3 p-4 bg-[#FEFBF6] rounded-xl">
                  <Award className="h-5 w-5 text-[#A08060]" />
                  <div>
                    <p className="text-xs text-[#8B7355]">学科</p>
                    <p className="font-medium text-[#5C4A3A]">{award.subject}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 详细描述 */}
            {award.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#5C4A3A] mb-3">获奖详情</h3>
                <p className="text-[#5C4A3A]/80 leading-relaxed whitespace-pre-line">{award.description}</p>
              </div>
            )}

            {/* 证书图片 */}
            {award.certificateUrl && (
              <div>
                <h3 className="text-lg font-semibold text-[#5C4A3A] mb-3">荣誉证书</h3>
                <div className="rounded-xl overflow-hidden border border-[#A08060]/10">
                  <img src={award.certificateUrl} alt="荣誉证书" className="w-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
