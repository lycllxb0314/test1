# 智慧校园系统数据接口架构文档

## 概述

本文档描述龙岩师范附属小学智慧校园管理系统的数据接口架构，包括API接口、数据获取Hooks和数据流转关系。

## 架构原则

1. **前后端分离**：前端通过API接口与后端交互，实现松耦合
2. **统一响应格式**：所有API返回统一的JSON格式 `{ success: boolean, data?: any, error?: string }`
3. **类型安全**：使用TypeScript定义所有数据类型，确保类型安全
4. **Hooks封装**：通过自定义Hooks封装数据获取逻辑，简化组件代码
5. **Fallback机制**：API调用失败时提供模拟数据，保证页面可用

## API接口目录

### 1. 认证模块 (Authentication)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/current` | GET | 获取当前登录用户 |

### 2. 用户管理模块 (Users)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/teachers` | GET/POST | 教师列表/创建教师 |
| `/api/teachers/[id]` | GET/PUT/DELETE | 教师详情/更新/删除 |
| `/api/teachers/[id]/profile` | GET | 教师档案详情 |
| `/api/students` | GET/POST | 学生列表/创建学生 |
| `/api/students/[id]` | GET/PUT/DELETE | 学生详情/更新/删除 |
| `/api/students/[id]/habit-profile` | GET | 学生习惯养成档案 |
| `/api/classes` | GET/POST | 班级列表/创建班级 |

### 3. 教务管理模块 (Academic)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/courses` | GET/POST | 课程列表/创建课程 |
| `/api/schedules` | GET/POST/PUT | 课表查询/创建/更新 |
| `/api/schedule-changes` | GET/POST/PUT | 调课申请列表/创建/审批 |
| `/api/exams` | GET/POST/PUT | 考试列表/创建/更新 |
| `/api/grades` | GET/POST/PUT | 成绩列表/录入/更新 |
| `/api/attendance` | GET/POST/PUT | 考勤记录列表/创建/更新 |
| `/api/leave-requests` | GET/POST/PUT | 请假申请列表/创建/审批 |

### 4. 教研活动模块 (Research)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/research/activities` | GET/POST | 教研活动列表/创建 |
| `/api/research/observations` | GET/POST | 听课评课记录列表/创建 |
| `/api/research/preparations` | GET/POST | 集体备课记录列表/创建 |

### 5. 教室管理模块 (Rooms)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/rooms` | GET/POST/PUT/DELETE | 教室列表/创建/更新/删除 |
| `/api/rooms/bookings` | GET/POST/PUT | 教室预约列表/创建/审批 |
| `/api/rooms/bookings/[id]/approve` | PUT | 预约审批 |

### 6. 习惯养成模块 (Habit)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/habit/stats/school` | GET | 全校习惯统计数据 |
| `/api/habit/stars` | GET/POST | 习惯之星列表/创建 |
| `/api/habit/goals` | GET/POST/PUT/DELETE | 小目标列表/创建/更新/删除 |
| `/api/habit/assessments` | GET/POST | 习惯评价记录列表/创建 |

### 7. 总务管理模块 (General Affairs)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/repair-requests` | GET/POST/PUT | 维修申请列表/创建/更新 |
| `/api/assets` | GET/POST/PUT/DELETE | 资产列表/创建/更新/删除 |

### 8. 主页管理模块 (Homepage)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/homepage` | GET/PUT | 主页内容/更新 |
| `/api/homepage/news` | GET/POST/PUT/DELETE | 新闻动态列表/创建/更新/删除 |
| `/api/homepage/honors` | GET/POST/PUT/DELETE | 荣誉奖项列表/创建/更新/删除 |
| `/api/homepage/migrate` | POST | 主页数据迁移 |

### 9. 工作流模块 (Workflow)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/workflow/config` | GET/POST/PUT | 流程配置列表/创建/更新 |
| `/api/workflow/instances` | GET/POST | 流程实例列表/创建 |
| `/api/workflow/migrate` | POST | 工作流数据迁移 |

### 10. 数据迁移模块 (Migration)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/migrate` | POST | 全量数据迁移 |
| `/api/data-link` | GET/POST | 数据关联服务 |

### 11. 文件服务模块 (File Service)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/upload` | POST | 文件上传 |
| `/api/search-images` | GET | 图片搜索 |

## 数据获取Hooks

### 1. 基础数据 Hooks (`useData.ts`)

```typescript
// 用户数据
useTeachers(filters?)    // 获取教师列表
useStudents(filters?)    // 获取学生列表
useClasses(filters?)     // 获取班级列表

// 教师操作
createTeacher(data)      // 创建教师
updateTeacher(id, data)  // 更新教师
deleteTeacher(id)        // 删除教师
```

### 2. 教务数据 Hooks (`useAcademicData.ts`)

```typescript
// 课程与课表
useCourses(filters?)      // 获取课程列表
useSchedules(filters?)    // 获取课表

// 考试与成绩
useExams(filters?)        // 获取考试列表
useGrades(filters?)       // 获取学生成绩

// 考勤与请假
useAttendance(filters?)   // 获取考勤记录
useLeaveRequests(filters?) // 获取请假申请

// 调课
useScheduleChanges(filters?) // 获取调课申请
```

### 3. 教室数据 Hooks (`useRoomData.ts`)

