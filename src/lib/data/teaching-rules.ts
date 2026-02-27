/**
 * 课时量规则配置
 * 
 * 基于实际学校管理规则设计
 * 
 * 核心规则：
 * - 教师周课时量基准：约13节
 * - 班主任/教研组长/中层行政：带1个班，主科5-6节
 * - 普通主科教师：带2个班，主科10-12节
 */

// ==================== 教师角色类型 ====================

export type TeacherRole = 
  | 'head_teacher'    // 班主任
  | 'subject_leader'  // 教研组长
  | 'admin'           // 中层行政（教导主任、德育主任等）
  | 'grade_leader'    // 年段长
  | 'normal';         // 普通教师

export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  head_teacher: '班主任',
  subject_leader: '教研组长',
  admin: '中层行政',
  grade_leader: '年段长',
  normal: '普通教师',
};

// ==================== 主科定义 ====================

export const MAIN_SUBJECTS = ['语文', '数学', '英语'] as const;
export type MainSubject = typeof MAIN_SUBJECTS[number];

// 班主任/科任优先兼任的科目（本班优先分配）
export const PRIORITY_SECONDARY_SUBJECTS: Record<string, string[]> = {
  '语文': ['道德与法治', '劳动', '阅读', '班会'],
  '数学': ['科学', '信息技术'],
  '英语': [],
};

// 所有科目
export const ALL_SUBJECTS = [
  '语文', '数学', '英语', '体育', '音乐', '美术', 
  '科学', '道德与法治', '信息技术', '劳动', '阅读', '班会'
] as const;

// ==================== 课时量标准规则 ====================

export interface TeachingHoursRule {
  role: TeacherRole;
  classCount: number;                    // 带班数量（主科班级数）
  mainSubjectHours: [number, number];    // 主科课时范围 [min, max]
  totalHours: number;                    // 总课时量（约13节）
  description: string;
}

/**
 * 课时量标准规则表
 * 
 * 基准：教师周课时量约13节
 */
export const TEACHING_HOURS_RULES: TeachingHoursRule[] = [
  // 班主任（带1个班）
  {
    role: 'head_teacher',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '班主任带1个班，主科5-6节，兼任道法/劳动等约7-8节',
  },
  
  // 教研组长（带1个班）
  {
    role: 'subject_leader',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '教研组长带1个班，主科5-6节，剩余课时由教研工作折算',
  },
  
  // 中层行政（带1个班，课时略少）
  {
    role: 'admin',
    classCount: 1,
    mainSubjectHours: [4, 5],
    totalHours: 10,
    description: '中层行政带1个班，主科4-5节，行政工作折算部分课时',
  },
  
  // 年段长（带1个班）
  {
    role: 'grade_leader',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 12,
    description: '年段长带1个班，主科5-6节，管理工作折算部分课时',
  },
  
  // 普通主科教师（带2个班）
  {
    role: 'normal',
    classCount: 2,
    mainSubjectHours: [10, 12],
    totalHours: 13,
    description: '普通主科教师带2个班，主科10-12节，剩余1-3节可兼任其他',
  },
  
  // 普通主科教师（带1个班）
  {
    role: 'normal',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '普通主科教师带1个班，主科5-6节，剩余课时兼任其他科目',
  },
  
  // 技能科教师（体育、音乐、美术等）
  {
    role: 'normal',
    classCount: 0,  // 不带主科班
    mainSubjectHours: [0, 0],
    totalHours: 16,
    description: '技能科教师不带主科班，周课时约16节（跨多个班级）',
  },
];

/**
 * 根据角色和带班数计算建议课时量
 */
export function calculateSuggestedHours(
  role: TeacherRole,
  classCount: number,
  isSkillTeacher: boolean = false
): { mainSubjectHours: number; totalHours: number } {
  // 技能科教师特殊处理
  if (isSkillTeacher) {
    return { mainSubjectHours: 0, totalHours: 16 };
  }
  
  // 查找匹配的规则
  const rule = TEACHING_HOURS_RULES.find(
    r => r.role === role && r.classCount === classCount
  );
  
  if (rule) {
    return {
      mainSubjectHours: Math.round((rule.mainSubjectHours[0] + rule.mainSubjectHours[1]) / 2),
      totalHours: rule.totalHours,
    };
  }
  
  // 默认规则
  return {
    mainSubjectHours: classCount > 0 ? 6 * classCount : 0,
    totalHours: 13,
  };
}

/**
 * 验证课时量是否合理
 */
