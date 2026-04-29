/**
 * 云教学系统 Service 层
 * 
 * 核心业务逻辑：课程管理、选课/推送、学习进度、直播会话
 */

import { BaseService } from './base.service';
import {
  cloudCourseRepository,
  cloudCourseChapterRepository,
  cloudCourseEnrollmentRepository,
  cloudLearningRecordRepository,
  cloudLiveSessionRepository,
  cloudCoursePushRepository,
} from '@/repositories/cloud-course.repository';
import {
  type CloudCourse,
  type CloudCourseChapter,
  type CloudCourseEnrollment,
  type CloudLearningRecord,
  type CloudLiveSession,
  type CloudCoursePush,
  type CourseDomain,
  type CourseFormat,
  type CourseStatus,
  type EnrollmentSource,
  type EnrollmentStatus,
  type LiveSessionStatus,
  type PushTargetType,
  type CreateCloudCourseDTO,
  type CreateCloudCourseChapterDTO,
  type PushCloudCourseDTO,
  type ScheduleLearningDTO,
  type UpdateProgressDTO,
  type CloudCourseStats,
  type CloudCourseRow,
  type CloudCourseChapterRow,
  type CloudCourseEnrollmentRow,
  type CloudLearningRecordRow,
  type CloudLiveSessionRow,
  type CloudCoursePushRow,
  mapCourseFromRow,
  mapCourseToRow,
  mapChapterFromRow,
  mapEnrollmentFromRow,
  mapLiveSessionFromRow,
  mapPushFromRow,
} from '@/types/cloud-course';
import { getService } from '@/lib/di';
import type { StudentRepository } from '@/repositories/student.repository';
import type { ClassRepository } from '@/repositories/class.repository';

// ============================================
// CloudCourseService
// ============================================

class CloudCourseService extends BaseService {
  /** 获取课程库（按域筛选、关键词搜索） */
  async getCourses(domain: CourseDomain, keyword?: string, includeDraft?: boolean): Promise<CloudCourse[]> {
    let rows: CloudCourseRow[];

    if (includeDraft) {
      // 管理端：返回该域所有课程（含草稿）
      rows = await cloudCourseRepository.findByDomain(domain);
      if (keyword) {
        const kw = keyword.toLowerCase();
        rows = rows.filter(r =>
          r.title?.toLowerCase().includes(kw) ||
          r.description?.toLowerCase().includes(kw) ||
          r.category?.toLowerCase().includes(kw)
        );
      }
    } else if (keyword) {
      rows = await cloudCourseRepository.searchPublished(domain, keyword);
    } else {
      rows = await cloudCourseRepository.findPublished();
      rows = rows.filter(r => r.domain === domain);
    }

    return rows.map(mapCourseFromRow);
  }

  /** 获取课程详情（含章节） */
  async getCourseDetail(courseId: string): Promise<CloudCourse | null> {
    const row = await cloudCourseRepository.findById(courseId);
    if (!row) return null;

    const course = mapCourseFromRow(row as CloudCourseRow);
    const chapterRows = await cloudCourseChapterRepository.findByCourseId(courseId);
    course.chapters = chapterRows.map(mapChapterFromRow);
    return course;
  }

  /** 创建课程（含章节） */
  async createCourse(creatorId: string, creatorName: string, dto: CreateCloudCourseDTO): Promise<CloudCourse | null> {
    const courseData: Partial<CloudCourseRow> = {
      title: dto.title,
      description: dto.description || '',
      cover_image: dto.coverImage || null,
      domain: dto.domain,
      format: dto.format,
      category: dto.category,
      tags: dto.tags || [],
      target_audience: dto.targetAudience || '',
      creator_id: creatorId,
      creator_name: creatorName,
      status: 'draft',
      total_chapters: dto.chapters?.length || 0,
      total_duration: dto.chapters?.reduce((sum, c) => sum + (c.duration || 0), 0) || 0,
    };

    const row = await cloudCourseRepository.create(courseData);
    if (!row) return null;

    const course = mapCourseFromRow(row as CloudCourseRow);

    // 创建章节
    if (dto.chapters?.length) {
      const chapters: CloudCourseChapter[] = [];
      for (const ch of dto.chapters) {
        const chRow = await cloudCourseChapterRepository.create({
          course_id: row.id,
          title: ch.title,
          description: ch.description || '',
          sort_order: ch.sortOrder,
          video_url: ch.videoUrl || null,
          document_url: ch.documentUrl || null,
          duration: ch.duration || 0,
          is_free: ch.isFree || false,
        });
        if (chRow) chapters.push(mapChapterFromRow(chRow as CloudCourseChapterRow));
      }
      course.chapters = chapters;
    }

    return course;
  }

