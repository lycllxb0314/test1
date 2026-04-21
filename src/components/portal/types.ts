/**
 * 门户管理共享类型定义
 *
 * 所有子组件共用的类型、常量集中在此，
 * 避免循环依赖，保证类型单一来源。
 */

// ==================== 轮播图 ====================

export type CarouselItemType = 'image' | 'video' | 'bilibili';

export interface CarouselItem {
  id: string;
  type: CarouselItemType;
  image: string;
  video_url?: string;
  bilibili_url?: string;
  bilibili_bvid?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  sort_order: number;
  is_active: boolean;
}

// ==================== 童心教育 ====================

export interface PhilosophyCategory {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  image: string;
  image_key?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface PhilosophyActivity {
  id: string;
  category_id: string;
  title: string;
  image: string;
  image_key?: string;
  date?: string;
  summary?: string;
  content?: string;
  sort_order: number;
  is_active: boolean;
  category?: PhilosophyCategory;
}

// 童心教育板块图标选项
export const philosophyIconOptions = [
  { value: 'Shield', label: '盾牌（德育）' },
  { value: 'Lightbulb', label: '灯泡（智慧）' },
  { value: 'Palette', label: '调色板（艺术）' },
  { value: 'Heart', label: '爱心（心理）' },
  { value: 'BookHeart', label: '书本爱心（阅读）' },
  { value: 'TreePine', label: '松树（环境）' },
];

// ==================== 成果特色 ====================

export interface AchievementCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tag?: string;
  description?: string;
  featured_award_title?: string;
  featured_award_content?: string;
  stats?: Array<{ label: string; value: string }>;
  honors_list?: Array<{ title: string; subtitle: string }>;
  sort_order: number;
  is_active: boolean;
}

export interface AchievementItem {
  id: string;
  category_id: string;
  title: string;
  image: string;
  image_key?: string;
  date?: string;
  summary?: string;
  highlights?: string[];
  sort_order: number;
  is_active: boolean;
  category?: AchievementCategory;
}

// 成果图标选项
export const achievementIconOptions = [
  { value: 'Sparkles', label: '星光（科创）' },
  { value: 'BookOpen', label: '书本（人文）' },
  { value: 'Music', label: '音符（艺体）' },
];

// ==================== 公告新闻 ====================

export type AnnouncementType = 'announcement' | 'news';
export type PublishStatus = 'pending' | 'scheduled' | 'published' | 'unpublished';

export interface AnnouncementItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  type: AnnouncementType;
  category?: string;
  mediaLevel?: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  isExternal: boolean;
  publishStatus: PublishStatus;
  publishedAt?: string;
  scheduledPublishAt?: string;
  autoUnpublish?: boolean;
  autoUnpublishAt?: string;
  unpublishedAt?: string;
  isPinned: boolean;
  pinOrder: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 附小少年 ====================

export interface ShowcaseItem {
  id: string;
  category: string;
  studentName: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  achievements: string[];
  tags: string[];
  className?: string;
  grade?: string;
  sortOrder: number;
  isActive: boolean;
}
