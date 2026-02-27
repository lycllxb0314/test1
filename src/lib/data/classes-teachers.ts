/**
 * 班级和教师统一数据源
 * 供班级管理、排课系统等模块共享
 */

import { TeacherRole, MAIN_SUBJECTS, PRIORITY_SECONDARY_SUBJECTS } from './teaching-rules';

// ==================== 类型定义 ====================

export interface Teacher {
  id: string;
  name: string;
  role: TeacherRole;              // 角色类型
  primarySubject: string;         // 主教学科
  secondarySubjects: string[];    // 兼任科目
  grades: number[];               // 可任教年级
  
  // 课时量配置
  mainClassCount: number;         // 主科带班数（1或2）
  mainSubjectHours: number;       // 主科总课时
  totalWeeklyHours: number;       // 总周课时（约13节）
  currentHours: number;           // 已安排课时
  
  // 课时分配明细
  ownClassHours?: number;         // 本班课时（班主任/科任在自己班的课时）
  otherClassHours?: number;       // 其他班课时（剩余课时分配到其他班）
  
  // 班级关联
  headTeacherClassId?: string;    // 班主任班级ID
  subjectHeadClassId?: string;    // 科任（副班主任）班级ID
}

export interface ClassSubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
  isHeadTeacherSubject?: boolean;  // 是否是班主任教的课
  isSubjectHeadSubject?: boolean;  // 是否是科任教的课
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  classNum: number;
  students: number;
  headTeacherId: string;
  headTeacherName: string;
  // 科任（副班主任）- 按科目存储，一个班可以有多个科任
  // 例如：语文科任、数学科任可能是不同老师
  subjectHeads?: Array<{
    subject: string;      // 科目
    teacherId: string;    // 教师ID
    teacherName: string;  // 教师姓名
  }>;
  // 兼容旧数据
  subjectHeadId?: string;         // 科任（副班主任）- 已废弃，建议使用 subjectHeads
  subjectHeadName?: string;
  subjectTeachers: ClassSubjectTeacher[];
  classroom: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ==================== 教师数据 ====================
// 
// 课时分配逻辑（周课时约13节）：
// - 班主任/教研组长/中层行政/年段长：本班主科5-6节 + 本班兼任约4节 + 其他班约3节
// - 科任（带2个班）：主科10-12节 + 兼任1-2节
// - 技能科教师：约13节（跨多个班级，可能跨段）

