/**
 * 学生相关Mock数据
 * 
 * 数据来源：从 master-data.ts 导入统一主数据
 */

import type { Student, StudentFullProfile, Parent } from '@/types';
import { 
  MASTER_STUDENTS, 
  MASTER_CLASSES, 
  MASTER_TEACHERS,
  getMasterClassById,
  getMasterTeacherById,
  getGradeName,
} from './master-data';

// 辅助函数：根据班级ID获取班级信息
function getClassInfo(classId: string) {
  const cls = getMasterClassById(classId);
  if (!cls) {
    return { grade: 1, gradeName: '一年级', headTeacherId: 't001', headTeacherName: '未知' };
  }
  return {
    grade: cls.grade,
    gradeName: cls.gradeName,
    headTeacherId: cls.headTeacherId,
    headTeacherName: cls.headTeacherName,
  };
}

// 学生列表Mock数据（基于 master-data.ts）
export const MOCK_STUDENTS: Student[] = MASTER_STUDENTS.map(s => {
  const cls = getMasterClassById(s.classId);
  const teacher = cls ? getMasterTeacherById(cls.headTeacherId) : undefined;
  
  return {
    id: s.id,
    studentNo: s.studentNo,
    name: s.name,
    gender: s.gender,
    birthDate: s.birthDate,
    classId: s.classId,
    className: cls?.name || '未知班级',
    grade: cls?.grade || 1,
    gradeName: cls?.gradeName || '一年级',
    headTeacherId: cls?.headTeacherId || '',
    headTeacherName: cls?.headTeacherName || '未知',
    status: s.status,
    parents: [],
  };
});

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
