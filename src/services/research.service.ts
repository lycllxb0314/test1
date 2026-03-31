/**
 * 教研活动 Service
 * 
 * 提供教研活动业务逻辑处理
 * 
 * ⚠️ 架构原则：
 * - 通过 DI 容器获取 Repository，不直接 import 具体实现
 * - Service 层只依赖 Repository 接口，遵循依赖倒置原则
 * 
 * @module services/research.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  IResearchActivityRepository,
  IResearchStageRepository,
  IResearchAchievementRepository,
  IResearchResourceRepository,
  ResearchQueryOptions,
} from '@/types/repository';
import type {
  ResearchActivity,
  ResearchStage,
  ResearchAchievement,
  ResearchResource,
  ActivityStatus,
} from '@/types/research';

// 主题类型标签映射
const THEME_TYPE_LABELS: Record<string, string> = {
  big_unit: '大单元教学',
  project: '项目式教学',
  practice: '学科实践',
  ai_enabled: 'AI赋能教学',
  custom: '自定义主题',
};

const THEME_LEVEL_LABELS: Record<string, string> = {
  school: '校级重点教研',
  grade: '年级组教研',
  subject_group: '备课组微教研',
};

const ACHIEVEMENT_TYPE_LABELS: Record<string, string> = {
  lesson_design: '教学设计',
  excellent_case: '优秀案例',
  academic_paper: '学术论文',
  courseware: '课件资源',
  other: '其他成果',
};

const AI_TOOL_TYPE_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  wenxin: '文心一言',
  tongyi: '通义千问',
  doubao: '豆包',
  kimi: 'Kimi',
  deepseek: 'DeepSeek',
  other: '其他',
};

const PRACTICE_ACTIVITY_TYPE_LABELS: Record<string, string> = {
  experiment: '实验探究',
  investigation: '调查研究',
  project: '项目制作',
  field_trip: '实地考察',
  competition: '学科竞赛',
  other: '其他',
};

/**
 * 教研活动 Service
 */
export class ResearchActivityService extends BaseService {
  /**
   * 获取教研活动 Repository（通过 DI 容器）
   */
  private get researchActivityRepository(): IResearchActivityRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchActivityRepository);
  }

  /**
   * 获取教研阶段 Repository（通过 DI 容器）
   */
  private get researchStageRepository(): IResearchStageRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchStageRepository);
  }

  /**
   * 获取分页列表
   */
  async getPaginated(options: ResearchQueryOptions = {}): Promise<PaginatedServiceResult<ResearchActivity>> {
    try {
      const result = await this.researchActivityRepository.findPaginated(options);
      return {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      return { success: false, error: '获取教研活动列表失败' };
    }
  }

  /**
   * 根据ID获取详情
   */
  async getById(id: string): Promise<ServiceResult<ResearchActivity>> {
    const activity = await this.researchActivityRepository.findById(id);
    if (!activity) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }
    return this.ok(activity);
  }

  /**
   * 获取详情（含阶段）
   */
  async getDetail(id: string): Promise<ServiceResult<ResearchActivity & { stages?: ResearchStage[] }>> {
    const activity = await this.researchActivityRepository.findById(id);
    if (!activity) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    const stages = await this.researchStageRepository.findByActivity(id);
    return this.ok({ ...activity, stages });
  }

  /**
   * 创建活动
   */
  async create(data: Partial<ResearchActivity>): Promise<ServiceResult<ResearchActivity>> {
    if (!data.title || !data.type) {
      return this.fail('活动标题和类型不能为空', 'VALIDATION_ERROR');
    }

    const activity = await this.researchActivityRepository.create({
      ...data,
      status: (data.status || 'scheduled') as ActivityStatus,
    });

    if (!activity) {
      return this.fail('创建教研活动失败', 'CREATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新活动
   */
  async update(id: string, data: Partial<ResearchActivity>): Promise<ServiceResult<ResearchActivity>> {
    const existing = await this.researchActivityRepository.findById(id);
    if (!existing) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    const activity = await this.researchActivityRepository.update(id, data);
    if (!activity) {
      return this.fail('更新教研活动失败', 'UPDATE_ERROR');
    }

    return this.ok(activity);
  }

  /**
   * 更新状态
   */
  async updateStatus(id: string, status: ActivityStatus): Promise<ServiceResult<ResearchActivity>> {
    return this.update(id, { status });
  }

  /**
   * 开始活动
   */
  async start(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'in_progress');
  }

  /**
   * 完成活动
   */
  async complete(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'completed');
  }

  /**
   * 取消活动
   */
  async cancel(id: string): Promise<ServiceResult<ResearchActivity>> {
    return this.updateStatus(id, 'cancelled');
  }

  /**
   * 删除活动
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const existing = await this.researchActivityRepository.findById(id);
    if (!existing) {
      return this.fail('教研活动不存在', 'NOT_FOUND');
    }

    if (existing.status === 'in_progress') {
      return this.fail('进行中的活动不能删除', 'INVALID_STATUS');
    }

    const success = await this.researchActivityRepository.delete(id);
    if (!success) {
      return this.fail('删除教研活动失败', 'DELETE_ERROR');
    }

    return this.ok();
  }

  /**
   * 获取进行中的活动
   */
  async getOngoing(): Promise<ServiceResult<ResearchActivity[]>> {
    const activities = await this.researchActivityRepository.findOngoing();
    return this.ok(activities);
  }
}

