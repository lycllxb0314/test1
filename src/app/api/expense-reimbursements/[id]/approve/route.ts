/**
 * 报销审批 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { success, error, ErrorCode } from '@/lib/api';
import { expenseReimbursementService } from '@/services/expense-reimbursement.service';

export const POST = protectedRoute(async (request, { params }) => {
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
    const { 
      action, 
      approvedAmount, 
      rejectionReason, 
      paidAt, 
      paidBy, 
      paidByName,
      paymentMethod, 
      paymentVoucher 
    } = body;

    if (action === 'approve') {
      const result = await expenseReimbursementService.approveExpense(id, {
        approvedAmount,
        approvedBy: body.approvedBy,
        approvedByName: body.approvedByName,
      });

      if (!result.success) {
        return NextResponse.json(
          error(result.error || '审批失败', ErrorCode.INTERNAL_ERROR),
          { status: 500 }
        );
      }

      return NextResponse.json(success(result.data, 'database'));
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          error('请填写拒绝原因', ErrorCode.BAD_REQUEST),
          { status: 400 }
        );
      }

      const result = await expenseReimbursementService.rejectExpense(id, rejectionReason);

      if (!result.success) {
        return NextResponse.json(
          error(result.error || '拒绝失败', ErrorCode.INTERNAL_ERROR),
          { status: 500 }
        );
      }

      return NextResponse.json(success(result.data, 'database'));
    }

    if (action === 'pay') {
      const result = await expenseReimbursementService.payExpense(id, {
        paidAt,
        paidBy,
        paidByName,
        paymentMethod,
        paymentVoucher,
      });

      if (!result.success) {
        return NextResponse.json(
          error(result.error || '付款操作失败', ErrorCode.INTERNAL_ERROR),
          { status: 500 }
        );
      }

      return NextResponse.json(success(result.data, 'database'));
    }

    return NextResponse.json(
      error('无效的操作', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  } catch (err) {
    console.error('[API] Approve expense error:', err);
    return NextResponse.json(
      error('审批操作失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
