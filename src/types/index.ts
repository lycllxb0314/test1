// 智慧校园系统 - 统一类型定义

// 用户角色枚举
export type UserRole = 
  // === 学校领导层 ===
  | 'principal'        // 校长
  | 'secretary'        // 书记
  | 'vice_principal'   // 分管副校长
  // === 部门负责人 ===
  | 'academic_director' // 教务主任
  | 'moral_director'    // 德育主任
  | 'general_director'  // 总务主任
  // === 普通职员 ===
  | 'academic_staff'    // 教务员
  | 'moral_staff'       // 德育员
  // === 教师群体 ===
  | 'head_teacher'     // 班主任
  | 'grade_leader'     // 年段长
  | 'teacher'          // 普通教师
  // === 其他人员 ===
  | 'staff'            // 后勤人员
  | 'student'          // 学生
  | 'parent';          // 家长

// 角色配置
export interface RoleConfig {
  id: UserRole;
  name: string;
  description: string;
  modules: ModuleType[];
  permissions: Permission[];
  avatar: string;
  // 年段长特有配置
  specialPermissions?: {
    manageCourseAdjustment?: boolean;      // 调课管理
    receiveLeaveNotification?: boolean;    // 接收请假通知
    assignSubstituteTeacher?: boolean;     // 指派代课教师
    viewGradeSchedule?: boolean;           // 查看年级课表
  };
  managedGrades?: number[];                // 管理的年级（年段长专用）
}

// 模块类型
export type ModuleType = 
  | 'general'      // 总务后勤
  | 'academic'     // 教务教研
  | 'moral'        // 德育管理
  | 'teacher'      // 教师空间
  | 'homepage';    // 主页内容管理

// 权限类型
export type Permission = 
  | 'view'         // 查看
  | 'edit'         // 编辑
  | 'approve'      // 审批
  | 'manage'       // 管理
  | 'admin';       // 超级管理

// 用户信息
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  classId?: string;       // 班主任/学生所属班级
  className?: string;
  subjects?: string[];    // 教师任教学科
  children?: {            // 家长关联的学生
    id: string;
    name: string;
    classId: string;
    className: string;
  }[];
}

// 教师详细信息
export interface TeacherProfile {
  id: string;
  userId: string;
  
  // === 基本信息 ===
  name: string;
  gender: '男' | '女';
  birthDate?: string;
  idCard?: string;            // 身份证号
  ethnicity?: string;         // 民族
  politicalStatus?: string;   // 政治面貌
  nativePlace?: string;       // 籍贯
  
  // === 联系信息 ===
  phone: string;
  email?: string;
  emergencyContact?: string;  // 紧急联系人
  emergencyPhone?: string;    // 紧急联系电话
  address?: string;           // 家庭住址
  
  // === 工作信息 ===
  employeeId?: string;        // 工号
  subjects: string[];         // 任教学科
  title: string;              // 职称
  titleDate?: string;         // 职称取得时间
  education: string;          // 学历
  school?: string;            // 毕业院校
  major?: string;             // 专业
  graduationDate?: string;    // 毕业时间
  teachYears: number;         // 教龄
  joinDate: string;           // 入职时间
  department: string;         // 教研组
  
  // === 班主任信息 ===
  isHeadTeacher: boolean;
  classId?: string;
  className?: string;
  headTeacherYears?: number;  // 班主任年限
  
  // === 状态 ===
  status: 'active' | 'on_leave' | 'retired' | 'transferred';
  
  // === 成长记录 ===
  records: TeacherRecord[];
  
  // === 荣誉奖项 ===
  honors: TeacherHonor[];
  
  // === 培训记录 ===
  trainings: TeacherTraining[];
  
  // === 教学成果 ===
  achievements: TeacherAchievement[];
  
  // === 时间戳 ===
  createdAt: string;
  updatedAt: string;
}

// 教师成长记录
export interface TeacherRecord {
  id: string;
  teacherId: string;
  type: 'education' | 'title' | 'position' | 'award' | 'training' | 'research' | 'other';
  title: string;
  description?: string;
  date: string;
  attachments?: string[];
  createdAt: string;
}

