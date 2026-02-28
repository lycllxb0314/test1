/**
 * 德育相关Mock数据
 */

import type { HabitGoal, StudentMonthlyGoal, HabitAssessment, HabitStar, StudentHabitProfile, HabitCategory } from '@/types';

// 习惯目标Mock数据
export const MOCK_HABIT_GOALS: HabitGoal[] = [
  // 文明习惯
  { id: 'hg001', category: 'civilization', code: 'C01', title: '理性爱国', description: '了解国情，热爱祖国', gradeLevel: 'lower', indicators: ['升旗仪式肃立', '会唱国歌'], maxScore: 100 },
  { id: 'hg002', category: 'civilization', code: 'C02', title: '礼貌待人', description: '文明用语，尊重他人', gradeLevel: 'lower', indicators: ['使用礼貌用语', '不打架骂人'], maxScore: 100 },
  // 书写习惯
  { id: 'hg003', category: 'writing', code: 'W01', title: '姿势正确', description: '保持正确的书写姿势', gradeLevel: 'lower', indicators: ['坐姿端正', '握笔正确'], maxScore: 100 },
  { id: 'hg004', category: 'writing', code: 'W02', title: '书写工整', description: '字迹清晰、规范', gradeLevel: 'middle', indicators: ['字迹工整', '卷面整洁'], maxScore: 100 },
  // 阅读习惯
  { id: 'hg005', category: 'reading', code: 'R01', title: '热爱阅读', description: '养成每日阅读习惯', gradeLevel: 'lower', indicators: ['每日阅读30分钟', '做读书笔记'], maxScore: 100 },
  // 运动习惯
  { id: 'hg006', category: 'sports', code: 'S01', title: '坚持锻炼', description: '每天进行体育锻炼', gradeLevel: 'lower', indicators: ['每天锻炼1小时', '掌握一项运动技能'], maxScore: 100 },
  // 安全习惯
  { id: 'hg007', category: 'safety', code: 'SF01', title: '安全意识', description: '遵守安全规则', gradeLevel: 'lower', indicators: ['不追逐打闹', '遵守交通规则'], maxScore: 100 },
  // 卫生习惯
  { id: 'hg008', category: 'hygiene', code: 'H01', title: '个人卫生', description: '保持个人卫生', gradeLevel: 'lower', indicators: ['勤洗手', '保持衣着整洁'], maxScore: 100 },
  // 审美习惯
  { id: 'hg009', category: 'aesthetic', code: 'A01', title: '艺术素养', description: '培养艺术兴趣', gradeLevel: 'middle', indicators: ['参加艺术活动', '欣赏艺术作品'], maxScore: 100 },
  // 劳动习惯
  { id: 'hg010', category: 'labor', code: 'L01', title: '热爱劳动', description: '主动参与劳动', gradeLevel: 'lower', indicators: ['自己的事自己做', '帮助班级劳动'], maxScore: 100 },
];

