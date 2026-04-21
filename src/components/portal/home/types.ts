/**
 * 门户首页 — 共享类型、默认数据、图标工具
 *
 * 从 page.tsx 提取，供所有子组件和 Hook 复用。
 */

import {
  Heart,
  BookOpen,
  Users,
  Shield,
  Lightbulb,
  Palette,
  BookHeart,
  TreePine,
  Landmark,
  Award,
  Star,
  type LucideIcon,
} from 'lucide-react';

// ─── 类型定义 ───────────────────────────────────────────────

/** 轮播项（前端展示） */
export type CarouselItem = {
  id?: string;
  type: 'image' | 'video' | 'bilibili';
  image: string;
  videoUrl?: string;
  bilibiliUrl?: string;
  bilibiliBvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
};

/** 轮播数据（API 返回） */
export type CarouselData = {
  id: string;
  type: 'image' | 'video' | 'bilibili';
  image: string;
  videoUrl?: string;
  bilibiliUrl?: string;
  bilibiliBvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
};

/** 童心教育路径（前端展示） */
export type ChildHeartPathItem = {
  id?: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
};

/** 童心教育数据（API 返回） */
export type PhilosophyData = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
};

/** 新闻条目 */
export type NewsItem = {
  id?: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  level?: string;
  image: string;
};

/** 通知条目 */
export type NoticeItem = {
  id?: string;
  title: string;
  date: string;
};

/** 办学荣誉（前端展示） */
export type SchoolHonor = {
  id?: string;
  title: string;
  year?: string;
};

/** 荣誉数据（API 返回） */
export type HonorData = {
  id: string;
  title: string;
  year?: string;
};

/** 公告数据（API 返回） */
export type PortalAnnouncement = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  mediaLevel?: string;
  coverImage?: string;
  publishedAt?: string;
};

/** 成果分类数据（API 返回，下划线命名） */
export type AchievementCategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tag?: string;
  description?: string;
  featured_award_title?: string;
  featured_award_content?: string;
  stats?: Array<{ label: string; value: string }>;
  honors_list?: Array<{ title: string; year?: string; subtitle?: string }>;
};

/** 成果分类（前端状态，驼峰命名） */
export type AchievementCategoryState = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tag?: string;
  description?: string;
  featuredAwardTitle?: string;
  featuredAwardContent?: string;
  stats?: Array<{ label: string; value: string }>;
  honorsList?: Array<{ title: string; year?: string; subtitle?: string }>;
};

// ─── 默认数据 ───────────────────────────────────────────────

export const defaultCarouselItems: CarouselItem[] = [
  {
    type: 'bilibili',
    image: '/images/campus/science-academy-opening.png',
    bilibiliUrl: 'https://player.bilibili.com/player.html?bvid=BV1WdPczBEVv&page=1&high_quality=1&danmaku=0&autoplay=1',
    bilibiliBvid: 'BV1WdPczBEVv',
    title: '少年科学院成立',
    subtitle: '中科院谢华安院士亲自指导',
    tag: '科创特色',
  },
  {
    type: 'image',
    image: '/images/campus/art-festival.png',
    title: '校园艺术节',
    subtitle: '全国艺术教育先进单位',
    tag: '艺术教育',
  },
  {
    type: 'image',
    image: '/images/campus/sports-start.jpg',
    title: '阳光体育运动',
    subtitle: '体质健康合格率全市第一梯队',
    tag: '阳光体育',
  },
  {
    type: 'image',
    image: '/images/campus/young-pioneers.png',
    title: '少先队活动',
    subtitle: '有效德育引领童心成长',
    tag: '德育实践',
  },
  {
    type: 'image',
    image: '/images/campus/classroom-teaching.jpg',
    title: '高效课堂',
    subtitle: '高效课堂发展童心智慧',
    tag: '教学特色',
  },
];

export const defaultChildHeartPaths: ChildHeartPathItem[] = [
  { icon: 'Shield', title: '有效德育引领童心', subtitle: '以德育心', image: '/images/campus/scarf-ceremony.png' },
  { icon: 'Lightbulb', title: '高效课堂发展童心', subtitle: '以智启心', image: '/images/campus/chinese-teaching-seminar.jpg' },
  { icon: 'Palette', title: '多彩活动点亮童心', subtitle: '以趣悦心', image: '/images/campus/dance-performance.png' },
  { icon: 'Heart', title: '心理健康呵护童心', subtitle: '以爱护心', image: '/images/campus/safety-roleplay.png' },
  { icon: 'BookHeart', title: '快乐阅读涵养童心', subtitle: '以书润心', image: '/images/campus/recitation-grade5.jpg' },
  { icon: 'TreePine', title: '校园文化润泽童心', subtitle: '以境育心', image: '/images/campus/school-assembly.png' },
];

export const schoolMotto = [
  { character: '修身', meaning: '修身立德' },
  { character: '力学', meaning: '勤奋学习' },
  { character: '博雅', meaning: '博采众长' },
  { character: '聪慧', meaning: '聪敏睿智' },
];

export const defaultHonors: SchoolHonor[] = [
  { title: '全国文明校园', year: '连续8届' },
  { title: '福建省示范小学', year: '' },
  { title: '全国心理健康教育特色学校', year: '' },
  { title: '全国艺术教育先进单位', year: '' },
];

export const quickLinks = [
  { title: '总务后勤', desc: '后勤服务', icon: Landmark },
  { title: '教务教研', desc: '教学管理', icon: BookOpen },
  { title: '德育管理', desc: '学生工作', icon: Heart },
  { title: '教师空间', desc: '个人中心', icon: Users },
];

// ─── 图标工具 ───────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Lightbulb,
  Palette,
  Heart,
  BookHeart,
  TreePine,
  Award,
  Star,
  BookOpen,
  Users,
};

/** 根据图标名称获取图标组件，默认 Shield */
export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Shield;
};