/**
 * 教研阶段 Service
 */
export class ResearchStageService extends BaseService {
  /**
   * 获取教研阶段 Repository（通过 DI 容器）
   */
  private get researchStageRepository(): IResearchStageRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchStageRepository);
  }

  /**
   * 根据活动ID获取阶段列表
   */
  async getByActivity(activityId: string): Promise<ServiceResult<ResearchStage[]>> {
    const stages = await this.researchStageRepository.findByActivity(activityId);
    return this.ok(stages);
  }

  /**
   * 创建阶段
   */
  async create(data: Partial<ResearchStage>): Promise<ServiceResult<ResearchStage>> {
    if (!data.themeId || !data.name) {
      return this.fail('主题ID和阶段名称不能为空', 'VALIDATION_ERROR');
    }

    const stage = await this.researchStageRepository.create(data);
    if (!stage) {
      return this.fail('创建阶段失败', 'CREATE_ERROR');
    }

    return this.ok(stage);
  }

  /**
   * 更新阶段
   */
  async update(id: string, data: Partial<ResearchStage>): Promise<ServiceResult<ResearchStage>> {
    const stage = await this.researchStageRepository.update(id, data);
    if (!stage) {
      return this.fail('更新阶段失败', 'UPDATE_ERROR');
    }
    return this.ok(stage);
  }

  /**
   * 删除阶段
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await this.researchStageRepository.delete(id);
    if (!success) {
      return this.fail('删除阶段失败', 'DELETE_ERROR');
    }
    return this.ok();
  }
}

/**
 * 教研成果 Service
 */
export class ResearchAchievementService extends BaseService {
  /**
   * 获取教研成果 Repository（通过 DI 容器）
   */
  private get researchAchievementRepository(): IResearchAchievementRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchAchievementRepository);
  }

  /**
   * 根据活动获取成果
   */
  async getByActivity(activityId: string): Promise<ServiceResult<ResearchAchievement[]>> {
    const achievements = await this.researchAchievementRepository.findByActivity(activityId);
    return this.ok(achievements);
  }

  /**
   * 创建成果
   */
  async create(data: Partial<ResearchAchievement>): Promise<ServiceResult<ResearchAchievement>> {
    if (!data.title || !data.type || !data.authorIds?.length) {
      return this.fail('成果标题、类型和作者不能为空', 'VALIDATION_ERROR');
    }

    const achievement = await this.researchAchievementRepository.create({
      ...data,
      status: data.status || 'draft',
    });

    if (!achievement) {
      return this.fail('创建成果失败', 'CREATE_ERROR');
    }

    return this.ok(achievement);
  }

  /**
   * 更新成果
   */
  async update(id: string, data: Partial<ResearchAchievement>): Promise<ServiceResult<ResearchAchievement>> {
    const achievement = await this.researchAchievementRepository.update(id, data);
    if (!achievement) {
      return this.fail('更新成果失败', 'UPDATE_ERROR');
    }
    return this.ok(achievement);
  }
}

/**
 * 教研资源 Service
 */
export class ResearchResourceService extends BaseService {
  /**
   * 获取教研资源 Repository（通过 DI 容器）
   */
  private get researchResourceRepository(): IResearchResourceRepository {
    return getService(SERVICE_IDENTIFIERS.ResearchResourceRepository);
  }

