import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取通知消息列表
 * 查询参数：
 * - receiverId: 接收人ID
 * - type: 消息类型
 * - isRead: 是否已读
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get('receiverId');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    let query = client
      .from('communications')
      .select('*')
      .order('created_at', { ascending: false });

    if (receiverId) {
      query = query.contains('receiver_ids', [receiverId]);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const formattedData = (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      senderId: item.sender_id,
      senderName: item.sender_name,
      receiverIds: item.receiver_ids || [],
      isRead: item.is_read,
      readAt: item.read_at,
      priority: item.priority,
      attachments: item.attachments || [],
      createdAt: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch communications:', error);
    return NextResponse.json({
      success: false,
      error: '获取通知消息列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 发送通知消息
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      type,
      title,
      content,
      senderId,
      senderName,
      receiverIds,
      priority,
      attachments,
    } = body;

    const { data, error } = await client
      .from('communications')
      .insert({
        type,
        title,
        content,
        sender_id: senderId,
        sender_name: senderName,
        receiver_ids: receiverIds || [],
        is_read: false,
        priority: priority || 'normal',
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create communication:', error);
    return NextResponse.json({
      success: false,
      error: '发送通知消息失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 标记消息已读
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, isRead } = body;

    const { data, error } = await client
      .from('communications')
      .update({
        is_read: isRead ?? true,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update communication:', error);
    return NextResponse.json({
      success: false,
      error: '更新消息状态失败',
    }, { status: 500 });
  }
}
