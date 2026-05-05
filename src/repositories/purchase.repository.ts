import { BaseRepository } from './base.repository';
import type { PurchaseRecord, PurchaseFilters, PurchaseStatistics, PurchaseStatus } from '@/types/general';

export class PurchaseRepository extends BaseRepository<PurchaseRecord> {
  constructor() {
    super('purchase_requests');
  }

  async findAllWithFilters(filters?: PurchaseFilters): Promise<PurchaseRecord[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
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
      console.error('[PurchaseRepository] findAllWithFilters error:', error.message);
      return [];
    }

    return (data || []) as PurchaseRecord[];
  }

  async findByApplicantId(applicantId: string): Promise<PurchaseRecord[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('applicant_id', applicantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PurchaseRepository] findByApplicantId error:', error.message);
      return [];
    }

    return (data || []) as PurchaseRecord[];
  }

  async updateStatus(id: string, status: PurchaseStatus, updates: Partial<PurchaseRecord>): Promise<PurchaseRecord | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({ ...updates, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PurchaseRepository] updateStatus error:', error.message);
      return null;
    }

    return data as PurchaseRecord;
  }

  async getStatistics(): Promise<PurchaseStatistics> {
    const { data: allRecords, error } = await this.client
      .from(this.tableName)
      .select('*');

    if (error || !allRecords) {
      console.error('[PurchaseRepository] getStatistics error:', error?.message);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        ordered: 0,
        received: 0,
        completed: 0,
        rejected: 0,
        totalAmount: 0,
        monthAmount: 0,
        monthCompleted: 0,
        byStatus: [],
        byType: [],
      };
    }

    const records = allRecords as PurchaseRecord[];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 计算各项统计
    const stats: PurchaseStatistics = {
      total: records.length,
      pending: records.filter(r => r.status === 'pending').length,
      approved: records.filter(r => r.status === 'approved').length,
      ordered: records.filter(r => r.status === 'ordered').length,
      received: records.filter(r => r.status === 'received').length,
      completed: records.filter(r => r.status === 'completed').length,
      rejected: records.filter(r => r.status === 'rejected').length,
      totalAmount: records.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      monthAmount: records
        .filter(r => {
          const date = new Date(r.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, r) => sum + (r.total_amount || 0), 0),
      monthCompleted: records.filter(r => {
        if (r.status !== 'completed' || !r.approved_at) return false;
        const date = new Date(r.approved_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length,
      byStatus: [],
      byType: [],
    };

    // 按状态统计
    const statusMap = new Map<PurchaseStatus, { count: number; amount: number }>();
    records.forEach(r => {
      const current = statusMap.get(r.status) || { count: 0, amount: 0 };
      statusMap.set(r.status, {
        count: current.count + 1,
        amount: current.amount + (r.total_amount || 0),
      });
    });
    stats.byStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
    }));

    // 按类型统计
    const typeMap = new Map<string, { count: number; amount: number }>();
    records.forEach(r => {
      const current = typeMap.get(r.type) || { count: 0, amount: 0 };
      typeMap.set(r.type, {
        count: current.count + 1,
        amount: current.amount + (r.total_amount || 0),
      });
    });
    stats.byType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.amount,
    }));

    return stats;
  }
}

export const purchaseRepository = new PurchaseRepository();
