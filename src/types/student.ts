/**
 * 学生类型定义
 * 
 * @module types/student
 */

// ==================== 学生基本信息 ====================

/** 学生类型（户籍类型） */
export type StudentType = '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭' | '本地户籍';

/** 学生状态 */
export type StudentStatus = '在校' | '请假' | '休学' | '毕业' | '转学';

/** 学生基本信息 */
export interface Student {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate?: string;
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;
  studentType?: StudentType;
  
  // 班级信息
  classId: string;
  className?: string;
  grade: number;
  gradeName?: string;
  headTeacherId?: string;
  headTeacherName?: string;
  
  // 联系信息
  phone?: string;
  address?: string;
  homeAddress?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  
  // 家庭信息
  familyType?: string;
  parents?: Parent[];
  
  // 状态
  status: StudentStatus;
  avatar?: string;
  enrollmentDate?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

/** 学生完整档案 */
export interface StudentFullProfile {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate?: string;
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;          // 政治面貌
  studentType?: StudentType;
  
  // 班级信息
  classId: string;
  className: string;
  classNumber?: number;              // 班级编号
  grade: number;
  gradeName?: string;                // 年级名称
  headTeacherId?: string;
  headTeacherName?: string;          // 班主任姓名
  
  // 联系信息
  phone?: string;
  address?: string;
  homeAddress?: string;              // 家庭详细地址
  emergencyContact?: string;         // 紧急联系人
  emergencyPhone?: string;           // 紧急联系电话
  
  // 家庭信息
  familyType?: '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他';
  parents: Parent[];
  
  // 学业记录
  academicRecords: StudentAcademicRecord[];
  honors: StudentHonor[];
  
  // 成长记录
  growthRecords: StudentGrowthRecord[];
  moralRecords: StudentMoralRecord[];
  
  // 习惯养成
  habitProfile?: {
    overallScore: number;
    level: '优秀' | '良好' | '合格' | '待提高';
    habitStarCount: number;
    monthlyStars: string[];
    categoryScores?: {
      category: HabitCategory;
      categoryName: string;
      score: number;
      maxScore: number;
      rate: number;
      trend: 'up' | 'down' | 'stable';
    }[];
    recentAssessments?: HabitAssessment[];
    monthlyGoals?: {
      month: string;
      category: HabitCategory;
      goal: string;
      achieved: boolean;
    }[];
    habitStarRecords?: {
      month: string;
      category?: HabitCategory;
      level: 'class' | 'grade' | 'school';
    }[];
  };
  
  // 出勤统计
  attendanceStats?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    attendanceRate: number;
  };
  
  // 德育表现
  moralPerformance?: {
    behaviorStats?: {
      praiseCount: number;
      improveCount: number;
      behaviorScore: number;
    };
    activities?: {
      id: string;
      title: string;
      type: string;
      date: string;
      role?: string;
      achievement?: string;
    }[];
    volunteerRecords?: {
      id: string;
      activity: string;
      hours: number;
      date: string;
    }[];
    warnings?: {
      id: string;
      type: string;
      content: string;
      date: string;
      handler?: string;
      level?: '轻度' | '中度' | '重度' | 'info';
      createdAt?: string;
    }[];
    comprehensiveEvaluation?: {
      semester: string;
      level: '优秀' | '良好' | '合格' | '待提高';
      moralScore?: number;
      behaviorScore?: number;
      activityScore?: number;
      socialScore?: number;
      volunteerScore?: number;
      totalScore?: number;
      comment?: string;
    }[];
  };
  
  // 状态
  status: StudentStatus;
  statusReason?: string;
  enrollmentDate?: string;
  
