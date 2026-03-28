/**
 * 备课智能体对话页面
 * 
 * AI教学设计伙伴，深度探讨文本解读、教学设计等
 * 支持多对话管理
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Send,
  User,
  Trash2,
  FileText,
  Target,
  MessageCircle,
  Mic,
  Loader2,
  Plus,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationListItem, ConversationDetail, ConversationMessage } from '@/types/conversation.types';

// ==================== 类型定义 ====================

type LocalMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// ==================== 快捷入口 ====================

const QUICK_STARTS = [
  { icon: FileText, text: '我在备《父爱之舟》，想和你讨论一下文本解读', color: 'text-red-500' },
  { icon: Target, text: '这节课的重难点我有点拿不准，能帮我分析一下吗', color: 'text-green-500' },
  { icon: MessageCircle, text: '我想设计几个能引发深度思考的问题', color: 'text-orange-500' },
  { icon: Mic, text: '课堂评价语言总是说得太干瘪，有什么建议吗', color: 'text-purple-500' },
];

// ==================== 主组件 ====================

export default function ChatPage() {
  // 对话状态
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  // 滚动容器
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 加载对话列表
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('加载对话列表失败:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, []);
  
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  
  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);
  
  // 创建新对话
  const createNewConversation = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentConversation(data.data);
        setMessages([]);
        setConversations(prev => [data.data, ...prev]);
      }
    } catch (error) {
      console.error('创建对话失败:', error);
    }
  };
  
  // 切换对话
  const switchConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.success) {
        setCurrentConversation(data.data);
        setMessages(data.data.messages.map((m: ConversationMessage) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt),
        })));
      }
    } catch (error) {
      console.error('加载对话失败:', error);
    }
  };
  
  // 删除对话
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个对话吗？')) return;
    
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('删除对话失败:', error);
    }
  };
  
  // 开始编辑标题
  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(title);
  };
  
  // 保存标题
  const saveTitle = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, title: editingTitle } : c
      ));
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title: editingTitle } : null);
      }
    } catch (error) {
      console.error('更新标题失败:', error);
    }
    setEditingId(null);
  };
  
  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    const userMessage: LocalMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');
    
    // 如果没有当前对话，创建一个新对话
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage: content.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        conversationId = data.data.id;
        setCurrentConversation(data.data);
        setConversations(prev => [data.data, ...prev]);
      }
    } else {
      // 保存用户消息
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: content.trim() }),
      });
    }
    
    const chatHistory = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    chatHistory.push({ role: 'user', content: content.trim() });
    
    try {
      const response = await fetch('/api/lesson-prep/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          subject: 'chinese',
        }),
      });
      
      if (!response.ok) throw new Error('请求失败');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');
      
      const decoder = new TextDecoder();
      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                const assistantMessage: LocalMessage = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingContent('');
                
                // 保存助手消息
                if (conversationId) {
                  await fetch(`/api/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'assistant', content: fullContent }),
                  });
                  
                  // 刷新对话列表
                  loadConversations();
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('对话失败:', error);
      const errorMessage: LocalMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，我这边出了点问题，咱们重新开始聊？',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };
  
  const handleQuickStart = (text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };
  
  // 消息气泡
  const MessageBubble = ({ message }: { message: LocalMessage }) => (
    <div className={cn(
      'flex gap-3',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && (
        <Avatar className="w-8 h-8 flex-shrink-0 overflow-hidden">
          <img 
            src="/xinxin-avatar.png" 
            alt="心心" 
            className="w-full h-full object-contain bg-gradient-to-br from-emerald-50 to-green-100"
          />
        </Avatar>
      )}
      
      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-3',
        message.role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
        <p className={cn(
          'text-xs mt-2',
          message.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
        )}>
          {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
  
  // 流式输出
  const StreamingBubble = () => {
    if (!streamingContent) return null;
    
    return (
      <div className="flex gap-3 justify-start">
        <Avatar className="w-8 h-8 flex-shrink-0 overflow-hidden">
          <img 
            src="/xinxin-avatar.png" 
            alt="心心" 
            className="w-full h-full object-contain bg-gradient-to-br from-emerald-50 to-green-100"
          />
        </Avatar>
        <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-muted">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {streamingContent}
            <span className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <div className={cn(
        'flex flex-col border-r bg-muted/30 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      )}>
        {/* 侧边栏头部 */}
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-medium text-sm">历史对话</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={createNewConversation}
            title="新建对话"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无历史对话
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={cn(
                  'group p-3 rounded-lg cursor-pointer transition-colors',
                  currentConversation?.id === conv.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted'
                )}
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => saveTitle(conv.id)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.messageCount} 条消息 · {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={(e) => startEditing(conv.id, conv.title, e)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </Button>
            <Link href="/teacher/lesson-prep/chinese">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center overflow-hidden shadow-sm">
              <img 
                src="/xinxin-avatar.png" 
                alt="心心" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {currentConversation?.title || '心心'}
              </h1>
              <p className="text-xs text-muted-foreground">备课智能体 · 童心教育</p>
            </div>
          </div>
        </div>
        
        {/* 对话区域 */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-start pt-8 pb-4">
                <img 
                  src="/xinxin-avatar.png" 
                  alt="心心" 
                  className="w-40 h-40 object-contain mb-4"
                />
                <h2 className="text-2xl font-bold text-center mb-2">你好，我是心心</h2>
                <p className="text-muted-foreground text-center max-w-md mb-2">
                  一位来自"童心教育"的AI教学伙伴，很高兴能和你一起探讨教学。
                </p>
                <p className="text-sm text-emerald-600 text-center max-w-md mb-6">
                  💚 童心未泯，教育初心
                </p>
                
                <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                  {QUICK_STARTS.map((item, idx) => (
                    <Card
                      key={idx}
                      className="p-4 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
                      onClick={() => handleQuickStart(item.text)}
                    >
                      <div className="flex items-start gap-3">
                        <item.icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', item.color)} />
                        <span className="text-sm">{item.text}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {streamingContent && <StreamingBubble />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* 输入区域 */}
          <div className="border-t p-4 flex-shrink-0 bg-background">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="说点什么..."
                  className="min-h-[80px] max-h-[160px] resize-none pr-12"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  className="absolute right-2 bottom-3 h-8 w-8"
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
