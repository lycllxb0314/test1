# 软件设计文档 (SDD)

**项目名称**: 龙岩师范附属小学智慧校园管理平台  
**文档版本**: v4.0  
**编制日期**: 2026年3月  
**编制单位**: 智慧校园项目组

**版本历史**:
- v4.0 (2026-03): **全面重构**：根据实际代码结构重写技术架构，详细描述各子系统实现细节
- v3.1 (2024-03): 手动排课系统重构
- v3.0 (2024-03): 数据孤岛整改

---

## 目录

1. [概述](#1-概述)
2. [架构设计](#2-架构设计)
3. [模块设计](#3-模块设计)
4. [数据设计](#4-数据设计)
5. [接口设计](#5-接口设计)
6. [认证授权设计](#6-认证授权设计)
7. [部署设计](#7-部署设计)
8. [设计约束](#8-设计约束)
9. [验收准则](#9-验收准则)
10. [附录](#10-附录)

---

## 1. 概述

### 1.1 文档目的

本文档是龙岩师范附属小学智慧校园管理平台的软件设计文档(SDD)，旨在：
- 为开发团队提供详细的技术实现指南
- 为测试团队提供验收测试依据
- 为运维团队提供部署维护参考
- 记录系统的完整技术架构和实现细节

### 1.2 项目背景

龙岩师范附属小学是一所具有百年历史的省级示范小学，学校现有36个教学班，教职工120余人，学生1800余人。智慧校园管理平台旨在实现：

- **统一门户**: 一站式访问所有业务系统
- **统一身份认证**: 单点登录，权限精细化管理
- **统一数据管理**: 消除数据孤岛，实现数据共享
- **家校互联**: 家长端实时了解孩子在校情况

### 1.3 系统范围

智慧校园平台包含以下核心业务系统：

| 系统名称 | 主要功能 | 页面数 | 目标用户 |
|----------|----------|--------|----------|
| 教务教研系统 | 手动排课、学生管理、教师管理、考试管理、教室管理 | 15 | 教务员、教师 |
| 总务后勤系统 | 门禁管理、财务管理、资产管理、维修管理 | 12 | 后勤人员 |
| 德育管理系统 | 习惯养成、德育活动、行为评价 | 4 | 德育员、班主任 |
| 教师空间 | 个人中心、请假管理、调课管理、习惯打卡 | 16 | 全体教师 |
| 家长端 | 孩子信息、习惯记录、成绩查询、公告通知 | 9 | 学生家长 |
| 仪表盘 | 校长仪表盘、副校长仪表盘 | 7 | 学校领导 |
| 门户管理 | 首页新闻、荣誉展示、轮播图 | API | 系统管理员 |

**统计数据**：
- 前端页面文件：84个
- API路由文件：156个
- 组件文件：79个
- 总代码行数：约124,902行

### 1.4 术语定义

| 术语 | 定义 |
|------|------|
| RBAC | 基于角色的访问控制 (Role-Based Access Control) |
| JWT | JSON Web Token，用于身份认证的令牌标准 |
| SSE | Server-Sent Events，服务器推送事件 |
| HMR | Hot Module Replacement，热模块替换 |
| BFF | Backend For Frontend，服务于前端的后端层 |
| 手动排课 | 教务主任通过点击课表格子直接安排课程的方式 |
| 习惯养成 | 学生日常行为习惯评价与追踪系统（八大类别） |
| 群组 | 行政部门组织单元（校长室、教务处、德育处、总务处） |

### 1.5 参考文档

| 文档名称 | 说明 |
|----------|------|
| 需求规格说明书 | 功能需求详细说明 |
| 数据库设计文档 | 数据表结构说明 |
| API接口规范 | API接口详细定义 |

---

## 2. 架构设计

### 2.1 总体架构

采用**前后端分离**的BFF架构，整体分为四层：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         展示层 (Presentation)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 总务系统  │ │ 教务系统  │ │ 德育系统  │ │教师空间  │ │ 家长端   │   │
│  │ /general │ │ /academic│ │  /moral  │ │ /teacher │ │ /parent  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │领导仪表盘│ │  登录页   │ │  首页    │ │ 新闻页面 │                │
│  │/dashboard│ │  /login  │ │    /     │ │  /news   │                │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      应用层 (BFF - Next.js API Routes)                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     /api/*  (156个路由)                       │    │
│  │  /api/auth  /api/teachers  /api/students  /api/habit  ...    │    │
│  │  /api/academic  /api/general  /api/moral  /api/parent  ...   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         服务层 (Service)                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │认证服务  │ │文件服务  │ │消息服务  │ │审批服务  │ │存储服务  │       │
│  │ auth    │ │ upload  │ │ message │ │approval │ │ storage │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         数据层 (Data)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ PostgreSQL  │  │  S3 Storage │  │   Redis     │                  │
│  │ (Supabase)  │  │ (对象存储)   │  │   (缓存)    │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术架构

#### 2.2.1 前端技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Next.js** | 16.x | 全栈框架 | App Router模式，支持SSR/SSG |
| **React** | 19.x | UI组件库 | 最新版本，支持Suspense |
| **TypeScript** | 5.x | 类型安全 | 严格模式，完整类型定义 |
| **Tailwind CSS** | 4.x | 样式系统 | 原子化CSS |
| **shadcn/ui** | latest | 组件库 | 基于Radix UI，可定制 |
| **Recharts** | 2.x | 图表库 | 数据可视化 |
| **Lucide React** | latest | 图标库 | 统一图标风格 |
| **Sonner** | latest | Toast通知 | 轻量级提示组件 |
| **date-fns** | 4.x | 日期处理 | 日期格式化和计算 |
| **zod** | 4.x | 参数校验 | 运行时类型验证 |

#### 2.2.2 后端技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Next.js API Routes** | 16.x | BFF层API | 服务端接口，支持中间件 |
| **Supabase Client** | 2.x | 数据库客户端 | PostgreSQL数据库连接 |
| **jose** | 6.x | JWT处理 | Token签名和验证 |
| **zod** | 4.x | 参数校验 | API请求验证 |
| **coze-coding-dev-sdk** | 0.7.x | AI能力集成 | LLM调用、图片生成等 |

#### 2.2.3 基础设施

| 服务 | 提供商 | 用途 |
|------|--------|------|
| PostgreSQL | Supabase | 主数据库 |
| S3兼容对象存储 | 集成服务 | 文件存储（图片、附件） |
| LLM服务 | 集成服务 | AI对话、智能分析 |

#### 2.2.4 开发工具

| 工具 | 用途 | 说明 |
|------|------|------|
| **pnpm** | 包管理器 | **强制使用**，禁止npm/yarn |
| **Coze CLI** | 项目脚手架 | 初始化、开发、构建、部署 |
| **ESLint** | 代码规范检查 | 自动化代码质量检查 |
| **TypeScript** | 类型检查 | 编译时类型验证 |

### 2.3 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── academic/                 # 教务教研系统 (15页面)
│   │   ├── classes/             # 班级管理
│   │   ├── students/            # 学生管理
│   │   ├── teachers/            # 教师管理
│   │   ├── exams/               # 考试管理
│   │   ├── rooms/               # 教室管理
│   │   ├── manual-schedule/     # 手动排课
│   │   ├── school-schedule/     # 学校课表
│   │   └── workload/            # 工作量统计
│   ├── general/                  # 总务后勤系统 (12页面)
│   │   ├── access/              # 门禁管理
│   │   ├── assets/              # 资产管理
│   │   ├── finance/             # 财务管理
│   │   ├── repairs/             # 维修管理
│   │   ├── security/            # 安全管理
│   │   └── staff/               # 后勤人员
│   ├── moral/                    # 德育管理系统 (4页面)
│   │   ├── habit/               # 习惯养成
│   │   └── activities/          # 德育活动
│   ├── teacher/                  # 教师空间 (16页面)
│   │   ├── profile/             # 个人中心
│   │   ├── leave/               # 请假管理
│   │   ├── adjust/              # 调课管理
│   │   ├── habit/               # 习惯打卡
│   │   ├── class/               # 班级管理
│   │   ├── grade/               # 年级管理
│   │   ├── schedule/            # 我的课表
│   │   ├── room-booking/        # 教室预约
│   │   └── collection/          # 信息收集
│   ├── parent/                   # 家长端 (9页面)
│   │   ├── children/            # 孩子信息
│   │   ├── habit/               # 习惯记录
│   │   ├── grades/              # 成绩查询
│   │   ├── announcements/       # 公告通知
│   │   └── collection/          # 信息填写
│   ├── dashboard/                # 领导仪表盘 (7页面)
│   │   ├── principal/           # 校长仪表盘
│   │   ├── secretary/           # 书记仪表盘
│   │   ├── academic-vice-principal/  # 教学副校长
│   │   ├── moral-vice-principal/     # 德育副校长
│   │   └── general-vice-principal/   # 总务副校长
│   ├── api/                      # API路由 (156个)
│   │   ├── auth/                # 认证相关
│   │   ├── academic/            # 教务API
│   │   ├── habit/               # 习惯养成API
│   │   ├── approvals/           # 审批流程API
│   │   ├── messages/            # 消息系统API
│   │   ├── portal/              # 门户管理API
│   │   └── ...                  # 其他API
│   ├── login/                    # 登录页面
│   ├── globals.css               # 全局样式
│   └── layout.tsx                # 根布局
├── components/                   # React组件 (79个)
│   ├── ui/                      # shadcn/ui组件库
│   ├── auth/                    # 认证相关组件
│   ├── approval/                # 审批流程组件
│   ├── dashboard/               # 仪表盘组件
│   ├── habit/                   # 习惯养成组件
│   ├── messaging/               # 消息组件
│   ├── portal/                  # 门户组件
│   ├── schedule/                # 课表组件
│   ├── student/                 # 学生组件
│   └── teacher/                 # 教师组件
├── types/                        # TypeScript类型定义
│   ├── index.ts                 # 主类型文件 (约2500行)
│   ├── approval.ts              # 审批流程类型
│   ├── messages.ts              # 消息系统类型
│   └── leave-adjust.ts          # 请假调课类型
├── hooks/                        # 自定义Hooks (19个)
│   ├── useApi.ts                # 通用API请求Hook
│   ├── useAuth.ts               # 认证Hook
│   ├── usePermissions.ts        # 权限Hook
│   ├── useTeachers.ts           # 教师数据Hook
│   ├── useStudents.ts           # 学生数据Hook
│   ├── useClasses.ts            # 班级数据Hook
│   ├── useParents.ts            # 家长数据Hook
│   ├── useApprovals.ts          # 审批流程Hook
│   ├── useMessages.ts           # 消息系统Hook
│   ├── useGroups.ts             # 群组管理Hook
│   └── ...
├── lib/                          # 工具库
│   ├── auth/                    # 认证工具
│   ├── auth-client.ts           # 客户端认证
│   ├── api-route-utils.ts       # API工具函数
│   ├── api-response.ts          # API响应格式
│   ├── pagination-config.ts     # 分页配置
│   ├── schedule-config.ts       # 课表配置
│   └── ...
├── contexts/                     # React Context
│   └── AuthContext.tsx          # 认证上下文
├── storage/                      # 存储层
│   └── database/
│       └── supabase-client.ts   # Supabase客户端
├── config/                       # 配置文件
│   └── index.ts                 # 全局配置
└── services/                     # 服务层
```

### 2.4 认证授权架构

#### 2.4.1 JWT 会话管理

系统采用 **JWT (JSON Web Token)** 实现无状态会话管理，使用 `jose` 库进行 Token 签名和验证。

**双 Token 机制**：

| Token 类型 | 有效期 | 存储位置 | 用途 |
|-----------|--------|---------|------|
| Access Token | 2小时 | HttpOnly Cookie + localStorage | API 访问授权 |
| Refresh Token | 7天 | HttpOnly Cookie + localStorage | 刷新 Access Token |

**Token 自动刷新机制**：
```typescript
// authFetch 封装：支持401自动刷新token并重试
export async function authFetch<T>(url: string, options: RequestInit = {}): Promise<{ data?: T; error?: string; success: boolean }> {
  // 1. 第一次请求
  let response = await fetch(url, withAuth(options));
  let result = await response.json();
  
  // 2. 如果返回401，尝试刷新token并重试
  if (response.status === 401 || result.code === 'AUTH_FAILED') {
    // 使用单例模式防止并发刷新
    const refreshed = await ensureFreshToken();
    if (refreshed) {
      response = await fetch(url, withAuth(options));
      result = await response.json();
    } else {
      // 刷新失败，清除登录状态，触发全局登出事件
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }
  return result.success ? { data: result.data, success: true } : { error: result.error, success: false };
}
```

#### 2.4.2 角色权限体系

**主要角色 (UserRole)**：
```typescript
export type UserRole = 
  // === 学校领导层 ===
  | 'principal'                    // 校长
  | 'secretary'                    // 书记
  | 'academic_vice_principal'      // 教学副校长
  | 'moral_vice_principal'         // 德育副校长
  | 'general_vice_principal'       // 总务副校长
  // === 教师群体 ===
  | 'head_teacher'                 // 班主任
  | 'subject_teacher'              // 科任教师
  | 'skill_teacher'                // 技能课教师
  // === 家长 ===
  | 'parent';                      // 家长
```

**兼任职务 (AdministrativeRole)**：
```typescript
export type AdministrativeRole = 
  | 'academic_director'            // 教务主任
  | 'moral_director'               // 德育主任
  | 'general_director'             // 总务主任
  | 'grade_leader'                 // 年段长
  | 'research_group_leader'        // 教研组组长
  | 'research_group_deputy_leader' // 教研组副组长
  | 'young_pioneer_counselor';     // 少先队大队辅导员
```

**权限判断逻辑**：
- 用户可访问某模块 = 主角色拥有权限 OR 兼任职务拥有权限 OR 所属群组拥有权限
- 敏感数据访问 = 班主任/科任教师身份验证

#### 2.4.3 群组体系

**群组类型**：
```typescript
export type GroupType = 
  | 'principal_office'    // 校长室
  | 'academic_office'     // 教务处
  | 'moral_office'        // 德育处
  | 'general_office';     // 总务处
```

**群组通知分发逻辑**：
- **校长室群组**：发给群组成员的个人消息中心
- **其他群组**：发到对应部门工作台的"部门通知"（部门广播）

### 2.5 数据流架构

#### 2.5.1 API请求流程

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   前端组件   │───▶│  useApi/Hook │───▶│  API Route  │───▶│  Supabase   │
│  (page.tsx) │    │ (useXxx.ts) │    │ (route.ts)  │    │  (PostgreSQL)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
   用户交互           状态管理+缓存       业务逻辑+权限        数据存储
                      authFetch
```

#### 2.5.2 Hooks层设计

系统使用自定义Hooks封装数据获取和状态管理：

| Hook | 用途 | 对应API |
|------|------|---------|
| `useApi` | 通用API请求，支持分页、缓存、错误处理 | 所有API |
| `useAuth` | 认证状态管理 | `/api/auth/*` |
| `useTeachers` | 教师数据管理 | `/api/teachers/*` |
| `useStudents` | 学生数据管理 | `/api/students/*` |
| `useClasses` | 班级数据管理 | `/api/classes/*` |
| `useParents` | 家长数据管理 | `/api/parents/*` |
| `useApprovals` | 审批流程管理 | `/api/approvals/*` |
| `useMessages` | 消息系统管理 | `/api/messages/*` |
| `useGroups` | 群组管理 | `/api/groups/*` |
| `useLeaveAdjust` | 请假调课管理 | `/api/leave-requests/*` |

### 2.6 组件设计规范

#### 2.6.1 UI组件库

基于 `shadcn/ui` 构建，位于 `src/components/ui/` 目录：

```
ui/
├── button.tsx          # 按钮组件
├── card.tsx            # 卡片组件
├── dialog.tsx          # 对话框组件
├── dropdown-menu.tsx   # 下拉菜单
├── form.tsx            # 表单组件
├── input.tsx           # 输入框
├── select.tsx          # 选择器
├── table.tsx           # 表格组件
├── tabs.tsx            # 标签页
├── toast.tsx           # Toast提示
└── ...                 # 其他组件
```

#### 2.6.2 业务组件

按功能模块组织：

```
components/
├── approval/           # 审批流程组件
│   ├── ApprovalActionDialog.tsx    # 审批操作对话框
│   └── PublishNotificationDialog.tsx # 发布通知对话框
├── dashboard/          # 仪表盘组件
├── habit/              # 习惯养成组件
├── messaging/          # 消息组件
├── portal/             # 门户组件
├── schedule/           # 课表组件
├── student/            # 学生组件
└── teacher/            # 教师组件
```

---

## 3. 模块设计

### 3.1 教务教研系统 (/academic)

#### 3.1.1 功能概述

教务教研系统是学校的核心业务系统，包含以下子系统：

| 子系统 | 路径 | 功能描述 |
|--------|------|----------|
| 手动排课 | `/academic/manual-schedule` | 教务主任手动安排课程 |
| 学生管理 | `/academic/students` | 学生信息CRUD、详情查看 |
| 教师管理 | `/academic/teachers` | 教师信息CRUD、工作量统计 |
| 班级管理 | `/academic/classes` | 班级信息管理、班级教师分配 |
| 考试管理 | `/academic/exams` | 考试安排、成绩录入 |
| 教室管理 | `/academic/rooms` | 教室资源管理、预约审批 |
| 学校课表 | `/academic/school-schedule` | 全校课表查看 |
| 工作量统计 | `/academic/workload` | 教师工作量计算与统计 |

#### 3.1.2 手动排课系统

**设计理念**：采用教务主任手动排课模式，非智能排课算法。

**核心功能**：
1. **课表矩阵视图**：以表格形式展示班级-节次-星期的三维课表
2. **右键菜单操作**：支持复制、粘贴、清空等快捷操作
3. **教师选择规则引擎**：
   - 语文课 → 只能选择本班语文老师
   - 数学课 → 只能选择本班数学老师
   - 技能课 → 选择对应学科教师
4. **课时参考悬浮窗**：显示推荐课时分配

**数据结构**：
```typescript
interface ScheduleSlot {
  id: string;
  classId: string;
  className: string;
  grade: number;
  weekDay: WeekDay;           // 星期几 (1-7)
  periodIndex: number;         // 第几节课 (1-6)
  periodName: string;          // 节次名称
  courseId: string;
  courseName: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  venueType?: 'classroom' | 'lab' | 'playground' | 'music_room' | 'art_room';
  status: 'normal' | 'substituted' | 'swapped' | 'cancelled';
}
```

#### 3.1.3 教室管理系统

**功能模块**：

| 模块 | 路径 | 功能 |
|------|------|------|
| 教室列表 | `/academic/rooms` | 教室信息管理、状态查看 |
| 新增教室 | `/academic/rooms/new` | 创建新教室 |
| 编辑教室 | `/academic/rooms/[id]/edit` | 编辑教室信息 |
| 预约日历 | `/academic/rooms/calendar` | 查看教室预约日程 |
| 预约审批 | `/academic/rooms/approval` | 审批教室预约申请 |

**教室预约流程**：
1. **教师端** (`/teacher/room-booking`)：选择日期→选择教室→选择时段→提交预约
2. **自动创建审批实例**：提交预约时自动创建审批流程
3. **发送部门通知**：通知教务处有新的预约申请
4. **教务处审批**：
   - 入口1：部门待办事项
   - 入口2：教室管理-预约审批
5. **审批结果通知**：通知申请人审批结果

**预约时段模式**：采用课表矩阵模式
```typescript
// 时段定义
type TimeSlot = 
  | 'morning_1' | 'morning_2' | 'morning_3'  // 上午1-3节
  | 'noon'                                   // 午休
  | 'afternoon_1' | 'afternoon_2' | 'afternoon_3'  // 下午1-3节
  | 'evening';                               // 晚上
```

**支持多选时段**：
- Ctrl+点击：多选不连续时段
- Shift+点击：范围选择连续时段

### 3.2 德育管理系统 (/moral)

#### 3.2.1 习惯养成系统

**八大行为习惯类别**：
```typescript
export type HabitCategory = 
  | 'civility'      // 文明礼仪
  | 'writing'       // 书写习惯
  | 'reading'       // 阅读习惯
  | 'sports'        // 运动习惯
  | 'labor'         // 劳动习惯
  | 'safety'        // 安全意识
  | 'hygiene'       // 卫生习惯
  | 'aesthetics';   // 审美素养
```

**评价体系**：
1. **家长打卡**：家长记录孩子在家习惯表现
2. **班主任审核**：班主任确认并评价习惯记录
3. **德育处评优**：评选"习惯之星"
4. **月度目标**：学生制定月度习惯小目标

**数据流程**：
```
家长端打卡 → 班主任审核 → 德育处汇总 → 评优展示
    ↓            ↓            ↓
  积分累积    确认/调整     统计分析
```

**API结构**：
```
/api/habit/
├── records/           # 习惯记录CRUD
├── goals/             # 月度目标管理
├── monthly-goals/     # 月度目标设置
├── stars/             # 习惯之星评选
├── statistics/        # 统计分析
├── class-statistics/  # 班级统计
└── rules/             # 评价规则配置
```

#### 3.2.2 德育活动管理

**活动类型**：
- 主题班会
- 升旗仪式
- 志愿服务
- 社会实践
- 节日活动

**活动发布流程**：
1. 德育处创建活动
2. 选择参与对象（班级/年级/全校）
3. 发布活动通知
4. 学生参与并提交材料
5. 活动总结与评价

### 3.3 教师空间 (/teacher)

#### 3.3.1 功能模块

| 模块 | 路径 | 功能描述 |
|------|------|----------|
| 个人中心 | `/teacher/profile` | 个人信息、密码修改 |
| 请假管理 | `/teacher/leave` | 请假申请、审批查询 |
| 调课管理 | `/teacher/adjust` | 调课申请、代课安排 |
| 我的课表 | `/teacher/schedule` | 查看个人课表 |
| 班级管理 | `/teacher/class` | 班主任管理本班事务 |
| 年级管理 | `/teacher/grade` | 年段长管理年级事务 |
| 习惯打卡 | `/teacher/habit` | 班主任审核习惯记录 |
| 教室预约 | `/teacher/room-booking` | 预约教室 |
| 信息收集 | `/teacher/collection` | 收集学生信息 |
| 工作量 | `/teacher/workload` | 查看个人工作量 |

#### 3.3.2 请假审批流程

**请假类型**：
- 事假、病假、年假、调休、其他

**审批流程**：
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 教师提交  │───▶│ 年段长审批│───▶│ 教务处备案│───▶│ 调课处理  │
│ 请假申请  │    │          │    │          │    │ (如需)    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**调课处理节点**：
- 代课：找其他老师代上
- 调换：与其他时间互换
- 取消：不上课
- 补课：后续时间补上

### 3.4 家长端 (/parent)

#### 3.4.1 功能模块

| 模块 | 路径 | 功能描述 |
|------|------|----------|
| 首页 | `/parent` | 概览、待办事项 |
| 孩子信息 | `/parent/children` | 查看孩子基本信息 |
| 习惯记录 | `/parent/habit` | 打卡记录习惯表现 |
| 成绩查询 | `/parent/grades` | 查看考试成绩 |
| 公告通知 | `/parent/announcements` | 查看学校公告 |
| 信息填写 | `/parent/collection` | 填写学校收集的信息 |

#### 3.4.2 习惯打卡功能

**打卡流程**：
1. 选择孩子
2. 选择习惯类别
3. 选择具体习惯项目
4. 记录表现情况
5. 提交等待班主任审核

**打卡数据同步**：
- 打卡记录实时同步到班主任端
- 班主任审核后计入学生习惯档案
- 数据同步到教务学生详情页

### 3.5 总务后勤系统 (/general)

#### 3.5.1 功能模块

| 模块 | 路径 | 功能描述 |
|------|------|----------|
| 门禁管理 | `/general/access` | 门禁设备、通行记录 |
| 资产管理 | `/general/assets` | 固定资产管理 |
| 财务管理 | `/general/finance` | 财务收支管理 |
| 维修管理 | `/general/repairs` | 报修申请处理 |
| 安全管理 | `/general/security` | 安全巡查管理 |
| 后勤人员 | `/general/staff` | 后勤人员管理 |

#### 3.5.2 与教务系统联动

**教室维护联动**：
- 教室预约可关联维修申请
- 维修完成后自动更新教室状态
- 保洁需求可关联总务系统

### 3.6 领导仪表盘 (/dashboard)

#### 3.6.1 角色仪表盘

| 仪表盘 | 路径 | 关注指标 |
|--------|------|----------|
| 校长仪表盘 | `/dashboard/principal` | 全校综合数据 |
| 书记仪表盘 | `/dashboard/secretary` | 党建、德育数据 |
| 教学副校长 | `/dashboard/academic-vice-principal` | 教务、教研数据 |
| 德育副校长 | `/dashboard/moral-vice-principal` | 德育、习惯数据 |
| 总务副校长 | `/dashboard/general-vice-principal` | 后勤、财务数据 |

#### 3.6.2 工作台区分

**部门工作台**：
- 采用部门视角
- 只显示部门通知和本部门相关业务
- 显示部门待办事项

**领导工作台**：
- 采用全局视角
- 显示全校汇总数据
- 显示待审批事项

### 3.7 门户管理系统

#### 3.7.1 首页门户展示

**内容类型**：
- 轮播图：学校风采展示
- 童心教育：学校教育理念介绍
- 办学荣誉：学校荣誉展示
- 新闻动态：校园新闻发布

#### 3.7.2 门户API

```
/api/portal/
├── carousel/          # 轮播图管理
├── philosophy/        # 童心教育内容
├── achievements/      # 办学荣誉
└── announcements/     # 新闻公告
```

---

## 4. 数据设计

### 4.1 数据库选型

采用 **Supabase PostgreSQL** 作为主数据库，特点：
- 托管式PostgreSQL服务
- 支持行级安全策略(RLS)
- 内置实时订阅功能
- RESTful API自动生成

### 4.2 核心数据表

#### 4.2.1 用户与认证相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `users` | 用户主表 | id, name, role, employee_id, phone, additional_roles |
| `teachers` | 教师详情 | id, user_id, subjects, title, department, status |
| `students` | 学生信息 | id, student_no, name, class_id, status |
| `parents` | 家长信息 | id, name, phone, relation, student_id |
| `class_teachers` | 班级教师关系 | id, class_id, teacher_id, position, semester |

#### 4.2.2 组织架构相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `classes` | 班级信息 | id, name, grade, head_teacher_id |
| `groups` | 群组信息 | id, type, name, director_id |
| `group_members` | 群组成员 | id, group_id, user_id, is_admin |

#### 4.2.3 教务相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `rooms` | 教室信息 | id, name, code, type, building, capacity, facilities, status |
| `room_bookings` | 教室预约 | id, room_id, applicant_id, booking_date, time_slots, status |
| `schedules` | 课表 | id, class_id, semester, slots (JSONB) |
| `exams` | 考试信息 | id, name, type, start_date, end_date, subjects |

#### 4.2.4 德育相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `habit_records` | 习惯记录 | id, student_id, category, habit, score, recorder_id, status |
| `habit_goals` | 月度目标 | id, student_id, category, goal, month, achieved |
| `habit_stars` | 习惯之星 | id, student_id, category, level, month |
| `moral_activities` | 德育活动 | id, title, type, start_date, end_date, participant_ids |

#### 4.2.5 审批与消息相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `approval_instances` | 审批实例 | id, business_type, business_id, status, current_node_order |
| `approval_node_records` | 审批节点记录 | id, instance_id, node_order, status, approver_ids |
| `messages` | 消息主表 | id, title, content, event, sender_id, recipients (JSONB) |
| `user_messages` | 用户消息 | id, message_id, user_id, status, read_at |

#### 4.2.6 门户相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `portal_carousel` | 轮播图 | id, title, image_url, link_url, order, status |
| `portal_honors` | 办学荣誉 | id, title, level, date, description, images |
| `portal_philosophy` | 童心教育 | id, title, content, category, order |

### 4.3 数据类型定义

#### 4.3.1 教室相关类型

```typescript
// 教室类型
export type RoomType = 
  | 'seminar_room'      // 教研室
  | 'lecture_hall'      // 阶梯教室
  | 'multimedia_room'   // 多媒体教室
  | 'lab'               // 实验室
  | 'meeting_room'      // 会议室
  | 'activity_room';    // 活动室

// 教室状态
export type RoomStatus = 
  | 'available'    // 空闲
  | 'in_use'       // 使用中
  | 'reserved'     // 已预约
  | 'maintenance'  // 维护中
  | 'locked';      // 已锁定

// 预约状态
export type BookingStatus = 
  | 'pending'      // 待审批
  | 'approved'     // 已批准
  | 'rejected'     // 已拒绝
  | 'cancelled'    // 已取消
  | 'completed'    // 已完成
  | 'in_progress'; // 进行中
```

#### 4.3.2 审批流程类型

```typescript
// 审批实例状态
export type ApprovalStatus = 
  | 'draft'        // 草稿
  | 'pending'      // 待提交
  | 'in_progress'  // 审批中
  | 'approved'     // 已通过
  | 'rejected'     // 已驳回
  | 'withdrawn';   // 已撤回

// 信息类型
export type AnnouncementType = 
  | 'announcement'       // 校园公告
  | 'news'               // 新闻动态
  | 'internal_notice'    // 内部通知
  | 'parent_notice'      // 家长通知
  | 'leave_request'      // 请假审批
  | 'room_booking';      // 教室预约
```

#### 4.3.3 消息系统类型

```typescript
// 消息事件类型
export type MessageEvent = 
  | 'system_announcement'   // 系统公告
  | 'group_notice'          // 群组通知
  | 'schedule_change'       // 调课通知
  | 'leave_approval'        // 请假审批
  | 'habit_record'          // 习惯记录提醒
  | ...;                    // 其他事件

// 接收者类型
export type RecipientType = 
  | 'all'           // 全员
  | 'role'          // 按角色
  | 'class'         // 按班级
  | 'grade'         // 按年级
  | 'individual'    // 指定个人
  | 'department';   // 部门广播
```

### 4.4 数据访问层

#### 4.4.1 Supabase客户端

```typescript
// src/storage/database/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();
  
  if (token) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      db: { timeout: 60000 },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  
  return createClient(url, anonKey, {
    db: { timeout: 60000 },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

#### 4.4.2 数据库字段映射

数据库使用snake_case命名，前端使用camelCase，需要在API层进行转换：

```typescript
// 数据库记录 → 前端类型
function transformRoom(record: RoomRecord): Room {
  return {
    id: record.id,
    name: record.name,
    extraFacilities: record.extra_facilities,  // snake_case → camelCase
    managerId: record.manager_id,
    // ...
  };
}
```

---

## 5. 接口设计

### 5.1 API设计规范

#### 5.1.1 基础规范

- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: Bearer Token (JWT) + HttpOnly Cookie
- **API风格**: RESTful

#### 5.1.2 响应格式

**成功响应**：
```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应**：
```json
{
  "success": false,
  "error": "错误信息描述",
  "code": "ERROR_CODE"
}
```

**分页响应**：
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 5.1.3 HTTP方法语义

| 方法 | 语义 | 示例 |
|------|------|------|
| GET | 获取资源 | `GET /api/teachers` 获取教师列表 |
| POST | 创建资源 | `POST /api/teachers` 创建教师 |
| PUT | 更新资源 | `PUT /api/rooms` 更新教室信息 |
| DELETE | 删除资源 | `DELETE /api/teachers/:id` 删除教师 |

### 5.2 API路由清单

#### 5.2.1 认证相关 (/api/auth)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/auth/login` | POST | 用户登录 | { phone, password } |
| `/api/auth/logout` | POST | 用户登出 | - |
| `/api/auth/me` | GET | 获取当前用户 | - |
| `/api/auth/refresh` | POST | 刷新Token | { refreshToken } |
| `/api/auth/change-password` | POST | 修改密码 | { oldPassword, newPassword } |

#### 5.2.2 教师管理 (/api/teachers)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/teachers` | GET | 获取教师列表 | page, pageSize, search, department |
| `/api/teachers/:id` | GET | 获取教师详情 | id |
| `/api/teachers` | POST | 创建教师 | Teacher对象 |
| `/api/teachers/:id` | PUT | 更新教师 | Teacher对象 |
| `/api/teachers/:id` | DELETE | 删除教师 | id |

#### 5.2.3 学生管理 (/api/students)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/students` | GET | 获取学生列表 | page, pageSize, search, classId |
| `/api/students/:id` | GET | 获取学生详情 | id |
| `/api/students` | POST | 创建学生 | Student对象 |
| `/api/students/:id` | PUT | 更新学生 | Student对象 |
| `/api/students/:id` | DELETE | 删除学生 | id |
| `/api/students/:id/profile` | GET | 获取学生完整档案 | id |

#### 5.2.4 班级管理 (/api/classes)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/classes` | GET | 获取班级列表 | page, pageSize, grade |
| `/api/classes/:id` | GET | 获取班级详情 | id |
| `/api/classes` | POST | 创建班级 | Class对象 |
| `/api/classes/:id` | PUT | 更新班级 | Class对象 |
| `/api/classes/:id/teachers` | GET | 获取班级教师 | id |
| `/api/classes/:id/students` | GET | 获取班级学生 | id |

#### 5.2.5 教室管理 (/api/academic/rooms)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/academic/rooms` | GET | 获取教室列表 | type, status, building, search |
| `/api/academic/rooms?id=:id` | GET | 获取单个教室 | id |
| `/api/academic/rooms` | POST | 创建教室 | Room对象 |
| `/api/academic/rooms` | PUT | 更新教室 | Room对象 |
| `/api/academic/rooms/stats` | GET | 获取教室统计 | type=overview |
| `/api/academic/rooms/bookings` | GET | 获取预约列表 | bookingDate, status |
| `/api/academic/rooms/bookings` | POST | 创建预约 | Booking对象 |
| `/api/academic/rooms/approval` | GET | 获取待审批预约 | - |

#### 5.2.6 习惯养成 (/api/habit)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/habit/records` | GET | 获取习惯记录 | studentId, category, month |
| `/api/habit/records` | POST | 创建习惯记录 | HabitRecord对象 |
| `/api/habit/records/:id/approve` | POST | 审核记录 | { approved, comment } |
| `/api/habit/goals` | GET | 获取月度目标 | studentId, month |
| `/api/habit/goals` | POST | 设置月度目标 | Goal对象 |
| `/api/habit/stars` | GET | 获取习惯之星 | month, level |
| `/api/habit/statistics` | GET | 获取统计数据 | classId, month |
| `/api/habit/class-statistics` | GET | 班级习惯统计 | classId |

#### 5.2.7 审批流程 (/api/approvals)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/approvals` | GET | 获取审批实例列表 | status, businessType |
| `/api/approvals/:id` | GET | 获取审批实例详情 | id |
| `/api/approvals` | POST | 创建审批实例 | ApprovalInstance对象 |
| `/api/approvals/action` | POST | 执行审批操作 | { instanceId, action, comment } |
| `/api/approvals/my-pending` | GET | 获取我的待办 | - |
| `/api/approvals/my-submitted` | GET | 获取我的申请 | - |

#### 5.2.8 消息系统 (/api/messages)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/messages` | GET | 获取消息列表 | status, event, page |
| `/api/messages/:id` | GET | 获取消息详情 | id |
| `/api/messages` | POST | 发送消息 | Message对象 |
| `/api/messages/:id/read` | POST | 标记已读 | id |
| `/api/messages/unread-count` | GET | 获取未读数量 | - |
| `/api/messages/broadcast` | POST | 发送广播消息 | { targetType, ... } |

#### 5.2.9 群组管理 (/api/groups)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/groups` | GET | 获取群组列表 | type |
| `/api/groups/:id` | GET | 获取群组详情 | id |
| `/api/groups/:id/members` | GET | 获取群组成员 | id |
| `/api/groups/:id/members` | POST | 添加群组成员 | { userIds } |
| `/api/groups/:id/notices` | GET | 获取群组通知 | id |
| `/api/groups/:id/notices` | POST | 发布群组通知 | Notice对象 |

#### 5.2.10 门户管理 (/api/portal)

| 路由 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/portal/carousel` | GET | 获取轮播图列表 | - |
| `/api/portal/carousel` | POST | 创建轮播图 | Carousel对象 |
| `/api/portal/carousel/:id` | PUT | 更新轮播图 | Carousel对象 |
| `/api/portal/philosophy` | GET | 获取童心教育内容 | - |
| `/api/portal/honors` | GET | 获取办学荣誉 | - |
| `/api/portal/announcements` | GET | 获取门户公告 | type |

### 5.3 API请求示例

#### 5.3.1 创建教室预约

```typescript
// POST /api/academic/rooms/bookings
const response = await fetch('/api/academic/rooms/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'room001',
    bookingDate: '2026-03-10',
    timeSlots: ['morning_1', 'morning_2'],  // 多时段
    purpose: 'teaching',
    title: '公开课',
    expectedAttendees: 45,
    requiredFacilities: ['projector', 'microphone'],
  }),
});
```

#### 5.3.2 执行审批操作

```typescript
// POST /api/approvals/action
const response = await fetch('/api/approvals/action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instanceId: 'approval-001',
    action: 'approve',  // 'approve' | 'reject' | 'return'
    comment: '同意',
  }),
});
```

---

## 6. 认证授权设计

### 6.1 认证流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        登录认证流程                                      │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  用户端   │      │  前端    │      │ API路由  │      │ 数据库   │
    └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                 │                 │                 │
         │  输入手机号密码  │                 │                 │
         │────────────────>│                 │                 │
         │                 │                 │                 │
         │                 │  POST /api/auth/login            │
         │                 │────────────────>│                 │
         │                 │                 │                 │
         │                 │                 │  查询用户       │
         │                 │                 │────────────────>│
         │                 │                 │                 │
         │                 │                 │  返回用户数据   │
         │                 │                 │<────────────────│
         │                 │                 │                 │
         │                 │                 │  验证密码       │
         │                 │                 │  生成JWT Token  │
         │                 │                 │                 │
         │                 │  返回Token+用户信息               │
         │                 │<────────────────│                 │
         │                 │                 │                 │
         │  存储Token      │                 │                 │
         │  跳转首页       │                 │                 │
         │<────────────────│                 │                 │
         │                 │                 │                 │
```

### 6.2 Token管理

#### 6.2.1 Token生成

```typescript
// 使用jose库生成JWT
import { SignJWT } from 'jose';

async function generateTokens(user: User) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  // Access Token (2小时有效)
  const accessToken = await new SignJWT({ 
    userId: user.id, 
    role: user.role,
    additionalRoles: user.additionalRoles 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
  
  // Refresh Token (7天有效)
  const refreshToken = await new SignJWT({ userId: user.id, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return { accessToken, refreshToken };
}
```

#### 6.2.2 Token验证

```typescript
import { jwtVerify } from 'jose';

async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
```

### 6.3 权限控制

#### 6.3.1 模块权限映射

| 角色 | 教务系统 | 德育系统 | 总务系统 | 教师空间 | 家长端 |
|------|----------|----------|----------|----------|--------|
| 校长 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 书记 | ✓ | ✓ | ✓ | ✓ | ✗ |
| 教学副校长 | ✓ | ✗ | ✗ | ✓ | ✗ |
| 德育副校长 | ✗ | ✓ | ✗ | ✓ | ✗ |
| 总务副校长 | ✗ | ✗ | ✓ | ✓ | ✗ |
| 教务主任 | ✓ | ✗ | ✗ | ✓ | ✗ |
| 德育主任 | ✗ | ✓ | ✗ | ✓ | ✗ |
| 总务主任 | ✗ | ✗ | ✓ | ✓ | ✗ |
| 年段长 | 部分 | 部分 | ✗ | ✓ | ✗ |
| 班主任 | 部分 | 部分 | ✗ | ✓ | ✗ |
| 科任教师 | 部分 | ✗ | ✗ | ✓ | ✗ |
| 家长 | ✗ | 部分 | ✗ | ✗ | ✓ |

#### 6.3.2 敏感数据访问控制

**学生敏感数据访问规则**：
```typescript
// 判断是否有权访问学生敏感数据
function canAccessStudentData(user: User, student: Student): boolean {
  // 1. 学校领导有全部权限
  if (['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal'].includes(user.role)) {
    return true;
  }
  
  // 2. 教务主任、德育主任有全部权限
  if (user.additionalRoles?.includes('academic_director') || 
      user.additionalRoles?.includes('moral_director')) {
    return true;
  }
  
  // 3. 班主任可访问本班学生
  if (user.role === 'head_teacher' && user.classId === student.classId) {
    return true;
  }
  
  // 4. 科任教师可访问任教班级学生
  if (user.role === 'subject_teacher') {
    const teacherClasses = user.subTeacherClasses || [];
    return teacherClasses.some(c => c.classId === student.classId);
  }
  
  // 5. 家长只能访问自己孩子
  if (user.role === 'parent') {
    return user.children?.some(c => c.id === student.id);
  }
  
  return false;
}
```

### 6.4 路由守卫

#### 6.4.1 前端路由保护

```typescript
// AuthContext.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // 检查登录状态
    checkAuth();
    
    // 监听登出事件
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);
  
  const handleLogout = () => {
    setUser(null);
    router.push('/login');
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### 6.4.2 API路由保护

```typescript
// lib/auth/api-auth.ts
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      );
    }
    return handler(request, user);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '认证失败' },
      { status: 401 }
    );
  }
}
```

---

## 7. 部署设计

### 7.1 部署架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户端                                     │
│                    (浏览器 / 移动端浏览器)                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        应用服务器                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Next.js 应用                              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │
│  │  │ 前端页面 │ │ API路由 │ │ SSR渲染 │ │ 中间件  │           │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   Supabase        │   │   对象存储        │   │   LLM服务         │
│   (PostgreSQL)    │   │   (S3兼容)        │   │   (AI能力)        │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

### 7.2 环境配置

#### 7.2.1 环境变量

```bash
# 数据库配置
COZE_SUPABASE_URL=https://xxx.supabase.co
COZE_SUPABASE_ANON_KEY=xxx

# JWT配置
JWT_SECRET=your-jwt-secret-key

# 其他配置
NODE_ENV=production
```

#### 7.2.2 Coze配置文件 (.coze)

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
```

### 7.3 构建与部署流程

#### 7.3.1 开发环境

```bash
# 初始化项目
coze init /workspace/projects --template nextjs

# 安装依赖
pnpm install

# 启动开发服务器 (端口5000)
coze dev
```

#### 7.3.2 生产部署

```bash
# 构建
coze build

# 启动生产服务器
coze start
```

### 7.4 监控与日志

#### 7.4.1 日志目录

```
/app/work/logs/bypass/
├── app.log           # 主流程日志
├── dev.log           # 开发调试日志
└── console.log       # 浏览器控制台日志
```

#### 7.4.2 日志级别

| 级别 | 说明 |
|------|------|
| ERROR | 错误日志，需要立即处理 |
| WARN | 警告日志，潜在问题 |
| INFO | 信息日志，关键操作 |
| DEBUG | 调试日志，开发使用 |

---

## 8. 设计约束

### 8.1 技术约束

| 约束项 | 说明 |
|--------|------|
| 包管理器 | **强制使用pnpm**，禁止npm/yarn |
| 端口 | Web服务**必须**运行在5000端口 |
| 数据库 | **必须**使用Supabase，禁止本地数据库 |
| Mock | **禁止**API层Mock fallback，真实数据源 |
| 流式输出 | LLM集成**必须**使用SSE流式输出 |

### 8.2 安全约束

| 约束项 | 说明 |
|--------|------|
| 密码存储 | 使用bcrypt加密，禁止明文存储 |
| Token存储 | HttpOnly Cookie + localStorage双保险 |
| XSS防护 | 禁止dangerouslySetInnerHTML |
| SQL注入 | 使用参数化查询，禁止字符串拼接 |
| 敏感数据 | 前端禁止存储，API按权限返回 |

### 8.3 性能约束

| 约束项 | 说明 |
|--------|------|
| API超时 | 默认60秒，LLM调用可延长 |
| 分页大小 | 默认20条，最大100条 |
| 图片大小 | 单文件最大10MB |
| 日志文件 | 单次读取最大20行 |

---

## 9. 验收准则

### 9.1 功能验收

#### 9.1.1 认证模块

- [ ] 手机号+密码登录成功
- [ ] 登录失败提示正确
- [ ] Token过期自动刷新
- [ ] 登出清除所有认证信息
- [ ] 密码修改功能正常

#### 9.1.2 教务模块

- [ ] 手动排课功能正常
- [ ] 教师选择规则生效
- [ ] 学生信息CRUD正常
- [ ] 教室预约流程完整
- [ ] 预约审批功能正常
- [ ] 教室编辑功能正常

#### 9.1.3 德育模块

- [ ] 习惯打卡记录正常
- [ ] 班主任审核流程正常
- [ ] 习惯之星评选功能
- [ ] 月度目标设置功能

#### 9.1.4 教师空间

- [ ] 个人信息展示正确
- [ ] 请假申请流程正常
- [ ] 调课处理流程正常
- [ ] 习惯审核功能正常

#### 9.1.5 家长端

- [ ] 孩子信息展示正确
- [ ] 习惯打卡提交正常
- [ ] 公告通知查看正常

### 9.2 非功能验收

#### 9.2.1 性能要求

- [ ] 首页加载时间 < 3秒
- [ ] API响应时间 < 1秒
- [ ] 支持并发用户数 >= 100

#### 9.2.2 安全要求

- [ ] 无XSS漏洞
- [ ] 无SQL注入漏洞
- [ ] 敏感数据加密存储
- [ ] 权限控制正确

#### 9.2.3 兼容性要求

- [ ] Chrome浏览器兼容
- [ ] Safari浏览器兼容
- [ ] 移动端浏览器兼容

---

## 10. 附录

### 10.1 技术术语表

| 术语 | 解释 |
|------|------|
| Next.js | React全栈框架，支持SSR/SSG |
| App Router | Next.js 13+的路由系统 |
| Supabase | 开源Firebase替代品，基于PostgreSQL |
| shadcn/ui | 基于Radix UI的React组件库 |
| JWT | JSON Web Token，无状态认证方案 |
| SSE | Server-Sent Events，服务器推送事件 |
| BFF | Backend For Frontend，服务于前端的后端 |

### 10.2 代码统计

| 类型 | 数量 |
|------|------|
| 总代码行数 | 124,902行 |
| 页面文件 | 84个 |
| API路由 | 156个 |
| 组件文件 | 79个 |
| Hooks文件 | 19个 |
| 类型定义文件 | 4个 |

### 10.3 参考资料

- [Next.js 官方文档](https://nextjs.org/docs)
- [Supabase 官方文档](https://supabase.com/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**文档结束**

