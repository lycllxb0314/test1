/**
 * 学生相关Mock数据
 */

import type { Student, StudentFullProfile, Parent } from '@/types';

// 班级信息映射（用于获取年级和班主任）
const classInfoMap: Record<string, { grade: number; gradeName: string; headTeacherId: string; headTeacherName: string }> = {
  'c001': { grade: 1, gradeName: '一年级', headTeacherId: 't001', headTeacherName: '张明华' },
  'c002': { grade: 1, gradeName: '一年级', headTeacherId: 't002', headTeacherName: '李秀芳' },
  'c003': { grade: 2, gradeName: '二年级', headTeacherId: 't003', headTeacherName: '王建国' },
  'c004': { grade: 2, gradeName: '二年级', headTeacherId: 't004', headTeacherName: '赵丽萍' },
  'c005': { grade: 3, gradeName: '三年级', headTeacherId: 't005', headTeacherName: '刘伟强' },
  'c006': { grade: 3, gradeName: '三年级', headTeacherId: 't006', headTeacherName: '陈美玲' },
  'c007': { grade: 4, gradeName: '四年级', headTeacherId: 't007', headTeacherName: '周志明' },
  'c008': { grade: 4, gradeName: '四年级', headTeacherId: 't008', headTeacherName: '陈思思' },
  'c009': { grade: 5, gradeName: '五年级', headTeacherId: 't009', headTeacherName: '王强' },
  'c010': { grade: 5, gradeName: '五年级', headTeacherId: 't010', headTeacherName: '林小燕' },
  'c011': { grade: 6, gradeName: '六年级', headTeacherId: 't011', headTeacherName: '张明华' },
  'c012': { grade: 6, gradeName: '六年级', headTeacherId: 't012', headTeacherName: '李秀芳' },
};

// 辅助函数：根据班级ID获取班级信息
function getClassInfo(classId: string) {
  return classInfoMap[classId] || { grade: 1, gradeName: '一年级', headTeacherId: 't001', headTeacherName: '未知' };
}

// 学生列表Mock数据
export const MOCK_STUDENTS: Student[] = [
  {
    id: 's001',
    studentNo: '2024001',
    name: '张三',
    gender: 'male',
    birthDate: '2017-03-15',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    gradeName: '一年级',
    headTeacherId: 't001',
    headTeacherName: '张明华',
    status: '在校',
    parents: [],
  },
  {
    id: 's002',
    studentNo: '2024002',
    name: '李四',
    gender: 'female',
    birthDate: '2017-05-20',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    gradeName: '一年级',
    headTeacherId: 't001',
    headTeacherName: '张明华',
    status: '在校',
    parents: [],
  },
  {
    id: 's003',
    studentNo: '2024003',
    name: '王五',
    gender: 'male',
    birthDate: '2016-08-10',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    gradeName: '一年级',
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    status: '在校',
    parents: [],
  },
  {
    id: 's004',
    studentNo: '2024004',
    name: '赵六',
    gender: 'female',
    birthDate: '2016-11-25',
    classId: 'c002',
    className: '一年级2班',
    grade: 1,
    gradeName: '一年级',
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    status: '请假',
    parents: [],
  },
  {
    id: 's005',
    studentNo: '2024005',
    name: '孙七',
    gender: 'male',
    birthDate: '2015-02-14',
    classId: 'c003',
    className: '二年级1班',
    grade: 2,
    gradeName: '二年级',
    headTeacherId: 't003',
    headTeacherName: '王建国',
    status: '在校',
    parents: [],
  },
  {
    id: 's006',
    studentNo: '2024006',
    name: '周八',
    gender: 'female',
    birthDate: '2015-04-08',
    classId: 'c003',
    className: '二年级1班',
    grade: 2,
    gradeName: '二年级',
    headTeacherId: 't003',
    headTeacherName: '王建国',
    status: '在校',
    parents: [],
  },
  {
    id: 's007',
    studentNo: '2024007',
    name: '吴九',
    gender: 'male',
    birthDate: '2014-07-22',
    classId: 'c005',
    className: '三年级1班',
    grade: 3,
    gradeName: '三年级',
    headTeacherId: 't005',
    headTeacherName: '刘伟强',
    status: '在校',
    parents: [],
  },
  {
    id: 's008',
    studentNo: '2024008',
    name: '郑十',
    gender: 'female',
    birthDate: '2014-09-30',
    classId: 'c005',
    className: '三年级1班',
    grade: 3,
    gradeName: '三年级',
    headTeacherId: 't005',
    headTeacherName: '刘伟强',
    status: '休学',
    parents: [],
  },
  {
    id: 's009',
    studentNo: '2023001',
    name: '陈小明',
    gender: 'male',
    birthDate: '2013-01-18',
    classId: 'c007',
    className: '四年级1班',
    grade: 4,
    gradeName: '四年级',
    headTeacherId: 't007',
    headTeacherName: '周志明',
    status: '在校',
    parents: [],
  },
  {
    id: 's010',
    studentNo: '2023002',
    name: '林小红',
    gender: 'female',
    birthDate: '2013-03-25',
    classId: 'c007',
    className: '四年级1班',
    grade: 4,
    gradeName: '四年级',
    headTeacherId: 't007',
    headTeacherName: '周志明',
    status: '在校',
    parents: [],
  },
  {
    id: 's011',
    studentNo: '2022001',
    name: '黄小华',
    gender: 'male',
    birthDate: '2012-06-12',
    classId: 'c009',
    className: '五年级1班',
    grade: 5,
    gradeName: '五年级',
    headTeacherId: 't009',
    headTeacherName: '王强',
    status: '在校',
    parents: [],
  },
  {
    id: 's012',
    studentNo: '2022002',
    name: '杨小芳',
    gender: 'female',
    birthDate: '2012-08-28',
    classId: 'c009',
    className: '五年级1班',
    grade: 5,
    gradeName: '五年级',
    headTeacherId: 't009',
    headTeacherName: '王强',
    status: '在校',
    parents: [],
  },
];

