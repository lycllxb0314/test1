/**
 * 习作资源编辑器
 * 
 * 表单式编辑界面，不使用JSON格式
 * 
 * @module components/resource-editors/WritingResourceEditor
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ListOrdered, 
  Sparkles, 
  Target, 
  Brain,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';

// ==================== 类型定义 ====================

export interface WritingOutlineSection {
  section: string;
  content: string;
  keyPoints: string[];
  wordCount: string;
}

interface WritingOutline {
  title?: string;
  structure: WritingOutlineSection[];
  transitionPhrases: string[];
}

interface WordItem {
  word: string;
  meaning: string;
}

interface SentenceItem {
  sentence: string;
  technique: string;
}

interface GoodExpressions {
  words: WordItem[];
  sentences: SentenceItem[];
}

interface TieredTask {
  level: string;
  levelName: string;
  task: string;
  requirements: string[];
  scaffold: string;
  evaluationCriteria: string[];
}

interface EvaluationRubric {
  dimension: string;
  excellent: string;
  good: string;
  improving: string;
}

interface EvaluationGuide {
  teacherRubric: EvaluationRubric[];
  selfCheck: Array<{ aspect: string; questions: string[] }>;
}

interface WritingIssue {
  issue: string;
  manifestation: string;
  correctionGuide: string;
}

export interface WritingContent {
  outline?: WritingOutline;
  expressions?: GoodExpressions;
  tieredTasks?: TieredTask[];
  evaluationGuide?: EvaluationGuide;
  commonIssues?: WritingIssue[];
  [key: string]: unknown;  // 添加索引签名
}

interface WritingResourceEditorProps {
  content: WritingContent;
  onChange: (content: WritingContent) => void;
}

// ==================== 主组件 ====================

export function WritingResourceEditor({ content, onChange }: WritingResourceEditorProps) {
  
  // 更新提纲
  const updateOutline = (updates: Partial<WritingOutline>) => {
    onChange({
      ...content,
      outline: { ...content.outline, ...updates } as WritingOutline,
    });
  };

  // 更新提纲段落
  const updateOutlineSection = (index: number, updates: Partial<WritingOutlineSection>) => {
    if (!content.outline) return;
    const newStructure = [...content.outline.structure];
    newStructure[index] = { ...newStructure[index], ...updates };
    updateOutline({ structure: newStructure });
  };

  // 更新好词好句
  const updateExpressions = (updates: Partial<GoodExpressions>) => {
    onChange({
      ...content,
      expressions: { ...content.expressions, ...updates } as GoodExpressions,
    });
  };

  // 更新评改标准
  const updateRubric = (index: number, updates: Partial<EvaluationRubric>) => {
    if (!content.evaluationGuide) return;
    const newRubric = [...content.evaluationGuide.teacherRubric];
    newRubric[index] = { ...newRubric[index], ...updates };
    onChange({
      ...content,
      evaluationGuide: {
        ...content.evaluationGuide,
        teacherRubric: newRubric,
      },
    });
  };

  // 更新常见问题
  const updateIssue = (index: number, updates: Partial<WritingIssue>) => {
    if (!content.commonIssues) return;
    const newIssues = [...content.commonIssues];
    newIssues[index] = { ...newIssues[index], ...updates };
    onChange({ ...content, commonIssues: newIssues });
  };

  return (
    <div className="space-y-6">
      
      {/* 写作提纲 */}
      {content.outline && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-purple-600" />
              写作提纲
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {content.outline.structure.map((section, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
                  {idx + 1}
                </div>
                <div className="flex-1 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-lg border border-purple-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.section}
                      onChange={(e) => updateOutlineSection(idx, { section: e.target.value })}
                      className="w-32 h-8 text-sm font-medium"
                    />
                    <Input
                      value={section.wordCount}
                      onChange={(e) => updateOutlineSection(idx, { wordCount: e.target.value })}
                      className="w-24 h-8 text-xs"
                      placeholder="字数"
                    />
                  </div>
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateOutlineSection(idx, { content: e.target.value })}
                    placeholder="写作指导..."
                    rows={2}
                    className="text-sm"
                  />
                  <Textarea
                    value={section.keyPoints.join('\n')}
                    onChange={(e) => updateOutlineSection(idx, { 
                      keyPoints: e.target.value.split('\n').filter(Boolean) 
                    })}
                    placeholder="要点（每行一个）"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
            
            {/* 过渡语句 */}
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-700 mb-2">过渡语句</div>
              <Textarea
                value={content.outline.transitionPhrases.join('\n')}
                onChange={(e) => updateOutline({ 
                  transitionPhrases: e.target.value.split('\n').filter(Boolean) 
                })}
                placeholder="过渡语句（每行一个）"
                rows={2}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 好词好句 */}
      {content.expressions && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              好词好句素材库
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* 好词 */}
            <div className="p-4 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 rounded-lg border border-amber-100">
              <div className="text-sm font-medium text-amber-700 mb-3">描写词语</div>
              <div className="space-y-2">
                {content.expressions.words.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={item.word}
                      onChange={(e) => {
                        const newWords = [...content.expressions!.words];
                        newWords[idx] = { ...newWords[idx], word: e.target.value };
                        updateExpressions({ words: newWords });
                      }}
                      className="w-32 h-8 text-sm"
                      placeholder="词语"
                    />
                    <Input
                      value={item.meaning}
                      onChange={(e) => {
                        const newWords = [...content.expressions!.words];
                        newWords[idx] = { ...newWords[idx], meaning: e.target.value };
                        updateExpressions({ words: newWords });
                      }}
                      className="flex-1 h-8 text-sm"
                      placeholder="释义"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => {
                        const newWords = content.expressions!.words.filter((_, i) => i !== idx);
                        updateExpressions({ words: newWords });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newWords = [...(content.expressions?.words || []), { word: '', meaning: '' }];
                    updateExpressions({ words: newWords });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加词语
                </Button>
              </div>
            </div>
            
            {/* 好句 */}
            <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3">精彩句式</div>
              <div className="space-y-2">
                {content.expressions.sentences.map((item, idx) => (
                  <div key={idx} className="space-y-2 p-3 bg-white rounded-lg border border-green-100">
                    <Textarea
                      value={item.sentence}
                      onChange={(e) => {
                        const newSentences = [...content.expressions!.sentences];
                        newSentences[idx] = { ...newSentences[idx], sentence: e.target.value };
                        updateExpressions({ sentences: newSentences });
                      }}
                      placeholder="句子内容"
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={item.technique}
                        onChange={(e) => {
                          const newSentences = [...content.expressions!.sentences];
                          newSentences[idx] = { ...newSentences[idx], technique: e.target.value };
                          updateExpressions({ sentences: newSentences });
                        }}
                        className="flex-1 h-8 text-sm"
                        placeholder="修辞手法"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => {
                          const newSentences = content.expressions!.sentences.filter((_, i) => i !== idx);
                          updateExpressions({ sentences: newSentences });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSentences = [...(content.expressions?.sentences || []), { sentence: '', technique: '' }];
                    updateExpressions({ sentences: newSentences });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加句子
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 评改标准 */}
      {content.evaluationGuide && content.evaluationGuide.teacherRubric.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              评改标准
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {content.evaluationGuide.teacherRubric.map((item, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-orange-50/30 to-amber-50/30 rounded-lg border border-orange-100 space-y-2">
                  <Input
                    value={item.dimension}
                    onChange={(e) => updateRubric(idx, { dimension: e.target.value })}
                    className="font-medium text-sm"
                    placeholder="评价维度"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-green-600 mb-1">优秀</div>
                      <Textarea
                        value={item.excellent}
                        onChange={(e) => updateRubric(idx, { excellent: e.target.value })}
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-blue-600 mb-1">良好</div>
                      <Textarea
                        value={item.good}
                        onChange={(e) => updateRubric(idx, { good: e.target.value })}
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-orange-600 mb-1">待提高</div>
                      <Textarea
                        value={item.improving}
                        onChange={(e) => updateRubric(idx, { improving: e.target.value })}
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 常见问题 */}
      {content.commonIssues && content.commonIssues.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-600" />
              常见问题预警
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {content.commonIssues.map((issue, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-lg border border-orange-100 space-y-2">
                <div className="flex items-start gap-2">
                  <Input
                    value={issue.issue}
                    onChange={(e) => updateIssue(idx, { issue: e.target.value })}
                    className="flex-1 font-medium text-sm text-orange-700"
                    placeholder="问题描述"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => {
                      const newIssues = content.commonIssues!.filter((_, i) => i !== idx);
                      onChange({ ...content, commonIssues: newIssues });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">表现：</span>
                  <Textarea
                    value={issue.manifestation}
                    onChange={(e) => updateIssue(idx, { manifestation: e.target.value })}
                    rows={1}
                    className="text-xs mt-1"
                  />
                </div>
                <div className="text-xs text-blue-600">
                  <span className="font-medium">指导策略：</span>
                  <Textarea
                    value={issue.correctionGuide}
                    onChange={(e) => updateIssue(idx, { correctionGuide: e.target.value })}
                    rows={2}
                    className="text-xs mt-1"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newIssues = [...(content.commonIssues || []), { 
                  issue: '', 
                  manifestation: '', 
                  correctionGuide: '' 
                }];
                onChange({ ...content, commonIssues: newIssues });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              添加问题
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
