/**
 * 班级和教师统一数据源
 * 供班级管理、排课系统等模块共享
 */

// ==================== 类型定义 ====================

export interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  grades: number[];
  weeklyHours: number;
  currentHours: number;
}

export interface ClassSubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  classNum: number;
  students: number;
  headTeacherId: string;
  headTeacherName: string;
  subjectHeadId?: string;
  subjectHeadName?: string;
  subjectTeachers: ClassSubjectTeacher[];
  classroom: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ==================== 教师数据 ====================

export const TEACHERS_DATA: Teacher[] = [
  { id: 't001', name: '张明华', subjects: ['语文', '道德与法治'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0 },
  { id: 't002', name: '李秀芳', subjects: ['数学', '科学'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0 },
  { id: 't003', name: '王建国', subjects: ['语文', '道德与法治'], grades: [1, 2, 3], weeklyHours: 14, currentHours: 0 },
  { id: 't004', name: '赵丽萍', subjects: ['数学', '科学'], grades: [2, 3, 4], weeklyHours: 14, currentHours: 0 },
  { id: 't005', name: '刘伟强', subjects: ['语文'], grades: [3, 4], weeklyHours: 12, currentHours: 0 },
  { id: 't006', name: '陈美玲', subjects: ['数学'], grades: [3, 4], weeklyHours: 12, currentHours: 0 },
  { id: 't007', name: '周志明', subjects: ['英语'], grades: [3, 4, 5, 6], weeklyHours: 16, currentHours: 0 },
  { id: 't008', name: '吴晓燕', subjects: ['体育'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 18, currentHours: 0 },
  { id: 't009', name: '郑文博', subjects: ['音乐'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 16, currentHours: 0 },
  { id: 't010', name: '孙艺华', subjects: ['美术'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 16, currentHours: 0 },
  { id: 't011', name: '黄志强', subjects: ['科学'], grades: [3, 4, 5, 6], weeklyHours: 14, currentHours: 0 },
  { id: 't012', name: '林小红', subjects: ['道德与法治'], grades: [1, 2, 3, 4, 5, 6], weeklyHours: 12, currentHours: 0 },
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
      { subject: '语文', teacherId: 't001', teacherName: '张明华', weeklyHours: 8 },
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't001', teacherName: '张明华', weeklyHours: 2 },
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
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 8 },
      { subject: '数学', teacherId: 't002', teacherName: '李秀芳', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2 },
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
      { subject: '语文', teacherId: 't003', teacherName: '王建国', weeklyHours: 8 },
      { subject: '数学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't004', teacherName: '赵丽萍', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't003', teacherName: '王建国', weeklyHours: 2 },
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
      { subject: '语文', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 8 },
      { subject: '数学', teacherId: 't006', teacherName: '陈美玲', weeklyHours: 6 },
      { subject: '英语', teacherId: 't007', teacherName: '周志明', weeklyHours: 4 },
      { subject: '体育', teacherId: 't008', teacherName: '吴晓燕', weeklyHours: 3 },
      { subject: '音乐', teacherId: 't009', teacherName: '郑文博', weeklyHours: 2 },
      { subject: '美术', teacherId: 't010', teacherName: '孙艺华', weeklyHours: 2 },
      { subject: '科学', teacherId: 't011', teacherName: '黄志强', weeklyHours: 2 },
      { subject: '道德与法治', teacherId: 't005', teacherName: '刘伟强', weeklyHours: 2 },
    ],
    classroom: '教学楼A301',
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
  },
];
