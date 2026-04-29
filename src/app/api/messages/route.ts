/**
 * 消息 API
 *
 * GET: 获取当前用户的消息列表
 * POST: 发送新消息
 */

import { withRoute } from '@/lib/api';
import { messageService } from '@/services/message.service';
import { messageRepository } from '@/repositories/message.repository';
import { ApiError } from '@/lib/api-error';
import type {
  UserMessage,
  SendMessageRequest,
  MessageStatistics,
  MessageEvent,
  MessagePriority,
  MessageStatus,
} from '@/types/messages';
import type { User } from '@/types';

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
    group_notice_principal: 'system_announcement',
    group_notice: 'group_notice',
    group_notice_academic: 'group_notice',
    group_notice_moral: 'group_notice',
    group_notice_general: 'group_notice',
  };
  return typeMap[dbType] || 'personal_message';
}

// 消息分类
type MessageScope = 'department' | 'business' | 'personal';

function getMessageScope(event: MessageEvent, metadata?: Record<string, unknown>): MessageScope {
  const departmentEvents: MessageEvent[] = ['system_announcement', 'policy_update', 'maintenance_notice'];
  const businessEvents: MessageEvent[] = [
    'schedule_change', 'exam_notice', 'grade_publish', 'homework_assign',
    'activity_notice', 'honor_notice', 'moral_evaluation', 'habit_record',
    'repair_notice', 'asset_notice', 'safety_alert', 'leave_approval',
  ];

  if (departmentEvents.includes(event)) return 'department';
  if (businessEvents.includes(event)) return 'business';
  if (event === 'group_notice' && metadata?.target_department) return 'business';
  return 'personal';
}

function getRelevantDepartments(event: MessageEvent, metadata?: Record<string, unknown>): string[] {
  const academicEvents: MessageEvent[] = ['schedule_change', 'exam_notice', 'grade_publish', 'homework_assign'];
  const moralEvents: MessageEvent[] = ['activity_notice', 'honor_notice', 'moral_evaluation', 'habit_record',
    'honor_campaign', 'honor_approval', 'honor_approved', 'honor_rejected', 'routine_score', 'duty_reminder'];
  const generalEvents: MessageEvent[] = ['repair_notice', 'asset_notice', 'safety_alert'];

  if (academicEvents.includes(event)) return ['academic'];
  if (moralEvents.includes(event)) return ['moral'];
  if (generalEvents.includes(event)) return ['general'];

  if (event === 'group_notice' && metadata?.target_department) {
    return [metadata.target_department as string];
  }

  if (event === 'leave_approval' && metadata?.business_type) {
    return ['academic'];
  }

  return [];
}

/**
 * GET: 获取消息列表
 */
