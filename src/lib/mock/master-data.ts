/**
 * 统一主数据源 - Master Data
 * 
 * 这是整个Mock数据层的数据源，所有其他Mock文件应该从这里导入基础数据，
 * 而不是独立定义，以确保数据一致性。
 * 
 * @see docs/DATA_ISOLATION_FIX_PLAN.md 整改方案
 */

// ============================================================
// 类型定义
// ============================================================

/** 班级主数据 */
export interface MasterClass {
  id: string;
  name: string;
  grade: number;
  gradeName: string;
  classNumber: number;
  headTeacherId: string;
  headTeacherName: string;
  classroomId: string;
  classroomName: string;
  building: string;
}

/** 教师主数据 */
export interface MasterTeacher {
  id: string;
  name: string;
  gender: 'male' | 'female';
  subjects: string[];
  isHeadTeacher: boolean;
  headTeacherClassIds: string[]; // 担任班主任的班级ID
  department: string;
  title: string;
  role?: 'head_teacher' | 'subject_teacher' | 'skill_teacher' | 'grade_leader' | 'research_group_leader' | 'research_group_deputy_leader';
}

/** 学生主数据 */
export interface MasterStudent {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  classId: string;
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
}

/** 学校主数据 */
export interface MasterSchool {
  id: string;
  name: string;
  shortName: string;
  totalGrades: number;
  currentSemester: string;
  academicYear: string;
}

// ============================================================
// 学校基础信息
// ============================================================

export const MASTER_SCHOOL: MasterSchool = {
  id: 'lysf-fx',
  name: '龙岩师范附属小学',
  shortName: '龙师附小',
  totalGrades: 6,
  currentSemester: '2024-2025-1',
  academicYear: '2024-2025',
};

// ============================================================
// 年级定义
// ============================================================

export const MASTER_GRADES = [
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
] as const;

/** 根据年级获取年级名称 */
export function getGradeName(grade: number): string {
  const found = MASTER_GRADES.find(g => g.value === grade);
  return found?.label || `${grade}年级`;
}

// ============================================================
// 班级定义（14个班级）
// ============================================================

