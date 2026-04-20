'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, UserCircle } from 'lucide-react';
import type { TeacherTeam } from '@/types/teacher-excellence';

export default function TeacherTeamsPage() {
  const [teams, setTeams] = useState<TeacherTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/teacher-excellence/teams');
        const result = await response.json();
        if (result.success && result.data) {
          setTeams(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#8B7355] to-[#6B5B45] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/teacher-excellence" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold flex items-center justify-center gap-2">
                <Users className="h-5 w-5" /> 教师团队
              </h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="relative h-[200px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B7355] to-[#5C4A3A]" />
        <div className="absolute inset-0 bg-[url('/images/campus/classroom-teaching.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">教师团队</h2>
            <p className="text-white/80 max-w-lg">团结协作，共同成长。各学科教研组的风采展示与团队建设成果。</p>
          </div>
        </div>
      </section>

      {/* 团队卡片列表 */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-[#8B7355]">加载中...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 text-[#8B7355]/60">暂无教师团队数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teams.map((team) => (
              <Link key={team.id} href={`/teacher-excellence/teams/${team.id}`}>
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#8B7355]/10 hover:-translate-y-1 group">
                  {/* 团队封面 */}
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={team.image || '/images/campus/school-assembly.png'}
                      alt={team.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-xl font-bold text-white">{team.name}</h3>
                      {team.subject && (
                        <p className="text-white/80 text-sm">{team.subject}学科</p>
                      )}
                    </div>
                  </div>
                  {/* 团队信息 */}
                  <div className="p-6">
                    <p className="text-sm text-[#5C4A3A]/70 leading-relaxed line-clamp-2 mb-4">
                      {team.description}
                    </p>
                    {/* 成员预览 */}
                    {team.members && team.members.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        {team.members.slice(0, 3).map((member, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-[#8B7355]">
                            <UserCircle className="h-4 w-4" />
                            <span>{member.name}</span>
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <span className="text-xs text-[#8B7355]/60">+{team.members.length - 3}人</span>
                        )}
                      </div>
                    )}
                    {/* 成就标签 */}
                    {team.achievements && team.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {team.achievements.slice(0, 3).map((achievement, i) => (
                          <span key={i} className="text-xs bg-[#8B7355]/5 text-[#8B7355] px-2.5 py-1 rounded-full">
                            {achievement}
                          </span>
                        ))}
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
        福建省龙岩师范附属小学 · 教师团队
      </footer>
    </div>
  );
}
