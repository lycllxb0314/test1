/**
 * 智慧作业/练习 主页面
 *
 * 页面结构：
 * - 顶级 Tab：AI智能出题 | 校本题库
 * - AI智能出题：对话→细目表→命题→组卷（步骤流，无需页面选择年级）
 * - 校本题库：筛选+浏览+导入+加入试题篮
 * - 共享：试题篮（右侧固定抽屉）+ 组卷排版
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FilePreviewDialogWithState } from '@/components/ui/file-preview-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Brain,
  ShoppingCart,
  FileText,
  Plus,
  Send,
  Loader2,
  XCircle,
  Trash2,
  Eye,
  Sparkles,
  Table as TableIcon,
  Library,
  ArrowRight,
  Lightbulb,
  Target,
  MessageSquare,
  Upload,
  ChevronRight,
  Bot,
  User,
  Check,
  PenLine,
} from 'lucide-react';
import type {
  Question,
  SpecificationTable,
  InferredRequirements,
  DialogMessage,
  ExamType,
  QuestionType,
  Difficulty,
  CognitiveLevel,
  PaperQuestion,
  BasketItem,
  ExamPaper,
  ImportQuestionRequest,
} from '@/types/smart-homework';
import {
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  COGNITIVE_LEVEL_LABELS,
  EXAM_TYPE_LABELS,
} from '@/types/smart-homework';

const SUBJECTS = ['语文', '数学', '英语'];
const GRADES = [1, 2, 3, 4, 5, 6];
const SEMESTERS = ['上册', '下册'] as const;

// ==================== 主组件 ====================

export default function SmartHomeworkPage() {
  const { user } = useAuth();

  // 顶级 Tab
  const [topTab, setTopTab] = useState<'ai' | 'bank'>('ai');

  // AI出题 - 步骤流
  const [aiStep, setAiStep] = useState<'chat' | 'spec' | 'generate'>('chat');

  // AI出题 - 对话
  const [chatMessages, setChatMessages] = useState<DialogMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [inferredReqs, setInferredReqs] = useState<InferredRequirements | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI出题 - 细目表
  const [specification, setSpecification] = useState<SpecificationTable | null>(null);
  const [specLoading, setSpecLoading] = useState(false);

  // AI出题 - 命题
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  // 校本题库
  const [bankSubject, setBankSubject] = useState('语文');
  const [bankGrade, setBankGrade] = useState(4);
  const [bankSemester, setBankSemester] = useState<'上册' | '下册'>('上册');
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankFilter, setBankFilter] = useState<{
    questionType?: QuestionType;
    difficulty?: Difficulty;
    keyword?: string;
  }>({});

  // 导入题目弹窗
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState<Partial<ImportQuestionRequest>>({
    questionType: 'choice',
    difficulty: 'medium',
    cognitiveLevel: 'understand',
    subject: '语文',
    grade: 4,
    semester: '上册',
    score: 2,
  });
  const [importing, setImporting] = useState(false);

  // 试题篮
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [basketOpen, setBasketOpen] = useState(false);

  // 组卷
  const [paperTitle, setPaperTitle] = useState('');
  const [paperExamType, setPaperExamType] = useState<ExamType>('unit_test');
  const [saving, setSaving] = useState(false);
  const [savedPapers, setSavedPapers] = useState<ExamPaper[]>([]);

  // 预览
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<{
    id: string;
    title: string;
    fileName: string;
    fileUrl: string;
  } | null>(null);

  // ==================== 对话逻辑 ====================

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: DialogMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/smart-homework/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: chatMessages,
          currentRequirements: inferredReqs,
          subject: inferredReqs?.subject || '',
          grade: inferredReqs?.grade || 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date().toISOString(),
        }]);
        if (data.data.inferredRequirements) {
          setInferredReqs(data.data.inferredRequirements);
        }
      }
    } catch (err) {
      console.error('对话失败:', err);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, inferredReqs]);

  const generateSpecification = useCallback(async () => {
    if (!inferredReqs) return;
    setSpecLoading(true);
    try {
      const res = await fetch('/api/smart-homework/specification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inferredReqs),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSpecification(data.data);
        setAiStep('spec');
      }
    } catch (err) {
      console.error('生成细目表失败:', err);
    } finally {
      setSpecLoading(false);
    }
  }, [inferredReqs]);

  const generateQuestions = useCallback(async () => {
    if (!specification) return;
    setGenLoading(true);
    try {
      const res = await fetch('/api/smart-homework/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specification),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedQuestions(data.data);
        setAiStep('generate');
      }
    } catch (err) {
      console.error('命题失败:', err);
    } finally {
      setGenLoading(false);
    }
  }, [specification]);

  // ==================== 试题篮 ====================

  const addToBasket = useCallback((q: Question) => {
    setBasket(prev => {
      if (prev.some(i => i.questionId === q.id)) return prev;
      return [...prev, {
        questionId: q.id,
        question: q,
        addedAt: new Date().toISOString(),
        assignedScore: q.score,
        section: QUESTION_TYPE_LABELS[q.questionType],
      }];
    });
  }, []);

  const removeFromBasket = useCallback((id: string) => {
    setBasket(prev => prev.filter(i => i.questionId !== id));
  }, []);

  const isInBasket = useCallback((id: string) => basket.some(i => i.questionId === id), [basket]);

  // ==================== 组卷排版 ====================

  const composeAndSave = useCallback(async () => {
    if (basket.length === 0 || !user) return;
    setSaving(true);
    try {
      const reqs = inferredReqs || { subject: '语文', grade: 4, semester: '上册' };
      if (!reqs.subject || !reqs.grade) return;
      const paperQuestions: PaperQuestion[] = basket.map((item, idx) => ({
        questionId: item.questionId,
        order: idx + 1,
        section: item.section,
        score: item.assignedScore,
        data: item.question,
      }));
      const totalScore = basket.reduce((s, i) => s + i.assignedScore, 0);
      const title = paperTitle || `${reqs.subject}${reqs.grade}年级${reqs.semester}${EXAM_TYPE_LABELS[paperExamType]}`;

      const res = await fetch('/api/smart-homework/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject: reqs.subject,
          grade: reqs.grade,
          semester: reqs.semester,
          examType: paperExamType,
          totalScore,
          duration: specification?.duration || 60,
          specification: specification || {},
          questions: paperQuestions,
          layoutConfig: { pageSize: 'A4', orientation: 'portrait', margins: { top: 25, bottom: 20, left: 25, right: 25 }, fontSize: 12, showAnswerSheet: true, columns: 1 },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.paperHtml) {
          const blob = new Blob([data.data.paperHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          setPreviewResource({ id: data.data.id, title: `${title}.html`, fileName: `${title}.html`, fileUrl: url });
          setPreviewOpen(true);
        }
        loadPapers();
        setBasketOpen(false);
      }
    } catch (err) {
      console.error('组卷失败:', err);
    } finally {
      setSaving(false);
    }
  }, [basket, user, paperTitle, paperExamType, specification, inferredReqs]);

  // ==================== 校本题库 ====================

  const loadBankQuestions = useCallback(async () => {
    setBankLoading(true);
    try {
      const params = new URLSearchParams({ subject: bankSubject, grade: String(bankGrade), semester: bankSemester, pageSize: '50' });
      if (bankFilter.questionType) params.set('questionType', bankFilter.questionType);
      if (bankFilter.difficulty) params.set('difficulty', bankFilter.difficulty);
      if (bankFilter.keyword) params.set('keyword', bankFilter.keyword);
      const res = await fetch(`/api/smart-homework/question-bank?${params}`);
      const data = await res.json();
      if (data.success && data.data) setBankQuestions(data.data.items);
    } catch (err) {
      console.error('加载题库失败:', err);
    } finally {
      setBankLoading(false);
    }
  }, [bankSubject, bankGrade, bankSemester, bankFilter]);

  const handleImportQuestion = useCallback(async () => {
    if (!importForm.title || !importForm.content || !importForm.answer) return;
    setImporting(true);
    try {
      const res = await fetch('/api/smart-homework/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...importForm, subject: bankSubject, grade: bankGrade, semester: bankSemester }),
      });
      const data = await res.json();
      if (data.success) {
        setImportOpen(false);
        setImportForm(prev => ({ ...prev, title: '', content: '', answer: '', answerExplanation: '' }));
        loadBankQuestions();
      }
    } catch (err) {
      console.error('导入失败:', err);
    } finally {
      setImporting(false);
    }
  }, [importForm, bankSubject, bankGrade, bankSemester, loadBankQuestions]);

  const loadPapers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/smart-homework/papers');
      const data = await res.json();
      if (data.success && data.data) setSavedPapers(data.data.items);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { loadPapers(); }, [loadPapers]);
  useEffect(() => { if (topTab === 'bank') loadBankQuestions(); }, [topTab, loadBankQuestions]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // ==================== 渲染 ====================

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ===== 页头 ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">智慧作业/练习</h1>
              <p className="text-sm text-muted-foreground mt-0.5">AI智能命题 · 校本题库 · 标准排版</p>
            </div>
          </div>

          {/* 试题篮 */}
          <Sheet open={basketOpen} onOpenChange={setBasketOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative gap-2">
                <ShoppingCart className="w-4 h-4" />
                试题篮
                {basket.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px]">
                    {basket.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[420px] sm:w-[480px] flex flex-col">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  试题篮 ({basket.length}题)
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto mt-4 space-y-2">
                {basket.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">从AI命题或校本题库中添加试题</p>
                  </div>
                ) : basket.map((item, idx) => (
                  <div key={item.questionId} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                    <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{QUESTION_TYPE_LABELS[item.question.questionType]}</Badge>
                    <p className="text-sm flex-1 truncate">{item.question.content}</p>
                    <Input
                      type="number"
                      className="w-14 h-7 text-xs text-center"
                      value={item.assignedScore}
                      onChange={e => setBasket(prev => prev.map(b =>
                        b.questionId === item.questionId ? { ...b, assignedScore: Number(e.target.value) } : b
                      ))}
                      min={1}
                    />
                    <span className="text-[10px] text-muted-foreground">分</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive shrink-0" onClick={() => removeFromBasket(item.questionId)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {basket.length > 0 && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>合计</span>
                    <span>{basket.reduce((s, i) => s + i.assignedScore, 0)} 分 / {basket.length} 题</span>
                  </div>
                  <Input placeholder="试卷标题（可选）" value={paperTitle} onChange={e => setPaperTitle(e.target.value)} className="h-9" />
                  <Select value={paperExamType} onValueChange={v => setPaperExamType(v as ExamType)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={composeAndSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenLine className="w-4 h-4 mr-2" />}
                    排版生成试卷
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* ===== 顶级 Tab ===== */}
        <Tabs value={topTab} onValueChange={v => setTopTab(v as 'ai' | 'bank')}>
          <TabsList className="mb-6">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" /> AI智能出题
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <Library className="w-4 h-4" /> 校本题库
            </TabsTrigger>
          </TabsList>

          {/* ================== AI 智能出题 ================== */}
          <TabsContent value="ai" className="mt-0">
            {/* 步骤指示条 */}
            <div className="flex items-center gap-1 mb-6">
              {([
                { key: 'chat', label: '需求对话', icon: MessageSquare },
                { key: 'spec', label: '细目表确认', icon: TableIcon },
                { key: 'generate', label: '智能命题', icon: Sparkles },
              ] as const).map((step, idx) => (
                <React.Fragment key={step.key}>
                  {idx > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground/40 mx-1" />}
                  <button
                    onClick={() => { if (step.key === 'chat' || (step.key === 'spec' && specification) || (step.key === 'generate' && generatedQuestions.length)) setAiStep(step.key); }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all',
                      aiStep === step.key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <step.icon className="w-3.5 h-3.5" />
                    {step.label}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* ---- 步骤1: 需求对话 ---- */}
            {aiStep === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 对话区 */}
                <div className="lg:col-span-3">
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-0">
                      <ScrollArea className="h-[460px] p-6">
                        {chatMessages.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                              <Bot className="w-8 h-8 text-primary/40" />
                            </div>
                            <p className="text-muted-foreground text-sm mb-1">告诉AI你想出什么样的试卷</p>
                            <p className="text-muted-foreground/60 text-xs">例如："帮我出一份四年级语文上册第三单元测试卷，要有选择题、填空题和阅读理解"</p>
                          </div>
                        )}
                        <div className="space-y-4">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                msg.role === 'user' ? 'bg-primary/10' : 'bg-muted'
                              )}>
                                {msg.role === 'user'
                                  ? <User className="w-4 h-4 text-primary" />
                                  : <Bot className="w-4 h-4 text-muted-foreground" />
                                }
                              </div>
                              <div className={cn(
                                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              )}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div ref={chatEndRef} />
                      </ScrollArea>

                      {/* 输入区 */}
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="描述你的命题需求..."
                            className="h-10"
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            disabled={chatLoading}
                          />
                          <Button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()} size="icon" className="h-10 w-10 shrink-0">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                        {inferredReqs && inferredReqs.knowledgePoints.length > 0 && inferredReqs.subject ? (
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">AI已理解你的需求，可以生成细目表了</p>
                            <Button size="sm" onClick={generateSpecification} disabled={specLoading}>
                              {specLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5 mr-1.5" />}
                              生成细目表
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 推断需求侧栏 */}
                <div>
                  <Card className="border-none shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        AI推断需求
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {inferredReqs ? (
                        <>
                          <InfoRow label="考试类型" value={inferredReqs.examType ? <Badge variant="secondary" className="text-[10px]">{EXAM_TYPE_LABELS[inferredReqs.examType]}</Badge> : <span className="text-xs text-muted-foreground">待确认</span>} />
                          <InfoRow label="学科" value={inferredReqs.subject || '待确认'} />
                          <InfoRow label="年级" value={inferredReqs.grade ? `${inferredReqs.grade}年级` : '待确认'} />
                          <InfoRow label="难度" value={inferredReqs.difficultyPreference ? <Badge variant="outline" className="text-[10px]">{DIFFICULTY_LABELS[inferredReqs.difficultyPreference]}</Badge> : <span className="text-xs text-muted-foreground">待确认</span>} />
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">知识点</p>
                            <div className="flex flex-wrap gap-1">
                              {inferredReqs.knowledgePoints.map(kp => <Badge key={kp} variant="secondary" className="text-[10px]">{kp}</Badge>)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">题型</p>
                            <div className="flex flex-wrap gap-1">
                              {inferredReqs.questionTypes.map(qt => <Badge key={qt} variant="outline" className="text-[10px]">{QUESTION_TYPE_LABELS[qt]}</Badge>)}
                            </div>
                          </div>
                          <InfoRow label="总分" value={`${inferredReqs.totalScore}分`} />
                          <InfoRow label="时长" value={`${inferredReqs.duration}分钟`} />
                          {inferredReqs.reasoning && (
                            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                              <p className="text-[10px] font-medium text-primary mb-1">因果推理</p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{inferredReqs.reasoning}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-6">开始对话后AI会自动推断</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ---- 步骤2: 细目表确认 ---- */}
            {aiStep === 'spec' && specification && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-primary" /> 命题双向细目表
                    </h2>
                    {specification.scope && (
                      <p className="text-sm text-muted-foreground mt-1">评价范围：{specification.scope}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAiStep('chat')}>返回修改</Button>
                    <Button size="sm" onClick={generateQuestions} disabled={genLoading}>
                      {genLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                      确认并命题
                    </Button>
                  </div>
                </div>

                {/* 基本信息卡片 */}
                <div className="grid grid-cols-5 gap-4">
                  <StatCard value={specification.totalScore} label="总分" />
                  <StatCard value={specification.duration} label="时长(分钟)" />
                  <StatCard value={specification.questionTypePlans.reduce((s, p) => s + p.count, 0)} label="总题数" />
                  <StatCard value={Math.round(specification.difficultyDistribution.easy * 100)} label="容易题占比(%)" />
                  <StatCard value={Math.round(specification.difficultyDistribution.hard * 100)} label="较难题占比(%)" />
                </div>

                {/* ============ 核心双向矩阵 ============ */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    {/* 矩阵标题栏 */}
                    <div className="px-5 pt-5 pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">双向细目矩阵</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            横向（评什么）：知识内容细化 &nbsp;|&nbsp; 纵向（为什么评）：认知水平
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-primary/60" /> 有分配</span>
                          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/20" /> 未覆盖</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          {/* 纵向标题：认知层次 */}
                          <tr className="bg-muted/30">
                            <th className="p-3 text-left font-semibold text-xs border-b border-r min-w-[180px]" rowSpan={2}>
                              <div className="writing-vertical text-center text-muted-foreground text-[10px]">为什么评 →</div>
                            </th>
                            <th className="p-3 text-left font-semibold text-xs border-b border-r min-w-[60px]" rowSpan={2}>编号</th>
                            <th className="p-3 text-left font-semibold text-xs border-b border-r" rowSpan={2}>知识内容（评什么）</th>
                            <th className="p-3 text-center font-semibold text-xs border-b border-r" rowSpan={2}>权重</th>
                            {(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] as CognitiveLevel[]).map(cl => (
                              <th key={cl} className="p-2 text-center font-semibold text-xs border-b min-w-[90px]">
                                {COGNITIVE_LEVEL_LABELS[cl]}
                              </th>
                            ))}
                            <th className="p-3 text-center font-semibold text-xs border-b border-l min-w-[70px]" rowSpan={2}>小计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {specification.knowledgeContents.map((kc, i) => {
                            // 计算该知识点的行小计
                            const rowTotal = kc.cognitiveAllocations.reduce((s, a) => s + a.score, 0);
                            return (
                              <React.Fragment key={i}>
                                {/* 如果是新的单元，插入单元分隔行 */}
                                {(i === 0 || kc.unit !== specification.knowledgeContents[i - 1]?.unit) && kc.unit && (
                                  <tr className="bg-muted/20">
                                    <td colSpan={3 + 1 + 6 + 1} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                                      {kc.unit}
                                    </td>
                                  </tr>
                                )}
                                <tr className="border-b hover:bg-muted/10 transition-colors">
                                  <td className="px-3 py-2 text-[10px] text-muted-foreground border-r" rowSpan={1}></td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground border-r">{kc.code}</td>
                                  <td className="px-3 py-2 text-sm border-r">
                                    <div className="font-medium">{kc.name}</div>
                                    {kc.lesson && <div className="text-[10px] text-muted-foreground mt-0.5">{kc.lesson}</div>}
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs border-r">{kc.weight}%</td>
                                  {(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] as CognitiveLevel[]).map(cl => {
                                    const alloc = kc.cognitiveAllocations.find(a => a.level === cl);
                                    if (!alloc || (alloc.questionCount === 0 && alloc.score === 0)) {
                                      return (
                                        <td key={cl} className="px-2 py-2 text-center">
                                          <span className="text-muted-foreground/20 text-xs">—</span>
                                        </td>
                                      );
                                    }
                                    return (
                                      <td key={cl} className="px-2 py-2 text-center">
                                        <div className="inline-flex flex-col items-center gap-0.5 rounded-md bg-primary/8 px-2 py-1">
                                          {alloc.questionNumbers?.length > 0 && (
                                            <span className="text-[10px] font-bold text-primary/80">
                                              第{alloc.questionNumbers.length === 1
                                                ? alloc.questionNumbers[0]
                                                : `${alloc.questionNumbers[0]}-${alloc.questionNumbers[alloc.questionNumbers.length - 1]}`}题
                                            </span>
                                          )}
                                          <span className="text-xs font-semibold text-primary">{alloc.score}分</span>
                                          {alloc.suggestedQuestionTypes?.length > 0 && (
                                            <span className="text-[9px] text-muted-foreground">
                                              {alloc.suggestedQuestionTypes.map(qt => QUESTION_TYPE_LABELS[qt]).join('、')}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-2 text-center border-l font-semibold text-sm">{rowTotal}</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                          {/* 列小计行 */}
                          <tr className="bg-muted/30 font-semibold">
                            <td className="px-3 py-2 border-r" colSpan={3}>合 计</td>
                            <td className="px-3 py-2 text-center border-r">100%</td>
                            {(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] as CognitiveLevel[]).map(cl => {
                              const summary = specification.cognitiveSummary.find(s => s.level === cl);
                              return (
                                <td key={cl} className="px-2 py-2 text-center">
                                  {summary ? (
                                    <div>
                                      <span className="text-sm">{summary.totalScore}分</span>
                                      <span className="text-[10px] text-muted-foreground ml-1">({summary.percentage}%)</span>
                                    </div>
                                  ) : <span className="text-muted-foreground/30 text-xs">—</span>}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-center border-l text-base">{specification.totalScore}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* ============ 认知水平分布 ============ */}
                {specification.cognitiveSummary.length > 0 && (
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-sm font-medium mb-3">认知水平分布（为什么评）</p>
                      <div className="flex gap-3">
                        {specification.cognitiveSummary.map(cs => (
                          <div key={cs.level} className="flex-1 text-center p-2 rounded-lg bg-muted/30">
                            <div className="text-lg font-bold text-primary">{cs.percentage}%</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{COGNITIVE_LEVEL_LABELS[cs.level]}</div>
                            <div className="text-[10px] text-muted-foreground/60">{cs.totalQuestions}题 · {cs.totalScore}分</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ============ 题型规划 ============ */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium mb-3">题型规划（怎么评）</p>
                    <div className="space-y-2">
                      {specification.questionTypePlans.map((plan, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                          <Badge className="min-w-[56px] justify-center text-[10px]">{QUESTION_TYPE_LABELS[plan.questionType]}</Badge>
                          <span className="text-sm">{plan.count}题 × {plan.scorePerQuestion}分 = {plan.totalScore}分</span>
                          <Badge variant="outline" className="text-[10px]">{DIFFICULTY_LABELS[plan.difficulty]}</Badge>
                          <div className="flex gap-1">
                            {plan.cognitiveLevels.map(cl => (
                              <Badge key={cl} variant="secondary" className="text-[10px]">{COGNITIVE_LEVEL_LABELS[cl]}</Badge>
                            ))}
                          </div>
                          <span className="flex-1" />
                          <span className="text-[10px] text-muted-foreground" title={plan.knowledgePoints.join('、')}>
                            {plan.knowledgePoints.length}个知识点
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ============ 难度分布 ============ */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium mb-3">难度分布</p>
                    <div className="flex gap-4">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                        <div key={d} className="flex-1 text-center p-3 rounded-lg bg-muted/30">
                          <div className="text-xl font-bold">{Math.round(specification.difficultyDistribution[d] * 100)}%</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{DIFFICULTY_LABELS[d]}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ---- 步骤3: 智能命题 ---- */}
            {aiStep === 'generate' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> 命题结果
                    <Badge variant="secondary" className="text-xs font-normal">{generatedQuestions.length} 题</Badge>
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAiStep('spec')}>返回细目表</Button>
                    <Button size="sm" onClick={() => setBasketOpen(true)} disabled={basket.length === 0}>
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                      去组卷 ({basket.length})
                    </Button>
                  </div>
                </div>

                {genLoading ? (
                  <Card className="border-none shadow-sm p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">AI正在根据细目表命题...</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedQuestions.map((q, idx) => (
                      <QuestionCard key={q.id} question={q} index={idx} inBasket={isInBasket(q.id)} onToggleBasket={() => isInBasket(q.id) ? removeFromBasket(q.id) : addToBasket(q)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ================== 校本题库 ================== */}
          <TabsContent value="bank" className="mt-0">
            <div className="space-y-4">
              {/* 筛选栏 */}
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select value={bankSubject} onValueChange={setBankSubject}>
                      <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={String(bankGrade)} onValueChange={v => setBankGrade(Number(v))}>
                      <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{GRADES.map(g => <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={bankSemester} onValueChange={v => setBankSemester(v as '上册' | '下册')}>
                      <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="w-px h-6 bg-border" />
                    <Select value={bankFilter.questionType || 'all'} onValueChange={v => setBankFilter(prev => ({ ...prev, questionType: v === 'all' ? undefined : v as QuestionType }))}>
                      <SelectTrigger className="w-24 h-9 text-xs"><SelectValue placeholder="题型" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部题型</SelectItem>
                        {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={bankFilter.difficulty || 'all'} onValueChange={v => setBankFilter(prev => ({ ...prev, difficulty: v === 'all' ? undefined : v as Difficulty }))}>
                      <SelectTrigger className="w-24 h-9 text-xs"><SelectValue placeholder="难度" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部难度</SelectItem>
                        {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-36 h-9 text-xs"
                      placeholder="搜索题目..."
                      value={bankFilter.keyword || ''}
                      onChange={e => setBankFilter(prev => ({ ...prev, keyword: e.target.value || undefined }))}
                    />
                    <Button size="sm" className="h-9" onClick={loadBankQuestions} disabled={bankLoading}>
                      {bankLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '搜索'}
                    </Button>
                    <div className="flex-1" />
                    <Button size="sm" className="h-9 gap-1.5" onClick={() => setImportOpen(true)}>
                      <Upload className="w-3.5 h-3.5" /> 导入题目
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 题目列表 */}
              {bankQuestions.length === 0 && !bankLoading ? (
                <Card className="border-none shadow-sm p-12 text-center">
                  <Library className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground mb-1">题库暂无题目</p>
                  <p className="text-xs text-muted-foreground/60 mb-4">点击上方「导入题目」按钮，将好题录入校本题库</p>
                  <Button size="sm" onClick={() => setImportOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> 导入第一道题
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bankQuestions.map((q, idx) => (
                    <QuestionCard key={q.id} question={q} index={idx} inBasket={isInBasket(q.id)} onToggleBasket={() => isInBasket(q.id) ? removeFromBasket(q.id) : addToBasket(q)} showSource />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ===== 导入题目弹窗 ===== */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" /> 导入题目到校本题库
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">题型</label>
                  <Select value={importForm.questionType || 'choice'} onValueChange={v => setImportForm(prev => ({ ...prev, questionType: v as QuestionType }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">难度</label>
                  <Select value={importForm.difficulty || 'medium'} onValueChange={v => setImportForm(prev => ({ ...prev, difficulty: v as Difficulty }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(DIFFICULTY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">认知层次</label>
                  <Select value={importForm.cognitiveLevel || 'understand'} onValueChange={v => setImportForm(prev => ({ ...prev, cognitiveLevel: v as CognitiveLevel }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(COGNITIVE_LEVEL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">分值</label>
                  <Input type="number" className="h-9 text-xs" value={importForm.score || 2} onChange={e => setImportForm(prev => ({ ...prev, score: Number(e.target.value) }))} min={1} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">题目标题 <span className="text-destructive">*</span></label>
                <Input className="h-9 text-xs" placeholder="如：第三单元词语运用" value={importForm.title || ''} onChange={e => setImportForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">题目内容 <span className="text-destructive">*</span></label>
                <Textarea className="text-xs min-h-[80px]" placeholder="完整的题目描述" value={importForm.content || ''} onChange={e => setImportForm(prev => ({ ...prev, content: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">正确答案 <span className="text-destructive">*</span></label>
                <Input className="h-9 text-xs" placeholder="如：A 或 完整答案" value={importForm.answer || ''} onChange={e => setImportForm(prev => ({ ...prev, answer: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">答案解析</label>
                <Textarea className="text-xs min-h-[50px]" placeholder="选填" value={importForm.answerExplanation || ''} onChange={e => setImportForm(prev => ({ ...prev, answerExplanation: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">知识点（逗号分隔）</label>
                <Input className="h-9 text-xs" placeholder="如：词语运用，修辞手法" value={(importForm.knowledgePoints || []).join('，')} onChange={e => setImportForm(prev => ({ ...prev, knowledgePoints: e.target.value ? e.target.value.split(/[，,]/).map(s => s.trim()).filter(Boolean) : [] }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)}>取消</Button>
              <Button onClick={handleImportQuestion} disabled={importing || !importForm.title || !importForm.content || !importForm.answer}>
                {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
                导入
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 全局预览弹窗 */}
        <FilePreviewDialogWithState
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          resource={previewResource ? {
            id: previewResource.id,
            title: previewResource.title,
            fileName: previewResource.fileName,
            fileUrl: previewResource.fileUrl,
            fileSize: 0,
          } : null}
        />
      </div>
    </div>
  );
}

// ==================== 子组件 ====================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5 text-center">
        <div className="text-3xl font-bold text-primary">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function QuestionCard({ question, index, inBasket, onToggleBasket, showSource }: {
  question: Question;
  index: number;
  inBasket: boolean;
  onToggleBasket: () => void;
  showSource?: boolean;
}) {
  return (
    <Card className={cn('border-none shadow-sm transition-all', inBasket && 'ring-2 ring-primary/30')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground">{index + 1}.</span>
          <Badge variant="outline" className="text-[10px]">{QUESTION_TYPE_LABELS[question.questionType]}</Badge>
          <Badge variant="secondary" className="text-[10px]">{DIFFICULTY_LABELS[question.difficulty]}</Badge>
          <Badge variant="secondary" className="text-[10px]">{COGNITIVE_LEVEL_LABELS[question.cognitiveLevel]}</Badge>
          {question.isShared && showSource && <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">已共享</Badge>}
          <span className="flex-1" />
          <span className="text-[10px] text-muted-foreground">{question.score}分</span>
        </div>
        <p className="text-sm mb-2 leading-relaxed">{question.content}</p>
        {question.options?.map(opt => (
          <div key={opt.label} className="text-xs ml-4 mb-0.5 text-muted-foreground">
            {opt.label}. {opt.content}
          </div>
        ))}
        <div className="mt-2 px-2.5 py-1.5 rounded-md bg-emerald-50/80 text-[11px]">
          <span className="font-medium text-emerald-700">答案：</span>
          <span className="text-emerald-600">{question.answer}</span>
          {question.answerExplanation && <span className="text-muted-foreground ml-1">({question.answerExplanation})</span>}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1">
            {question.knowledgePoints.map(kp => <Badge key={kp} variant="outline" className="text-[10px]">{kp}</Badge>)}
          </div>
          {showSource && question.source && (
            <span className="text-[10px] text-muted-foreground">
              {question.source === 'manual' ? '教师录入' : question.source === 'ai_generated' ? 'AI命题' : '其他'}
            </span>
          )}
        </div>
        <div className="mt-3 pt-2 border-t flex justify-end">
          <Button size="sm" variant={inBasket ? 'destructive' : 'default'} className="h-7 text-xs gap-1" onClick={onToggleBasket}>
            {inBasket ? <><XCircle className="w-3 h-3" /> 移出试题篮</> : <><ShoppingCart className="w-3 h-3" /> 加入试题篮</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
