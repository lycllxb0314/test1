/**
 * 总务相关Mock数据
 */

import type { Room, RoomBooking, Asset, ExpenseReimbursement, RepairRequest } from '@/types';

// 场地Mock数据
export const MOCK_ROOMS: Room[] = [
  {
    id: 'room001',
    name: '一年级1班教室',
    code: 'A101',
    type: 'seminar_room' as const,
    building: '教学楼A',
    floor: 1,
    location: '教学楼A一层东侧',
    capacity: 50,
    status: 'available' as const,
    facilities: {
      projector: true,
      computer: true,
      microphone: false,
      speaker: true,
      whiteboard: true,
      blackboard: true,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'room002',
    name: '阶梯教室',
    code: 'B001',
    type: 'lecture_hall' as const,
    building: '教学楼B',
    floor: 1,
    location: '教学楼B一层中部',
    capacity: 200,
    status: 'available' as const,
    facilities: {
      projector: true,
      computer: true,
      microphone: true,
      speaker: true,
      whiteboard: false,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: true,
      recording: true,
    },
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'room003',
    name: '美术教室',
    code: 'A201',
    type: 'activity_room' as const,
    building: '教学楼A',
    floor: 2,
    location: '教学楼A二层西侧',
    capacity: 40,
    status: 'available' as const,
    facilities: {
      projector: false,
      computer: false,
      microphone: false,
      speaker: false,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'room004',
    name: '教研室1',
    code: 'C301',
    type: 'seminar_room' as const,
    building: '办公楼C',
    floor: 3,
    location: '办公楼C三层南侧',
    capacity: 15,
    status: 'available' as const,
    facilities: {
      projector: true,
      computer: false,
      microphone: false,
      speaker: false,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
];

// 场地预约Mock数据
export const MOCK_ROOM_BOOKINGS: RoomBooking[] = [
  {
    id: 'rb001',
    roomId: 'room002',
    roomName: '阶梯教室',
    roomType: 'lecture_hall',
    building: '教学楼B',
    location: '教学楼B一层中部',
    applicantId: 't001',
    applicantName: '张明华',
    applicantRole: 'subject_teacher',
    department: '语文组',
    purpose: 'teaching',
    title: '语文教学研讨会',
    description: '全校语文教师参加的教学研讨活动',
    bookingDate: '2024-12-15',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    expectedAttendees: 50,
    status: 'approved',
    approvalFlow: [
      {
        id: 'ban001',
        step: 1,
        name: '场地管理员审批',
        approverType: 'room_manager',
        approverId: 'rm001',
        approverName: '王场地管理员',
        status: 'approved',
        approvedAt: '2024-12-10T10:00:00Z',
      },
    ],
    currentStep: 1,
    createdAt: '2024-12-09T15:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
];

// 资产Mock数据
export const MOCK_ASSETS: Asset[] = [
  {
    id: 'asset001',
    assetNo: 'ZC-2024-001',
    name: '多媒体教学一体机',
    category: '教学设备',
    specification: '86寸触控一体机',
    quantity: 1,
    unit: '台',
    value: 35000,
    purchaseDate: '2024-08-15',
    location: '一年级1班教室',
    department: '教务处',
    custodianId: 't001',
    custodianName: '张明华',
    status: '在用',
    createdAt: '2024-08-15T00:00:00Z',
  },
  {
    id: 'asset002',
    assetNo: 'ZC-2024-002',
    name: '办公电脑',
    category: '办公设备',
    specification: '联想台式机',
    quantity: 1,
    unit: '台',
    value: 5000,
    purchaseDate: '2024-09-01',
    location: '语文组办公室',
    department: '语文组',
    custodianId: 't001',
    custodianName: '张明华',
    status: '在用',
    createdAt: '2024-09-01T00:00:00Z',
  },
];

// 报销申请Mock数据
export const MOCK_EXPENSES: ExpenseReimbursement[] = [
  {
    id: 'exp001',
    expenseNo: 'BX202412001',
    title: '购买教学参考资料',
    applicantId: 't001',
    applicantName: '张明华',
    applicantRole: 'subject_teacher',
    department: '语文组',
    category: 'teaching_materials',
    items: [
      { id: 'ei001', name: '教学参考资料', category: 'teaching_materials', amount: 500, expenseDate: '2024-12-05' },
    ],
    totalAmount: 500,
    description: '购买教学参考资料',
    status: 'approved',
    approvalFlow: [
      { id: 'an001', name: '部门负责人审批', approverRole: 'grade_leader', status: 'approved' },
      { id: 'an002', name: '财务审批', approverRole: 'general_director', status: 'approved' },
    ],
    currentStep: 2,
    approvalRecords: [
      { id: 'ar001', workflowId: 'exp001', workflowType: 'purchase', nodeId: 'an001', nodeName: '部门负责人审批', approverId: 't010', approverName: '年级主任', approverRole: 'grade_leader', action: 'approve', comment: '同意', createdAt: '2024-12-06T10:00:00Z' },
    ],
    createdAt: '2024-12-05T00:00:00Z',
    updatedAt: '2024-12-10T00:00:00Z',
  },
  {
    id: 'exp002',
    expenseNo: 'BX202412002',
    title: '购买办公文具',
    applicantId: 't002',
    applicantName: '李秀芳',
    applicantRole: 'subject_teacher',
    department: '数学组',
    category: 'office_supplies',
    items: [
      { id: 'ei002', name: '办公文具', category: 'office_supplies', amount: 200, expenseDate: '2024-12-08' },
    ],
    totalAmount: 200,
    description: '购买办公文具',
    status: 'pending',
    approvalFlow: [
      { id: 'an003', name: '部门负责人审批', approverRole: 'grade_leader', status: 'pending' },
      { id: 'an004', name: '财务审批', approverRole: 'general_director', status: 'pending' },
    ],
    currentStep: 1,
    approvalRecords: [],
    createdAt: '2024-12-08T00:00:00Z',
    updatedAt: '2024-12-08T00:00:00Z',
  },
];

// 维修申请Mock数据
export const MOCK_REPAIR_REQUESTS: RepairRequest[] = [
  {
    id: 'rr001',
    applicantId: 't001',
    applicantName: '张明华',
    item: '多媒体教学一体机',
    location: '一年级1班教室',
    description: '屏幕触控失灵，无法正常使用',
    priority: 'high',
    status: 'in_progress',
    assigneeId: 'staff001',
    assigneeName: '李维修工',
    createdAt: '2024-12-09T08:00:00Z',
  },
];

/**
 * 获取场地列表
 */
export function getMockRooms(filters?: {
  type?: string;
  status?: string;
  building?: string;
}): Room[] {
  let result = [...MOCK_ROOMS];
  
  if (filters?.type) {
    result = result.filter(r => r.type === filters.type);
  }
  
  if (filters?.status) {
    result = result.filter(r => r.status === filters.status);
  }
  
  if (filters?.building) {
    result = result.filter(r => r.building === filters.building);
  }
  
  return result;
}

/**
 * 获取场地预约列表
 */
export function getMockRoomBookings(filters?: {
  roomId?: string;
  applicantId?: string;
  status?: string;
  date?: string;
}): RoomBooking[] {
  let result = [...MOCK_ROOM_BOOKINGS];
  
  if (filters?.roomId) {
    result = result.filter(b => b.roomId === filters.roomId);
  }
  
  if (filters?.applicantId) {
    result = result.filter(b => b.applicantId === filters.applicantId);
  }
  
  if (filters?.status) {
    result = result.filter(b => b.status === filters.status);
  }
  
  if (filters?.date) {
    result = result.filter(b => b.bookingDate === filters.date);
  }
  
  return result;
}

/**
 * 获取资产列表
 */
export function getMockAssets(filters?: {
  category?: string;
  status?: string;
  department?: string;
}): Asset[] {
  let result = [...MOCK_ASSETS];
  
  if (filters?.category) {
    result = result.filter(a => a.category === filters.category);
  }
  
  if (filters?.status) {
    result = result.filter(a => a.status === filters.status);
  }
  
  if (filters?.department) {
    result = result.filter(a => a.department === filters.department);
  }
  
  return result;
}

/**
 * 获取报销列表
 */
export function getMockExpenses(filters?: {
  applicantId?: string;
  status?: string;
  category?: string;
}): ExpenseReimbursement[] {
  let result = [...MOCK_EXPENSES];
  
  if (filters?.applicantId) {
    result = result.filter(e => e.applicantId === filters.applicantId);
  }
  
  if (filters?.status) {
    result = result.filter(e => e.status === filters.status);
  }
  
  if (filters?.category) {
    result = result.filter(e => e.category === filters.category);
  }
  
  return result;
}

/**
 * 获取维修申请列表
 */
export function getMockRepairRequests(filters?: {
  status?: string;
  priority?: string;
}): RepairRequest[] {
  let result = [...MOCK_REPAIR_REQUESTS];
  
  if (filters?.status) {
    result = result.filter(r => r.status === filters.status);
  }
  
  if (filters?.priority) {
    result = result.filter(r => r.priority === filters.priority);
  }
  
  return result;
}
