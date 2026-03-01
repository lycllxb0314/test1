/**
 * 课时量规则配置
 * 
 * ⚠️ 重要说明：以下规则仅供参考，教务主任有最终决定权
 * 
 * 核心规则（参考基准）：
 * - 教师周课时量基准：约13节
 * - 班主任/教研组长/中层行政/年段长：带1个班，主科5-6节
 * - 科任：带2个班，主科10-12节
 * - 技能科教师：跨多个班级，约13节
 * 
 * 具体课时由教务主任根据实际情况配置，智能排课结果可手动调整
 */

// ==================== 教师角色类型 ====================

export type TeacherRole = 
  | 'head_teacher'              // 班主任
  | 'grade_leader'              // 年段长
  | 'subject_teacher'           // 科任教师（语文、数学、英语等主科教师）
  | 'skill_teacher'             // 技能课教师（体育、音乐、美术等）
  | 'research_group_leader'     // 教研组组长（通常由班主任或科任兼任）
  | 'research_group_deputy_leader'; // 教研组副组长（通常由班主任或科任兼任）

export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  head_teacher: '班主任',
  grade_leader: '年段长',
  subject_teacher: '科任教师',
  skill_teacher: '技能课教师',
  research_group_leader: '教研组组长',
  research_group_deputy_leader: '教研组副组长',
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
 * 课时量标准规则表（仅供参考，教务主任有最终决定权）
 * 
 * 基准：周课时约13节
 */
export const TEACHING_HOURS_RULES: TeachingHoursRule[] = [
  // 班主任（带1个班）
  {
    role: 'head_teacher',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '班主任带1个班：本班主科5-6节 + 本班兼任（道法/劳动/班会）约4节 + 其他班约3节',
  },
  
  // 年段长（带1个班）
  {
    role: 'grade_leader',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '年段长带1个班：本班主科5-6节 + 本班兼任约4节 + 其他班约3节',
  },
  
  // 科任教师（带2个班）
  {
    role: 'subject_teacher',
    classCount: 2,
    mainSubjectHours: [10, 12],
    totalHours: 13,
    description: '科任教师带2个班：两个班主科共10-12节 + 兼任1-2节',
  },
  
  // 技能课教师（跨多个班级）
  {
    role: 'skill_teacher',
    classCount: 0,  // 跨多个班级
    mainSubjectHours: [0, 0],
    totalHours: 13,
    description: '技能课教师跨多个班级教学，可能跨段，周课时约13节',
  },
  
  // 教研组组长（通常由班主任或科任兼任）
  {
    role: 'research_group_leader',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '教研组组长通常由班主任或科任兼任，课时量与原角色相同',
  },
  
  // 教研组副组长（通常由班主任或科任兼任）
  {
    role: 'research_group_deputy_leader',
    classCount: 1,
    mainSubjectHours: [5, 6],
    totalHours: 13,
    description: '教研组副组长通常由班主任或科任兼任，课时量与原角色相同',
  },
];

/**
 * 根据角色和带班数计算建议课时量（仅供参考）
 * 教务主任可根据实际情况调整
 */
