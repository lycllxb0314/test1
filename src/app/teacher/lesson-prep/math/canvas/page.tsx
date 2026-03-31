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

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Upload, HelpCircle, BookOpen } from 'lucide-react';
import { MathCanvasMain } from '@/components/math-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { CanvasState } from '@/types/math-canvas';

export default function MathCanvasPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasMainRef = useRef<{ handleImport: (file: File) => void; handleExport: () => void }>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里可以调用 canvasMainRef 的导入方法
      console.log('Import file:', file.name);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* 顶部导航 */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-1" />
            导入
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          <Dialog open={showHelp} onOpenChange={setShowHelp}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4 mr-1" />
                帮助
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  数学画板使用指南
                </DialogTitle>
                <DialogDescription>
                  小学数学全领域画图工具
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">📐 图形与几何</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>平面图形</strong>：点、线、角、三角形、四边形、圆等</li>
                    <li><strong>立体图形</strong>：正方体、长方体、圆柱、圆锥、球</li>
                    <li><strong>组合图形</strong>：小正方形拼图（面积研究）、小正方体组合（体积研究）</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🔢 数与代数</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>数轴</strong>：整数轴、分数轴、小数轴</li>
                    <li><strong>线段图</strong>：和差问题、倍数问题、分数问题</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📊 统计与概率</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>条形统计图</strong>：分类统计</li>
                    <li><strong>折线统计图</strong>：变化趋势</li>
                    <li><strong>扇形统计图</strong>：比例分布</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📝 操作说明</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>选择工具后在画布上拖拽绘制</li>
                    <li>右侧面板调整颜色、线宽、网格</li>
                    <li>支持导入/导出保存作品</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 画板主体 */}
      <div className="flex-1 overflow-hidden">
        <MathCanvasMain />
      </div>
    </div>
  );
}
