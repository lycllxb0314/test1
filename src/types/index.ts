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
  | 'parent'       // 家长端
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

/**
 * 班级教师职位类型
 */
export type ClassTeacherPosition = 'head_teacher' | 'subject_teacher';

/**
 * 班级教师关系状态
 */
export type ClassTeacherStatus = 'active' | 'expired';

/**
 * 班级教师关系
 * 用于管理班主任和科任教师与班级的关系，支持敏感数据访问权限判断
 */
export interface ClassTeacher {
  id: string;
  classId: string;                    // 班级ID
  className: string;                  // 班级名称（冗余，便于展示）
  grade: number;                      // 年级（冗余）
  teacherId: string;                  // 教师ID
  teacherName: string;                // 教师姓名（冗余）
  position: ClassTeacherPosition;     // 职位类型：班主任/科任
  subjects?: string[];                // 任教科目数组（科任时填写）
  semester: string;                   // 学期，如"2024-2025-1"
  status: ClassTeacherStatus;         // 状态：有效/已失效
  createdBy?: string;                 // 创建人ID
  createdByName?: string;             // 创建人姓名
  createdAt: string;                  // 创建时间
  updatedAt?: string;                 // 更新时间
}

/**
 * 创建班级教师关系请求
 */
export interface CreateClassTeacherRequest {
  classId: string;
  teacherId: string;
  position: ClassTeacherPosition;
  subjects?: string[];
  semester: string;
}

/**
 * 更新班级教师关系请求
 */
export interface UpdateClassTeacherRequest {
  subjects?: string[];
  status?: ClassTeacherStatus;
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
  grade?: number;                // 年级（1-6）
  gradeName?: string;            // 年级名称
  headTeacherId?: string;        // 班主任ID
  headTeacherName?: string;      // 班主任姓名
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
  parents: Parent[];
  avatar?: string;
}

// 学生完整档案（用于详情页展示）
export interface StudentFullProfile {
  id: string;
  studentNo: string;
  
  // === 基本信息 ===
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;              // 身份证号
  ethnicity?: string;           // 民族
  nativePlace?: string;         // 籍贯
  politicalStatus?: string;     // 政治面貌（少先队员等）
  
  // === 学籍信息 ===
  grade: number;                // 年级（1-6）
  gradeName: string;            // 年级名称
  classId: string;
  className: string;
  classNumber: number;          // 班级号
  enrollmentDate: string;       // 入学日期
  studentType?: '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭';
  
  // === 联系信息 ===
  phone?: string;
  address?: string;
  homeAddress?: string;         // 家庭详细地址
  
  // === 家庭信息 ===
  familyType?: '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他';
  parents: Parent[];
  emergencyContact?: string;    // 紧急联系人
  emergencyPhone?: string;      // 紧急联系电话
  
  // === 班级信息 ===
  headTeacherId?: string;
  headTeacherName?: string;     // 班主任姓名
  
  // === 状态 ===
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
  statusReason?: string;        // 状态变更原因
  
  // === 学业信息 ===
  academicRecords: StudentAcademicRecord[];
  
  // === 荣誉奖项 ===
  honors: StudentHonor[];
  
  // === 成长记录 ===
  growthRecords: StudentGrowthRecord[];
  
  // === 习惯养成 ===
  habitProfile?: {
    overallScore: number;
    level: '优秀' | '良好' | '合格' | '待提高';
    habitStarCount: number;
    monthlyStars: string[];
  };
  
  // === 德育表现 ===
  moralRecords: StudentMoralRecord[];
  
  // === 出勤统计 ===
  attendanceStats?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    attendanceRate: number;
  };
  
  // === 头像 ===
  avatar?: string;
  
  // === 时间戳 ===
  createdAt: string;
  updatedAt: string;
}

// 学业记录
export interface StudentAcademicRecord {
  id: string;
  studentId: string;
  semester: string;             // 学期，如 "2024-2025-1"
  examType: string;             // 考试类型：期中、期末、单元测试
  subject: string;              // 科目
  score?: number;               // 分数
  level?: '优秀' | '良好' | '合格' | '待提高';  // 等级
  classRank?: number;           // 班级排名
  gradeRank?: number;           // 年级排名
  progress?: number;            // 进步幅度
  teacherComment?: string;      // 教师评语
  createdAt: string;
}

// 学生荣誉
export interface StudentHonor {
  id: string;
  studentId: string;
  title: string;
  level: '国家级' | '省级' | '市级' | '区级' | '校级' | '班级';
  category: '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
}

// 成长记录
export interface StudentGrowthRecord {
  id: string;
  studentId: string;
  type: '入学' | '转学' | '休学' | '复学' | '毕业' | '表彰' | '处分' | '家访' | '谈心' | '其他';
  title: string;
  description?: string;
  date: string;
  operator?: string;            // 操作人
  attachments?: string[];
  createdAt: string;
}

