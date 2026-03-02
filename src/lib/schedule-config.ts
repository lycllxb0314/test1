/**
 * 课程表配置
 * 各年级各学科每周课时参考标准
 */

// 各年级各学科每周课时参考
export const SUBJECT_HOURS: Record<string, Record<number, number>> = {
  '语文': { 1: 7, 2: 7, 3: 6, 4: 6, 5: 6, 6: 6 },
  '数学': { 1: 4, 2: 4, 3: 5, 4: 5, 5: 5, 6: 5 },
  '道德与法治': { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
  '科学': { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3 },
  '体育': { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 },
  '音乐': { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 },
  '美术': { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 },
  '书法': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  '劳动': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  '综合实践': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  '信息技术': { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1 },
  '英语': { 1: 0, 2: 0, 3: 2, 4: 2, 5: 2, 6: 2 },
  '校本': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  '班会': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
};

// 各年级每周总课时（用于约束）
export const GRADE_TOTAL_HOURS: Record<number, number> = {
  1: 26,  // 一年级
  2: 26,  // 二年级
  3: 30,  // 三年级
  4: 30,  // 四年级
  5: 30,  // 五年级
  6: 30,  // 六年级
};

// 年级中文映射
export const GRADE_CHINESE: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六',
};

// 获取某年级的学科课时列表（用于可视化）
export function getGradeSubjectHours(grade: number): { subject: string; hours: number }[] {
  const result: { subject: string; hours: number }[] = [];
  
  for (const [subject, gradeHours] of Object.entries(SUBJECT_HOURS)) {
    const hours = gradeHours[grade] || 0;
    if (hours > 0) {
      result.push({ subject, hours });
    }
  }
  
  // 按课时降序排序
  return result.sort((a, b) => b.hours - a.hours);
}

// 获取某年级的总课时参考
export function getGradeTotalHours(grade: number): number {
  return GRADE_TOTAL_HOURS[grade] || 30;
}

// 计算某年级所有学科课时总和（参考标准）
export function calculateGradeTotalHours(grade: number): number {
  let total = 0;
  for (const gradeHours of Object.values(SUBJECT_HOURS)) {
    total += gradeHours[grade] || 0;
  }
  return total;
}
