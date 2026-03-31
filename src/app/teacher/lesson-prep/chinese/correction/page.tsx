/**
 * 作文批改智能体页面
 * 
 * 心心的子agent，专门负责作文批改
 * 基于习作备课方案的评改标准进行客观批改
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Image as ImageIcon,
  Loader2,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';
import { cn } from '@/lib/utils';
import type { EvaluationGuide, TieredTask, WritingIssue } from '@/types/chinese-prep';

// ==================== Markdown 渲染 ====================

/**
 * 简洁安全的 Markdown 渲染器
 */
function renderMarkdown(content: string): React.ReactNode {
  if (!content) return null;
  
  return (
    <div className="prose prose-sm max-w-none">
      {content.split('\n').map((line, idx) => {
        // 空行
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }
        
        // H2 标题
        if (line.startsWith('## ')) {
          const text = line.replace(/^##\s*/, '');
          return (
            <h2 key={idx} className="text-base font-bold text-gray-800 mt-5 mb-3 flex items-center gap-2">
              {text}
            </h2>
          );
        }
        
        // H3 标题
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-semibold text-gray-700 mt-3 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        
        // 分隔线
        if (line.trim() === '---') {
          return <hr key={idx} className="my-4 border-gray-200" />;
        }
        
        // 总分行
        if (line.includes('总分：')) {
          return (
            <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 my-3 border border-amber-200">
              <p className="text-lg font-bold text-amber-800">{line.replace(/\*\*/g, '')}</p>
            </div>
          );
        }
        
        // 等级行
        if (line.includes('等级：')) {
          const level = line.includes('优秀') ? '优秀' : line.includes('良好') ? '良好' : line.includes('及格') ? '及格' : '待提高';
          const colorMap: Record<string, string> = {
            '优秀': 'from-green-50 to-emerald-50 border-green-200 text-green-800',
            '良好': 'from-blue-50 to-indigo-50 border-blue-200 text-blue-800',
            '及格': 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-800',
            '待提高': 'from-orange-50 to-red-50 border-orange-200 text-orange-800',
          };
          const colorClass = colorMap[level] || colorMap['待提高'];
          return (
            <div key={idx} className={`bg-gradient-to-r ${colorClass} rounded-lg px-4 py-2 my-2 border inline-block`}>
              <span className="font-medium">等级评定：</span>
              <span className="font-bold text-lg ml-1">{level}</span>
            </div>
          );
        }
        
        // 表格行
        if (line.includes('|')) {
          const cells = line.split('|').filter(c => c.trim());
          if (cells.length > 1) {
            // 表头或分隔行
            if (line.includes('---')) {
              return null; // 跳过分隔行
            }
            return (
              <div key={idx} className="flex gap-4 py-1.5 px-2 text-sm even:bg-gray-50">
                {cells.map((cell, i) => (
                  <span key={i} className={i === 0 ? 'font-medium text-gray-700 flex-1' : 'text-gray-600 w-16 text-center'}>
                    {cell.trim()}
                  </span>
                ))}
              </div>
            );
          }
        }
        
        // 列表项
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        
        // 引用
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-blue-400 pl-3 py-1 my-2 bg-blue-50 rounded-r text-sm text-gray-700 italic">
              {renderInline(line.slice(2))}
            </blockquote>
          );
        }
        
        // 普通文本
        return (
          <p key={idx} className="text-sm text-gray-700 leading-relaxed py-0.5">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  if (!text) return text;
  
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// ==================== 类型定义 ====================

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 图片
  timestamp: number;
};

type LessonInfo = {
  title: string;
  grade: number;
  writingType: string;
  unit: string;
};

type WritingContent = {
  outline?: {
    structure: Array<{
      section: string;
      content: string;
      keyPoints: string[];
      wordCount: string;
    }>;
    transitionPhrases: string[];
  };
  evaluationGuide?: EvaluationGuide;
  tieredTasks?: TieredTask[];
  commonIssues?: WritingIssue[];
};

// ==================== 加载状态组件 ====================

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

// ==================== 缺少数据提示组件 ====================

function MissingDataPrompt() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">缺少备课方案</h2>
          <p className="text-sm text-muted-foreground mb-4">
            请先在习作专项生成备课方案，或从资源库选择已有方案
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/teacher/lesson-prep/chinese/writing">
              <Button variant="outline">去习作专项</Button>
            </Link>
            <Link href="/teacher/lesson-prep/my-resources">
              <Button>我的资源库</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 主内容组件 ====================

function CorrectionContent() {
  const router = useRouter();
  
  const [lessonInfo, setLessonInfo] = useState<LessonInfo | null>(null);
  const [writingContent, setWritingContent] = useState<WritingContent | null>(null);
  
  // 批改状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [showStandards, setShowStandards] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 从 sessionStorage 初始化数据
  useEffect(() => {
    try {
      const lessonInfoStr = sessionStorage.getItem('correction_lessonInfo');
      const contentStr = sessionStorage.getItem('correction_content');
      
      if (lessonInfoStr && contentStr) {
        setLessonInfo(JSON.parse(lessonInfoStr));
        setWritingContent(JSON.parse(contentStr));
        // 读取后清除，避免残留
        sessionStorage.removeItem('correction_lessonInfo');
        sessionStorage.removeItem('correction_content');
      }
    } catch (e) {
      console.error('解析备课方案数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 添加欢迎消息
  useEffect(() => {
    if (lessonInfo) {
      const welcomeMsg: Message = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `你好呀！我是心心的作文批改助手 💚\n\n我已经加载了《${lessonInfo.title}》的评改标准，可以帮你客观地批改学生习作。\n\n**批改标准包括：**\n- 📊 教师评价量表（内容、结构、语言、标点等维度）\n- ✅ 学生自查清单\n- ⚠️ 常见问题预警\n\n请上传学生习作图片，我来帮你批改～`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
    }
  }, [lessonInfo]);
  
  // 上传图片
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setUploadedImages(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // 移除图片
  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // 执行批改
  const handleCorrect = useCallback(async () => {
    if (uploadedImages.length === 0 || isCorrecting) return;
    
    // 添加用户消息
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: '请批改这份习作：',
      images: [...uploadedImages],
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    
    // 清空上传的图片
    setUploadedImages([]);
    setIsCorrecting(true);
    
    // 创建助手消息占位
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    
    try {
      const response = await fetch('/api/writing-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: userMsg.images,
          lessonInfo,
          writingContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('批改请求失败');
      }
      
      // SSE 流式读取
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, content: fullContent }
                      : msg
                  ));
                }
              } catch {
                // 非 JSON 数据，直接追加
                fullContent += data;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
            }
          }
        }
      }
      
      // 批改完成后询问是否继续
      setTimeout(() => {
        const continueMsg: Message = {
          id: `continue-${Date.now()}`,
          role: 'assistant',
          content: '✅ 批改完成啦！\n\n还需要继续批改下一份习作吗？如果需要，请上传新的习作图片～ 💚',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, continueMsg]);
      }, 500);
      
    } catch (error) {
      console.error('批改失败:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: '❌ 批改过程中出现错误，请重试。' }
          : msg
      ));
    } finally {
      setIsCorrecting(false);
    }
  }, [uploadedImages, isCorrecting, lessonInfo, writingContent]);
  
  // 渲染评改标准
  const renderStandards = () => {
    if (!writingContent?.evaluationGuide) return null;
    
    const { evaluationGuide, commonIssues } = writingContent;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b cursor-pointer" onClick={() => setShowStandards(!showStandards)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-blue-600" />
              评改标准
            </CardTitle>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              showStandards && "rotate-180"
            )} />
          </div>
          <CardDescription>
            {lessonInfo?.title} · {lessonInfo?.grade}年级
          </CardDescription>
        </CardHeader>
        
        {showStandards && (
          <CardContent className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
            {/* 教师评价量表 */}
            {evaluationGuide.teacherRubric && evaluationGuide.teacherRubric.length > 0 && (
              <div>
                <div className="text-sm font-medium text-blue-700 mb-2">📊 教师评价量表</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">维度</th>
                        <th className="text-left p-2 font-medium text-green-600">优秀</th>
                        <th className="text-left p-2 font-medium text-blue-600">良好</th>
                        <th className="text-left p-2 font-medium text-orange-600">待提高</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluationGuide.teacherRubric.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">{item.dimension}</td>
                          <td className="p-2 text-green-700">{item.excellent}</td>
                          <td className="p-2 text-blue-700">{item.good}</td>
                          <td className="p-2 text-orange-700">{item.improving}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 常见问题预警 */}
            {commonIssues && commonIssues.length > 0 && (
              <div>
                <div className="text-sm font-medium text-orange-700 mb-2">⚠️ 常见问题预警</div>
                <div className="space-y-2">
                  {commonIssues.slice(0, 5).map((issue, idx) => (
                    <div key={idx} className="p-2 bg-orange-50 rounded border border-orange-100 text-xs">
                      <div className="font-medium text-orange-700">{issue.issue}</div>
                      <div className="text-muted-foreground mt-1">{issue.manifestation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };
  
  // 加载中
  if (loading) {
    return <LoadingState />;
  }
  
  // 如果没有备课方案数据
  if (!lessonInfo || !writingContent) {
    return <MissingDataPrompt />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="p-4 max-w-6xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/teacher/lesson-prep/chinese/writing">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center shadow-sm overflow-hidden">
                <img 
                  src="/xinxin-avatar.png" 
                  alt="心心" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">作文批改助手</h1>
                <p className="text-xs text-muted-foreground">心心 · 智能批改</p>
              </div>
            </div>
          </div>
          
          <Badge variant="outline" className="bg-blue-50">
            {lessonInfo.title} · {lessonInfo.grade}年级
          </Badge>
        </div>
        
        {/* 主内容区 */}
        <div className="grid grid-cols-12 gap-4">
          {/* 左侧：评改标准 */}
          <div className="col-span-4">
            <div className="sticky top-4">
              {renderStandards()}
            </div>
          </div>
          
          {/* 右侧：对话区域 */}
          <div className="col-span-8">
            <Card className="border-none shadow-lg h-[calc(100vh-120px)] flex flex-col">
              {/* 消息列表 */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' && "flex-row-reverse"
                        )}
                      >
                        {/* 头像 */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
                          msg.role === 'user' 
                            ? "bg-blue-100" 
                            : "bg-gradient-to-br from-emerald-50 to-green-100"
                        )}>
                          {msg.role === 'user' ? (
                            <span className="text-sm">👤</span>
                          ) : (
                            <img 
                              src="/xinxin-avatar.png" 
                              alt="心心" 
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        
                        {/* 消息内容 */}
                        <div className={cn(
                          "max-w-[80%] rounded-2xl p-3",
                          msg.role === 'user'
                            ? "bg-blue-500 text-white"
                            : "bg-muted"
                        )}>
                          {/* 图片 */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`习作图片 ${idx + 1}`}
                                  className="max-w-[200px] rounded-lg border"
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* 文本内容 */}
                          <div className="leading-relaxed">
                            {msg.role === 'user' 
                              ? <span className="text-sm whitespace-pre-wrap">{msg.content}</span>
                              : renderMarkdown(msg.content)
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              
              {/* 底部输入区域 */}
              <div className="border-t p-4 space-y-3">
                {/* 上传的图片预览 */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`预览 ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={FILE_TYPE_CONFIGS.image.accept}
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCorrecting}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传习作图片
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleCorrect}
                    disabled={uploadedImages.length === 0 || isCorrecting}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {isCorrecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        批改中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        开始批改
                      </>
                    )}
                  </Button>
                  
                  {uploadedImages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedImages([])}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      清空
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  💡 支持上传多张图片（如习作有多页），批改后将询问是否继续批改下一份
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 页面入口（带 Suspense） ====================

export default function WritingCorrectionPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CorrectionContent />
    </Suspense>
  );
}