// 教师荣誉奖项
export interface TeacherHonor {
  id: string;
  teacherId: string;
  title: string;
  level: '校级' | '区级' | '市级' | '省级' | '国家级';
  category: '教学' | '德育' | '科研' | '综合';
  issuer?: string;           // 颁发单位
  date: string;
  certificateNo?: string;    // 证书编号
  attachments?: string[];
}

// 教师培训记录
export interface TeacherTraining {
  id: string;
  teacherId: string;
  name: string;
  type: '校内培训' | '区级培训' | '市级培训' | '省级培训' | '国家级培训';
  organizer: string;
  startDate: string;
  endDate: string;
  hours: number;             // 学时
  status: '进行中' | '已完成' | '未通过';
  certificate?: string;
  notes?: string;
}

// 教师教学成果
export interface TeacherAchievement {
  id: string;
  teacherId: string;
  type: '公开课' | '教学比赛' | '论文发表' | '课题研究' | '指导学生获奖';
  title: string;
  level?: string;
  result?: string;           // 成绩/奖项
  date: string;
  description?: string;
  attachments?: string[];
}

// 班级信息
export interface Class {
  id: string;
  name: string;
  grade: number;
  headTeacherId: string;
  headTeacherName: string;
  studentCount: number;
  classroom?: string;
}

// 学生信息
export interface Student {
  id: string;
  studentNo: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  classId: string;
  className: string;
  status: '在校' | '请假' | '休学';
  parents: Parent[];
  avatar?: string;
}

// 家长信息
export interface Parent {
  id: string;
  name: string;
  relationship: '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他';
  phone: string;
  isPrimary: boolean;
  wechat?: string;
}

// 教师信息
export interface Teacher {
  id: string;
  name: string;
  employeeNo: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  subjects: string[];
  isHeadTeacher: boolean;
  classId?: string;
  className?: string;
  department?: string;
  position?: string;  // 职务：年级组长、教研组长等
  avatar?: string;
}

// 工作流状态
export type WorkflowStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待审批
  | 'approved'     // 已通过
  | 'rejected'     // 已拒绝
  | 'cancelled';   // 已取消

// 审批节点
export interface ApprovalNode {
  id: string;
  name: string;
  approverRole: UserRole | UserRole[];
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}

// 请假申请
export interface LeaveRequest {
  id: string;
  type: '事假' | '病假' | '年假' | '调休' | '其他';
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  startDate: string;
  endDate: string;
  duration: number;  // 天数
  reason: string;
  status: WorkflowStatus;
  approvalFlow: ApprovalNode[];
  currentStep: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// 维修申请
export interface RepairRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  item: string;
  location: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  images?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assigneeId?: string;
  assigneeName?: string;
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: string;
  createdAt: string;
}

// 采购申请
export interface PurchaseRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  items: PurchaseItem[];
  totalAmount: number;
  reason: string;
  status: WorkflowStatus;
  approvalFlow: ApprovalNode[];
  currentStep: number;
  createdAt: string;
}

export interface PurchaseItem {
  name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

// 通知公告
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: '通知' | '公告' | '新闻' | '活动';
  publisherId: string;
  publisherName: string;
  targetRoles?: UserRole[];
  targetDepartments?: string[];
  isTop: boolean;
  isImportant: boolean;
  attachments?: string[];
  publishAt: string;
  createdAt: string;
}

// 德育评价
export interface MoralAssessment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: '表扬' | '批评';
  category: string;
  content: string;
  score: number;  // 正数表扬，负数批评
  recorderId: string;
  recorderName: string;
  occurredAt: string;
  createdAt: string;
}

// 活动信息
export interface Activity {
  id: string;
  title: string;
  type: '德育活动' | '少先队活动' | '班级活动' | '学校活动';
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizerId: string;
  organizerName: string;
  participantType: 'class' | 'grade' | 'school';
  participantIds: string[];
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  images?: string[];
  createdAt: string;
}

// 课程安排
export interface CourseSchedule {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;  // 1-7
  period: number;     // 第几节课
  startTime: string;
  endTime: string;
  classroom?: string;
}

