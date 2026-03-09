/**
 * 消息 API
 * 
 * GET: 获取当前用户的消息列表
 * POST: 发送新消息
 * 
 * 消息分类逻辑：
 * - department: 部门通知（如校长室通知、系统公告），显示在所有部门工作台
 * - business: 业务通知（如调课、活动），根据相关部门显示
 * - personal: 个人通知（如请假审批、任务分配），不在部门工作台显示
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

// 将数据库 type 字段映射到 MessageEvent 类型
function mapTypeToEvent(dbType: string): MessageEvent {
  const typeMap: Record<string, MessageEvent> = {
    notification: 'system_announcement',
    announcement: 'system_announcement',
    task: 'task_assign',
    approval: 'leave_approval',
    schedule: 'schedule_change',
    exam: 'exam_notice',
    grade: 'grade_publish',
    homework: 'homework_assign',
    activity: 'activity_notice',
    honor: 'honor_notice',
    moral: 'moral_evaluation',
    meeting: 'parent_meeting',
    absence: 'student_absence',
    habit: 'habit_record',
    repair: 'repair_notice',
    asset: 'asset_notice',
    safety: 'safety_alert',
    message: 'personal_message',
    reminder: 'task_reminder',
  };
  
  return typeMap[dbType] || 'personal_message';
}

// 消息分类：部门通知 / 业务通知 / 个人通知
type MessageScope = 'department' | 'business' | 'personal';

// 根据事件类型确定消息分类
function getMessageScope(event: MessageEvent): MessageScope {
  // 部门通知：显示在所有部门工作台
  const departmentEvents: MessageEvent[] = [
    'system_announcement',
    'policy_update',
    'maintenance_notice',
  ];
  
  // 业务通知：根据相关部门显示
  const businessEvents: MessageEvent[] = [
    // 教务
    'schedule_change',
    'exam_notice',
    'grade_publish',
    'homework_assign',
    // 德育
    'activity_notice',
    'honor_notice',
    'moral_evaluation',
    'habit_record',
    // 总务
    'repair_notice',
    'asset_notice',
    'safety_alert',
  ];
  
  // 个人通知：不在部门工作台显示
  const personalEvents: MessageEvent[] = [
    'leave_approval',
    'task_assign',
    'task_reminder',
    'personal_message',
    'parent_meeting',
    'student_absence',
  ];
  
  if (departmentEvents.includes(event)) return 'department';
  if (businessEvents.includes(event)) return 'business';
  return 'personal';
}

// 根据事件类型获取相关部门
function getRelevantDepartments(event: MessageEvent): string[] {
  // 教务相关事件
  const academicEvents: MessageEvent[] = ['schedule_change', 'exam_notice', 'grade_publish', 'homework_assign'];
  // 德育相关事件
  const moralEvents: MessageEvent[] = ['activity_notice', 'honor_notice', 'moral_evaluation', 'habit_record'];
  // 总务相关事件
  const generalEvents: MessageEvent[] = ['repair_notice', 'asset_notice', 'safety_alert'];
  
  if (academicEvents.includes(event)) return ['academic'];
  if (moralEvents.includes(event)) return ['moral'];
  if (generalEvents.includes(event)) return ['general'];
  return []; // 部门通知和个人通知返回空
}

// GET: 获取消息列表
const handleGetMessages = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const eventFilter = searchParams.get('event') || undefined;
  const statusFilter = searchParams.get('status') || undefined;
  const searchFilter = searchParams.get('search') || undefined;
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  
  // 部门工作台参数：用于过滤部门消息
  // - 未传入：显示所有消息（个人中心）
  // - 传入 'academic'/'moral'/'general'：显示部门通知 + 该部门相关的业务通知
  const department = searchParams.get('department') || undefined;

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
      .select('role, additional_roles, class_id')
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

    // 查询发给当前用户的消息 - 只选择数据库中存在的字段
    const { data: messages, error: msgError, count } = await client
      .from('messages')
      .select('id, title, content, type, priority, sender_id, sender_name, sender_avatar, recipient_id, is_read, is_archived, metadata, created_at, updated_at, read_at, archived_at, recipient_type, roles, class_ids, grades, user_ids, sender_role, sent_at, expires_at', { count: 'exact' })
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (msgError) {
      console.error('Failed to fetch messages:', msgError);
      return NextResponse.json({ success: false, error: '获取消息失败' }, { status: 500 });
    }

    // 获取用户阅读状态（包括归档和删除状态）
    const { data: readStatuses } = await client
      .from('message_reads')
      .select('*')
      .eq('user_id', userId);

    const readMap = new Map(
      (readStatuses || []).map((r: { message_id: string; read_at: string; is_pinned: boolean; status?: string; deleted_at?: string }) => [
        r.message_id, 
        { readAt: r.read_at, isPinned: r.is_pinned, status: r.status, deletedAt: r.deleted_at }
      ])
    );

    // 处理消息 - 映射数据库字段到前端格式
    const userMessages = (messages || [])
      .map((msg: Record<string, unknown>) => {
        const readInfo = readMap.get(msg.id as string);
        // 数据库中 is_read 字段表示阅读状态，message_reads 表中的状态优先
        const dbIsRead = msg.is_read as boolean;
        const status: MessageStatus = (readInfo?.status as MessageStatus) || (readInfo?.readAt || dbIsRead ? 'read' : 'unread');
        
        // 将数据库的 type 字段映射为 event 字段
        // 数据库 type 可能的值: notification, task, approval, schedule 等
        // 需要映射到 MessageEvent 类型
        const dbType = (msg.type || 'personal_message') as string;
        const eventType = mapTypeToEvent(dbType);
        
        return {
          id: msg.id as string,
          title: msg.title as string,
          content: msg.content as string,
          event: eventType,
          priority: (msg.priority || 'normal') as MessagePriority,
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
          // 内部使用，用于后续过滤
          _deletedAt: readInfo?.deletedAt,
          _isArchived: readInfo?.status === 'archived',
        };
      }) as Array<UserMessage & { _deletedAt?: string; _isArchived?: boolean }>;
    
    // 过滤掉已删除的消息
    const activeMessages = userMessages.filter((msg) => !msg._deletedAt);

    // 如果没有指定状态筛选，默认不显示已归档的消息
    // 除非用户明确选择查看已归档消息
    let displayMessages = activeMessages;
    if (statusFilter !== 'archived') {
      // 默认隐藏已归档消息
      displayMessages = displayMessages.filter(m => !m._isArchived);
    }

    // 应用额外筛选
    let filteredMessages = displayMessages;
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
    
    // 部门工作台过滤逻辑
    if (department) {
      filteredMessages = filteredMessages.filter(m => {
        const scope = getMessageScope(m.event);
        const relevantDepts = getRelevantDepartments(m.event);
        
        // 部门通知：显示在所有部门工作台
        if (scope === 'department') return true;
        
        // 业务通知：只显示在相关部门的工作台
        if (scope === 'business') return relevantDepts.includes(department);
        
        // 个人通知：不显示在部门工作台
        return false;
      });
    }

    // 计算统计数据
    // 注意：部门工作台的统计只统计部门相关的消息，不包含个人消息
    const statsSource = department ? filteredMessages : userMessages;
    const statistics: MessageStatistics = {
      total: statsSource.length,
      unread: statsSource.filter(m => m.status === 'unread').length,
      read: statsSource.filter(m => m.status === 'read').length,
      archived: statsSource.filter(m => m.status === 'archived').length,
      byEvent: {} as Record<MessageEvent, number>,
      byPriority: {} as Record<MessagePriority, number>,
    };

    // 部门工作台需要基于过滤后的消息进行分页
    const finalTotal = department ? filteredMessages.length : (count || 0);
    const totalPages = Math.max(1, Math.ceil(finalTotal / pageSize));
    
    // 部门工作台需要在内存中进行分页
    let paginatedMessages = filteredMessages;
    if (department) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      paginatedMessages = filteredMessages.slice(start, end);
    }

    return NextResponse.json({
      success: true,
      data: paginatedMessages,
      pagination: {
        page,
        pageSize,
        total: finalTotal,
        totalPages,
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