// 德育记录
export interface StudentMoralRecord {
  id: string;
  studentId: string;
  type: '表扬' | '批评' | '志愿服务' | '社会实践' | '升旗仪式' | '其他';
  title: string;
  content?: string;
  score?: number;               // 德育分数（正数为加分，负数为减分）
  date: string;
  recorder?: string;            // 记录人
  createdAt: string;
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
  weekDay: WeekDay;                      // 星期几 (1-7)
  periodIndex: number;                   // 第几节课
  periodName?: string;                   // 节次名称
  startTime?: string;
  endTime?: string;
  semester?: string;                     // 学期，如"2024-2025-1"
  
  // 课程信息
  courseId?: string;
  courseName: string;
  subject: string;
  courseType?: 'normal' | 'activity' | 'self_study' | 'meeting';  // 课程类型
  
  // 教师信息
  teacherId: string;
  teacherName: string;
  
  // 场地信息
  roomId?: string;
  roomName?: string;
  classroomId?: string;                  // 兼容旧字段
  classroomName?: string;
  venueType?: 'classroom' | 'lab' | 'playground' | 'music_room' | 'art_room' | 'computer_room';
  
  // 状态
  status: 'normal' | 'substituted' | 'swapped' | 'cancelled' | 'makeup' | 'adjusted';
  originalTeacherId?: string;            // 原任课教师（代课时）
  originalTeacherName?: string;
  adjustRecordId?: string;               // 关联的调课记录ID
  substituteRecordId?: string;           // 代课记录ID
  
  // 时间戳
  createdAt: string;
  updatedAt?: string;
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
// 教研室/教室预约系统类型定义
// ============================================================

// 教室类型
export type RoomType = 
  | 'seminar_room'      // 教研室
  | 'lecture_hall'      // 阶梯教室
  | 'multimedia_room'   // 多媒体教室
  | 'lab'               // 实验室
  | 'meeting_room'      // 会议室
  | 'activity_room';    // 活动室

// 教室状态
export type RoomStatus = 
  | 'available'         // 可用
  | 'in_use'            // 使用中
  | 'reserved'          // 已预约
  | 'maintenance'       // 维护中
  | 'locked';           // 已锁定

// 教室资源
export interface Room {
  id: string;
  name: string;                          // 教室名称，如"2号楼教研室"
  code: string;                          // 教室编码
  type: RoomType;
  building: string;                      // 所属楼栋
  floor: number;                         // 楼层
  location: string;                      // 具体位置
  
  // 容量与配置
  capacity: number;                      // 容纳人数
  area?: number;                         // 面积（平方米）
  
  // 设施配置
  facilities: {
    projector: boolean;                  // 投影仪
    computer: boolean;                   // 电脑
    microphone: boolean;                 // 麦克风
    speaker: boolean;                    // 音响
    whiteboard: boolean;                 // 白板
    blackboard: boolean;                 // 黑板
    airConditioner: boolean;             // 空调
    wifi: boolean;                       // 无线网络
    videoConference: boolean;            // 视频会议设备
    recording: boolean;                  // 录播设备
  };
  
  // 附加设施
  extraFacilities?: string[];            // 如：['钢琴', '实验器材']
  
  // 状态
  status: RoomStatus;
  
  // 管理信息
  managerId?: string;                    // 管理员ID
  managerName?: string;                  // 管理员姓名
  departmentId?: string;                 // 归属部门
  
  // 使用统计
  usageStats?: {
    totalBookings: number;               // 总预约次数
    thisMonth: number;                   // 本月预约次数
    lastUsedAt?: string;                 // 最后使用时间
  };
  
  // 图片
  images?: string[];
  
  // 备注
  remark?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 预约状态
export type BookingStatus = 
  | 'pending'           // 待审批
  | 'approved'          // 已批准
  | 'rejected'          // 已拒绝
  | 'cancelled'         // 已取消
  | 'completed'         // 已完成
  | 'in_progress';      // 进行中

// 预约用途类型
export type BookingPurpose = 
  | 'teaching'          // 教学活动
  | 'meeting'           // 教研会议
  | 'training'          // 培训讲座
  | 'activity'          // 学生活动
  | 'exam'              // 考试
  | 'defense'           // 答辩
  | 'competition'       // 比赛
  | 'other';            // 其他

// 教室预约申请
export interface RoomBooking {
  id: string;
  
  // 教室信息
  roomId: string;
  roomName: string;
  roomType: RoomType;
  building: string;
  location: string;
  
  // 申请人信息
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  department?: string;
  phone?: string;
  
  // 预约信息
  purpose: BookingPurpose;
  purposeDetail?: string;                // 详细用途说明
  title: string;                         // 活动标题
  description?: string;                  // 活动描述
  
  // 时间信息
  bookingDate: string;                   // 预约日期
  startTime: string;                     // 开始时间，如 "14:00"
  endTime: string;                       // 结束时间，如 "16:00"
  duration: number;                      // 时长（分钟）
  
  // 参与信息
  expectedAttendees: number;             // 预计参与人数
  attendeeType?: 'teacher' | 'student' | 'mixed' | 'external';  // 参与人员类型
  
  // 设备需求
  requiredFacilities?: string[];         // 需要使用的设备
  
  // 审批信息
  status: BookingStatus;
  approvalFlow: BookingApprovalNode[];
  currentStep: number;
  rejectReason?: string;                 // 拒绝原因
  
