import { BaseRepository } from './base.repository';
import type { RepairRecord, RepairStatus, RepairFilters, RepairStatistics } from '@/types/general';

export class RepairRepository extends BaseRepository<RepairRecord> {
  constructor() {
    super('repair_requests');
  }

  async findAllWithFilters(filters?: RepairFilters): Promise<RepairRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.urgency && filters.urgency !== 'all') {
        query = query.eq('urgency', filters.urgency);
      }
      if (filters.applicantId) {
        query = query.eq('applicant_id', filters.applicantId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RepairRepository] findAll error:', error.message);
      return [];
    }

    return (data || []) as RepairRecord[];
  }

  async findById(id: string): Promise<RepairRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[RepairRepository] findById error:', error.message);
      return null;
    }

    return data as RepairRecord;
  }

  async create(record: Omit<RepairRecord, 'id' | 'created_at' | 'updated_at'>): Promise<RepairRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('[RepairRepository] create error:', error.message);
      return null;
    }

    return data as RepairRecord;
  }

  async update(id: string, updates: Partial<RepairRecord>): Promise<RepairRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[RepairRepository] update error:', error.message);
      return null;
    }

    return data as RepairRecord;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[RepairRepository] delete error:', error.message);
      return false;
    }

    return true;
  }

  async updateStatus(id: string, status: RepairStatus, updates?: Partial<RepairRecord>): Promise<RepairRecord | null> {
    return this.update(id, { status, ...updates });
  }

  async getStatistics(): Promise<RepairStatistics> {
    // 获取总数和各状态数量
    const { data: statusData, error: statusError } = await this.client
      .from(this.tableName)
      .select('status, created_at, completed_at');

    if (statusError || !statusData) {
      console.error('[RepairRepository] getStatistics error:', statusError?.message);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        avgResponseTime: 0,
        monthCompleted: 0,
      };
    }

    const records = statusData as { status: string; created_at: string; completed_at: string | null }[];

    // 统计各状态数量
    const pending = records.filter(r => r.status === 'pending').length;
    const inProgress = records.filter(r => r.status === 'in_progress').length;
    const completed = records.filter(r => r.status === 'completed').length;
    const rejected = records.filter(r => r.status === 'rejected').length;

    // 计算本月完成数量
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCompleted = records.filter(r => {
      if (r.status !== 'completed' || !r.completed_at) return false;
      return new Date(r.completed_at) >= monthStart;
    }).length;

    // 计算平均响应时间（从创建到完成的小时数）
    const completedRecords = records.filter(r => r.status === 'completed' && r.completed_at);
    let avgResponseTime = 0;
    if (completedRecords.length > 0) {
      const totalHours = completedRecords.reduce((sum, r) => {
        const created = new Date(r.created_at);
        const completed = new Date(r.completed_at!);
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgResponseTime = Math.round(totalHours / completedRecords.length * 10) / 10;
    }

    return {
      total: records.length,
      pending,
      inProgress,
      completed,
      rejected,
      avgResponseTime,
      monthCompleted,
    };
  }

  async findByApplicantId(applicantId: string): Promise<RepairRecord[]> {
    return this.findAllWithFilters({ applicantId });
  }
}

export const repairRepository = new RepairRepository();
