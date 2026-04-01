'use client';

import React from 'react';

interface ChartClickData {
  name: string;
  value: number;
  type: string; // 筛选类型：level, category, grade, month
}

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; fill?: string }>;
  height?: number;
  colors?: string[];
  chartType?: string; // 图表类型，用于筛选
  onItemClick?: (data: ChartClickData) => void;
}

/**
 * 简单的 CSS 柱状图组件
 * 用于替代 recharts，避免动态加载问题
 */
export function SimpleBarChart({ data, height = 300, colors, chartType = 'default', onItemClick }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const chartColors = colors || defaultColors;

  return (
    <div style={{ width: '100%', height }} className="flex items-end justify-around gap-2 p-4">
      {data.map((item, index) => (
        <div 
          key={index} 
          className={`flex flex-col items-center gap-2 flex-1 ${item.value > 0 && onItemClick ? 'cursor-pointer' : ''}`}
          onClick={() => item.value > 0 && onItemClick?.({ name: item.name, value: item.value, type: chartType })}
        >
          <div className="text-sm font-medium">{item.value}</div>
          <div
            className={`w-full rounded-t-md transition-all duration-300 ${item.value > 0 && onItemClick ? 'hover:opacity-80 hover:scale-105' : ''}`}
            style={{
              height: `${(item.value / maxValue) * (height - 60)}px`,
              backgroundColor: item.fill || chartColors[index % chartColors.length],
              minHeight: item.value > 0 ? '4px' : '0px',
            }}
          />
          <div className="text-xs text-gray-600 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SimplePieChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  colors?: string[];
  chartType?: string;
  onItemClick?: (data: ChartClickData) => void;
}

/**
 * 简单的 CSS 饼图组件
 */
export function SimplePieChart({ data, height = 300, colors, chartType = 'default', onItemClick }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const defaultColors = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4'];
  const chartColors = colors || defaultColors;

  // 过滤掉值为 0 的数据
  const validData = data.filter(d => d.value > 0);

  if (validData.length === 0 || total === 0) {
    return (
      <div style={{ width: '100%', height }} className="flex items-center justify-center text-gray-400">
        暂无数据
      </div>
    );
  }

  // 计算饼图扇形
  let currentAngle = 0;
  const segments = validData.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      percentage,
      startAngle,
      angle,
      color: chartColors[index % chartColors.length],
    };
  });

  return (
    <div style={{ width: '100%', height }} className="flex items-center justify-center gap-4">
      {/* 饼图 */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {segments.map((segment, index) => {
            const startRad = (segment.startAngle * Math.PI) / 180;
            const endRad = ((segment.startAngle + segment.angle) * Math.PI) / 180;
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            const largeArc = segment.angle > 180 ? 1 : 0;

            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={segment.color}
                stroke="white"
                strokeWidth="1"
                className={`transition-all cursor-pointer ${onItemClick ? 'hover:opacity-80' : ''}`}
                onClick={() => onItemClick?.({ name: segment.name, value: segment.value, type: chartType })}
              />
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="flex flex-col gap-2">
        {segments.map((segment, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-2 ${onItemClick ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : ''}`}
            onClick={() => onItemClick?.({ name: segment.name, value: segment.value, type: chartType })}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-600">
              {segment.name}: {segment.value} ({(segment.percentage * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SimpleLineChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
  chartType?: string;
  onItemClick?: (data: ChartClickData) => void;
}

/**
 * 简单的 CSS 折线图组件
 */
export function SimpleLineChart({ data, height = 300, color = '#3b82f6', chartType = 'default', onItemClick }: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ width: '100%', height }} className="flex items-center justify-center text-gray-400">
        暂无数据
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  // 计算点的位置
  const points = data.map((item, index) => ({
    ...item,
    x: (index / (data.length - 1 || 1)) * 100,
    y: 100 - ((item.value - minValue) / range) * 80 - 10, // 留出上下边距
  }));

  // 生成路径
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ width: '100%', height }} className="relative p-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* 网格线 */}
        <line x1="0" y1="10" x2="100" y2="10" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="90" x2="100" y2="90" stroke="#e5e7eb" strokeWidth="0.5" />

        {/* 折线 */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* 数据点 */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
            className={`transition-all ${onItemClick ? 'cursor-pointer hover:r-5' : ''}`}
            onClick={() => onItemClick?.({ name: point.name, value: point.value, type: chartType })}
          />
        ))}
      </svg>

      {/* X 轴标签 */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around text-xs text-gray-600">
        {data.map((item, index) => (
          <span 
            key={index} 
            className={`truncate max-w-[60px] ${onItemClick ? 'cursor-pointer hover:text-primary' : ''}`}
            onClick={() => onItemClick?.({ name: item.name, value: item.value, type: chartType })}
          >
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export type { ChartClickData };

// ==================== 雷达图组件 ====================

interface SimpleRadarChartProps {
  data: Array<{ category: string; score: number; fullMark?: number }>;
  height?: number;
  color?: string;
}

/**
 * 简单的 SVG 雷达图组件
 */
export function SimpleRadarChart({ data, height = 280, color = '#8b5cf6' }: SimpleRadarChartProps) {
  if (data.length === 0 || data.every(d => d.score === 0)) {
    return (
      <div style={{ width: '100%', height }} className="flex items-center justify-center text-gray-400">
        暂无数据
      </div>
    );
  }

  const maxScore = 10; // 最大分数
  const centerX = 150;
  const centerY = 140;
  const radius = 100;

  // 计算每个维度的角度
  const angleStep = (2 * Math.PI) / data.length;
  const startAngle = -Math.PI / 2; // 从顶部开始

  // 计算数据点坐标
  const points = data.map((item, index) => {
    const angle = startAngle + index * angleStep;
    const r = (item.score / maxScore) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      labelX: centerX + (radius + 25) * Math.cos(angle),
      labelY: centerY + (radius + 25) * Math.sin(angle),
      ...item,
    };
  });

  // 生成多边形路径
  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // 生成背景网格（同心多边形）
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]; // 20%, 40%, 60%, 80%, 100%
  const gridPaths = gridLevels.map(level => {
    const gridPoints = data.map((_, index) => {
      const angle = startAngle + index * angleStep;
      const r = level * radius;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    });
    return `M ${gridPoints.join(' L ')} Z`;
  });

  return (
    <div style={{ width: '100%', height }} className="flex items-center justify-center">
      <svg viewBox="0 0 300 280" className="w-full h-full max-w-[400px]">
        {/* 背景网格 */}
        {gridPaths.map((path, index) => (
          <path
            key={index}
            d={path}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* 轴线 */}
        {data.map((_, index) => {
          const angle = startAngle + index * angleStep;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* 数据多边形 */}
        <path
          d={polygonPath}
          fill={color}
          fillOpacity={0.3}
          stroke={color}
          strokeWidth="2"
        />

        {/* 数据点 */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
          />
        ))}

        {/* 标签 */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
            style={{ fontSize: '11px' }}
          >
            {point.category}
          </text>
        ))}

        {/* 分数标注 */}
        {gridLevels.filter((_, i) => i % 2 === 0).map((level, index) => {
          const y = centerY - level * radius;
          return (
            <text
              key={index}
              x={centerX - 5}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-400"
              style={{ fontSize: '10px' }}
            >
              {Math.round(level * maxScore)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
