'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, BookOpen, Target, Lightbulb, Network, Route, Sparkles, ArrowLeft } from 'lucide-react';
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

// 领域标签颜色映射
const domainColorMap: Record<string, string> = {
  '数与代数': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  '图形与几何': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  '统计与概率': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  '综合与实践': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export default function MathPrepPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [contents, setContents] = useState<MathTeachingContent[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MathPrepPlan | null>(null);

  // 年级选项
  const gradeOptions = [
    { value: '1', label: '一年级' },
    { value: '2', label: '二年级' },
    { value: '3', label: '三年级' },
    { value: '4', label: '四年级' },
    { value: '5', label: '五年级' },
    { value: '6', label: '六年级' },
  ];

  // 学期选项
  const semesterOptions = [
    { value: '上册', label: '上册' },
    { value: '下册', label: '下册' },
  ];

  // 从已加载的内容中提取唯一值
  const uniqueDomains = [...new Set(contents.map(c => c.domain))];
  const uniqueUnits = [...new Set(contents.filter(c => selectedDomain === 'all' || !selectedDomain || c.domain === selectedDomain).map(c => c.unitName))];

  // 加载教学内容
  const loadContents = useCallback(async (grade: number, semester: string) => {
    setIsLoadingContents(true);
    setContents([]);
    setSelectedDomain('all');
    setSelectedUnit('all');
    setSelectedContent('');
    setResult(null);
    
    try {
      const response = await fetch(`/api/math-prep/contents?grade=${grade}&semester=${encodeURIComponent(semester)}`);
      if (!response.ok) throw new Error('加载失败');
      const data = await response.json();
      setContents(data.data || []);
    } catch (error) {
      console.error('加载教学内容失败:', error);
    } finally {
      setIsLoadingContents(false);
    }
  }, []);

  // 年级或学期变化时重新加载
  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
    if (value && selectedSemester) {
      loadContents(parseInt(value), selectedSemester);
    }
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    if (selectedGrade && value) {
      loadContents(parseInt(selectedGrade), value);
    }
  };

  // 生成备课方案
  const handleGenerate = async () => {
    if (!selectedContent) return;
    
    setIsGenerating(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/math-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: selectedContent }),
      });
      
      if (!response.ok) throw new Error('生成失败');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('生成备课方案失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 当前选中的内容详情
  const selectedContentDetail = contents.find(c => c.id === selectedContent);

  return (
    <div className="p-6 space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/lesson-prep">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回备课中心
          </Button>
        </Link>
      </div>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数学备课中心</h1>
          <p className="text-muted-foreground mt-1">
            基于"本质-过程-思想-结构"四维分析，生成专业教学方案
          </p>
        </div>
      </div>

      {/* 选择区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">选择教学内容</CardTitle>
          <CardDescription>选择年级、学期和具体教学内容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* 年级选择 */}
            <div className="space-y-2">
              <Label>年级</Label>
              <Select value={selectedGrade} onValueChange={handleGradeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 学期选择 */}
            <div className="space-y-2">
              <Label>学期</Label>
              <Select value={selectedSemester} onValueChange={handleSemesterChange} disabled={!selectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学期" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 领域选择 */}
            <div className="space-y-2">
              <Label>领域</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={!selectedGrade || isLoadingContents}>
                <SelectTrigger>
                  <SelectValue placeholder="全部领域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部领域</SelectItem>
                  {uniqueDomains.map(domain => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 单元选择 */}
            <div className="space-y-2">
              <Label>单元</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedGrade || isLoadingContents}>
                <SelectTrigger>
                  <SelectValue placeholder="全部单元" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部单元</SelectItem>
                  {uniqueUnits.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 教学内容选择 */}
            <div className="space-y-2">
              <Label>教学内容</Label>
              <Select value={selectedContent} onValueChange={setSelectedContent} disabled={!selectedGrade || isLoadingContents}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingContents ? "加载中..." : "选择内容"} />
                </SelectTrigger>
                <SelectContent>
                  {contents
                    .filter(c => selectedDomain === 'all' || !selectedDomain || c.domain === selectedDomain)
                    .filter(c => selectedUnit === 'all' || !selectedUnit || c.unitName === selectedUnit)
                    .map(content => (
                      <SelectItem key={content.id} value={content.id}>
                        {content.contentName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 当前选择的内容详情 */}
          {selectedContentDetail && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={domainColorMap[selectedContentDetail.domain] || ''}>
                  {selectedContentDetail.domain}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedContentDetail.unitName}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm font-medium">
                  {selectedContentDetail.contentName}
                </span>
                <Badge variant="outline">{selectedContentDetail.lessonType}</Badge>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>前置知识: {selectedContentDetail.priorKnowledge?.join('、') || '无'}</span>
                <span>后续扩展: {selectedContentDetail.subsequentExtension?.join('、') || '无'}</span>
              </div>
            </div>
          )}

          {/* 生成按钮 */}
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedContent || isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在生成...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  生成教学方案
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果区域 */}
      {result && (
        <div className="space-y-4">
          {/* 四维分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 本质挖掘 */}
            <EssenceCard essence={result.essence} />
            
            {/* 过程还原 */}
            <ProcessCard process={result.process} />
            
            {/* 思想显影 */}
            <ThoughtCard thought={result.thought} />
            
            {/* 结构贯通 */}
            <StructureCard structure={result.structure} />
          </div>

          {/* 教学路径 */}
          <TeachingPathCard teachingPath={result.teachingPath} />
        </div>
      )}
    </div>
  );
}

