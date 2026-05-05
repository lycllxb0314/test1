/**
 * 安全检查解决 API
 * 
 * POST: 解决检查问题
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { safetyInspectionService } from '@/services/safety.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * POST - 解决检查问题
 */
export const POST = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少检查ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  const body = await request.json();

  const result = await safetyInspectionService.resolve(id, body.resolvedBy || '系统');

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '解决检查问题失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});
