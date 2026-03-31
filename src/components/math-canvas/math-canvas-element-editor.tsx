'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type {
  CanvasElement,
  PlaneShape,
  SolidShape,
  CompositeShape,
  NumberLineShape,
  SegmentDiagramShape,
  ChartShape,
} from '@/types/math-canvas';
import { Trash2, Copy } from 'lucide-react';

/** 元素编辑器 Props */
export type ElementEditorProps = {
  element: CanvasElement | null;
  onUpdate: (element: CanvasElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: CanvasElement) => void;
};

/** 元素编辑器组件 */
export function ElementEditor({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
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
        return <SectorEditor element={element as PlaneShape} onUpdate={onUpdate} />;
      case 'polygon':
        return <PolygonEditor element={element as PlaneShape} onUpdate={onUpdate} />;
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
        return <SolidEditor element={element as SolidShape} onUpdate={onUpdate} />;
      default:
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
  const [startAngle, setStartAngle] = useState(element.startAngle || 0);
  const [endAngle, setEndAngle] = useState(element.endAngle || Math.PI / 2);

  const angleToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
  const degToAngle = (deg: number) => (deg * Math.PI) / 180;

  useEffect(() => {
    onUpdate({
      ...element,
      startAngle: degToAngle(startAngle),
      endAngle: degToAngle(endAngle),
    });
  }, [startAngle, endAngle]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">起始角度: {startAngle}°</Label>
        <Slider
          value={[startAngle]}
          min={0}
          max={360}
          step={15}
          onValueChange={(v) => setStartAngle(v[0])}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">终止角度: {endAngle}°</Label>
        <Slider
          value={[endAngle]}
          min={0}
          max={360}
          step={15}
          onValueChange={(v) => setEndAngle(v[0])}
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
  const [sides, setSides] = useState(element.sides || 6);

  useEffect(() => {
    onUpdate({ ...element, sides });
  }, [sides]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">边数: {sides}</Label>
        <Slider
          value={[sides]}
          min={3}
          max={12}
          step={1}
          onValueChange={(v) => setSides(v[0])}
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {[3, 4, 5, 6, 8, 10, 12].map((n) => (
          <Button
            key={n}
            variant={sides === n ? 'default' : 'outline'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setSides(n)}
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
  const [start, setStart] = useState(element.start);
  const [end, setEnd] = useState(element.end);
  const [step, setStep] = useState(element.step);

  useEffect(() => {
    const marks = [];
    for (let i = start; i <= end; i += step) {
      marks.push({ value: i, label: String(i), highlight: false });
    }
    onUpdate({ ...element, start, end, step, marks });
  }, [start, end, step]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">起点</Label>
          <Input
            type="number"
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">终点</Label>
          <Input
            type="number"
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">步长</Label>
          <Input
            type="number"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="h-8"
            min={1}
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
  const [segments, setSegments] = useState(element.segments);

  useEffect(() => {
    onUpdate({ ...element, segments });
  }, [segments]);

  const updateSegment = (index: number, field: string, value: string | number) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const addSegment = () => {
    setSegments([
      ...segments,
      { label: `${segments.length + 1}`, length: 50, color: '#3b82f6', value: 50 },
    ]);
  };

  const removeSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index));
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
  const [title, setTitle] = useState(element.title);
  const [data, setData] = useState(element.data);

  useEffect(() => {
    onUpdate({ ...element, title, data });
  }, [title, data]);

  const updateDataItem = (index: number, field: string, value: string | number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const addDataItem = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    setData([
      ...data,
      {
        label: `项目${data.length + 1}`,
        value: 10,
        color: colors[data.length % colors.length],
      },
    ]);
  };

  const removeDataItem = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">标题</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
  const [gridSize, setGridSize] = useState(element.gridSize);
  const [cellSize, setCellSize] = useState(element.cellSize);

  useEffect(() => {
    const newCells = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(true));
    onUpdate({ ...element, gridSize, cellSize, cells: newCells });
  }, [gridSize, cellSize]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">网格大小: {gridSize} × {gridSize}</Label>
        <Slider
          value={[gridSize]}
          min={2}
          max={10}
          step={1}
          onValueChange={(v) => setGridSize(v[0])}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">单元格大小: {cellSize}px</Label>
        <Slider
          value={[cellSize]}
          min={20}
          max={60}
          step={5}
          onValueChange={(v) => setCellSize(v[0])}
        />
      </div>
    </div>
  );
}

/** 立体图形编辑器 */
function SolidEditor({
  element,
  onUpdate,
}: {
  element: SolidShape;
  onUpdate: (el: CanvasElement) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">显示展开图</Label>
        <input
          type="checkbox"
          checked={element.showNet}
          onChange={(e) => onUpdate({ ...element, showNet: e.target.checked })}
        />
      </div>
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
