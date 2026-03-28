/**
 * 生字专项工具页面
 * 
 * 生成笔顺图、田字格范写、形近字辨析、多音字、听写清单、本体论推导、配套练习
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BookText,
  Loader2,
  Download,
  Eye,
  Grid3X3,
  Brain,
  FileText,
  MessageSquare,
} from 'lucide-react';
import type {
  CharacterInfo,
  SimilarCharGroup,
  PolyphonicChar,
  DictationItem,
  OntologyDerivation,
  ExerciseSet,
  GradeSentenceRequirement,
} from '@/types/chinese-prep';

// ==================== 主组件 ====================

export default function CharacterPage() {
  // 输入状态
  const [characters, setCharacters] = useState('');
  const [grade, setGrade] = useState<number>(4);
  const [options, setOptions] = useState({
    strokeOrder: true,
    gridWriting: true,
    similarChars: true,
    polyphonic: true,
    dictation: true,
    ontology: true, // 本体论推导
    exercises: true, // 配套练习
    sentences: true, // 造句
  });
  
  // 结果状态
  const [loading, setLoading] = useState(false);
  const [characterInfos, setCharacterInfos] = useState<CharacterInfo[]>([]);
  const [similarGroups, setSimilarGroups] = useState<SimilarCharGroup[]>([]);
  const [polyphonicChars, setPolyphonicChars] = useState<PolyphonicChar[]>([]);
  const [dictationList, setDictationList] = useState<DictationItem[]>([]);
  const [ontology, setOntology] = useState<OntologyDerivation[]>([]);
  const [exercises, setExercises] = useState<ExerciseSet | null>(null);
  const [sentenceReqs, setSentenceReqs] = useState<GradeSentenceRequirement | null>(null);
  
  // 生成素材
  const handleGenerate = async () => {
    if (!characters.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chinese-prep/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: characters.split(/[，,\s]+/).filter(Boolean),
          grade,
          generateOptions: options,
        }),
      });
      
      const data = await response.json();
      
      if (data.characters) setCharacterInfos(data.characters);
      if (data.similarGroups) setSimilarGroups(data.similarGroups);
      if (data.polyphonicChars) setPolyphonicChars(data.polyphonicChars);
      if (data.dictationList) setDictationList(data.dictationList);
      if (data.ontology) setOntology(data.ontology);
      if (data.exercises) setExercises(data.exercises);
      if (data.sentenceRequirements) setSentenceReqs(data.sentenceRequirements);
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ==================== 渲染函数 ====================
  
  // 渲染笔顺动画和田字格范写
  const renderStrokeOrder = (info: CharacterInfo) => (
    <Card key={info.char} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-blue-600">{info.char}</span>
            <span className="text-lg text-muted-foreground">{info.pinyin}</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{info.structure}</Badge>
            <Badge variant="outline">{info.strokeCount}画</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">部首：</span>
            <span className="font-medium">{info.radical}</span>
          </div>
          <div>
            <span className="text-muted-foreground">笔画：</span>
            <span className="font-medium">{info.strokeOrder.join(' → ')}</span>
          </div>
        </div>
        
        {/* 田字格范写 - 专业手写楷体风格 */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">田字格范写（楷体）：</div>
          <div className="flex items-center justify-center">
            {/* 田字格容器 */}
            <div 
              className="w-32 h-32 relative bg-white shadow-lg rounded-sm overflow-hidden"
              style={{
                border: '3px solid #dc2626',
                background: 'white'
              }}
            >
              {/* 虚线十字格 */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 横中线 - 虚线 */}
                <div 
                  className="absolute left-0 right-0 h-px"
                  style={{ 
                    top: '50%',
                    background: 'repeating-linear-gradient(90deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)'
                  }}
                />
                {/* 竖中线 - 虚线 */}
                <div 
                  className="absolute top-0 bottom-0 w-px"
                  style={{ 
                    left: '50%',
                    background: 'repeating-linear-gradient(180deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)'
                  }}
                />
                {/* 对角虚线 */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" />
                </svg>
              </div>
              
              {/* 手写楷体字 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="select-none"
                  style={{ 
                    fontFamily: '"KaiTi", "楷体", "STKaiti", "华文楷体", "SimKai", "Noto Serif SC", serif',
                    fontSize: '5rem',
                    lineHeight: 1,
                    color: '#1f2937',
                    fontWeight: 400,
                    letterSpacing: '-2px'
                  }}
                >
                  {info.char}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 笔画书写指导 */}
        {info.strokeGuide && info.strokeGuide.length > 0 && (
          <div className="text-xs p-2 bg-amber-50 rounded border border-amber-200">
            <div className="font-medium text-amber-700 mb-2">书写指导：</div>
            <div className="grid grid-cols-2 gap-1">
              {info.strokeGuide.map((stroke, idx) => (
                <div key={idx} className="flex items-start gap-1 p-1 bg-white rounded">
                  <span className="font-bold text-amber-600">{idx + 1}.</span>
                  <div>
                    <span className="font-medium">{stroke.name}</span>
                    <div className="text-muted-foreground text-[10px]">{stroke.position}</div>
                    {stroke.tip && (
                      <div className="text-orange-600 text-[10px]">💡{stroke.tip}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 组词 */}
        <div className="text-sm">
          <span className="text-muted-foreground">组词：</span>
          <span className="ml-2">{info.words.join('、')}</span>
        </div>
        
        {/* 下载按钮 */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-1" />
            下载笔顺图
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Grid3X3 className="w-4 h-4 mr-1" />
            下载田字格
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  // 渲染本体论推导
  const renderOntology = (item: OntologyDerivation) => (
    <Card key={item.char} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-purple-700">{item.char} - 本体论推导</div>
            <div className="text-xs text-muted-foreground">认知 → 理解 → 应用 → 拓展</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* 认知阶段 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">1</span>
            认知阶段
          </div>
          <div className="ml-8 space-y-2 text-sm bg-blue-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-blue-600">字形分析：</span>
              <span className="text-gray-700">{item.recognition.formAnalysis}</span>
            </div>
            <div>
              <span className="font-medium text-blue-600">读音线索：</span>
              <span className="text-gray-700">{item.recognition.phoneticClue}</span>
            </div>
            <div>
              <span className="font-medium text-blue-600">书写要点：</span>
              <span className="text-gray-700">{item.recognition.writingGuide}</span>
            </div>
          </div>
        </div>
        
        {/* 理解阶段 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">2</span>
            理解阶段
          </div>
          <div className="ml-8 space-y-2 text-sm bg-green-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-green-600">字义：</span>
              <span className="text-gray-700">{item.understanding.meaning}</span>
            </div>
            <div>
              <span className="font-medium text-green-600">字义演变：</span>
              <span className="text-gray-700">{item.understanding.meaningEvolution}</span>
            </div>
            <div>
              <span className="font-medium text-green-600">语义场：</span>
              <span className="text-gray-700">{item.understanding.semanticField.join('、')}</span>
            </div>
            <div>
              <span className="font-medium text-green-600">词语搭配：</span>
              <span className="text-gray-700">{item.understanding.collocation.join('、')}</span>
            </div>
          </div>
        </div>
        
        {/* 应用阶段 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs">3</span>
            应用阶段
          </div>
          <div className="ml-8 space-y-2 text-sm bg-orange-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-orange-600">基础组词：</span>
              <span className="text-gray-700">{item.application.basicWords.join('、')}</span>
            </div>
            <div>
              <span className="font-medium text-orange-600">拓展组词：</span>
              <span className="text-gray-700">{item.application.advancedWords.join('、')}</span>
            </div>
            {item.application.sentences && item.application.sentences.length > 0 && (
              <div>
                <span className="font-medium text-orange-600">造句：</span>
                <div className="mt-2 space-y-2">
                  {item.application.sentences.map((s, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border-l-4 border-orange-300">
                      <div className="text-gray-800">{s.sentence}</div>
                      {s.analysis && (
                        <div className="text-xs text-muted-foreground mt-1">💡 {s.analysis}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 拓展阶段 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-700">
            <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">4</span>
            拓展阶段
          </div>
          <div className="ml-8 space-y-2 text-sm bg-purple-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-purple-600">相关字：</span>
              <span className="text-gray-700">{item.extension.relatedCharacters.join('、')}</span>
            </div>
            <div>
              <span className="font-medium text-purple-600">文化背景：</span>
              <span className="text-gray-700">{item.extension.culturalContext}</span>
            </div>
            <div>
              <span className="font-medium text-purple-600">阅读建议：</span>
              <span className="text-gray-700">{item.extension.readingSuggestion}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // 渲染配套练习
  const renderExercises = () => {
    if (!exercises) return null;
    
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-700">{exercises.title}</div>
                <div className="text-xs text-muted-foreground">
                  {exercises.grade}年级 | 总分{exercises.totalScore}分 | 建议用时{exercises.timeSuggestion}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出练习
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {exercises.exercises.map((ex, idx) => (
            <div key={ex.id} className="p-4 border rounded-lg bg-white">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-medium text-emerald-700">{ex.typeName}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {ex.difficulty === 'easy' ? '基础' : ex.difficulty === 'medium' ? '中等' : '拓展'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">{ex.instruction}</div>
              
              <div className="text-base p-3 bg-gray-50 rounded border">
                {ex.content}
              </div>
              
              {/* 选择题选项 */}
              {ex.options && ex.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {ex.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                      <span className="w-6 h-6 rounded border flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 答案和解析 */}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-emerald-600 hover:text-emerald-700">
                  查看答案
                </summary>
                <div className="mt-2 p-3 bg-emerald-50 rounded border border-emerald-200">
                  <div className="text-sm">
                    <span className="font-medium text-emerald-700">答案：</span>
                    <span className="text-gray-800">
                      {Array.isArray(ex.answer) ? ex.answer.join('、') : ex.answer}
                    </span>
                  </div>
                  {ex.explanation && (
                    <div className="text-sm mt-2">
                      <span className="font-medium text-emerald-700">解析：</span>
                      <span className="text-gray-600">{ex.explanation}</span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          ))}
          
          {/* 答案汇总 */}
          <details className="p-4 border rounded-lg bg-emerald-50">
            <summary className="cursor-pointer font-medium text-emerald-700">
              答案汇总
            </summary>
            <div className="mt-3 text-sm whitespace-pre-line">{exercises.answerKey}</div>
          </details>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染形近字组
  const renderSimilarGroup = (group: SimilarCharGroup, idx: number) => (
    <Card key={idx} className="p-4">
      <div className="flex items-center gap-4 mb-3">
        <div className="text-3xl font-bold text-blue-600">{group.baseChar}</div>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
        <div className="text-sm text-muted-foreground">形近字辨析</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        {group.similarChars.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <span className="text-2xl">{item.char}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{item.pinyin}</div>
              <div className="text-xs text-muted-foreground">{item.difference}</div>
              <div className="text-xs text-blue-600">例：{item.example}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-amber-50 rounded border border-amber-200">
        <div className="text-sm font-medium text-amber-700">辨析要点：</div>
        <div className="text-sm mt-1">{group.analysis}</div>
      </div>
    </Card>
  );
  
  // 渲染多音字
  const renderPolyphonic = (item: PolyphonicChar) => (
    <Card key={item.char} className="p-4">
      <div className="text-2xl font-bold text-center mb-3">{item.char}</div>
      <div className="space-y-2">
        {item.readings.map((r, i) => (
          <div key={i} className="p-2 bg-gray-50 rounded">
            <div className="font-medium text-blue-600">{r.pinyin}</div>
            <div className="text-xs text-muted-foreground">{r.meaning}</div>
            <div className="text-xs">例：{r.example}</div>
          </div>
        ))}
      </div>
      {item.记忆口诀 && (
        <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
          💡 {item.记忆口诀}
        </div>
      )}
    </Card>
  );
  
  // 渲染听写清单
  const renderDictation = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">听写清单</h4>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" />
          导出清单
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {dictationList.map((item, i) => (
          <div key={i} className="p-3 border rounded-lg">
            <div className="text-2xl text-center mb-2">{item.char}</div>
            <div className="text-center text-sm text-muted-foreground mb-2">{item.pinyin}</div>
            <div className="text-xs text-center">{item.words.join('、')}</div>
            <Badge 
              variant="outline" 
              className="w-full mt-2 justify-center"
            >
              {item.difficulty === 'easy' ? '简单' : item.difficulty === 'medium' ? '中等' : '困难'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );

  // ==================== 主渲染 ====================
  
  return (
    <div className="p-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/lesson-prep/chinese">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">生字专项</h1>
            <p className="text-sm text-muted-foreground">完整教学素材生成：认知→理解→应用→巩固</p>
          </div>
        </div>
      </div>
      
      {/* 输入区域 */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">生字列表</label>
              <Textarea
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="输入生字，用逗号或空格分隔，如：舟、船、艇、舰"
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-4">
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
            </div>
          </div>
          
          {/* 生成选项 */}
          <div className="space-y-3">
            <div className="text-sm font-medium">生成选项</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'strokeOrder', label: '笔顺图', icon: '📝' },
                { key: 'gridWriting', label: '田字格范写', icon: '🔤' },
                { key: 'similarChars', label: '形近字辨析', icon: '🔍' },
                { key: 'polyphonic', label: '多音字', icon: '🔊' },
                { key: 'dictation', label: '听写清单', icon: '📋' },
                { key: 'ontology', label: '本体论推导', icon: '🧠', highlight: true },
                { key: 'exercises', label: '配套练习', icon: '📄', highlight: true },
                { key: 'sentences', label: '造句', icon: '💬', highlight: true },
              ].map(opt => (
                <label 
                  key={opt.key} 
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                    opt.highlight ? 'border-purple-200 bg-purple-50' : ''
                  }`}
                >
                  <Checkbox
                    checked={options[opt.key as keyof typeof options]}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, [opt.key]: checked }))
                    }
                  />
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={!characters.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                生成完整教学素材
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* 结果展示 */}
      {characterInfos.length > 0 && (
        <div className="space-y-6">
          {/* 生字卡片 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm">📝</span>
              生字详情
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characterInfos.map(renderStrokeOrder)}
            </div>
          </div>
          
          {/* 本体论推导 */}
          {ontology.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm">🧠</span>
                本体论推导
                <Badge variant="secondary">认知→理解→应用→拓展</Badge>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ontology.map(renderOntology)}
              </div>
            </div>
          )}
          
          {/* 配套练习 */}
          {exercises && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">📄</span>
                配套练习
              </h3>
              {renderExercises()}
            </div>
          )}
          
          {/* 形近字辨析 */}
          {similarGroups.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">形近字辨析</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarGroups.map(renderSimilarGroup)}
              </div>
            </div>
          )}
          
          {/* 多音字 */}
          {polyphonicChars.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">多音字</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {polyphonicChars.map(renderPolyphonic)}
              </div>
            </div>
          )}
          
          {/* 听写清单 */}
          {dictationList.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">听写清单</h3>
              {renderDictation()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
