/**
 * 朗读教学工具页面
 * 
 * 生成范读音频、朗读标注、课堂指导话术
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  Mic2,
  Loader2,
  Play,
  Pause,
  Download,
  Volume2,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReadingAudio, ReadingGuidance } from '@/types/chinese-prep';

// ==================== 主组件 ====================

export default function ReadingPage() {
  // 输入状态
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [grade, setGrade] = useState<number>(4);
  const [options, setOptions] = useState({
    slowReading: true,
    standardReading: true,
    expressiveReading: true,
    annotation: true,
    guidance: true,
  });
  
  // 结果状态
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<ReadingAudio[]>([]);
  const [guidance, setGuidance] = useState<ReadingGuidance | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 生成朗读方案
  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chinese-prep/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          title: title || '课文',
          grade,
          generateOptions: options,
        }),
      });
      
      const data = await response.json();
      
      if (data.audios) {
        setAudios(data.audios);
      }
      if (data.guidance) {
        setGuidance(data.guidance);
      }
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 播放音频
  const handlePlayAudio = (audioUrl: string) => {
    if (currentAudio === audioUrl && isPlaying) {
      // 暂停
      setIsPlaying(false);
    } else {
      // 播放
      setCurrentAudio(audioUrl);
      setIsPlaying(true);
    }
  };
  
  // 获取速度标签
  const getSpeedLabel = (speed: string) => {
    const labels: Record<string, string> = {
      slow: '慢速范读',
      standard: '标准范读',
      expressive: '情感范读',
    };
    return labels[speed] || speed;
  };
  
  // 渲染音频卡片
  const renderAudioCard = (audio: ReadingAudio) => (
    <Card key={audio.speed} className="overflow-hidden">
      <CardHeader className="pb-2 bg-green-50">
        <CardTitle className="text-base flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-green-500" />
          {getSpeedLabel(audio.speed)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* 音频播放器 */}
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
        
        {/* 下载按钮 */}
        <Button size="sm" variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-1" />
          下载音频
        </Button>
      </CardContent>
    </Card>
  );
  
  // 渲染指导方案
  const renderGuidance = () => {
    if (!guidance) return null;
    
    return (
      <div className="space-y-4">
        {/* 整体指导 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">整体指导</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{guidance.overallGuide}</p>
          </CardContent>
        </Card>
        
        {/* 齐读组织话术 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">齐读组织话术</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">准备话术</div>
                <p className="text-sm">{guidance.chorusGuide.preparation || '同学们，请做好朗读准备...'}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">起始信号</div>
                <p className="text-sm">{guidance.chorusGuide.startSignal || '预备——起！'}</p>
              </div>
            </div>
            {guidance.chorusGuide.duringReading.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">过程提示</div>
                <ul className="text-sm space-y-1">
                  {guidance.chorusGuide.duringReading.map((tip, idx) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">结束话术</div>
              <p className="text-sm">{guidance.chorusGuide.ending || '读得真好！给自己鼓鼓掌。'}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* 常见问题 */}
        {guidance.commonIssues.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">常见问题及应对</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {guidance.commonIssues.map((issue, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-2">{issue.issue}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {issue.cause && <p>原因：{issue.cause}</p>}
                    {issue.solution && <p>应对：{issue.solution}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

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
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <Mic2 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">朗读教学</h1>
            <p className="text-sm text-muted-foreground">范读与指导方案</p>
          </div>
        </div>
      </div>
      
      {/* 输入区域 */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">课文内容</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="粘贴课文内容..."
              className="min-h-[150px]"
            />
          </div>
          
          {/* 生成选项 */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'slowReading', label: '慢速范读' },
              { key: 'standardReading', label: '标准范读' },
              { key: 'expressiveReading', label: '情感范读' },
              { key: 'annotation', label: '朗读标注' },
              { key: 'guidance', label: '指导方案' },
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
            disabled={!text.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                生成朗读方案
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* 结果展示 */}
      {audios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {audios.map(renderAudioCard)}
        </div>
      )}
      
      {guidance && renderGuidance()}
    </div>
  );
}
