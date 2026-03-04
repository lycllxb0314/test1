/**
 * 单条消息 API
 * 
 * GET: 获取消息详情
 * PUT: 更新消息状态（标记已读、归档等）
 * DELETE: 删除消息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取消息详情
const handleGetMessage = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少消息ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: message, error: msgError } = await client
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ success: false, error: '消息不存在' }, { status: 404 });
    }

    const { data: readStatus } = await client
      .from('message_reads')
      .select('*')
      .eq('message_id', id)
      .eq('user_id', context.user.id)
      .single();

    const result = {
      ...message,
      status: readStatus ? 'read' : 'unread',
      readAt: readStatus?.read_at,
      isPinned: readStatus?.is_pinned || false,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Get message API error:', err);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

// PUT: 更新消息状态
const handleUpdateMessage = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少消息ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    const client = getSupabaseClient();

    const { data: message, error: msgError } = await client
      .from('messages')
      .select('id')
      .eq('id', id)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ success: false, error: '消息不存在' }, { status: 404 });
    }

    const userId = context.user.id;

    switch (action) {
      case 'read':
        const { error: readError } = await client
          .from('message_reads')
          .upsert({
            message_id: id,
            user_id: userId,
            read_at: new Date().toISOString(),
          }, { onConflict: 'message_id,user_id' });
        
        if (readError) {
          console.error('Failed to mark as read:', readError);
          return NextResponse.json({ success: false, error: '标记已读失败' }, { status: 500 });
        }
        break;

      case 'unread':
        await client
          .from('message_reads')
          .delete()
          .eq('message_id', id)
          .eq('user_id', userId);
        break;

      case 'archive':
        await client
          .from('message_reads')
          .upsert({
            message_id: id,
            user_id: userId,
            status: 'archived',
          }, { onConflict: 'message_id,user_id' });
        break;

      case 'pin':
        await client
          .from('message_reads')
          .upsert({
            message_id: id,
            user_id: userId,
            is_pinned: true,
          }, { onConflict: 'message_id,user_id' });
        break;

      case 'unpin':
        await client
          .from('message_reads')
          .update({ is_pinned: false })
          .eq('message_id', id)
          .eq('user_id', userId);
        break;

      default:
        return NextResponse.json({ success: false, error: '无效的操作' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: '操作成功' });
  } catch (err) {
    console.error('Update message API error:', err);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

// DELETE: 删除消息（从用户视角删除）
const handleDeleteMessage = async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少消息ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    await client
      .from('message_reads')
      .upsert({
        message_id: id,
        user_id: context.user.id,
        deleted_at: new Date().toISOString(),
      }, { onConflict: 'message_id,user_id' });

    return NextResponse.json({ success: true, message: '消息已删除' });
  } catch (err) {
    console.error('Delete message API error:', err);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const GET = protectedRoute(handleGetMessage);
export const PUT = protectedRoute(handleUpdateMessage);
export const DELETE = protectedRoute(handleDeleteMessage);
