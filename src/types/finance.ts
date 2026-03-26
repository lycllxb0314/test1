/**
 * 财务类型定义
 * 
 * @module types/finance
 */

import type { UserRole } from './user';
import type { ApprovalNode, ApprovalRecord } from './approval';

// ==================== 报销类别 ====================

/** 报销类别 */
export type ExpenseCategory = 
  | 'teaching'           // 教学用品
  | 'office'             // 办公用品
  | 'travel'             // 差旅费
  | 'training'           // 培训费
  | 'activity'           // 活动经费
  | 'maintenance'        // 维修费
  | 'other';             // 其他

/** 报销状态 */
export type ExpenseStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待审批
  | 'approved'     // 已批准
  | 'processing'   // 处理中
  | 'paid'         // 已打款
  | 'completed'    // 已完成
  | 'rejected'     // 已拒绝
  | 'cancelled';   // 已取消

// ==================== 报销申请 ====================

/** 报销项目 */
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

/** 报销申请 */
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

/** 报销类别配置 */
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

/** 报销统计 */
export interface ExpenseStatistics {
  /** 待审批数量 */
  pendingCount: number;
  /** 处理中数量 */
  processingCount: number;
  /** 已完成数量 */
  completedCount?: number;
  /** 总金额 */
  totalAmount?: number;
  /** 已批准金额 */
  approvedAmount?: number;
  /** 本月已报销金额 */
  monthPaidAmount: number;
  /** 本月金额 */
  monthlyAmount?: number;
  /** 年度金额 */
  yearlyAmount?: number;
  /** 本月已报销笔数 */
  monthPaidCount: number;
  /** 按类别统计 */
  byCategory?: {
    category: ExpenseCategory;
    categoryName: string;
    count: number;
    amount: number;
  }[];
  /** 按部门统计 */
  byDepartment?: {
    departmentId: string;
    departmentName: string;
    count: number;
    amount: number;
  }[];
}

/** 报销筛选条件 */
export interface ExpenseFilters {
  category?: ExpenseCategory | 'all';
  status?: ExpenseStatus | 'all';
  applicantId?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
}
