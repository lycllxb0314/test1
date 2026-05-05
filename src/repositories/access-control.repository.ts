/**
 * 门禁管理统一 Repository
 * 
 * 整合人员管理、申请审批、通行记录等功能
 * 合并原 visitor.repository 和 access.repository
 */

import { BaseRepository, PaginatedResult } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

/** 门禁人员类型 */
export type PersonType = 'teacher' | 'student' | 'parent' | 'visitor';

/** 申请状态 */
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

/** 通行方向 */
export type Direction = 'in' | 'out';

/** 验证方式 */
export type VerifyMethod = 'face' | 'card' | 'manual';

/** 门禁人员记录 */
export type AccessPerson = {
  id: string;
  name: string;
  personType: PersonType;
  phone: string | null;
  idCard: string | null;
  photoUrl: string | null;
  relatedId: string | null;
  department: string | null;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 门禁申请记录 */
export type AccessApplication = {
  id: string;
  applicantName: string;
  applicantPhone: string | null;
  applicantType: 'parent' | 'visitor';
  purpose: string;
  targetPerson: string | null;
  targetDepartment: string | null;
  relation: string | null;
  studentName: string | null;
  studentId: string | null;
  expectedDate: string;
  expectedTimeStart: string | null;
  expectedTimeEnd: string | null;
  idCard: string | null;
  photoUrl: string | null;
  status: ApplicationStatus;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 通行记录 */
export type AccessRecordItem = {
  id: string;
  personId: string | null;
  personName: string;
  personType: PersonType;
  direction: Direction;
  deviceId: string | null;
  deviceName: string | null;
  occurredAt: string;
  verifyMethod: VerifyMethod;
  photoUrl: string | null;
  temperature: number | null;
  isAbnormal: boolean;
  remark: string | null;
  createdAt: string;
};

/** 门禁统计 */
export type AccessStatistics = {
  totalPersons: number;
  todayRecords: number;
  todayIn: number;
  todayOut: number;
  pendingApplications: number;
  activeVisitors: number;
  personTypeDistribution: { type: PersonType; count: number }[];
};

/** 人员查询参数 */
export type PersonQueryParams = {
  personType?: PersonType;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

/** 申请查询参数 */
export type ApplicationQueryParams = {
  status?: ApplicationStatus;
  applicantType?: 'parent' | 'visitor';
  search?: string;
  page?: number;
  pageSize?: number;
};

/** 通行记录查询参数 */
export type RecordQueryParams = {
  personType?: PersonType;
  direction?: Direction;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

// ==================== 数据库行类型 (下划线) ====================

type PersonRow = {
  id: string;
  name: string;
  person_type: PersonType;
  phone: string | null;
  id_card: string | null;
  photo_url: string | null;
  related_id: string | null;
  department: string | null;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  applicant_name: string;
  applicant_phone: string | null;
  applicant_type: 'parent' | 'visitor';
  purpose: string;
  target_person: string | null;
  target_department: string | null;
  relation: string | null;
  student_name: string | null;
  student_id: string | null;
  expected_date: string;
  expected_time_start: string | null;
  expected_time_end: string | null;
  id_card: string | null;
  photo_url: string | null;
  status: ApplicationStatus;
  approver_id: string | null;
  approver_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
};

type RecordRow = {
  id: string;
  person_id: string | null;
  person_name: string;
  person_type: PersonType;
  direction: Direction;
  device_id: string | null;
  device_name: string | null;
  occurred_at: string;
  verify_method: VerifyMethod;
  photo_url: string | null;
  temperature: number | null;
  is_abnormal: boolean;
  remark: string | null;
  created_at: string;
};

// ==================== 字段映射 ====================

const mapPersonToBusiness = (row: PersonRow): AccessPerson => ({
  id: row.id,
  name: row.name,
  personType: row.person_type,
  phone: row.phone,
  idCard: row.id_card,
  photoUrl: row.photo_url,
  relatedId: row.related_id,
  department: row.department,
  status: row.status,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPersonToDb = (data: Partial<AccessPerson>): Record<string, unknown> => {
  const mapping: Record<string, unknown> = {};
  if (data.name !== undefined) mapping.name = data.name;
  if (data.personType !== undefined) mapping.person_type = data.personType;
  if (data.phone !== undefined) mapping.phone = data.phone;
  if (data.idCard !== undefined) mapping.id_card = data.idCard;
  if (data.photoUrl !== undefined) mapping.photo_url = data.photoUrl;
  if (data.relatedId !== undefined) mapping.related_id = data.relatedId;
  if (data.department !== undefined) mapping.department = data.department;
  if (data.status !== undefined) mapping.status = data.status;
  if (data.validFrom !== undefined) mapping.valid_from = data.validFrom;
  if (data.validUntil !== undefined) mapping.valid_until = data.validUntil;
  return mapping;
};

const mapApplicationToBusiness = (row: ApplicationRow): AccessApplication => ({
  id: row.id,
  applicantName: row.applicant_name,
  applicantPhone: row.applicant_phone,
  applicantType: row.applicant_type,
  purpose: row.purpose,
  targetPerson: row.target_person,
  targetDepartment: row.target_department,
  relation: row.relation,
  studentName: row.student_name,
  studentId: row.student_id,
  expectedDate: row.expected_date,
  expectedTimeStart: row.expected_time_start,
  expectedTimeEnd: row.expected_time_end,
  idCard: row.id_card,
  photoUrl: row.photo_url,
  status: row.status,
  approverId: row.approver_id,
  approverName: row.approver_name,
  approvedAt: row.approved_at,
  rejectionReason: row.rejection_reason,
  remark: row.remark,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapApplicationToDb = (data: Partial<AccessApplication>): Record<string, unknown> => {
  const mapping: Record<string, unknown> = {};
  if (data.applicantName !== undefined) mapping.applicant_name = data.applicantName;
  if (data.applicantPhone !== undefined) mapping.applicant_phone = data.applicantPhone;
  if (data.applicantType !== undefined) mapping.applicant_type = data.applicantType;
  if (data.purpose !== undefined) mapping.purpose = data.purpose;
  if (data.targetPerson !== undefined) mapping.target_person = data.targetPerson;
  if (data.targetDepartment !== undefined) mapping.target_department = data.targetDepartment;
  if (data.relation !== undefined) mapping.relation = data.relation;
  if (data.studentName !== undefined) mapping.student_name = data.studentName;
  if (data.studentId !== undefined) mapping.student_id = data.studentId;
  if (data.expectedDate !== undefined) mapping.expected_date = data.expectedDate;
  if (data.expectedTimeStart !== undefined) mapping.expected_time_start = data.expectedTimeStart;
  if (data.expectedTimeEnd !== undefined) mapping.expected_time_end = data.expectedTimeEnd;
  if (data.idCard !== undefined) mapping.id_card = data.idCard;
  if (data.photoUrl !== undefined) mapping.photo_url = data.photoUrl;
  if (data.status !== undefined) mapping.status = data.status;
  if (data.approverId !== undefined) mapping.approver_id = data.approverId;
  if (data.approverName !== undefined) mapping.approver_name = data.approverName;
  if (data.approvedAt !== undefined) mapping.approved_at = data.approvedAt;
  if (data.rejectionReason !== undefined) mapping.rejection_reason = data.rejectionReason;
  if (data.remark !== undefined) mapping.remark = data.remark;
  return mapping;
};

const mapRecordToBusiness = (row: RecordRow): AccessRecordItem => ({
  id: row.id,
  personId: row.person_id,
  personName: row.person_name,
  personType: row.person_type,
  direction: row.direction,
  deviceId: row.device_id,
  deviceName: row.device_name,
  occurredAt: row.occurred_at,
  verifyMethod: row.verify_method,
  photoUrl: row.photo_url,
  temperature: row.temperature,
  isAbnormal: row.is_abnormal,
  remark: row.remark,
  createdAt: row.created_at,
});

const mapRecordToDb = (data: Partial<AccessRecordItem>): Record<string, unknown> => {
  const mapping: Record<string, unknown> = {};
  if (data.personId !== undefined) mapping.person_id = data.personId;
  if (data.personName !== undefined) mapping.person_name = data.personName;
  if (data.personType !== undefined) mapping.person_type = data.personType;
  if (data.direction !== undefined) mapping.direction = data.direction;
  if (data.deviceId !== undefined) mapping.device_id = data.deviceId;
  if (data.deviceName !== undefined) mapping.device_name = data.deviceName;
  if (data.occurredAt !== undefined) mapping.occurred_at = data.occurredAt;
  if (data.verifyMethod !== undefined) mapping.verify_method = data.verifyMethod;
  if (data.photoUrl !== undefined) mapping.photo_url = data.photoUrl;
  if (data.temperature !== undefined) mapping.temperature = data.temperature;
  if (data.isAbnormal !== undefined) mapping.is_abnormal = data.isAbnormal;
  if (data.remark !== undefined) mapping.remark = data.remark;
  return mapping;
};

// ==================== 人员 Repository ====================

export class AccessPersonRepository extends BaseRepository<PersonRow> {
  constructor() {
    super('access_persons');
  }

  async findPersons(params: PersonQueryParams): Promise<PaginatedResult<AccessPerson>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('access_persons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.personType) query = query.eq('person_type', params.personType);
    if (params.status) query = query.eq('status', params.status);
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,department.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      console.error('[AccessPersonRepository] findPersons error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []).map(mapPersonToBusiness),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async createPerson(data: Partial<AccessPerson>): Promise<AccessPerson | null> {
    const dbData = mapPersonToDb(data);
    const id = data.id || `ap-${Date.now()}`;
    const { data: row, error } = await this.client
      .from('access_persons')
      .insert({ id, ...dbData })
      .select()
      .single();

    if (error) {
      console.error('[AccessPersonRepository] createPerson error:', error.message);
      return null;
    }
    return row ? mapPersonToBusiness(row as PersonRow) : null;
  }

  async updatePerson(id: string, data: Partial<AccessPerson>): Promise<AccessPerson | null> {
    const dbData = mapPersonToDb(data);
    const { data: row, error } = await this.client
      .from('access_persons')
      .update({ ...dbData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[AccessPersonRepository] updatePerson error:', error.message);
      return null;
    }
    return row ? mapPersonToBusiness(row as PersonRow) : null;
  }

  async updateFaceVector(id: string, faceUrl: string): Promise<boolean> {
    // 存储照片URL，向量通过API端点单独计算
    const { error } = await this.client
      .from('access_persons')
      .update({ photo_url: faceUrl, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[AccessPersonRepository] updateFaceVector error:', error.message);
      return false;
    }
    return true;
  }

  async countByType(): Promise<{ type: PersonType; count: number }[]> {
    const { data, error } = await this.client
      .from('access_persons')
      .select('person_type');

    if (error || !data) return [];

    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.person_type] = (counts[row.person_type] || 0) + 1;
    }

    return Object.entries(counts).map(([type, count]) => ({
      type: type as PersonType,
      count,
    }));
  }
}

// ==================== 申请 Repository ====================

export class AccessApplicationRepository extends BaseRepository<ApplicationRow> {
  constructor() {
    super('access_applications');
  }

  async findApplications(params: ApplicationQueryParams): Promise<PaginatedResult<AccessApplication>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('access_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.applicantType) query = query.eq('applicant_type', params.applicantType);
    if (params.search) {
      query = query.or(`applicant_name.ilike.%${params.search}%,target_person.ilike.%${params.search}%,purpose.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      console.error('[AccessApplicationRepository] findApplications error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []).map(mapApplicationToBusiness),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async createApplication(data: Partial<AccessApplication>): Promise<AccessApplication | null> {
    const dbData = mapApplicationToDb(data);
    const { data: row, error } = await this.client
      .from('access_applications')
      .insert({ ...dbData, status: 'pending' })
      .select()
      .single();

    if (error) {
      console.error('[AccessApplicationRepository] createApplication error:', error.message);
      return null;
    }
    return row ? mapApplicationToBusiness(row as ApplicationRow) : null;
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus, extra: Record<string, unknown> = {}): Promise<AccessApplication | null> {
    const { data: row, error } = await this.client
      .from('access_applications')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[AccessApplicationRepository] updateStatus error:', error.message);
      return null;
    }
    return row ? mapApplicationToBusiness(row as ApplicationRow) : null;
  }

  async countByStatus(status: ApplicationStatus): Promise<number> {
    const { count, error } = await this.client
      .from('access_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) return 0;
    return count || 0;
  }

  async countActiveVisitors(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await this.client
      .from('access_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_type', 'visitor')
      .eq('status', 'approved')
      .eq('expected_date', today);

    if (error) return 0;
    return count || 0;
  }
}

// ==================== 通行记录 Repository ====================

export class AccessRecordRepository extends BaseRepository<RecordRow> {
  constructor() {
    super('access_records');
  }

  async findRecords(params: RecordQueryParams): Promise<PaginatedResult<AccessRecordItem>> {
    const { page = 1, pageSize = 20 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('access_records')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false });

    if (params.personType) query = query.eq('person_type', params.personType);
    if (params.direction) query = query.eq('direction', params.direction);
    if (params.startDate) query = query.gte('occurred_at', params.startDate);
    if (params.endDate) query = query.lte('occurred_at', params.endDate);
    if (params.search) {
      query = query.or(`person_name.ilike.%${params.search}%,device_name.ilike.%${params.search}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      console.error('[AccessRecordRepository] findRecords error:', error.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    return {
      data: (data || []).map(mapRecordToBusiness),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  async createRecord(data: Partial<AccessRecordItem>): Promise<AccessRecordItem | null> {
    const dbData = mapRecordToDb(data);
    const { data: row, error } = await this.client
      .from('access_records')
      .insert({ ...dbData, occurred_at: data.occurredAt || new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.error('[AccessRecordRepository] createRecord error:', error.message);
      return null;
    }
    return row ? mapRecordToBusiness(row as RecordRow) : null;
  }

  async countToday(): Promise<{ total: number; inCount: number; outCount: number }> {
    const today = new Date().toISOString().split('T')[0];
    const [totalResult, inResult, outResult] = await Promise.all([
      this.client.from('access_records').select('*', { count: 'exact', head: true }).gte('occurred_at', `${today}T00:00:00`).lt('occurred_at', `${today}T23:59:59`),
      this.client.from('access_records').select('*', { count: 'exact', head: true }).eq('direction', 'in').gte('occurred_at', `${today}T00:00:00`).lt('occurred_at', `${today}T23:59:59`),
      this.client.from('access_records').select('*', { count: 'exact', head: true }).eq('direction', 'out').gte('occurred_at', `${today}T00:00:00`).lt('occurred_at', `${today}T23:59:59`),
    ]);

    return {
      total: totalResult.count || 0,
      inCount: inResult.count || 0,
      outCount: outResult.count || 0,
    };
  }

  async countTotalPersons(): Promise<number> {
    const { count, error } = await this.client
      .from('access_persons')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) return 0;
    return count || 0;
  }
}

// ==================== 导出单例 ====================

export const accessPersonRepository = new AccessPersonRepository();
export const accessApplicationRepository = new AccessApplicationRepository();
export const accessRecordRepository = new AccessRecordRepository();

/** 统一导出供 DI 容器使用 */
export const accessControlRepository = accessPersonRepository;
export const AccessControlRepository = AccessPersonRepository;
