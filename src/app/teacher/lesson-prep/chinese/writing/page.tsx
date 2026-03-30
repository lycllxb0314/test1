/**
 * 习作专项工具页面
 * 
 * 全流程备课：情境创设、提纲、素材、分层任务、评改指导、常见问题
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  const [sampleFramework, setSampleFramework] = useState('');
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
      if (data.sampleFramework) setSampleFramework(data.sampleFramework);
      
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
    sampleFramework?: string;
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
  
  // 渲染提纲
  const renderOutline = () => {
    if (!outline) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">写作提纲</h3>
        {outline.structure.map((section, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">{section.section}</Badge>
                <span className="text-sm text-muted-foreground">{section.wordCount}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm mb-2">{section.content}</p>
              {section.keyPoints.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {section.keyPoints.map((point, i) => (
                    <li key={i}>• {point}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {outline.transitionPhrases.length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">过渡语句</div>
            <div className="flex flex-wrap gap-2">
              {outline.transitionPhrases.map((phrase, idx) => (
                <Badge key={idx} variant="secondary">{phrase}</Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };
  
  // 渲染好词好句
  const renderExpressions = () => {
    if (!expressions) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">好词好句素材库</h3>
        
        {expressions.words.length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">描写词语</div>
            <div className="flex flex-wrap gap-2">
              {expressions.words.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-sm py-1">
                  {item.word}
                </Badge>
              ))}
            </div>
          </Card>
        )}
        
        {expressions.sentences.length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">精彩句式</div>
            <div className="space-y-2">
              {expressions.sentences.slice(0, 5).map((item, idx) => (
                <div key={idx} className="p-2 bg-muted rounded text-sm">
                  {item.sentence}
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {expressions.paragraphs.length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">开头结尾范例</div>
            <div className="space-y-3">
              {expressions.paragraphs.map((item, idx) => (
                <div key={idx}>
                  <div className="text-xs text-muted-foreground mb-1">{item.analysis}</div>
                  <div className="p-2 bg-muted rounded text-sm">{item.content}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };
  
  // 渲染分层任务
  const renderTieredTasks = () => {
    if (tieredTasks.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">分层训练任务</h3>
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
                task.level === 'basic' && 'bg-green-50',
                task.level === 'intermediate' && 'bg-blue-50',
                task.level === 'advanced' && 'bg-purple-50'
              )}>
                <CardTitle className="text-base">{task.levelName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-medium">{task.task}</div>
                <div className="space-y-1">
                  {task.requirements.slice(0, 3).map((req, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                      {req}
                    </div>
                  ))}
                </div>
                {task.scaffold && (
                  <div className="p-2 bg-muted rounded text-xs">
                    支架提示：{task.scaffold}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  // 渲染评改指导
  const renderEvaluationGuide = () => {
    if (!evaluationGuide) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">评改指导</h3>
        
        {evaluationGuide.selfCheck.length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">学生自查清单</div>
            <div className="space-y-2">
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
          </Card>
        )}
        
        {evaluationGuide.teacherRubric.length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3">教师评价标准</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">维度</th>
                    <th className="text-left p-2">优秀</th>
                    <th className="text-left p-2">良好</th>
                    <th className="text-left p-2">待提高</th>
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
          </Card>
        )}
      </div>
    );
  };
  
  // 渲染常见问题
  const renderCommonIssues = () => {
    if (commonIssues.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">常见问题预设</h3>
        <div className="space-y-3">
          {commonIssues.map((issue, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="font-medium text-sm">{issue.issue}</div>
                  <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                    {issue.manifestation && (
                      <div><span className="font-medium">表现：</span>{issue.manifestation}</div>
                    )}
                    {issue.cause && (
                      <div><span className="font-medium">原因：</span>{issue.cause}</div>
                    )}
                    {issue.preventionStrategy && (
                      <div><span className="font-medium">预防：</span>{issue.preventionStrategy}</div>
                    )}
                    {issue.correctionGuide && (
                      <div><span className="font-medium">纠正：</span>{issue.correctionGuide}</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/lesson-prep/chinese">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-purple-500" />
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
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">单元主题</label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="如：第五单元"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">习作类型</label>
              <Select value={writingType} onValueChange={(v) => setWritingType(v as WritingType)}>
                <SelectTrigger>
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
                <SelectTrigger>
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
              />
            </div>
          </div>
          
          {/* 生成选项 */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'outline', label: '写作提纲' },
              { key: 'expressions', label: '好词好句' },
              { key: 'tieredTasks', label: '分层任务' },
              { key: 'evaluationGuide', label: '评改指导' },
              { key: 'issues', label: '常见问题' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={options[opt.key as keyof typeof options]}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, [opt.key]: checked }))
                  }
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={!unit.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                生成备课方案
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            生成后将自动保存到资源库
          </p>
        </CardContent>
      </Card>
      
      {/* Tab 切换 */}
      {(outline || expressions || tieredTasks.length > 0 || evaluationGuide || commonIssues.length > 0) && (
        <div className="flex gap-2 border-b pb-2">
          {[
            { key: 'outline', label: '写作提纲', show: outline },
            { key: 'expressions', label: '好词好句', show: expressions },
            { key: 'tasks', label: '分层任务', show: tieredTasks.length > 0 },
            { key: 'evaluation', label: '评改指导', show: evaluationGuide },
            { key: 'issues', label: '常见问题', show: commonIssues.length > 0 },
          ].filter(t => t.show).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'px-4 py-2 text-sm rounded-t transition-colors',
                activeTab === tab.key 
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      
      {/* 结果展示 */}
      {activeTab === 'outline' && renderOutline()}
      {activeTab === 'expressions' && renderExpressions()}
      {activeTab === 'tasks' && renderTieredTasks()}
      {activeTab === 'evaluation' && renderEvaluationGuide()}
      {activeTab === 'issues' && renderCommonIssues()}
    </div>
  );
}
