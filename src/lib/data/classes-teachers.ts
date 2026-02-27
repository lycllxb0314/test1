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
  mainSubjectHours: number;       // 主科周课时
  totalWeeklyHours: number;       // 总周课时（约13节）
  currentHours: number;           // 已安排课时
  
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
  subjectHeadId?: string;         // 科任（副班主任）
  subjectHeadName?: string;
  subjectTeachers: ClassSubjectTeacher[];
  classroom: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ==================== 教师数据 ====================

export const TEACHERS_DATA: Teacher[] = [
  // 班主任 - 语文老师
  { 
    id: 't001', 
    name: '张明华', 
    role: 'head_teacher',
    primarySubject: '语文',
    secondarySubjects: ['道德与法治', '劳动'],
    grades: [1, 2, 3],
    mainClassCount: 1,
    mainSubjectHours: 6,
    totalWeeklyHours: 13,
    currentHours: 0,
    headTeacherClassId: 'c001',
  },
  
  // 班主任 - 数学老师（同时是科任）
  { 
    id: 't002', 
    name: '李秀芳', 
    role: 'head_teacher',
    primarySubject: '数学',
    secondarySubjects: ['科学'],
    grades: [1, 2, 3],
    mainClassCount: 1,
    mainSubjectHours: 6,
    totalWeeklyHours: 13,
    currentHours: 0,
    headTeacherClassId: 'c002',
    subjectHeadClassId: 'c001',  // 同时是一年级1班的科任
  },
  
  // 班主任 - 语文老师
  { 
    id: 't003', 
    name: '王建国', 
    role: 'head_teacher',
    primarySubject: '语文',
    secondarySubjects: ['道德与法治'],
    grades: [1, 2, 3],
    mainClassCount: 1,
    mainSubjectHours: 6,
    totalWeeklyHours: 13,
    currentHours: 0,
    headTeacherClassId: 'c003',
    subjectHeadClassId: 'c002',  // 同时是一年级2班的科任
  },
  
  // 普通教师 - 数学老师（带2个班）
  { 
    id: 't004', 
    name: '赵丽萍', 
    role: 'normal',
    primarySubject: '数学',
    secondarySubjects: ['科学'],
    grades: [2, 3, 4],
    mainClassCount: 2,
    mainSubjectHours: 12,
    totalWeeklyHours: 13,
    currentHours: 0,
    subjectHeadClassId: 'c003',  // 二年级1班的科任
  },
  
  // 普通教师 - 语文老师（带2个班）
  { 
    id: 't005', 
    name: '刘伟强', 
    role: 'normal',
    primarySubject: '语文',
    secondarySubjects: ['道德与法治'],
    grades: [3, 4],
    mainClassCount: 2,
    mainSubjectHours: 12,
    totalWeeklyHours: 13,
    currentHours: 0,
    subjectHeadClassId: 'c004',  // 三年级1班的科任
  },
  
  // 班主任 - 数学老师
  { 
    id: 't006', 
    name: '陈美玲', 
    role: 'head_teacher',
    primarySubject: '数学',
    secondarySubjects: [],
    grades: [3, 4],
    mainClassCount: 1,
    mainSubjectHours: 6,
    totalWeeklyHours: 13,
    currentHours: 0,
    headTeacherClassId: 'c004',
  },
  
  // 技能科教师 - 英语
  { 
    id: 't007', 
    name: '周志明', 
    role: 'normal',
    primarySubject: '英语',
    secondarySubjects: [],
    grades: [3, 4, 5, 6],
    mainClassCount: 0,  // 技能科不带班
    mainSubjectHours: 0,
    totalWeeklyHours: 16,
    currentHours: 0,
  },
  
  // 技能科教师 - 体育
  { 
    id: 't008', 
    name: '吴晓燕', 
    role: 'normal',
    primarySubject: '体育',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 16,
    currentHours: 0,
  },
  
  // 技能科教师 - 音乐
  { 
    id: 't009', 
    name: '郑文博', 
    role: 'normal',
    primarySubject: '音乐',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 16,
    currentHours: 0,
  },
  
  // 技能科教师 - 美术
  { 
    id: 't010', 
    name: '孙艺华', 
    role: 'normal',
    primarySubject: '美术',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 16,
    currentHours: 0,
  },
  
  // 技能科教师 - 科学
  { 
    id: 't011', 
    name: '黄志强', 
    role: 'normal',
    primarySubject: '科学',
    secondarySubjects: [],
    grades: [3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 16,
    currentHours: 0,
  },
  
  // 技能科教师 - 道德与法治
  { 
    id: 't012', 
    name: '林小红', 
    role: 'normal',
    primarySubject: '道德与法治',
    secondarySubjects: [],
    grades: [1, 2, 3, 4, 5, 6],
    mainClassCount: 0,
    mainSubjectHours: 0,
    totalWeeklyHours: 16,
    currentHours: 0,
  },
];

// ==================== 班级数据 ====================

export const CLASSES_DATA: ClassInfo[] = [
  {
    id: 'c001',
    name: '一年级1班',
    grade: 1,
    classNum: 1,
    students: 50,
    headTeacherId: 't001',
    headTeacherName: '张明华',
    subjectHeadId: 't002',
    subjectHeadName: '李秀芳',
    subjectTeachers: [
      // 班主任教的课（主科 + 兼任）
      { subject: '语文', teacherId: 't001', teacherName: '张明华', weeklyHours: 6, isHeadTeacherSubject: true },
      { subject: '道德与法治', teacherId: 't001', teacherName: '张明华', weeklyHours: 2, isHeadTeacherSubject: true },
      { subject: '劳动', teacherId: 't001', teacherName: '张明华', weeklyHours: 1, isHeadTeacherSubject: true },
      // 科任教的课
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 5, isSubjectHeadSubject: true },
      { subject: '科学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 1, isSubjectHeadSubject: true },
      // 其他技能科
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '班会', teacherId: 't001', teacherName: '张明华', weeklyHours: 1, isHeadTeacherSubject: true },
    ],
    classroom: '教学楼A101',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  {
    id: 'c002',
    name: '一年级2班',
    grade: 1,
    classNum: 2,
    students: 49,
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    subjectHeadId: 't003',
    subjectHeadName: '王建国',
    subjectTeachers: [
      // 班主任教的课
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 5, isHeadTeacherSubject: true },
      { subject: '科学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 2, isHeadTeacherSubject: true },
      // 科任教的课
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 6, isSubjectHeadSubject: true },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2, isSubjectHeadSubject: true },
      // 其他技能科
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '劳动', teacherId: 't003', teacherName: '王建国', weeklyHours: 1, isSubjectHeadSubject: true },
      { subject: '班会', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 1, isHeadTeacherSubject: true },
    ],
    classroom: '教学楼A102',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  {
    id: 'c003',
    name: '二年级1班',
    grade: 2,
    classNum: 1,
    students: 48,
    headTeacherId: 't003',
    headTeacherName: '王建国',
    subjectHeadId: 't004',
    subjectHeadName: '赵丽萍',
    subjectTeachers: [
      // 班主任教的课
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 6, isHeadTeacherSubject: true },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2, isHeadTeacherSubject: true },
      // 科任教的课
      { subject: '数学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 5, isSubjectHeadSubject: true },
      { subject: '科学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 2, isSubjectHeadSubject: true },
      // 其他技能科
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '劳动', teacherId: 't003', teacherName: '王建国', weeklyHours: 1, isHeadTeacherSubject: true },
      { subject: '班会', teacherId: 't003', teacherName: '王建国', weeklyHours: 1, isHeadTeacherSubject: true },
    ],
    classroom: '教学楼A201',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
  {
    id: 'c004',
    name: '三年级1班',
    grade: 3,
    classNum: 1,
    students: 52,
    headTeacherId: 't006',
    headTeacherName: '陈美玲',
    subjectHeadId: 't005',
    subjectHeadName: '刘伟强',
    subjectTeachers: [
      // 班主任教的课
      { subject: '数学', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 6, isHeadTeacherSubject: true },
      // 科任教的课
      { subject: '语文', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 6, isSubjectHeadSubject: true },
      { subject: '道德与法治', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 2, isSubjectHeadSubject: true },
      // 其他技能科
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 2 },
      { subject: '劳动', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 1, isHeadTeacherSubject: true },
      { subject: '班会', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 1, isHeadTeacherSubject: true },
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
