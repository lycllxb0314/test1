'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  BookOpen, 
  Music, 
  Award,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

// 特色办学分类
const categories = [
  { id: 'science', name: '科创教育', icon: Sparkles, tag: '王牌特色', color: 'from-[#3D2314] to-[#5D3A1A]' },
  { id: 'moral', name: '人文德育', icon: BookOpen, tag: '德育品牌', color: 'from-[#8B5A2B] to-[#A67C52]' },
  { id: 'art', name: '艺体心理', icon: Music, tag: '全面发展', color: 'from-[#D4A574] to-[#C4956A]' },
];

// 特色项目数据
const achievementsData = {
  science: [
    { id: 's1', title: '少年科学院成立', image: '/images/campus/science-academy-opening.png', date: '2025-12', summary: '中科院谢华安院士亲自指导，龙岩市首个小学少年科学院正式成立', highlights: ['中科院院士指导', '市级首创', '科技创新平台'] },
    { id: 's2', title: '全国学生数字素养大赛', image: '/images/campus/robot-award.jpg', date: '2025-11', summary: '斩获"创新之星"最高奖项，展现科创教育成果', highlights: ['创新之星', '全国级奖项', '数字素养'] },
    { id: 's3', title: '机器人编程社团', image: '/images/campus/robot-award.jpg', date: '常年开设', summary: '开设机器人编程、3D打印、无人机等科技创新课程', highlights: ['机器人编程', '3D打印', '无人机'] },
    { id: 's4', title: '科技节活动', image: '/images/campus/classroom-teaching.jpg', date: '每年举办', summary: '年度科技节展示学生科技创新成果，激发科学探索热情', highlights: ['科技创新', '学生作品', '科学探索'] },
  ],
  moral: [
    { id: 'm1', title: '小目标促成长', image: '/images/campus/teacher-day-award.png', date: '德育品牌', summary: '省级德育典型案例，培养学生良好品德与行为习惯', highlights: ['省级案例', '品德培养', '行为习惯'] },
    { id: 'm2', title: '少先队活动', image: '/images/campus/young-pioneers.png', date: '常年开展', summary: '丰富多彩的少先队活动，传承红色基因', highlights: ['少先队', '红色教育', '团队活动'] },
    { id: 'm3', title: '演讲征文比赛', image: '/images/campus/scarf-ceremony.png', date: '多项一等奖', summary: '在各级演讲征文比赛中屡获佳绩', highlights: ['演讲比赛', '征文活动', '多项获奖'] },
    { id: 'm4', title: '社会实践活动', image: '/images/campus/school-assembly.png', date: '定期开展', summary: '组织学生参与社会实践，培养社会责任感', highlights: ['社会实践', '志愿服务', '责任教育'] },
  ],
  art: [
    { id: 'a1', title: '校园艺术节', image: '/images/campus/art-festival.png', date: '每年举办', summary: '年度艺术节展示学生艺术才华，营造浓厚艺术氛围', highlights: ['艺术节', '才艺展示', '艺术教育'] },
    { id: 'a2', title: '学生艺术团', image: '/images/campus/orchestra.png', date: '常年训练', summary: '合唱团、舞蹈队、管乐团等多个艺术团队，屡获佳绩', highlights: ['艺术团队', '合唱团', '舞蹈队'] },
    { id: 'a3', title: '心理健康教育', image: '/images/campus/safety-roleplay.png', date: '全校覆盖', summary: '全国心理健康教育特色学校，守护学生身心健康', highlights: ['心理健康', '心理辅导', '特色学校'] },
    { id: 'a4', title: '阳光体育运动', image: '/images/campus/sports-start.jpg', date: '每日开展', summary: '体质健康合格率全市第一梯队，促进学生全面发展', highlights: ['阳光体育', '体质健康', '运动锻炼'] },
  ],
};

export default function AchievementsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const activeCategory = categoryParam || 'all';

  const filteredCategories = activeCategory === 'all' 
    ? categories 
    : categories.filter(c => c.id === activeCategory);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回首页</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                成果 · 特色办学
              </h1>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* 主标题区域 */}
      <section className="py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 
            className="text-3xl md:text-4xl font-bold text-[#3D2314] mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            特色办学 · 区域标杆
          </h2>
          <p className="text-[#8B5A2B]/80 text-lg">
            以特色办学引领学校发展，打造区域教育标杆
          </p>
        </div>
      </section>

      {/* 分类筛选 */}
      <section className="pb-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/achievements"
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === 'all' 
                  ? 'bg-[#8B5A2B] text-white shadow-lg' 
                  : 'bg-white text-[#8B5A2B] border border-[#E8DDD0] hover:border-[#D4A574]'
              }`}
            >
              全部
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/achievements?category=${cat.id}`}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeCategory === cat.id 
                    ? 'bg-[#8B5A2B] text-white shadow-lg' 
                    : 'bg-white text-[#8B5A2B] border border-[#E8DDD0] hover:border-[#D4A574]'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 特色内容列表 */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {filteredCategories.map(cat => {
            const Icon = cat.icon;
            const items = achievementsData[cat.id as keyof typeof achievementsData] || [];
            
            return (
              <div key={cat.id} className="mb-12">
                {/* 分类标题 */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#3D2314]">{cat.name}</h3>
                  <span className="text-xs bg-[#D4A574]/20 text-[#8B5A2B] px-3 py-1 rounded-full">{cat.tag}</span>
                </div>

                {/* 项目卡片 */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {items.map(item => (
                    <Link
                      key={item.id}
                      href={`/achievements/${item.id}`}
                      className="group"
                    >
                      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-[#E8DDD0]/50 hover:border-[#D4A574]">
                        {/* 图片 */}
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          <span className="absolute bottom-2 right-2 text-xs text-white/80 bg-black/30 px-2 py-0.5 rounded">
                            {item.date}
                          </span>
                        </div>
                        
                        {/* 内容 */}
                        <div className="p-4">
                          <h4 className="font-bold text-[#3D2314] mb-2 group-hover:text-[#8B5A2B] transition line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-sm text-[#8B5A2B]/70 line-clamp-2 mb-3">
                            {item.summary}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.highlights.slice(0, 2).map((h, i) => (
                              <span key={i} className="text-xs bg-[#F5EDE4] text-[#8B5A2B] px-2 py-0.5 rounded">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 办学荣誉 */}
      <section className="py-8 bg-gradient-to-b from-[#F5EDE4] to-[#FDF8F3]">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-xl font-bold text-[#3D2314] text-center mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            办学荣誉
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { title: '全国文明校园', year: '连续8届' },
              { title: '福建省示范小学', year: '' },
              { title: '全国心理健康教育特色学校', year: '' },
              { title: '全国艺术教育先进单位', year: '' },
            ].map((honor, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#E8DDD0]/50 shadow-sm hover:shadow-md transition"
              >
                <Award className="h-4 w-4 text-[#B8860B]" />
                <span className="text-sm text-[#3D2314]">{honor.title}</span>
                {honor.year && (
                  <span className="text-xs text-[#B8860B] font-medium">{honor.year}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
