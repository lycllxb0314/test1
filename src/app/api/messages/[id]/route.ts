/**
 * 消息详情 API
 * 
 * GET: 获取消息详情
 * PUT: 更新消息
 * DELETE: 删除消息
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { messageService } from '@/services/communication.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取消息详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await messageService.getById(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取消息详情失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const message = result.data;
  return NextResponse.json(success({
    id: message.id,
    senderId: message.sender_id,
    senderName: message.sender_name,
    receiverId: message.receiver_id,
    receiverType: message.receiver_type,
    subject: message.subject,
    content: message.content,
    type: message.type,
    priority: message.priority,
    status: message.status,
    sentAt: message.sent_at,
    readAt: message.read_at,
    createdAt: message.created_at,
  }));
}

/**
 * PUT - 更新消息（标记已读等）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  let result;
  if (body.action === 'markRead') {
    result = await messageService.markAsRead(id);
  } else if (body.action === 'send') {
    result = await messageService.send(id);
  } else {
    return NextResponse.json(
      error('无效的操作', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '更新消息失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * DELETE - 删除消息
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await messageService.delete(id);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '删除消息失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ deleted: true }));
}
