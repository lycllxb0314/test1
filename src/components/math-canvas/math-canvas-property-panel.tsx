'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type {
  Color,
  LineStyle,
  FillMode,
  GridBackground,
} from '@/types/math-canvas';

/** 预设颜色 */
const PRESET_COLORS: Color[] = [
  '#000000', '#333333', '#666666', '#999999',
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

/** 属性面板 Props */
export type PropertyPanelProps = {
  // 画布属性
  grid: GridBackground;
  zoom: number;
  activeColor: Color;
  activeStrokeWidth: number;
  // 填充属性
  fillMode: FillMode;
  fillColor: Color;
  
  // 回调
  onGridChange: (grid: GridBackground) => void;
  onZoomChange: (zoom: number) => void;
  onColorChange: (color: Color) => void;
  onStrokeWidthChange: (width: number) => void;
  onFillModeChange: (mode: FillMode) => void;
  onFillColorChange: (color: Color) => void;
  
  // 操作
  onClear: () => void;
  onExport: (transparentBg: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
};

/** 属性面板组件 */
export function PropertyPanel({
  grid,
  zoom,
  activeColor,
  activeStrokeWidth,
  fillMode,
  fillColor,
  onGridChange,
  onZoomChange,
  onColorChange,
  onStrokeWidthChange,
  onFillModeChange,
  onFillColorChange,
  onClear,
  onExport,
  onUndo,
  onRedo,
}: PropertyPanelProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [transparentBg, setTransparentBg] = useState(true);

  const handleExport = () => {
    onExport(transparentBg);
    setShowExportDialog(false);
  };

  return (
    <div className="h-full w-full p-4 space-y-6 overflow-y-auto">
      {/* 操作按钮 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">操作</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onUndo}>
            撤销
          </Button>
          <Button variant="outline" size="sm" onClick={onRedo}>
            重做
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            清空
          </Button>
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                导出
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
              <DialogHeader>
                <DialogTitle>导出图片</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">透明背景</Label>
                  <Switch
                    checked={transparentBg}
                    onCheckedChange={setTransparentBg}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {transparentBg 
                    ? '导出为透明背景PNG，适合叠加到其他素材上' 
                    : '导出为白色背景PNG'}
                </p>
                <Button className="w-full" onClick={handleExport}>
                  确认导出
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {/* 画布网格开关 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">显示网格</Label>
        <Switch
          checked={grid.enabled}
          onCheckedChange={(enabled) => onGridChange({ ...grid, enabled })}
        />
      </div>

      <Separator />

      {/* 缩放控制 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">缩放: {Math.round(zoom * 100)}%</Label>
        <Slider
          value={[zoom]}
          min={0.1}
          max={3}
          step={0.1}
          onValueChange={(value) => onZoomChange(value[0])}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => onZoomChange(0.5)}>
            50%
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onZoomChange(1)}>
            100%
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onZoomChange(2)}>
            200%
          </Button>
        </div>
      </div>

      <Separator />

      {/* 颜色选择 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">颜色</Label>
        <div className="grid grid-cols-6 gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`h-6 w-6 rounded border-2 ${
                activeColor === color ? 'border-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={activeColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-8 w-12 p-0 cursor-pointer"
          />
          <Input
            type="text"
            value={activeColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-8 flex-1"
            placeholder="#000000"
          />
        </div>
      </div>

      <Separator />

      {/* 线条宽度 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">线条宽度: {activeStrokeWidth}px</Label>
        <Slider
          value={[activeStrokeWidth]}
          min={1}
          max={10}
          step={1}
          onValueChange={(value) => onStrokeWidthChange(value[0])}
        />
      </div>

      <Separator />

      {/* 填充设置 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">填充</Label>
        <Select
          value={fillMode}
          onValueChange={(mode) => onFillModeChange(mode as FillMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">无填充</SelectItem>
            <SelectItem value="solid">纯色填充</SelectItem>
          </SelectContent>
        </Select>
        
        {fillMode !== 'none' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">填充颜色</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={fillColor}
                onChange={(e) => onFillColorChange(e.target.value)}
                className="h-8 w-12 p-0 cursor-pointer"
              />
              <Input
                type="text"
                value={fillColor}
                onChange={(e) => onFillColorChange(e.target.value)}
                className="h-8 flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* 网格设置（仅在开启时显示详细选项） */}
      {grid.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">网格类型</Label>
            <Select
              value={grid.type}
              onValueChange={(type) =>
                onGridChange({ ...grid, type: type as 'square' | 'dot' | 'isometric' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">方格</SelectItem>
                <SelectItem value="dot">点阵</SelectItem>
                <SelectItem value="isometric">等距</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              网格大小: {grid.size}px
            </Label>
            <Slider
              value={[grid.size]}
              min={10}
              max={50}
              step={5}
              onValueChange={(value) => onGridChange({ ...grid, size: value[0] })}
            />
          </div>
        </>
      )}

      <Separator />

      {/* 快捷键提示 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">快捷键</Label>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <kbd className="px-1 bg-muted rounded">Ctrl</kbd> + 滚轮: 缩放</p>
          <p>• <kbd className="px-1 bg-muted rounded">Ctrl</kbd> + <kbd className="px-1 bg-muted rounded">Z</kbd>: 撤销</p>
          <p>• <kbd className="px-1 bg-muted rounded">Ctrl</kbd> + <kbd className="px-1 bg-muted rounded">Y</kbd>: 重做</p>
          <p>• <kbd className="px-1 bg-muted rounded">Delete</kbd>: 删除选中</p>
          <p>• <kbd className="px-1 bg-muted rounded">V</kbd>: 选择工具</p>
          <p>• <kbd className="px-1 bg-muted rounded">H</kbd>: 平移工具</p>
        </div>
      </div>
    </div>
  );
}