  /**
   * 获取分页列表
   */
  async getPaginated(
    options: { pagination?: { page?: number; pageSize?: number }; filters?: { subject?: string } } = {}
  ): Promise<PaginatedServiceResult<ResearchResource>> {
    try {
      const result = await this.researchResourceRepository.findPaginated({
        pagination: options.pagination ? {
          page: options.pagination.page || 1,
          pageSize: options.pagination.pageSize || 20,
        } : undefined,
        filters: options.filters,
      });
      return {
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      return { success: false, error: '获取资源列表失败' };
    }
  }

  /**
   * 根据ID获取详情
   */
  async getById(id: string): Promise<ServiceResult<ResearchResource>> {
    const resource = await this.researchResourceRepository.findById(id);
    if (!resource) {
      return this.fail('资源不存在', 'NOT_FOUND');
    }
    return this.ok(resource);
  }

  /**
   * 创建资源
   */
  async create(data: Partial<ResearchResource>): Promise<ServiceResult<ResearchResource>> {
    if (!data.title || !data.type || !data.fileUrl) {
      return this.fail('资源标题、类型和文件不能为空', 'VALIDATION_ERROR');
    }

    const resource = await this.researchResourceRepository.create({
      ...data,
      downloadCount: 0,
      viewCount: 0,
      isActive: true,
    });

    if (!resource) {
      return this.fail('创建资源失败', 'CREATE_ERROR');
    }

    return this.ok(resource);
  }

  /**
   * 更新资源
   */
  async update(id: string, data: Partial<ResearchResource>): Promise<ServiceResult<ResearchResource>> {
    const resource = await this.researchResourceRepository.update(id, data);
    if (!resource) {
      return this.fail('更新资源失败', 'UPDATE_ERROR');
    }
    return this.ok(resource);
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const success = await this.researchResourceRepository.delete(id);
    if (!success) {
      return this.fail('删除资源失败', 'DELETE_ERROR');
    }
    return this.ok();
  }
}

// 导出单例
export const researchActivityService = new ResearchActivityService();
export const researchStageService = new ResearchStageService();
export const researchAchievementService = new ResearchAchievementService();
export const researchResourceService = new ResearchResourceService();

/**
 * 教研主题 Service
 */
export class ResearchThemeService extends BaseService {
  /**
   * 获取主题列表
   */
  async getList(params: {
    type?: string;
    subject?: string;
    level?: string;
    status?: string;
    creatorId?: string;
    participantId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20 } = params;

    let query = client
      .from('research_themes')
      .select('*', { count: 'exact' });

    if (params.type) query = query.eq('type', params.type);
    if (params.subject) query = query.eq('subject', params.subject);
    if (params.level) query = query.eq('level', params.level);
    if (params.status) query = query.eq('status', params.status);
    if (params.creatorId) query = query.eq('creator_id', params.creatorId);
    if (params.participantId) query = query.contains('participant_ids', [params.participantId]);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: '获取教研主题失败' };
    }

