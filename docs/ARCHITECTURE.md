# 六层架构说明

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Components                           │
│                      (UI展示层)                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ 调用
┌─────────────────────────▼───────────────────────────────────────┐
│                         Hook 层                                 │
│              (React框架适配器)                                   │
│  - 状态管理 (useState, useReducer)                              │
│  - 副作用处理 (useEffect)                                        │
│  - 缓存控制                                                      │
│  - 响应式数据获取                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ 调用
┌─────────────────────────▼───────────────────────────────────────┐
│                      API Client 层                              │
│                   (HTTP请求封装)                                 │
│  - 请求拦截器                                                    │
│  - 响应拦截器                                                    │
│  - 错误处理                                                      │
│  - 重试机制                                                      │
│  - 缓存管理                                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────────────┐
│                        API 层                                   │
│                   (Next.js API Routes)                          │
│  - 路由处理                                                      │
│  - 参数验证                                                      │
│  - 权限检查                                                      │
│  - 响应格式化                                                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ 调用
┌─────────────────────────▼───────────────────────────────────────┐
│                       Service 层                                │
│                     (业务逻辑层)                                 │
│  - 业务规则验证                                                  │
│  - 数据转换                                                      │
│  - 事务管理                                                      │
│  - 领域逻辑                                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ 调用
┌─────────────────────────▼───────────────────────────────────────┐
│                      Repository 层                              │
│                     (数据访问层)                                 │
│  - 数据库操作                                                    │
│  - ORM映射                                                       │
│  - 查询构建                                                      │
│  - 数据缓存                                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                       Database                                  │
│                     (Supabase)                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
src/
├── abstract/                    # 抽象层
│   ├── index.ts                 # 统一导出
│   └── interfaces/
│       └── repository.interface.ts
│
├── repositories/                # Repository层
│   ├── base.repository.ts       # 基础Repository
│   ├── student.repository.ts
│   ├── teacher.repository.ts
│   ├── class.repository.ts
│   ├── course.repository.ts
│   ├── schedule.repository.ts
│   ├── attendance.repository.ts
│   └── grade.repository.ts
│
├── services/                    # Service层
│   ├── base.service.ts          # 基础Service
│   ├── student.service.ts
│   ├── teacher.service.ts
│   ├── class.service.ts
│   ├── attendance.service.ts
│   └── grade.service.ts
│
├── app/api/                     # API层
│   ├── students/
│   ├── teachers/
│   ├── classes/
│   ├── courses/
│   ├── schedules/
│   ├── attendance/
│   ├── grades/
│   └── leave-requests/
│
├── lib/
│   └── api-client/              # API Client层
│       ├── index.ts             # 统一导出
│       ├── types.ts             # 类型定义
│       ├── cache.ts             # 缓存模块
│       ├── core.ts              # 核心实现
│       └── clients.ts           # 领域客户端
│
└── hooks/                       # Hook层
    ├── index.ts                 # 统一导出
    ├── core/
    │   └── use-query.ts         # 核心查询Hook
    ├── useTeachers.ts
    ├── useStudents.ts
    └── ...其他业务Hooks
```

## 各层职责

### 1. Repository层（数据访问层）

**职责**：封装所有数据库操作，提供统一的数据访问接口

**文件位置**：`src/repositories/`

**特点**：
- 继承 `BaseRepository`，获得通用CRUD能力
- 实现特定领域的数据查询方法
- 不包含业务逻辑，只负责数据存取

**示例**：
```typescript
// repositories/student.repository.ts
export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students');
  }

  async findByClass(classId: string): Promise<Student[]> {
    return this.findAll({ class_id: classId });
  }
}
```

### 2. Service层（业务逻辑层）

**职责**：实现业务规则和领域逻辑

**文件位置**：`src/services/`

**特点**：
- 继承 `BaseService`，获得通用业务处理能力
- 调用Repository获取数据
- 处理业务规则验证、数据转换
- 统一结果格式

**示例**：
```typescript
// services/student.service.ts
export class StudentService extends BaseService<Student> {
  constructor() {
    super(new StudentRepository());
  }

  async validateStudent(data: Partial<Student>): Promise<boolean> {
    // 业务规则验证
    if (!data.student_no) {
      throw new Error('学号不能为空');
    }
    return true;
  }
}
```

### 3. API层（HTTP接口层）

**职责**：暴露HTTP接口，处理请求响应

**文件位置**：`src/app/api/`

**特点**：
- Next.js App Router API Routes
- 参数验证和权限检查
- 调用Service处理业务
- 统一响应格式

**示例**：
```typescript
// app/api/students/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await studentService.getPaginated({
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 10,
  });
  return NextResponse.json(result);
}
```

### 4. API Client层（HTTP请求封装层）

**职责**：封装HTTP请求，提供类型安全的客户端

**文件位置**：`src/lib/api-client/`

**特点**：
- `ApiClient` 核心类，处理请求/响应拦截
- 领域客户端类，提供业务相关API调用
- 内置缓存、重试、超时控制
- 统一错误处理

**示例**：
```typescript
// 使用领域客户端
import { studentApi } from '@/lib/api-client';

// 获取学生列表
const response = await studentApi.getList({ page: 1, pageSize: 10 });

// 获取单个学生
const student = await studentApi.getById('student-123');

// 创建学生
const newStudent = await studentApi.create({
  name: '张三',
  student_no: '2024001',
});
```

### 5. Hook层（React框架适配层）

**职责**：将API Client与React状态管理结合

**文件位置**：`src/hooks/`

**特点**：
- `useQuery` - 数据查询
- `usePaginatedQuery` - 分页查询
- `useMutation` - 数据变更
- 内置缓存和自动刷新
- 处理组件生命周期

**示例**：
```typescript
// 使用现有的业务Hook
import { useTeachers } from '@/hooks';

function TeacherList() {
  const { data, loading, error } = useTeachers();
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {data?.map(teacher => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
    </div>
  );
}
```

## 数据流向

### 查询流程（GET）
```
Component → Hook → API Client → API Route → Service → Repository → Database
    ↓         ↓         ↓           ↓           ↓           ↓          ↓
   渲染   状态管理   HTTP请求    参数验证    业务逻辑    数据查询    返回数据
```

### 变更流程（POST/PUT/DELETE）
```
Component → Hook → API Client → API Route → Service → Repository → Database
    ↓         ↓         ↓           ↓           ↓           ↓          ↓
  触发    乐观更新   HTTP请求    参数验证    业务规则    数据写入    提交事务
```

## 设计原则

1. **单一职责**：每层只负责自己的核心职责
2. **依赖倒置**：上层依赖下层抽象，不依赖具体实现
3. **开闭原则**：通过继承和接口扩展，而非修改现有代码
4. **接口隔离**：每层提供清晰的接口，隐藏内部实现

## 使用规范

1. **禁止跨层调用**：Component 应该调用 Hook，不应直接调用 API Client
2. **禁止反向依赖**：下层不能依赖上层
3. **统一错误处理**：每层都要处理自己可能出现的错误
4. **保持一致性**：遵循统一的命名和返回格式规范
