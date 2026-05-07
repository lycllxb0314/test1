'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { HomeSchoolConversation, HomeSchoolMessage } from '@/types/home-school';

type ConversationWithInfo = HomeSchoolConversation;

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithInfo | null>(null);
  const [sessionMessages, setSessionMessages] = useState<HomeSchoolMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/home-school/conversations?all=true', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error('获取会话列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
  };

  const viewConversationDetail = async (conversation: ConversationWithInfo) => {
    setSelectedConversation(conversation);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/home-school/conversations?conversationId=${conversation.id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setSessionMessages(data.data?.messages || []);
      }
    } catch (err) {
      console.error('获取会话详情失败:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 前端过滤搜索
  const filteredConversations = conversations.filter((c) => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      c.teacherName?.toLowerCase().includes(kw) ||
      c.className?.toLowerCase().includes(kw) ||
      c.studentName?.toLowerCase().includes(kw) ||
      c.title?.toLowerCase().includes(kw)
    );
  });

  // 分页
  const totalPages = Math.ceil(filteredConversations.length / pageSize);
  const pagedConversations = filteredConversations.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">会话记录</h1>
          <p className="text-muted-foreground mt-1">查看教师与心心的对话记录</p>
        </div>
        <div className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{filteredConversations.length}</span> 条会话记录
        </div>
      </div>

      {/* 搜索过滤 */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索教师姓名、班级、学生..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            搜索
          </Button>
        </div>
      </div>

      {/* 会话列表 */}
      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            加载中...
          </div>
        ) : pagedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p>暂无会话记录</p>
          </div>
        ) : (
          <div className="divide-y">
            {pagedConversations.map((conv) => (
              <div
                key={conv.id}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => viewConversationDetail(conv)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {conv.teacherName}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {conv.className}
                      </span>
                      {conv.studentName && (
                        <Badge variant="outline" className="font-normal">
                          学生: {conv.studentName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {conv.title || '新的对话'}
                    </p>
                    {conv.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        摘要：{conv.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(conv.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {conv.turnCount || 0} 轮对话
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      查看详情
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              第 {page} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 会话详情弹窗 */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              会话详情
            </DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* 会话信息 */}
              <div className="pb-4 border-b space-y-2">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{selectedConversation.teacherName}</span>
                  <span className="text-muted-foreground">{selectedConversation.className}</span>
                  {selectedConversation.studentName && (
                    <Badge variant="outline">学生: {selectedConversation.studentName}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.title || '新的对话'} · {selectedConversation.turnCount || 0} 轮对话 · {formatDate(selectedConversation.createdAt)}
                </p>
                {selectedConversation.summary && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedConversation.summary}</p>
                  </div>
                )}
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    加载消息中...
                  </div>
                ) : sessionMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    暂无消息
                  </div>
                ) : (
                  sessionMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-4 py-2 break-words overflow-hidden',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p className="text-xs opacity-60 mt-1">
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
