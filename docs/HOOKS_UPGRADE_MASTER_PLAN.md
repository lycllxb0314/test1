# Hooks 升级与整改总体方案

**文档版本**: v2.0  
**编制日期**: 2024年4月  
**适用范围**: 智慧校园系统全部数据层代码

---

## 目录

1. [现状分析与问题诊断](#1-现状分析与问题诊断)
2. [目标架构设计](#2-目标架构设计)
3. [阶段一：类型定义统一](#3-阶段一类型定义统一)
4. [阶段二：Hooks重构](#4-阶段二hooks重构)
5. [阶段三：API客户端完善](#5-阶段三api客户端完善)
6. [阶段四：页面组件更新](#6-阶段四页面组件更新)
7. [阶段五：文档最终核对](#7-阶段五文档最终核对)
8. [实施路线图](#8-实施路线图)

---

## 1. 现状分析与问题诊断

### 1.1 当前Hooks架构全景

```
src/hooks/
├── useApi.ts              # ✅ 核心基础库（推荐）
│   ├── useQuery           # 单次查询
│   ├── usePaginatedQuery  # 分页查询
│   ├── useMutation        # 数据变更
│   └── useCrud            # CRUD工厂（但混入了领域hooks）
│
├── useDataFetch.ts        # ❌ 已废弃，待删除
├── useData.ts             # ❌ 已废弃，待删除（仅重新导出useApi）
├── useCrudOperations.ts   # ❌ 已废弃，待删除
│
├── useAuth.ts             # ✅ 认证Hook（良好）
├── usePermissions.ts      # ✅ 权限Hook（良好）
│
├── useStudentData.ts      # ⚠️ 部分使用新模式，需优化
├── useTeacherData.ts      # ⚠️ 部分使用新模式，需优化
├── useHabitData.ts        # ❌ 使用旧的useState+fetch模式，重点重构
├── useMoralData.ts        # ✅ 使用新模式（良好）
├── useAcademicData.ts     # ⚠️ 类型定义过多，可精简
├── useGeneralAffairsData.ts # ⚠️ 类型定义过多，可精简
│
├── useAccessData.ts       # 待检查
├── useRoomData.ts         # 待检查
├── useBatchOperations.ts  # ✅ 批量操作（保留）
└── use-mobile.ts          # ✅ 移动端检测（保留）
```

### 1.2 核心问题诊断

| 问题编号 | 问题类型 | 问题描述 | 影响范围 | 优先级 |
|----------|----------|----------|----------|--------|
| P1 | 架构混乱 | useHabitData.ts 使用旧的 useState+fetch 模式，未遵循统一规范 | 习惯养成模块全部页面 | **高** |
| P2 | 类型重复 | HabitCategory 等类型在 hooks 文件和 types/index.ts 中重复定义 | 类型系统、IDE支持 | **高** |
| P3 | 废弃代码 | useDataFetch.ts、useData.ts、useCrudOperations.ts 已废弃但未删除 | 代码维护、新人理解 | **中** |
| P4 | 职责混淆 | useApi.ts 中混入了领域hooks（useTeachers, useStudents等） | 架构清晰度 | **中** |
| P5 | 类型膨胀 | useAcademicData.ts、useGeneralAffairsData.ts 中定义过多类型 | 可维护性 | **中** |
| P6 | 缺失API | habitApi 模块在 api-client.ts 中不完整 | 功能完整性 | **中** |
| P7 | 直接fetch | 部分页面组件直接使用 fetch 而非 hooks 或 apiClient | 统一性 | **低** |

### 1.3 可合并的Hooks

| 合并方案 | 涉及文件 | 理由 |
|----------|----------|------|
| 删除 useDataFetch.ts | useDataFetch.ts | 功能完全由 useApi.ts 覆盖 |
| 删除 useData.ts | useData.ts | 仅重新导出，无实际意义 |
| 删除 useCrudOperations.ts | useCrudOperations.ts | 功能由 useApi.ts 的 useCrud 覆盖 |
| 合并到 useApi.ts | useApi.ts 中的领域hooks | 将 useTeachers、useStudents 等移至对应领域文件 |

### 1.4 需要扩展的Hooks

| Hook名称 | 扩展内容 | 理由 |
|----------|----------|------|
| useHabitData.ts | 重构为统一模式，增加目标模板、批量评价等功能 | 习惯养成模块整改需要 |
| useStudentData.ts | 增加综合素质Tab数据获取能力 | 学生详情页重构需要 |
| useMoralData.ts | 增加德育活动、预警管理相关hooks | 德育系统5大模块需要 |

---

## 2. 目标架构设计

### 2.1 新架构设计原则

```
┌─────────────────────────────────────────────────────────────────────┐
│                           设计原则                                   │
├─────────────────────────────────────────────────────────────────────┤
│ 1. 单一职责：每个Hook文件专注于单一业务领域                          │
│ 2. 分层清晰：基础层 → 领域层 → 应用层                                │
│ 3. 类型统一：所有类型定义集中在 types/index.ts                       │
│ 4. API统一：所有API调用通过 api-client.ts                           │
│ 5. 命名规范：use + 业务领域 + 操作（如 useStudentList）              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 目标目录结构

```
src/
├── types/
│   └── index.ts              # ✅ 统一类型定义（所有领域类型）
│
├── services/
│   └── api-client.ts         # ✅ 统一API客户端（所有领域API）
│
├── hooks/
│   │
│   │  ┌─────────────────────────────────────────────────────────┐
│   │  │                 基础层 (Core Layer)                      │
│   │  │  提供通用的数据获取和操作能力，不涉及具体业务             │
│   │  └─────────────────────────────────────────────────────────┘
│   │
│   ├── useApi.ts             # 核心：useQuery, usePaginatedQuery, useMutation, useCrud
│   ├── useAuth.ts            # 认证：useAuth, useLogin, useLogout, useCurrentUser
│   ├── usePermissions.ts     # 权限：usePermissions, useHasPermission, useRoleCheck
│   ├── useBatchOperations.ts # 批量：useBatchDelete, useBatchUpdate
│   └── use-mobile.ts         # 工具：移动端检测
│
│   │  ┌─────────────────────────────────────────────────────────┐
│   │  │                 领域层 (Domain Layer)                    │
│   │  │  面向具体业务领域，基于基础层构建                         │
│   │  └─────────────────────────────────────────────────────────┘
│   │
│   ├── useStudentData.ts     # 学生：列表、详情、档案、习惯档案
│   ├── useTeacherData.ts     # 教师：列表、详情、档案、发展记录
│   ├── useClassData.ts       # 班级：列表、详情、学生、统计
│   ├── useHabitData.ts       # 习惯：统计、目标、评价、之星
│   ├── useMoralData.ts       # 德育：评价、奖惩、活动、预警
│   ├── useAcademicData.ts    # 教务：课表、考勤、请假、调课
│   ├── useGeneralData.ts     # 总务：资产、维修、采购、场地
│   ├── useAccessData.ts      # 门禁：设备、记录、访客
│   └── useRoomData.ts        # 场地：列表、预约、审批
│
│   │  ┌─────────────────────────────────────────────────────────┐
│   │  │                 应用层 (Application Layer)               │
│   │  │  组合多个领域hooks，提供页面级别的数据管理                │
│   │  └─────────────────────────────────────────────────────────┘
│   │
│   └── usePageData.ts        # 页面级数据组合（可选）
│
└── app/                      # 页面组件（使用hooks获取数据）
```

### 2.3 数据流向图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React 组件层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Page 组件   │  │ Feature组件 │  │  UI 组件    │                 │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                 │
│         │                │                                          │
│         │ useXxxData()   │ useXxxMutation()                         │
│         ▼                ▼                                          │
└─────────┼────────────────┼──────────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         领域层 Hooks                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │useStudent   │  │useHabit     │  │useMoral     │                 │
│  │   Data      │  │   Data      │  │   Data      │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                          │
│         │ useQuery()     │ useMutation()  │ usePaginatedQuery()     │
│         ▼                ▼                ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    基础层 Hooks (useApi.ts)                  │   │
│  │   useQuery | usePaginatedQuery | useMutation | useCrud      │   │
│  └─────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                                 │ apiClient.get/post/put/delete
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API 客户端层                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    api-client.ts                             │   │
│  │  studentApi | teacherApi | habitApi | moralApi | ...        │   │
│  └─────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                                 │ fetch('/api/xxx')
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Routes 层                                │
│  /api/students | /api/teachers | /api/habit | /api/moral | ...     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 阶段一：类型定义统一

### 3.1 目标

将所有分散在 hooks 文件中的类型定义统一迁移到 `src/types/index.ts`，实现：
- 单一类型来源
- 避免重复定义
- 便于跨模块引用
- 完善类型文档注释

### 3.2 类型迁移清单

| 源文件 | 需迁移类型 | 目标位置 |
|--------|------------|----------|
| useHabitData.ts | HabitCategory, HabitGoal, HabitStar, HabitAssessment, SchoolHabitStatsResponse 等 | types/index.ts |
| useMoralData.ts | MoralEvaluation, StudentReward, StudentPunishment, MoralActivity 等 | types/index.ts |
| useAcademicData.ts | Course, ScheduleItem, Exam, Grade, AttendanceRecord, LeaveRequest, ScheduleChange | types/index.ts |
| useGeneralAffairsData.ts | Asset, RepairRequest, WorkOrder, SupplyProcurement, Venue, VenueReservation | types/index.ts |
| useTeacherData.ts | TeacherListItem, TeacherFullProfile, TeacherRecord 等 | types/index.ts |

### 3.3 types/index.ts 扩展结构

```typescript
// src/types/index.ts

// ============================================
// 基础类型
// ============================================

export type UserRole = 'principal' | 'teacher' | ...;
export type Permission = 'view' | 'edit' | 'approve' | 'manage' | 'admin';
export type ModuleType = 'general' | 'academic' | 'moral' | 'teacher' | 'parent';

// ============================================
// 用户与权限
// ============================================

export interface User { ... }
export interface RoleConfig { ... }

// ============================================
// 教师模块
// ============================================

export interface Teacher { ... }
export interface TeacherProfile { ... }
export interface TeacherListItem { ... }
export interface TeacherFullProfile { ... }
export interface TeacherRecord { ... }
export interface TeacherHonor { ... }
export interface TeacherTraining { ... }
export interface TeacherAchievement { ... }

// ============================================
// 学生模块
// ============================================

export interface Student { ... }
export interface StudentListItem { ... }
export interface StudentFullProfile { ... }

// ============================================
// 班级模块
// ============================================

export interface ClassInfo { ... }
export interface ClassTeacher { ... }

// ============================================
// 习惯养成模块
// ============================================

/** 习惯类别 */
export type HabitCategory = 
  | 'civilization' | 'writing' | 'reading' | 'sports' 
  | 'safety' | 'hygiene' | 'aesthetic' | 'labor';

/** 习惯类别名称映射 */
export const habitCategoryNames: Record<HabitCategory, string> = { ... };

/** 习惯类别图标映射 */
export const habitCategoryIcons: Record<HabitCategory, string> = { ... };

/** 全校习惯统计概览 */
export interface SchoolHabitOverview { ... }

/** 习惯类别统计 */
export interface HabitCategoryStat { ... }

/** 年级习惯统计 */
export interface GradeHabitStat { ... }

/** 学校习惯统计响应 */
export interface SchoolHabitStatsResponse { ... }

/** 习惯养成目标 */
export interface HabitGoal { ... }

/** 习惯目标模板 */
export interface HabitGoalTemplate { ... }

/** 学生月度目标 */
export interface StudentMonthlyGoal { ... }

/** 习惯之星 */
export interface HabitStar { ... }

/** 学生习惯评价记录 */
export interface HabitAssessment { ... }

/** 学生习惯档案 */
export interface StudentHabitProfile { ... }

/** 班级习惯统计 */
export interface ClassHabitStats { ... }

// ============================================
// 德育模块
// ============================================

export type EvaluationType = 'excellent' | 'good' | 'qualified' | 'pending';
export type RewardLevel = 'school' | 'district' | 'city' | 'province' | 'national';
export type PunishmentType = 'warning' | 'demerit' | 'serious_demerit' | 'probation';
export type BehaviorType = 'positive' | 'negative';
export type ActivityStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

export interface MoralEvaluation { ... }
export interface StudentReward { ... }
export interface StudentPunishment { ... }
export interface MoralActivity { ... }
export interface StudentActivityParticipation { ... }
export interface StudentBehaviorRecord { ... }

// ============================================
// 教务模块
// ============================================

export type AttendanceType = 'attendance' | 'leave' | 'late' | 'early_leave' | 'absent';
export type LeaveType = 'sick' | 'personal' | 'official' | 'maternity' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Course { ... }
export interface ScheduleItem { ... }
export interface Exam { ... }
export interface Grade { ... }
export interface AttendanceRecord { ... }
export interface LeaveRequest { ... }
export interface ScheduleChange { ... }

// ============================================
// 总务模块
// ============================================

export type AssetCategory = 'equipment' | 'furniture' | 'vehicle' | 'book' | 'other';
export type AssetStatus = 'in_use' | 'idle' | 'maintenance' | 'scrap' | 'lost';
export type RepairStatus = 'pending' | 'approved' | 'repairing' | 'completed' | 'rejected';
export type ProcurementStatus = 'draft' | 'submitted' | 'approved' | 'purchasing' | 'completed';

export interface Asset { ... }
export interface RepairRequest { ... }
export interface WorkOrder { ... }
export interface SupplyProcurement { ... }
export interface Venue { ... }
export interface VenueReservation { ... }

// ============================================
// 通用类型
// ============================================

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: Pagination;
  source?: 'database' | 'mock';
}
```

### 3.4 实施步骤

```bash
# 步骤1：备份现有类型定义
cp src/types/index.ts src/types/index.ts.backup

# 步骤2：扩展 types/index.ts（手动添加所有类型）

# 步骤3：更新 hooks 文件的导入
# 将 import { HabitCategory } from './useHabitData'
# 改为 import { HabitCategory } from '@/types'

# 步骤4：删除 hooks 文件中的重复类型定义

# 步骤5：TypeScript 编译检查
npx tsc --noEmit
```

### 3.5 验收标准

| 检查项 | 验收标准 | 验证方式 |
|--------|----------|----------|
| 类型编译 | 无 TypeScript 错误 | `npx tsc --noEmit` |
| 类型唯一性 | 每个类型只定义一次 | 全局搜索验证 |
| 导入正确 | 所有文件从 @/types 导入类型 | IDE 跳转验证 |
| 注释完整 | 所有接口有 JSDoc 注释 | 代码审查 |

---

## 4. 阶段二：Hooks重构

### 4.1 重构目标

- 统一所有 hooks 基于 `useApi.ts` 实现
- 重构 `useHabitData.ts` 为重点
- 清理废弃的 hooks 文件
- 优化 hooks 导出结构

### 4.2 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **删除** | useDataFetch.ts | 功能由 useApi.ts 覆盖 |
| **删除** | useData.ts | 仅重新导出，无意义 |
| **删除** | useCrudOperations.ts | 功能由 useApi.ts 的 useCrud 覆盖 |
| **重构** | useHabitData.ts | 从 useState+fetch 改为 useQuery 模式 |
| **优化** | useStudentData.ts | 移除 useState+fetch，统一使用 useQuery |
| **优化** | useTeacherData.ts | 移除直接的 fetch 调用 |
| **精简** | useAcademicData.ts | 移除内联类型定义 |
| **精简** | useGeneralAffairsData.ts | 移除内联类型定义，重命名为 useGeneralData.ts |
| **拆分** | useApi.ts | 将领域 hooks 移至对应领域文件 |

### 4.3 useHabitData.ts 完整重构代码

```typescript
/**
 * 习惯养成数据管理 Hooks
 * 
 * @module hooks/useHabitData
 * @description 提供习惯养成模块的所有数据获取和操作能力
 * 
 * @example
 * ```tsx
 * // 全校统计
 * const { data: stats } = useSchoolHabitStats('2024-04');
 * 
 * // 目标列表
 * const { data: goals, create } = useHabitGoals({ status: 'active' });
 * 
 * // 创建评价
 * const { mutate: createAssessment } = useCreateHabitAssessment();
 * ```
 */

import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { habitApi } from '@/services/api-client';
import type {
  HabitCategory,
  HabitGoal,
  HabitGoalTemplate,
  HabitStar,
  HabitAssessment,
  SchoolHabitStatsResponse,
  ClassHabitStats,
  StudentHabitProfile,
  StudentMonthlyGoal,
} from '@/types';

// ============================================
// 工具函数
// ============================================

/**
 * 获取当前月份字符串
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================
// 全校统计 Hooks
// ============================================

/**
 * 获取全校习惯养成统计概览
 * 
 * @param month - 月份，格式 "YYYY-MM"，默认当前月份
 * @returns 全校统计数据，包含概览、类别统计、年级统计
 * 
 * @example
 * ```tsx
 * function SchoolOverviewPage() {
 *   const { data, loading, error, refetch } = useSchoolHabitStats('2024-04');
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   
 *   return (
 *     <div>
 *       <h1>全校习惯达成率: {data?.overview.averageRate}%</h1>
 *       <button onClick={refetch}>刷新</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSchoolHabitStats(month?: string) {
  return useQuery<SchoolHabitStatsResponse>(
    () => habitApi.getSchoolStats(month || getCurrentMonth()),
    { 
      deps: [month],
      cacheTime: 5 * 60 * 1000, // 缓存5分钟
    }
  );
}

/**
 * 获取班级习惯统计
 * 
 * @param classId - 班级ID
 * @param month - 月份
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
// 目标管理 Hooks
// ============================================

/**
 * 获取习惯目标列表（分页）
 * 
 * @param filters - 筛选条件
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
 * 获取单个习惯目标详情
 * 
 * @param goalId - 目标ID
 */
export function useHabitGoal(goalId: string | null) {
  return useQuery<HabitGoal>(
    () => habitApi.getGoal(goalId!),
    { enabled: !!goalId }
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

/**
 * 删除习惯目标
 */
export function useDeleteHabitGoal() {
  return useMutation<void, string>(
    (id) => habitApi.deleteGoal(id)
  );
}

// ============================================
// 目标模板 Hooks
// ============================================

/**
 * 获取目标模板列表
 */
export function useHabitGoalTemplates(filters?: {
  category?: HabitCategory;
  isPublic?: boolean;
}) {
  const params: QueryParams = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.isPublic !== undefined) params.isPublic = filters.isPublic;

  return usePaginatedQuery<HabitGoalTemplate>(
    (p) => habitApi.getTemplates({ ...params, ...p }),
    params
  );
}

/**
 * 创建目标模板
 */
export function useCreateHabitGoalTemplate() {
  return useMutation<HabitGoalTemplate, Partial<HabitGoalTemplate>>(
    (data) => habitApi.createTemplate(data)
  );
}

// ============================================
// 学生月度目标 Hooks
// ============================================

/**
 * 获取学生月度目标
 * 
 * @param studentId - 学生ID
 * @param month - 月份
 */
export function useStudentMonthlyGoals(studentId: string | null, month?: string) {
  return useQuery<StudentMonthlyGoal[]>(
    () => habitApi.getStudentMonthlyGoals(studentId!, month || getCurrentMonth()),
    { 
      enabled: !!studentId,
      deps: [studentId, month],
    }
  );
}

/**
 * 创建/更新学生月度目标
 */
export function useUpsertStudentMonthlyGoal() {
  return useMutation<StudentMonthlyGoal, Partial<StudentMonthlyGoal>>(
    (data) => habitApi.upsertStudentMonthlyGoal(data)
  );
}

// ============================================
// 评价记录 Hooks
// ============================================

/**
 * 获取习惯评价记录列表（分页）
 * 
 * @param filters - 筛选条件
 */
export function useHabitAssessments(filters?: {
  studentId?: string;
  classId?: string;
  category?: HabitCategory;
  startDate?: string;
  endDate?: string;
}) {
  const params: QueryParams = { ...filters };
  return usePaginatedQuery<HabitAssessment>(
    (p) => habitApi.getAssessments({ ...params, ...p }),
    params
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

/**
 * 批量创建习惯评价
 */
export function useBatchCreateHabitAssessments() {
  return useMutation<HabitAssessment[], Partial<HabitAssessment>[]>(
    (data) => habitApi.batchCreateAssessments(data)
  );
}

// ============================================
// 习惯之星 Hooks
// ============================================

/**
 * 获取习惯之星列表
 * 
 * @param month - 月份
 * @param filters - 筛选条件
 */
export function useHabitStars(month?: string, filters?: {
  grade?: number;
  classId?: string;
}) {
  const params: QueryParams = { 
    month: month || getCurrentMonth(),
    ...filters 
  };
  
  return useQuery<HabitStar[]>(
    () => habitApi.getStars(params),
    { deps: [month, filters] }
  );
}

/**
 * 评选习惯之星
 */
export function useSelectHabitStars() {
  return useMutation<HabitStar[], { month: string; studentIds: string[] }>(
    ({ month, studentIds }) => habitApi.selectStars(month, studentIds)
  );
}

// ============================================
// 学生习惯档案 Hooks
// ============================================

/**
 * 获取学生习惯档案
 * 
 * @param studentId - 学生ID
 */
export function useStudentHabitProfile(studentId: string | null) {
  return useQuery<StudentHabitProfile>(
    () => habitApi.getStudentProfile(studentId!),
    { enabled: !!studentId }
  );
}

// ============================================
// 习惯之星规则 Hooks
// ============================================

/**
 * 获取习惯之星评选规则
 */
export function useHabitStarRules() {
  return useQuery<HabitStarRule[]>(
    () => habitApi.getStarRules(),
    { cacheTime: 30 * 60 * 1000 } // 缓存30分钟
  );
}

/**
 * 更新习惯之星评选规则
 */
export function useUpdateHabitStarRule() {
  return useMutation<HabitStarRule, { id: string; data: Partial<HabitStarRule> }>(
    ({ id, data }) => habitApi.updateStarRule(id, data)
  );
}

// ============================================
// 类型导出（从 @/types 重新导出，便于使用）
// ============================================

export type {
  HabitCategory,
  HabitGoal,
  HabitGoalTemplate,
  HabitStar,
  HabitAssessment,
  SchoolHabitStatsResponse,
  ClassHabitStats,
  StudentHabitProfile,
  StudentMonthlyGoal,
} from '@/types';

export { habitCategoryNames, habitCategoryIcons } from '@/types';
```

### 4.4 useStudentData.ts 优化代码

```typescript
/**
 * 学生数据管理 Hooks
 * 
 * @module hooks/useStudentData
 */

import { useQuery, usePaginatedQuery, useMutation, type QueryParams } from './useApi';
import { studentApi } from '@/services/api-client';
import type { 
  Student, 
  StudentListItem, 
  StudentFullProfile,
  StudentHabitProfile,
} from '@/types';

// ============================================
// 学生列表 Hooks
// ============================================

/**
 * 获取学生列表（分页）
 */
export function useStudentsList(params: {
  search?: string;
  grade?: string;
  classId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const queryParams: QueryParams = {
    search: params.search,
    grade: params.grade,
    classId: params.classId,
    status: params.status,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };
  
  return usePaginatedQuery<StudentListItem>(
    (p) => studentApi.list({ ...queryParams, ...p }),
    queryParams
  );
}

// ============================================
// 学生详情 Hooks
// ============================================

/**
 * 获取学生基本信息
 */
export function useStudent(studentId: string | null) {
  return useQuery<Student>(
    () => studentApi.get(studentId!),
    { enabled: !!studentId }
  );
}

/**
 * 获取学生完整档案
 * 
 * 包含基本信息、家庭信息、习惯养成、德育表现、荣誉奖项等
 */
export function useStudentFullProfile(studentId: string | null) {
  return useQuery<StudentFullProfile>(
    () => studentApi.getFullProfile(studentId!),
    { enabled: !!studentId, deps: [studentId] }
  );
}

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
// 学生操作 Hooks
// ============================================

/**
 * 创建学生
 */
export function useCreateStudent() {
  return useMutation<Student, Partial<Student>>(
    (data) => studentApi.create(data)
  );
}

/**
 * 更新学生
 */
export function useUpdateStudent() {
  return useMutation<Student, { id: string; data: Partial<Student> }>(
    ({ id, data }) => studentApi.update(id, data)
  );
}

/**
 * 删除学生
 */
export function useDeleteStudent() {
  return useMutation<void, string>(
    (id) => studentApi.delete(id)
  );
}

/**
 * 批量更新学生
 */
export function useBatchUpdateStudents() {
  return useMutation<Student[], { ids: string[]; data: Partial<Student> }>(
    ({ ids, data }) => studentApi.batchUpdate(ids, data)
  );
}

/**
 * 批量删除学生
 */
export function useBatchDeleteStudents() {
  return useMutation<void, string[]>(
    (ids) => studentApi.batchDelete(ids)
  );
}

// ============================================
// 类型导出
// ============================================

export type { StudentListItem, StudentFullProfile } from '@/types';
```

### 4.5 useApi.ts 精简（移除领域hooks）

```typescript
/**
 * 统一数据获取 Hooks 基础库
 * 
 * @module hooks/useApi
 * @description 提供通用的数据获取和操作能力，不涉及具体业务
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 类型导出
// ============================================

export type { QueryParams } from '@/services/api-client';
export type { Pagination, ApiResponse } from '@/types';

// ============================================
// 核心类型定义
// ============================================

export interface UseQueryOptions<T = unknown> {
  enabled?: boolean;
  deps?: unknown[];
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  initialData?: T | null;
  refetchOnWindowFocus?: boolean;
  cacheTime?: number;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  source: 'database' | 'mock' | null;
  isFetching: boolean;
}

export interface UseMutationResult<T, P> {
  mutate: (params: P) => Promise<T | null>;
  mutateAsync: (params: P) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
  data: T | null;
}

export interface UsePaginatedResult<T> extends UseQueryResult<T[]> {
  pagination: Pagination | null;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CrudHookConfig<T> {
  endpoint: string;
  onCreate?: (data: T) => void;
  onUpdate?: (data: T) => void;
  onDelete?: (id: string) => void;
  onError?: (error: string) => void;
}

export interface UseCrudResult<T> {
  data: T[];
  selected: T | null;
  loading: boolean;
  error: string | null;
  fetchList: (params?: QueryParams) => Promise<void>;
  create: (item: Partial<T>) => Promise<T | null>;
  update: (id: string, item: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  select: (item: T | null) => void;
  clearError: () => void;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

// ============================================
// 核心 Hooks 实现
// ============================================

export function useQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  // ... 实现代码（保持现有逻辑）
}

export function usePaginatedQuery<T>(
  queryFn: (params: QueryParams) => Promise<ApiResponse<T[]>>,
  initialParams: QueryParams = {}
): UsePaginatedResult<T> {
  // ... 实现代码（保持现有逻辑）
}

export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>
): UseMutationResult<T, P> {
  // ... 实现代码（保持现有逻辑）
}

export function useCrud<T extends { id: string }>(
  config: CrudHookConfig<T>
): UseCrudResult<T> {
  // ... 实现代码（保持现有逻辑）
}

// ============================================
// 注意：领域 Hooks 已移至对应的领域文件
// - useStudents → useStudentData.ts
// - useTeachers → useTeacherData.ts
// - useHabitGoals → useHabitData.ts
// ============================================
```

### 4.6 验收标准

| 检查项 | 验收标准 |
|--------|----------|
| TypeScript编译 | 无错误、无警告 |
| 废弃文件清理 | useDataFetch.ts、useData.ts、useCrudOperations.ts 已删除 |
| 统一模式 | 所有领域hooks基于 useApi.ts 实现 |
| 功能正常 | 习惯养成模块所有页面功能正常 |

---

## 5. 阶段三：API客户端完善

### 5.1 目标

完善 `api-client.ts` 中的领域API模块，确保所有接口都有对应的方法。

### 5.2 habitApi 完整扩展

```typescript
// src/services/api-client.ts (补充)

/**
 * 习惯养成 API
 */
export const habitApi = {
  // -------- 统计 --------
  
  /** 获取全校统计 */
  getSchoolStats: (month: string) =>
    apiClient.get<SchoolHabitStatsResponse>('/habit/stats/school', { month }),

  /** 获取班级统计 */
  getClassStats: (classId: string, month: string) =>
    apiClient.get<ClassHabitStats>(`/habit/stats/class/${classId}`, { month }),

  // -------- 目标 --------
  
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

  // -------- 模板 --------
  
  /** 获取目标模板列表 */
  getTemplates: (params?: QueryParams) =>
    apiClient.get<HabitGoalTemplate[]>('/habit/templates', params),

  /** 创建目标模板 */
  createTemplate: (data: Partial<HabitGoalTemplate>) =>
    apiClient.post<HabitGoalTemplate>('/habit/templates', data),

  /** 更新目标模板 */
  updateTemplate: (id: string, data: Partial<HabitGoalTemplate>) =>
    apiClient.put<HabitGoalTemplate>(`/habit/templates/${id}`, data),

  /** 删除目标模板 */
  deleteTemplate: (id: string) =>
    apiClient.delete(`/habit/templates/${id}`),

  // -------- 学生月度目标 --------
  
  /** 获取学生月度目标 */
  getStudentMonthlyGoals: (studentId: string, month: string) =>
    apiClient.get<StudentMonthlyGoal[]>('/habit/monthly-goals', { studentId, month }),

  /** 创建/更新学生月度目标 */
  upsertStudentMonthlyGoal: (data: Partial<StudentMonthlyGoal>) =>
    apiClient.post<StudentMonthlyGoal>('/habit/monthly-goals', data),

  // -------- 评价 --------
  
  /** 获取评价记录列表 */
  getAssessments: (params?: QueryParams) =>
    apiClient.get<HabitAssessment[]>('/habit/assessments', params),

  /** 创建评价 */
  createAssessment: (data: Partial<HabitAssessment>) =>
    apiClient.post<HabitAssessment>('/habit/assessments', data),

  /** 批量创建评价 */
  batchCreateAssessments: (data: Partial<HabitAssessment>[]) =>
    apiClient.post<HabitAssessment[]>('/habit/assessments/batch', data),

  // -------- 习惯之星 --------
  
  /** 获取习惯之星列表 */
  getStars: (params?: QueryParams) =>
    apiClient.get<HabitStar[]>('/habit/stars', params),

  /** 评选习惯之星 */
  selectStars: (month: string, studentIds: string[]) =>
    apiClient.post<HabitStar[]>('/habit/stars/select', { month, studentIds }),

  /** 获取习惯之星规则 */
  getStarRules: () =>
    apiClient.get<HabitStarRule[]>('/habit/stars/rules'),

  /** 更新习惯之星规则 */
  updateStarRule: (id: string, data: Partial<HabitStarRule>) =>
    apiClient.put<HabitStarRule>(`/habit/stars/rules/${id}`, data),

  // -------- 学生档案 --------
  
  /** 获取学生习惯档案 */
  getStudentProfile: (studentId: string) =>
    apiClient.get<StudentHabitProfile>(`/habit/students/${studentId}/profile`),

} as const;
```

### 5.3 moralApi 扩展

```typescript
/**
 * 德育管理 API
 */
export const moralApi = {
  // -------- 德育评价 --------
  
  /** 获取德育评价列表 */
  getEvaluations: (params?: QueryParams) =>
    apiClient.get<MoralEvaluation[]>('/moral/evaluations', params),

  /** 创建德育评价 */
  createEvaluation: (data: Partial<MoralEvaluation>) =>
    apiClient.post<MoralEvaluation>('/moral/evaluations', data),

  // -------- 奖惩管理 --------
  
  /** 获取学生奖励列表 */
  getRewards: (params?: QueryParams) =>
    apiClient.get<StudentReward[]>('/moral/rewards', params),

  /** 创建学生奖励 */
  createReward: (data: Partial<StudentReward>) =>
    apiClient.post<StudentReward>('/moral/rewards', data),

  /** 获取学生处分列表 */
  getPunishments: (params?: QueryParams) =>
    apiClient.get<StudentPunishment[]>('/moral/punishments', params),

  /** 创建学生处分 */
  createPunishment: (data: Partial<StudentPunishment>) =>
    apiClient.post<StudentPunishment>('/moral/punishments', data),

  /** 撤销处分 */
  revokePunishment: (id: string, reason: string) =>
    apiClient.put<StudentPunishment>(`/moral/punishments/${id}/revoke`, { reason }),

  // -------- 德育活动 --------
  
  /** 获取德育活动列表 */
  getActivities: (params?: QueryParams) =>
    apiClient.get<MoralActivity[]>('/moral/activities', params),

  /** 创建德育活动 */
  createActivity: (data: Partial<MoralActivity>) =>
    apiClient.post<MoralActivity>('/moral/activities', data),

  /** 更新德育活动 */
  updateActivity: (id: string, data: Partial<MoralActivity>) =>
    apiClient.put<MoralActivity>(`/moral/activities/${id}`, data),

  // -------- 行为记录 --------
  
  /** 获取行为记录列表 */
  getBehaviorRecords: (params?: QueryParams) =>
    apiClient.get<StudentBehaviorRecord[]>('/moral/behaviors', params),

  /** 创建行为记录 */
  createBehaviorRecord: (data: Partial<StudentBehaviorRecord>) =>
    apiClient.post<StudentBehaviorRecord>('/moral/behaviors', data),

  // -------- 预警管理 --------
  
  /** 获取预警列表 */
  getAlerts: (params?: QueryParams) =>
    apiClient.get<MoralAlert[]>('/moral/alerts', params),

  /** 处理预警 */
  handleAlert: (id: string, data: { status: string; handling: string }) =>
    apiClient.put<MoralAlert>(`/moral/alerts/${id}/handle`, data),

} as const;
```

### 5.4 验收标准

| 检查项 | 验收标准 |
|--------|----------|
| API完整性 | 所有业务接口都有对应方法 |
| 类型安全 | 所有方法有完整的类型定义 |
| 统一响应 | 所有方法返回 `ApiResponse<T>` |
| 错误处理 | 统一的错误处理机制 |

---

## 6. 阶段四：页面组件更新

### 6.1 目标

更新所有页面组件，移除直接的 fetch 调用，统一使用 hooks 或 apiClient。

### 6.2 受影响页面清单

| 模块 | 页面路径 | 需更新内容 |
|------|----------|------------|
| 习惯养成 | `/moral/habit/overview` | 使用 useSchoolHabitStats |
| 习惯养成 | `/moral/habit/goals` | 使用 useHabitGoals, useCreateHabitGoal |
| 习惯养成 | `/moral/habit/stars` | 使用 useHabitStars |
| 习惯养成 | `/moral/habit/settings` | 使用 useHabitGoalTemplates, useHabitStarRules |
| 教师端习惯 | `/teacher/habit` | 使用 useHabitGoals, useHabitAssessments |
| 家长端习惯 | `/parent/habit` | 使用 useStudentMonthlyGoals, useCreateHabitAssessment |
| 德育管理 | `/moral/activities` | 使用 useMoralActivities |
| 德育管理 | `/moral/alerts` | 使用 useMoralAlerts |

### 6.3 页面更新示例

**更新前**（直接使用 fetch）:
```typescript
// ❌ 旧代码
function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/habit/goals')
      .then(res => res.json())
      .then(data => {
        setGoals(data.data || []);
        setLoading(false);
      });
  }, []);

  return (/* ... */);
}
```

**更新后**（使用 hooks）:
```typescript
// ✅ 新代码
import { useHabitGoals } from '@/hooks/useHabitData';

function GoalsPage() {
  const { data: goals, loading, error, refetch } = useHabitGoals({ 
    status: 'active' 
  });

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (/* ... */);
}
```

### 6.4 验收标准

| 检查项 | 验收标准 |
|--------|----------|
| 无直接fetch | 全局搜索 `fetch('/api` 无结果（API路由除外） |
| hooks使用 | 所有页面使用对应的领域hooks |
| 功能正常 | 所有页面功能测试通过 |

---

## 7. 阶段五：文档最终核对

### 7.1 需更新文档

| 文档 | 更新内容 |
|------|----------|
| SDD.md | 5.16 章节更新为新架构 |
| DATA_INTERFACE_REFACTOR_PLAN.md | 标记为已完成 |
| README.md | 更新 hooks 使用说明 |

### 7.2 SDD.md 5.16章节更新内容

```markdown
### 5.16 数据Hooks说明

#### 5.16.1 架构分层

项目采用三层Hooks架构：

| 层级 | 文件 | 职责 |
|------|------|------|
| 基础层 | useApi.ts | 提供通用的查询、变更、CRUD能力 |
| 领域层 | useXxxData.ts | 面向具体业务领域的数据管理 |
| 应用层 | usePageData.ts | 组合多个领域hooks（可选） |

#### 5.16.2 Hooks清单

**基础层 Hooks**

| Hook | 用途 | 参数 | 返回值 |
|------|------|------|--------|
| useQuery | 单次查询 | queryFn, options | { data, loading, error, refetch } |
| usePaginatedQuery | 分页查询 | queryFn, params | { data, pagination, nextPage, prevPage } |
| useMutation | 数据变更 | mutationFn | { mutate, loading, error } |
| useCrud | CRUD工厂 | config | { data, create, update, remove } |

**领域层 Hooks**

| Hook文件 | 主要导出 |
|----------|----------|
| useAuth.ts | useAuth, useLogin, useLogout, useCurrentUser |
| useStudentData.ts | useStudentsList, useStudentFullProfile, useStudentHabitProfile |
| useTeacherData.ts | useTeachersList, useTeacherFullProfile |
| useHabitData.ts | useSchoolHabitStats, useHabitGoals, useHabitStars, useHabitAssessments |
| useMoralData.ts | useMoralEvaluations, useStudentRewards, useMoralActivities |
| useAcademicData.ts | useSchedules, useLeaveRequests, useScheduleChanges |
| useGeneralData.ts | useAssets, useRepairRequests, useVenues |

#### 5.16.3 使用规范

1. 所有数据获取使用 hooks，不直接调用 fetch
2. 所有 API 调用通过 apiClient
3. 类型从 @/types 统一导入
```

### 7.3 验收标准

| 检查项 | 验收标准 |
|--------|----------|
| 文档一致性 | 文档描述与代码实现一致 |
| 版本更新 | SDD.md 版本更新至 v1.7 |
| 完成标记 | 整改方案标记为已完成 |

---

## 8. 实施路线图

### 8.1 总体时间规划

```
┌─────────────────────────────────────────────────────────────────────┐
│                        实施路线图                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  阶段一          阶段二              阶段三            阶段四        │
│  类型定义        Hooks重构           API客户端         页面更新      │
│  统一                                                  文档核对      │
│                                                                      │
│  ├─────────────┼─────────────────┼─────────────────┼─────────────┤  │
│  │             │                 │                 │             │  │
│  ▼             ▼                 ▼                 ▼             ▼  │
│                                                                      │
│  [开始] ─────────────────────────────────────────────────> [完成]   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 阶段依赖关系

```
阶段一（类型定义统一）
    │
    ├── 提供统一的类型基础
    │
    ▼
阶段二（Hooks重构）
    │
    ├── 基于统一类型重构hooks
    │
    ▼
阶段三（API客户端完善）
    │
    ├── 提供完整的API方法
    │
    ▼
阶段四（页面组件更新）
    │
    ├── 使用新hooks更新页面
    │
    ▼
阶段五（文档核对）
    │
    └── 确保文档与代码一致
```

### 8.3 每日任务分解

**阶段一：类型定义统一**

| 任务 | 说明 |
|------|------|
| 1.1 | 备份现有 types/index.ts |
| 1.2 | 扩展 types/index.ts，添加习惯养成类型 |
| 1.3 | 扩展 types/index.ts，添加德育类型 |
| 1.4 | 扩展 types/index.ts，添加教务类型 |
| 1.5 | 扩展 types/index.ts，添加总务类型 |
| 1.6 | 更新 useHabitData.ts 的导入 |
| 1.7 | 更新 useMoralData.ts 的导入 |
| 1.8 | 更新其他 hooks 文件的导入 |
| 1.9 | 删除 hooks 中的重复类型定义 |
| 1.10 | TypeScript 编译验证 |

**阶段二：Hooks重构**

| 任务 | 说明 |
|------|------|
| 2.1 | 重构 useHabitData.ts（重点） |
| 2.2 | 优化 useStudentData.ts |
| 2.3 | 优化 useTeacherData.ts |
| 2.4 | 精简 useAcademicData.ts |
| 2.5 | 精简 useGeneralAffairsData.ts（重命名为 useGeneralData.ts） |
| 2.6 | 精简 useApi.ts（移除领域hooks） |
| 2.7 | 删除 useDataFetch.ts |
| 2.8 | 删除 useData.ts |
| 2.9 | 删除 useCrudOperations.ts |
| 2.10 | TypeScript 编译验证 |

**阶段三：API客户端完善**

| 任务 | 说明 |
|------|------|
| 3.1 | 完善 habitApi 模块 |
| 3.2 | 完善 moralApi 模块 |
| 3.3 | 完善 academicApi 模块 |
| 3.4 | 完善 generalApi 模块 |
| 3.5 | 验证所有API方法 |

**阶段四：页面组件更新**

| 任务 | 说明 |
|------|------|
| 4.1 | 更新 /moral/habit/overview 页面 |
| 4.2 | 更新 /moral/habit/goals 页面 |
| 4.3 | 更新 /moral/habit/stars 页面 |
| 4.4 | 更新 /moral/habit/settings 页面 |
| 4.5 | 更新 /teacher/habit 页面 |
| 4.6 | 更新 /parent/habit 页面 |
| 4.7 | 更新其他受影响页面 |
| 4.8 | 功能测试验证 |

**阶段五：文档核对**

| 任务 | 说明 |
|------|------|
| 5.1 | 更新 SDD.md 5.16 章节 |
| 5.2 | 更新 README.md |
| 5.3 | 标记整改方案完成 |
| 5.4 | 最终验收 |

---

## 附录

### A. Hooks命名规范

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 列表查询 | use + 业务 + List/s | useStudentsList |
| 单条查询 | use + 业务 | useStudent |
| 详情查询 | use + 业务 + Profile/Detail | useStudentFullProfile |
| 创建 | useCreate + 业务 | useCreateStudent |
| 更新 | useUpdate + 业务 | useUpdateStudent |
| 删除 | useDelete + 业务 | useDeleteStudent |
| 批量操作 | useBatch + 操作 + 业务 | useBatchDeleteStudents |

### B. 类型命名规范

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 实体 | 业务名称 | Student, Teacher |
| 列表项 | 业务 + ListItem | StudentListItem |
| 详情/档案 | 业务 + Profile | TeacherProfile |
| 统计 | 业务 + Stats | ClassHabitStats |
| 响应 | 业务 + Response | SchoolHabitStatsResponse |
| 参数 | 业务 + Params | StudentListParams |

### C. 导入规范

```typescript
// ✅ 正确：从 @/types 导入类型
import type { Student, Teacher, HabitCategory } from '@/types';

// ✅ 正确：从 @/hooks 导入 hooks
import { useStudentsList, useStudentFullProfile } from '@/hooks/useStudentData';

// ✅ 正确：从 @/services 导入 API
import { studentApi, habitApi } from '@/services/api-client';

// ❌ 错误：从 hooks 文件导入类型
import { HabitCategory } from '@/hooks/useHabitData'; // 应从 @/types 导入
```

---

**文档结束**
