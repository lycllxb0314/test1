/**
 * 数学学科备课中心入口
 * 
 * 功能模块：
 * 1. 童童 - AI对话式教学设计支持
 * 2. 四维分析 - 本质、过程、思想、结构教学方案生成
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MessageCircle,
  Network,
  ArrowRight,
  Sparkles,
  Target,
  Brain,
  Lightbulb,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== 功能模块配置 ====================

const MODULES = [
  {
    id: 'chat',
    title: '童童',
    subtitle: '备课智能体 · 童心数学',
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'hover:border-green-300',
    avatar: '/tongtong-avatar.png',
    description: '我是童童，来自"童心数学"的AI教学伙伴，陪你一起探讨数学概念、教学设计、思维培养',
    features: [
      '概念本质深度分析',
      '教学路径设计引导',
      '认知障碍诊断',
      '数学思想渗透',
    ],
    available: true,
  },
  {
    id: 'analysis',
    title: '四维分析',
    subtitle: '教学方案生成',
    icon: Network,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'hover:border-blue-300',
    description: '基于"本质-过程-思想-结构"四维分析框架，生成完整教学方案',
    features: [
      '知识本质提炼',
      '形成过程还原',
      '数学思想渗透',
      '知识结构梳理',
    ],
    available: true,
  },
];

// ==================== 主组件 ====================

export default function MathPrepPage() {
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
            <span className="text-2xl">📐</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">数学备课中心</h1>
            <p className="text-sm text-muted-foreground">童心数学 · 专业赋能</p>
          </div>
        </div>
      </div>

      {/* 理念引导 */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white">
              <Sparkles className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-700">教学理念</h3>
              <p className="text-sm text-green-600/80 mt-1 leading-relaxed">
                基于数学学习心理学与王崧舟"动静相生"课堂理念，引导教师理解学生认知规律，
                设计"动静相生、思维碰撞"的数学课堂，让数学教学回归思维本质。
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
              href={`/teacher/lesson-prep/math/${module.id}`}
              className="block"
            >
              <Card className={cn(
                'h-full cursor-pointer transition-all hover:shadow-lg',
                module.borderColor
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {module.avatar ? (
                        <div className={cn('p-2 rounded-xl overflow-hidden', module.bgColor)}>
                          <img 
                            src={module.avatar} 
                            alt={module.title}
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                      ) : (
                        <div className={cn('p-3 rounded-xl', module.bgColor)}>
                          <Icon className={cn('w-6 h-6', module.color)} />
                        </div>
                      )}
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
            <Link href="/teacher/lesson-prep/math/chat">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Brain className="w-4 h-4 text-green-500 mb-2" />
                <p className="text-sm font-medium">概念研讨</p>
                <p className="text-xs text-muted-foreground">深度分析数学概念</p>
              </div>
            </Link>
            <Link href="/teacher/lesson-prep/math/chat">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Target className="w-4 h-4 text-blue-500 mb-2" />
                <p className="text-sm font-medium">问题设计</p>
                <p className="text-xs text-muted-foreground">设计思考性问题</p>
              </div>
            </Link>
            <Link href="/teacher/lesson-prep/math/analysis">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Lightbulb className="w-4 h-4 text-orange-500 mb-2" />
                <p className="text-sm font-medium">教学设计</p>
                <p className="text-xs text-muted-foreground">生成完整方案</p>
              </div>
            </Link>
            <Link href="/teacher/lesson-prep/math/analysis">
              <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer">
                <Route className="w-4 h-4 text-purple-500 mb-2" />
                <p className="text-sm font-medium">教学路径</p>
                <p className="text-xs text-muted-foreground">梳理教学流程</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
