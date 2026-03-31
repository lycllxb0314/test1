/**
 * 教务管理服务层
 * 
 * 架构：API Route → Service → Repository
 */

import {
  roomRepository,
  roomBookingRepository,
  scheduleSlotRepository,
  scheduleDraftRepository,
  RoomRecord,
  RoomBookingRecord,
  ScheduleSlotRecord,
  ScheduleDraftRecord,
} from '@/repositories/academic.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

export type { RoomRecord as Room, RoomBookingRecord as RoomBooking, ScheduleSlotRecord as ScheduleSlot, ScheduleDraftRecord as ScheduleDraft };

export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ==================== 教室管理服务 ====================

export const roomService = {
  /**
   * 获取教室列表
   */
  async getList(params: {
    id?: string;
    type?: string;
    status?: string;
    building?: string;
    search?: string;
  }): Promise<ServiceResult<RoomRecord[]>> {
    try {
      const data = await roomRepository.findList(params);
      return { success: true, data };
    } catch (err) {
      console.error('Room service error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 创建教室
   */
  async create(data: Partial<RoomRecord>): Promise<ServiceResult<RoomRecord>> {
    try {
      if (!data.name || !data.code || !data.type || !data.building) {
        return { success: false, error: '缺少必填字段', code: 'VALIDATION_ERROR' };
      }
      
      const result = await roomRepository.create({
        id: data.id || `room-${Date.now()}`,
        name: data.name,
        code: data.code,
        type: data.type,
        building: data.building,
        floor: data.floor,
        location: data.location,
        capacity: data.capacity || 30,
        area: data.area,
        facilities: data.facilities || {
          projector: false,
          computer: false,
          microphone: false,
          speaker: false,
          whiteboard: false,
          blackboard: false,
          airConditioner: false,
          wifi: false,
          videoConference: false,
          recording: false,
        },
        extra_facilities: data.extra_facilities,
        status: data.status || 'available',
        manager_id: data.manager_id,
        manager_name: data.manager_name,
        department_id: data.department_id,
        remark: data.remark,
        usage_stats: { totalBookings: 0, thisMonth: 0 },
      });
      
      if (!result) {
        return { success: false, error: '创建教室失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Create room error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 更新教室
   */
  async update(id: string, data: Partial<RoomRecord>): Promise<ServiceResult<RoomRecord>> {
    try {
      if (!id) {
        return { success: false, error: '缺少教室ID', code: 'VALIDATION_ERROR' };
      }
      
      const result = await roomRepository.update(id, data);
      
      if (!result) {
        return { success: false, error: '更新教室失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Update room error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 删除教室
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const success = await roomRepository.delete(id);
      
      if (!success) {
        return { success: false, error: '删除教室失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Delete room error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 获取教室统计
   */
  async getStats(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const rooms = await roomRepository.findAllForStats();
      
      const stats = {
        total: rooms?.length || 0,
        available: rooms?.filter(r => r.status === 'available').length || 0,
        inUse: rooms?.filter(r => r.status === 'in_use').length || 0,
        maintenance: rooms?.filter(r => r.status === 'maintenance').length || 0,
        byType: {} as Record<string, number>,
        byBuilding: {} as Record<string, number>,
        totalCapacity: rooms?.reduce((sum, r) => sum + (r.capacity || 0), 0) || 0,
      };
      
      rooms?.forEach(r => {
        stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
        if (r.building) {
          stats.byBuilding[r.building] = (stats.byBuilding[r.building] || 0) + 1;
        }
      });
      
      return { success: true, data: stats };
    } catch (err) {
      console.error('Get room stats error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
};

// ==================== 教室预订服务 ====================

export const roomBookingService = {
  /**
   * 获取预订列表
   */
  async getList(params: {
    roomId?: string;
    status?: string;
    applicantId?: string;
    date?: string;
  }): Promise<ServiceResult<RoomBookingRecord[]>> {
    try {
      const data = await roomBookingRepository.findList(params);
      return { success: true, data };
    } catch (err) {
      console.error('Get bookings error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 创建预订
   */
  async create(data: Partial<RoomBookingRecord>): Promise<ServiceResult<RoomBookingRecord>> {
    try {
      if (!data.room_id || !data.title || !data.applicant_id || !data.start_time || !data.end_time) {
        return { success: false, error: '缺少必填字段', code: 'VALIDATION_ERROR' };
      }
      
      const result = await roomBookingRepository.create({
        id: data.id || `booking-${Date.now()}`,
        ...data,
        status: data.status || 'pending',
      });
      
      if (!result) {
        return { success: false, error: '创建预订失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Create booking error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 更新预订
   */
  async update(id: string, data: Partial<RoomBookingRecord>): Promise<ServiceResult<RoomBookingRecord>> {
    try {
      const result = await roomBookingRepository.update(id, data);
      
      if (!result) {
        return { success: false, error: '更新预订失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Update booking error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 删除预订
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const success = await roomBookingRepository.delete(id);
      
      if (!success) {
        return { success: false, error: '删除预订失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Delete booking error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
};

// ==================== 课表服务 ====================

export const scheduleService = {
  /**
   * 获取正式课表
   */
  async getOfficialSchedule(params: {
    classId?: string;
    teacherId?: string;
    grade?: number;
  }): Promise<ServiceResult<ScheduleSlotRecord[]>> {
    try {
      const data = await scheduleSlotRepository.findList({
        ...params,
        draftId: null,
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Get official schedule error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 更新正式课表格子
   */
  async updateOfficialSlot(slotId: string, data: {
    subject?: string;
    teacherId?: string;
    teacherName?: string;
  }): Promise<ServiceResult<ScheduleSlotRecord>> {
    try {
      // 获取教师 employee_id
      let employeeId = null;
      if (data.teacherId) {
        const client = getSupabaseClient();
        const { data: teacherData } = await client
          .from('teachers')
          .select('employee_id')
          .eq('id', data.teacherId)
          .single();
        employeeId = teacherData?.employee_id || null;
      }
      
      const updateData: Partial<ScheduleSlotRecord> = {};
      
      if (data.subject) updateData.subject = data.subject;
      if (data.teacherId) {
        updateData.teacher_id = data.teacherId;
        updateData.employee_id = employeeId;
      }
      if (data.teacherName) updateData.teacher_name = data.teacherName;
      
      const result = await scheduleSlotRepository.update(slotId, updateData);
      
      if (!result) {
        return { success: false, error: '更新课表失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Update official slot error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 获取班级课表
   */
  async getClassSchedule(classId: string): Promise<ServiceResult<{
    schedule: (ScheduleSlotRecord | null)[][];
    slots: ScheduleSlotRecord[];
  }>> {
    try {
      const slots = await scheduleSlotRepository.findList({
        classId,
        draftId: null,
      });
      
      // 转换为二维数组
      const schedule: (ScheduleSlotRecord | null)[][] = [[], [], [], [], []];
      
      for (const slot of slots) {
        const dayIndex = slot.week_day - 1;
        if (dayIndex >= 0 && dayIndex < 5) {
          while (schedule[dayIndex].length <= slot.period_index) {
            schedule[dayIndex].push(null);
          }
          schedule[dayIndex][slot.period_index] = slot;
        }
      }
      
      return { success: true, data: { schedule, slots } };
    } catch (err) {
      console.error('Get class schedule error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 保存课表格子
   */
  async saveSlot(data: {
    classId: string;
    className: string;
    grade: number;
    weekDay: number;
    periodIndex: number;
    subject: string;
    teacherId?: string;
    teacherName?: string;
    draftId?: string;
  }): Promise<ServiceResult<{ teacherInfo?: { id: string; name: string; usedHours: number } }>> {
    try {
      // 获取教师 employee_id
      let employeeId = null;
      if (data.teacherId) {
        const client = getSupabaseClient();
        const { data: teacherData } = await client
          .from('teachers')
          .select('employee_id')
          .eq('id', data.teacherId)
          .single();
        employeeId = teacherData?.employee_id || null;
      }
      
      // 先删除该位置的旧记录
      await scheduleSlotRepository.deleteByFilter({
        classId: data.classId,
        weekDay: data.weekDay,
        periodIndex: data.periodIndex,
        draftId: data.draftId || null,
      });
      
      // 插入新记录
      const result = await scheduleSlotRepository.create({
        class_id: data.classId,
        class_name: data.className,
        grade: data.grade,
        week_day: data.weekDay,
        period_index: data.periodIndex,
        subject: data.subject,
        teacher_id: data.teacherId || undefined,
        teacher_name: data.teacherName || undefined,
        employee_id: employeeId || undefined,
        draft_id: data.draftId || undefined,
        status: 'active',
      });
      
      if (!result) {
        return { success: false, error: '保存失败', code: 'DATABASE_ERROR' };
      }
      
      // 返回教师课时信息
      let teacherInfo = undefined;
      if (data.teacherId) {
        const count = await scheduleSlotRepository.countByTeacher(data.teacherId, data.draftId || null);
        
        teacherInfo = {
          id: data.teacherId,
          name: data.teacherName || '',
          usedHours: count,
        };
      }
      
      return { success: true, data: { teacherInfo } };
    } catch (err) {
      console.error('Save slot error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 删除课表格子
   */
  async deleteSlot(params: {
    classId: string;
    weekDay: number;
    periodIndex: number;
    draftId?: string;
  }): Promise<ServiceResult<void>> {
    try {
      const success = await scheduleSlotRepository.deleteByFilter({
        classId: params.classId,
        weekDay: params.weekDay,
        periodIndex: params.periodIndex,
        draftId: params.draftId || null,
      });
      
      if (!success) {
        return { success: false, error: '删除失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Delete slot error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 清空课表
   */
  async clearSchedule(draftId?: string): Promise<ServiceResult<void>> {
    try {
      await scheduleSlotRepository.deleteByFilter({ draftId: draftId || null });
      return { success: true };
    } catch (err) {
      console.error('Clear schedule error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 获取排课状态
   */
  async getStatus(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const totalSlots = await scheduleSlotRepository.countByTeacher('', null);
      const client = getSupabaseClient();
      
      const { count: draftSlots } = await client
        .from('schedule_slots')
        .select('*', { count: 'exact', head: true })
        .not('draft_id', 'is', null);
      
      const { count: teachers } = await client
        .from('teachers')
        .select('*', { count: 'exact', head: true });
      
      return {
        success: true,
        data: {
          totalSlots: totalSlots || 0,
          draftSlots: draftSlots || 0,
          teachers: teachers || 0,
        },
      };
    } catch (err) {
      console.error('Get schedule status error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
};

// ==================== 草稿服务 ====================

export const draftService = {
  /**
   * 获取草稿列表
   */
  async getList(): Promise<ServiceResult<ScheduleDraftRecord[]>> {
    try {
      const data = await scheduleDraftRepository.findAll();
      return { success: true, data };
    } catch (err) {
      console.error('Get drafts error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 创建草稿
   */
  async create(data: Partial<ScheduleDraftRecord>): Promise<ServiceResult<ScheduleDraftRecord>> {
    try {
      const result = await scheduleDraftRepository.create({
        id: data.id || `draft-${Date.now()}`,
        name: data.name,
        semester: data.semester,
        status: data.status || 'draft',
        creator_id: data.creator_id,
        creator_name: data.creator_name,
      });
      
      if (!result) {
        return { success: false, error: '创建草稿失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Create draft error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 更新草稿
   */
  async update(id: string, data: Partial<ScheduleDraftRecord>): Promise<ServiceResult<ScheduleDraftRecord>> {
    try {
      const result = await scheduleDraftRepository.update(id, data);
      
      if (!result) {
        return { success: false, error: '更新草稿失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Update draft error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 删除草稿
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      // 先删除草稿的课表格子
      await scheduleSlotRepository.deleteByFilter({ draftId: id });
      
      // 删除草稿
      const success = await scheduleDraftRepository.delete(id);
      
      if (!success) {
        return { success: false, error: '删除草稿失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true };
    } catch (err) {
      console.error('Delete draft error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 发布草稿
   */
  async publish(id: string): Promise<ServiceResult<void>> {
    try {
      const client = getSupabaseClient();
      
      // 更新草稿状态
      const result = await scheduleDraftRepository.update(id, { status: 'published' });
      
      if (!result) {
        return { success: false, error: '更新草稿状态失败', code: 'DATABASE_ERROR' };
      }
      
      // 将草稿的课表复制到正式课表
      const draftSlots = await scheduleSlotRepository.findList({ draftId: id });
      
      if (draftSlots && draftSlots.length > 0) {
        // 清空正式课表
        await scheduleSlotRepository.deleteByFilter({ draftId: null });
        
        // 插入新数据
        const client = getSupabaseClient();
        const officialSlots = draftSlots.map(slot => ({
          class_id: slot.class_id,
          class_name: slot.class_name,
          grade: slot.grade,
          week_day: slot.week_day,
          period_index: slot.period_index,
          period_name: slot.period_name,
          subject: slot.subject,
          teacher_id: slot.teacher_id,
          teacher_name: slot.teacher_name,
          employee_id: slot.employee_id,
          draft_id: null,
          status: slot.status,
          created_at: new Date().toISOString(),
        }));
        
        const { error: insertError } = await client
          .from('schedule_slots')
          .insert(officialSlots);
        
        if (insertError) {
          return { success: false, error: '发布失败', code: 'DATABASE_ERROR' };
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error('Publish draft error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 获取草稿详情
   */
  async getDetail(id: string): Promise<ServiceResult<ScheduleDraftRecord & { slots: ScheduleSlotRecord[] }>> {
    try {
      const draft = await scheduleDraftRepository.findById(id);
      
      if (!draft) {
        return { success: false, error: '草稿不存在', code: 'NOT_FOUND' };
      }
      
      const slots = await scheduleSlotRepository.findList({ draftId: id });
      
      return {
        success: true,
        data: {
          ...draft,
          slots,
        },
      };
    } catch (err) {
      console.error('Get draft detail error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
};

// ==================== 手动排课辅助服务 ====================

export const manualScheduleService = {
  /**
   * 获取年级课表
   */
  async getGradeSchedule(grade: number): Promise<ServiceResult<ScheduleSlotRecord[]>> {
    try {
      const data = await scheduleSlotRepository.findList({
        grade,
        draftId: null,
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Get grade schedule error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 获取可用教师
   */
  async getAvailableTeachers(params: {
    subject?: string;
    weekDay?: number;
    periodIndex?: number;
  }): Promise<ServiceResult<Array<{ id: string; name: string; primary_subject: string; total_weekly_hours: number }>>> {
    try {
      const client = getSupabaseClient();
      
      let query = client
        .from('teachers')
        .select('id, name, primary_subject, total_weekly_hours')
        .eq('status', 'active');
      
      if (params.subject) {
        query = query.eq('primary_subject', params.subject);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { success: false, error: '获取教师列表失败', code: 'DATABASE_ERROR' };
      }
      
      // 如果指定了时间，过滤掉已有课的教师
      if (params.weekDay !== undefined && params.periodIndex !== undefined) {
        const busySlots = await scheduleSlotRepository.findList({
          weekDay: params.weekDay,
          periodIndex: params.periodIndex,
          draftId: null,
        });
        
        const busyIds = new Set(busySlots.map(s => s.teacher_id).filter(Boolean) || []);
        const available = data?.filter(t => !busyIds.has(t.id)) || [];
        
        return { success: true, data: available };
      }
      
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Get available teachers error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
};
