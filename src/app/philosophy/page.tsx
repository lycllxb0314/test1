'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Lightbulb, 
  Palette, 
  Heart, 
  BookHeart, 
  TreePine,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

// 图标名称到组件的映射
const iconMap: Record<string, any> = {
  Shield,
  Lightbulb,
  Palette,
  Heart,
  BookHeart,
  TreePine,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Shield;
};

interface ChildHeartPath {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
}

// 默认数据
const defaultPaths: ChildHeartPath[] = [
  { id: '1', icon: 'Shield', title: '有效德育引领童心', subtitle: '以德育心', image: '/images/campus/scarf-ceremony.png', description: '以德育人，培养学生良好的道德品质' },
  { id: '2', icon: 'Lightbulb', title: '高效课堂发展童心', subtitle: '以智启心', image: '/images/campus/chinese-teaching-seminar.jpg', description: '智慧教学，激发学生的学习潜能' },
  { id: '3', icon: 'Palette', title: '多彩活动点亮童心', subtitle: '以趣悦心', image: '/images/campus/dance-performance.png', description: '丰富活动，培养学生的兴趣爱好' },
  { id: '4', icon: 'Heart', title: '心理健康呵护童心', subtitle: '以爱护心', image: '/images/campus/safety-roleplay.png', description: '心理关怀，守护学生的身心健康' },
  { id: '5', icon: 'BookHeart', title: '快乐阅读涵养童心', subtitle: '以书润心', image: '/images/campus/recitation-grade5.jpg', description: '书香校园，培养学生的阅读习惯' },
  { id: '6', icon: 'TreePine', title: '校园文化润泽童心', subtitle: '以境育心', image: '/images/campus/school-assembly.png', description: '文化熏陶，营造良好的育人环境' },
];

export default function PhilosophyPage() {
  const [paths, setPaths] = useState<ChildHeartPath[]>(defaultPaths);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/portal/philosophy');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setPaths(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch philosophy data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
                理念 · 童心教育
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
            百年传承 · 童心育人
          </h2>
          <p className="text-[#8B5A2B]/80 text-lg">
            "珍视童心，张扬个性，全面发展" —— 以六大路径践行童心教育理念
          </p>
        </div>
      </section>

      {/* 六大路径列表 */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path, index) => {
              const Icon = getIconComponent(path.icon);
              return (
                <Link
                  key={path.id}
                  href={`/philosophy/${path.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-[#E8DDD0]/50 hover:border-[#D4A574]">
                    {/* 图片区域 */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={path.image}
                        alt={path.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      {/* 序号 */}
                      <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#8B5A2B] font-bold shadow-lg">
                        {index + 1}
                      </div>
                      {/* 副标题标签 */}
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-[#D4A574] text-[#3D2314] px-3 py-1 rounded-full text-sm font-medium">
                          {path.subtitle}
                        </span>
                      </div>
                    </div>
                    
                    {/* 内容区域 */}
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-[#F5EDE4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4A574]/20 transition">
                          <Icon className="h-6 w-6 text-[#8B5A2B]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-[#3D2314] text-lg mb-1 group-hover:text-[#8B5A2B] transition">
                            {path.title}
                          </h3>
                          <p className="text-[#8B5A2B]/70 text-sm line-clamp-2">
                            {path.description || '点击查看详情'}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#D4A574] opacity-0 group-hover:opacity-100 transition transform translate-x-0 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
