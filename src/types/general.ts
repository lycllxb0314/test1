/**
 * 总务类型定义
 * 
 * @module types/general
 */

import type { UserRole } from './user';

// ==================== 资产管理 ====================

/** 资产类型 */
export type AssetType = 
  | 'equipment'    // 设备
  | 'furniture'    // 家具
  | 'vehicle'      // 车辆
  | 'building'     // 建筑
  | 'land'         // 土地
  | 'other';       // 其他

/** 资产状态 */
export type AssetStatus = 
  | 'in_use'       // 使用中
  | '在用'         // 使用中（中文兼容）
  | 'idle'         // 闲置
  | 'repair'       // 维修中
  | 'scrapped'     // 已报废
  | 'lost';        // 丢失

/** 资产信息 */
export interface Asset {
  id: string;
  name: string;
  type?: AssetType;
  assetNo: string;
  category?: string;                    // 资产类别（兼容字段）
  model?: string;
  brand?: string;
  specification?: string;
  quantity?: number;                    // 数量
  unit?: string;                        // 单位
  value?: number;                       // 价值
  location?: string;
  department?: string;
  custodianId?: string;
  custodianName?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  status: AssetStatus;
  images?: string[];
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== 教室管理 ====================

/** 教室类型 */
export type RoomType = 
  | 'seminar_room'      // 教研室
  | 'lecture_hall'      // 阶梯教室
  | 'multimedia_room'   // 多媒体教室
  | 'lab'               // 实验室
  | 'meeting_room'      // 会议室
  | 'activity_room';    // 活动室

/** 教室状态 */
export type RoomStatus = 
  | 'available'         // 可用
  | 'in_use'            // 使用中
  | 'reserved'          // 已预约
  | 'maintenance'       // 维护中
  | 'locked';           // 已锁定

/** 教室资源 */
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

/** 预约状态 */
export type BookingStatus = 
  | 'pending'           // 待审批
  | 'approved'          // 已批准
  | 'rejected'          // 已拒绝
  | 'cancelled'         // 已取消
  | 'completed'         // 已完成
  | 'in_progress';      // 进行中

/** 预约用途类型 */
export type BookingPurpose = 
  | 'teaching'          // 教学活动
  | 'meeting'           // 教研会议
  | 'training'          // 培训讲座
  | 'activity'          // 学生活动
  | 'exam'              // 考试
  | 'defense'           // 答辩
  | 'competition'       // 比赛
  | 'other';            // 其他

/** 教室预约申请 */
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
  applicantRole?: UserRole;
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

/** 预约审批节点 */
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

// ==================== 维修管理 ====================

/** 维修申请状态 */
export type RepairStatus = 
  | 'pending'      // 待处理
  | 'approved'     // 已批准
  | 'in_progress'  // 进行中
  | 'completed'    // 已完成
  | 'rejected';    // 已拒绝

/** 报修类型 */
export type RepairType = 'asset' | 'facility' | 'other';

/** 紧急程度 */
export type RepairUrgency = 'low' | 'normal' | 'high' | 'urgent';

/** 数据库行类型 - 报修记录 */
export interface RepairRecord {
  id: string;
  type: RepairType;
  asset_id: string | null;
  item: string;
  location: string;
  description: string;
  urgency: RepairUrgency;
  images: string[] | null;
  applicant_id: string;
  applicant_name: string;
  department: string | null;
  status: RepairStatus;
  assignee_id: string | null;
  assignee_name: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  scheduled_date: string | null;
  completed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** 前端类型 - 报修申请 */
export interface RepairRequest {
  id: string;
  type?: RepairType;
  assetId?: string;
  assetName?: string;
  item?: string;
  location?: string;
  description?: string;
  urgency?: RepairUrgency;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  images?: string[];
  applicantId?: string;
  applicantName?: string;
  department?: string;
  status?: RepairStatus;
  assigneeId?: string;
  assigneeName?: string;
  estimatedCost?: number;
  actualCost?: number;
  handlerId?: string;
  handlerName?: string;
  scheduledDate?: string;
  completedDate?: string;
  completedAt?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 报修统计数据 */
export interface RepairStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  avgResponseTime: number;
  monthCompleted: number;
}

// ==================== 采购管理 ====================

/** 采购申请状态 */
export type PurchaseStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待审批
  | 'approved'     // 已批准
  | 'ordered'      // 已下单
  | 'received'     // 已到货
  | 'completed'    // 已完成
  | 'rejected';    // 已拒绝

/** 采购申请 */
export interface PurchaseRequest {
  id: string;
  title: string;
  type: 'office_supplies' | 'equipment' | 'maintenance' | 'other';
  items: PurchaseItem[];
  totalAmount: number;
  reason: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  applicantId: string;
  applicantName: string;
  department: string;
  status: PurchaseStatus;
  budgetSource?: string;
  approvedAmount?: number;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  supplier?: string;
  orderDate?: string;
  receivedDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 采购项目 */
export interface PurchaseItem {
  id: string;
  name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

// ==================== 场地管理 ====================

/** 场地类型 */
export type VenueType = 
  | 'classroom'    // 教室
  | 'office'       // 办公室
  | 'laboratory'   // 实验室
  | 'library'      // 图书馆
  | 'gym'          // 体育馆
  | 'playground'   // 操场
  | 'meeting_room' // 会议室
  | 'auditorium'   // 报告厅
  | 'other';       // 其他

/** 场地信息 */
export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  building: string;
  floor: number;
  capacity: number;
  area?: number;
  facilities?: string[];
  managerId?: string;
  managerName?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 场地预约 */
export interface VenueReservation {
  id: string;
  venueId: string;
  venueName: string;
  type: VenueType;
  applicantId: string;
  applicantName: string;
  purpose: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 安全管理 ====================

/** 安全检查类型 */
export type SafetyCheckType = 
  | 'fire'         // 消防检查
  | 'electricity'  // 电气检查
  | 'structure'    // 建筑结构检查
  | 'equipment'    // 设备检查
  | 'food'         // 食品安全
  | 'other';       // 其他

/** 安全检查记录 */
export interface SafetyCheck {
  id: string;
  type: SafetyCheckType;
  location: string;
  checkDate: string;
  checkerId: string;
  checkerName: string;
  result: 'pass' | 'fail' | 'warning';
  issues?: SafetyIssue[];
  images?: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** 安全问题 */
export interface SafetyIssue {
  id: string;
  checkId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  responsiblePersonId?: string;
  responsiblePersonName?: string;
  resolvedAt?: string;
  resolution?: string;
}

// ==================== 设备管理 ====================

/** 设备类型 */
export type DeviceType = 
  | 'light'        // 灯光
  | 'ac'           // 空调
  | 'door'         // 门禁
  | 'projector'    // 投影仪
  | 'curtain'      // 窗帘
  | 'speaker'      // 音响
  | 'camera'       // 摄像头
  | 'sensor'       // 传感器
  | 'other';       // 其他

/** 设备状态 */
export type DeviceStatus = 
  | 'online'       // 在线
  | 'offline'      // 离线
  | 'maintenance'  // 维护中
  | 'fault';       // 故障

/** 设备信息 */
export interface Device {
  id: string;
  name: string;                           // 设备名称
  deviceNo?: string;                      // 设备编号
  type: DeviceType;                       // 设备类型
  status: DeviceStatus;                   // 设备状态
  
