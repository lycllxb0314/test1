/**
 * 备课智能体对话页面
 * 
 * AI教学设计伙伴，深度探讨文本解读、教学设计等
 * 支持多对话管理、多模态输入
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
  Pencil,
  Check,
  X,
  Image as ImageIcon,
  Paperclip,
  XCircle,
  File,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';
import { cn } from '@/lib/utils';
import type { ConversationListItem, ConversationDetail, ConversationMessage } from '@/types/conversation.types';

// ==================== 类型定义 ====================

type ContentPart = {
  type: 'text' | 'image_url' | 'file';
  text?: string;
  image_url?: { url: string };
  file?: { name: string; content: string; type: string };
};

type LocalMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string | ContentPart[];
  timestamp: Date;
};

type Attachment = {
  id: string;
  type: 'image' | 'file';
  name: string;
  preview?: string;
  content?: string;
  loading?: boolean;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // 滚动容器
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
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
        setAttachments([]);
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
        setAttachments([]);
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
        setAttachments([]);
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
  
  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments(prev => [...prev, {
          id,
          type: 'image',
          name: file.name,
          preview: dataUrl,
          content: dataUrl,
        }]);
      };
      
      reader.readAsDataURL(file);
    }
    
    setUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };
  
  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    for (const file of Array.from(files)) {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // 添加加载状态
      setAttachments(prev => [...prev, {
        id,
        type: 'file',
        name: file.name,
        loading: true,
      }]);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/parse-file', {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        
        if (data.success) {
          setAttachments(prev => prev.map(a => 
            a.id === id ? {
              ...a,
              content: data.content,
              loading: false,
              name: `${file.name} (${data.fileType})`,
            } : a
          ));
        } else {
          setAttachments(prev => prev.map(a => 
            a.id === id ? {
              ...a,
              name: `${file.name} - 解析失败`,
              loading: false,
            } : a
          ));
        }
      } catch (error) {
        console.error('文件上传失败:', error);
        setAttachments(prev => prev.map(a => 
          a.id === id ? {
            ...a,
            name: `${file.name} - 上传失败`,
            loading: false,
          } : a
        ));
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  // 移除附件
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };
  
  // 发送消息
  const sendMessage = async (content: string) => {
    if ((!content.trim() && attachments.length === 0) || isLoading) return;
    
    // 构建消息内容
    let messageContent: string | ContentPart[];
    
    if (attachments.length > 0) {
      const parts: ContentPart[] = [];
      
      // 添加文本
      if (content.trim()) {
        parts.push({ type: 'text', text: content.trim() });
      }
      
      // 添加图片和文件
      for (const att of attachments) {
        if (att.type === 'image' && att.content) {
          parts.push({ type: 'image_url', image_url: { url: att.content } });
        } else if (att.type === 'file' && att.content) {
          parts.push({ 
            type: 'file', 
            file: { 
              name: att.name, 
              content: att.content,
              type: 'parsed'
            } 
          });
        }
      }
      
      messageContent = parts;
    } else {
      messageContent = content.trim();
    }
    
    const userMessage: LocalMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);
    setStreamingContent('');
    
    // 如果没有当前对话，创建一个新对话
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage: typeof messageContent === 'string' ? messageContent : content.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        conversationId = data.data.id;
        setCurrentConversation(data.data);
        setConversations(prev => [data.data, ...prev]);
      }
    }
    
    // 构建历史消息
    const chatHistory = messages.map(m => {
      if (typeof m.content === 'string') {
        return { role: m.role, content: m.content };
      }
      // 对于多模态消息，提取文本描述
      const textParts = m.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      const imageCount = m.content.filter(p => p.type === 'image_url').length;
      const fileCount = m.content.filter(p => p.type === 'file').length;
      let desc = textParts;
      if (imageCount > 0) desc += `\n[包含${imageCount}张图片]`;
      if (fileCount > 0) desc += `\n[包含${fileCount}个文件]`;
      return { role: m.role, content: desc || '[多媒体消息]' };
    });
    
    // 添加当前消息
    if (typeof messageContent === 'string') {
      chatHistory.push({ role: 'user', content: messageContent });
    } else {
      const textParts = messageContent.filter(p => p.type === 'text').map(p => p.text).join('\n');
      const fileContents = messageContent
        .filter(p => p.type === 'file' && p.file)
        .map(p => `【文件内容】\n${p.file!.content}`)
        .join('\n\n');
      const combinedContent = [textParts, fileContents].filter(Boolean).join('\n\n');
      chatHistory.push({ role: 'user', content: combinedContent || '[多媒体消息]' });
    }
    
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
                
                // 保存消息到数据库
                if (conversationId) {
                  // 保存用户消息
                  const userContent = typeof messageContent === 'string' 
                    ? messageContent 
                    : JSON.stringify(messageContent);
                  await fetch(`/api/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'user', content: userContent }),
                  });
                  
                  // 保存助手消息
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
  
  // 获取文件图标
  const getFileIcon = (name: string) => {
    if (name.includes('PDF')) return FileText;
    if (name.includes('Excel') || name.includes('.xlsx')) return FileSpreadsheet;
    if (name.includes('Word') || name.includes('.doc')) return FileText;
    return File;
  };
  
  // 渲染消息内容
  const renderMessageContent = (message: LocalMessage) => {
    if (typeof message.content === 'string') {
      return <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>;
    }
    
    // 多模态消息
    return (
      <div className="space-y-2">
        {message.content.map((part, idx) => {
          if (part.type === 'text') {
            return <p key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">{part.text}</p>;
          }
          if (part.type === 'image_url' && part.image_url) {
            return (
              <img 
                key={idx} 
                src={part.image_url.url} 
                alt="上传的图片" 
                className="max-w-full rounded-lg max-h-60 object-contain"
              />
            );
          }
          if (part.type === 'file' && part.file) {
            const Icon = getFileIcon(part.file.name);
            return (
              <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate">{part.file.name}</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
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
        {renderMessageContent(message)}
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
            {/* 附件预览 */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map(att => (
                  <div key={att.id} className="relative group">
                    {att.type === 'image' ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border bg-muted">
                        <img src={att.preview} alt={att.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted">
                        {att.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm max-w-[120px] truncate">{att.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3 items-end">
              {/* 上传按钮 */}
              <div className="flex gap-1 flex-shrink-0">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={FILE_TYPE_CONFIGS.image.accept}
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || uploading}
                  title="上传图片"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_TYPE_CONFIGS.document.accept}
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || uploading}
                  title="上传文件（PDF/Word/Excel/TXT）"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={attachments.length > 0 ? "添加文字说明（可选）..." : "说点什么..."}
                  className="min-h-[80px] max-h-[160px] resize-none pr-12"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  className="absolute right-2 bottom-3 h-8 w-8"
                  onClick={() => sendMessage(inputValue)}
                  disabled={isLoading || uploading || (!inputValue.trim() && attachments.length === 0)}
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
              支持上传图片、PDF、Word、Excel、TXT文件 · 按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
