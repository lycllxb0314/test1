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
    internal_notice: 'personal_message',
    parent_notice: 'personal_message',
    department_notice: 'system_announcement',
    room_booking_approval: 'leave_approval',
    information_collection: 'personal_message',
    course_adjustment: 'schedule_change',
    // 群组通知类型
    group_notice_principal: 'system_announcement',
    group_notice: 'group_notice',
    group_notice_academic: 'group_notice',
    group_notice_moral: 'group_notice',
    group_notice_general: 'group_notice',
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
    'leave_approval', // 审批相关消息现在是业务通知
  ];
  
  // 个人通知：不在部门工作台显示
  const personalEvents: MessageEvent[] = [
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
  const moralEvents: MessageEvent[] = ['activity_notice', 'honor_notice', 'moral_evaluation', 'habit_record', 
    'honor_campaign', 'honor_approval', 'honor_approved', 'honor_rejected', 'routine_score', 'duty_reminder'];
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
  
  // 审批通知：根据 business_type 判断目标部门
  if (event === 'leave_approval' && metadata?.business_type) {
    const businessType = metadata.business_type as string;
    if (businessType === 'room_booking') return ['academic'];
    if (businessType === 'leave_request') return ['academic'];
    // 默认返回 academic，因为请假和教室预约都归教务处
    return ['academic'];
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

  // 调试日志
  console.log('[Messages API] Request params:', { 
    userId: user?.id, 
    role: user?.role, 
    department,
    page, 
    pageSize 
  });

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
  const userRole = user.role; // 获取用户角色

  try {
    // 使用 MessageService 查询消息（包含部门广播消息和角色消息）
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
    let messages: (UserMessage & { _deletedAt?: string; _isArchived?: boolean; _roles?: string[] })[] = (result.data || []).map(msg => ({
      ...msg,
      _isArchived: msg.status === 'archived',
      // 从 metadata 中获取 roles（Supabase schema cache 问题）
      _roles: (msg.metadata?.roles as string[]) || [],
    }));
    
    // 过滤掉已删除的消息
    let activeMessages = messages.filter(msg => !msg._deletedAt);

    // 过滤角色消息：只保留角色匹配的消息
    activeMessages = activeMessages.filter(m => {
      // 如果消息有 roles 字段，检查用户角色是否匹配
      if (m._roles && m._roles.length > 0) {
        // 如果用户角色不在消息的目标角色列表中，过滤掉
        if (!m._roles.includes(userRole)) {
          return false;
        }
      }
      return true;
    });

    // 默认不显示已归档的消息
    let displayMessages = activeMessages;
    if (statusFilter !== 'archived') {
      displayMessages = displayMessages.filter(m => !m._isArchived);
    }

    // 应用额外筛选
    let filteredMessages = displayMessages;
    
    // 过滤消息逻辑
    // 
    // 规则：
    // 1. 教师个人工作台（无 department 参数）：只显示个人消息
    //    - 排除部门广播消息（recipientType === 'department'）
    //    - 排除行政业务消息（recipientType === 'administrative'，如审批待办）
    // 2. 部门工作台（有 department 参数）：显示该部门的广播消息 + 相关业务消息
    
    if (!department) {
      // 教师个人工作台：只显示个人消息，排除行政业务消息
      filteredMessages = filteredMessages.filter(m => {
        // 排除部门广播消息
        if (m.recipientType === 'department' || m.recipients?.type === 'department') {
          return false;
        }
        // 排除行政业务消息（如审批待办）
        if (m.recipientType === 'administrative') {
          return false;
        }
        // 排除审批待办类消息（event === 'leave_approval' 且标题包含"审批待办"）
        if (m.event === 'leave_approval' && m.title?.includes('审批待办')) {
          return false;
        }
        return true;
      });
    } else {
      // 部门工作台过滤逻辑
      
      // 部门标识映射：将前端传入的 department 参数映射到实际部门
      const deptMapping: Record<string, string> = {
        'academic': 'academic',
        'moral': 'moral',
        'general': 'general',
        'vice-principal-moral': 'moral', // 德育副校长看到德育相关消息
        'vice-principal-academic': 'academic', // 教学副校长看到教务相关消息
        'vice-principal-general': 'general', // 总务副校长看到总务相关消息
      };
      const targetDept = deptMapping[department] || department;
      
      filteredMessages = filteredMessages.filter(m => {
        // 部门广播消息 - 检查 recipientType 或 recipients.type
        const isDeptBroadcast = m.recipientType === 'department' || m.recipients?.type === 'department';
        if (isDeptBroadcast) {
          const msgTargetDept = m.metadata?.target_department as string;
          // 只显示目标部门匹配的广播消息
          return msgTargetDept === targetDept;
        }
        
        // 审批待办消息 - 显示在领导工作台
        if (m.recipientType === 'administrative' || 
            (m.event === 'leave_approval' && m.title?.includes('审批待办'))) {
          // 检查消息的目标部门是否与当前部门匹配
          const msgTargetDept = m.metadata?.target_department as string;
          if (msgTargetDept && msgTargetDept === targetDept) {
            return true;
          }
          // 如果没有目标部门信息，根据消息类型推断
          const relevantDepts = getRelevantDepartments(m.event, m.metadata);
          return relevantDepts.includes(targetDept);
        }
        
        // 非广播消息：检查是否与目标部门相关
        const scope = getMessageScope(m.event, m.metadata);
        const relevantDepts = getRelevantDepartments(m.event, m.metadata);
        
        // 部门通知：显示在所有部门工作台（如系统公告）
        if (scope === 'department') return true;
        // 业务通知：只显示与目标部门相关的
        if (scope === 'business') return relevantDepts.includes(targetDept);
        // 个人通知：不在部门工作台显示
        return false;
      });
    }

    // 计算统计数据 - 使用过滤后的消息
    const statistics: MessageStatistics = {
      total: filteredMessages.length,
      unread: filteredMessages.filter(m => m.status === 'unread').length,
      read: filteredMessages.filter(m => m.status === 'read').length,
      archived: filteredMessages.filter(m => m.status === 'archived').length,
      byEvent: {} as Record<MessageEvent, number>,
      byPriority: {} as Record<MessagePriority, number>,
    };

    // 分页处理 - 使用过滤后的总数
    const finalTotal = filteredMessages.length;
    const totalPages = Math.max(1, Math.ceil(finalTotal / pageSize));
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedMessages = filteredMessages.slice(start, end);

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
