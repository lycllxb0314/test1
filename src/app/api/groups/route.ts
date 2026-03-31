/**
 * 通讯组 API
 * 
 * GET: 获取通讯组列表
 * POST: 创建通讯组
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { groupService } from '@/services/communication.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取通讯组列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const creatorId = searchParams.get('creatorId') || undefined;
  const memberId = searchParams.get('memberId') || undefined;

  const result = await groupService.getList({ type, creatorId, memberId });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取通讯组列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((group: any) => ({
    id: group.id,
    name: group.name,
    type: group.type,
    description: group.description,
    members: group.members,
    creatorId: group.creator_id,
    createdAt: group.created_at,
  }));

  return NextResponse.json(success(formattedData));
}

/**
 * POST - 创建通讯组
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await groupService.create({
    name: body.name,
    type: body.type,
    description: body.description,
    members: body.members || [],
    creator_id: body.creatorId,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建通讯组失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
