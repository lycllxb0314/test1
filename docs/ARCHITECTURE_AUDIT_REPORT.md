# 智慧校园系统架构排查报告

## 一、排查概述

### 排查范围
- API路由文件：**73个**
- Hooks文件：**17个**
- 核心库文件：**23个**
- 认证中间件系统：**已实现**

### 排查维度
1. **统一数据接口**：API命名、参数、返回格式的一致性
2. **统一身份认证**：认证方式、权限控制的一致性
3. **统一钩子（Hooks）**：数据获取、异常处理的一致性

---

## 二、问题清单

### 2.1 统一数据接口问题

#### 🔴 严重问题

| 序号 | 问题描述 | 影响范围 | 优先级 |
|------|----------|----------|--------|
| API-001 | **API响应格式不统一**：部分接口未返回标准格式 | 多个API | P0 |
| API-002 | **分页参数命名不一致**：`page/pageSize` vs `page/limit` | 列表类API | P1 |
| API-003 | **错误码未统一使用**：部分接口仅返回error字符串 | 全部API | P1 |

**详细说明：**

**API-001 响应格式不统一示例：**

```typescript
// ✅ 正确格式（大部分API采用）
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 },
  "source": "database"
}

// ❌ 不一致格式（/api/homepage/route.ts）
{
  "data": [...],  // 缺少 success 字段
  "error": "xxx"  // 错误时无success字段
}
```

**API-002 分页参数不一致示例：**

```typescript
// 部分API使用 page/pageSize
const page = parseInt(searchParams.get('page') || '1');
const pageSize = parseInt(searchParams.get('pageSize') || '20');

// 部分API可能使用其他命名（需统一检查）
```

#### 🟡 中等问题

| 序号 | 问题描述 | 影响范围 | 优先级 |
|------|----------|----------|--------|
| API-004 | **URL命名风格不统一**：部分使用kebab-case，部分使用camelCase | 多个API | P2 |
| API-005 | **请求体字段命名不一致**：部分使用驼峰，部分使用下划线 | POST/PUT | P2 |
| API-006 | **Mock数据未集中管理**：部分Mock数据内联在路由中 | 多个API | P2 |

**详细说明：**

**API-004 URL命名风格不一致：**

```typescript
// ✅ 正确风格（大部分采用）
/api/leave-requests
/api/schedule-changes
/api/room-bookings

// ❓ 需确认
/api/students/[id]/full-profile  // 动态路由
```

**API-006 Mock数据内联问题：**

```typescript
// ❌ 问题示例（/api/schedules/route.ts）
const mockSchedules = [
  { id: 'sch-1', classId: 'c6-1', ... },
  // ...大量内联数据
];

// ✅ 正确做法（已集中管理的Mock）
import { MOCK_STUDENTS, getMockStudents } from '@/lib/mock/students.mock';
```

---

### 2.2 统一身份认证问题

#### 🔴 严重问题

| 序号 | 问题描述 | 影响范围 | 优先级 |
|------|----------|----------|--------|
| AUTH-001 | **大部分API未启用认证保护**：未使用protectedRoute中间件 | 几乎所有API | P0 |
| AUTH-002 | **认证中间件已实现但未集成**：代码存在但未被调用 | 全部API | P0 |

**详细说明：**

**AUTH-001/002 认证未集成问题：**

```typescript
// ✅ 已实现的认证中间件（/lib/auth/）
export function protectedRoute(
  handler: RouteHandler,
  options: ProtectionOptions = {}
) { ... }

// ❌ 但API路由未使用
// 当前状态：
export async function GET(request: NextRequest) {
  // 直接处理请求，无认证检查
}

// 应该改为：
export const GET = protectedRoute(async (request, { user }) => {
  // 已认证的用户请求
}, { module: 'academic', permission: 'view' });
```

**当前仅 `/api/auth/current` 使用 userId 参数查询，无实际认证：**

```typescript
// /api/auth/current/route.ts
const userId = searchParams.get('userId');
// 仅通过URL参数获取，无会话验证
```

#### 🟡 中等问题

| 序号 | 问题描述 | 影响范围 | 优先级 |
|------|----------|----------|--------|
| AUTH-003 | **缺少统一会话管理**：无Token/Session机制 | 登录系统 | P1 |
| AUTH-004 | **权限检查逻辑分散**：部分页面自行实现权限判断 | 前端页面 | P2 |

---

### 2.3 统一钩子（Hooks）问题

#### 🔴 严重问题