// 成绩记录
export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  examId: string;
  examName: string;
  subject: string;
  score: number;
  rank?: number;
  classRank?: number;
  gradeRank?: number;
  createdAt: string;
}

// 考试信息
export interface Exam {
  id: string;
  name: string;
  type: '期中考试' | '期末考试' | '单元测试' | '模拟考试' | '其他';
  startDate: string;
  endDate: string;
  subjects: string[];
  grades: number[];  // 参与年级
  status: 'planning' | 'ongoing' | 'grading' | 'completed';
  createdAt: string;
}

// 资产信息
export interface Asset {
  id: string;
  assetNo: string;
  name: string;
  category: string;
  specification?: string;
  quantity: number;
  unit: string;
  value: number;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  department: string;
  custodianId?: string;
  custodianName?: string;
  status: '在用' | '闲置' | '维修中' | '报废';
  images?: string[];
  createdAt: string;
}

// 菜单配置
export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  badge?: string | number;
  children?: MenuItem[];
  module?: ModuleType;
  permission?: Permission;
}

// 统计数据
export interface Statistics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  maleCount: number;
  femaleCount: number;
  attendanceRate: number;
  moralScoreAvg: number;
  activityCount: number;
}

// 工作台卡片
export interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  module?: ModuleType;
}

// ========== 审批流程配置（增强版） ==========

// 审批流程类型
export type WorkflowType = 'leave' | 'repair' | 'purchase';

// 节点类型
export type NodeType = 'start' | 'approval' | 'condition' | 'parallel' | 'course_adjust' | 'sync' | 'end';

// 拒绝处理方式
export type RejectAction = 
  | 'return_to_applicant'    // 退回申请人修改
  | 'return_to_previous'     // 退回上一节点
  | 'return_to_specific'     // 退回指定节点
  | 'end_process';           // 流程结束

// 条件操作符
export type ConditionOperator = 
  | 'eq'      // 等于
  | 'ne'      // 不等于
  | 'gt'      // 大于
  | 'gte'     // 大于等于
  | 'lt'      // 小于
  | 'lte'     // 小于等于
  | 'in'      // 包含于
  | 'not_in'; // 不包含于

// 条件规则
export interface ConditionRule {
  id: string;
  field: string;                         // 条件字段：type, duration, amount 等
  operator: ConditionOperator;           // 操作符
  value: string | number | string[];     // 比较值
  label?: string;                        // 条件描述，如"病假"、"3天以内"
}

// 条件分支
export interface ConditionBranch {
  id: string;
  name: string;                          // 分支名称，如"病假流程"、"事假流程"
  conditionType: 'all' | 'any' | 'expression';  // 条件组合方式
  rules: ConditionRule[];                // 条件规则列表
  nextNodeId: string;                    // 满足条件后跳转的节点ID
}

// 审批节点配置
export interface WorkflowNode {
  id: string;                            // 节点ID
  type: NodeType;                        // 节点类型
  name: string;                          // 节点名称
  description?: string;                  // 节点说明
  
  // 审批节点配置
  approverType?: 'role' | 'specific' | 'applicant_leader';  // 审批人类型
  approverRole?: UserRole;               // 按角色审批
  approverId?: string;                   // 指定人员ID
  approverName?: string;                 // 指定人员姓名
  
  // 审批设置
  isRequired?: boolean;                  // 是否必须审批（默认true）
  allowTransfer?: boolean;               // 是否允许转交
  timeout?: number;                      // 超时时间（小时）
  timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate';  // 超时动作
  
  // 拒绝处理
  rejectAction?: RejectAction;           // 拒绝后动作
  rejectReturnNodeId?: string;           // 拒绝后退回的节点ID
  
  // 附件收集配置
  attachmentConfig?: {
    enabled: boolean;                    // 是否启用附件收集
    required: boolean;                   // 是否必须上传附件
    description?: string;                // 附件说明
    maxFiles?: number;                   // 最大文件数
    acceptTypes?: string[];              // 接受的文件类型，如 ['image/*', '.pdf', '.doc']
  };
  
  // 条件节点配置
  branches?: ConditionBranch[];          // 条件分支列表
  defaultBranchId?: string;              // 默认分支ID（都不满足时）
  
