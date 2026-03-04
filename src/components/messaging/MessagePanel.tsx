'use client';

/**
 * 消息面板组件
 * 
 * 展示消息列表、消息详情、消息发送等功能
 * 支持筛选、分页、状态更新等操作
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  CheckCheck,
  Archive,
  Pin,
  Trash2,
  Mail,
  MailOpen,
  Send,
  Users,
  User,
  Clock,
  AlertCircle,
  Star,
  Megaphone,
  Calendar,
  FileText,
  BookOpen,
  Heart,
  Package,
  Wrench,
  Award,
  BarChart,
  ListTodo,
  Sparkles,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { 
  UserMessage, 
  MessageEvent, 
  MessagePriority, 
  MessageStatus,
  SendMessageRequest,
} from '@/types/messages';
import { MESSAGE_EVENT_CONFIGS } from '@/types/messages';

// ==================== 类型定义 ====================

interface MessagePanelProps {
  /** 消息列表 */
  messages: UserMessage[];
  /** 加载状态 */
  loading: boolean;
  /** 未读数量 */
  unreadCount: number;
  /** 统计数据 */
  statistics?: {
    total: number;
    unread: number;
  };
  /** 分页信息 */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  /** 事件处理 */
  onRefresh?: () => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onPageChange?: (page: number) => void;
  /** 发送消息 */
  onSendMessage?: (request: SendMessageRequest) => Promise<boolean>;
  /** 是否显示发送按钮 */
  showSendButton?: boolean;
  /** 可选的接收者列表（用于发送消息） */
  recipients?: {
    roles?: Array<{ id: string; name: string }>;
    classes?: Array<{ id: string; name: string }>;
    users?: Array<{ id: string; name: string; role?: string }>;
  };
  /** 样式变体 */
  variant?: 'default' | 'compact' | 'sidebar';
}

// 图标映射
const EVENT_ICONS: Record<MessageEvent, React.ElementType> = {
  system_announcement: Megaphone,
  maintenance_notice: Wrench,
  policy_update: FileText,
  schedule_change: Calendar,
  exam_notice: FileText,
  grade_publish: BarChart,
  homework_assign: BookOpen,
  activity_notice: Calendar,
  honor_notice: Award,
  moral_evaluation: Heart,
  parent_meeting: Users,
  student_absence: AlertCircle,
  habit_record: Star,
  leave_approval: Clock,
  repair_notice: Wrench,
  asset_notice: Package,
  safety_alert: AlertCircle,
  personal_message: Mail,
  task_assign: ListTodo,
  task_reminder: Bell,
};

// 优先级颜色
const PRIORITY_COLORS: Record<MessagePriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

// 状态图标
const STATUS_ICONS: Record<MessageStatus, React.ElementType> = {
  unread: Mail,
  read: MailOpen,
  archived: Archive,
};

// ==================== 组件实现 ====================

