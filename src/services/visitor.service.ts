/**
 * 访客管理服务
 * 
 * 处理访客预约、签到、签退等业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { 
  visitorRepository, 
  VisitorRecord, 
  VisitorQueryParams 
} from '@/repositories/visitor.repository';

/**
 * 访客服务类
 */
export class VisitorService extends BaseService {
  /**
   * 获取访客列表
   */
  async getList(params: VisitorQueryParams): Promise<ServiceResult<VisitorRecord[]>> {
    try {
      const data = await visitorRepository.findList(params);
      return this.ok(data);
    } catch (error) {
      console.error('[VisitorService] getList error:', error);
      return this.fail('获取访客列表失败');
    }
  }

  /**
   * 分页获取访客列表
   */
  async getPaginated(params: VisitorQueryParams & { page?: number; pageSize?: number }): Promise<PaginatedServiceResult<VisitorRecord>> {
    try {
      const result = await visitorRepository.findPaginatedVisitors(params);
      return {
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      console.error('[VisitorService] getPaginated error:', error);
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
        error: '获取访客列表失败',
      };
    }
  }

  /**
   * 获取访客详情
   */
  async getById(id: string): Promise<ServiceResult<VisitorRecord>> {
    try {
      const data = await visitorRepository.findById(id);
      if (!data) {
        return this.fail('访客记录不存在');
      }
      return this.ok(data);
    } catch (error) {
      console.error('[VisitorService] getById error:', error);
      return this.fail('获取访客详情失败');
    }
  }

  /**
   * 创建访客预约
   */
  async create(data: Partial<VisitorRecord>): Promise<ServiceResult<VisitorRecord>> {
    try {
      // 验证必填字段
      if (!data.name || !data.purpose || !data.host_id || !data.expected_arrival_time) {
        return this.fail('缺少必填字段');
      }

      const record = await visitorRepository.create({
        id: data.id || `visitor-${Date.now()}`,
        name: data.name,
        phone: data.phone,
        id_card: data.id_card,
        purpose: data.purpose,
        host_id: data.host_id,
        host_name: data.host_name,
        host_department: data.host_department,
        expected_arrival_time: data.expected_arrival_time,
        status: 'pending',
        remark: data.remark,
      });

      if (!record) {
        return this.fail('创建访客预约失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[VisitorService] create error:', error);
      return this.fail('创建访客预约失败');
    }
  }

  /**
   * 审批访客预约
   */
  async approve(id: string, approverId: string, approverName: string): Promise<ServiceResult<VisitorRecord>> {
    try {
      const existing = await visitorRepository.findById(id);
      
      if (!existing) {
        return this.fail('访客记录不存在');
      }
      
      if (existing.status !== 'pending') {
        return this.fail('只能审批待处理的预约');
      }

      const record = await visitorRepository.update(id, {
        status: 'approved',
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
      });

      if (!record) {
        return this.fail('审批失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[VisitorService] approve error:', error);
      return this.fail('审批失败');
    }
  }

  /**
   * 驳回访客预约
   */
  async reject(id: string, approverId: string, approverName: string, reason?: string): Promise<ServiceResult<VisitorRecord>> {
    try {
      const existing = await visitorRepository.findById(id);
      
      if (!existing) {
        return this.fail('访客记录不存在');
      }
      
      if (existing.status !== 'pending') {
        return this.fail('只能驳回待处理的预约');
      }

      const record = await visitorRepository.update(id, {
        status: 'rejected',
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
        remark: reason,
      });

      if (!record) {
        return this.fail('驳回失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[VisitorService] reject error:', error);
      return this.fail('驳回失败');
    }
  }

  /**
   * 访客签到
   */
  async checkin(id: string, temperature?: number): Promise<ServiceResult<VisitorRecord>> {
    try {
      const existing = await visitorRepository.findById(id);
      
      if (!existing) {
        return this.fail('访客记录不存在');
      }
      
      if (existing.status !== 'approved') {
        return this.fail('只能签到已审批的访客');
      }

      const record = await visitorRepository.update(id, {
        status: 'visiting',
        actual_arrival_time: new Date().toISOString(),
        temperature,
      });

      if (!record) {
        return this.fail('签到失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[VisitorService] checkin error:', error);
      return this.fail('签到失败');
    }
  }

  /**
   * 访客签退
   */
  async checkout(id: string): Promise<ServiceResult<VisitorRecord>> {
    try {
      const existing = await visitorRepository.findById(id);
      
      if (!existing) {
        return this.fail('访客记录不存在');
      }
      
      if (existing.status !== 'visiting') {
        return this.fail('只能签退正在访问的访客');
      }

      const record = await visitorRepository.update(id, {
        status: 'left',
        actual_leave_time: new Date().toISOString(),
      });

      if (!record) {
        return this.fail('签退失败');
      }

      return this.ok(record);
    } catch (error) {
      console.error('[VisitorService] checkout error:', error);
      return this.fail('签退失败');
    }
  }

  /**
   * 更新访客信息
   */
  async update(id: string, data: Partial<VisitorRecord>): Promise<ServiceResult<VisitorRecord>> {
    try {
      const record = await visitorRepository.update(id, data);
      if (!record) {
        return this.fail('更新失败');
      }
      return this.ok(record);
    } catch (error) {
      console.error('[VisitorService] update error:', error);
      return this.fail('更新失败');
    }
  }

  /**
   * 获取访客统计
   */
  async getStatistics(): Promise<ServiceResult<{
    total: number;
    pending: number;
    approved: number;
    visiting: number;
    left: number;
    today: number;
  }>> {
    try {
      const [pending, approved, visiting, left, today] = await Promise.all([
        visitorRepository.countByStatus('pending'),
        visitorRepository.countByStatus('approved'),
        visitorRepository.countByStatus('visiting'),
        visitorRepository.countByStatus('left'),
        visitorRepository.countToday(),
      ]);

      return this.ok({
        total: pending + approved + visiting + left,
        pending,
        approved,
        visiting,
        left,
        today,
      });
    } catch (error) {
      console.error('[VisitorService] getStatistics error:', error);
      return this.fail('获取统计失败');
    }
  }
}

// 导出单例
export const visitorService = new VisitorService();