  // 并行节点配置
  parallelNodes?: string[];              // 并行执行的节点ID列表
  mergeType?: 'all' | 'any';             // 合并方式：全部通过/任一通过
  
  // 调课节点配置（与教务系统对接）
  courseAdjustConfig?: {
    // === 执行人配置 ===
    assigneeType?: 'grade_leader' | 'academic_staff' | 'specific';  // 调课执行人类型（默认年段长）
    assigneeId?: string;                  // 指定执行人ID
    assigneeName?: string;                // 指定执行人姓名
    
    // === 调课方式 ===
    adjustTypes?: ('substitute' | 'swap' | 'cancel' | 'makeup')[];  // 允许的调课方式
    // substitute: 代课（找其他老师代上）
    // swap: 调换（与其他时间互换）
    // cancel: 取消（不上课）
    // makeup: 补课（后续时间补上）
    
    // === 代课教师配置 ===
    substituteMode?: 'auto_recommend' | 'manual_select' | 'both';  // 代课教师选择方式
    allowAnyTeacher?: boolean;            // 是否允许任意教师代课
    restrictBySubject?: boolean;          // 是否限制同学科教师
    preferSameGrade?: boolean;            // 是否优先同年级教师
    
    // === 时间配置 ===
    allowCrossWeek?: boolean;             // 是否允许跨周调课
    maxAdvanceDays?: number;              // 最大提前调课天数
    deadlineBeforeClass?: number;         // 上课前多久截止调课（小时）
    
    // === 同步目标 ===
    syncTargets?: {
      teacherSchedule?: boolean;          // 同步到教师空间课表
      academicSchedule?: boolean;         // 同步到教务智能排课
      classSchedule?: boolean;            // 同步到班级课表
      electronicBoard?: boolean;          // 同步到电子白板
      teacherAttendance?: boolean;        // 同步到教师考勤
    };
    
    // === 通知配置 ===
    notifySubstituteTeacher?: boolean;    // 通知代课教师
    notifyOriginalTeacher?: boolean;      // 通知原任课教师
    notifyClassStudents?: boolean;        // 通知班级学生
    notifyClassParents?: boolean;         // 通知班级家长
    notifyHeadTeacher?: boolean;          // 通知班主任
    
    // === 其他配置 ===
    requireReason?: boolean;              // 是否必须填写调课原因
    requireApproval?: boolean;            // 是否需要教务主任确认
  };
  
  // 同步节点配置（数据同步保障）
  syncConfig?: {
    // === 同步目标 ===
    targets?: {
      teacherSchedule?: boolean;          // 同步到教师空间课表
      academicSchedule?: boolean;         // 同步到教务智能排课
      classSchedule?: boolean;            // 同步到班级课表
      electronicBoard?: boolean;          // 同步到电子白板
      teacherAttendance?: boolean;        // 同步到教师考勤
      externalSystem?: boolean;           // 同步到外部系统（如区教育平台）
    };
    
    // === 重试策略 ===
    retryPolicy?: {
      maxRetries?: number;                 // 最大重试次数（默认3）
      retryInterval?: number;              // 重试间隔（秒，默认30）
      retryOnPartialFailure?: boolean;     // 部分失败时是否重试
    };
    
    // === 超时设置 ===
    timeout?: number;                      // 单次同步超时时间（秒，默认60）
    
    // === 失败处理 ===
    onFailure?: 'continue' | 'pause' | 'rollback';  // 失败后动作
    notifyOnFailure?: boolean;             // 失败时是否通知管理员
    notifyTargets?: string[];              // 通知对象列表
    
    // === 确认设置 ===
    requireManualConfirm?: boolean;        // 是否需要人工确认同步结果
    confirmBy?: UserRole;                  // 确认人角色
    
    // === 日志记录 ===
    keepSyncLog?: boolean;                 // 是否保留同步日志
    logRetentionDays?: number;             // 日志保留天数
  };
  
  // 流程控制
  nextNodeId?: string;                   // 下一个节点ID
  x?: number;                            // 可视化位置X
  y?: number;                            // 可视化位置Y
}

