/**
 * 云教学系统类型定义
 * 
 * 三大课程域：教师研修(research) | 家长课程(parent) | 学生课程(student)
 * 两种形态：在线教学(live) | 慕课学习(recorded)
 * 家长角色：学习管理者（直接安排，无需审批）
 */

// ============================================
// 课程域 & 形态
// ============================================

/** 课程域类型 */
type CourseDomain = 'research' | 'parent' | 'student';

/** 课程形态类型 */
type CourseFormat = 'live' | 'recorded';

/** 课程状态 */
type CourseStatus = 'draft' | 'reviewing' | 'published' | 'archived';

/** 选课来源 */
type EnrollmentSource = 'self' | 'assigned' | 'pushed';

/** 选课状态 */
type EnrollmentStatus = 'pushed' | 'scheduled' | 'learning' | 'completed';

/** 学习记录类型 */
type LearningRecordType = 'video' | 'live' | 'quiz' | 'document';

/** 直播会话状态 */
type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

/** 推送目标类型 */
type PushTargetType = 'class' | 'grade';

// ============================================
// 数据库行类型 (下划线命名，对应 Supabase 表)
// ============================================

/** 云课程 - 数据库行 */
type CloudCourseRow = {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  domain: CourseDomain;
  format: CourseFormat;
  category: string;
  tags: string[];
  target_audience: string;
  creator_id: string;
  creator_name: string;
  status: CourseStatus;
  total_chapters: number;
  total_duration: number;
  enrolled_count: number;
  rating: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** 云课程章节 - 数据库行 */
type CloudCourseChapterRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  video_url: string | null;
  document_url: string | null;
  duration: number;
  is_free: boolean;
  quiz_id: string | null;
  created_at: string;
  updated_at: string;
};

