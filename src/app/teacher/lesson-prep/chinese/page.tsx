/**
 * 语文学科备课中心入口
 * 
 * 四大功能模块：
 * 1. 备课智能体 - AI对话式教学设计支持
 * 2. 生字专项 - 笔顺、田字格、形近字、听写清单
 * 3. 朗读教学 - 范读音频、朗读标注、课堂指导
 * 4. 习作专项 - 提纲、素材、分层任务、评改指导
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MessageCircle,
  BookText,
  Mic2,
  PenTool,
  ArrowRight,
  Sparkles,
  FileText,
  Target,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== 功能模块配置 ====================

const MODULES = [
  {
    id: 'chat',
    title: '备课智能体',
    subtitle: 'AI教学设计伙伴',
    icon: MessageCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'hover:border-red-300',
    description: '像老教师一样和你对话，深度探讨文本解读、教学设计、问题设计',
    features: [
      '文本解读六法引导',
      '教学设计点面相生',
      '问题串层次设计',
      '评价语言生成',
    ],
    available: true,
  },
  {
    id: 'character',
    title: '生字专项',
    subtitle: '原子化素材生成',
    icon: BookText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'hover:border-blue-300',
    description: '一键生成笔顺动画、田字格范写、形近字辨析、多音字、听写清单',
    features: [
      '笔顺动态矢量图',
      '田字格标准范写',
      '形近字辨析卡',
      '听写清单分级',
    ],
    available: true,
  },
  {
    id: 'reading',
    title: '朗读教学',
    subtitle: '范读与指导方案',
    icon: Mic2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'hover:border-green-300',
    description: '生成分层范读音频、停顿重音标注、齐读组织话术、常见问题应对',
    features: [
      '慢速/标准/情感范读',
      '停顿重音可视化',
      '齐读指导话术',
      '朗读问题纠正',
    ],
    available: true,
  },
  {
    id: 'writing',
    title: '习作专项',
    subtitle: '全流程备课系统',
    icon: PenTool,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'hover:border-purple-300',
    description: '从情境创设到评改指导的完整备课方案，支持分层训练任务设计',
    features: [
      '情境创设方案',
      '好词好句素材库',
      '分层训练任务',
      '评改指导模板',
    ],
    available: true,
  },
];

// ==================== 主组件 ====================

export default function ChinesePrepPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/lesson-prep">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <span className="text-2xl">📖</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">语文备课中心</h1>
            <p className="text-sm text-muted-foreground">诗意语文 · 专业赋能</p>
          </div>
        </div>
      </div>

      {/* 理念引导 */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-100">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white">
              <Sparkles className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-700">教学理念</h3>
              <p className="text-sm text-red-600/80 mt-1 leading-relaxed">
                基于王崧舟老师"诗意语文"教学理念，引导教师进行深度文本解读，
                设计"点面相生、动静相生"的课堂，让语文教学回归语言本质。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能模块 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MODULES.map((module) => {
          const Icon = module.icon;
          
          return (
            <Link
              key={module.id}
              href={`/teacher/lesson-prep/chinese/${module.id}`}
              className="block"
            >
              <Card className={cn(
                'h-full cursor-pointer transition-all hover:shadow-lg',
                module.borderColor
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn('p-3 rounded-xl', module.bgColor)}>
                        <Icon className={cn('w-6 h-6', module.color)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{module.title}</h3>
                          {!module.available && (
                            <Badge variant="outline" className="text-xs">开发中</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{module.subtitle}</p>
                        <p className="text-sm mt-2 text-gray-600 leading-relaxed">
                          {module.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {module.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className={cn('w-5 h-5 flex-shrink-0 mt-1', module.color)} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 快捷入口 */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">快速开始</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/teacher/lesson-prep/chinese/chat">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <FileText className="w-4 h-4 text-red-500 mb-2" />
                <p className="text-sm font-medium">文本解读</p>
                <p className="text-xs text-muted-foreground">深度分析课文</p>
              </div>
            </Link>
            <Link href="/teacher/lesson-prep/chinese/character">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Target className="w-4 h-4 text-blue-500 mb-2" />
                <p className="text-sm font-medium">生字备课</p>
                <p className="text-xs text-muted-foreground">生成教学素材</p>
              </div>
            </Link>
            <Link href="/teacher/lesson-prep/chinese/reading">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Mic2 className="w-4 h-4 text-green-500 mb-2" />
                <p className="text-sm font-medium">朗读指导</p>
                <p className="text-xs text-muted-foreground">范读与标注</p>
              </div>
            </Link>
            <Link href="/teacher/lesson-prep/chinese/writing">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Users className="w-4 h-4 text-purple-500 mb-2" />
                <p className="text-sm font-medium">作文备课</p>
                <p className="text-xs text-muted-foreground">全流程设计</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
