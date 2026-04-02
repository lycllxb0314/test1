/**
 * 学生荣誉评选活动 Repository
 *
 * @module repositories/honor-campaign.repository
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  HonorCampaignRow,
  HonorCampaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignQueryParams,
  CampaignStatistics,
} from '@/types/honor-campaign';

/**
 * 评选活动数据仓库
 */
export class HonorCampaignRepository {
  protected tableName = 'honor_campaigns';
  
  protected get client() {
    return getSupabaseClient();
  }

  // ==================== 类型转换 ====================

  /**
   * 数据库行 → 业务对象
   */
  private toModel(row: HonorCampaignRow): HonorCampaign {
    return {
      id: row.id,
      title: row.title,
      honorType: row.honor_type,
      description: row.description,
      requirements: row.requirements,
      startDate: row.start_date,
      endDate: row.end_date,
      formConfig: row.form_config,
      status: row.status,
      maxApplicantsPerClass: row.max_applicants_per_class,
      approvalConfig: row.approval_config,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 业务对象 → 数据库行
   */
  private toRow(data: CreateCampaignRequest | UpdateCampaignRequest): Partial<HonorCampaignRow> {
    const row: Partial<HonorCampaignRow> = {};

    if ('title' in data && data.title !== undefined) row.title = data.title;
    if ('honorType' in data && data.honorType !== undefined) row.honor_type = data.honorType;
    if ('description' in data && data.description !== undefined) row.description = data.description;
    if ('requirements' in data && data.requirements !== undefined) row.requirements = data.requirements;
    if ('startDate' in data && data.startDate !== undefined) row.start_date = data.startDate;
    if ('endDate' in data && data.endDate !== undefined) row.end_date = data.endDate;
    if ('formConfig' in data && data.formConfig !== undefined) row.form_config = data.formConfig;
    if ('status' in data && data.status !== undefined) row.status = data.status;
    if ('maxApplicantsPerClass' in data && data.maxApplicantsPerClass !== undefined) {
      row.max_applicants_per_class = data.maxApplicantsPerClass;
    }
    if ('approvalConfig' in data && data.approvalConfig !== undefined) {
      row.approval_config = data.approvalConfig;
    }

    return row;
  }

  // ==================== 查询方法 ====================

  /**
   * 根据ID查询评选活动
   */
  async findById(id: string): Promise<HonorCampaign | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[HonorCampaignRepository] findById error:', error.message);
      return null;
    }

    return data ? this.toModel(data) : null;
  }

  /**
   * 查询评选活动列表
   */
  async findByParams(params: CampaignQueryParams): Promise<{ data: HonorCampaign[]; total: number }> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // 过滤条件
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.honorType) {
      query = query.eq('honor_type', params.honorType);
    }

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('[HonorCampaignRepository] findByParams error:', error.message);
      return { data: [], total: 0 };
    }

    return {
      data: (data || []).map(row => this.toModel(row)),
      total: count || 0,
    };
  }

  /**
   * 查询已发布的评选活动
   */
  async findPublished(): Promise<HonorCampaign[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HonorCampaignRepository] findPublished error:', error.message);
      return [];
    }

    return (data || []).map(row => this.toModel(row));
  }

  // ==================== 创建和更新 ====================

  /**
   * 创建评选活动
   */
  async create(data: CreateCampaignRequest, createdBy: string): Promise<HonorCampaign | null> {
    const row: Omit<HonorCampaignRow, 'id' | 'created_at' | 'updated_at'> = {
      title: data.title,
      honor_type: data.honorType,
      description: data.description || null,
      requirements: data.requirements || null,
      start_date: data.startDate,
      end_date: data.endDate,
      form_config: data.formConfig || null,
      status: 'draft',
      max_applicants_per_class: data.maxApplicantsPerClass || 5,
      approval_config: data.approvalConfig || null,
      created_by: createdBy,
    };

    const { data: created, error } = await this.client
      .from(this.tableName)
      .insert(row as any)
      .select()
      .single();

    if (error) {
      console.error('[HonorCampaignRepository] create error:', error.message);
      return null;
    }

    return created ? this.toModel(created) : null;
  }

  /**
   * 更新评选活动
   */
  async update(id: string, data: UpdateCampaignRequest): Promise<HonorCampaign | null> {
    const row = this.toRow(data);
    row.updated_at = new Date().toISOString();

    const { data: updated, error } = await this.client
      .from(this.tableName)
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[HonorCampaignRepository] update error:', error.message);
      return null;
    }

    return updated ? this.toModel(updated) : null;
  }

  /**
   * 发布评选活动
   */
  async publish(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[HonorCampaignRepository] publish error:', error.message);
      return false;
    }

    return true;
  }

  /**
   * 结束评选活动
   */
  async close(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[HonorCampaignRepository] close error:', error.message);
      return false;
    }

    return true;
  }

  /**
   * 删除评选活动
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[HonorCampaignRepository] delete error:', error.message);
      return false;
    }

    return true;
  }

  // ==================== 统计 ====================

  /**
   * 获取评选活动统计
   */
  async getStatistics(campaignId: string): Promise<CampaignStatistics> {
    // 查询申报数量
    const { count: totalApplications, error: appError } = await this.client
      .from('honor_applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (appError) {
      console.error('[HonorCampaignRepository] getStatistics error:', appError.message);
    }

    // 查询待审批数量
    const { count: pendingApplications } = await this.client
      .from('honor_applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    // 查询通过数量
    const { count: approvedApplications } = await this.client
      .from('honor_applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'approved');

    // 查询拒绝数量
    const { count: rejectedApplications } = await this.client
      .from('honor_applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'rejected');

    // 查询参与班级数
    const { data: classData } = await this.client
      .from('honor_applications')
      .select('class_id')
      .eq('campaign_id', campaignId);

    const classCount = new Set(classData?.map(d => d.class_id) || []).size;

    return {
      totalApplications: totalApplications || 0,
      pendingApplications: pendingApplications || 0,
      approvedApplications: approvedApplications || 0,
      rejectedApplications: rejectedApplications || 0,
      passedApplications: approvedApplications || 0,
      classCount,
      studentCount: totalApplications || 0,
    };
  }
}

// 导出单例
export const honorCampaignRepository = new HonorCampaignRepository();
