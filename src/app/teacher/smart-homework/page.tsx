/**
 * 智慧作业/练习 主页面
 *
 * 本体论推导功能设计：
 * - 管理对象：试题、试卷、细目表、题库
 * - 核心流程：需求对话→细目表确认→智能命题→选题组卷→排版预览
 * - 辅助功能：校本题库管理、试题篮
 *
 * @module pages/teacher/smart-homework
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FilePreviewDialogWithState } from '@/components/ui/file-preview-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Brain,
  BookOpen,
  ShoppingCart,
  FileText,
  Plus,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Download,
  Sparkles,
  Table as TableIcon,
  Library,
  ArrowRight,
  Lightbulb,
  Target,
  BarChart3,
  MessageSquare,
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
  QuestionOption,
} from '@/types/smart-homework';
import {
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  COGNITIVE_LEVEL_LABELS,
  EXAM_TYPE_LABELS,
} from '@/types/smart-homework';

// ==================== 常量 ====================

const SUBJECTS = ['语文', '数学', '英语'];
const GRADES = [1, 2, 3, 4, 5, 6];
const SEMESTERS = ['上册', '下册'] as const;

// ==================== 主组件 ====================

export default function SmartHomeworkPage() {
  const { user } = useAuth();

  // 主流程状态
  const [activeStep, setActiveStep] = useState<'chat' | 'spec' | 'generate' | 'compose' | 'bank'>('chat');

  // 基础参数
  const [subject, setSubject] = useState('语文');
  const [grade, setGrade] = useState(4);
  const [semester, setSemester] = useState<'上册' | '下册'>('上册');

  // 需求对话状态
  const [chatMessages, setChatMessages] = useState<DialogMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [inferredReqs, setInferredReqs] = useState<InferredRequirements | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 细目表状态
  const [specification, setSpecification] = useState<SpecificationTable | null>(null);
  const [specLoading, setSpecLoading] = useState(false);

  // 命题状态
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  // 试题篮状态
  const [basket, setBasket] = useState<BasketItem[]>([]);

  // 试卷状态
  const [paperTitle, setPaperTitle] = useState('');
  const [paperExamType, setPaperExamType] = useState<ExamType>('unit_test');
  const [saving, setSaving] = useState(false);
  const [savedPapers, setSavedPapers] = useState<ExamPaper[]>([]);

  // 题库浏览状态
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankFilter, setBankFilter] = useState<{
    questionType?: QuestionType;
    difficulty?: Difficulty;
    keyword?: string;
  }>({});

  // 预览状态
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<{ id: string; title: string; fileName: string; fileUrl: string } | null>(null);

  // ==================== 需求对话 ====================

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
      const response = await fetch('/api/smart-homework/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: chatMessages,
          currentRequirements: inferredReqs,
          subject,
          grade,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        const assistantMsg: DialogMessage = {
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, assistantMsg]);

        if (data.data.inferredRequirements) {
          setInferredReqs(data.data.inferredRequirements);
        }
      }
    } catch (err) {
      console.error('对话失败:', err);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, inferredReqs, subject, grade]);

  // ==================== 生成细目表 ====================

  const generateSpecification = useCallback(async () => {
    if (!inferredReqs) return;
    setSpecLoading(true);

    try {
      const response = await fetch('/api/smart-homework/specification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inferredReqs),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setSpecification(data.data);
        setActiveStep('spec');
      }
    } catch (err) {
      console.error('生成细目表失败:', err);
    } finally {
      setSpecLoading(false);
    }
  }, [inferredReqs]);

  // ==================== 智能命题 ====================

  const generateQuestions = useCallback(async () => {
    if (!specification) return;
    setGenLoading(true);

    try {
      const response = await fetch('/api/smart-homework/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specification),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setGeneratedQuestions(data.data);
        setActiveStep('generate');
      }
    } catch (err) {
      console.error('命题失败:', err);
    } finally {
      setGenLoading(false);
    }
  }, [specification]);

  // ==================== 试题篮操作 ====================

  const addToBasket = useCallback((question: Question, score?: number) => {
    setBasket(prev => {
      if (prev.some(item => item.questionId === question.id)) return prev;
      return [...prev, {
        questionId: question.id,
        question,
        addedAt: new Date().toISOString(),
        assignedScore: score || question.score,
        section: QUESTION_TYPE_LABELS[question.questionType],
      }];
    });
  }, []);

  const removeFromBasket = useCallback((questionId: string) => {
    setBasket(prev => prev.filter(item => item.questionId !== questionId));
  }, []);

  const updateBasketScore = useCallback((questionId: string, score: number) => {
    setBasket(prev => prev.map(item =>
      item.questionId === questionId ? { ...item, assignedScore: score } : item
    ));
  }, []);

  // ==================== 组卷排版 ====================

  const composeAndSave = useCallback(async () => {
    if (basket.length === 0 || !user) return;
    setSaving(true);

    try {
      const paperQuestions: PaperQuestion[] = basket.map((item, idx) => ({
        questionId: item.questionId,
        order: idx + 1,
        section: item.section,
        score: item.assignedScore,
        data: item.question,
      }));

      const totalScore = basket.reduce((s, item) => s + item.assignedScore, 0);

      const response = await fetch('/api/smart-homework/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paperTitle || `${subject}${grade}年级${semester}${EXAM_TYPE_LABELS[paperExamType]}`,
          subject,
          grade,
          semester,
          examType: paperExamType,
          totalScore,
          duration: specification?.duration || 60,
          specification: specification || {},
          questions: paperQuestions,
          layoutConfig: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 25, bottom: 20, left: 25, right: 25 },
            fontSize: 12,
            showAnswerSheet: true,
            columns: 1,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        // 预览
        if (data.data.paperHtml) {
          previewPaper(data.data.id, data.data.title, data.data.paperHtml);
        }
        loadPapers();
      }
    } catch (err) {
      console.error('组卷失败:', err);
    } finally {
      setSaving(false);
    }
  }, [basket, user, subject, grade, semester, paperTitle, paperExamType, specification]);

  // ==================== 预览试卷 ====================

  const previewPaper = useCallback(async (paperId: string, title: string, html?: string) => {
    if (html) {
      // 将HTML转为blob URL用于预览
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewResource({
        id: paperId,
        title: `${title}.html`,
        fileName: `${title}.html`,
        fileUrl: url,
      });
      setPreviewOpen(true);
      return;
    }

    // 从服务器获取
    try {
      const res = await fetch(`/api/smart-homework/papers?id=${paperId}`);
      const data = await res.json();
      if (data.success && data.data?.paperHtml) {
        const blob = new Blob([data.data.paperHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewResource({
          id: paperId,
          title: `${title}.html`,
          fileName: `${title}.html`,
          fileUrl: url,
        });
        setPreviewOpen(true);
      }
    } catch (err) {
      console.error('预览失败:', err);
    }
  }, []);

  // ==================== 题库浏览 ====================

  const loadBankQuestions = useCallback(async () => {
    setBankLoading(true);
    try {
      const params = new URLSearchParams({
        subject,
        grade: String(grade),
        semester,
        pageSize: '50',
      });
      if (bankFilter.questionType) params.set('questionType', bankFilter.questionType);
      if (bankFilter.difficulty) params.set('difficulty', bankFilter.difficulty);
      if (bankFilter.keyword) params.set('keyword', bankFilter.keyword);

      const response = await fetch(`/api/smart-homework/question-bank?${params}`);
      const data = await response.json();
      if (data.success && data.data) {
        setBankQuestions(data.data.items);
      }
    } catch (err) {
      console.error('加载题库失败:', err);
    } finally {
      setBankLoading(false);
    }
  }, [subject, grade, semester, bankFilter]);

  const loadPapers = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/smart-homework/papers');
      const data = await response.json();
      if (data.success && data.data) {
        setSavedPapers(data.data.items);
      }
    } catch (err) {
      console.error('加载试卷失败:', err);
    }
  }, [user]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  useEffect(() => {
    if (activeStep === 'bank') loadBankQuestions();
  }, [activeStep, loadBankQuestions]);

  // 自动滚动对话
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ==================== 渲染 ====================

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* 顶部标题与参数 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">智慧作业/练习</h1>
                <p className="text-sm text-muted-foreground">AI智能命题 · 校本题库 · 标准排版</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 试题篮按钮 */}
              <Button
                variant="outline"
                className="relative"
                onClick={() => setActiveStep('compose')}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                试题篮
                {basket.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {basket.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* 学科/年级/学期选择 */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(grade)} onValueChange={v => setGrade(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRADES.map(g => <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={v => setSemester(v as '上册' | '下册')}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 流程步骤指示器 */}
        <div className="flex items-center gap-2 mb-6 p-4 bg-card rounded-lg border">
          {[
            { key: 'chat', label: '需求对话', icon: MessageSquare },
            { key: 'spec', label: '细目表', icon: TableIcon },
            { key: 'generate', label: '智能命题', icon: Sparkles },
            { key: 'compose', label: '组卷排版', icon: FileText },
          ].map((step, idx) => (
            <React.Fragment key={step.key}>
              {idx > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              <button
                onClick={() => setActiveStep(step.key as typeof activeStep)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeStep === step.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <step.icon className="w-4 h-4" />
                {step.label}
              </button>
            </React.Fragment>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setActiveStep('bank')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeStep === 'bank'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Library className="w-4 h-4" />
            校本题库
          </button>
        </div>

        {/* ==================== 需求对话面板 ==================== */}
        {activeStep === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 对话区 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    需求对话
                  </CardTitle>
                  <CardDescription>
                    告诉我你想出什么样的试卷，我会帮你分析需求并生成命题双向细目表
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] mb-4 pr-4">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Lightbulb className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">试试说：「帮我出一份四年级语文上册第三单元测试卷」</p>
                        <p className="text-xs mt-1 opacity-60">我会用因果推理分析你的需求</p>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={cn(
                        'mb-4 flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}>
                        <div className={cn(
                          'max-w-[80%] rounded-lg px-4 py-3 text-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="描述你的命题需求..."
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={chatLoading}
                    />
                    <Button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {inferredReqs && inferredReqs.knowledgePoints.length > 0 && (
                    <div className="mt-4 flex justify-end">
                      <Button onClick={generateSpecification} disabled={specLoading}>
                        {specLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                        生成细目表
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 推断需求侧栏 */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    AI推断需求
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inferredReqs ? (
                    <>
                      <div className="text-sm">
                        <span className="text-muted-foreground">考试类型：</span>
                        <Badge variant="outline">{EXAM_TYPE_LABELS[inferredReqs.examType] || inferredReqs.examType}</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">知识点：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {inferredReqs.knowledgePoints.map(kp => (
                            <Badge key={kp} variant="secondary" className="text-xs">{kp}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">难度偏好：</span>
                        <Badge variant="outline">{DIFFICULTY_LABELS[inferredReqs.difficultyPreference]}</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">题型：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {inferredReqs.questionTypes.map(qt => (
                            <Badge key={qt} variant="secondary" className="text-xs">
                              {QUESTION_TYPE_LABELS[qt]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">总分：</span>{inferredReqs.totalScore}分
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">时长：</span>{inferredReqs.duration}分钟
                      </div>
                      {inferredReqs.reasoning && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="text-xs font-medium text-primary mb-1">因果推理</div>
                          <p className="text-xs text-muted-foreground">{inferredReqs.reasoning}</p>
                        </div>
                      )}
                      {inferredReqs.suggestions?.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-amber-600 mb-1">建议</div>
                          {inferredReqs.suggestions.map((s, i) => (
                            <p key={i} className="text-xs text-muted-foreground">- {s}</p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      开始对话后，AI会自动推断你的需求
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== 细目表面板 ==================== */}
        {activeStep === 'spec' && specification && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-primary" />
                  命题双向细目表
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveStep('chat')}>返回修改</Button>
                  <Button onClick={generateQuestions} disabled={genLoading}>
                    {genLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    确认并命题
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 细目表概览 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{specification.totalScore}</div>
                  <div className="text-xs text-muted-foreground">总分</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{specification.duration}</div>
                  <div className="text-xs text-muted-foreground">时长(分钟)</div>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {specification.questionAllocation.reduce((s, a) => s + a.count, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">总题数</div>
                </div>
              </div>

              {/* 难度分布 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">难度分布</h3>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                    <div key={d} className="flex-1 p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{Math.round(specification.difficultyDistribution[d] * 100)}%</div>
                      <div className="text-xs text-muted-foreground">{DIFFICULTY_LABELS[d]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 知识点×认知层次 矩阵 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">知识点 × 认知层次</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left font-medium">知识点</th>
                        <th className="p-2 text-center font-medium">权重</th>
                        {(['remember', 'understand', 'apply', 'analyze'] as CognitiveLevel[]).map(cl => (
                          <th key={cl} className="p-2 text-center font-medium text-xs">
                            {COGNITIVE_LEVEL_LABELS[cl]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {specification.knowledgeDimensions.map((kd, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">{kd.name}</td>
                          <td className="p-2 text-center">{kd.weight}%</td>
                          {(['remember', 'understand', 'apply', 'analyze'] as CognitiveLevel[]).map(cl => {
                            const alloc = kd.cognitiveLevels.find(c => c.level === cl);
                            return (
                              <td key={cl} className="p-2 text-center">
                                {alloc ? (
                                  <Badge variant="secondary" className="text-xs">
                                    {alloc.questionCount}题/{alloc.score}分
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 题型分配 */}
              <div>
                <h3 className="text-sm font-medium mb-2">题型分配</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specification.questionAllocation.map((alloc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                      <Badge className="min-w-[60px] justify-center">
                        {QUESTION_TYPE_LABELS[alloc.questionType]}
                      </Badge>
                      <div className="flex-1 text-sm">
                        <span>{alloc.count}题 × {alloc.scorePerQuestion}分 = {alloc.totalScore}分</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{DIFFICULTY_LABELS[alloc.difficulty]}</Badge>
                      <Badge variant="outline" className="text-xs">{COGNITIVE_LEVEL_LABELS[alloc.cognitiveLevel]}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== 智能命题面板 ==================== */}
        {activeStep === 'generate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                智能命题结果
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveStep('spec')}>返回细目表</Button>
                <Button onClick={() => setActiveStep('compose')} disabled={basket.length === 0}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  去组卷 ({basket.length}题已选)
                </Button>
              </div>
            </div>

            {generatedQuestions.length === 0 && !genLoading && (
              <Card className="p-8 text-center text-muted-foreground">
                暂无生成的题目，请先确认细目表后命题
              </Card>
            )}

            {genLoading && (
              <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>AI正在命题中...</p>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedQuestions.map((q, idx) => {
                const inBasket = basket.some(item => item.questionId === q.id);
                return (
                  <Card key={q.id} className={cn('transition-all', inBasket && 'ring-2 ring-primary')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{idx + 1}.</span>
                          <Badge variant="outline" className="text-xs">{QUESTION_TYPE_LABELS[q.questionType]}</Badge>
                          <Badge variant="secondary" className="text-xs">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                          <Badge variant="secondary" className="text-xs">{COGNITIVE_LEVEL_LABELS[q.cognitiveLevel]}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{q.score}分</span>
                      </div>
                      <p className="text-sm mb-2">{q.content}</p>
                      {q.options?.map(opt => (
                        <div key={opt.label} className="text-sm ml-4 mb-0.5">
                          {opt.label}. {opt.content}
                        </div>
                      ))}
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                        <span className="font-medium">答案：</span>{q.answer}
                        {q.answerExplanation && <span className="text-muted-foreground ml-2">({q.answerExplanation})</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-wrap gap-1">
                          {q.knowledgePoints.map(kp => (
                            <Badge key={kp} variant="outline" className="text-xs">{kp}</Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant={inBasket ? 'destructive' : 'default'}
                          onClick={() => inBasket ? removeFromBasket(q.id) : addToBasket(q)}
                        >
                          {inBasket ? (
                            <><XCircle className="w-3 h-3 mr-1" />移出</>
                          ) : (
                            <><ShoppingCart className="w-3 h-3 mr-1" />加入试题篮</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 组卷排版面板 ==================== */}
        {activeStep === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 试题篮列表 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    试题篮 ({basket.length}题)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {basket.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">试题篮为空</p>
                      <p className="text-xs">从智能命题结果或校本题库中添加试题</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {basket.map((item, idx) => (
                        <div key={item.questionId} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                          <span className="font-bold text-sm w-6">{idx + 1}.</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {QUESTION_TYPE_LABELS[item.question.questionType]}
                          </Badge>
                          <p className="text-sm flex-1 truncate">{item.question.content}</p>
                          <Input
                            type="number"
                            className="w-16 h-7 text-xs"
                            value={item.assignedScore}
                            onChange={e => updateBasketScore(item.questionId, Number(e.target.value))}
                            min={1}
                          />
                          <span className="text-xs text-muted-foreground">分</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive h-7 w-7 p-0"
                            onClick={() => removeFromBasket(item.questionId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      <div className="text-right text-sm font-medium pt-2 border-t">
                        总分：{basket.reduce((s, item) => s + item.assignedScore, 0)} 分
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 组卷设置 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">试卷信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">试卷标题</label>
                    <Input
                      value={paperTitle}
                      onChange={e => setPaperTitle(e.target.value)}
                      placeholder={`${subject}${grade}年级${semester}测试卷`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">试卷类型</label>
                    <Select value={paperExamType} onValueChange={v => setPaperExamType(v as ExamType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={composeAndSave}
                    disabled={basket.length === 0 || saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    排版生成试卷
                  </Button>
                </CardContent>
              </Card>

              {/* 已保存试卷 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">我的试卷</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedPapers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无试卷</p>
                  ) : (
                    <div className="space-y-2">
                      {savedPapers.slice(0, 5).map(paper => (
                        <div key={paper.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{paper.title}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {EXAM_TYPE_LABELS[paper.examType]}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => previewPaper(paper.id, paper.title, paper.paperHtml)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== 校本题库面板 ==================== */}
        {activeStep === 'bank' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" />
                校本题库
              </h2>
              <div className="flex gap-2">
                <Select
                  value={bankFilter.questionType || 'all'}
                  onValueChange={v => setBankFilter(prev => ({ ...prev, questionType: v === 'all' ? undefined : v as QuestionType }))}
                >
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="题型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部题型</SelectItem>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={bankFilter.difficulty || 'all'}
                  onValueChange={v => setBankFilter(prev => ({ ...prev, difficulty: v === 'all' ? undefined : v as Difficulty }))}
                >
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="难度" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部难度</SelectItem>
                    {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="w-40 h-8 text-xs"
                  placeholder="搜索题目..."
                  value={bankFilter.keyword || ''}
                  onChange={e => setBankFilter(prev => ({ ...prev, keyword: e.target.value || undefined }))}
                />
                <Button size="sm" onClick={loadBankQuestions} disabled={bankLoading}>
                  {bankLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '搜索'}
                </Button>
              </div>
            </div>

            {bankQuestions.length === 0 && !bankLoading && (
              <Card className="p-8 text-center text-muted-foreground">
                <Library className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">题库暂无题目</p>
                <p className="text-xs">教师可导入好题到校本题库，实现校内共享</p>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankQuestions.map((q, idx) => {
                const inBasket = basket.some(item => item.questionId === q.id);
                return (
                  <Card key={q.id} className={cn('transition-all', inBasket && 'ring-2 ring-primary')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{QUESTION_TYPE_LABELS[q.questionType]}</Badge>
                          <Badge variant="secondary" className="text-xs">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
                          <Badge variant="secondary" className="text-xs">{COGNITIVE_LEVEL_LABELS[q.cognitiveLevel]}</Badge>
                          {q.isShared && <Badge className="text-xs bg-green-100 text-green-700">已共享</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{q.score}分</span>
                      </div>
                      <p className="text-sm mb-2 line-clamp-3">{q.content}</p>
                      {q.options?.map(opt => (
                        <div key={opt.label} className="text-sm ml-4 mb-0.5">
                          {opt.label}. {opt.content}
                        </div>
                      ))}
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                        <span className="font-medium">答案：</span>{q.answer}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-muted-foreground">
                          来源: {q.source === 'manual' ? '教师录入' : q.source === 'ai_generated' ? 'AI命题' : '其他'}
                          {q.createdByName && ` · ${q.createdByName}`}
                        </div>
                        <Button
                          size="sm"
                          variant={inBasket ? 'destructive' : 'default'}
                          onClick={() => inBasket ? removeFromBasket(q.id) : addToBasket(q)}
                        >
                          {inBasket ? (
                            <><XCircle className="w-3 h-3 mr-1" />移出</>
                          ) : (
                            <><ShoppingCart className="w-3 h-3 mr-1" />加入试题篮</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
  );
}
