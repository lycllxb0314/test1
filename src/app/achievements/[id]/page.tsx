'use client';

import React from 'react';
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
  Trophy
} from 'lucide-react';

// 所有成就数据
const allAchievements: Record<string, {
  title: string;
  image: string;
  date: string;
  summary: string;
  category: string;
  categoryName: string;
  highlights: string[];
  content: string;
  awards: { title: string; level: string }[];
}> = {
  // 科创教育
  s1: {
    title: '少年科学院成立',
    image: '/images/campus/science-academy-opening.png',
    date: '2025年12月',
    summary: '中科院谢华安院士亲自指导，龙岩市首个小学少年科学院正式成立',
    category: 'science',
    categoryName: '科创教育',
    highlights: ['中科院院士指导', '市级首创', '科技创新平台'],
    content: `
      <p>2025年12月，龙岩师范附属小学少年科学院正式成立，这是龙岩市首个小学少年科学院。中国科学院院士谢华安亲临学校，为少年科学院揭牌。</p>
      <br/>
      <p>少年科学院的成立，标志着我校科技创新教育迈上新台阶。学院设有机器人实验室、创客空间、科技展览馆等功能区域，为学生提供全方位的科技创新平台。</p>
      <br/>
      <p>谢华安院士在揭牌仪式上寄语同学们：要保持好奇心，勇于探索，敢于创新，将来为国家科技事业贡献力量。</p>
    `,
    awards: [
      { title: '中科院院士指导', level: '国家级' },
      { title: '龙岩市首个小学少年科学院', level: '市级' },
    ],
  },
  s2: {
    title: '全国学生数字素养大赛',
    image: '/images/campus/robot-award.jpg',
    date: '2025年11月',
    summary: '斩获"创新之星"最高奖项，展现科创教育成果',
    category: 'science',
    categoryName: '科创教育',
    highlights: ['创新之星', '全国级奖项', '数字素养'],
    content: `
      <p>在2025年全国学生数字素养大赛中，我校代表队表现优异，荣获最高荣誉"创新之星"奖项。这是对我校数字素养教育成果的充分肯定。</p>
      <br/>
      <p>大赛期间，参赛学生展示了机器人编程、人工智能应用、创意编程等多个项目，展现了扎实的数字素养基础和创新能力。</p>
      <br/>
      <p>近年来，学校大力推进数字素养教育，开设编程、机器人、人工智能等课程，培养学生的数字化思维和创新能力。</p>
    `,
    awards: [
      { title: '创新之星', level: '国家级' },
      { title: '优秀组织奖', level: '国家级' },
    ],
  },
  s3: {
    title: '机器人编程社团',
    image: '/images/campus/robot-award.jpg',
    date: '常年开设',
    summary: '开设机器人编程、3D打印、无人机等科技创新课程',
    category: 'science',
    categoryName: '科创教育',
    highlights: ['机器人编程', '3D打印', '无人机'],
    content: `
      <p>学校机器人编程社团成立于2018年，经过多年发展，已成为学校特色社团之一。社团开设机器人编程、3D打印、无人机等多个方向的课程。</p>
      <br/>
      <p>社团学员在各级各类比赛中屡获佳绩，共获得国家级奖项7项、省级奖项58项。多名学员被授予"小小科学家"荣誉称号。</p>
      <br/>
      <p>社团注重培养学生的动手能力、逻辑思维能力和团队协作能力，为学生未来的科技创新之路奠定坚实基础。</p>
    `,
    awards: [
      { title: '国家级奖项7项', level: '国家级' },
      { title: '省级奖项58项', level: '省级' },
    ],
  },
  s4: {
    title: '科技节活动',
    image: '/images/campus/classroom-teaching.jpg',
    date: '每年举办',
    summary: '年度科技节展示学生科技创新成果，激发科学探索热情',
    category: 'science',
    categoryName: '科创教育',
    highlights: ['科技创新', '学生作品', '科学探索'],
    content: `
      <p>学校每年举办科技节活动，为学生提供展示科技创新成果的平台。科技节期间，学生们展示自己制作的科技作品，参与科学实验体验活动。</p>
      <br/>
      <p>科技节活动包括科技作品展、科学实验秀、科普讲座、科技竞赛等多个环节，全校师生积极参与，营造浓厚的科技氛围。</p>
      <br/>
      <p>通过科技节活动，激发了学生对科学的兴趣，培养了学生的创新精神和实践能力。</p>
    `,
    awards: [
      { title: '学生参与率100%', level: '全校' },
      { title: '优秀科技作品展示', level: '校级' },
    ],
  },
  // 人文德育
  m1: {
    title: '小目标促成长',
    image: '/images/campus/teacher-day-award.png',
    date: '德育品牌',
    summary: '省级德育典型案例，培养学生良好品德与行为习惯',
    category: 'moral',
    categoryName: '人文德育',
    highlights: ['省级案例', '品德培养', '行为习惯'],
    content: `
      <p>"小目标促成长"是我校德育工作的特色品牌，通过引导学生制定和实现小目标，逐步养成良好的品德和行为习惯。</p>
      <br/>
      <p>该项目被福建省教育厅评为省级德育典型案例，在全省范围内推广。学校通过班会、家校合作等方式，帮助学生制定切实可行的小目标，并跟踪目标的实现情况。</p>
      <br/>
      <p>实践证明，"小目标促成长"德育模式有效提升了学生的自我管理能力和责任意识，受到了家长和社会的广泛好评。</p>
    `,
    awards: [
      { title: '省级德育典型案例', level: '省级' },
      { title: '德育工作创新奖', level: '市级' },
    ],
  },
  m2: {
    title: '少先队活动',
    image: '/images/campus/young-pioneers.png',
    date: '常年开展',
    summary: '丰富多彩的少先队活动，传承红色基因',
    category: 'moral',
    categoryName: '人文德育',
    highlights: ['少先队', '红色教育', '团队活动'],
    content: `
      <p>学校少先队工作扎实有效，常年开展丰富多彩的少先队活动。入队仪式、主题队会、红色教育等活动，培养学生的集体主义精神和爱国主义情怀。</p>
      <br/>
      <p>学校少先队组织健全，设有大队委、中队委等学生干部，培养学生的组织能力和领导能力。</p>
      <br/>
      <p>通过少先队活动，学生们在实践中学习，在体验中成长，传承红色基因，争做时代新人。</p>
    `,
    awards: [
      { title: '少先队工作先进学校', level: '市级' },
      { title: '优秀少先队大队', level: '区级' },
    ],
  },
  m3: {
    title: '演讲征文比赛',
    image: '/images/campus/scarf-ceremony.png',
    date: '多项一等奖',
    summary: '在各级演讲征文比赛中屡获佳绩',
    category: 'moral',
    categoryName: '人文德育',
    highlights: ['演讲比赛', '征文活动', '多项获奖'],
    content: `
      <p>学校注重培养学生的语言表达能力和写作能力，积极组织学生参加各级各类演讲征文比赛。</p>
      <br/>
      <p>近年来，学校学生在市、区级演讲比赛中获得一等奖多项，在征文比赛中更是屡获佳绩。学生们的作品多次在省市级刊物上发表。</p>
      <br/>
      <p>学校通过开展读书活动、写作指导、演讲训练等，全面提升学生的语文素养和表达能力。</p>
    `,
    awards: [
      { title: '市级演讲比赛一等奖', level: '市级' },
      { title: '征文比赛多项获奖', level: '市区级' },
    ],
  },
  m4: {
    title: '社会实践活动',
    image: '/images/campus/school-assembly.png',
    date: '定期开展',
    summary: '组织学生参与社会实践，培养社会责任感',
    category: 'moral',
    categoryName: '人文德育',
    highlights: ['社会实践', '志愿服务', '责任教育'],
    content: `
      <p>学校定期组织学生开展社会实践活动，让学生走出校园，了解社会，培养社会责任感。</p>
      <br/>
      <p>社会实践活动包括参观博物馆、社区志愿服务、环保行动、职业体验等多种形式，拓宽学生视野，增强实践能力。</p>
      <br/>
      <p>通过社会实践活动，学生们学会了关爱他人、服务社会，培养了良好的公民意识和社会责任感。</p>
    `,
    awards: [
      { title: '社会实践先进学校', level: '区级' },
      { title: '优秀志愿服务团队', level: '校级' },
    ],
  },
  // 艺体心理
  a1: {
    title: '校园艺术节',
    image: '/images/campus/art-festival.png',
    date: '每年举办',
    summary: '年度艺术节展示学生艺术才华，营造浓厚艺术氛围',
    category: 'art',
    categoryName: '艺体心理',
    highlights: ['艺术节', '才艺展示', '艺术教育'],
    content: `
      <p>学校每年举办校园艺术节，为期一周的艺术活动让学生充分展示艺术才华。艺术节期间，举办歌唱比赛、舞蹈比赛、书画展览、器乐演奏会等多项活动。</p>
      <br/>
      <p>艺术节是学校艺术教育成果的集中展示，全校学生积极参与，家长和社会各界人士也踊跃参与观摩。</p>
      <br/>
      <p>通过艺术节活动，学校营造了浓厚的艺术氛围，培养了学生的审美情趣和艺术素养。</p>
    `,
    awards: [
      { title: '全国艺术教育先进单位', level: '国家级' },
      { title: '艺术特色学校', level: '市级' },
    ],
  },
  a2: {
    title: '学生艺术团',
    image: '/images/campus/orchestra.png',
    date: '常年训练',
    summary: '合唱团、舞蹈队、管乐团等多个艺术团队，屡获佳绩',
    category: 'art',
    categoryName: '艺体心理',
    highlights: ['艺术团队', '合唱团', '舞蹈队'],
    content: `
      <p>学校建有多个学生艺术团队，包括合唱团、舞蹈队、管乐团、民乐团等。艺术团队由专业教师指导，常年坚持训练。</p>
      <br/>
      <p>各艺术团队在市、区级艺术比赛中屡获佳绩，多次代表学校参加各级各类文艺演出和比赛活动。</p>
      <br/>
      <p>艺术团队为学生提供了展示才华的舞台，培养了学生的艺术素养和团队协作精神。</p>
    `,
    awards: [
      { title: '合唱比赛一等奖', level: '市级' },
      { title: '舞蹈比赛优秀表演奖', level: '区级' },
    ],
  },
  a3: {
    title: '心理健康教育',
    image: '/images/campus/safety-roleplay.png',
    date: '全校覆盖',
    summary: '全国心理健康教育特色学校，守护学生身心健康',
    category: 'art',
    categoryName: '艺体心理',
    highlights: ['心理健康', '心理辅导', '特色学校'],
    content: `
      <p>学校高度重视学生心理健康教育，被评为"全国心理健康教育特色学校"。学校建有专业的心理咨询室，配备专职心理教师。</p>
      <br/>
      <p>学校实施"阳光心灵"工程，开设心理健康课程，开展团体辅导活动，为学生提供个别心理咨询服务。</p>
      <br/>
      <p>学校建立了心理危机干预机制，关注每一位学生的心理健康，确保学生身心健康成长。</p>
    `,
    awards: [
      { title: '全国心理健康教育特色学校', level: '国家级' },
      { title: '心理健康教育示范校', level: '省级' },
    ],
  },
  a4: {
    title: '阳光体育运动',
    image: '/images/campus/sports-start.jpg',
    date: '每日开展',
    summary: '体质健康合格率全市第一梯队，促进学生全面发展',
    category: 'art',
    categoryName: '艺体心理',
    highlights: ['阳光体育', '体质健康', '运动锻炼'],
    content: `
      <p>学校积极落实"阳光体育"运动，确保学生每天体育锻炼时间不少于1小时。学校开设足球、篮球、乒乓球、跳绳等多个体育社团。</p>
      <br/>
      <p>学校每年举办体育节，开展田径运动会、趣味运动会、班级篮球赛等活动，激发学生运动热情。</p>
      <br/>
      <p>学校学生体质健康合格率位居全市第一梯队，多名学生在市区级体育比赛中获奖。</p>
    `,
    awards: [
      { title: '体质健康合格率全市前列', level: '市级' },
      { title: '体育工作先进学校', level: '区级' },
    ],
  },
};

