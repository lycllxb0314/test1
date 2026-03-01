/**
 * 教师相关Mock数据
 * 
 * 数据来源：从 master-data.ts 导入统一主数据
 */

import type { Teacher, TeacherProfile, TeacherRecord, TeacherHonor, TeacherTraining, TeacherAchievement } from '@/types';
import { 
  MASTER_TEACHERS, 
  MASTER_CLASSES,
  getMasterTeacherById,
  getMasterClassById,
} from './master-data';

// 辅助函数：生成工号
function generateEmployeeNo(index: number): string {
  return `T${2000 + index}${String(index).padStart(2, '0')}`;
}

// 教师列表Mock数据（基于 master-data.ts）
export const MOCK_TEACHERS: Teacher[] = MASTER_TEACHERS.map((t, index) => {
  // 获取班主任班级信息
  const headTeacherClass = t.headTeacherClassIds.length > 0 
    ? getMasterClassById(t.headTeacherClassIds[0]) 
    : undefined;
  
  return {
    id: t.id,
    name: t.name,
    employeeNo: generateEmployeeNo(index + 1),
    gender: t.gender,
    phone: `1${['38', '39', '36', '35', '34', '33', '32', '31', '30'][index % 9]}****${String(1000 + index).slice(1)}`,
    email: `${t.name.toLowerCase().replace(/\s/g, '')}@lysf.fx.edu.cn`,
    subjects: t.subjects,
    isHeadTeacher: t.isHeadTeacher,
    classId: headTeacherClass?.id,
    className: headTeacherClass?.name,
    department: t.department,
    position: index === 0 ? '教研组长' : undefined,
    avatar: undefined,
  };
});

// 教师完整档案Mock数据
export const MOCK_TEACHER_PROFILE: TeacherProfile = {
  id: 't001',
  userId: 'u001',
  
  name: '张明华',
  gender: '男',
  birthDate: '1985-03-15',
  idCard: '3508**********0015',
  ethnicity: '汉族',
  politicalStatus: '中共党员',
  nativePlace: '福建龙岩',
  
  phone: '138****1001',
  email: 'zhangmh@lysf.fx.edu.cn',
  emergencyContact: '张父',
  emergencyPhone: '139****2001',
  address: '龙岩市新罗区xx路xx号',
  
  employeeId: 'T2005001',
  subjects: ['语文'],
  title: '高级教师',
  titleDate: '2018-09-01',
  education: '本科',
  school: '福建师范大学',
  major: '汉语言文学',
  graduationDate: '2007-06',
  teachYears: 17,
  joinDate: '2007-09-01',
  department: '语文组',
  
  isHeadTeacher: true,
  classId: 'c001',
  className: '一年级1班',
  headTeacherYears: 8,
  
  status: 'active',
  
  records: [
    { id: 'r1', teacherId: 't001', type: 'education', title: '本科学历', description: '福建师范大学 汉语言文学专业', date: '2007-06', createdAt: '2020-01-01' },
    { id: 'r2', teacherId: 't001', type: 'title', title: '二级教师', date: '2010-09', createdAt: '2020-01-01' },
    { id: 'r3', teacherId: 't001', type: 'title', title: '一级教师', date: '2014-09', createdAt: '2020-01-01' },
    { id: 'r4', teacherId: 't001', type: 'title', title: '高级教师', date: '2018-09', createdAt: '2020-01-01' },
    { id: 'r5', teacherId: 't001', type: 'position', title: '担任语文教研组长', date: '2019-09', createdAt: '2020-01-01' },
  ],
  
  honors: [
    { id: 'h1', teacherId: 't001', title: '龙岩市优秀教师', level: '市级', category: '综合', issuer: '龙岩市教育局', date: '2023-09', certificateNo: 'LY202309001' },
    { id: 'h2', teacherId: 't001', title: '区级教学能手', level: '区级', category: '教学', issuer: '新罗区教育局', date: '2022-06' },
    { id: 'h3', teacherId: 't001', title: '校级优秀班主任', level: '校级', category: '德育', issuer: '学校', date: '2020-09' },
    { id: 'h4', teacherId: 't001', title: '福建省骨干教师', level: '省级', category: '综合', issuer: '福建省教育厅', date: '2021-12' },
  ],
  
  trainings: [
    { id: 'tr1', teacherId: 't001', name: '新课标培训', type: '市级培训', hours: 24, startDate: '2024-01-15', endDate: '2024-01-17', organizer: '龙岩市教育局', status: '已完成' },
    { id: 'tr2', teacherId: 't001', name: '信息技术应用能力提升', type: '省级培训', hours: 48, startDate: '2023-09-01', endDate: '2023-12-30', organizer: '福建省教育厅', status: '已完成' },
    { id: 'tr3', teacherId: 't001', name: '班主任工作培训', type: '市级培训', hours: 16, startDate: '2023-11-01', endDate: '2023-11-02', organizer: '龙岩市教育局', status: '已完成' },
  ],
  
  achievements: [
    { id: 'a1', teacherId: 't001', title: '《小学语文阅读教学策略研究》', type: '论文发表', level: '省级', date: '2023-06', description: '福建教育' },
    { id: 'a2', teacherId: 't001', title: '区级公开课《桂林山水》', type: '公开课', level: '区级', date: '2023-10' },
    { id: 'a3', teacherId: 't001', title: '主持区级课题《小学语文群文阅读研究》', type: '课题研究', level: '区级', date: '2022-09' },
  ],
  
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

/**
 * 获取教师列表Mock数据
 */
export function getMockTeachers(filters?: {
  search?: string;
  subject?: string;
  department?: string;
  isHeadTeacher?: boolean;
}): Teacher[] {
  let result = [...MOCK_TEACHERS];
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(search) || 
      t.employeeNo?.includes(search) ||
      t.email?.toLowerCase().includes(search)
    );
  }
  
  if (filters?.subject && filters.subject !== 'all') {
    result = result.filter(t => t.subjects.includes(filters.subject as string));
  }
  
  if (filters?.department && filters.department !== 'all') {
    result = result.filter(t => t.department === filters.department);
  }
  
  if (filters?.isHeadTeacher !== undefined) {
    result = result.filter(t => t.isHeadTeacher === filters.isHeadTeacher);
  }
  
  return result;
}

/**
 * 获取教师详情Mock数据
 */
export function getMockTeacher(id: string): Teacher | undefined {
  return MOCK_TEACHERS.find(t => t.id === id);
}

/**
 * 获取教师完整档案Mock数据
 */
export function getMockTeacherProfile(id: string): TeacherProfile | undefined {
  if (id === 't001') {
    return MOCK_TEACHER_PROFILE;
  }
  
  const teacher = MOCK_TEACHERS.find(t => t.id === id);
  if (teacher) {
    const masterTeacher = getMasterTeacherById(id);
    return {
      ...MOCK_TEACHER_PROFILE,
      id: teacher.id,
      userId: `u_${teacher.id}`,
      name: teacher.name,
      gender: teacher.gender === 'male' ? '男' : '女',
      subjects: teacher.subjects,
      department: teacher.department || masterTeacher?.department || '未分配',
      isHeadTeacher: teacher.isHeadTeacher,
      classId: teacher.classId,
      className: teacher.className,
      title: masterTeacher?.title || '二级教师',
    };
  }
  return undefined;
}
