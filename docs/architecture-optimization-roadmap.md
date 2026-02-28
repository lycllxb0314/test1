# 系统架构优化与整改路线图

## 文档概述

**项目名称**: 龙岩师范附属小学智慧校园管理平台  
**文档版本**: v1.0  
**创建日期**: 2024年1月  
**适用范围**: 数据接口层、Hook层、API路由层

---

## 一、架构问题清单

### 1.1 数据获取Hooks层问题

#### 问题1：Hooks实现严重重复
**严重程度**: 高  
**影响范围**: 全局

**问题描述**:
项目中存在多个功能重叠的数据获取Hooks文件，导致：
- 代码重复：相同逻辑在多处实现
- 维护困难：修改一处需同步多处
- 行为不一致：各Hooks实现细节差异
- 学习成本高：开发者需理解多套API

**涉及文件**:
- `src/hooks/useApi.ts` - 基础数据获取Hook
- `src/hooks/useData.ts` - 通用数据获取Hook（重复）
- `src/hooks/useDataFetch.ts` - 数据获取Hook（重复）
- `src/hooks/useCrudOperations.ts` - CRUD操作Hook（重复）

**原代码示例**:
```typescript
// useData.ts - 重复实现
export function useDataFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ...重复的fetch逻辑
}

// useDataFetch.ts - 几乎相同的实现
export function useDataFetch<T>(url: string, options?: DataFetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ...几乎相同的fetch逻辑
}
```

#### 问题2：缺乏统一的数据缓存机制
**严重程度**: 中  
**影响范围**: 性能

**问题描述**:
- 无请求缓存：相同请求重复发起
- 无窗口聚焦刷新：用户切换标签页后数据不更新
- 无后台数据过期检测：无法感知数据新鲜度

### 1.2 API响应格式问题

#### 问题3：API响应格式不统一
**严重程度**: 高  
**影响范围**: 全局

**问题描述**:
各API路由返回的数据格式不一致，导致：
- 前端处理复杂：需为每个API编写不同的解析逻辑
- 错误处理困难：错误码和错误信息格式各异
- 调试困难：难以统一追踪API调用问题

**原代码示例**:
```typescript
// api/teachers/route.ts - 不一致的响应格式
return NextResponse.json({ teachers, total });

// api/students/route.ts - 另一种格式
return NextResponse.json({ data: students, pagination: { total, page, pageSize } });

// api/classes/route.ts - 又一种格式
return NextResponse.json({ success: true, result: classes });
```

### 1.3 Mock数据管理问题

#### 问题4：Mock数据分散管理
**严重程度**: 中  
**影响范围**: 可维护性

**问题描述**:
Mock数据直接写在API路由文件中，导致：
- 数据分散：难以统一管理和更新
- 复用困难：相同Mock数据在多处重复定义
- 测试不便：无法集中配置测试数据

**原代码示例**:
```typescript
// api/teachers/route.ts - Mock数据内联
const mockTeachers = [
  { id: '1', name: '张老师', ... },
  { id: '2', name: '李老师', ... },
  // ...大量Mock数据混在路由逻辑中
];

// api/students/route.ts - 重复的Mock结构
const mockStudents = [
  { id: '1', name: '王小明', ... },
  // ...
];
```

### 1.4 API路由实现问题

#### 问题5：API路由代码重复
**严重程度**: 中  
**影响范围**: 开发效率

**问题描述**:
每个API路由都包含相似的处理逻辑：
- 参数解析和验证
- 分页计算
- 数据库查询构建
- 错误处理
- Mock数据fallback

**涉及文件**:
- `src/app/api/teachers/route.ts`
- `src/app/api/students/route.ts`
- `src/app/api/classes/route.ts`
- `src/app/api/base-schedules/route.ts`
- `src/app/api/leave-requests/route.ts`
- `src/app/api/expenses/route.ts`
- 等20+个API路由文件

### 1.5 类型安全问题

#### 问题6：类型定义不完整
**严重程度**: 中  
**影响范围**: 类型安全

**问题描述**:
- 大量使用 `any` 类型
- API响应类型不明确
- 缺乏统一的DTO类型定义

---

## 二、整改方案

### 2.1 统一Hooks架构方案

#### 方案概述
保留 `useApi.ts` 作为唯一基础Hook库，废弃其他重复Hooks。

#### 实施步骤

