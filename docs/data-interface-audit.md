# 数据接口统一检查报告

## 检查时间
2024年

## 检查结果概述

### ✅ 已完成的工作

1. **统一API客户端**
   - 创建 `src/services/api-client.ts`，封装所有后端API调用
   - 提供类型安全的接口调用方式

2. **数据库访问统一**
   - 所有API路由使用 `getSupabaseClient()` 统一数据库客户端
   - 无直接数据库连接，全部通过API层访问

3. **身份认证改进**
   - 创建 `/api/auth/login` 登录接口
   - 创建 `/api/auth/current` 获取当前用户接口
   - 更新 `AuthContext` 支持真实API登录（生产环境自动启用）

4. **数据迁移API**
   - 创建 `/api/migrate` 用于将mock数据导入数据库

---

## ⚠️ 待改进的问题

### 1. 大量页面使用Mock数据

以下页面直接使用了本地 mock 数据，需要逐步替换为统一API调用：

#### 教务管理模块
| 文件 | Mock数据 | 需要替换 |
|------|----------|----------|
| `src/app/academic/attendance/page.tsx` | `mockAttendance`, `mockLeaveRecords` | ✅ |
| `src/app/academic/classes/page.tsx` | `mockClasses` | ✅ |
| `src/app/academic/classes/[id]/schedule/page.tsx` | `mockClassInfo`, `mockScheduleSlots` | ✅ |
| `src/app/academic/exams/page.tsx` | `mockExams` | ✅ |
| `src/app/academic/grades/page.tsx` | `mockGrades` | ✅ |
| `src/app/academic/research/page.tsx` | `mockLessonGroups`, `mockObservations` | ✅ |
| `src/app/academic/schedule/page.tsx` | `mockClasses`, `mockTeachers`, `mockScheduleSlots` | ✅ |

#### 教室管理模块
| 文件 | Mock数据 | 需要替换 |
|------|----------|----------|
| `src/app/academic/rooms/page.tsx` | `mockRooms`, `mockBookings` | ✅ |
| `src/app/academic/rooms/approval/page.tsx` | `mockPendingApprovals`, `mockAllBookings` | ✅ |
| `src/app/academic/rooms/booking/page.tsx` | `mockAvailableRooms`, `mockMyBookings` | ✅ |
| `src/app/academic/rooms/calendar/page.tsx` | `mockRooms`, `mockScheduleData` | ✅ |

#### 德育/习惯养成模块
| 文件 | Mock数据 | 需要替换 |
|------|----------|----------|
| `src/app/moral/habit/overview/page.tsx` | 本地模拟数据 | ✅ |
| `src/app/moral/habit/students/page.tsx` | 本地模拟数据 | ✅ |
| `src/app/moral/habit/goals/page.tsx` | 本地模拟数据 | ✅ |
| `src/app/moral/habit/stars/page.tsx` | 本地模拟数据 | ✅ |
| `src/app/moral/habit/reports/page.tsx` | 本地模拟数据 | ✅ |

---

### 2. 身份认证仍依赖Mock数据

**当前状态**：
- `AuthContext` 在开发环境仍使用 `mockUsers` 进行登录验证
- 生产环境可通过 `USE_REAL_API` 开关启用真实API登录

**待完成**：
- 将mock用户数据迁移到数据库
- 完善密码加密存储

---

## 📋 改进建议

### 短期（优先）

1. **创建数据服务Hooks**
   ```typescript
   // 示例：src/hooks/useTeachers.ts
   export function useTeachers(params?: QueryParams) {
     const [data, setData] = useState<Teacher[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     
     useEffect(() => {
       teacherApi.getTeachers(params).then(result => {
         if (result.success && result.data) {
           setData(result.data.data);
         }
         setIsLoading(false);
       });
     }, [params]);
     
     return { data, isLoading };
   }
   ```

2. **逐步替换Mock数据**
   - 优先替换高频使用的数据（用户、班级、教室）
   - 使用 `useEffect` + `useState` 或 SWR 进行数据获取

### 中期

1. **引入数据缓存**
   - 使用 SWR 或 React Query 进行数据缓存和自动刷新
   - 减少重复请求，提升用户体验

2. **实现乐观更新**
   - 在提交数据时立即更新UI
   - 后台同步到服务器，失败时回滚

### 长期

1. **实现服务端渲染（SSR）**
   - 对首屏数据使用服务端渲染
   - 提升页面加载速度和SEO

---

## 🔄 数据迁移流程

### 步骤1：确保数据库表结构正确

需要创建以下核心表：
- `users` - 用户表（含教师、学生、家长等）
- `teachers` - 教师详细信息表
- `students` - 学生详细信息表
- `classes` - 班级表
- `rooms` - 教室表
- `room_bookings` - 教室预约表
- `habit_goals` - 习惯目标表
- `habit_assessments` - 习惯评价表
- `habit_stars` - 习惯之星表

### 步骤2：执行数据迁移

调用迁移API：
```bash
curl -X POST http://localhost:5000/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"type": "users"}'  # 迁移用户数据

curl -X POST http://localhost:5000/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"type": "classes"}'  # 迁移班级数据
```

### 步骤3：验证迁移结果

```bash
curl http://localhost:5000/api/migrate
```

---

## 📊 统一API调用示例

### 前端调用

```typescript
import { teacherApi, studentApi, habitApi, roomApi } from '@/services/api-client';

// 获取教师列表
const result = await teacherApi.getTeachers({ department: '语文组', page: 1 });
if (result.success && result.data) {
  console.log('教师列表:', result.data.data);
}

// 获取学生习惯档案
const habitProfile = await studentApi.getStudentHabitProfile('student-001');

// 创建习惯评价
await habitApi.createAssessment({
  studentId: 'student-001',
  category: 'civilization',
  type: 'praise',
  title: '主动问好',
  content: '早上主动向老师问好',
  score: 5,
});
```

### 数据关联调用

```typescript
import { dataLinkApi } from '@/services/api-client';

// 请假通过后触发调课
await dataLinkApi.triggerScheduleAdjustment('leave-instance-id');

// 同步学生习惯数据
await dataLinkApi.syncStudentHabitData('student-001');
```

---

## ✅ 检查清单

- [x] 统一API客户端创建
- [x] 数据库访问层统一
- [x] 身份认证API创建
- [x] AuthContext支持真实API
- [x] 数据迁移API创建
- [ ] 所有页面Mock数据替换（进行中）
- [ ] 数据缓存层实现
- [ ] 生产环境测试

---

## 📁 相关文件

### 新增文件
```
src/services/
├── api-client.ts          # 统一API客户端
└── data-link-service.ts   # 数据关联服务

src/app/api/
├── auth/
│   ├── login/route.ts     # 登录接口
│   └── current/route.ts   # 获取当前用户
├── migrate/route.ts       # 数据迁移接口
├── teachers/...           # 教师相关接口
├── students/...           # 学生相关接口
├── habit/...              # 习惯养成接口
├── rooms/...              # 教室管理接口
└── data-link/route.ts     # 数据关联接口
```

### 修改文件
```
src/contexts/AuthContext.tsx  # 支持真实API登录
src/types/index.ts            # 新增ClassInfo类型
```
