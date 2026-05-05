/**
 * 门禁管理统一服务
 * 
 * 整合人员管理、申请审批、通行记录、人脸向量等功能
 */

import { BaseService, ServiceResult } from './base.service';
import {
  accessPersonRepository,
  accessApplicationRepository,
  accessRecordRepository,
  AccessPerson,
  AccessApplication,
  AccessRecordItem,
  AccessStatistics,
  PersonQueryParams,
  ApplicationQueryParams,
  RecordQueryParams,
  PersonType,
  ApplicationStatus,
} from '@/repositories/access-control.repository';

// ==================== 人员管理服务 ====================

export class AccessPersonService extends BaseService {
  /** 获取人员列表 */
  async getPersons(params: PersonQueryParams) {
    try {
      const result = await accessPersonRepository.findPersons(params);
      return this.ok(result);
    } catch (error) {
      console.error('[AccessPersonService] getPersons error:', error);
      return this.fail('获取人员列表失败');
    }
  }

  /** 获取人员详情 */
  async getPersonById(id: string): Promise<ServiceResult<AccessPerson>> {
    try {
      const data = await accessPersonRepository.findById(id);
      if (!data) return this.fail('人员不存在');
      // 手动映射
      const row = data as Record<string, unknown>;
      return this.ok({
        id: row.id as string,
        name: row.name as string,
        personType: row.person_type as PersonType,
        phone: (row.phone as string) || null,
        idCard: (row.id_card as string) || null,
        photoUrl: (row.photo_url as string) || null,
        relatedId: (row.related_id as string) || null,
        department: (row.department as string) || null,
        status: (row.status as string) || 'active',
        validFrom: (row.valid_from as string) || null,
        validUntil: (row.valid_until as string) || null,
        createdAt: row.created_at as string,
        updatedAt: (row.updated_at as string) || '',
      });
    } catch (error) {
      console.error('[AccessPersonService] getPersonById error:', error);
      return this.fail('获取人员详情失败');
    }
  }

  /** 创建人员 */
  async createPerson(data: Partial<AccessPerson>): Promise<ServiceResult<AccessPerson>> {
    try {
      const record = await accessPersonRepository.createPerson(data);
      if (!record) return this.fail('创建人员失败');
      return this.ok(record);
    } catch (error) {
      console.error('[AccessPersonService] createPerson error:', error);
      return this.fail('创建人员失败');
    }
  }

  /** 更新人员 */
  async updatePerson(id: string, data: Partial<AccessPerson>): Promise<ServiceResult<AccessPerson>> {
    try {
      const record = await accessPersonRepository.updatePerson(id, data);
      if (!record) return this.fail('更新人员失败');
      return this.ok(record);
    } catch (error) {
      console.error('[AccessPersonService] updatePerson error:', error);
      return this.fail('更新人员失败');
    }
  }