// 审批流程配置
export interface WorkflowConfig {
  id: string;
  type: WorkflowType;                    // 流程类型
  name: string;                          // 流程名称
  description?: string;                  // 流程描述
  version: number;                       // 版本号
  isActive: boolean;                     // 是否启用
  nodes: WorkflowNode[];                 // 流程节点列表
  startNodeId: string;                   // 开始节点ID
  endNodeId: string;                     // 结束节点ID
  formFields?: FormFieldConfig[];        // 表单字段配置
  createdBy: string;                     // 创建人
  createdAt: string;                     // 创建时间
  updatedAt: string;                     // 更新时间
}

// 表单字段配置
export interface FormFieldConfig {
  name: string;                          // 字段名
  label: string;                         // 显示名
  type: 'text' | 'number' | 'select' | 'date' | 'file' | 'textarea';
  required: boolean;                     // 是否必填
  options?: { label: string; value: string }[];  // 下拉选项
  defaultValue?: any;                    // 默认值
  validation?: {                         // 验证规则
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// 条件规则（兼容旧版）
export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: number | string;
  targetSteps?: number[];
}

// 审批记录
export interface ApprovalRecord {
  id: string;
  workflowId: string;
  workflowType: WorkflowType;
  nodeId: string;                        // 节点ID
  nodeName: string;
  approverId: string;
  approverName: string;
  approverRole: UserRole;
  action: 'approve' | 'reject' | 'withdraw' | 'transfer' | 'return';
  comment?: string;
  returnToNodeId?: string;               // 退回到的节点ID
  createdAt: string;
}

// 工作流实例
export interface WorkflowInstance {
  id: string;
  type: WorkflowType;
  configId: string;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  title: string;
  content: any;
  status: WorkflowStatus;
  currentNodeId: string;                 // 当前节点ID
  nodeHistory: NodeHistory[];            // 节点历史记录
  records: ApprovalRecord[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// 节点历史记录
export interface NodeHistory {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  enteredAt: string;
  exitedAt?: string;
  approverId?: string;
  approverName?: string;
  comment?: string;
}

// ============================================================
// 教务系统类型定义
// ============================================================

// 星期枚举
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;  // 1=周一, 7=周日

// 节次枚举
export interface Period {
  index: number;                         // 第几节课（从1开始）
  name: string;                          // 名称，如"第一节"
  startTime: string;                     // 开始时间，如"08:00"
  endTime: string;                       // 结束时间，如"08:40"
  type: 'morning' | 'afternoon' | 'evening';  // 时段
}

// 课程信息
export interface Course {
  id: string;
  name: string;                          // 课程名称
  code?: string;                         // 课程代码
  subject: string;                       // 学科
  grade: number;                         // 年级
  type: 'required' | 'elective' | 'activity';  // 课程类型
  hoursPerWeek: number;                  // 每周课时
  description?: string;
}

// 教师任课信息
export interface TeacherCourse {
  id: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  subject: string;
  weeklyHours: number;                   // 周课时数
  isActive: boolean;
}

// 课表安排（单个课时段）
export interface ScheduleSlot {
  id: string;
  classId: string;                       // 班级ID
  className: string;
  grade: number;
  
  // 时间信息
  weekDay: WeekDay;                      // 星期几
  periodIndex: number;                   // 第几节课
  periodName: string;                    // 节次名称
  startTime: string;
  endTime: string;
  
  // 课程信息
  courseId: string;
  courseName: string;
  subject: string;
  
  // 教师信息
  teacherId: string;
  teacherName: string;
  
  // 场地信息
  classroomId?: string;
  classroomName?: string;
  
  // 状态
  status: 'normal' | 'substituted' | 'swapped' | 'cancelled' | 'makeup';
  originalTeacherId?: string;            // 原任课教师（代课时）
  originalTeacherName?: string;
  adjustRecordId?: string;               // 关联的调课记录ID
  
  // 时间戳
  effectiveDate?: string;                // 生效日期（临时调课）
  expireDate?: string;                   // 失效日期
}

// 班级课表
export interface ClassSchedule {
  id: string;
  classId: string;
  className: string;
  grade: number;
  semester: string;                      // 学期，如"2024-2025-1"
  weekStart: number;                     // 周次开始
  weekEnd: number;                       // 周次结束
  slots: ScheduleSlot[];
  updatedAt: string;
}

// 教师课表
export interface TeacherSchedule {
  id: string;
  teacherId: string;
  teacherName: string;
  semester: string;
  slots: ScheduleSlot[];
  updatedAt: string;
}

// 调课记录
export interface CourseAdjustment {
  id: string;
  
  // 关联信息
  workflowInstanceId?: string;           // 关联的工作流实例ID
  leaveRequestId?: string;               // 关联的请假申请ID
  
  // 申请人信息（请假教师）
  applicantId: string;
  applicantName: string;
  
  // 调课执行人
  adjusterId: string;
  adjusterName: string;
  
  // 调课类型
  adjustType: 'substitute' | 'swap' | 'cancel' | 'makeup';
  
  // 原课程信息
  originalSlot: {
    classId: string;
    className: string;
    weekDay: WeekDay;
    periodIndex: number;
    periodName: string;
    courseId: string;
    courseName: string;
    subject: string;
    teacherId: string;
    teacherName: string;
    date: string;                        // 具体日期
  };
  
  // 调课结果
  adjustResult: {
    // 代课
    substituteTeacherId?: string;
    substituteTeacherName?: string;
    
    // 调换
    swapWithSlot?: {
      classId: string;
      className: string;
      weekDay: WeekDay;
      periodIndex: number;
      date: string;
    };
    
    // 补课
    makeupSlot?: {
      weekDay: WeekDay;
      periodIndex: number;
      date: string;
    };
  };
  
  // 调课原因
  reason: string;
  reasonType: 'leave' | 'meeting' | 'training' | 'personal' | 'other';
  
  // 审批状态
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  // 同步状态
  syncStatus: {
    teacherSchedule: boolean;
    academicSchedule: boolean;
    classSchedule: boolean;
    electronicBoard: boolean;
    teacherAttendance: boolean;
  };
  
  // 通知状态
  notifyStatus: {
    substituteTeacher: boolean;
    originalTeacher: boolean;
    classStudents: boolean;
    classParents: boolean;
    headTeacher: boolean;
  };
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// 教师考勤记录
export interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;                          // 日期
  
  // 考勤状态
  status: 'present' | 'absent' | 'leave' | 'business_trip' | 'late' | 'early_leave';
  
  // 关联请假
  leaveRequestId?: string;
  leaveType?: string;
  leaveDuration?: number;                // 请假天数
  
  // 课程安排
  scheduledCourses: number;              // 当天应上课数
  actualCourses: number;                 // 实际上课数
  substitutedCourses: number;            // 被代课数
  
  // 备注
  remark?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 电子白板课表展示
export interface ElectronicBoardSchedule {
  id: string;
  classId: string;
  className: string;
  date: string;                          // 展示日期
  
  // 当天课程
  slots: {
    periodIndex: number;
    periodName: string;
    startTime: string;
    endTime: string;
    courseName: string;
    teacherName: string;
    status: 'normal' | 'substituted' | 'cancelled';
    substituteTeacherName?: string;
  }[];
  
  // 班级通知
  notices?: {
    content: string;
    type: 'info' | 'warning' | 'important';
    createdAt: string;
  }[];
  
  // 同步时间
  syncedAt: string;
}

// 学期配置
export interface Semester {
  id: string;
  name: string;                          // 如 "2024-2025学年第一学期"
  code: string;                          // 如 "2024-2025-1"
  startDate: string;
  endDate: string;
  totalWeeks: number;
  currentWeek: number;                   // 当前周次
  isActive: boolean;
}

// 作息时间表
export interface DailySchedule {
  id: string;
  semesterId: string;
  name: string;                          // 如 "春秋季作息"
  
  // 时间段配置
  periods: Period[];
  
  // 生效时间
  effectiveFrom: string;
  effectiveTo?: string;
}

// ============================================================
// 门禁管理系统类型定义
// ============================================================

// 门禁设备类型
export type AccessDeviceType = 
  | 'gate'           // 校门闸机
  | 'building'       // 楼宇门禁
  | 'classroom'      // 教室门禁
  | 'office'         // 办公室门禁
  | 'dormitory';     // 宿舍门禁

// 门禁设备状态
export type AccessDeviceStatus = 
  | 'online'         // 在线
  | 'offline'        // 离线
  | 'maintenance'    // 维护中
  | 'fault';         // 故障

// 门禁设备
export interface AccessDevice {
  id: string;
  name: string;                          // 设备名称，如"东校门入口"
  code: string;                          // 设备编码
  type: AccessDeviceType;
  location: string;                      // 安装位置
  buildingId?: string;                   // 所属建筑
  buildingName?: string;
  
  // 设备信息
  manufacturer?: string;                 // 厂商
  model?: string;                        // 型号
  sn?: string;                           // 序列号
  firmwareVersion?: string;              // 固件版本
  
  // 网络配置
  ipAddress?: string;
  macAddress?: string;
  port?: number;
  
  // 状态
  status: AccessDeviceStatus;
  lastOnline?: string;                   // 最后在线时间
  lastHeartbeat?: string;                // 最后心跳时间
  
  // 能力
  capabilities: {
    faceRecognition: boolean;            // 人脸识别
    cardReader: boolean;                 // 刷卡
    qrCode: boolean;                     // 二维码
    fingerprint: boolean;                // 指纹
    temperature: boolean;                // 体温检测
    metalDetection: boolean;             // 金属检测
  };
  
  // 通行方向
  direction: 'in' | 'out' | 'both';
  
  // 时间限制
  accessRules: AccessRule[];
  
  // 时间戳
  installDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 通行规则
export interface AccessRule {
  id: string;
  name: string;
  deviceId: string;
  
  // 时间规则
  timeType: 'always' | 'scheduled' | 'custom';
  schedule?: {
    weekdays: number[];                  // 允许的星期，1-7
    startTime: string;                   // 开始时间，如 "07:00"
    endTime: string;                     // 结束时间，如 "18:00"
  };
  
  // 人员限制
  allowedGroups: ('student' | 'teacher' | 'staff' | 'visitor')[];
  allowedGrades?: number[];              // 允许的年级（学生）
  allowedDepartments?: string[];         // 允许的部门（教师）
  
  // 状态
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// 人员类型
export type PersonType = 'student' | 'teacher' | 'staff' | 'visitor';

// 门禁人员信息（统一身份）
export interface AccessPerson {
  id: string;
  personId: string;                      // 关联的人员ID（学生/教师/后勤人员）
  personType: PersonType;
  
  // 基本信息
  name: string;
  gender: '男' | '女';
  avatar?: string;
  
  // 组织信息
  organization: string;                  // 班级/部门
  organizationId: string;
  grade?: number;                        // 年级（学生）
  
  // 联系方式
  phone?: string;
  
  // 认证信息
  credentials: AccessCredential[];
  
  // 权限配置
  permissions: AccessPermission[];
  
  // 状态
  status: 'active' | 'inactive' | 'suspended' | 'graduated';
  
  // 最后通行
  lastAccess?: {
    deviceId: string;
    deviceName: string;
    time: string;
    direction: 'in' | 'out';
  };
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 认证凭证
export interface AccessCredential {
  id: string;
  type: 'face' | 'card' | 'fingerprint' | 'qrcode';
  
  // 凭证数据
  data?: string;                         // 加密的凭证数据
  cardNo?: string;                       // 卡号
  templateId?: string;                   // 模板ID（人脸/指纹）
  
  // 状态
  status: 'active' | 'inactive' | 'expired';
  expireAt?: string;
  
  // 采集信息
  collectedAt?: string;
  collectedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 门禁权限
export interface AccessPermission {
  id: string;
  personId: string;
  deviceId: string;
  deviceName: string;
  
  // 权限类型
  permissionType: 'permanent' | 'temporary' | 'one_time';
  
  // 有效期
  validFrom?: string;
  validTo?: string;
  
  // 时间限制
  timeRestrictions?: {
    weekdays?: number[];
    startTime?: string;
    endTime?: string;
  };
  
  // 状态
  status: 'active' | 'expired' | 'revoked';
  
  // 审批信息
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  // 备注
  remark?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 通行记录
export interface AccessRecord {
  id: string;
  
  // 人员信息
  personId: string;
  personType: PersonType;
  personName: string;
  organization: string;                  // 班级/部门
  
  // 设备信息
  deviceId: string;
  deviceName: string;
  deviceType: AccessDeviceType;
  location: string;
  
  // 通行信息
  direction: 'in' | 'out';
  method: 'face' | 'card' | 'fingerprint' | 'qrcode' | 'manual';
  
  // 时间
  accessTime: string;
  
  // 状态
  status: 'success' | 'denied' | 'timeout' | 'exception';
  denyReason?: string;
  
  // 附加信息
  temperature?: number;                  // 体温
  image?: string;                        // 抓拍图片
  videoUrl?: string;                     // 录像链接
  
  // 异常标记
  isAbnormal?: boolean;
  abnormalType?: 'unregistered' | 'expired' | 'wrong_time' | 'blacklist' | 'other';
  
  createdAt: string;
}

// 访客信息
export interface Visitor {
  id: string;
  
  // 基本信息
  name: string;
  gender: '男' | '女';
  phone: string;
  idCard?: string;                       // 身份证号（脱敏）
  idType: '身份证' | '护照' | '其他';
  
  // 来访信息
  visitPurpose: string;
  visitType: '家长来访' | '公务来访' | '维修服务' | '快递配送' | '其他';
  
  // 被访人信息
  hostId: string;
  hostName: string;
  hostType: 'teacher' | 'staff' | 'student';
  hostPhone?: string;
  
  // 来访时间
  expectedArriveTime: string;
  expectedLeaveTime?: string;
  actualArriveTime?: string;
  actualLeaveTime?: string;
  
  // 陪同人员
  companions?: {
    name: string;
    idCard?: string;
    relation?: string;
  }[];
  
  // 车辆信息
  vehicleNo?: string;
  
  // 临时权限
  temporaryAccess: {
    deviceId: string;
    deviceName: string;
    validFrom: string;
    validTo: string;
    qrCode?: string;                     // 临时通行二维码
  }[];
  
  // 状态
  status: 'pending' | 'approved' | 'arrived' | 'left' | 'cancelled' | 'rejected';
  
  // 审批信息
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  // 备注
  remark?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 门禁告警
export interface AccessAlarm {
  id: string;
  
  // 告警类型
  type: 'intrusion' | 'tailgating' | 'device_fault' | 'offline' | 'blacklist' | 'timeout_stay' | 'other';
  level: 'info' | 'warning' | 'critical';
  
  // 关联设备
  deviceId: string;
  deviceName: string;
  location: string;
  
  // 关联人员
  personId?: string;
  personName?: string;
  
  // 告警内容
  title: string;
  description: string;
  
  // 处理状态
  status: 'pending' | 'processing' | 'resolved' | 'ignored';
  
  // 处理信息
  handledBy?: string;
  handledByName?: string;
  handledAt?: string;
  handleResult?: string;
  
  // 证据
  images?: string[];
  videoUrl?: string;
  
  // 时间
  alarmTime: string;
  createdAt: string;
}

// 门禁统计
export interface AccessStatistics {
  // 今日统计
  todayTotal: number;                    // 今日通行总数
  todayIn: number;                       // 今日进入
  todayOut: number;                      // 今日离开
  
  // 人员分类统计
  byPersonType: {
    type: PersonType;
    count: number;
  }[];
  
  // 时段统计
  hourlyStats: {
    hour: number;
    in: number;
    out: number;
  }[];
  
  // 设备统计
  deviceStats: {
    deviceId: string;
    deviceName: string;
    total: number;
    abnormal: number;
  }[];
  
  // 异常统计
  abnormalCount: number;
  abnormalTypes: {
    type: string;
    count: number;
  }[];
  
  // 访客统计
  visitorCount: number;
  pendingVisitorCount: number;
  
  // 设备状态
  deviceOnlineCount: number;
  deviceOfflineCount: number;
  deviceFaultCount: number;
}
