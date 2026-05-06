'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Plus, MessageCircle } from 'lucide-react';
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
        const res = await fetch('/api/mental-health/sessions');
        const data = await res.json();
        if (data.data) {
          setSessions(data.data.map((s: Record<string, unknown>) => ({
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
      const res = await fetch(`/api/mental-health/sessions?id=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m: Record<string, unknown>) => ({
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
        headers: { 'Content-Type': 'application/json' },
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'session') {
                returnedSessionId = parsed.sessionId;
              } else if (parsed.type === 'content') {
                fullContent += parsed.content;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                ));
              }
            } catch {
              fullContent += dataStr;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullContent } : m
              ));
            }
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
      <div className="max-w-2xl mx-auto py-8">
        <FaceVerifyGate onVerified={handleVerified} />
      </div>
    );
  }

  // 已验证 → 显示聊天界面
  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* 左侧会话列表 */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <Button variant="outline" className="w-full justify-start" onClick={newChat}>
          <Plus className="h-4 w-4 mr-2" /> 新对话
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSessionMessages(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted ${
                currentSessionId === s.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{s.title}</span>
              </div>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              还没有对话记录，开始新对话吧
            </p>
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <Image
            src="/tongtong-avatar.png"
            alt="童童"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h2 className="font-semibold">暖心童童</h2>
            <p className="text-xs text-muted-foreground">我是童童，随时可以和我聊天哦~</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Image
                src="/tongtong-avatar.png"
                alt="童童"
                width={80}
                height={80}
                className="rounded-full mb-4"
              />
              <p className="text-lg font-medium mb-1">你好呀！我是童童~</p>
              <p className="text-sm">有什么想聊的，随时告诉我吧</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <Image
                  src="/tongtong-avatar.png"
                  alt="童童"
                  width={32}
                  height={32}
                  className="rounded-full shrink-0 mt-1"
                />
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content || '...'}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="和童童说点什么..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isStreaming}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isStreaming || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            童童是您的心灵伙伴，对话内容会脱敏后由专业老师关注
          </p>
        </div>
      </Card>
    </div>
  );
}
