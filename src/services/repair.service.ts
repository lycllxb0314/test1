import { BaseService } from './base.service';
import { repairRepository, RepairRepository } from '@/repositories/repair.repository';
import type { RepairRecord, RepairStatus, RepairFilters, RepairStatistics, RepairType, RepairUrgency } from '@/types/general';

type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class RepairService extends BaseService {
  private repairRepository: RepairRepository;

  constructor() {
    super();
    this.repairRepository = repairRepository;
  }

  async getRepairs(filters?: RepairFilters): Promise<ServiceResult<RepairRecord[]>> {
    try {
      const repairs = await this.repairRepository.findAllWithFilters(filters);
      return this.ok(repairs);
    } catch (error) {
      return this.fail('获取报修列表失败');
    }
  }

  async getRepair(id: string): Promise<ServiceResult<RepairRecord>> {
    try {
      const repair = await this.repairRepository.findById(id);
      if (!repair) {
        return this.fail('报修记录不存在');
      }
      return this.ok(repair);
    } catch (error) {
      return this.fail('获取报修详情失败');
    }
  }

  async createRepair(data: {
    type: RepairType;
    assetId?: string;
    item: string;
    location: string;
    description: string;
    urgency: RepairUrgency;
    images?: string[];
    applicantId: string;
    applicantName: string;
    department?: string;
  }): Promise<ServiceResult<RepairRecord>> {
    try {
      const record: Omit<RepairRecord, 'id' | 'created_at' | 'updated_at'> = {
        type: data.type,
        asset_id: data.assetId || null,
        item: data.item,
        location: data.location,
        description: data.description,
        urgency: data.urgency,
        images: data.images || null,
        applicant_id: data.applicantId,
        applicant_name: data.applicantName,
        department: data.department || null,
        status: 'pending',
        assignee_id: null,
        assignee_name: null,
        estimated_cost: null,
        actual_cost: null,
        scheduled_date: null,
        completed_at: null,
        note: null,
      };

      const repair = await this.repairRepository.create(record);
      if (!repair) {
        return this.fail('创建报修记录失败');
      }
      return this.ok(repair);
    } catch (error) {
      return this.fail('创建报修记录失败');
    }
  }

  async updateRepair(id: string, updates: Partial<RepairRecord>): Promise<ServiceResult<RepairRecord>> {
    try {
      const repair = await this.repairRepository.update(id, updates);
      if (!repair) {
        return this.fail('更新报修记录失败');
      }
      return this.ok(repair);
    } catch (error) {
      return this.fail('更新报修记录失败');
    }
  }

  async deleteRepair(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await this.repairRepository.delete(id);
      if (!success) {
        return this.fail('删除报修记录失败');
      }
      return this.ok(true);
    } catch (error) {
      return this.fail('删除报修记录失败');
    }
  }

  async updateStatus(
    id: string,
    status: RepairStatus,
    updates?: {
      assigneeId?: string;
      assigneeName?: string;
      estimatedCost?: number;
      actualCost?: number;
      scheduledDate?: string;
      note?: string;
    }
  ): Promise<ServiceResult<RepairRecord>> {
    try {
      const updateData: Partial<RepairRecord> = { status };

      if (updates) {
        if (updates.assigneeId) updateData.assignee_id = updates.assigneeId;
        if (updates.assigneeName) updateData.assignee_name = updates.assigneeName;
        if (updates.estimatedCost !== undefined) updateData.estimated_cost = updates.estimatedCost;
        if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost;
        if (updates.scheduledDate) updateData.scheduled_date = updates.scheduledDate;
        if (updates.note) updateData.note = updates.note;
      }

      // 如果状态为已完成，设置完成时间
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const repair = await this.repairRepository.updateStatus(id, status, updateData);
      if (!repair) {
        return this.fail('更新状态失败');
      }
      return this.ok(repair);
    } catch (error) {
      return this.fail('更新状态失败');
    }
  }

  async getStatistics(): Promise<ServiceResult<RepairStatistics>> {
    try {
      const stats = await this.repairRepository.getStatistics();
      return this.ok(stats);
    } catch (error) {
      return this.fail('获取统计数据失败');
    }
  }

  async getMyRepairs(applicantId: string): Promise<ServiceResult<RepairRecord[]>> {
    try {
      const repairs = await this.repairRepository.findByApplicantId(applicantId);
      return this.ok(repairs);
    } catch (error) {
      return this.fail('获取我的报修记录失败');
    }
  }
}

export const repairService = new RepairService();
