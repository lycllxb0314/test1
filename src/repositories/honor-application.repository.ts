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
      existingHonors: row.existing_honors || [],
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
   * 注意：由于 Supabase schema cache 问题，不使用 JOIN，改为分步查询
   */
  async findByIdWithDetails(id: string): Promise<HonorApplication | null> {
    // 1. 查询申报记录
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[HonorApplicationRepository] findByIdWithDetails error:', error.message);
      return null;
    }

    if (!data) return null;

    const application = this.toModel(data);
    
    // 2. 查询关联数据
    // 注意：student_id 可能是 UUID 格式（students.id）或学号格式（students.student_no）
    const [campaignResult, studentResult, classResult] = await Promise.all([
      data.campaign_id 
        ? this.client.from('honor_campaigns').select('id, title, honor_type, status, form_config').eq('id', data.campaign_id).single()
        : { data: null, error: null },
      data.student_id
        ? this.client.from('students').select('id, name, student_no').or(`id.eq.${data.student_id},student_no.eq.${data.student_id}`).single()
        : { data: null, error: null },
      data.class_id
        ? this.client.from('classes').select('id, name, grade').or(`id.eq.${data.class_id},name.eq.${data.class_id}`).single()
        : { data: null, error: null },
    ]);

    // 3. 添加关联信息
    if (campaignResult.data) {
      application.campaign = {
        id: campaignResult.data.id,
        title: campaignResult.data.title,
        honorType: campaignResult.data.honor_type,
        status: campaignResult.data.status,
        formConfig: campaignResult.data.form_config,
      } as any;
    }
    if (studentResult.data) {
      application.studentName = studentResult.data.name;
      application.studentNo = studentResult.data.student_no;
    }
    if (classResult.data) {
      application.className = classResult.data.name;
      application.grade = classResult.data.grade;
    }

    return application;
  }

  /**
   * 查询申报记录列表
   * 注意：由于 Supabase schema cache 问题，不使用 JOIN，改为分步查询
   */
  async findByParams(params: ApplicationQueryParams): Promise<{ data: HonorApplication[]; total: number }> {
    // 1. 查询申报记录
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

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
    // 多状态查询
    if (params.statuses && params.statuses.length > 0) {
      query = query.in('status', params.statuses);
    }
    // 排除指定状态
    if (params.excludeStatus) {
      query = query.neq('status', params.excludeStatus);
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

    if (!data || data.length === 0) {
      return { data: [], total: count || 0 };
    }

    // 2. 收集关联 ID
    const campaignIds = [...new Set(data.map(row => row.campaign_id).filter(Boolean))];
    const studentIds = [...new Set(data.map(row => row.student_id).filter(Boolean))];
    const classIds = [...new Set(data.map(row => row.class_id).filter(Boolean))];

    // 3. 批量查询关联数据
    // 注意：student_id 可能是 UUID 格式（students.id）或学号格式（students.student_no）
    const [campaignsResult, studentsResult, classesResult] = await Promise.all([
      campaignIds.length > 0 
        ? this.client.from('honor_campaigns').select('id, title, honor_type, status, form_config').in('id', campaignIds)
        : { data: [], error: null },
      studentIds.length > 0
        ? this.client.from('students').select('id, name, student_no').or(`id.in.(${studentIds.join(',')}),student_no.in.(${studentIds.join(',')})`)
        : { data: [], error: null },
      classIds.length > 0
        ? this.client.from('classes').select('id, name, grade').or(`id.in.(${classIds.join(',')}),name.in.(${classIds.join(',')})`)
        : { data: [], error: null },
    ]);

    // 4. 构建映射表 - 同时支持 id 和 student_no 作为键
    const campaignsMap = new Map((campaignsResult.data || []).map(c => [c.id, c]));
    const studentsMap = new Map<string, { id: string; name: string; student_no: string }>();
    (studentsResult.data || []).forEach(s => {
      studentsMap.set(s.id, s);
      if (s.student_no) {
        studentsMap.set(s.student_no, s);
      }
    });
    const classesMap = new Map<string, { id: string; name: string; grade: number }>();
    (classesResult.data || []).forEach(c => {
      classesMap.set(c.id, c);
      if (c.name) {
        classesMap.set(c.name, c);
      }
    });

    // 5. 组装数据
    const applications = data.map(row => {
      const app = this.toModel(row);
      
      // 添加关联信息
      const campaign = campaignsMap.get(row.campaign_id);
      if (campaign) {
        app.campaign = {
          id: campaign.id,
          title: campaign.title,
          honorType: campaign.honor_type,
          status: campaign.status,
          formConfig: campaign.form_config,
        } as any;
      }
      
      const student = studentsMap.get(row.student_id);
      if (student) {
        app.studentName = student.name;
        app.studentNo = student.student_no;
      }
      
      const cls = classesMap.get(row.class_id);
      if (cls) {
        app.className = cls.name;
        app.grade = cls.grade;
      }
      
      return app;
    });

    return { data: applications, total: count || 0 };
  }

  /**
   * 查询待审批列表（按审批步骤）
   * 注意：由于 Supabase schema cache 问题，不使用 JOIN，改为分步查询
   */
  async findPendingByStep(step: ApprovalStep, classId?: string): Promise<HonorApplication[]> {
    // 1. 查询申报记录
    let query = this.client
      .from(this.tableName)
      .select('*')
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

    if (!data || data.length === 0) {
      return [];
    }

    // 2. 收集关联 ID
    const campaignIds = [...new Set(data.map(row => row.campaign_id).filter(Boolean))];
    const studentIds = [...new Set(data.map(row => row.student_id).filter(Boolean))];
    const classIds = [...new Set(data.map(row => row.class_id).filter(Boolean))];

    // 3. 批量查询关联数据
    // 注意：student_id 可能是 UUID 格式（students.id）或学号格式（students.student_no）
    const [campaignsResult, studentsResult, classesResult] = await Promise.all([
      campaignIds.length > 0 
        ? this.client.from('honor_campaigns').select('id, title, honor_type, status').in('id', campaignIds)
        : { data: [], error: null },
      studentIds.length > 0
        ? this.client.from('students').select('id, name, student_no').or(`id.in.(${studentIds.join(',')}),student_no.in.(${studentIds.join(',')})`)
        : { data: [], error: null },
      classIds.length > 0
        ? this.client.from('classes').select('id, name, grade').or(`id.in.(${classIds.join(',')}),name.in.(${classIds.join(',')})`)
        : { data: [], error: null },
    ]);

    // 4. 构建映射表 - 同时支持 id 和 student_no 作为键
    const campaignsMap = new Map((campaignsResult.data || []).map(c => [c.id, c]));
    const studentsMap = new Map<string, { id: string; name: string; student_no: string }>();
    (studentsResult.data || []).forEach(s => {
      studentsMap.set(s.id, s);
      if (s.student_no) {
        studentsMap.set(s.student_no, s);
      }
    });
    const classesMap = new Map<string, { id: string; name: string; grade: number }>();
    (classesResult.data || []).forEach(c => {
      classesMap.set(c.id, c);
      if (c.name) {
        classesMap.set(c.name, c);
      }
    });

    // 5. 组装数据
    return data.map(row => {
      const app = this.toModel(row);
      
      const campaign = campaignsMap.get(row.campaign_id);
      if (campaign) {
        app.campaign = {
          id: campaign.id,
          title: campaign.title,
          honorType: campaign.honor_type,
          status: campaign.status,
        } as any;
      }
      
      const student = studentsMap.get(row.student_id);
      if (student) {
        app.studentName = student.name;
        app.studentNo = student.student_no;
      }
      
      const cls = classesMap.get(row.class_id);
      if (cls) {
        app.className = cls.name;
        app.grade = cls.grade;
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
      existing_honors: data.existingHonors || [],
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
    if (data.existingHonors !== undefined) {
      row.existing_honors = data.existingHonors;
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
