/**
 * 台账解决 API
 * POST - 解决台账条目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { classSopService } from '@/services/class-sop.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST - 解决台账条目
 */
export const POST = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const body = await request.json();
    
    const entry = await classSopService.ledger.resolveLedgerEntry(id, body.notes);
    
    return NextResponse.json(success(entry));
  } catch (err) {
    console.error('解决台账条目失败:', err);
    return NextResponse.json(
      error('解决台账条目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