  // 冲突处理
  conflictWith?: {
    bookingId: string;
    title: string;
    time: string;
  };
  
  // 取消信息
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelReason?: string;
  
  // 实际使用
  actualStartTime?: string;
  actualEndTime?: string;
  actualAttendees?: number;
  usageReport?: string;                  // 使用报告/反馈
  
  // 关联总务
  maintenanceRequest?: string;           // 关联维修申请ID
  cleaningRequired?: boolean;            // 是否需要保洁
  cleaningRequested?: boolean;           // 已请求保洁
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 预约审批节点
export interface BookingApprovalNode {
  id: string;
  step: number;
  name: string;                          // 节点名称
  approverType: 'room_manager' | 'department_head' | 'academic_office' | 'general_office';
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}

// 教室使用记录（用于统计和追溯）
export interface RoomUsageRecord {
  id: string;
  roomId: string;
  roomName: string;
  bookingId: string;
  
  // 使用信息
  date: string;
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  
  // 使用者
  userId: string;
  userName: string;
  department?: string;
  
  // 活动信息
  title: string;
  purpose: BookingPurpose;
  attendeeCount?: number;
  
  // 状态
  status: 'completed' | 'cancelled' | 'no_show' | 'early_end';
  
  // 设备问题
  equipmentIssues?: string[];
  
  // 备注
  remark?: string;
  
  createdAt: string;
}

// 教室维护记录（关联总务）
export interface RoomMaintenanceRecord {
  id: string;
  roomId: string;
  roomName: string;
  
  // 维护类型
  type: 'cleaning' | 'repair' | 'inspection' | 'upgrade';
  
  // 维护信息
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  
  // 关联
  bookingId?: string;                    // 关联的预约
  repairRequestId?: string;              // 关联总务维修申请
  
  // 时间
  scheduledDate?: string;
  completedDate?: string;
  
  // 执行人
  executorId?: string;
  executorName?: string;
  
  // 费用
  cost?: number;
  
  createdAt: string;
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


// ============================================================
// 习惯养成评价系统类型定义
// ============================================================

// 八大习惯类别
export type HabitCategory = 
  | 'civilization'    // 文明习惯
  | 'writing'         // 书写习惯
  | 'reading'         // 阅读习惯
  | 'sports'          // 运动习惯
  | 'safety'          // 安全习惯
  | 'hygiene'         // 卫生习惯
  | 'aesthetic'       // 审美习惯
  | 'labor';          // 劳动习惯

// 习惯类别中文名称映射
export const habitCategoryNames: Record<HabitCategory, string> = {
  civilization: '文明习惯',
  writing: '书写习惯',
  reading: '阅读习惯',
  sports: '运动习惯',
  safety: '安全习惯',
  hygiene: '卫生习惯',
  aesthetic: '审美习惯',
  labor: '劳动习惯',
};

// 习惯类别图标映射
export const habitCategoryIcons: Record<HabitCategory, string> = {
  civilization: 'Heart',
  writing: 'Pen',
  reading: 'BookOpen',
  sports: 'Trophy',
  safety: 'Shield',
  hygiene: 'Sparkles',
  aesthetic: 'Palette',
  labor: 'Hammer',
};

// 习惯类别颜色映射
export const habitCategoryColors: Record<HabitCategory, string> = {
  civilization: 'text-red-600 bg-red-50',
  writing: 'text-blue-600 bg-blue-50',
  reading: 'text-green-600 bg-green-50',
  sports: 'text-orange-600 bg-orange-50',
  safety: 'text-purple-600 bg-purple-50',
  hygiene: 'text-teal-600 bg-teal-50',
  aesthetic: 'text-pink-600 bg-pink-50',
  labor: 'text-amber-600 bg-amber-50',
};

// 年级段
export type GradeLevel = 'lower' | 'middle' | 'upper';  // 低年级(1-2)、中年级(3-4)、高年级(5-6)

// 习惯目标定义
export interface HabitGoal {
  id: string;
  category: HabitCategory;
  code: string;                          // 目标编码，如 "C01"
  title: string;                         // 目标标题，如"理性爱国"
  description: string;                   // 目标描述
  gradeLevel: GradeLevel;                // 适用年级段
  indicators: string[];                  // 具体表现指标
  maxScore: number;                      // 满分
}

// 学生月度小目标
export interface StudentMonthlyGoal {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;                         // 年级
  month: string;                         // 月份，如 "2024-03"
  
  // 小目标列表（每月最多8个，对应八大习惯）
  goals: MonthlyGoalItem[];
  
  // 家长参与
  parentSignature?: string;
  parentPhone?: string;
  parentEvaluation?: string;
  
  // 班主任审核
  teacherReview?: string;
  isHabitStar: boolean;                  // 是否评为月度习惯之星
  
  // 统计
  totalGoals: number;
  achievedGoals: number;
  achievementRate: number;               // 达成率
  
  createdAt: string;
  updatedAt: string;
}

// 月度小目标项
export interface MonthlyGoalItem {
  id: string;
  category: HabitCategory;
  goalId: string;                        // 关联习惯目标
  title: string;                         // 小目标标题
  description?: string;                  // 具体内容
  
