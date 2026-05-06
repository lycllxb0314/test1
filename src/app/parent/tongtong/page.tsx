'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Plus, 
  MessageCircle, 
  Heart, 
  Sparkles,
  Sun,
  Moon,
  Leaf,
  Rainbow,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import FaceVerifyGate from '@/components/mental-health/FaceVerifyGate';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

type SessionInfo = {
  id: string;
  title: string;
  createdAt: string;
};

const greetingPrompts = [
  { icon: Sun, text: '今天心情怎么样？', color: 'text-amber-500' },
  { icon: Heart, text: '有什么开心的事想分享吗？', color: 'text-rose-500' },
  { icon: Moon, text: '最近睡得好吗？', color: 'text-indigo-400' },
  { icon: Leaf, text: '遇到什么困难了吗？', color: 'text-teal-500' },
];

export default function TongTongPage() {
  const { user } = useAuth();
  const [verified, setVerified] = useState(false);
  const [verifiedStudentId, setVerifiedStudentId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 人脸验证通过后的回调
  const handleVerified = useCallback((studentId: string) => {
    setVerified(true);
    setVerifiedStudentId(studentId);
  }, []);

  // 加载历史会话（验证通过后）
  useEffect(() => {
    if (!verified) return;
    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/mental-health/sessions?studentId=${verifiedStudentId}`, {
          headers: { 'x-user-id': user?.id || '' },
          credentials: 'include',
        });
        const data = await res.json();
        if (data.data) {
          const list = Array.isArray(data.data) ? data.data : [];
          setSessions(list.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            title: (s.title as string) ?? '新对话',
            createdAt: s.createdAt as string,
          })));
        }
      } catch (err) {
        console.error('fetch sessions error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [verified]);

  // 加载会话消息
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/mental-health/sessions?sessionId=${sessionId}&fromStudent=true`, {
        headers: { 'x-user-id': user?.id || '' },
        credentials: 'include',
      });
      const data = await res.json();
      // API 返回格式: { success: true, data: { session, messages } }
      const detail = data.data;
      if (detail?.messages) {
        setMessages(detail.messages.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content as string,
          timestamp: new Date(m.createdAt as string),
        })));
      }
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('load messages error:', err);
    }
  }, []);

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!verifiedStudentId) return;
    if (!confirm('确定要删除这条对话记录吗？')) return;
    
    try {
      const res = await fetch('/api/mental-health/sessions', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '' 
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId, studentId: verifiedStudentId }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setMessages([]);
          setCurrentSessionId(null);
        }
      }
    } catch (err) {
      console.error('delete session error:', err);
    }
  }, [verifiedStudentId, currentSessionId, user?.id]);

  // 发送消息（SSE 流式）
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      abortControllerRef.current = new AbortController();

      const res = await fetch('/api/mental-health/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: currentSessionId,
          studentId: verifiedStudentId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';
      let returnedSessionId: string | null = null;
      let buffer = ''; // SSE 数据可能跨 chunk 分割，需要 buffer

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 最后一个元素可能是不完整的行，保留在 buffer 中
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'session') {
              returnedSessionId = (parsed.data as { sessionId: string })?.sessionId;
            } else if (parsed.type === 'content') {
              fullContent += parsed.data as string;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullContent } : m
              ));
            }
            // sensitivity, warning, done 等类型静默处理，不输出到聊天
          } catch {
            // JSON 解析失败的不完整数据，忽略
          }
        }
      }

      if (returnedSessionId && !currentSessionId) {
        setCurrentSessionId(returnedSessionId);
        setSessions(prev => [{
          id: returnedSessionId,
          title: userMessage.content.slice(0, 20),
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('send message error:', err);
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: '抱歉，童童遇到了一些问题，请稍后再试~' } : m
      ));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  }, [input, isStreaming, currentSessionId, verifiedStudentId]);

  const newChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 未验证 → 显示人脸验证门禁
  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-rose-50/30 dark:from-teal-950/20 dark:via-background dark:to-rose-950/10">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <FaceVerifyGate onVerified={handleVerified} />
        </div>
      </div>
    );
  }

  // 已验证 → 显示聊天界面
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-rose-50/30 dark:from-teal-950/20 dark:via-background dark:to-rose-950/10 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-teal-500 border-t-transparent" />
            <Heart className="absolute inset-0 m-auto h-5 w-5 text-teal-500" />
          </div>
          <p className="text-muted-foreground">正在为你准备温馨空间...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-background to-rose-50/30 dark:from-teal-950/20 dark:via-background dark:to-rose-950/10">
      <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto gap-6 p-4">
        {/* 左侧会话列表 */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          {/* 品牌区域 */}
          <div className="bg-gradient-to-br from-teal-500/10 to-rose-500/5 rounded-2xl p-4 border border-teal-500/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Image
                  src="/tongtong-avatar.png"
                  alt="童童"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-rose-400 rounded-full flex items-center justify-center">
                  <Heart className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">暖心童童</h1>
                <p className="text-xs text-muted-foreground">你的心灵伙伴</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              童童会用心倾听你的每一句话，陪你度过每一个心情起伏的时刻 ✨
            </p>
          </div>

          {/* 新对话按钮 */}
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-11 rounded-xl border-dashed border-2 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all" 
            onClick={newChat}
          >
            <Plus className="h-4 w-4" /> 
            <span>开始新对话</span>
          </Button>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sessions.length > 0 && (
              <div className="text-xs text-muted-foreground px-2 py-1">历史对话</div>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group relative w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                  currentSessionId === s.id 
                    ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/5 border border-teal-500/20' 
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <button
                  onClick={() => loadSessionMessages(s.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${currentSessionId === s.id ? 'bg-teal-500/20' : 'bg-muted'}`}>
                      <MessageCircle className="h-3.5 w-3.5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除对话"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8">
                <Rainbow className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  还没有对话记录<br />开始新对话吧~
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧聊天区域 */}
        <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-card/80 backdrop-blur-sm">
          {/* 头部 */}
          <div className="flex items-center gap-4 px-6 py-4 border-b bg-gradient-to-r from-teal-50/50 to-rose-50/30 dark:from-teal-950/20 dark:to-rose-950/10">
            <div className="relative">
              <Image
                src="/tongtong-avatar.png"
                alt="童童"
                width={44}
                height={44}
                className="rounded-full"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-card" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">暖心童童</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                在线，随时陪你聊天
              </p>
            </div>
            <Badge variant="secondary" className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-300 border-0">
              <Heart className="h-3 w-3 mr-1" /> 温暖陪伴中
            </Badge>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="relative mb-6">
                  <Image
                    src="/tongtong-avatar.png"
                    alt="童童"
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <Sun className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <p className="text-xl font-medium text-foreground mb-2">你好呀！我是童童~</p>
                <p className="text-sm text-muted-foreground mb-6">有什么想聊的，随时告诉我吧</p>
                
                {/* 快捷话题 */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {greetingPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(prompt.text)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-sm text-left transition-colors group"
                    >
                      <prompt.icon className={`h-4 w-4 ${prompt.color}`} />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {prompt.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-1">
                    <Image
                      src="/tongtong-avatar.png"
                      alt="童童"
                      width={32}
                      height={32}
                      className="rounded-full object-cover w-8 h-8"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20'
                      : 'bg-muted/80 backdrop-blur-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content || (
                    <span className="flex items-center gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: '100ms' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '200ms' }}>●</span>
                    </span>
                  )}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                    <Heart className="h-4 w-4 text-rose-500" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t px-6 py-4 bg-gradient-to-r from-teal-50/30 to-rose-50/20 dark:from-teal-950/10 dark:to-rose-950/5">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  placeholder="和童童说点什么..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={isStreaming}
                  className="w-full pr-12 h-12 rounded-xl border-2 focus:border-teal-500 transition-colors"
                />
                <Button 
                  size="icon"
                  onClick={sendMessage} 
                  disabled={isStreaming || !input.trim()}
                  className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 text-center">
              💝 童童是你的心灵伙伴，对话内容会脱敏后由专业老师关注
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
