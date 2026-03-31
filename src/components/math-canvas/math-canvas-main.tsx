'use client';

import React, { useState, useCallback, useRef } from 'react';
import { MathCanvas } from './math-canvas-canvas';
import { ToolBar } from './math-canvas-toolbar';
import { PropertyPanel } from './math-canvas-property-panel';
import type {
  CanvasState,
  CanvasElement,
  GridBackground,
  ToolType,
  Color,
} from '@/types/math-canvas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, HelpCircle, BookOpen } from 'lucide-react';

/** 默认网格 */
const DEFAULT_GRID: GridBackground = {
  enabled: true,
  type: 'square',
  size: 20,
  color: '#e5e7eb',
  showAxis: false,
  axisColor: '#374151',
};

/** 数学画板主组件 Props */
export type MathCanvasMainProps = {
  onSave?: (state: CanvasState) => void;
  onLoad?: (state: CanvasState) => void;
};

/** 数学画板主组件 */
export function MathCanvasMain({ onSave, onLoad }: MathCanvasMainProps) {
  // 画布状态
  const [state, setState] = useState<CanvasState>({
    elements: [],
    grid: DEFAULT_GRID,
    zoom: 1,
    pan: { x: 0, y: 0 },
    selection: [],
    activeTool: 'rectangle',
    activeColor: '#3b82f6',
    activeStrokeWidth: 2,
  });

  // 历史记录
  const [history, setHistory] = useState<CanvasState[]>([state]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // 画布尺寸
  const [canvasWidth] = useState(900);
  const [canvasHeight] = useState(600);

  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 更新状态并保存历史
  const updateState = useCallback((newState: Partial<CanvasState>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState };
      setHistory((h) => [...h.slice(0, historyIndex + 1), updated]);
      setHistoryIndex((i) => i + 1);
      return updated;
    });
  }, [historyIndex]);

  // 工具切换
  const handleToolChange = useCallback((tool: ToolType) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  // 颜色切换
  const handleColorChange = useCallback((color: Color) => {
    setState((prev) => ({ ...prev, activeColor: color }));
  }, []);

  // 线宽切换
  const handleStrokeWidthChange = useCallback((width: number) => {
    setState((prev) => ({ ...prev, activeStrokeWidth: width }));
  }, []);

  // 网格切换
  const handleGridChange = useCallback((grid: GridBackground) => {
    setState((prev) => ({ ...prev, grid }));
  }, []);

  // 缩放切换
  const handleZoomChange = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom }));
  }, []);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((i) => i - 1);
      setState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((i) => i + 1);
      setState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // 清空
  const handleClear = useCallback(() => {
    if (confirm('确定要清空画布吗？')) {
      updateState({ elements: [], selection: [] });
    }
  }, [updateState]);

  // 导出
  const handleExport = useCallback(() => {
    const dataUrl = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(state, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `math-canvas-${Date.now()}.json`;
    link.click();
    onSave?.(state);
  }, [state, onSave]);

  // 导入
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loaded = JSON.parse(e.target?.result as string) as CanvasState;
        setState(loaded);
        setHistory([loaded]);
        setHistoryIndex(0);
        onLoad?.(loaded);
      } catch {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  }, [onLoad]);

  // 元素添加回调
  const handleElementAdd = useCallback((element: CanvasElement) => {
    console.log('Added element:', element);
  }, []);

  // 元素选择回调
  const handleElementSelect = useCallback((elementIds: string[]) => {
    setState((prev) => ({ ...prev, selection: elementIds }));
  }, []);

  // 教学场景快捷模板
  const templates = [
    { name: '正方形面积', tool: 'squareGrid' as ToolType, desc: '用小正方形研究面积' },
    { name: '数轴', tool: 'numberLine' as ToolType, desc: '整数的认识' },
    { name: '条形统计图', tool: 'barChart' as ToolType, desc: '数据统计' },
    { name: '线段图', tool: 'segmentDiagram' as ToolType, desc: '解决问题' },
    { name: '正方体', tool: 'cube' as ToolType, desc: '体积教学' },
    { name: '圆', tool: 'circle' as ToolType, desc: '圆的认识' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="border-b bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">数学画板</h2>
          <span className="text-xs text-muted-foreground">
            支持：平面图形、立体图形、组合图形、数轴、线段图、统计图
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 快捷模板 */}
          <div className="flex items-center gap-1 mr-4">
            <span className="text-xs text-muted-foreground mr-1">快捷：</span>
            {templates.map((t) => (
              <Button
                key={t.name}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleToolChange(t.tool)}
                title={t.desc}
              >
                {t.name}
              </Button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
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

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具栏 */}
        <div className="w-56 border-r bg-card overflow-y-auto">
          <ToolBar
            activeTool={state.activeTool}
            onToolChange={handleToolChange}
          />
        </div>

        {/* 中央画布 */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 p-4 overflow-auto">
          <div className="shadow-lg">
            <MathCanvas
              width={canvasWidth}
              height={canvasHeight}
              state={state}
              onChange={(s) => setState(s)}
              onElementAdd={handleElementAdd}
              onElementSelect={handleElementSelect}
            />
          </div>
        </div>

        {/* 右侧属性面板 */}
        <div className="w-64 border-l bg-card overflow-y-auto">
          <PropertyPanel
            grid={state.grid}
            zoom={state.zoom}
            activeColor={state.activeColor}
            activeStrokeWidth={state.activeStrokeWidth}
            onGridChange={handleGridChange}
            onZoomChange={handleZoomChange}
            onColorChange={handleColorChange}
            onStrokeWidthChange={handleStrokeWidthChange}
            onClear={handleClear}
            onExport={handleExport}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="border-t bg-card px-4 py-1 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>工具: {state.activeTool}</span>
          <span>元素: {state.elements.length}</span>
          <span>选中: {state.selection.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>缩放: {Math.round(state.zoom * 100)}%</span>
          <span>画布: {canvasWidth} × {canvasHeight}</span>
        </div>
      </div>
    </div>
  );
}