  // 过程记录（每日/每周）
  records: GoalRecord[];
  
  // 统计
  totalDays: number;                     // 总天数
  achievedDays: number;                  // 达标天数
  achievementRate: number;               // 达成率
  isAchieved: boolean;                   // 是否达成月度目标
}

// 目标记录（每日/每周）
export interface GoalRecord {
  date: string;                          // 日期
  achieved: boolean;                     // 是否达标（☆/△）
  note?: string;                         // 备注
  recordedBy: 'student' | 'parent' | 'teacher';
  recordedAt: string;
}

// 习惯评价记录（即时评价）
export interface HabitAssessment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  
  // 评价信息
  category: HabitCategory;
  goalId?: string;
  type: 'praise' | 'improve';            // 表扬/待改进
  title: string;
  content: string;
  score: number;                         // 分数（表扬为正，待改进为负）
  
  // 场景
  scene: 'classroom' | 'campus' | 'home' | 'activity' | 'other';
  
  // 证据
  images?: string[];
  
  // 记录人
  recorderId: string;
  recorderName: string;
  recorderRole: 'teacher' | 'parent' | 'student';
  
  occurredAt: string;
  createdAt: string;
}

// 习惯之星
export interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;
  
  // 评选信息
  month: string;
  category?: HabitCategory;              // 分类之星（可选）
  achievementRate: number;               // 达成率
  
  // 荣誉
  level: 'class' | 'grade' | 'school';   // 班级之星/年级之星/校级之星
  
  // 奖励
  reward?: string;
  
  createdAt: string;
}

// 学生习惯档案（汇总视图）
export interface StudentHabitProfile {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;
  
  // 各习惯类别得分
  categoryScores: {
    category: HabitCategory;
    score: number;
    maxScore: number;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  // 总体评价
  totalScore: number;
  totalMaxScore: number;
  overallRate: number;
  level: '优秀' | '良好' | '合格' | '待提高';
  
  // 荣誉统计
  habitStarCount: number;
  monthlyStars: string[];                // 获评月份
  
  // 成长轨迹
  monthlyTrend: {
    month: string;
    rate: number;
  }[];
  
  // 突出表现
  highlights: {
    category: HabitCategory;
    description: string;
  }[];
  
  // 待改进
  improvements: {
    category: HabitCategory;
    suggestion: string;
  }[];
  
  updatedAt: string;
}

// 班级习惯统计
export interface ClassHabitStats {
  classId: string;
  className: string;
  grade: number;
  month: string;
  
  // 各习惯类别平均达成率
  categoryRates: {
    category: HabitCategory;
    rate: number;
    rank: number;                        // 年级排名
  }[];
  
  // 整体数据
  averageRate: number;
  gradeRank: number;
  
  // 习惯之星
  habitStarCount: number;
  habitStars: {
    studentId: string;
    studentName: string;
  }[];
  
  // 预警学生
  warningStudents: {
    studentId: string;
    studentName: string;
    lowCategories: HabitCategory[];
  }[];
}

// ============================================================
// 智慧教研系统类型定义
// ============================================================

// 教研活动类型
export type ResearchActivityType = 
  | 'collective_prep'    // 集体备课
  | 'lesson_observation' // 听课评课
  | 'thematic_study'     // 专题研修
  | 'project_research'   // 课题研究
  | 'training'           // 培训活动
  | 'competition';       // 教学比赛

// 教研活动
export interface ResearchActivity {
  id: string;
  type: ResearchActivityType;
  title: string;
  description?: string;
  
  // 组织信息
  organizerId: string;
  organizerName: string;
  department: string;                    // 教研组
  participantIds: string[];
  participantNames: string[];
  
  // 时间地点
  startDate: string;
  endDate: string;
  location: string;
  
  // 内容
  subject?: string;                      // 学科
  grade?: number;                        // 年级
  topic?: string;                        // 主题
  objectives?: string[];                 // 活动目标
  
  // 资源
  materials?: ResearchMaterial[];
  
  // 成果
  outcomes?: string[];
  summary?: string;
  
  status: 'planning' | 'ongoing' | 'completed';
  
  createdAt: string;
  updatedAt: string;
}

// 教研资源
export interface ResearchMaterial {
  id: string;
  name: string;
  type: 'document' | 'video' | 'image' | 'link';
  url: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: string;
}

// 集体备课
export interface CollectivePreparation {
  id: string;
  subject: string;
  grade: number;
  topic: string;                         // 备课主题
  unit?: string;                         // 单元
  lesson?: string;                       // 课时
  
  // 主备人
  hostId: string;
  hostName: string;
  
  // 参与人
  participantIds: string[];
  participantNames: string[];
  
  // 时间
  scheduledDate: string;
  startTime: string;
  endTime: string;
  location: string;
  
  // 备课内容
  teachingObjectives?: string[];         // 教学目标
  keyPoints?: string[];                  // 教学重点
  difficulties?: string[];               // 教学难点
  methods?: string[];                    // 教学方法
  
