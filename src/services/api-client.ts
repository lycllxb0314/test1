/**
 * 统一API客户端
 * 
 * 设计原则：
 * 1. 单一入口 - 所有API调用通过此客户端
 * 2. 类型安全 - 完整的TypeScript类型支持
 * 3. 响应统一 - 标准化的响应格式
 * 4. 错误处理 - 统一的错误处理机制
 */

import type {
  User,
  Teacher,
  Student,
  StudentFullProfile,
  TeacherProfile,
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
  LeaveRequest,
  ScheduleChange,
  ExpenseReimbursement,
  ExpenseStatistics,
} from '@/types';

// ============================================
// 核心类型定义
// ============================================

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  /** 分页信息（列表接口） */
  pagination?: Pagination;
  /** 数据来源 */
  source?: 'database' | 'mock';
}

/**
 * 分页信息
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 分页响应（列表数据）
 */
export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pagination?: Pagination;
}

/** @deprecated 使用 PaginatedData 代替 */
export type PaginatedResponse<T> = PaginatedData<T>;

/**
 * 查询参数
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 请求配置
 */
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
}

// ============================================
// API客户端类
// ============================================

class ApiClient {
  private baseUrl: string = '/api';
  private defaultPageSize: number = 20;

  /**
   * 发起请求
   */
  private async request<T>(path: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    
    // 添加查询参数
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络请求失败',
      };
    }
  }

  /**
   * GET请求
   */
  async get<T>(path: string, params?: QueryParams): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', params });
  }

  /**
   * POST请求
   */
  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body });
  }

  /**
   * PUT请求
   */
  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  /**
   * PATCH请求
   */
  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  /**
   * DELETE请求
   */
  async delete<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE', body });
  }
}

// 导出单例
export const apiClient = new ApiClient();

// ============================================
// 领域API模块
// ============================================

/**
 * 认证API
 */
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<User>('/auth/login', { username, password }),
  
  getCurrentUser: () =>
    apiClient.get<User>('/auth/current'),
  
  logout: () => {
    localStorage.removeItem('smart_campus_user');
    return Promise.resolve({ success: true });
  },
} as const;

/**
 * 教师API
 */
export const teacherApi = {
  /** 获取教师列表 */
  list: (params?: QueryParams) =>
    apiClient.get<Teacher[]>('/teachers', params),
  
  /** 获取教师详情 */
  get: (id: string) =>
    apiClient.get<Teacher>(`/teachers/${id}`),
  
  /** 获取教师完整档案 */
  getFullProfile: (id: string) =>
    apiClient.get<TeacherProfile>(`/teachers/${id}/full-profile`),
  
  /** 创建教师 */
  create: (data: Partial<Teacher>) =>
    apiClient.post<Teacher>('/teachers', data),
  
  /** 更新教师 */
  update: (id: string, data: Partial<Teacher>) =>
    apiClient.put<Teacher>(`/teachers/${id}`, data),
  
  /** 删除教师 */
  delete: (id: string) =>
    apiClient.delete(`/teachers/${id}`),
  
  /** 批量更新 */
  batchUpdate: (ids: string[], data: Partial<Teacher>) =>
    apiClient.put('/teachers/batch-update', { ids, data }),
  
  /** 批量删除 */
  batchDelete: (ids: string[]) =>
    apiClient.delete('/teachers/batch-delete', { ids }),
} as const;

/**
 * 学生API
 */
export const studentApi = {
  /** 获取学生列表 */
  list: (params?: QueryParams) =>
    apiClient.get<Student[]>('/students', params),
  
  /** 获取学生详情 */
  get: (id: string) =>
    apiClient.get<Student>(`/students/${id}`),
  
  /** 获取学生完整档案 */
  getFullProfile: (id: string) =>
    apiClient.get<StudentFullProfile>(`/students/${id}/full-profile`),
  
  /** 获取学生习惯档案 */
  getHabitProfile: (id: string) =>
    apiClient.get<StudentHabitProfile>(`/students/${id}/habit-profile`),
  
  /** 创建学生 */
  create: (data: Partial<Student>) =>
    apiClient.post<Student>('/students', data),
  
  /** 更新学生 */
  update: (id: string, data: Partial<Student>) =>
    apiClient.put<Student>(`/students/${id}`, data),
  
  /** 删除学生 */
  delete: (id: string) =>
    apiClient.delete(`/students/${id}`),
  
  /** 批量更新 */
  batchUpdate: (ids: string[], data: Partial<Student>) =>
    apiClient.put('/students/batch-update', { ids, data }),
  
  /** 批量删除 */
  batchDelete: (ids: string[]) =>
    apiClient.delete('/students/batch-delete', { ids }),
} as const;

