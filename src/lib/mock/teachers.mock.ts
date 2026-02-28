/**
 * 教师相关Mock数据
 */

import type { Teacher, TeacherProfile, TeacherRecord, TeacherHonor, TeacherTraining, TeacherAchievement } from '@/types';

// 教师列表Mock数据
export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't001',
    name: '张明华',
    employeeNo: 'T2005001',
    gender: 'male',
    phone: '138****1001',
    email: 'zhangmh@lysf.fx.edu.cn',
    subjects: ['语文'],
    isHeadTeacher: true,
    classId: 'c001',
    className: '一年级1班',
    department: '语文组',
    position: '教研组长',
    avatar: undefined,
  },
  {
    id: 't002',
    name: '李秀芳',
    employeeNo: 'T2008002',
    gender: 'female',
    phone: '139****2002',
    email: 'lixf@lysf.fx.edu.cn',
    subjects: ['数学'],
    isHeadTeacher: true,
    classId: 'c002',
    className: '一年级2班',
    department: '数学组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't003',
    name: '王建国',
    employeeNo: 'T2010003',
    gender: 'male',
    phone: '137****3003',
    email: 'wangjg@lysf.fx.edu.cn',
    subjects: ['语文'],
    isHeadTeacher: true,
    classId: 'c003',
    className: '二年级1班',
    department: '语文组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't004',
    name: '赵丽萍',
    employeeNo: 'T2012004',
    gender: 'female',
    phone: '136****4004',
    email: 'zhaolp@lysf.fx.edu.cn',
    subjects: ['数学', '科学'],
    isHeadTeacher: false,
    department: '数学组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't005',
    name: '刘伟强',
    employeeNo: 'T2015005',
    gender: 'male',
    phone: '135****5005',
    email: 'liuwq@lysf.fx.edu.cn',
    subjects: ['语文'],
    isHeadTeacher: false,
    department: '语文组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't006',
    name: '陈美玲',
    employeeNo: 'T2016006',
    gender: 'female',
    phone: '134****6006',
    email: 'chenml@lysf.fx.edu.cn',
    subjects: ['数学'],
    isHeadTeacher: true,
    classId: 'c004',
    className: '三年级1班',
    department: '数学组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't007',
    name: '周志明',
    employeeNo: 'T2017007',
    gender: 'male',
    phone: '133****7007',
    email: 'zhouzm@lysf.fx.edu.cn',
    subjects: ['英语'],
    isHeadTeacher: false,
    department: '英语组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't008',
    name: '陈思思',
    employeeNo: 'T2018008',
    gender: 'female',
    phone: '132****8008',
    email: 'chenss@lysf.fx.edu.cn',
    subjects: ['美术'],
    isHeadTeacher: false,
    department: '艺术组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't009',
    name: '王强',
    employeeNo: 'T2019009',
    gender: 'male',
    phone: '131****9009',
    email: 'wangq@lysf.fx.edu.cn',
    subjects: ['体育'],
    isHeadTeacher: false,
    department: '体育组',
    position: undefined,
    avatar: undefined,
  },
  {
    id: 't010',
    name: '林小燕',
    employeeNo: 'T2020010',
    gender: 'female',
    phone: '130****0010',
    email: 'linxy@lysf.fx.edu.cn',
    subjects: ['音乐'],
    isHeadTeacher: false,
    department: '艺术组',
    position: undefined,
    avatar: undefined,
  },
];

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
    { id: 'tr1', teacherId: 't001', name: '新课标解读培训', type: '市级培训', organizer: '龙岩市教育局', startDate: '2024-01-15', endDate: '2024-01-17', hours: 24, status: '已完成', certificate: 'cert-001' },
    { id: 'tr2', teacherId: 't001', name: '信息技术应用能力提升', type: '省级培训', organizer: '福建省教育厅', startDate: '2023-11-01', endDate: '2023-11-30', hours: 48, status: '已完成' },
    { id: 'tr3', teacherId: 't001', name: '班主任工作培训', type: '校内培训', organizer: '学校教务处', startDate: '2023-09-01', endDate: '2023-09-03', hours: 16, status: '已完成' },
  ],
  
  achievements: [
    { id: 'a1', teacherId: 't001', type: '公开课', title: '《背影》区级公开课', level: '区级', result: '优秀', date: '2023-11-20', description: '面向全区语文教师的示范课' },
    { id: 'a2', teacherId: 't001', type: '教学比赛', title: '龙岩市语文教学技能大赛', level: '市级', result: '一等奖', date: '2023-05-10' },
    { id: 'a3', teacherId: 't001', type: '论文发表', title: '小学语文阅读教学策略研究', level: '省级', date: '2022-08', description: '发表于《福建教育》2022年第8期' },
    { id: 'a4', teacherId: 't001', type: '课题研究', title: '小学语文核心素养培养研究', level: '市级', result: '结题', date: '2023-06', description: '市级课题主持人' },
    { id: 'a5', teacherId: 't001', type: '指导学生获奖', title: '指导学生参加征文比赛', level: '省级', result: '一等奖2人', date: '2023-12' },
  ],
  
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2024-03-15T00:00:00Z',
};

/**
 * 获取教师列表Mock数据
 */
export function getMockTeachers(filters?: {
  search?: string;
  subject?: string;
  status?: string;
  department?: string;
  isHeadTeacher?: boolean;
}): Teacher[] {
  let result = [...MOCK_TEACHERS];
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(search) || 
      t.employeeNo.toLowerCase().includes(search)
    );
  }
  
  if (filters?.subject && filters.subject !== 'all') {
    result = result.filter(t => t.subjects.includes(filters.subject!));
  }
  
  if (filters?.department && filters.department !== 'all') {
    result = result.filter(t => t.department === filters.department);
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
  return undefined;
}