// ==================== 子组件 ====================

/** 本质挖掘卡片 */
function EssenceCard({ essence }: { essence: EssenceAnalysis }) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-blue-500" />
          本质挖掘
        </CardTitle>
        <CardDescription>知识的数学本质与核心概念</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">核心定义</h4>
          <p className="text-sm">{essence.conceptCore.definition}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">本质属性</h4>
          <div className="flex flex-wrap gap-2">
            {essence.conceptCore.essentialAttributes.map((attr, i) => (
              <Badge key={i} variant="secondary">{attr}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">核心要素</h4>
          <div className="flex flex-wrap gap-2">
            {essence.connotationAnalysis.coreElements.map((elem, i) => (
              <Badge key={i} variant="outline">{elem}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">适用范围</h4>
          <p className="text-sm">{essence.extensionDefinition.scope}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** 过程还原卡片 */
function ProcessCard({ process }: { process: ProcessRestoration }) {
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-green-500" />
          过程还原
        </CardTitle>
        <CardDescription>知识形成过程与认知路径</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">历史背景</h4>
          <p className="text-sm">{process.knowledgeOrigin.historicalBackground}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">思考过程</h4>
          <ol className="list-decimal list-inside text-sm space-y-1">
            {process.recreationDesign.thinkingProcess.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">探究活动</h4>
          <div className="flex flex-wrap gap-2">
            {process.recreationDesign.inquiryActivities.map((activity, i) => (
              <Badge key={i} variant="outline">{activity}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** 思想显影卡片 */
function ThoughtCard({ thought }: { thought: ThoughtRevelation }) {
  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-purple-500" />
          思想显影
        </CardTitle>
        <CardDescription>蕴含的数学思想方法</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">数学思想</h4>
          <div className="flex flex-wrap gap-2">
            {thought.implicitThoughts.map((t, i) => (
              <Badge 
                key={i} 
                className={t.level === 'core' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                  : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                }
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">主线思想</h4>
          <p className="text-sm">{thought.thoughtSystem.mainThread}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">渗透节点</h4>
          <div className="space-y-2">
            {thought.infiltrationPoints.slice(0, 3).map((point, i) => (
              <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                <span className="font-medium">{point.teachingPhase}：</span>
                <span className="text-muted-foreground">{point.thought}</span>
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
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="h-5 w-5 text-orange-500" />
          结构贯通
        </CardTitle>
        <CardDescription>知识结构网络与关联</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">前置知识链接</h4>
          <p className="text-sm">{structure.verticalConnection.priorLink.content}</p>
          <p className="text-xs text-muted-foreground mt-1">衔接点：{structure.verticalConnection.priorLink.connectionPoint}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">后续知识延伸</h4>
          <p className="text-sm">{structure.verticalConnection.subsequentLink.content}</p>
          <p className="text-xs text-muted-foreground mt-1">延伸方向：{structure.verticalConnection.subsequentLink.extensionDirection}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">方法迁移</h4>
          <div className="flex flex-wrap gap-2">
            {structure.horizontalConnection.methodTransfer.map((method, i) => (
              <Badge key={i} variant="outline">{method}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">上位概念</h4>
          <p className="text-sm">{structure.unifiedFramework.superordinateConcept}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** 教学路径卡片 */
function TeachingPathCard({ teachingPath }: { teachingPath: TeachingPath }) {
  return (
    <Card className="border-l-4 border-l-rose-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5 text-rose-500" />
          教学路径
        </CardTitle>
        <CardDescription>基于四维分析的教学实施建议</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">教学目标</h4>
          <div className="space-y-2">
            {teachingPath.objectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="shrink-0">
                  {obj.dimension === 'knowledge' ? '知识' : 
                   obj.dimension === 'ability' ? '能力' : 
                   obj.dimension === 'emotion' ? '情感' : '思维'}
                </Badge>
                <span>{obj.content}：{obj.behavior}</span>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">教学重点</h4>
          <div className="space-y-2">
            {teachingPath.keyDifficulty.keyPoints.map((point, i) => (
              <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                <span className="font-medium">{point.content}</span>
                <p className="text-xs text-muted-foreground mt-1">策略：{point.strategy}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">教学难点</h4>
          <div className="space-y-2">
            {teachingPath.keyDifficulty.difficulties.map((diff, i) => (
              <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                <span className="font-medium">{diff.content}</span>
                <p className="text-xs text-muted-foreground mt-1">突破：{diff.breakthrough}</p>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">教学环节</h4>
          <div className="space-y-2">
            {teachingPath.phases.map((phase, i) => (
              <div key={i} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="text-xs">{phase.name}</Badge>
                  <span className="text-xs text-muted-foreground">约{phase.duration}分钟</span>
                </div>
                <p className="text-sm">{phase.activities.join('、')}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
