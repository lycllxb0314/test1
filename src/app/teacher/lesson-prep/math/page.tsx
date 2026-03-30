/**
 * 数学备课中心页面
 * 
 * 基于"本质-过程-思想-结构"四维分析，生成专业教学方案
 * 参考习作专项排版风格
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Calculator,
  Loader2,
  BookOpen,
  Target,
  Lightbulb,
  Network,
  Route,
  Sparkles,
  FolderOpen,
  CheckCircle,
  ChevronRight,
  Check,
  FileText,
  Users,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  MathTeachingContent, 
  EssenceAnalysis, 
  ProcessRestoration, 
  ThoughtRevelation, 
  StructureConnection, 
  TeachingPath,
  MathPrepPlan
} from '@/types/math-prep';

// ==================== 领域标签颜色 ====================

const DOMAIN_COLORS: Record<string, string> = {
  '数与代数': 'bg-blue-100 text-blue-700 border-blue-200',
  '图形与几何': 'bg-green-100 text-green-700 border-green-200',
  '统计与概率': 'bg-purple-100 text-purple-700 border-purple-200',
  '综合与实践': 'bg-orange-100 text-orange-700 border-orange-200',
};

// ==================== 主组件 ====================

export default function MathPrepPage() {
  // 选择状态
  const [grade, setGrade] = useState<number>(4);
  const [semester, setSemester] = useState<'上册' | '下册'>('上册');
  const [contents, setContents] = useState<MathTeachingContent[]>([]);
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [selectedContent, setSelectedContent] = useState<MathTeachingContent | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 结果状态
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<MathPrepPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'essence' | 'process' | 'thought' | 'structure' | 'path'>('essence');

  // 单元分组类型
  type UnitGroup = {
    unitName: string;
    unitOrder: number;
    domain: string;
    contents: MathTeachingContent[];
  };

  // 加载教学内容
  const loadContents = useCallback(async () => {
    setLoading(true);
    setContents([]);
    setUnitGroups([]);
    setSelectedContent(null);
    setResult(null);
    
    try {
      const response = await fetch(`/api/math-prep/contents?grade=${grade}&semester=${encodeURIComponent(semester)}&grouped=true`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setUnitGroups(data.data);
        if (data.data.length > 0) {
          setExpandedUnits(new Set([data.data[0].unitName]));
        }
      }
    } catch (error) {
      console.error('加载教学内容失败:', error);
    } finally {
      setLoading(false);
    }
  }, [grade, semester]);

  // 切换单元展开状态
  const toggleUnit = useCallback((unitName: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitName)) {
        newSet.delete(unitName);
      } else {
        newSet.add(unitName);
      }
      return newSet;
    });
  }, []);

  // 选择教学内容
  const selectContent = useCallback((content: MathTeachingContent) => {
    setSelectedContent(content);
    setResult(null);
    setActiveTab('essence');
  }, []);

  // 生成备课方案
  const handleGenerate = useCallback(async () => {
    if (!selectedContent) return;
    
    setGenerating(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/math-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: selectedContent.id,
          grade: selectedContent.grade,
          semester: selectedContent.semester,
          domain: selectedContent.domain,
          unitName: selectedContent.unitName,
          contentName: selectedContent.contentName,
          contentKey: selectedContent.contentKey,
        }),
      });
      
      if (!response.ok) throw new Error('生成失败');
      const data = await response.json();
      setResult(data.data);
      setActiveTab('essence');
    } catch (error) {
      console.error('生成备课方案失败:', error);
    } finally {
      setGenerating(false);
    }
  }, [selectedContent]);

  // 年级或学期变化时重新加载
  useEffect(() => {
    loadContents();
  }, [loadContents]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="p-6 max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center shadow-sm">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">数学备课中心</h1>
                <p className="text-sm text-muted-foreground">四维分析 · 教学路径</p>
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
          </div>
        </div>
        
        {/* 主内容区：左侧选择 + 右侧结果 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：教学内容选择 */}
          <div className="col-span-4">
            <Card className="border-none shadow-lg sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  选择教学内容
                </CardTitle>
                <CardDescription>选择年级学期，点击内容生成方案</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* 年级学期选择 */}
                <div className="p-4 border-b bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={String(grade)} onValueChange={(v) => setGrade(parseInt(v))}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(g => (
                          <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={semester} onValueChange={(v) => setSemester(v as '上册' | '下册')}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="上册">上册</SelectItem>
                        <SelectItem value="下册">下册</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 内容列表 */}
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : unitGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      暂无教学内容数据
                    </div>
                  ) : (
                    <div className="p-2">
                      {unitGroups.map((unit) => (
                        <Collapsible
                          key={unit.unitName}
                          open={expandedUnits.has(unit.unitName)}
                          onOpenChange={() => toggleUnit(unit.unitName)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className={cn(
                              "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors",
                              "w-full text-left"
                            )}>
                              <div className="flex items-center gap-2">
                                <ChevronRight className={cn(
                                  "w-4 h-4 transition-transform",
                                  expandedUnits.has(unit.unitName) && "rotate-90"
                                )} />
                                <span className="font-medium text-sm">{unit.unitName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", DOMAIN_COLORS[unit.domain] || '')}
                                >
                                  {unit.domain}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {unit.contents.length}
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-6 pr-2 pb-2 space-y-1">
                              {unit.contents.map((content) => (
                                <button
                                  key={content.id}
                                  onClick={() => selectContent(content)}
                                  className={cn(
                                    "w-full text-left p-3 rounded-lg transition-all",
                                    "hover:bg-blue-50 hover:shadow-sm",
                                    selectedContent?.id === content.id && "bg-blue-100 border border-blue-300 shadow-sm"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{content.contentName}</div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {content.lessonType}
                                        </Badge>
                                        {content.coreCompetencies?.slice(0, 2).map((c, i) => (
                                          <span key={i} className="text-xs text-muted-foreground">
                                            {c}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    {selectedContent?.id === content.id && (
                                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* 右侧：选中内容和生成区域 */}
          <div className="col-span-8 space-y-4">
            {/* 选中的内容信息 */}
            {selectedContent && (
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedContent.contentName}
                        <Badge 
                          variant="outline" 
                          className={DOMAIN_COLORS[selectedContent.domain] || ''}
                        >
                          {selectedContent.domain}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {selectedContent.unitName} · {selectedContent.grade}年级{selectedContent.semester} · {selectedContent.lessonType}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* 核心素养 */}
                  {selectedContent.coreCompetencies && selectedContent.coreCompetencies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.coreCompetencies.map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* 前置知识和后续扩展 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="text-xs font-medium text-blue-700 mb-1">前置知识</div>
                      <div className="text-sm text-blue-600">
                        {selectedContent.priorKnowledge?.join('、') || '无'}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                      <div className="text-xs font-medium text-green-700 mb-1">后续扩展</div>
                      <div className="text-sm text-green-600">
                        {selectedContent.subsequentExtension?.join('、') || '无'}
                      </div>
                    </div>
                  </div>
                  
                  {/* 四维分析说明 */}
                  <div className="p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100">
                    <div className="text-xs font-medium text-purple-700 mb-2">四维分析框架</div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-center">
                      <div className="p-2 bg-white rounded border">
                        <Target className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <div className="font-medium">本质挖掘</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-green-500" />
                        <div className="font-medium">过程还原</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <Lightbulb className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                        <div className="font-medium">思想显影</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <Network className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                        <div className="font-medium">结构贯通</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成备课方案...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成备课方案
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* 未选择提示 */}
            {!selectedContent && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">选择教学内容</h3>
                  <p className="text-sm text-muted-foreground">
                    请从左侧选择一个教学内容，开始生成备课方案
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Tab 切换 */}
            {result && (
              <div className="flex items-center gap-2 border-b pb-2">
                {[
                  { key: 'essence', label: '本质挖掘', icon: Target, color: 'blue' },
                  { key: 'process', label: '过程还原', icon: BookOpen, color: 'green' },
                  { key: 'thought', label: '思想显影', icon: Lightbulb, color: 'purple' },
                  { key: 'structure', label: '结构贯通', icon: Network, color: 'orange' },
                  { key: 'path', label: '教学路径', icon: Route, color: 'rose' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm rounded-t transition-colors',
                      activeTab === tab.key 
                        ? `bg-${tab.color}-50 text-${tab.color}-700 border-b-2 border-${tab.color}-500` 
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
            {result && (
              <div className="space-y-4">
                {activeTab === 'essence' && <EssenceCard essence={result.essence} />}
                {activeTab === 'process' && <ProcessCard process={result.process} />}
                {activeTab === 'thought' && <ThoughtCard thought={result.thought} />}
                {activeTab === 'structure' && <StructureCard structure={result.structure} />}
                {activeTab === 'path' && <TeachingPathCard teachingPath={result.teachingPath} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 子组件 ====================

/** 本质挖掘卡片 */
function EssenceCard({ essence }: { essence: EssenceAnalysis }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-blue-600" />
          本质挖掘
        </CardTitle>
        <CardDescription>知识的数学本质与核心概念</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* 核心定义 */}
        <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
          <div className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            核心定义
          </div>
          <p className="text-sm leading-relaxed">{essence.conceptCore.definition}</p>
        </div>
        
        {/* 本质属性 */}
        <div className="p-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 rounded-lg border border-cyan-100">
          <div className="text-sm font-medium text-cyan-700 mb-3">本质属性</div>
          <div className="flex flex-wrap gap-2">
            {essence.conceptCore.essentialAttributes.map((attr, i) => (
              <Badge key={i} className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">{attr}</Badge>
            ))}
          </div>
        </div>
        
        {/* 核心要素 */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg border border-indigo-100">
          <div className="text-sm font-medium text-indigo-700 mb-3">核心要素</div>
          <div className="flex flex-wrap gap-2">
            {essence.connotationAnalysis.coreElements.map((elem, i) => (
              <Badge key={i} variant="outline" className="bg-white border-indigo-200">{elem}</Badge>
            ))}
          </div>
        </div>
        
        {/* 理解难点 */}
        {essence.connotationAnalysis.difficultPoints.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-lg border border-amber-100">
            <div className="text-sm font-medium text-amber-700 mb-3">理解难点</div>
            <div className="space-y-2">
              {essence.connotationAnalysis.difficultPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 适用范围 */}
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="text-sm font-medium text-muted-foreground mb-2">适用范围</div>
          <p className="text-sm">{essence.extensionDefinition.scope}</p>
        </div>
        
        {/* 正反例辨析 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
            <div className="text-xs font-medium text-green-700 mb-2">正例</div>
            <div className="space-y-2">
              {essence.examples.positiveExamples.slice(0, 2).map((ex, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">{ex.content}</span>
                  <p className="text-green-600 mt-0.5">{ex.explanation}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
            <div className="text-xs font-medium text-red-700 mb-2">反例</div>
            <div className="space-y-2">
              {essence.examples.negativeExamples.slice(0, 2).map((ex, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">{ex.content}</span>
                  <p className="text-red-600 mt-0.5">{ex.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** 过程还原卡片 */
function ProcessCard({ process }: { process: ProcessRestoration }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-green-600" />
          过程还原
        </CardTitle>
        <CardDescription>知识形成过程与认知路径</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* 知识起源 */}
        <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
          <div className="text-sm font-medium text-green-700 mb-2">知识起源</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">历史背景：</span>
              <span>{process.knowledgeOrigin.historicalBackground}</span>
            </div>
            <div>
              <span className="text-muted-foreground">产生原因：</span>
              <span>{process.knowledgeOrigin.causeOfEmergence}</span>
            </div>
          </div>
        </div>
        
        {/* 思考过程 */}
        <div className="p-4 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 rounded-lg border border-teal-100">
          <div className="text-sm font-medium text-teal-700 mb-3">思考过程（再创造路径）</div>
          <div className="space-y-2">
            {process.recreationDesign.thinkingProcess.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                  {i + 1}
                </div>
                <div className="flex-1 p-2 bg-white rounded border border-teal-100 text-sm">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 探究活动 */}
        <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-lg border border-emerald-100">
          <div className="text-sm font-medium text-emerald-700 mb-3">探究活动设计</div>
          <div className="flex flex-wrap gap-2">
            {process.recreationDesign.inquiryActivities.map((activity, i) => (
              <Badge key={i} variant="outline" className="bg-white border-emerald-200 py-1.5">{activity}</Badge>
            ))}
          </div>
        </div>
        
        {/* 引导策略 */}
        {process.recreationDesign.guidanceStrategies.length > 0 && (
          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200">
            <div className="text-xs font-medium text-amber-700 mb-2">💡 引导策略</div>
            <div className="flex flex-wrap gap-2">
              {process.recreationDesign.guidanceStrategies.map((strategy, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{strategy}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** 思想显影卡片 */
function ThoughtCard({ thought }: { thought: ThoughtRevelation }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          思想显影
        </CardTitle>
        <CardDescription>蕴含的数学思想方法</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* 数学思想 */}
        <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100">
          <div className="text-sm font-medium text-purple-700 mb-3">隐含的数学思想</div>
          <div className="flex flex-wrap gap-2">
            {thought.implicitThoughts.map((t, i) => (
              <Badge 
                key={i} 
                className={t.level === 'core' 
                  ? 'bg-purple-500 text-white hover:bg-purple-500' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                }
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* 主线思想 */}
        <div className="p-4 bg-gradient-to-r from-violet-50/50 to-purple-50/50 rounded-lg border border-violet-100">
          <div className="text-sm font-medium text-violet-700 mb-2">主线思想</div>
          <p className="text-sm">{thought.thoughtSystem.mainThread}</p>
        </div>
        
        {/* 渗透节点 */}
        <div className="p-4 bg-gradient-to-r from-pink-50/50 to-rose-50/50 rounded-lg border border-pink-100">
          <div className="text-sm font-medium text-pink-700 mb-3">思想渗透节点</div>
          <div className="space-y-3">
            {thought.infiltrationPoints.map((point, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-pink-100">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs border-pink-300">{point.teachingPhase}</Badge>
                  <Badge className="text-xs bg-pink-100 text-pink-700">{point.thought}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{point.method}</p>
                {point.script && (
                  <p className="text-xs text-pink-600 mt-1 italic">"{point.script}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** 结构贯通卡片 */
function StructureCard({ structure }: { structure: StructureConnection }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="w-5 h-5 text-orange-600" />
          结构贯通
        </CardTitle>
        <CardDescription>知识结构网络与关联</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* 纵向连接 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">前</span>
              前置知识
            </div>
            <p className="text-sm mb-2">{structure.verticalConnection.priorLink.content}</p>
            <div className="text-xs text-muted-foreground">
              衔接点：{structure.verticalConnection.priorLink.connectionPoint}
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
            <div className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs">后</span>
              后续延伸
            </div>
            <p className="text-sm mb-2">{structure.verticalConnection.subsequentLink.content}</p>
            <div className="text-xs text-muted-foreground">
              延伸方向：{structure.verticalConnection.subsequentLink.extensionDirection}
            </div>
          </div>
        </div>
        
        {/* 发展脉络 */}
        <div className="p-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 rounded-lg border border-amber-100">
          <div className="text-sm font-medium text-amber-700 mb-2">发展脉络</div>
          <p className="text-sm">{structure.verticalConnection.developmentContext}</p>
        </div>
        
        {/* 横向联系 */}
        {structure.horizontalConnection.relatedKnowledge.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 rounded-lg border border-teal-100">
            <div className="text-sm font-medium text-teal-700 mb-3">相关知识</div>
            <div className="space-y-2">
              {structure.horizontalConnection.relatedKnowledge.map((rel, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{rel.content}</Badge>
                  <span className="text-xs text-muted-foreground">共同点：{rel.commonality}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 方法迁移 */}
        {structure.horizontalConnection.methodTransfer.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100">
            <div className="text-sm font-medium text-orange-700 mb-3">方法迁移</div>
            <div className="flex flex-wrap gap-2">
              {structure.horizontalConnection.methodTransfer.map((method, i) => (
                <Badge key={i} variant="outline" className="bg-white border-orange-200">{method}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* 上位概念 */}
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="text-sm font-medium text-muted-foreground mb-2">上位概念</div>
          <p className="text-sm">{structure.unifiedFramework.superordinateConcept}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** 教学路径卡片 */
function TeachingPathCard({ teachingPath }: { teachingPath: TeachingPath }) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="w-5 h-5 text-rose-600" />
          教学路径
        </CardTitle>
        <CardDescription>基于四维分析的教学实施建议</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* 教学目标 */}
        <div className="p-4 bg-gradient-to-r from-rose-50/50 to-pink-50/50 rounded-lg border border-rose-100">
          <div className="text-sm font-medium text-rose-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            教学目标
          </div>
          <div className="space-y-2">
            {teachingPath.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-white rounded border border-rose-100">
                <Badge 
                  className={cn(
                    "shrink-0",
                    obj.dimension === 'knowledge' && 'bg-blue-100 text-blue-700',
                    obj.dimension === 'ability' && 'bg-green-100 text-green-700',
                    obj.dimension === 'emotion' && 'bg-purple-100 text-purple-700',
                    obj.dimension === 'thinking' && 'bg-orange-100 text-orange-700'
                  )}
                >
                  {obj.dimension === 'knowledge' ? '知识' : 
                   obj.dimension === 'ability' ? '能力' : 
                   obj.dimension === 'emotion' ? '情感' : '思维'}
                </Badge>
                <div className="text-sm">
                  <span className="font-medium">{obj.content}</span>
                  {obj.behavior && <span className="text-muted-foreground">：{obj.behavior}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 重难点 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-3">教学重点</div>
            <div className="space-y-2">
              {teachingPath.keyDifficulty.keyPoints.map((point, i) => (
                <div key={i} className="text-sm p-2 bg-white rounded border border-blue-100">
                  <div className="font-medium">{point.content}</div>
                  <div className="text-xs text-blue-600 mt-1">策略：{point.strategy}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100">
            <div className="text-sm font-medium text-orange-700 mb-3">教学难点</div>
            <div className="space-y-2">
              {teachingPath.keyDifficulty.difficulties.map((diff, i) => (
                <div key={i} className="text-sm p-2 bg-white rounded border border-orange-100">
                  <div className="font-medium">{diff.content}</div>
                  <div className="text-xs text-orange-600 mt-1">突破：{diff.breakthrough}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 教学环节 */}
        <div className="p-4 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 rounded-lg border border-teal-100">
          <div className="text-sm font-medium text-teal-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            教学环节
          </div>
          <div className="space-y-3">
            {teachingPath.phases.map((phase, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-teal-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                    {i + 1}
                  </div>
                  <Badge variant="default" className="text-xs bg-teal-600">{phase.name}</Badge>
                  <span className="text-xs text-muted-foreground">约{phase.duration}分钟</span>
                </div>
                <p className="text-sm text-muted-foreground">{phase.activities.join('、')}</p>
                {phase.designIntent && (
                  <p className="text-xs text-teal-600 mt-1">设计意图：{phase.designIntent}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 关键问题 */}
        {teachingPath.keyQuestionDesign.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100">
            <div className="text-sm font-medium text-purple-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              关键问题设计
            </div>
            <div className="space-y-2">
              {teachingPath.keyQuestionDesign.slice(0, 4).map((q, i) => (
                <div key={i} className="p-2 bg-white rounded border border-purple-100">
                  <div className="text-sm font-medium">{q.question}</div>
                  <div className="text-xs text-muted-foreground mt-1">目的：{q.purpose}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 学生活动 */}
        {teachingPath.studentActivityDesign.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
            <div className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              学生活动设计
            </div>
            <div className="grid grid-cols-2 gap-2">
              {teachingPath.studentActivityDesign.slice(0, 4).map((a, i) => (
                <div key={i} className="p-2 bg-white rounded border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {a.form === 'individual' ? '个人' : 
                       a.form === 'pair' ? '同桌' : 
                       a.form === 'group' ? '小组' : '全班'}
                    </Badge>
                  </div>
                  <div className="text-sm">{a.activity}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
