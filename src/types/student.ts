/**
 * 学生类型定义
 * 
 * @module types/student
 */

// ==================== 学生基本信息 ====================

/** 学生状态 */
export type StudentStatus = '在校' | '请假' | '休学' | '毕业' | '转学';

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
}

/** 学生基本信息 */
export interface Student {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  classId: string;
  className: string;
  grade?: number;
  gradeName?: string;
  headTeacherId?: string;
  headTeacherName?: string;
  status: StudentStatus | string;
  parents: Parent[];
  avatar?: string;
}

/** 学生完整档案 */
export interface StudentFullProfile {
  id: string;
  studentNo: string;
  
  // === 基本信息 ===
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;
  
  // === 学籍信息 ===
  grade: number;
  gradeName: string;
  classId: string;
  className: string;
  classNumber: number;
  enrollmentDate: string;
  studentType?: '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭';
  
  // === 联系信息 ===
  phone?: string;
  address?: string;
  homeAddress?: string;
  
  // === 家庭信息 ===
  familyType?: '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他';
  parents: Parent[];
  emergencyContact?: string;
  emergencyPhone?: string;
  
  // === 班级信息 ===
  headTeacherId?: string;
  headTeacherName?: string;
  
  // === 状态 ===
  status: StudentStatus | string;
  statusReason?: string;
  
  // === 学业信息 ===
  academicRecords: StudentAcademicRecord[];
  honors: StudentHonor[];
  growthRecords: StudentGrowthRecord[];
  
  // === 习惯养成 ===
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
  
  // === 德育表现 ===
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
      level: 'info' | 'warning' | 'danger';
      content: string;
      createdAt: string;
    }[];
    comprehensiveEvaluation?: {
      semester: string;
      moralScore: number;
      socialScore: number;
      volunteerScore: number;
      totalScore: number;
      level: '优秀' | '良好' | '合格' | '待提高';
      comment?: string;
    }[];
  };
  
  // === 德育记录 ===
  moralRecords: StudentMoralRecord[];
  
  // === 出勤统计 ===
  attendanceStats?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    attendanceRate: number;
  };
  
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 学生学业记录 ====================

/** 学业记录 */
export interface StudentAcademicRecord {
  id: string;
  studentId: string;
  semester: string;
  examType: string;
  subject: string;
  score?: number;
  level?: '优秀' | '良好' | '合格' | '待提高';
  classRank?: number;
  gradeRank?: number;
  progress?: number;
  teacherComment?: string;
  createdAt: string;
}

/** 学生荣誉 */
export interface StudentHonor {
  id: string;
  studentId: string;
  title: string;
  level: '国家级' | '省级' | '市级' | '区级' | '校级' | '班级';
  category: '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
}

/** 成长记录 */
export interface StudentGrowthRecord {
  id: string;
  studentId: string;
  type: '入学' | '转学' | '休学' | '复学' | '毕业' | '表彰' | '处分' | '家访' | '谈心' | '其他';
  title: string;
  description?: string;
  date: string;
  operator?: string;
  attachments?: string[];
  createdAt: string;
}

/** 德育记录 */
export interface StudentMoralRecord {
  id: string;
  studentId: string;
  type: '表扬' | '批评' | '志愿服务' | '社会实践' | '升旗仪式' | '其他';
  title: string;
  content?: string;
  score?: number;
  date: string;
  recorder?: string;
  createdAt: string;
}

// ==================== 习惯养成 ====================

/** 习惯类别 */
export type HabitCategory = 
  | 'learning'      // 学习习惯
  | 'behavior'      // 行为习惯
  | 'life'          // 生活习惯
  | 'social';       // 交往习惯

/** 习惯评价 */
export interface HabitAssessment {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
  category: HabitCategory;
  type: string;
  title: string;
  content?: string;
  score?: number;
  scene?: string;
  occurredAt?: string;
  createdAt: string;
}
