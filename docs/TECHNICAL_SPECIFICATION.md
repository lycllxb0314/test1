# 龙岩师范附属小学智慧校园系统 - 技术规格文档

> 文档版本: v1.0  
> 最后更新: 2024年12月  
> 状态: 正式发布

---

## 目录

1. [系统概述](#1-系统概述)
2. [架构设计](#2-架构设计)
3. [模块职责](#3-模块职责)
4. [数据模型](#4-数据模型)
5. [API设计规范](#5-api设计规范)
6. [认证授权规范](#6-认证授权规范)
7. [前端规范](#7-前端规范)
8. [开发规范](#8-开发规范)
9. [部署规范](#9-部署规范)
10. [附录](#10-附录)

---

## 1. 系统概述

### 1.1 项目背景

龙岩师范附属小学智慧校园管理平台，旨在整合学校各业务系统，实现：
- **统一门户**：一个入口访问所有功能
- **统一身份认证**：单点登录，权限统一管理
- **统一数据管理**：数据互通，消除信息孤岛

### 1.2 系统定位

面向全校师生的综合管理平台，服务对象包括：
- 学校领导层（校长、书记、副校长）
- 部门负责人（教务主任、德育主任、总务主任）
- 教师群体（班主任、年段长、普通教师）
- 学生和家长

### 1.3 技术栈

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 框架 | Next.js (App Router) | 16.x |
| 运行时 | React | 19.x |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | 4.x |
| 组件库 | shadcn/ui | latest |
| 数据库 | PostgreSQL (Supabase) | - |
| 对象存储 | S3 兼容存储 | - |
| 认证 | JWT (jose) | 6.x |

### 1.4 项目规模

| 指标 | 数量 |
|------|------|
| TypeScript 文件 | 281 |
| API 路由 | 37 |
| 页面模块 | 9 |
| 用户角色 | 13 |
| 业务模块 | 6 |

---

## 2. 架构设计

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           前端层 (Next.js)                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 总务模块  │ │ 教务模块  │ │ 德育模块  │ │ 教师空间  │ │ 家长端   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    公共组件 & Hooks                           │  │
│  │  AuthProvider | MainLayout | UI Components | useApi          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API 层 (Next.js API Routes)                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      认证中间件                                │  │
│  │  JWT验证 | 角色检查 | 权限校验 | 路由保护                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ /api/    │ │ /api/    │ │ /api/    │ │ /api/    │ │ /api/    │  │
│  │ expenses │ │ schedules│ │ moral    │ │ teachers │ │ students │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           服务层                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  API Client      │  │  Mock Data       │  │  Utils           │  │
│  │  统一请求封装     │  │  集中Mock管理    │  │  工具函数        │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           数据层                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │  Supabase        │  │  S3 Storage      │                         │
│  │  PostgreSQL      │  │  文件存储        │                         │
│  └──────────────────┘  └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构规范

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由 (37+)
│   │   ├── auth/             # 认证相关
│   │   ├── expenses/         # 报销管理
│   │   ├── schedules/        # 课表管理
│   │   ├── moral/            # 德育活动
│   │   ├── teachers/         # 教师管理
│   │   ├── students/         # 学生管理
│   │   └── ...               # 其他业务API
│   ├── academic/             # 教务模块页面
│   ├── general/              # 总务模块页面
│   ├── moral/                # 德育模块页面
│   ├── teacher/              # 教师空间页面
│   ├── parent/               # 家长端页面
│   └── workflow/             # 工作流页面
│
├── components/               # React 组件
│   ├── ui/                   # shadcn/ui 基础组件
│   ├── layout/               # 布局组件
│   ├── common/               # 通用业务组件
│   └── [module]/             # 模块专属组件
│
├── lib/                      # 核心库
│   ├── auth/                 # 认证系统
│   │   ├── jwt.ts            # JWT 工具
│   │   ├── session.ts        # 会话管理
│   │   ├── permissions.ts    # 权限配置
│   │   └── route-protection.ts # 路由保护
│   ├── mock/                 # Mock 数据 (按模块组织)
│   └── utils.ts              # 工具函数
│
├── hooks/                    # React Hooks
│   ├── useApi.ts             # 统一数据获取 Hook
│   └── usePermissions.ts     # 权限检查 Hook
│
├── types/                    # TypeScript 类型定义
│   └── index.ts              # 统一类型导出
│
├── contexts/                 # React Context
│   └── AuthContext.tsx       # 认证上下文
│
├── config/                   # 配置文件
│   └── constants.ts          # 常量定义
│
└── services/                 # 服务封装
    └── api-client.ts         # API 客户端
```

---

## 3. 模块职责

### 3.1 模块总览

| 模块 | 英文标识 | 职责描述 | 主要用户 |
|------|----------|----------|----------|
| 总务后勤 | `general` | 报销、维修、采购、资产管理 | 总务主任、后勤人员 |
| 教务教研 | `academic` | 课表、考务、成绩、教学研究 | 教务主任、教务员、教师 |
| 德育管理 | `moral` | 德育活动、学生评价、家校沟通 | 德育主任、班主任 |
| 教师空间 | `teacher` | 个人信息、工作台、专业成长 | 全体教师 |
| 家长端 | `parent` | 学生信息查看、家校沟通 | 家长 |
| 主页管理 | `homepage` | 首页内容、公告、统计展示 | 全体用户 |

### 3.2 模块详细职责

#### 3.2.1 总务后勤模块 (general)

```
总务后勤
├── 报销管理
│   ├── 报销申请
│   ├── 报销审批
│   └── 报销统计
├── 维修管理
│   ├── 维修申请
│   ├── 维修派单
│   └── 维修验收
├── 采购管理
│   ├── 采购申请
│   ├── 采购审批
│   └── 采购验收
├── 资产管理
│   ├── 资产登记
│   ├── 资产盘点
│   └── 资产报废
├── 场地预约
│   ├── 场地查询
│   ├── 预约申请
│   └── 预约审批
└── 门禁管理
    ├── 出入记录
    └── 访客登记
```

#### 3.2.2 教务教研模块 (academic)

```
教务教研
├── 课表管理
│   ├── 基准课表
│   ├── 实际课表
│   └── 调课管理
├── 考务管理
│   ├── 考试安排
│   ├── 成绩录入
│   └── 成绩分析
├── 学籍管理
│   ├── 学生注册
│   ├── 学籍变动
│   └── 毕业管理
├── 教学研究
│   ├── 教研活动
│   ├── 公开课
│   └── 集体备课
├── 课后服务
│   ├── 课程设置
│   ├── 选课管理
│   └── 考勤记录
└── 教师工作量
    ├── 工作量统计
    └── 代课记录
```

#### 3.2.3 德育管理模块 (moral)

```
德育管理
├── 德育活动
│   ├── 活动计划
│   ├── 活动记录
│   └── 活动总结
├── 学生评价
│   ├── 德育评分
│   ├── 荣誉管理
│   └── 成长档案
├── 习惯养成
│   ├── 目标设置
│   ├── 每日打卡
│   └── 习惯之星
├── 家校沟通
│   ├── 通知公告
│   ├── 家长信
│   └── 在线咨询
└── 安全管理
    ├── 安全教育
    ├── 应急演练
    └── 隐患排查
```

### 3.3 API 路由清单

| 路径 | 模块 | 功能描述 |
|------|------|----------|
| `/api/auth/*` | 认证 | 登录、登出、刷新Token、获取当前用户 |
| `/api/expenses/*` | 总务 | 报销申请CRUD、审批、统计 |
| `/api/repair-requests` | 总务 | 维修申请管理 |
| `/api/rooms/*` | 总务 | 场地预约管理 |
| `/api/access/*` | 总务 | 门禁记录管理 |
| `/api/assets/*` | 总务 | 资产管理 |
| `/api/schedules/*` | 教务 | 课表管理 |
| `/api/schedule-changes` | 教务 | 调课管理 |
| `/api/exams/*` | 教务 | 考试管理 |
| `/api/grades/*` | 教务 | 成绩管理 |
| `/api/students/*` | 教务 | 学生管理 |
| `/api/classes/*` | 教务 | 班级管理 |
| `/api/courses/*` | 教务 | 课程管理 |
| `/api/research/*` | 教务 | 教研活动 |
| `/api/after-school-services` | 教务 | 课后服务 |
| `/api/workload/*` | 教务 | 工作量统计 |
| `/api/moral/activities` | 德育 | 德育活动 |
| `/api/moral/growth` | 德育 | 成长档案 |
| `/api/moral/plans` | 德育 | 德育计划 |
| `/api/habit/*` | 德育 | 习惯养成 |
| `/api/safety/*` | 德育 | 安全管理 |
| `/api/teachers/*` | 教师 | 教师管理 |
| `/api/leave-requests` | 教师 | 请假申请 |
| `/api/homeworks` | 教师 | 作业管理 |
| `/api/communications` | 家校 | 家校沟通 |
| `/api/enrollment/*` | 招生 | 新生注册 |
| `/api/data-collection/*` | 数据 | 数据采集 |
| `/api/workflow/*` | 工作流 | 通用工作流 |
| `/api/homepage/*` | 首页 | 首页数据 |

---

## 4. 数据模型

### 4.1 核心实体关系图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Teacher   │────▶│    Class    │
│  (用户)     │     │   (教师)    │     │   (班级)    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ LeaveRequest│     │  Schedule   │     │   Student   │
│  (请假)     │     │   (课表)    │     │   (学生)    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │   Parent    │
                                        │   (家长)    │
                                        └─────────────┘
```

### 4.2 核心实体定义

#### 4.2.1 用户与角色

```typescript
// 用户角色枚举
type UserRole = 
  | 'principal'         // 校长
  | 'secretary'         // 书记
  | 'vice_principal'    // 副校长
  | 'academic_director' // 教务主任
  | 'moral_director'    // 德育主任
  | 'general_director'  // 总务主任
  | 'academic_staff'    // 教务员
  | 'moral_staff'       // 德育员
  | 'head_teacher'      // 班主任
  | 'grade_leader'      // 年段长
  | 'teacher'           // 普通教师
  | 'staff'             // 后勤人员
  | 'student'           // 学生
  | 'parent';           // 家长

// 用户基本信息
interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  classId?: string;      // 班主任/学生所属班级
  className?: string;
  subjects?: string[];   // 教师任教学科
  children?: {           // 家长关联的学生
    id: string;
    name: string;
    classId: string;
    className: string;
  }[];
}
```

#### 4.2.2 教师与班级

```typescript
// 教师信息
interface Teacher {
  id: string;
  name: string;
  employeeNo: string;      // 工号
  gender: 'male' | 'female';
  phone: string;
  email: string;
  subjects: string[];      // 任教学科
  isHeadTeacher: boolean;  // 是否班主任
  classId?: string;        // 班主任所属班级
  className?: string;
  department?: string;     // 教研组
  position?: string;       // 职务
  avatar?: string;
}

// 班级信息
interface Class {
  id: string;
  name: string;            // 班级名称
  grade: number;           // 年级 (1-6)
  classNumber: number;     // 班级号
  headTeacherId: string;
  headTeacherName: string;
  studentCount: number;
  maleCount: number;
  femaleCount: number;
  classroomId?: string;
  classroomName?: string;
  status: 'active' | 'graduated';
}
```

#### 4.2.3 学生与家长

```typescript
// 学生信息
interface Student {
  id: string;
  studentNo: string;       // 学号
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  classId: string;
  className: string;
  grade?: number;
  gradeName?: string;
  headTeacherId?: string;
  headTeacherName?: string;
  status: '在校' | '请假' | '休学' | '毕业' | '转学';
  parents: Parent[];
  avatar?: string;
}

// 家长信息
interface Parent {
  id: string;
  name: string;
  relationship: '父亲' | '母亲' | '爷爷' | '奶奶' | '外公' | '外婆' | '其他';
  phone: string;
  isPrimary: boolean;      // 是否主要联系人
  wechat?: string;
}
```

#### 4.2.4 课表与调课

```typescript
// 课表项
interface ScheduleViewItem {
  id: string;
  classId: string;
  className: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  subject: string;
  dayOfWeek: number;       // 1-5 (周一至周五)
  period: number;          // 1-6 (第几节课)
  startTime: string;       // "08:00"
  endTime: string;         // "08:40"
  roomName: string;
  building: string;
  semester: string;        // "2024-2025-1"
  status: 'active' | 'cancelled' | 'substituted';
}

// 调课记录
interface ScheduleChange {
  id: string;
  leaveRequestId?: string;
  applicantId: string;
  applicantName: string;
  leaveType: '病假' | '事假' | '公假';
  leaveStartDate: string;
  leaveEndDate: string;
  originalClassId: string;
  originalClassName: string;
  originalSubject: string;
  originalWeekDay: number;
  originalPeriodIndex: number;
  status: 'pending' | 'processing' | 'completed';
  adjustType?: 'substitute' | 'swap' | 'cancel';
  substituteTeacherId?: string;
  substituteTeacherName?: string;
}
```

#### 4.2.5 报销与审批

```typescript
// 报销申请
interface ExpenseReimbursement {
  id: string;
  expenseNo: string;       // 报销单号
  title: string;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  department?: string;
  category: string;        // 报销类别
  items: ExpenseItem[];
  totalAmount: number;
  description?: string;
  attachments?: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvalFlow: ApprovalNode[];
  currentStep: number;
  approvalRecords: ApprovalRecord[];
  createdAt: string;
  updatedAt: string;
}

// 报销项目
interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  expenseDate: string;
  description?: string;
}

// 审批节点
interface ApprovalNode {
  id: string;
  name: string;
  approverRole: UserRole | UserRole[];
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}
```

### 4.3 数据库表设计要点

> 注意：当前项目使用 Mock 数据优先策略，数据库表设计作为参考

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户表 | id, name, role, phone, status |
| `teachers` | 教师表 | id, user_id, employee_no, subjects |
| `students` | 学生表 | id, student_no, class_id, status |
| `classes` | 班级表 | id, name, grade, head_teacher_id |
| `schedules` | 课表 | id, class_id, teacher_id, day_of_week, period |
| `expenses` | 报销 | id, expense_no, applicant_id, status |
| `leave_requests` | 请假 | id, applicant_id, type, start_date, end_date |

---

## 5. API设计规范

### 5.1 统一响应格式

所有 API 必须返回统一的 JSON 格式：

```typescript
// 成功响应
{
  "success": true,
  "data": T | T[],                    // 业务数据
  "pagination?": {                     // 分页数据（列表接口）
    "total": number,
    "page": number,
    "pageSize": number,
    "totalPages": number
  },
  "source": "database" | "mock"        // 数据来源
}

// 错误响应
{
  "success": false,
  "error": string,                     // 错误信息
  "code": string,                      // 错误码
  "details?": object                   // 详细错误信息（可选）
}
```

### 5.2 HTTP 状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 请求成功处理 |
| 201 | 已创建 | 资源创建成功 |
| 400 | 请求错误 | 参数缺失或格式错误 |
| 401 | 未认证 | 未登录或 Token 过期 |
| 403 | 无权限 | 已登录但权限不足 |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 内部错误 |

### 5.3 API 路由规范

```
# RESTful 风格
GET    /api/teachers          # 获取列表
GET    /api/teachers/:id      # 获取详情
POST   /api/teachers          # 创建
PUT    /api/teachers/:id      # 更新
DELETE /api/teachers/:id      # 删除

# 操作类接口
POST   /api/teachers/:id/activate    # 激活
POST   /api/expenses/:id/approve     # 审批
POST   /api/expenses/:id/reject      # 拒绝
```

### 5.4 查询参数规范

```
# 分页
?page=1&pageSize=20

# 搜索
?search=张三

# 筛选
?status=active&grade=1

# 排序
?sort=created_at&order=desc

# 关联数据
?include=class,subjects
```

### 5.5 错误码定义

| 错误码 | 含义 |
|--------|------|
| `AUTH_FAILED` | 认证失败 |
| `TOKEN_EXPIRED` | Token 已过期 |
| `FORBIDDEN` | 权限不足 |
| `MODULE_FORBIDDEN` | 无模块访问权限 |
| `PERMISSION_DENIED` | 无操作权限 |
| `NOT_FOUND` | 资源不存在 |
| `VALIDATION_ERROR` | 参数校验失败 |
| `INTERNAL_ERROR` | 服务器内部错误 |

---

## 6. 认证授权规范

### 6.1 JWT 会话管理

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   登录请求    │────▶│  验证凭证    │────▶│  生成Token   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  返回用户信息 │◀────│  设置Cookie  │◀────│ Token Pair   │
└──────────────┘     └──────────────┘     │ Access: 2h   │
                                          │ Refresh: 7d  │
                                          └──────────────┘
```

### 6.2 Token 结构

```typescript
// JWT Payload
interface JwtPayload {
  userId: string;
  name: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;      // 签发时间
  exp: number;      // 过期时间
  iss: string;      // 签发者
  aud: string;      // 受众
}
```

### 6.3 Cookie 配置

| Cookie 名称 | 用途 | 有效期 | HttpOnly |
|-------------|------|--------|----------|
| `smart_campus_access_token` | 访问令牌 | 2小时 | true |
| `smart_campus_refresh_token` | 刷新令牌 | 7天 | true |
| `smart_campus_user_id` | 用户ID | 7天 | false |

### 6.4 权限模型

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    角色     │────▶│    模块     │────▶│    权限     │
│  UserRole   │     │ ModuleType  │     │ Permission  │
└─────────────┘     └─────────────┘     └─────────────┘

权限级别:
- view: 查看
- edit: 编辑
- approve: 审批
- manage: 管理
- admin: 超级管理
```

### 6.5 角色权限矩阵

| 角色 | 总务 | 教务 | 德育 | 教师空间 | 家长端 |
|------|------|------|------|----------|--------|
| 校长 | admin | admin | admin | admin | admin |
| 书记 | - | - | admin | edit | view |
| 副校长 | manage | manage | manage | manage | view |
| 教务主任 | - | admin | - | manage | - |
| 德育主任 | - | - | admin | edit | manage |
| 总务主任 | admin | - | - | - | - |
| 教务员 | - | manage | - | - | - |
| 德育员 | - | - | manage | - | view |
| 班主任 | view | view | edit | admin | view |
| 年段长 | view | manage | view | admin | view |
| 普通教师 | view | view | view | admin | - |
| 家长 | - | - | - | - | admin |
| 学生 | - | - | - | - | - |

### 6.6 路由保护

```typescript
// 使用示例
export const GET = protectedRoute(handler, { 
  module: 'academic', 
  permission: 'view',
  optional: true,  // 允许未登录访问
});

export const POST = protectedRoute(handler, { 
  module: 'academic', 
  permission: 'edit' 
});

export const GET = adminOnlyRoute(handler);
```

---

## 7. 前端规范

### 7.1 组件组织规范

```
components/
├── ui/                    # shadcn/ui 基础组件
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
│
├── layout/                # 布局组件
│   ├── MainLayout.tsx     # 主布局
│   ├── Sidebar.tsx        # 侧边栏
│   └── Header.tsx         # 顶部栏
│
├── common/                # 通用业务组件
│   ├── PageHeader.tsx     # 页面标题
│   ├── DataTable.tsx      # 数据表格
│   ├── FilterBar.tsx      # 筛选栏
│   └── StatusBadge.tsx    # 状态标签
│
└── [module]/              # 模块专属组件
    ├── TeacherCard.tsx
    ├── ScheduleGrid.tsx
    └── ...
```

### 7.2 状态管理规范

```typescript
// 使用 Context + Hooks
// AuthContext: 全局认证状态
// useApi: 数据获取和缓存

// 数据获取 Hook 使用示例
const { data, loading, error, refetch } = useTeachers({
  page: 1,
  pageSize: 20,
});

// 权限检查 Hook 使用示例
const { canView, canEdit } = usePermissions('academic');
```

### 7.3 样式规范

```typescript
// 使用 Tailwind CSS 语义化变量
// ❌ 禁止硬编码颜色
<div className="bg-[#ff0000]">  // 错误

// ✅ 使用语义化变量
<div className="bg-primary text-primary-foreground">  // 正确
<div className="bg-card text-card-foreground">        // 正确

// 圆角规范
// ❌ 禁止硬编码圆角
<div className="rounded-[8px]">  // 错误

// ✅ 使用预设圆角
<div className="rounded-md">     // 正确
<div className="rounded-lg">     // 正确
```

### 7.4 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `TeacherCard.tsx` |
| Hook文件 | camelCase + use前缀 | `useApi.ts` |
| 工具函数 | camelCase | `formatDate()` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 类型/接口 | PascalCase | `User`, `UserRole` |
| 枚举 | PascalCase | `ModuleType` |

---

## 8. 开发规范

### 8.1 分支策略

```
main                    # 生产分支
  └── develop           # 开发分支
        ├── feature/*   # 功能分支
        ├── fix/*       # 修复分支
        └── refactor/*  # 重构分支
```

### 8.2 提交规范

```
feat: 新增功能
fix: 修复Bug
refactor: 重构代码
docs: 文档更新
style: 代码格式调整
test: 测试相关
chore: 构建/工具相关

示例:
feat(expenses): 添加报销审批功能
fix(auth): 修复JWT过期时间计算错误
refactor(api): 统一API响应格式
```

### 8.3 代码审查清单

- [ ] 类型定义完整，无 `any` 类型
- [ ] API 返回格式符合规范
- [ ] 敏感操作有权限校验
- [ ] 错误处理完善
- [ ] 无硬编码颜色和圆角
- [ ] 组件职责单一
- [ ] 无重复代码

### 8.4 测试要求

| 类型 | 覆盖范围 | 要求 |
|------|----------|------|
| API测试 | 所有接口 | 冒烟测试必须通过 |
| 类型检查 | 全量代码 | `tsc --noEmit` 无错误 |
| 构建检查 | 全量代码 | `pnpm build` 成功 |

---

## 9. 部署规范

### 9.1 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# JWT
JWT_SECRET=your-secret-key

# 存储
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...
```

### 9.2 构建命令

```bash
# 开发环境
pnpm dev

# 构建
pnpm build

# 生产运行
pnpm start

# 类型检查
pnpm ts-check
```

### 9.3 健康检查

```bash
# 检查服务状态
curl -I http://localhost:5000

# 检查 API 状态
curl http://localhost:5000/api/auth/current
```

---

## 10. 附录

### 10.1 快速登录账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 校长 | 校长 | 123456 |
| 教务主任 | 教务主任 | 123456 |
| 德育主任 | 德育主任 | 123456 |
| 总务主任 | 总务主任 | 123456 |
| 班主任 | 班主任 | 123456 |
| 年段长 | 年段长 | 123456 |
| 普通教师 | 教师 | 123456 |
| 家长 | 家长 | 123456 |

### 10.2 常用 API 端点

```bash
# 登录
POST /api/auth/login
Body: { "username": "校长", "password": "123456" }

# 获取当前用户
GET /api/auth/current

# 刷新 Token
POST /api/auth/refresh

# 获取教师列表
GET /api/teachers

# 获取学生列表
GET /api/students

# 获取课表
GET /api/schedules?classId=xxx

# 获取报销列表
GET /api/expenses
```

### 10.3 技术债务清单

| 优先级 | 描述 | 状态 |
|--------|------|------|
| P0 | 统一所有API认证保护 | 进行中 |
| P0 | 完善数据库Schema | 待开始 |
| P1 | 添加自动化测试 | 待开始 |
| P1 | 完善错误处理 | 进行中 |
| P2 | 性能优化 | 待开始 |
| P2 | 文档完善 | 进行中 |

### 10.4 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2024-12 | 初始版本，建立技术规格基线 |

---

> 本文档是项目的"宪法"，所有开发活动应遵循本文档规范。  
> 如需修改，需经过团队讨论并通过后方可生效。
