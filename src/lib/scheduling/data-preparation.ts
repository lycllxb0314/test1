/**
 * 智能排课系统 - 数据准备层
 * 
 * 从 useTeachers 和 useClasses Hook 获取数据，转换为排课引擎所需格式
 */

import type { TeacherInfo } from '@/hooks/useTeachers';
import type { ClassContainer } from '@/hooks/useClasses';
import {
  type SchedulingTeacher,
  type SchedulingClass,
  type CourseCategory,
  type TeacherPrimaryRole,
  type AdministrativeRole,
  getGradeSegment,
  getWeeklyPeriods,
  STANDARD_SUBJECTS,
} from './types';
import { PRIORITY_SECONDARY_SUBJECTS } from '@/lib/data/teaching-rules';

/**
 * 将教师角色转换为排课角色
 * 支持英文角色代码和中文角色名称
 */
function mapToSchedulingRole(role: string): TeacherPrimaryRole {
  // 英文角色代码映射（数据库存储格式）
  const englishRoleMap: Record<string, TeacherPrimaryRole> = {
    'principal': 'principal',           // 校长
    'secretary': 'secretary',           // 书记
    'vice_principal': 'vice_principal', // 副校长
    'head_teacher': 'head_teacher',     // 班主任
    'subject_teacher': 'subject_teacher', // 科任教师
    'skill_teacher': 'skill_teacher',   // 技能课教师
    'subject_head': 'skill_teacher',    // 学科组长（视为技能课教师）
  };
  
  // 中文角色名称映射（兼容）
  const chineseRoleMap: Record<string, TeacherPrimaryRole> = {
    '校长': 'principal',
    '书记': 'secretary',
    '副校长': 'vice_principal',
    '班主任': 'head_teacher',
    '科任': 'subject_teacher',
    '科任教师': 'subject_teacher',
    '技能课教师': 'skill_teacher',
    '学科组长': 'skill_teacher',
  };
  
  // 优先匹配英文角色代码
  if (englishRoleMap[role]) {
    return englishRoleMap[role];
  }
  
  // 其次匹配中文角色名称
  if (chineseRoleMap[role]) {
    return chineseRoleMap[role];
  }
  
  // 默认返回科任教师
  return 'subject_teacher';
}

/**
 * 将兼任职务转换为排课兼任职务
 */
function mapToAdministrativeRole(role: string): AdministrativeRole {
  const roleMap: Record<string, AdministrativeRole> = {
    '教务主任': 'academic_director',
    '德育主任': 'moral_director',
    '总务主任': 'general_director',
    '年段长': 'grade_leader',
    '教研组长': 'research_group_leader',
    '教研副组长': 'research_group_deputy_leader',
    '少先队大队辅导员': 'young_pioneer_counselor',
  };
  return roleMap[role] || 'grade_leader';
}

/**
 * 将科目字符串转换为课程类型
 */
function mapToCourseCategory(subject: string): CourseCategory {
  const subjectMap: Record<string, CourseCategory> = {
    '语文': '语文',
    '数学': '数学',
    '英语': '英语',
    '体育': '体育',
    '音乐': '音乐',
    '美术': '美术',
    '科学': '科学',
    '道德与法治': '道德与法治',
    '德法': '道德与法治',
    '劳动': '劳动',
    '班会': '班会',
    '信息技术': '信息技术',
    '电脑': '信息技术',
  };
  return subjectMap[subject] || subject as CourseCategory;
}

/**
 * 判断教师是否可教主科（语文/数学）
 */
function canTeachMainSubject(teacher: TeacherInfo): boolean {
  const mainSubjects = ['语文', '数学'];
  return teacher.teachableSubjects?.some((s: string) => mainSubjects.includes(s)) || false;
}

/**
 * 计算主科带班数
 * 规则：有兼任职务 = 1个班，无兼任职务 = 2个班
 */
function calculateMainSubjectClassCount(teacher: TeacherInfo): number {
  if (!canTeachMainSubject(teacher)) return 0;
  
  // 有兼任职务的只带1个班主科
  if (teacher.additionalRoles && teacher.additionalRoles.length > 0) {
    return 1;
  }
  
  // 无兼任职务的可带2个班主科
  return 2;
}

/**
 * 将教师数据转换为排课教师数据
 */
