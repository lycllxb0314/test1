/**
 * 安全演练 API
 * 
 * GET: 获取安全演练列表
 * POST: 创建安全演练
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { safetyDrillService } from '@/services/safety.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取安全演练列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const year = searchParams.get('year') || undefined;

  const result = await safetyDrillService.getList({ type, year });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取安全演练列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((drill: any) => ({
    id: drill.id,
    type: drill.type,
    title: drill.title,
    drillDate: drill.drill_date,
    location: drill.location,
    participants: drill.participants,
    duration: drill.duration,
    result: drill.result,
    issues: drill.issues,
    improvements: drill.improvements,
    organizer: drill.organizer,
    createdAt: drill.created_at,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 创建安全演练
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await safetyDrillService.create({
    title: body.title,
    type: body.type,
    drill_date: body.drillDate || body.date,
    location: body.location,
    participants: body.participants || 0,
    duration: body.duration,
    result: body.result,
    issues: body.issues || [],
    improvements: body.improvements || [],
    organizer: body.organizer,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建安全演练失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
