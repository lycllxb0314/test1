/**
 * 教研活动 Repository
 * 
 * 提供教研活动数据访问
 * 
 * @module repositories/research.repository
 */

import { BaseRepository, QueryOptions, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 教研活动类型
 */
export type ResearchType = 
  | 'teaching_research'   // 教研活动
  | 'lesson_preparation'  // 集体备课
  | 'open_class'          // 公开课
  | 'observation'         // 听评课
  | 'training'            // 培训
  | 'competition';        // 比赛

/**
 * 教研活动状态
 */
export type ResearchStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

/**
 * 教研活动
 */
export interface ResearchActivity {
  id: string;
  title: string;
  type: ResearchType;
  description?: string;
  organizerId: string;
  organizerName: string;
  participants: string[];
  participantNames?: string[];
  startTime: string;
  endTime: string;
  location?: string;
  status: ResearchStatus;
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 教研阶段
 */
export interface ResearchStage {
  id: string;
  activityId: string;
  name: string;
  description?: string;
  order: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'ongoing' | 'completed';
  createdAt: string;
}

/**
 * 教研成果
 */
export interface ResearchAchievement {
  id: string;
  activityId: string;
  title: string;
  type: 'paper' | 'case' | 'resource' | 'award' | 'other';
  authorId: string;
  authorName: string;
  description?: string;
  attachments?: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'published';
  reviewComments?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 教研资源
 */
export interface ResearchResource {
  id: string;
  title: string;
  type: 'lesson_plan' | 'courseware' | 'video' | 'document' | 'other';
  subject: string;
  grade?: number;
  authorId: string;
  authorName: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  downloadCount: number;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/**
 * 教研查询选项
 */
export interface ResearchQueryOptions extends QueryOptions {
  type?: ResearchType;
  status?: ResearchStatus;
  organizerId?: string;
}

/**
 * 教研活动 Repository
 */
export class ResearchActivityRepository extends BaseRepository<ResearchActivity> {
  constructor() {
    super('research_activities');
  }

  /**
   * 根据类型查询
   */
  async findByType(type: ResearchType): Promise<ResearchActivity[]> {
    return this.findWhere({ type });
  }

  /**
   * 根据状态查询
   */
  async findByStatus(status: ResearchStatus): Promise<ResearchActivity[]> {
    return this.findWhere({ status });
  }

  /**
   * 根据组织者查询
   */
  async findByOrganizer(organizerId: string): Promise<ResearchActivity[]> {
    return this.findWhere({ organizer_id: organizerId });
  }

  /**
   * 分页查询
   */
  async findPaginated(options: ResearchQueryOptions = {}): Promise<PaginatedResult<ResearchActivity>> {
    const { type, status, organizerId, ...baseOptions } = options;

    const filters: Record<string, unknown> = {
      ...baseOptions.filters,
    };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (organizerId) filters.organizer_id = organizerId;

    return super.findPaginated({
      ...baseOptions,
      filters,
    });
  }

  /**
   * 获取进行中的活动
   */
  async findOngoing(): Promise<ResearchActivity[]> {
    return this.findByStatus('ongoing');
  }

  /**
   * 获取统计数据
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<ResearchType, number>;
    byStatus: Record<ResearchStatus, number>;
  }> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('type, status');

    if (error || !data) {
      return { total: 0, byType: {} as any, byStatus: {} as any };
    }

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    data.forEach((item) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    return {
      total: data.length,
      byType: byType as Record<ResearchType, number>,
      byStatus: byStatus as Record<ResearchStatus, number>,
    };
  }
}

/**
 * 教研阶段 Repository
 */
export class ResearchStageRepository extends BaseRepository<ResearchStage> {
  constructor() {
    super('research_stages');
  }

  /**
   * 根据活动ID查询
   */
  async findByActivity(activityId: string): Promise<ResearchStage[]> {
    const client = this.client;
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('activity_id', activityId)
      .order('order', { ascending: true });

    if (error) {
      console.error(`[${this.tableName}] findByActivity error:`, error.message);
      return [];
    }

    return (data || []) as ResearchStage[];
  }
}

/**
 * 教研成果 Repository
 */
export class ResearchAchievementRepository extends BaseRepository<ResearchAchievement> {
  constructor() {
    super('research_achievements');
  }

  /**
   * 根据活动ID查询
   */
  async findByActivity(activityId: string): Promise<ResearchAchievement[]> {
    return this.findWhere({ activity_id: activityId });
  }

  /**
   * 根据作者查询
   */
  async findByAuthor(authorId: string): Promise<ResearchAchievement[]> {
    return this.findWhere({ author_id: authorId });
  }
}

/**
 * 教研资源 Repository
 */
export class ResearchResourceRepository extends BaseRepository<ResearchResource> {
  constructor() {
    super('research_resources');
  }

  /**
   * 根据学科查询
   */
  async findBySubject(subject: string): Promise<ResearchResource[]> {
    return this.findWhere({ subject });
  }

  /**
   * 根据作者查询
   */
  async findByAuthor(authorId: string): Promise<ResearchResource[]> {
    return this.findWhere({ author_id: authorId });
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: string): Promise<boolean> {
    const client = this.client;
    const { error } = await client
      .from(this.tableName)
      .update({
        download_count: client.rpc('increment', { count: 1 }),
      })
      .eq('id', id);

    return !error;
  }

  /**
   * 搜索资源
   */
  async search(keyword: string, options: QueryOptions = {}): Promise<PaginatedResult<ResearchResource>> {
    return this.findPaginated({
      ...options,
      search: {
        fields: ['title', 'description', 'tags'],
        value: keyword,
      },
    });
  }
}

// 导出单例
export const researchActivityRepository = new ResearchActivityRepository();
export const researchStageRepository = new ResearchStageRepository();
export const researchAchievementRepository = new ResearchAchievementRepository();
export const researchResourceRepository = new ResearchResourceRepository();
