/**
 * 台账解决 API
 * POST - 解决台账条目
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const entry = await classSopService.ledger.resolveLedgerEntry(id, body.notes);
    
    return NextResponse.json({
      success: true,
      data: entry,
      message: '台账条目已解决',
    });
  } catch (error) {
    console.error('解决台账条目失败:', error);
    return NextResponse.json(
      { success: false, error: '解决台账条目失败' },
      { status: 500 }
    );
  }
}