export default function AchievementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const achievement = allAchievements[id];

  if (!achievement) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
        <div className="text-center">
          <p className="text-[#8B5A2B] text-lg">内容不存在</p>
          <Link href="/achievements" className="text-[#D4A574] hover:underline mt-2 inline-block">返回列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, #FDF8F3 100%)' }}>
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-[#D4A574] to-[#C4956A] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/achievements" className="flex items-center gap-2 text-white/90 hover:text-white transition">
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
                  {achievement.categoryName}
                </span>
                <span className="flex items-center gap-1 text-white/80 text-sm">
                  <Calendar className="h-4 w-4" />
                  {achievement.date}
                </span>
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
          <div className="flex flex-wrap gap-2 mb-6">
            {achievement.highlights.map((highlight, index) => (
              <span
                key={index}
                className="bg-[#D4A574]/20 text-[#8B5A2B] px-4 py-1.5 rounded-full text-sm font-medium"
              >
                {highlight}
              </span>
            ))}
          </div>

          {/* 获奖情况 */}
          {achievement.awards.length > 0 && (
            <div className="bg-gradient-to-r from-[#F5EDE4] to-[#E8DDD0]/50 rounded-xl p-5 mb-6">
              <h3 className="flex items-center gap-2 text-[#3D2314] font-bold mb-3">
                <Trophy className="h-5 w-5 text-[#B8860B]" />
                获奖情况
              </h3>
              <div className="flex flex-wrap gap-3">
                {achievement.awards.map((award, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                    <Award className="h-4 w-4 text-[#B8860B]" />
                    <span className="text-sm text-[#3D2314]">{award.title}</span>
                    <span className="text-xs text-[#8B5A2B]/60">({award.level})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 正文内容 */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-[#E8DDD0]/50 mb-8">
            <div 
              className="prose prose-lg max-w-none text-[#3D2314] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: achievement.content }}
            />
          </div>

          {/* 面包屑导航 */}
          <div className="flex items-center gap-2 text-sm text-[#8B5A2B]/60">
            <Link href="/" className="hover:text-[#D4A574]">首页</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/achievements" className="hover:text-[#D4A574]">成果·特色办学</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#3D2314]">{achievement.title}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
