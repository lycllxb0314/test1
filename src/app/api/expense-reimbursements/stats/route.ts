/**
 * 报销统计 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { success, error, ErrorCode } from '@/lib/api';
import { expenseReimbursementService } from '@/services/expense-reimbursement.service';

export const GET = protectedRoute(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const applicantId = searchParams.get('applicantId') || undefined;

  const result = await expenseReimbursementService.getStatistics(applicantId);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '获取统计数据失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data, 'database'));
});
