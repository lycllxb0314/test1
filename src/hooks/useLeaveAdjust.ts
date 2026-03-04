/**
 * 请假调课 Hook
 * 
 * 提供完整的请假调课功能：
 * - 提交请假申请（选择课程、选择审批人）
 * - 获取本周课表（基准课表 + 调课信息）
 * - 年段长处理调课
 * - 工作量统计
 * 
 * @module hooks/useLeaveAdjust
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders, getAccessToken } from '@/lib/auth-client';
import { toast } from 'sonner';
import type {
  LeaveRequest,
  LeaveStatus,
  CourseAdjustment,
  AdjustStatus,
  WeeklySchedule,
  WeeklyScheduleSlot,
  WeeklyScheduleParams,
  SubmitLeaveRequest,
  ProcessAdjustmentRequest,
  TeacherWorkload,
  AffectedSlot,
  ApproverSelection,
} from '@/types/leave-adjust';

// ==================== 类型定义 ====================

/** 请假列表查询参数 */
export interface LeaveQueryParams {
  status?: LeaveStatus;
  applicantId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/** 调课列表查询参数 */
export interface AdjustmentQueryParams {
  status?: AdjustStatus;
  applicantId?: string;
  adjusterId?: string;
  effectiveWeek?: string;
  page?: number;
  pageSize?: number;
}

/** 请假调课 Hook 返回类型 */
export interface UseLeaveAdjustReturn {
  // === 请假申请 ===
  leaveRequests: LeaveRequest[];
  leaveLoading: boolean;
  submitLeaveRequest: (request: SubmitLeaveRequest) => Promise<{ success: boolean; data?: LeaveRequest; error?: string }>;
  cancelLeaveRequest: (id: string) => Promise<boolean>;
  fetchLeaveRequests: (params?: LeaveQueryParams) => Promise<void>;
  
  // === 本周课表 ===
  weeklySchedule: WeeklySchedule | null;
  scheduleLoading: boolean;
  fetchWeeklySchedule: (params?: WeeklyScheduleParams) => Promise<void>;
  getMyWeeklySchedule: (employeeId: string, weekStartDate?: string) => Promise<void>;
  getClassWeeklySchedule: (classId: string, weekStartDate?: string) => Promise<void>;
  
  // === 调课处理 ===
  adjustments: CourseAdjustment[];
  adjustmentLoading: boolean;
  pendingAdjustments: CourseAdjustment[];
  fetchAdjustments: (params?: AdjustmentQueryParams) => Promise<void>;
  fetchPendingAdjustments: () => Promise<void>;
  processAdjustment: (request: ProcessAdjustmentRequest) => Promise<boolean>;
  
  // === 工作量统计 ===
  workloads: TeacherWorkload[];
  workloadLoading: boolean;
  fetchWorkloads: (employeeId: string, params?: { academicYear?: string; semester?: string }) => Promise<void>;
  calculateWeeklyWorkload: (employeeId: string, weekStartDate: string) => Promise<TeacherWorkload | null>;
  
