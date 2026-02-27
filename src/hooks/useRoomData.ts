import { useState, useEffect, useCallback } from 'react';

/**
 * 教室管理数据获取 Hook
 */

// 教室类型
export type RoomType = 
  | 'classroom' | 'seminar_room' | 'lecture_hall' 
  | 'lab' | 'computer_room' | 'music_room' 
  | 'art_room' | 'conference_room' | 'other';

// 教室状态
export type RoomStatus = 'available' | 'in_use' | 'maintenance' | 'reserved';

// 教室设施
export interface RoomFacilities {
  projector?: boolean;
  computer?: boolean;
  microphone?: boolean;
  speaker?: boolean;
  whiteboard?: boolean;
  blackboard?: boolean;
  airConditioner?: boolean;
  wifi?: boolean;
  videoConference?: boolean;
  recording?: boolean;
}

// 教室信息
export interface Room {
  id: string;
  name: string;
  code: string;
  type: RoomType;
  building: string;
  floor: number;
  location: string;
  capacity: number;
  area: number;
  facilities: RoomFacilities;
  status: RoomStatus;
  managerId?: string;
  managerName?: string;
  description?: string;
  notes?: string;
}

// 教室预约状态
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

// 教室预约
export interface RoomBooking {
  id: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  roomType: RoomType;
  building: string;
  location: string;
  applicantId: string;
  applicantName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  attendeesCount: number;
  facilitiesNeeded: string[];
  notes?: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// 时间段占用情况
export interface TimeSlot {
  time: string;
  isOccupied: boolean;
  booking?: RoomBooking;
}

/**
 * 获取教室列表
 */
export function useRooms(filters?: {
  type?: RoomType;
  status?: RoomStatus;
  building?: string;
}) {
  const [data, setData] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.building) params.append('building', filters.building);
      
      const response = await fetch(`/api/rooms?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.status, filters?.building]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 获取教室预约列表
 */
export function useRoomBookings(filters?: {
  roomId?: string;
  applicantId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.roomId) params.append('roomId', filters.roomId);
      if (filters?.applicantId) params.append('applicantId', filters.applicantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/rooms/bookings?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch room bookings:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.roomId, filters?.applicantId, filters?.status, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * 创建教室预约
 */
export async function createRoomBooking(booking: {
  roomId: string;
  applicantId: string;
  applicantName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeesCount: number;
  facilitiesNeeded?: string[];
  notes?: string;
}) {
  const response = await fetch('/api/rooms/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  return response.json();
}

/**
 * 审批教室预约
 */
export async function approveRoomBooking(
  id: string,
  action: 'approve' | 'reject' | 'cancel',
  approverId: string,
  approverName: string,
  rejectionReason?: string
) {
  const response = await fetch('/api/rooms/bookings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      action,
      approverId,
      approverName,
      rejectionReason,
    }),
  });
  return response.json();
}

/**
 * 获取教室日历数据
 */
export function useRoomCalendar(roomId: string, startDate: string, endDate: string) {
  const [data, setData] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!roomId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('roomId', roomId);
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const response = await fetch(`/api/rooms/bookings?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        setError(null);
      } else {
        setError(result.error || '获取数据失败');
        setData([]);
      }
    } catch (err) {
      console.error('Failed to fetch room calendar:', err);
      setError('网络错误');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [roomId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
