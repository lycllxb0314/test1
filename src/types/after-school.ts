/**
 * 课后服务选课系统类型定义
 * 
 * @module types/after-school
 */

// ============================================
// 枚举/常量类型
// ============================================

/** 选课状态 */
export type EnrollmentStatus = 'success' | 'cancelled';

/** 课程状态 */
export type CourseStatus = 'active' | 'closed' | 'completed' | 'scheduled';

/** 课程分类 */
export type CourseCategory = 'care' | 'interest' | 'academic' | 'sports' | 'art' | 'tech';

/** 星期枚举 */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5;

// ============================================
// 业务类型
// ============================================

/** 课后服务课程 */
export type AfterSchoolCourse = {
  id: string;
  name: string;
  type: string;
  category: CourseCategory;
  description: string;
  coverImage: string;
  targetGrades: number[];
  teacherId: string;
  teacherName: string;
  classroom: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  maxStudents: number;
  currentStudents: number;
  fee: number | null;
  status: CourseStatus;
  semester: string;
  enrollmentStart: string | null;
  enrollmentEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 选课记录 */
export type CourseEnrollment = {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  className: string;
  parentId: string;
  status: EnrollmentStatus;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  // 关联信息
  courseName?: string;
  courseType?: string;
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
};

/** 创建/更新课程 DTO */
export type CreateCourseDTO = {
  name: string;
  type: string;
  category: CourseCategory;
  description?: string;
  coverImage?: string;
  targetGrades: number[];
  teacherId: string;
  teacherName: string;
  classroom: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  maxStudents: number;
  fee?: number | null;
  status: CourseStatus;
  semester?: string;
  enrollmentStart?: string | null;
  enrollmentEnd?: string | null;
};

/** 课程统计 */
export type CourseStats = {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  totalCapacity: number;
  categoryStats: CategoryStat[];
};

/** 分类统计 */
export type CategoryStat = {
  category: CourseCategory;
  label: string;
  count: number;
  enrolled: number;
  capacity: number;
};

// ============================================
// 数据库行类型（下划线命名）
// ============================================

export type AfterSchoolCourseRow = {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string | null;
  cover_image: string | null;
  target_grades: number[] | null;
  teacher_id: string;
  teacher_name: string;
  classroom: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  max_students: number | null;
  current_students: number | null;
  fee: number | null;
  status: string;
  semester: string | null;
  enrollment_start: string | null;
  enrollment_end: string | null;
  created_at: string;
  updated_at: string;
};

export type CourseEnrollmentRow = {
  id: string;
  course_id: string;
  student_id: string;
  student_name: string | null;
  class_name: string | null;
  parent_id: string;
  status: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// 映射函数
// ============================================

/** 数据库行 → 业务类型 */
export function mapCourseRow(row: AfterSchoolCourseRow): AfterSchoolCourse {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: (row.category || 'interest') as CourseCategory,
    description: row.description || '',
    coverImage: row.cover_image || '',
    targetGrades: row.target_grades || [],
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    classroom: row.classroom || '',
    dayOfWeek: (row.day_of_week || 1) as DayOfWeek,
    startTime: row.start_time || '16:30',
    endTime: row.end_time || '17:30',
    maxStudents: row.max_students || 30,
    currentStudents: row.current_students || 0,
    fee: row.fee,
    status: row.status as CourseStatus,
    semester: row.semester || '',
    enrollmentStart: row.enrollment_start,
    enrollmentEnd: row.enrollment_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 数据库行 → 业务类型 */
export function mapEnrollmentRow(row: CourseEnrollmentRow & Record<string, unknown>): CourseEnrollment {
  return {
    id: row.id,
    courseId: row.course_id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    className: row.class_name || '',
    parentId: row.parent_id,
    status: row.status as EnrollmentStatus,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    courseName: (row as Record<string, unknown>).course_name as string | undefined,
    courseType: (row as Record<string, unknown>).course_type as string | undefined,
    dayOfWeek: (row as Record<string, unknown>).day_of_week as DayOfWeek | undefined,
    startTime: (row as Record<string, unknown>).start_time as string | undefined,
    endTime: (row as Record<string, unknown>).end_time as string | undefined,
  };
}

// ============================================
// 常量配置
// ============================================

/** 星期映射 */
export const DAY_LABELS: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
};

/** 课程分类配置 */
export const CATEGORY_CONFIG: Record<CourseCategory, { label: string; color: string; bg: string }> = {
  care: { label: '课后托管', color: 'text-[#5C7A72]', bg: 'bg-[#F0F5F3]' },
  interest: { label: '兴趣拓展', color: 'text-[#A0785A]', bg: 'bg-[#FBF7F2]' },
  academic: { label: '学科辅导', color: 'text-[#6B7DB3]', bg: 'bg-[#EEF0F7]' },
  sports: { label: '体育运动', color: 'text-[#B85C38]', bg: 'bg-[#FBF0EC]' },
  art: { label: '艺术审美', color: 'text-[#8B6BAE]', bg: 'bg-[#F3EFF7]' },
  tech: { label: '科技创新', color: 'text-[#4A90A4]', bg: 'bg-[#ECF4F6]' },
};
