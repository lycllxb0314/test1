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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mic2,
  Loader2,
  Play,
  Pause,
  Download,
  Volume2,
  BookOpen,
  Heart,
  Eye,
  Lightbulb,
  Music,
  Repeat,
  FileText,
  Target,
  Users,
  Settings,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ReadingTeachingPlan,
  ReadingToneType,
  ReadingWillingness,
  ReadingExperience,
  ReadingSkills,
  EmotionalReadingModel,
  DemonstrationStrategy,
  PreparationStrategy,
  IntegrationStrategy,
  ReadingAudio,
  ReadingGuidance,
} from '@/types/chinese-prep';

// ==================== 文体标签颜色 ====================

const GENRE_COLORS: Record<ReadingToneType, string> = {
  '古诗': 'bg-amber-100 text-amber-700 border-amber-200',
  '散文': 'bg-blue-100 text-blue-700 border-blue-200',
  '童话': 'bg-pink-100 text-pink-700 border-pink-200',
  '小说': 'bg-purple-100 text-purple-700 border-purple-200',
  '说明文': 'bg-gray-100 text-gray-700 border-gray-200',
  '议论文': 'bg-red-100 text-red-700 border-red-200',
};

// ==================== 主组件 ====================

export default function ReadingPage() {
  // 输入状态
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [grade, setGrade] = useState<number>(4);
  const [genre, setGenre] = useState<ReadingToneType | ''>('');
  const [options, setOptions] = useState({
    willingness: true,
    experience: true,
    skills: true,
    emotionalModel: true,
    strategies: true,
    audios: true,
  });
  
  // 结果状态
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ReadingTeachingPlan | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('ontology');
  
  // 音频 ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 生成朗读方案
  const handleGenerate = useCallback(async () => {
    if (!text.trim() || !title.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chinese-prep/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          title,
          grade,
          genre: genre || undefined,
          generateOptions: options,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlan(data.data);
        setActiveTab('ontology');
      } else {
        console.error('生成失败:', data.error);
      }
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setLoading(false);
    }
  }, [text, title, grade, genre, options]);
  
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
  
  // 渲染本体论推导
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
          {/* 文体标签 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">文体：</span>
            <Badge variant="outline" className={GENRE_COLORS[plan.genre]}>
              {plan.genre}
            </Badge>
          </div>
          
          <Separator />
          
          {/* 三个核心问题 */}
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
  
  // 渲染朗读主体培育
  const renderSubjectCultivation = () => {
    if (!plan) return null;
    
    const { willingness, experience, skills } = plan.subjectCultivation;
    
    return (
      <div className="space-y-6">
        {/* 公式说明 */}
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
            <p className="text-center text-sm text-amber-600 mt-2">三者缺一不可，乘法关系意味着任何一项为零则整体为零</p>
          </CardContent>
        </Card>
        
        {/* 意愿培育 */}
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
            
            <div className="p-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg border border-red-200">
              <div className="text-xs text-red-600 font-medium mb-2">📝 导入语设计</div>
              <p className="text-sm leading-relaxed">{willingness.introductionScript}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* 体验培育 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-5 h-5 text-blue-500" />
              朗读体验：从文字到画面
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 倾听指导 */}
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
                <div>
                  <span className="text-xs text-muted-foreground">听后思考：</span>
                  <p className="text-sm mt-1">{experience.listeningGuide.reflection}</p>
                </div>
              </div>
            </div>
            
            {/* 想象还原 */}
            {experience.imaginationRestore.scenes.length > 0 && (
              <div className="p-3 bg-blue-50/50 rounded-lg">
                <div className="font-medium text-sm mb-2">🖼️ 想象还原</div>
                <div className="space-y-3">
                  {experience.imaginationRestore.scenes.map((scene, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border">
                      <div className="text-xs text-muted-foreground mb-1">原文：「{scene.text}」</div>
                      <p className="text-sm font-medium">{scene.scene}</p>
                      {scene.sensoryDetails.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scene.sensoryDetails.map((d, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 情境还原 */}
            <div className="p-3 bg-blue-50/50 rounded-lg">
              <div className="font-medium text-sm mb-2">🎭 情境还原</div>
              <p className="text-sm">{experience.situationRestore.background}</p>
              {experience.situationRestore.characters.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {experience.situationRestore.characters.map((c, i) => (
                    <Badge key={i} variant="secondary">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 技巧培育 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-5 h-5 text-green-500" />
              朗读技巧：在真实语境中习得
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 重音 */}
              <div className="p-3 bg-green-50/50 rounded-lg">
                <div className="font-medium text-sm mb-2">🔊 重音技巧</div>
                {skills.stress.points.length > 0 ? (
                  <div className="space-y-1">
                    {skills.stress.points.slice(0, 3).map((p, i) => (
                      <div key={i} className="text-xs flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{p.type}</Badge>
                        <span>「{p.text}」</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无标注</p>
                )}
              </div>
              
              {/* 节奏 */}
              <div className="p-3 bg-green-50/50 rounded-lg">
                <div className="font-medium text-sm mb-2">🎵 节奏技巧</div>
                <p className="text-xs">{skills.rhythm.overall || '暂无说明'}</p>
              </div>
              
              {/* 语调 */}
              <div className="p-3 bg-green-50/50 rounded-lg">
                <div className="font-medium text-sm mb-2">📈 语调技巧</div>
                {skills.intonation.emotionalTones.length > 0 ? (
                  <div className="space-y-1">
                    {skills.intonation.emotionalTones.slice(0, 2).map((t, i) => (
                      <div key={i} className="text-xs">
                        <Badge variant="outline" className="text-xs">{t.emotion}</Badge>
                        <span className="ml-1">{t.tone}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无标注</p>
                )}
              </div>
              
              {/* 停顿 */}
              <div className="p-3 bg-green-50/50 rounded-lg">
                <div className="font-medium text-sm mb-2">⏸️ 停顿技巧</div>
                {skills.pause.points.length > 0 ? (
                  <div className="space-y-1">
                    {skills.pause.points.slice(0, 3).map((p, i) => (
                      <div key={i} className="text-xs flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{p.type}</Badge>
                        <span>{p.position}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无标注</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // 渲染情感朗读模型
  const renderEmotionalModel = () => {
    if (!plan) return null;
    
    const model = plan.emotionalModel;
    
    const steps = [
      { key: 'comprehension', icon: BookOpen, label: '感悟', color: 'text-blue-500', bg: 'bg-blue-50', data: model.comprehension },
      { key: 'imagination', icon: Eye, label: '想象', color: 'text-purple-500', bg: 'bg-purple-50', data: model.imagination },
      { key: 'breathControl', icon: Music, label: '求气', color: 'text-amber-500', bg: 'bg-amber-50', data: model.breathControl },
      { key: 'toneCreation', icon: Mic2, label: '创调', color: 'text-green-500', bg: 'bg-green-50', data: model.toneCreation },
      { key: 'selfMonitoring', icon: Repeat, label: '反听', color: 'text-red-500', bg: 'bg-red-50', data: model.selfMonitoring },
    ];
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5 text-purple-600" />
            情感朗读模型
          </CardTitle>
          <CardDescription>五个闭环环节：感悟 → 想象 → 求气 → 创调 → 反听</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* 流程图 */}
          <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <React.Fragment key={step.key}>
                <div className={cn(
                  'flex flex-col items-center p-3 rounded-lg min-w-[80px]',
                  step.bg
                )}>
                  <step.icon className={cn('w-6 h-6 mb-1', step.color)} />
                  <span className={cn('font-medium text-sm', step.color)}>{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* 详细内容 */}
          <div className="space-y-4">
            {/* 感悟 */}
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-700">感悟：理解文本情感</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">情感基调</span>
                  <p className="text-sm font-medium">{model.comprehension.emotionalTone || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">情感线索</span>
                  <p className="text-sm font-medium">{model.comprehension.emotionalThread || '—'}</p>
                </div>
              </div>
              {model.comprehension.emotionalKeywords.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground">情感关键词</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {model.comprehension.emotionalKeywords.map((k, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {model.comprehension.guidanceScript && (
                <div className="mt-3 p-2 bg-white rounded border text-sm">
                  {model.comprehension.guidanceScript}
                </div>
              )}
            </div>
            
            {/* 想象 */}
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-purple-700">想象：还原画面与情境</span>
              </div>
              {model.imagination.coreScenes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {model.imagination.coreScenes.map((s, i) => (
                    <Badge key={i} variant="outline" className="bg-white">{s}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无核心画面</p>
              )}
            </div>
            
            {/* 求气 */}
            <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-amber-700">求气：唤起情感，获得气息</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">气息类型</span>
                  <p className="text-sm">{model.breathControl.breathType || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">练习方法</span>
                  <p className="text-sm">{model.breathControl.practiceMethod || '—'}</p>
                </div>
              </div>
            </div>
            
            {/* 创调 */}
            <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Mic2 className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-700">创调：语调、语速、语流</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">语速</span>
                  <p className="text-sm">{model.toneCreation.speed || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">语调</span>
                  <p className="text-sm">{model.toneCreation.intonation || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">语流</span>
                  <p className="text-sm">{model.toneCreation.flow || '—'}</p>
                </div>
              </div>
            </div>
            
            {/* 反听 */}
            <div className="p-4 bg-red-50/50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <Repeat className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-700">反听：监听反思，及时调整</span>
              </div>
              {model.selfMonitoring.checkpoints.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">反听要点</span>
                  <ul className="mt-1 space-y-1">
                    {model.selfMonitoring.checkpoints.map((p, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染教学策略
  const renderStrategies = () => {
    if (!plan) return null;
    
    const { demonstration, preparation, genreAwareness, integration } = plan.strategies;
    
    return (
      <div className="space-y-6">
        {/* 示范策略 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-indigo-500" />
              示范策略：教师范读
            </CardTitle>
            <CardDescription>教师本人的范读最具说服力</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-indigo-50/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">范读要点</div>
              <div className="flex flex-wrap gap-1">
                {demonstration.keyPoints.map((p, i) => (
                  <Badge key={i} variant="secondary">{p}</Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border">
                <div className="text-xs text-indigo-600 font-medium mb-2">范读前引导语</div>
                <p className="text-sm">{demonstration.beforeScript || '—'}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div className="text-xs text-blue-600 font-medium mb-2">范读后讨论语</div>
                <p className="text-sm">{demonstration.afterScript || '—'}</p>
              </div>
            </div>
            
            <div className="p-3 bg-indigo-50/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">学生观察要点</div>
              <ul className="space-y-1">
                {demonstration.observationPoints.map((p, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* 备课策略 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-teal-500" />
              备课策略：朗读笔记
            </CardTitle>
            <CardDescription>在文本解读之外，专门写下朗读笔记</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-teal-50/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">情感走向预设</div>
              <p className="text-sm">{preparation.emotionalArc || '—'}</p>
            </div>
            
            {preparation.speedChanges.length > 0 && (
              <div className="p-3 bg-teal-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">语速变化设计</div>
                <div className="space-y-2">
                  {preparation.speedChanges.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">{s.speed}</Badge>
                      <span className="text-muted-foreground">{s.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {preparation.noteTemplate && (
              <div className="p-4 bg-gradient-to-r from-teal-100 to-green-100 rounded-lg border border-teal-200">
                <div className="text-xs text-teal-600 font-medium mb-2">📝 朗读笔记模板</div>
                <p className="text-sm whitespace-pre-wrap">{preparation.noteTemplate}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 文体意识 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-orange-500" />
              文体意识策略
            </CardTitle>
            <CardDescription>依体裁特征把握语调与节奏</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={GENRE_COLORS[plan.genre]}>{plan.genre}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-orange-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">节奏</div>
                <p className="text-sm mt-1">{genreAwareness.features.rhythm.slice(0, 20)}...</p>
              </div>
              <div className="p-3 bg-orange-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">语调</div>
                <p className="text-sm mt-1">{genreAwareness.features.intonation.slice(0, 20)}...</p>
              </div>
              <div className="p-3 bg-orange-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">停顿</div>
                <p className="text-sm mt-1">{genreAwareness.features.pause.slice(0, 20)}...</p>
              </div>
              <div className="p-3 bg-orange-50/50 rounded-lg">
                <div className="text-xs text-muted-foreground">重音</div>
                <p className="text-sm mt-1">{genreAwareness.features.stress.slice(0, 20)}...</p>
              </div>
            </div>
            
            {genreAwareness.commonMistakes.length > 0 && (
              <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                <div className="text-xs text-red-600 font-medium mb-2">⚠️ 常见误读警示</div>
                <ul className="space-y-1">
                  {genreAwareness.commonMistakes.map((m, i) => (
                    <li key={i} className="text-sm">{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 融合策略 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-5 h-5 text-cyan-500" />
              融合策略：融入阅读教学全过程
            </CardTitle>
            <CardDescription>让学生在理解、感悟、表达中自然完成由文字到有声语言的转化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'firstReading', label: '初读', color: 'cyan' },
                { key: 'intensiveReading', label: '精读', color: 'blue' },
                { key: 'appreciativeReading', label: '品读', color: 'purple' },
                { key: 'fluentReading', label: '熟读', color: 'green' },
              ].map(({ key, label, color }) => {
                const item = integration[key as keyof IntegrationStrategy];
                return (
                  <div key={key} className={`p-3 bg-${color}-50/50 rounded-lg border border-${color}-100`}>
                    <div className={`font-medium text-sm text-${color}-700 mb-2`}>{label}</div>
                    <div className="text-xs text-muted-foreground mb-1">目的</div>
                    <p className="text-sm mb-2">{item.purpose || '—'}</p>
                    <div className="text-xs text-muted-foreground mb-1">方法</div>
                    <p className="text-sm">{item.method || '—'}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // 渲染范读音频
  const renderAudios = () => {
    if (!plan || plan.audios.length === 0) return null;
    
    return (
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="w-5 h-5 text-green-600" />
            范读音频
          </CardTitle>
          <CardDescription>三种语速范读供课堂使用</CardDescription>
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
                  <div className="flex items-center gap-3 mb-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handlePlayAudio(audio.audioUrl)}
                    >
                      {currentAudio === audio.audioUrl && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div className="h-full w-1/3 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.ceil(audio.duration / 1000)}s
                    </span>
                  </div>
                  
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-1" />
                    下载音频
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染指导话术
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
          {/* 整体指导 */}
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-700 mb-2">整体朗读基调</div>
            <p className="text-sm leading-relaxed">{guidance.overallGuide}</p>
          </div>
          
          {/* 齐读组织 */}
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
            {guidance.chorusGuide.duringReading.length > 0 && (
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="text-xs text-muted-foreground">过程提示</div>
                <ul className="mt-1 space-y-1">
                  {guidance.chorusGuide.duringReading.map((t, i) => (
                    <li key={i} className="text-sm">• {t}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 p-2 bg-white rounded border">
              <div className="text-xs text-muted-foreground">结束话术</div>
              <p className="text-sm mt-1">{guidance.chorusGuide.ending}</p>
            </div>
          </div>
          
          {/* 常见问题 */}
          {guidance.commonIssues.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">常见问题及应对</div>
              {guidance.commonIssues.map((issue, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm text-red-600 mb-1">{issue.issue}</div>
                  <p className="text-sm text-muted-foreground">原因：{issue.cause}</p>
                  <p className="text-sm text-muted-foreground">应对：{issue.solution}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} className="hidden" />
      
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* 顶部导航 */}
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
        
        {/* 输入区域 */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-base">课文信息</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">课文标题</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：父爱之舟"
                />
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
                <label className="text-sm font-medium">文体类型（可自动识别）</label>
                <Select value={genre || 'auto'} onValueChange={(v) => setGenre(v === 'auto' ? '' : v as ReadingToneType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="自动识别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动识别</SelectItem>
                    {['古诗', '散文', '童话', '小说', '说明文', '议论文'].map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">课文内容</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="粘贴课文内容..."
                className="min-h-[120px]"
              />
            </div>
            
            {/* 生成选项 */}
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'willingness', label: '朗读意愿' },
                { key: 'experience', label: '朗读体验' },
                { key: 'skills', label: '朗读技巧' },
                { key: 'emotionalModel', label: '情感朗读模型' },
                { key: 'strategies', label: '教学策略' },
                { key: 'audios', label: '范读音频' },
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
              disabled={!text.trim() || !title.trim() || loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {loading ? (
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
            
            <ScrollArea className="h-[calc(100vh-400px)]">
              <TabsContent value="ontology" className="mt-0">
                {renderOntology()}
              </TabsContent>
              
              <TabsContent value="subject" className="mt-0">
                {renderSubjectCultivation()}
              </TabsContent>
              
              <TabsContent value="emotional" className="mt-0">
                {renderEmotionalModel()}
              </TabsContent>
              
              <TabsContent value="strategies" className="mt-0">
                {renderStrategies()}
              </TabsContent>
              
              <TabsContent value="audios" className="mt-0">
                {renderAudios()}
              </TabsContent>
              
              <TabsContent value="guidance" className="mt-0">
                {renderGuidance()}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </div>
    </div>
  );
}
