/**
 * 智慧校园API接口统一索引
 * 基于扎根理论分析，按叙事性架构组织
 */

// ============================================================
// 第一层：核心层（Core Layer）- 身份主体
// ============================================================

/**
 * 认证入口
 * 故事：用户登录系统，开始一天的工作
 */
export const AUTH_API = {
  login: '/api/auth/login',
  current: '/api/auth/current',
} as const;

/**
 * 教师管理
 * 故事：教师是学校教育的核心力量
 */
export const TEACHER_API = {
  list: '/api/teachers',
  create: '/api/teachers',
  detail: (id: string) => `/api/teachers/${id}`,
  update: (id: string) => `/api/teachers/${id}`,
  delete: (id: string) => `/api/teachers/${id}`,
  profile: (id: string) => `/api/teachers/${id}/profile`,
} as const;

/**
 * 学生管理
 * 故事：学生是学校服务的对象
 */
export const STUDENT_API = {
  list: '/api/students',
  create: '/api/students',
  detail: (id: string) => `/api/students/${id}`,
  update: (id: string) => `/api/students/${id}`,
  delete: (id: string) => `/api/students/${id}`,
  habitProfile: (id: string) => `/api/students/${id}/habit-profile`,
} as const;

/**
 * 班级管理
 * 故事：班级是学校的基本组织单元
 */
export const CLASS_API = {
  list: '/api/classes',
  create: '/api/classes',
} as const;

// ============================================================
// 第二层：流程层（Process Layer）- 审批预约
// ============================================================

/**
 * 请假申请
 * 故事：老师请假，需要审批和调课安排
 */
export const LEAVE_REQUEST_API = {
  list: '/api/leave-requests-v2',
  create: '/api/leave-requests-v2',
  update: '/api/leave-requests-v2',
  cancel: '/api/leave-requests-v2',
  approve: '/api/leave-requests-v2',
  pending: '/api/leave-requests-v2/pending',
} as const;

/**
 * 调课申请
 * 故事：因请假或其他原因需要调整课程
 */
export const SCHEDULE_CHANGE_API = {
  list: '/api/schedule-changes',
  create: '/api/schedule-changes',
  update: '/api/schedule-changes',
} as const;

/**
 * 维修申请
 * 故事：设施设备需要维修保养
 */
export const REPAIR_REQUEST_API = {
  list: '/api/repair-requests',
  create: '/api/repair-requests',
  update: '/api/repair-requests',
} as const;

/**
 * 工作流
 * 故事：统一的审批流程引擎
 */
export const WORKFLOW_API = {
  configList: '/api/workflow/config',
  configCreate: '/api/workflow/config',
  configUpdate: '/api/workflow/config',
  instanceList: '/api/workflow/instances',
  instanceCreate: '/api/workflow/instances',
} as const;

/**
 * 教室预约
 * 故事：需要使用教室开展活动
 */
export const ROOM_BOOKING_API = {
  roomList: '/api/rooms',
  roomCreate: '/api/rooms',
  roomUpdate: (id: string) => `/api/rooms/${id}`,
  roomDelete: (id: string) => `/api/rooms/${id}`,
  bookingList: '/api/rooms/bookings',
  bookingCreate: '/api/rooms/bookings',
  bookingUpdate: '/api/rooms/bookings',
  bookingApprove: (id: string) => `/api/rooms/bookings/${id}/approve`,
} as const;

/**
 * 空间预约
 * 故事：预约其他功能空间
 */
export const SPACE_RESERVATION_API = {
  list: '/api/spaces/reservations',
  create: '/api/spaces/reservations',
} as const;

/**
 * 访客管理
 * 故事：校外人员来访需要预约登记
 */
export const VISITOR_API = {
  list: '/api/access/visitors',
  create: '/api/access/visitors',
  update: '/api/access/visitors',
} as const;

// ============================================================
// 第三层：业务层（Business Layer）- 核心业务
// ============================================================

/**
 * 课程管理
 * 故事：学校开设的课程资源
 */
export const COURSE_API = {
  list: '/api/courses',
  create: '/api/courses',
} as const;

/**
 * 课表管理
 * 故事：每周的课程安排
 */
export const SCHEDULE_API = {
  list: '/api/schedules',
  create: '/api/schedules',
  update: '/api/schedules',
} as const;

/**
 * 考勤管理
 * 故事：记录师生出勤情况
 */
export const ATTENDANCE_API = {
  list: '/api/attendance',
  create: '/api/attendance',
  update: '/api/attendance',
} as const;

/**
 * 作业管理
 * 故事：教师布置、学生完成作业
 */
export const HOMEWORK_API = {
  list: '/api/homeworks',
  create: '/api/homeworks',
} as const;

/**
 * 考试管理
 * 故事：组织各类考试
 */
