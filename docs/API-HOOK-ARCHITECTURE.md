# 智慧校园系统 - API与Hook架构文档

## 概述

本文档描述了智慧校园系统的API和Hook架构设计，确保前后端数据交互的一致性和可维护性。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端应用层                               │
├─────────────────────────────────────────────────────────────────┤
│  页面组件 (app/*)                                               │
│  ├── /academic/students    - 学生管理                           │
│  ├── /academic/teachers    - 教师管理                           │
│  ├── /teacher/profile      - 教师个人档案                        │
│  └── ...                                                       │
├─────────────────────────────────────────────────────────────────┤
│  数据Hooks (hooks/*)                                            │
│  ├── useStudentData.ts     - 学生数据Hook                       │
│  ├── useTeacherData.ts     - 教师数据Hook                       │
│  ├── useAcademicData.ts    - 教务数据Hook                       │
│  ├── useHabitData.ts       - 习惯养成数据Hook                    │
│  ├── useGeneralAffairsData.ts - 总务数据Hook                    │
│  ├── useAccessData.ts      - 门禁数据Hook                       │
│  ├── useRoomData.ts        - 场地数据Hook                       │
│  ├── useMoralData.ts       - 德育数据Hook                       │
│  └── useData.ts/useDataFetch.ts - 通用数据Hook                  │
├─────────────────────────────────────────────────────────────────┤
│  API客户端 (services/api-client.ts)                             │
│  └── 统一封装所有API调用，提供类型安全的接口                      │
├─────────────────────────────────────────────────────────────────┤
│  API路由 (app/api/*)                                            │
│  ├── /api/students         - 学生CRUD                           │
│  ├── /api/teachers         - 教师CRUD                           │
│  ├── /api/auth/*           - 认证相关                           │
│  └── ...                                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 核心文件

### 1. API客户端

**文件**: `src/services/api-client.ts`

统一的API客户端，封装所有HTTP请求方法：

```typescript
// 类型定义
export interface ApiResponse<T> { success: boolean; data?: T; error?: string; }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; totalPages: number; }
export interface QueryParams { [key: string]: string | number | boolean | undefined; }

// 使用方式
import { apiClient } from '@/services/api-client';

// GET请求
const result = await apiClient.get<Student[]>('/students', { grade: 6 });

// POST请求
const result = await apiClient.post<Student>('/students', studentData);

// PUT请求
const result = await apiClient.put<Student>('/students/123', updateData);

// DELETE请求
const result = await apiClient.delete('/students/123');
```

### 2. 向后兼容层

**文件**: `src/lib/api-helpers.ts`

重新导出 `services/api-client.ts` 的内容，保持向后兼容：

```typescript
// 已废弃，请直接使用 '@/services/api-client'
export { apiClient, type ApiResponse, type PaginatedResponse, type QueryParams } from '@/services/api-client';
```

### 3. 通用数据Hooks

**文件**: `src/hooks/useDataFetch.ts`

```typescript
// 列表数据获取
export function useDataFetch<T>(endpoint: string, params?: Record<string, string>);

// 单条数据获取
export function useSingleDataFetch<T>(endpoint: string, id: string | null);

// 数据操作（增删改）
export function useDataMutation<T, R = T>();
```

### 4. 业务数据Hooks

| Hook文件 | 用途 | 主要接口 |
|---------|------|---------|
| `useStudentData.ts` | 学生管理 | `useStudentsList`, `useStudentFullProfile`, `useStudentMutation` |
| `useTeacherData.ts` | 教师管理 | `useTeachersList`, `useTeacherFullProfile`, `useTeacherMutation` |
| `useAcademicData.ts` | 教务管理 | `useCourses`, `useSchedules`, `useExams`, `useGrades`, `useAttendance` |
| `useHabitData.ts` | 习惯养成 | `useSchoolHabitStats`, `useHabitGoals`, `useHabitStars`, `useHabitAssessments` |
| `useGeneralAffairsData.ts` | 总务管理 | `useFinancialRecords`, `useSafetyInspections`, `useAssets` |
| `useAccessData.ts` | 门禁管理 | `useAccessStatistics`, `useAccessDevices`, `useAccessRecords` |
| `useRoomData.ts` | 场地管理 | `useRooms`, `useRoomBookings`, `useRoomBookingMutation` |
| `useMoralData.ts` | 德育管理 | `useMoralAlerts`, `useGrowthRecords` |

## API接口规范

### 响应格式

所有API接口应返回统一的响应格式：

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "source": "database" | "mock"  // 数据来源
}

// 错误响应
{
  "success": false,
  "error": "错误信息"
}
```

### 分页响应

```typescript
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Mock数据Fallback

所有API接口都应提供Mock数据作为fallback，确保在数据库不可用时页面仍能正常显示：

```typescript
// API实现示例
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('students').select('*');
    
    if (error) {
      // 数据库查询失败，返回Mock数据
      return NextResponse.json({
        success: true,
        data: mockStudents,
        source: 'mock'
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      source: 'database'
    });
  } catch (error) {
    // 异常处理，返回Mock数据
    return NextResponse.json({
      success: true,
      data: mockStudents,
      source: 'mock'
    });
  }
}
```

## 类型定义

### 核心类型位置

所有核心类型定义统一放在 `src/types/index.ts`：

```typescript
// 学生相关
export interface Student { ... }
export interface StudentFullProfile { ... }
export interface StudentAcademicRecord { ... }
export interface StudentHonor { ... }

// 教师相关
export interface TeacherProfile { ... }
export interface TeacherRecord { ... }
export interface TeacherHonor { ... }

// 其他业务类型...
```

### Hook内部类型

部分Hook内部定义的类型（如 `useAcademicData.ts` 中的 `Course`）是特定业务场景的扩展类型，与 `types/index.ts` 中的基础类型并不冲突：
- `types/index.ts` 中的 `Course` 是课程基础信息
- `useAcademicData.ts` 中的 `Course` 是课程安排信息（含教师、班级等）

## 最佳实践

### 1. 使用统一API客户端

```typescript
// ✅ 推荐
import { apiClient } from '@/services/api-client';
const result = await apiClient.get('/students');

// ❌ 不推荐（直接使用fetch）
const response = await fetch('/api/students');
const result = await response.json();
```

### 2. 使用统一Hook

```typescript
// ✅ 推荐：使用业务Hook
import { useStudentsList } from '@/hooks/useStudentData';
const { data, loading, error, refetch } = useStudentsList({ grade: '6' });

// ❌ 不推荐：直接调用API
const [students, setStudents] = useState([]);
useEffect(() => {
  fetch('/api/students').then(res => res.json()).then(data => setStudents(data.data));
}, []);
```

### 3. 类型安全

```typescript
// ✅ 推荐：使用类型参数
const result = await apiClient.get<Student[]>('/students');

// ✅ 推荐：使用类型化的Hook
const { data } = useStudentsList(); // data 自动推断为 StudentListItem[]
```

## 最近更新

### 2024年更新

1. **统一API客户端**: 合并 `lib/api-helpers.ts` 和 `services/api-client.ts`，统一使用 `@/services/api-client`
2. **学生管理重构**: 
   - 扩展 `StudentFullProfile` 完整档案类型
   - 创建 `/api/students` 和 `/api/students/[id]/full-profile` 接口
   - 创建 `useStudentData.ts` Hook
   - 重构学生列表页和详情页
3. **教师管理重构**:
   - 创建 `/api/teachers` 和 `/api/teachers/[id]/full-profile` 接口
   - 创建 `useTeacherData.ts` Hook
   - 统一教师详情页和个人档案页的数据获取
