/**
 * 年级课程配置
 * 
 * 根据教育部课程标准和福建省小学实际情况配置
 */

import type { GradeCourseConfig, SchoolBaseConfig } from './types';

/** 标准年级课程配置（福建省小学） */
export const GRADE_COURSE_CONFIGS: GradeCourseConfig[] = [
  // 一年级
  {
    grade: 1,
    gradeName: '一年级',
    courses: {
      chinese: 8,      // 语文 8节
      math: 4,         // 数学 4节
      pe: 4,           // 体育 4节
      music: 2,        // 音乐 2节
      art: 2,          // 美术 2节
      moral: 2,        // 道德与法治 2节
      science: 0,      // 科学（低年级不单独开设）
      english: 0,      // 英语（一二年级不开设）
      labor: 1,        // 劳动 1节
      meeting: 1,      // 班会 1节
    },
    periodsPerDay: 6,
  },
  // 二年级
  {
    grade: 2,
    gradeName: '二年级',
    courses: {
      chinese: 8,
      math: 4,
      pe: 4,
      music: 2,
      art: 2,
      moral: 2,
      science: 0,
      english: 0,
      labor: 1,
      meeting: 1,
    },
    periodsPerDay: 6,
  },
  // 三年级
  {
    grade: 3,
    gradeName: '三年级',
    courses: {
      chinese: 7,      // 语文 7节
      math: 4,         // 数学 4节
      pe: 3,           // 体育 3节
      music: 2,        // 音乐 2节
      art: 2,          // 美术 2节
      moral: 2,        // 道德与法治 2节
      science: 2,      // 科学 2节
      english: 2,      // 英语 2节
      labor: 1,        // 劳动 1节
      meeting: 1,      // 班会 1节
    },
    periodsPerDay: 6,
  },
  // 四年级
  {
    grade: 4,
    gradeName: '四年级',
    courses: {
      chinese: 7,
      math: 4,
      pe: 3,
      music: 2,
      art: 2,
      moral: 2,
      science: 2,
      english: 2,
      labor: 1,
      meeting: 1,
    },
    periodsPerDay: 6,
  },
  // 五年级
  {
    grade: 5,
    gradeName: '五年级',
    courses: {
      chinese: 6,      // 语文 6节
      math: 5,         // 数学 5节
      pe: 3,           // 体育 3节
      music: 2,        // 音乐 2节
      art: 2,          // 美术 2节
      moral: 2,        // 道德与法治 2节
      science: 2,      // 科学 2节
      english: 3,      // 英语 3节
      labor: 1,        // 劳动 1节
      meeting: 1,      // 班会 1节
    },
    periodsPerDay: 6,
  },
  // 六年级
  {
    grade: 6,
    gradeName: '六年级',
    courses: {
      chinese: 6,
      math: 5,
      pe: 3,
      music: 2,
      art: 2,
      moral: 2,
      science: 2,
      english: 3,
      labor: 1,
      meeting: 1,
    },
    periodsPerDay: 6,
  },
];

/** 默认学校配置（龙岩师范附属小学） */
export const DEFAULT_SCHOOL_CONFIG: SchoolBaseConfig = {
  name: '龙岩师范附属小学',
  classCount: 60,
  classesPerGrade: 10,
  
  teacherCount: 107,
  chineseTeachers: 30,
  mathTeachers: 30,
  skillTeachers: {
    pe: 8,
    music: 7,
    art: 6,
    moral: 10,
    science: 8,
    english: 8,
  },
  
  gradeConfigs: GRADE_COURSE_CONFIGS,
};

/**
 * 计算年级总课时
 */
export function calculateGradeTotalPeriods(config: GradeCourseConfig): number {
  return Object.values(config.courses).reduce((sum, p) => sum + p, 0);
}

/**
 * 计算学校每周总课时
 */
export function calculateSchoolTotalPeriods(config: SchoolBaseConfig): number {
  let total = 0;
  for (const gradeConfig of config.gradeConfigs) {
    const gradeTotal = calculateGradeTotalPeriods(gradeConfig);
    total += gradeTotal * config.classesPerGrade;
  }
  return total;
}

/**
 * 计算各科目总课时需求
 */
export function calculateSubjectRequirements(config: SchoolBaseConfig): Record<string, number> {
  const subjects: Record<string, number> = {
    chinese: 0,
    math: 0,
    pe: 0,
    music: 0,
    art: 0,
    moral: 0,
    science: 0,
    english: 0,
    labor: 0,
    meeting: 0,
  };
  
  for (const gradeConfig of config.gradeConfigs) {
    const classesInGrade = config.classesPerGrade;
    for (const [subject, periods] of Object.entries(gradeConfig.courses)) {
      subjects[subject] += periods * classesInGrade;
    }
  }
  
  return subjects;
}

/**
 * 计算教师需求量
 */
export function calculateTeacherRequirements(config: SchoolBaseConfig): Record<string, { required: number; available: number; gap: number }> {
  const subjectReqs = calculateSubjectRequirements(config);
  
  // 标准课时量（每位教师每周）
  const standardPeriods = {
    chinese: 16,   // 语文老师每周16节
    math: 18,      // 数学老师每周18节
    pe: 20,        // 体育老师每周20节
    music: 20,
    art: 20,
    moral: 18,
    science: 18,
    english: 18,
  };
  
  const result: Record<string, { required: number; available: number; gap: number }> = {};
  
  // 语文
  result.chinese = {
    required: Math.ceil(subjectReqs.chinese / standardPeriods.chinese),
    available: config.chineseTeachers,
    gap: config.chineseTeachers - Math.ceil(subjectReqs.chinese / standardPeriods.chinese),
  };
  
  // 数学
  result.math = {
    required: Math.ceil(subjectReqs.math / standardPeriods.math),
    available: config.mathTeachers,
    gap: config.mathTeachers - Math.ceil(subjectReqs.math / standardPeriods.math),
  };
  
  // 技能科
  const skillMap: Record<string, string> = {
    pe: 'pe',
    music: 'music',
    art: 'art',
    moral: 'moral',
    science: 'science',
    english: 'english',
  };
  
  for (const [subject, key] of Object.entries(skillMap)) {
    result[subject] = {
      required: Math.ceil(subjectReqs[subject] / (standardPeriods as Record<string, number>)[subject]),
      available: config.skillTeachers[key as keyof typeof config.skillTeachers],
      gap: config.skillTeachers[key as keyof typeof config.skillTeachers] - Math.ceil(subjectReqs[subject] / (standardPeriods as Record<string, number>)[subject]),
    };
  }
  
  return result;
}
