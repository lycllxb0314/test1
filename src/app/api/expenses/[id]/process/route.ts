import { NextRequest, NextResponse } from 'next/server';
import { mockExpenses } from '@/lib/expense-data';
import type { ExpenseReimbursement } from '@/types';

/**
 * POST - 财务处理报销申请
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, paymentNo, processorId, processorName } = body;

    const expenseIndex = mockExpenses.findIndex((e: ExpenseReimbursement) => e.id === id);
    if (expenseIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '报销申请不存在',
      }, { status: 404 });
    }

    const expense = mockExpenses[expenseIndex];
    
    if (action === 'process') {
      // 开始处理 - 从approved变为processing
      if (expense.status !== 'approved') {
        return NextResponse.json({
          success: false,
          error: '该报销申请不在已批准状态',
        }, { status: 400 });
      }
      expense.status = 'processing';
      expense.financeHandlerId = processorId;
      expense.financeHandlerName = processorName;
    } else if (action === 'complete') {
      // 完成处理 - 从processing变为completed
      if (expense.status !== 'processing') {
        return NextResponse.json({
          success: false,
          error: '该报销申请不在处理中状态',
        }, { status: 400 });
      }
      expense.status = 'completed';
      expense.paymentNo = paymentNo;
      expense.paymentDate = new Date().toISOString();
      expense.completedAt = new Date().toISOString();
    } else {
      return NextResponse.json({
        success: false,
        error: '无效的操作',
      }, { status: 400 });
    }

    expense.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: expense,
      source: 'mock',
    });
  } catch (error) {
    console.error('Process expense error:', error);
    return NextResponse.json({
      success: false,
      error: '处理失败',
    }, { status: 500 });
  }
}
