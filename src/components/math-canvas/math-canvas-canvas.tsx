'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  CanvasElement,
  CanvasState,
  GridBackground,
  Point,
  ToolType,
  PlaneShape,
  SolidShape,
  CompositeShape,
  ChartShape,
  NumberLineShape,
  SegmentDiagramShape,
} from '@/types/math-canvas';

/** 数学画布组件 Props */
export type MathCanvasProps = {
  width?: number;
  height?: number;
  state: CanvasState;
  onChange?: (state: CanvasState) => void;
  onElementAdd?: (element: CanvasElement) => void;
  onElementSelect?: (elementIds: string[]) => void;
};

/** 默认网格配置 */
const DEFAULT_GRID: GridBackground = {
  enabled: true,
  type: 'square',
  size: 20,
  color: '#e5e7eb',
  showAxis: false,
  axisColor: '#374151',
};

/** 默认画布状态 */
const DEFAULT_STATE: CanvasState = {
  elements: [],
  grid: DEFAULT_GRID,
  zoom: 1,
  pan: { x: 0, y: 0 },
  selection: [],
  activeTool: 'select',
  activeColor: '#3b82f6',
  activeStrokeWidth: 2,
};

/** 数学画布组件 */
export function MathCanvas({
  width = 800,
  height = 600,
  state,
  onChange,
  onElementAdd,
  onElementSelect,
}: MathCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  // 获取鼠标在画布上的位置
  const getMousePos = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - state.pan.x) / state.zoom,
      y: (e.clientY - rect.top - state.pan.y) / state.zoom,
    };
  }, [state.pan, state.zoom]);

  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!state.grid.enabled) return;

    const { type, size, color, showAxis, axisColor } = state.grid;
    const canvas = ctx.canvas;
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    if (type === 'square') {
      // 绘制方格
      const gridSize = size * state.zoom;
      const offsetX = state.pan.x % gridSize;
      const offsetY = state.pan.y % gridSize;

      ctx.beginPath();
      for (let x = offsetX; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = offsetY; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    } else if (type === 'dot') {
      // 绘制点阵
      const dotSpacing = size * state.zoom;
      ctx.fillStyle = color;
      for (let x = state.pan.x % dotSpacing; x < w; x += dotSpacing) {
        for (let y = state.pan.y % dotSpacing; y < h; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 绘制坐标轴
    if (showAxis) {
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // X轴
      ctx.moveTo(0, h / 2 + state.pan.y);
      ctx.lineTo(w, h / 2 + state.pan.y);
      // Y轴
      ctx.moveTo(w / 2 + state.pan.x, 0);
      ctx.lineTo(w / 2 + state.pan.x, h);
      ctx.stroke();
    }

    ctx.restore();
  }, [state.grid, state.pan, state.zoom]);

  // 绘制平面图形
  const drawPlaneShape = useCallback((ctx: CanvasRenderingContext2D, shape: PlaneShape) => {
    ctx.save();
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.fillStyle = shape.fillColor;
    ctx.globalAlpha = shape.opacity;

    const { type, points, radius = 0, startAngle = 0, endAngle = Math.PI * 2, sides = 3 } = shape;

    ctx.beginPath();

    switch (type) {
      case 'line':
        if (points.length >= 2) {
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
        }
        break;

      case 'segment':
        if (points.length >= 2) {
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
        }
        break;

      case 'ray':
        if (points.length >= 2) {
          const dx = points[1].x - points[0].x;
          const dy = points[1].y - points[0].y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const extendX = (dx / len) * 1000;
          const extendY = (dy / len) * 1000;
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[0].x + extendX, points[0].y + extendY);
        }
        break;

      case 'angle':
        if (points.length >= 3) {
          const [p1, vertex, p2] = points;
          const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
          const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
          const arcRadius = 20;
          ctx.moveTo(vertex.x, vertex.y);
          ctx.arc(vertex.x, vertex.y, arcRadius, angle1, angle2);
        }
        break;

      case 'triangle':
      case 'rightTriangle':
      case 'isoscelesTriangle':
      case 'equilateralTriangle':
        if (points.length >= 3) {
          ctx.moveTo(points[0].x, points[0].y);
          points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
          ctx.closePath();
        }
        break;

      case 'rectangle':
      case 'square':
        if (points.length >= 2) {
          const [p1, p2] = points;
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          const w = Math.abs(p2.x - p1.x);
          const h = Math.abs(p2.y - p1.y);
          ctx.rect(x, y, w, h);
        }
        break;

      case 'parallelogram':
        if (points.length >= 2) {
          const [p1, p2] = points;
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          const skew = width * 0.3;
          ctx.moveTo(x + skew, y);
          ctx.lineTo(x + width + skew, y);
          ctx.lineTo(x + width, y + height);
          ctx.lineTo(x, y + height);
          ctx.closePath();
        }
        break;

      case 'trapezoid':
        if (points.length >= 2) {
          const [p1, p2] = points;
          const x = Math.min(p1.x, p2.x);
          const y = Math.min(p1.y, p2.y);
          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          const topWidth = width * 0.6;
          const offset = (width - topWidth) / 2;
          ctx.moveTo(x + offset, y);
          ctx.lineTo(x + width - offset, y);
          ctx.lineTo(x + width, y + height);
          ctx.lineTo(x, y + height);
          ctx.closePath();
        }
        break;

      case 'polygon':
        if (points.length >= 1) {
          const center = points[0];
          const r = radius || 50;
          for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const x = center.x + r * Math.cos(angle);
            const y = center.y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
        break;

      case 'circle':
        if (points.length >= 1) {
          ctx.arc(points[0].x, points[0].y, radius || 50, 0, Math.PI * 2);
        }
        break;

      case 'sector':
        if (points.length >= 1) {
          ctx.moveTo(points[0].x, points[0].y);
          ctx.arc(points[0].x, points[0].y, radius || 50, startAngle, endAngle);
          ctx.closePath();
        }
        break;

      case 'arc':
        if (points.length >= 1) {
          ctx.arc(points[0].x, points[0].y, radius || 50, startAngle, endAngle);
        }
        break;
    }

    if (shape.fillMode !== 'none' && shape.type !== 'line' && shape.type !== 'ray') {
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  // 绘制立体图形
  const drawSolidShape = useCallback((ctx: CanvasRenderingContext2D, shape: SolidShape) => {
    ctx.save();
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.fillStyle = shape.fillColor;
    ctx.globalAlpha = shape.opacity;

    const { type, position, width, height, depth, showHiddenLines } = shape;
    const offset = 15; // 透视偏移

    switch (type) {
      case 'cube':
        // 绘制正方体的三个可见面
        ctx.beginPath();
        // 前面
        ctx.rect(position.x, position.y, width, height);
        ctx.fill();
        ctx.stroke();
        
        // 顶面
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + offset, position.y - offset);
        ctx.lineTo(position.x + width + offset, position.y - offset);
        ctx.lineTo(position.x + width, position.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 右面
        ctx.beginPath();
        ctx.moveTo(position.x + width, position.y);
        ctx.lineTo(position.x + width + offset, position.y - offset);
        ctx.lineTo(position.x + width + offset, position.y + height - offset);
        ctx.lineTo(position.x + width, position.y + height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 隐藏线
        if (showHiddenLines) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = '#999';
          ctx.beginPath();
          // 后面的边
          ctx.moveTo(position.x + offset, position.y - offset);
          ctx.lineTo(position.x + offset, position.y + height - offset);
          ctx.lineTo(position.x + width + offset, position.y + height - offset);
          ctx.stroke();
        }
        break;

      case 'cuboid':
        // 类似正方体，但宽高深不同
        const offsetDepth = depth * 0.3;
        ctx.beginPath();
        ctx.rect(position.x, position.y, width, height);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + offsetDepth, position.y - offsetDepth);
        ctx.lineTo(position.x + width + offsetDepth, position.y - offsetDepth);
        ctx.lineTo(position.x + width, position.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(position.x + width, position.y);
        ctx.lineTo(position.x + width + offsetDepth, position.y - offsetDepth);
        ctx.lineTo(position.x + width + offsetDepth, position.y + height - offsetDepth);
        ctx.lineTo(position.x + width, position.y + height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'cylinder':
        // 绘制圆柱
        const cy = position.y + height / 2;
        
        // 底面椭圆
        ctx.beginPath();
        ctx.ellipse(position.x + width / 2, position.y + height, width / 2, height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 侧面
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x, position.y + height);
        ctx.moveTo(position.x + width, position.y);
        ctx.lineTo(position.x + width, position.y + height);
        ctx.stroke();
        
        // 顶面椭圆
        ctx.beginPath();
        ctx.ellipse(position.x + width / 2, position.y, width / 2, height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'cone':
        // 绘制圆锥
        ctx.beginPath();
        // 底面椭圆
        ctx.ellipse(position.x + width / 2, position.y + height, width / 2, height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 侧面
        ctx.beginPath();
        ctx.moveTo(position.x + width / 2, position.y);
        ctx.lineTo(position.x, position.y + height);
        ctx.moveTo(position.x + width / 2, position.y);
        ctx.lineTo(position.x + width, position.y + height);
        ctx.stroke();
        break;

      case 'sphere':
        // 绘制球
        ctx.beginPath();
        ctx.arc(position.x + width / 2, position.y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 经纬线
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(position.x + width / 2, position.y + height / 2, width / 2, height / 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(position.x + width / 2, position.y + height / 2, width / 4, height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }, []);

  // 绘制组合图形
  const drawCompositeShape = useCallback((ctx: CanvasRenderingContext2D, shape: CompositeShape) => {
    ctx.save();
    const { gridSize, cellSize, cells, showGrid, showCount } = shape;

    let count = 0;
    cells.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = shape.points[0]?.x || 0;
        const y = shape.points[0]?.y || 0;
        const cellX = x + colIndex * cellSize;
        const cellY = y + rowIndex * cellSize;

        if (showGrid) {
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        }

        if (cell) {
          ctx.fillStyle = shape.fillColor;
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
          ctx.strokeStyle = shape.strokeColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);
          count++;
        }
      });
    });

    if (showCount) {
      ctx.fillStyle = '#333';
      ctx.font = '14px sans-serif';
      ctx.fillText(`面积 = ${count} 个单位`, shape.points[0]?.x || 0, (shape.points[0]?.y || 0) + gridSize * cellSize + 20);
    }

    ctx.restore();
  }, []);

  // 绘制数轴
  const drawNumberLine = useCallback((ctx: CanvasRenderingContext2D, shape: NumberLineShape) => {
    ctx.save();
    const { start, end, step, marks, showLabels, showTicks } = shape;
    const y = shape.points[0]?.y || 100;
    const xStart = shape.points[0]?.x || 50;
    const length = 600;

    // 主轴线
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xStart + length, y);
    ctx.stroke();

    // 箭头
    ctx.beginPath();
    ctx.moveTo(xStart + length, y);
    ctx.lineTo(xStart + length - 10, y - 5);
    ctx.lineTo(xStart + length - 10, y + 5);
    ctx.closePath();
    ctx.fillStyle = shape.strokeColor;
    ctx.fill();

    // 刻度和标记
    const scale = length / (end - start);
    marks.forEach((mark) => {
      const x = xStart + (mark.value - start) * scale;
      
      if (showTicks) {
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
      }

      if (showLabels) {
        ctx.fillStyle = mark.highlight ? '#ef4444' : '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(mark.label, x, y + 20);
      }

      if (mark.highlight) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }
    });

    ctx.restore();
  }, []);

  // 绘制统计图
  const drawChart = useCallback((ctx: CanvasRenderingContext2D, shape: ChartShape) => {
    ctx.save();
    const { chartType, title, data, showValues, showLegend, showAxis } = shape;
    const x = shape.points[0]?.x || 50;
    const y = shape.points[0]?.y || 50;
    const chartWidth = 400;
    const chartHeight = 250;

    if (chartType === 'bar') {
      // 条形图
      const barWidth = chartWidth / data.length - 10;
      const maxValue = Math.max(...data.map(d => d.value));

      // 标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + chartWidth / 2, y - 10);

      // 坐标轴
      if (showAxis) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + chartHeight);
        ctx.lineTo(x + chartWidth, y + chartHeight);
        ctx.stroke();
      }

      // 条形
      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const barX = x + index * (barWidth + 10) + 5;
        const barY = y + chartHeight - barHeight;

        ctx.fillStyle = item.color;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        if (showValues) {
          ctx.fillStyle = '#333';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(item.value), barX + barWidth / 2, barY - 5);
        }

        if (showLegend) {
          ctx.fillStyle = '#666';
          ctx.font = '11px sans-serif';
          ctx.fillText(item.label, barX + barWidth / 2, y + chartHeight + 15);
        }
      });
    } else if (chartType === 'line') {
      // 折线图
      const maxValue = Math.max(...data.map(d => d.value));

      // 标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + chartWidth / 2, y - 10);

      // 坐标轴
      if (showAxis) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + chartHeight);
        ctx.lineTo(x + chartWidth, y + chartHeight);
        ctx.stroke();
      }

      // 折线
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((item, index) => {
        const pointX = x + (index + 1) * (chartWidth / (data.length + 1));
        const pointY = y + chartHeight - (item.value / maxValue) * chartHeight;
        if (index === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
      });
      ctx.stroke();

      // 数据点
      data.forEach((item, index) => {
        const pointX = x + (index + 1) * (chartWidth / (data.length + 1));
        const pointY = y + chartHeight - (item.value / maxValue) * chartHeight;

        ctx.beginPath();
        ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.stroke();

        if (showValues) {
          ctx.fillStyle = '#333';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(item.value), pointX, pointY - 10);
        }

        if (showLegend) {
          ctx.fillStyle = '#666';
          ctx.font = '10px sans-serif';
          ctx.fillText(item.label, pointX, y + chartHeight + 15);
        }
      });
    } else if (chartType === 'pie') {
      // 扇形图
      const centerX = x + chartWidth / 2;
      const centerY = y + chartHeight / 2;
      const radius = Math.min(chartWidth, chartHeight) / 2 - 30;
      const total = data.reduce((sum, item) => sum + item.value, 0);

      // 标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, centerX, y - 10);

      let currentAngle = -Math.PI / 2;
      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (showValues || showLegend) {
          const midAngle = currentAngle + sliceAngle / 2;
          const labelX = centerX + Math.cos(midAngle) * (radius * 0.7);
          const labelY = centerY + Math.sin(midAngle) * (radius * 0.7);
          ctx.fillStyle = '#fff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${item.label}: ${Math.round(item.value / total * 100)}%`, labelX, labelY);
        }

        currentAngle += sliceAngle;
      });
    }

    ctx.restore();
  }, []);

  // 绘制线段图
  const drawSegmentDiagram = useCallback((ctx: CanvasRenderingContext2D, shape: SegmentDiagramShape) => {
    ctx.save();
    const { segments, showLabels, showValues, showBraces } = shape;
    const startX = shape.points[0]?.x || 50;
    const startY = shape.points[0]?.y || 100;
    const segmentHeight = 20;
    const gap = 40;

    segments.forEach((segment, index) => {
      const y = startY + index * gap;
      const width = segment.length * 2;

      // 绘制线段
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + width, y);
      ctx.stroke();

      // 端点标记
      ctx.beginPath();
      ctx.moveTo(startX, y - 5);
      ctx.lineTo(startX, y + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX + width, y - 5);
      ctx.lineTo(startX + width, y + 5);
      ctx.stroke();

      // 标签
      if (showLabels) {
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(segment.label, startX + width + 10, y + 4);
      }

      // 数值
      if (showValues && segment.value !== undefined) {
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(segment.value), startX + width / 2, y + 20);
      }
    });

    // 花括号
    if (showBraces && segments.length > 0) {
      const lastY = startY + (segments.length - 1) * gap;
      const totalWidth = Math.max(...segments.map(s => s.length * 2));
      
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // 左花括号
      ctx.moveTo(startX - 5, lastY - 5);
      ctx.quadraticCurveTo(startX - 15, lastY, startX - 5, lastY + 5);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 应用缩放和平移
    ctx.save();
    ctx.translate(state.pan.x, state.pan.y);
    ctx.scale(state.zoom, state.zoom);

    // 绘制网格
    drawGrid(ctx);

    // 绘制所有元素
    state.elements.forEach((element) => {
      if ('visible' in element && !element.visible) return;

      // 根据元素特有的属性判断类型，顺序很重要
      if ('chartType' in element) {
        drawChart(ctx, element as ChartShape);
      } else if ('diagramType' in element) {
        drawSegmentDiagram(ctx, element as SegmentDiagramShape);
      } else if ('lineType' in element) {
        drawNumberLine(ctx, element as NumberLineShape);
      } else if ('gridSize' in element && 'cells' in element) {
        drawCompositeShape(ctx, element as CompositeShape);
      } else if ('position' in element && 'depth' in element) {
        drawSolidShape(ctx, element as SolidShape);
      } else if ('points' in element) {
        drawPlaneShape(ctx, element as PlaneShape);
      }
    });

    ctx.restore();

    // 绘制当前正在绘制的图形预览
    if (isDrawing && startPoint && currentPoint) {
      ctx.save();
      ctx.translate(state.pan.x, state.pan.y);
      ctx.scale(state.zoom, state.zoom);
      ctx.strokeStyle = state.activeColor;
      ctx.lineWidth = state.activeStrokeWidth;
      ctx.setLineDash([5, 5]);

      const tool = state.activeTool;
      if (['line', 'segment', 'ray'].includes(tool)) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      } else if (['rectangle', 'square', 'parallelogram', 'trapezoid'].includes(tool)) {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const w = Math.abs(currentPoint.x - startPoint.x);
        const h = Math.abs(currentPoint.y - startPoint.y);
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.stroke();
      } else if (tool === 'triangle' || tool === 'rightTriangle') {
        const minX = Math.min(startPoint.x, currentPoint.x);
        const minY = Math.min(startPoint.y, currentPoint.y);
        const maxX = Math.max(startPoint.x, currentPoint.x);
        const maxY = Math.max(startPoint.y, currentPoint.y);
        const width = maxX - minX;
        const height = maxY - minY;
        ctx.beginPath();
        ctx.moveTo(minX + width / 2, minY);
        ctx.lineTo(minX, maxY);
        ctx.lineTo(maxX, maxY);
        ctx.closePath();
        ctx.stroke();
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'sector') {
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (tool === 'cube' || tool === 'cuboid' || tool === 'cylinder' || tool === 'cone' || tool === 'sphere') {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const w = Math.abs(currentPoint.x - startPoint.x);
        const h = Math.abs(currentPoint.y - startPoint.y);
        ctx.strokeRect(x, y, w, h);
      } else if (['numberLine', 'segmentDiagram', 'barChart', 'lineChart', 'pieChart', 'squareGrid', 'cubeGrid'].includes(tool)) {
        // 这些工具只需要点击位置
        ctx.fillStyle = `${state.activeColor}20`;
        ctx.fillRect(startPoint.x - 5, startPoint.y - 5, 10, 10);
        ctx.strokeRect(startPoint.x - 5, startPoint.y - 5, 10, 10);
      }
      ctx.restore();
    }
  }, [
    state,
    isDrawing,
    startPoint,
    currentPoint,
    drawGrid,
    drawPlaneShape,
    drawSolidShape,
    drawCompositeShape,
    drawNumberLine,
    drawChart,
    drawSegmentDiagram,
  ]);

  // 重绘画布
  useEffect(() => {
    draw();
  }, [draw]);

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getMousePos(e);
    setStartPoint(point);
    setCurrentPoint(point);
    setIsDrawing(true);

    if (state.activeTool === 'select') {
      // 检查是否点击了某个元素
      // TODO: 实现元素选择逻辑
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const point = getMousePos(e);
    setCurrentPoint(point);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) {
      setIsDrawing(false);
      return;
    }

    const endPoint = getMousePos(e);
    const tool = state.activeTool;

    // 创建新元素
    let newElement: CanvasElement | null = null;
    const id = `element-${Date.now()}`;

    if (['line', 'segment', 'ray'].includes(tool)) {
      newElement = {
        id,
        type: tool as 'line' | 'segment' | 'ray',
        points: [startPoint, endPoint],
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: 'transparent',
        fillMode: 'none',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (['rectangle', 'square', 'parallelogram', 'trapezoid'].includes(tool)) {
      newElement = {
        id,
        type: tool as 'rectangle' | 'square' | 'parallelogram' | 'trapezoid',
        points: [startPoint, endPoint],
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}20`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );
      newElement = {
        id,
        type: 'circle',
        points: [startPoint],
        radius,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}20`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'sector') {
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );
      newElement = {
        id,
        type: 'sector',
        points: [startPoint],
        radius,
        startAngle: 0,
        endAngle: Math.PI / 2,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'polygon') {
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );
      newElement = {
        id,
        type: 'polygon',
        points: [startPoint],
        radius,
        sides: 6,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}20`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'triangle') {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const maxX = Math.max(startPoint.x, endPoint.x);
      const maxY = Math.max(startPoint.y, endPoint.y);
      const width = maxX - minX;
      const height = maxY - minY;
      newElement = {
        id,
        type: 'triangle',
        points: [
          { x: minX + width / 2, y: minY },
          { x: minX, y: maxY },
          { x: maxX, y: maxY },
        ],
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}20`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'cube') {
      // 确保 position 在左上角
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const w = Math.abs(endPoint.x - startPoint.x);
      const h = Math.abs(endPoint.y - startPoint.y);
      newElement = {
        id,
        type: 'cube',
        position: { x: minX, y: minY },
        width: w,
        height: h,
        depth: w * 0.3,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
        showNet: false,
        showDimensions: true,
        showHiddenLines: true,
        rotation: { x: 0, y: 0, z: 0 },
      };
    } else if (tool === 'cuboid') {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const w = Math.abs(endPoint.x - startPoint.x);
      const h = Math.abs(endPoint.y - startPoint.y);
      newElement = {
        id,
        type: 'cuboid',
        position: { x: minX, y: minY },
        width: w,
        height: h,
        depth: w * 0.5,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
        showNet: false,
        showDimensions: true,
        showHiddenLines: true,
        rotation: { x: 0, y: 0, z: 0 },
      };
    } else if (tool === 'cylinder') {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const w = Math.abs(endPoint.x - startPoint.x);
      const h = Math.abs(endPoint.y - startPoint.y);
      newElement = {
        id,
        type: 'cylinder',
        position: { x: minX, y: minY },
        width: w,
        height: h,
        depth: w * 0.5,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
        showNet: false,
        showDimensions: true,
        showHiddenLines: true,
        rotation: { x: 0, y: 0, z: 0 },
      };
    } else if (tool === 'cone') {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const w = Math.abs(endPoint.x - startPoint.x);
      const h = Math.abs(endPoint.y - startPoint.y);
      newElement = {
        id,
        type: 'cone',
        position: { x: minX, y: minY },
        width: w,
        height: h,
        depth: w * 0.5,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
        showNet: false,
        showDimensions: true,
        showHiddenLines: true,
        rotation: { x: 0, y: 0, z: 0 },
      };
    } else if (tool === 'sphere') {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const w = Math.abs(endPoint.x - startPoint.x);
      const h = Math.abs(endPoint.y - startPoint.y);
      newElement = {
        id,
        type: 'sphere',
        position: { x: minX, y: minY },
        width: w,
        height: h,
        depth: w * 0.5,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
        showNet: false,
        showDimensions: true,
        showHiddenLines: true,
        rotation: { x: 0, y: 0, z: 0 },
      };
    } else if (tool === 'numberLine') {
      newElement = {
        id,
        type: 'numberLine',
        lineType: 'integer',
        start: 0,
        end: 10,
        step: 1,
        points: [startPoint],
        marks: Array.from({ length: 11 }, (_, i) => ({
          value: i,
          label: String(i),
          highlight: false,
        })),
        showLabels: true,
        showTicks: true,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: 'transparent',
        fillMode: 'none',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'barChart') {
      newElement = {
        id,
        type: 'chart',
        chartType: 'bar',
        title: '统计图',
        data: [
          { label: 'A', value: 10, color: '#3b82f6' },
          { label: 'B', value: 15, color: '#10b981' },
          { label: 'C', value: 8, color: '#f59e0b' },
          { label: 'D', value: 12, color: '#ef4444' },
        ],
        points: [startPoint],
        showValues: true,
        showLegend: true,
        showAxis: true,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: 'transparent',
        fillMode: 'none',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'segmentDiagram') {
      newElement = {
        id,
        type: 'segmentDiagram',
        diagramType: 'comparison',
        segments: [
          { label: '甲', length: 80, color: '#3b82f6', value: 80 },
          { label: '乙', length: 60, color: '#10b981', value: 60 },
        ],
        points: [startPoint],
        showLabels: true,
        showValues: true,
        showBraces: true,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: 'transparent',
        fillMode: 'none',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'lineChart') {
      newElement = {
        id,
        type: 'chart',
        chartType: 'line',
        title: '折线统计图',
        data: [
          { label: '一月', value: 10, color: '#3b82f6' },
          { label: '二月', value: 15, color: '#3b82f6' },
          { label: '三月', value: 8, color: '#3b82f6' },
          { label: '四月', value: 20, color: '#3b82f6' },
        ],
        points: [startPoint],
        showValues: true,
        showLegend: true,
        showAxis: true,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: 'transparent',
        fillMode: 'none',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'pieChart') {
      newElement = {
        id,
        type: 'chart',
        chartType: 'pie',
        title: '扇形统计图',
        data: [
          { label: 'A', value: 30, color: '#3b82f6' },
          { label: 'B', value: 25, color: '#10b981' },
          { label: 'C', value: 20, color: '#f59e0b' },
          { label: 'D', value: 25, color: '#ef4444' },
        ],
        points: [startPoint],
        showValues: true,
        showLegend: true,
        showAxis: false,
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: 'transparent',
        fillMode: 'none',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'squareGrid') {
      const size = 5;
      newElement = {
        id,
        type: 'squareGrid',
        gridSize: size,
        cellSize: 30,
        cells: Array(size).fill(null).map(() => Array(size).fill(true)),
        showGrid: true,
        showCount: true,
        points: [startPoint],
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    } else if (tool === 'cubeGrid') {
      const size = 3;
      newElement = {
        id,
        type: 'cubeGrid',
        gridSize: size,
        cellSize: 40,
        cells: Array(size).fill(null).map(() => Array(size).fill(true)),
        showGrid: true,
        showCount: true,
        points: [startPoint],
        strokeColor: state.activeColor,
        strokeWidth: state.activeStrokeWidth,
        strokeStyle: 'solid',
        fillColor: `${state.activeColor}30`,
        fillMode: 'solid',
        opacity: 1,
        locked: false,
        visible: true,
      };
    }

    if (newElement) {
      const newState = {
        ...state,
        elements: [...state.elements, newElement],
      };
      onChange?.(newState);
      onElementAdd?.(newElement);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // 缩放处理
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      onChange?.({
        ...state,
        zoom: Math.max(0.1, Math.min(5, state.zoom * delta)),
      });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="border border-border bg-white cursor-crosshair"
      style={{ touchAction: 'none' }}
    />
  );
}
