/**
 * 教务管理服务层
 * 
 * 架构：API Route → Service → Repository
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

export interface Room {
  id: string;
  name: string;
  code: string;
  type: string;
  building: string;
  floor?: number;
  location?: string;
  capacity: number;
  area?: number;
  facilities?: Record<string, boolean>;
  extra_facilities?: string;
  status: string;
  manager_id?: string;
  manager_name?: string;
  department_id?: string;
  remark?: string;
  usage_stats?: Record<string, number>;
  created_at: string;
  updated_at?: string;
}

export interface RoomBooking {
  id: string;
  room_id: string;
  room_name?: string;
  title: string;
  purpose: string;
  applicant_id: string;
  applicant_name: string;
  applicant_department?: string;
  start_time: string;
  end_time: string;
  status: string;
  attendees: number;
  equipment_needed?: string[];
  remark?: string;
  approval_info?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface ScheduleSlot {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  period_name?: string;
  subject: string;
  teacher_id?: string;
  teacher_name?: string;
  employee_id?: string;
  draft_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface ScheduleDraft {
  id: string;
  name: string;
  semester: string;
  status: string;
  creator_id?: string;
  creator_name?: string;
  created_at: string;
  updated_at?: string;
}

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
  }): Promise<ServiceResult<Room[]>> {
    try {
      const client = getSupabaseClient();
      
      // 单个查询
      if (params.id) {
        const { data, error } = await client
          .from('rooms')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) {
          return { success: false, error: '获取教室详情失败', code: 'DATABASE_ERROR' };
        }
        
        return { success: true, data: data ? [data] : [] };
      }
      
      let query = client
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (params.type && params.type !== 'all') {
        query = query.eq('type', params.type);
      }
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      if (params.building && params.building !== 'all') {
        query = query.eq('building', params.building);
      }
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%,location.ilike.%${params.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { success: false, error: '获取教室列表失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Room service error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 创建教室
   */
  async create(data: Partial<Room>): Promise<ServiceResult<Room>> {
    try {
      const client = getSupabaseClient();
      
      if (!data.name || !data.code || !data.type || !data.building) {
        return { success: false, error: '缺少必填字段', code: 'VALIDATION_ERROR' };
      }
      
      const roomId = data.id || `room-${Date.now()}`;
      
      const { data: result, error } = await client
        .from('rooms')
        .insert({
          id: roomId,
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
        })
        .select()
        .single();
      
      if (error) {
        return { success: false, error: '创建教室失败: ' + error.message, code: 'DATABASE_ERROR' };
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
  async update(id: string, data: Partial<Room>): Promise<ServiceResult<Room>> {
    try {
      const client = getSupabaseClient();
      
      if (!id) {
        return { success: false, error: '缺少教室ID', code: 'VALIDATION_ERROR' };
      }
      
      const { data: result, error } = await client
        .from('rooms')
        .update({
          ...data,
          extra_facilities: data.extra_facilities,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
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
      const client = getSupabaseClient();
      
      const { error } = await client
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) {
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
      const client = getSupabaseClient();
      
      const { data: rooms, error } = await client
        .from('rooms')
        .select('type, status, building, capacity, usage_stats');
      
      if (error) {
        return { success: false, error: '获取统计失败', code: 'DATABASE_ERROR' };
      }
      
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
  }): Promise<ServiceResult<RoomBooking[]>> {
    try {
      const client = getSupabaseClient();
      
      let query = client
        .from('room_bookings')
        .select(`
          *,
          rooms(name)
        `)
        .order('created_at', { ascending: false });
      
      if (params.roomId) {
        query = query.eq('room_id', params.roomId);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.applicantId) {
        query = query.eq('applicant_id', params.applicantId);
      }
      if (params.date) {
        query = query.gte('start_time', params.date).lt('start_time', `${params.date}T23:59:59`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { success: false, error: '获取预订列表失败', code: 'DATABASE_ERROR' };
      }
      
      // 格式化数据
      const formatted = data?.map(b => ({
        ...b,
        room_name: b.rooms?.name,
      }));
      
      return { success: true, data: formatted || [] };
    } catch (err) {
      console.error('Get bookings error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 创建预订
   */
  async create(data: Partial<RoomBooking>): Promise<ServiceResult<RoomBooking>> {
    try {
      const client = getSupabaseClient();
      
      if (!data.room_id || !data.title || !data.applicant_id || !data.start_time || !data.end_time) {
        return { success: false, error: '缺少必填字段', code: 'VALIDATION_ERROR' };
      }
      
      const bookingId = data.id || `booking-${Date.now()}`;
      
      const { data: result, error } = await client
        .from('room_bookings')
        .insert({
          id: bookingId,
          ...data,
          status: data.status || 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
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
  async update(id: string, data: Partial<RoomBooking>): Promise<ServiceResult<RoomBooking>> {
    try {
      const client = getSupabaseClient();
      
      const { data: result, error } = await client
        .from('room_bookings')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
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
      const client = getSupabaseClient();
      
      const { error } = await client
        .from('room_bookings')
        .delete()
        .eq('id', id);
      
      if (error) {
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
  }): Promise<ServiceResult<ScheduleSlot[]>> {
    try {
      const client = getSupabaseClient();
      
      const allSlots: ScheduleSlot[] = [];
      const batchSize = 1000;
      let offset = 0;
      
      while (true) {
        let query = client
          .from('schedule_slots')
          .select('*')
          .is('draft_id', null)
          .range(offset, offset + batchSize - 1);
        
        if (params.classId) {
          query = query.eq('class_id', params.classId);
        }
        if (params.teacherId) {
          query = query.eq('teacher_id', params.teacherId);
        }
        if (params.grade) {
          query = query.eq('grade', params.grade);
        }
        
        const { data: batch, error } = await query;
        
        if (error) {
          return { success: false, error: '获取正式课表失败', code: 'DATABASE_ERROR' };
        }
        
        if (batch && batch.length > 0) {
          allSlots.push(...batch);
        }
        
        if (!batch || batch.length < batchSize) {
          break;
        }
        
        offset += batchSize;
      }
      
      return { success: true, data: allSlots };
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
  }): Promise<ServiceResult<ScheduleSlot>> {
    try {
      const client = getSupabaseClient();
      
      // 获取教师 employee_id
      let employeeId = null;
      if (data.teacherId) {
        const { data: teacherData } = await client
          .from('teachers')
          .select('employee_id')
          .eq('id', data.teacherId)
          .single();
        employeeId = teacherData?.employee_id || null;
      }
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (data.subject) updateData.subject = data.subject;
      if (data.teacherId) {
        updateData.teacher_id = data.teacherId;
        updateData.employee_id = employeeId;
      }
      if (data.teacherName) updateData.teacher_name = data.teacherName;
      
      const { data: result, error } = await client
        .from('schedule_slots')
        .update(updateData)
        .eq('id', slotId)
        .is('draft_id', null)
        .select()
        .single();
      
      if (error) {
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
    schedule: (ScheduleSlot | null)[][];
    slots: ScheduleSlot[];
  }>> {
    try {
      const client = getSupabaseClient();
      
      const { data: slots, error } = await client
        .from('schedule_slots')
        .select('*')
        .eq('class_id', classId);
      
      if (error) {
        return { success: false, error: '获取课表失败', code: 'DATABASE_ERROR' };
      }
      
      // 转换为二维数组
      const schedule: (ScheduleSlot | null)[][] = [[], [], [], [], []];
      
      for (const slot of slots || []) {
        const dayIndex = slot.week_day - 1;
        if (dayIndex >= 0 && dayIndex < 5) {
          while (schedule[dayIndex].length <= slot.period_index) {
            schedule[dayIndex].push(null);
          }
          schedule[dayIndex][slot.period_index] = slot;
        }
      }
      
      return { success: true, data: { schedule, slots: slots || [] } };
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
      const client = getSupabaseClient();
      
      // 获取教师 employee_id
      let employeeId = null;
      if (data.teacherId) {
        const { data: teacherData } = await client
          .from('teachers')
          .select('employee_id')
          .eq('id', data.teacherId)
          .single();
        employeeId = teacherData?.employee_id || null;
      }
      
      // 先删除该位置的旧记录
      await client
        .from('schedule_slots')
        .delete()
        .eq('class_id', data.classId)
        .eq('week_day', data.weekDay)
        .eq('period_index', data.periodIndex)
        .eq('draft_id', data.draftId || null);
      
      // 插入新记录
      const { error: insertError } = await client
        .from('schedule_slots')
        .insert({
          class_id: data.classId,
          class_name: data.className,
          grade: data.grade,
          week_day: data.weekDay,
          period_index: data.periodIndex,
          subject: data.subject,
          teacher_id: data.teacherId || null,
          teacher_name: data.teacherName || null,
          employee_id: employeeId,
          draft_id: data.draftId || null,
        });
      
      if (insertError) {
        return { success: false, error: '保存失败', code: 'DATABASE_ERROR' };
      }
      
      // 返回教师课时信息
      let teacherInfo = undefined;
      if (data.teacherId) {
        const { count } = await client
          .from('schedule_slots')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', data.teacherId);
        
        teacherInfo = {
          id: data.teacherId,
          name: data.teacherName || '',
          usedHours: count || 0,
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
      const client = getSupabaseClient();
      
      const { error } = await client
        .from('schedule_slots')
        .delete()
        .eq('class_id', params.classId)
        .eq('week_day', params.weekDay)
        .eq('period_index', params.periodIndex)
        .eq('draft_id', params.draftId || null);
      
      if (error) {
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
      const client = getSupabaseClient();
      
      if (draftId) {
        await client.from('schedule_slots').delete().eq('draft_id', draftId);
      } else {
        await client.from('schedule_slots').delete().is('draft_id', null);
      }
      
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
      const client = getSupabaseClient();
      
      const { count: totalSlots } = await client
        .from('schedule_slots')
        .select('*', { count: 'exact', head: true })
        .is('draft_id', null);
      
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
  async getList(): Promise<ServiceResult<ScheduleDraft[]>> {
    try {
      const client = getSupabaseClient();
      
      const { data, error } = await client
        .from('schedule_drafts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        return { success: false, error: '获取草稿列表失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Get drafts error:', err);
      return { success: false, error: '服务器错误', code: 'INTERNAL_ERROR' };
    }
  },
  
  /**
   * 创建草稿
   */
  async create(data: Partial<ScheduleDraft>): Promise<ServiceResult<ScheduleDraft>> {
    try {
      const client = getSupabaseClient();
      
      const draftId = data.id || `draft-${Date.now()}`;
      
      const { data: result, error } = await client
        .from('schedule_drafts')
        .insert({
          id: draftId,
          name: data.name,
          semester: data.semester,
          status: data.status || 'draft',
          creator_id: data.creator_id,
          creator_name: data.creator_name,
        })
        .select()
        .single();
      
      if (error) {
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
  async update(id: string, data: Partial<ScheduleDraft>): Promise<ServiceResult<ScheduleDraft>> {
    try {
      const client = getSupabaseClient();
      
      const { data: result, error } = await client
        .from('schedule_drafts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
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
      const client = getSupabaseClient();
      
      // 先删除草稿的课表格子
      await client.from('schedule_slots').delete().eq('draft_id', id);
      
      // 删除草稿
      const { error } = await client
        .from('schedule_drafts')
        .delete()
        .eq('id', id);
      
      if (error) {
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
      const { error: updateError } = await client
        .from('schedule_drafts')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (updateError) {
        return { success: false, error: '更新草稿状态失败', code: 'DATABASE_ERROR' };
      }
      
      // 将草稿的课表复制到正式课表
      const { data: draftSlots } = await client
        .from('schedule_slots')
        .select('*')
        .eq('draft_id', id);
      
      if (draftSlots && draftSlots.length > 0) {
        // 清空正式课表
        await client.from('schedule_slots').delete().is('draft_id', null);
        
        // 插入新数据
        const officialSlots = draftSlots.map(slot => ({
          ...slot,
          id: undefined,
          draft_id: null,
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
  async getDetail(id: string): Promise<ServiceResult<ScheduleDraft & { slots: ScheduleSlot[] }>> {
    try {
      const client = getSupabaseClient();
      
      const { data: draft, error: draftError } = await client
        .from('schedule_drafts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (draftError) {
        return { success: false, error: '草稿不存在', code: 'NOT_FOUND' };
      }
      
      const { data: slots } = await client
        .from('schedule_slots')
        .select('*')
        .eq('draft_id', id);
      
      return {
        success: true,
        data: {
          ...draft,
          slots: slots || [],
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
  async getGradeSchedule(grade: number): Promise<ServiceResult<ScheduleSlot[]>> {
    try {
      const client = getSupabaseClient();
      
      const { data, error } = await client
        .from('schedule_slots')
        .select('*')
        .eq('grade', grade)
        .is('draft_id', null);
      
      if (error) {
        return { success: false, error: '获取年级课表失败', code: 'DATABASE_ERROR' };
      }
      
      return { success: true, data: data || [] };
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
        const { data: busySlots } = await client
          .from('schedule_slots')
          .select('teacher_id')
          .eq('week_day', params.weekDay)
          .eq('period_index', params.periodIndex)
          .is('draft_id', null);
        
        const busyIds = new Set(busySlots?.map(s => s.teacher_id).filter(Boolean) || []);
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
