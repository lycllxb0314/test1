# 统一分页 Hook 使用指南

## 概述

`usePagination` 是一个统一的分页 Hook，整合了数据获取和前端分页，一个 Hook 完成所有操作。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    usePagination Hook                        │
├─────────────────────────────────────────────────────────────┤
│  数据获取层（后端）                                           │
│  - 全量获取数据（支持大数据量）                                 │
│  - 支持筛选条件                                               │
│  - 自动重试和错误处理                                          │
├─────────────────────────────────────────────────────────────┤
│  前端分页层                                                   │
│  - 用户可选每页显示数量（10/30/50）                            │
│  - 页码导航                                                   │
│  - 数据切片                                                   │
└─────────────────────────────────────────────────────────────┘
```

## 基本使用

### 1. 简单列表页面

```tsx
import { usePagination } from '@/hooks';
import type { Teacher } from '@/types';

interface TeacherFilters {
  search?: string;
  department?: string;
}

function TeachersPage() {
  const { 
    data,           // 当前页数据
    loading, 
    error,
    page, pageSize, total, totalPages,
    goToPage, prevPage, nextPage, setPageSize,
    filters, setFilters,
    refetch 
  } = usePagination<Teacher, TeacherFilters>({
    fetchFn: async (filters, page, pageSize) => {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.department && { department: filters.department }),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await fetch(`/api/teachers?${params}`);
      return response.json();
    },
    initialFilters: { department: 'all' },
  });

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {/* 搜索筛选 */}
      <input 
        value={filters.search || ''} 
        onChange={(e) => setFilters({ search: e.target.value })} 
      />
      
      {/* 数据列表 */}
      {data.map(teacher => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
      
      {/* 分页控制 */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
```

### 2. 带数据转换的页面

```tsx
function StudentsPage() {
  const { data, loading, ... } = usePagination<StudentInfo, StudentFilters>({
    fetchFn: async (filters, page, pageSize) => {
      const response = await fetch(`/api/students?...`);
      return response.json();
    },
    // 数据转换：API 返回格式 → 前端使用格式
    transform: (data) => data.map(s => ({
      ...s,
      gradeName: GRADE_NAMES[s.grade] || '未知',
      statusColor: getStatusColor(s.status),
    })),
    initialFilters: { status: 'all' },
  });
  
  // ...
}
```

### 3. 复杂筛选场景

```tsx
function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  const { data, loading, ... } = usePagination<ClassInfo>({
    fetchFn: async (filters, page, pageSize) => {
      // 使用外部筛选状态
      const params = new URLSearchParams({
        search: searchTerm,
        grade: gradeFilter,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await fetch(`/api/classes?${params}`);
      return response.json();
    },
    // 依赖项：外部筛选变化时重新获取
    deps: [searchTerm, gradeFilter],
  });
  
  // ...
}
```

## API 参考

### UsePaginationOptions

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fetchFn` | `(filters, page, pageSize) => Promise<ApiResponse>` | 必填 | 数据获取函数 |
| `defaultPageSize` | `number` | `10` | 默认每页显示数量 |
| `pageSizeOptions` | `readonly number[]` | `[10, 30, 50]` | 每页数量选项 |
| `initialFilters` | `F` | `{}` | 初始筛选条件 |
| `enabled` | `boolean` | `true` | 是否启用 |
| `transform` | `(data: unknown[]) => T[]` | - | 数据转换函数 |
| `maxTotal` | `number` | `10000` | 最大获取数量 |
| `deps` | `unknown[]` | `[]` | 依赖项 |
| `onSuccess` | `(data, total) => void` | - | 成功回调 |
| `onError` | `(error) => void` | - | 错误回调 |

### UsePaginationResult

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `data` | `T[]` | 当前页数据（前端分页后） |
| `allData` | `T[]` | 全部数据（后端获取的所有数据） |
| `loading` | `boolean` | 加载状态 |
| `isFetching` | `boolean` | 是否正在获取 |
| `error` | `string \| null` | 错误信息 |
| `page` | `number` | 当前页码 |
| `pageSize` | `number` | 每页显示数量 |
| `total` | `number` | 总数量 |
| `totalPages` | `number` | 总页数 |
| `pageSizeOptions` | `readonly number[]` | 每页数量选项 |
| `goToPage` | `(page: number) => void` | 跳转到指定页 |
| `prevPage` | `() => void` | 上一页 |
| `nextPage` | `() => void` | 下一页 |
| `setPageSize` | `(size: number) => void` | 设置每页显示数量 |
| `filters` | `F` | 当前筛选条件 |
| `setFilters` | `(filters: Partial<F>) => void` | 设置筛选条件 |
| `refetch` | `() => Promise<void>` | 重新获取数据 |

## 迁移指南

### 从旧方式迁移

**旧方式（两步操作）：**
```tsx
// 步骤1：获取数据
const { data, loading } = useFetchAll(fetchTeachers);
// 步骤2：前端分页
const pagination = useFrontendPagination(data, { defaultPageSize: 10 });

// 使用
pagination.paginatedData.map(...)
pagination.goToPage(1)
```

**新方式（一步到位）：**
```tsx
// 一个 hook 完成所有
const { data, loading, page, goToPage, ... } = usePagination({
  fetchFn: fetchTeachers,
});

// 使用
data.map(...)
goToPage(1)
```

## 最佳实践

1. **类型安全**：始终指定泛型参数 `usePagination<T, F>`
2. **筛选状态**：使用 `filters` 和 `setFilters` 管理，不要混合外部状态
3. **数据转换**：在 `transform` 中统一处理格式转换
4. **错误处理**：提供 `onError` 回调，显示友好错误信息
5. **依赖管理**：如果使用外部状态作为筛选条件，添加到 `deps` 数组
