'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
const defaultPathsData: Record<string, ChildHeartPath> = {
  '1': { id: '1', icon: 'Shield', title: '有效德育引领童心', subtitle: '以德育心', image: '/images/campus/scarf-ceremony.png', description: '以德育人，培养学生良好的道德品质' },
  '2': { id: '2', icon: 'Lightbulb', title: '高效课堂发展童心', subtitle: '以智启心', image: '/images/campus/chinese-teaching-seminar.jpg', description: '智慧教学，激发学生的学习潜能' },
  '3': { id: '3', icon: 'Palette', title: '多彩活动点亮童心', subtitle: '以趣悦心', image: '/images/campus/dance-performance.png', description: '丰富活动，培养学生的兴趣爱好' },
  '4': { id: '4', icon: 'Heart', title: '心理健康呵护童心', subtitle: '以爱护心', image: '/images/campus/safety-roleplay.png', description: '心理关怀，守护学生的身心健康' },
  '5': { id: '5', icon: 'BookHeart', title: '快乐阅读涵养童心', subtitle: '以书润心', image: '/images/campus/recitation-grade5.jpg', description: '书香校园，培养学生的阅读习惯' },
  '6': { id: '6', icon: 'TreePine', title: '校园文化润泽童心', subtitle: '以境育心', image: '/images/campus/school-assembly.png', description: '文化熏陶，营造良好的育人环境' },
};

// 详细内容
const pathDetails: Record<string, { content: string; highlights: string[]; images: string[] }> = {
  '1': {
    content: `
      <p>我校始终坚持"以德育人"的教育理念，将德育工作贯穿于教育教学的全过程。通过少先队活动、主题班会、社会实践等多种形式，培养学生良好的道德品质和行为习惯。</p>
      <br/>
      <p>学校建立了完善的德育体系，包括：行为规范教育、爱国主义教育、集体主义教育、劳动教育、心理健康教育等多个方面。通过"小目标促成长"等特色活动，引导学生从小事做起，逐步养成良好的品德。</p>
      <br/>
      <p>近年来，学校德育工作成效显著，被评为省级德育典型案例，多名学生获得市级以上荣誉称号。</p>
    `,
    highlights: ['省级德育典型案例', '少先队工作先进单位', '行为规范示范学校'],
    images: ['/images/campus/scarf-ceremony.png', '/images/campus/young-pioneers.png'],
  },
  '2': {
    content: `
      <p>学校以"高效课堂"为抓手，积极推进课程改革，构建以学生为中心的教学模式。通过小组合作、探究学习、项目式学习等方式，激发学生的学习兴趣和创新思维。</p>
      <br/>
      <p>我校注重教师专业发展，定期开展教研活动、教学竞赛、课题研究等，不断提升教师的教学水平。学校现有省市级骨干教师30余人，教学能手20余人。</p>
      <br/>
      <p>学校开设了丰富的校本课程，包括阅读课程、思维训练课程、科技创新课程等，满足学生多元化发展需求。</p>
    `,
    highlights: ['高效课堂示范校', '教学改革先进学校', '校本课程开发优秀学校'],
    images: ['/images/campus/chinese-teaching-seminar.jpg', '/images/campus/classroom-teaching.jpg'],
  },
  '3': {
    content: `
      <p>学校秉承"让每个孩子都有展示的舞台"的理念，开展了丰富多彩的课外活动。艺术节、体育节、科技节、读书节等主题活动，为学生提供了展示才华的平台。</p>
      <br/>
      <p>学校开设了合唱团、舞蹈队、美术社、书法社、足球队、篮球队等20多个学生社团，学生参与率达95%以上。艺术团多次在市级以上比赛中获奖。</p>
      <br/>
      <p>学校还注重传统文化教育，开设了剪纸、陶艺、国画等传统艺术课程，让学生在活动中感受中华文化的魅力。</p>
    `,
    highlights: ['全国艺术教育先进单位', '市级艺术特色学校', '学生社团建设先进学校'],
    images: ['/images/campus/dance-performance.png', '/images/campus/art-festival.png'],
  },
  '4': {
    content: `
      <p>学校高度重视学生的心理健康教育，建立了完善的心理健康教育体系。设有专业的心理咨询室，配备专职心理教师，定期开展心理健康课程和团体辅导活动。</p>
      <br/>
      <p>学校实施"阳光心灵"工程，通过心理讲座、心理剧、沙盘游戏等形式，帮助学生认识自我、管理情绪、建立良好的人际关系。</p>
      <br/>
      <p>学校还建立了心理危机干预机制，对有需要的学生进行个别辅导，确保每一位学生都能健康成长。</p>
    `,
    highlights: ['全国心理健康教育特色学校', '心理教育工作先进单位', '阳光校园示范学校'],
    images: ['/images/campus/safety-roleplay.png', '/images/campus/school-assembly.png'],
  },
  '5': {
    content: `
      <p>学校大力推广阅读教育，建立了"书香校园"阅读体系。学校图书馆藏书丰富，各班级设有图书角，学生可以随时随地阅读。</p>
      <br/>
      <p>学校每年举办读书节活动，开展读书分享会、经典诵读比赛、作文大赛等活动，营造浓厚的阅读氛围。学生在各级各类作文比赛中屡获佳绩。</p>
      <br/>
      <p>学校还推进亲子阅读计划，鼓励家长与孩子共同阅读，形成家校共育的良好局面。</p>
    `,
    highlights: ['书香校园示范学校', '阅读推广先进单位', '经典诵读优秀学校'],
    images: ['/images/campus/recitation-grade5.jpg', '/images/campus/classroom-teaching.jpg'],
  },
  '6': {
    content: `
      <p>学校注重校园文化建设，打造"童心教育"特色文化。校园环境优美，处处体现"珍视童心"的办学理念。</p>
      <br/>
      <p>学校建设了校史馆、科技馆、艺术馆等功能场馆，展示学校的发展历程和办学成果。校园内的"童心墙"、"梦想长廊"等文化景观，成为学校亮丽的风景线。</p>
      <br/>
      <p>学校还注重班级文化建设，每个班级都有独特的班级文化，形成了积极向上、和谐温馨的班级氛围。</p>
    `,
    highlights: ['校园文化建设先进单位', '省级文明校园', '最美校园'],
    images: ['/images/campus/school-assembly.png', '/images/campus/young-pioneers.png'],
  },
};