// 学生完整档案Mock数据
export const MOCK_STUDENT_PROFILE: StudentFullProfile = {
  id: 's001',
  studentNo: '2024001',
  
  name: '张三',
  gender: 'male',
  birthDate: '2017-03-15',
  idCard: '3508**********0315',
  ethnicity: '汉族',
  nativePlace: '福建龙岩',
  politicalStatus: '少先队员',
  
  grade: 1,
  gradeName: '一年级',
  classId: 'c001',
  className: '一年级1班',
  classNumber: 1,
  enrollmentDate: '2023-09-01',
  studentType: '普通',
  
  phone: undefined,
  address: '龙岩市新罗区xx路xx号',
  homeAddress: '龙岩市新罗区xx路xx号',
  
  familyType: '核心家庭',
  parents: [
    {
      id: 'p001',
      name: '张父',
      relationship: '父亲',
      phone: '139****1001',
      isPrimary: true,
      wechat: 'zhang_father',
    },
    {
      id: 'p002',
      name: '李母',
      relationship: '母亲',
      phone: '138****1002',
      isPrimary: false,
      wechat: 'li_mother',
    },
  ],
  emergencyContact: '张父',
  emergencyPhone: '139****1001',
  
  headTeacherId: 't001',
  headTeacherName: '张明华',
  
  status: '在校',
  
  academicRecords: [
    {
      id: 'ar001',
      studentId: 's001',
      semester: '2023-2024-1',
      examType: '期中',
      subject: '语文',
      score: 95,
      level: '优秀',
      classRank: 5,
      gradeRank: 28,
      createdAt: '2023-11-15T00:00:00Z',
    },
    {
      id: 'ar002',
      studentId: 's001',
      semester: '2023-2024-1',
      examType: '期中',
      subject: '数学',
      score: 98,
      level: '优秀',
      classRank: 2,
      gradeRank: 12,
      createdAt: '2023-11-15T00:00:00Z',
    },
  ],
  
  honors: [
    {
      id: 'h001',
      studentId: 's001',
      title: '学习之星',
      level: '班级',
      category: '学习',
      date: '2023-11',
    },
    {
      id: 'h002',
      studentId: 's001',
      title: '文明学生',
      level: '班级',
      category: '德育',
      date: '2023-10',
    },
  ],
  
  growthRecords: [
    {
      id: 'gr001',
      studentId: 's001',
      type: '入学',
      title: '入学登记',
      description: '新生入学',
      date: '2023-09-01',
      operator: '教务处',
      createdAt: '2023-09-01T00:00:00Z',
    },
  ],
  
  habitProfile: {
    overallScore: 92,
    level: '优秀',
    habitStarCount: 2,
    monthlyStars: ['2023-10', '2023-11'],
  },
  
  moralRecords: [
    {
      id: 'mr001',
      studentId: 's001',
      type: '表扬',
      title: '主动帮助同学',
      content: '帮助同学解答数学题',
      score: 5,
      date: '2023-11-20',
      recorder: '张明华',
      createdAt: '2023-11-20T00:00:00Z',
    },
  ],
  
  attendanceStats: {
    totalDays: 100,
    presentDays: 98,
    absentDays: 2,
    lateDays: 0,
    earlyLeaveDays: 0,
    attendanceRate: 98,
  },
  
  createdAt: '2023-09-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

/**
 * 获取学生列表Mock数据
 */
export function getMockStudents(filters?: {
  search?: string;
  grade?: string;
  classId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): { data: Student[]; total: number } {
  let result = [...MOCK_STUDENTS];
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.studentNo.includes(search)
    );
  }
  
  if (filters?.grade && filters.grade !== 'all') {
    const grade = parseInt(filters.grade);
    // 使用 grade 字段过滤
    result = result.filter(s => s.grade === grade);
  }
  
  if (filters?.classId && filters.classId !== 'all') {
    result = result.filter(s => s.classId === filters.classId);
  }
  
  if (filters?.status && filters.status !== 'all') {
    result = result.filter(s => s.status === filters.status);
  }
  
  const total = result.length;
  
  // 分页
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const start = (page - 1) * pageSize;
  result = result.slice(start, start + pageSize);
  
  return { data: result, total };
}

/**
 * 获取学生详情Mock数据
 */
export function getMockStudent(id: string): Student | undefined {
  return MOCK_STUDENTS.find(s => s.id === id);
}

/**
 * 获取学生完整档案Mock数据
 */
export function getMockStudentProfile(id: string): StudentFullProfile | undefined {
  if (id === 's001') {
    return MOCK_STUDENT_PROFILE;
  }
  // 返回基础档案
  const student = MOCK_STUDENTS.find(s => s.id === id);
  if (student) {
    return {
      ...MOCK_STUDENT_PROFILE,
      id: student.id,
      studentNo: student.studentNo,
      name: student.name,
      gender: student.gender,
      birthDate: student.birthDate,
      classId: student.classId,
      className: student.className,
      status: student.status,
    };
  }
  return undefined;
}