  /** 更新课程 */
  async updateCourse(courseId: string, data: Partial<CloudCourse>): Promise<CloudCourse | null> {
    const rowData = mapCourseToRow(data);
    const row = await cloudCourseRepository.update(courseId, rowData);
    return row ? mapCourseFromRow(row as CloudCourseRow) : null;
  }

  /** 更新课程（含章节同步：先删旧章节再创建新章节） */
  async updateCourseWithChapters(
    courseId: string,
    data: Partial<CloudCourse>,
    chapters?: CreateCloudCourseChapterDTO[],
  ): Promise<CloudCourse | null> {
    // 1. 更新课程主表
    const courseData = { ...data };
    if (chapters) {
      courseData.totalChapters = chapters.length;
      courseData.totalDuration = chapters.reduce((sum, c) => sum + (c.duration || 0), 0);
    }
    const rowData = mapCourseToRow(courseData);
    const row = await cloudCourseRepository.update(courseId, rowData);
    if (!row) return null;

    // 2. 同步章节（如果有传 chapters）
    if (chapters) {
      await cloudCourseChapterRepository.deleteByCourseId(courseId);
      for (const ch of chapters) {
        await cloudCourseChapterRepository.create({
          course_id: courseId,
          title: ch.title,
          sort_order: ch.sortOrder,
          video_url: ch.videoUrl || null,
          document_url: ch.documentUrl || null,
          duration: ch.duration || 0,
        });
      }
    }

    // 3. 返回完整课程详情
    return this.getCourseDetail(courseId);
  }

  /** 发布课程 */
  async publishCourse(courseId: string): Promise<CloudCourse | null> {
    return this.updateCourse(courseId, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    } as Partial<CloudCourse>);
  }

  /** 删除课程 */
  async deleteCourse(courseId: string): Promise<boolean> {
    return cloudCourseRepository.delete(courseId);
  }

  /** 获取教师创建的课程 */
  async getCoursesByCreator(creatorId: string): Promise<CloudCourse[]> {
    const rows = await cloudCourseRepository.findByCreator(creatorId);
    return rows.map(mapCourseFromRow);
  }

  /** 获取课程统计 */
  async getStats(): Promise<CloudCourseStats> {
    const allCourses = await cloudCourseRepository.findAll();
    const allEnrollments = await cloudCourseEnrollmentRepository.findAll();

    const courses = allCourses.map(r => mapCourseFromRow(r as CloudCourseRow));
    const enrollments = allEnrollments.map(r => mapEnrollmentFromRow(r as CloudCourseEnrollmentRow));

    const domainStats: Record<CourseDomain, { courses: number; enrollments: number }> = {
      research: { courses: 0, enrollments: 0 },
      parent: { courses: 0, enrollments: 0 },
      student: { courses: 0, enrollments: 0 },
    };

    for (const c of courses) {
      if (c.domain in domainStats) {
        domainStats[c.domain].courses++;
      }
    }

    for (const e of enrollments) {
      const course = courses.find(c => c.id === e.courseId);
      if (course && course.domain in domainStats) {
        domainStats[course.domain].enrollments++;
      }
    }

    return {
      totalCourses: courses.length,
      totalEnrollments: enrollments.length,
      totalCompletions: enrollments.filter(e => e.status === 'completed').length,
      averageRating: courses.length > 0
        ? courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
        : 0,
      domainStats,
    };
  }
}

// ============================================
// CloudCourseEnrollmentService
// ============================================

class CloudCourseEnrollmentService extends BaseService {
  /** 用户自主选课 */
  async enroll(userId: string, courseId: string, source: EnrollmentSource = 'self'): Promise<CloudCourseEnrollment | null> {
    // 检查是否已选课
    const existing = await cloudCourseEnrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existing) {
      return mapEnrollmentFromRow(existing);
    }

    const row = await cloudCourseEnrollmentRepository.create({
      course_id: courseId,
      user_id: userId,
      role: 'learner',
      source,
      status: source === 'pushed' ? 'pushed' : 'scheduled',
    });

