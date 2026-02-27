/**
 * 统一API客户端
 * 封装所有后端API调用，提供类型安全的接口
 */

import type {
  User,
  Teacher,
  Student,
  ClassInfo,
  WorkflowConfig,
  WorkflowInstance,
  Room,
  RoomBooking,
  HabitGoal,
  StudentMonthlyGoal,
  HabitAssessment,
  HabitStar,
  StudentHabitProfile,
  ClassHabitStats,
  ResearchActivity,
  CollectivePreparation,
  LessonObservation,
  TeacherResearchProfile,
  AccessPerson,
  AccessRecord,
} from '@/types';

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 查询参数
export interface QueryParams extends PaginationParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * 基础API请求方法
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * GET请求
   */
  async get<T>(path: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }

  /**
   * POST请求
   */
  async post<T>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  /**
   * PUT请求
   */
  async put<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  /**
   * DELETE请求
   */
  async delete<T>(path: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }
}

// 导出单例
export const apiClient = new ApiClient();

/**
 * 用户相关API
 */
export const userApi = {
  // 获取当前用户信息
  getCurrentUser: () => 
    apiClient.get<User>('/user/current'),

  // 获取用户列表
  getUsers: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<User>>('/users', params),

  // 获取用户权限
  getUserPermissions: (userId: string) => 
    apiClient.get<string[]>(`/user/${userId}/permissions`),
};

/**
 * 教师相关API
 */
export const teacherApi = {
  // 获取教师列表
  getTeachers: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<Teacher>>('/teachers', params),

  // 获取教师详情
  getTeacher: (id: string) => 
    apiClient.get<Teacher>(`/teachers/${id}`),

  // 获取教师档案（含教研数据）
  getTeacherProfile: (id: string) => 
    apiClient.get<TeacherResearchProfile>(`/teachers/${id}/profile`),

  // 更新教师信息
  updateTeacher: (id: string, data: Partial<Teacher>) => 
    apiClient.put<Teacher>(`/teachers/${id}`, data),

  // 获取教师的教研活动
  getTeacherActivities: (teacherId: string, params?: QueryParams) => 
    apiClient.get<PaginatedResponse<ResearchActivity>>(`/teachers/${teacherId}/activities`, params),

  // 获取教师的听课评课记录
  getTeacherObservations: (teacherId: string, params?: QueryParams) => 
    apiClient.get<PaginatedResponse<LessonObservation>>(`/teachers/${teacherId}/observations`, params),

  // 获取教师的课表
  getTeacherSchedule: (teacherId: string, week?: string) => 
    apiClient.get<unknown[]>(`/teachers/${teacherId}/schedule`, { week }),
};

/**
 * 学生相关API
 */
export const studentApi = {
  // 获取学生列表
  getStudents: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<Student>>('/students', params),

  // 获取学生详情
  getStudent: (id: string) => 
    apiClient.get<Student>(`/students/${id}`),

  // 获取学生习惯档案
  getStudentHabitProfile: (id: string) => 
    apiClient.get<StudentHabitProfile>(`/students/${id}/habit-profile`),

  // 获取学生月度小目标
  getStudentMonthlyGoals: (studentId: string, month?: string) => 
    apiClient.get<StudentMonthlyGoal[]>(`/students/${studentId}/monthly-goals`, { month }),

  // 获取学生习惯评价记录
  getStudentAssessments: (studentId: string, params?: QueryParams) => 
    apiClient.get<PaginatedResponse<HabitAssessment>>(`/students/${studentId}/assessments`, params),

  // 获取学生习惯之星记录
  getStudentStars: (studentId: string) => 
    apiClient.get<HabitStar[]>(`/students/${studentId}/stars`),
};

/**
 * 班级相关API
 */
export const classApi = {
  // 获取班级列表
  getClasses: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<ClassInfo>>('/classes', params),

  // 获取班级详情
  getClass: (id: string) => 
    apiClient.get<ClassInfo>(`/classes/${id}`),

  // 获取班级学生
  getClassStudents: (classId: string) => 
    apiClient.get<Student[]>(`/classes/${classId}/students`),

  // 获取班级习惯统计
  getClassHabitStats: (classId: string, month: string) => 
    apiClient.get<ClassHabitStats>(`/classes/${classId}/habit-stats`, { month }),

  // 获取班级课表
  getClassSchedule: (classId: string, week?: string) => 
    apiClient.get<unknown[]>(`/classes/${classId}/schedule`, { week }),
};

