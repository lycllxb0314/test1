/**
 * 报销申请详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { success, error, ErrorCode } from '@/lib/api';
import { expenseReimbursementService } from '@/services/expense-reimbursement.service';

export const GET = protectedRoute(async (request, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少报销ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }

  const result = await expenseReimbursementService.getExpenseById(id);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '获取报销详情失败', ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  return NextResponse.json(success(result.data, 'database'));
});

export const PUT = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        error('缺少报销ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }
    
    const body = await request.json();

    const result = await expenseReimbursementService.updateExpense(id, body);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '更新报销申请失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[API] Update expense error:', err);
    return NextResponse.json(
      error('更新报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});

export const DELETE = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json(
        error('缺少报销ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const result = await expenseReimbursementService.deleteExpense(id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '删除报销申请失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({ deleted: true }, 'database'));
  } catch (err) {
    console.error('[API] Delete expense error:', err);
    return NextResponse.json(
      error('删除报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