  // 教案
  lessonPlan?: {
    content: string;
    attachments: string[];
    version: number;
    lastEditedBy: string;
    lastEditedAt: string;
  };
  
  // 讨论记录
  discussions: PreparationDiscussion[];
  
  // 成果
  finalPlan?: string;                    // 最终教案
  pptUrl?: string;                       // 课件链接
  
  status: 'draft' | 'discussing' | 'finalized';
  
  createdAt: string;
  updatedAt: string;
}

// 备课讨论
export interface PreparationDiscussion {
  id: string;
  speakerId: string;
  speakerName: string;
  content: string;
  topic?: string;                        // 讨论议题
  replyTo?: string;                      // 回复的讨论ID
  createdAt: string;
}

// 听课评课
export interface LessonObservation {
  id: string;
  
  // 课程信息
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: number;
  className: string;
  lessonTopic: string;
  
  // 时间地点
  date: string;
  period: number;
  classroom: string;
  
  // 听课人
  observerIds: string[];
  observerNames: string[];
  
  // 评价维度
  evaluations: LessonEvaluation[];
  
  // 综合评价
  overallScore: number;
  overallComment?: string;
  strengths?: string[];                   // 优点
  suggestions?: string[];                 // 建议
  
  // 课堂记录
  notes?: string;
  images?: string[];
  
  status: 'scheduled' | 'ongoing' | 'completed';
  
  createdAt: string;
  updatedAt: string;
}

// 课堂评价维度
export interface LessonEvaluation {
  id: string;
  dimension: string;                     // 评价维度，如"教学设计"
  indicators: EvaluationIndicator[];     // 评价指标
  score: number;
  maxScore: number;
  comment?: string;
}

// 评价指标
export interface EvaluationIndicator {
  id: string;
  content: string;                       // 指标内容
  score: number;
  maxScore: number;
  level: 'excellent' | 'good' | 'qualified' | 'unqualified';
}

// 评价量表模板
export interface EvaluationTemplate {
  id: string;
  name: string;
  subject?: string;                      // 适用学科
  description?: string;
  
  dimensions: {
    name: string;
    weight: number;                      // 权重
    maxScore: number;
    indicators: {
      content: string;
      maxScore: number;
      criteria: string;                  // 评分标准
    }[];
  }[];
  
  isDefault: boolean;
  createdAt: string;
}

// 教师教研档案
export interface TeacherResearchProfile {
  teacherId: string;
  teacherName: string;
  
  // 教研活动统计
  totalActivities: number;
  activityByType: {
    type: ResearchActivityType;
    count: number;
  }[];
  
  // 听课统计
  lessonsObserved: number;               // 听课节数
  lessonsTaught: number;                 // 被听课节数
  averageScore?: number;                 // 平均得分
  
  // 备课统计
  lessonsPrepared: number;               // 主备节数
  lessonsParticipated: number;           // 参与节数
  
  // 课题研究
  projects: {
    id: string;
    name: string;
    role: 'host' | 'core_member' | 'participant';
    status: 'ongoing' | 'completed';
  }[];
  
  // 培训研修
  trainings: {
    id: string;
    name: string;
    hours: number;
    completedAt: string;
  }[];
  totalTrainingHours: number;
  
  // 教学成果
  achievements: {
    id: string;
    title: string;
    type: string;
    level: string;
    date: string;
  }[];
  
  updatedAt: string;
}

// ============================================================
// 班级管理类型定义
// ============================================================

// 班级信息
export interface ClassInfo {
  id: string;
  name: string;                          // 班级名称，如"一年（1）班"
  grade: number;                         // 年级，1-6
  classNumber: number;                   // 班号
  
  // 班主任
  headTeacherId: string;
  headTeacherName: string;
  
  // 学生信息
  studentCount: number;
  maleCount: number;
  femaleCount: number;
  
  // 教室
  classroomId?: string;
  classroomName?: string;
  building?: string;
  
  // 年段长
  gradeLeaderId?: string;
  gradeLeaderName?: string;
  
  // 状态
  status: 'active' | 'graduated';
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 类型别名（向后兼容）
// ============================================================

// 调课记录别名
export type ScheduleChange = CourseAdjustment;

// ============================================================
// 报销管理类型定义
// ============================================================

/**
 * 报销类型
 */
export type ExpenseCategory = 
  | 'office_supplies'     // 办公用品
  | 'travel'              // 差旅费
  | 'training'            // 培训费用
  | 'teaching_materials'  // 教学材料
  | 'activity'            // 活动经费
  | 'transportation'      // 交通费
  | 'communication'       // 通讯费
  | 'equipment'           // 设备费用
  | 'maintenance'         // 维修费用
  | 'other';              // 其他

/**
 * 报销状态
 */
export type ExpenseStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待审批
  | 'approved'     // 已批准
  | 'rejected'     // 已拒绝
  | 'processing'   // 财务处理中
  | 'completed'    // 已完成（已打款）
  | 'cancelled';   // 已取消

/**
 * 报销项目明细
 */
export interface ExpenseItem {
  id: string;
  /** 项目名称 */
  name: string;
  /** 类别 */
  category: ExpenseCategory;
  /** 金额 */
  amount: number;
  /** 说明 */
  description?: string;
  /** 发票号 */
  invoiceNo?: string;
  /** 发票图片（单个，已废弃，建议使用invoiceImages） */
  invoiceImage?: string;
  /** 发票图片列表 */
  invoiceImages?: string[];
  /** 支付凭证（教师垫付款项的凭证，如支付宝/微信转账截图） */
  paymentProofs?: string[];
  /** 发生日期 */
  expenseDate: string;
}

/**
 * 报销申请
 */
export interface ExpenseReimbursement {
  id: string;
  
