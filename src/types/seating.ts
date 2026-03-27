/**
 * 班级座位表类型定义
 * 
 * @module types/seating
 */

// ==================== 座位表配置 ====================

/** 座位布局类型 */
export type SeatingLayout = 'matrix' | 'group' | 'u_shape' | 'custom';

/** 座位状态 */
export type SeatStatus = 'empty' | 'occupied' | 'locked' | 'teacher';

/** 座位位置 */
export interface SeatPosition {
  /** 行号（从讲台方向开始，1开始） */
  row: number;
  /** 列号（从左到右，1开始） */
  column: number;
}

/** 单个座位 */
export interface Seat {
  /** 座位ID */
  id: string;
  /** 座位位置 */
  position: SeatPosition;
  /** 座位状态 */
  status: SeatStatus;
  /** 入座学生ID */
  studentId?: string;
  /** 入座学生姓名（冗余，便于显示） */
  studentName?: string;
  /** 入座学生学号 */
  studentNo?: string;
  /** 座位标签（如：组长、卫生委员等） */
  label?: string;
  /** 座位特殊属性 */
  attributes?: {
    /** 是否靠窗 */
    isByWindow?: boolean;
    /** 是否靠门 */
    isByDoor?: boolean;
    /** 是否前排 */
    isFrontRow?: boolean;
    /** 备注 */
    note?: string;
  };
}

/** 座位表配置 */
export interface SeatingConfig {
  /** 行数 */
  rows: number;
  /** 列数 */
  columns: number;
  /** 布局类型 */
  layout: SeatingLayout;
  /** 讲台位置 */
  podiumPosition: 'top' | 'bottom' | 'left' | 'right';
  /** 行间距（列方向的间隔） */
  rowGap?: number;
  /** 列间距（行方向的间隔） */
  columnGap?: number;
  /** 组配置（分组布局时） */
  groupConfig?: {
    /** 每组行数 */
    rowsPerGroup: number;
    /** 每组列数 */
    columnsPerGroup: number;
    /** 组间距 */
    groupGap: number;
  };
}

// ==================== 座位表 ====================

/** 座位表 - 数据库行 */
export interface SeatingPlanRow {
  id: string;
  class_id: string;
  name: string;
  config: SeatingConfig;
  seats: Seat[];
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** 座位表 - 业务模型 */
export interface SeatingPlan {
  /** 座位表ID */
  id: string;
  /** 班级ID */
  classId: string;
  /** 座位表名称 */
  name: string;
  /** 配置 */
  config: SeatingConfig;
  /** 座位列表 */
  seats: Seat[];
  /** 版本号 */
  version: number;
  /** 是否激活 */
  isActive: boolean;
  /** 创建者ID */
  createdBy: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

// ==================== 查询参数 ====================

/** 座位表查询参数 */
export interface SeatingPlanQueryParams {
  classId?: string;
  isActive?: boolean;
}

/** 座位安排查询参数 */
export interface SeatingArrangementParams {
  classId: string;
  planId?: string;
}

// ==================== 创建/更新参数 ====================

/** 创建座位表参数 */
export interface CreateSeatingPlanParams {
  classId: string;
  name?: string;
  config?: Partial<SeatingConfig>;
}

/** 更新座位表参数 */
export interface UpdateSeatingPlanParams {
  name?: string;
  config?: Partial<SeatingConfig>;
  seats?: Seat[];
  isActive?: boolean;
}

/** 安排座位参数 */
export interface AssignSeatParams {
  planId: string;
  seatId: string;
  studentId: string;
}

/** 批量安排座位参数 */
export interface BatchAssignSeatsParams {
  planId: string;
  assignments: Array<{
    seatId: string;
    studentId: string;
  }>;
}

/** 清空座位参数 */
export interface ClearSeatParams {
  planId: string;
  seatId: string;
}

/** 交换座位参数 */
export interface SwapSeatsParams {
  planId: string;
  seatId1: string;
  seatId2: string;
}

// ==================== 统计类型 ====================

/** 座位统计 */
export interface SeatingStatistics {
  /** 总座位数 */
  totalSeats: number;
  /** 已入座学生数 */
  occupiedSeats: number;
  /** 空座位数 */
  emptySeats: number;
  /** 锁定座位数 */
  lockedSeats: number;
  /** 未安排座位的学生数 */
  unassignedStudents: number;
  /** 未安排座位的学生列表 */
  unassignedStudentList: Array<{
    id: string;
    name: string;
    studentNo: string;
  }>;
}

// ==================== 默认配置 ====================

/** 默认座位表配置 */
export const DEFAULT_SEATING_CONFIG: SeatingConfig = {
  rows: 8,
  columns: 8,
  layout: 'matrix',
  podiumPosition: 'top',
  rowGap: 2,
  columnGap: 2,
};

/** 座位状态标签 */
export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  empty: '空座',
  occupied: '已坐',
  locked: '锁定',
  teacher: '教师',
};

/** 座位状态颜色 */
export const SEAT_STATUS_COLORS: Record<SeatStatus, string> = {
  empty: 'bg-slate-100 border-slate-200',
  occupied: 'bg-blue-50 border-blue-200',
  locked: 'bg-amber-50 border-amber-200',
  teacher: 'bg-purple-50 border-purple-200',
};
