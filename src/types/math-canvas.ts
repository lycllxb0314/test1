/**
 * 数学画板类型定义
 * 
 * 从小学数学教学本质推导，支持四大领域的画图需求：
 * 
 * 一、图形与几何领域
 *    - 平面图形的认识、周长、面积计算
 *    - 立体图形的认识、表面积、体积计算
 *    - 图形的运动（平移、旋转、对称）
 *    - 位置与方向
 * 
 * 二、数与代数领域
 *    - 数轴（整数、分数、小数）
 *    - 线段图（解决问题 - 数量关系分析）
 *    - 示意图（问题情境表示）
 * 
 * 三、统计与概率领域
 *    - 条形统计图
 *    - 折线统计图
 *    - 扇形统计图
 * 
 * 四、解决问题工具
 *    - 线段图分析
 *    - 表格整理
 *    - 示意图
 * 
 * @module types/math-canvas
 */

// ==================== 基础类型 ====================

/** 点 */
export type Point = {
  x: number;
  y: number;
};

/** 颜色 */
export type Color = string;

/** 线条样式 */
export type LineStyle = 'solid' | 'dashed' | 'dotted';

/** 填充模式 */
export type FillMode = 'none' | 'solid' | 'hatch' | 'stripe';

// ==================== 图形类型枚举 ====================

/** 平面图形类型 */
export type PlaneShapeType = 
  | 'point'           // 点
  | 'line'            // 直线
  | 'ray'             // 射线
  | 'segment'         // 线段
  | 'angle'           // 角
  | 'triangle'        // 三角形
  | 'rightTriangle'   // 直角三角形
  | 'isoscelesTriangle' // 等腰三角形
  | 'equilateralTriangle' // 等边三角形
  | 'quadrilateral'   // 四边形
  | 'rectangle'       // 长方形
  | 'square'          // 正方形
  | 'parallelogram'   // 平行四边形
  | 'trapezoid'       // 梯形
  | 'rhombus'         // 菱形
  | 'polygon'         // 多边形
  | 'circle'          // 圆
  | 'sector'          // 扇形
  | 'annulus'         // 圆环
  | 'arc';            // 弧

/** 立体图形类型 */
export type SolidShapeType =
  | 'cube'            // 正方体
  | 'cuboid'          // 长方体
  | 'cylinder'        // 圆柱
  | 'cone'            // 圆锥
  | 'sphere'          // 球
  | 'prism'           // 棱柱
  | 'pyramid';        // 棱锥

/** 组合图形类型 */
export type CompositeShapeType =
  | 'squareGrid'      // 正方形网格（小正方形拼大正方形）
  | 'cubeGrid'        // 正方体网格（小正方体组合）
  | 'custom';         // 自定义组合

/** 数轴类型 */
export type NumberLineType =
  | 'integer'         // 整数轴
  | 'fraction'        // 分数轴
  | 'decimal';        // 小数轴

/** 统计图类型 */
export type ChartType =
  | 'bar'             // 条形统计图
  | 'line'            // 折线统计图
  | 'pie';            // 扇形统计图

/** 线段图类型 */
export type SegmentDiagramType =
  | 'comparison'      // 比较关系
  | 'sum'             // 和差关系
  | 'multiple'        // 倍数关系
  | 'fraction'        // 分数关系
  | 'ratio';          // 比例关系

// ==================== 图形元素定义 ====================

/** 基础图形属性 */
export type BaseShapeProps = {
  id: string;
  type: string;
  strokeColor: Color;
  strokeWidth: number;
  strokeStyle: LineStyle;
  fillColor: Color;
  fillMode: FillMode;
  opacity: number;
  locked: boolean;
  visible: boolean;
};

/** 平面图形 */
export type PlaneShape = BaseShapeProps & {
  type: PlaneShapeType;
  points: Point[];
  radius?: number;          // 圆半径
  startAngle?: number;      // 起始角（扇形、弧）
  endAngle?: number;        // 终止角
  sides?: number;           // 边数（多边形）
  // 变换属性
  rotation?: number;        // 旋转角度（度）
  flipX?: boolean;          // 水平翻转
  flipY?: boolean;          // 垂直翻转
};

/** 立体图形 */
export type SolidShape = BaseShapeProps & {
  type: SolidShapeType;
  position: Point;
  width: number;
  height: number;
  depth: number;
  showNet: boolean;         // 显示展开图
  showDimensions: boolean;  // 显示尺寸标注
  showHiddenLines: boolean; // 显示隐藏线
  showSideNet?: boolean;    // 显示侧面展开图（圆柱、圆锥）
  rotation: {
    x: number;
    y: number;
    z: number;
  };
};