export const MASTER_CLASSES: MasterClass[] = [
  // 一年级（3个班）
  {
    id: 'c001',
    name: '一年级1班',
    grade: 1,
    gradeName: '一年级',
    classNumber: 1,
    headTeacherId: 't001',
    headTeacherName: '张明华',
    classroomId: 'r001',
    classroomName: '教学楼A101',
    building: '教学楼A',
  },
  {
    id: 'c002',
    name: '一年级2班',
    grade: 1,
    gradeName: '一年级',
    classNumber: 2,
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    classroomId: 'r002',
    classroomName: '教学楼A102',
    building: '教学楼A',
  },
  {
    id: 'c003',
    name: '一年级3班',
    grade: 1,
    gradeName: '一年级',
    classNumber: 3,
    headTeacherId: 't003',
    headTeacherName: '王建国',
    classroomId: 'r003',
    classroomName: '教学楼A103',
    building: '教学楼A',
  },
  // 二年级（3个班）
  {
    id: 'c004',
    name: '二年级1班',
    grade: 2,
    gradeName: '二年级',
    classNumber: 1,
    headTeacherId: 't004',
    headTeacherName: '赵丽萍',
    classroomId: 'r004',
    classroomName: '教学楼A201',
    building: '教学楼A',
  },
  {
    id: 'c005',
    name: '二年级2班',
    grade: 2,
    gradeName: '二年级',
    classNumber: 2,
    headTeacherId: 't005',
    headTeacherName: '刘伟强',
    classroomId: 'r005',
    classroomName: '教学楼A202',
    building: '教学楼A',
  },
  {
    id: 'c006',
    name: '二年级3班',
    grade: 2,
    gradeName: '二年级',
    classNumber: 3,
    headTeacherId: 't006',
    headTeacherName: '陈美玲',
    classroomId: 'r006',
    classroomName: '教学楼A203',
    building: '教学楼A',
  },
  // 三年级（2个班）
  {
    id: 'c007',
    name: '三年级1班',
    grade: 3,
    gradeName: '三年级',
    classNumber: 1,
    headTeacherId: 't007',
    headTeacherName: '周志明',
    classroomId: 'r007',
    classroomName: '教学楼B101',
    building: '教学楼B',
  },
  {
    id: 'c008',
    name: '三年级2班',
    grade: 3,
    gradeName: '三年级',
    classNumber: 2,
    headTeacherId: 't008',
    headTeacherName: '陈思思',
    classroomId: 'r008',
    classroomName: '教学楼B102',
    building: '教学楼B',
  },
  // 四年级（2个班）
  {
    id: 'c009',
    name: '四年级1班',
    grade: 4,
    gradeName: '四年级',
    classNumber: 1,
    headTeacherId: 't009',
    headTeacherName: '黄志远',
    classroomId: 'r009',
    classroomName: '教学楼B201',
    building: '教学楼B',
  },
  {
    id: 'c010',
    name: '四年级2班',
    grade: 4,
    gradeName: '四年级',
    classNumber: 2,
    headTeacherId: 't010',
    headTeacherName: '吴晓丽',
    classroomId: 'r010',
    classroomName: '教学楼B202',
    building: '教学楼B',
  },
  // 五年级（2个班）
  {
    id: 'c011',
    name: '五年级1班',
    grade: 5,
    gradeName: '五年级',
    classNumber: 1,
    headTeacherId: 't001',
    headTeacherName: '张明华',
    classroomId: 'r011',
    classroomName: '教学楼C101',
    building: '教学楼C',
  },
  {
    id: 'c012',
    name: '五年级2班',
    grade: 5,
    gradeName: '五年级',
    classNumber: 2,
    headTeacherId: 't002',
    headTeacherName: '李秀芳',
    classroomId: 'r012',
    classroomName: '教学楼C102',
    building: '教学楼C',
  },
  // 六年级（2个班）
  {
    id: 'c013',
    name: '六年级1班',
    grade: 6,
    gradeName: '六年级',
    classNumber: 1,
    headTeacherId: 't003',
    headTeacherName: '王建国',
    classroomId: 'r013',
    classroomName: '教学楼C201',
    building: '教学楼C',
  },
  {
    id: 'c014',
    name: '六年级2班',
    grade: 6,
    gradeName: '六年级',
    classNumber: 2,
    headTeacherId: 't004',
    headTeacherName: '赵丽萍',
    classroomId: 'r014',
    classroomName: '教学楼C202',
    building: '教学楼C',
  },
];

// ============================================================
// 教师定义（28位教师：14位班主任 + 14位科任，均为语文或数学老师）
// ============================================================

