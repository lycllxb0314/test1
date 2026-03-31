/**
 * 动态加载的图表组件
 * 
 * 使用 next/dynamic 懒加载 recharts 库，减少首屏加载体积
 * recharts 是一个较大的库（~200KB gzip），懒加载可显著提升首屏性能
 * 
 * @module components/charts/DynamicCharts
 */

'use client';

import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// 加载中的占位组件
function ChartLoading({ height = 300 }: { height?: number }) {
  return (
    <div 
      className="flex items-center justify-center bg-muted/30 rounded-lg animate-pulse"
      style={{ height }}
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// 创建动态组件的工厂函数
// 使用 unknown 进行中间转换，避免 any
function createDynamicComponent<T>(
  chartName: string,
  withLoading = false
): ComponentType<T> {
  const DynamicComponent = dynamic(
    () => import('recharts').then((mod) => {
      const component = (mod as unknown as Record<string, ComponentType<T>>)[chartName];
      return { default: component };
    }),
    { 
      ssr: false,
      loading: withLoading ? () => <ChartLoading /> : undefined,
    }
  );
  return DynamicComponent;
}

// 基础图表组件类型
type BaseChartProps = {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  data?: unknown[];
  className?: string;
  layout?: 'horizontal' | 'vertical';
  margin?: { top?: number; left?: number; bottom?: number; right?: number };
};

type AxisProps = {
  children?: React.ReactNode;
  dataKey?: string;
  tick?: object | boolean;
  type?: 'number' | 'category';
  domain?: readonly unknown[] | string;
  allowDataOverflow?: boolean;
  allowDuplicatedCategory?: boolean;
  hide?: boolean;
  orientation?: 'top' | 'bottom' | 'left' | 'right';
  mirror?: boolean;
  reversed?: boolean;
  scale?: 'auto' | 'linear' | 'pow' | 'sqrt' | 'log' | 'identity' | 'time' | 'band' | 'point' | 'ordinal' | 'quantile' | 'quantize' | 'utc' | 'sequential' | 'threshold';
  tickCount?: number;
  ticks?: readonly unknown[];
  tickLine?: boolean | object;
  tickMargin?: number;
  tickSize?: number;
  interval?: 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | number;
  padding?: { top?: number; bottom?: number; left?: number; right?: number };
  minTickGap?: number;
  unit?: string | number;
  name?: string;
  tickFormatter?: (value: unknown, index: number) => string;
  axisLine?: boolean | object;
  tickLabel?: boolean | object;
  width?: number;
  height?: number;
  angle?: number;
  dy?: number;
  dx?: number;
};

type GridProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  horizontal?: boolean | object;
  vertical?: boolean | object;
  horizontalPoints?: number[];
  verticalPoints?: number[];
  strokeDasharray?: string;
  stroke?: string;
  className?: string;
};

type TooltipProps = {
  active?: boolean;
  allowEscapeViewBox?: { x?: boolean; y?: boolean };
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  content?: React.ReactElement | ((props: object) => React.ReactElement);
  contentStyle?: React.CSSProperties;
  coordinate?: { x: number; y: number };
  cursor?: boolean | object;
  filterNull?: boolean;
  formatter?: (value: unknown, name: string, props: object, index: number, payload: object) => React.ReactNode;
  itemStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  label?: string | React.ReactElement | ((props: object) => React.ReactElement);
  labelFormatter?: (label: string, payload: object[]) => React.ReactNode;
  offset?: number;
  payload?: object[];
  position?: { x: number; y: number } | 'top' | 'left' | 'right' | 'bottom' | 'center';
  reverseDirection?: boolean;
  separator?: string;
  wrapperStyle?: React.CSSProperties;
  useTranslate3d?: boolean;
  viewBox?: { x: number; y: number; width: number; height: number };
  trigger?: 'hover' | 'click';
};

type LegendProps = {
  content?: React.ReactElement | ((props: object) => React.ReactElement);
  iconSize?: number;
  iconType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
  layout?: 'horizontal' | 'vertical';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  align?: 'left' | 'center' | 'right';
  payload?: Array<{ value: string; type: string; id: string; color: string }>;
  chartWidth?: number;
  chartHeight?: number;
  margin?: { top?: number; left?: number; bottom?: number; right?: number };
  wrapperStyle?: React.CSSProperties;
  formatter?: (value: string, entry: object, index: number) => React.ReactNode;
};

type BarProps = BaseChartProps & {
  dataKey: string | number | ((obj: object) => unknown);
  fill?: string;
  stroke?: string;
  radius?: number | number[];
  name?: string;
  unit?: string;
  legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | 'none';
  barSize?: number;
  maxBarSize?: number;
  minPointSize?: number;
  background?: boolean | object;
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  label?: boolean | string | React.ReactElement | ((props: object) => React.ReactElement);
  stackId?: string | number;
};

type LineProps = BaseChartProps & {
  dataKey: string | number | ((obj: object) => unknown);
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  dot?: boolean | object | React.ReactElement;
  activeDot?: boolean | object | React.ReactElement;
  name?: string;
  unit?: string;
  legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | 'none';
  type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | 'curveLinear' | 'curveMonotoneX' | 'curveMonotoneY';
  connectNulls?: boolean;
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  hide?: boolean;
};

type PieProps = BaseChartProps & {
  dataKey: string | number;
  nameKey?: string;
  valueKey?: string;
  cx?: number | string;
  cy?: number | string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  label?: boolean | string | React.ReactElement | ((props: Record<string, unknown>) => React.ReactNode);
  labelLine?: boolean | object | React.ReactElement | ((props: object) => React.ReactElement);
  minAngle?: number;
  legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | 'none';
  fill?: string;
  stroke?: string;
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  activeIndex?: number | number[];
  activeShape?: object | React.ReactElement | ((props: object) => React.ReactElement);
  blendStroke?: boolean;
  animationId?: number;
  cornerRadius?: number;
  sort?: (a: object, b: object) => number;
};

type CellProps = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  className?: string;
};

