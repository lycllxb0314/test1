/**
 * 教学资源详情页
 * 
 * 展示单个资源的完整内容
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, 
  BookOpen, 
  Brain, 
  FileText, 
  CheckCircle2,
  Trash2,
  Eye,
  Clock,
  Loader2,
  Mic2,
  Volume2,
  Music,
  Heart,
  Target,
  Sparkles,
  Play,
  MessageCircle,
  Users,
  Edit,
  Save,
  X,
  Calculator,
  Lightbulb,
  Network,
  Route,
} from 'lucide-react';
import type { TeachingResource, CharacterResourceContent, ReadingResourceContent } from '@/types/teaching-resource';
import type { ReadingTeachingPlan } from '@/types/chinese-prep';
import type { MathPrepPlan } from '@/types/math-prep';
import { cn } from '@/lib/utils';
import { WritingResourceEditor, type WritingContent } from '@/components/resource-editors/WritingResourceEditor';

// 分类名称映射
const CATEGORY_NAMES: Record<string, string> = {
  chinese_character: '语文·生字专项',
  chinese_reading: '语文·朗读教学',
  chinese_writing: '语文·习作专项',
  chinese_chat: '语文·备课智能体',
  math: '数学·概念教学',
  math_concept: '数学·概念教学',
  math_problem: '数学·问题设计',
  other: '其他',
};

// 分类颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  chinese_character: 'from-blue-500 to-indigo-500',
  chinese_reading: 'from-green-500 to-teal-500',
  chinese_writing: 'from-purple-500 to-pink-500',
  chinese_chat: 'from-red-500 to-orange-500',
  math: 'from-indigo-500 to-violet-500',
  math_concept: 'from-indigo-500 to-violet-500',
  math_problem: 'from-cyan-500 to-blue-500',
  other: 'from-gray-500 to-slate-500',
};

export default function ResourceDetailPage() {
  const params = useParams();
  const resourceId = params.id as string;
  
  const [resource, setResource] = useState<TeachingResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  
  // 数学资源 Tab 状态
  const [mathActiveTab, setMathActiveTab] = useState<'essence' | 'process' | 'thought' | 'structure' | 'path'>('essence');

  useEffect(() => {
    loadResource();
  }, [resourceId]);

  const loadResource = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teaching-resources/${resourceId}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setResource(data.data);
        setEditedContent(data.data.content as Record<string, unknown>);
      } else {
        setErr(data.error || '资源不存在');
      }
    } catch (error) {
      setErr('加载资源失败');
    } finally {
      setLoading(false);
    }
  };

  // 进入编辑模式
  const handleEdit = () => {
    if (resource) {
      setEditedContent(JSON.parse(JSON.stringify(resource.content as Record<string, unknown>)));
      setIsEditing(true);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (resource) {
      setEditedContent(JSON.parse(JSON.stringify(resource.content as Record<string, unknown>)));
    }
  };

  // 保存编辑
  const handleSave = async () => {
    if (!resource) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/teaching-resources/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      
      const data = await res.json();
      if (data.success) {
        setResource(data.data);
        setIsEditing(false);
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个资源吗？')) return;

    try {
      const res = await fetch(`/api/teaching-resources/${resourceId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        window.location.href = '/teacher/lesson-prep/my-resources';
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (err || !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/teacher/lesson-prep/my-resources">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回资源库
            </Button>
          </Link>
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <p className="text-red-500">{err || '资源不存在'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const colorClass = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.other;

  // 解析内容（编辑模式使用 editedContent，否则使用原始内容）
  const content = (isEditing ? editedContent : resource.content) as unknown as CharacterResourceContent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep/my-resources">
              <Button variant="ghost" size="sm" className="hover:bg-white/60">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {resource.title}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{CATEGORY_NAMES[resource.category] || '未知分类'}</span>
                {resource.grade && <span>· {resource.grade}年级</span>}
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {resource.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(resource.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存修改
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  编辑内容
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* 编辑模式提示 */}
        {isEditing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <Edit className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              编辑模式：修改内容后点击"保存修改"按钮保存更改
            </span>
          </div>
        )}

        {/* 生字专项内容 */}
        {resource.category === 'chinese_character' && content.characters && (
          <div className="space-y-6">
            
            {/* 生字卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.characters.map((char, idx) => (
                <Card key={idx} className="border-0 shadow-lg bg-white/90 overflow-hidden">
                  <div className={`bg-gradient-to-r ${colorClass} p-4`}>
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <span className="text-4xl font-bold">{char.char}</span>
                        <span className="ml-3 text-lg opacity-90">{char.pinyin}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                          {char.structure}
                        </Badge>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                          {char.strokeCount}画
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    {/* 田字格范写 */}
                    <div className="flex items-center justify-center py-3">
                      <div 
                        className="w-28 h-28 relative bg-white shadow-inner rounded"
                        style={{ border: '3px solid #dc2626' }}
                      >
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-0 right-0 h-px bg-red-300 opacity-50" style={{top: '50%'}} />
                          <div className="absolute top-0 bottom-0 w-px bg-red-300 opacity-50" style={{left: '50%'}} />
                          <svg className="absolute inset-0 w-full h-full opacity-30">
                            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#f87171" strokeWidth="0.5" strokeDasharray="3,3" />
                            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#f87171" strokeWidth="0.5" strokeDasharray="3,3" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span 
                            style={{ 
                              fontFamily: '"KaiTi", "楷体", "STKaiti", serif',
                              fontSize: '4.5rem',
                              lineHeight: 1,
                              color: '#1f2937',
                            }}
                          >
                            {char.char}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 笔画顺序 */}
                    {char.strokeOrder && char.strokeOrder.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                        <div className="text-xs font-medium text-orange-700 mb-2">笔画顺序（共{char.strokeCount}画）</div>
                        <div className="flex flex-wrap gap-1.5">
                          {char.strokeOrder.map((stroke, i) => (
                            <div 
                              key={i} 
                              className="flex items-center justify-center min-w-[2.5rem] h-8 px-2 bg-white rounded border border-orange-200 text-sm font-medium text-gray-700 shadow-sm whitespace-nowrap"
                            >
                              <span className="text-orange-500 text-xs mr-1">{i + 1}.</span>
                              <span>{stroke}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 基本信息 */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">部首：</span>
                        <span className="font-medium ml-1">{char.radical}</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">笔画：</span>
                        <span className="font-medium ml-1">{char.strokeCount}画</span>
                      </div>
                    </div>

                    {/* 组词 */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">组词</div>
                      <div className="font-medium text-gray-700">{char.words?.join('、')}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 本体论推导 */}
            {content.ontology && content.ontology.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/90">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    本体论推导 · 教学路径
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {content.ontology.map((ont, idx) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-100">
                          <span className="text-2xl font-bold text-purple-600">{ont.char}</span>
                          <span className="text-sm text-gray-500">教学推导路径</span>
                        </div>
                        
                        {/* 认知阶段 */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">1</div>
                          <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                            <div className="font-medium text-blue-700 mb-2">认知阶段</div>
                            <div className="text-sm space-y-1 text-gray-600">
                              <div>• 字形：{ont.recognition.formAnalysis}</div>
                              <div>• 书写：{ont.recognition.writingGuide}</div>
                            </div>
                          </div>
                        </div>

                        {/* 理解阶段 */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">2</div>
                          <div className="flex-1 p-3 bg-green-50 rounded-lg">
                            <div className="font-medium text-green-700 mb-2">理解阶段</div>
                            <div className="text-sm space-y-1 text-gray-600">
                              <div>• 字义：{ont.understanding.meaning}</div>
                              <div>• 搭配：{ont.understanding.collocation?.join('、')}</div>
                            </div>
                          </div>
                        </div>

                        {/* 应用阶段 */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">3</div>
                          <div className="flex-1 p-3 bg-orange-50 rounded-lg">
                            <div className="font-medium text-orange-700 mb-2">应用阶段</div>
                            <div className="text-sm space-y-1">
                              <div className="text-gray-600">组词：{ont.application.basicWords?.join('、')}</div>
                              {ont.application.sentences && ont.application.sentences.length > 0 && (
                                <div className="mt-2 p-2 bg-white rounded border-l-4 border-orange-300">
                                  {ont.application.sentences[0].sentence}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 拓展阶段 */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">4</div>
                          <div className="flex-1 p-3 bg-purple-50 rounded-lg">
                            <div className="font-medium text-purple-700 mb-2">拓展阶段</div>
                            <div className="text-sm space-y-1 text-gray-600">
                              <div>• 文化：{ont.extension.culturalContext}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 组词听写清单 */}
            {content.dictationList && content.dictationList.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/90">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    组词听写清单
                  </CardTitle>
                  <p className="text-sm text-white/80 mt-1">老师读词语，学生写词语</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {content.dictationList.map((item, idx) => (
                      <div key={idx} className="text-center p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold mb-1 text-gray-800">{item.word}</div>
                        <div className="text-sm text-gray-500 mb-2">{item.pinyin}</div>
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            生字：{item.mainChar}
                          </Badge>
                          <Badge 
                            variant={item.difficulty === 'easy' ? 'secondary' : item.difficulty === 'medium' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {item.difficulty === 'easy' ? '基础' : item.difficulty === 'medium' ? '中等' : '拓展'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 配套练习 */}
            {content.exercises && content.exercises.exercises && content.exercises.exercises.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/90">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {content.exercises.title}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-normal">
                      <span>共{content.exercises.totalScore}分</span>
                      <span>|</span>
                      <span>{content.exercises.timeSuggestion}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {content.exercises.exercises.map((exercise, idx) => (
                    <div key={exercise.id} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-sm">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-amber-700">{exercise.typeName}</span>
                          <Badge variant="outline" className="text-xs">
                            {exercise.difficulty === 'easy' ? '基础' : exercise.difficulty === 'medium' ? '中等' : '拓展'}
                          </Badge>
                        </div>
                        {exercise.relatedChar && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            生字：{exercise.relatedChar}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">{exercise.instruction}</div>
                      
                      <div className="p-4 bg-white rounded border-2 border-dashed border-amber-200">
                        {exercise.type === 'pinyin_write' && (
                          <div className="text-center">
                            <span className="text-2xl font-medium text-gray-700">{exercise.content}</span>
                          </div>
                        )}
                        {exercise.type === 'word_formation' && (
                          <div className="text-center">
                            <span className="text-2xl font-bold text-gray-800">{exercise.content}</span>
                          </div>
                        )}
                        {exercise.type === 'sentence_writing' && (
                          <div className="text-center">
                            <span className="text-xl font-medium text-gray-700">用"（　{exercise.content}　）"写句子</span>
                          </div>
                        )}
                        {exercise.type === 'fill_blank' && (
                          <div className="text-lg text-gray-700">{exercise.content.replace(/_{2,}/g, '______')}</div>
                        )}
                      </div>
                      
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-amber-600 hover:text-amber-700 font-medium">
                          参考答案
                        </summary>
                        <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">
                              {Array.isArray(exercise.answer) ? exercise.answer.join('、') : exercise.answer}
                            </span>
                          </div>
                          {exercise.explanation && (
                            <div className="mt-1 text-xs text-gray-500">{exercise.explanation}</div>
                          )}
                        </div>
                      </details>
                    </div>
                  ))}
                  
                  {/* 答案速查 */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-gray-700 mb-2">答案速查</div>
                    <div className="text-sm text-gray-600">{content.exercises.answerKey}</div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}

        {/* 朗读教学资源 */}
        {resource.category === 'chinese_reading' && (() => {
          const readingContent = resource.content as unknown as ReadingTeachingPlan;
          
          return (
            <div className="space-y-6">
              {/* 本体论 */}
              {readingContent.ontology && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-green-600" />
                      本体论推导
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                        <div className="text-sm text-muted-foreground mb-1">为什么教朗读</div>
                        <p className="text-sm">{readingContent.ontology.whyTeach}</p>
                      </div>
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="text-sm text-muted-foreground mb-1">教学目的</div>
                        <p className="text-sm">{readingContent.ontology.teachingPurpose}</p>
                      </div>
                      <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                        <div className="text-sm text-muted-foreground mb-1">价值取向</div>
                        <p className="text-sm">{readingContent.ontology.valueOrientation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 朗读主体培育 */}
              {readingContent.subjectCultivation && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="w-5 h-5 text-blue-600" />
                      朗读主体培育
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 朗读意愿 */}
                      <div className="p-4 bg-pink-50/50 rounded-lg border border-pink-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-pink-500" />
                          <span className="font-medium text-pink-700">朗读意愿</span>
                        </div>
                        <p className="text-sm text-gray-600">{readingContent.subjectCultivation.willingness?.emotionalTrigger || readingContent.subjectCultivation.willingness?.introductionScript || '暂无'}</p>
                      </div>
                      
                      {/* 朗读体验 */}
                      <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-amber-700">朗读体验</span>
                        </div>
                        <p className="text-sm text-gray-600">{readingContent.subjectCultivation.experience?.imaginationRestore?.guidanceScript || '暂无'}</p>
                      </div>
                      
                      {/* 朗读技巧 */}
                      <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic2 className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-700">朗读技巧</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          重音：{readingContent.subjectCultivation.skills?.stress?.points?.length || 0} 处<br/>
                          停顿：{readingContent.subjectCultivation.skills?.pause?.points?.length || 0} 处
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 情感朗读模型 */}
              {readingContent.emotionalModel && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Music className="w-5 h-5 text-purple-600" />
                      情感朗读模型
                    </CardTitle>
                    <CardDescription>五环节闭环：感悟 → 想象 → 求气 → 创调 → 反听</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1. 感悟 */}
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                          <span className="font-medium text-blue-700">感悟</span>
                        </div>
                        <p className="text-sm">{readingContent.emotionalModel.comprehension?.emotionalTone || '暂无'}</p>
                        {readingContent.emotionalModel.comprehension?.emotionalKeywords && readingContent.emotionalModel.comprehension.emotionalKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {readingContent.emotionalModel.comprehension.emotionalKeywords.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* 2. 想象 */}
                      <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                          <span className="font-medium text-purple-700">想象</span>
                        </div>
                        <p className="text-sm">{readingContent.emotionalModel.imagination?.guidanceScript || '暂无'}</p>
                        {readingContent.emotionalModel.imagination?.coreScenes && readingContent.emotionalModel.imagination.coreScenes.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            核心画面：{readingContent.emotionalModel.imagination.coreScenes.join('；')}
                          </div>
                        )}
                      </div>
                      
                      {/* 3. 求气 */}
                      <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                          <span className="font-medium text-amber-700">求气</span>
                        </div>
                        <p className="text-sm">{readingContent.emotionalModel.breathControl?.breathType || '暂无'}</p>
                        {readingContent.emotionalModel.breathControl?.breathPoints && readingContent.emotionalModel.breathControl.breathPoints.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {readingContent.emotionalModel.breathControl.breathPoints.join('；')}
                          </div>
                        )}
                      </div>
                      
                      {/* 4. 创调 */}
                      <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                          <span className="font-medium text-green-700">创调</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>语速：{readingContent.emotionalModel.toneCreation?.speed || '标准'}</div>
                          <div>语调：{readingContent.emotionalModel.toneCreation?.intonation || '自然'}</div>
                          {readingContent.emotionalModel.toneCreation?.flow && (
                            <div>语流：{readingContent.emotionalModel.toneCreation.flow}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* 5. 反听 */}
                      <div className="p-4 bg-rose-50/50 rounded-lg border border-rose-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">5</span>
                          <span className="font-medium text-rose-700">反听</span>
                        </div>
                        <p className="text-sm">{readingContent.emotionalModel.selfMonitoring?.guidanceScript || '暂无'}</p>
                        {readingContent.emotionalModel.selfMonitoring?.checkpoints && readingContent.emotionalModel.selfMonitoring.checkpoints.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            反听要点：{readingContent.emotionalModel.selfMonitoring.checkpoints.join('；')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 范读音频 */}
              {readingContent.audios && readingContent.audios.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Volume2 className="w-5 h-5 text-green-600" />
                      范读音频
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {readingContent.audios.map((audio, idx) => (
                        <div key={idx} className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {audio.speed === 'slow' ? '慢速' : audio.speed === 'standard' ? '标准' : '情感'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{Math.ceil(audio.duration / 1000)}s</span>
                          </div>
                          <audio 
                            controls 
                            className="w-full h-8"
                            src={audio.audioUrl}
                          >
                            您的浏览器不支持音频播放
                          </audio>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 课堂指导话术 */}
              {readingContent.guidance && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mic2 className="w-5 h-5 text-indigo-600" />
                      课堂指导话术
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {readingContent.guidance.chorusGuide && (
                      <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <div className="text-sm font-medium text-indigo-700 mb-3">齐读组织话术</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-muted-foreground">准备话术</div>
                            <p className="text-sm mt-1">{readingContent.guidance.chorusGuide.preparation}</p>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-muted-foreground">起始信号</div>
                            <p className="text-sm mt-1">{readingContent.guidance.chorusGuide.startSignal}</p>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-muted-foreground">结束话术</div>
                            <p className="text-sm mt-1">{readingContent.guidance.chorusGuide.ending}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {readingContent.guidance.commonIssues && readingContent.guidance.commonIssues.length > 0 && (
                      <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                        <div className="text-sm font-medium text-orange-700 mb-3">常见问题与纠正</div>
                        <div className="space-y-2">
                          {readingContent.guidance.commonIssues.map((issue, idx) => (
                            <div key={idx} className="p-3 bg-white rounded border">
                              <div className="font-medium text-sm">{issue.issue}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                原因：{issue.cause} | 纠正：{issue.solution}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 教学策略 */}
              {readingContent.strategies?.integration && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                      四环节教学策略
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'firstReading', label: '初读', color: 'blue' },
                        { key: 'intensiveReading', label: '精读', color: 'green' },
                        { key: 'appreciativeReading', label: '品读', color: 'purple' },
                        { key: 'fluentReading', label: '熟读', color: 'orange' },
                      ].map(({ key, label, color }) => {
                        const step = readingContent.strategies?.integration?.[key as keyof typeof readingContent.strategies.integration];
                        if (!step) return null;
                        return (
                          <div key={key} className={`p-4 bg-${color}-50/50 rounded-lg border border-${color}-100`}>
                            <div className={`font-medium text-${color}-700 mb-2`}>{label}</div>
                            <div className="text-sm">
                              <div className="text-muted-foreground">目标：{step.purpose || '暂无'}</div>
                              <div className="text-muted-foreground mt-1">方法：{step.method || '暂无'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}

        {/* 习作教学资源 */}
        {resource.category === 'chinese_writing' && (() => {
          // 编辑模式使用 editedContent，否则使用原始内容
          const writingContent = (isEditing ? editedContent : resource.content) as unknown as {
            outline?: {
              structure: Array<{
                section: string;
                content: string;
                keyPoints: string[];
                wordCount: string;
              }>;
              transitionPhrases: string[];
            };
            expressions?: {
              words: Array<{ word: string; meaning: string }>;
              sentences: Array<{ sentence: string; technique: string; imitation?: string }>;
            };
            tieredTasks?: Array<{
              level: string;
              levelName: string;
              task: string;
              requirements: string[];
              scaffold: string;
              evaluationCriteria: string[];
            }>;
            evaluationGuide?: {
              teacherRubric: Array<{
                dimension: string;
                excellent: string;
                good: string;
                improving: string;
              }>;
              selfCheck: Array<{
                aspect: string;
                questions: string[];
              }>;
            };
            commonIssues?: Array<{
              issue: string;
              manifestation: string;
              correctionGuide: string;
            }>;
          };
          
          // 编辑模式：使用编辑器
          if (isEditing) {
            return (
              <WritingResourceEditor
                content={writingContent as WritingContent}
                onChange={(newContent) => setEditedContent(newContent as Record<string, unknown>)}
              />
            );
          }
          
          // 非编辑模式：展示界面
          const lessonInfo = {
            title: resource.title,
            grade: resource.grade || 4,
            writingType: '习作',
            unit: resource.description || resource.lessonTitle || '',
          };
          
          const hasEvaluationGuide = writingContent?.evaluationGuide && writingContent.evaluationGuide.teacherRubric.length > 0;
          
          return (
            <div className="space-y-6">
              {/* 批改入口 */}
              {hasEvaluationGuide && (
                <Card className="border-none shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold mb-1">批改学生习作</h3>
                        <p className="text-sm text-white/80">
                          基于本方案的评改标准，对学生习作进行客观批改
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // 使用 sessionStorage 存储数据，避免 URL 过长
                          sessionStorage.setItem('correction_lessonInfo', JSON.stringify(lessonInfo));
                          sessionStorage.setItem('correction_content', JSON.stringify({
                            evaluationGuide: writingContent.evaluationGuide,
                            commonIssues: writingContent.commonIssues,
                          }));
                          window.location.href = '/teacher/lesson-prep/chinese/correction';
                        }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-indigo-600 hover:bg-white/90 h-9 px-4 py-2"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        开始批改
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* 写作提纲 */}
              {writingContent?.outline && writingContent.outline.structure.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      写作提纲
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {writingContent.outline.structure.map((section, idx) => (
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
                    
                    {writingContent.outline.transitionPhrases.length > 0 && (
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="text-sm font-medium text-blue-700 mb-2">过渡语句</div>
                        <div className="flex flex-wrap gap-2">
                          {writingContent.outline.transitionPhrases.map((phrase, idx) => (
                            <Badge key={idx} variant="outline" className="bg-white">{phrase}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* 好词好句 */}
              {writingContent?.expressions && writingContent.expressions.words.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      好词好句素材库
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {writingContent.expressions.words.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 rounded-lg border border-amber-100">
                        <div className="text-sm font-medium text-amber-700 mb-3">描写词语</div>
                        <div className="flex flex-wrap gap-2">
                          {writingContent.expressions.words.slice(0, 20).map((item, idx) => (
                            <Badge key={idx} variant="outline" className="py-1.5 px-3 bg-white">{item.word}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {writingContent.expressions.sentences.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
                        <div className="text-sm font-medium text-green-700 mb-3">精彩句式</div>
                        <div className="space-y-3">
                          {writingContent.expressions.sentences.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-lg border border-green-100">
                              <p className="text-sm mb-2">{item.sentence}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">{item.technique}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* 分层任务 */}
              {writingContent?.tieredTasks && writingContent.tieredTasks.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-600" />
                      分层任务
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {writingContent.tieredTasks.map((task, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border ${
                        task.level === 'basic' ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-100' :
                        task.level === 'intermediate' ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100' :
                        'bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-purple-100'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`${
                            task.level === 'basic' ? 'bg-green-100 text-green-700' :
                            task.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {task.levelName}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-2">{task.task}</p>
                        {task.requirements.length > 0 && (
                          <div className="text-xs text-muted-foreground mb-2">
                            <span className="font-medium">要求：</span>
                            {task.requirements.join('；')}
                          </div>
                        )}
                        {task.scaffold && (
                          <div className="text-xs text-blue-600 mt-2 whitespace-pre-line">
                            {task.scaffold}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {/* 评改标准 */}
              {writingContent?.evaluationGuide && writingContent.evaluationGuide.teacherRubric.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      评改标准
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-2 font-medium">维度</th>
                            <th className="text-left p-2 font-medium text-green-600">优秀</th>
                            <th className="text-left p-2 font-medium text-blue-600">良好</th>
                            <th className="text-left p-2 font-medium text-orange-600">待提高</th>
                          </tr>
                        </thead>
                        <tbody>
                          {writingContent.evaluationGuide.teacherRubric.map((item, idx) => (
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
                  </CardContent>
                </Card>
              )}
              
              {/* 常见问题 */}
              {writingContent?.commonIssues && writingContent.commonIssues.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-red-600" />
                      常见问题预警
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {writingContent.commonIssues.map((issue, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100">
                        <div className="font-medium text-sm text-orange-700 mb-1">{issue.issue}</div>
                        <div className="text-xs text-muted-foreground mb-1">表现：{issue.manifestation}</div>
                        <div className="text-xs text-blue-600">指导策略：{issue.correctionGuide}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}

        {/* 数学备课资源 */}
        {resource.category === 'math' && (() => {
          const mathContent = resource.content as unknown as MathPrepPlan;
          
          return (
            <div className="space-y-6">
              {/* Tab 切换 */}
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
                    onClick={() => setMathActiveTab(tab.key as typeof mathActiveTab)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-sm rounded-t transition-colors',
                      mathActiveTab === tab.key 
                        ? `bg-${tab.color}-50 text-${tab.color}-700 border-b-2 border-${tab.color}-500` 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* 内容展示 */}
              <div className="space-y-4">
                {mathActiveTab === 'essence' && mathContent.essence && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-blue-600" />
                        本质挖掘
                      </CardTitle>
                      <CardDescription>知识的数学本质与核心概念</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
                        <div className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          核心定义
                        </div>
                        <p className="text-sm leading-relaxed">{mathContent.essence.conceptCore.definition}</p>
                      </div>
                      
                      {mathContent.essence.conceptCore.essentialAttributes.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 rounded-lg border border-cyan-100">
                          <div className="text-sm font-medium text-cyan-700 mb-3">本质属性</div>
                          <div className="flex flex-wrap gap-2">
                            {mathContent.essence.conceptCore.essentialAttributes.map((attr, i) => (
                              <Badge key={i} className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">{attr}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {mathContent.essence.connotationAnalysis.coreElements.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg border border-indigo-100">
                          <div className="text-sm font-medium text-indigo-700 mb-3">核心要素</div>
                          <div className="flex flex-wrap gap-2">
                            {mathContent.essence.connotationAnalysis.coreElements.map((elem, i) => (
                              <Badge key={i} variant="outline" className="bg-white border-indigo-200">{elem}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {mathContent.essence.connotationAnalysis.difficultPoints.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-lg border border-amber-100">
                          <div className="text-sm font-medium text-amber-700 mb-3">理解难点</div>
                          <div className="space-y-2">
                            {mathContent.essence.connotationAnalysis.difficultPoints.map((point, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {mathActiveTab === 'process' && mathContent.process && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        过程还原
                      </CardTitle>
                      <CardDescription>知识形成过程与认知路径</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
                        <div className="text-sm font-medium text-green-700 mb-2">知识起源</div>
                        <p className="text-sm">{mathContent.process.knowledgeOrigin.historicalBackground}</p>
                      </div>
                      
                      {mathContent.process.recreationDesign.thinkingProcess.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 rounded-lg border border-teal-100">
                          <div className="text-sm font-medium text-teal-700 mb-3">思考过程</div>
                          <div className="space-y-2">
                            {mathContent.process.recreationDesign.thinkingProcess.map((step, i) => (
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
                      )}
                      
                      {mathContent.process.recreationDesign.inquiryActivities.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-lg border border-emerald-100">
                          <div className="text-sm font-medium text-emerald-700 mb-3">探究活动设计</div>
                          <div className="flex flex-wrap gap-2">
                            {mathContent.process.recreationDesign.inquiryActivities.map((activity, i) => (
                              <Badge key={i} variant="outline" className="bg-white border-emerald-200 py-1.5">{activity}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {mathActiveTab === 'thought' && mathContent.thought && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        思想显影
                      </CardTitle>
                      <CardDescription>蕴含的数学思想方法</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {mathContent.thought.implicitThoughts.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100">
                          <div className="text-sm font-medium text-purple-700 mb-3">隐含的数学思想</div>
                          <div className="flex flex-wrap gap-2">
                            {mathContent.thought.implicitThoughts.map((t, i) => (
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
                      )}
                      
                      {mathContent.thought.thoughtSystem.mainThread && (
                        <div className="p-4 bg-gradient-to-r from-violet-50/50 to-purple-50/50 rounded-lg border border-violet-100">
                          <div className="text-sm font-medium text-violet-700 mb-2">主线思想</div>
                          <p className="text-sm">{mathContent.thought.thoughtSystem.mainThread}</p>
                        </div>
                      )}
                      
                      {mathContent.thought.infiltrationPoints.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-pink-50/50 to-rose-50/50 rounded-lg border border-pink-100">
                          <div className="text-sm font-medium text-pink-700 mb-3">思想渗透节点</div>
                          <div className="space-y-3">
                            {mathContent.thought.infiltrationPoints.slice(0, 5).map((point, i) => (
                              <div key={i} className="p-3 bg-white rounded-lg border border-pink-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs border-pink-300">{point.teachingPhase}</Badge>
                                  <Badge className="text-xs bg-pink-100 text-pink-700">{point.thought}</Badge>
                                </div>
                                {point.script && (
                                  <p className="text-xs text-pink-600 mt-1 italic">"{point.script}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {mathActiveTab === 'structure' && mathContent.structure && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Network className="w-5 h-5 text-orange-600" />
                        结构贯通
                      </CardTitle>
                      <CardDescription>知识结构网络与关联</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
                          <div className="text-sm font-medium text-blue-700 mb-2">前置知识</div>
                          <p className="text-sm mb-1">{mathContent.structure.verticalConnection.priorLink.content || '无'}</p>
                          {mathContent.structure.verticalConnection.priorLink.connectionPoint && (
                            <p className="text-xs text-muted-foreground">
                              衔接点：{mathContent.structure.verticalConnection.priorLink.connectionPoint}
                            </p>
                          )}
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
                          <div className="text-sm font-medium text-green-700 mb-2">后续延伸</div>
                          <p className="text-sm mb-1">{mathContent.structure.verticalConnection.subsequentLink.content || '无'}</p>
                          {mathContent.structure.verticalConnection.subsequentLink.extensionDirection && (
                            <p className="text-xs text-muted-foreground">
                              延伸方向：{mathContent.structure.verticalConnection.subsequentLink.extensionDirection}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {mathContent.structure.horizontalConnection.methodTransfer.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100">
                          <div className="text-sm font-medium text-orange-700 mb-3">方法迁移</div>
                          <div className="flex flex-wrap gap-2">
                            {mathContent.structure.horizontalConnection.methodTransfer.map((method, i) => (
                              <Badge key={i} variant="outline" className="bg-white border-orange-200">{method}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {mathContent.structure.unifiedFramework.superordinateConcept && (
                        <div className="p-4 bg-muted/30 rounded-lg border">
                          <div className="text-sm font-medium text-muted-foreground mb-2">上位概念</div>
                          <p className="text-sm">{mathContent.structure.unifiedFramework.superordinateConcept}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {mathActiveTab === 'path' && mathContent.teachingPath && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Route className="w-5 h-5 text-rose-600" />
                        教学路径
                      </CardTitle>
                      <CardDescription>基于四维分析的教学实施建议</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {mathContent.teachingPath.objectives.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-rose-50/50 to-pink-50/50 rounded-lg border border-rose-100">
                          <div className="text-sm font-medium text-rose-700 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            教学目标
                          </div>
                          <div className="space-y-2">
                            {mathContent.teachingPath.objectives.map((obj, i) => (
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
                                  <span>{obj.content}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        {mathContent.teachingPath.keyDifficulty.keyPoints.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
                            <div className="text-sm font-medium text-blue-700 mb-3">教学重点</div>
                            <div className="space-y-2">
                              {mathContent.teachingPath.keyDifficulty.keyPoints.map((point, i) => (
                                <div key={i} className="text-sm p-2 bg-white rounded border border-blue-100">
                                  <div className="font-medium">{point.content}</div>
                                  {point.strategy && <div className="text-xs text-blue-600 mt-1">策略：{point.strategy}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {mathContent.teachingPath.keyDifficulty.difficulties.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100">
                            <div className="text-sm font-medium text-orange-700 mb-3">教学难点</div>
                            <div className="space-y-2">
                              {mathContent.teachingPath.keyDifficulty.difficulties.map((diff, i) => (
                                <div key={i} className="text-sm p-2 bg-white rounded border border-orange-100">
                                  <div className="font-medium">{diff.content}</div>
                                  {diff.breakthrough && <div className="text-xs text-orange-600 mt-1">突破：{diff.breakthrough}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {mathContent.teachingPath.phases.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 rounded-lg border border-teal-100">
                          <div className="text-sm font-medium text-teal-700 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            教学环节
                          </div>
                          <div className="space-y-3">
                            {mathContent.teachingPath.phases.map((phase, i) => (
                              <div key={i} className="p-3 bg-white rounded-lg border border-teal-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">
                                    {i + 1}
                                  </div>
                                  <Badge variant="default" className="text-xs bg-teal-600">{phase.name}</Badge>
                                  <span className="text-xs text-muted-foreground">约{phase.duration}分钟</span>
                                </div>
                                {phase.activities.length > 0 && (
                                  <p className="text-sm text-muted-foreground">{phase.activities.join('、')}</p>
                                )}
                                {phase.designIntent && (
                                  <p className="text-xs text-teal-600 mt-1">设计意图：{phase.designIntent}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        })()}

        {/* 其他类型资源（暂时显示原始JSON） */}
        {resource.category !== 'chinese_character' && 
         resource.category !== 'chinese_reading' && 
         resource.category !== 'chinese_writing' && 
         resource.category !== 'math' && (
          <Card className="border-0 shadow-lg bg-white/90">
            <CardHeader>
              <CardTitle>资源内容</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-50 rounded-lg overflow-auto text-sm">
                {JSON.stringify(resource.content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
