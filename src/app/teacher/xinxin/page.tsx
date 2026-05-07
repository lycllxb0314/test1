'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, Send, Trash2, Plus, Sparkles, Users, Phone, 
  AlertCircle, Heart, ChevronRight, Bot, Loader2, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// 消息类型
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isWarningConfirm?: boolean;
  warningRiskLevel?: string;
  warningTriggerType?: string;
  warningSummary?: string;
  warningRecommendation?: string;
};

// 会话类型
type Conversation = {
  id: string;
  title: string;
  studentName?: string;
  contextType?: string;
  emotionLevel?: string;
  createdAt: string;
  updatedAt: string;
};

// 快捷话题
const QUICK_TOPICS = [
  { icon: Users, text: '学生成绩沟通', prompt: '我想和家长沟通学生最近的学习成绩情况' },
  { icon: AlertCircle, text: '行为问题反馈', prompt: '学生最近有一些行为问题需要和家长沟通' },
  { icon: Heart, text: '表扬与鼓励', prompt: '学生最近表现很好，想和家长分享正面反馈' },
  { icon: Phone, text: '电话沟通技巧', prompt: '如何和家长进行有效的电话沟通？' },
];

// 情绪标签颜色
const EMOTION_COLORS: Record<string, string> = {
  positive: 'bg-green-100 text-green-700 border-green-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  concerned: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export default function XinxinPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/home-school/conversations', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('加载会话列表失败:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载会话消息
  const loadConversationMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/home-school/conversations?conversationId=${convId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(data.data.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.createdAt,
        })));
      }
    } catch (err) {
      console.error('加载消息失败:', err);
    }
  };

  // 选择会话
  const handleSelectConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
    setSessionId(conv.id);
    loadConversationMessages(conv.id);
  };

  // 新建会话
  const handleNewConversation = () => {
    setCurrentConversation(null);
    setSessionId(null);
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  // 发送消息
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setIsLoading(true);

    try {
      const res = await fetch('/api/home-school/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText.trim(),
          conversationId: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error('请求失败');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let assistantMessage = '';
      let newSessionId = sessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              
              if (parsed.type === 'session') {
                newSessionId = (parsed.data as { sessionId: string })?.sessionId || null;
                setSessionId(newSessionId);
              } else if (parsed.type === 'content') {
                const text = typeof parsed.data === 'string' ? parsed.data : '';
                assistantMessage += text;
                
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant' && last.id.startsWith('stream-')) {
                    return [...prev.slice(0, -1), { ...last, content: assistantMessage }];
                  }
                  return [...prev, {
                    id: `stream-${Date.now()}`,
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date().toISOString(),
                  }];
                });
              } else if (parsed.type === 'warning_alert') {
                // 第三层：阳光确认——告知教师已脱敏上报
                const warningData = parsed.data as { riskLevel: string; triggerType: string; triggerSummary: string; recommendation: string };
                setMessages(prev => [...prev, {
                  id: `warning-${Date.now()}`,
                  role: 'assistant' as const,
                  content: '',
                  timestamp: new Date().toISOString(),
                  isWarningConfirm: true,
                  warningRiskLevel: warningData.riskLevel,
                  warningTriggerType: warningData.triggerType,
                  warningSummary: warningData.triggerSummary,
                  warningRecommendation: warningData.recommendation,
                }]);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 刷新会话列表
      loadConversations();
    } catch (err) {
      console.error('发送消息失败:', err);
      toast.error('发送失败，请稍后重试');
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  // 删除会话
  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      const res = await fetch(`/api/home-school/conversations?conversationId=${convId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (currentConversation?.id === convId) {
          handleNewConversation();
        }
        toast.success('删除成功');
      }
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    }
  };

  // 按回车发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // 快捷话题点击
  const handleQuickTopic = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] px-6 py-4 gap-4">
      {/* 左侧会话列表 */}
      <div className="w-72 flex-shrink-0 bg-card rounded-xl border border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Button onClick={handleNewConversation} className="w-full" variant="default">
            <Plus className="h-4 w-4 mr-2" />
            新对话
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentConversation?.id === conv.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {conv.title || '家校沟通'}
                    </p>
                    {conv.studentName && (
                      <p className="text-xs text-muted-foreground truncate">
                        学生：{conv.studentName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无历史对话</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧聊天区域 */}
      <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/xinxin-avatar.png" alt="心心" />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
              <Sparkles className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-lg">心心</h1>
            <p className="text-xs text-muted-foreground">家校沟通助手</p>
          </div>
        </div>

        {/* 消息区域 */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-6">
                <Image 
                  src="/xinxin-avatar.png" 
                  alt="心心" 
                  width={80} 
                  height={80}
                  className="rounded-full"
                />
              </div>
              <h2 className="text-xl font-semibold mb-2">你好呀，我是心心 💖</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                我是你的家校沟通助手，可以帮助你更好地与家长交流、处理学生问题、
                提升家校合作效果。有什么想聊的吗？
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {QUICK_TOPICS.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickTopic(topic.prompt)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                  >
                    <topic.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{topic.text}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.role === 'assistant' ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src="/xinxin-avatar.png" alt="心心" />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.[0] || '师'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.isWarningConfirm && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                          <Shield className="h-4 w-4" />
                          <span className="text-xs font-semibold">护航预警 - 阳光确认</span>
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mb-1">
                          {msg.warningRiskLevel === 'high' ? '🔴 高危' : '🟡 中危'} · {msg.warningTriggerType === 'legal_safety' ? '法律安全红线' : '心理承载红线'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">{msg.warningSummary}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          核心风险已脱敏上报德育处，你的聊天内容不会被转发。德育处是你的娘家人，接下来他们会来接手。
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="/xinxin-avatar.png" alt="心心" />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* 输入区域 */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，我来帮你..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              size="icon"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
