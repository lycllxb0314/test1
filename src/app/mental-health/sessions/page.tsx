'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ChatSession, MentalChatMessage } from '@/types/mental-health';

type SessionWithInfo = ChatSession & {
  studentName?: string;
  className?: string;
};

export default function SessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<SessionWithInfo | null>(null);
  const [sessionMessages, setSessionMessages] = useState<MentalChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    fetchSessions();
  }, [page, emotionFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const res = await fetch(`/api/mental-health/sessions?${params}`);
      const data = await res.json();
      if (data.success) {
        let list = data.data || [];
        // 前端过滤情绪等级
        if (emotionFilter !== 'all') {
          list = list.filter((s: SessionWithInfo) => s.emotionLevel === emotionFilter);
        }
        // 前端搜索
        if (searchKeyword) {
          const kw = searchKeyword.toLowerCase();
          list = list.filter(
            (s: SessionWithInfo) =>
              s.studentName?.toLowerCase().includes(kw) ||
              s.className?.toLowerCase().includes(kw) ||
              s.title?.toLowerCase().includes(kw)
          );
        }
        setSessions(list);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('获取会话列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchSessions();
  };

  const viewSessionDetail = async (session: SessionWithInfo) => {
    setSelectedSession(session);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/mental-health/sessions?sessionId=${session.id}`);
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

  const getEmotionBadge = (level: string) => {
    const config = {
      green: { label: '状态良好', className: 'bg-green-100 text-green-700 border-green-200' },
      yellow: { label: '需要关注', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      red: { label: '重点关怀', className: 'bg-red-100 text-red-700 border-red-200' },
    };
    const c = config[level as keyof typeof config] || config.green;
    return <Badge className={cn('font-normal', c.className)}>{c.label}</Badge>;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">会话记录</h1>
          <p className="text-muted-foreground mt-1">查看学生与暖心童童的对话记录</p>
        </div>
        <div className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{total}</span> 条会话记录
        </div>
      </div>

      {/* 搜索过滤 */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索学生姓名、班级..."
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
        <Select value={emotionFilter} onValueChange={setEmotionFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="情绪状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="green">状态良好</SelectItem>
            <SelectItem value="yellow">需要关注</SelectItem>
            <SelectItem value="red">重点关怀</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 会话列表 */}
      <div className="bg-card rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            加载中...
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p>暂无会话记录</p>
          </div>
        ) : (
          <div className="divide-y">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => viewSessionDetail(session)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {session.studentName}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {session.className}
                      </span>
                      {getEmotionBadge(session.emotionLevel)}
                      {session.isClosed && (
                        <Badge variant="outline" className="font-normal">
                          已结束
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {session.title || '新的对话'}
                    </p>
                    {session.emotionSummary && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        情绪摘要：{session.emotionSummary}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(session.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {session.turnCount} 轮对话
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
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              会话详情
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* 会话信息 */}
              <div className="pb-4 border-b space-y-2">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{selectedSession.studentName}</span>
                  <span className="text-muted-foreground">{selectedSession.className}</span>
                  {getEmotionBadge(selectedSession.emotionLevel)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedSession.title || '新的对话'} · {selectedSession.turnCount} 轮对话 · {formatDate(selectedSession.createdAt)}
                </p>
                {selectedSession.emotionSummary && (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{selectedSession.emotionSummary}</p>
                  </div>
                )}
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
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
                          'max-w-[80%] rounded-lg px-4 py-2',
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
