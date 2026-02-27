import { NextRequest, NextResponse } from 'next/server';
import { mockExpenses } from '@/lib/expense-data';
import type { ExpenseReimbursement, ExpenseItem } from '@/types';

/**
 * GET - 获取单个报销详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = mockExpenses.find((e: ExpenseReimbursement) => e.id === id);

    if (!expense) {
      return NextResponse.json({
        success: false,
        error: '报销申请不存在',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: expense,
      source: 'mock',
    });
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json({
      success: false,
      error: '获取报销详情失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新报销申请
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const expenseIndex = mockExpenses.findIndex((e: ExpenseReimbursement) => e.id === id);

    if (expenseIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '报销申请不存在',
      }, { status: 404 });
    }

    const expense = mockExpenses[expenseIndex];
    
    // 只有草稿状态才能修改
    if (expense.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: '只有草稿状态的报销申请才能修改',
      }, { status: 400 });
    }

    // 更新字段
    const updatedExpense: ExpenseReimbursement = {
      ...expense,
      ...body,
      id: expense.id,
      expenseNo: expense.expenseNo,
      applicantId: expense.applicantId,
      applicantName: expense.applicantName,
      applicantRole: expense.applicantRole,
      createdAt: expense.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // 重新计算总金额
    if (body.items && Array.isArray(body.items)) {
      updatedExpense.totalAmount = body.items.reduce((sum: number, item: ExpenseItem) => sum + item.amount, 0);
    }

    mockExpenses[expenseIndex] = updatedExpense;

    return NextResponse.json({
      success: true,
      data: updatedExpense,
      source: 'mock',
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({
      success: false,
      error: '更新报销申请失败',
    }, { status: 500 });
  }
}

/**
 * DELETE - 删除报销申请
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenseIndex = mockExpenses.findIndex((e: ExpenseReimbursement) => e.id === id);

    if (expenseIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '报销申请不存在',
      }, { status: 404 });
    }

    const expense = mockExpenses[expenseIndex];
    
    // 只有草稿或已拒绝状态才能删除
    if (expense.status !== 'draft' && expense.status !== 'rejected') {
      return NextResponse.json({
        success: false,
        error: '该状态的报销申请不能删除',
      }, { status: 400 });
    }

    mockExpenses.splice(expenseIndex, 1);

    return NextResponse.json({
      success: true,
      data: null,
      source: 'mock',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({
      success: false,
      error: '删除报销申请失败',
    }, { status: 500 });
  }
}

/**
 * POST - 提交报销申请
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenseIndex = mockExpenses.findIndex((e: ExpenseReimbursement) => e.id === id);

    if (expenseIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '报销申请不存在',
      }, { status: 404 });
    }

    const expense = mockExpenses[expenseIndex];
    
    if (expense.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: '只有草稿状态的报销申请才能提交',
      }, { status: 400 });
    }

    expense.status = 'pending';
    expense.submittedAt = new Date().toISOString();
    expense.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: expense,
      source: 'mock',
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    return NextResponse.json({
      success: false,
      error: '提交报销申请失败',
    }, { status: 500 });
  }
}