/**
 * 工作流相关API
 */
export const workflowApi = {
  // 获取流程配置列表
  getConfigs: (type?: string) => 
    apiClient.get<WorkflowConfig[]>('/workflow/config', { type }),

  // 获取流程配置详情
  getConfig: (id: string) => 
    apiClient.get<WorkflowConfig>(`/workflow/config/${id}`),

  // 创建或更新流程配置
  saveConfig: (data: Partial<WorkflowConfig>) => 
    apiClient.post<WorkflowConfig>('/workflow/config', data),

  // 删除流程配置
  deleteConfig: (id: string) => 
    apiClient.delete(`/workflow/config?id=${id}`),

  // 获取流程实例列表
  getInstances: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<WorkflowInstance>>('/workflow/instances', params),

  // 获取流程实例详情
  getInstance: (id: string) => 
    apiClient.get<WorkflowInstance>(`/workflow/instances/${id}`),

  // 创建流程实例（发起申请）
  createInstance: (data: Partial<WorkflowInstance>) => 
    apiClient.post<WorkflowInstance>('/workflow/instances', data),

  // 审批操作
  approve: (instanceId: string, data: { action: string; comment?: string }) => 
    apiClient.post(`/workflow/instances/${instanceId}/approve`, data),

  // 撤回申请
  withdraw: (instanceId: string) => 
    apiClient.post(`/workflow/instances/${instanceId}/withdraw`),
};

/**
 * 教室管理相关API
 */
export const roomApi = {
  // 获取教室列表
  getRooms: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<Room>>('/rooms', params),

  // 获取教室详情
  getRoom: (id: string) => 
    apiClient.get<Room>(`/rooms/${id}`),

  // 获取教室预约列表
  getBookings: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<RoomBooking>>('/rooms/bookings', params),

  // 获取教室预约详情
  getBooking: (id: string) => 
    apiClient.get<RoomBooking>(`/rooms/bookings/${id}`),

  // 创建预约申请
  createBooking: (data: Partial<RoomBooking>) => 
    apiClient.post<RoomBooking>('/rooms/bookings', data),

  // 审批预约
  approveBooking: (bookingId: string, data: { action: 'approve' | 'reject'; comment?: string }) => 
    apiClient.post(`/rooms/bookings/${bookingId}/approve`, data),

  // 取消预约
  cancelBooking: (bookingId: string, reason: string) => 
    apiClient.post(`/rooms/bookings/${bookingId}/cancel`, { reason }),

  // 检查教室可用性
  checkAvailability: (roomId: string, date: string, startTime: string, endTime: string) => 
    apiClient.get<boolean>('/rooms/check-availability', { roomId, date, startTime, endTime }),

  // 获取教室使用统计
  getRoomUsageStats: (roomId: string, params?: QueryParams) => 
    apiClient.get<unknown>(`/rooms/${roomId}/usage-stats`, params),
};

/**
 * 习惯养成相关API
 */
export const habitApi = {
  // 获取习惯目标列表
  getGoals: (params?: { category?: string; gradeLevel?: string }) => 
    apiClient.get<HabitGoal[]>('/habit/goals', params),

  // 获取习惯目标详情
  getGoal: (id: string) => 
    apiClient.get<HabitGoal>(`/habit/goals/${id}`),

  // 创建月度小目标
  createMonthlyGoal: (data: Partial<StudentMonthlyGoal>) => 
    apiClient.post<StudentMonthlyGoal>('/habit/monthly-goals', data),

  // 更新月度小目标
  updateMonthlyGoal: (id: string, data: Partial<StudentMonthlyGoal>) => 
    apiClient.put<StudentMonthlyGoal>(`/habit/monthly-goals/${id}`, data),

  // 创建习惯评价记录
  createAssessment: (data: Partial<HabitAssessment>) => 
    apiClient.post<HabitAssessment>('/habit/assessments', data),

  // 获取习惯之星列表
  getStars: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<HabitStar>>('/habit/stars', params),

  // 评选习惯之星
  createStar: (data: Partial<HabitStar>) => 
    apiClient.post<HabitStar>('/habit/stars', data),

  // 获取班级习惯统计
  getClassStats: (classId: string, month: string) => 
    apiClient.get<ClassHabitStats>(`/habit/stats/class/${classId}`, { month }),

  // 获取年级习惯统计
  getGradeStats: (grade: number, month: string) => 
    apiClient.get<unknown>(`/habit/stats/grade/${grade}`, { month }),

  // 获取全校习惯统计
  getSchoolStats: (month: string) => 
    apiClient.get<unknown>('/habit/stats/school', { month }),
};