    const themes = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      typeLabel: THEME_TYPE_LABELS[item.type as string],
      subject: item.subject,
      level: item.level,
      levelLabel: THEME_LEVEL_LABELS[item.level as string],
      description: item.description,
      objectives: item.objectives ? JSON.parse(item.objectives as string) : [],
      keyPoints: item.key_points ? JSON.parse(item.key_points as string) : [],
      startDate: item.start_date,
      endDate: item.end_date,
      status: item.status,
      creatorId: item.creator_id,
      creatorName: item.creator_name,
      participantIds: item.participant_ids || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return {
      success: true,
      data: themes,
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    };
  }

  /**
   * 获取主题详情
   */
  async getDetail(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const { data: theme, error } = await client
      .from('research_themes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !theme) {
      return this.fail('教研主题不存在', 'NOT_FOUND');
    }

    // 获取关联数据
    const [stagesResult, activitiesResult, statisticsResult] = await Promise.all([
      client.from('research_stages').select('*').eq('theme_id', id).order('order_num', { ascending: true }),
      client.from('research_activities').select('*').eq('theme_id', id).order('scheduled_at', { ascending: false }),
      client.from('research_statistics').select('*').eq('theme_id', id).single(),
    ]);

    return this.ok({
      ...theme,
      typeLabel: THEME_TYPE_LABELS[theme.type as string],
      levelLabel: THEME_LEVEL_LABELS[theme.level as string],
      objectives: theme.objectives ? JSON.parse(theme.objectives as string) : [],
      keyPoints: theme.key_points ? JSON.parse(theme.key_points as string) : [],
      stages: stagesResult.data || [],
      activities: activitiesResult.data || [],
      statistics: statisticsResult.data || null,
    });
  }

  /**
   * 创建主题
   */
  async create(data: Record<string, unknown>, userId: string, userName: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const insertData = {
      title: data.title,
      type: data.type,
      subject: data.subject,
      level: data.level,
      description: data.description || '',
      objectives: data.objectives ? JSON.stringify(data.objectives) : '[]',
      key_points: data.keyPoints ? JSON.stringify(data.keyPoints) : '[]',
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      status: 'draft',
      creator_id: userId,
      creator_name: userName,
      participant_ids: data.participantIds || [],
    };

    const { data: theme, error } = await client
      .from('research_themes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return this.fail('创建教研主题失败', 'DATABASE_ERROR');
    }

    // 创建统计记录
    await client.from('research_statistics').insert({
      theme_id: theme.id,
      total_activities: 0,
      completed_activities: 0,
      total_participants: 0,
      average_attendance: '0',
      achievements_count: 0,
      resources_count: 0,
    });

    return this.ok({
      ...theme,
      typeLabel: THEME_TYPE_LABELS[theme.type as string],
      levelLabel: THEME_LEVEL_LABELS[theme.level as string],
    });
  }

  /**
   * 更新主题
   */
  async update(id: string, data: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.objectives !== undefined) updateData.objectives = JSON.stringify(data.objectives);
    if (data.keyPoints !== undefined) updateData.key_points = JSON.stringify(data.keyPoints);
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.participantIds !== undefined) updateData.participant_ids = data.participantIds;

    const { data: theme, error } = await client
      .from('research_themes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.fail('更新教研主题失败', 'DATABASE_ERROR');
    }

    return this.ok({
      ...theme,
      typeLabel: THEME_TYPE_LABELS[theme.type as string],
      levelLabel: THEME_LEVEL_LABELS[theme.level as string],
    });
  }

  /**
   * 删除主题
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();

    // 检查是否有关联活动
    const { data: activities } = await client
      .from('research_activities')
      .select('id')
      .eq('theme_id', id)
      .limit(1);

    if (activities && activities.length > 0) {
      return this.fail('该主题下有教研活动，无法删除', 'VALIDATION_ERROR');
    }

    const { error } = await client.from('research_themes').delete().eq('id', id);
    if (error) {
      return this.fail('删除教研主题失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }

  /**
   * 提交审核
   */
  async submitForApproval(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();

    const { data: theme } = await client
      .from('research_themes')
      .select('status')
      .eq('id', id)
      .single();

    if (!theme || theme.status !== 'draft') {
      return this.fail('只有草稿状态的主题可以提交审核', 'VALIDATION_ERROR');
    }

    const { error } = await client
      .from('research_themes')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return this.fail('提交审核失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }

  /**
   * 审核主题
   */
  async approve(id: string, approved: boolean, userId: string, userName: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();

    const { data: theme } = await client
      .from('research_themes')
      .select('status')
      .eq('id', id)
      .single();

    if (!theme || theme.status !== 'pending') {
      return this.fail('只有待审核状态的主题可以审核', 'VALIDATION_ERROR');
    }

    const { error } = await client
      .from('research_themes')
      .update({
        status: approved ? 'approved' : 'draft',
        approver_id: userId,
        approver_name: userName,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return this.fail('审核失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 教研成果扩展 Service
 */
export class ResearchAchievementExtService extends BaseService {
  /**
   * 获取成果列表
   */
  async getList(params: {
    themeId?: string;
    type?: string;
    subject?: string;
    status?: string;
    authorId?: string;
    isPublic?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20 } = params;

    let query = client
      .from('research_achievements')
      .select('*', { count: 'exact' });

    if (params.themeId) query = query.eq('theme_id', params.themeId);
    if (params.type) query = query.eq('type', params.type);
    if (params.subject) query = query.eq('subject', params.subject);
    if (params.status) query = query.eq('status', params.status);
    if (params.authorId) query = query.contains('author_ids', [params.authorId]);
    if (params.isPublic !== undefined) query = query.eq('is_public', params.isPublic);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: '获取教研成果失败' };
    }

    const achievements = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      typeLabel: ACHIEVEMENT_TYPE_LABELS[item.type as string] || item.type,
      content: item.content ? (typeof item.content === 'string' ? JSON.parse(item.content) : item.content) : null,
    }));

    return {
      success: true,
      data: achievements,
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    };
  }

  /**
   * 创建成果
   */
  async create(data: Record<string, unknown>, userId: string, userName: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const insertData = {
      title: data.title,
      type: data.type,
      subject: data.subject || null,
      theme_id: data.themeId || null,
      description: data.description || '',
      content: data.content || null,
      file_url: data.fileUrl || null,
      file_name: data.fileName || null,
      author_ids: data.authorIds || [userId],
      author_names: data.authorNames || [userName],
      status: data.status || 'draft',
      is_public: data.isPublic || false,
      view_count: 0,
    };

    const { data: achievement, error } = await client
      .from('research_achievements')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return this.fail('创建教研成果失败', 'DATABASE_ERROR');
    }

    // 更新主题统计
    if (data.themeId) {
      await client.rpc('increment_achievements_count', { theme_id: data.themeId });
    }

    return this.ok({
      ...achievement,
      typeLabel: ACHIEVEMENT_TYPE_LABELS[achievement.type as string] || achievement.type,
    });
  }
}