export function prepareSchedulingTeacher(teacher: TeacherInfo): SchedulingTeacher {
  // 获取教务主任配置的周课时
  const baseWeeklyHours = teacher.weeklyHours || 14;
  
  // 根据教师类型确定课时范围（国家标准）
  // 语数教师（班主任/科任）：14-16节
  // 英语教师：14-16节（特殊技能科）
  // 其他技能科教师：16-18节
  const primaryRole = mapToSchedulingRole(teacher.primaryRole);
  const primarySubject = teacher.teachableSubjects?.[0] || teacher.subject || '语文';
  
  let minWeeklyHours: number;
  let maxWeeklyHours: number;
  
  // 判断是否为语数教师或英语教师
  const isMainSubjectTeacher = primarySubject === '语文' || primarySubject === '数学';
  const isEnglishTeacher = primarySubject === '英语';
  
  if (isMainSubjectTeacher || isEnglishTeacher) {
    // 语数教师、英语教师：国家标准 14-16 节
    minWeeklyHours = 14;
    maxWeeklyHours = 16;
  } else if (primaryRole === 'skill_teacher') {
    // 技能科教师：国家标准 16-18 节
    minWeeklyHours = 16;
    maxWeeklyHours = 18;
  } else {
    // 领导层：课时较少
    minWeeklyHours = 2;
    maxWeeklyHours = 8;
  }
  
  // 转换角色
  const additionalRoles = (teacher.additionalRoles || []).map(mapToAdministrativeRole);
  const hasAdministrativeRole = additionalRoles.length > 0;
  
  // 转换任课科目（包含兜底逻辑）
  const primarySubjectCourse: CourseCategory = mapToCourseCategory(primarySubject);
  
  // 获取兼任科目：优先使用配置的，否则使用规则建议
  let secondarySubjectsList: string[] = [];
  if (teacher.teachableSubjects && teacher.teachableSubjects.length > 1) {
    // 有配置的兼任科目
    secondarySubjectsList = teacher.teachableSubjects.slice(1);
  } else {
    // 兜底：使用规则建议的兼任科目
    const suggestedSecondary = PRIORITY_SECONDARY_SUBJECTS[primarySubject] || [];
    secondarySubjectsList = suggestedSecondary;
  }
  
  // 构建完整的可任教科目列表
  const teachableSubjects: CourseCategory[] = [
    primarySubjectCourse,
    ...secondarySubjectsList.map(mapToCourseCategory)
  ];
  const secondarySubjects = teachableSubjects.slice(1);
  
  return {
    id: teacher.id,
    name: teacher.name,
    gender: teacher.gender,
    department: teacher.department,
    
    // 角色信息
    primaryRole,
    additionalRoles,
    hasAdministrativeRole,
    
    // 任课设置
    primarySubject: primarySubjectCourse,
    secondarySubjects,
    teachableSubjects,
    
    // 学段设置
    teachableGrades: teacher.teachableGrades || [1, 2, 3, 4, 5, 6],
    
    // 课时配置（基于国家标准）
    baseWeeklyHours,
    minWeeklyHours,
    maxWeeklyHours,
    currentWeeklyHours: teacher.currentHours || 0,
    
    // 班级关联
    isHeadTeacher: teacher.isHeadTeacher || false,
    headTeacherClassId: teacher.headTeacherClassId,
    headTeacherClassName: teacher.headTeacherClassName,
    subTeacherClassId: teacher.subTeacherClasses?.[0]?.classId,
    subTeacherClassName: teacher.subTeacherClasses?.[0]?.className,
    assignedClasses: [],
    
    // 排课状态
    canTeachMainSubject: canTeachMainSubject(teacher),
    mainSubjectClassCount: calculateMainSubjectClassCount(teacher),
  };
}

/**
 * 将班级数据转换为排课班级数据
 */
export function prepareSchedulingClass(cls: ClassContainer): SchedulingClass {
  return {
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    segment: getGradeSegment(cls.grade),
    classNumber: cls.classNumber,
    headTeacherId: cls.headTeacherId,
    headTeacherName: cls.headTeacherName,
    subTeacherId: cls.subTeacherId,
    subTeacherName: cls.subTeacherName,
    studentCount: cls.studentCount,
    weeklyPeriods: getWeeklyPeriods(cls.grade),
    subjectRequirements: new Map(),
    arrangedSlots: [],
  };
}

/**
 * 批量准备教师数据
 */
