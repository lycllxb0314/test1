/**
 * 学生荣誉评选 Service
 *
 * @module services/honor-campaign.service
 */

import { BaseService, ServiceResult } from './base.service';
import { honorCampaignRepository, HonorCampaignRepository } from '@/repositories/honor-campaign.repository';
import { honorApplicationRepository, HonorApplicationRepository } from '@/repositories/honor-application.repository';
import { studentRepository } from '@/repositories/student.repository';
import { messageService } from './message.service';
import type {
  HonorCampaign,
  HonorApplication,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApproveApplicationRequest,
  ApplicationQueryParams,
  CampaignQueryParams,
  CampaignStatistics,
  ApprovalStep,
  ApprovalComment,
} from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';

/**
 * 评选活动服务
 */
export class HonorCampaignService extends BaseService {
  private campaignRepo: HonorCampaignRepository;
  private applicationRepo: HonorApplicationRepository;

  constructor() {
    super();
    this.campaignRepo = honorCampaignRepository;
    this.applicationRepo = honorApplicationRepository;
  }

  // ==================== 评选活动管理 ====================

  /**
   * 创建评选活动
   */
  async createCampaign(data: CreateCampaignRequest, userId: string): Promise<ServiceResult<HonorCampaign>> {
    try {
      // 验证日期
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        return this.fail('开始日期必须早于结束日期', 'VALIDATION_ERROR');
      }

      const campaign = await this.campaignRepo.create(data, userId);
      if (!campaign) {
        return this.fail('创建评选活动失败', 'DATABASE_ERROR');
      }

      return this.ok(campaign);
    } catch (error) {
      console.error('[HonorCampaignService] createCampaign error:', error);
      return this.fail('创建评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 更新评选活动
   */
  async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<ServiceResult<HonorCampaign>> {
    try {
      const campaign = await this.campaignRepo.findById(id);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      // 已发布的活动只能修改部分内容
      if (campaign.status === 'published' && data.status) {
        return this.fail('已发布的活动不能修改状态', 'VALIDATION_ERROR');
      }

      // 已结束的活动不能修改
      if (campaign.status === 'closed') {
        return this.fail('已结束的活动不能修改', 'VALIDATION_ERROR');
      }

      const updated = await this.campaignRepo.update(id, data);
      if (!updated) {
        return this.fail('更新评选活动失败', 'DATABASE_ERROR');
      }

      return this.ok(updated);
    } catch (error) {
      console.error('[HonorCampaignService] updateCampaign error:', error);
      return this.fail('更新评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 发布评选活动
   */
  async publishCampaign(id: string): Promise<ServiceResult<HonorCampaign>> {
    try {
      const campaign = await this.campaignRepo.findById(id);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      if (campaign.status !== 'draft') {
        return this.fail('只有草稿状态的活动可以发布', 'VALIDATION_ERROR');
      }

      const success = await this.campaignRepo.publish(id);
      if (!success) {
        return this.fail('发布评选活动失败', 'DATABASE_ERROR');
      }

      const updated = await this.campaignRepo.findById(id);
      
      // 发送消息通知给所有班主任和家长
      await this.sendCampaignNotification(updated!);

      return this.ok(updated!);
    } catch (error) {
      console.error('[HonorCampaignService] publishCampaign error:', error);
      return this.fail('发布评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 结束评选活动
   */
  async closeCampaign(id: string): Promise<ServiceResult<HonorCampaign>> {
    try {
      const campaign = await this.campaignRepo.findById(id);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      if (campaign.status !== 'published') {
        return this.fail('只有已发布的活动可以结束', 'VALIDATION_ERROR');
      }

      const success = await this.campaignRepo.close(id);
      if (!success) {
        return this.fail('结束评选活动失败', 'DATABASE_ERROR');
      }

      const updated = await this.campaignRepo.findById(id);
      return this.ok(updated!);
    } catch (error) {
      console.error('[HonorCampaignService] closeCampaign error:', error);
      return this.fail('结束评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 删除评选活动
   */
  async deleteCampaign(id: string): Promise<ServiceResult<boolean>> {
    try {
      const campaign = await this.campaignRepo.findById(id);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      if (campaign.status !== 'draft') {
        return this.fail('只有草稿状态的活动可以删除', 'VALIDATION_ERROR');
      }

      const success = await this.campaignRepo.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[HonorCampaignService] deleteCampaign error:', error);
      return this.fail('删除评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取评选活动详情
   */
  async getCampaign(id: string): Promise<ServiceResult<HonorCampaign>> {
    try {
      const campaign = await this.campaignRepo.findById(id);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      // 获取统计信息
      const stats = await this.campaignRepo.getStatistics(id);
      campaign.applicantCount = stats.totalApplications;
      campaign.approvedCount = stats.passedApplications;
      campaign.classCount = stats.classCount;

      return this.ok(campaign);
    } catch (error) {
      console.error('[HonorCampaignService] getCampaign error:', error);
      return this.fail('获取评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取评选活动列表
   */
  async getCampaigns(params: CampaignQueryParams): Promise<ServiceResult<{ data: HonorCampaign[]; total: number }>> {
    try {
      const result = await this.campaignRepo.findByParams(params);
      return this.ok(result);
    } catch (error) {
      console.error('[HonorCampaignService] getCampaigns error:', error);
      return this.fail('获取评选活动列表失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取已发布的评选活动（供家长端展示）
   */
  async getPublishedCampaigns(): Promise<ServiceResult<HonorCampaign[]>> {
    try {
      const campaigns = await this.campaignRepo.findPublished();
      return this.ok(campaigns);
    } catch (error) {
      console.error('[HonorCampaignService] getPublishedCampaigns error:', error);
      return this.fail('获取评选活动失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取评选活动统计
   */
  async getCampaignStatistics(campaignId: string): Promise<ServiceResult<CampaignStatistics>> {
    try {
      const stats = await this.campaignRepo.getStatistics(campaignId);
      return this.ok(stats);
    } catch (error) {
      console.error('[HonorCampaignService] getCampaignStatistics error:', error);
      return this.fail('获取统计信息失败', 'INTERNAL_ERROR');
    }
  }

  // ==================== 申报管理 ====================

  /**
   * 创建申报
   */
  async createApplication(
    data: CreateApplicationRequest,
    applicantId: string,
    applicantName: string
  ): Promise<ServiceResult<HonorApplication>> {
    try {
      // 检查评选活动是否存在且有效
      const campaign = await this.campaignRepo.findById(data.campaignId);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      if (campaign.status !== 'published') {
        return this.fail('评选活动未发布或已结束', 'VALIDATION_ERROR');
      }

      // 检查是否在申报期内
      const now = new Date();
      if (new Date(campaign.startDate) > now || new Date(campaign.endDate) < now) {
        return this.fail('不在申报期限内', 'VALIDATION_ERROR');
      }

      // 获取学生信息
      const student = await studentRepository.findById(data.studentId);
      if (!student) {
        return this.fail('学生不存在', 'NOT_FOUND');
      }

      // 创建申报
      const application = await this.applicationRepo.create(
        data,
        applicantId,
        applicantName,
        student.classId
      );

      if (!application) {
        return this.fail('创建申报失败', 'DATABASE_ERROR');
      }

      return this.ok(application);
    } catch (error) {
      console.error('[HonorCampaignService] createApplication error:', error);
      return this.fail('创建申报失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 更新申报
   */
  async updateApplication(id: string, data: UpdateApplicationRequest): Promise<ServiceResult<HonorApplication>> {
    try {
      const application = await this.applicationRepo.findById(id);
      if (!application) {
        return this.fail('申报记录不存在', 'NOT_FOUND');
      }

      // 只有待审批状态可以修改
      if (application.status !== 'pending') {
        return this.fail('当前状态不允许修改', 'VALIDATION_ERROR');
      }

      const updated = await this.applicationRepo.update(id, data);
      if (!updated) {
        return this.fail('更新申报失败', 'DATABASE_ERROR');
      }

      return this.ok(updated);
    } catch (error) {
      console.error('[HonorCampaignService] updateApplication error:', error);
      return this.fail('更新申报失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 撤回申报
   */
  async withdrawApplication(id: string, applicantId: string): Promise<ServiceResult<HonorApplication>> {
    try {
      const application = await this.applicationRepo.findById(id);
      if (!application) {
        return this.fail('申报记录不存在', 'NOT_FOUND');
      }

      // 验证所有权
      if (application.applicantId !== applicantId) {
        return this.fail('无权限撤回此申报', 'FORBIDDEN');
      }

      // 只有待审批状态可以撤回
      if (application.status !== 'pending') {
        return this.fail('当前状态不允许撤回', 'VALIDATION_ERROR');
      }

      const updated = await this.applicationRepo.withdraw(id);
      if (!updated) {
        return this.fail('撤回失败', 'DATABASE_ERROR');
      }

      return this.ok(updated);
    } catch (error) {
      console.error('[HonorCampaignService] withdrawApplication error:', error);
      return this.fail('撤回失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取申报详情
   */
  async getApplication(id: string): Promise<ServiceResult<HonorApplication>> {
    try {
      const application = await this.applicationRepo.findByIdWithDetails(id);
      if (!application) {
        return this.fail('申报记录不存在', 'NOT_FOUND');
      }

      return this.ok(application);
    } catch (error) {
      console.error('[HonorCampaignService] getApplication error:', error);
      return this.fail('获取申报记录失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取申报列表
   */
  async getApplications(params: ApplicationQueryParams): Promise<ServiceResult<{ data: HonorApplication[]; total: number }>> {
    try {
      const result = await this.applicationRepo.findByParams(params);
      return this.ok(result);
    } catch (error) {
      console.error('[HonorCampaignService] getApplications error:', error);
      return this.fail('获取申报记录失败', 'INTERNAL_ERROR');
    }
  }

  // ==================== 审批管理 ====================

  /**
   * 审批申报
   */
  async approveApplication(
    id: string,
    userId: string,
    userName: string,
    data: ApproveApplicationRequest
  ): Promise<ServiceResult<HonorApplication>> {
    try {
      const application = await this.applicationRepo.findByIdWithDetails(id);
      if (!application) {
        return this.fail('申报记录不存在', 'NOT_FOUND');
      }

      if (application.status !== 'pending') {
        return this.fail('当前状态不允许审批', 'VALIDATION_ERROR');
      }

      // 构建审批意见
      const comment: ApprovalComment = {
        step: application.currentStep!,
        approverId: userId,
        approverName: userName,
        result: data.result,
        comment: data.comment,
        time: new Date().toISOString(),
      };

      // 计算下一步
      let nextStep: ApprovalStep | null = null;
      let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';

      if (data.result === 'approved') {
        // 通过，进入下一步
        const steps = application.campaign?.approvalConfig?.steps || ['head_teacher', 'moral_dept', 'moral_vice_principal'];
        const currentIndex = steps.indexOf(application.currentStep!);
        
        if (currentIndex < steps.length - 1) {
          nextStep = steps[currentIndex + 1];
          newStatus = 'pending';
        } else {
          // 最后一步通过
          nextStep = null;
          newStatus = 'approved';
        }
      } else if (data.result === 'rejected') {
        // 拒绝，流程结束
        nextStep = null;
        newStatus = 'rejected';
      } else {
        // 退回，回到上一步或申请人
        nextStep = 'head_teacher';
        newStatus = 'pending';
      }

      // 更新申报记录
      const updated = await this.applicationRepo.addApprovalComment(
        id,
        comment,
        nextStep,
        newStatus
      );

      if (!updated) {
        return this.fail('审批失败', 'DATABASE_ERROR');
      }

      // 发送消息通知
      if (data.result === 'approved' && nextStep) {
        await this.sendApprovalNotification(updated, nextStep);
      } else if (data.result === 'approved' && newStatus === 'approved') {
        // 最终审批通过，写入学生荣誉表
        await this.writeToStudentHonors(updated);
        // 通知家长
        await this.sendFinalApprovalNotification(updated);
      } else if (data.result === 'rejected') {
        await this.sendRejectionNotification(updated);
      }

      return this.ok(updated);
    } catch (error) {
      console.error('[HonorCampaignService] approveApplication error:', error);
      return this.fail('审批失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取待审批列表（班主任）
   */
  async getPendingForHeadTeacher(classId: string): Promise<ServiceResult<HonorApplication[]>> {
    try {
      const applications = await this.applicationRepo.findPendingByStep('head_teacher', classId);
      return this.ok(applications);
    } catch (error) {
      console.error('[HonorCampaignService] getPendingForHeadTeacher error:', error);
      return this.fail('获取待审批列表失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取待审批列表（德育处）
   */
  async getPendingForMoralDept(): Promise<ServiceResult<HonorApplication[]>> {
    try {
      const applications = await this.applicationRepo.findPendingByStep('moral_dept');
      return this.ok(applications);
    } catch (error) {
      console.error('[HonorCampaignService] getPendingForMoralDept error:', error);
      return this.fail('获取待审批列表失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取待审批列表（德育副校长）
   */
  async getPendingForMoralVicePrincipal(): Promise<ServiceResult<HonorApplication[]>> {
    try {
      const applications = await this.applicationRepo.findPendingByStep('moral_vice_principal');
      return this.ok(applications);
    } catch (error) {
      console.error('[HonorCampaignService] getPendingForMoralVicePrincipal error:', error);
      return this.fail('获取待审批列表失败', 'INTERNAL_ERROR');
    }
  }

  // ==================== 申报表生成 ====================

  /**
   * 生成申报表数据（用于打印）
   */
  async generateApplicationForm(id: string): Promise<ServiceResult<{
    application: HonorApplication;
    campaign: HonorCampaign;
    formData: Record<string, string>;
  }>> {
    try {
      const application = await this.applicationRepo.findByIdWithDetails(id);
      if (!application) {
        return this.fail('申报记录不存在', 'NOT_FOUND');
      }

      const campaign = await this.campaignRepo.findById(application.campaignId);
      if (!campaign) {
        return this.fail('评选活动不存在', 'NOT_FOUND');
      }

      return this.ok({
        application,
        campaign,
        formData: application.formData,
      });
    } catch (error) {
      console.error('[HonorCampaignService] generateApplicationForm error:', error);
      return this.fail('生成申报表失败', 'INTERNAL_ERROR');
    }
  }

  // ==================== 消息通知 ====================

  /**
   * 发送评选活动发布通知
   * 通知所有班主任和家长
   */
  private async sendCampaignNotification(campaign: HonorCampaign): Promise<void> {
    try {
      console.log('[HonorCampaignService] 开始发送评选活动通知...');

      // 发送给班主任
      const teacherResult = await messageService.sendMessage({
        title: `【荣誉评选】${campaign.title}`,
        content: `新的荣誉评选活动已发布，请通知班级符合条件的学生家长及时申报。\n\n荣誉类型：${campaign.honorType}\n申报截止：${campaign.endDate}\n\n${campaign.requirements || ''}`,
        event: 'honor_campaign',
        priority: 'high',
        recipientRoles: ['head_teacher'],
        relatedId: campaign.id,
        relatedType: 'honor_campaign',
        actionUrl: `/teacher/honor-approval`,
        actionLabel: '查看详情',
        metadata: {
          campaignId: campaign.id,
          honorType: campaign.honorType,
          endDate: campaign.endDate,
        },
      });

      if (!teacherResult.success) {
        console.error('[HonorCampaignService] 发送班主任通知失败:', teacherResult.error);
      } else {
        console.log('[HonorCampaignService] 班主任通知已发送:', teacherResult.data?.id);
      }

      // 发送给家长
      const parentResult = await messageService.sendMessage({
        title: `【荣誉申报】${campaign.title}`,
        content: `学校发布了新的荣誉评选活动，欢迎符合条件的学生申报。\n\n荣誉类型：${campaign.honorType}\n申报截止：${campaign.endDate}\n\n申报条件：${campaign.requirements || '详见活动说明'}`,
        event: 'honor_campaign',
        priority: 'high',
        recipientRoles: ['parent'],
        relatedId: campaign.id,
        relatedType: 'honor_campaign',
        actionUrl: `/parent/honor-application`,
        actionLabel: '立即申报',
        metadata: {
          campaignId: campaign.id,
          honorType: campaign.honorType,
          endDate: campaign.endDate,
        },
      });

      if (!parentResult.success) {
        console.error('[HonorCampaignService] 发送家长通知失败:', parentResult.error);
      } else {
        console.log('[HonorCampaignService] 家长通知已发送:', parentResult.data?.id);
      }

      console.log(`[HonorCampaignService] 发布通知已发送`);
    } catch (error) {
      console.error('[HonorCampaignService] sendCampaignNotification error:', error);
    }
  }

  /**
   * 发送审批流转通知
   * 通知下一审批人
   */
  private async sendApprovalNotification(application: HonorApplication, nextStep: ApprovalStep): Promise<void> {
    try {
      let recipientRoles: string[] = [];

      // 根据下一步骤确定通知对象
      if (nextStep === 'moral_dept') {
        recipientRoles = ['moral_vice_principal']; // 德育副校长或德育主任
      } else if (nextStep === 'moral_vice_principal') {
        recipientRoles = ['moral_vice_principal'];
      }

      if (recipientRoles.length === 0) {
        console.log(`[HonorCampaignService] 未找到 ${nextStep} 的接收角色`);
        return;
      }

      await messageService.sendMessage({
        title: `【待审批】${application.studentName} 的荣誉申报`,
        content: `学生 ${application.studentName}（${application.className}）申报的「${application.campaign?.honorType}」已通过班主任审批，等待您审批。`,
        event: 'honor_approval',
        priority: 'high',
        recipientRoles,
        relatedId: application.id,
        relatedType: 'honor_application',
        actionUrl: nextStep === 'moral_dept' ? '/moral/honor-campaigns' : '/vice-principal-moral/honor-approval',
        actionLabel: '立即审批',
        metadata: {
          applicationId: application.id,
          campaignId: application.campaignId,
          studentName: application.studentName,
          className: application.className,
          honorType: application.campaign?.honorType,
          currentStep: nextStep,
        },
      });

      console.log(`[HonorCampaignService] 审批流转通知已发送`);
    } catch (error) {
      console.error('[HonorCampaignService] sendApprovalNotification error:', error);
    }
  }

  /**
   * 写入学生荣誉表（荣誉联动）
   */
  private async writeToStudentHonors(application: HonorApplication): Promise<void> {
    try {
      const { getSupabaseClient } = await import('@/storage/database/supabase-client');
      const supabase = getSupabaseClient();

      // 生成证书编号
      const certificateNo = application.certificateNo || `H${new Date().getFullYear()}${Date.now().toString().slice(-6)}`;

      // 写入 student_honors 表
      const { error } = await supabase.from('student_honors').insert({
        id: `honor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        student_id: application.studentId,
        student_name: application.studentName,
        class_id: application.classId,
        class_name: application.className,
        title: application.campaign?.honorType || '荣誉',
        level: '校级',
        category: '荣誉评选',
        issuer: '龙岩师范附属小学',
        date: new Date().toISOString().split('T')[0],
        certificate_no: certificateNo,
        description: `${application.campaign?.title} - 通过评选获得`,
        grade: application.grade,
      });

      if (error) {
        console.error('[HonorCampaignService] writeToStudentHonors error:', error);
      } else {
        console.log(`[HonorCampaignService] 荣誉已写入学生荣誉表: ${application.studentName}`);
      }
    } catch (error) {
      console.error('[HonorCampaignService] writeToStudentHonors error:', error);
    }
  }

  /**
   * 发送最终审批通过通知
   * 通知家长申报已通过
   */
  private async sendFinalApprovalNotification(application: HonorApplication): Promise<void> {
    try {
      if (!application.applicantId) {
        console.log('[HonorCampaignService] 无申请人ID，无法发送通知');
        return;
      }

      await messageService.sendMessage({
        title: `【恭喜】${application.studentName} 的荣誉申报已通过`,
        content: `恭喜！您为孩子 ${application.studentName} 申报的「${application.campaign?.honorType}」已通过全部审批。\n\n证书编号：${application.certificateNo || '待生成'}\n\n请登录系统查看详情并打印申报表。`,
        event: 'honor_approved',
        priority: 'high',
        recipientIds: [application.applicantId],
        relatedId: application.id,
        relatedType: 'honor_application',
        actionUrl: `/parent/honor-application`,
        actionLabel: '查看详情',
        metadata: {
          applicationId: application.id,
          campaignId: application.campaignId,
          studentName: application.studentName,
          honorType: application.campaign?.honorType,
          certificateNo: application.certificateNo,
        },
      });

      console.log(`[HonorCampaignService] 最终审批通过通知已发送给家长`);
    } catch (error) {
      console.error('[HonorCampaignService] sendFinalApprovalNotification error:', error);
    }
  }

  /**
   * 发送审批拒绝通知
   * 通知家长申报未通过
   */
  private async sendRejectionNotification(application: HonorApplication): Promise<void> {
    try {
      if (!application.applicantId) {
        console.log('[HonorCampaignService] 无申请人ID，无法发送通知');
        return;
      }

      // 获取最后一条审批意见
      const lastComment = application.approvalComments[application.approvalComments.length - 1];

      await messageService.sendMessage({
        title: `【通知】${application.studentName} 的荣誉申报未通过`,
        content: `很遗憾，您为孩子 ${application.studentName} 申报的「${application.campaign?.honorType}」未通过审批。\n\n审批意见：${lastComment?.comment || '无'}\n\n如有疑问，请联系班主任。`,
        event: 'honor_rejected',
        priority: 'normal',
        recipientIds: [application.applicantId],
        relatedId: application.id,
        relatedType: 'honor_application',
        actionUrl: `/parent/honor-application`,
        actionLabel: '查看详情',
        metadata: {
          applicationId: application.id,
          campaignId: application.campaignId,
          studentName: application.studentName,
          honorType: application.campaign?.honorType,
          reason: lastComment?.comment,
        },
      });

      console.log(`[HonorCampaignService] 审批拒绝通知已发送给家长`);
    } catch (error) {
      console.error('[HonorCampaignService] sendRejectionNotification error:', error);
    }
  }
}

// 导出单例
export const honorCampaignService = new HonorCampaignService();