/**
 * 教研阶段扩展 Service
 */
export class ResearchStageExtService extends BaseService {
  /**
   * 获取阶段列表
   */
  async getList(themeId: string, status?: string): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();

    let query = client
      .from('research_stages')
      .select('*')
      .eq('theme_id', themeId);

    if (status) query = query.eq('status', status);
    query = query.order('order_num', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return this.fail('获取教研阶段失败', 'DATABASE_ERROR');
    }

    const stages = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      tasks: item.tasks ? (typeof item.tasks === 'string' ? JSON.parse(item.tasks) : item.tasks) : [],
    }));

    return this.ok(stages);
  }

  /**
   * 创建阶段
   */
  async create(data: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    // 获取当前最大序号
    const { data: existingStages } = await client
      .from('research_stages')
      .select('order_num')
      .eq('theme_id', data.themeId)
      .order('order_num', { ascending: false })
      .limit(1);

    const nextOrder = existingStages && existingStages.length > 0
      ? (existingStages[0].order_num || 0) + 1
      : 1;

    const insertData = {
      theme_id: data.themeId,
      name: data.name,
      description: data.description || '',
      order_num: data.orderNum ?? nextOrder,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      status: 'pending',
      tasks: data.tasks || [],
      responsible_ids: data.responsibleIds || [],
    };

    const { data: stage, error } = await client
      .from('research_stages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return this.fail('创建教研阶段失败', 'DATABASE_ERROR');
    }

    return this.ok(stage);
  }

  /**
   * 更新阶段
   */
  async update(id: string, data: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.orderNum !== undefined) updateData.order_num = data.orderNum;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.tasks !== undefined) updateData.tasks = data.tasks;
    if (data.responsibleIds !== undefined) updateData.responsible_ids = data.responsibleIds;

    const { data: stage, error } = await client
      .from('research_stages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.fail('更新教研阶段失败', 'DATABASE_ERROR');
    }

    return this.ok({
      ...stage,
      tasks: stage.tasks ? (typeof stage.tasks === 'string' ? JSON.parse(stage.tasks) : stage.tasks) : [],
    });
  }

  /**
   * 删除阶段
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();

    // 检查阶段下是否有活动
    const { data: activities } = await client
      .from('research_activities')
      .select('id')
      .eq('stage_id', id)
      .limit(1);

    if (activities && activities.length > 0) {
      return this.fail('该阶段下有教研活动，无法删除', 'VALIDATION_ERROR');
    }

    const { error } = await client.from('research_stages').delete().eq('id', id);
    if (error) {
      return this.fail('删除教研阶段失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 教研资源扩展 Service
 */
export class ResearchResourceExtService extends BaseService {
  /**
   * 获取资源列表
   */
  async getList(params: {
    themeId?: string;
    activityId?: string;
    resourceType?: string;
    sourceType?: string;
  }): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();