  // 头像
  avatar?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/** 习惯类别 */
export type HabitCategory = 
  | 'civilization'  // 文明习惯
  | 'writing'       // 书写习惯
  | 'reading'       // 阅读习惯
  | 'sports'        // 运动习惯
  | 'safety'        // 安全习惯
  | 'hygiene'       // 卫生习惯
  | 'aesthetic'     // 审美习惯
  | 'labor';        // 劳动习惯

/** 习惯类别名称映射 */
export const habitCategoryNames: Record<HabitCategory, string> = {
  civilization: '文明习惯',
  writing: '书写习惯',
  reading: '阅读习惯',
  sports: '运动习惯',
  safety: '安全习惯',
  hygiene: '卫生习惯',
  aesthetic: '审美习惯',
  labor: '劳动习惯',
};

/** 习惯类别图标映射 */
export const habitCategoryIcons: Record<HabitCategory, string> = {
  civilization: 'Heart',
  writing: 'Pen',
  reading: 'BookOpen',
  sports: 'Trophy',
  safety: 'Shield',
  hygiene: 'Sparkles',
  aesthetic: 'Palette',
  labor: 'Hammer',
};

/** 习惯类别颜色映射 */
export const habitCategoryColors: Record<HabitCategory, string> = {
  civilization: 'text-red-600 bg-red-50',
  writing: 'text-blue-600 bg-blue-50',
  reading: 'text-green-600 bg-green-50',
  sports: 'text-orange-600 bg-orange-50',
  safety: 'text-purple-600 bg-purple-50',
  hygiene: 'text-teal-600 bg-teal-50',
  aesthetic: 'text-pink-600 bg-pink-50',
  labor: 'text-amber-600 bg-amber-50',
};

/** 习惯评价记录 */
export interface HabitAssessment {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  category: HabitCategory;
  type: 'praise' | 'improve';
  title?: string;
  content?: string;
  score: number;
  comment?: string;
  assessorId?: string;
  assessorName?: string;
  recorderId?: string;
  recorderName?: string;
  recorderRole?: string;
  date?: string;
  occurredAt?: string;
  scene?: string;
  createdAt: string;
}

// ==================== 家长信息 ====================

/** 家长信息 */
export interface Parent {
  id: string;
  name: string;
  // 关系（新字段 - 英文枚举）
  relation?: 'father' | 'mother' | 'grandfather' | 'grandmother' | 'other';
  relationName?: string;
  // 关系（旧字段 - 中文值，保持兼容）
  relationship?: '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他';
  phone?: string;
  isPrimary: boolean;
  wechat?: string;
  email?: string;
  avatar?: string;
  // 工作信息
  company?: string;
  position?: string;
  education?: string;
  // 关联学生信息
  studentId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  grade?: number;
  hasAccount?: boolean;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== 学业记录 ====================

/** 学生学业记录 */
export interface StudentAcademicRecord {
  id: string;
  studentId: string;
  semester: string;
  subject: string;
  score: number;
  level?: 'excellent' | 'good' | 'pass' | 'fail' | '优秀' | '良好' | '合格' | '待提高';
  rank?: number;
  classRank?: number;
  gradeRank?: number;
  examType?: string;
  teacherComment?: string;
  progress?: number;
  createdAt: string;
}

/** 学生荣誉 */
export interface StudentHonor {
  id: string;
  studentId: string;
  title: string;
  type?: '三好学生' | '优秀少先队员' | '学习标兵' | '德育标兵' | '其他';
  category?: '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';
  level: '校级' | '区级' | '市级' | '省级' | '国家级' | '班级';
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
  createdAt?: string;
}

/** 学生成长记录 */
export interface StudentGrowthRecord {
  id: string;
  studentId: string;
  type: '入学' | '转学' | '休学' | '复学' | '毕业' | '表彰' | '处分' | '家访' | '谈心' | '学习进步' | '行为表现' | '特长发展' | '社会实践' | '其他';
  title: string;
  content?: string;
  description?: string;
  date: string;
  operator?: string;
  recorderId?: string;
  recorderName?: string;
  attachments?: string[];
  createdAt: string;
}

/** 学生德育记录 */
export interface StudentMoralRecord {
  id: string;
  studentId: string;
  type: '表扬' | '批评' | '违纪' | '志愿服务' | '社会实践' | '升旗仪式' | '其他';
  title?: string;
  content: string;
  score?: number;
  date: string;
  handlerId?: string;
  handlerName?: string;
  recorder?: string;
  attachments?: string[];
  createdAt: string;
}

// ==================== 筛选条件 ====================

/** 学生筛选条件 */
export interface StudentFilters {
  search?: string;
  classId?: string;
  grade?: number | 'all';
  status?: StudentStatus | 'all';
}
