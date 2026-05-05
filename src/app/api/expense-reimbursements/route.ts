/**
 * 报销申请列表 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { success, error, ErrorCode } from '@/lib/api';
import { expenseReimbursementService } from '@/services/expense-reimbursement.service';

export const GET = protectedRoute(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const applicantId = searchParams.get('applicantId') || undefined;
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;

  const result = await expenseReimbursementService.getExpenses({
    applicantId,
    status,
    type,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '获取报销列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data || [], 'database'));
});

export const POST = protectedRoute(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { 
      title, 
      type, 
      amount, 
      totalAmount,
      description, 
      applicantId, 
      applicantName, 
      department, 
      urgency, 
      items, 
      images 
    } = body;

    if (!title || !applicantId || (amount === undefined && totalAmount === undefined)) {
      return NextResponse.json(
        error('缺少必填字段', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const result = await expenseReimbursementService.createExpense({
      title,
      type: type || 'other',
      totalAmount: totalAmount || amount,
      amount: amount || totalAmount,
      description: description || '',
      applicantId,
      applicantName: applicantName || '',
      department: department || '',
      urgency: urgency || 'normal',
      items: items || [],
      images: images || [],
    });

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '创建报销申请失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[API] Create expense error:', err);
    return NextResponse.json(
      error('创建报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
