/**
 * 消息 API
 * 
 * GET: 获取当前用户的消息列表
 * POST: 发送新消息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { 
  UserMessage, 
  SendMessageRequest, 
  MessageStatistics,
  MessageEvent,
  MessagePriority,
  MessageStatus,
} from '@/types/messages';

// GET: 获取消息列表
const handleGetMessages = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const eventFilter = searchParams.get('event') || undefined;
  const statusFilter = searchParams.get('status') || undefined;
  const searchFilter = searchParams.get('search') || undefined;
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  // 如果用户未登录，返回空列表而不是错误
  if (!user) {
    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
      statistics: {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0,
        byEvent: {},
        byPriority: {},
      },
    });
  }

  const userId = user.id;
  const userRole = user.role;

  try {
    const client = getSupabaseClient();

    // 获取用户的完整角色信息（包括兼任角色）
    const { data: userData } = await client
      .from('users')
      .select('role, additional_roles, class_id, sub_teacher_classes')
      .eq('id', userId)
      .single();
    
    // 用户所有角色（主角色 + 兼任角色）
    const userAllRoles: string[] = [userRole];
    if (userData?.additional_roles && Array.isArray(userData.additional_roles)) {
      userAllRoles.push(...(userData.additional_roles as string[]));
    }

    // 获取用户所属班级
    let userClassIds: string[] = [];
    let userGrades: number[] = [];
    
    if (['head_teacher', 'subject_teacher', 'skill_teacher'].includes(userRole)) {
      if (userData?.class_id) {
        userClassIds.push(userData.class_id);
      }
      if (userData?.sub_teacher_classes) {
        userClassIds.push(...(userData.sub_teacher_classes as string[]));
      }
      
      if (userClassIds.length > 0) {
        const { data: classData } = await client
          .from('classes')
          .select('grade')
          .in('id', userClassIds);
        userGrades = (classData || []).map((c: { grade: number }) => c.grade);
      }
    } else if (userRole === 'parent') {
      // 家长通过 account_id 关联
      const { data: parentData } = await client
        .from('parents')
        .select('student_id, class_id')
        .eq('account_id', userId);
      
      if (parentData && parentData.length > 0) {
        parentData.forEach((p: { student_id: string; class_id: string }) => {
          if (p.class_id) userClassIds.push(p.class_id);
        });
        
        if (userClassIds.length > 0) {
          const { data: classData } = await client
            .from('classes')
            .select('grade')
            .in('id', userClassIds);
          userGrades = (classData || []).map((c: { grade: number }) => c.grade);
        }
      }
    }

    // 直接按用户ID查询消息（最常见的情况：recipient_id = userId）
    // 这样可以避免分页后再筛选的问题
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 查询发给当前用户的消息
    const { data: messages, error: msgError, count } = await client
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (msgError) {
      console.error('Failed to fetch messages:', msgError);
      return NextResponse.json({ success: false, error: '获取消息失败' }, { status: 500 });
    }

    // 获取用户阅读状态
    const { data: readStatuses } = await client
      .from('message_reads')
      .select('*')
      .eq('user_id', userId);

    const readMap = new Map(
      (readStatuses || []).map((r: { message_id: string; read_at: string; is_pinned: boolean; status?: string }) => [
        r.message_id, 
        { readAt: r.read_at, isPinned: r.is_pinned, status: r.status }
      ])
    );

    // 处理消息
    const userMessages: UserMessage[] = (messages || [])
      .map((msg: Record<string, unknown>) => {
        const readInfo = readMap.get(msg.id as string);
        const status: MessageStatus = (readInfo?.status as MessageStatus) || (readInfo?.readAt ? 'read' : 'unread');
        return {
          id: msg.id as string,
          title: msg.title as string,
          content: msg.content as string,
          event: msg.event as MessageEvent,
          priority: msg.priority as MessagePriority,
          senderId: msg.sender_id as string,
          senderName: msg.sender_name as string,
          senderRole: msg.sender_role as string,
          recipients: {
            type: (msg.recipient_type || 'individual') as 'all' | 'role' | 'class' | 'grade' | 'individual',
            roles: msg.roles as string[] | undefined,
            classIds: msg.class_ids as string[] | undefined,
            grades: msg.grades as number[] | undefined,
            userIds: msg.user_ids as string[] | undefined,
          },
          metadata: msg.metadata as Record<string, unknown> | undefined,
          createdAt: msg.created_at as string,
          sentAt: msg.sent_at as string | undefined,
          expiresAt: msg.expires_at as string | undefined,
          status,
          readAt: readInfo?.readAt,
          isPinned: readInfo?.isPinned || false,
        };
      });

    // 应用额外筛选
    let filteredMessages = userMessages;
    if (eventFilter) {
      filteredMessages = filteredMessages.filter(m => m.event === eventFilter);
    }
    if (statusFilter) {
      filteredMessages = filteredMessages.filter(m => m.status === statusFilter);
    }
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      filteredMessages = filteredMessages.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.content.toLowerCase().includes(search)
      );
    }
    if (unreadOnly) {
      filteredMessages = filteredMessages.filter(m => m.status === 'unread');
    }

    // 计算统计数据
    const statistics: MessageStatistics = {
      total: userMessages.length,
      unread: userMessages.filter(m => m.status === 'unread').length,
      read: userMessages.filter(m => m.status === 'read').length,
      archived: userMessages.filter(m => m.status === 'archived').length,
      byEvent: {} as Record<MessageEvent, number>,
      byPriority: {} as Record<MessagePriority, number>,
    };

    return NextResponse.json({
      success: true,
      data: filteredMessages,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      statistics,
    });
  } catch (err) {
    console.error('Messages API error:', err);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

// POST: 发送消息
const handleSendMessage = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body: SendMessageRequest = await request.json();
    const { title, content, event, priority = 'normal', recipients, metadata, scheduledAt } = body;

    if (!title || !content || !event || !recipients) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: senderData } = await client
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single();

    const { data: message, error: insertError } = await client
      .from('messages')
      .insert({
        title,
        content,
        event,
        priority,
        sender_id: user.id,
        sender_name: senderData?.name || '系统',
        sender_role: senderData?.role,
        recipient_type: recipients.type,
        roles: recipients.roles,
        class_ids: recipients.classIds,
        grades: recipients.grades,
        user_ids: recipients.userIds,
        metadata,
        sent_at: scheduledAt || new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create message:', insertError);
      return NextResponse.json({ success: false, error: '发送消息失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: message,
      message: '消息发送成功',
    });
  } catch (err) {
    console.error('Send message API error:', err);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const GET = protectedRoute(handleGetMessages, { optional: true });
export const POST = protectedRoute(handleSendMessage);