/**
 * 班级API
 */
export const classApi = {
  /** 获取班级列表 */
  list: (params?: QueryParams) =>
    apiClient.get<ClassInfo[]>('/classes', params),
  
  /** 获取班级详情 */
  get: (id: string) =>
    apiClient.get<ClassInfo>(`/classes/${id}`),
  
  /** 获取班级学生 */
  getStudents: (classId: string) =>
    apiClient.get<Student[]>(`/classes/${classId}/students`),
  
  /** 获取班级习惯统计 */
  getHabitStats: (classId: string, month: string) =>
    apiClient.get<ClassHabitStats>(`/classes/${classId}/habit-stats`, { month }),
} as const;

/**
 * 请假申请API
 */
export const leaveRequestApi = {
  list: (params?: QueryParams) =>
    apiClient.get<LeaveRequest[]>('/leave-requests', params),
  
  get: (id: string) =>
    apiClient.get<LeaveRequest>(`/leave-requests/${id}`),
  
  create: (data: Partial<LeaveRequest>) =>
    apiClient.post<LeaveRequest>('/leave-requests', data),
  
  update: (id: string, data: Partial<LeaveRequest>) =>
    apiClient.put<LeaveRequest>(`/leave-requests/${id}`, data),
} as const;

/**
 * 调课申请API
 */
export const scheduleChangeApi = {
  list: (params?: QueryParams) =>
    apiClient.get<ScheduleChange[]>('/schedule-changes', params),
  
  create: (data: Partial<ScheduleChange>) =>
    apiClient.post<ScheduleChange>('/schedule-changes', data),
  
  update: (id: string, data: Partial<ScheduleChange>) =>
    apiClient.put<ScheduleChange>(`/schedule-changes/${id}`, data),
} as const;

/**
 * 工作流API
 */
export const workflowApi = {
  /** 获取流程配置列表 */
  getConfigs: (type?: string) =>
    apiClient.get<WorkflowConfig[]>('/workflow/config', { type }),
  
  /** 获取流程配置详情 */
  getConfig: (id: string) =>
    apiClient.get<WorkflowConfig>(`/workflow/config/${id}`),
  
  /** 保存流程配置 */
  saveConfig: (data: Partial<WorkflowConfig>) =>
    apiClient.post<WorkflowConfig>('/workflow/config', data),
  
  /** 删除流程配置 */
  deleteConfig: (id: string) =>
    apiClient.delete(`/workflow/config?id=${id}`),
  
  /** 获取流程实例列表 */
  getInstances: (params?: QueryParams) =>
    apiClient.get<WorkflowInstance[]>('/workflow/instances', params),
  
  /** 获取流程实例详情 */
  getInstance: (id: string) =>
    apiClient.get<WorkflowInstance>(`/workflow/instances/${id}`),
  
  /** 创建流程实例 */
  createInstance: (data: Partial<WorkflowInstance>) =>
    apiClient.post<WorkflowInstance>('/workflow/instances', data),
  
  /** 审批流程 */
  approve: (instanceId: string, nodeId: string, approved: boolean, comment?: string) =>
    apiClient.put<WorkflowInstance>(`/workflow/instances/${instanceId}/approve`, { nodeId, approved, comment }),
} as const;

/**
 * 习惯养成API
 */
export const habitApi = {
  /** 获取习惯目标列表 */
  getGoals: (params?: QueryParams) =>
    apiClient.get<HabitGoal[]>('/habit/goals', params),
  
  /** 获取学生月度目标 */
  getMonthlyGoals: (studentId: string, month?: string) =>
    apiClient.get<StudentMonthlyGoal[]>(`/habit/goals`, { studentId, month }),
  
  /** 获取习惯评价记录 */
  getAssessments: (params?: QueryParams) =>
    apiClient.get<HabitAssessment[]>('/habit/assessments', params),
  
  /** 创建习惯评价 */
  createAssessment: (data: Partial<HabitAssessment>) =>
    apiClient.post<HabitAssessment>('/habit/assessments', data),
  
  /** 获取习惯之星 */
  getStars: (month?: string) =>
    apiClient.get<HabitStar[]>('/habit/stars', { month }),
  
  /** 获取学校习惯统计 */
  getSchoolStats: (month: string) =>
    apiClient.get('/habit/stats/school', { month }),
} as const;

/**
 * 教研API
 */
