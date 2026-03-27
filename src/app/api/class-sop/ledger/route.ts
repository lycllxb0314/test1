/**
 * 台账条目 API
 * GET  - 获取台账列表
 * POST - 创建台账条目
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';
import { LedgerType, LedgerStatus, Severity } from '@/types/class-sop';

export async function GET(request: NextRequest) {
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
    
    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error('获取台账列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取台账列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.type || !body.title || !body.classId || !body.handlerId || !body.handlerName || !body.className) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
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
        handlerId: body.handlerId,
        handlerName: body.handlerName,
        followUpRequired: body.followUpRequired,
        followUpDate: body.followUpDate,
        tags: body.tags,
      },
      body.className
    );
    
    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('创建台账条目失败:', error);
    return NextResponse.json(
      { success: false, error: '创建台账条目失败' },
      { status: 500 }
    );
  }
}
