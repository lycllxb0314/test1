# 数据接口与钩子统一性整改方案

**文档版本**: v1.0  
**编制日期**: 2024年4月  
**编制目的**: 提供数据接口和钩子的统一性整改方案，确保代码架构的一致性和可维护性

---

## 目录

1. [问题分析](#1-问题分析)
2. [现有架构评估](#2-现有架构评估)
3. [整改方案](#3-整改方案)
4. [实施计划](#4-实施计划)
5. [验收标准](#5-验收标准)

---

## 1. 问题分析

### 1.1 核心问题识别

经过深度代码检查，发现以下主要问题：

#### 问题1：Hooks使用模式不一致

| 问题类型 | 现状描述 | 影响范围 |
|----------|----------|----------|
| **新旧模式混用** | 部分模块使用新的 `useQuery/useMutation`（useApi.ts），部分仍使用旧的 `useState + fetch` 模式 | useHabitData.ts |
| **弃用代码未清理** | `useDataFetch.ts` 已标记 @deprecated 但仍在使用 | 多个页面组件 |
| **API调用方式不统一** | 有的使用 `apiClient`，有的直接使用 `fetch` | 多个hooks文件 |

#### 问题2：类型定义分散

| 问题类型 | 现状描述 | 文件位置 |
|----------|----------|----------|
| **重复定义** | 同一类型在多个文件中重复定义（如 HabitCategory） | useHabitData.ts, types/index.ts |
| **命名不统一** | 同一概念使用不同命名（如 Pagination vs PaginatedData） | api-client.ts, useStudentData.ts |
| **类型导出不完整** | 部分类型仅在hooks文件中定义，未统一导出 | useHabitData.ts, useMoralData.ts |

#### 问题3：数据接口路径规范问题

| 问题类型 | 现状描述 | 示例 |
|----------|----------|------|
| **路径命名不统一** | 部分使用单数，部分使用复数 | `/api/grade` vs `/api/grades` |
| **接口结构不一致** | 响应格式存在差异 | 部分返回 `{success, data}`，部分返回 `{data, error}` |
| **缺少统一错误处理** | 错误处理逻辑分散在各处 | 各API路由独立处理 |

### 1.2 具体代码问题示例

#### 示例1：Hooks模式混用

```typescript
// ❌ 问题：useHabitData.ts 使用旧的 useState + fetch 模式
export function useSchoolHabitStats(month?: string) {
  const [data, setData] = useState<SchoolHabitStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // ...fetch 逻辑
  }, [month]);
  // ...
}

// ✅ 正确：useMoralData.ts 使用统一的 useQuery
export function useMoralEvaluations(filters?: {...}) {
  return useQuery<MoralEvaluation[]>(
    () => apiClient.get('/moral/evaluations', params),
    { deps: [params] }
  );
}
```

#### 示例2：类型重复定义

```typescript
// ❌ types/index.ts 中定义
export type HabitCategory = 'civilization' | 'writing' | ...;

// ❌ useHabitData.ts 中重复定义
export type HabitCategory = 
  | 'civilization' | 'writing' | 'reading' | 'sports' 
  | 'safety' | 'hygiene' | 'aesthetic' | 'labor';
```

#### 示例3：API客户端未统一使用

```typescript
// ❌ 问题：直接使用 fetch
const response = await fetch(`/api/habit/stats/school?${params.toString()}`);

// ✅ 正确：使用统一的 apiClient
const result = await apiClient.get('/habit/stats/school', { month });
```

---

## 2. 现有架构评估

### 2.1 当前Hooks架构

```
src/hooks/
├── useApi.ts              # ✅ 统一基础Hook库（推荐模式）
├── useDataFetch.ts        # ❌ 已弃用，待清理
├── useAuth.ts             # ✅ 认证Hook
├── useStudentData.ts      # ⚠️ 部分使用新模式
├── useTeacherData.ts      # ⚠️ 部分使用新模式
├── useHabitData.ts        # ❌ 未使用统一模式
├── useMoralData.ts        # ✅ 使用统一模式
├── useAcademicData.ts     # 待检查
├── useGeneralAffairsData.ts # 待检查
└── ...其他hooks
```

### 2.2 当前API架构

```
src/services/
└── api-client.ts          # ✅ 统一API客户端
    ├── apiClient          # 基础请求方法
    ├── authApi            # 认证API
    ├── teacherApi         # 教师API
    ├── studentApi         # 学生API
    ├── classApi           # 班级API
    ├── habitApi           # 习惯养成API（不完整）
    └── workflowApi        # 工作流API
```

### 2.3 API路由结构

```
src/app/api/
├── auth/                  # 认证相关
│   ├── login/route.ts
│   ├── current/route.ts
│   └── logout/route.ts
├── students/              # 学生管理
├── teachers/              # 教师管理
├── habit/                 # 习惯养成
│   ├── goals/route.ts
│   ├── assessments/route.ts
│   ├── stars/route.ts
│   └── stats/school/route.ts
├── moral/                 # 德育管理
│   ├── activities/route.ts
│   ├── alerts/route.ts
│   └── ...
└── ...其他模块
```

### 2.4 类型定义结构

```
src/types/
└── index.ts               # ✅ 统一类型定义文件
    ├── UserRole & 权限类型
    ├── User & TeacherProfile
    ├── HabitCategory（重复定义问题）
    └── ...其他类型
```

---

## 3. 整改方案

### 3.1 Hooks统一性整改

#### 3.1.1 整改原则

1. **统一基础库**: 所有领域Hooks必须基于 `useApi.ts` 实现
2. **统一模式**: 使用 `useQuery`、`usePaginatedQuery`、`useMutation` 统一模式
3. **类型安全**: 所有Hooks必须有完整的TypeScript类型定义
4. **API客户端优先**: 所有API调用必须通过 `apiClient` 进行

#### 3.1.2 useHabitData.ts 重构方案

**重构前**:
```typescript
export function useSchoolHabitStats(month?: string) {
  const [data, setData] = useState<SchoolHabitStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      const response = await fetch(`/api/habit/stats/school?${params.toString()}`);
      // ...
    } catch (err) {
      // ...
    }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

**重构后**:
```typescript
import { useQuery, type UseQueryResult } from './useApi';
import { apiClient } from '@/services/api-client';
import type { SchoolHabitStatsResponse } from '@/types';

/**
 * 获取全校习惯统计
 * 
 * @param month - 月份，如 "2024-03"
 * @returns 查询结果，包含 overview、categoryStats、gradeStats
 * 
 * @example
 * ```tsx
 * function SchoolStatsPage() {
 *   const { data, loading, error, refetch } = useSchoolHabitStats('2024-03');
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   
 *   return <StatsOverview data={data} />;
 * }
 * ```
 */
export function useSchoolHabitStats(month?: string): UseQueryResult<SchoolHabitStatsResponse> {
  return useQuery(
    () => apiClient.get<SchoolHabitStatsResponse>('/habit/stats/school', { month }),
    { 
      deps: [month],
      cacheTime: 5 * 60 * 1000, // 缓存5分钟
    }
  );
}
```

#### 3.1.3 完整的 useHabitData.ts 重构规范

```typescript
/**
 * 习惯养成数据管理Hooks
 * 
 * @module hooks/useHabitData
 * @description 提供习惯养成模块的所有数据获取和操作能力
 * 
 * @see docs/SDD.md - 第5章 接口设计
 */

import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { apiClient, habitApi } from '@/services/api-client';
import type {
  HabitCategory,
  HabitGoal,
  HabitStar,
  HabitAssessment,
  SchoolHabitStatsResponse,
  ClassHabitStats,
  StudentHabitProfile,
  HabitGoalTemplate,
} from '@/types';

// ============================================
// 全校统计Hooks
// ============================================

/**
 * 获取全校习惯养成统计概览
 */
export function useSchoolHabitStats(month?: string) {
  return useQuery<SchoolHabitStatsResponse>(
    () => habitApi.getSchoolStats(month || getCurrentMonth()),
    { 
      deps: [month],
      cacheTime: 5 * 60 * 1000,
    }
  );
}

/**
 * 获取班级习惯统计
 */
export function useClassHabitStats(classId: string, month: string) {
  return useQuery<ClassHabitStats>(
    () => habitApi.getClassStats(classId, month),
    { 
      deps: [classId, month],
      enabled: !!classId,
    }
  );
}

// ============================================
// 目标管理Hooks
// ============================================

/**
 * 获取习惯目标列表（分页）
 */
export function useHabitGoals(filters?: {
  category?: HabitCategory;
  status?: 'active' | 'completed' | 'expired';
  grade?: number;
}) {
  const params: QueryParams = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.status) params.status = filters.status;
  if (filters?.grade) params.grade = filters.grade;

  return usePaginatedQuery<HabitGoal>(
    (p) => habitApi.getGoals({ ...params, ...p }),
    params
  );
}

/**
 * 创建习惯目标
 */
export function useCreateHabitGoal() {
  return useMutation<HabitGoal, Partial<HabitGoal>>(
    (data) => habitApi.createGoal(data)
  );
}

/**
 * 更新习惯目标
 */
export function useUpdateHabitGoal() {
  return useMutation<HabitGoal, { id: string; data: Partial<HabitGoal> }>(
    ({ id, data }) => habitApi.updateGoal(id, data)
  );
}

// ============================================
// 评价记录Hooks
// ============================================

/**
 * 获取学生习惯评价记录
 */
export function useHabitAssessments(filters?: {
  studentId?: string;
  classId?: string;
  category?: HabitCategory;
  startDate?: string;
  endDate?: string;
}) {
  return usePaginatedQuery<HabitAssessment>(
    (p) => habitApi.getAssessments({ ...filters, ...p }),
    filters as QueryParams
  );
}

/**
 * 创建习惯评价
 */
export function useCreateHabitAssessment() {
  return useMutation<HabitAssessment, Partial<HabitAssessment>>(
    (data) => habitApi.createAssessment(data)
  );
}

// ============================================
// 习惯之星Hooks
// ============================================

/**
 * 获取习惯之星列表
 */
export function useHabitStars(month?: string) {
  return useQuery<HabitStar[]>(
    () => habitApi.getStars(month || getCurrentMonth()),
    { deps: [month] }
  );
}

// ============================================
// 学生习惯档案Hooks
// ============================================

/**
 * 获取学生习惯档案
 */
export function useStudentHabitProfile(studentId: string | null) {
  return useQuery<StudentHabitProfile>(
    () => studentApi.getHabitProfile(studentId!),
    { enabled: !!studentId }
  );
}

// ============================================
// 工具函数
// ============================================

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
```

### 3.2 类型定义统一整改

#### 3.2.1 类型迁移规范

将所有分散的类型定义统一迁移到 `src/types/index.ts`：

```typescript
// src/types/index.ts

// ============================================
// 习惯养成模块类型
// ============================================

/** 习惯类别 */
export type HabitCategory = 
  | 'civilization'  // 文明
  | 'writing'       // 书写
  | 'reading'       // 阅读
  | 'sports'        // 运动
  | 'safety'        // 安全
  | 'hygiene'       // 卫生
  | 'aesthetic'     // 审美
  | 'labor';        // 劳动

/** 习惯类别名称映射 */
export const habitCategoryNames: Record<HabitCategory, string> = {
  civilization: '文明',
  writing: '书写',
  reading: '阅读',
  sports: '运动',
  safety: '安全',
  hygiene: '卫生',
  aesthetic: '审美',
  labor: '劳动',
};

/** 习惯类别图标映射（用于前端） */
export const habitCategoryIcons: Record<HabitCategory, string> = {
  civilization: 'Heart',
  writing: 'Pen',
  reading: 'BookOpen',
  sports: 'Trophy',
  safety: 'Shield',
  hygiene: 'Sparkles',
  aesthetic: 'Palette',
  labor: 'Hammer',
};

/** 全校习惯统计概览 */
export interface SchoolHabitStatsResponse {
  overview: SchoolHabitOverview;
  categoryStats: HabitCategoryStat[];
  gradeStats: GradeHabitStat[];
  month: string;
}

/** 全校统计概览 */
export interface SchoolHabitOverview {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  averageRate: number;
  rateChange: number;
  habitStars: number;
  starsChange: number;
  attentionStudents: number;
  attentionChange: number;
  monthlyEvaluations: number;
  goalsCompletion: number;
}

/** 习惯类别统计 */
export interface HabitCategoryStat {
  category: HabitCategory;
  rate: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  evaluationCount?: number;
  topGrade?: string;
  weakGrade?: string;
}

/** 年级习惯统计 */
export interface GradeHabitStat {
  grade: string;
  gradeNumber: number;
  students: number;
  classes: number;
  avgRate: number;
  trend: 'up' | 'down' | 'stable';
  stars: number;
  attention: number;
  topHabit?: string;
  weakHabit?: string;
}

/** 习惯养成目标 */
export interface HabitGoal {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  targetGrades: number[];
  targetClasses: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'expired';
  progress: number;
  studentCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt?: string;
  publisherId?: string;
  publisherName?: string;
}

/** 习惯之星 */
export interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  month: string;
  categories: HabitCategory[];
  totalScore: number;
  avatar?: string;
  achievements?: string;
}

/** 学生习惯评价记录 */
export interface HabitAssessment {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  className: string;
  category: HabitCategory;
  score: number;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: 'teacher' | 'classmate' | 'parent' | 'self';
  context?: string;
  occurredAt: string;
  createdAt: string;
  notes?: string;
}

/** 学生习惯档案 */
export interface StudentHabitProfile {
  studentId: string;
  studentName: string;
  studentNumber: string;
  grade: number;
  className: string;
  totalScore: number;
  categories: {
    category: HabitCategory;
    score: number;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  recentAssessments: HabitAssessment[];
  goals: {
    id: string;
    title: string;
    progress: number;
    status: string;
  }[];
  stars: {
    month: string;
    categories: HabitCategory[];
  }[];
}
```

### 3.3 API客户端完善

#### 3.3.1 完善 habitApi 模块

```typescript
// src/services/api-client.ts (补充完整)

/**
 * 习惯养成API
 */
export const habitApi = {
  /** 获取全校统计 */
  getSchoolStats: (month: string) =>
    apiClient.get<SchoolHabitStatsResponse>('/habit/stats/school', { month }),

  /** 获取班级统计 */
  getClassStats: (classId: string, month: string) =>
    apiClient.get<ClassHabitStats>(`/habit/stats/class/${classId}`, { month }),

  /** 获取目标列表 */
  getGoals: (params?: QueryParams) =>
    apiClient.get<HabitGoal[]>('/habit/goals', params),

  /** 获取目标详情 */
  getGoal: (id: string) =>
    apiClient.get<HabitGoal>(`/habit/goals/${id}`),

  /** 创建目标 */
  createGoal: (data: Partial<HabitGoal>) =>
    apiClient.post<HabitGoal>('/habit/goals', data),

  /** 更新目标 */
  updateGoal: (id: string, data: Partial<HabitGoal>) =>
    apiClient.put<HabitGoal>(`/habit/goals/${id}`, data),

  /** 删除目标 */
  deleteGoal: (id: string) =>
    apiClient.delete(`/habit/goals/${id}`),

  /** 获取评价记录 */
  getAssessments: (params?: QueryParams) =>
    apiClient.get<HabitAssessment[]>('/habit/assessments', params),

  /** 创建评价 */
  createAssessment: (data: Partial<HabitAssessment>) =>
    apiClient.post<HabitAssessment>('/habit/assessments', data),

  /** 批量创建评价 */
  batchCreateAssessments: (data: Partial<HabitAssessment>[]) =>
    apiClient.post<HabitAssessment[]>('/habit/assessments/batch', data),

  /** 获取习惯之星 */
  getStars: (month: string) =>
    apiClient.get<HabitStar[]>('/habit/stars', { month }),

  /** 获取目标模板列表 */
  getTemplates: (params?: QueryParams) =>
    apiClient.get<HabitGoalTemplate[]>('/habit/templates', params),

  /** 创建目标模板 */
  createTemplate: (data: Partial<HabitGoalTemplate>) =>
    apiClient.post<HabitGoalTemplate>('/habit/templates', data),
} as const;
```

### 3.4 弃用代码清理

#### 3.4.1 清理计划

| 文件 | 处理方式 | 优先级 |
|------|----------|--------|
| `useDataFetch.ts` | 删除文件，迁移使用到 useApi.ts | 高 |
| `useHabitData.ts` 中重复的类型 | 删除，改为从 `@/types` 导入 | 高 |
| `useMoralData.ts` 中重复的类型 | 删除，改为从 `@/types` 导入 | 中 |
| 各组件中的直接 fetch 调用 | 重构为使用 hooks 或 apiClient | 中 |

#### 3.4.2 迁移指南

```typescript
// ❌ 旧代码
import { useDataFetch } from '@/hooks/useDataFetch';
const { data, loading, error } = useDataFetch<Teacher>('/api/teachers');

// ✅ 新代码
import { useQuery } from '@/hooks/useApi';
import { teacherApi } from '@/services/api-client';
const { data, loading, error } = useQuery(() => teacherApi.list());

// ❌ 旧代码
import { useSingleDataFetch } from '@/hooks/useDataFetch';
const { data } = useSingleDataFetch<Student>('/api/students', studentId);

// ✅ 新代码
import { useQuery } from '@/hooks/useApi';
import { studentApi } from '@/services/api-client';
const { data } = useQuery(
  () => studentApi.get(studentId!),
  { enabled: !!studentId }
);
```

---

## 4. 实施计划

### 4.1 阶段划分

```
阶段一：类型定义统一（预计影响文件数：5）
├── 1.1 将习惯养成相关类型迁移到 types/index.ts
├── 1.2 删除 hooks 文件中的重复类型定义
├── 1.3 更新所有导入路径
└── 验收：TypeScript 编译无错误

阶段二：Hooks重构（预计影响文件数：8）
├── 2.1 重构 useHabitData.ts（约15个函数）
├── 2.2 检查并重构 useAcademicData.ts
├── 2.3 检查并重构 useGeneralAffairsData.ts
├── 2.4 删除 useDataFetch.ts（标记为废弃）
└── 验收：所有hooks基于useApi.ts实现

阶段三：API客户端完善（预计影响文件数：3）
├── 3.1 完善 habitApi 模块
├── 3.2 添加缺失的 API 方法
└── 验收：所有API通过统一客户端调用

阶段四：页面组件更新（预计影响文件数：20+）
├── 4.1 更新习惯养成相关页面
├── 4.2 更新德育管理相关页面
├── 4.3 移除直接的 fetch 调用
└── 验收：所有数据获取通过hooks或apiClient

阶段五：文档更新（预计影响文件数：2）
├── 5.1 更新SDD文档，补充钩子说明
└── 验收：文档与代码一致
```

### 4.2 文件变更清单

#### 阶段一：类型定义统一

| 操作 | 文件路径 | 变更说明 |
|------|----------|----------|
| EDIT | `src/types/index.ts` | 添加习惯养成完整类型定义 |
| EDIT | `src/hooks/useHabitData.ts` | 删除重复类型，从types导入 |
| EDIT | `src/hooks/useMoralData.ts` | 删除重复类型，从types导入 |

#### 阶段二：Hooks重构

| 操作 | 文件路径 | 变更说明 |
|------|----------|----------|
| REFACTOR | `src/hooks/useHabitData.ts` | 基于useApi.ts重构所有函数 |
| CHECK | `src/hooks/useAcademicData.ts` | 检查并修复不一致 |
| CHECK | `src/hooks/useGeneralAffairsData.ts` | 检查并修复不一致 |
| DEPRECATE | `src/hooks/useDataFetch.ts` | 添加弃用警告，计划删除 |

#### 阶段三：API客户端完善

| 操作 | 文件路径 | 变更说明 |
|------|----------|----------|
| EDIT | `src/services/api-client.ts` | 完善habitApi模块 |
| EDIT | `src/services/api-client.ts` | 添加缺失的API方法 |

#### 阶段四：页面组件更新

| 操作 | 文件路径 | 变更说明 |
|------|----------|----------|
| EDIT | `src/app/moral/habit/overview/page.tsx` | 使用新的hooks |
| EDIT | `src/app/moral/habit/goals/page.tsx` | 使用新的hooks |
| EDIT | `src/app/moral/habit/stars/page.tsx` | 使用新的hooks |
| EDIT | `src/app/moral/habit/settings/page.tsx` | 使用新的hooks |
| EDIT | `src/app/teacher/habit/page.tsx` | 使用新的hooks |
| EDIT | `src/app/parent/habit/page.tsx` | 使用新的hooks |

### 4.3 风险控制

| 风险 | 影响程度 | 应对措施 |
|------|----------|----------|
| 重构导致功能回归 | 高 | 每个阶段完成后进行完整测试 |
| 类型变更导致编译错误 | 中 | 使用IDE的Refactor功能，确保所有引用更新 |
| API调用方式变更影响页面 | 中 | 保持API响应格式不变，仅改变调用方式 |
| 弃用代码仍有依赖 | 低 | 全局搜索确认无依赖后再删除 |

---

## 5. 验收标准

### 5.1 代码质量标准

| 检查项 | 验收标准 | 验收方式 |
|--------|----------|----------|
| TypeScript编译 | 无错误、无警告 | `npx tsc --noEmit` |
| Hooks统一性 | 所有领域hooks基于useApi.ts | 代码审查 |
| 类型完整性 | 无重复定义，无any类型 | 代码审查 |
| API调用统一 | 无直接的fetch调用 | 全局搜索 |

### 5.2 功能验收标准

| 功能模块 | 验收标准 | 测试方式 |
|----------|----------|----------|
| 全校总览 | 数据正确显示，刷新正常 | 功能测试 |
| 小目标管理 | CRUD操作正常 | 功能测试 |
| 习惯之星 | 列表显示正确 | 功能测试 |
| 习惯设置 | 配置保存正常 | 功能测试 |
| 教师端 | 打卡、审核流程正常 | 功能测试 |
| 家长端 | 打卡、签字流程正常 | 功能测试 |

### 5.3 文档验收标准

| 文档 | 验收标准 |
|------|----------|
| SDD.md | 包含完整的钩子说明章节 |
| 类型定义文档 | 所有类型有注释说明 |
| API文档 | 所有接口有完整描述 |

---

## 附录

### A. Hooks使用规范

```typescript
// 1. 查询类操作使用 useQuery
export function useXxxData(id: string) {
  return useQuery(
    () => apiClient.get('/xxx', { id }),
    { enabled: !!id }
  );
}

// 2. 分页查询使用 usePaginatedQuery
export function useXxxList(params: QueryParams) {
  return usePaginatedQuery(
    (p) => apiClient.get('/xxx', { ...params, ...p }),
    params
  );
}

// 3. 变更操作使用 useMutation
export function useCreateXxx() {
  return useMutation(
    (data) => apiClient.post('/xxx', data)
  );
}
```

### B. 类型定义规范

```typescript
// 1. 类型命名：模块前缀 + 实体名
// 如：HabitGoal, MoralEvaluation

// 2. 枚举使用 type 而非 enum
export type HabitCategory = 'a' | 'b' | 'c';

// 3. 常量映射与类型配合
export const habitCategoryNames: Record<HabitCategory, string> = {
  a: '名称A',
  b: '名称B',
};

// 4. 接口必须有注释
/** 学生习惯档案 */
export interface StudentHabitProfile {
  // ...
}
```

### C. API客户端使用规范

```typescript
// 1. 通过apiClient调用
const result = await apiClient.get('/endpoint', params);

// 2. 通过领域API调用（推荐）
const result = await habitApi.getGoals(params);

// 3. 处理响应
if (result.success) {
  // 使用 result.data
} else {
  // 处理 result.error
}
```

---

**文档结束**