/**
 * 教研活动相关API
 */
export const researchApi = {
  // 获取教研活动列表
  getActivities: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<ResearchActivity>>('/research/activities', params),

  // 获取教研活动详情
  getActivity: (id: string) => 
    apiClient.get<ResearchActivity>(`/research/activities/${id}`),

  // 创建教研活动
  createActivity: (data: Partial<ResearchActivity>) => 
    apiClient.post<ResearchActivity>('/research/activities', data),

  // 更新教研活动
  updateActivity: (id: string, data: Partial<ResearchActivity>) => 
    apiClient.put<ResearchActivity>(`/research/activities/${id}`, data),

  // 获取集体备课列表
  getPreparations: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<CollectivePreparation>>('/research/preparations', params),

  // 获取备课详情
  getPreparation: (id: string) => 
    apiClient.get<CollectivePreparation>(`/research/preparations/${id}`),

  // 创建集体备课
  createPreparation: (data: Partial<CollectivePreparation>) => 
    apiClient.post<CollectivePreparation>('/research/preparations', data),

  // 添加备课讨论
  addPreparationDiscussion: (preparationId: string, data: { content: string; topic?: string }) => 
    apiClient.post(`/research/preparations/${preparationId}/discussions`, data),

  // 获取听课评课列表
  getObservations: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<LessonObservation>>('/research/observations', params),

  // 获取听课详情
  getObservation: (id: string) => 
    apiClient.get<LessonObservation>(`/research/observations/${id}`),

  // 创建听课评课
  createObservation: (data: Partial<LessonObservation>) => 
    apiClient.post<LessonObservation>('/research/observations', data),

  // 提交听课评价
  submitObservationEvaluation: (id: string, data: unknown) => 
    apiClient.post(`/research/observations/${id}/evaluate`, data),
};

/**
 * 门禁管理相关API
 */
export const accessApi = {
  // 获取人员列表
  getPersons: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<AccessPerson>>('/access/persons', params),

  // 获取人员详情
  getPerson: (id: string) => 
    apiClient.get<AccessPerson>(`/access/persons/${id}`),

  // 获取通行记录
  getRecords: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<AccessRecord>>('/access/records', params),

  // 获取今日统计
  getTodayStats: () => 
    apiClient.get<unknown>('/access/stats/today'),

  // 获取异常记录
  getAbnormalRecords: (params?: QueryParams) => 
    apiClient.get<PaginatedResponse<AccessRecord>>('/access/records/abnormal', params),
};

/**
 * 数据关联服务API
 */
export const dataLinkApi = {
  // 请假通过后触发调课
  triggerScheduleAdjustment: (leaveInstanceId: string) => 
    apiClient.post('/data-link/leave-to-schedule', { leaveInstanceId }),

  // 调课完成后同步课表
  syncScheduleAfterAdjustment: (adjustmentId: string) => 
    apiClient.post('/data-link/sync-schedule', { adjustmentId }),

  // 教室预约关联维修申请
  linkBookingToMaintenance: (bookingId: string, maintenanceId: string) => 
    apiClient.post('/data-link/booking-maintenance', { bookingId, maintenanceId }),

  // 学生习惯数据同步到学生档案
  syncStudentHabitData: (studentId: string) => 
    apiClient.post('/data-link/sync-student-habit', { studentId }),

  // 教师教研数据同步到教师档案
  syncTeacherResearchData: (teacherId: string) => 
    apiClient.post('/data-link/sync-teacher-research', { teacherId }),

  // 班级习惯统计更新
  updateClassHabitStats: (classId: string, month: string) => 
    apiClient.post('/data-link/update-class-stats', { classId, month }),
};
