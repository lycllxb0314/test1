import { BaseService } from './base.service';
import { purchaseRepository, PurchaseRepository } from '@/repositories/purchase.repository';
import type { PurchaseRecord, PurchaseStatus, PurchaseFilters, PurchaseStatistics, PurchaseItem } from '@/types/general';

type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class PurchaseService extends BaseService {
  private purchaseRepository: PurchaseRepository;

  constructor() {
    super();
    this.purchaseRepository = purchaseRepository;
  }

  async getPurchases(filters?: PurchaseFilters): Promise<ServiceResult<PurchaseRecord[]>> {
    try {
      const purchases = await this.purchaseRepository.findAllWithFilters(filters);
      return this.ok(purchases);
    } catch (error) {
      return this.fail('获取采购列表失败');
    }
  }

  async getPurchase(id: string): Promise<ServiceResult<PurchaseRecord>> {
    try {
      const purchase = await this.purchaseRepository.findById(id);
      if (!purchase) {
        return this.fail('采购记录不存在');
      }
      return this.ok(purchase);
    } catch (error) {
      return this.fail('获取采购详情失败');
    }
  }

  async createPurchase(data: {
    title: string;
    type: 'office_supplies' | 'equipment' | 'maintenance' | 'other';
    items: PurchaseItem[];
    totalAmount: number;
    reason: string;
    urgency: 'low' | 'normal' | 'high' | 'urgent';
    images?: string[];
    applicantId: string;
    applicantName: string;
    department: string;
    budgetSource?: string;
  }): Promise<ServiceResult<PurchaseRecord>> {
    try {
      const record: Omit<PurchaseRecord, 'id' | 'created_at' | 'updated_at'> = {
        title: data.title,
        type: data.type,
        items: data.items,
        total_amount: data.totalAmount,
        reason: data.reason,
        urgency: data.urgency,
        images: data.images || null,
        applicant_id: data.applicantId,
        applicant_name: data.applicantName,
        department: data.department,
        budget_source: data.budgetSource || null,
        status: 'pending',
        approved_amount: null,
        approver_id: null,
        approver_name: null,
        approved_at: null,
        supplier: null,
        order_date: null,
        received_date: null,
        rejection_reason: null,
        note: null,
      };

      const purchase = await this.purchaseRepository.create(record);
      if (!purchase) {
        return this.fail('创建采购申请失败');
      }
      return this.ok(purchase);
    } catch (error) {
      return this.fail('创建采购申请失败');
    }
  }

  async updatePurchase(id: string, updates: Partial<PurchaseRecord>): Promise<ServiceResult<PurchaseRecord>> {
    try {
      const purchase = await this.purchaseRepository.update(id, updates);
      if (!purchase) {
        return this.fail('更新采购记录失败');
      }
      return this.ok(purchase);
    } catch (error) {
      return this.fail('更新采购记录失败');
    }
  }

  async deletePurchase(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await this.purchaseRepository.delete(id);
      if (!success) {
        return this.fail('删除采购记录失败');
      }
      return this.ok(true);
    } catch (error) {
      return this.fail('删除采购记录失败');
    }
  }

  async updateStatus(
    id: string,
    status: PurchaseStatus,
    updates?: {
      approverId?: string;
      approverName?: string;
      approvedAmount?: number;
      supplier?: string;
      orderDate?: string;
      receivedDate?: string;
      note?: string;
    }
  ): Promise<ServiceResult<PurchaseRecord>> {
    try {
      const updateData: Partial<PurchaseRecord> = {};

      if (updates) {
        if (updates.approverId) updateData.approver_id = updates.approverId;
        if (updates.approverName) updateData.approver_name = updates.approverName;
        if (updates.approvedAmount !== undefined) updateData.approved_amount = updates.approvedAmount;
        if (updates.supplier) updateData.supplier = updates.supplier;
        if (updates.orderDate) updateData.order_date = updates.orderDate;
        if (updates.receivedDate) updateData.received_date = updates.receivedDate;
        if (updates.note) updateData.note = updates.note;

        if (status === 'approved') {
          updateData.approved_at = new Date().toISOString();
        }
      }

      const purchase = await this.purchaseRepository.updateStatus(id, status, updateData);
      if (!purchase) {
        return this.fail('更新状态失败');
      }
      return this.ok(purchase);
    } catch (error) {
      return this.fail('更新状态失败');
    }
  }

  async getStatistics(): Promise<ServiceResult<PurchaseStatistics>> {
    try {
      const stats = await this.purchaseRepository.getStatistics();
      return this.ok(stats);
    } catch (error) {
      return this.fail('获取统计数据失败');
    }
  }

  async getMyPurchases(applicantId: string): Promise<ServiceResult<PurchaseRecord[]>> {
    try {
      const purchases = await this.purchaseRepository.findByApplicantId(applicantId);
      return this.ok(purchases);
    } catch (error) {
      return this.fail('获取我的采购申请失败');
    }
  }
}

export const purchaseService = new PurchaseService();