export function MessagePanel({
  messages,
  loading,
  unreadCount,
  statistics,
  pagination,
  onRefresh,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onMarkAllAsRead,
  onPageChange,
  onSendMessage,
  showSendButton = false,
  recipients,
  variant = 'default',
}: MessagePanelProps) {
  // 状态
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<UserMessage | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  
  // 发送消息表单
  const [sendForm, setSendForm] = useState({
    title: '',
    content: '',
    event: 'personal_message' as MessageEvent,
    priority: 'normal' as MessagePriority,
    recipientType: 'individual' as 'all' | 'role' | 'class' | 'individual',
    selectedRoles: [] as string[],
    selectedClasses: [] as string[],
    selectedUsers: [] as string[],
  });
  const [sending, setSending] = useState(false);

  // 筛选消息
  const filteredMessages = useMemo(() => {
    let result = messages;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(search) ||
        m.content.toLowerCase().includes(search)
      );
    }

    if (eventFilter !== 'all') {
      result = result.filter(m => m.event === eventFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    // 置顶优先
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [messages, searchTerm, eventFilter, statusFilter]);

  // 格式化时间
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  };

  // 查看消息详情
  const handleViewMessage = (message: UserMessage) => {
    setSelectedMessage(message);
    setDetailDialogOpen(true);
    if (message.status === 'unread' && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!onSendMessage) return;
    if (!sendForm.title.trim() || !sendForm.content.trim()) return;

    setSending(true);
    try {
      let recipients: SendMessageRequest['recipients'] = { type: 'individual', userIds: [] };

      switch (sendForm.recipientType) {
        case 'all':
          recipients = { type: 'all' };
          break;
        case 'role':
          recipients = { type: 'role', roles: sendForm.selectedRoles };
          break;
        case 'class':
          recipients = { type: 'class', classIds: sendForm.selectedClasses };
          break;
        case 'individual':
          recipients = { type: 'individual', userIds: sendForm.selectedUsers };
          break;
      }

      const success = await onSendMessage({
        title: sendForm.title,
        content: sendForm.content,
        event: sendForm.event,
        priority: sendForm.priority,
        recipients,
      });

      if (success) {
        setSendDialogOpen(false);
        setSendForm({
          title: '',
          content: '',
          event: 'personal_message',
          priority: 'normal',
          recipientType: 'individual',
          selectedRoles: [],
          selectedClasses: [],
          selectedUsers: [],
        });
      }
    } finally {
      setSending(false);
    }
  };

  // 紧凑模式
  if (variant === 'compact') {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              消息通知
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {unreadCount > 0 && onMarkAllAsRead && (
                <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                  全部已读
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>暂无消息</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.slice(0, 5).map((message) => {
                  const EventIcon = EVENT_ICONS[message.event] || Bell;
                  const eventConfig = MESSAGE_EVENT_CONFIGS[message.event];
                  
                  return (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        message.status === 'unread'
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded ${eventConfig?.color || 'bg-gray-100'}`}>
                          <EventIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${message.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {message.title}
                            </span>
                            {message.isPinned && <Pin className="h-3 w-3 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                        {message.status === 'unread' && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // 默认模式
  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                消息中心
              </CardTitle>
              <CardDescription>
                共 {statistics?.total || messages.length} 条消息，{unreadCount} 条未读
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {showSendButton && (
                <Button size="sm" onClick={() => setSendDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-1" />
                  发送消息
                </Button>
              )}
              {unreadCount > 0 && onMarkAllAsRead && (
                <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  全部已读
                </Button>
              )}
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索消息..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="事件类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="system_announcement">系统公告</SelectItem>
                <SelectItem value="schedule_change">调课通知</SelectItem>
                <SelectItem value="exam_notice">考试通知</SelectItem>
                <SelectItem value="activity_notice">活动通知</SelectItem>
                <SelectItem value="parent_meeting">家长会通知</SelectItem>
                <SelectItem value="personal_message">个人消息</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="unread">未读</SelectItem>
                <SelectItem value="read">已读</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 消息列表 */}
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>暂无消息</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((message) => {
                  const EventIcon = EVENT_ICONS[message.event] || Bell;
                  const eventConfig = MESSAGE_EVENT_CONFIGS[message.event];
                  
                  return (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                        message.status === 'unread'
                          ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                          : 'hover:bg-muted/50 border-transparent'
                      }`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex items-start gap-4">
                        {/* 事件图标 */}
                        <div className={`p-2 rounded-lg ${eventConfig?.color || 'bg-gray-100 text-gray-600'}`}>
                          <EventIcon className="h-5 w-5" />
                        </div>

                        {/* 消息内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${message.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {message.title}
                            </span>
                            {message.isPinned && (
                              <Pin className="h-3 w-3 text-primary" />
                            )}
                            <Badge className={PRIORITY_COLORS[message.priority]} variant="secondary">
                              {message.priority === 'urgent' ? '紧急' : message.priority === 'high' ? '重要' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {message.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(message.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {message.senderName}
                            </span>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1">
                          {message.status === 'unread' && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {message.status === 'unread' && onMarkAsRead && (
                                <DropdownMenuItem onClick={() => onMarkAsRead(message.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  标记已读
                                </DropdownMenuItem>
                              )}
                              {message.status === 'read' && onMarkAsUnread && (
                                <DropdownMenuItem onClick={() => onMarkAsUnread(message.id)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  标记未读
                                </DropdownMenuItem>
                              )}
                              {onArchive && (
                                <DropdownMenuItem onClick={() => onArchive(message.id)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  归档
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => onDelete(message.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => onPageChange?.(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onPageChange?.(pagination.page + 1)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 消息详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.title}</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedMessage.senderName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(selectedMessage.createdAt)}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="whitespace-pre-wrap">{selectedMessage?.content}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 发送消息对话框 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              发送消息
            </DialogTitle>
            <DialogDescription>
              选择接收者并发送消息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>接收对象</Label>
              <Select 
                value={sendForm.recipientType} 
                onValueChange={(v) => setSendForm(prev => ({ ...prev, recipientType: v as typeof sendForm.recipientType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全员通知</SelectItem>
                  <SelectItem value="role">按角色</SelectItem>
                  <SelectItem value="class">按班级</SelectItem>
                  <SelectItem value="individual">指定人员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>消息类型</Label>
                <Select 
                  value={sendForm.event} 
                  onValueChange={(v) => setSendForm(prev => ({ ...prev, event: v as MessageEvent }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_message">个人消息</SelectItem>
                    <SelectItem value="system_announcement">系统公告</SelectItem>
                    <SelectItem value="activity_notice">活动通知</SelectItem>
                    <SelectItem value="task_assign">任务分配</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>优先级</Label>
                <Select 
                  value={sendForm.priority} 
                  onValueChange={(v) => setSendForm(prev => ({ ...prev, priority: v as MessagePriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>消息标题</Label>
              <Input
                value={sendForm.title}
                onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入消息标题"
              />
            </div>

            <div className="space-y-2">
              <Label>消息内容</Label>
              <Textarea
                value={sendForm.content}
                onChange={(e) => setSendForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入消息内容"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSendMessage} disabled={sending}>
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  发送
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MessagePanel;