| 序号 | 问题描述 | 影响范围 | 优先级 |
|------|----------|----------|--------|
| HOOK-001 | **多个废弃Hook文件仍存在**：useData.ts、useDataFetch.ts、useCrudOperations.ts | 代码维护 | P1 |
| HOOK-002 | **领域Hooks功能重复**：useApi.ts 与 useTeacherData.ts 等功能重叠 | 多个Hooks | P1 |

**详细说明：**

**HOOK-001 废弃Hook文件：**

```
src/hooks/
├── useApi.ts          # ✅ 主Hook库（推荐使用）
├── useData.ts         # ⚠️ 已废弃，仅重新导出useApi
├── useDataFetch.ts    # ⚠️ 已废弃，仅重新导出useApi
├── useCrudOperations.ts # ⚠️ 已废弃，仅重新导出useApi
├── useTeacherData.ts  # ⚠️ 功能与useApi重复
├── useStudentData.ts  # ⚠️ 功能与useApi重复
└── ...
```

**HOOK-002 功能重复示例：**

```typescript
// useApi.ts 中已有完整实现
export function useTeachers(params?: QueryParams) {
  return useQuery(() => api.teacher.list(params), { deps: [params] });
}

// useTeacherData.ts 又重新实现
export function useTeachersList(params: TeacherListParams = {}): TeacherListResult {
  const queryParams: QueryParams = { ... };
  const result = usePaginatedQuery<TeacherListItem>(...);
  return { ... };
}
```

#### 🟡 中等问题

| 序号 | 问题描述 | 影响范围 | 优先级 |
|------|----------|----------|--------|
| HOOK-003 | **异常处理不统一**：部分Hook直接返回null，部分抛出异常 | 多个Hooks | P2 |
| HOOK-004 | **loading状态命名不一致**：loading vs isLoading | 多个Hooks | P2 |
| HOOK-005 | **类型定义分散**：相同类型在多个文件中重复定义 | 类型系统 | P2 |

**详细说明：**

**HOOK-003/004 状态命名不一致：**

```typescript
// useApi.ts 使用 loading
export interface UseQueryResult<T> {
  loading: boolean;  // ✅ 统一使用 loading
  // ...
}

// useData.ts（废弃）使用 isLoading
export interface UseDataResult<T> {
  isLoading: boolean;  // ❌ 不一致
}
```

**HOOK-005 类型重复定义：**

```typescript
// useTeacherData.ts 定义
export interface TeacherListItem { id: string; name: string; ... }

// useApi.ts 通过types导入
import type { Teacher } from '@/types';

// 应该统一从 @/types 导入
```

---

## 三、三大统一评估总结

| 维度 | 当前状态 | 评估结果 | 主要问题 |
|------|----------|----------|----------|
| **统一数据接口** | 部分实现 | 🟡 60% | 响应格式不统一、Mock数据分散 |
| **统一身份认证** | 代码存在但未集成 | 🔴 20% | 中间件已实现但未使用、无会话管理 |
| **统一钩子** | 基本实现但需清理 | 🟡 70% | 废弃文件未删除、功能重复 |

### 整体架构评分：**50/100**

---

## 四、整改路线图

### 阶段一：紧急修复（P0，1-2天）

#### 任务1：统一API响应格式
```typescript
// 1. 创建响应格式检查工具
// lib/api-response-guard.ts
export function ensureApiResponse<T>(response: unknown): ApiResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return { success: false, error: 'Invalid response format' };
  }
  // ...验证逻辑
}

// 2. 修复不符合规范的API路由
// 优先修复：/api/homepage/route.ts
```

#### 任务2：启用API认证保护
```typescript
// 1. 为核心API添加认证
// app/api/teachers/route.ts
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(
  async (request, { user }) => {
    // 原有逻辑
  },
  { module: 'academic', permission: 'view' }
);

// 2. 逐步覆盖所有敏感API
```

### 阶段二：标准化改造（P1，3-5天）

#### 任务3：统一Mock数据管理
```
目标结构：
lib/mock/
├── index.ts          # 统一导出
├── teachers.mock.ts  # ✅ 已存在
├── students.mock.ts  # ✅ 已存在
├── classes.mock.ts   # ✅ 已存在
├── schedules.mock.ts # ✅ 已存在
├── academic.mock.ts  # ✅ 已存在
├── moral.mock.ts     # ✅ 已存在
├── general.mock.ts   # ✅ 已存在
└── access.mock.ts    # ✅ 已存在

需要迁移的内联Mock：
- /api/schedules/route.ts → schedules.mock.ts
- /api/schedule-changes/route.ts → academic.mock.ts
```

