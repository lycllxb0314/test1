/**
 * 班级座位表 Repository
 * 
 * @module repositories/seating-plan.repository
 */

import { BaseRepository } from './base.repository';
import type {
  SeatingPlan,
  SeatingPlanRow,
  SeatingPlanQueryParams,
  CreateSeatingPlanParams,
  UpdateSeatingPlanParams,
  Seat,
  SeatingConfig,
} from '@/types/seating';
import { DEFAULT_SEATING_CONFIG } from '@/types/seating';

/**
 * 座位表 Repository
 */
export class SeatingPlanRepository extends BaseRepository<SeatingPlanRow> {
  constructor() {
    super('seating_plans');
  }

  /**
   * 行类型转业务模型
   */
  private toModel(row: SeatingPlanRow): SeatingPlan {
    return {
      id: row.id,
      classId: row.class_id,
      name: row.name,
      config: row.config as SeatingConfig,
      seats: row.seats as Seat[],
      version: row.version,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 业务模型转行类型
   */
  private toRow(data: Partial<SeatingPlan>): Partial<SeatingPlanRow> {
    const row: Partial<SeatingPlanRow> = {};
    
    if (data.classId !== undefined) row.class_id = data.classId;
    if (data.name !== undefined) row.name = data.name;
    if (data.config !== undefined) row.config = data.config as SeatingConfig;
    if (data.seats !== undefined) row.seats = data.seats as Seat[];
    if (data.version !== undefined) row.version = data.version;
    if (data.isActive !== undefined) row.is_active = data.isActive;
    if (data.createdBy !== undefined) row.created_by = data.createdBy;
    
    return row;
  }

  /**
   * 根据ID获取座位表
   */
  async getPlanById(id: string): Promise<SeatingPlan | null> {
    const row = await this.findById(id);
    return row ? this.toModel(row) : null;
  }

  /**
   * 获取班级的座位表列表
   */
  async getPlansByClass(params: SeatingPlanQueryParams): Promise<SeatingPlan[]> {
    const filters: Record<string, unknown> = {};
    
    if (params.classId) {
      filters.class_id = params.classId;
    }
    if (params.isActive !== undefined) {
      filters.is_active = params.isActive;
    }
    
    const rows = await this.findWhere(filters);
    return rows.map(row => this.toModel(row));
  }

  /**
   * 获取班级当前激活的座位表
   */
  async getActivePlanByClass(classId: string): Promise<SeatingPlan | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      console.error('[SeatingPlanRepository] getActivePlanByClass error:', error.message);
      return null;
    }
    
    return this.toModel(data as SeatingPlanRow);
  }

  /**
   * 创建座位表
   */
  async createPlan(params: CreateSeatingPlanParams & { createdBy?: string }): Promise<SeatingPlan> {
    const config: SeatingConfig = {
      ...DEFAULT_SEATING_CONFIG,
      ...params.config,
    };
    
    // 生成初始座位
    const seats = this.generateEmptySeats(config);
    
    const row = await this.create({
      class_id: params.classId,
      name: params.name || '默认座位表',
      config,
      seats,
      is_active: true,
      created_by: params.createdBy,
    } as Partial<SeatingPlanRow>);
    
    if (!row) {
      throw new Error('创建座位表失败');
    }
    
    return this.toModel(row);
  }

  /**
   * 更新座位表
   */
  async updatePlan(id: string, params: UpdateSeatingPlanParams): Promise<SeatingPlan | null> {
    const updateData: Partial<SeatingPlanRow> = {};
    
    if (params.name !== undefined) updateData.name = params.name;
    if (params.config !== undefined) updateData.config = params.config as SeatingConfig;
    if (params.seats !== undefined) updateData.seats = params.seats as Seat[];
    if (params.isActive !== undefined) updateData.is_active = params.isActive;
    
    // 更新版本号
    const current = await this.findById(id);
    if (current) {
      updateData.version = current.version + 1;
    }
    
    const row = await this.update(id, updateData);
    return row ? this.toModel(row) : null;
  }

  /**
   * 更新单个座位
   */
  async updateSeat(planId: string, seatId: string, seatData: Partial<Seat>): Promise<SeatingPlan | null> {
    const plan = await this.getPlanById(planId);
    if (!plan) return null;
    
    const seats = plan.seats.map(seat => {
      if (seat.id === seatId) {
        return { ...seat, ...seatData };
      }
      return seat;
    });
    
    return this.updatePlan(planId, { seats });
  }

  /**
   * 批量更新座位
   */
  async batchUpdateSeats(planId: string, seats: Seat[]): Promise<SeatingPlan | null> {
    return this.updatePlan(planId, { seats });
  }

  /**
   * 清空座位
   */
  async clearSeat(planId: string, seatId: string): Promise<SeatingPlan | null> {
    const plan = await this.getPlanById(planId);
    if (!plan) return null;
    
    const seats = plan.seats.map(seat => {
      if (seat.id === seatId) {
        return {
          ...seat,
          status: 'empty' as const,
          studentId: undefined,
          studentName: undefined,
          studentNo: undefined,
        };
      }
      return seat;
    });
    
    return this.updatePlan(planId, { seats });
  }

  /**
   * 交换两个座位的学生
   */
  async swapSeats(planId: string, seatId1: string, seatId2: string): Promise<SeatingPlan | null> {
    const plan = await this.getPlanById(planId);
    if (!plan) return null;
    
    const seat1 = plan.seats.find(s => s.id === seatId1);
    const seat2 = plan.seats.find(s => s.id === seatId2);
    
    if (!seat1 || !seat2) return null;
    
    const seats = plan.seats.map(seat => {
      if (seat.id === seatId1) {
        return {
          ...seat,
          studentId: seat2.studentId,
          studentName: seat2.studentName,
          studentNo: seat2.studentNo,
          status: seat2.studentId ? 'occupied' as const : 'empty' as const,
        };
      }
      if (seat.id === seatId2) {
        return {
          ...seat,
          studentId: seat1.studentId,
          studentName: seat1.studentName,
          studentNo: seat1.studentNo,
          status: seat1.studentId ? 'occupied' as const : 'empty' as const,
        };
      }
      return seat;
    });
    
    return this.updatePlan(planId, { seats });
  }

  /**
   * 停用其他座位表
   */
  async deactivateOtherPlans(classId: string, excludeId: string): Promise<void> {
    await this.client
      .from(this.tableName)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('class_id', classId)
      .neq('id', excludeId);
  }

  /**
   * 删除座位表
   */
  async deletePlan(id: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * 生成空座位
   */
  private generateEmptySeats(config: SeatingConfig): Seat[] {
    const seats: Seat[] = [];
    let seatIndex = 0;
    
    for (let row = 1; row <= config.rows; row++) {
      for (let col = 1; col <= config.columns; col++) {
        seats.push({
          id: `seat-${row}-${col}`,
          position: { row, column: col },
          status: 'empty',
          attributes: {
            isByWindow: col === 1 || col === config.columns,
            isFrontRow: row === 1,
          },
        });
        seatIndex++;
      }
    }
    
    return seats;
  }
}

// 导出单例
export const seatingPlanRepository = new SeatingPlanRepository();