export const EXAM_API = {
  list: '/api/exams',
  create: '/api/exams',
  update: '/api/exams',
} as const;

/**
 * 成绩管理
 * 故事：记录学生学业成绩
 */
export const GRADE_API = {
  list: '/api/grades',
  create: '/api/grades',
  update: '/api/grades',
} as const;

/**
 * 教研活动
 * 故事：教师专业发展
 */
export const RESEARCH_API = {
  activitiesList: '/api/research/activities',
  activitiesCreate: '/api/research/activities',
} as const;

/**
 * 德育管理
 * 故事：学生品德培养
 */
export const MORAL_API = {
  plansList: '/api/moral/plans',
  plansCreate: '/api/moral/plans',
  activitiesList: '/api/moral/activities',
  activitiesCreate: '/api/moral/activities',
  activitiesUpdate: '/api/moral/activities',
  alertsList: '/api/moral/alerts',
  alertsCreate: '/api/moral/alerts',
  alertsUpdate: '/api/moral/alerts',
  growthList: '/api/moral/growth',
  growthCreate: '/api/moral/growth',
} as const;

/**
 * 习惯养成
 * 故事：培养学生良好习惯
 */
export const HABIT_API = {
  schoolStats: '/api/habit/stats/school',
  starsList: '/api/habit/stars',
  starsCreate: '/api/habit/stars',
  goalsList: '/api/habit/goals',
  goalsCreate: '/api/habit/goals',
  goalsUpdate: '/api/habit/goals',
  goalsDelete: '/api/habit/goals',
  assessmentsList: '/api/habit/assessments',
  assessmentsCreate: '/api/habit/assessments',
} as const;

// ============================================================
// 第四层：支撑层（Support Layer）- 基础保障
// ============================================================

/**
 * 资产管理
 * 故事：学校固定资产管理
 */
export const ASSET_API = {
  list: '/api/assets',
  create: '/api/assets',
} as const;

/**
 * 门禁管理
 * 故事：校园安全出入管理
 */
export const ACCESS_API = {
  statistics: '/api/access/statistics',
  devicesList: '/api/access/devices',
  devicesCreate: '/api/access/devices',
  devicesUpdate: '/api/access/devices',
  recordsList: '/api/access/records',
  visitorsList: '/api/access/visitors',
  visitorsCreate: '/api/access/visitors',
  visitorsUpdate: '/api/access/visitors',
} as const;

/**
 * 安全管理
 * 故事：校园安全检查与演练
 */
export const SAFETY_API = {
  inspectionsList: '/api/safety/inspections',
  inspectionsCreate: '/api/safety/inspections',
  drillsList: '/api/safety/drills',
  drillsCreate: '/api/safety/drills',
} as const;

/**
 * 财务管理
 * 故事：学校财务收支记录
 */
export const FINANCE_API = {
  recordsList: '/api/finance/records',
  recordsCreate: '/api/finance/records',
} as const;

/**
 * 通知消息
 * 故事：校内消息沟通
 */
export const COMMUNICATION_API = {
  list: '/api/communications',
  send: '/api/communications',
  markRead: '/api/communications',
} as const;

// ============================================================
// 第五层：系统层（System Layer）- 系统管理
// ============================================================

/**
 * 工具服务
 * 故事：系统辅助功能
 */
export const UTILITY_API = {
  upload: '/api/upload',
  searchImages: '/api/search-images',
  dataCollectionList: '/api/data-collection',
  dataCollectionCreate: '/api/data-collection',
  migrate: '/api/migrate',
  dataLink: '/api/data-link',
} as const;

// ============================================================
// 综合导出
// ============================================================

/**
 * 完整API索引
 * 按五层架构组织
 */
export const API = {
  // 核心层
  auth: AUTH_API,
  teacher: TEACHER_API,
  student: STUDENT_API,
  class: CLASS_API,

  // 流程层
  leaveRequest: LEAVE_REQUEST_API,
  scheduleChange: SCHEDULE_CHANGE_API,
  repairRequest: REPAIR_REQUEST_API,
  workflow: WORKFLOW_API,
  roomBooking: ROOM_BOOKING_API,
  spaceReservation: SPACE_RESERVATION_API,
  visitor: VISITOR_API,

  // 业务层
  course: COURSE_API,
  schedule: SCHEDULE_API,
  attendance: ATTENDANCE_API,
  homework: HOMEWORK_API,
  exam: EXAM_API,
  grade: GRADE_API,
  research: RESEARCH_API,
  moral: MORAL_API,
  habit: HABIT_API,

  // 支撑层
  asset: ASSET_API,
  access: ACCESS_API,
  safety: SAFETY_API,
  finance: FINANCE_API,
  communication: COMMUNICATION_API,

  // 系统层
  utility: UTILITY_API,
} as const;

export type ApiIndex = typeof API;
