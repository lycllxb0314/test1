/**
 * 班级座位表 Service
 * 
 * @module services/seating-plan.service
 */

import { BaseService, ServiceResult } from './base.service';
import { seatingPlanRepository, studentRepository } from '@/repositories';
import type {
  SeatingPlan,
  SeatingPlanQueryParams,
  CreateSeatingPlanParams,
  UpdateSeatingPlanParams,
  AssignSeatParams,
  BatchAssignSeatsParams,
  SwapSeatsParams,
  SeatingStatistics,
  Seat,
} from '@/types/seating';

/**
 * 座位表服务
 */
export class SeatingPlanService extends BaseService {
  /**
   * 获取座位表详情
   */
  async getPlan(id: string): Promise<ServiceResult<SeatingPlan>> {
    const plan = await seatingPlanRepository.getPlanById(id);
    
    if (!plan) {
      return this.fail('座位表不存在', 'NOT_FOUND');
    }
    
    return this.ok(plan);
  }

  /**
   * 获取班级座位表列表
   */
  async getPlansByClass(params: SeatingPlanQueryParams): Promise<ServiceResult<SeatingPlan[]>> {
    const plans = await seatingPlanRepository.getPlansByClass(params);
    return this.ok(plans);
  }

  /**
   * 获取班级当前激活的座位表
   */
  async getActivePlan(classId: string): Promise<ServiceResult<SeatingPlan | null>> {
    const plan = await seatingPlanRepository.getActivePlanByClass(classId);
    return this.ok(plan);
  }

  /**
   * 创建座位表
   */
  async createPlan(params: CreateSeatingPlanParams & { createdBy?: string }): Promise<ServiceResult<SeatingPlan>> {
    // 检查班级是否已有座位表
    const existing = await seatingPlanRepository.getActivePlanByClass(params.classId);
    
    if (existing) {
      // 已有座位表，返回现有的
      return this.ok(existing);
    }
    
    const plan = await seatingPlanRepository.createPlan(params);
    return this.ok(plan);
  }

  /**
   * 更新座位表配置
   */
  async updatePlan(id: string, params: UpdateSeatingPlanParams): Promise<ServiceResult<SeatingPlan>> {
    const plan = await seatingPlanRepository.updatePlan(id, params);
    
    if (!plan) {
      return this.fail('更新座位表失败', 'UPDATE_FAILED');
    }
    
    return this.ok(plan);
  }

  /**
   * 安排学生入座
   */
  async assignSeat(params: AssignSeatParams): Promise<ServiceResult<SeatingPlan>> {
    // 获取学生信息
    const student = await studentRepository.findById(params.studentId);
    if (!student) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }
    
    // 更新座位
    const plan = await seatingPlanRepository.updateSeat(params.planId, params.seatId, {
      status: 'occupied',
      studentId: params.studentId,
      studentName: student.name,
      studentNo: student.studentNo,
    });
    
    if (!plan) {
      return this.fail('安排座位失败', 'UPDATE_FAILED');
    }
    
