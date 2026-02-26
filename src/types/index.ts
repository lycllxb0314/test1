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
export type NodeType = 'start' | 'approval' | 'condition' | 'parallel' | 'end';

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
  
  // 条件节点配置
  branches?: ConditionBranch[];          // 条件分支列表
  defaultBranchId?: string;              // 默认分支ID（都不满足时）
  
  // 并行节点配置
  parallelNodes?: string[];              // 并行执行的节点ID列表
  mergeType?: 'all' | 'any';             // 合并方式：全部通过/任一通过
  
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
