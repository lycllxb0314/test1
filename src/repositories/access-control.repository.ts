/**
 * 门禁管理数据仓库
 * 
 * 三张表：access_persons, access_applications, access_records
 * 教师/学生数据直接从教务表(teachers/students)查询，仅家长/访客存入 access_persons
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

export type PersonType = 'teacher' | 'student' | 'parent' | 'visitor';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
export type Direction = 'in' | 'out';

export type AccessPerson = {
  id: string;
  name: string;
  personType: PersonType;
  phone?: string;
  idCard?: string;
  photoUrl?: string;
  hasFaceVector?: boolean;
  relatedId?: string;
  department?: string;
  status: 'active' | 'inactive' | 'expired';
  validFrom?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AccessApplication = {
  id: string;
  applicantName: string;
  applicantPhone?: string;
  applicantType: 'parent' | 'visitor';
  purpose: string;
  targetPerson?: string;
  targetDepartment?: string;
  relation?: string;
  studentName?: string;
  studentId?: string;
  expectedDate: string;
  expectedTimeStart?: string;
  expectedTimeEnd?: string;
  idCard?: string;
  photoUrl?: string;
  status: ApplicationStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AccessRecord = {
  id: string;
  personId?: string;
  personName: string;
  personType: PersonType;
  direction: Direction;
  deviceId?: string;
  deviceName?: string;
  occurredAt: string;
  verifyMethod?: string;
  photoUrl?: string;
  temperature?: number;
  isAbnormal?: boolean;
  remark?: string;
  createdAt?: string;
};

// ==================== 人员仓库 ====================

export const accessPersonRepository = {
  async getList(params: {
    personTypes?: PersonType[];
    search?: string;
  }): Promise<AccessPerson[]> {
    const client = getSupabaseClient();
    let query = client
      .from('access_persons')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.personTypes && params.personTypes.length > 0) {
      query = query.in('person_type', params.personTypes);
    }
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,department.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[AccessPersonRepo] getList error:', error.message);
      return [];
    }
    return (data || []).map(mapPersonRow);
  },

  async getById(id: string): Promise<AccessPerson | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_persons')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapPersonRow(data);
  },

  async create(person: Partial<AccessPerson>): Promise<AccessPerson> {
    const client = getSupabaseClient();
    const row = toPersonRow(person);
    const { data, error } = await client
      .from('access_persons')
      .insert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPersonRow(data);
  },

  async upsert(person: Partial<AccessPerson>): Promise<AccessPerson> {
    const client = getSupabaseClient();
    const row = toPersonRow(person);
    const { data, error } = await client
      .from('access_persons')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapPersonRow(data);
  },

  async updatePhoto(personId: string, photoUrl: string): Promise<AccessPerson | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_persons')
      .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq('id', personId)
      .select('*')
      .single();
    if (error) {
      console.error('[AccessPersonRepo] updatePhoto error:', error.message);
      return null;
    }
    return mapPersonRow(data);
  },

  async updateFaceVector(personId: string, vector: number[]): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('access_persons')
      .update({ face_vector: vector, updated_at: new Date().toISOString() })
      .eq('id', personId);
    if (error) {
      console.error('[AccessPersonRepo] updateFaceVector error:', error.message);
      throw new Error(error.message);
    }
  },

  async getVectorStatusBatch(personIds: string[]): Promise<Record<string, boolean>> {
    if (personIds.length === 0) return {};
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_persons')
      .select('id, face_vector')
      .in('id', personIds);
    if (error || !data) return {};

    const result: Record<string, boolean> = {};
    for (const row of data) {
      result[row.id as string] = !!row.face_vector;
    }
    return result;
  },

  async getActiveVisitorCount(): Promise<number> {
    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await client
      .from('access_persons')
      .select('*', { count: 'exact', head: true })
      .eq('person_type', 'visitor')
      .eq('status', 'active')
      .gte('valid_from', today)
      .lte('valid_until', today);
    if (error) return 0;
    return count || 0;
  },

  async getPersonTypeDistribution(): Promise<{ type: string; count: number }[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_persons')
      .select('person_type');
    if (error || !data) return [];

    const counts: Record<string, number> = {};
    for (const row of data) {
      const t = row.person_type as string;
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  },

  async delete(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    const { error } = await client.from('access_persons').delete().eq('id', id);
    return !error;
  },
};

// ==================== 申请仓库 ====================

export const accessApplicationRepository = {
  async getList(params: {
    status?: string;
    applicantType?: string;
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: AccessApplication[]; total: number }> {
    const client = getSupabaseClient();
    let query = client
      .from('access_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.applicantType) query = query.eq('applicant_type', params.applicantType);
    if (params.search) {
      query = query.or(`applicant_name.ilike.%${params.search}%,target_person.ilike.%${params.search}%,purpose.ilike.%${params.search}%`);
    }

    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('[AccessAppRepo] getList error:', error.message);
      return { items: [], total: 0 };
    }
    return { items: (data || []).map(mapAppRow), total: count || 0 };
  },

  async getById(id: string): Promise<AccessApplication | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_applications')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapAppRow(data);
  },

  async create(app: Partial<AccessApplication>): Promise<AccessApplication> {
    const client = getSupabaseClient();
    const row = toAppRow(app);
    const { data, error } = await client
      .from('access_applications')
      .insert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapAppRow(data);
  },

  async approve(id: string, approverId: string, approverName: string): Promise<AccessApplication | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_applications')
      .update({
        status: 'approved',
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[AccessAppRepo] approve error:', error.message);
      return null;
    }
    return mapAppRow(data);
  },

  async reject(id: string, reason: string): Promise<AccessApplication | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('access_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[AccessAppRepo] reject error:', error.message);
      return null;
    }
    return mapAppRow(data);
  },

  async getPendingCount(): Promise<number> {
    const client = getSupabaseClient();
    const { count, error } = await client
      .from('access_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) return 0;
    return count || 0;
  },
};

// ==================== 通行记录仓库 ====================

export const accessRecordRepository = {
  async getList(params: {
    personType?: string;
    direction?: string;
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: AccessRecord[]; total: number }> {
    const client = getSupabaseClient();
    let query = client
      .from('access_records')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false });

    if (params.personType) query = query.eq('person_type', params.personType);
    if (params.direction) query = query.eq('direction', params.direction);
    if (params.search) {
      query = query.or(`person_name.ilike.%${params.search}%,device_name.ilike.%${params.search}%`);
    }

    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('[AccessRecordRepo] getList error:', error.message);
      return { items: [], total: 0 };
    }
    return { items: (data || []).map(mapRecordRow), total: count || 0 };
  },

  async create(record: Omit<AccessRecord, 'id' | 'createdAt'>): Promise<AccessRecord | null> {
    const client = getSupabaseClient();
    const row: Record<string, unknown> = {
      person_id: record.personId,
      person_name: record.personName,
      person_type: record.personType,
      direction: record.direction,
      device_id: record.deviceId,
      device_name: record.deviceName,
      occurred_at: record.occurredAt,
      verify_method: record.verifyMethod,
      photo_url: record.photoUrl,
      temperature: record.temperature,
      is_abnormal: record.isAbnormal,
      remark: record.remark,
    };
    const { data, error } = await client
      .from('access_records')
      .insert(row)
      .select('*')
      .single();
    if (error) {
      console.error('[AccessRecordRepo] create error:', error.message);
      return null;
    }
    return data ? mapRecordRow(data) : null;
  },

  async getStatistics(): Promise<{
    totalPersons: number;
    todayRecords: number;
    todayIn: number;
    todayOut: number;
  }> {
    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const [personsRes, recordsRes, inRes, outRes] = await Promise.all([
      client.from('access_persons').select('*', { count: 'exact', head: true }),
      client.from('access_records').select('*', { count: 'exact', head: true }).gte('occurred_at', today),
      client.from('access_records').select('*', { count: 'exact', head: true }).gte('occurred_at', today).eq('direction', 'in'),
      client.from('access_records').select('*', { count: 'exact', head: true }).gte('occurred_at', today).eq('direction', 'out'),
    ]);

    return {
      totalPersons: personsRes.count || 0,
      todayRecords: recordsRes.count || 0,
      todayIn: inRes.count || 0,
      todayOut: outRes.count || 0,
    };
  },
};

// ==================== 行映射 ====================

function mapPersonRow(row: Record<string, unknown>): AccessPerson {
  return {
    id: row.id as string,
    name: row.name as string,
    personType: row.person_type as PersonType,
    phone: row.phone as string || undefined,
    idCard: row.id_card as string || undefined,
    photoUrl: row.photo_url as string || undefined,
    hasFaceVector: !!row.face_vector,
    relatedId: row.related_id as string || undefined,
    department: row.department as string || undefined,
    status: row.status as 'active' | 'inactive' | 'expired',
    validFrom: row.valid_from as string || undefined,
    validUntil: row.valid_until as string || undefined,
    createdAt: row.created_at as string || undefined,
    updatedAt: row.updated_at as string || undefined,
  };
}

function toPersonRow(person: Partial<AccessPerson>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (person.id) row.id = person.id;
  if (person.name) row.name = person.name;
  if (person.personType) row.person_type = person.personType;
  if (person.phone !== undefined) row.phone = person.phone;
  if (person.idCard !== undefined) row.id_card = person.idCard;
  if (person.photoUrl !== undefined) row.photo_url = person.photoUrl;
  if (person.relatedId !== undefined) row.related_id = person.relatedId;
  if (person.department !== undefined) row.department = person.department;
  if (person.status) row.status = person.status;
  if (person.validFrom !== undefined) row.valid_from = person.validFrom;
  if (person.validUntil !== undefined) row.valid_until = person.validUntil;
  return row;
}

function mapAppRow(row: Record<string, unknown>): AccessApplication {
  return {
    id: row.id as string,
    applicantName: row.applicant_name as string,
    applicantPhone: row.applicant_phone as string || undefined,
    applicantType: row.applicant_type as 'parent' | 'visitor',
    purpose: row.purpose as string,
    targetPerson: row.target_person as string || undefined,
    targetDepartment: row.target_department as string || undefined,
    relation: row.relation as string || undefined,
    studentName: row.student_name as string || undefined,
    studentId: row.student_id as string || undefined,
    expectedDate: row.expected_date as string,
    expectedTimeStart: row.expected_time_start as string || undefined,
    expectedTimeEnd: row.expected_time_end as string || undefined,
    idCard: row.id_card as string || undefined,
    photoUrl: row.photo_url as string || undefined,
    status: row.status as ApplicationStatus,
    approverId: row.approver_id as string || undefined,
    approverName: row.approver_name as string || undefined,
    approvedAt: row.approved_at as string || undefined,
    rejectionReason: row.rejection_reason as string || undefined,
    remark: row.remark as string || undefined,
    createdAt: row.created_at as string || undefined,
    updatedAt: row.updated_at as string || undefined,
  };
}

function toAppRow(app: Partial<AccessApplication>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (app.id) row.id = app.id;
  if (app.applicantName) row.applicant_name = app.applicantName;
  if (app.applicantPhone !== undefined) row.applicant_phone = app.applicantPhone;
  if (app.applicantType) row.applicant_type = app.applicantType;
  if (app.purpose) row.purpose = app.purpose;
  if (app.targetPerson !== undefined) row.target_person = app.targetPerson;
  if (app.targetDepartment !== undefined) row.target_department = app.targetDepartment;
  if (app.relation !== undefined) row.relation = app.relation;
  if (app.studentName !== undefined) row.student_name = app.studentName;
  if (app.studentId !== undefined) row.student_id = app.studentId;
  if (app.expectedDate) row.expected_date = app.expectedDate;
  if (app.expectedTimeStart !== undefined) row.expected_time_start = app.expectedTimeStart;
  if (app.expectedTimeEnd !== undefined) row.expected_time_end = app.expectedTimeEnd;
  if (app.idCard !== undefined) row.id_card = app.idCard;
  if (app.photoUrl !== undefined) row.photo_url = app.photoUrl;
  if (app.status) row.status = app.status;
  if (app.remark !== undefined) row.remark = app.remark;
  return row;
}

function mapRecordRow(row: Record<string, unknown>): AccessRecord {
  return {
    id: row.id as string,
    personId: row.person_id as string || undefined,
    personName: row.person_name as string,
    personType: row.person_type as PersonType,
    direction: row.direction as Direction,
    deviceId: row.device_id as string || undefined,
    deviceName: row.device_name as string || undefined,
    occurredAt: row.occurred_at as string,
    verifyMethod: row.verify_method as string || undefined,
    photoUrl: row.photo_url as string || undefined,
    temperature: row.temperature as number || undefined,
    isAbnormal: row.is_abnormal as boolean || undefined,
    remark: row.remark as string || undefined,
    createdAt: row.created_at as string || undefined,
  };
}