  // === 基本信息 ===
  /** 报销单号 */
  expenseNo: string;
  /** 标题 */
  title: string;
  
  // === 申请人信息 ===
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  department: string;
  phone?: string;
  
  // === 报销详情 ===
  /** 报销类别 */
  category: ExpenseCategory;
  /** 报销项目明细 */
  items: ExpenseItem[];
  /** 总金额 */
  totalAmount: number;
  /** 报销说明 */
  description: string;
  /** 附件 */
  attachments?: string[];
  
  // === 关联信息 ===
  /** 关联的项目/活动ID */
  relatedId?: string;
  /** 关联的项目/活动名称 */
  relatedName?: string;
  
  // === 审批流程 ===
  status: ExpenseStatus;
  /** 审批流程节点 */
  approvalFlow: ApprovalNode[];
  /** 当前审批步骤 */
  currentStep: number;
  /** 审批记录 */
  approvalRecords: ApprovalRecord[];
  
  // === 财务处理 ===
  /** 财务处理人ID */
  financeHandlerId?: string;
  /** 财务处理人姓名 */
  financeHandlerName?: string;
  /** 支付单号 */
  paymentNo?: string;
  /** 打款时间 */
  paymentDate?: string;
  /** 打款凭证（单个，已废弃，建议使用paymentVouchers） */
  paymentVoucher?: string;
  /** 打款凭证列表 */
  paymentVouchers?: string[];
  /** 银行流水号 */
  bankTransactionNo?: string;
  /** 财务备注 */
  financeRemark?: string;
  
  // === 时间戳 ===
  createdAt: string;
  updatedAt: string;
  /** 提交时间 */
  submittedAt?: string;
  /** 完成时间 */
  completedAt?: string;
}

/**
 * 报销类别配置
 */
export interface ExpenseCategoryConfig {
  id: ExpenseCategory;
  name: string;
  description: string;
  /** 是否需要关联项目 */
  requireProject?: boolean;
  /** 上限金额（需要更高级别审批） */
  limitAmount?: number;
  /** 图标 */
  icon?: string;
}

/**
 * 报销统计
 */
export interface ExpenseStatistics {
  /** 待审批数量 */
  pendingCount: number;
  /** 处理中数量 */
  processingCount: number;
  /** 已完成数量 */
  completedCount: number;
  /** 本月已报销金额 */
  monthlyAmount: number;
  /** 本年已报销金额 */
  yearlyAmount: number;
  /** 待报销金额 */
  pendingAmount: number;
  /** 已批准待支付金额 */
  approvedAmount: number;
  /** 总金额 */
  totalAmount: number;
}

// ==================== 智能排课系统 ====================

/**
 * 课程时段配置
 */
export interface PeriodConfig {
  id: string;
  /** 节次序号 */
  index: number;
  /** 节次名称 */
  name: string;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 时段类型 */
  type: 'morning' | 'afternoon' | 'evening';
  /** 是否启用 */
  isActive: boolean;
}

/**
 * 排课规则
 */
export interface ScheduleRule {
  id: string;
  
  // === 规则基本信息 ===
  /** 规则名称 */
  name: string;
  /** 规则类型 */
  type: 'teacher_conflict' | 'room_conflict' | 'subject_distribution' | 'teacher_preference' | 'special_time';
  /** 规则描述 */
  description: string;
  
  // === 规则配置 ===
  /** 规则参数 */
  params: Record<string, any>;
  /** 优先级 1-10，10最高 */
  priority: number;
  /** 是否启用 */
  isActive: boolean;
  
  // === 适用范围 ===
  /** 适用的年级，空表示所有年级 */
  applyGrades?: number[];
  /** 适用的科目，空表示所有科目 */
  applySubjects?: string[];
  
  createdAt: string;
  updatedAt: string;
}

/**
 * 教学任务（排课基础数据）
 */
export interface TeachingTask {
  id: string;
  
  // === 课程信息 ===
  /** 科目 */
  subject: string;
  /** 班级ID */
  classId: string;
  /** 班级名称 */
  className: string;
  /** 年级 */
  grade: number;
  
  // === 教师信息 ===
  /** 教师ID */
  teacherId: string;
  /** 教师姓名 */
  teacherName: string;
  
  // === 课时信息 ===
  /** 每周课时数 */
  weeklyHours: number;
  /** 已安排课时数 */
  arrangedHours: number;
  
  // === 连堂配置 ===
  /** 是否允许连堂 */
  allowContinuous: boolean;
  /** 连堂节数（2表示双连堂） */
  continuousCount?: number;
  