#### 任务4：清理废弃Hook文件
```bash
# 删除废弃文件
rm src/hooks/useData.ts
rm src/hooks/useDataFetch.ts
rm src/hooks/useCrudOperations.ts

# 或保留但添加清晰注释
// ⚠️ 此文件已废弃，将在下个版本删除
// 请迁移至 useApi.ts
```

#### 任务5：统一领域Hooks
```typescript
// 方案A：保留useApi.ts，删除重复领域Hooks
// 方案B：保留领域Hooks作为封装层，但内部必须调用useApi

// 推荐：方案B，领域Hooks提供业务语义
export function useTeachersList(params) {
  // 内部调用统一API
  return useQuery(() => api.teacher.list(params));
}
```

### 阶段三：完善优化（P2，1周）

#### 任务6：实现统一会话管理
```typescript
// 1. 实现JWT或Session方案
// lib/auth/session.ts
export async function createSession(userId: string): Promise<string>;
export async function validateSession(token: string): Promise<User | null>;

// 2. 更新认证中间件
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return { success: false, error: '未提供认证令牌' };
  
  const user = await validateSession(token);
  // ...
}
```

#### 任务7：完善类型系统
```typescript
// types/api.ts - 统一API相关类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: ErrorCode;
  pagination?: Pagination;
  source?: 'database' | 'mock';
}

// types/domain.ts - 统一领域类型
// 所有领域Hooks从这里导入类型
```

---

## 五、优先级排序

| 优先级 | 任务 | 预估工时 | 影响范围 |
|--------|------|----------|----------|
| P0-1 | 启用API认证保护 | 2天 | 安全核心 |
| P0-2 | 统一API响应格式 | 1天 | 全部API |
| P1-1 | 统一Mock数据管理 | 2天 | 开发效率 |
| P1-2 | 清理废弃Hook文件 | 0.5天 | 代码维护 |
| P1-3 | 实现会话管理 | 2天 | 认证系统 |
| P2-1 | 统一领域Hooks | 1天 | 代码一致性 |
| P2-2 | 完善类型系统 | 1天 | 类型安全 |

---

## 六、建议的最佳实践

### API开发规范

```typescript
// ✅ 推荐的API路由模板
import { protectedRoute } from '@/lib/auth';
import { success, error, parseQueryParams, createPagination } from '@/lib/api-route-utils';
import { MOCK_DATA, getMockData } from '@/lib/mock/xxx.mock';

export const GET = protectedRoute(
  async (request, { user }) => {
    const params = parseQueryParams(request);
    
    try {
      const client = getSupabaseClient();
      const { data, error: dbError, count } = await client
        .from('table_name')
        .select('*', { count: 'exact' })
        // ...筛选条件
        .range(...);
      
      if (dbError) {
        // Mock fallback
        const mockData = getMockData(params);
        return NextResponse.json(success(mockData, 'mock'));
      }
      
      return NextResponse.json(success(data, 'database'));
    } catch (err) {
      return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
  },
  { module: 'xxx', permission: 'view' }
);
```

### Hook使用规范

```typescript
// ✅ 推荐的Hook使用方式
import { useQuery, usePaginatedQuery, useMutation } from '@/hooks/useApi';
import { api } from '@/services/api-client';

// 列表查询
const { data, loading, error, pagination, nextPage } = usePaginatedQuery(
  (params) => api.teacher.list(params),
  { department: '语文组' }
);

// 详情查询
const { data, loading, error } = useQuery(
  () => api.teacher.get(id),
  { enabled: !!id, deps: [id] }
);

// 创建操作
const { mutate, loading, error } = useMutation(
  (data) => api.teacher.create(data)
);
```

---

## 七、总结

当前系统已经具备良好的架构基础：
- ✅ 统一的API客户端（`apiClient`）
- ✅ 统一的响应构建工具（`api-response.ts`）
- ✅ 完整的认证中间件系统（`auth-middleware.ts`）
- ✅ 统一的基础Hook库（`useApi.ts`）
- ✅ 集中的Mock数据目录（`lib/mock/`）

主要问题是**已实现的统一规范未被严格执行**：
1. 认证中间件已实现但未被API路由使用
2. 响应格式工具已存在但部分API未使用
3. 统一Hook库已建立但废弃文件未清理

**整改核心**：不是"重新设计"，而是"严格执行已有规范"。

---

*报告生成时间：2024年*
*排查工具：代码静态分析*