export function validateTeachingHours(
  role: TeacherRole,
  classCount: number,
  mainSubjectHours: number,
  totalHours: number
): { valid: boolean; message: string; warnings: string[] } {
  const warnings: string[] = [];
  
  // 技能科教师
  if (classCount === 0 && mainSubjectHours === 0) {
    if (totalHours >= 14 && totalHours <= 18) {
      return { valid: true, message: '课时量配置合理', warnings: [] };
    }
    warnings.push(`技能科教师周课时建议14-18节，当前${totalHours}节`);
  }
  
  const rule = TEACHING_HOURS_RULES.find(
    r => r.role === role && r.classCount === classCount
  );
  
  if (!rule) {
    return { 
      valid: true, 
      message: '无完全匹配规则，请手动检查', 
      warnings: ['建议参考同类型教师的课时配置'] 
    };
  }
  
  // 检查主科课时
  if (classCount > 0) {
    if (mainSubjectHours < rule.mainSubjectHours[0]) {
      warnings.push(`主科课时偏少，建议${rule.mainSubjectHours[0]}-${rule.mainSubjectHours[1]}节`);
    }
    if (mainSubjectHours > rule.mainSubjectHours[1]) {
      warnings.push(`主科课时偏多，建议${rule.mainSubjectHours[0]}-${rule.mainSubjectHours[1]}节`);
    }
  }
  
  // 检查总课时
  const totalDiff = Math.abs(totalHours - rule.totalHours);
  if (totalDiff > 2) {
    warnings.push(`总课时与标准(${rule.totalHours}节)差异较大`);
  }
  
  // 班主任必须兼任本班其他科目
  if (role === 'head_teacher' && classCount === 1) {
    const expectedSecondary = rule.totalHours - mainSubjectHours;
    if (expectedSecondary > 6) {
      warnings.push(`班主任应兼任本班道法、劳动等科目（约${expectedSecondary}节）`);
    }
  }
  
  return {
    valid: warnings.length === 0,
    message: warnings.length === 0 ? '课时量配置合理' : '课时量存在优化空间',
    warnings,
  };
}

// ==================== 排课优先级规则 ====================

/**
 * 排课优先级配置
 * 
 * 核心逻辑：让老师们在自己班优先有课时量
 */
export const SCHEDULING_PRIORITY = {
  // 优先级分数（越高越优先）
  
  // 班主任教本班主科: 100分
  HEAD_TEACHER_MAIN_SUBJECT: 100,
  
  // 班主任教本班兼任科目（道法、劳动等）: 95分
  HEAD_TEACHER_SECONDARY_SUBJECT: 95,
  
  // 科任（副班主任）教本班主科: 85分
  SUBJECT_HEAD_MAIN_SUBJECT: 85,
  
  // 科任教本班兼任科目: 80分
  SUBJECT_HEAD_SECONDARY_SUBJECT: 80,
  
  // 班主任教其他班主科: 60分
  HEAD_TEACHER_OTHER_CLASS: 60,
  
  // 科任教其他班课程: 50分
  SUBJECT_HEAD_OTHER_CLASS: 50,
  
  // 普通教师主科: 40分
  NORMAL_TEACHER_MAIN: 40,
  
  // 普通教师其他: 30分
  NORMAL_TEACHER_OTHER: 30,
} as const;

/**
 * 计算教学任务的优先级分数
 */
export function calculateTaskPriority(
  task: {
    teacherId: string;
    classId: string;
    subject: string;
  },
  classInfo: {
    headTeacherId?: string;
    subjectHeadId?: string;
  } | undefined,
  teacherInfo: {
    role?: TeacherRole;
    primarySubject?: string;
  } | undefined
): number {
  if (!classInfo) return SCHEDULING_PRIORITY.NORMAL_TEACHER_OTHER;
  
  const isHeadTeacher = classInfo.headTeacherId === task.teacherId;
  const isSubjectHead = classInfo.subjectHeadId === task.teacherId;
  const isMainSubject = MAIN_SUBJECTS.includes(task.subject as MainSubject);
  
  // 判断是否是班主任/科任优先兼任的科目
  const primarySubject = teacherInfo?.primarySubject || '';
  const isPrioritySecondary = PRIORITY_SECONDARY_SUBJECTS[primarySubject]?.includes(task.subject);
  
  // 班主任的课程
  if (isHeadTeacher) {
    if (isMainSubject) {
      return SCHEDULING_PRIORITY.HEAD_TEACHER_MAIN_SUBJECT;
    } else if (isPrioritySecondary) {
      return SCHEDULING_PRIORITY.HEAD_TEACHER_SECONDARY_SUBJECT;
    } else {
      return SCHEDULING_PRIORITY.HEAD_TEACHER_OTHER_CLASS;
    }
  }
  
  // 科任（副班主任）的课程
  if (isSubjectHead) {
    if (isMainSubject) {
      return SCHEDULING_PRIORITY.SUBJECT_HEAD_MAIN_SUBJECT;
    } else if (isPrioritySecondary) {
      return SCHEDULING_PRIORITY.SUBJECT_HEAD_SECONDARY_SUBJECT;
    } else {
      return SCHEDULING_PRIORITY.SUBJECT_HEAD_OTHER_CLASS;
    }
  }
  
  // 普通教师
  return isMainSubject 
    ? SCHEDULING_PRIORITY.NORMAL_TEACHER_MAIN 
    : SCHEDULING_PRIORITY.NORMAL_TEACHER_OTHER;
}