    let query = client
      .from('research_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.themeId) query = query.eq('theme_id', params.themeId);
    if (params.activityId) query = query.eq('activity_id', params.activityId);
    if (params.resourceType) query = query.eq('resource_type', params.resourceType);
    if (params.sourceType) query = query.eq('source_type', params.sourceType);

    const { data, error } = await query;

    if (error) {
      return this.fail('查询资源失败', 'DATABASE_ERROR');
    }

    const resources = (data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      resourceType: r.resource_type,
      folderId: r.resource_type,
      size: r.size,
      fileUrl: r.file_url,
      fileName: r.file_name,
      fileKey: r.file_key,
      teacherName: r.teacher_name,
      activityTitle: r.activity_title,
      activityId: r.activity_id,
      themeId: r.theme_id,
      sourceType: r.source_type || 'theme_direct',
      createdAt: r.created_at,
    }));

    return this.ok(resources);
  }

  /**
   * 创建资源
   */
  async create(data: Record<string, unknown>, userName?: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const resourceType = data.resourceType || data.folderId || 'other';

    const { data: resource, error } = await client
      .from('research_resources')
      .insert({
        theme_id: data.themeId,
        activity_id: data.activityId || null,
        title: data.title,
        resource_type: resourceType,
        file_key: data.fileKey,
        file_url: data.fileUrl,
        file_name: data.fileName,
        type: data.type || 'application/octet-stream',
        size: data.size || 0,
        teacher_name: data.teacherName || userName || null,
        activity_title: data.activityTitle || null,
        source_type: data.sourceType || 'theme_direct',
      })
      .select()
      .single();

    if (error) {
      return this.fail('创建资源失败', 'DATABASE_ERROR');
    }

    return this.ok({
      id: resource.id,
      title: resource.title,
      resourceType: resource.resource_type,
      sourceType: resource.source_type,
    });
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    const client = getSupabaseClient();

    const { error } = await client.from('research_resources').delete().eq('id', id);
    if (error) {
      return this.fail('删除资源失败', 'DATABASE_ERROR');
    }

    return this.ok();
  }
}

/**
 * 教研统计 Service
 */
export class ResearchStatisticsService extends BaseService {
  /**
   * 获取总览统计
   */
  async getOverview(): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const [
      { count: totalThemes },
      { count: inProgressThemes },
      { count: completedThemes },
      { count: totalActivities },
      { count: totalAchievements },
      { data: themesData },
    ] = await Promise.all([
      client.from('research_themes').select('*', { count: 'exact', head: true }),
      client.from('research_themes').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      client.from('research_themes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      client.from('research_activities').select('*', { count: 'exact', head: true }),
      client.from('research_achievements').select('*', { count: 'exact', head: true }),
      client.from('research_themes').select('type'),
    ]);

    const typeStats: Record<string, number> = {};
    (themesData || []).forEach((t: { type: string }) => {
      typeStats[t.type] = (typeStats[t.type] || 0) + 1;
    });

    return this.ok({
      overview: [
        { label: '教研主题总数', value: totalThemes || 0 },
        { label: '进行中主题', value: inProgressThemes || 0 },
        { label: '已完成主题', value: completedThemes || 0 },
        { label: '教研活动总数', value: totalActivities || 0 },
        { label: '教研成果数', value: totalAchievements || 0 },
      ],
      typeStats,
    });
  }

  /**
   * 获取主题统计
   */
  async getThemeStats(themeId: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const { data: stats } = await client
      .from('research_statistics')
      .select('*')
      .eq('theme_id', themeId)
      .single();

    const { count: activitiesCount } = await client
      .from('research_activities')
      .select('*', { count: 'exact', head: true })
      .eq('theme_id', themeId)
      .eq('status', 'completed');

    return this.ok({
      ...stats,
      completedActivities: activitiesCount || 0,
    });
  }
}

/**
 * 听课评课 Service
 */
export class LessonObservationService extends BaseService {
  /**
   * 获取列表
   */
  async getList(params: {
    teacherId?: string;
    observerId?: string;
    subject?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20 } = params;

    let query = client
      .from('lesson_observations')
      .select('*', { count: 'exact' });

    if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
    if (params.observerId) query = query.contains('observer_ids', [params.observerId]);
    if (params.subject) query = query.eq('subject', params.subject);
    if (params.status) query = query.eq('status', params.status);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('date', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: '获取听课评课列表失败' };
    }

