'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CanvasElement,
  PlaneShape,
  SolidShape,
  CompositeShape,
  NumberLineShape,
  SegmentDiagramShape,
  ChartShape,
  PlaneShapeType,
  NetShape,
} from '@/types/math-canvas';
import { Trash2, Copy, RotateCw, FlipHorizontal, FlipVertical, UnfoldVertical, Palette } from 'lucide-react';

/** 平面图形类型列表 */
const PLANE_SHAPE_TYPES: PlaneShapeType[] = [
  'triangle', 'rightTriangle', 'isoscelesTriangle', 'equilateralTriangle',
  'rectangle', 'square', 'parallelogram', 'trapezoid', 'rhombus',
  'polygon', 'circle', 'sector', 'annulus', 'arc'
];

/** 判断是否为平面图形 */
function isPlaneShape(element: CanvasElement): element is PlaneShape {
  return PLANE_SHAPE_TYPES.includes(element.type as PlaneShapeType);
}

/** 元素编辑器 Props */
export type ElementEditorProps = {
  element: CanvasElement | null;
  onUpdate: (element: CanvasElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: CanvasElement) => void;
  onCreateElement?: (element: CanvasElement) => void;
};

/** 元素编辑器组件 */
export function ElementEditor({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onCreateElement,
}: ElementEditorProps) {
  if (!element) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        选择一个图形进行编辑
      </div>
    );
  }

  // 根据元素类型渲染不同的编辑器
  const renderEditor = () => {
    switch (element.type) {
      case 'sector':
        return (
          <>
            <SectorEditor element={element as PlaneShape} onUpdate={onUpdate} />
            <TransformEditor element={element as PlaneShape} onUpdate={onUpdate} />
          </>
        );
      case 'polygon':
        return (
          <>
            <PolygonEditor element={element as PlaneShape} onUpdate={onUpdate} />
            <TransformEditor element={element as PlaneShape} onUpdate={onUpdate} />
          </>
        );
      case 'numberLine':
        return <NumberLineEditor element={element as NumberLineShape} onUpdate={onUpdate} />;
      case 'segmentDiagram':
        return <SegmentDiagramEditor element={element as SegmentDiagramShape} onUpdate={onUpdate} />;
      case 'chart':
        return <ChartEditor element={element as ChartShape} onUpdate={onUpdate} />;
      case 'squareGrid':
      case 'cubeGrid':
        return <GridEditor element={element as CompositeShape} onUpdate={onUpdate} />;
      case 'cube':
      case 'cuboid':
      case 'cylinder':
      case 'cone':
      case 'sphere':
        return (
          <SolidEditor
            element={element as SolidShape}
            onUpdate={onUpdate}
            onCreateElement={onCreateElement}
          />
        );
      default:
        // 对于其他平面图形，显示变换控制
        if (isPlaneShape(element)) {
          return <TransformEditor element={element} onUpdate={onUpdate} />;
        }
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">此图形暂无可编辑参数</p>
            <div className="text-xs text-muted-foreground">
              类型: {element.type}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">图形属性</Label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(element)}
            title="复制"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(element.id)}
            title="删除"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <Separator />
      {renderEditor()}
    </div>
  );
}

