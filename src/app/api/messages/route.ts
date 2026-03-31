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
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { messageService } from '@/services/message.service';
import { messageRepository } from '@/repositories/message.repository';
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
    // 群组通知类型
    group_notice_principal: 'system_announcement',
    group_notice: 'group_notice',
    group_notice_academic: 'group_notice',
    group_notice_moral: 'group_notice',
    group_notice_general: 'group_notice',
    // 部门广播通知
    department_notice: 'system_announcement',
    internal_notice: 'personal_message',
  };
  
  return typeMap[dbType] || 'personal_message';
}

// 消息分类：部门通知 / 业务通知 / 个人通知
type MessageScope = 'department' | 'business' | 'personal';

// 根据事件类型和元数据确定消息分类
function getMessageScope(event: MessageEvent, metadata?: Record<string, unknown>): MessageScope {
  // 部门通知：显示在所有部门工作台
  const departmentEvents: MessageEvent[] = [
    'system_announcement',
    'policy_update',
    'maintenance_notice',
  ];
  
  // 业务通知：根据相关部门显示
  const businessEvents: MessageEvent[] = [
    'schedule_change',
    'exam_notice',
    'grade_publish',
    'homework_assign',
    'activity_notice',
    'honor_notice',
    'moral_evaluation',
    'habit_record',
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
  
  // 群组通知：根据 target_department 判断作用域
  if (event === 'group_notice' && metadata?.target_department) {
    return 'business';
  }
  
  return 'personal';
}

// 根据事件类型和元数据获取相关部门
function getRelevantDepartments(event: MessageEvent, metadata?: Record<string, unknown>): string[] {
  // 教务相关事件
  const academicEvents: MessageEvent[] = ['schedule_change', 'exam_notice', 'grade_publish', 'homework_assign'];
  // 德育相关事件
  const moralEvents: MessageEvent[] = ['activity_notice', 'honor_notice', 'moral_evaluation', 'habit_record'];
  // 总务相关事件
  const generalEvents: MessageEvent[] = ['repair_notice', 'asset_notice', 'safety_alert'];
  
  if (academicEvents.includes(event)) return ['academic'];
  if (moralEvents.includes(event)) return ['moral'];
  if (generalEvents.includes(event)) return ['general'];
  
  // 群组通知：从 metadata 中获取目标部门
  if (event === 'group_notice' && metadata?.target_department) {
    const targetDept = metadata.target_department as string;
    return [targetDept];
  }
  
  return [];
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
  const department = searchParams.get('department') || undefined;

  // 如果用户未登录，返回空列表
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

  try {
    // 使用 MessageService 查询消息
    const result = await messageService.queryUserMessages({
      userId,
      event: eventFilter as MessageEvent | undefined,
      status: statusFilter as MessageStatus | undefined,
      page,
      pageSize,
      unreadOnly,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '获取消息失败' }, { status: 500 });
    }

    // 获取用户阅读状态
    const readStatuses = await messageRepository.findUnread(userId);
    
    // 格式化消息
    let messages: (UserMessage & { _deletedAt?: string; _isArchived?: boolean })[] = (result.data || []).map(msg => ({
      ...msg,
      _isArchived: msg.status === 'archived',
    }));
    
    // 过滤掉已删除的消息
    const activeMessages = messages.filter(msg => !msg._deletedAt);

    // 默认不显示已归档的消息
    let displayMessages = activeMessages;
    if (statusFilter !== 'archived') {
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
      const deptMapping: Record<string, string> = {
        'academic': 'academic',
        'moral': 'moral',
        'general': 'general',
      };
      const targetDept = deptMapping[department] || department;
      
      filteredMessages = filteredMessages.filter(m => {
        // 部门广播消息
        if (m.recipients?.type === 'department') {
          const msgTargetDept = m.metadata?.target_department as string;
          return msgTargetDept === targetDept;
        }
        
        const scope = getMessageScope(m.event, m.metadata);
        const relevantDepts = getRelevantDepartments(m.event, m.metadata);
        
        if (scope === 'department') return true;
        if (scope === 'business') return relevantDepts.includes(department);
        return false;
      });
    }

    // 计算统计数据
    const statsSource = department ? filteredMessages : messages;
    const statistics: MessageStatistics = {
      total: statsSource.length,
      unread: statsSource.filter(m => m.status === 'unread').length,
      read: statsSource.filter(m => m.status === 'read').length,
      archived: statsSource.filter(m => m.status === 'archived').length,
      byEvent: {} as Record<MessageEvent, number>,
      byPriority: {} as Record<MessagePriority, number>,
    };

    // 分页处理
    const finalTotal = department ? filteredMessages.length : (result.pagination?.total || 0);
    const totalPages = Math.max(1, Math.ceil(finalTotal / pageSize));
    
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

    const result = await messageService.sendMessage({
      title,
      content,
      event,
      priority,
      recipientIds: recipients.userIds,
      recipientRoles: recipients.roles,
      metadata,
      senderId: user.id,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || '发送消息失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: '消息发送成功',
    });
  } catch (err) {
    console.error('Send message API error:', err);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const GET = protectedRoute(handleGetMessages, { optional: true });
export const POST = protectedRoute(handleSendMessage);