  // 位置信息
  building: string;                       // 所属楼宇
  buildingName?: string;                  // 楼宇名称
  floor: number;                          // 楼层
  room?: string;                          // 房间号
  location?: string;                      // 具体位置
  
  // 设备属性
  brand?: string;                         // 品牌
  model?: string;                         // 型号
  sn?: string;                            // 序列号
  
  // 控制状态
  isOn: boolean;                          // 开关状态
  brightness?: number;                    // 亮度 (0-100)
  temperature?: number;                   // 温度 (16-30)
  locked?: boolean;                       // 门锁状态
  position?: number;                      // 窗帘位置 (0-100)
  
  // 管理信息
  managerId?: string;                     // 管理员ID
  managerName?: string;                   // 管理员姓名
  department?: string;                    // 所属部门
  
  // 网络信息
  ipAddress?: string;                     // IP地址
  macAddress?: string;                    // MAC地址
  
  // 维护信息
  lastMaintenance?: string;               // 上次维护时间
  nextMaintenance?: string;               // 下次维护时间
  warrantyExpiry?: string;                // 保修到期
  
  // 图片和备注
  images?: string[];
  note?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/** 设备控制日志 */
export interface DeviceControlLog {
  id: string;
  deviceId: string;
  deviceName: string;
  action: string;                         // 操作类型
  value?: string;                         // 操作值
  operatorId: string;                     // 操作人ID
  operatorName: string;                   // 操作人姓名
  result: 'success' | 'failed';           // 操作结果
  errorMessage?: string;                  // 错误信息
  createdAt: string;
}

/** 设备统计数据 */
export interface DeviceStatistics {
  total: number;                          // 设备总数
  online: number;                         // 在线设备
  offline: number;                        // 离线设备
  running: number;                        // 运行中设备
  maintenance: number;                    // 维护中设备
  fault: number;                          // 故障设备
  byType: {                               // 按类型统计
    type: DeviceType;
    typeName: string;
    count: number;
    online: number;
    running: number;
  }[];
  byBuilding: {                           // 按楼宇统计
    building: string;
    buildingName: string;
    total: number;
    online: number;
  }[];
}

/** 设备筛选条件 */
export interface DeviceFilters {
  type?: DeviceType | 'all';
  status?: DeviceStatus | 'all';
  building?: string;
  floor?: number | 'all';
  search?: string;
}

// ==================== 总务筛选 ====================

/** 资产筛选条件 */
export interface AssetFilters {
  type?: AssetType | 'all';
  status?: AssetStatus | 'all';
  department?: string;
  search?: string;
}

/** 维修申请筛选条件 */
export interface RepairFilters {
  type?: 'asset' | 'facility' | 'other' | 'all';
  status?: RepairStatus | 'all';
  urgency?: 'low' | 'normal' | 'high' | 'urgent' | 'all';
  applicantId?: string;
}

/** 采购申请筛选条件 */
export interface PurchaseFilters {
  type?: 'office_supplies' | 'equipment' | 'maintenance' | 'other' | 'all';
  status?: PurchaseStatus | 'all';
  urgency?: 'low' | 'normal' | 'high' | 'urgent' | 'all';
  applicantId?: string;
}

/** 场地筛选条件 */
export interface VenueFilters {
  type?: VenueType | 'all';
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'all';
  building?: string;
  search?: string;
}