/** 扇形编辑器 */
function SectorEditor({
  element,
  onUpdate,
}: {
  element: PlaneShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  const startAngleDeg = Math.round(((element.startAngle || 0) * 180) / Math.PI);
  const endAngleDeg = Math.round(((element.endAngle || Math.PI / 2) * 180) / Math.PI);

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">起始角度: {startAngleDeg}°</Label>
        <Slider
          value={[startAngleDeg]}
          min={0}
          max={360}
          step={15}
          onValueChange={(v) => onUpdate({ ...element, startAngle: degToRad(v[0]) })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">终止角度: {endAngleDeg}°</Label>
        <Slider
          value={[endAngleDeg]}
          min={0}
          max={360}
          step={15}
          onValueChange={(v) => onUpdate({ ...element, endAngle: degToRad(v[0]) })}
        />
      </div>
    </div>
  );
}

/** 多边形编辑器 */
function PolygonEditor({
  element,
  onUpdate,
}: {
  element: PlaneShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  const sides = element.sides || 6;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">边数: {sides}</Label>
        <Slider
          value={[sides]}
          min={3}
          max={12}
          step={1}
          onValueChange={(v) => onUpdate({ ...element, sides: v[0] })}
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {[3, 4, 5, 6, 8, 10, 12].map((n) => (
          <Button
            key={n}
            variant={sides === n ? 'default' : 'outline'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onUpdate({ ...element, sides: n })}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** 数轴编辑器 */
function NumberLineEditor({
  element,
  onUpdate,
}: {
  element: NumberLineShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  const { start, end, step, showLabels, showTicks } = element;

  const updateNumberLine = (field: 'start' | 'end' | 'step', value: number) => {
    const newStart = field === 'start' ? value : start;
    const newEnd = field === 'end' ? value : end;
    const newStep = field === 'step' ? value : step;
    
    const marks = [];
    for (let i = newStart; i <= newEnd; i += newStep) {
      marks.push({ value: i, label: String(i), highlight: false });
    }
    
    onUpdate({ ...element, start: newStart, end: newEnd, step: newStep, marks });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">起点</Label>
          <Input
            type="number"
            value={start}
            onChange={(e) => updateNumberLine('start', Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">终点</Label>
          <Input
            type="number"
            value={end}
            onChange={(e) => updateNumberLine('end', Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">步长</Label>
          <Input
            type="number"
            value={step}
            onChange={(e) => updateNumberLine('step', Number(e.target.value))}
            className="h-8"
            min={1}
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示数值标签</Label>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => onUpdate({ ...element, showLabels: e.target.checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示刻度线</Label>
          <input
            type="checkbox"
            checked={showTicks}
            onChange={(e) => onUpdate({ ...element, showTicks: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
}

/** 线段图编辑器 */
function SegmentDiagramEditor({
  element,
  onUpdate,
}: {
  element: SegmentDiagramShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  const { segments, showLabels, showValues, showBraces } = element;

  const updateSegment = (index: number, field: string, value: string | number) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    onUpdate({ ...element, segments: newSegments });
  };

  const addSegment = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    onUpdate({
      ...element,
      segments: [
        ...segments,
        {
          label: `${segments.length + 1}`,
          length: 50,
          color: colors[segments.length % colors.length],
          value: 50,
        },
      ],
    });
  };

  const removeSegment = (index: number) => {
    onUpdate({
      ...element,
      segments: segments.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">线段</Label>
        <Button variant="outline" size="sm" onClick={addSegment}>
          + 添加
        </Button>
      </div>
      {segments.map((seg, index) => (
        <div key={index} className="p-2 bg-muted rounded space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={seg.label}
              onChange={(e) => updateSegment(index, 'label', e.target.value)}
              className="h-7 w-16"
              placeholder="标签"
            />
            <Input
              type="number"
              value={seg.value || ''}
              onChange={(e) => updateSegment(index, 'value', Number(e.target.value))}
              className="h-7 w-16"
              placeholder="数值"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => removeSegment(index)}
            >
              ×
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs w-12">长度:</Label>
            <Slider
              value={[seg.length]}
              min={10}
              max={200}
              step={10}
              onValueChange={(v) => updateSegment(index, 'length', v[0])}
              className="flex-1"
            />
            <span className="text-xs w-8">{seg.length}</span>
          </div>
        </div>
      ))}
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示标签</Label>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => onUpdate({ ...element, showLabels: e.target.checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示数值</Label>
          <input
            type="checkbox"
            checked={showValues}
            onChange={(e) => onUpdate({ ...element, showValues: e.target.checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示大括号</Label>
          <input
            type="checkbox"
            checked={showBraces}
            onChange={(e) => onUpdate({ ...element, showBraces: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
}

/** 统计图编辑器 */
function ChartEditor({
  element,
  onUpdate,
}: {
  element: ChartShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  const { title, data, showValues, showLegend, showAxis } = element;

  const updateDataItem = (index: number, field: string, value: string | number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onUpdate({ ...element, data: newData });
  };

  const addDataItem = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    onUpdate({
      ...element,
      data: [
        ...data,
        {
          label: `项目${data.length + 1}`,
          value: 10,
          color: colors[data.length % colors.length],
        },
      ],
    });
  };

  const removeDataItem = (index: number) => {
    onUpdate({
      ...element,
      data: data.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">标题</Label>
        <Input
          value={title}
          onChange={(e) => onUpdate({ ...element, title: e.target.value })}
          className="h-8"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">数据项</Label>
        <Button variant="outline" size="sm" onClick={addDataItem}>
          + 添加
        </Button>
      </div>
      {data.map((item, index) => (
        <div key={index} className="p-2 bg-muted rounded space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={item.label}
              onChange={(e) => updateDataItem(index, 'label', e.target.value)}
              className="h-7 flex-1"
              placeholder="标签"
            />
            <Input
              type="number"
              value={item.value}
              onChange={(e) => updateDataItem(index, 'value', Number(e.target.value))}
              className="h-7 w-16"
              placeholder="值"
            />
            <input
              type="color"
              value={item.color}
              onChange={(e) => updateDataItem(index, 'color', e.target.value)}
              className="h-7 w-7 cursor-pointer rounded"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => removeDataItem(index)}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示数值</Label>
          <input
            type="checkbox"
            checked={showValues}
            onChange={(e) => onUpdate({ ...element, showValues: e.target.checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示图例</Label>
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => onUpdate({ ...element, showLegend: e.target.checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">显示坐标轴</Label>
          <input
            type="checkbox"
            checked={showAxis}
            onChange={(e) => onUpdate({ ...element, showAxis: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
}

/** 网格编辑器 */
function GridEditor({
  element,
  onUpdate,
}: {
  element: CompositeShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  if (element.type === 'squareGrid') {
    // 正方形网格编辑器：设置行列数
    const rows = element.rows || 3;
    const cols = element.cols || 3;

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">行数: {rows}</Label>
          <Slider
            value={[rows]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v) => onUpdate({ ...element, rows: v[0] })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">列数: {cols}</Label>
          <Slider
            value={[cols]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v) => onUpdate({ ...element, cols: v[0] })}
          />
        </div>
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          网格规格: {rows} 行 × {cols} 列
        </div>
      </div>
    );
  }
  
  // cubeGrid 保留旧逻辑（如果需要）
  const gridSize = element.gridSize || 5;
  const cellSize = element.cellSize || 40;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">网格规格: {gridSize} × {gridSize}</Label>
        <Slider
          value={[gridSize]}
          min={2}
          max={10}
          step={1}
          onValueChange={(v) => onUpdate({ ...element, gridSize: v[0], cellSize })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">单元格大小: {cellSize}px</Label>
        <Slider
          value={[cellSize]}
          min={20}
          max={60}
          step={5}
          onValueChange={(v) => onUpdate({ ...element, cellSize: v[0] })}
        />
      </div>
    </div>
  );
}

/** 立体图形编辑器 */
function SolidEditor({
  element,
  onUpdate,
  onCreateElement,
}: {
  element: SolidShape;
  onUpdate: (el: CanvasElement) => void;
  onCreateElement?: (el: CanvasElement) => void;
}) {
  const isCylinderOrCone = element.type === 'cylinder' || element.type === 'cone';
  
  // 生成展开图
  const handleCreateNet = () => {
    if (!onCreateElement) return;
    
    const netId = `net-${Date.now()}`;
    const netOffset = 150; // 展开图距离原图形的偏移
    
    let netElement: NetShape | null = null;
    
    if (element.type === 'cube') {
      // 正方体展开图
      netElement = {
        id: netId,
        type: 'cubeNet',
        position: { x: element.position.x + element.width + netOffset, y: element.position.y },
        width: element.width,
        height: element.height,
        depth: element.depth,
        showLabels: true,
        strokeColor: element.strokeColor,
        strokeWidth: element.strokeWidth,
        strokeStyle: element.strokeStyle,
        fillColor: element.fillColor,
        fillMode: element.fillMode,
        opacity: element.opacity,
        locked: false,
        visible: true,
        sourceId: element.id,
      };
    } else if (element.type === 'cuboid') {
      // 长方体展开图
      netElement = {
        id: netId,
        type: 'cuboidNet',
        position: { x: element.position.x + element.width + netOffset, y: element.position.y },
        width: element.width,
        height: element.height,
        depth: element.depth,
        showLabels: true,
        strokeColor: element.strokeColor,
        strokeWidth: element.strokeWidth,
        strokeStyle: element.strokeStyle,
        fillColor: element.fillColor,
        fillMode: element.fillMode,
        opacity: element.opacity,
        locked: false,
        visible: true,
        sourceId: element.id,
      };
    } else if (element.type === 'cylinder') {
      // 圆柱展开图
      netElement = {
        id: netId,
        type: 'cylinderNet',
        position: { x: element.position.x + element.width + netOffset, y: element.position.y },
        radius: element.width / 2,
        cylinderHeight: element.height,
        showLabels: true,
        strokeColor: element.strokeColor,
        strokeWidth: element.strokeWidth,
        strokeStyle: element.strokeStyle,
        fillColor: element.fillColor,
        fillMode: element.fillMode,
        opacity: element.opacity,
        locked: false,
        visible: true,
        sourceId: element.id,
      };
    } else if (element.type === 'cone') {
      // 圆锥展开图
      netElement = {
        id: netId,
        type: 'coneNet',
        position: { x: element.position.x + element.width + netOffset, y: element.position.y },
        radius: element.width / 2,
        cylinderHeight: element.height,
        showLabels: true,
        strokeColor: element.strokeColor,
        strokeWidth: element.strokeWidth,
        strokeStyle: element.strokeStyle,
        fillColor: element.fillColor,
        fillMode: element.fillMode,
        opacity: element.opacity,
        locked: false,
        visible: true,
        sourceId: element.id,
      };
    }
    
    if (netElement) {
      onCreateElement(netElement);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">宽度</Label>
            <Input
              type="number"
              value={element.width}
              onChange={(e) => onUpdate({ ...element, width: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">高度</Label>
            <Input
              type="number"
              value={element.height}
              onChange={(e) => onUpdate({ ...element, height: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </div>
        {(element.type === 'cuboid' || element.type === 'prism') && (
          <div>
            <Label className="text-xs">深度</Label>
            <Input
              type="number"
              value={element.depth}
              onChange={(e) => onUpdate({ ...element, depth: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* 生成展开图按钮 */}
      {['cube', 'cuboid', 'cylinder', 'cone'].includes(element.type) && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCreateNet}
        >
          <UnfoldVertical className="h-4 w-4 mr-2" />
          生成展开图
        </Button>
      )}
      
      <div className="flex items-center justify-between">
        <Label className="text-xs">显示尺寸标注</Label>
        <input
          type="checkbox"
          checked={element.showDimensions}
          onChange={(e) => onUpdate({ ...element, showDimensions: e.target.checked })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">显示隐藏线</Label>
        <input
          type="checkbox"
          checked={element.showHiddenLines}
          onChange={(e) => onUpdate({ ...element, showHiddenLines: e.target.checked })}
        />
      </div>
    </div>
  );
}

/** 变换编辑器（旋转、对称） */
function TransformEditor({
  element,
  onUpdate,
}: {
  element: PlaneShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  const rotation = element.rotation || 0;
  const flipX = element.flipX || false;
  const flipY = element.flipY || false;
  const fillMode = element.fillMode || 'none';
  const fillColor = element.fillColor || element.strokeColor || '#3b82f6';

  const handleRotate = (angle: number) => {
    onUpdate({ ...element, rotation: (rotation + angle) % 360 });
  };

  const handleFlipX = () => {
    onUpdate({ ...element, flipX: !flipX });
  };

  const handleFlipY = () => {
    onUpdate({ ...element, flipY: !flipY });
  };

  const handleFillModeChange = (mode: 'none' | 'solid') => {
    onUpdate({ ...element, fillMode: mode });
  };

  const handleFillColorChange = (color: string) => {
    onUpdate({ ...element, fillColor: color });
  };

  return (
    <div className="space-y-3">
      {/* 填充设置 */}
      <Separator />
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <Label className="text-xs font-medium">填充</Label>
      </div>
      
      <div className="space-y-2">
        <Select value={fillMode} onValueChange={(v) => handleFillModeChange(v as 'none' | 'solid')}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">无填充</SelectItem>
            <SelectItem value="solid">纯色填充</SelectItem>
          </SelectContent>
        </Select>
        
        {fillMode === 'solid' && (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={fillColor}
              onChange={(e) => handleFillColorChange(e.target.value)}
              className="h-8 w-10 p-0 cursor-pointer"
            />
            <Input
              type="text"
              value={fillColor}
              onChange={(e) => handleFillColorChange(e.target.value)}
              className="h-8 flex-1 text-xs"
              placeholder="#000000"
            />
          </div>
        )}
      </div>
      
      <Separator />
      <Label className="text-xs font-medium">变换</Label>
      
      {/* 旋转控制 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">旋转角度: {rotation}°</Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleRotate(-90)}
              title="逆时针旋转90°"
            >
              -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleRotate(90)}
              title="顺时针旋转90°"
            >
              +90°
            </Button>
          </div>
        </div>
        <Slider
          value={[rotation]}
          min={0}
          max={360}
          step={15}
          onValueChange={(v) => onUpdate({ ...element, rotation: v[0] })}
        />
      </div>
      
      {/* 对称控制 */}
      <div className="flex gap-2">
        <Button
          variant={flipX ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={handleFlipX}
        >
          <FlipHorizontal className="h-4 w-4 mr-1" />
          水平翻转
        </Button>
        <Button
          variant={flipY ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={handleFlipY}
        >
          <FlipVertical className="h-4 w-4 mr-1" />
          垂直翻转
        </Button>
      </div>
    </div>
  );
}
