/**
 * 数据库行类型辅助定义
 * 
 * 用于 Repository 层处理 Supabase 返回的 snake_case 字段名
 * 业务层使用 camelCase，数据库使用 snake_case
 * 
 * @module types/db-helpers
 */

// ==================== 数据库行类型 ====================

/** 学生数据库行 */
export type StudentRow = {
  id: string;
  student_no: string;
  name: string;
  gender: 'male' | 'female';
  birth_date?: string;
  class_id: string;
  grade: number;
  status: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  classes?: { name: string } | null;
};

/** 教师数据库行 */
export type TeacherRow = {
  id: string;
  employee_id: string;
  name: string;
  gender?: string;
  phone?: string;
  email?: string;
  subject?: string;
  position?: string;
  title?: string;
  department?: string;
  status?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
};

/** 家长数据库行 */
export type ParentRow = {
  id: string;
  name: string;
  relation?: string;
  relationship?: string;
  phone?: string;
  is_primary: boolean;
  wechat?: string;
  email?: string;
  avatar?: string;
  company?: string;
  position?: string;
  education?: string;
  children_ids?: string[];
  created_at?: string;
  updated_at?: string;
};

/** 审批实例数据库行 */
export type ApprovalInstanceRow = {
  id: string;
  instance_id?: string;
  flow_id?: string;
  flow_name?: string;
  business_type?: string;
  business_id?: string;
  business?: Record<string, unknown>;
  title: string;
  applicant_id: string;
  applicant_name: string;
  applicant_department?: string;
  current_node?: string;
  current_node_order?: number;
  status: string;
  submit_at?: string;
  finish_at?: string;
  metadata?: Record<string, unknown>;
  attachments?: Array<{ name: string; url: string }>;
  created_at?: string;
  updated_at?: string;
  node_records?: ApprovalNodeRecordRow[];
};

/** 审批节点记录数据库行 */
export type ApprovalNodeRecordRow = {
  id: string;
  instance_id: string;
  node_id?: string;
  node_name: string;
  node_order: number;
  node_type?: string;
  workflow_id?: string;
  workflow_type?: string;
  status: string;
  approver_ids?: string[];
  approved_by?: ApprovedByItem[];
  final_approver_id?: string;
  final_approver_name?: string;
  action?: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  finished_at?: string;
};

/** 审批人项 */
export type ApprovedByItem = {
  userId?: string;
  user_id?: string;  // 兼容旧字段
  userName?: string;
  user_name?: string;  // 兼容旧字段
  approvedAt?: string;
  action?: string;
  comment?: string;
  time?: string;
};

/** 公告数据库行 */
export type AnnouncementRow = {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  type: string;
  category?: string;
  media_level?: string;
  author_id?: string;
  author_name?: string;
  department?: string;
  cover_image?: string;
  images?: string[];
  attachments?: AttachmentItem[];
  is_external?: boolean;
  publish_status?: string;
  published_at?: string;
  scheduled_publish_at?: string;
  unpublished_at?: string;
  auto_unpublish?: boolean;
  auto_unpublish_at?: string;
  external_id?: string;
  status?: string;
  view_count?: number;
  is_pinned?: boolean;
  pin_order?: number;
  metadata?: Record<string, unknown>;
  recipients?: RecipientConfig;
  created_at?: string;
  updated_at?: string;
};

/** 附件项 */
export type AttachmentItem = {
  name: string;
  url: string;
  size?: number;
  type?: string;
};

/** 接收者配置 */
export type RecipientConfig = {
  type: 'all' | 'role' | 'class' | 'individual' | 'group';
  roles?: string[];
  classIds?: string[];
  userIds?: string[];
  groupIds?: string[];
};

/** 考试数据库行 */
export type ExamRow = {
  id: string;
  name: string;
  type: string;
  semester?: string;
  start_date: string;
  end_date: string;
  grades?: number[];
  subjects?: string[];
  status: string;
  created_at: string;
  updated_at?: string;
};

/** 课程数据库行 */
export type CourseRow = {
  id: string;
  name: string;
  code?: string;
  subject: string;
  teacher_id?: string;
  class_id?: string;
  semester?: string;
  hours?: number;
  credits?: number;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

/** 请假数据库行 */
export type LeaveRow = {
  id: string;
  user_id: string;
  user_name: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  approver_id?: string;
  approver_name?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
};

/** 请假请求数据库行 */
export type LeaveRequestRow = {
  id: string;
  user_id: string;
  user_name?: string;
  applicant_id?: string;
  applicant_name?: string;
  applicant_grade?: number;
  type: string;
  start_date: string;
  end_date: string;
  duration: number;
  duration_unit: string;
  reason: string;
  need_adjustment?: boolean;
  affected_slots?: AffectedSlot[];
  attachments?: AttachmentItem[];
  status: string;
  created_at: string;
  updated_at?: string;
};

/** 受影响的课程时段 */
export type AffectedSlot = {
  date?: string;
  period?: number;
  classId?: string;
  className?: string;
  teacherId?: string;
  teacherName?: string;
  employeeId?: string;
  grade?: number;
  weekDay?: number;
  periodIndex?: number;
  subject?: string;
  weekStartDate?: string;
};

/** 出勤记录数据库行 */
export type AttendanceRow = {
  id: string;
  user_id: string;
  date: string;
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  created_at?: string;
  updated_at?: string;
};

/** 课程时段数据库行 */
export type ScheduleSlotRow = {
  id: string;
  date: string;
  period: number;
  class_id: string;
  teacher_id: string;
  subject: string;
  room?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

// ==================== 通用类型 ====================

/** Supabase 查询结果 */
export type SupabaseResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

/** Supabase 分页结果 */
export type SupabasePaginatedResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
};