    return {
      success: true,
      data: data || [],
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    };
  }

  /**
   * 创建
   */
  async create(data: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    let overallScore = 0;
    if (data.evaluations && Array.isArray(data.evaluations)) {
      overallScore = data.evaluations.reduce((sum: number, e: { score: number }) => sum + e.score, 0);
    }

    const { data: observation, error } = await client
      .from('lesson_observations')
      .insert({
        ...data,
        overall_score: overallScore,
        status: data.status || 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return this.fail('创建听课评课失败', 'DATABASE_ERROR');
    }

    return this.ok(observation);
  }
}

/**
 * 集体备课 Service
 */
export class CollectivePreparationService extends BaseService {
  /**
   * 获取列表
   */
  async getList(params: {
    subject?: string;
    grade?: number;
    hostId?: string;
    participantId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20 } = params;

    let query = client
      .from('collective_preparations')
      .select('*', { count: 'exact' });

    if (params.subject) query = query.eq('subject', params.subject);
    if (params.grade) query = query.eq('grade', params.grade);
    if (params.hostId) query = query.eq('host_id', params.hostId);
    if (params.participantId) query = query.contains('participant_ids', [params.participantId]);
    if (params.status) query = query.eq('status', params.status);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('scheduled_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: '获取集体备课列表失败' };
    }

    return {
      success: true,
      data: data || [],
      pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    };
  }

  /**
   * 创建
   */
  async create(data: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const { data: preparation, error } = await client
      .from('collective_preparations')
      .insert({
        ...data,
        status: data.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return this.fail('创建集体备课失败', 'DATABASE_ERROR');
    }

    return this.ok(preparation);
  }
}

/**
 * AI赋能教学 Service
 */
export class AITeachingService extends BaseService {
  /**
   * 获取列表
   */
  async getList(params: {
    themeId?: string;
    subject?: string;
    aiToolType?: string;
    status?: string;
    creatorId?: string;
  }): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();

    let query = client.from('ai_teaching_apps').select('*');

    if (params.themeId) query = query.eq('theme_id', params.themeId);
    if (params.subject) query = query.eq('subject', params.subject);
    if (params.aiToolType) query = query.eq('ai_tool_type', params.aiToolType);
    if (params.status) query = query.eq('status', params.status);
    if (params.creatorId) query = query.eq('creator_id', params.creatorId);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return this.fail('获取AI教学应用失败', 'DATABASE_ERROR');
    }

    const apps = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      aiToolTypeLabel: AI_TOOL_TYPE_LABELS[item.ai_tool_type as string] || item.ai_tool_type,
      operationSteps: item.operation_steps ? (typeof item.operation_steps === 'string' ? JSON.parse(item.operation_steps) : item.operation_steps) : [],
      prompts: item.prompts ? (typeof item.prompts === 'string' ? JSON.parse(item.prompts) : item.prompts) : [],
      generatedContent: item.generated_content ? (typeof item.generated_content === 'string' ? JSON.parse(item.generated_content) : item.generated_content) : null,
      optimizedContent: item.optimized_content ? (typeof item.optimized_content === 'string' ? JSON.parse(item.optimized_content) : item.optimized_content) : null,
      effectAnalysis: item.effect_analysis ? (typeof item.effect_analysis === 'string' ? JSON.parse(item.effect_analysis) : item.effect_analysis) : null,
      lessonCase: item.lesson_case ? (typeof item.lesson_case === 'string' ? JSON.parse(item.lesson_case) : item.lesson_case) : null,
    }));

    return this.ok(apps);
  }

  /**
   * 创建
   */
  async create(data: Record<string, unknown>, userId: string, userName: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const insertData = {
      theme_id: data.themeId,
      app_name: data.appName,
      subject: data.subject,
      ai_tool_type: data.aiToolType || null,
      ai_tool_name: data.aiToolName || '',
      description: data.description || '',
      use_case: data.useCase || '',
      operation_steps: data.operationSteps || [],
      prompts: data.prompts || [],
      generated_content: data.generatedContent || null,
      optimized_content: data.optimizedContent || null,
      classroom_integration: data.classroomIntegration || '',
      effect_analysis: data.effectAnalysis || null,
      video_url: data.videoUrl || null,
      lesson_case: data.lessonCase || null,
      creator_id: userId,
      creator_name: userName,
      collaborator_ids: data.collaboratorIds || [],
      status: 'draft',
    };

    const { data: app, error } = await client
      .from('ai_teaching_apps')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return this.fail('创建AI教学应用失败', 'DATABASE_ERROR');
    }

    return this.ok({
      ...app,
      aiToolTypeLabel: AI_TOOL_TYPE_LABELS[app.ai_tool_type as string] || app.ai_tool_type,
    });
  }
}

