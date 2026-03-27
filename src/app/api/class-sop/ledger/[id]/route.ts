/**
 * 台账条目详情 API
 * GET    - 获取台账详情
 * PUT    - 更新台账
 * DELETE - 删除台账
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const entry = await classSopService.ledger.getLedgerEntry(id);
    
    if (!entry) {
      return NextResponse.json(
        { success: false, error: '台账条目不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('获取台账详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取台账详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const entry = await classSopService.ledger.updateLedgerEntry(id, {
      title: body.title,
      description: body.description,
      involvedPersons: body.involvedPersons,
      severity: body.severity,
      status: body.status,
      resolvedAt: body.resolvedAt,
      followUpRequired: body.followUpRequired,
      followUpDate: body.followUpDate,
      followUpNotes: body.followUpNotes,
      tags: body.tags,
    });
    
    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('更新台账条目失败:', error);
    return NextResponse.json(
      { success: false, error: '更新台账条目失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    await classSopService.ledger.deleteLedgerEntry(id);
    
    return NextResponse.json({
      success: true,
      message: '台账条目已删除',
    });
  } catch (error) {
    console.error('删除台账条目失败:', error);
    return NextResponse.json(
      { success: false, error: '删除台账条目失败' },
      { status: 500 }
    );
  }
}