export function prepareSchedulingTeachers(teachers: TeacherInfo[]): SchedulingTeacher[] {
  return teachers
    .filter(t => t.primaryRole !== 'principal' && t.primaryRole !== 'secretary' && t.primaryRole !== 'vice_principal') // 领导层不排课
    .map(prepareSchedulingTeacher);
}

/**
 * 批量准备班级数据
 */
export function prepareSchedulingClasses(classes: ClassContainer[]): SchedulingClass[] {
  return classes.map(prepareSchedulingClass);
}

/**
 * 验证数据完整性
 */
export function validateSchedulingData(
  teachers: SchedulingTeacher[],
  classes: SchedulingClass[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 检查是否有教师
  if (teachers.length === 0) {
    errors.push('没有可排课的教师');
  }
  
  // 检查是否有班级
  if (classes.length === 0) {
    errors.push('没有需要排课的班级');
  }
  
  // 检查每个班级是否有班主任
  for (const cls of classes) {
    if (!cls.headTeacherId) {
      errors.push(`班级 ${cls.name} 没有班主任`);
    }
  }
  
  // 检查每个班级的班主任是否在教师列表中
  const teacherIds = new Set(teachers.map(t => t.id));
  for (const cls of classes) {
    if (cls.headTeacherId && !teacherIds.has(cls.headTeacherId)) {
      errors.push(`班级 ${cls.name} 的班主任不在可排课教师列表中`);
    }
  }
  
  // 只检查核心主科（语文、数学必须有教师）
  // 班会课由班主任上，不需要额外检查
  // 道德与法治、劳动：有专职教师就用专职，没有则由语数老师兼任
  const coreSubjects: CourseCategory[] = ['语文', '数学'];
  for (const subject of coreSubjects) {
    const hasTeacher = teachers.some(t => t.teachableSubjects.includes(subject));
    if (!hasTeacher) {
      errors.push(`没有可以教授 ${subject} 的教师`);
    }
  }
  
  // 技能科只做警告提示，不阻止排课
  // 这些科目如果没教师，排课时会跳过或由其他教师兼任
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 生成排课预览数据
 */
export function generateSchedulingPreview(
  teachers: SchedulingTeacher[],
  classes: SchedulingClass[]
): {
  totalSlots: number;
  totalTeacherHours: number;
  avgTeacherHours: number;
  subjectCoverage: Array<{ subject: CourseCategory; teachers: number; hours: number }>;
} {
  // 计算总课时槽
  const totalSlots = classes.reduce((sum, cls) => {
    const segment = cls.segment;
    const weeklyPeriods = segment === 'low' ? 30 : segment === 'middle' ? 32 : 34;
    return sum + weeklyPeriods;
  }, 0);
  
  // 计算教师总课时
  const totalTeacherHours = teachers.reduce((sum, t) => sum + t.baseWeeklyHours, 0);
  
  // 平均课时
  const avgTeacherHours = teachers.length > 0 ? totalTeacherHours / teachers.length : 0;
  
  // 科目覆盖率 - 使用普通对象而非 Map
  const subjectCoverageMap = new Map<CourseCategory, { teachers: number; hours: number }>();
  
  // 初始化所有科目
  STANDARD_SUBJECTS.forEach(subject => {
    subjectCoverageMap.set(subject.name, { teachers: 0, hours: 0 });
  });
  
  // 统计每个科目的教师数和课时数
  for (const teacher of teachers) {
    for (const subject of teacher.teachableSubjects) {
      const existing = subjectCoverageMap.get(subject);
      if (existing) {
        existing.teachers++;
      } else {
        subjectCoverageMap.set(subject, { teachers: 1, hours: 0 });
      }
    }
  }
  
  // 计算每个科目需要的总课时（根据班级数和年级）
  for (const cls of classes) {
    const segment = cls.segment;
    for (const subject of STANDARD_SUBJECTS) {
      const hours = subject.weeklyHours[segment];
      const existing = subjectCoverageMap.get(subject.name);
      if (existing) {
        existing.hours += hours;
      }
    }
  }
  
  // 转换为数组格式，便于 JSON 序列化
  const subjectCoverage = Array.from(subjectCoverageMap.entries()).map(([subject, data]) => ({
    subject,
    teachers: data.teachers,
    hours: data.hours,
  }));
  
  return {
    totalSlots,
    totalTeacherHours,
    avgTeacherHours: Math.round(avgTeacherHours * 10) / 10,
    subjectCoverage,
  };
}
