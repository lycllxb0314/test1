/**
 * 备课智能体对话页面
 * 
 * AI教学设计伙伴，深度探讨文本解读、教学设计等
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

type Message = {
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // 滚动容器
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);
  
  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingContent('');
    
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
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingContent('');
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('对话失败:', error);
      const errorMessage: Message = {
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
  
  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };
  
  // 消息气泡
  const MessageBubble = ({ message }: { message: Message }) => (
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
    <div className="p-4 space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
            <h1 className="text-lg font-bold">心心</h1>
            <p className="text-xs text-muted-foreground">备课智能体 · 童心教育</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat} title="清空对话">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* 对话区域 */}
      <Card className="flex flex-col overflow-hidden border shadow-lg" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full">
              <img 
                src="/xinxin-avatar.png" 
                alt="心心" 
                className="w-32 h-32 object-contain mb-6"
              />
              <h2 className="text-2xl font-bold text-center mb-2">你好，我是心心</h2>
              <p className="text-muted-foreground text-center max-w-md mb-2">
                一位来自"童心教育"的AI教学伙伴，很高兴能和你一起探讨教学。
              </p>
              <p className="text-sm text-emerald-600 text-center max-w-md mb-8">
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
      </Card>
    </div>
  );
}
