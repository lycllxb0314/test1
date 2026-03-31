'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ToolType, ToolGroup, TOOL_GROUPS } from '@/types/math-canvas';
import {
  MousePointer,
  Hand,
  Pencil,
  Eraser,
  Type,
  Minus,
  GitBranch,
  Triangle,
  Square,
  RectangleHorizontal,
  Circle,
  PieChart,
  Hexagon,
  Box,
  Cylinder,
  Cone,
  CircleDot,
  Grid3X3,
  MoveHorizontal,
  BarChart2,
  TrendingUp,
  Ruler,
  UnfoldVertical,
} from 'lucide-react';

/** 工具图标映射 */
const TOOL_ICONS: Record<ToolType, React.ReactNode> = {
  select: <MousePointer className="h-4 w-4" />,
  pan: <Hand className="h-4 w-4" />,
  pen: <Pencil className="h-4 w-4" />,
  eraser: <Eraser className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  line: <Minus className="h-4 w-4" />,
  segment: <Minus className="h-4 w-4" />,
  ray: <GitBranch className="h-4 w-4" />,
  angle: <div className="h-4 w-4 flex items-center justify-center text-xs">∠</div>,
  triangle: <Triangle className="h-4 w-4" />,
  rightTriangle: <div className="h-4 w-4 flex items-center justify-center text-xs">∟</div>,
  rectangle: <RectangleHorizontal className="h-4 w-4" />,
  square: <Square className="h-4 w-4" />,
  parallelogram: <div className="h-4 w-4 flex items-center justify-center text-xs">▱</div>,
  trapezoid: <div className="h-4 w-4 flex items-center justify-center text-xs">梯</div>,
  circle: <Circle className="h-4 w-4" />,
  sector: <PieChart className="h-4 w-4" />,
  polygon: <Hexagon className="h-4 w-4" />,
  cube: <Box className="h-4 w-4" />,
  cuboid: <Box className="h-4 w-4" />,
  cylinder: <Cylinder className="h-4 w-4" />,
  cone: <Cone className="h-4 w-4" />,
  sphere: <CircleDot className="h-4 w-4" />,
  squareGrid: <Grid3X3 className="h-4 w-4" />,
  cubeGrid: <div className="h-4 w-4 flex items-center justify-center text-xs">▦</div>,
  numberLine: <MoveHorizontal className="h-4 w-4" />,
  segmentDiagram: <GitBranch className="h-4 w-4" />,
  barChart: <BarChart2 className="h-4 w-4" />,
  lineChart: <TrendingUp className="h-4 w-4" />,
  pieChart: <PieChart className="h-4 w-4" />,
  dimension: <Ruler className="h-4 w-4" />,
  cubeNet: <UnfoldVertical className="h-4 w-4" />,
  cuboidNet: <UnfoldVertical className="h-4 w-4" />,
  cylinderNet: <UnfoldVertical className="h-4 w-4" />,
  coneNet: <UnfoldVertical className="h-4 w-4" />,
};

/** 工具名称映射 */
const TOOL_NAMES: Record<ToolType, string> = {
  select: '选择',
  pan: '平移',
  pen: '画笔',
  eraser: '橡皮擦',
  text: '文字',
  line: '直线',
  segment: '线段',
  ray: '射线',
  angle: '角',
  triangle: '三角形',
  rightTriangle: '直角三角形',
  rectangle: '长方形',
  square: '正方形',
  parallelogram: '平行四边形',
  trapezoid: '梯形',
  circle: '圆',
  sector: '扇形',
  polygon: '多边形',
  cube: '正方体',
  cuboid: '长方体',
  cylinder: '圆柱',
  cone: '圆锥',
  sphere: '球',
  squareGrid: '正方形网格',
  cubeGrid: '正方体组合',
  numberLine: '数轴',
  segmentDiagram: '线段图',
  barChart: '条形统计图',
  lineChart: '折线统计图',
  pieChart: '扇形统计图',
  dimension: '尺寸标注',
  cubeNet: '正方体展开图',
  cuboidNet: '长方体展开图',
  cylinderNet: '圆柱展开图',
  coneNet: '圆锥展开图',
};

/** 工具栏 Props */
export type ToolBarProps = {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  groups?: typeof TOOL_GROUPS;
};

/** 工具栏组件 */
export function ToolBar({ activeTool, onToolChange, groups }: ToolBarProps) {
  const toolGroups = groups || [
    {
      name: '选择',
      icon: 'mouse-pointer',
      tools: ['select', 'pan'] as ToolType[],
    },
    {
      name: '基础',
      icon: 'pencil',
      tools: ['pen', 'eraser', 'text'] as ToolType[],
    },
    {
      name: '平面图形',
      icon: 'square',
      tools: ['line', 'segment', 'angle', 'triangle', 'rectangle', 'square', 'parallelogram', 'trapezoid', 'circle', 'sector'] as ToolType[],
    },
    {
      name: '立体图形',
      icon: 'box',
      tools: ['cube', 'cuboid', 'cylinder', 'cone', 'sphere'] as ToolType[],
    },
    {
      name: '组合图形',
      icon: 'grid-3x3',
      tools: ['squareGrid', 'cubeGrid'] as ToolType[],
    },
    {
      name: '数轴与线段图',
      icon: 'move-horizontal',
      tools: ['numberLine', 'segmentDiagram'] as ToolType[],
    },
    {
      name: '统计图',
      icon: 'bar-chart-2',
      tools: ['barChart', 'lineChart', 'pieChart'] as ToolType[],
    },
    {
      name: '标注',
      icon: 'ruler',
      tools: ['dimension'] as ToolType[],
    },
  ];

  return (
    <TooltipProvider>
      <ScrollArea className="h-full w-full">
        <div className="p-2 space-y-3">
          {toolGroups.map((group, groupIndex) => (
            <div key={group.name}>
              <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
                {group.name}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {group.tools.map((tool) => (
                  <Tooltip key={tool}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeTool === tool ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8 w-full justify-start px-2"
                        onClick={() => onToolChange(tool)}
                      >
                        {TOOL_ICONS[tool]}
                        <span className="ml-1.5 text-xs truncate">{TOOL_NAMES[tool]}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{TOOL_NAMES[tool]}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {groupIndex < toolGroups.length - 1 && (
                <Separator className="mt-3" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