type RadarProps = BaseChartProps & {
  dataKey: string | number;
  name?: string;
  stroke?: string;
  fill?: string;
  fillOpacity?: number;
  dot?: boolean | object | React.ReactElement | ((props: object) => React.ReactElement);
  activeDot?: boolean | object | React.ReactElement;
  legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | 'none';
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
};

type PolarAngleAxisProps = {
  dataKey?: string | number;
  type?: 'number' | 'category';
  angle?: number;
  tick?: boolean | object | React.ReactElement;
  tickLine?: boolean | object;
  axisLine?: boolean | object;
  tickFormatter?: (value: unknown, index: number) => string;
  allowDuplicatedCategory?: boolean;
};

type PolarRadiusAxisProps = {
  type?: 'number' | 'category';
  angle?: number;
  tick?: boolean | object;
  tickCount?: number;
  domain?: readonly unknown[] | string;
  axisLine?: boolean | object;
  tickLine?: boolean | object;
  tickFormatter?: (value: unknown, index: number) => string;
  allowDuplicatedCategory?: boolean;
};

type PolarGridProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  gridType?: 'polygon' | 'circle';
  radialLines?: boolean;
  stroke?: string;
  strokeDasharray?: string;
  polarAngles?: number[];
  polarRadius?: number[];
};

type ResponsiveContainerProps = {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  aspect?: number;
  minWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  debounce?: number;
  className?: string;
  id?: string;
};

// 导出动态加载的图表组件
export const BarChart: ComponentType<BaseChartProps> = createDynamicComponent<BaseChartProps>('BarChart', true);
export const Bar: ComponentType<BarProps> = createDynamicComponent<BarProps>('Bar');
export const XAxis: ComponentType<AxisProps> = createDynamicComponent<AxisProps>('XAxis');
export const YAxis: ComponentType<AxisProps> = createDynamicComponent<AxisProps>('YAxis');
export const CartesianGrid: ComponentType<GridProps> = createDynamicComponent<GridProps>('CartesianGrid');
export const Tooltip: ComponentType<TooltipProps> = createDynamicComponent<TooltipProps>('Tooltip');
export const ResponsiveContainer: ComponentType<ResponsiveContainerProps> = createDynamicComponent<ResponsiveContainerProps>('ResponsiveContainer', true);
export const PieChart: ComponentType<BaseChartProps> = createDynamicComponent<BaseChartProps>('PieChart', true);
export const Pie: ComponentType<PieProps> = createDynamicComponent<PieProps>('Pie');
export const Cell: ComponentType<CellProps> = createDynamicComponent<CellProps>('Cell');
export const LineChart: ComponentType<BaseChartProps> = createDynamicComponent<BaseChartProps>('LineChart', true);
export const Line: ComponentType<LineProps> = createDynamicComponent<LineProps>('Line');
export const Legend: ComponentType<LegendProps> = createDynamicComponent<LegendProps>('Legend');
export const RadarChart: ComponentType<BaseChartProps> = createDynamicComponent<BaseChartProps>('RadarChart', true);
export const PolarGrid: ComponentType<PolarGridProps> = createDynamicComponent<PolarGridProps>('PolarGrid');
export const PolarAngleAxis: ComponentType<PolarAngleAxisProps> = createDynamicComponent<PolarAngleAxisProps>('PolarAngleAxis');
export const PolarRadiusAxis: ComponentType<PolarRadiusAxisProps> = createDynamicComponent<PolarRadiusAxisProps>('PolarRadiusAxis');
export const Radar: ComponentType<RadarProps> = createDynamicComponent<RadarProps>('Radar');

// 预定义的颜色方案，方便在图表中使用
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
] as const;

// 常用的饼图颜色
export const PIE_COLORS = CHART_COLORS;
