/**
 * 门禁类型定义
 * 
 * @module types/access
 */

// ==================== 门禁设备 ====================

/** 门禁设备类型 */
export type AccessDeviceType = 
  | 'gate'           // 校门闸机
  | 'building'       // 楼宇门禁
  | 'classroom'      // 教室门禁
  | 'office'         // 办公室门禁
  | 'dormitory';     // 宿舍门禁

/** 门禁设备状态 */
export type AccessDeviceStatus = 
  | 'online'         // 在线
  | 'offline'        // 离线
  | 'maintenance'    // 维护中
  | 'fault';         // 故障

/** 门禁设备 */
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

/** 通行规则 */
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

// ==================== 门禁人员 ====================

/** 人员类型 */
export type PersonType = 'student' | 'teacher' | 'staff' | 'visitor';

/** 门禁人员信息 */
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

/** 门禁凭证 */
export interface AccessCredential {
  id: string;
  type: 'face' | 'card' | 'fingerprint' | 'qrCode';
  data: string;                          // 凭证数据（如卡号、特征值）
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

/** 门禁权限 */
export interface AccessPermission {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: AccessDeviceType;
  permission: 'allow' | 'deny';
  validFrom?: string;
  validTo?: string;
  timeRestrictions?: {
    weekdays: number[];
    startTime: string;
    endTime: string;
  };
}

// ==================== 通行记录 ====================

/** 通行记录 */
export interface AccessRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: AccessDeviceType;
  location: string;
  
  // 通行人信息
  personId: string;
  personType: PersonType;
  personName: string;
  organization?: string;
  
  // 通行信息
  direction: 'in' | 'out';
  passTime?: string;
  accessTime?: string;                  // 兼容字段
  
  // 认证方式
  authType?: 'face' | 'card' | 'fingerprint' | 'qrCode' | 'password';
  method?: 'face' | 'card' | 'fingerprint' | 'qrCode' | 'qrcode' | 'password';  // 兼容字段
  authResult?: 'success' | 'failed';
  
  // 状态
  status?: 'success' | 'failed' | 'abnormal' | 'denied' | 'timeout';
  isAbnormal?: boolean;
  abnormalType?: string;                // 异常类型
  denyReason?: string;
  
  // 体温
  temperature?: number;
  temperatureStatus?: 'normal' | 'abnormal';
  
  // 抓拍图片
  snapshot?: string;
  
  // 备注
  remark?: string;
  
  createdAt: string;
}

// ==================== 访客管理 ====================

/** 访客信息 */
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
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

/** 访客统计 */
export interface VisitorStatistics {
  todayCount: number;
  pendingCount: number;
  inSchoolCount: number;
  weeklyTrend: { date: string; count: number }[];
}

/** 门禁统计 */
export interface AccessStatistics {
  /** 今日进入人数 */
  todayInCount: number;
  /** 今日离开人数 */
  todayOutCount: number;
  /** 今日总通行人数 */
  todayTotal?: number;
  /** 当前在校人数 */
  currentInSchool: number;
  /** 异常记录数 */
  abnormalCount: number;
  /** 按时段统计 */
  hourlyTrend: {
    hour: number;
    inCount: number;
    outCount: number;
  }[];
  /** 按类型统计 */
  byType: {
    type: PersonType;
    inCount: number;
    outCount: number;
  }[];
}
