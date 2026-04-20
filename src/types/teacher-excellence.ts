/**
 * 卓越教师模块类型定义
 *
 * 包含名师风采、教师团队、教师获奖三个子模块的业务类型
 */

// ==================== 名师风采 ====================

type TeacherProfile = {
  id: string;
  name: string;
  title: string;
  subject: string;
  image: string;
  description: string;
  achievements: string[];
  motto: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

type TeacherProfileFormData = {
  name: string;
  title: string;
  subject: string;
  image: string;
  description: string;
  achievements: string[];
  motto: string;
  sortOrder: number;
  isActive: boolean;
};

// ==================== 教师团队 ====================

type TeamMember = {
  name: string;
  role: string;
  title: string;
};

type TeacherTeam = {
  id: string;
  name: string;
  subject: string;
  description: string;
  image: string;
  members: TeamMember[];
  achievements: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

type TeacherTeamFormData = {
  name: string;
  subject: string;
  description: string;
  image: string;
  members: TeamMember[];
  achievements: string[];
  sortOrder: number;
  isActive: boolean;
};

// ==================== 教师获奖 ====================

type TeacherAward = {
  id: string;
  teacherName: string;
  awardName: string;
  awardLevel: string;
  awardDate: string;
  subject: string;
  description: string;
  image: string;
  certificateUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

type TeacherAwardFormData = {
  teacherName: string;
  awardName: string;
  awardLevel: string;
  awardDate: string;
  subject: string;
  description: string;
  image: string;
  certificateUrl: string;
  sortOrder: number;
  isActive: boolean;
};

// ==================== 数据库行类型（下划线命名） ====================

type TeacherProfileRow = {
  id: string;
  name: string;
  title: string;
  subject: string;
  image: string;
  description: string;
  achievements: string[];
  motto: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type TeacherTeamRow = {
  id: string;
  name: string;
  subject: string;
  description: string;
  image: string;
  members: TeamMember[];
  achievements: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type TeacherAwardRow = {
  id: string;
  teacher_name: string;
  award_name: string;
  award_level: string;
  award_date: string;
  subject: string;
  description: string;
  image: string;
  certificate_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

// ==================== 转换函数 ====================

function mapProfileRowToModel(row: TeacherProfileRow): TeacherProfile {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    subject: row.subject,
    image: row.image,
    description: row.description,
    achievements: row.achievements || [],
    motto: row.motto,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileModelToRow(data: Partial<TeacherProfileFormData>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.title !== undefined) row.title = data.title;
  if (data.subject !== undefined) row.subject = data.subject;
  if (data.image !== undefined) row.image = data.image;
  if (data.description !== undefined) row.description = data.description;
  if (data.achievements !== undefined) row.achievements = data.achievements;
  if (data.motto !== undefined) row.motto = data.motto;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

function mapTeamRowToModel(row: TeacherTeamRow): TeacherTeam {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    description: row.description,
    image: row.image,
    members: row.members || [],
    achievements: row.achievements || [],
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeamModelToRow(data: Partial<TeacherTeamFormData>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.subject !== undefined) row.subject = data.subject;
  if (data.description !== undefined) row.description = data.description;
  if (data.image !== undefined) row.image = data.image;
  if (data.members !== undefined) row.members = data.members;
  if (data.achievements !== undefined) row.achievements = data.achievements;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

function mapAwardRowToModel(row: TeacherAwardRow): TeacherAward {
  return {
    id: row.id,
    teacherName: row.teacher_name,
    awardName: row.award_name,
    awardLevel: row.award_level,
    awardDate: row.award_date,
    subject: row.subject,
    description: row.description,
    image: row.image,
    certificateUrl: row.certificate_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAwardModelToRow(data: Partial<TeacherAwardFormData>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.teacherName !== undefined) row.teacher_name = data.teacherName;
  if (data.awardName !== undefined) row.award_name = data.awardName;
  if (data.awardLevel !== undefined) row.award_level = data.awardLevel;
  if (data.awardDate !== undefined) row.award_date = data.awardDate;
  if (data.subject !== undefined) row.subject = data.subject;
  if (data.description !== undefined) row.description = data.description;
  if (data.image !== undefined) row.image = data.image;
  if (data.certificateUrl !== undefined) row.certificate_url = data.certificateUrl;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

export type {
  TeacherProfile,
  TeacherProfileFormData,
  TeamMember,
  TeacherTeam,
  TeacherTeamFormData,
  TeacherAward,
  TeacherAwardFormData,
  TeacherProfileRow,
  TeacherTeamRow,
  TeacherAwardRow,
};

export {
  mapProfileRowToModel,
  mapProfileModelToRow,
  mapTeamRowToModel,
  mapTeamModelToRow,
  mapAwardRowToModel,
  mapAwardModelToRow,
};
