/**
 * 附小少年模块类型定义
 *
 * 五大类别：善行少年 / 求知少年 / 阳光少年 / 艺韵少年 / 躬行少年
 * 对应德智体美劳五育 + 童心教育理念
 */

// ==================== 类别配置 ====================

type ShowcaseCategory = 'virtue' | 'wisdom' | 'vitality' | 'art' | 'practice';

type CategoryConfig = {
  key: ShowcaseCategory;
  name: string;
  subtitle: string;
  description: string;
  gradient: string;
  tags: string[];
};

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'virtue',
    name: '善行少年',
    subtitle: '德育之花',
    description: '以德润心，行善致远',
    gradient: 'from-[#D4919A] to-[#C07A84]',
    tags: ['志愿服务', '品德之星', '少先队活动'],
  },
  {
    key: 'wisdom',
    name: '求知少年',
    subtitle: '智慧之光',
    description: '以智启心，学海无涯',
    gradient: 'from-[#5A9ABF] to-[#4887A8]',
    tags: ['学科竞赛', '科技创新', '阅读之星'],
  },
  {
    key: 'vitality',
    name: '阳光少年',
    subtitle: '活力之姿',
    description: '以体健心，阳光向上',
    gradient: 'from-[#E5A83B] to-[#D09530]',
    tags: ['体育赛事', '运动健将', '健康达人'],
  },
  {
    key: 'art',
    name: '艺韵少年',
    subtitle: '审美之趣',
    description: '以美育心，艺韵悠长',
    gradient: 'from-[#C07A84] to-[#A86570]',
    tags: ['书画作品', '音乐表演', '艺术风采'],
  },
  {
    key: 'practice',
    name: '躬行少年',
    subtitle: '实践之力',
    description: '以劳立心，躬行致远',
    gradient: 'from-[#6DAF6C] to-[#5A9C59]',
    tags: ['劳动技能', '研学旅行', '生活达人'],
  },
];

function getCategoryConfig(key: ShowcaseCategory): CategoryConfig {
  return CATEGORY_CONFIGS.find(c => c.key === key) || CATEGORY_CONFIGS[0];
}

// ==================== 业务类型 ====================

type StudentShowcase = {
  id: string;
  category: ShowcaseCategory;
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
  createdAt: string;
  updatedAt?: string;
};

type StudentShowcaseFormData = {
  category: ShowcaseCategory;
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
};

// ==================== 数据库行类型（下划线命名） ====================

type StudentShowcaseRow = {
  id: string;
  category: ShowcaseCategory;
  student_name: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  achievements: string[];
  tags: string[];
  class_name?: string;
  grade?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

// ==================== 转换函数 ====================

function mapRowToModel(row: StudentShowcaseRow): StudentShowcase {
  return {
    id: row.id,
    category: row.category,
    studentName: row.student_name,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    image: row.image,
    achievements: row.achievements || [],
    tags: row.tags || [],
    className: row.class_name,
    grade: row.grade,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapModelToRow(data: Partial<StudentShowcaseFormData>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.category !== undefined) row.category = data.category;
  if (data.studentName !== undefined) row.student_name = data.studentName;
  if (data.title !== undefined) row.title = data.title;
  if (data.subtitle !== undefined) row.subtitle = data.subtitle;
  if (data.description !== undefined) row.description = data.description;
  if (data.image !== undefined) row.image = data.image;
  if (data.achievements !== undefined) row.achievements = data.achievements;
  if (data.tags !== undefined) row.tags = data.tags;
  if (data.className !== undefined) row.class_name = data.className;
  if (data.grade !== undefined) row.grade = data.grade;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

export type {
  ShowcaseCategory,
  CategoryConfig,
  StudentShowcase,
  StudentShowcaseFormData,
  StudentShowcaseRow,
};

export {
  CATEGORY_CONFIGS,
  getCategoryConfig,
  mapRowToModel,
  mapModelToRow,
};
