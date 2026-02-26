// 智慧校园系统 - 统一类型定义

// 用户角色枚举
export type UserRole = 
  | 'principal'        // 校长
  | 'secretary'        // 书记
  | 'vice_principal'   // 分管副校长
  | 'admin'            // 行政人员
  | 'head_teacher'     // 班主任
  | 'teacher'          // 普通教师
  | 'student'          // 学生
  | 'parent'           // 家长
  | 'staff';           // 后勤人员

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
  | 'teacher';     // 教师空间

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
