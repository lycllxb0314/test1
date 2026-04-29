/**
 * 云教学系统 Repository 层
 * 
 * 管理云课程、章节、选课、学习记录、直播会话、推送的数据访问
 */

import { BaseRepository } from './base.repository';
import type {
  CloudCourseRow,
  CloudCourseChapterRow,
  CloudCourseEnrollmentRow,
  CloudLearningRecordRow,
  CloudLiveSessionRow,
  CloudCoursePushRow,
  CourseDomain,
  CourseStatus,
  EnrollmentStatus,
  LiveSessionStatus,
  PushTargetType,
} from '@/types/cloud-course';

// ============================================
// CloudCourseRepository
// ============================================

class CloudCourseRepository extends BaseRepository<CloudCourseRow> {
  constructor() {
    super('cloud_courses');
  }

  async findByDomain(domain: CourseDomain, select = '*'): Promise<CloudCourseRow[]> {
    return this.findWhere({ domain }, select);
  }

  async findByStatus(status: CourseStatus, select = '*'): Promise<CloudCourseRow[]> {
    return this.findWhere({ status }, select);
  }

  async findByCreator(creatorId: string, select = '*'): Promise<CloudCourseRow[]> {
    return this.findWhere({ creator_id: creatorId }, select);
  }

  async findPublished(select = '*'): Promise<CloudCourseRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[CloudCourseRepository] findPublished error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCourseRow[];
  }

  async searchPublished(domain: CourseDomain, keyword: string, select = '*'): Promise<CloudCourseRow[]> {
    let query = this.client
      .from(this.tableName)
      .select(select)
      .eq('status', 'published')
      .eq('domain', domain);

    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`);
    }

    query = query.order('published_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('[CloudCourseRepository] searchPublished error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCourseRow[];
  }

  async incrementEnrolledCount(courseId: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ enrolled_count: this.client.rpc('increment', { row_id: courseId, table_name: this.tableName, column_name: 'enrolled_count' }) })
      .eq('id', courseId);

    if (error) {
      // Fallback: read then update
      const course = await this.findById(courseId);
      if (course) {
        const { error: updateError } = await this.client
          .from(this.tableName)
          .update({ enrolled_count: (course.enrolled_count || 0) + 1 })
          .eq('id', courseId);
        return !updateError;
      }
      return false;
    }
    return true;
  }
}

export const cloudCourseRepository = new CloudCourseRepository();
export { CloudCourseRepository };

// ============================================
// CloudCourseChapterRepository
// ============================================

class CloudCourseChapterRepository extends BaseRepository<CloudCourseChapterRow> {
  constructor() {
    super('cloud_course_chapters');
  }

  async findByCourseId(courseId: string, select = '*'): Promise<CloudCourseChapterRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[CloudCourseChapterRepository] findByCourseId error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCourseChapterRow[];
  }

  async deleteByCourseId(courseId: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('course_id', courseId);

    if (error) {
      console.error('[CloudCourseChapterRepository] deleteByCourseId error:', error.message);
      return false;
    }
    return true;
  }

  async createMany(chapters: Partial<CloudCourseChapterRow>[]): Promise<CloudCourseChapterRow[]> {
    return this.createMany(chapters);
  }
}

export const cloudCourseChapterRepository = new CloudCourseChapterRepository();
export { CloudCourseChapterRepository };

// ============================================
// CloudCourseEnrollmentRepository
// ============================================

class CloudCourseEnrollmentRepository extends BaseRepository<CloudCourseEnrollmentRow> {
  constructor() {
    super('cloud_course_enrollments');
  }

  async findByUserId(userId: string, select = '*'): Promise<CloudCourseEnrollmentRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CloudCourseEnrollmentRepository] findByUserId error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCourseEnrollmentRow[];
  }

  async findByCourseId(courseId: string, select = '*'): Promise<CloudCourseEnrollmentRow[]> {
    return this.findWhere({ course_id: courseId }, select);
  }

  async findByUserAndCourse(userId: string, courseId: string, select = '*'): Promise<CloudCourseEnrollmentRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .limit(1);

    if (error) {
      console.error('[CloudCourseEnrollmentRepository] findByUserAndCourse error:', error.message);
      return null;
    }
    return (data?.[0] || null) as unknown as CloudCourseEnrollmentRow | null;
  }

  async findByStudentId(studentId: string, select = '*'): Promise<CloudCourseEnrollmentRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('target_student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CloudCourseEnrollmentRepository] findByStudentId error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCourseEnrollmentRow[];
  }

  async findByStatus(userId: string, status: EnrollmentStatus, select = '*'): Promise<CloudCourseEnrollmentRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CloudCourseEnrollmentRepository] findByStatus error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCourseEnrollmentRow[];
  }

  async updateProgress(id: string, progress: number, lastChapterId: string): Promise<CloudCourseEnrollmentRow | null> {
    return this.update(id, {
      progress,
      last_chapter_id: lastChapterId,
      status: progress >= 100 ? 'completed' : 'learning',
      completed_at: progress >= 100 ? new Date().toISOString() : undefined,
    } as Partial<CloudCourseEnrollmentRow>);
  }

  async updateStatus(id: string, status: EnrollmentStatus, scheduledAt?: string): Promise<CloudCourseEnrollmentRow | null> {
    const updateData: Partial<CloudCourseEnrollmentRow> = { status };
    if (scheduledAt) updateData.scheduled_at = scheduledAt;
    return this.update(id, updateData);
  }
}

export const cloudCourseEnrollmentRepository = new CloudCourseEnrollmentRepository();
export { CloudCourseEnrollmentRepository };

// ============================================
// CloudLearningRecordRepository
// ============================================

class CloudLearningRecordRepository extends BaseRepository<CloudLearningRecordRow> {
  constructor() {
    super('cloud_learning_records');
  }

  async findByEnrollmentId(enrollmentId: string, select = '*'): Promise<CloudLearningRecordRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('enrollment_id', enrollmentId)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('[CloudLearningRecordRepository] findByEnrollmentId error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudLearningRecordRow[];
  }

  async findByChapterAndEnrollment(enrollmentId: string, chapterId: string, select = '*'): Promise<CloudLearningRecordRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('enrollment_id', enrollmentId)
      .eq('chapter_id', chapterId)
      .order('started_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[CloudLearningRecordRepository] findByChapterAndEnrollment error:', error.message);
      return null;
    }
    return (data?.[0] || null) as unknown as CloudLearningRecordRow | null;
  }

  async getTotalWatchDuration(enrollmentId: string): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('watch_duration')
      .eq('enrollment_id', enrollmentId);

    if (error || !data) return 0;
    return (data as unknown as CloudLearningRecordRow[]).reduce((sum, r) => sum + (r.watch_duration || 0), 0);
  }
}

export const cloudLearningRecordRepository = new CloudLearningRecordRepository();
export { CloudLearningRecordRepository };

// ============================================
// CloudLiveSessionRepository
// ============================================

class CloudLiveSessionRepository extends BaseRepository<CloudLiveSessionRow> {
  constructor() {
    super('cloud_live_sessions');
  }

  async findByCourseId(courseId: string, select = '*'): Promise<CloudLiveSessionRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('course_id', courseId)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[CloudLiveSessionRepository] findByCourseId error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudLiveSessionRow[];
  }

  async findUpcoming(select = '*'): Promise<CloudLiveSessionRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .in('status', ['scheduled', 'live'])
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[CloudLiveSessionRepository] findUpcoming error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudLiveSessionRow[];
  }

  async updateStatus(id: string, status: LiveSessionStatus): Promise<CloudLiveSessionRow | null> {
    return this.update(id, { status } as Partial<CloudLiveSessionRow>);
  }
}

export const cloudLiveSessionRepository = new CloudLiveSessionRepository();
export { CloudLiveSessionRepository };

// ============================================
// CloudCoursePushRepository
// ============================================

class CloudCoursePushRepository extends BaseRepository<CloudCoursePushRow> {
  constructor() {
    super('cloud_course_pushes');
  }

  async findByCourseId(courseId: string, select = '*'): Promise<CloudCoursePushRow[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CloudCoursePushRepository] findByCourseId error:', error.message);
      return [];
    }
    return (data || []) as unknown as CloudCoursePushRow[];
  }

  async findByTargetType(targetType: PushTargetType, select = '*'): Promise<CloudCoursePushRow[]> {
    return this.findWhere({ target_type: targetType }, select);
  }
}

export const cloudCoursePushRepository = new CloudCoursePushRepository();
export { CloudCoursePushRepository };
