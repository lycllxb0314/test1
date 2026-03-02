/**
 * 课时量规则配置
 * 
 * ⚠️ 重要说明：以下规则仅供参考，教务主任有最终决定权
 * 
 * 国家标准课时量参考：
 * - 语数教师（主科教师）：14-16节/周
 * - 其他技能科教师：16-18节/周
 * - 领导层（校长/书记/副校长）：课时量可适当减少，具体由学校决定
 * 
 * 具体课时由教务主任根据实际情况配置，智能排课结果可手动调整
 */

// ==================== 教师角色类型 ====================

/** 教师主要角色类型 */
export type TeacherRole = 
  // === 领导层（主要角色就是领导职务）===
  | 'principal'                 // 校长
  | 'secretary'                 // 书记
  | 'vice_principal'            // 副校长
  // === 教师群体 ===
  | 'head_teacher'              // 班主任
  | 'subject_teacher'           // 科任教师（语文、数学、英语等主科教师）
  | 'skill_teacher'             // 技能课教师（体育、音乐、美术等）
  | 'subject_head';             // 学科组长（视为技能课教师）

/** 行政职务类型（可兼任） */
export type AdministrativeRole = 
  | 'academic_director'         // 教务主任
  | 'moral_director'            // 德育主任
  | 'general_director'          // 总务主任
  | 'grade_leader'              // 年段长
  | 'research_group_leader'     // 教研组组长
  | 'research_group_deputy_leader' // 教研组副组长
  | 'young_pioneer_counselor';  // 少先队大队辅导员

export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  principal: '校长',
  secretary: '书记',
  vice_principal: '副校长',
  head_teacher: '班主任',
  subject_teacher: '科任教师',
  skill_teacher: '技能课教师',
  subject_head: '学科组长',
};

export const ADMINISTRATIVE_ROLE_LABELS: Record<AdministrativeRole, string> = {
  academic_director: '教务主任',
  moral_director: '德育主任',
  general_director: '总务主任',
  grade_leader: '年段长',
  research_group_leader: '教研组组长',
  research_group_deputy_leader: '教研组副组长',
  young_pioneer_counselor: '少先队大队辅导员',
};

// ==================== 主科定义 ====================

export const MAIN_SUBJECTS = ['语文', '数学'] as const;
export type MainSubject = typeof MAIN_SUBJECTS[number];

// 班主任/科任优先兼任的科目（本班优先分配）
export const PRIORITY_SECONDARY_SUBJECTS: Record<string, string[]> = {
  '语文': ['书法', '道德与法治', '阅读', '班会'],
  '数学': ['科学', '劳动', '信息技术'],
};

