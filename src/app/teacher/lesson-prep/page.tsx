/**
 * 教师空间 - 备课中心入口
 * 
 * 包含：我的资源库 + 学科选择
 * 点击学科卡片进入对应的备课工具
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Calculator,
  Languages,
  FlaskConical,
  Heart,
  Music,
  Palette,
  Trophy,
  ArrowRight,
  Construction,
  FolderOpen,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== 学科配置 ====================

const SUBJECTS = [
  {
    id: 'chinese',
    name: '语文',
    icon: BookOpen,
    description: '文本解读 · 教学设计 · 课堂策略',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'hover:border-red-200',
    available: true,
    features: ['AI备课助手', '文本深度解读', '问题设计', '评价语言'],
  },
  {
    id: 'math',
    name: '数学',
    icon: Calculator,
    description: '本质挖掘 · 思想显影 · 结构贯通',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'hover:border-blue-200',
    available: true,
    features: ['四维分析', '教学路径', '核心素养', '内容数据库'],
  },
  {
    id: 'english',
    name: '英语',
    icon: Languages,
    description: '语篇分析 · 活动设计 · 情境创设',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'hover:border-green-200',
    available: false,
  },
  {
    id: 'science',
    name: '科学',
    icon: FlaskConical,
    description: '探究设计 · 实验指导 · 科学思维',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'hover:border-purple-200',
    available: false,
  },
  {
    id: 'morality',
    name: '道德与法治',
    icon: Heart,
    description: '价值引导 · 案例分析 · 情感渗透',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'hover:border-pink-200',
    available: false,
  },
  {
    id: 'music',
    name: '音乐',
    icon: Music,
    description: '欣赏教学 · 技能训练 · 审美培养',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'hover:border-orange-200',
    available: false,
  },
  {
    id: 'art',
    name: '美术',
    icon: Palette,
    description: '造型表现 · 设计应用 · 欣赏评述',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'hover:border-cyan-200',
    available: false,
  },
  {
    id: 'pe',
    name: '体育',
    icon: Trophy,
    description: '技能教学 · 游戏设计 · 体能训练',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'hover:border-amber-200',
    available: false,
  },
];

// ==================== 主组件 ====================

export default function LessonPrepPage() {
  return (
    <div className="p-6 space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">备课中心</h1>
        <p className="text-muted-foreground mt-1">
          选择学科，开启智能备课之旅
        </p>
      </div>

      {/* 我的资源库 - 独立入口 */}
      <Link href="/teacher/lesson-prep/my-resources" className="block">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-xl transition-all cursor-pointer overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">我的教学资源库</h2>
                    <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                      个人
                    </Badge>
                  </div>
                  <p className="text-white/80 mt-1">
                    保存和管理您的教学素材，随时调用，高效备课
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      生字专项
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      朗读教学
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      习作素材
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 学科选择区域 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">选择学科</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
        </div>

        {/* 学科卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBJECTS.map((subject) => {
            const Icon = subject.icon;
            
            // 未开放的学科
            if (!subject.available) {
              return (
                <Card
                  key={subject.id}
                  className="relative overflow-hidden opacity-60 cursor-not-allowed"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn('p-3 rounded-xl', subject.bgColor)}>
                        <Icon className={cn('w-6 h-6', subject.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{subject.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            <Construction className="w-3 h-3 mr-1" />
                            开发中
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {subject.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            // 已开放的学科
            return (
              <Link key={subject.id} href={`/teacher/lesson-prep/${subject.id}`}>
                <Card className={cn(
                  'cursor-pointer transition-all hover:shadow-lg',
                  subject.borderColor
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn('p-3 rounded-xl', subject.bgColor)}>
                        <Icon className={cn('w-6 h-6', subject.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{subject.name}</h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {subject.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {subject.features?.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