    return this.ok(plan);
  }

  /**
   * 批量安排座位
   */
  async batchAssignSeats(params: BatchAssignSeatsParams): Promise<ServiceResult<SeatingPlan>> {
    const plan = await seatingPlanRepository.getPlanById(params.planId);
    if (!plan) {
      return this.fail('座位表不存在', 'NOT_FOUND');
    }
    
    // 获取所有学生信息
    const studentIds = params.assignments.map(a => a.studentId);
    const students = await Promise.all(
      studentIds.map(id => studentRepository.findById(id))
    );
    
    // 构建学生映射
    const studentMap = new Map(
      students
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map(s => [s.id, s])
    );
    
    // 更新座位
    const seatMap = new Map(plan.seats.map(s => [s.id, s]));
    
    for (const assignment of params.assignments) {
      const student = studentMap.get(assignment.studentId);
      const seat = seatMap.get(assignment.seatId);
      
      if (student && seat) {
        seatMap.set(assignment.seatId, {
          ...seat,
          status: 'occupied',
          studentId: assignment.studentId,
          studentName: student.name,
          studentNo: student.studentNo,
        });
      }
    }
    
    const updatedPlan = await seatingPlanRepository.batchUpdateSeats(
      params.planId,
      Array.from(seatMap.values())
    );
    
    if (!updatedPlan) {
      return this.fail('批量安排座位失败', 'UPDATE_FAILED');
    }
    
    return this.ok(updatedPlan);
  }

  /**
   * 清空座位
   */
  async clearSeat(planId: string, seatId: string): Promise<ServiceResult<SeatingPlan>> {
    const plan = await seatingPlanRepository.clearSeat(planId, seatId);
    
    if (!plan) {
      return this.fail('清空座位失败', 'UPDATE_FAILED');
    }
    
    return this.ok(plan);
  }

  /**
   * 交换座位
   */
  async swapSeats(params: SwapSeatsParams): Promise<ServiceResult<SeatingPlan>> {
    const plan = await seatingPlanRepository.swapSeats(
      params.planId,
      params.seatId1,
      params.seatId2
    );
    
    if (!plan) {
      return this.fail('交换座位失败', 'UPDATE_FAILED');
    }
    
    return this.ok(plan);
  }

  /**
   * 随机排座
   */
  async randomArrange(planId: string, classId: string): Promise<ServiceResult<SeatingPlan>> {
    // 获取班级学生
    const students = await studentRepository.findByClass(classId);
    if (students.length === 0) {
      return this.fail('班级没有学生', 'NO_DATA');
    }
    
    // 获取座位表
    const plan = await seatingPlanRepository.getPlanById(planId);
    if (!plan) {
      return this.fail('座位表不存在', 'NOT_FOUND');
    }
    
    // 获取空座位
    const emptySeats = plan.seats.filter(s => s.status === 'empty');
    
    // 随机打乱学生和座位
    const shuffledStudents = this.shuffleArray([...students]);
    const shuffledSeats = this.shuffleArray([...emptySeats]);
    
    // 分配座位
    const assignments: Array<{ seatId: string; studentId: string }> = [];
    const minLen = Math.min(shuffledStudents.length, shuffledSeats.length);
    
    for (let i = 0; i < minLen; i++) {
      assignments.push({
        seatId: shuffledSeats[i].id,
        studentId: shuffledStudents[i].id,
      });
    }
    
    return this.batchAssignSeats({ planId, assignments });
  }

  /**
   * 清空所有座位
   */
  async clearAllSeats(planId: string): Promise<ServiceResult<SeatingPlan>> {
    const plan = await seatingPlanRepository.getPlanById(planId);
    if (!plan) {
      return this.fail('座位表不存在', 'NOT_FOUND');
    }
    
    const clearedSeats = plan.seats.map(seat => ({
      ...seat,
      status: 'empty' as const,
      studentId: undefined,
      studentName: undefined,
      studentNo: undefined,
    }));
    
    const updatedPlan = await seatingPlanRepository.batchUpdateSeats(planId, clearedSeats);
    
    if (!updatedPlan) {
      return this.fail('清空座位失败', 'UPDATE_FAILED');
    }
    
    return this.ok(updatedPlan);
  }

  /**
   * 获取座位统计
   */
  async getStatistics(planId: string, classId: string): Promise<ServiceResult<SeatingStatistics>> {
    const plan = await seatingPlanRepository.getPlanById(planId);
    if (!plan) {
      return this.fail('座位表不存在', 'NOT_FOUND');
    }
    
    // 获取班级学生
    const students = await studentRepository.findByClass(classId);
    
    // 统计座位状态
    const totalSeats = plan.seats.length;
    const occupiedSeats = plan.seats.filter(s => s.status === 'occupied').length;
    const emptySeats = plan.seats.filter(s => s.status === 'empty').length;
    const lockedSeats = plan.seats.filter(s => s.status === 'locked').length;
    
    // 找出未安排座位的学生
    const seatedStudentIds = new Set(
      plan.seats
        .filter(s => s.studentId)
        .map(s => s.studentId)
    );
    
    const unassignedStudents = students
      .filter(s => !seatedStudentIds.has(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        studentNo: s.studentNo,
      }));
    
    return this.ok({
      totalSeats,
      occupiedSeats,
      emptySeats,
      lockedSeats,
      unassignedStudents: unassignedStudents.length,
      unassignedStudentList: unassignedStudents,
    });
  }

  /**
   * 删除座位表
   */
  async deletePlan(id: string): Promise<ServiceResult<void>> {
    const success = await seatingPlanRepository.deletePlan(id);
    
    if (!success) {
      return this.fail('删除座位表失败', 'DELETE_FAILED');
    }
    
    return this.ok(undefined);
  }

  /**
   * 数组随机打乱
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// 导出单例
export const seatingPlanService = new SeatingPlanService();
