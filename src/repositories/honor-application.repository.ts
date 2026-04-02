/**
 * 学生荣誉申报 Repository
 *
 * @module repositories/honor-application.repository
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  HonorApplicationRow,
  HonorApplication,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationQueryParams,
  ApprovalStep,
  ApprovalComment,
} from '@/types/honor-campaign';

/**
 * 申报记录数据仓库
 */
export class HonorApplicationRepository {
  protected tableName = 'honor_applications';
  
  protected get client() {
    return getSupabaseClient();
  }

  // ==================== 类型转换 ====================

  /**
   * 数据库行 → 业务对象
   */
  private toModel(row: HonorApplicationRow): HonorApplication {
    return {
      id: row.id,
      campaignId: row.campaign_id,
      studentId: row.student_id,
      classId: row.class_id,
      applicantId: row.applicant_id,
      applicantName: row.applicant_name,
      applicantRelation: row.applicant_relation || '家长',
      formData: row.form_data,
      attachments: row.attachments,
      approvalInstanceId: row.approval_instance_id,
      currentStep: row.current_step,
      status: row.status,
      approvalComments: row.approval_comments,
      finalStatus: row.final_status,
      certificateNo: row.certificate_no,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==================== 查询方法 ====================

  /**
   * 根据ID查询申报记录
   */
  async findById(id: string): Promise<HonorApplication | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] findById error:', error.message);
      return null;
    }