```typescript
// 教室管理
useRooms(filters?)        // 获取教室列表
useRoomBookings(filters?) // 获取预约列表
useRoomCalendar(roomId, startDate, endDate) // 获取教室日历

// 预约操作
createRoomBooking(booking)  // 创建预约
approveRoomBooking(id, action, ...) // 审批预约
```

### 4. 习惯养成 Hooks (`useHabitData.ts`)

```typescript
// 统计数据
useSchoolHabitStats(month?) // 获取全校习惯统计

// 目标管理
useHabitGoals(filters?)   // 获取小目标列表

// 习惯之星
useHabitStars(filters?)   // 获取习惯之星列表

// 评价记录
useHabitAssessments(filters?) // 获取评价记录
```

### 5. 总务数据 Hooks (`useGeneralAffairsData.ts`)

```typescript
// 维修申请
useRepairRequests(filters?)  // 获取维修申请列表
createRepairRequest(data)    // 创建维修申请
updateRepairRequest(id, data) // 更新维修申请

// 资产管理
useAssets(filters?)   // 获取资产列表
createAsset(data)     // 创建资产
updateAsset(id, data) // 更新资产
deleteAsset(id)       // 删除资产
```

## 数据类型定义

### 核心实体类型

```typescript
// 教师
interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  gender: 'male' | 'female';
  phone?: string;
  email?: string;
  department?: string;
  subjects?: string[];
  gradeRole?: string;      // 年段长角色
  departmentRole?: string; // 部门负责人角色
  status: 'active' | 'inactive';
  createdAt: string;
}

// 学生
interface Student {
  id: string;
  name: string;
  studentNumber: string;
  gender: 'male' | 'female';
  grade: number;
  classId: string;
  className?: string;
  birthDate?: string;
  parentPhone?: string;
  address?: string;
  status: 'active' | 'graduated' | 'transferred';
  createdAt: string;
}

// 班级
interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  headTeacherId?: string;
  headTeacherName?: string;
  studentCount: number;
  classroom?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}
```

### 习惯养成类型

```typescript
// 习惯类别
type HabitCategory = 
  | 'civilization' | 'writing' | 'reading' | 'sports' 
  | 'safety' | 'hygiene' | 'aesthetic' | 'labor';

// 习惯之星
interface HabitStar {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  className: string;
  month: string;
  categories: HabitCategory[];
  totalScore: number;
  achievements?: string;
}

// 小目标
interface HabitGoal {
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
}
```

### 教务管理类型

```typescript
// 请假类型
type LeaveType = 'sick' | 'personal' | 'official' | 'maternity' | 'other';
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// 请假申请
interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  type: LeaveType;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
  status: LeaveStatus;
  currentStep: number;
}

// 考勤类型
type AttendanceType = 'attendance' | 'leave' | 'late' | 'early_leave' | 'absent';

// 考试
interface Exam {
  id: string;
  name: string;
  examType: string;
  semester: string;
  examDate: string;
  grades: number[];
  subjects: string[];
  status: string;
}
```

### 总务管理类型

```typescript
// 维修申请
type RepairType = 'electrical' | 'plumbing' | 'furniture' | 'equipment' | 'building' | 'network' | 'other';
type RepairStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';

interface RepairRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  type: RepairType;
  location: string;
  description: string;
  urgency: 'urgent' | 'high' | 'normal' | 'low';
  status: RepairStatus;
}

// 资产
type AssetCategory = 'equipment' | 'furniture' | 'electronic' | 'vehicle' | 'building' | 'other';
type AssetStatus = 'in_use' | 'idle' | 'maintenance' | 'scrapped' | 'lost';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
  department: string;
  location: string;
  status: AssetStatus;
}
```

## 数据流转关系

### 1. 请假→调课→课表同步

```
教师请假申请
    ↓
年段长审批通过
    ↓
触发调课需求
    ↓
年段长安排调课
    ↓
调课审批通过
    ↓
自动同步课表
```

### 2. 教室预约→维修申请

```
教师预约教室
    ↓
审批通过使用
    ↓
发现设施问题
    ↓
创建维修申请
    ↓
关联预约记录
```

### 3. 习惯评价→习惯之星

```
日常习惯评价
    ↓
月度汇总统计
    ↓
评选习惯之星
    ↓
更新学生档案
```

## 统一API客户端

使用 `api-client.ts` 提供统一的API调用封装：

```typescript
import { apiClient } from '@/services/api-client';

// 获取教师列表
const teachers = await apiClient.getTeachers({ department: '教务处' });

// 创建请假申请
const leave = await apiClient.createLeaveRequest({
  applicantId: 't001',
  type: 'sick',
  startTime: '2024-03-20 08:00',
  endTime: '2024-03-20 17:00',
  reason: '身体不适',
});
```

## 错误处理

所有API调用都应处理错误情况：

```typescript
const { data, loading, error, refetch } = useTeachers();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
// 使用 data
```

## 性能优化建议

1. **合理使用缓存**：Hooks内部已实现自动缓存，避免重复请求
2. **分页加载**：大数据量列表使用分页参数
3. **按需加载**：只在需要时获取详细数据
4. **并行请求**：多个独立数据可并行获取

## 版本历史

- v1.0.0 (2024-03): 初始架构设计
- v1.1.0 (2024-03): 添加习惯养成、教室管理模块
- v1.2.0 (2024-03): 完善教务管理、总务管理模块
- v1.3.0 (当前): 全面打通统一数据接口，建立完整架构
