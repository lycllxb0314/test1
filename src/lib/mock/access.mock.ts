/**
 * 门禁相关Mock数据
 */

import type { AccessDevice, AccessRecord, Visitor, AccessStatistics } from '@/types';

// 门禁设备Mock数据
export const MOCK_ACCESS_DEVICES: AccessDevice[] = [
  {
    id: 'ad001',
    name: '东校门入口',
    code: 'GATE-E-001',
    type: 'gate',
    location: '东校门',
    status: 'online',
    direction: 'in',
    capabilities: {
      faceRecognition: true,
      cardReader: true,
      qrCode: true,
      fingerprint: false,
      temperature: true,
      metalDetection: false,
    },
    accessRules: [],
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'ad002',
    name: '东校门出口',
    code: 'GATE-E-002',
    type: 'gate',
    location: '东校门',
    status: 'online',
    direction: 'out',
    capabilities: {
      faceRecognition: true,
      cardReader: true,
      qrCode: true,
      fingerprint: false,
      temperature: true,
      metalDetection: false,
    },
    accessRules: [],
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'ad003',
    name: '教学楼A入口',
    code: 'BLDG-A-001',
    type: 'building',
    location: '教学楼A栋一层',
    status: 'online',
    direction: 'both',
    capabilities: {
      faceRecognition: true,
      cardReader: true,
      qrCode: false,
      fingerprint: false,
      temperature: false,
      metalDetection: false,
    },
    accessRules: [],
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
];

// 通行记录Mock数据
export const MOCK_ACCESS_RECORDS: AccessRecord[] = [
  {
    id: 'ar001',
    personId: 's001',
    personType: 'student',
    personName: '张三',
    organization: '一年级1班',
    deviceId: 'ad001',
    deviceName: '东校门入口',
    deviceType: 'gate',
    location: '东校门',
    direction: 'in',
    method: 'face',
    accessTime: '2024-12-09T07:30:00Z',
    status: 'success',
    temperature: 36.5,
    createdAt: '2024-12-09T07:30:00Z',
  },
  {
    id: 'ar002',
    personId: 't001',
    personType: 'teacher',
    personName: '张明华',
    organization: '语文组',
    deviceId: 'ad001',
    deviceName: '东校门入口',
    deviceType: 'gate',
    location: '东校门',
    direction: 'in',
    method: 'face',
    accessTime: '2024-12-09T07:15:00Z',
    status: 'success',
    temperature: 36.3,
    createdAt: '2024-12-09T07:15:00Z',
  },
  {
    id: 'ar003',
    personId: 'v001',
    personType: 'visitor',
    personName: '来访家长',
    organization: '访客',
    deviceId: 'ad001',
    deviceName: '东校门入口',
    deviceType: 'gate',
    location: '东校门',
    direction: 'in',
    method: 'qrcode',
    accessTime: '2024-12-09T09:00:00Z',
    status: 'success',
    temperature: 36.4,
    createdAt: '2024-12-09T09:00:00Z',
  },
];

// 访客Mock数据
export const MOCK_VISITORS: Visitor[] = [
  {
    id: 'v001',
    name: '来访家长',
    gender: '男',
    phone: '139****1234',
    idType: '身份证',
    visitPurpose: '与班主任沟通孩子学习情况',
    visitType: '家长来访',
    hostId: 't001',
    hostName: '张明华',
    hostType: 'teacher',
    expectedArriveTime: '2024-12-09T09:00:00Z',
    actualArriveTime: '2024-12-09T09:05:00Z',
    actualLeaveTime: '2024-12-09T10:30:00Z',
    temporaryAccess: [
      {
        deviceId: 'ad001',
        deviceName: '东校门入口',
        validFrom: '2024-12-09T08:00:00Z',
        validTo: '2024-12-09T12:00:00Z',
      },
    ],
    status: 'left',
    approvedBy: 't001',
    approvedByName: '张明华',
    approvedAt: '2024-12-08T16:00:00Z',
    createdAt: '2024-12-08T15:00:00Z',
    updatedAt: '2024-12-09T10:30:00Z',
  },
];

// 门禁统计Mock数据
export const MOCK_ACCESS_STATISTICS: AccessStatistics = {
  todayTotal: 1256,
  todayIn: 628,
  todayOut: 628,
  byPersonType: [
    { type: 'student', count: 980 },
    { type: 'teacher', count: 200 },
    { type: 'staff', count: 50 },
    { type: 'visitor', count: 26 },
  ],
  hourlyStats: [
    { hour: 7, in: 450, out: 10 },
    { hour: 8, in: 100, out: 20 },
    { hour: 11, in: 10, out: 150 },
    { hour: 12, in: 50, out: 300 },
    { hour: 14, in: 280, out: 20 },
    { hour: 17, in: 10, out: 350 },
  ],
  deviceStats: [
    { deviceId: 'ad001', deviceName: '东校门入口', total: 500, abnormal: 2 },
    { deviceId: 'ad002', deviceName: '东校门出口', total: 480, abnormal: 0 },
    { deviceId: 'ad003', deviceName: '教学楼A入口', total: 276, abnormal: 1 },
  ],
  abnormalCount: 3,
  abnormalTypes: [
    { type: '未授权进入', count: 2 },
    { type: '体温异常', count: 1 },
  ],
  visitorCount: 26,
  pendingVisitorCount: 3,
  deviceOnlineCount: 15,
  deviceOfflineCount: 1,
  deviceFaultCount: 0,
};

/**
 * 获取门禁设备列表
 */
export function getMockAccessDevices(filters?: {
  status?: string;
  type?: string;
}): AccessDevice[] {
  let result = [...MOCK_ACCESS_DEVICES];
  
  if (filters?.status) {
    result = result.filter(d => d.status === filters.status);
  }
  
  if (filters?.type) {
    result = result.filter(d => d.type === filters.type);
  }
  
  return result;
}

/**
 * 获取通行记录
 */
export function getMockAccessRecords(filters?: {
  deviceId?: string;
  personType?: string;
  date?: string;
  limit?: number;
}): AccessRecord[] {
  let result = [...MOCK_ACCESS_RECORDS];
  
  if (filters?.deviceId) {
    result = result.filter(r => r.deviceId === filters.deviceId);
  }
  
  if (filters?.personType) {
    result = result.filter(r => r.personType === filters.personType);
  }
  
  if (filters?.date) {
    result = result.filter(r => r.accessTime.startsWith(filters.date!));
  }
  
  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }
  
  return result;
}

/**
 * 获取访客列表
 */
export function getMockVisitors(filters?: {
  status?: string;
}): Visitor[] {
  let result = [...MOCK_VISITORS];
  
  if (filters?.status) {
    result = result.filter(v => v.status === filters.status);
  }
  
  return result;
}
