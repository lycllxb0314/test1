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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import type { TeachingResource, CharacterResourceContent } from '@/types/teaching-resource';

// 分类名称映射
const CATEGORY_NAMES: Record<string, string> = {
  chinese_character: '语文·生字专项',
  chinese_reading: '语文·朗读教学',
  chinese_writing: '语文·习作专项',
  chinese_chat: '语文·备课智能体',
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
      } else {
        setErr(data.error || '资源不存在');
      }
    } catch (error) {
      setErr('加载资源失败');
    } finally {
      setLoading(false);
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

  // 解析内容
  const content = resource.content as unknown as CharacterResourceContent;

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
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除资源
          </Button>
        </div>

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

        {/* 其他类型资源（暂时显示原始JSON） */}
        {resource.category !== 'chinese_character' && (
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