**步骤1：增强 useApi.ts**

新增功能：
- 缓存管理（基于Map实现）
- 窗口聚焦自动刷新
- `isFetching` 状态（区分初始加载和后台刷新）
- 完善的 `usePaginatedQuery` 和 `useMutation`

```typescript
// useApi.ts - 增强后的基础Hook
// 缓存管理
const cache = new Map<string, { data: unknown; timestamp: number }>();

// 窗口聚焦刷新
useEffect(() => {
  const handleFocus = () => {
    if (document.visibilityState === 'visible' && options.refetchOnWindowFocus) {
      refetch();
    }
  };
  document.addEventListener('visibilitychange', handleFocus);
  return () => document.removeEventListener('visibilitychange', handleFocus);
}, []);
```

**步骤2：废弃旧Hooks**

```typescript
// useData.ts - 标记废弃，重新导出
/**
 * @deprecated 请使用 useApi.ts 中的统一Hooks
 * 此文件将在未来版本中移除
 */
export { useApi, useMutation, usePaginatedQuery } from './useApi';
```

**步骤3：重构领域Hooks**

将领域特定Hooks重构为使用统一基础Hook：
- `useTeacherData.ts`
- `useStudentData.ts`
- `useAcademicData.ts`
- 等

```typescript
// useTeacherData.ts - 重构后
import { useApi, usePaginatedQuery, useMutation } from './useApi';

export function useTeachers(params?: TeacherQueryParams) {
  return usePaginatedQuery<Teacher>('/api/teachers', params);
}
```

### 2.2 统一API响应格式方案

#### 方案概述
创建 `lib/api-response.ts` 定义标准响应格式和工具函数。

#### 标准响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  meta?: {
    source: 'database' | 'mock';
    timestamp: string;
    pagination?: Pagination;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}
```

#### 标准错误码

```typescript
enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

#### 工具函数

```typescript
// 快捷响应方法
export function success<T>(data: T, source: 'database' | 'mock' = 'database'): ApiResponse<T>;
export function error(message: string, code: ErrorCode): ApiResponse<never>;
export function databaseError(message: string): ApiResponse<never>;
export function paginated<T>(data: T[], pagination: Pagination): ApiResponse<T[]>;

// 构建器模式
export class ApiResponseBuilder<T> {
  withData(data: T): this;
  withError(code: ErrorCode, message: string): this;
  withPagination(page: number, pageSize: number, total: number): this;
  withMeta(meta: Partial<ApiResponseMeta>): this;
  build(): ApiResponse<T>;
}
```

### 2.3 集中Mock数据管理方案

#### 方案概述
创建 `lib/mock/` 目录，按领域集中管理Mock数据。

#### 目录结构

```
src/lib/mock/
├── index.ts              # 统一导出和工具函数
├── teachers.mock.ts      # 教师相关Mock数据
├── students.mock.ts      # 学生相关Mock数据
├── classes.mock.ts       # 班级相关Mock数据
├── schedules.mock.ts     # 课表相关Mock数据
├── academic.mock.ts      # 教务相关Mock数据
├── access.mock.ts        # 门禁相关Mock数据
├── moral.mock.ts         # 德育相关Mock数据
└── general.mock.ts       # 总务相关Mock数据
```

#### Mock数据规范

```typescript
// teachers.mock.ts
import { Teacher } from '@/types/models';

export const mockTeachers: Teacher[] = [
  // ...教师数据
];

export function getMockTeacherById(id: string): Teacher | undefined {
  return mockTeachers.find(t => t.id === id);
}

export function getMockTeachers(params: QueryParams): PaginatedResult<Teacher> {
  // 分页、过滤逻辑
}
```

### 2.4 API路由工具函数方案

#### 方案概述
创建 `lib/api-route-utils.ts` 提供统一的API路由处理模式。

#### 核心工具函数

```typescript
// 参数解析
export function parseQueryParams(request: NextRequest): QueryParams;

// 分页处理
export function createPagination(page: number, pageSize: number, total: number): Pagination;

// 数据库查询构建
export function buildDbQuery(query: any, params: QueryParams): any;

// Mock数据fallback
export async function withMockFallback<T>(
  dbOperation: () => Promise<{ data: T | null; error: any }>,
  mockOperation: () => T | Promise<T>
): Promise<ApiResponse<T>>;
```

#### 路由处理器工厂函数

