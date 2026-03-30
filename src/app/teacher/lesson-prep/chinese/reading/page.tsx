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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Save,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ReadingTeachingPlan,
} from '@/types/chinese-prep';

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
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 音频 ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 加载课文列表
  const loadLessons = useCallback(async () => {
    setLoading(true);
    setUnitGroups([]);
    setSelectedLesson(null);
    
    try {
      const response = await fetch(`/api/textbook/lessons?grade=${grade}&semester=${encodeURIComponent(semester)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setUnitGroups(data.data);
        // 默认展开第一个单元
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
    setTextContent(''); // 清空之前的内容
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
  
  // 内部保存函数（生成后自动调用）
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
    if (!selectedLesson || !textContent.trim()) {
      return;
    }
    
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
        // 自动保存到资源库
        saveToResourceInternal(data.data);
      } else {
        console.error('生成失败:', data.error);
      }
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setGenerating(false);
    }
  }, [selectedLesson, textContent, options, saveToResourceInternal]);
  
  // 保存到资源库（手动调用）
  const saveToResource = useCallback(async () => {
    if (!plan || !selectedLesson || !textContent.trim()) return;
    
    setSaving(true);
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
          readingContent: plan,
        }),
      });
      
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('保存失败:', json.error);
      }
    } catch (e) {
      console.error('保存失败:', e);
    } finally {
      setSaving(false);
    }
  }, [plan, selectedLesson, textContent]);
  
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
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
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
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">文体：</span>
            <Badge variant="outline" className={GENRE_COLORS[plan.genre]}>
              {plan.genre}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-emerald-800 mb-2">为什么教这篇课文朗读？</h4>
                  <p className="text-sm text-emerald-700 leading-relaxed">{plan.ontology.whyTeach}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">朗读教学的具体目的是什么？</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">{plan.ontology.teachingPurpose}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-purple-800 mb-2">价值取向如何体现？</h4>
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
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="font-bold text-amber-700">朗读主体</span>
              <span className="text-amber-500">=</span>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">朗读意愿</Badge>
              <span className="text-amber-500">×</span>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">朗读体验</Badge>
              <span className="text-amber-500">×</span>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">朗读技巧</Badge>
            </div>
            <p className="text-center text-sm text-amber-600 mt-2">三者缺一不可</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="w-5 h-5 text-red-500" />
              朗读意愿：从"要我读"到"我要读"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-red-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">文本与学生的连接点</div>
                <p className="text-sm">{willingness.selfConnection}</p>
              </div>
              <div className="p-3 bg-red-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">情感共鸣的触发点</div>
                <p className="text-sm">{willingness.emotionalTrigger}</p>
              </div>
            </div>
            
            {willingness.awakeningPhrases.length > 0 && (
              <div className="p-3 bg-red-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">唤醒表达欲望的话术</div>
                <ul className="space-y-1">
                  {willingness.awakeningPhrases.map((phrase, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-red-400 mt-1 flex-shrink-0" />
                      {phrase}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {willingness.introductionScript && (
              <div className="p-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 font-medium mb-2">📝 导入语设计</div>
                <p className="text-sm leading-relaxed">{willingness.introductionScript}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-5 h-5 text-blue-500" />
              朗读体验：从文字到画面
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50/50 rounded-lg">
              <div className="font-medium text-sm mb-2">👂 倾听指导</div>
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-5 h-5 text-green-500" />
              朗读技巧
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">重音</div>
                <p className="text-sm mt-1">{skills.stress.points.length} 处标注</p>
              </div>
              <div className="p-3 bg-green-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">停顿</div>
                <p className="text-sm mt-1">{skills.pause.points.length} 处标注</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
          <CardDescription>五个闭环环节：感悟 → 想象 → 求气 → 创调 → 反听</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-700">感悟</span>
            </div>
            <p className="text-sm">{model.comprehension.emotionalTone || '暂无'}</p>
          </div>
          
          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-amber-700">求气</span>
            </div>
            <p className="text-sm">{model.breathControl.breathType || '暂无'}</p>
          </div>
          
          <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Mic2 className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-700">创调</span>
            </div>
            <p className="text-sm">语速：{model.toneCreation.speed || '标准'} | 语调：{model.toneCreation.intonation || '自然'}</p>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderStrategies = () => {
    if (!plan) return null;
    
    const { genreAwareness } = plan.strategies;
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-orange-500" />
              文体意识策略
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={GENRE_COLORS[plan.genre]}>{plan.genre}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-orange-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">节奏</div>
                <p className="text-sm mt-1">{genreAwareness.features.rhythm.slice(0, 20)}...</p>
              </div>
              <div className="p-3 bg-orange-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">语调</div>
                <p className="text-sm mt-1">{genreAwareness.features.intonation.slice(0, 20)}...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-sm">
                <Mic2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">朗读教学</h1>
                <p className="text-sm text-muted-foreground">基于王崧舟老师朗读教学思想</p>
              </div>
            </div>
          </div>
          
          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-3">
            <Link href="/teacher/lesson-prep/my-resources">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                我的资源库
              </Button>
            </Link>
            {plan && (
              <Button
                size="sm"
                onClick={saveToResource}
                disabled={saving}
                className={saveSuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    已保存
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存到资源库
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* 课文选择区域 */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              选择课文
            </CardTitle>
            <CardDescription>选择年级和学期，从单元中选择要备课的课文</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* 年级和学期选择 */}
            <div className="flex items-end gap-4">
              <div className="space-y-2 w-32">
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
              
              <div className="space-y-2 w-32">
                <label className="text-sm font-medium">学期</label>
                <Select value={semester} onValueChange={(v) => setSemester(v as '上册' | '下册')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="上册">上册</SelectItem>
                    <SelectItem value="下册">下册</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 课文列表 - 按单元分组 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {grade}年级{semester} {unitGroups.length > 0 && `共 ${unitGroups.length} 个单元`}
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">正在加载课文...</span>
                </div>
              ) : unitGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mb-2" />
                  <p>暂无课文数据</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] border rounded-lg">
                  <div className="p-2 space-y-2">
                    {unitGroups.map((unit) => (
                      <Collapsible
                        key={unit.unitNumber}
                        open={expandedUnits.has(unit.unitNumber)}
                        onOpenChange={() => toggleUnit(unit.unitNumber)}
                      >
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg hover:from-slate-100 hover:to-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-white">
                                第{unit.unitNumber}单元
                              </Badge>
                              <span className="font-medium text-sm">{unit.unitTheme}</span>
                              <span className="text-xs text-muted-foreground">
                                ({unit.lessons.length}篇)
                              </span>
                            </div>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 text-muted-foreground transition-transform',
                                expandedUnits.has(unit.unitNumber) && 'rotate-180'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                            {unit.lessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                onClick={() => selectLesson(lesson)}
                                className={cn(
                                  'p-3 rounded-lg border text-left transition-all hover:border-green-300 hover:bg-green-50/50',
                                  selectedLesson?.id === lesson.id && 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">{lesson.lessonNumber}.</span>
                                      <span className="font-medium text-sm truncate">{lesson.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Badge variant="outline" className={cn('text-xs', GENRE_COLORS[lesson.genre])}>
                                        {lesson.genre}
                                      </Badge>
                                      {lesson.isRequired && (
                                        <Badge variant="secondary" className="text-xs">精读</Badge>
                                      )}
                                    </div>
                                  </div>
                                  {selectedLesson?.id === lesson.id && (
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* 已选课文预览 */}
            {selectedLesson && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedLesson.title}</span>
                    <Badge variant="outline" className={GENRE_COLORS[selectedLesson.genre]}>
                      {selectedLesson.genre}
                    </Badge>
                    {selectedLesson.author && (
                      <span className="text-xs text-muted-foreground">— {selectedLesson.author}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    第{selectedLesson.unitNumber}单元 · {selectedLesson.isRequired ? '精读' : '略读'}
                  </span>
                </div>
                
                {/* 课文内容输入区域 */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">课文内容</span>
                    <span className="text-xs text-muted-foreground">{textContent.length} 字</span>
                  </div>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="请输入课文内容..."
                    className="w-full h-[120px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 bg-white"
                  />
                </div>
              </div>
            )}
            
            {/* 生成选项 */}
            <div className="flex flex-wrap gap-4 pt-2 border-t">
              {[
                { key: 'willingness', label: '朗读意愿' },
                { key: 'experience', label: '朗读体验' },
                { key: 'skills', label: '朗读技巧' },
                { key: 'emotionalModel', label: '情感模型' },
                { key: 'strategies', label: '教学策略' },
                { key: 'audios', label: '范读音频' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={options[opt.key as keyof typeof options]}
                    onChange={(e) => 
                      setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedLesson || !textContent.trim() || generating}
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
              生成后将自动保存到资源库，可在「我的资源库」中查看历史记录
            </p>
          </CardContent>
        </Card>
        
        {/* 结果展示 */}
        {plan && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full bg-muted/50">
              <TabsTrigger value="ontology" className="text-xs md:text-sm">本体论</TabsTrigger>
              <TabsTrigger value="subject" className="text-xs md:text-sm">朗读主体</TabsTrigger>
              <TabsTrigger value="emotional" className="text-xs md:text-sm">情感模型</TabsTrigger>
              <TabsTrigger value="strategies" className="text-xs md:text-sm">教学策略</TabsTrigger>
              <TabsTrigger value="audios" className="text-xs md:text-sm">范读音频</TabsTrigger>
              <TabsTrigger value="guidance" className="text-xs md:text-sm">指导话术</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <TabsContent value="ontology" className="mt-0">{renderOntology()}</TabsContent>
              <TabsContent value="subject" className="mt-0">{renderSubjectCultivation()}</TabsContent>
              <TabsContent value="emotional" className="mt-0">{renderEmotionalModel()}</TabsContent>
              <TabsContent value="strategies" className="mt-0">{renderStrategies()}</TabsContent>
              <TabsContent value="audios" className="mt-0">{renderAudios()}</TabsContent>
              <TabsContent value="guidance" className="mt-0">{renderGuidance()}</TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
