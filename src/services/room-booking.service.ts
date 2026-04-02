/**
 * 教室预约服务层
 * 
 * 架构：API Route → Service → Repository
 * 处理教室预约相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import {
  roomBookingRepository,
  RoomBookingRecord,
  RoomBookingQueryParams,
} from '@/repositories/academic.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 预约查询参数
 */
export interface BookingQueryParams {
  roomId?: string;
  applicantId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 创建预约参数
 */
export interface CreateBookingParams {
  roomId: string;
  applicantId: string;
  applicantName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeesCount?: number;
  facilitiesNeeded?: string[];
  notes?: string;
}

/**
 * 审批预约参数
 */
export interface ApproveBookingParams {
  bookingId: string;
  action: 'approve' | 'reject';
  comment?: string;
  approverId: string;
  approverName: string;
  approverRole?: string;
}

/**
 * 教室预约服务
 */
export class RoomBookingService extends BaseService {
  private get client() {
    return getSupabaseClient();
  }

  /**
   * 获取预约列表
   */
  async getList(params: BookingQueryParams): Promise<PaginatedServiceResult<Record<string, unknown>>> {
    try {
      const { roomId, applicantId, status, startDate, endDate } = params;

      // 构建查询
      let query = this.client
        .from('room_bookings')
        .select(`
          id,
          room_id,
          applicant_id,
          applicant_name,
          purpose,
          start_time,
          end_time,
          status,
          attendees_count,
          facilities_needed,
          notes,
          approver_id,
          approver_name,
          approved_at,
          rejection_reason,
          created_at,
          rooms (
            id,
            name,
            code,
            type,
            building,
            location
          )
        `, { count: 'exact' })
        .order('start_time', { ascending: true });

      // 应用筛选条件
      if (roomId) {
        query = query.eq('room_id', roomId);
      }
      if (applicantId) {
        query = query.eq('applicant_id', applicantId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (startDate) {
        query = query.gte('start_time', startDate);
      }
      if (endDate) {
        query = query.lte('end_time', endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[RoomBookingService] getList error:', error.message);
        return { success: false, error: '获取预约列表失败' };
      }

      // 格式化返回数据
      const formattedData = (data || []).map(booking => {
        const room = booking.rooms?.[0] || booking.rooms;
        return {
          id: booking.id,
          roomId: booking.room_id,
          roomName: room?.name || '',
          roomCode: room?.code || '',
          roomType: room?.type || '',
          building: room?.building || '',
          location: room?.location || '',
          applicantId: booking.applicant_id,
          applicantName: booking.applicant_name,
          purpose: booking.purpose,
          startTime: booking.start_time,
          endTime: booking.end_time,
          status: booking.status,
          attendeesCount: booking.attendees_count,
          facilitiesNeeded: booking.facilities_needed || [],
          notes: booking.notes,
          approverId: booking.approver_id,
          approverName: booking.approver_name,
          approvedAt: booking.approved_at,
          rejectionReason: booking.rejection_reason,
          createdAt: booking.created_at,
        };
      });

      return {
        success: true,
        data: formattedData,
        pagination: {
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / (params.pageSize || 20)),
        },
      };
    } catch (err) {
      console.error('[RoomBookingService] getList error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建预约
   */
  async create(params: CreateBookingParams): Promise<ServiceResult<RoomBookingRecord>> {
    try {
      // 检查时间冲突
      const { data: conflicts } = await this.client
        .from('room_bookings')
        .select('id')
        .eq('room_id', params.roomId)
        .neq('status', 'rejected')
        .or(`start_time.lt.${params.endTime},end_time.gt.${params.startTime}`);

      if (conflicts && conflicts.length > 0) {
        return { success: false, error: '该时间段已有预约，请选择其他时间', code: 'CONFLICT' };
      }

      const data = await roomBookingRepository.create({
        room_id: params.roomId,
        applicant_id: params.applicantId,
        applicant_name: params.applicantName,
        purpose: params.purpose,
        start_time: params.startTime,
        end_time: params.endTime,
        status: 'pending',
        expected_attendees: params.attendeesCount || 0,
        room_name: '',
        room_type: 'meeting_room',
        building: '',
        applicant_role: 'teacher',
        title: params.purpose || '教室预约',
        booking_date: new Date().toISOString().split('T')[0],
        duration: 60,
        required_facilities: params.facilitiesNeeded ? { facilities: params.facilitiesNeeded } : undefined,
        description: params.notes,
      });

      if (!data) {
        return { success: false, error: '创建预约失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[RoomBookingService] create error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 审批预约
   */
  async approve(params: ApproveBookingParams): Promise<ServiceResult<RoomBookingRecord>> {
    try {
      const { bookingId, action, comment, approverId, approverName, approverRole } = params;

      // 获取预约详情
      const booking = await roomBookingRepository.findById(bookingId);
      if (!booking) {
        return { success: false, error: '预约不存在', code: 'NOT_FOUND' };
      }

      // 检查状态
      if (booking.status !== 'pending') {
        return { success: false, error: '该预约已处理', code: 'VALIDATION_ERROR' };
      }

      const now = new Date().toISOString();
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // 更新预约状态
      const updateData: Partial<RoomBookingRecord> = {
        status: newStatus,
        updated_at: now,
      };

      if (action === 'reject') {
        (updateData as Record<string, unknown>).reject_reason = comment;
      }

      const updated = await roomBookingRepository.update(bookingId, updateData);

      if (!updated) {
        return { success: false, error: '更新预约状态失败' };
      }

      // 记录审批操作
      await this.client
        .from('booking_approval_records')
        .insert({
          booking_id: bookingId,
          approver_id: approverId,
          approver_name: approverName,
          approver_role: approverRole,
          action,
          comment,
          created_at: now,
        });

      // 如果审批通过且需要保洁，创建保洁请求
      if (action === 'approve' && booking.title) {
        await this.createCleaningRequest(booking, bookingId, now);
      }

      return {
        success: true,
        data: updated,
      } as ServiceResult<RoomBookingRecord>;
    } catch (err) {
      console.error('[RoomBookingService] approve error:', err);
      return { success: false, error: '服务器错误' };
    }
  }

  /**
   * 创建保洁请求
   */
  private async createCleaningRequest(
    booking: RoomBookingRecord,
    bookingId: string,
    now: string
  ): Promise<void> {
    try {
      // 检查是否需要保洁
      const { data: room } = await this.client
        .from('rooms')
        .select('name')
        .eq('id', booking.room_id)
        .single();

      if (room) {
        await this.client
          .from('room_maintenance_records')
          .insert({
            room_id: booking.room_id,
            room_name: room.name,
            type: 'cleaning',
            description: `预约活动保洁：${booking.title || booking.purpose}`,
            status: 'scheduled',
            booking_id: bookingId,
            scheduled_date: booking.start_time,
            created_at: now,
          });

        // 更新预约的保洁请求状态
        await this.client
          .from('room_bookings')
          .update({ cleaning_requested: true })
          .eq('id', bookingId);
      }
    } catch (err) {
      console.error('[RoomBookingService] createCleaningRequest error:', err);
    }
  }

  /**
   * 更新预约状态（用于审批）
   */
  async updateStatus(params: {
    id: string;
    action: 'approve' | 'reject' | 'cancel';
    approverId: string;
    approverName: string;
    rejectionReason?: string;
  }): Promise<ServiceResult<RoomBookingRecord>> {
    try {
      const { id, action, approverId, approverName, rejectionReason } = params;

      const updateData: Record<string, unknown> = {
        approver_id: approverId,
        approver_name: approverName,
        approved_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.status = 'approved';
      } else if (action === 'reject') {
        updateData.status = 'rejected';
        updateData.rejection_reason = rejectionReason;
      } else if (action === 'cancel') {
        updateData.status = 'cancelled';
      }

      const data = await roomBookingRepository.update(id, updateData);

      if (!data) {
        return { success: false, error: '更新预约失败' };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[RoomBookingService] updateStatus error:', err);
      return { success: false, error: '服务器错误' };
    }
  }
}

// 导出单例
export const roomBookingService = new RoomBookingService();
