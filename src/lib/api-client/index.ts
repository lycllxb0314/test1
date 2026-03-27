/**
 * API客户端模块
 * 
 * 六层架构中的第四层（API Client层）
 * 负责HTTP请求封装、缓存、重试等
 * 
 * 架构层次：
 * 1. Repository层 - 数据访问
 * 2. Service层 - 业务逻辑
 * 3. API层 - HTTP接口
 * 4. API Client层 - HTTP请求封装（本层）
 * 5. Hook层 - React框架适配
 * 6. Component层 - UI展示
 * 
 * @module api-client
 */

// ============================================
// 核心类
// ============================================

export { ApiClient, apiClient } from './core';
export { ApiCache, globalCache } from './cache';

// ============================================
// 类型定义
// ============================================

export type {
  ApiResponse,
  Pagination,
  ListResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  CacheEntry,
  CacheConfig,
  ApiClientConfig,
  PaginationParams,
  SortParams,
  SearchParams,
  QueryParams,
} from './types';

// ============================================
// 领域客户端
// ============================================

export {
  // 客户端类
  StudentApiClient,
  TeacherApiClient,
  ClassApiClient,
  CourseApiClient,
  ScheduleApiClient,
  AttendanceApiClient,
  GradeApiClient,
  LeaveRequestApiClient,
  // 单例实例
  studentApi,
  teacherApi,
  classApi,
  courseApi,
  scheduleApi,
  attendanceApi,
  gradeApi,
  leaveRequestApi,
  // 类型
  type User,
  type Student,
  type Teacher,
  type Class,
  type Course,
  type Schedule,
  type Attendance,
  type Grade,
  type LeaveRequest,
} from './clients';