export const GET = withRoute(
  async (req, _ctx, user) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const eventFilter = searchParams.get('event') || undefined;
    const statusFilter = searchParams.get('status') || undefined;
    const department = searchParams.get('department') || undefined;

    // 如果用户未登录，返回空列表
    if (!user) {
      return {
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        statistics: { total: 0, unread: 0, read: 0, archived: 0, byEvent: {}, byPriority: {} },
      };
    }

    const userRole = user.role;

    // 使用 MessageService 查询消息
    const result = await messageService.queryUserMessages({
      userId: user.id,
      event: eventFilter as MessageEvent | undefined,
      status: statusFilter as MessageStatus | undefined,
      page,
      pageSize,
      unreadOnly: searchParams.get('unreadOnly') === 'true',
    });

    if (!result.success) {
      throw ApiError.Internal(result.error || '获取消息失败');
    }

    // 获取用户阅读状态
    const readStatuses = await messageRepository.findUnread(user.id);

    // 格式化消息
    let messages: (UserMessage & { _deletedAt?: string; _isArchived?: boolean; _roles?: string[] })[] =
      (result.data || []).map(msg => ({
        ...msg,
        _isArchived: msg.status === 'archived',
        _roles: msg.roles || (msg.metadata?.roles as string[]) || [],
      }));

    // 过滤已删除
    let activeMessages = messages.filter(msg => !msg._deletedAt);

    // 过滤角色消息
    activeMessages = activeMessages.filter(m => {
      if (m._roles && m._roles.length > 0 && !m._roles.includes(userRole)) {
        return false;
      }
      return true;
    });

    // 默认不显示已归档
    let displayMessages = activeMessages;
    if (statusFilter !== 'archived') {
      displayMessages = displayMessages.filter(m => !m._isArchived);
    }

    let filteredMessages = displayMessages;

    // 工作台分类过滤
    const isLeadershipWorkbench = department && (
      department.startsWith('vice-principal') ||
      department === 'principal' ||
      department === 'secretary'
    );

    if (!department) {
      // 教师个人工作台：只显示个人消息
      filteredMessages = filteredMessages.filter(m => {
        if (m.recipientType === 'department' || m.recipients?.type === 'department') return false;
        if (m.recipientType === 'administrative') return false;
        if (m.event === 'leave_approval' && m.title?.includes('审批待办')) return false;
        return true;
      });
    } else if (isLeadershipWorkbench) {
      // 领导个人工作台
      const leadershipRoleMapping: Record<string, string> = {
        'vice-principal-moral': 'moral_vice_principal',
        'vice-principal-academic': 'academic_vice_principal',
        'vice-principal-general': 'general_vice_principal',
        'principal': 'principal',
        'secretary': 'secretary',
      };
      const leadershipRole = leadershipRoleMapping[department];

      filteredMessages = filteredMessages.filter(m => {
        if (m.recipientType === 'department' || m.recipients?.type === 'department') return false;
        if (m.recipientType === 'individual' || !m.recipientType) {
          const targetRoles = m._roles || (m.metadata?.roles as string[]) || [];
          if (targetRoles.length > 0 && leadershipRole) return targetRoles.includes(leadershipRole);
          return true;
        }
        if (m.recipientType === 'administrative') {
          const targetRoles = m._roles || (m.metadata?.roles as string[]) || [];
          if (targetRoles.length > 0 && leadershipRole) return targetRoles.includes(leadershipRole);
          return false;
        }
        return false;
      });
    } else {
      // 部门工作台过滤
      const deptMapping: Record<string, string> = { academic: 'academic', moral: 'moral', general: 'general' };
      const targetDept = deptMapping[department] || department;

      filteredMessages = filteredMessages.filter(m => {
        const isDeptBroadcast = m.recipientType === 'department' || m.recipients?.type === 'department';
        if (isDeptBroadcast) {
          return (m.metadata?.target_department as string) === targetDept;
        }

        if (m.recipientType === 'administrative' ||
            (m.event === 'leave_approval' && m.title?.includes('审批待办'))) {
          const msgTargetDept = m.metadata?.target_department as string;
          if (msgTargetDept && msgTargetDept === targetDept) return true;
          return getRelevantDepartments(m.event, m.metadata).includes(targetDept);
        }

        const scope = getMessageScope(m.event, m.metadata);
        const relevantDepts = getRelevantDepartments(m.event, m.metadata);
        if (scope === 'department') return true;
        if (scope === 'business') return relevantDepts.includes(targetDept);
        return false;
      });
    }

    // 统计
    const statistics: MessageStatistics = {
      total: filteredMessages.length,
      unread: filteredMessages.filter(m => m.status === 'unread').length,
      read: filteredMessages.filter(m => m.status === 'read').length,
      archived: filteredMessages.filter(m => m.status === 'archived').length,
      byEvent: {} as Record<MessageEvent, number>,
      byPriority: {} as Record<MessagePriority, number>,
    };

    // 分页
    const finalTotal = filteredMessages.length;
    const totalPages = Math.max(1, Math.ceil(finalTotal / pageSize));
    const start = (page - 1) * pageSize;
    const paginatedMessages = filteredMessages.slice(start, start + pageSize);

    return {
      data: paginatedMessages,
      pagination: { page, pageSize, total: finalTotal, totalPages },
      statistics,
    };
  },
  { requireAuth: false } // optional auth - returns empty for unauthenticated
);

/**
 * POST: 发送消息
 */
export const POST = withRoute(
  async (req, _ctx, user) => {
    if (!user) throw ApiError.Unauthorized();

    const body: SendMessageRequest = await req.json();
    const { title, content, event, priority = 'normal', recipients, metadata, scheduledAt } = body;

    if (!title || !content || !event || !recipients) {
      throw ApiError.BadRequest('缺少必填字段');
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
      throw ApiError.Internal(result.error || '发送消息失败');
    }

    return result.data;
  },
  { requireAuth: true }
);
