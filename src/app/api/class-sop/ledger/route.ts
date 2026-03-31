/**
 * 台账条目 API
 * GET  - 获取台账列表
 * POST - 创建台账条目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { classSopService } from '@/services/class-sop.service';
import { LedgerType, LedgerStatus, Severity } from '@/types/class-sop';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取台账列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as LedgerType | null;
    const classId = searchParams.get('classId');
    const status = searchParams.get('status') as LedgerStatus | null;
    const severity = searchParams.get('severity') as Severity | null;
    const handlerId = searchParams.get('handlerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const followUpRequired = searchParams.get('followUpRequired');
    const search = searchParams.get('search');
    
    const entries = await classSopService.ledger.getLedgerEntries({
      type: type || undefined,
      classId: classId || undefined,
      status: status || undefined,
      severity: severity || undefined,
      handlerId: handlerId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      followUpRequired: followUpRequired ? followUpRequired === 'true' : undefined,
      search: search || undefined,
    });
    
    return NextResponse.json(success(entries));
  } catch (err) {
    console.error('获取台账列表失败:', err);
    return NextResponse.json(
      error('获取台账列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * POST - 创建台账条目
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.type || !body.title || !body.classId || !body.className) {
      return NextResponse.json(
        error('缺少必填字段', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const entry = await classSopService.ledger.createLedgerEntry(
      {
        type: body.type,
        title: body.title,
        description: body.description,
        classId: body.classId,
        involvedPersons: body.involvedPersons,
        executionId: body.executionId,
        occurredAt: body.occurredAt,
        severity: body.severity,
        handlerId: user.id,
        handlerName: user.name || '',
        followUpRequired: body.followUpRequired,
        followUpDate: body.followUpDate,
        tags: body.tags,
      },
      body.className
    );
    
    return NextResponse.json(success(entry));
  } catch (err) {
    console.error('创建台账条目失败:', err);
    return NextResponse.json(
      error('创建台账条目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