// 所有科目
export const ALL_SUBJECTS = [
  '语文', '数学', '英语', '体育', '音乐', '美术', 
  '科学', '道德与法治', '信息技术', '劳动', '书法', '阅读', '班会', '校本课', '综合实践'
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
 * 国家标准课时量：
 * - 语数教师（主科教师）：14-16节/周
 * - 其他技能科教师：16-18节/周
 */
export const TEACHING_HOURS_RULES: TeachingHoursRule[] = [
  // === 领导层 ===
  // 校长（行政工作为主，课时可适当减少）
  {
    role: 'principal',
    classCount: 0,
    mainSubjectHours: [0, 2],
    totalHours: 4,
    description: '校长以行政工作为主，可承担少量教学任务，周课时约2-4节',
  },
  
  // 书记（党务工作为主，课时可适当减少）
  {
    role: 'secretary',
    classCount: 0,
    mainSubjectHours: [0, 2],
    totalHours: 4,
    description: '书记以党务工作为主，可承担少量教学任务，周课时约2-4节',
  },
  
  // 副校长（分管工作为主，课时可适当减少）
  {
    role: 'vice_principal',
    classCount: 1,
    mainSubjectHours: [2, 4],
    totalHours: 6,
    description: '副校长以分管工作为主，可承担部分教学任务，周课时约4-6节',
  },
  
  // === 教师群体 ===
  // 班主任（带1个班，语数英主科教师）
  {
    role: 'head_teacher',
    classCount: 1,
    mainSubjectHours: [6, 8],
    totalHours: 15,
    description: '班主任带1个班（语数教师）：本班主科6-8节 + 兼任科目（道法/劳动/班会/综合实践/校本）约6-8节，总课时14-16节',
  },
  
  // 科任教师（带2个班，语数英主科教师）
  {
    role: 'subject_teacher',
    classCount: 2,
    mainSubjectHours: [10, 12],
    totalHours: 15,
    description: '科任教师带2个班（语数教师）：两个班主科共10-12节 + 兼任科目约2-4节，总课时14-16节',
  },
  
  // 技能课教师（体育、音乐、美术、科学、信息技术等，不含英语）
  {
    role: 'skill_teacher',
    classCount: 0,  // 跨多个班级
    mainSubjectHours: [0, 0],
    totalHours: 18,
    description: '技能课教师（体育/音乐/美术/科学/信息技术等）：跨多个班级教学，周课时16-20节（英语教师除外，课时14-16节）',
  },
  
  // 学科组长（视为技能课教师）
  {
    role: 'subject_head',
    classCount: 0,
    mainSubjectHours: [0, 0],
    totalHours: 16,
    description: '学科组长：跨多个班级教学，周课时16-18节（可能有适当减免）',
  },
];

/**
 * 根据角色和带班数计算建议课时量（仅供参考）
 * 教务主任可根据实际情况调整
 * 
 * 国家标准：
 * - 语数教师（班主任/科任）：14-16节/周
 * - 英语教师：14-16节/周（特殊技能科，可跨年级段教学）
 * - 其他技能科教师：16-18节/周
 */
export function calculateSuggestedHours(
  role: TeacherRole,
  classCount: number,
  isSkillTeacher: boolean = false,
  subject?: string
): { mainSubjectHours: number; totalHours: number; minHours: number; maxHours: number; description: string } {
  // 英语教师特殊处理：虽然是技能科，但课时量标准同主科，且可跨年级段教学
  if (subject === '英语') {
    return { 
      mainSubjectHours: 0, 
      totalHours: 15,
      minHours: 14,
      maxHours: 16,
      description: '英语教师：可跨年级段教学，周课时14-16节'
    };
  }
  
  // 技能科教师：16-20节
  if (role === 'skill_teacher' || role === 'subject_head' || isSkillTeacher) {
    return { 
      mainSubjectHours: 0, 
      totalHours: 18,
      minHours: 16,
      maxHours: 20,
      description: '技能科教师（体育/音乐/美术/科学/信息技术等）：周课时16-20节'
    };
  }
  
  // 领导层特殊处理
  if (role === 'principal' || role === 'secretary') {
    return { 
      mainSubjectHours: 1, 
      totalHours: 4,
      minHours: 2,
      maxHours: 6,
      description: '校长/书记以行政工作为主，周课时2-6节'
    };
  }
  if (role === 'vice_principal') {
    return { 
      mainSubjectHours: 3, 
      totalHours: 6,
      minHours: 4,
      maxHours: 8,
      description: '副校长以分管工作为主，周课时4-8节'
    };
  }
  
  // 语数教师（班主任/科任）：统一标准 14-16节
  // 班主任带班，主科课时会少一些，但需要兼任科目补齐到14-16节
  // 科任教师不带班，可以带更多班级的主科
  
  if (role === 'head_teacher') {
    // 班主任：主科约10节 + 班会1节 + 兼任科目（道法/劳动/书法等）约3-4节 = 总计14-15节
    const mainHours = classCount > 0 ? 10 : 0;
    return {
      mainSubjectHours: mainHours,
      totalHours: 15,
      minHours: 14,
      maxHours: 16,
      description: '班主任：主科约10节 + 班会1节 + 兼任科目3-4节，总课时14-16节',
    };
  }
  
  if (role === 'subject_teacher') {
    // 科任教师：主科约12-14节 + 兼任科目1-2节 = 总计14-16节
    const mainHours = classCount > 0 ? 6 * classCount : 12;
    return {
      mainSubjectHours: Math.min(mainHours, 14),
      totalHours: 15,
      minHours: 14,
      maxHours: 16,
      description: '科任教师：主科约12节 + 兼任科目2-3节，总课时14-16节',
    };
  }
  
  // 默认规则
  return {
    mainSubjectHours: classCount > 0 ? 6 * classCount : 0,
    totalHours: 15,
    minHours: 14,
    maxHours: 16,
    description: '语数教师：周课时14-16节',
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
  totalHours: number,
  subject?: string
): { valid: boolean; message: string; warnings: string[] } {
  const warnings: string[] = [];
  
  // 英语教师特殊处理：课时量标准同主科 14-16节
  if (subject === '英语') {
    if (totalHours >= 14 && totalHours <= 16) {
      return { valid: true, message: '课时量配置合理', warnings: [] };
    }
    if (totalHours < 14) {
      warnings.push(`英语教师周课时建议14-16节，当前${totalHours}节偏少`);
    } else if (totalHours > 16) {
      warnings.push(`英语教师周课时建议14-16节，当前${totalHours}节偏多`);
    }
    return { valid: true, message: '课时量已配置', warnings };
  }
  
  // 技能科教师：16-18节
  if (role === 'skill_teacher' || role === 'subject_head' || (classCount === 0 && mainSubjectHours === 0)) {
    if (totalHours >= 16 && totalHours <= 18) {
      return { valid: true, message: '课时量配置合理', warnings: [] };
    }
    if (totalHours < 16) {
      warnings.push(`技能科教师周课时建议16-18节，当前${totalHours}节偏少`);
    } else if (totalHours > 18) {
      warnings.push(`技能科教师周课时建议16-18节，当前${totalHours}节偏多`);
    }
    // 即使有警告也返回 valid: true，因为教务主任有最终决定权
    return { valid: true, message: '课时量已配置', warnings };
  }
  
  // 领导层
  if (role === 'principal' || role === 'secretary') {
    if (totalHours <= 6) {
      return { valid: true, message: '课时量配置合理', warnings: [] };
    }
    warnings.push(`校长/书记周课时建议2-6节，当前${totalHours}节`);
    return { valid: true, message: '课时量已配置', warnings };
  }
  
  if (role === 'vice_principal') {
    if (totalHours >= 4 && totalHours <= 8) {
      return { valid: true, message: '课时量配置合理', warnings: [] };
    }
    warnings.push(`副校长周课时建议4-8节，当前${totalHours}节`);
    return { valid: true, message: '课时量已配置', warnings };
  }
  
  // 语数教师（班主任/科任）：14-16节
  if (totalHours >= 14 && totalHours <= 16) {
    return { valid: true, message: '课时量配置合理', warnings: [] };
  }
  
  if (totalHours < 14) {
    warnings.push(`语数教师周课时建议14-16节，当前${totalHours}节偏少`);
  } else if (totalHours > 16) {
    warnings.push(`语数教师周课时建议14-16节，当前${totalHours}节偏多`);
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