export function calculateSuggestedHours(
  role: TeacherRole,
  classCount: number,
  isSkillTeacher: boolean = false
): { mainSubjectHours: number; totalHours: number } {
  // 技能科教师特殊处理
  if (role === 'skill_teacher' || isSkillTeacher) {
    return { mainSubjectHours: 0, totalHours: 13 };
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
 * 
 * 注意：此验证仅供参考，教务主任有最终决定权
 * warnings 只是建议，不应阻止保存
 */
export function validateTeachingHours(
  role: TeacherRole,
  classCount: number,
  mainSubjectHours: number,
  totalHours: number
): { valid: boolean; message: string; warnings: string[] } {
  const warnings: string[] = [];
  
  // 技能科教师
  if (role === 'skill_teacher' || (classCount === 0 && mainSubjectHours === 0)) {
    if (totalHours >= 10 && totalHours <= 18) {
      return { valid: true, message: '课时量配置合理', warnings: [] };
    }
    if (totalHours < 10) {
      warnings.push(`技能科教师周课时建议约13节，当前${totalHours}节偏少`);
    } else if (totalHours > 18) {
      warnings.push(`技能科教师周课时建议约13节，当前${totalHours}节偏多`);
    }
    // 即使有警告也返回 valid: true，因为教务主任有最终决定权
    return { valid: true, message: '课时量已配置', warnings };
  }
  
  const rule = TEACHING_HOURS_RULES.find(
    r => r.role === role && r.classCount === classCount
  );
  
  if (!rule) {
    // 没有匹配规则也允许保存
    return { 
      valid: true, 
      message: '已保存（无匹配规则，请确认课时量）', 
      warnings: [] 
    };
  }
  
  // 检查主科课时（仅供参考）
  if (classCount > 0) {
    if (mainSubjectHours < rule.mainSubjectHours[0]) {
      warnings.push(`主科课时${mainSubjectHours}节，建议${rule.mainSubjectHours[0]}-${rule.mainSubjectHours[1]}节（仅供参考）`);
    }
    if (mainSubjectHours > rule.mainSubjectHours[1]) {
      warnings.push(`主科课时${mainSubjectHours}节，建议${rule.mainSubjectHours[0]}-${rule.mainSubjectHours[1]}节（仅供参考）`);
    }
  }
  
  // 检查总课时（仅供参考）
  const totalDiff = Math.abs(totalHours - rule.totalHours);
  if (totalDiff > 2) {
    warnings.push(`总课时${totalHours}节，建议约${rule.totalHours}节（仅供参考）`);
  }
  
  // 始终返回 valid: true，因为教务主任有最终决定权
  return {
    valid: true,
    message: warnings.length === 0 ? '课时量配置合理' : '已保存（仅供参考建议）',
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
  
  // 科任教本班主科: 85分
  SUBJECT_HEAD_MAIN_SUBJECT: 85,
  
  // 科任教本班兼任科目: 80分
  SUBJECT_HEAD_SECONDARY_SUBJECT: 80,
  
  // 班主任/科任教其他班主科: 60分
  OTHER_CLASS_MAIN: 60,
  
  // 班主任/科任教其他班课程: 50分
  OTHER_CLASS_SECONDARY: 50,
  
  // 技能科教师: 40分
  SKILL_TEACHER: 40,
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
    subjectHeadId?: string;         // 兼容旧数据
    subjectHeads?: Array<{          // 新数据结构：按科目存储科任
      subject: string;
      teacherId: string;
    }>;
  } | undefined,
  teacherInfo: {
    role?: TeacherRole;
    primarySubject?: string;
  } | undefined
): number {
  if (!classInfo) return SCHEDULING_PRIORITY.SKILL_TEACHER;
  
  const isHeadTeacher = classInfo.headTeacherId === task.teacherId;
  
  // 检查是否是科任（本班的科任）
  // 优先使用新的 subjectHeads 结构，兼容旧的 subjectHeadId
  let isSubjectHead = false;
  if (classInfo.subjectHeads && classInfo.subjectHeads.length > 0) {
    // 新结构：按科目匹配
    isSubjectHead = classInfo.subjectHeads.some(
      sh => sh.teacherId === task.teacherId && sh.subject === task.subject
    );
  } else if (classInfo.subjectHeadId) {
    // 兼容旧结构
    isSubjectHead = classInfo.subjectHeadId === task.teacherId;
  }
  
  const isMainSubject = MAIN_SUBJECTS.includes(task.subject as MainSubject);
  
  // 判断是否是班主任/科任优先兼任的科目
  const primarySubject = teacherInfo?.primarySubject || '';
  const isPrioritySecondary = PRIORITY_SECONDARY_SUBJECTS[primarySubject]?.includes(task.subject);
  
  // 技能科教师
  if (teacherInfo?.role === 'skill_teacher') {
    return SCHEDULING_PRIORITY.SKILL_TEACHER;
  }
  
  // 班主任的课程
  if (isHeadTeacher) {
    if (isMainSubject) {
      return SCHEDULING_PRIORITY.HEAD_TEACHER_MAIN_SUBJECT;
    } else if (isPrioritySecondary) {
      return SCHEDULING_PRIORITY.HEAD_TEACHER_SECONDARY_SUBJECT;
    } else {
      return SCHEDULING_PRIORITY.OTHER_CLASS_SECONDARY;
    }
  }
  
  // 科任的课程
  if (isSubjectHead) {
    if (isMainSubject) {
      return SCHEDULING_PRIORITY.SUBJECT_HEAD_MAIN_SUBJECT;
    } else if (isPrioritySecondary) {
      return SCHEDULING_PRIORITY.SUBJECT_HEAD_SECONDARY_SUBJECT;
    } else {
      return SCHEDULING_PRIORITY.OTHER_CLASS_SECONDARY;
    }
  }
  
  // 其他教师的课程
  return isMainSubject 
    ? SCHEDULING_PRIORITY.OTHER_CLASS_MAIN 
    : SCHEDULING_PRIORITY.OTHER_CLASS_SECONDARY;
}
