'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, BookOpen, PenTool, Brain, FileText, Download, CheckCircle2, Save, FolderOpen } from 'lucide-react';
import type { CharacterInfo, OntologyDerivation, DictationItem, ExerciseSet } from '@/types/chinese-prep';

export default function CharacterPage() {
  const [chars, setChars] = useState('');
  const [grade, setGrade] = useState(2);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{
    characters: CharacterInfo[];
    ontology: OntologyDerivation[];
    dictationList: DictationItem[];
    exercises?: ExerciseSet;
  } | null>(null);
  const [err, setErr] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generate = async () => {
    if (!chars.trim()) {
      setErr('请输入生字');
      return;
    }

    setLoading(true);
    setErr('');
    setData(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/chinese-prep/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: chars.split(/[，,、\s]+/).filter(Boolean),
          grade,
          generateOptions: {
            strokeOrder: true,
            gridWriting: true,
            similarChars: true,
            polyphonic: true,
            dictation: true,
            exercises: true,
          },
        }),
      });

      const json = await res.json();
      
      if (json.characters && json.characters.length > 0) {
        setData(json);
      } else {
        setErr('生成失败，请重试');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const saveToResource = async () => {
    if (!data || !chars.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/teaching-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: chars.split(/[，,、\s]+/).filter(Boolean),
          grade,
          content: data,
        }),
      });
      
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErr(json.error || '保存失败');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep/chinese">
              <Button variant="ghost" size="sm" className="hover:bg-white/60">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                生字专项教学工具
              </h1>
              <p className="text-sm text-gray-500 mt-1">智能生成生字教学素材，助力语文备课</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/teacher/lesson-prep/my-resources">
              <Button variant="outline" size="sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                我的资源库
              </Button>
            </Link>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              {grade}年级
            </Badge>
          </div>
        </div>

        {/* 输入区域 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenTool className="w-5 h-5 text-blue-600" />
              输入生字
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Textarea
                  value={chars}
                  onChange={(e) => setChars(e.target.value)}
                  placeholder="请输入本课生字，用逗号、顿号或空格分隔，例如：舟、船、艇、舰"
                  className="min-h-[100px] text-lg border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">适用年级</label>
                  <Select value={String(grade)} onValueChange={(v) => setGrade(Number(v))}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(g => (
                        <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={generate} 
                  disabled={loading || !chars.trim()} 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {chars.split(/[，,、\s]+/).filter(Boolean).length > 1 
                        ? `正在生成 ${chars.split(/[，,、\s]+/).filter(Boolean).length} 个生字...` 
                        : '生成中...'}
                    </>
                  ) : (
                    '生成教学素材'
                  )}
                </Button>
              </div>
            </div>
            {err && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {err}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 结果展示 */}
        {data && data.characters.length > 0 && (
          <div className="space-y-6">
            
            {/* 操作栏 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                已生成 {data.characters.length} 个生字的教学素材
              </div>
              <Button 
                onClick={saveToResource} 
                disabled={saving || saveSuccess}
                variant={saveSuccess ? "default" : "outline"}
                className={saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>
                ) : saveSuccess ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />已保存到资源库</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />保存到我的资源库</>
                )}
              </Button>
            </div>
            
            {/* 生字卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.characters.map((char, idx) => (
                <Card key={idx} className="border-0 shadow-lg bg-white/90 overflow-hidden group hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
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
                        style={{
                          border: '3px solid #dc2626',
                        }}
                      >
                        {/* 辅助线 */}
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

                    {/* 笔画顺序展示 */}
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

                    {/* 书写指导详情 */}
                    {char.strokeGuide && char.strokeGuide.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                          详细书写指导
                        </summary>
                        <div className="mt-2 space-y-2 text-xs">
                          {char.strokeGuide.map((s, i) => (
                            <div key={i} className="p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-orange-600">第{i+1}笔：{s.name}</span>
                              </div>
                              <div className="text-gray-600">
                                <span className="text-gray-500">位置：</span>{s.position}
                              </div>
                              <div className="text-gray-600">
                                <span className="text-gray-500">要领：</span>{s.tip}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 本体论推导 */}
            {data.ontology && data.ontology.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/90">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    本体论推导 · 教学路径
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {data.ontology.map((ont, idx) => (
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
            {data.dictationList && data.dictationList.length > 0 && (
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
                    {data.dictationList.map((item, idx) => (
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
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                    💡 听写提示：按顺序读出词语，学生写出完整词语。生字"{data.dictationList[0]?.mainChar}"在词语中的位置需要特别注意书写规范。
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 配套练习 */}
            {data.exercises && data.exercises.exercises && data.exercises.exercises.length > 0 && (
              <Card className="border-0 shadow-lg bg-white/90">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {data.exercises.title}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-normal">
                      <span>共{data.exercises.totalScore}分</span>
                      <span>|</span>
                      <span>{data.exercises.timeSuggestion}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {data.exercises.exercises.map((exercise, idx) => (
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
                    <div className="text-sm text-gray-600">{data.exercises.answerKey}</div>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