  /** 删除人员 */
  async deletePerson(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await accessPersonRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[AccessPersonService] deletePerson error:', error);
      return this.fail('删除人员失败');
    }
  }

  /** 从教务系统同步教师/学生数据 */
  async syncFromAcademic(personType: PersonType): Promise<ServiceResult<{ synced: number }>> {
    try {
      const client = accessPersonRepository['client'];
      let synced = 0;

      if (personType === 'teacher') {
        const { data: teachers } = await client
          .from('teachers')
          .select('id, name, employee_id, department, primary_subject, photo_url')
          .eq('status', 'active');

        if (teachers) {
          for (const t of teachers) {
            const existing = await client
              .from('access_persons')
              .select('id')
              .eq('related_id', t.employee_id)
              .eq('person_type', 'teacher')
              .maybeSingle();

            if (!existing.data) {
              await accessPersonRepository.createPerson({
                name: t.name,
                personType: 'teacher',
                relatedId: t.employee_id,
                department: t.department || t.primary_subject,
                photoUrl: t.photo_url || null,
                status: 'active',
                validFrom: new Date().toISOString().split('T')[0],
              });
              synced++;
            }
          }
        }
      } else if (personType === 'student') {
        const { data: students } = await client
          .from('students')
          .select('id, name, student_no, class_id')
          .eq('status', 'active');

        if (students) {
          // 获取班级名称映射
          const { data: classes } = await client
            .from('classes')
            .select('id, name');

          const classMap = new Map((classes || []).map((c: { id: string; name: string }) => [c.id, c.name]));

          for (const s of students) {
            const existing = await client
              .from('access_persons')
              .select('id')
              .eq('related_id', s.id)
              .eq('person_type', 'student')
              .maybeSingle();

            if (!existing.data) {
              await accessPersonRepository.createPerson({
                name: s.name,
                personType: 'student',
                relatedId: s.id,
                department: classMap.get(s.class_id) || null,
                status: 'active',
                validFrom: new Date().toISOString().split('T')[0],
              });
              synced++;
            }
          }
        }
      }

      return this.ok({ synced });
    } catch (error) {
      console.error('[AccessPersonService] syncFromAcademic error:', error);
      return this.fail('同步数据失败');
    }
  }

  /** 生成人脸向量 (使用 Embedding API) */
  async generateFaceVector(personId: string, photoUrl: string, headers: Record<string, string>): Promise<ServiceResult<boolean>> {
    try {
      // 动态导入 EmbeddingClient 避免构建时依赖
      const { EmbeddingClient, HeaderUtils } = await import('coze-coding-dev-sdk');
      const customHeaders = HeaderUtils.extractForwardHeaders(headers as Record<string, string>);
      const client = new EmbeddingClient(undefined, customHeaders);

      const vector = await client.embedImage(photoUrl);

      // 将向量存入数据库
      const client2 = accessPersonRepository['client'];
      const { error } = await client2
        .from('access_persons')
        .update({
          photo_url: photoUrl,
          face_vector: `[${vector.join(',')}]`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', personId);

      if (error) {
        console.error('[AccessPersonService] generateFaceVector save error:', error.message);
        return this.fail('保存人脸向量失败');
      }

      return this.ok(true);
    } catch (error) {
      console.error('[AccessPersonService] generateFaceVector error:', error);
      return this.fail('生成人脸向量失败');
    }
  }
}

// ==================== 申请管理服务 ====================

export class AccessApplicationService extends BaseService {
  /** 获取申请列表 */
  async getApplications(params: ApplicationQueryParams) {
    try {
      const result = await accessApplicationRepository.findApplications(params);
      return this.ok(result);
    } catch (error) {
      console.error('[AccessApplicationService] getApplications error:', error);
      return this.fail('获取申请列表失败');
    }
  }

  /** 获取申请详情 */
  async getApplicationById(id: string): Promise<ServiceResult<AccessApplication>> {
    try {
      const data = await accessApplicationRepository.findById(id);
      if (!data) return this.fail('申请不存在');
      const row = data as Record<string, unknown>;
      return this.ok({
        id: row.id as string,
        applicantName: row.applicant_name as string,
        applicantPhone: (row.applicant_phone as string) || null,
        applicantType: row.applicant_type as 'parent' | 'visitor',
        purpose: row.purpose as string,
        targetPerson: (row.target_person as string) || null,
        targetDepartment: (row.target_department as string) || null,
        relation: (row.relation as string) || null,
        studentName: (row.student_name as string) || null,
        studentId: (row.student_id as string) || null,
        expectedDate: row.expected_date as string,
        expectedTimeStart: (row.expected_time_start as string) || null,
        expectedTimeEnd: (row.expected_time_end as string) || null,
        idCard: (row.id_card as string) || null,
        photoUrl: (row.photo_url as string) || null,
        status: row.status as ApplicationStatus,
        approverId: (row.approver_id as string) || null,
        approverName: (row.approver_name as string) || null,
        approvedAt: (row.approved_at as string) || null,
        rejectionReason: (row.rejection_reason as string) || null,
        remark: (row.remark as string) || null,
        createdAt: row.created_at as string,
        updatedAt: (row.updated_at as string) || '',
      });
    } catch (error) {
      console.error('[AccessApplicationService] getApplicationById error:', error);
      return this.fail('获取申请详情失败');
    }
  }

  /** 创建申请 (门户端使用) */
  async createApplication(data: Partial<AccessApplication>): Promise<ServiceResult<AccessApplication>> {
    try {
      if (!data.applicantName || !data.purpose || !data.expectedDate) {
        return this.fail('缺少必填字段');
      }
      const record = await accessApplicationRepository.createApplication(data);
      if (!record) return this.fail('创建申请失败');
      return this.ok(record);
    } catch (error) {
      console.error('[AccessApplicationService] createApplication error:', error);
      return this.fail('创建申请失败');
    }
  }

  /** 审批通过 */
  async approve(id: string, approverId: string, approverName: string): Promise<ServiceResult<AccessApplication>> {
    try {
      const record = await accessApplicationRepository.updateApplicationStatus(id, 'approved', {
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
      });
      if (!record) return this.fail('审批失败');

      // 审批通过后自动创建门禁人员记录
      if (record.applicantType === 'visitor' || record.applicantType === 'parent') {
        const client = accessApplicationRepository['client'];
        const existing = await client
          .from('access_persons')
          .select('id')
          .eq('name', record.applicantName)
          .eq('person_type', record.applicantType)
          .maybeSingle();

        if (!existing.data) {
          await accessPersonRepository.createPerson({
            name: record.applicantName,
            personType: record.applicantType,
            phone: record.applicantPhone,
            idCard: record.idCard,
            photoUrl: record.photoUrl,
            department: record.applicantType === 'parent' ? record.targetDepartment : '外部人员',
            status: 'active',
            validFrom: record.expectedDate,
            validUntil: record.expectedDate,
          });
        }
      }

      return this.ok(record);
    } catch (error) {
      console.error('[AccessApplicationService] approve error:', error);
      return this.fail('审批失败');
    }
  }

  /** 审批驳回 */
  async reject(id: string, approverId: string, approverName: string, reason: string): Promise<ServiceResult<AccessApplication>> {
    try {
      const record = await accessApplicationRepository.updateApplicationStatus(id, 'rejected', {
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      });
      if (!record) return this.fail('驳回失败');
      return this.ok(record);
    } catch (error) {
      console.error('[AccessApplicationService] reject error:', error);
      return this.fail('驳回失败');
    }
  }

  /** 取消申请 */
  async cancel(id: string): Promise<ServiceResult<AccessApplication>> {
    try {
      const record = await accessApplicationRepository.updateApplicationStatus(id, 'cancelled');
      if (!record) return this.fail('取消失败');
      return this.ok(record);
    } catch (error) {
      console.error('[AccessApplicationService] cancel error:', error);
      return this.fail('取消失败');
    }
  }
}

// ==================== 通行记录服务 ====================

export class AccessRecordService extends BaseService {
  /** 获取通行记录 */
  async getRecords(params: RecordQueryParams) {
    try {
      const result = await accessRecordRepository.findRecords(params);
      return this.ok(result);
    } catch (error) {
      console.error('[AccessRecordService] getRecords error:', error);
      return this.fail('获取通行记录失败');
    }
  }

  /** 创建通行记录 */
  async createRecord(data: Partial<AccessRecordItem>): Promise<ServiceResult<AccessRecordItem>> {
    try {
      const record = await accessRecordRepository.createRecord(data);
      if (!record) return this.fail('创建通行记录失败');
      return this.ok(record);
    } catch (error) {
      console.error('[AccessRecordService] createRecord error:', error);
      return this.fail('创建通行记录失败');
    }
  }

  /** 获取统计 */
  async getStatistics(): Promise<ServiceResult<AccessStatistics>> {
    try {
      const [todayCounts, totalPersons, pendingApps, activeVisitors, typeDistribution] = await Promise.all([
        accessRecordRepository.countToday(),
        accessRecordRepository.countTotalPersons(),
        accessApplicationRepository.countByStatus('pending'),
        accessApplicationRepository.countActiveVisitors(),
        accessPersonRepository.countByType(),
      ]);

      return this.ok({
        totalPersons,
        todayRecords: todayCounts.total,
        todayIn: todayCounts.inCount,
        todayOut: todayCounts.outCount,
        pendingApplications: pendingApps,
        activeVisitors,
        personTypeDistribution: typeDistribution,
      });
    } catch (error) {
      console.error('[AccessRecordService] getStatistics error:', error);
      return this.fail('获取统计数据失败');
    }
  }
}

// ==================== 导出单例 ====================

export const accessPersonService = new AccessPersonService();
export const accessApplicationService = new AccessApplicationService();
export const accessRecordService = new AccessRecordService();

/** 统一导出供 DI 容器使用 */
export const accessControlService = accessPersonService;
export const AccessControlService = AccessPersonService;
