/**
 * 门禁管理统一服务
 * 
 * 核心逻辑：
 * 1. 人员数据自动从教务表(teachers/students)合并展示，无需手动同步
 * 2. 照片上传/更新时自动生成人脸向量
 * 3. 访客通行身份有时间限制
 */

import { BaseService } from './base.service';
import {
  accessPersonRepository,
  accessApplicationRepository,
  accessRecordRepository,
} from '@/repositories/access-control.repository';
import type { AccessPerson, AccessApplication, AccessRecord, PersonType } from '@/repositories/access-control.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 教务数据行类型
type AcademicPerson = {
  id: string;
  name: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  personType: PersonType;
  relatedId: string;
};

export class AccessControlService extends BaseService {

  // ==================== 人员管理 ====================

  /**
   * 获取人员列表（自动合并教务数据）
   * 教师/学生直接从 teachers/students 表查询
   * 家长/访客从 access_persons 表查询
   */
  async getPersonsWithAcademic(params: {
    personType?: PersonType;
    status?: string;
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    success: boolean;
    data?: { items: AccessPerson[]; total: number };
    error?: string;
  }> {
    try {
      const { personType, search, page, pageSize } = params;
      const allItems: AccessPerson[] = [];

      // 如果未指定类型或指定了 teacher/student，从教务表获取
      if (!personType || personType === 'teacher') {
        const teachers = await this.fetchAcademicTeachers(search);
        allItems.push(...teachers);
      }
      if (!personType || personType === 'student') {
        const students = await this.fetchAcademicStudents(search);
        allItems.push(...students);
      }

      // 如果未指定类型或指定了 parent/visitor，从门禁表获取
      if (!personType || personType === 'parent' || personType === 'visitor') {
        const types: PersonType[] = personType ? [personType] : ['parent', 'visitor'];
        const accessPersons = await accessPersonRepository.getList({
          personTypes: types,
          search,
        });
        allItems.push(...accessPersons);
      }

      // 查询人脸向量状态
      const personIds = allItems.map(p => p.id);
      const vectorStatusMap = await accessPersonRepository.getVectorStatusBatch(personIds);

      // 合并向量状态
      allItems.forEach(p => {
        p.hasFaceVector = vectorStatusMap[p.id] || false;
      });

      // 分页
      const total = allItems.length;
      const start = (page - 1) * pageSize;
      const items = allItems.slice(start, start + pageSize);

      return { success: true, data: { items, total } };
    } catch (err) {
      console.error('[AccessControlService] getPersonsWithAcademic error:', err);
      return { success: false, error: '获取人员列表失败' };
    }
  }

  /**
   * 从教务系统获取教师列表
   */
  private async fetchAcademicTeachers(search?: string): Promise<AccessPerson[]> {
    try {
      const client = getSupabaseClient();

      let query = client
        .from('teachers')
        .select('id, name, department, phone, employee_id')
        .in('status', ['active', '在职']);

      if (search) {
        query = query.or(`name.ilike.%${search}%,department.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((t: Record<string, unknown>) => ({
        id: `ap-t-${t.employee_id || t.id}`,
        name: (t.name as string) || '',
        personType: 'teacher' as PersonType,
        phone: (t.phone as string) || undefined,
        photoUrl: undefined,
        relatedId: (t.employee_id as string) || (t.id as string),
        department: (t.department as string) || undefined,
        status: 'active' as const,
        hasFaceVector: false,
        validFrom: undefined,
        validUntil: undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 从教务系统获取学生列表
   */
  private async fetchAcademicStudents(search?: string): Promise<AccessPerson[]> {
    try {
      const client = getSupabaseClient();

      let query = client
        .from('students')
        .select('id, name, class_name, student_no')
        .in('status', ['active', '在校']);

      if (search) {
        query = query.or(`name.ilike.%${search}%,class_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((s: Record<string, unknown>) => ({
        id: `ap-s-${s.id}`,
        name: (s.name as string) || '',
        personType: 'student' as PersonType,
        phone: undefined,
        photoUrl: undefined,
        relatedId: s.id as string,
        department: (s.class_name as string) || undefined,
        status: 'active' as const,
        hasFaceVector: false,
        validFrom: undefined,
        validUntil: undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 更新人员照片（自动触发人脸向量生成）
   */
  async updatePersonPhoto(
    personId: string,
    photoUrl: string,
    personInfo?: { name?: string; personType?: PersonType; department?: string; relatedId?: string },
  ): Promise<{ success: boolean; data?: AccessPerson; error?: string }> {
    try {
      // 1. 确保 access_persons 中有记录
      const existing = await accessPersonRepository.getById(personId);
      if (!existing && personInfo) {
        await accessPersonRepository.upsert({
          id: personId,
          name: personInfo.name || '',
          personType: personInfo.personType || 'teacher',
          department: personInfo.department,
          relatedId: personInfo.relatedId,
          status: 'active',
        });
      }

      // 2. 更新照片 URL
      const updated = await accessPersonRepository.updatePhoto(personId, photoUrl);
      if (!updated) {
        return { success: false, error: '人员不存在' };
      }

      // 3. 异步生成人脸向量（不阻塞响应）
      this.generateFaceVectorAsync(personId, photoUrl).catch(err => {
        console.error('[AccessControlService] 向量生成失败:', err);
      });

      return { success: true, data: updated };
    } catch (err) {
      console.error('[AccessControlService] updatePersonPhoto error:', err);
      return { success: false, error: '更新照片失败' };
    }
  }

  /**
   * 异步生成人脸向量
   */
  private async generateFaceVectorAsync(personId: string, photoUrl: string): Promise<void> {
    try {
      const { EmbeddingClient } = await import('coze-coding-dev-sdk');
      const { Config } = await import('coze-coding-dev-sdk');
      const client = new EmbeddingClient(
        new Config({ apiKey: process.env.COZE_API_TOKEN || '' }),
      );

      const vector = await client.embedImage(photoUrl);

      if (vector && vector.length > 0) {
        await accessPersonRepository.updateFaceVector(personId, vector);
        console.log(`[AccessControlService] 人员 ${personId} 人脸向量生成成功, 维度: ${vector.length}`);
      }
    } catch (err) {
      console.error('[AccessControlService] generateFaceVectorAsync error:', err);
    }
  }

  /**
   * 创建人员（家长/访客）
   */
  async createPerson(data: Partial<AccessPerson>): Promise<{
    success: boolean;
    data?: AccessPerson;
    error?: string;
  }> {
    try {
      const person = await accessPersonRepository.create(data);
      // 如果有照片，自动触发向量生成
      if (person.photoUrl) {
        this.generateFaceVectorAsync(person.id, person.photoUrl).catch(() => {});
      }
      return { success: true, data: person };
    } catch (err) {
      console.error('[AccessControlService] createPerson error:', err);
      return { success: false, error: '创建人员失败' };
    }
  }

  // ==================== 申请管理 ====================

  async getApplications(params: {
    status?: string;
    applicantType?: string;
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    success: boolean;
    data?: { items: AccessApplication[]; total: number };
    error?: string;
  }> {
    try {
      const result = await accessApplicationRepository.getList(params);
      return { success: true, data: result };
    } catch (err) {
      console.error('[AccessControlService] getApplications error:', err);
      return { success: false, error: '获取申请列表失败' };
    }
  }

  async createApplication(data: Partial<AccessApplication>): Promise<{
    success: boolean;
    data?: AccessApplication;
    error?: string;
  }> {
    try {
      const app = await accessApplicationRepository.create(data);
      return { success: true, data: app };
    } catch (err) {
      console.error('[AccessControlService] createApplication error:', err);
      return { success: false, error: '提交申请失败' };
    }
  }

  async approveApplication(id: string, approverId: string, approverName: string): Promise<{
    success: boolean;
    data?: AccessApplication;
    error?: string;
  }> {
    try {
      const app = await accessApplicationRepository.approve(id, approverId, approverName);
      if (!app) return { success: false, error: '申请不存在' };

      // 审批通过后自动创建门禁人员记录
      await this.createPersonFromApplication(app);

      return { success: true, data: app };
    } catch (err) {
      console.error('[AccessControlService] approveApplication error:', err);
      return { success: false, error: '审批失败' };
    }
  }

  async rejectApplication(id: string, reason: string): Promise<{
    success: boolean;
    data?: AccessApplication;
    error?: string;
  }> {
    try {
      const app = await accessApplicationRepository.reject(id, reason);
      if (!app) return { success: false, error: '申请不存在' };
      return { success: true, data: app };
    } catch (err) {
      console.error('[AccessControlService] rejectApplication error:', err);
      return { success: false, error: '驳回失败' };
    }
  }

  private async createPersonFromApplication(app: AccessApplication): Promise<void> {
    try {
      const validFrom = app.expectedDate;
      const validUntil = app.expectedDate;

      const personId = `ap-${app.applicantType.charAt(0)}-${app.id}`;

      await accessPersonRepository.upsert({
        id: personId,
        name: app.applicantName,
        personType: app.applicantType as PersonType,
        phone: app.applicantPhone,
        idCard: app.idCard,
        photoUrl: app.photoUrl,
        department: app.targetDepartment,
        relatedId: app.id,
        status: 'active',
        validFrom,
        validUntil,
      });

      // 照片存在时自动触发生成人脸向量
      if (app.photoUrl) {
        this.generateFaceVectorAsync(personId, app.photoUrl).catch(() => {});
      }
    } catch (err) {
      console.error('[AccessControlService] createPersonFromApplication error:', err);
    }
  }

  // ==================== 通行记录 ====================

  async getRecords(params: {
    personType?: string;
    direction?: string;
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{
    success: boolean;
    data?: { items: AccessRecord[]; total: number };
    error?: string;
  }> {
    try {
      const result = await accessRecordRepository.getList(params);
      return { success: true, data: result };
    } catch (err) {
      console.error('[AccessControlService] getRecords error:', err);
      return { success: false, error: '获取通行记录失败' };
    }
  }

  // ==================== 统计 ====================

  async getStatistics(): Promise<{
    success: boolean;
    data?: {
      totalPersons: number;
      todayRecords: number;
      todayIn: number;
      todayOut: number;
      pendingApplications: number;
      activeVisitors: number;
      personTypeDistribution: { type: string; count: number }[];
    };
    error?: string;
  }> {
    try {
      // 统计教师和学生数量（从教务表）
      const client = getSupabaseClient();
      const [teacherRes, studentRes] = await Promise.all([
        client.from('teachers').select('*', { count: 'exact', head: true }).in('status', ['active', '在职']),
        client.from('students').select('*', { count: 'exact', head: true }).in('status', ['active', '在校']),
      ]);
      const academicTotal = (teacherRes.count || 0) + (studentRes.count || 0);

      const stats = await accessRecordRepository.getStatistics();
      const pendingApps = await accessApplicationRepository.getPendingCount();
      const activeVisitors = await accessPersonRepository.getActiveVisitorCount();
      const accessPersonDistribution = await accessPersonRepository.getPersonTypeDistribution();

      // 合并人员分布（教务 + 门禁表）
      const distribution = [...accessPersonDistribution];
      const existingTypes = new Set(distribution.map(d => d.type));
      if (!existingTypes.has('teacher')) distribution.push({ type: 'teacher', count: teacherRes.count || 0 });
      else {
        const t = distribution.find(d => d.type === 'teacher');
        if (t) t.count += teacherRes.count || 0;
      }
      if (!existingTypes.has('student')) distribution.push({ type: 'student', count: studentRes.count || 0 });
      else {
        const s = distribution.find(d => d.type === 'student');
        if (s) s.count += studentRes.count || 0;
      }

      return {
        success: true,
        data: {
          totalPersons: academicTotal + stats.totalPersons,
          todayRecords: stats.todayRecords || 0,
          todayIn: stats.todayIn || 0,
          todayOut: stats.todayOut || 0,
          pendingApplications: pendingApps,
          activeVisitors,
          personTypeDistribution: distribution,
        },
      };
    } catch (err) {
      console.error('[AccessControlService] getStatistics error:', err);
      return { success: false, error: '获取统计数据失败' };
    }
  }
}

export const accessControlService = new AccessControlService();