    if (row) {
      // 更新课程选课人数
      await cloudCourseRepository.incrementEnrolledCount(courseId);
      return mapEnrollmentFromRow(row as CloudCourseEnrollmentRow);
    }
    return null;
  }

  /** 家长安排学生学习 */
  async enrollForStudent(
    parentId: string,
    studentId: string,
    courseId: string,
    source: EnrollmentSource = 'pushed'
  ): Promise<CloudCourseEnrollment | null> {
    const row = await cloudCourseEnrollmentRepository.create({
      course_id: courseId,
      user_id: parentId,
      role: 'manager',
      target_student_id: studentId,
      source,
      status: 'scheduled',
    });

    if (row) {
      await cloudCourseRepository.incrementEnrolledCount(courseId);
      return mapEnrollmentFromRow(row as CloudCourseEnrollmentRow);
    }
    return null;
  }

  /** 获取用户的选课记录 */
  async getUserEnrollments(userId: string): Promise<CloudCourseEnrollment[]> {
    const rows = await cloudCourseEnrollmentRepository.findByUserId(userId);
    const enrollments = rows.map(mapEnrollmentFromRow);

    // 附加课程信息
    for (const enrollment of enrollments) {
      const courseRow = await cloudCourseRepository.findById(enrollment.courseId);
      if (courseRow) {
        enrollment.course = mapCourseFromRow(courseRow as CloudCourseRow);
      }
    }

    return enrollments;
  }

  /** 获取家长管理的学生的课程 */
  async getStudentEnrollments(parentId: string, studentId: string): Promise<CloudCourseEnrollment[]> {
    const rows = await cloudCourseEnrollmentRepository.findByUserId(parentId);
    const filtered = rows.filter(r => r.target_student_id === studentId);
    const enrollments = filtered.map(mapEnrollmentFromRow);

    for (const enrollment of enrollments) {
      const courseRow = await cloudCourseRepository.findById(enrollment.courseId);
      if (courseRow) {
        enrollment.course = mapCourseFromRow(courseRow as CloudCourseRow);
      }
    }

    return enrollments;
  }

  /** 安排学习时间 */
  async scheduleLearning(dto: ScheduleLearningDTO): Promise<CloudCourseEnrollment | null> {
    const row = await cloudCourseEnrollmentRepository.updateStatus(dto.enrollmentId, 'scheduled', dto.scheduledAt);
    return row ? mapEnrollmentFromRow(row as CloudCourseEnrollmentRow) : null;
  }

  /** 更新学习进度 */
  async updateProgress(dto: UpdateProgressDTO): Promise<CloudCourseEnrollment | null> {
    const enrollment = await cloudCourseEnrollmentRepository.findById(dto.enrollmentId);
    if (!enrollment) return null;

    // 获取章节总数
    const chapters = await cloudCourseChapterRepository.findByCourseId(enrollment.course_id);
    const totalChapters = chapters.length || 1;

    // 获取已完成章节数
    const records = await cloudLearningRecordRepository.findByEnrollmentId(dto.enrollmentId);
    const completedChapters = new Set(records.filter(r => r.completed_at).map(r => r.chapter_id));

    if (dto.completed) {
      completedChapters.add(dto.chapterId);
    }

    const progress = Math.min(100, Math.round((completedChapters.size / totalChapters) * 100));
    const status: EnrollmentStatus = progress >= 100 ? 'completed' : 'learning';

    const updateData: Partial<CloudCourseEnrollmentRow> = {
      progress,
      last_chapter_id: dto.chapterId,
      status,
      completed_at: progress >= 100 ? new Date().toISOString() : undefined,
    };

    const row = await cloudCourseEnrollmentRepository.update(dto.enrollmentId, updateData);
    return row ? mapEnrollmentFromRow(row as CloudCourseEnrollmentRow) : null;
  }

  /** 推送课程给学生家长 */
  async pushCourse(pushedBy: string, pusherName: string, dto: PushCloudCourseDTO): Promise<CloudCoursePush | null> {
    // 创建推送记录
    const pushRow = await cloudCoursePushRepository.create({
      course_id: dto.courseId,
      pushed_by: pushedBy,
      pusher_name: pusherName,
      target_type: dto.targetType,
      target_ids: dto.targetIds,
      message: dto.message,
      deadline: dto.deadline || null,
    });

    if (!pushRow) return null;

    // 根据目标类型，为每个目标创建选课记录
    const parentIds = await this.resolveTargetParentIds(dto.targetType, dto.targetIds);

    for (const parentId of parentIds) {
      try {
        await cloudCourseEnrollmentRepository.create({
          course_id: dto.courseId,
          user_id: parentId,
          role: 'manager',
          source: 'pushed',
          status: 'pushed',
        });
      } catch (e) {
        console.error('[CloudCourseEnrollmentService] pushCourse enrollment error:', e);
      }
    }

    return mapPushFromRow(pushRow as CloudCoursePushRow);
  }

  /** 解析推送目标的学生家长ID列表 */
  private async resolveTargetParentIds(targetType: string, targetIds: string[]): Promise<string[]> {
    const studentRepo = getService<StudentRepository>('StudentRepository');
    const classRepo = getService<ClassRepository>('ClassRepository');
    const parentIds = new Set<string>();

    for (const targetId of targetIds) {
      let students: Array<{ parents?: Array<{ id?: string }> }> = [];

      if (targetType === 'grade') {
        // 按年级：先获取该年级所有班级，再获取所有学生
        const gradeNum = parseInt(targetId, 10);
        if (!isNaN(gradeNum)) {
          const classes = await classRepo.findByGrade(gradeNum);
          for (const cls of classes) {
            const classStudents = await studentRepo.findByClass(cls.id) as Array<{ parents?: Array<{ id?: string }> }> || [];
            students = students.concat(classStudents);
          }
        }
      } else {
        // 按班级：直接获取班级学生
        students = await studentRepo.findByClass(targetId) as Array<{ parents?: Array<{ id?: string }> }> || [];
      }

      for (const student of students) {
        if (student.parents) {
          for (const p of student.parents) {
            if (p.id) parentIds.add(p.id);
          }
        }
      }
    }

    return Array.from(parentIds);
  }
}