/** 3D 积木块位置 */
export type CubePosition = {
  x: number;  // 列位置
  y: number;  // 行位置（2D视图中的垂直方向）
  z: number;  // 层数（高度）
};

/** 组合图形 */
export type CompositeShape = BaseShapeProps & {
  type: CompositeShapeType;
  points: Point[];          // 绘制的区域（起点和终点）
  rows: number;             // 行数（用于正方形网格）
  cols: number;             // 列数（用于正方形网格）
  // 以下为兼容旧数据保留
  gridSize?: number;        // 网格大小（旧版兼容）
  cellSize?: number;        // 单元格大小（旧版兼容）
  cells?: boolean[][];      // 激活的单元格（旧版兼容）
  showGrid?: boolean;       // 是否显示网格线
  showCount?: boolean;      // 显示计数（旧版兼容）
  cubes?: CubePosition[];   // 积木块位置列表（旧版兼容）
  cubeSize?: number;        // 小正方体大小（旧版兼容）
};

/** 数轴 */
export type NumberLineShape = BaseShapeProps & {
  type: 'numberLine';
  points: Point[];          // 起始位置
  lineType: NumberLineType;
  start: number;
  end: number;
  step: number;
  marks: Array<{
    value: number;
    label: string;
    highlight: boolean;
  }>;
  showLabels: boolean;
  showTicks: boolean;
};

/** 线段图 */
export type SegmentDiagramShape = BaseShapeProps & {
  type: 'segmentDiagram';
  points: Point[];          // 起始位置
  diagramType: SegmentDiagramType;
  segments: Array<{
    label: string;
    length: number;
    color: Color;
    value?: number;
  }>;
  showLabels: boolean;
  showValues: boolean;
  showBraces: boolean;
};

/** 统计图 */
export type ChartShape = BaseShapeProps & {
  type: 'chart';
  points: Point[];          // 起始位置
  chartType: ChartType;
  title: string;
  data: Array<{
    label: string;
    value: number;
    color: Color;
  }>;
  showValues: boolean;
  showLegend: boolean;
  showAxis: boolean;
};

/** 网格背景 */
export type GridBackground = {
  enabled: boolean;
  type: 'square' | 'dot' | 'isometric';
  size: number;
  color: Color;
  showAxis: boolean;
  axisColor: Color;
};

/** 文字标注 */
export type TextAnnotation = {
  id: string;
  type: 'text';
  content: string;
  position: Point;
  fontSize: number;
  fontColor: Color;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
};

/** 尺寸标注 */
export type DimensionAnnotation = {
  id: string;
  type: 'dimension';
  startPoint: Point;
  endPoint: Point;
  label: string;
  offset: number;
  showArrow: boolean;
};

// ==================== 画布状态 ====================

/** 所有图形元素的联合类型 */
export type CanvasElement = 
  | PlaneShape 
  | SolidShape 
  | CompositeShape 
  | NumberLineShape 
  | SegmentDiagramShape 
  | ChartShape 
  | TextAnnotation 
  | DimensionAnnotation;

/** 画布状态 */
export type CanvasState = {
  elements: CanvasElement[];
  grid: GridBackground;
  zoom: number;
  pan: Point;
  selection: string[];
  activeTool: ToolType;
  activeColor: Color;
  activeStrokeWidth: number;
};

/** 工具类型 */
export type ToolType =
  // 选择工具
  | 'select'
  | 'pan'
  // 基础绘图
  | 'pen'
  | 'eraser'
  | 'text'
  // 平面图形
  | 'line'
  | 'segment'
  | 'ray'
  | 'angle'
  | 'triangle'
  | 'rightTriangle'
  | 'rectangle'
  | 'square'
  | 'parallelogram'
  | 'trapezoid'
  | 'circle'
  | 'sector'
  | 'polygon'
  // 立体图形
  | 'cube'
  | 'cuboid'
  | 'cylinder'
  | 'cone'
  | 'sphere'
  // 组合图形
  | 'squareGrid'
  | 'cubeGrid'
  // 数轴
  | 'numberLine'
  // 线段图
  | 'segmentDiagram'
  // 统计图
  | 'barChart'
  | 'lineChart'
  | 'pieChart'
  // 标注
  | 'dimension';

/** 工具分组 */
export type ToolGroup = {
  name: string;
  icon: string;
  tools: ToolType[];
};