// 学生月度小目标Mock数据
export const MOCK_MONTHLY_GOALS: StudentMonthlyGoal[] = [
  {
    id: 'smg001',
    studentId: 's001',
    studentName: '张三',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    month: '2024-11',
    goals: [
      {
        id: 'g001',
        category: 'civilization',
        goalId: 'hg002',
        title: '使用礼貌用语',
        description: '每天使用"请、谢谢、对不起"等礼貌用语',
        records: [],
        totalDays: 30,
        achievedDays: 28,
        achievementRate: 93,
        isAchieved: true,
      },
      {
        id: 'g002',
        category: 'reading',
        goalId: 'hg005',
        title: '每日阅读30分钟',
        description: '每天阅读课外书籍至少30分钟',
        records: [],
        totalDays: 30,
        achievedDays: 25,
        achievementRate: 83,
        isAchieved: true,
      },
    ],
    totalGoals: 2,
    achievedGoals: 2,
    achievementRate: 88,
    isHabitStar: true,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
];

// 习惯评价记录Mock数据
export const MOCK_HABIT_ASSESSMENTS: HabitAssessment[] = [
  {
    id: 'ha001',
    studentId: 's001',
    studentName: '张三',
    classId: 'c001',
    className: '一年级1班',
    category: 'civilization',
    type: 'praise',
    title: '主动问好',
    content: '见到老师主动问好，表现良好',
    score: 5,
    scene: 'campus',
    recorderId: 't001',
    recorderName: '张明华',
    recorderRole: 'teacher',
    occurredAt: '2024-12-09T08:00:00Z',
    createdAt: '2024-12-09T08:05:00Z',
  },
];

// 习惯之星Mock数据
export const MOCK_HABIT_STARS: HabitStar[] = [
  {
    id: 'hs001',
    studentId: 's001',
    studentName: '张三',
    classId: 'c001',
    className: '一年级1班',
    grade: 1,
    month: '2024-11',
    achievementRate: 93,
    level: 'class',
    createdAt: '2024-12-01T00:00:00Z',
  },
];

// 学生习惯档案Mock数据
export const MOCK_STUDENT_HABIT_PROFILE: StudentHabitProfile = {
  studentId: 's001',
  studentName: '张三',
  classId: 'c001',
  className: '一年级1班',
  grade: 1,
  categoryScores: [
    { category: 'civilization', score: 95, maxScore: 100, rate: 95, trend: 'up' },
    { category: 'writing', score: 88, maxScore: 100, rate: 88, trend: 'stable' },
    { category: 'reading', score: 92, maxScore: 100, rate: 92, trend: 'up' },
    { category: 'sports', score: 85, maxScore: 100, rate: 85, trend: 'stable' },
    { category: 'safety', score: 98, maxScore: 100, rate: 98, trend: 'stable' },
    { category: 'hygiene', score: 90, maxScore: 100, rate: 90, trend: 'up' },
    { category: 'aesthetic', score: 82, maxScore: 100, rate: 82, trend: 'stable' },
    { category: 'labor', score: 94, maxScore: 100, rate: 94, trend: 'up' },
  ],
  totalScore: 724,
  totalMaxScore: 800,
  overallRate: 90.5,
  level: '优秀',
  habitStarCount: 2,
  monthlyStars: ['2024-10', '2024-11'],
  monthlyTrend: [
    { month: '2024-09', rate: 85 },
    { month: '2024-10', rate: 88 },
    { month: '2024-11', rate: 91 },
  ],
  highlights: [
    { category: 'safety', description: '安全意识强，从未发生安全事故' },
    { category: 'civilization', description: '礼貌待人，主动问好' },
  ],
  improvements: [
    { category: 'aesthetic', suggestion: '可以多参加艺术活动，培养艺术兴趣' },
  ],
  updatedAt: '2024-12-01T00:00:00Z',
};

/**
 * 获取习惯目标列表
 */
export function getMockHabitGoals(filters?: {
  category?: HabitCategory;
  gradeLevel?: string;
}): HabitGoal[] {
  let result = [...MOCK_HABIT_GOALS];
  
  if (filters?.category) {
    result = result.filter(g => g.category === filters.category);
  }
  
  if (filters?.gradeLevel) {
    result = result.filter(g => g.gradeLevel === filters.gradeLevel);
  }
  
  return result;
}

/**
 * 获取学生月度目标
 */
export function getMockMonthlyGoals(studentId?: string, month?: string): StudentMonthlyGoal[] {
  let result = [...MOCK_MONTHLY_GOALS];
  
  if (studentId) {
    result = result.filter(g => g.studentId === studentId);
  }
  
  if (month) {
    result = result.filter(g => g.month === month);
  }
  
  return result;
}

/**
 * 获取习惯之星列表
 */
export function getMockHabitStars(month?: string, level?: string): HabitStar[] {
  let result = [...MOCK_HABIT_STARS];
  
  if (month) {
    result = result.filter(s => s.month === month);
  }
  
  if (level) {
    result = result.filter(s => s.level === level);
  }
  
  return result;
}

/**
 * 获取学生习惯档案
 */
export function getMockStudentHabitProfile(studentId: string): StudentHabitProfile | undefined {
  if (studentId === 's001') {
    return MOCK_STUDENT_HABIT_PROFILE;
  }
  return undefined;
}
