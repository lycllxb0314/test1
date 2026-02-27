# 智慧校园系统 API 接口文档

## 概述

本文档描述了龙岩师范附属小学智慧校园管理平台的统一API接口规范，涵盖总务、教务、德育、教师空间四大系统的数据接口及跨系统数据关联服务。

## 架构设计

### 统一API客户端

所有前端请求通过 `src/services/api-client.ts` 进行统一封装，提供类型安全的接口调用。

```typescript
import { apiClient, teacherApi, studentApi, habitApi, roomApi, workflowApi, dataLinkApi } from '@/services/api-client';
```

### API响应格式

所有API统一返回以下格式：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

分页响应格式：

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 一、教师管理 API

### 1.1 教师列表

**GET** `/api/teachers`

查询参数：
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）
- `department`: 部门筛选
- `subject`: 学科筛选
- `status`: 状态筛选
- `search`: 搜索关键字

### 1.2 教师详情

**GET** `/api/teachers/:id`

### 1.3 教师档案

**GET** `/api/teachers/:id/profile`

返回教师完整档案，包含：
- 基本信息
- 教研活动统计
- 听课评课统计
- 集体备课统计
- 课题研究
- 培训研修记录
- 教学成果

---

## 二、学生管理 API

### 2.1 学生列表

**GET** `/api/students`

查询参数：
- `page`: 页码
- `pageSize`: 每页数量
- `classId`: 班级ID
- `grade`: 年级
- `status`: 状态
- `search`: 搜索关键字

### 2.2 学生详情

**GET** `/api/students/:id`

### 2.3 学生习惯档案

**GET** `/api/students/:id/habit-profile`

返回学生习惯养成完整档案，包含：
- 各习惯类别得分
- 总体评价
- 荣誉统计
- 成长轨迹
- 突出表现
- 待改进项

---

## 三、习惯养成 API

### 3.1 习惯目标

**GET** `/api/habit/goals`

查询参数：
- `category`: 习惯类别
- `gradeLevel`: 年级段

**POST** `/api/habit/goals`

创建习惯目标。

### 3.2 习惯评价记录

**GET** `/api/habit/assessments`

查询参数：
- `page`, `pageSize`: 分页
- `studentId`: 学生ID
- `classId`: 班级ID
- `category`: 习惯类别
- `type`: 评价类型（praise/improve）

**POST** `/api/habit/assessments`

创建评价记录（表扬/待改进）。

### 3.3 习惯之星

**GET** `/api/habit/stars`

查询参数：
- `month`: 月份
- `grade`: 年级
- `classId`: 班级ID
- `level`: 级别（class/grade/school）

**POST** `/api/habit/stars`

评选习惯之星。

---

## 四、教室管理 API

### 4.1 教室列表

**GET** `/api/rooms`

查询参数：
- `type`: 教室类型
- `building`: 教学楼
- `status`: 状态

### 4.2 教室预约

**GET** `/api/rooms/bookings`

查询参数：
- `roomId`: 教室ID
- `applicantId`: 申请人ID
- `status`: 预约状态
- `date`: 预约日期
- `startDate`, `endDate`: 日期范围

**POST** `/api/rooms/bookings`

创建预约申请（自动检查冲突）。

### 4.3 预约审批

**POST** `/api/rooms/bookings/:id/approve`

请求体：
```json
{
  "action": "approve|reject",
  "comment": "审批意见",
  "approverId": "审批人ID",
  "approverName": "审批人姓名",
  "approverRole": "审批人角色"
}
```

审批通过时自动创建保洁请求（如需要）。

---

## 五、工作流 API

### 5.1 流程配置

**GET** `/api/workflow/config?type={type}`

**POST** `/api/workflow/config`

创建或更新流程配置。

**DELETE** `/api/workflow/config?id={id}`

### 5.2 流程实例

**GET** `/api/workflow/instances`