// ============================================
// CloudLearningRecordService
// ============================================

class CloudLearningRecordService extends BaseService {
  /** 开始学习章节 */
  async startLearning(enrollmentId: string, chapterId: string, recordType: 'video' | 'live' | 'quiz' | 'document' = 'video'): Promise<CloudLearningRecord | null> {
    const row = await cloudLearningRecordRepository.create({
      enrollment_id: enrollmentId,
      chapter_id: chapterId,
      record_type: recordType,
      started_at: new Date().toISOString(),
      watch_duration: 0,
    });
    return row ? mapLearningRecordFromRow(row as CloudLearningRecordRow) : null;
  }

  /** 完成学习章节 */
  async completeLearning(recordId: string, watchDuration: number, quizScore?: number): Promise<CloudLearningRecord | null> {
    const row = await cloudLearningRecordRepository.update(recordId, {
      completed_at: new Date().toISOString(),
      watch_duration: watchDuration,
      quiz_score: quizScore || null,
    } as Partial<CloudLearningRecordRow>);
    return row ? mapLearningRecordFromRow(row as CloudLearningRecordRow) : null;
  }

  /** 获取学习记录 */
  async getRecords(enrollmentId: string): Promise<CloudLearningRecord[]> {
    const rows = await cloudLearningRecordRepository.findByEnrollmentId(enrollmentId);
    return rows.map(mapLearningRecordFromRow);
  }

  /** 获取总观看时长 */
  async getTotalWatchDuration(enrollmentId: string): Promise<number> {
    return cloudLearningRecordRepository.getTotalWatchDuration(enrollmentId);
  }
}

function mapLearningRecordFromRow(row: CloudLearningRecordRow): CloudLearningRecord {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    chapterId: row.chapter_id,
    recordType: row.record_type,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    watchDuration: row.watch_duration,
    quizScore: row.quiz_score,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ============================================
// CloudLiveSessionService
// ============================================

class CloudLiveSessionService extends BaseService {
  /** 创建直播会话 */
  async createSession(courseId: string, data: {
    title: string;
    description?: string;
    chapterId?: string;
    scheduledAt: string;
    duration?: number;
    roomUrl?: string;
  }): Promise<CloudLiveSession | null> {
    const row = await cloudLiveSessionRepository.create({
      course_id: courseId,
      chapter_id: data.chapterId || null,
      title: data.title,
      description: data.description || '',
      scheduled_at: data.scheduledAt,
      duration: data.duration || 3600,
      room_url: data.roomUrl || null,
      status: 'scheduled',
    });
    return row ? mapLiveSessionFromRow(row as CloudLiveSessionRow) : null;
  }

  /** 获取课程的直播会话 */
  async getSessionsByCourse(courseId: string): Promise<CloudLiveSession[]> {
    const rows = await cloudLiveSessionRepository.findByCourseId(courseId);
    return rows.map(mapLiveSessionFromRow);
  }

  /** 获取即将开始的直播 */
  async getUpcomingSessions(): Promise<CloudLiveSession[]> {
    const rows = await cloudLiveSessionRepository.findUpcoming();
    return rows.map(mapLiveSessionFromRow);
  }

  /** 更新直播状态 */
  async updateSessionStatus(sessionId: string, status: LiveSessionStatus): Promise<CloudLiveSession | null> {
    const row = await cloudLiveSessionRepository.updateStatus(sessionId, status);
    return row ? mapLiveSessionFromRow(row as CloudLiveSessionRow) : null;
  }
}

// ============================================
// 导出单例
// ============================================

export const cloudCourseService = new CloudCourseService();
export const cloudCourseEnrollmentService = new CloudCourseEnrollmentService();
export const cloudLearningRecordService = new CloudLearningRecordService();
export const cloudLiveSessionService = new CloudLiveSessionService();

export {
  CloudCourseService,
  CloudCourseEnrollmentService,
  CloudLearningRecordService,
  CloudLiveSessionService,
};