```typescript
// 列表路由
export function createListRouteHandler<T>(options: ListRouteOptions<T>);

// 分页列表路由
export function createPaginatedRouteHandler<T>(options: PaginatedRouteOptions<T>);

// 详情路由
export function createDetailRouteHandler<T>(options: DetailRouteOptions<T>);

// 创建路由
export function createCreateRouteHandler<T, CreateDTO>(options: CreateRouteOptions<T, CreateDTO>);

// 更新路由
export function createUpdateRouteHandler<T, UpdateDTO>(options: UpdateRouteOptions<T, UpdateDTO>);

// 删除路由
export function createDeleteRouteHandler<T>(options: DeleteRouteOptions<T>);
```

#### 使用示例

```typescript
// api/teachers/route.ts - 重构后
import { createPaginatedRouteHandler, success } from '@/lib/api-route-utils';
import { getMockTeachers } from '@/lib/mock/teachers.mock';

export const GET = createPaginatedRouteHandler<Teacher>({
  tableName: 'teachers',
  mockList: getMockTeachers,
  defaultPageSize: 20,
  searchFields: ['name', 'employee_id'],
});
```

---

## 三、实施进度

### 3.1 已完成项目

| 序号 | 任务 | 状态 | 完成日期 |
|-----|------|-----|---------|
| 1 | 创建API响应工具库 (api-response.ts) | ✅ 已完成 | 2024-01 |
| 2 | 增强统一基础Hooks (useApi.ts) | ✅ 已完成 | 2024-01 |
| 3 | 标记废弃旧Hooks并保持向后兼容 | ✅ 已完成 | 2024-01 |
| 4 | 创建集中Mock数据管理目录和文件 | ✅ 已完成 | 2024-01 |
| 5 | 重构领域Hooks使用统一基础Hooks | ✅ 已完成 | 2024-01 |
| 6 | 创建API路由工具库 (api-route-utils.ts) | ✅ 已完成 | 2024-01 |
| 7 | 重构API路由使用统一工具和响应格式 | ✅ 已完成 | 2024-01 |
| 8 | 验证构建通过 | ✅ 已完成 | 2024-01 |

### 3.2 待完成项目（第三阶段）

| 序号 | 任务 | 优先级 | 预计工作量 |
|-----|------|-------|----------|
| 1 | 创建认证中间件 | 高 | 中 |
| 2 | 集成测试 | 中 | 中 |
| 3 | 性能优化 | 中 | 低 |
| 4 | 文档完善 | 低 | 低 |

---

## 四、文件变更清单

### 4.1 新增文件

| 文件路径 | 用途 |
|---------|------|
| `src/lib/api-response.ts` | API响应工具库 |
| `src/lib/api-route-utils.ts` | API路由工具库 |
| `src/lib/mock/index.ts` | Mock数据统一导出 |
| `src/lib/mock/teachers.mock.ts` | 教师Mock数据 |
| `src/lib/mock/students.mock.ts` | 学生Mock数据 |
| `src/lib/mock/classes.mock.ts` | 班级Mock数据 |
| `src/lib/mock/schedules.mock.ts` | 课表Mock数据 |
| `src/lib/mock/academic.mock.ts` | 教务Mock数据 |
| `src/lib/mock/access.mock.ts` | 门禁Mock数据 |
| `src/lib/mock/moral.mock.ts` | 德育Mock数据 |
| `src/lib/mock/general.mock.ts` | 总务Mock数据 |
| `src/hooks/useTeacherData.ts` | 教师数据Hook（重构） |
| `src/hooks/useStudentData.ts` | 学生数据Hook |
| `src/hooks/useAcademicData.ts` | 教务数据Hook |
| `src/hooks/useAccessData.ts` | 门禁数据Hook |
| `src/hooks/useMoralData.ts` | 德育数据Hook |
| `src/hooks/useGeneralAffairsData.ts` | 总务数据Hook |