查询参数：
- `type`: 流程类型
- `status`: 状态
- `applicantId`: 申请人ID
- `approverRole`: 审批角色（查询待审批）

**POST** `/api/workflow/instances`

发起申请（请假、维修、采购等）。

**PUT** `/api/workflow/instances`

审批操作。

---

## 六、数据关联服务 API

### 6.1 数据关联操作

**POST** `/api/data-link`

请求体：
```json
{
  "action": "操作类型",
  "params": { /* 操作参数 */ }
}
```

#### 支持的操作类型：

| action | 说明 | 参数 |
|--------|------|------|
| `leave-to-schedule` | 请假通过后触发调课 | `leaveInstanceId` |
| `sync-schedule` | 调课完成后同步课表 | `adjustmentId` |
| `booking-maintenance` | 教室预约关联维修 | `bookingId`, `maintenanceId` |
| `sync-student-habit` | 学生习惯数据同步 | `studentId` |
| `sync-teacher-research` | 教师教研数据同步 | `teacherId` |
| `update-class-stats` | 班级习惯统计更新 | `classId`, `month` |

---

## 七、跨系统数据关联关系

### 7.1 请假 → 调课 → 课表同步

```
请假申请审批通过
    ↓
triggerScheduleAdjustment()
    ↓
创建调课任务
    ↓
通知年段长
    ↓
年段长安排调课
    ↓
syncScheduleAfterAdjustment()
    ↓
更新课表
```

### 7.2 教室预约 → 维修申请

```
教室使用后发现设施问题
    ↓
linkBookingToMaintenance()
    ↓
创建维修申请
    ↓
关联预约记录
    ↓
总务系统处理维修
```

### 7.3 学生习惯 → 学生档案

```
习惯评价记录
    ↓
syncStudentHabitData()
    ↓
更新学生档案
    ↓
综合评价展示
```

### 7.4 教师教研 → 教师档案

```
教研活动参与
听课评课记录
集体备课
    ↓
syncTeacherResearchData()
    ↓
更新教师档案
    ↓
教师成长记录
```

### 7.5 班级习惯 → 班级统计

```
各学生习惯评价
    ↓
updateClassHabitStats()
    ↓
班级习惯统计
    ↓
预警学生识别
```

---

## 八、类型定义

所有类型定义位于 `src/types/index.ts`，核心类型包括：

- `User` - 用户信息
- `Teacher` / `TeacherProfile` / `TeacherResearchProfile` - 教师相关
- `Student` / `StudentHabitProfile` - 学生相关
- `ClassInfo` - 班级信息
- `WorkflowConfig` / `WorkflowInstance` - 工作流相关
- `Room` / `RoomBooking` - 教室相关
- `HabitGoal` / `StudentMonthlyGoal` / `HabitAssessment` / `HabitStar` - 习惯养成相关

---

## 九、开发指南

### 9.1 新增API接口

1. 在 `src/app/api/` 下创建路由文件
2. 在 `src/services/api-client.ts` 添加对应的调用方法
3. 在 `src/types/index.ts` 添加必要的类型定义

### 9.2 数据关联扩展

1. 在 `src/services/data-link-service.ts` 添加新的关联函数
2. 在 `src/app/api/data-link/route.ts` 添加新的操作类型
3. 更新本文档

### 9.3 错误处理

所有API统一返回错误格式：
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 十、变更日志

### 2024-01-XX - 数据接口统一

- 创建统一API客户端 `src/services/api-client.ts`
- 完善教师相关API接口（档案、教研活动、听课评课）
- 完善学生相关API接口（档案、习惯养成、小目标管理）
- 完善教室管理相关API接口（教室信息、预约审批、使用记录）
- 完善工作流相关API接口（请假、调课、维修流程）
- 创建数据关联服务 `src/services/data-link-service.ts`
- 打通各板块数据关系（请假→调课→课表同步等）
- 添加 `ClassInfo` 等缺失的类型定义
- 类型检查通过，服务运行正常