export const MASTER_TEACHERS: MasterTeacher[] = [
  // === 班主任（14位，每人负责一个班级，均为语文或数学老师）===
  {
    id: 't001',
    name: '张明华',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c001'], // 一年级1班
    department: '语文组',
    title: '高级教师',
  },
  {
    id: 't002',
    name: '李秀芳',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c002'], // 一年级2班
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't003',
    name: '王建国',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c003'], // 一年级3班
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't004',
    name: '赵丽萍',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c004'], // 二年级1班
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't005',
    name: '刘伟强',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c005'], // 二年级2班
    department: '语文组',
    title: '二级教师',
  },
  {
    id: 't006',
    name: '陈美玲',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c006'], // 二年级3班
    department: '数学组',
    title: '二级教师',
  },
  {
    id: 't007',
    name: '周志明',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c007'], // 三年级1班
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't008',
    name: '陈思思',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c008'], // 三年级2班
    department: '数学组',
    title: '二级教师',
  },
  {
    id: 't009',
    name: '黄志远',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c009'], // 四年级1班
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't010',
    name: '吴晓丽',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c010'], // 四年级2班
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't011',
    name: '郑文博',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c011'], // 五年级1班
    department: '语文组',
    title: '高级教师',
  },
  {
    id: 't012',
    name: '孙雅琴',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c012'], // 五年级2班
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't013',
    name: '林志强',
    gender: 'male',
    subjects: ['语文'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c013'], // 六年级1班
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't014',
    name: '何美华',
    gender: 'female',
    subjects: ['数学'],
    isHeadTeacher: true,
    headTeacherClassIds: ['c014'], // 六年级2班
    department: '数学组',
    title: '高级教师',
  },
  // === 科任教师（14位，语文或数学老师，非班主任）===
  {
    id: 't015',
    name: '陈小红',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't016',
    name: '杨志伟',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '二级教师',
  },
  {
    id: 't017',
    name: '黄丽萍',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't018',
    name: '王建军',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't019',
    name: '张秀英',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '二级教师',
  },
  {
    id: 't020',
    name: '李国强',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't021',
    name: '周小燕',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '二级教师',
  },
  {
    id: 't022',
    name: '吴志明',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '二级教师',
  },
  {
    id: 't023',
    name: '郑丽华',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't024',
    name: '孙国平',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't025',
    name: '马秀兰',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '高级教师',
  },
  {
    id: 't026',
    name: '林志刚',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '一级教师',
  },
  {
    id: 't027',
    name: '陈美华',
    gender: 'female',
    subjects: ['语文'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '语文组',
    title: '一级教师',
  },
  {
    id: 't028',
    name: '黄建平',
    gender: 'male',
    subjects: ['数学'],
    isHeadTeacher: false,
    headTeacherClassIds: [],
    department: '数学组',
    title: '二级教师',
  },
];

// ============================================================
// 学生基础数据（每班若干代表性学生）
// ============================================================

export const MASTER_STUDENTS: MasterStudent[] = [
  // 一年级1班
  { id: 's001', studentNo: '2024001', name: '张三', gender: 'male', birthDate: '2017-03-15', classId: 'c001', status: '在校' },
  { id: 's002', studentNo: '2024002', name: '李四', gender: 'female', birthDate: '2017-05-20', classId: 'c001', status: '在校' },
  { id: 's003', studentNo: '2024003', name: '王五', gender: 'male', birthDate: '2017-08-10', classId: 'c001', status: '在校' },
  // 一年级2班
  { id: 's004', studentNo: '2024004', name: '赵六', gender: 'female', birthDate: '2017-11-25', classId: 'c002', status: '请假' },
  { id: 's005', studentNo: '2024005', name: '孙七', gender: 'male', birthDate: '2017-02-14', classId: 'c002', status: '在校' },
  { id: 's006', studentNo: '2024006', name: '周八', gender: 'female', birthDate: '2017-04-08', classId: 'c002', status: '在校' },
  // 一年级3班
  { id: 's007', studentNo: '2024007', name: '吴九', gender: 'male', birthDate: '2017-07-22', classId: 'c003', status: '在校' },
  { id: 's008', studentNo: '2024008', name: '郑十', gender: 'female', birthDate: '2017-09-30', classId: 'c003', status: '休学' },
  // 二年级1班
  { id: 's009', studentNo: '2023001', name: '钱一', gender: 'male', birthDate: '2016-01-15', classId: 'c004', status: '在校' },
  { id: 's010', studentNo: '2023002', name: '冯二', gender: 'female', birthDate: '2016-03-20', classId: 'c004', status: '在校' },
  // 二年级2班
  { id: 's011', studentNo: '2023003', name: '陈三', gender: 'male', birthDate: '2016-05-10', classId: 'c005', status: '在校' },
  { id: 's012', studentNo: '2023004', name: '褚四', gender: 'female', birthDate: '2016-07-25', classId: 'c005', status: '在校' },
  // 二年级3班
  { id: 's013', studentNo: '2023005', name: '卫五', gender: 'male', birthDate: '2016-09-14', classId: 'c006', status: '在校' },
  { id: 's014', studentNo: '2023006', name: '蒋六', gender: 'female', birthDate: '2016-11-08', classId: 'c006', status: '在校' },
  // 三年级1班
  { id: 's015', studentNo: '2022001', name: '沈七', gender: 'male', birthDate: '2015-02-22', classId: 'c007', status: '在校' },
  { id: 's016', studentNo: '2022002', name: '韩八', gender: 'female', birthDate: '2015-04-30', classId: 'c007', status: '在校' },
  // 三年级2班
  { id: 's017', studentNo: '2022003', name: '杨九', gender: 'male', birthDate: '2015-06-15', classId: 'c008', status: '在校' },
  { id: 's018', studentNo: '2022004', name: '朱十', gender: 'female', birthDate: '2015-08-20', classId: 'c008', status: '在校' },
  // 四年级1班
  { id: 's019', studentNo: '2021001', name: '秦一', gender: 'male', birthDate: '2014-01-10', classId: 'c009', status: '在校' },
  { id: 's020', studentNo: '2021002', name: '尤二', gender: 'female', birthDate: '2014-03-15', classId: 'c009', status: '在校' },
  // 四年级2班
  { id: 's021', studentNo: '2021003', name: '许三', gender: 'male', birthDate: '2014-05-20', classId: 'c010', status: '在校' },
  { id: 's022', studentNo: '2021004', name: '何四', gender: 'female', birthDate: '2014-07-25', classId: 'c010', status: '在校' },
  // 五年级1班
  { id: 's023', studentNo: '2020001', name: '吕五', gender: 'male', birthDate: '2013-02-28', classId: 'c011', status: '在校' },
  { id: 's024', studentNo: '2020002', name: '施六', gender: 'female', birthDate: '2013-04-10', classId: 'c011', status: '在校' },
  // 五年级2班
  { id: 's025', studentNo: '2020003', name: '张七', gender: 'male', birthDate: '2013-06-15', classId: 'c012', status: '在校' },
  { id: 's026', studentNo: '2020004', name: '孔八', gender: 'female', birthDate: '2013-08-20', classId: 'c012', status: '在校' },
  // 六年级1班
  { id: 's027', studentNo: '2019001', name: '曹九', gender: 'male', birthDate: '2012-01-05', classId: 'c013', status: '在校' },
  { id: 's028', studentNo: '2019002', name: '严十', gender: 'female', birthDate: '2012-03-10', classId: 'c013', status: '在校' },
  // 六年级2班
  { id: 's029', studentNo: '2019003', name: '华一', gender: 'male', birthDate: '2012-05-15', classId: 'c014', status: '在校' },
  { id: 's030', studentNo: '2019004', name: '金二', gender: 'female', birthDate: '2012-07-20', classId: 'c014', status: '在校' },
];

// ============================================================
// 辅助函数
// ============================================================

/** 根据班级ID获取班级信息 */
export function getMasterClassById(classId: string): MasterClass | undefined {
  return MASTER_CLASSES.find(c => c.id === classId);
}

/** 根据教师ID获取教师信息 */
export function getMasterTeacherById(teacherId: string): MasterTeacher | undefined {
  return MASTER_TEACHERS.find(t => t.id === teacherId);
}

/** 根据学生ID获取学生信息 */
export function getMasterStudentById(studentId: string): MasterStudent | undefined {
  return MASTER_STUDENTS.find(s => s.id === studentId);
}

/** 根据班级ID获取班主任信息 */
export function getHeadTeacherByClassId(classId: string): MasterTeacher | undefined {
  const cls = getMasterClassById(classId);
  if (!cls) return undefined;
  return getMasterTeacherById(cls.headTeacherId);
}

/** 根据班级ID获取该班学生列表 */
export function getStudentsByClassId(classId: string): MasterStudent[] {
  return MASTER_STUDENTS.filter(s => s.classId === classId);
}

/** 根据年级获取班级列表 */
export function getClassesByGrade(grade: number): MasterClass[] {
  return MASTER_CLASSES.filter(c => c.grade === grade);
}

/** 数据一致性检查 */
export function validateDataConsistency(): string[] {
  const errors: string[] = [];
  
  // 检查学生的班级引用
  MASTER_STUDENTS.forEach(s => {
    const cls = getMasterClassById(s.classId);
    if (!cls) {
      errors.push(`学生 ${s.id}(${s.name}) 引用不存在的班级 ${s.classId}`);
    }
  });
  
  // 检查班级的班主任引用
  MASTER_CLASSES.forEach(c => {
    const teacher = getMasterTeacherById(c.headTeacherId);
    if (!teacher) {
      errors.push(`班级 ${c.id}(${c.name}) 引用不存在的班主任 ${c.headTeacherId}`);
    }
  });
  
  // 检查教师的班主任班级引用
  MASTER_TEACHERS.forEach(t => {
    t.headTeacherClassIds.forEach(classId => {
      const cls = getMasterClassById(classId);
      if (!cls) {
        errors.push(`教师 ${t.id}(${t.name}) 引用不存在的班主任班级 ${classId}`);
      }
    });
  });
  
  return errors;
}
