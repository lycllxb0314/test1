/**
 * 习作专项工具页面
 * 
 * 全流程备课：情境创设、提纲、素材、分层任务、评改指导、常见问题
 * UI风格与生字专项、朗读教学保持一致
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  PenTool,
  Loader2,
  BookOpen,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Save,
  FolderOpen,
  Check,
  FileText,
  Sparkles,
  Target,
  MessageCircle,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  WritingType,
  WritingOutline,
  GoodExpressions,
  TieredTask,
  EvaluationGuide,
  WritingIssue,
} from '@/types/chinese-prep';

// ==================== 配置 ====================

const WRITING_TYPES: { value: WritingType; label: string }[] = [
  { value: '写人', label: '写人' },
  { value: '写事', label: '写事' },
  { value: '写景', label: '写景' },
  { value: '状物', label: '状物' },
  { value: '想象', label: '想象' },
  { value: '应用文', label: '应用文' },
];

// ==================== 主组件 ====================

export default function WritingPage() {
  // 输入状态
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [writingType, setWritingType] = useState<WritingType>('写事');
  const [grade, setGrade] = useState<number>(4);
  const [options, setOptions] = useState({
    outline: true,
    expressions: true,
    tieredTasks: true,
    evaluationGuide: true,
    issues: true,
  });
  
  // 结果状态
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<WritingOutline | null>(null);
  const [expressions, setExpressions] = useState<GoodExpressions | null>(null);
  const [tieredTasks, setTieredTasks] = useState<TieredTask[]>([]);
  const [evaluationGuide, setEvaluationGuide] = useState<EvaluationGuide | null>(null);
  const [commonIssues, setCommonIssues] = useState<WritingIssue[]>([]);
  const [activeTab, setActiveTab] = useState<'outline' | 'expressions' | 'tasks' | 'evaluation' | 'issues'>('outline');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 生成备课方案
  const handleGenerate = async () => {
    if (!unit.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chinese-prep/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit,
          writingType,
          grade,
          topic,
          generateOptions: options,
        }),
      });
      
      const data = await response.json();
      
      if (data.outline) setOutline(data.outline);
      if (data.expressions) setExpressions(data.expressions);
      if (data.tieredTasks) setTieredTasks(data.tieredTasks);
      if (data.evaluationGuide) setEvaluationGuide(data.evaluationGuide);
      if (data.commonIssues) setCommonIssues(data.commonIssues);
      
      // 自动保存到资源库
      if (data.outline || data.expressions || data.tieredTasks) {
        saveToResourceInternal(data);
      }
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 内部保存函数（生成后自动调用）
  const saveToResourceInternal = async (result: {
    outline?: WritingOutline;
    expressions?: GoodExpressions;
    tieredTasks?: TieredTask[];
    evaluationGuide?: EvaluationGuide;
    commonIssues?: WritingIssue[];
  }) => {
    if (!unit.trim()) return;
    
    try {
      const res = await fetch('/api/teaching-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonInfo: {
            title: topic || `习作：${unit}`,
            grade,
            writingType,
            unit,
          },
          writingContent: result,
        }),
      });
      
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('自动保存失败:', e);
    }
  };
  
  // 渲染写作提纲
  const renderOutline = () => {
    if (!outline) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="w-5 h-5 text-purple-600" />
            写作提纲
          </CardTitle>
          <CardDescription>结构化写作指导，帮助学生理清思路</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {outline.structure.map((section, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
                {idx + 1}
              </div>
              <div className="flex-1 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-white">{section.section}</Badge>
                  <span className="text-xs text-muted-foreground">{section.wordCount}</span>
                </div>
                <p className="text-sm mb-2">{section.content}</p>
                {section.keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {section.keyPoints.map((point, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{point}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {outline.transitionPhrases.length > 0 && (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-700 mb-2">过渡语句</div>
              <div className="flex flex-wrap gap-2">
                {outline.transitionPhrases.map((phrase, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white">{phrase}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // 渲染好词好句
  const renderExpressions = () => {
    if (!expressions) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-blue-600" />
            好词好句素材库
          </CardTitle>
          <CardDescription>丰富学生写作语言，提升表达水平</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {expressions.words.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 rounded-lg border border-amber-100">
              <div className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                描写词语
              </div>
              <div className="flex flex-wrap gap-2">
                {expressions.words.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="py-1.5 px-3 bg-white hover:bg-amber-50 cursor-default">
                    {item.word}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {expressions.sentences.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                精彩句式
              </div>
              <div className="space-y-3">
                {expressions.sentences.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-green-100">
                    <p className="text-sm mb-2">{item.sentence}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{item.technique}</Badge>
                      {item.imitation && (
                        <span className="text-green-600">仿写：{item.imitation}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {expressions.paragraphs.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100">
              <div className="text-sm font-medium text-purple-700 mb-3">开头结尾范例</div>
              <div className="space-y-3">
                {expressions.paragraphs.map((item, idx) => (
                  <div key={idx}>
                    <div className="text-xs text-muted-foreground mb-1">{item.analysis}</div>
                    <div className="p-3 bg-white rounded-lg border border-purple-100 text-sm">{item.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // 渲染分层任务
  const renderTieredTasks = () => {
    if (tieredTasks.length === 0) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-green-600" />
            分层训练任务
          </CardTitle>
          <CardDescription>因材施教，满足不同层次学生需求</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tieredTasks.map((task, idx) => (
              <Card key={idx} className={cn(
                'overflow-hidden',
                task.level === 'basic' && 'border-green-200',
                task.level === 'intermediate' && 'border-blue-200',
                task.level === 'advanced' && 'border-purple-200'
              )}>
                <CardHeader className={cn(
                  'pb-2',
                  task.level === 'basic' && 'bg-gradient-to-r from-green-100 to-emerald-100',
                  task.level === 'intermediate' && 'bg-gradient-to-r from-blue-100 to-indigo-100',
                  task.level === 'advanced' && 'bg-gradient-to-r from-purple-100 to-pink-100'
                )}>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className={cn(
                      'w-6 h-6 rounded-full text-white text-xs flex items-center justify-center',
                      task.level === 'basic' && 'bg-green-500',
                      task.level === 'intermediate' && 'bg-blue-500',
                      task.level === 'advanced' && 'bg-purple-500'
                    )}>
                      {idx + 1}
                    </span>
                    {task.levelName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-medium">{task.task}</div>
                  <div className="space-y-1.5">
                    {task.requirements.slice(0, 3).map((req, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                  {task.scaffold && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-700">
                      💡 支架：{task.scaffold}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染评改指导
  const renderEvaluationGuide = () => {
    if (!evaluationGuide) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-orange-600" />
            评改指导
          </CardTitle>
          <CardDescription>自评、互评、师评三位一体</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {evaluationGuide.selfCheck.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                学生自查清单
              </div>
              <div className="space-y-3">
                {evaluationGuide.selfCheck.map((item, idx) => (
                  <div key={idx}>
                    <div className="text-xs font-medium text-muted-foreground mb-1">{item.aspect}</div>
                    <div className="space-y-1">
                      {item.questions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-muted-foreground" />
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {evaluationGuide.teacherRubric.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3">教师评价标准</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="text-left p-2 font-medium">维度</th>
                      <th className="text-left p-2 font-medium text-green-600">优秀</th>
                      <th className="text-left p-2 font-medium text-blue-600">良好</th>
                      <th className="text-left p-2 font-medium text-orange-600">待提高</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationGuide.teacherRubric.map((item, idx) => (
                      <tr key={idx} className="border-b border-green-100">
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
        </CardContent>
      </Card>
    );
  };
  
  // 渲染常见问题
  const renderCommonIssues = () => {
    if (commonIssues.length === 0) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            常见问题预设
          </CardTitle>
          <CardDescription>提前预判，精准指导</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {commonIssues.map((issue, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="font-medium text-sm text-orange-700">{issue.issue}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {issue.manifestation && (
                        <div className="p-2 bg-white rounded border">
                          <span className="font-medium text-orange-600">表现：</span>
                          {issue.manifestation}
                        </div>
                      )}
                      {issue.cause && (
                        <div className="p-2 bg-white rounded border">
                          <span className="font-medium text-red-600">原因：</span>
                          {issue.cause}
                        </div>
                      )}
                      {issue.preventionStrategy && (
                        <div className="p-2 bg-white rounded border">
                          <span className="font-medium text-green-600">预防：</span>
                          {issue.preventionStrategy}
                        </div>
                      )}
                      {issue.correctionGuide && (
                        <div className="p-2 bg-white rounded border">
                          <span className="font-medium text-blue-600">纠正：</span>
                          {issue.correctionGuide}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep/chinese">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center shadow-sm">
                <PenTool className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">习作专项</h1>
                <p className="text-sm text-muted-foreground">全流程备课系统</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/teacher/lesson-prep/my-resources">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                我的资源库
              </Button>
            </Link>
            {saveSuccess && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Check className="w-3 h-3 mr-1" />
                已保存
              </Badge>
            )}
          </div>
        </div>
        
        {/* 输入区域 */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              设置习作信息
            </CardTitle>
            <CardDescription>选择年级和习作类型，输入单元主题</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">单元主题</label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="如：第五单元"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">习作类型</label>
                <Select value={writingType} onValueChange={(v) => setWritingType(v as WritingType)}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WRITING_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">年级</label>
                <Select value={String(grade)} onValueChange={(v) => setGrade(parseInt(v))}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">具体题目（可选）</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="如：我的心爱之物"
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>
            
            {/* 生成选项 */}
            <div className="flex flex-wrap gap-4 pt-2 border-t">
              {[
                { key: 'outline', label: '写作提纲' },
                { key: 'expressions', label: '好词好句' },
                { key: 'tieredTasks', label: '分层任务' },
                { key: 'evaluationGuide', label: '评改指导' },
                { key: 'issues', label: '常见问题' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={options[opt.key as keyof typeof options]}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, [opt.key]: checked }))
                    }
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={!unit.trim() || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成习作备课方案...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成备课方案
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              生成后将自动保存到资源库
            </p>
          </CardContent>
        </Card>
        
        {/* Tab 切换 */}
        {(outline || expressions || tieredTasks.length > 0 || evaluationGuide || commonIssues.length > 0) && (
          <div className="flex gap-2 border-b pb-2">
            {[
              { key: 'outline', label: '写作提纲', show: outline, icon: ListOrdered },
              { key: 'expressions', label: '好词好句', show: expressions, icon: Sparkles },
              { key: 'tasks', label: '分层任务', show: tieredTasks.length > 0, icon: Users },
              { key: 'evaluation', label: '评改指导', show: evaluationGuide, icon: Target },
              { key: 'issues', label: '常见问题', show: commonIssues.length > 0, icon: AlertCircle },
            ].filter(t => t.show).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm rounded-t transition-colors',
                  activeTab === tab.key 
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {/* 结果展示 */}
        <div className="space-y-4">
          {activeTab === 'outline' && renderOutline()}
          {activeTab === 'expressions' && renderExpressions()}
          {activeTab === 'tasks' && renderTieredTasks()}
          {activeTab === 'evaluation' && renderEvaluationGuide()}
          {activeTab === 'issues' && renderCommonIssues()}
        </div>
      </div>
    </div>
  );
}
