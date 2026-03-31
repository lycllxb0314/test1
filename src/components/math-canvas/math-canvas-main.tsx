'use client';

import React, { useState, useCallback, useRef } from 'react';
import { MathCanvas } from './math-canvas-canvas';
import { ToolBar } from './math-canvas-toolbar';
import { PropertyPanel } from './math-canvas-property-panel';
import { ElementEditor } from './math-canvas-element-editor';
import type {
  CanvasState,
  CanvasElement,
  GridBackground,
  ToolType,
  Color,
  FillMode,
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
  enabled: false,  // 默认关闭
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

  // 填充状态
  const [fillMode, setFillMode] = useState<FillMode>('none');
  const [fillColor, setFillColor] = useState<Color>('#3b82f6');

  // 历史记录
  const [history, setHistory] = useState<CanvasState[]>([state]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('properties');

  // 画布尺寸
  const [canvasWidth] = useState(900);
  const [canvasHeight] = useState(600);

  // 画布引用
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // 导出为图片
  const handleExportImage = useCallback((transparentBg: boolean) => {
    // 获取画布元素
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // 创建临时画布用于导出
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // 如果不是透明背景，先填充白色背景
    if (!transparentBg) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // 复制原画布内容
    ctx.drawImage(canvas, 0, 0);

    // 导出为PNG
    const dataUrl = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `math-canvas-${Date.now()}.png`;
    link.click();
  }, []);

  // 导出为JSON
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
    // 如果选中了元素，自动切换到编辑标签
    if (elementIds.length === 1) {
      setActiveTab('element');
    }
  }, []);

  // 获取当前选中的元素
  const selectedElement = state.selection.length === 1
    ? state.elements.find((el) => el.id === state.selection[0]) || null
    : null;

  // 更新元素
  const handleElementUpdate = useCallback((updatedElement: CanvasElement) => {
    setState((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === updatedElement.id ? updatedElement : el
      ),
    }));
  }, []);

  // 删除元素
  const handleElementDelete = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
      selection: prev.selection.filter((sid) => sid !== id),
    }));
  }, []);

  // 复制元素
  const handleElementDuplicate = useCallback((element: CanvasElement) => {
    const newElement = {
      ...element,
      id: `element-${Date.now()}`,
    };
    // 如果元素有 points，稍微偏移
    if ('points' in newElement && Array.isArray(newElement.points)) {
      newElement.points = newElement.points.map((p: { x: number; y: number }) => ({
        x: p.x + 20,
        y: p.y + 20,
      }));
    }
    // 如果元素有 position，稍微偏移
    if ('position' in newElement) {
      newElement.position = {
        x: (newElement.position as { x: number; y: number }).x + 20,
        y: (newElement.position as { x: number; y: number }).y + 20,
      };
    }
    setState((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selection: [newElement.id],
    }));
  }, []);

  // 创建新元素（如展开图）
  const handleCreateElement = useCallback((element: CanvasElement) => {
    setState((prev) => ({
      ...prev,
      elements: [...prev.elements, element],
      selection: [element.id],
    }));
    setActiveTab('element');
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
        <div className="w-64 border-l bg-card overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-2 mt-2">
              <TabsTrigger value="properties" className="text-xs">属性</TabsTrigger>
              <TabsTrigger value="element" className="text-xs">
                编辑 {selectedElement ? '(1)' : ''}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden">
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
                onExport={handleExportImage}
                onUndo={handleUndo}
                onRedo={handleRedo}
                fillMode={fillMode}
                fillColor={fillColor}
                onFillModeChange={setFillMode}
                onFillColorChange={setFillColor}
              />
            </TabsContent>
            <TabsContent value="element" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden">
              <ElementEditor
                element={selectedElement}
                onUpdate={handleElementUpdate}
                onDelete={handleElementDelete}
                onDuplicate={handleElementDuplicate}
                onCreateElement={handleCreateElement}
              />
            </TabsContent>
          </Tabs>
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
