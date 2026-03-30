/**
 * 朗读教学工具页面
 * 
 * 基于王崧舟老师朗读教学思想设计
 * 核心理念：朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧
 * 
 * @module app/teacher/lesson-prep/chinese/reading
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Mic2,
  Loader2,
  Play,
  Pause,
  Volume2,
  BookOpen,
  Heart,
  Eye,
  Lightbulb,
  Music,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Target,
  FolderOpen,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReadingTeachingPlan } from '@/types/chinese-prep';

// ==================== 类型定义 ====================

type TextbookLesson = {
  id: number;
  grade: number;
  semester: '上册' | '下册';
  unitNumber: number;
  unitTheme: string | null;
  lessonNumber: number;
  title: string;
  genre: '古诗' | '散文' | '童话' | '小说' | '说明文' | '议论文' | '其他';
  author: string | null;
  content: string | null;
  isRequired: boolean;
};

type UnitGroup = {
  unitNumber: number;
  unitTheme: string;
  lessons: TextbookLesson[];
};

// ==================== 文体标签颜色 ====================

const GENRE_COLORS: Record<string, string> = {
  '古诗': 'bg-amber-100 text-amber-700 border-amber-200',
  '散文': 'bg-blue-100 text-blue-700 border-blue-200',
  '童话': 'bg-pink-100 text-pink-700 border-pink-200',
  '小说': 'bg-purple-100 text-purple-700 border-purple-200',
  '说明文': 'bg-gray-100 text-gray-700 border-gray-200',
  '议论文': 'bg-red-100 text-red-700 border-red-200',
  '其他': 'bg-slate-100 text-slate-700 border-slate-200',
};

// ==================== 主组件 ====================

export default function ReadingPage() {
  // 课文选择状态
  const [grade, setGrade] = useState<number>(4);
  const [semester, setSemester] = useState<'上册' | '下册'>('上册');
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<TextbookLesson | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set([1]));
  const [loading, setLoading] = useState(false);
  const [textContent, setTextContent] = useState<string>('');
  
  // 生成选项
  const [options, setOptions] = useState({
    willingness: true,
    experience: true,
    skills: true,
    emotionalModel: true,
    strategies: true,
    audios: true,
  });
  
  // 结果状态
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<ReadingTeachingPlan | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('ontology');
  
  // 保存状态
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 音频 ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 加载课文列表
  const loadLessons = useCallback(async () => {
    setLoading(true);
    setUnitGroups([]);
    setSelectedLesson(null);
    setTextContent('');
    setPlan(null);
    
    try {
      const response = await fetch(`/api/textbook/lessons?grade=${grade}&semester=${encodeURIComponent(semester)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setUnitGroups(data.data);
        if (data.data.length > 0) {
          setExpandedUnits(new Set([data.data[0].unitNumber]));
        }
      }
    } catch (error) {
      console.error('加载课文列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [grade, semester]);
  
  // 选择课文
  const selectLesson = useCallback((lesson: TextbookLesson) => {
    setSelectedLesson(lesson);
    setTextContent('');
    setPlan(null);
  }, []);
  
  // 切换单元展开状态
  const toggleUnit = useCallback((unitNumber: number) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitNumber)) {
        newSet.delete(unitNumber);
      } else {
        newSet.add(unitNumber);
      }
      return newSet;
    });
  }, []);
  
  // 内部保存函数
  const saveToResourceInternal = useCallback(async (planData: ReadingTeachingPlan) => {
    if (!selectedLesson || !textContent.trim()) return;
    
    try {
      const res = await fetch('/api/teaching-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonInfo: {
            title: selectedLesson.title,
            grade: selectedLesson.grade,
            genre: selectedLesson.genre,
            content: textContent.trim(),
          },
          readingContent: planData,
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
  }, [selectedLesson, textContent]);
  
  // 生成朗读方案
  const handleGenerate = useCallback(async () => {
    if (!selectedLesson || !textContent.trim()) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/chinese-prep/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textContent.trim(),
          title: selectedLesson.title,
          grade: selectedLesson.grade,
          genre: selectedLesson.genre === '其他' ? undefined : selectedLesson.genre,
          generateOptions: options,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlan(data.data);
        setActiveTab('ontology');
        saveToResourceInternal(data.data);
      }
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setGenerating(false);
    }
  }, [selectedLesson, textContent, options, saveToResourceInternal]);
  
  // 年级或学期变化时重新加载课文
  useEffect(() => {
    loadLessons();
  }, [loadLessons]);
  
  // 播放音频
  const handlePlayAudio = useCallback((audioUrl: string) => {
    if (currentAudio === audioUrl && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      setCurrentAudio(audioUrl);
      setIsPlaying(true);
    }
  }, [currentAudio, isPlaying]);
  
  // 音频结束
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);
  
  // 获取速度标签
  const getSpeedLabel = (speed: string) => {
    const labels: Record<string, string> = {
      slow: '慢速范读',
      standard: '标准范读',
      expressive: '情感范读',
    };
    return labels[speed] || speed;
  };

  // ==================== 渲染函数 ====================

  const renderOntology = () => {
    if (!plan) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-emerald-600" />
            本体论推导：为什么教朗读
          </CardTitle>
          <CardDescription>回归朗读教学的本质价值</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">文体：</span>
            <Badge variant="outline" className={GENRE_COLORS[plan.genre]}>
              {plan.genre}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-xs">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-emerald-800 mb-1 text-sm">为什么教这篇课文朗读？</h4>
                  <p className="text-sm text-emerald-700 leading-relaxed">{plan.ontology.whyTeach}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1 text-sm">朗读教学的具体目的是什么？</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">{plan.ontology.teachingPurpose}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-xs">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-purple-800 mb-1 text-sm">价值取向如何体现？</h4>
                  <p className="text-sm text-purple-700 leading-relaxed">{plan.ontology.valueOrientation}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderSubjectCultivation = () => {
    if (!plan) return null;
    
    const { willingness, experience, skills } = plan.subjectCultivation;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-amber-600" />
            朗读主体培养
          </CardTitle>
          <CardDescription>
            朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* 朗读意愿 */}
          <div className="p-4 bg-red-50/50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="font-medium text-red-700 text-sm">朗读意愿：从"要我读"到"我要读"</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">文本与学生的连接点</div>
                <p className="text-sm mt-1">{willingness.selfConnection}</p>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">情感共鸣的触发点</div>
                <p className="text-sm mt-1">{willingness.emotionalTrigger}</p>
              </div>
            </div>
            {willingness.introductionScript && (
              <div className="mt-3 p-3 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 font-medium mb-1">📝 导入语设计</div>
                <p className="text-sm leading-relaxed">{willingness.introductionScript}</p>
              </div>
            )}
          </div>
          
          {/* 朗读体验 */}
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-700 text-sm">朗读体验：从文字到画面</span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">听什么：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {experience.listeningGuide.focusPoints.map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">怎么听：</span>
                <p className="text-sm mt-1">{experience.listeningGuide.guidance}</p>
              </div>
            </div>
          </div>
          
          {/* 朗读技巧 */}
          <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-700 text-sm">朗读技巧</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">重音</div>
                <p className="text-sm mt-1">{skills.stress.points.length} 处标注</p>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">停顿</div>
                <p className="text-sm mt-1">{skills.pause.points.length} 处标注</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderEmotionalModel = () => {
    if (!plan) return null;
    
    const model = plan.emotionalModel;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5 text-purple-600" />
            情感朗读模型
          </CardTitle>
          <CardDescription>五环节闭环：感悟 → 想象 → 求气 → 创调 → 反听</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {[
            { label: '感悟', value: model.comprehension?.emotionalTone, color: 'blue' },
            { label: '想象', value: model.imagination?.coreScenes?.join('、'), color: 'amber' },
            { label: '求气', value: model.breathControl?.breathType, color: 'orange' },
            { label: '创调', value: `语速：${model.toneCreation?.speed || '标准'} | 语调：${model.toneCreation?.intonation || '自然'}`, color: 'green' },
            { label: '反听', value: model.selfMonitoring?.guidanceScript, color: 'purple' },
          ].map((item, idx) => (
            <div key={idx} className={cn(
              'p-3 rounded-lg border',
              item.color === 'blue' && 'bg-blue-50/50 border-blue-100',
              item.color === 'amber' && 'bg-amber-50/50 border-amber-100',
              item.color === 'orange' && 'bg-orange-50/50 border-orange-100',
              item.color === 'green' && 'bg-green-50/50 border-green-100',
              item.color === 'purple' && 'bg-purple-50/50 border-purple-100',
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'w-5 h-5 rounded-full text-white text-xs flex items-center justify-center',
                  item.color === 'blue' && 'bg-blue-500',
                  item.color === 'amber' && 'bg-amber-500',
                  item.color === 'orange' && 'bg-orange-500',
                  item.color === 'green' && 'bg-green-500',
                  item.color === 'purple' && 'bg-purple-500',
                )}>
                  {idx + 1}
                </span>
                <span className={cn(
                  'font-medium text-sm',
                  item.color === 'blue' && 'text-blue-700',
                  item.color === 'amber' && 'text-amber-700',
                  item.color === 'orange' && 'text-orange-700',
                  item.color === 'green' && 'text-green-700',
                  item.color === 'purple' && 'text-purple-700',
                )}>{item.label}</span>
              </div>
              <p className="text-sm pl-7">{item.value || '暂无'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };
  
  const renderStrategies = () => {
    if (!plan) return null;
    
    const { genreAwareness } = plan.strategies;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-orange-600" />
            教学策略
          </CardTitle>
          <CardDescription>文体意识与教学策略</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">文体：</span>
            <Badge className={GENRE_COLORS[plan.genre]}>{plan.genre}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
              <div className="text-xs text-muted-foreground">节奏特点</div>
              <p className="text-sm mt-1">{genreAwareness.features.rhythm?.slice(0, 50)}...</p>
            </div>
            <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
              <div className="text-xs text-muted-foreground">语调特点</div>
              <p className="text-sm mt-1">{genreAwareness.features.intonation?.slice(0, 50)}...</p>
            </div>
          </div>
          
          {genreAwareness.commonMistakes && genreAwareness.commonMistakes.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border border-orange-200">
              <div className="text-xs text-orange-600 font-medium mb-2">⚠️ 常见误读警示</div>
              <ul className="text-sm space-y-1">
                {genreAwareness.commonMistakes.slice(0, 3).map((mistake, idx) => (
                  <li key={idx}>• {mistake}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderAudios = () => {
    if (!plan || plan.audios.length === 0) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="w-5 h-5 text-green-600" />
            范读音频
          </CardTitle>
          <CardDescription>可在线播放或下载</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.audios.map((audio) => (
              <Card key={audio.speed} className="overflow-hidden border-green-200">
                <CardHeader className="pb-2 bg-green-50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-green-500" />
                    {getSpeedLabel(audio.speed)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handlePlayAudio(audio.audioUrl)}
                      title="播放"
                    >
                      {currentAudio === audio.audioUrl && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch(audio.audioUrl);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${selectedLesson?.title || '朗读'}_${getSpeedLabel(audio.speed)}.mp3`;
                          link.click();
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('下载失败:', error);
                        }
                      }}
                      title="下载音频"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-1">
                      {Math.ceil(audio.duration / 1000)}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderGuidance = () => {
    if (!plan) return null;
    
    const guidance = plan.guidance;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic2 className="w-5 h-5 text-blue-600" />
            课堂指导话术
          </CardTitle>
          <CardDescription>可直接用于课堂教学</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <div className="text-sm font-medium text-indigo-700 mb-3">齐读组织话术</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">准备话术</div>
                <p className="text-sm mt-1">{guidance.chorusGuide.preparation}</p>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">起始信号</div>
                <p className="text-sm mt-1">{guidance.chorusGuide.startSignal}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <audio ref={audioRef} className="hidden" />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep/chinese">
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-sm">
                <Mic2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">朗读教学</h1>
                <p className="text-sm text-muted-foreground">基于王崧舟老师朗读教学思想</p>
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
        
        {/* 主内容区：左侧课文选择 + 右侧生成区域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：课文选择 */}
          <div className="col-span-4">
            <Card className="border-none shadow-lg sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  选择课文
                </CardTitle>
                <CardDescription>选择年级和学期，从单元中选择课文</CardDescription>
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
                
                {/* 课文列表 */}
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : unitGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      暂无课文数据
                    </div>
                  ) : (
                    <div className="p-2">
                      {unitGroups.map((unit) => (
                        <Collapsible
                          key={unit.unitNumber}
                          open={expandedUnits.has(unit.unitNumber)}
                          onOpenChange={() => toggleUnit(unit.unitNumber)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors w-full text-left">
                              <div className="flex items-center gap-2">
                                <ChevronRight className={cn(
                                  "w-4 h-4 transition-transform",
                                  expandedUnits.has(unit.unitNumber) && "rotate-90"
                                )} />
                                <span className="font-medium text-sm">第{unit.unitNumber}单元</span>
                                <span className="text-xs text-muted-foreground">{unit.unitTheme}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {unit.lessons.length}
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-6 pr-2 pb-2 space-y-1">
                              {unit.lessons.map((lesson) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => selectLesson(lesson)}
                                  className={cn(
                                    "w-full text-left p-3 rounded-lg transition-all",
                                    "hover:bg-green-50 hover:shadow-sm",
                                    selectedLesson?.id === lesson.id && "bg-green-100 border border-green-300 shadow-sm"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">
                                        {lesson.lessonNumber}. {lesson.title}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge 
                                          variant="outline" 
                                          className={cn("text-xs", GENRE_COLORS[lesson.genre])}
                                        >
                                          {lesson.genre}
                                        </Badge>
                                        {lesson.isRequired && (
                                          <Badge variant="secondary" className="text-xs">精读</Badge>
                                        )}
                                      </div>
                                    </div>
                                    {selectedLesson?.id === lesson.id && (
                                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
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
          
          {/* 右侧：选中的课文信息和生成区域 */}
          <div className="col-span-8 space-y-4">
            {/* 选中的课文信息 */}
            {selectedLesson && (
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedLesson.title}
                        <Badge 
                          variant="outline" 
                          className={GENRE_COLORS[selectedLesson.genre]}
                        >
                          {selectedLesson.genre}
                        </Badge>
                        {selectedLesson.isRequired && (
                          <Badge variant="secondary">精读</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        第{selectedLesson.unitNumber}单元 · {selectedLesson.unitTheme} · {selectedLesson.grade}年级{selectedLesson.semester}
                        {selectedLesson.author && ` · ${selectedLesson.author}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* 课文内容输入区域 */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">课文内容</span>
                      <span className="text-xs text-muted-foreground">{textContent.length} 字</span>
                    </div>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="请输入课文内容..."
                      className="w-full h-[150px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white"
                    />
                  </div>
                  
                  {/* 生成选项 */}
                  <div className="flex flex-wrap gap-4 pt-3 border-t">
                    {[
                      { key: 'willingness', label: '朗读意愿' },
                      { key: 'experience', label: '朗读体验' },
                      { key: 'skills', label: '朗读技巧' },
                      { key: 'emotionalModel', label: '情感模型' },
                      { key: 'strategies', label: '教学策略' },
                      { key: 'audios', label: '范读音频' },
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
                    disabled={!textContent.trim() || generating}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成朗读教学方案...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成朗读教学方案
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    生成后将自动保存到资源库
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* 未选择课文提示 */}
            {!selectedLesson && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Mic2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">选择课文</h3>
                  <p className="text-sm text-muted-foreground">
                    请从左侧选择一篇课文，输入内容后开始生成朗读教学方案
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Tab 切换 */}
            {plan && (
              <div className="flex gap-2 border-b pb-2 flex-wrap">
                {[
                  { key: 'ontology', label: '本体论', show: true, icon: Target },
                  { key: 'subject', label: '朗读主体', show: true, icon: Heart },
                  { key: 'emotional', label: '情感模型', show: true, icon: Music },
                  { key: 'strategies', label: '教学策略', show: true, icon: BookOpen },
                  { key: 'audios', label: '范读音频', show: plan.audios?.length > 0, icon: Volume2 },
                  { key: 'guidance', label: '指导话术', show: true, icon: Mic2 },
                ].filter(t => t.show).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm rounded-t transition-colors',
                      activeTab === tab.key 
                        ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
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
              {activeTab === 'ontology' && renderOntology()}
              {activeTab === 'subject' && renderSubjectCultivation()}
              {activeTab === 'emotional' && renderEmotionalModel()}
              {activeTab === 'strategies' && renderStrategies()}
              {activeTab === 'audios' && renderAudios()}
              {activeTab === 'guidance' && renderGuidance()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