  // === 学期信息 ===
  semester: string;
  
  // === 状态 ===
  status: 'pending' | 'partial' | 'completed';
  
  createdAt: string;
  updatedAt: string;
}

/**
 * 代课记录
 */
export interface SubstituteRecord {
  id: string;
  
  // === 关联信息 ===
  /** 关联的请假申请ID */
  leaveRequestId: string;
  /** 关联的课表槽位ID */
  scheduleSlotId: string;
  
  // === 原任教师信息 ===
  originalTeacherId: string;
  originalTeacherName: string;
  
  // === 代课教师信息 ===
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  
  // === 课程信息 ===
  classId: string;
  className: string;
  subject: string;
  courseName: string;
  weekDay: number;
  periodIndex: number;
  periodName: string;
  semester: string;
  
  // === 代课状态 ===
  /** 代课状态 */
  status: 'pending' | 'arranged' | 'completed' | 'cancelled';
  /** 代课类型 */
  substituteType: 'temporary' | 'long_term';
  
  // === 安排信息 ===
  /** 安排人ID（年段长） */
  arrangerId?: string;
  /** 安排人姓名 */
  arrangerName?: string;
  /** 安排时间 */
  arrangedAt?: string;
  /** 安排备注 */
  arrangeRemark?: string;
  
  // === 请假信息（冗余，方便查询） ===
  leaveTeacherName: string;
  leaveReason: string;
  leaveStartDate: string;
  leaveEndDate: string;
  
  // === 完成信息 ===
  completedAt?: string;
  completionRemark?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * 课表变更日志
 */
export interface ScheduleChangeLog {
  id: string;
  
  // === 变更信息 ===
  /** 变更类型 */
  changeType: 'create' | 'update' | 'delete' | 'substitute' | 'cancel_substitute';
  /** 关联的课表槽位ID */
  scheduleSlotId: string;
  
  // === 变更前后数据 ===
  /** 变更前数据 */
  beforeData?: Partial<ScheduleSlot>;
  /** 变更后数据 */
  afterData?: Partial<ScheduleSlot>;
  
  // === 关联信息 ===
  /** 关联的代课记录ID */
  substituteRecordId?: string;
  /** 关联的请假申请ID */
  leaveRequestId?: string;
  
  // === 操作信息 ===
  /** 操作人ID */
  operatorId: string;
  /** 操作人姓名 */
  operatorName: string;
  /** 操作时间 */
  operatedAt: string;
  /** 变更原因 */
  reason: string;
  
  createdAt: string;
}

/**
 * 排课结果
 */
export interface ScheduleResult {
  /** 是否成功 */
  success: boolean;
  /** 生成的课表 */
  slots: ScheduleSlot[];
  /** 冲突列表 */
  conflicts: ScheduleConflict[];
  /** 统计信息 */
  statistics: {
    totalSlots: number;
    arrangedSlots: number;
    conflictCount: number;
    coverageRate: number;
  };
  /** 排课耗时（毫秒） */
  duration: number;
}

/**
 * 排课冲突
 */
export interface ScheduleConflict {
  id: string;
  /** 冲突类型 */
  type: 'teacher_conflict' | 'room_conflict' | 'time_conflict' | 'class_conflict' | 'rule_violation';
  /** 冲突描述 */
  description: string;
  /** 相关的课表槽位 */
  relatedSlots: string[];
  /** 冲突严重程度 */
  severity: 'error' | 'warning' | 'info';
  /** 建议的解决方案 */
  suggestions?: string[];
}

/**
 * 代课安排请求
 */
export interface SubstituteArrangeRequest {
  /** 代课记录ID */
  substituteRecordId: string;
  /** 代课教师ID */
  substituteTeacherId: string;
  /** 代课教师姓名 */
  substituteTeacherName: string;
  /** 安排人ID */
  arrangerId: string;
  /** 安排人姓名 */
  arrangerName: string;
  /** 安排备注 */
  remark?: string;
}

/**
 * 课表视图类型
 */
export type ScheduleViewType = 'class' | 'teacher' | 'room' | 'grade';

/**
 * 课表统计
 */
export interface ScheduleStatistics {
  /** 班级数 */
  classCount: number;
  /** 教师数 */
  teacherCount: number;
  /** 课程总数 */
  totalCourses: number;
  /** 本周代课数 */
  weeklySubstitutes: number;
  /** 待安排代课数 */
  pendingSubstitutes: number;
  /** 课程覆盖率 */
  coverageRate: number;
}

// ==================== 课表与工作量系统 ====================

/**
 * 基准课表
 * 学期开始前确定的课表，作为整个学期的基准
 */
export interface BaseSchedule {
  id: string;
  semester: string;                    // 学期，如"2024-2025-1"
  
  // 元数据
  createdAt: string;
  createdBy: string;                   // 教务主任ID
  createdByName: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  
  // 统计
  classCount: number;
  teacherCount: number;
  totalSlots: number;
}

/**
 * 实际课表
 * 每周生成的实际课表，反映请假、代课等变化
 */
export interface ActualSchedule {
  id: string;
  semester: string;
  weekNumber: number;                  // 第几周
  weekStartDate: string;               // 周一日期
  weekEndDate: string;                 // 周五日期
  
