/**
 * 班级类型定义
 * 
 * @module types/class
 */

// ==================== 班级基本信息 ====================

/** 班级状态 */
export type ClassStatus = 'active' | 'inactive' | 'graduated';

/** 班级基本信息 */
export interface Class {
  id: string;
  name: string;
  grade: number;
  headTeacherId: string;
  headTeacherName: string;
  studentCount: number;
  classroom?: string;
}

/** 班级详细信息 */
export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  gradeName: string;
  classNumber?: number;
  headTeacherId?: string;
  headTeacherName?: string;
  subTeacherId?: string;
  subTeacherName?: string;
  studentCount: number;
  maleStudentCount?: number;
  femaleStudentCount?: number;
  parentCount?: number;
  classroomId?: string;
  classroomName?: string;
  building?: string;
  floor?: number;
  status?: string;
  motto?: string;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** 班级容器 - 聚合根 */
export interface ClassContainer {
  id: string;
  name: string;
  grade: number;
  gradeName: string;
  classNumber: number;
  headTeacherId: string;
  headTeacherName: string;
  headTeacher?: TeacherBasicInfo;
  subTeacherId?: string;
  subTeacherName?: string;
  subTeacher?: TeacherBasicInfo;
  students: StudentBasicInfo[];
  studentCount: number;
  maleStudentCount: number;
  femaleStudentCount: number;
  parents: ParentBasicInfo[];
  parentCount: number;
  classroomId?: string;
  classroomName?: string;
  building?: string;
  floor?: number;
  status: ClassStatus;
  motto?: string;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ==================== 关联信息 ====================

/** 教师基本信息（班级聚合用） */
export interface TeacherBasicInfo {
  id: string;
  name: string;
  gender?: string;
  phone?: string;
  subject?: string;
  title?: string;
  avatar?: string;
  primarySubject?: string;
  subjects?: string[];
  headTeacherClassId?: string;
  headTeacherClassName?: string;
  subTeacherClasses?: Array<{ classId: string; className: string }>;
}

/** 学生基本信息（班级聚合用） */
export interface StudentBasicInfo {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate?: string;
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
  avatar?: string;
  parents: ParentBasicInfo[];
}

/** 家长基本信息（班级聚合展示用） */
export interface ParentBasicInfo {
  id?: string;
  name: string;
  relation: string;
  relationName: string;
  phone?: string;
  isPrimary: boolean;
  wechat?: string;
  avatar?: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;
  headTeacherId?: string;
  headTeacherName?: string;
}

// ==================== 筛选与统计 ====================

/** 班级筛选条件 */
export interface ClassFilters {
  search?: string;
  grade?: number | 'all';
  status?: string | 'all';
}

/** 班级统计信息 */
export interface ClassStatistics {
  totalClasses: number;
  activeClasses: number;
  inactiveClasses: number;
  totalStudents: number;
  totalParents: number;
  classesWithSubTeacher: number;
  classesWithoutSubTeacher: number;
  gradeDistribution: Record<number, number>;
  avgStudentsPerClass: number;
  avgParentsPerClass: number;
}

// ==================== 教师候选人 ====================

/** 教师候选人（用于智能推荐） */
export interface TeacherCandidate {
  id: string;
  name: string;
  subject: string;
  subjects: string[];
  primaryRole: string;
  department?: string;
  title?: string;
  teachableGrades: number[];
  isRecommended: boolean;
  matchReason?: string;
  currentClassId?: string;
  currentClassName?: string;
  isHeadTeacher: boolean;
}
