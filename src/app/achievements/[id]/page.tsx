'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Sparkles, 
  BookOpen, 
  Music, 
  Award,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Trophy,
  Loader2
} from 'lucide-react';

// 图标名称到组件的映射
const iconMap: Record<string, any> = {
  Sparkles,
  BookOpen,
  Music,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Sparkles;
};

interface AchievementDetail {
  id: string;
  categoryId: string;
  title: string;
  image: string;
  date?: string;
  summary?: string;
  highlights?: string[];
  sortOrder: number;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    tag?: string;
  };
}

// 后备数据
const fallbackAchievements: Record<string, AchievementDetail & { content?: string }> = {
  s1: {
    id: 's1',
    categoryId: 'science',
    title: '少年科学院成立',
    image: '/images/campus/science-academy-opening.png',
    date: '2025年12月',
    summary: '中科院谢华安院士亲自指导，龙岩市首个小学少年科学院正式成立',
    highlights: ['中科院院士指导', '市级首创', '科技创新平台'],
    sortOrder: 1,
    category: { id: 'science', name: '科创教育', slug: 'science', icon: 'Sparkles', tag: '王牌特色' },
    content: `
      <p>2025年12月，龙岩师范附属小学少年科学院正式成立，这是龙岩市首个小学少年科学院。中国科学院院士谢华安亲临学校，为少年科学院揭牌。</p>
      <br/>
      <p>少年科学院的成立，标志着我校科技创新教育迈上新台阶。学院设有机器人实验室、创客空间、科技展览馆等功能区域，为学生提供全方位的科技创新平台。</p>
    `,
  },
  s2: {
    id: 's2',
    categoryId: 'science',
    title: '全国学生数字素养大赛',
    image: '/images/campus/robot-award.jpg',
    date: '2025年11月',
    summary: '斩获"创新之星"最高奖项，展现科创教育成果',
    highlights: ['创新之星', '全国级奖项', '数字素养'],
    sortOrder: 2,
    category: { id: 'science', name: '科创教育', slug: 'science', icon: 'Sparkles', tag: '王牌特色' },
    content: `
      <p>在2025年全国学生数字素养大赛中，我校代表队表现优异，荣获最高荣誉"创新之星"奖项。这是对我校数字素养教育成果的充分肯定。</p>
      <br/>
      <p>大赛期间，参赛学生展示了机器人编程、人工智能应用、创意编程等多个项目，展现了扎实的数字素养基础和创新能力。</p>
    `,
  },
  m1: {
    id: 'm1',
    categoryId: 'moral',
    title: '小目标促成长',
    image: '/images/campus/teacher-day-award.png',
    date: '德育品牌',
    summary: '省级德育典型案例，培养学生良好品德与行为习惯',
    highlights: ['省级案例', '品德培养', '行为习惯'],
    sortOrder: 1,
    category: { id: 'moral', name: '人文德育', slug: 'moral', icon: 'BookOpen', tag: '德育品牌' },
    content: `
      <p>"小目标促成长"是我校德育工作的特色品牌，通过引导学生制定和实现小目标，逐步养成良好的品德和行为习惯。</p>
      <br/>
      <p>该项目被福建省教育厅评为省级德育典型案例，在全省范围内推广。</p>
    `,
  },
  a1: {
    id: 'a1',
    categoryId: 'art',
    title: '校园艺术节',
    image: '/images/campus/art-festival.png',
    date: '每年举办',
    summary: '年度艺术节展示学生艺术才华，营造浓厚艺术氛围',
    highlights: ['艺术节', '才艺展示', '艺术教育'],
    sortOrder: 1,
    category: { id: 'art', name: '艺体心理', slug: 'art', icon: 'Music', tag: '全面发展' },
    content: `
      <p>学校每年举办校园艺术节，为期一周的艺术活动让学生充分展示艺术才华。艺术节期间，举办歌唱比赛、舞蹈比赛、书画展览、器乐演奏会等多项活动。</p>
      <br/>
      <p>艺术节是学校艺术教育成果的集中展示，全校学生积极参与，家长和社会各界人士也踊跃参与观摩。</p>
    `,
  },
};

export default function AchievementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [achievement, setAchievement] = useState<AchievementDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/portal/achievements/${id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setAchievement(result.data);
        } else {
          // 使用后备数据
          setAchievement(fallbackAchievements[id] || null);
        }
      } catch (error) {
        console.error('Failed to fetch achievement detail:', error);
        setAchievement(fallbackAchievements[id] || null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
        <Loader2 className="h-12 w-12 text-[#D4A574] animate-spin" />
      </div>
    );
  }

  if (!achievement) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
        <div className="text-center">
          <p className="text-[#8B5A2B] text-lg">内容不存在</p>
          <Link href="/" className="text-[#D4A574] hover:underline mt-2 inline-block">返回首页</Link>
        </div>
      </div>
    );
  }

  const fallback = fallbackAchievements[id];
  const highlights = achievement.highlights || fallback?.highlights || [];
  const categoryName = achievement.category?.name || fallback?.category?.name || '成果特色';
  const content = fallback?.content || `<p>${achievement.summary || '暂无详细内容'}</p>`;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href={`/achievements?category=${achievement.category?.slug || 'all'}`} className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回列表</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold truncate px-8" style={{ fontFamily: 'var(--font-serif)' }}>
                {achievement.title}
              </h1>
            </div>
            <Link href="/" className="text-white/90 hover:text-white transition text-sm">
              首页
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <article className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* 头图 */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img
              src={achievement.image}
              alt={achievement.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#D4A574] text-[#3D2314] px-3 py-1 rounded-full text-sm font-medium">
                  {categoryName}
                </span>
                {achievement.date && (
                  <span className="flex items-center gap-1 text-white/80 text-sm">
                    <Calendar className="h-4 w-4" />
                    {achievement.date}
                  </span>
                )}
              </div>
              <h2 
                className="text-2xl md:text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {achievement.title}
              </h2>
            </div>
          </div>

          {/* 亮点标签 */}
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {highlights.map((highlight, index) => (
                <span
                  key={index}
                  className="bg-[#D4A574]/20 text-[#8B5A2B] px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}

          {/* 正文内容 */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-[#E8DDD0]/50 mb-8">
            <div 
              className="prose prose-lg max-w-none text-[#3D2314] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          {/* 面包屑导航 */}
          <div className="flex items-center gap-2 text-sm text-[#8B5A2B]/60">
            <Link href="/" className="hover:text-[#D4A574]">首页</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/achievements?category=${achievement.category?.slug || 'all'}`} className="hover:text-[#D4A574]">成果·{categoryName}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#3D2314]">{achievement.title}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