/**
 * 学科实践 Service
 */
export class PracticeActivityService extends BaseService {
  /**
   * 获取列表
   */
  async getList(params: {
    themeId?: string;
    subject?: string;
    grade?: number;
    activityType?: string;
    status?: string;
    creatorId?: string;
  }): Promise<ServiceResult<Record<string, unknown>[]>> {
    const client = getSupabaseClient();

    let query = client.from('practice_activities').select('*');

    if (params.themeId) query = query.eq('theme_id', params.themeId);
    if (params.subject) query = query.eq('subject', params.subject);
    if (params.grade) query = query.eq('grade', params.grade);
    if (params.activityType) query = query.eq('activity_type', params.activityType);
    if (params.status) query = query.eq('status', params.status);
    if (params.creatorId) query = query.eq('creator_id', params.creatorId);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return this.fail('获取学科实践活动失败', 'DATABASE_ERROR');
    }

    const practices = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      activityTypeLabel: PRACTICE_ACTIVITY_TYPE_LABELS[item.activity_type as string] || item.activity_type,
      objectives: item.objectives ? (typeof item.objectives === 'string' ? JSON.parse(item.objectives) : item.objectives) : [],
      materials: item.materials ? (typeof item.materials === 'string' ? JSON.parse(item.materials) : item.materials) : [],
      procedure: item.procedure ? (typeof item.procedure === 'string' ? JSON.parse(item.procedure) : item.procedure) : [],
      implementationRecords: item.implementation_records ? (typeof item.implementation_records === 'string' ? JSON.parse(item.implementation_records) : item.implementation_records) : [],
      problems: item.problems ? (typeof item.problems === 'string' ? JSON.parse(item.problems) : item.problems) : [],
      solutions: item.solutions ? (typeof item.solutions === 'string' ? JSON.parse(item.solutions) : item.solutions) : [],
      studentWorks: item.student_works ? (typeof item.student_works === 'string' ? JSON.parse(item.student_works) : item.student_works) : [],
      photos: item.photos ? (typeof item.photos === 'string' ? JSON.parse(item.photos) : item.photos) : [],
    }));

    return this.ok(practices);
  }

  /**
   * 创建
   */
  async create(data: Record<string, unknown>, userId: string, userName: string): Promise<ServiceResult<Record<string, unknown>>> {
    const client = getSupabaseClient();

    const insertData = {
      theme_id: data.themeId,
      activity_name: data.activityName,
      subject: data.subject,
      grade: data.grade,
      activity_type: data.activityType || null,
      description: data.description || '',
      objectives: data.objectives || [],
      materials: data.materials || [],
      procedure: data.procedure || [],
      difficulty_level: data.difficultyLevel || null,
      time_required: data.timeRequired || null,
      class_management: data.classManagement || '',
      implementation_records: data.implementationRecords || [],
      problems: data.problems || [],
      solutions: data.solutions || [],
      student_works: data.studentWorks || [],
      photos: data.photos || [],
      reflection: data.reflection || '',
      creator_id: userId,
      creator_name: userName,
      status: 'draft',
    };

    const { data: practice, error } = await client
      .from('practice_activities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return this.fail('创建学科实践活动失败', 'DATABASE_ERROR');
    }

    return this.ok({
      ...practice,
      activityTypeLabel: PRACTICE_ACTIVITY_TYPE_LABELS[practice.activity_type as string] || practice.activity_type,
    });
  }
}

// 导出所有 Service 单例
export const researchThemeService = new ResearchThemeService();
export const researchAchievementExtService = new ResearchAchievementExtService();
export const researchStageExtService = new ResearchStageExtService();
export const researchResourceExtService = new ResearchResourceExtService();
export const researchStatisticsService = new ResearchStatisticsService();
export const lessonObservationService = new LessonObservationService();
export const collectivePreparationService = new CollectivePreparationService();
export const aiTeachingService = new AITeachingService();
export const practiceActivityService = new PracticeActivityService();