  // === 辅助方法 ===
  getAvailableTeachers: (subject: string, weekDay: number, periodIndex: number, weekStartDate: string) => Promise<{ employeeId: string; name: string; subject: string }[]>;
  getApproverOptions: () => Promise<{ role: string; employeeId: string; name: string }[]>;
  refresh: () => Promise<void>;
}

// ==================== 常量 ====================

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = ['第1节', '第2节', '第3节', '第4节', '第5节', '第6节'];

// 获取本周周一日期
function getWeekMonday(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// 获取周次
function getWeekNumber(mondayDate: string): number {
  const startOfYear = new Date(new Date(mondayDate).getFullYear(), 0, 1);
  const monday = new Date(mondayDate);
  const days = Math.floor((monday.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// ==================== Hook 实现 ====================

export function useLeaveAdjust(): UseLeaveAdjustReturn {
  const { user } = useAuth();
  
  // === Token 就绪状态 ===
  const [tokenReady, setTokenReady] = useState(false);
  
  // === 请假申请状态 ===
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  
  // === 本周课表状态 ===
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  // === 调课状态 ===
  const [adjustments, setAdjustments] = useState<CourseAdjustment[]>([]);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentRefreshKey, setAdjustmentRefreshKey] = useState(0);
  
  // === 工作量状态 ===
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  
  // 引用
  const mountedRef = useRef(true);
  
  // 检查 token 是否就绪
  useEffect(() => {
    const checkToken = () => {
      const token = getAccessToken();
      if (token) {
        setTokenReady(true);
      }
    };
    
    // 立即检查
    checkToken();
    
    // 定期检查（用于处理登录后的情况）
    const interval = setInterval(checkToken, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ==================== 请假申请 ====================
  
  /**
   * 提交请假申请
   */
  const submitLeaveRequest = useCallback(async (request: SubmitLeaveRequest): Promise<{ success: boolean; data?: LeaveRequest; error?: string }> => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          ...request,
          applicantId: user?.employeeId,
          applicantName: user?.name,
          applicantType: 'teacher',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('请假申请已提交');
        return { success: true, data: result.data };
      } else {
        toast.error(result.error || '提交失败');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('提交请假申请失败:', err);
      toast.error('提交失败，请重试');
      return { success: false, error: '网络错误' };
    }
  }, [user]);
  
  /**
   * 取消请假申请
   */
  const cancelLeaveRequest = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('已取消请假申请');
        setLeaveRequests(prev => prev.filter(lr => lr.id !== id));
        return true;
      } else {
        toast.error(result.error || '取消失败');
        return false;
      }
    } catch (err) {
      console.error('取消请假申请失败:', err);
      toast.error('取消失败，请重试');
      return false;
    }
  }, []);
  
  /**
   * 获取请假列表
   */
  const fetchLeaveRequests = useCallback(async (params?: LeaveQueryParams): Promise<void> => {
    setLeaveLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.applicantId) searchParams.append('applicantId', params.applicantId);
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      searchParams.append('page', String(params?.page || 1));
      searchParams.append('pageSize', String(params?.pageSize || 20));
      
      const response = await fetch(`/api/leave-requests?${searchParams.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      
      if (!mountedRef.current) return;
      
      if (result.success) {
        setLeaveRequests(result.data || []);
      }
    } catch (err) {
      console.error('获取请假列表失败:', err);
    } finally {
      if (mountedRef.current) {
        setLeaveLoading(false);
      }
    }
  }, []);

  // ==================== 本周课表 ====================
  
  /**
   * 获取本周课表（通用）
   */
  const fetchWeeklySchedule = useCallback(async (params?: WeeklyScheduleParams): Promise<void> => {
    setScheduleLoading(true);
    try {
      const weekStartDate = params?.weekStartDate || getWeekMonday();
      const searchParams = new URLSearchParams();
      searchParams.append('weekStartDate', weekStartDate);
      if (params?.classId) searchParams.append('classId', params.classId);
      if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
      
      const response = await fetch(`/api/schedule/weekly?${searchParams.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      
      if (!mountedRef.current) return;
      
      if (result.success) {
        // 构建课表矩阵
        const slots = result.data?.slots || [];
        const adjustments = result.data?.adjustments || [];
        
        // 构建 6x5 矩阵
        const scheduleMatrix: (WeeklyScheduleSlot | null)[][] = [];
        for (let period = 0; period < 6; period++) {
          const row: (WeeklyScheduleSlot | null)[] = [];
          for (let day = 0; day < 5; day++) {
            const slot = slots.find((s: WeeklyScheduleSlot) => 
              s.weekDay === day + 1 && s.periodIndex === period
            );
            row.push(slot || null);
          }
          scheduleMatrix.push(row);
        }
        
        setWeeklySchedule({
          weekStartDate,
          weekEndDate: getWeekEndDate(weekStartDate),
          weekNumber: getWeekNumber(weekStartDate),
          scheduleMatrix,
          adjustments,
        });
      }
    } catch (err) {
      console.error('获取本周课表失败:', err);
    } finally {
      if (mountedRef.current) {
        setScheduleLoading(false);
      }
    }
  }, []);
  
  /**
   * 获取我的本周课表
   */
  const getMyWeeklySchedule = useCallback(async (employeeId: string, weekStartDate?: string): Promise<void> => {
    await fetchWeeklySchedule({ employeeId, weekStartDate });
  }, [fetchWeeklySchedule]);
  
  /**
   * 获取班级本周课表
   */
  const getClassWeeklySchedule = useCallback(async (classId: string, weekStartDate?: string): Promise<void> => {
    await fetchWeeklySchedule({ classId, weekStartDate });
  }, [fetchWeeklySchedule]);

  // ==================== 调课处理 ====================
  
  // 调课状态参数
  const [adjustmentParams, setAdjustmentParams] = useState<AdjustmentQueryParams>({ status: 'pending' });
  
  // 使用 useEffect 直接发起调课请求（参考消息中心策略）
  useEffect(() => {
    // 如果没有 token，不发起请求
    if (!tokenReady) {
      return;
    }
    
    let cancelled = false;
    
    const doFetch = async () => {
      setAdjustmentLoading(true);
      
      try {
        const searchParams = new URLSearchParams();
        if (adjustmentParams.status) searchParams.append('status', adjustmentParams.status);
        if (adjustmentParams.applicantId) searchParams.append('applicantId', adjustmentParams.applicantId);
        if (adjustmentParams.adjusterId) searchParams.append('adjusterId', adjustmentParams.adjusterId);
        if (adjustmentParams.effectiveWeek) searchParams.append('effectiveWeek', adjustmentParams.effectiveWeek);
        
        const response = await fetch(`/api/course-adjustments/process?${searchParams.toString()}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        
        if (cancelled) return;
        
        const result = await response.json();
        
        if (!cancelled) {
          if (result.success) {
            setAdjustments(result.data || []);
          } else {
            setAdjustments([]);
          }
          setAdjustmentLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('获取调课列表失败:', err);
          setAdjustments([]);
          setAdjustmentLoading(false);
        }
      }
    };
    
    doFetch();
    
    return () => {
      cancelled = true;
    };
  }, [tokenReady, adjustmentParams.status, adjustmentParams.applicantId, adjustmentParams.adjusterId, adjustmentParams.effectiveWeek, adjustmentRefreshKey]);
  
  // 手动刷新调课列表
  const refreshAdjustments = useCallback(() => {
    setAdjustmentRefreshKey(k => k + 1);
  }, []);
  
  /**
   * 获取调课列表
   */
  const fetchAdjustments = useCallback(async (params?: AdjustmentQueryParams): Promise<void> => {
    if (params) {
      setAdjustmentParams(params);
    } else {
      refreshAdjustments();
    }
  }, [refreshAdjustments]);
  
  /**
   * 获取待处理的调课（年段长使用）
   */
  const fetchPendingAdjustments = useCallback(async (): Promise<void> => {
    setAdjustmentParams({ status: 'pending' });
  }, []);
  
  /**
   * 处理调课（年段长使用）
   */
  const processAdjustment = useCallback(async (request: ProcessAdjustmentRequest): Promise<boolean> => {
    try {
      const response = await fetch('/api/course-adjustments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          ...request,
          adjusterId: user?.employeeId,
          adjusterName: user?.name,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('调课处理成功');
        // 刷新调课列表
        refreshAdjustments();
        return true;
      } else {
        toast.error(result.error || '处理失败');
        return false;
      }
    } catch (err) {
      console.error('处理调课失败:', err);
      toast.error('处理失败，请重试');
      return false;
    }
  }, [user, refreshAdjustments]);

  // ==================== 工作量统计 ====================
  
  /**
   * 获取工作量统计
   */
  const fetchWorkloads = useCallback(async (
    employeeId: string, 
    params?: { academicYear?: string; semester?: string }
  ): Promise<void> => {
    setWorkloadLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('employeeId', employeeId);
      if (params?.academicYear) searchParams.append('academicYear', params.academicYear);
      if (params?.semester) searchParams.append('semester', params.semester);
      
      const response = await fetch(`/api/teacher-workload?${searchParams.toString()}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      
      if (!mountedRef.current) return;
      
      if (result.success) {
        setWorkloads(result.data || []);
      }
    } catch (err) {
      console.error('获取工作量统计失败:', err);
    } finally {
      if (mountedRef.current) {
        setWorkloadLoading(false);
      }
    }
  }, []);
  
  /**
   * 计算某周工作量
   */
  const calculateWeeklyWorkload = useCallback(async (
    employeeId: string, 
    weekStartDate: string
  ): Promise<TeacherWorkload | null> => {
    try {
      const response = await fetch(
        `/api/teacher-workload/calculate?employeeId=${employeeId}&weekStartDate=${weekStartDate}`,
        {
          credentials: 'include',
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();
      
      return result.success ? result.data : null;
    } catch (err) {
      console.error('计算工作量失败:', err);
      return null;
    }
  }, []);

  // ==================== 辅助方法 ====================
  
  /**
   * 获取可用教师（某时段无课的教师）
   */
  const getAvailableTeachers = useCallback(async (
    subject: string, 
    weekDay: number, 
    periodIndex: number, 
    weekStartDate: string
  ): Promise<{ employeeId: string; name: string; subject: string }[]> => {
    try {
      const response = await fetch(
        `/api/teachers/available?subject=${subject}&weekDay=${weekDay}&periodIndex=${periodIndex}&weekStartDate=${weekStartDate}`,
        {
          credentials: 'include',
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();
      
      return result.success ? result.data : [];
    } catch (err) {
      console.error('获取可用教师失败:', err);
      return [];
    }
  }, []);
  
  /**
   * 获取审批人选项（校长室领导）
   */
  const getApproverOptions = useCallback(async (): Promise<{ role: string; employeeId: string; name: string }[]> => {
    try {
      const response = await fetch('/api/users/approvers', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      
      return result.success ? result.data : [];
    } catch (err) {
      console.error('获取审批人选项失败:', err);
      return [];
    }
  }, []);
  
  /**
   * 刷新所有数据
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (user?.employeeId) {
      await Promise.all([
        fetchLeaveRequests({ applicantId: user.employeeId }),
        getMyWeeklySchedule(user.employeeId),
      ]);
    }
  }, [user, fetchLeaveRequests, getMyWeeklySchedule]);

  return {
    // 请假申请
    leaveRequests,
    leaveLoading,
    submitLeaveRequest,
    cancelLeaveRequest,
    fetchLeaveRequests,
    
    // 本周课表
    weeklySchedule,
    scheduleLoading,
    fetchWeeklySchedule,
    getMyWeeklySchedule,
    getClassWeeklySchedule,
    
    // 调课处理
    adjustments,
    adjustmentLoading,
    pendingAdjustments: adjustments.filter(a => a.status === 'pending'),
    fetchAdjustments,
    fetchPendingAdjustments,
    processAdjustment,
    
    // 工作量统计
    workloads,
    workloadLoading,
    fetchWorkloads,
    calculateWeeklyWorkload,
    
    // 辅助方法
    getAvailableTeachers,
    getApproverOptions,
    refresh,
  };
}

// 辅助函数：获取周五日期
function getWeekEndDate(mondayDate: string): string {
  const monday = new Date(mondayDate);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday.toISOString().split('T')[0];
}

// 导出辅助函数
export { getWeekMonday, getWeekNumber, WEEKDAYS, PERIODS };