export default function PhilosophyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [pathData, setPathData] = useState<ChildHeartPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/portal/philosophy');
        const result = await response.json();
        if (result.success && result.data) {
          const found = result.data.find((p: ChildHeartPath) => p.id === id);
          if (found) {
            setPathData(found);
          } else {
            // 使用默认数据
            setPathData(defaultPathsData[id] || null);
          }
        } else {
          setPathData(defaultPathsData[id] || null);
        }
      } catch (error) {
        console.error('Failed to fetch philosophy detail:', error);
        setPathData(defaultPathsData[id] || null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A574]"></div>
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
        <div className="text-center">
          <p className="text-[#8B5A2B] text-lg">内容不存在</p>
          <Link href="/philosophy" className="text-[#D4A574] hover:underline mt-2 inline-block">返回列表</Link>
        </div>
      </div>
    );
  }

  const Icon = getIconComponent(pathData.icon);
  const details = pathDetails[id] || { content: '<p>暂无详细内容</p>', highlights: [], images: [] };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/philosophy" className="flex items-center gap-2 text-white/90 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span>返回列表</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                {pathData.title}
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
              src={pathData.image}
              alt={pathData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[#8B5A2B]" />
                </div>
                <div>
                  <span className="bg-[#D4A574] text-[#3D2314] px-3 py-1 rounded-full text-sm font-medium">
                    {pathData.subtitle}
                  </span>
                </div>
              </div>
              <h2 
                className="text-2xl md:text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {pathData.title}
              </h2>
            </div>
          </div>

          {/* 亮点标签 */}
          {details.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {details.highlights.map((highlight, index) => (
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
              dangerouslySetInnerHTML={{ __html: details.content }}
            />
          </div>

          {/* 图片展示 */}
          {details.images.length > 1 && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {details.images.map((img, index) => (
                <div key={index} className="rounded-xl overflow-hidden shadow-md">
                  <img src={img} alt="" className="w-full h-48 object-cover hover:scale-105 transition duration-300" />
                </div>
              ))}
            </div>
          )}

          {/* 面包屑导航 */}
          <div className="flex items-center gap-2 text-sm text-[#8B5A2B]/60">
            <Link href="/" className="hover:text-[#D4A574]">首页</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/philosophy" className="hover:text-[#D4A574]">理念·童心教育</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#3D2314]">{pathData.title}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
