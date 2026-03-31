/**
 * 数学画板页面
 * 
 * 支持小学数学全领域画图需求：
 * - 图形与几何：平面图形、立体图形、组合图形、展开图
 * - 数与代数：数轴、线段图
 * - 统计与概率：条形图、折线图、扇形图
 * - 解决问题：线段图、示意图、表格
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MathCanvasMain } from '@/components/math-canvas';

export default function MathCanvasPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* 顶部导航 */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-4">
        <Link href="/teacher/lesson-prep/math">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
            <span className="text-xl">📐</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">数学画板</h1>
            <p className="text-xs text-muted-foreground">全领域画图工具</p>
          </div>
        </div>
      </div>

      {/* 画板主体 */}
      <div className="flex-1 overflow-hidden">
        <MathCanvasMain />
      </div>
    </div>
  );
}