  // 本周变更统计
  changeCount: number;
  substituteCount: number;
  leaveCount: number;
  
  // 元数据
  generatedAt: string;                 // 生成时间
  generatedFrom: string;               // 基准课表ID
}

/**
 * 教师工作量统计
 */
export interface TeacherWorkload {
  id: string;
  teacherId: string;
  teacherName: string;
  semester: string;
  month?: number;                      // 月度统计时使用（1-12）
  
  // === 基准课时 ===
  /** 基准周课时（教务主任配置） */
  baseWeeklyHours: number;
  /** 本期应上课时 */
  expectedHours: number;
  
  // === 实际授课 ===
  /** 自己上的课 */
  selfTaughtHours: number;
  /** 请假课时 */
  leaveHours: number;
  /** 请假详情 */
  leaveDetails: Array<{
    date: string;
    leaveType: string;
    hours: number;
  }>;
  
  // === 代课 ===
  /** 帮人代课的课 */
  substituteHours: number;
  /** 代课详情 */
  substituteDetails: Array<{
    date: string;
    classId: string;
    className: string;
    subject: string;
    originalTeacherId: string;
    originalTeacherName: string;
    hours: number;
  }>;
  
  // === 课后服务 ===
  /** 课后服务节数 */
  afterSchoolServiceHours: number;
  /** 课后服务详情 */
  afterSchoolServiceDetails: Array<{
    date: string;
    serviceType: string;
    classId: string;
    className: string;
    hours: number;
  }>;
  
  // === 统计 ===
  /** 实际工作量 = 自己上的课 + 代课 + 课后服务 */
  totalWorkload: number;
  /** 与预期差异 */
  variance: number;
  /** 备注 */
  remark?: string;
  
  updatedAt: string;
}

/**
 * 课后服务记录
 */
export interface AfterSchoolService {
  id: string;
  semester: string;
  weekNumber: number;
  date: string;
  
  // 服务信息
  serviceType: string;                 // 课后服务类型（托管/兴趣班等）
  classId: string;
  className: string;
  grade: number;
  
  // 教师信息
  teacherId: string;
  teacherName: string;
  
  // 时间信息
  periodIndex: number;                 // 第几节课
  startTime: string;
  endTime: string;
  hours: number;                       // 课时数
  
  // 状态
  status: 'scheduled' | 'completed' | 'cancelled';
  
  // 学生人数
  studentCount?: number;
  
  // 备注
  remark?: string;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * 教师月度工作量汇总
 */
export interface TeacherMonthlyWorkloadSummary {
  teacherId: string;
  teacherName: string;
  semester: string;
  month: number;
  
  // 周课时
  baseWeeklyHours: number;
  
  // 本月统计
  workingDays: number;                 // 工作日天数
  expectedHours: number;               // 应上课时
  selfTaughtHours: number;             // 自己上的课
  leaveHours: number;                  // 请假课时
  substituteHours: number;             // 代课课时
  afterSchoolServiceHours: number;     // 课后服务
  
  // 总计
  totalWorkload: number;
  variance: number;
  
  // 趋势（与上月对比）
  trend: {
    totalWorkloadChange: number;
    leaveHoursChange: number;
    substituteHoursChange: number;
  };
}

/**
 * 工作量统计查询参数
 */
export interface WorkloadQueryParams {
  teacherId?: string;
  semester?: string;
  month?: number;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  grade?: number;
}


// ============================================================
// 课表服务扩展类型
// ============================================================

/**
 * 基准课表课次
 * 用于基准课表API的单个课次
 */
export interface BaseScheduleSlot {
  id: string;
  semester: string;
  classId: string;
  className: string;
  grade: number;
  
  // 时间信息
  weekNumber?: number;                  // 周次（基准课表通常不区分，实际课表必填）
  dayOfWeek: number;                    // 星期几 (1-7)
  periodIndex: number;                  // 第几节课
  startTime: string;
  endTime: string;
  
  // 课程信息
  subject: string;
  courseType?: 'normal' | 'activity' | 'self_study';
  
  // 教师信息
  teacherId: string;
  teacherName: string;
  
  // 场地信息
  classroomId?: string;
  classroomName?: string;
  
  // 状态
  status: 'normal' | 'leave' | 'substitute' | 'cancelled';
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/**
 * 实际课表课次
 * 每周生成，反映请假、代课等变化
 */
export interface ActualScheduleSlot extends BaseScheduleSlot {
  weekNumber: number;                   // 第几周
  date: string;                         // 具体日期
  
  // 变化信息
  isAdjusted: boolean;                  // 是否有调整
  originalTeacherId?: string;           // 原教师ID（代课时）
  originalTeacherName?: string;
  substituteReason?: string;            // 代课原因
  
  // 关联信息
  leaveRequestId?: string;              // 关联的请假申请
  substituteId?: string;                // 关联的代课记录
  adjustRecordId?: string;              // 关联的调课记录
}