### 4.2 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/hooks/useApi.ts` | 增强缓存管理、窗口聚焦刷新等能力 |
| `src/hooks/useData.ts` | 标记废弃，重新导出统一Hooks |
| `src/hooks/useDataFetch.ts` | 标记废弃，重新导出统一Hooks |
| `src/hooks/useCrudOperations.ts` | 标记废弃，重新导出统一Hooks |
| `src/app/api/teachers/route.ts` | 使用统一工具和Mock数据 |
| `src/app/api/teachers/[id]/full-profile/route.ts` | 使用统一工具和Mock数据 |
| `src/app/api/students/route.ts` | 使用统一工具和Mock数据 |
| `src/app/api/classes/route.ts` | 使用统一工具和Mock数据 |
| `src/app/api/base-schedules/route.ts` | 使用统一工具和Mock数据 |
| `src/app/api/leave-requests/route.ts` | 使用统一工具和Mock数据 |
| `src/app/api/expenses/route.ts` | 使用统一工具和Mock数据 |

---

## 五、使用指南

### 5.1 前端数据获取

```typescript
// 基础用法
import { useApi } from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error, refetch } = useApi<User[]>('/api/users');
  
  // 使用数据
}

// 分页查询
import { usePaginatedQuery } from '@/hooks/useApi';

function UserList() {
  const { data, pagination, loading, isFetching, setPage } = usePaginatedQuery<User>(
    '/api/users',
    { page: 1, pageSize: 20 }
  );
  
  // 分页逻辑
}

// 变更操作
import { useMutation } from '@/hooks/useApi';

function CreateUserForm() {
  const { mutate, loading, error } = useMutation<User, CreateUserDTO>(
    '/api/users',
    { method: 'POST' }
  );
  
  const handleSubmit = async (data: CreateUserDTO) => {
    const result = await mutate(data);
    if (result.success) {
      // 成功处理
    }
  };
}
```

### 5.2 领域特定Hook

```typescript
// 使用领域Hook
import { useTeachers, useTeacherMutations } from '@/hooks/useTeacherData';

function TeacherManagement() {
  const { data, loading, pagination } = useTeachers({ status: 'active' });
  const { create, update, remove } = useTeacherMutations();
  
  // 领域特定操作
}
```

### 5.3 创建新API路由

```typescript
// api/events/route.ts
import { 
  createPaginatedRouteHandler,
  createCreateRouteHandler 
} from '@/lib/api-route-utils';
import { getMockEvents } from '@/lib/mock/events.mock';

// GET - 分页列表
export const GET = createPaginatedRouteHandler<Event>({
  tableName: 'events',
  mockList: getMockEvents,
  defaultPageSize: 20,
  searchFields: ['title', 'description'],
});

// POST - 创建
export const POST = createCreateRouteHandler<Event, CreateEventDTO>({
  tableName: 'events',
  validate: (data) => {
    if (!data.title) return '标题不能为空';
    return null;
  },
});
```

---

## 六、后续优化建议

### 6.1 短期（1-2周）

1. **创建认证中间件**
   - 实现统一的认证检查逻辑
   - 集成角色权限控制
   - 添加请求日志记录

2. **完善API测试**
   - 为关键API添加单元测试
   - 集成测试覆盖主要业务流程

### 6.2 中期（1个月）

1. **性能优化**
   - 实现请求去重
   - 添加更智能的缓存策略
   - 优化大数据量查询

2. **监控与告警**
   - 添加API调用监控
   - 设置错误告警阈值
   - 建立性能基准

### 6.3 长期（持续）

1. **文档维护**
   - 保持API文档同步更新
   - 添加更多使用示例
   - 建立最佳实践指南

2. **架构演进**
   - 评估引入GraphQL的可能性
   - 考虑微服务拆分
   - 持续优化开发体验

---

## 七、风险与应对

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| 向后兼容性问题 | 中 | 保留旧Hooks作为重新导出，设置弃用警告 |
| Mock数据与真实数据不一致 | 低 | 建立Mock数据同步机制 |
| 类型推断问题 | 低 | 使用显式类型注解，添加类型测试 |
| 性能回归 | 低 | 添加性能监控，定期基准测试 |

---

## 八、总结

本次架构优化与整改工作已基本完成，建立了：

1. **统一的Hooks架构** - 单一数据来源，增强的功能支持
2. **标准化的API响应格式** - 一致的数据结构，清晰的错误处理
3. **集中的Mock数据管理** - 易于维护，便于测试
4. **高效的API路由工具** - 减少重复代码，提升开发效率

这些改进将显著提升代码的可维护性、一致性和开发效率，为后续功能开发和系统扩展奠定了坚实基础。

---

*文档维护者：智慧校园开发团队*  
*最后更新：2024年1月*
