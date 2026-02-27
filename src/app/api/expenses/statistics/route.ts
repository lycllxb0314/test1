import { NextRequest, NextResponse } from 'next/server';
import { mockExpenses } from '@/lib/expense-data';
import type { ExpenseReimbursement, ExpenseStatistics } from '@/types';

/**
 * GET - 获取报销统计
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 待审批数量
    const pendingCount = mockExpenses.filter((e: ExpenseReimbursement) => e.status === 'pending').length;
    
    // 处理中数量（已批准，等待财务处理）
    const processingCount = mockExpenses.filter((e: ExpenseReimbursement) => e.status === 'approved' || e.status === 'processing').length;
    
    // 已完成数量
    const completedCount = mockExpenses.filter((e: ExpenseReimbursement) => e.status === 'completed').length;
    
    // 本月已报销金额
    const monthlyAmount = mockExpenses
      .filter((e: ExpenseReimbursement) => {
        const date = new Date(e.createdAt);
        return e.status === 'completed' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum: number, e: ExpenseReimbursement) => sum + e.totalAmount, 0);
    
    // 本年已报销金额
    const yearlyAmount = mockExpenses
      .filter((e: ExpenseReimbursement) => {
        const date = new Date(e.createdAt);
        return e.status === 'completed' && date.getFullYear() === currentYear;
      })
      .reduce((sum: number, e: ExpenseReimbursement) => sum + e.totalAmount, 0);
    
    // 待报销金额（已提交审批的）
    const pendingAmount = mockExpenses
      .filter((e: ExpenseReimbursement) => e.status === 'pending' || e.status === 'approved')
      .reduce((sum: number, e: ExpenseReimbursement) => sum + e.totalAmount, 0);
    
    // 已批准待支付金额
    const approvedAmount = mockExpenses
      .filter((e: ExpenseReimbursement) => e.status === 'approved')
      .reduce((sum: number, e: ExpenseReimbursement) => sum + e.totalAmount, 0);
    
    // 总金额
    const totalAmount = mockExpenses.reduce((sum: number, e: ExpenseReimbursement) => sum + e.totalAmount, 0);

    const statistics: ExpenseStatistics = {
      pendingCount,
      processingCount,
      completedCount,
      monthlyAmount,
      yearlyAmount,
      pendingAmount,
      approvedAmount,
      totalAmount,
    };

    return NextResponse.json({
      success: true,
      data: statistics,
      source: 'mock',
    });
  } catch (error) {
    console.error('Get expense statistics error:', error);
    return NextResponse.json({
      success: false,
      error: '获取统计数据失败',
    }, { status: 500 });
  }
}
