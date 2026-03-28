/**
 * 生字专项工具页面
 * 
 * 生成笔顺图、田字格范写、形近字辨析、多音字、听写清单
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Volume2,
  Eye,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CharacterInfo,
  SimilarCharGroup,
  PolyphonicChar,
  DictationItem,
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
  });
  
  // 结果状态
  const [loading, setLoading] = useState(false);
  const [characterInfos, setCharacterInfos] = useState<CharacterInfo[]>([]);
  const [similarGroups, setSimilarGroups] = useState<SimilarCharGroup[]>([]);
  const [polyphonicChars, setPolyphonicChars] = useState<PolyphonicChar[]>([]);
  const [dictationList, setDictationList] = useState<DictationItem[]>([]);
  
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
      
      if (data.characters) {
        setCharacterInfos(data.characters);
      }
      if (data.similarGroups) {
        setSimilarGroups(data.similarGroups);
      }
      if (data.polyphonicChars) {
        setPolyphonicChars(data.polyphonicChars);
      }
      if (data.dictationList) {
        setDictationList(data.dictationList);
      }
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 渲染笔顺动画
  const renderStrokeOrder = (info: CharacterInfo) => (
    <Card key={info.char} className="overflow-hidden">
      <CardHeader className="pb-2 bg-blue-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-3xl font-kai">{info.char}</span>
          <span className="text-sm text-muted-foreground">{info.pinyin}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">部首：</span>{info.radical}</div>
          <div><span className="text-muted-foreground">结构：</span>{info.structure}</div>
          <div><span className="text-muted-foreground">笔画：</span>{info.strokeCount}画</div>
          <div><span className="text-muted-foreground">组词：</span>{info.words.slice(0, 3).join('、')}</div>
        </div>
        
        {/* 笔顺展示 */}
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm text-muted-foreground mb-2">笔顺：</div>
          <div className="flex flex-wrap gap-1">
            {info.strokeOrder.map((stroke, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {idx + 1}.{stroke}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* 田字格展示 */}
        <div className="flex items-center justify-center">
          <div className="w-24 h-24 border-2 border-blue-300 relative bg-white grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-dashed border-blue-200" />
            <div className="border-b border-dashed border-blue-200" />
            <div className="border-r border-dashed border-blue-200" />
            <div />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-kai text-gray-800">{info.char}</span>
            </div>
            {/* 田字格对角线 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4" />
              <line x1="100%" y1="0" x2="0" y2="100%" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4" />
            </svg>
          </div>
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
  
  // 渲染形近字组
  const renderSimilarGroup = (group: SimilarCharGroup, idx: number) => (
    <Card key={idx} className="p-4">
      <div className="flex items-center gap-4 mb-3">
        {group.similarChars.map((item, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl font-kai mb-1">{item.char}</div>
            <div className="text-xs text-muted-foreground">{item.pinyin || ''}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{group.analysis}</p>
    </Card>
  );
  
  // 渲染多音字
  const renderPolyphonic = (poly: PolyphonicChar, idx: number) => (
    <Card key={idx} className="p-4">
      <div className="text-3xl font-kai text-center mb-3">{poly.char}</div>
      <div className="space-y-2">
        {poly.readings.map((reading, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{reading.pinyin}</Badge>
            <span>{reading.example}</span>
          </div>
        ))}
        {poly.记忆口诀 && (
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
            记忆口诀：{poly.记忆口诀}
          </div>
        )}
      </div>
    </Card>
  );
  
  // 渲染听写清单
  const renderDictation = () => (
    <Card className="p-4">
      <CardTitle className="text-lg mb-4">听写清单</CardTitle>
      <div className="space-y-3">
        {['easy', 'medium', 'hard'].map(level => {
          const items = dictationList.filter(d => d.difficulty === level);
          if (items.length === 0) return null;
          
          return (
            <div key={level}>
              <div className="text-sm font-medium mb-1">
                {level === 'easy' ? '基础' : level === 'medium' ? '中等' : '挑战'}
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((item, idx) => (
                  <Badge key={idx} variant="outline">
                    {item.words[0]}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

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
            <p className="text-sm text-muted-foreground">原子化素材生成</p>
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
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'strokeOrder', label: '笔顺图' },
              { key: 'gridWriting', label: '田字格范写' },
              { key: 'similarChars', label: '形近字辨析' },
              { key: 'polyphonic', label: '多音字' },
              { key: 'dictation', label: '听写清单' },
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
            disabled={!characters.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                生成素材
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
            <h3 className="text-lg font-semibold mb-4">生字详情</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characterInfos.map(renderStrokeOrder)}
            </div>
          </div>
          
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