export const researchApi = {
  /** 获取教研活动列表 */
  getActivities: (params?: QueryParams) =>
    apiClient.get<ResearchActivity[]>('/research/activities', params),
  
  /** 获取集体备课列表 */
  getPreparations: (params?: QueryParams) =>
    apiClient.get<CollectivePreparation[]>('/research/preparations', params),
  
  /** 获取听课评课记录 */
  getObservations: (params?: QueryParams) =>
    apiClient.get<LessonObservation[]>('/research/observations', params),
  
  /** 获取教师教研档案 */
  getTeacherProfile: (teacherId: string) =>
    apiClient.get<TeacherResearchProfile>(`/teachers/${teacherId}/profile`),
} as const;

/**
 * 场地API
 */
export const roomApi = {
  /** 获取场地列表 */
  list: (params?: QueryParams) =>
    apiClient.get<Room[]>('/rooms', params),
  
  /** 获取场地详情 */
  get: (id: string) =>
    apiClient.get<Room>(`/rooms/${id}`),
  
  /** 获取预约列表 */
  getBookings: (params?: QueryParams) =>
    apiClient.get<RoomBooking[]>('/rooms/bookings', params),
  
  /** 创建预约 */
  createBooking: (data: Partial<RoomBooking>) =>
    apiClient.post<RoomBooking>('/rooms/bookings', data),
  
  /** 审批预约 */
  approveBooking: (id: string, approved: boolean, comment?: string) =>
    apiClient.put<RoomBooking>(`/rooms/bookings/${id}/approve`, { approved, comment }),
} as const;

/**
 * 门禁API
 */
export const accessApi = {
  /** 获取人员列表 */
  getPersons: (params?: QueryParams) =>
    apiClient.get<AccessPerson[]>('/access/persons', params),
  
  /** 获取通行记录 */
  getRecords: (params?: QueryParams) =>
    apiClient.get<AccessRecord[]>('/access/records', params),
  
  /** 获取统计数据 */
  getStatistics: (date: string) =>
    apiClient.get('/access/statistics', { date }),
} as const;

/**
 * 报销API
 */
export const expenseApi = {
  /** 获取报销列表 */
  list: (params?: QueryParams) =>
    apiClient.get<ExpenseReimbursement[]>('/expenses', params),
  
  /** 获取报销详情 */
  get: (id: string) =>
    apiClient.get<ExpenseReimbursement>(`/expenses/${id}`),
  
  /** 创建报销申请 */
  create: (data: Partial<ExpenseReimbursement>) =>
    apiClient.post<ExpenseReimbursement>('/expenses', data),
  
  /** 更新报销申请 */
  update: (id: string, data: Partial<ExpenseReimbursement>) =>
    apiClient.put<ExpenseReimbursement>(`/expenses/${id}`, data),
  
  /** 提交报销申请（从草稿变为待审批） */
  submit: (id: string) =>
    apiClient.put<ExpenseReimbursement>(`/expenses/${id}/submit`, {}),
  
  /** 审批报销 */
  approve: (id: string, approved: boolean, comment?: string) =>
    apiClient.post<ExpenseReimbursement>(`/expenses/${id}/approve`, { approved, comment }),
  
  /** 财务处理（打款） */
  process: (id: string, data: { paymentDate: string; paymentVoucher?: string; remark?: string }) =>
    apiClient.post<ExpenseReimbursement>(`/expenses/${id}/process`, { action: 'process', ...data }),
  
  /** 取消报销 */
  cancel: (id: string, reason?: string) =>
    apiClient.put<ExpenseReimbursement>(`/expenses/${id}/cancel`, { reason }),
  
  /** 删除报销（仅草稿可删除） */
  delete: (id: string) =>
    apiClient.delete(`/expenses/${id}`),
  
  /** 获取报销统计 */
  getStatistics: () =>
    apiClient.get<ExpenseStatistics>('/expenses/statistics'),
} as const;

/**
 * 新生注册API
 */
export const enrollmentApi = {
  /** 获取申请列表 */
  list: (params?: QueryParams) =>
    apiClient.get('/enrollment', params),
  
  /** 提交申请 */
  submit: (data: unknown) =>
    apiClient.post('/enrollment', data),
  
  /** 审核/同步操作 */
  update: (id: string, action: string, data?: Record<string, unknown>) =>
    apiClient.put('/enrollment', { id, action, ...(data || {}) }),
  
  /** 批量同步 */
  batchSync: (ids: string[]) =>
    apiClient.delete('/enrollment', { ids }),
} as const;

// ============================================
// 导出所有API模块
// ============================================

export const api = {
  auth: authApi,
  teacher: teacherApi,
  student: studentApi,
  class: classApi,
  leaveRequest: leaveRequestApi,
  scheduleChange: scheduleChangeApi,
  workflow: workflowApi,
  habit: habitApi,
  research: researchApi,
  room: roomApi,
  access: accessApi,
  expense: expenseApi,
  enrollment: enrollmentApi,
} as const;

export default api;