export const TEACHERS_DATA: Teacher[] = [
  // ==================== 班主任 - 语文老师 ====================
  // 张明华：一年级1班班主任
  // 本班课时：语文6 + 道法2 + 劳动1 + 班会1 = 10节
  // 其他班课时：约3节（教其他班语文，待分配）
  { 
    id: 't001', 
    name: '张明华', 
    role: 'head_teacher',
    primarySubject: '语文',
    secondarySubjects: ['道德与法治', '劳动'],
    grades: [1, 2, 3],
    mainClassCount: 1,
    mainSubjectHours: 9,
    totalWeeklyHours: 13,
    currentHours: 0,
    ownClassHours: 10,
    otherClassHours: 3,
    headTeacherClassId: 'c001',
  },
  
  // ==================== 班主任兼科任 - 数学老师 ====================
  // 李秀芳：一年级2班班主任 + 一年级1班科任
  // 一年级2班（班主任班）：数学6 + 班会1 = 7节
  // 一年级1班（科任班）：数学5 + 科学1 = 6节
  { 
    id: 't002', 
    name: '李秀芳', 
    role: 'head_teacher',
    primarySubject: '数学',
    secondarySubjects: ['科学'],
    grades: [1, 2, 3],
    mainClassCount: 1,
    mainSubjectHours: 11,
    totalWeeklyHours: 13,
    currentHours: 0,
    ownClassHours: 7,
    otherClassHours: 6,
    headTeacherClassId: 'c002',
    subjectHeadClassId: 'c001',
  },
  
  // ==================== 班主任兼科任 - 语文老师 ====================
  // 王建国：二年级1班班主任 + 一年级2班科任
  // 二年级1班（班主任班）：语文6 + 道法2 + 劳动1 + 班会1 = 10节
  // 一年级2班（科任班）：语文3节
  { 
    id: 't003', 
    name: '王建国', 
    role: 'head_teacher',
    primarySubject: '语文',
    secondarySubjects: ['道德与法治'],
    grades: [1, 2, 3],
    mainClassCount: 1,
    mainSubjectHours: 9,
    totalWeeklyHours: 13,
    currentHours: 0,
    ownClassHours: 10,
    otherClassHours: 3,
    headTeacherClassId: 'c003',
    subjectHeadClassId: 'c002',
  },
  
  // ==================== 科任 - 数学老师（带2个班）====================
  // 赵丽萍：二年级1班 + 三年级1班
  // 二年级1班：数学5 + 科学2 = 7节
  // 三年级1班：数学5节
  { 
    id: 't004', 
    name: '赵丽萍', 
    role: 'subject_head',
    primarySubject: '数学',
    secondarySubjects: ['科学'],
    grades: [2, 3, 4],
    mainClassCount: 2,
    mainSubjectHours: 10,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  // ==================== 科任 - 语文老师（带2个班）====================
  // 刘伟强：三年级1班 + 其他班
  // 三年级1班：语文6 + 道法2 = 8节
  // 其他班：语文5节
  { 
    id: 't005', 
    name: '刘伟强', 
    role: 'subject_head',
    primarySubject: '语文',
    secondarySubjects: ['道德与法治'],
    grades: [3, 4],
    mainClassCount: 2,
    mainSubjectHours: 11,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  // ==================== 班主任 - 数学老师 ====================
  // 陈美玲：三年级1班班主任
  // 本班：数学6 + 道法2 + 劳动1 + 班会1 = 10节
  // 其他班：约3节
  { 
    id: 't006', 
    name: '陈美玲', 
    role: 'head_teacher',
    primarySubject: '数学',
    secondarySubjects: ['道德与法治', '劳动'],
    grades: [3, 4],
    mainClassCount: 1,
    mainSubjectHours: 9,
    totalWeeklyHours: 13,
    currentHours: 0,
    ownClassHours: 10,
    otherClassHours: 3,
    headTeacherClassId: 'c004',
  },
  
  // ==================== 技能科教师（跨多个班级，可能跨段）====================
  { 
    id: 't007', 
    name: '周志明', 
    role: 'skill_teacher',
    primarySubject: '英语',
    secondarySubjects: [],
    grades: [3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  { 
    id: 't008', 
    name: '吴晓燕', 
    role: 'skill_teacher',
    primarySubject: '体育',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  { 
    id: 't009', 
    name: '郑文博', 
    role: 'skill_teacher',
    primarySubject: '音乐',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  { 
    id: 't010', 
    name: '孙艺华', 
    role: 'skill_teacher',
    primarySubject: '美术',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  { 
    id: 't011', 
    name: '黄志强', 
    role: 'skill_teacher',
    primarySubject: '科学',
    secondarySubjects: [],
    grades: [3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
  
  // 道法老师（专任）
  { 
    id: 't012', 
    name: '林小红', 
    role: 'skill_teacher',
    primarySubject: '道德与法治',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 13,
    currentHours: 0,
  },
];

// ==================== 班级数据 ====================
// 
// 课程周课时参考：
// - 语文：6节（主科）
// - 数学：5-6节（主科）
// - 英语：3-4节
// - 体育：3节
// - 音乐：2节
// - 美术：2节
// - 科学：2节
// - 道德与法治：2节
// - 劳动：1节
// - 信息技术：1节
// - 班会：1节
// 总计：约28节/周

export const CLASSES_DATA: ClassInfo[] = [
  // ==================== 一年级1班 ====================
  {
    id: 'c001',
    name: '一年级1班',
    grade: 1,
    classNum: 1,
    students: 50,
    headTeacherId: 't001',      // 张明华（语文老师）
    headTeacherName: '张明华',
    // 科任（按科目）：李秀芳是一年级2班班主任，同时也教这个班的数学
    subjectHeads: [
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳' },
    ],
    // 兼容旧数据
    subjectHeadId: 't002',
    subjectHeadName: '李秀芳',
    subjectTeachers: [
      // 班主任教的课（本班优先）
      { subject: '语文', teacherId: 't001', teacherName: '张明华', weeklyHours: 6, isHeadTeacherSubject: true },
      { subject: '道德与法治', teacherId: 't001', teacherName: '张明华', weeklyHours: 2, isHeadTeacherSubject: true },
      { subject: '劳动', teacherId: 't001', teacherName: '张明华', weeklyHours: 1, isHeadTeacherSubject: true },
      { subject: '班会', teacherId: 't001', teacherName: '张明华', weeklyHours: 1, isHeadTeacherSubject: true },
      // 科任教的课（本班优先）
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 5, isSubjectHeadSubject: true },
      { subject: '科学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 1, isSubjectHeadSubject: true },
      // 技能科教师
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 1 },  // 科学共2节
    ],
    classroom: '教学楼A101',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  
  // ==================== 一年级2班 ====================
  {
    id: 'c002',
    name: '一年级2班',
    grade: 1,
    classNum: 2,
    students: 49,
    headTeacherId: 't002',      // 李秀芳（数学老师）
    headTeacherName: '李秀芳',
    // 科任（按科目）：王建国是二年级1班班主任，同时也教这个班的语文
    subjectHeads: [
      { subject: '语文', teacherId: 't003', teacherName: '王建国' },
    ],
    // 兼容旧数据
    subjectHeadId: 't003',
    subjectHeadName: '王建国',
    subjectTeachers: [
      // 科任教的课（本班优先）
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 5, isSubjectHeadSubject: true },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2, isSubjectHeadSubject: true },
      { subject: '劳动', teacherId: 't003', teacherName: '王建国', weeklyHours: 1, isSubjectHeadSubject: true },
      // 班主任教的课（本班优先）
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 6, isHeadTeacherSubject: true },
      { subject: '班会', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 1, isHeadTeacherSubject: true },
      // 技能科教师
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 1 },  // 班主任兼任
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 1 },  // 科学共2节
    ],
    classroom: '教学楼A102',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  
  // ==================== 二年级1班 ====================
  {
    id: 'c003',
    name: '二年级1班',
    grade: 2,
    classNum: 1,
    students: 48,
    headTeacherId: 't003',      // 王建国（语文老师）
    headTeacherName: '王建国',
    // 科任（按科目）：赵丽萍是数学科任，带2个班
    subjectHeads: [
      { subject: '数学', teacherId: 't004', teacherName: '赵丽萍' },
    ],
    // 兼容旧数据
    subjectHeadId: 't004',
    subjectHeadName: '赵丽萍',
    subjectTeachers: [
      // 班主任教的课（本班优先）
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 6, isHeadTeacherSubject: true },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2, isHeadTeacherSubject: true },
      { subject: '劳动', teacherId: 't003', teacherName: '王建国', weeklyHours: 1, isHeadTeacherSubject: true },
      { subject: '班会', teacherId: 't003', teacherName: '王建国', weeklyHours: 1, isHeadTeacherSubject: true },
      // 科任教的课（本班优先）
      { subject: '数学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 5, isSubjectHeadSubject: true },
      { subject: '科学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 2, isSubjectHeadSubject: true },
      // 技能科教师
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
    ],
    classroom: '教学楼A201',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  
  // ==================== 三年级1班 ====================
  {
    id: 'c004',
    name: '三年级1班',
    grade: 3,
    classNum: 1,
    students: 52,
    headTeacherId: 't006',      // 陈美玲（数学老师）
    headTeacherName: '陈美玲',
    // 科任（按科目）：刘伟强是语文科任，带2个班
    subjectHeads: [
      { subject: '语文', teacherId: 't005', teacherName: '刘伟强' },
    ],
    // 兼容旧数据
    subjectHeadId: 't005',
    subjectHeadName: '刘伟强',
    subjectTeachers: [
      // 科任教的课（本班优先）
      { subject: '语文', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 6, isSubjectHeadSubject: true },
      { subject: '道德与法治', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 2, isSubjectHeadSubject: true },
      // 班主任教的课（本班优先）
      { subject: '数学', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 6, isHeadTeacherSubject: true },
      { subject: '劳动', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 1, isHeadTeacherSubject: true },
      { subject: '班会', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 1, isHeadTeacherSubject: true },
      // 技能科教师
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 2 },
    ],
    classroom: '教学楼A301',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
];

// ==================== 辅助函数 ====================

/**
 * 获取教师的完整任教信息
 */
export function getTeacherTeachingInfo(teacherId: string) {
  const teacher = TEACHERS_DATA.find(t => t.id === teacherId);
  if (!teacher) return null;
  
  const classesAsHeadTeacher = CLASSES_DATA.filter(c => c.headTeacherId === teacherId);
  const classesAsSubjectHead = CLASSES_DATA.filter(c => c.subjectHeadId === teacherId);
  
  // 获取该教师所有任教的班级和科目
  const allTeaching: Array<{ classId: string; className: string; subject: string; hours: number }> = [];
  
  CLASSES_DATA.forEach(cls => {
    cls.subjectTeachers
      .filter(st => st.teacherId === teacherId)
      .forEach(st => {
        allTeaching.push({
          classId: cls.id,
          className: cls.name,
          subject: st.subject,
          hours: st.weeklyHours,
        });
      });
  });
  
  return {
    teacher,
    classesAsHeadTeacher,
    classesAsSubjectHead,
    allTeaching,
    totalHours: allTeaching.reduce((sum, t) => sum + t.hours, 0),
  };
}

/**
 * 获取班级的任课教师信息
 */
export function getClassTeachers(classId: string) {
  const cls = CLASSES_DATA.find(c => c.id === classId);
  if (!cls) return null;
  
  const headTeacher = TEACHERS_DATA.find(t => t.id === cls.headTeacherId);
  const subjectHead = TEACHERS_DATA.find(t => t.id === cls.subjectHeadId);
  
  const allTeachers = cls.subjectTeachers.map(st => ({
    ...st,
    teacher: TEACHERS_DATA.find(t => t.id === st.teacherId),
  }));
  
  return {
    class: cls,
    headTeacher,
    subjectHead,
    allTeachers,
  };
}
