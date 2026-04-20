'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users, UserCircle, Award, Star } from 'lucide-react';
import type { TeacherTeam } from '@/types/teacher-excellence';

export default function TeacherTeamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [team, setTeam] = useState<TeacherTeam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/teacher-excellence/teams/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setTeam(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch team:', error);
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

  if (!team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FDF8F3 100%)' }}>
        <p className="text-[#8B7355]">未找到该团队信息</p>
        <Link href="/teacher-excellence/teams" className="text-[#8B7355] hover:underline">返回教师团队</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#8B7355] to-[#6B5B45] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/teacher-excellence/teams" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回列表</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold">{team.name}</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* 团队封面 */}
      <section className="relative h-[240px] overflow-hidden">
        <img
          src={team.image || '/images/campus/school-assembly.png'}
          alt={team.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h2 className="text-3xl font-bold mb-1">{team.name}</h2>
          {team.subject && <p className="text-white/80">{team.subject}学科</p>}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {/* 团队介绍 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#8B7355]/10 mb-8">
          <h3 className="text-lg font-semibold text-[#5C4A3A] mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#8B7355]" />
            团队介绍
          </h3>
          <p className="text-[#5C4A3A]/80 leading-relaxed whitespace-pre-line">{team.description}</p>
        </div>

        {/* 团队成员 */}
        {team.members && team.members.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#8B7355]/10 mb-8">
            <h3 className="text-lg font-semibold text-[#5C4A3A] mb-4 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-[#8B7355]" />
              团队成员
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {team.members.map((member, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-[#FEFBF6] rounded-xl border border-[#8B7355]/5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#8B7355]/20 to-[#8B7355]/5 flex items-center justify-center">
                    <UserCircle className="h-7 w-7 text-[#8B7355]/60" />
                  </div>
                  <div>
                    <p className="font-medium text-[#5C4A3A]">{member.name}</p>
                    <p className="text-sm text-[#8B7355]">{member.role} · {member.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 团队荣誉 */}
        {team.achievements && team.achievements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#8B7355]/10">
            <h3 className="text-lg font-semibold text-[#5C4A3A] mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#8B7355]" />
              团队荣誉
            </h3>
            <div className="space-y-3">
              {team.achievements.map((achievement, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#FEFBF6] rounded-lg border border-[#8B7355]/5">
                  <Star className="h-4 w-4 text-[#8B7355] flex-shrink-0" />
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
