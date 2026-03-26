/**
 * 教师类型定义
 * 
 * @module types/teacher
 */

import type { AdministrativeRole } from './user';

// ==================== 教师基本信息 ====================

/** 教师基本信息 */
export interface Teacher {
  id: string;
  name: string;
  employeeNo: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  subjects: string[];
  isHeadTeacher: boolean;
  classId?: string;
  className?: string;
  department?: string;
  position?: string;
  avatar?: string;
}

/** 教师详细信息 */
export interface TeacherProfile {
  id: string;
  userId: string;
  
  // === 基本信息 ===
  name: string;
  gender: '男' | '女';
  birthDate?: string;
  idCard?: string;
  ethnicity?: string;
  politicalStatus?: string;
  nativePlace?: string;
  
  // === 联系信息 ===
  phone: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  
  // === 工作信息 ===
  employeeId?: string;
  subjects: string[];
  title: string;
  titleDate?: string;
  education: string;
  school?: string;
  major?: string;
  graduationDate?: string;
  teachYears: number;
  joinDate: string;
  department: string;
  
  // === 班主任信息 ===
  isHeadTeacher: boolean;
  classId?: string;
  className?: string;
  headTeacherYears?: number;
  
  // === 状态 ===
  status: 'active' | 'on_leave' | 'retired' | 'transferred';
  
  // === 成长记录 ===
  records: TeacherRecord[];
  honors: TeacherHonor[];
  trainings: TeacherTraining[];
  achievements: TeacherAchievement[];
  
  // === 时间戳 ===
  createdAt: string;
  updatedAt: string;
}

// ==================== 教师成长记录 ====================

/** 教师成长记录 */
export interface TeacherRecord {
  id: string;
  teacherId: string;
  type: 'education' | 'title' | 'position' | 'award' | 'training' | 'research' | 'other';
  title: string;
  description?: string;
  date: string;
  attachments?: string[];
  createdAt: string;
}

/** 教师荣誉奖项 */
export interface TeacherHonor {
  id: string;
  teacherId: string;
  title: string;
  level: '校级' | '区级' | '市级' | '省级' | '国家级';
  category: '教学' | '德育' | '科研' | '综合';
  issuer?: string;
  date: string;
  certificateNo?: string;
  attachments?: string[];
}

/** 教师培训记录 */
export interface TeacherTraining {
  id: string;
  teacherId: string;
  name: string;
  type: '校内培训' | '区级培训' | '市级培训' | '省级培训' | '国家级培训';
  organizer: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: '进行中' | '已完成' | '未通过';
  certificate?: string;
  notes?: string;
}

/** 教师教学成果 */
export interface TeacherAchievement {
  id: string;
  teacherId: string;
  type: '公开课' | '教学比赛' | '论文发表' | '课题研究' | '指导学生获奖';
  title: string;
  level?: string;
  result?: string;
  date: string;
  description?: string;
  attachments?: string[];
}

// ==================== 班级教师关系 ====================

/** 班级教师职位类型 */
export type ClassTeacherPosition = 'head_teacher' | 'subject_teacher';

/** 班级教师关系状态 */
export type ClassTeacherStatus = 'active' | 'expired';

/** 班级教师关系 */
export interface ClassTeacher {
  id: string;
  classId: string;
  className: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  position: ClassTeacherPosition;
  subjects?: string[];
  semester: string;
  status: ClassTeacherStatus;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

/** 创建班级教师关系请求 */
export interface CreateClassTeacherRequest {
  classId: string;
  teacherId: string;
  position: ClassTeacherPosition;
  subjects?: string[];
  semester: string;
}

/** 更新班级教师关系请求 */
export interface UpdateClassTeacherRequest {
  subjects?: string[];
  status?: ClassTeacherStatus;
}

// ==================== 教师工作量 ====================

/** 教师工作量统计 */
export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  semester: string;
  // 总课时
  totalHours: number;
  // 各科目课时
  subjectHours: Record<string, number>;
  // 班主任课时
  headTeacherHours: number;
  // 代课课时
  substituteHours: number;
  // 公开课/教研活动课时
  researchHours: number;
  // 其他课时
  otherHours: number;
}