/** 选课/推送记录 - 数据库行 */
type CloudCourseEnrollmentRow = {
  id: string;
  course_id: string;
  user_id: string;
  role: 'learner' | 'manager';
  target_student_id: string | null;
  source: EnrollmentSource;
  status: EnrollmentStatus;
  scheduled_at: string | null;
  progress: number;
  last_chapter_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** 学习记录 - 数据库行 */
type CloudLearningRecordRow = {
  id: string;
  enrollment_id: string;
  chapter_id: string;
  record_type: LearningRecordType;
  started_at: string;
  completed_at: string | null;
  watch_duration: number;
  quiz_score: number | null;
  notes: string | null;
  created_at: string;
};

/** 直播会话 - 数据库行 */
type CloudLiveSessionRow = {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string;
  scheduled_at: string;
  duration: number;
  room_url: string | null;
  recording_url: string | null;
  status: LiveSessionStatus;
  max_participants: number;
  current_participants: number;
  created_at: string;
  updated_at: string;
};

/** 课程推送 - 数据库行 */
type CloudCoursePushRow = {
  id: string;
  course_id: string;
  pushed_by: string;
  pusher_name: string;
  target_type: PushTargetType;
  target_ids: string[];
  message: string;
  deadline: string | null;
  created_at: string;
};

// ============================================
// 业务类型 (驼峰命名，前端使用)
// ============================================

/** 云课程 */
type CloudCourse = {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  domain: CourseDomain;
  format: CourseFormat;
  category: string;
  tags: string[];
  targetAudience: string;
  creatorId: string;
  creatorName: string;
  status: CourseStatus;
  totalChapters: number;
  totalDuration: number;
  enrolledCount: number;
  rating: number;
  publishedAt: string | null;
  chapters?: CloudCourseChapter[];
  createdAt: string;
  updatedAt: string;
};

/** 云课程章节 */
type CloudCourseChapter = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  sortOrder: number;
  videoUrl: string | null;
  documentUrl: string | null;
  duration: number;
  isFree: boolean;
  quizId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 选课/推送记录 */
type CloudCourseEnrollment = {
  id: string;
  courseId: string;
  userId: string;
  role: 'learner' | 'manager';
  targetStudentId: string | null;
  source: EnrollmentSource;
  status: EnrollmentStatus;
  scheduledAt: string | null;
  progress: number;
  lastChapterId: string | null;
  completedAt: string | null;
  course?: CloudCourse;
  studentName?: string;
  createdAt: string;
  updatedAt: string;
};

/** 学习记录 */
type CloudLearningRecord = {
  id: string;
  enrollmentId: string;
  chapterId: string;
  recordType: LearningRecordType;
  startedAt: string;
  completedAt: string | null;
  watchDuration: number;
  quizScore: number | null;
  notes: string | null;
  createdAt: string;
};

/** 直播会话 */
type CloudLiveSession = {
  id: string;
  courseId: string;
  chapterId: string | null;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  roomUrl: string | null;
  recordingUrl: string | null;
  status: LiveSessionStatus;
  maxParticipants: number;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string;
};

/** 课程推送 */
type CloudCoursePush = {
  id: string;
  courseId: string;
  pushedBy: string;
  pusherName: string;
  targetType: PushTargetType;
  targetIds: string[];
  message: string;
  deadline: string | null;
  course?: CloudCourse;
  createdAt: string;
};

// ============================================
// DTO 类型 (请求/响应)
// ============================================

/** 创建课程请求 */
type CreateCloudCourseDTO = {
  title: string;
  description: string;
  coverImage?: string | null;
  domain: CourseDomain;
  format: CourseFormat;
  category: string;
  tags?: string[];
  targetAudience?: string;
  chapters?: CreateCloudCourseChapterDTO[];
};

/** 创建章节请求 */
type CreateCloudCourseChapterDTO = {
  title: string;
  description?: string;
  sortOrder: number;
  videoUrl?: string | null;
  documentUrl?: string | null;
  duration?: number;
  isFree?: boolean;
};

/** 推送课程请求 */
type PushCloudCourseDTO = {
  courseId: string;
  targetType: PushTargetType;
  targetIds: string[];
  message: string;
  deadline?: string | null;
};

/** 安排学习请求 */
type ScheduleLearningDTO = {
  enrollmentId: string;
  scheduledAt: string;
};

/** 更新学习进度请求 */
type UpdateProgressDTO = {
  enrollmentId: string;
  chapterId: string;
  watchDuration?: number;
  completed?: boolean;
};

/** 课程统计 */
type CloudCourseStats = {
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  averageRating: number;
  domainStats: Record<CourseDomain, { courses: number; enrollments: number }>;
};

// ============================================
// 字段映射工具
// ============================================

/** 数据库行 → 业务类型 */
function mapCourseFromRow(row: CloudCourseRow): CloudCourse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    domain: row.domain,
    format: row.format,
    category: row.category,
    tags: row.tags || [],
    targetAudience: row.target_audience,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    status: row.status,
    totalChapters: row.total_chapters,
    totalDuration: row.total_duration,
    enrolledCount: row.enrolled_count,
    rating: row.rating,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 业务类型 → 数据库行 */
function mapCourseToRow(course: Partial<CloudCourse>): Partial<CloudCourseRow> {
  const row: Partial<CloudCourseRow> = {};
  if (course.title !== undefined) row.title = course.title;
  if (course.description !== undefined) row.description = course.description;
  if (course.coverImage !== undefined) row.cover_image = course.coverImage;
  if (course.domain !== undefined) row.domain = course.domain;
  if (course.format !== undefined) row.format = course.format;
  if (course.category !== undefined) row.category = course.category;
  if (course.tags !== undefined) row.tags = course.tags;
  if (course.targetAudience !== undefined) row.target_audience = course.targetAudience;
  if (course.creatorId !== undefined) row.creator_id = course.creatorId;
  if (course.creatorName !== undefined) row.creator_name = course.creatorName;
  if (course.status !== undefined) row.status = course.status;
  if (course.totalChapters !== undefined) row.total_chapters = course.totalChapters;
  if (course.totalDuration !== undefined) row.total_duration = course.totalDuration;
  if (course.enrolledCount !== undefined) row.enrolled_count = course.enrolledCount;
  if (course.rating !== undefined) row.rating = course.rating;
  if (course.publishedAt !== undefined) row.published_at = course.publishedAt;
  return row;
}

function mapChapterFromRow(row: CloudCourseChapterRow): CloudCourseChapter {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    videoUrl: row.video_url,
    documentUrl: row.document_url,
    duration: row.duration,
    isFree: row.is_free,
    quizId: row.quiz_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEnrollmentFromRow(row: CloudCourseEnrollmentRow): CloudCourseEnrollment {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    role: row.role,
    targetStudentId: row.target_student_id,
    source: row.source,
    status: row.status,
    scheduledAt: row.scheduled_at,
    progress: row.progress,
    lastChapterId: row.last_chapter_id,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLiveSessionFromRow(row: CloudLiveSessionRow): CloudLiveSession {
  return {
    id: row.id,
    courseId: row.course_id,
    chapterId: row.chapter_id,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduled_at,
    duration: row.duration,
    roomUrl: row.room_url,
    recordingUrl: row.recording_url,
    status: row.status,
    maxParticipants: row.max_participants,
    currentParticipants: row.current_participants,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPushFromRow(row: CloudCoursePushRow): CloudCoursePush {
  return {
    id: row.id,
    courseId: row.course_id,
    pushedBy: row.pushed_by,
    pusherName: row.pusher_name,
    targetType: row.target_type,
    targetIds: row.target_ids || [],
    message: row.message,
    deadline: row.deadline,
    createdAt: row.created_at,
  };
}

export {
  type CourseDomain,
  type CourseFormat,
  type CourseStatus,
  type EnrollmentSource,
  type EnrollmentStatus,
  type LearningRecordType,
  type LiveSessionStatus,
  type PushTargetType,
  type CloudCourseRow,
  type CloudCourseChapterRow,
  type CloudCourseEnrollmentRow,
  type CloudLearningRecordRow,
  type CloudLiveSessionRow,
  type CloudCoursePushRow,
  type CloudCourse,
  type CloudCourseChapter,
  type CloudCourseEnrollment,
  type CloudLearningRecord,
  type CloudLiveSession,
  type CloudCoursePush,
  type CreateCloudCourseDTO,
  type CreateCloudCourseChapterDTO,
  type PushCloudCourseDTO,
  type ScheduleLearningDTO,
  type UpdateProgressDTO,
  type CloudCourseStats,
  mapCourseFromRow,
  mapCourseToRow,
  mapChapterFromRow,
  mapEnrollmentFromRow,
  mapLiveSessionFromRow,
  mapPushFromRow,
};