    return data ? this.toModel(data) : null;
  }

  /**
   * 查询申报记录详情（含关联信息）
   */
  async findByIdWithDetails(id: string): Promise<HonorApplication | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        campaign:honor_campaigns(id, title, honor_type, status),
        student:students(id, name, student_no),
        class:classes(id, name, grade)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] findByIdWithDetails error:', error.message);
      return null;
    }

    if (!data) return null;

    const application = this.toModel(data);
    
    // 添加关联信息
    if (data.campaign) {
      application.campaign = {
        id: data.campaign.id,
        title: data.campaign.title,
        honorType: data.campaign.honor_type,
        status: data.campaign.status,
      } as any;
    }
    if (data.student) {
      application.studentName = data.student.name;
      application.studentNo = data.student.student_no;
    }
    if (data.class) {
      application.className = data.class.name;
      application.grade = data.class.grade;
    }

    return application;
  }

  /**
   * 查询申报记录列表
   */
  async findByParams(params: ApplicationQueryParams): Promise<{ data: HonorApplication[]; total: number }> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        campaign:honor_campaigns(id, title, honor_type, status),
        student:students(id, name, student_no),
        class:classes(id, name, grade)
      `, { count: 'exact' });

    // 过滤条件
    if (params.campaignId) {
      query = query.eq('campaign_id', params.campaignId);
    }
    if (params.studentId) {
      query = query.eq('student_id', params.studentId);
    }
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.currentStep) {
      query = query.eq('current_step', params.currentStep);
    }

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('[HonorApplicationRepository] findByParams error:', error.message);
      return { data: [], total: 0 };
    }

    // 转换数据
    const applications = (data || []).map(row => {
      const app = this.toModel(row);
      
      // 添加关联信息
      if (row.campaign) {
        app.campaign = {
          id: row.campaign.id,
          title: row.campaign.title,
          honorType: row.campaign.honor_type,
          status: row.campaign.status,
        } as any;
      }
      if (row.student) {
        app.studentName = row.student.name;
        app.studentNo = row.student.student_no;
      }
      if (row.class) {
        app.className = row.class.name;
        app.grade = row.class.grade;
      }
      
      return app;
    });

    return { data: applications, total: count || 0 };
  }

  /**
   * 查询待审批列表（按审批步骤）
   */
  async findPendingByStep(step: ApprovalStep, classId?: string): Promise<HonorApplication[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        campaign:honor_campaigns(id, title, honor_type, status),
        student:students(id, name, student_no),
        class:classes(id, name, grade)
      `)
      .eq('current_step', step)
      .eq('status', 'pending');

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[HonorApplicationRepository] findPendingByStep error:', error.message);
      return [];
    }

    return (data || []).map(row => {
      const app = this.toModel(row);
      
      if (row.campaign) {
        app.campaign = {
          id: row.campaign.id,
          title: row.campaign.title,
          honorType: row.campaign.honor_type,
          status: row.campaign.status,
        } as any;
      }
      if (row.student) {
        app.studentName = row.student.name;
        app.studentNo = row.student.student_no;
      }
      if (row.class) {
        app.className = row.class.name;
        app.grade = row.class.grade;
      }
      
      return app;
    });
  }

  // ==================== 创建和更新 ====================

  /**
   * 创建申报记录
   */
  async create(
    data: CreateApplicationRequest,
    applicantId: string,
    applicantName: string,
    classId: string
  ): Promise<HonorApplication | null> {
    const row: Omit<HonorApplicationRow, 'id' | 'created_at' | 'updated_at'> = {
      campaign_id: data.campaignId,
      student_id: data.studentId,
      class_id: classId,
      applicant_id: applicantId,
      applicant_name: applicantName,
      applicant_relation: '家长',
      form_data: data.formData,
      attachments: data.attachments || [],
      approval_instance_id: null,
      current_step: 'head_teacher',
      status: 'pending',
      approval_comments: [],
      final_status: null,
      certificate_no: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      approved_at: null,
    };

    const { data: created, error } = await this.client
      .from(this.tableName)
      .insert(row as any)
      .select()
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] create error:', error.message);
      return null;
    }

    return created ? this.toModel(created) : null;
  }

  /**
   * 更新申报记录
   */
  async update(id: string, data: UpdateApplicationRequest): Promise<HonorApplication | null> {
    const row: Partial<HonorApplicationRow> = {
      updated_at: new Date().toISOString(),
    };

    if (data.formData !== undefined) {
      row.form_data = data.formData;
    }
    if (data.attachments !== undefined) {
      row.attachments = data.attachments;
    }

    const { data: updated, error } = await this.client
      .from(this.tableName)
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] update error:', error.message);
      return null;
    }

    return updated ? this.toModel(updated) : null;
  }

  /**
   * 添加审批意见
   */
  async addApprovalComment(
    id: string,
    comment: ApprovalComment,
    nextStep: ApprovalStep | null,
    newStatus: 'pending' | 'approved' | 'rejected'
  ): Promise<HonorApplication | null> {
    // 先获取当前记录
    const current = await this.findById(id);
    if (!current) return null;

    const comments = [...current.approvalComments, comment];

    const row: Partial<HonorApplicationRow> = {
      approval_comments: comments as any,
      current_step: nextStep,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // 如果审批通过，设置审批时间和证书编号
    if (newStatus === 'approved') {
      row.approved_at = new Date().toISOString();
      row.reviewed_at = new Date().toISOString();
      row.final_status = 'passed';
      
      // 生成证书编号
      const year = new Date().getFullYear();
      const certNo = `RY${year}${Date.now().toString().slice(-6)}`;
      row.certificate_no = certNo;
    } else if (newStatus === 'rejected') {
      row.reviewed_at = new Date().toISOString();
      row.final_status = 'failed';
    }

    const { data: updated, error } = await this.client
      .from(this.tableName)
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] addApprovalComment error:', error.message);
      return null;
    }

    return updated ? this.toModel(updated) : null;
  }

  /**
   * 撤回申报
   */
  async withdraw(id: string): Promise<HonorApplication | null> {
    const row: Partial<HonorApplicationRow> = {
      status: 'withdrawn',
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await this.client
      .from(this.tableName)
      .update(row)
      .eq('id', id)
      .eq('status', 'pending') // 只能撤回待审批的
      .select()
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] withdraw error:', error.message);
      return null;
    }

    return updated ? this.toModel(updated) : null;
  }
}

// 导出单例
export const honorApplicationRepository = new HonorApplicationRepository();