/** 工具配置 */
export const TOOL_GROUPS: ToolGroup[] = [
  {
    name: '选择',
    icon: 'mouse-pointer',
    tools: ['select', 'pan'],
  },
  {
    name: '基础',
    icon: 'pencil',
    tools: ['pen', 'eraser', 'text'],
  },
  {
    name: '平面图形',
    icon: 'square',
    tools: ['line', 'segment', 'angle', 'triangle', 'rightTriangle', 'rectangle', 'square', 'parallelogram', 'trapezoid', 'circle', 'sector', 'polygon'],
  },
  {
    name: '立体图形',
    icon: 'box',
    tools: ['cube', 'cuboid', 'cylinder', 'cone', 'sphere'],
  },
  {
    name: '组合图形',
    icon: 'grid-3x3',
    tools: ['squareGrid', 'cubeGrid'],
  },
  {
    name: '数轴',
    icon: 'move-horizontal',
    tools: ['numberLine'],
  },
  {
    name: '线段图',
    icon: 'git-branch',
    tools: ['segmentDiagram'],
  },
  {
    name: '统计图',
    icon: 'bar-chart-2',
    tools: ['barChart', 'lineChart', 'pieChart'],
  },
  {
    name: '标注',
    icon: 'ruler',
    tools: ['dimension'],
  },
];

// ==================== 预设模板 ====================

/** 预设模板 */
export type CanvasTemplate = {
  id: string;
  name: string;
  category: 'plane' | 'solid' | 'composite' | 'numberLine' | 'diagram' | 'chart' | 'grid';
  description: string;
  thumbnail: string;
  initialState: Partial<CanvasState>;
};

/** 常用预设模板 */
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  // 平面图形模板
  {
    id: 'square-area',
    name: '正方形面积',
    category: 'plane',
    description: '用于讲解正方形面积计算',
    thumbnail: '/templates/square-area.png',
    initialState: {
      grid: { enabled: true, type: 'square', size: 20, color: '#e0e0e0', showAxis: false, axisColor: '#333' },
    },
  },
  {
    id: 'circle-area',
    name: '圆的面积',
    category: 'plane',
    description: '用于讲解圆面积公式推导',
    thumbnail: '/templates/circle-area.png',
    initialState: {
      grid: { enabled: true, type: 'square', size: 20, color: '#e0e0e0', showAxis: true, axisColor: '#333' },
    },
  },
  // 立体图形模板
  {
    id: 'cube-surface',
    name: '正方体展开图',
    category: 'solid',
    description: '展示正方体的展开过程，用于表面积教学',
    thumbnail: '/templates/cube-net.png',
    initialState: {},
  },
  {
    id: 'cube-volume',
    name: '正方体体积',
    category: 'solid',
    description: '用小正方体拼成大正方体，理解体积概念',
    thumbnail: '/templates/cube-volume.png',
    initialState: {},
  },
  // 组合图形模板
  {
    id: 'composite-area',
    name: '组合图形面积',
    category: 'composite',
    description: '用小正方形拼成不规则图形，计算面积',
    thumbnail: '/templates/composite-area.png',
    initialState: {
      grid: { enabled: true, type: 'square', size: 30, color: '#e0e0e0', showAxis: false, axisColor: '#333' },
    },
  },
  // 数轴模板
  {
    id: 'number-line-int',
    name: '整数数轴',
    category: 'numberLine',
    description: '用于整数的认识、加减法',
    thumbnail: '/templates/number-line.png',
    initialState: {},
  },
  {
    id: 'number-line-fraction',
    name: '分数数轴',
    category: 'numberLine',
    description: '用于分数的认识、比较大小',
    thumbnail: '/templates/fraction-line.png',
    initialState: {},
  },
  // 线段图模板
  {
    id: 'segment-sum',
    name: '和差问题线段图',
    category: 'diagram',
    description: '解决和差问题的线段图',
    thumbnail: '/templates/segment-sum.png',
    initialState: {},
  },
  {
    id: 'segment-multiple',
    name: '倍数问题线段图',
    category: 'diagram',
    description: '解决倍数问题的线段图',
    thumbnail: '/templates/segment-multiple.png',
    initialState: {},
  },
  // 统计图模板
  {
    id: 'bar-chart',
    name: '条形统计图',
    category: 'chart',
    description: '常用的条形统计图模板',
    thumbnail: '/templates/bar-chart.png',
    initialState: {},
  },
];

// ==================== 导出配置 ====================

/** 导出格式 */
export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';

/** 导出选项 */
export type ExportOptions = {
  format: ExportFormat;
  quality: number;
  includeGrid: boolean;
  backgroundColor: Color;
  padding: number;
};
