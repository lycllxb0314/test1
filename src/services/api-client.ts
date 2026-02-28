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
  HabitRecord,
  HabitEvaluation,
  HabitStatistics,
  HabitTrend,
  HabitCategory,
  StudentMonthlyGoal,
  HabitAssessment,
  HabitStar,
  StudentHabitProfile,
  ClassHabitStats,
  SchoolHabitStatsResponse,
  HabitGoalTemplate,
  HabitStarRule,
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
  MoralActivity,
  MoralEvaluation,
  StudentHonor,
  WarningStudent,
  MoralStatistics,
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
  // ============================================
  // 习惯记录管理
  // ============================================
  
  /** 获取习惯记录列表 */
  getRecords: (params?: QueryParams & {
    studentId?: string;
    classId?: string;
    category?: HabitCategory;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get<HabitRecord[]>('/moral/habit/records', params),
  
  /** 获取单条习惯记录 */
  getRecord: (id: string) =>
    apiClient.get<HabitRecord>(`/moral/habit/records/${id}`),
  
  /** 创建习惯记录 */
  createRecord: (data: Partial<HabitRecord>) =>
    apiClient.post<HabitRecord>('/moral/habit/records', data),
  
  /** 更新习惯记录 */
  updateRecord: (id: string, data: Partial<HabitRecord>) =>
    apiClient.put<HabitRecord>(`/moral/habit/records/${id}`, data),
  
  /** 删除习惯记录 */
  deleteRecord: (id: string) =>
    apiClient.delete(`/moral/habit/records/${id}`),
  
  // ============================================
  // 习惯评价管理
  // ============================================
  
  /** 获取习惯评价记录 */
  getEvaluations: (params?: QueryParams & {
    studentId?: string;
    classId?: string;
    teacherId?: string;
    category?: HabitCategory;
    academicYear?: string;
    semester?: string;
  }) =>
    apiClient.get<HabitEvaluation[]>('/moral/habit/evaluations', params),
  
  /** 创建习惯评价 */
  createEvaluation: (data: Partial<HabitEvaluation>) =>
    apiClient.post<HabitEvaluation>('/moral/habit/evaluations', data),
  
  /** 更新习惯评价 */
  updateEvaluation: (id: string, data: Partial<HabitEvaluation>) =>
    apiClient.put<HabitEvaluation>(`/moral/habit/evaluations/${id}`, data),
  
  /** 删除习惯评价 */
  deleteEvaluation: (id: string) =>
    apiClient.delete(`/moral/habit/evaluations/${id}`),
  
  // ============================================
  // 学生习惯统计
  // ============================================
  
  /** 获取学生习惯统计 */
  getStudentStatistics: (studentId: string) =>
    apiClient.get<HabitStatistics>(`/moral/habit/statistics/${studentId}`),
  
  /** 获取学生习惯趋势 */
  getStudentTrend: (studentId: string, months?: number) =>
    apiClient.get<HabitTrend>(`/moral/habit/trend/${studentId}`, { months }),
  
  /** 获取学生习惯档案 */
  getStudentProfile: (studentId: string) =>
    apiClient.get<StudentHabitProfile>(`/students/${studentId}/habit-profile`),
  
  // ============================================
  // 目标管理
  // ============================================
  
  /** 获取习惯目标列表 */
  getGoals: (params?: QueryParams & {
    studentId?: string;
    classId?: string;
    status?: 'active' | 'completed' | 'all';
    category?: HabitCategory;
  }) =>
    apiClient.get<HabitGoal[]>('/moral/habit/goals', params),
  
  /** 获取学生月度目标 */
  getMonthlyGoals: (studentId: string, month?: string) =>
    apiClient.get<StudentMonthlyGoal[]>('/moral/habit/goals', { studentId, month }),
  
  /** 创建习惯目标 */
  createGoal: (data: Partial<HabitGoal>) =>
    apiClient.post<HabitGoal>('/moral/habit/goals', data),
  
  /** 更新习惯目标 */
  updateGoal: (id: string, data: Partial<HabitGoal>) =>
    apiClient.put<HabitGoal>(`/moral/habit/goals/${id}`, data),
  
  /** 更新目标进度 */
  updateGoalProgress: (id: string, completedDays: number) =>
    apiClient.patch<HabitGoal>(`/moral/habit/goals/${id}/progress`, { completedDays }),
  
  /** 删除习惯目标 */
  deleteGoal: (id: string) =>
    apiClient.delete(`/moral/habit/goals/${id}`),
  
  /** 获取目标模板 */
  getGoalTemplates: (category?: HabitCategory) =>
    apiClient.get<HabitGoalTemplate[]>('/moral/habit/goal-templates', category ? { category } : undefined),
  
  // ============================================
  // 习惯之星
  // ============================================
  
  /** 获取习惯之星列表 */
  getStars: (params?: QueryParams & {
    classId?: string;
    grade?: string;
    category?: HabitCategory;
    academicYear?: string;
    semester?: string;
  }) =>
    apiClient.get<HabitStar[]>('/moral/habit/stars', params),
  
  /** 创建习惯之星 */
  createStar: (data: Partial<HabitStar>) =>
    apiClient.post<HabitStar>('/moral/habit/stars', data),
  
  /** 删除习惯之星 */
  deleteStar: (id: string) =>
    apiClient.delete(`/moral/habit/stars/${id}`),
  
  /** 获取评选规则 */
  getStarRules: () =>
    apiClient.get<HabitStarRule[]>('/moral/habit/star-rules'),
  
  // ============================================
  // 全校/年级统计
  // ============================================
  
  /** 获取学校习惯统计 */
  getSchoolStats: (month: string) =>
    apiClient.get<SchoolHabitStatsResponse>('/moral/habit/school-stats', { month }),
  
  /** 获取班级习惯统计 */
  getClassStats: (classId: string, month?: string) =>
    apiClient.get<ClassHabitStats>(`/moral/habit/class-stats/${classId}`, { month }),
  
  // ============================================
  // 兼容旧API（保持向后兼容）
  // ============================================
  
  /** @deprecated 使用 getEvaluations 代替 */
  getAssessments: (params?: QueryParams) =>
    apiClient.get<HabitAssessment[]>('/habit/assessments', params),
  
  /** @deprecated 使用 createEvaluation 代替 */
  createAssessment: (data: Partial<HabitAssessment>) =>
    apiClient.post<HabitAssessment>('/habit/assessments', data),
} as const;

/**
 * 德育API
 */
export const moralApi = {
  // ============================================
  // 德育活动管理
  // ============================================
  
  /** 获取德育活动列表 */
  getActivities: (params?: QueryParams & {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get<MoralActivity[]>('/moral/activities', params),
  
  /** 获取德育活动详情 */
  getActivity: (id: string) =>
    apiClient.get<MoralActivity>(`/moral/activities/${id}`),
  
  /** 创建德育活动 */
  createActivity: (data: Partial<MoralActivity>) =>
    apiClient.post<MoralActivity>('/moral/activities', data),
  
  /** 更新德育活动 */
  updateActivity: (id: string, data: Partial<MoralActivity>) =>
    apiClient.put<MoralActivity>(`/moral/activities/${id}`, data),
  
  /** 删除德育活动 */
  deleteActivity: (id: string) =>
    apiClient.delete(`/moral/activities/${id}`),
  
  // ============================================
  // 德育评价
  // ============================================
  
  /** 获取德育评价列表 */
  getEvaluations: (params?: QueryParams & {
    studentId?: string;
    classId?: string;
    type?: string;
    academicYear?: string;
    semester?: string;
  }) =>
    apiClient.get<MoralEvaluation[]>('/moral/evaluations', params),
  
  /** 创建德育评价 */
  createEvaluation: (data: Partial<MoralEvaluation>) =>
    apiClient.post<MoralEvaluation>('/moral/evaluations', data),
  
  /** 更新德育评价 */
  updateEvaluation: (id: string, data: Partial<MoralEvaluation>) =>
    apiClient.put<MoralEvaluation>(`/moral/evaluations/${id}`, data),
  
  /** 删除德育评价 */
  deleteEvaluation: (id: string) =>
    apiClient.delete(`/moral/evaluations/${id}`),
  
  // ============================================
  // 荣誉管理
  // ============================================
  
  /** 获取学生荣誉列表 */
  getHonors: (params?: QueryParams & {
    studentId?: string;
    classId?: string;
    level?: string;
    type?: string;
    academicYear?: string;
  }) =>
    apiClient.get<StudentHonor[]>('/moral/honors', params),
  
  /** 创建学生荣誉 */
  createHonor: (data: Partial<StudentHonor>) =>
    apiClient.post<StudentHonor>('/moral/honors', data),
  
  /** 更新学生荣誉 */
  updateHonor: (id: string, data: Partial<StudentHonor>) =>
    apiClient.put<StudentHonor>(`/moral/honors/${id}`, data),
  
  /** 删除学生荣誉 */
  deleteHonor: (id: string) =>
    apiClient.delete(`/moral/honors/${id}`),
  
  // ============================================
  // 预警管理
  // ============================================
  
  /** 获取预警学生列表 */
  getWarningStudents: (params?: QueryParams & {
    type?: 'behavior' | 'psychological' | 'academic' | 'attendance';
    level?: '轻度' | '中度' | '重度';
    status?: 'active' | 'resolved' | 'all';
  }) =>
    apiClient.get<WarningStudent[]>('/moral/warnings', params),
  
  /** 获取预警详情 */
  getWarning: (id: string) =>
    apiClient.get<WarningStudent>(`/moral/warnings/${id}`),
  
  /** 创建预警记录 */
  createWarning: (data: Partial<WarningStudent>) =>
    apiClient.post<WarningStudent>('/moral/warnings', data),
  
  /** 更新预警记录 */
  updateWarning: (id: string, data: Partial<WarningStudent>) =>
    apiClient.put<WarningStudent>(`/moral/warnings/${id}`, data),
  
  /** 解决预警 */
  resolveWarning: (id: string, resolution: string) =>
    apiClient.patch<WarningStudent>(`/moral/warnings/${id}/resolve`, { resolution }),
  
  // ============================================
  // 统计分析
  // ============================================
  
  /** 获取德育统计数据 */
  getStatistics: (params?: {
    classId?: string;
    grade?: string;
    academicYear?: string;
    semester?: string;
  }) =>
    apiClient.get<MoralStatistics>('/moral/statistics', params),
  
  /** 获取班级德育概览 */
  getClassOverview: (classId: string) =>
    apiClient.get(`/moral/classes/${classId}/overview`),
  
  /** 获取年级德育概览 */
  getGradeOverview: (grade: string) =>
    apiClient.get(`/moral/grades/${grade}/overview`),
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
  moral: moralApi,
  research: researchApi,
  room: roomApi,
  access: accessApi,
  expense: expenseApi,
  enrollment: enrollmentApi,
} as const;

export default api;
