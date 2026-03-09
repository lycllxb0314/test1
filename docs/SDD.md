# 软件设计文档 (SDD)

**项目名称**: 龙岩师范附属小学智慧校园管理平台  
**文档版本**: v4.0  
**编制日期**: 2026年3月  
**编制单位**: 智慧校园项目组

**版本历史**:
- v4.0 (2026-03): **全面重构**：根据实际代码结构重写，详细描述84个页面、156个API、79个组件的实现细节
- v3.1 (2024-03): 手动排课系统重构
- v3.0 (2024-03): 数据孤岛整改

---

## 目录

1. [概述](#1-概述)
2. [架构设计](#2-架构设计)
3. [模块设计](#3-模块设计)
   - [3.1 学校门户首页](#31-学校门户首页)
   - [3.2 教务教研系统](#32-教务教研系统)
   - [3.3 德育管理系统](#33-德育管理系统)
   - [3.4 总务后勤系统](#34-总务后勤系统)
   - [3.5 教师工作台](#35-教师工作台)
   - [3.6 家长工作台](#36-家长工作台)
   - [3.7 领导仪表盘](#37-领导仪表盘)
   - [3.8 管理后台](#38-管理后台)
4. [数据设计](#4-数据设计)
5. [接口设计](#5-接口设计)
6. [认证授权设计](#6-认证授权设计)
7. [部门工作台设计](#7-部门工作台设计)
8. [部署设计](#8-部署设计)
9. [设计约束](#9-设计约束)
10. [验收准则](#10-验收准则)
11. [附录](#11-附录)

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

- **统一门户**: 学校主页展示校园风采、新闻动态、办学荣誉
- **统一身份认证**: 单点登录，权限精细化管理
- **统一数据管理**: 消除数据孤岛，实现数据共享
- **家校互联**: 家长端实时了解孩子在校情况
- **部门协作**: 教务处、德育处、总务处协同办公

### 1.3 系统范围

智慧校园平台包含以下核心业务系统：

| 系统名称 | 路由前缀 | 页面数 | API数 | 主要用户 |
|----------|----------|--------|-------|----------|
| 学校门户首页 | `/` `/news` `/notices` `/achievements` `/philosophy` | 8 | 15 | 公众 |
| 教务教研系统 | `/academic` | 24 | 35 | 教务处 |
| 德育管理系统 | `/moral` | 4 | 15 | 德育处 |
| 总务后勤系统 | `/general` | 12 | 20 | 总务处 |
| 教师工作台 | `/teacher` | 18 | 30 | 全体教师 |
| 家长工作台 | `/parent` | 9 | 20 | 家长 |
| 领导仪表盘 | `/dashboard` | 6 | 10 | 校领导 |
| 管理后台 | `/admin` `/leadership` | 3 | 11 | 管理员 |

**统计数据**：
- 前端页面文件：**84个**
- API路由文件：**156个**
- React组件文件：**79个**
- 自定义Hooks：**19个**
- 类型定义文件：**4个**
- 总代码行数：**约124,902行**

### 1.4 页面清单

#### 1.4.1 学校门户首页 (8个页面)

| 路径 | 功能 |
|------|------|
| `/` | 学校主页（轮播图、童心教育、办学荣誉、新闻动态） |
| `/news` | 新闻列表 |
| `/news/[id]` | 新闻详情 |
| `/notices` | 公告列表 |
| `/notices/[id]` | 公告详情 |
| `/achievements` | 办学成果列表 |
| `/achievements/[id]` | 办学成果详情 |
| `/philosophy/[id]` | 童心教育详情 |

#### 1.4.2 教务教研系统 (24个页面)

| 路径 | 功能 |
|------|------|
| `/academic` | 教务处工作台 |
| `/academic/students` | 学生管理 |
| `/academic/students/[id]` | 学生详情 |
| `/academic/teachers` | 教师管理 |
| `/academic/teachers/[id]` | 教师详情 |
| `/academic/classes` | 班级管理 |
| `/academic/parents` | 家长管理 |
| `/academic/parents/[id]` | 家长详情 |
| `/academic/exams` | 考试管理 |
| `/academic/exams/new` | 新增考试 |
| `/academic/exams/[id]/edit` | 编辑考试 |
| `/academic/exams/[id]` | 考试详情 |
| `/academic/rooms` | 教室管理 |
| `/academic/rooms/new` | 新增教室 |
| `/academic/rooms/[id]/edit` | 编辑教室 |
| `/academic/rooms/calendar` | 预约日历 |
| `/academic/rooms/approval` | 预约审批 |
| `/academic/rooms/booking` | 教室预约 |
| `/academic/manual-schedule/[grade]` | 手动排课 |
| `/academic/school-schedule` | 学校课表 |
| `/academic/workload` | 工作量统计 |
| `/academic/analysis` | 教学分析 |
| `/academic/attendance` | 考勤管理 |
| `/academic/enrollment` | 新生注册 |
| `/academic/research` | 教研活动 |

#### 1.4.3 德育管理系统 (4个页面)

| 路径 | 功能 |
|------|------|
| `/moral` | 德育处工作台 |
| `/moral/habit` | 习惯养成管理 |
| `/moral/habit/[id]` | 学生习惯详情 |
| `/moral/activities` | 德育活动管理 |

#### 1.4.4 总务后勤系统 (12个页面)

| 路径 | 功能 |
|------|------|
| `/general` | 总务处工作台 |
| `/general/access` | 门禁管理 |
| `/general/access/devices` | 门禁设备 |
| `/general/access/persons` | 门禁人员 |
| `/general/access/records` | 通行记录 |
| `/general/access/visitors` | 访客管理 |
| `/general/assets` | 资产管理 |
| `/general/devices` | 设备管理 |
| `/general/environment` | 环境管理 |
| `/general/finance` | 财务管理 |
| `/general/purchase` | 采购管理 |
| `/general/repairs` | 维修管理 |
| `/general/security` | 安全管理 |
| `/general/staff` | 后勤人员 |

#### 1.4.5 教师工作台 (18个页面)

| 路径 | 功能 |
|------|------|
| `/teacher` | 教师工作台 |
| `/teacher/profile` | 个人中心 |
| `/teacher/leave` | 请假记录 |
| `/teacher/leave-apply` | 请假申请 |
| `/teacher/adjust` | 调课管理 |
| `/teacher/schedule` | 我的课表 |
| `/teacher/class` | 班级管理（班主任） |
| `/teacher/class/students/[id]` | 学生详情 |
| `/teacher/grade` | 年级管理（年段长） |
| `/teacher/grade-schedule` | 年级课表 |
| `/teacher/habit` | 习惯审核（班主任） |
| `/teacher/room-booking` | 教室预约 |
| `/teacher/collection` | 信息收集 |
| `/teacher/workload` | 工作量查看 |
| `/teacher/activities` | 活动管理 |
| `/teacher/expense` | 费用报销 |

#### 1.4.6 家长工作台 (9个页面)

| 路径 | 功能 |
|------|------|
| `/parent` | 家长工作台 |
| `/parent/profile` | 个人中心 |
| `/parent/children` | 孩子信息 |
| `/parent/habit` | 习惯打卡 |
| `/parent/grades` | 成绩查询 |
| `/parent/announcements` | 公告通知 |
| `/parent/collection` | 信息填写 |
| `/parent/enrollment` | 新生注册 |

#### 1.4.7 领导仪表盘 (6个页面)

| 路径 | 功能 |
|------|------|
| `/dashboard` | 仪表盘入口 |
| `/dashboard/principal` | 校长仪表盘 |
| `/dashboard/secretary` | 书记仪表盘 |
| `/dashboard/academic-vice-principal` | 教学副校长仪表盘 |
| `/dashboard/moral-vice-principal` | 德育副校长仪表盘 |
| `/dashboard/general-vice-principal` | 总务副校长仪表盘 |

#### 1.4.8 其他页面 (3个)

| 路径 | 功能 |
|------|------|
| `/login` | 登录页面 |
| `/admin/carousel` | 轮播图管理 |
| `/leadership` | 领导入口 |

### 1.5 术语定义

| 术语 | 定义 |
|------|------|
| RBAC | 基于角色的访问控制 (Role-Based Access Control) |
| JWT | JSON Web Token，用于身份认证的令牌标准 |
| SSE | Server-Sent Events，服务器推送事件 |
| BFF | Backend For Frontend，服务于前端的后端层 |
| 手动排课 | 教务主任通过点击课表格子直接安排课程的方式 |
| 习惯养成 | 学生日常行为习惯评价与追踪系统（八大类别） |
| 部门工作台 | 各部门（教务处、德育处、总务处）的独立工作入口 |
| 群组 | 行政部门组织单元（校长室、教务处、德育处、总务处） |
| 童心教育 | 学校特色教育理念，六大路径 |
| 心赏卡 | 学生德育评价卡片 |

---

## 2. 架构设计

### 2.1 总体架构

采用**前后端分离**的BFF架构，整体分为四层：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         展示层 (Presentation)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 学校门户  │ │ 教务系统  │ │ 德育系统  │ │总务系统  │ │ 教师工作台│   │
│  │    /     │ │ /academic│ │  /moral  │ │ /general │ │ /teacher │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 家长工作台│ │领导仪表盘│ │  登录页   │ │ 管理后台 │ │ 新闻页面 │   │
│  │ /parent  │ │/dashboard│ │  /login  │ │ /admin   │ │  /news   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      应用层 (BFF - Next.js API Routes)                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     /api/*  (156个路由)                       │    │
│  │  ┌─────────────────────────────────────────────────────┐     │    │
│  │  │ 认证: auth/*        用户: users/*       教师: teachers/*  │    │
│  │  │ 学生: students/*    班级: classes/*     家长: parents/*  │    │
│  │  │ 教务: academic/*    德育: habit/*, moral/*             │    │
│  │  │ 总务: access/*, assets/*, expenses/*, repair-requests/*│    │
│  │  │ 审批: approvals/*   消息: messages/*   群组: groups/*  │    │
│  │  │ 门户: portal/*      信息收集: information-collections/*│    │
│  │  └─────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         服务层 (Service)                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │认证服务  │ │文件服务  │ │消息服务  │ │审批服务  │ │习惯服务  │       │
│  │ auth    │ │ upload  │ │ message │ │approval │ │ habit   │       │
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
├── app/                          # Next.js App Router (84个页面)
│   ├── page.tsx                 # 学校主页门户
│   ├── layout.tsx               # 根布局
│   ├── globals.css              # 全局样式
│   ├── login/                   # 登录页面
│   ├── academic/                # 教务教研系统 (24页面)
│   │   ├── page.tsx             # 教务处工作台
│   │   ├── students/            # 学生管理
│   │   ├── teachers/            # 教师管理
│   │   ├── classes/             # 班级管理
│   │   ├── parents/             # 家长管理
│   │   ├── exams/               # 考试管理
│   │   ├── rooms/               # 教室管理
│   │   ├── manual-schedule/     # 手动排课
│   │   ├── school-schedule/     # 学校课表
│   │   ├── workload/            # 工作量统计
│   │   ├── analysis/            # 教学分析
│   │   ├── attendance/          # 考勤管理
│   │   ├── enrollment/          # 新生注册
│   │   └── research/            # 教研活动
│   ├── moral/                   # 德育管理系统 (4页面)
│   │   ├── page.tsx             # 德育处工作台
│   │   ├── habit/               # 习惯养成管理
│   │   └── activities/          # 德育活动管理
│   ├── general/                 # 总务后勤系统 (12页面)
│   │   ├── page.tsx             # 总务处工作台
│   │   ├── access/              # 门禁管理
│   │   │   ├── devices/         # 门禁设备
│   │   │   ├── persons/         # 门禁人员
│   │   │   ├── records/         # 通行记录
│   │   │   └── visitors/        # 访客管理
│   │   ├── assets/              # 资产管理
│   │   ├── devices/             # 设备管理
│   │   ├── environment/         # 环境管理
│   │   ├── finance/             # 财务管理
│   │   ├── purchase/            # 采购管理
│   │   ├── repairs/             # 维修管理
│   │   ├── security/            # 安全管理
│   │   └── staff/               # 后勤人员
│   ├── teacher/                 # 教师工作台 (18页面)
│   │   ├── page.tsx             # 教师工作台
│   │   ├── profile/             # 个人中心
│   │   ├── leave/               # 请假记录
│   │   ├── leave-apply/         # 请假申请
│   │   ├── adjust/              # 调课管理
│   │   ├── schedule/            # 我的课表
│   │   ├── class/               # 班级管理
│   │   ├── grade/               # 年级管理
│   │   ├── grade-schedule/      # 年级课表
│   │   ├── habit/               # 习惯审核
│   │   ├── room-booking/        # 教室预约
│   │   ├── collection/          # 信息收集
│   │   ├── workload/            # 工作量查看
│   │   ├── activities/          # 活动管理
│   │   └── expense/             # 费用报销
│   ├── parent/                  # 家长工作台 (9页面)
│   │   ├── page.tsx             # 家长工作台
│   │   ├── profile/             # 个人中心
│   │   ├── children/            # 孩子信息
│   │   ├── habit/               # 习惯打卡
│   │   ├── grades/              # 成绩查询
│   │   ├── announcements/       # 公告通知
│   │   ├── collection/          # 信息填写
│   │   └── enrollment/          # 新生注册
│   ├── dashboard/               # 领导仪表盘 (6页面)
│   │   ├── page.tsx             # 仪表盘入口
│   │   ├── principal/           # 校长仪表盘
│   │   ├── secretary/           # 书记仪表盘
│   │   ├── academic-vice-principal/  # 教学副校长
│   │   ├── moral-vice-principal/     # 德育副校长
│   │   └── general-vice-principal/   # 总务副校长
│   ├── api/                     # API路由 (156个)
│   │   ├── auth/                # 认证相关 (5个)
│   │   │   ├── login/           # 登录
│   │   │   ├── logout/          # 登出
│   │   │   ├── current/         # 当前用户
│   │   │   └── refresh/         # 刷新Token
│   │   ├── academic/            # 教务API (20个)
│   │   │   ├── manual-schedule/ # 手动排课
│   │   │   ├── rooms/           # 教室管理
│   │   │   ├── school-schedule/ # 学校课表
│   │   │   └── ...
│   │   ├── habit/               # 习惯养成API (10个)
│   │   ├── moral/               # 德育API (5个)
│   │   ├── approvals/           # 审批流程API (3个)
│   │   ├── messages/            # 消息系统API (3个)
│   │   ├── groups/              # 群组管理API (1个)
│   │   ├── teachers/            # 教师API (15个)
│   │   ├── students/            # 学生API (8个)
│   │   ├── classes/             # 班级API (3个)
│   │   ├── parents/             # 家长API (8个)
│   │   ├── access/              # 门禁API (4个)
│   │   ├── assets/              # 资产API (1个)
│   │   ├── expenses/            # 费用API (4个)
│   │   ├── portal/              # 门户API (8个)
│   │   ├── information-collections/ # 信息收集API (4个)
│   │   ├── course-adjustments/  # 调课处理API (2个)
│   │   ├── leave-requests-v2/   # 请假API (4个)
│   │   ├── users/               # 用户API (5个)
│   │   └── ...                  # 其他API
│   ├── news/                    # 新闻页面 (2页面)
│   ├── notices/                 # 公告页面 (2页面)
│   ├── achievements/            # 办学成果 (2页面)
│   ├── philosophy/              # 童心教育 (2页面)
│   ├── admin/                   # 管理后台
│   │   └── carousel/            # 轮播图管理
│   └── leadership/              # 领导入口
├── components/                  # React组件 (79个)
│   ├── ui/                      # shadcn/ui组件库 (40+个)
│   │   ├── button.tsx           # 按钮组件
│   │   ├── card.tsx             # 卡片组件
│   │   ├── dialog.tsx           # 对话框组件
│   │   ├── dropdown-menu.tsx    # 下拉菜单
│   │   ├── form.tsx             # 表单组件
│   │   ├── input.tsx            # 输入框
│   │   ├── select.tsx           # 选择器
│   │   ├── table.tsx            # 表格组件
│   │   ├── tabs.tsx             # 标签页
│   │   ├── toast.tsx            # Toast提示
│   │   └── ...
│   ├── auth/                    # 认证相关组件
│   ├── approval/                # 审批流程组件
│   │   ├── ApprovalActionDialog.tsx
│   │   └── PublishNotificationDialog.tsx
│   ├── messaging/               # 消息组件
│   │   └── MessagePanel.tsx
│   ├── course-adjustment/       # 调课组件
│   │   └── CourseAdjustmentDialog.tsx
│   ├── dashboard/               # 仪表盘组件
│   ├── habit/                   # 习惯养成组件
│   ├── portal/                  # 门户组件
│   ├── schedule/                # 课表组件
│   ├── student/                 # 学生组件
│   ├── teacher/                 # 教师组件
│   ├── common/                  # 通用组件
│   └── layout/                  # 布局组件
├── types/                       # TypeScript类型定义 (4个)
│   ├── index.ts                 # 主类型文件 (约2500行)
│   ├── approval.ts              # 审批流程类型
│   ├── messages.ts              # 消息系统类型
│   └── leave-adjust.ts          # 请假调课类型
├── hooks/                       # 自定义Hooks (19个)
│   ├── index.ts                 # Hooks导出
│   ├── useApi.ts                # 通用API请求Hook (约1000行)
│   ├── useAuth.ts               # 认证Hook
│   ├── usePermissions.ts        # 权限Hook
│   ├── useTeachers.ts           # 教师数据Hook
│   ├── useStudents.ts           # 学生数据Hook
│   ├── useClasses.ts            # 班级数据Hook
│   ├── useParents.ts            # 家长数据Hook
│   ├── useApprovals.ts          # 审批流程Hook
│   ├── useMessages.ts           # 消息系统Hook
│   ├── useGroups.ts             # 群组管理Hook
│   ├── useLeaveAdjust.ts        # 请假调课Hook
│   ├── useParentProfile.ts      # 家长档案Hook
│   ├── useSchoolStats.ts        # 学校统计Hook
│   ├── useOfficialSchedule.ts   # 官方课表Hook
│   ├── useScheduleDraft.ts      # 课表草稿Hook
│   └── use-mobile.ts            # 移动端检测Hook
├── lib/                         # 工具库
│   ├── auth/                    # 认证工具
│   ├── auth-client.ts           # 客户端认证 (自动刷新Token)
│   ├── api-route-utils.ts       # API工具函数
│   ├── api-response.ts          # API响应格式
│   ├── pagination-config.ts     # 分页配置
│   ├── schedule-config.ts       # 课表配置
│   ├── subject-colors.ts        # 科目颜色配置
│   ├── workload-service.ts      # 工作量服务
│   ├── leave-workload-service.ts # 请假工作量服务
│   ├── expense-data.ts          # 费用数据
│   ├── rate-limit/              # 限流
│   ├── circuit-breaker/         # 熔断器
│   ├── encryption/              # 加密
│   ├── masking/                 # 数据脱敏
│   ├── db/                      # 数据库工具
│   └── utils.ts                 # 通用工具
├── contexts/                    # React Context
│   └── AuthContext.tsx          # 认证上下文 (Token管理、权限判断)
├── storage/                     # 存储层
│   └── database/
│       └── supabase-client.ts   # Supabase客户端 (环境变量加载、连接管理)
├── config/                      # 配置文件
│   └── index.ts                 # 全局配置 (角色配置、权限配置)
└── services/                    # 服务层
```

### 2.4 认证授权架构

#### 2.4.1 JWT 会话管理

系统采用 **JWT (JSON Web Token)** 实现无状态会话管理，使用 `jose` 库进行 Token 签名和验证。

**双 Token 机制**：

| Token 类型 | 有效期 | 存储位置 | 用途 |
|-----------|--------|---------|------|
| Access Token | 2小时 | HttpOnly Cookie + localStorage | API 访问授权 |
| Refresh Token | 7天 | HttpOnly Cookie + localStorage | 刷新 Access Token |

**Token 自动刷新机制** (`src/lib/auth-client.ts`)：
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
  | 'head_teacher'                 // 班主任（语文或数学老师）
  | 'subject_teacher'              // 科任教师（与班主任配对）
  | 'skill_teacher'                // 技能课教师（英语、音乐、美术、体育等）
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

| Hook | 代码行数 | 用途 | 对应API |
|------|----------|------|---------|
| `useApi` | ~1000行 | 通用API请求，支持分页、缓存、错误处理 | 所有API |
| `useAuth` | ~30行 | 认证状态管理 | `/api/auth/*` |
| `usePermissions` | ~200行 | 权限判断 | - |
| `useTeachers` | ~1000行 | 教师数据管理 | `/api/teachers/*` |
| `useStudents` | ~650行 | 学生数据管理 | `/api/students/*` |
| `useClasses` | ~800行 | 班级数据管理 | `/api/classes/*` |
| `useParents` | ~650行 | 家长数据管理 | `/api/parents/*` |
| `useApprovals` | ~400行 | 审批流程管理 | `/api/approvals/*` |
| `useMessages` | ~400行 | 消息系统管理 | `/api/messages/*` |
| `useGroups` | ~300行 | 群组管理 | `/api/groups/*` |
| `useLeaveAdjust` | ~500行 | 请假调课管理 | `/api/leave-requests-v2/*` |

---

## 3. 模块设计

### 3.1 学校门户首页

#### 3.1.1 功能概述

学校门户首页是面向公众的展示页面，无需登录即可访问。

**主要功能模块**：
1. **轮播图展示**：支持图片、视频、B站视频三种类型
2. **童心教育六大路径**：以德育心、以智启心、以体健心、以美润心、以劳立心、以爱暖心
3. **办学荣誉展示**：学校获得的各项荣誉
4. **新闻动态**：校园新闻列表
5. **公告通知**：学校公告列表

#### 3.1.2 轮播图功能

**支持的媒体类型**：
```typescript
interface CarouselItem {
  id?: string;
  type: 'image' | 'video' | 'bilibili';  // 三种类型
  image: string;                          // 封面图
  videoUrl?: string;                      // 视频URL
  bilibiliUrl?: string;                   // B站嵌入URL
  bilibiliBvid?: string;                  // B站BV号（用于跳转高清播放）
  title: string;
  subtitle?: string;
  tag?: string;                           // 标签：科创特色、艺术教育等
}
```

**默认轮播内容**：
1. 少年科学院成立（B站视频）- 中科院谢华安院士指导
2. 校园艺术节（图片）- 全国艺术教育先进单位
3. 阳光体育运动（图片）- 体质健康合格率全市第一梯队
4. 少先队活动（图片）- 有效德育引领童心成长
5. 高效课堂（图片）- 高效课堂发展童心智慧

#### 3.1.3 童心教育六大路径

| 路径 | 标题 | 副标题 | 图标 |
|------|------|--------|------|
| 以德育心 | 有效德育引领童心 | 德育实践 | Shield |
| 以智启心 | 高效课堂发展童心 | 教学特色 | Lightbulb |
| 以体健心 | 阳光体育运动童心 | 体育健康 | Activity |
| 以美润心 | 艺术教育陶冶童心 | 艺术教育 | Palette |
| 以劳立心 | 劳动实践磨练童心 | 劳动教育 | TreePine |
| 以爱暖心 | 家校协同温润童心 | 家校共育 | Heart |

#### 3.1.4 相关API

| API | 方法 | 功能 |
|-----|------|------|
| `/api/portal/carousel` | GET | 获取轮播图列表 |
| `/api/portal/philosophy` | GET | 获取童心教育内容 |
| `/api/portal/honors` | GET | 获取办学荣誉 |
| `/api/portal/achievements` | GET | 获取办学成果 |
| `/api/portal/announcements` | GET | 获取门户公告 |
| `/api/admin/portal/carousel` | POST/PUT | 管理轮播图（需登录） |

### 3.2 教务教研系统

#### 3.2.1 教务处工作台 (`/academic`)

**部门工作台特点**：
- **部门通知**：接收校长室等上级部门的通知
- **待办事项**：本部门需要处理的审批和任务
- **业务概况**：教务相关业务数据统计

**Tab页面**：
1. **消息面板**：显示部门通知
2. **待办审批**：需要本部门审批的事项
3. **业务统计**：教务相关数据概览

**快速入口**：
- 学生管理
- 教师管理
- 班级管理
- 手动排课
- 教室管理
- 考试管理

#### 3.2.2 手动排课系统 (`/academic/manual-schedule/[grade]`)

**设计理念**：采用教务主任手动排课模式，非智能排课算法。

**核心功能**：
1. **课表矩阵视图**：以表格形式展示班级-节次-星期的三维课表
2. **右键菜单操作**：支持复制、粘贴、清空等快捷操作
3. **教师选择规则引擎**：
   - 语文课 → 只能选择本班语文老师
   - 数学课 → 只能选择本班数学老师
   - 技能课 → 选择对应学科教师
4. **课时参考悬浮窗**：显示推荐课时分配
5. **草稿保存与发布**：支持保存草稿，确认后发布

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/academic/manual-schedule/grade` | GET | 获取年级课表数据 |
| `/api/academic/manual-schedule/draft` | GET/POST | 草稿管理 |
| `/api/academic/manual-schedule/slot` | PUT | 更新课表格子 |
| `/api/academic/manual-schedule/publish` | POST | 发布课表 |
| `/api/academic/manual-schedule/teachers` | GET | 获取可选教师列表 |
| `/api/academic/manual-schedule/status` | GET | 获取排课状态 |

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

#### 3.2.3 教室管理系统

**功能模块**：

| 模块 | 路径 | 功能 |
|------|------|------|
| 教室列表 | `/academic/rooms` | 教室信息管理、状态查看 |
| 新增教室 | `/academic/rooms/new` | 创建新教室 |
| 编辑教室 | `/academic/rooms/[id]/edit` | 编辑教室信息 |
| 预约日历 | `/academic/rooms/calendar` | 查看教室预约日程（课表矩阵模式） |
| 预约审批 | `/academic/rooms/approval` | 审批教室预约申请 |

**教室类型**：
```typescript
export type RoomType = 
  | 'seminar_room'      // 教研室
  | 'lecture_hall'      // 阶梯教室
  | 'multimedia_room'   // 多媒体教室
  | 'lab'               // 实验室
  | 'meeting_room'      // 会议室
  | 'activity_room';    // 活动室
```

**教室状态**：
```typescript
export type RoomStatus = 
  | 'available'    // 空闲
  | 'in_use'       // 使用中
  | 'reserved'     // 已预约
  | 'maintenance'  // 维护中
  | 'locked';      // 已锁定
```

**教室预约流程**：
```
教师端提交预约 → 自动创建审批实例 → 发送部门通知到教务处
                                          ↓
                              教务处在"部门待办"或"预约审批"审批
                                          ↓
                              审批通过/拒绝 → 通知申请人
```

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

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/academic/rooms` | GET/POST/PUT | 教室CRUD |
| `/api/academic/rooms/[id]` | GET | 获取单个教室 |
| `/api/academic/rooms/stats` | GET | 获取教室统计 |
| `/api/academic/rooms/bookings` | GET/POST | 预约CRUD |
| `/api/academic/rooms/bookings/[id]` | GET/PUT | 单个预约操作 |

#### 3.2.4 学生管理

**功能模块**：
- 学生列表（支持分页、搜索、筛选）
- 学生详情（完整档案）
- 学生CRUD
- 批量操作

**学生详情Tab页**：
1. **基本信息**：个人基础信息、家庭信息
2. **学业成绩**：历次考试成绩
3. **习惯养成**：八大习惯得分（从德育系统同步）
4. **德育表现**：德育评价记录
5. **荣誉记录**：获得的荣誉
6. **成长档案**：成长历程记录

**敏感数据访问控制**：
- 学校领导：全部权限
- 教务主任/德育主任：全部权限
- 班主任：本班学生
- 科任教师：任教班级学生
- 家长：仅自己孩子

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/students` | GET/POST | 学生列表/创建 |
| `/api/students/[id]` | GET/PUT/DELETE | 学生详情/更新/删除 |
| `/api/students/[id]/full-profile` | GET | 学生完整档案 |
| `/api/students/[id]/habit-profile` | GET | 学生习惯档案 |
| `/api/students/batch-update` | POST | 批量更新 |
| `/api/students/batch-delete` | POST | 批量删除 |

#### 3.2.5 教师管理

**功能模块**：
- 教师列表
- 教师详情
- 教师CRUD
- 工作量统计

**教师详情包含**：
- 基本信息
- 任教班级
- 职称学历
- 荣誉记录
- 培训记录
- 教学成果

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/teachers` | GET/POST | 教师列表/创建 |
| `/api/teachers/[id]` | GET/PUT/DELETE | 教师详情/更新/删除 |
| `/api/teachers/[id]/full-profile` | GET | 教师完整档案 |
| `/api/teachers/[id]/profile` | PUT | 更新档案 |
| `/api/teachers/[id]/password` | PUT | 重置密码 |
| `/api/teachers/available` | GET | 获取可用教师 |
| `/api/teachers/workload` | GET | 工作量统计 |
| `/api/teachers/records` | GET/POST | 成长记录 |
| `/api/teachers/honors` | GET/POST | 荣誉记录 |
| `/api/teachers/trainings` | GET/POST | 培训记录 |
| `/api/teachers/achievements` | GET/POST | 教学成果 |

#### 3.2.6 考试管理 (`/academic/exams`)

**功能模块**：
- 考试列表
- 新增考试
- 考试详情
- 编辑考试

**考试类型**：
- 期中考试
- 期末考试
- 单元测试
- 模拟考试

**考试信息字段**：
```typescript
interface Exam {
  id: string;
  name: string;           // 考试名称
  type: ExamType;         // 考试类型
  startDate: string;      // 开始日期
  endDate: string;        // 结束日期
  grades: number[];       // 参考年级
  subjects: string[];     // 考试科目
  status: 'planning' | 'ongoing' | 'grading' | 'completed';
}
```

**页面路径**：
| 路径 | 功能 |
|------|------|
| `/academic/exams` | 考试列表 |
| `/academic/exams/new` | 新增考试 |
| `/academic/exams/[id]` | 考试详情 |
| `/academic/exams/[id]/edit` | 编辑考试 |

#### 3.2.7 考勤管理 (`/academic/attendance`)

**功能模块**：
- 教师考勤记录
- 出勤统计分析
- 请假统计

**考勤状态**：
- 在岗
- 请假
- 外出
- 迟到
- 早退

#### 3.2.8 新生注册 (`/academic/enrollment`)

**功能模块**：
- 新生申请列表
- 审核申请
- 批量审核
- 同步到学生库

**申请状态流转**：
```
待审核(pending) → 审核中(reviewing) → 已通过(approved) → 已同步(synced)
                                    ↘ 已拒绝(rejected)
```

**新生申请信息**：
```typescript
interface NewStudentApplication {
  // 基本信息
  studentName: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  ethnicity?: string;
  // 申请信息
  applyGrade: number;
  applyClassId?: string;
  // 家庭信息
  familyType?: '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他';
  parents: Parent[];
  // 联系信息
  homeAddress: string;
  phone?: string;
  // 学生类型
  studentType: '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭';
  // 状态
  status: ApplicationStatus;
}
```

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/enrollment/applications` | GET | 新生申请列表 |
| `/api/enrollment/applications/[id]` | GET | 申请详情 |
| `/api/enrollment/applications/[id]/approve` | POST | 通过申请 |
| `/api/enrollment/applications/[id]/reject` | POST | 拒绝申请 |
| `/api/enrollment/batch-approve` | POST | 批量通过 |
| `/api/enrollment/sync/[id]` | POST | 同步到学生库 |

#### 3.2.9 教研活动 (`/academic/research`)

**功能模块**：
- 集体备课
- 听课评课
- 教研活动记录

**活动类型**：
- 集体备课
- 公开课
- 示范课
- 观摩课
- 教学研讨

**状态**：功能开发中，使用 `MaintenancePage` 组件展示维护页面。

#### 3.2.10 质量分析 (`/academic/analysis`)

**功能模块**：
- 教学质量分析
- 成绩趋势分析
- 教师教学评价

**分析维度**：
- 班级维度
- 年级维度
- 学科维度
- 教师维度

**状态**：功能开发中，使用 `MaintenancePage` 组件展示维护页面。

#### 3.2.11 工作量统计 (`/academic/workload`)

**功能模块**：
- 教师工作量汇总
- 课时统计
- 兼职工作量
- 月度/学期报表

**工作量类型**：
- 课时工作量
- 班主任工作量
- 年段长工作量
- 教研组长工作量
- 其他兼职工作量

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/teachers/workload` | GET | 教师工作量统计 |
| `/api/workload/summary` | GET | 工作量汇总 |

#### 3.2.12 学校课表 (`/academic/school-schedule`)

**功能模块**：
- 查看全校课表
- 按年级/班级筛选
- 课表打印导出

**视图模式**：
- 班级课表
- 教师课表
- 年级课表

#### 3.2.13 家长管理 (`/academic/parents`)

**功能模块**：
- 家长列表
- 家长详情
- 家长CRUD
- 关联学生

**家长详情包含**：
- 基本信息
- 关联学生
- 联系记录

**页面路径**：
| 路径 | 功能 |
|------|------|
| `/academic/parents` | 家长列表 |
| `/academic/parents/[id]` | 家长详情 |

### 3.3 德育管理系统

#### 3.3.1 德育处工作台 (`/moral`)

**部门工作台特点**：
- **部门通知**：接收校长室等上级部门的通知
- **待办事项**：本部门需要处理的审批和任务
- **业务概况**：德育相关业务数据统计

**快速入口**：
- 习惯养成管理
- 德育活动管理
- 习惯之星评选

#### 3.3.2 习惯养成系统 (`/moral/habit`)

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

**评价流程**：
```
家长端打卡 → 班主任审核 → 德育处汇总 → 评优展示
    ↓            ↓            ↓
  积分累积    确认/调整     统计分析
```

**习惯之星等级**：
- 班级级：班级内评选
- 年级级：年级内评选
- 校级：全校评选

**API接口**：
```
/api/habit/
├── records/           # 习惯记录CRUD
├── records/[id]/      # 单条记录操作
├── goals/             # 目标管理
├── monthly-goals/     # 月度目标
├── monthly-goals/[id]/ # 月度目标操作
├── stars/             # 习惯之星评选
├── statistics/        # 统计分析
├── class-statistics/  # 班级统计
└── rules/             # 评价规则配置
```

#### 3.3.3 德育活动管理 (`/moral/activities`)

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

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/moral/activities` | GET/POST | 活动列表/创建 |
| `/api/moral/activities/[id]` | GET/PUT/DELETE | 活动详情/更新/删除 |
| `/api/moral/activities/submissions` | GET | 活动提交列表 |
| `/api/moral/activities/submissions/[id]` | PUT | 评审提交 |

### 3.4 总务后勤系统

#### 3.4.1 总务处工作台 (`/general`)

**部门工作台特点**：
- **部门通知**：接收校长室等上级部门的通知
- **待办事项**：本部门需要处理的审批和任务
- **业务概况**：总务相关业务数据统计

**快速入口**：
- 门禁管理
- 资产管理
- 维修管理
- 财务管理
- 安全管理

#### 3.4.2 门禁管理系统 (`/general/access`)

**子模块**：
| 模块 | 路径 | 功能 |
|------|------|------|
| 门禁设备 | `/general/access/devices` | 设备管理 |
| 门禁人员 | `/general/access/persons` | 人员授权 |
| 通行记录 | `/general/access/records` | 通行日志 |
| 访客管理 | `/general/access/visitors` | 访客登记 |

**门禁设备类型**：
```typescript
export type AccessDeviceType = 
  | 'gate'           // 校门闸机
  | 'building'       // 楼宇门禁
  | 'classroom'      // 教室门禁
  | 'office'         // 办公室门禁
  | 'dormitory';     // 宿舍门禁
```

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/access/devices` | GET/POST | 设备CRUD |
| `/api/access/records` | GET | 通行记录 |
| `/api/access/statistics` | GET | 门禁统计 |
| `/api/access/visitors` | GET/POST | 访客管理 |

#### 3.4.3 其他模块

| 模块 | 路径 | API | 功能 |
|------|------|-----|------|
| 资产管理 | `/general/assets` | `/api/assets` | 固定资产管理 |
| 维修管理 | `/general/repairs` | `/api/repair-requests` | 报修申请处理 |
| 财务管理 | `/general/finance` | `/api/finance/records`, `/api/expenses` | 财务收支 |
| 安全管理 | `/general/security` | `/api/safety/inspections`, `/api/safety/drills` | 安全巡查、演练 |
| 采购管理 | `/general/purchase` | - | 采购申请 |
| 后勤人员 | `/general/staff` | - | 后勤人员管理 |

### 3.5 教师工作台

#### 3.5.1 教师工作台首页 (`/teacher`)

**主要功能模块**：
1. **消息面板**：消息通知、任务提醒
2. **发布通知**：发布班级事件给家长
3. **调课中心**：年段长专属功能

**权限区分**：
- **班主任**：可查看本班学生、发布家长通知、审核习惯记录
- **科任教师**：可查看任教班级学生
- **年段长**：可处理年级调课

**Tab页面**：
1. **消息**：显示个人消息
2. **待办**：需要处理的事项
3. **调课处理**：年段长专属

#### 3.5.2 请假管理 (`/teacher/leave`, `/teacher/leave-apply`)

**请假类型**：
| 类型 | 是否需要附件 | 说明 |
|------|-------------|------|
| 病假 | 是 | 需上传医院证明（诊断证明、病假条） |
| 事假 | 否 | 因私事请假 |
| 公假 | 是 | 需上传公派任务通知 |
| 婚假 | 是 | 需上传结婚证 |
| 产假 | 是 | 需上传医院产检证明或预产期证明 |
| 丧假 | 否 | 直系亲属去世 |

**请假申请表单字段**：
```typescript
interface LeaveRequestForm {
  type: LeaveType;           // 请假类型
  startDate: string;         // 开始日期
  endDate: string;           // 结束日期
  duration: number;          // 时长（天数）
  reason: string;            // 请假原因
  attachments: Attachment[]; // 附件（病假/公假/婚假/产假必填）
  needAdjustment: boolean;   // 是否需要调课
  affectedSlots: AffectedSlot[]; // 受影响的课程时段
  approverSelection: ApproverSelection[]; // 审批人选择
  signType: SignType;        // 签批方式：会签(countersign)/或签(parallel)
}
```

**审批流程**：
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  教师提交     │───▶│  选定领导审批 │───▶│  审批通过后   │───▶│  年段长安排   │
│  请假申请     │    │  (会签/或签)  │    │  创建调课任务 │    │  调课(如需)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  选择审批人：         会签：所有人同意     无需调课：           代课(substitute)
  - 校长               或签：任一人同意     流程结束             调换(swap)
  - 书记                                                          取消(cancel)
  - 教学副校长                                                     补课(makeup)
  - 德育副校长
  - 总务副校长
```

**审批人选择机制**：
- 教师在提交请假申请时，需从校长室领导中选择审批人
- 可选审批人角色：校长(principal)、书记(secretary)、教学副校长(academic_vice_principal)、德育副校长(moral_vice_principal)、总务副校长(general_vice_principal)
- 支持多选：可选择多位领导同时审批
- 签批方式：
  - **会签(countersign)**：所有选定的审批人都需要同意
  - **或签(parallel)**：任一审批人同意即可

**流程状态追踪**：
```typescript
// LeaveFlowTracker 组件显示5个步骤
const FLOW_STEPS = [
  { key: 'submitted', title: '提交申请', description: '填写请假信息并提交' },
  { key: 'approving', title: '审批中', description: '等待审批人审核' },
  { key: 'approved', title: '审批通过', description: '审批人已批准' },
  { key: 'adjusting', title: '调课安排', description: '年段长安排课程调整' },
  { key: 'completed', title: '流程完成', description: '数据已同步' },
];
```

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/leave-requests-v2` | GET/POST | 请假申请列表/创建 |
| `/api/leave-requests-v2?my=true` | GET | 获取我的请假记录 |
| `/api/leave-requests-v2/[id]/approve` | POST | 审批请假（通过/驳回） |
| `/api/leave-requests-v2/[id]/cancel` | POST | 取消请假（撤销） |
| `/api/leave-requests-v2/pending` | GET | 待审批列表 |
| `/api/users/approvers` | GET | 获取可选审批人列表 |
| `/api/schedule/weekly` | GET | 获取本周课表（用于选择受影响课程） |

#### 3.5.3 调课管理 (`/teacher/adjust`)

**调课类型**：
- **代课 (substitute)**：找其他老师代上
- **调换 (swap)**：与其他时间互换
- **取消 (cancel)**：不上课
- **补课 (makeup)**：后续时间补上

**调课流程**：
1. 教师请假后，系统自动创建调课任务
2. 年段长接收调课通知
3. 年段长安排代课教师或调换时间
4. 系统同步更新课表
5. 通知相关人员

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/course-adjustments/process` | GET | 获取调课任务 |
| `/api/course-adjustments/recommend-teachers` | GET | 推荐代课教师 |

#### 3.5.4 教室预约 (`/teacher/room-booking`)

**预约流程**：
1. 选择日期
2. 选择教室
3. 选择时段（支持多选）
4. 填写预约信息
5. 提交预约

**课表矩阵视图**：
- 绿色：可预约
- 红色：已预约
- 灰色：维护中

#### 3.5.5 信息收集 (`/teacher/collection`)

教师发起信息收集，通知家长填写。

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/information-collections` | GET/POST | 信息收集列表/创建 |
| `/api/information-collections/[id]` | GET/PUT/DELETE | 详情/更新/删除 |
| `/api/information-collections/[id]/responses` | GET/POST | 填写响应 |

### 3.6 家长工作台

#### 3.6.1 家长工作台首页 (`/parent`)

**主要功能**：
1. **消息面板**：接收学校通知、班级消息
2. **子女信息**：查看孩子基本信息
3. **统计卡片**：未读消息数等

#### 3.6.2 习惯打卡 (`/parent/habit`)

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

#### 3.6.3 信息填写 (`/parent/collection`)

家长填写学校/教师发起的信息收集表单。

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/information-collections/parent` | GET | 获取待填写表单 |

### 3.7 领导仪表盘

#### 3.7.1 仪表盘入口 (`/dashboard`)

根据用户角色自动跳转到对应仪表盘：
- 校长 → `/dashboard/principal`
- 书记 → `/dashboard/secretary`
- 教学副校长 → `/dashboard/academic-vice-principal`
- 德育副校长 → `/dashboard/moral-vice-principal`
- 总务副校长 → `/dashboard/general-vice-principal`

#### 3.7.2 各角色仪表盘

| 仪表盘 | 关注指标 |
|--------|----------|
| 校长仪表盘 | 全校综合数据、各部门工作概况、待审批事项 |
| 书记仪表盘 | 党建数据、德育数据、教师思想动态 |
| 教学副校长 | 教务数据、教学质量、教师工作量、课表情况 |
| 德育副校长 | 德育数据、习惯养成统计、德育活动、预警学生 |
| 总务副校长 | 后勤数据、财务概况、维修情况、安全巡查 |

### 3.8 管理后台

#### 3.8.1 轮播图管理 (`/admin/carousel`)

管理学校首页轮播图内容。

**API接口**：
| API | 方法 | 功能 |
|-----|------|------|
| `/api/admin/portal/carousel` | GET/POST/PUT/DELETE | 轮播图管理 |

#### 3.8.2 领导入口 (`/leadership`)

领导层专用入口页面。

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
| `users` | 用户主表 | id, name, role, employee_id, phone, additional_roles, groups |
| `teachers` | 教师详情 | id, user_id, subjects, title, department, status, teach_years |
| `students` | 学生信息 | id, student_no, name, class_id, grade, status |
| `parents` | 家长信息 | id, name, phone, relation, student_id |
| `class_teachers` | 班级教师关系 | id, class_id, teacher_id, position, semester, status |

#### 4.2.2 组织架构相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `classes` | 班级信息 | id, name, grade, head_teacher_id, student_count |
| `groups` | 群组信息 | id, type, name, director_id, description |
| `group_members` | 群组成员 | id, group_id, user_id, is_admin, join_type |

#### 4.2.3 教务相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `rooms` | 教室信息 | id, name, code, type, building, floor, capacity, facilities, status |
| `room_bookings` | 教室预约 | id, room_id, applicant_id, booking_date, time_slots, purpose, status |
| `schedule_drafts` | 课表草稿 | id, grade, semester, slots, status |
| `official_schedules` | 正式课表 | id, class_id, semester, slots |
| `exams` | 考试信息 | id, name, type, start_date, end_date, subjects, grades |

#### 4.2.4 德育相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `habit_records` | 习惯记录 | id, student_id, category, habit, score, recorder_id, recorder_type, status |
| `habit_goals` | 月度目标 | id, student_id, category, goal, month, achieved |
| `habit_stars` | 习惯之星 | id, student_id, category, level, month |
| `moral_activities` | 德育活动 | id, title, type, start_date, end_date, participant_ids, status |

#### 4.2.5 审批与消息相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `approval_instances` | 审批实例 | id, business_type, business_id, title, applicant_id, status, current_node_order, selected_leaders |
| `approval_node_records` | 审批节点记录 | id, instance_id, node_order, node_name, status, approver_ids, approved_by |
| `messages` | 消息主表 | id, title, content, event, sender_id, recipients(JSONB) |
| `user_messages` | 用户消息 | id, message_id, user_id, status, read_at |

#### 4.2.6 门户相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `portal_carousel` | 轮播图 | id, title, type, image, video_url, bilibili_url, order, status |
| `portal_honors` | 办学荣誉 | id, title, level, date, description, images |
| `portal_philosophy` | 童心教育 | id, title, content, category, icon, order |
| `portal_achievements` | 办学成果 | id, title, category, description, images |

#### 4.2.7 总务相关

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `access_devices` | 门禁设备 | id, name, code, type, location, status |
| `access_records` | 通行记录 | id, device_id, user_id, user_name, pass_time, direction |
| `assets` | 资产信息 | id, asset_no, name, category, value, location, status |
| `repair_requests` | 维修申请 | id, applicant_id, item, location, description, priority, status |
| `expenses` | 费用记录 | id, type, amount, category, applicant_id, status |

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

// 预约用途
export type BookingPurpose = 
  | 'teaching'      // 教学活动
  | 'meeting'       // 教研会议
  | 'training'      // 培训讲座
  | 'activity'      // 学生活动
  | 'exam'          // 考试
  | 'defense'       // 答辩
  | 'competition'   // 比赛
  | 'other';        // 其他
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
  | 'announcement'       // 校园公告 - 发布到学校主页
  | 'news'               // 新闻动态 - 发布到学校主页
  | 'internal_notice'    // 内部通知 - 仅内部可见，不发布到主页
  | 'parent_notice'      // 家长通知 - 班主任发给家长
  | 'leave_request'      // 请假审批
  | 'room_booking';      // 教室预约

// 审批人类型
export type ApproverType = 
  | 'applicant'           // 申请人自己
  | 'role'                // 按角色审批
  | 'user'                // 指定用户
  | 'group_leader'        // 群组负责人
  | 'selected_leaders';   // 选定的领导

// 审批模式
export type ApprovalMode = 
  | 'or_sign'      // 或签：任一人通过即可
  | 'countersign'; // 会签：所有人都要通过
```

#### 4.3.3 消息系统类型

```typescript
// 消息事件类型
export type MessageEvent = 
  // === 系统通知 ===
  | 'system_announcement'      // 系统公告
  | 'maintenance_notice'       // 维护通知
  | 'policy_update'            // 政策更新
  // === 群组通知 ===
  | 'group_notice'             // 群组通知（根据 target_department 分发）
  // === 教务通知 ===
  | 'schedule_change'          // 调课通知
  | 'exam_notice'              // 考试通知
  | 'grade_publish'            // 成绩发布
  // === 德育通知 ===
  | 'activity_notice'          // 活动通知
  | 'habit_record'             // 习惯记录提醒
  // === 家校沟通 ===
  | 'parent_meeting'           // 家长会通知
  | 'leave_approval'           // 请假审批
  // === 个人消息 ===
  | 'personal_message'         // 个人消息
  | 'task_assign'              // 任务分配
  | 'task_reminder';           // 任务提醒

// 接收者类型
export type RecipientType = 
  | 'all'           // 全员
  | 'role'          // 按角色
  | 'class'         // 按班级
  | 'grade'         // 按年级
  | 'individual'    // 指定个人
  | 'department';   // 部门广播

// 消息优先级
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

// 消息状态
export type MessageStatus = 'unread' | 'read' | 'archived';
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
    usageStats: record.usage_stats,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
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

### 5.2 API路由完整清单 (156个)

#### 5.2.1 认证相关 (5个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/current` | GET | 获取当前用户 |
| `/api/auth/refresh` | POST | 刷新Token |
| `/api/users/change-password` | POST | 修改密码 |

#### 5.2.2 教师相关 (15个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/teachers` | GET/POST | 教师列表/创建 |
| `/api/teachers/[id]` | GET/PUT/DELETE | 教师详情/更新/删除 |
| `/api/teachers/[id]/full-profile` | GET | 教师完整档案 |
| `/api/teachers/[id]/profile` | PUT | 更新档案 |
| `/api/teachers/[id]/password` | PUT | 重置密码 |
| `/api/teachers/available` | GET | 获取可用教师 |
| `/api/teachers/workload` | GET | 工作量统计 |
| `/api/teachers/records` | GET/POST | 成长记录 |
| `/api/teachers/honors` | GET/POST | 荣誉记录 |
| `/api/teachers/trainings` | GET/POST | 培训记录 |
| `/api/teachers/achievements` | GET/POST | 教学成果 |
| `/api/teachers/batch-update` | POST | 批量更新 |
| `/api/teachers/batch-delete` | POST | 批量删除 |

#### 5.2.3 学生相关 (8个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/students` | GET/POST | 学生列表/创建 |
| `/api/students/[id]` | GET/PUT/DELETE | 学生详情/更新/删除 |
| `/api/students/[id]/full-profile` | GET | 学生完整档案 |
| `/api/students/[id]/habit-profile` | GET | 学生习惯档案 |
| `/api/students/batch-update` | POST | 批量更新 |
| `/api/students/batch-delete` | POST | 批量删除 |

#### 5.2.4 班级相关 (5个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/classes` | GET/POST | 班级列表/创建 |
| `/api/classes/[id]` | GET/PUT/DELETE | 班级详情/更新/删除 |
| `/api/classes/[id]/students` | GET | 班级学生列表 |
| `/api/class-teachers` | GET/POST | 班级教师关系 |
| `/api/class-teachers/[id]` | PUT/DELETE | 更新/删除关系 |

#### 5.2.5 家长相关 (8个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/parents` | GET/POST | 家长列表/创建 |
| `/api/parents/[id]` | GET/PUT/DELETE | 家长详情/更新/删除 |
| `/api/parents/me` | GET | 当前家长信息 |
| `/api/parents/batch` | POST | 批量创建 |
| `/api/parents/change-password` | POST | 修改密码 |
| `/api/parents/user/[id]/children` | GET | 获取子女信息 |

#### 5.2.6 教室管理 (10个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/academic/rooms` | GET/POST/PUT | 教室CRUD |
| `/api/academic/rooms/[id]` | GET | 获取单个教室 |
| `/api/academic/rooms/stats` | GET | 教室统计 |
| `/api/academic/rooms/bookings` | GET/POST | 预约CRUD |
| `/api/academic/rooms/bookings/[id]` | GET/PUT | 单个预约操作 |
| `/api/rooms` | GET | 教室列表(旧) |
| `/api/rooms/bookings` | GET/POST | 预约(旧) |
| `/api/rooms/bookings/[id]/approve` | POST | 审批预约(旧) |

#### 5.2.7 手动排课 (7个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/academic/manual-schedule/grade` | GET | 获取年级课表 |
| `/api/academic/manual-schedule/draft` | GET/POST | 草稿管理 |
| `/api/academic/manual-schedule/slot` | PUT | 更新课表格子 |
| `/api/academic/manual-schedule/publish` | POST | 发布课表 |
| `/api/academic/manual-schedule/status` | GET | 排课状态 |
| `/api/academic/manual-schedule/teachers` | GET | 可选教师 |
| `/api/academic/manual-schedule/cleanup` | POST | 清理数据 |

#### 5.2.8 习惯养成 (10个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/habit/records` | GET/POST | 习惯记录CRUD |
| `/api/habit/records/[id]` | GET/PUT/DELETE | 单条记录操作 |
| `/api/habit/goals` | GET/POST | 目标管理 |
| `/api/habit/goals/[id]` | PUT/DELETE | 目标操作 |
| `/api/habit/monthly-goals` | GET/POST | 月度目标 |
| `/api/habit/monthly-goals/[id]` | PUT/DELETE | 月度目标操作 |
| `/api/habit/stars` | GET/POST | 习惯之星 |
| `/api/habit/statistics` | GET | 统计分析 |
| `/api/habit/class-statistics` | GET | 班级统计 |
| `/api/habit/rules` | GET | 评价规则 |

#### 5.2.9 德育活动 (5个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/moral/activities` | GET/POST | 活动CRUD |
| `/api/moral/activities/[id]` | GET/PUT/DELETE | 活动详情/更新/删除 |
| `/api/moral/activities/submissions` | GET | 活动提交 |
| `/api/moral/activities/submissions/[id]` | PUT | 评审提交 |

#### 5.2.10 审批流程 (3个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/approvals` | GET/POST | 审批实例列表/创建 |
| `/api/approvals/[id]` | GET | 审批实例详情 |
| `/api/approvals/action` | POST | 执行审批操作 |

#### 5.2.11 消息系统 (3个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/messages` | GET/POST | 消息列表/发送 |
| `/api/messages/[id]` | GET/PUT/DELETE | 消息详情/更新/删除 |

#### 5.2.12 群组管理 (1个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/groups` | GET/POST | 群组列表/创建 |

#### 5.2.13 用户管理 (5个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/users/accounts` | GET | 用户账号列表 |
| `/api/users/approvers` | GET | 审批人列表 |
| `/api/users/[id]/groups` | GET/PUT | 用户群组关系 |

#### 5.2.14 请假调课 (5个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/leave-requests` | GET/POST | 请假申请(旧) |
| `/api/leave-requests-v2` | GET/POST | 请假申请 |
| `/api/leave-requests-v2/[id]/approve` | POST | 审批请假 |
| `/api/leave-requests-v2/[id]/cancel` | POST | 取消请假 |
| `/api/leave-requests-v2/pending` | GET | 待审批列表 |

#### 5.2.15 调课处理 (2个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/course-adjustments/process` | GET | 获取调课任务 |
| `/api/course-adjustments/recommend-teachers` | GET | 推荐代课教师 |

#### 5.2.16 信息收集 (4个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/information-collections` | GET/POST | 信息收集列表/创建 |
| `/api/information-collections/[id]` | GET/PUT/DELETE | 详情/更新/删除 |
| `/api/information-collections/[id]/responses` | GET/POST | 填写响应 |
| `/api/information-collections/parent` | GET | 家长待填写 |

#### 5.2.17 门户管理 (15个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/portal/carousel` | GET | 轮播图列表 |
| `/api/portal/philosophy` | GET | 童心教育内容 |
| `/api/portal/philosophy/[id]/activities` | GET | 教育活动 |
| `/api/portal/honors` | GET | 办学荣誉 |
| `/api/portal/achievements` | GET | 办学成果 |
| `/api/portal/achievements/[id]` | GET | 成果详情 |
| `/api/portal/achievements/categories` | GET | 成果分类 |
| `/api/portal/announcements` | GET | 门户公告 |
| `/api/portal/announcements/[id]` | GET | 公告详情 |
| `/api/admin/portal/carousel` | POST/PUT/DELETE | 轮播图管理 |
| `/api/admin/portal/philosophy` | POST/PUT/DELETE | 童心教育管理 |
| `/api/admin/portal/honors` | POST/PUT/DELETE | 荣誉管理 |
| `/api/admin/portal/achievements` | POST/PUT/DELETE | 成果管理 |
| `/api/admin/portal/achievements/categories` | GET/POST | 成果分类管理 |
| `/api/admin/portal/announcements` | POST/PUT/DELETE | 公告管理 |

#### 5.2.18 门禁管理 (4个)

| API | 方法 | 功能 |
|-----|------|------|
| `/api/access/devices` | GET/POST | 门禁设备 |
| `/api/access/records` | GET | 通行记录 |
| `/api/access/statistics` | GET | 门禁统计 |
| `/api/access/visitors` | GET/POST | 访客管理 |

#### 5.2.19 其他API (约40个)

包括：资产管理、费用管理、安全管理、教研活动、数据迁移、上传服务等。

---

## 6. 部门工作台设计

### 6.1 设计理念

#### 6.1.1 部门视角 vs 全局视角

**部门工作台**：
- **视角**：部门视角，只显示本部门相关业务
- **通知来源**：校长室群组的消息会发到部门通知
- **待办事项**：本部门需要处理的事项
- **适用角色**：教务主任、德育主任、总务主任

**领导工作台**：
- **视角**：全局视角，显示全校汇总数据
- **通知来源**：个人消息中心
- **待办事项**：全校性审批和任务
- **适用角色**：校长、书记、副校长

#### 6.1.2 部门工作台统一布局

```
┌────────────────────────────────────────────────────────────┐
│  部门名称                              消息 | 待办 | 业务概况  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   部门通知    │  │   待办事项    │  │   业务概况    │     │
│  │              │  │              │  │              │     │
│  │  - 通知1     │  │  - 待办1     │  │  统计卡片     │     │
│  │  - 通知2     │  │  - 待办2     │  │              │     │
│  │  - 通知3     │  │  - 待办3     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                            │
│  快速入口                                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │功能1│ │功能2│ │功能3│ │功能4│ │功能5│ │功能6│        │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
└────────────────────────────────────────────────────────────┘
```

### 6.2 各部门工作台详情

#### 6.2.1 教务处工作台 (`/academic`)

**部门通知来源**：
- 校长室群组发布的消息
- 其他部门转发的相关通知

**待办事项类型**：
- 教室预约审批
- 调课确认
- 工作量核算
- 课表发布

**业务概况**：
- 本周调课次数
- 教室使用率
- 请假教师数
- 排课完成度

**快速入口**：
- 学生管理
- 教师管理
- 班级管理
- 手动排课
- 教室管理
- 考试管理

#### 6.2.2 德育处工作台 (`/moral`)

**部门通知来源**：
- 校长室群组发布的消息
- 其他部门转发的相关通知

**待办事项类型**：
- 德育活动审批
- 习惯之星评选
- 家校沟通处理

**业务概况**：
- 本月习惯打卡统计
- 德育活动数量
- 家长满意度
- 学生德育评分分布

**快速入口**：
- 习惯养成管理
- 德育活动管理
- 习惯之星评选
- 学生德育档案

#### 6.2.3 总务处工作台 (`/general`)

**部门通知来源**：
- 校长室群组发布的消息
- 其他部门转发的相关通知

**待办事项类型**：
- 维修申请处理
- 采购申请审批
- 资产变动审批
- 费用报销审批

**业务概况**：
- 待处理维修数
- 本月费用支出
- 资产变动统计
- 安全巡查完成率

**快速入口**：
- 门禁管理
- 资产管理
- 维修管理
- 财务管理
- 安全管理
- 后勤人员

### 6.3 群组通知分发逻辑

#### 6.3.1 群组类型与通知目标

| 群组类型 | 群组标识 | 通知目标 | 通知类型 |
|----------|----------|----------|----------|
| 校长室 | `principal_office` | 群组成员的个人消息中心 | 个人消息 |
| 教务处 | `academic_office` | 教务处工作台的"部门通知" | 部门广播 |
| 德育处 | `moral_office` | 德育处工作台的"部门通知" | 部门广播 |
| 总务处 | `general_office` | 总务处工作台的"部门通知" | 部门广播 |

#### 6.3.2 通知分发实现

```typescript
// 消息发送逻辑
async function sendGroupNotification(groupType: GroupType, message: Message) {
  if (groupType === 'principal_office') {
    // 校长室：发给群组成员的个人消息中心
    const members = await getGroupMembers(groupType);
    for (const member of members) {
      await createPersonalMessage(member.userId, message);
    }
  } else {
    // 其他群组：发到部门工作台的"部门通知"
    await createDepartmentNotice(groupType, message);
  }
}
```

---

## 7. 审批流程设计

### 7.1 审批流程架构

#### 7.1.1 核心概念

**审批定义 (ApprovalDefinition)**：
- 定义审批流的模板
- 包含审批节点配置
- 支持动态审批人选择

**审批实例 (ApprovalInstance)**：
- 具体的一次审批流程
- 关联业务对象（请假、预约等）
- 记录审批进度

**审批节点记录 (ApprovalNodeRecord)**：
- 记录每个审批节点的状态
- 包含审批人和审批结果

#### 7.1.2 审批流程类型

| 业务类型 | 审批流程 | 审批人 |
|----------|----------|--------|
| 请假申请 | 年段长→教务处备案 | 年段长、教务主任 |
| 教室预约 | 教务处审批 | 教务主任 |
| 德育活动 | 德育处审批 | 德育主任 |
| 费用报销 | 总务处审批 | 总务主任 |
| 校长通知 | 选定领导审批 | 选定的副校长 |

### 7.2 审批流程配置

#### 7.2.1 审批节点配置

```typescript
interface ApprovalNodeConfig {
  order: number;                    // 节点顺序
  name: string;                     // 节点名称
  approverType: ApproverType;       // 审批人类型
  approverIds?: string[];           // 指定审批人ID
  approverRole?: UserRole;          // 按角色审批
  approvalMode: ApprovalMode;       // 审批模式（或签/会签）
  timeout?: number;                 // 超时时间（小时）
  timeoutAction?: 'auto_approve' | 'auto_reject';  // 超时动作
}
```

#### 7.2.2 示例：请假审批流程

```typescript
const leaveApprovalConfig = {
  businessType: 'leave_request',
  nodes: [
    {
      order: 1,
      name: '年段长审批',
      approverType: 'role',
      approverRole: 'grade_leader',
      approvalMode: 'or_sign',
      timeout: 24,
      timeoutAction: 'auto_approve'
    },
    {
      order: 2,
      name: '教务处备案',
      approverType: 'role',
      approverRole: 'academic_director',
      approvalMode: 'or_sign'
    }
  ]
};
```

### 7.3 审批操作

#### 7.3.1 审批动作类型

```typescript
type ApprovalAction = 
  | 'approve'    // 通过
  | 'reject'     // 驳回
  | 'withdraw'   // 撤回
  | 'transfer';  // 转交
```

#### 7.3.2 审批API

```typescript
// 执行审批操作
POST /api/approvals/action
{
  "instanceId": "xxx",
  "action": "approve",
  "comment": "同意",
  "nextApproverIds": []  // 转交时需要
}
```

### 7.4 审批通知

#### 7.4.1 通知时机

| 事件 | 通知对象 | 通知内容 |
|------|----------|----------|
| 提交审批 | 审批人 | 有新的审批待处理 |
| 审批通过 | 申请人 | 您的申请已通过 |
| 审批驳回 | 申请人 | 您的申请被驳回，原因：xxx |
| 审批转交 | 新审批人 | 有审批转交给您 |
| 审批超时 | 审批人、申请人 | 审批已超时 |

---

## 8. 消息系统设计

### 8.1 消息系统架构

#### 8.1.1 消息类型

**系统通知**：
- 系统公告
- 维护通知
- 政策更新

**业务通知**：
- 调课通知
- 考试通知
- 活动通知
- 审批通知

**家校沟通**：
- 家长会通知
- 班级事件通知
- 学生动态通知

**个人消息**：
- 个人消息
- 任务分配
- 任务提醒

#### 8.1.2 消息发送模式

**点对点消息**：
- 发送给指定用户
- 存储在用户消息中心

**广播消息**：
- 按角色广播
- 按班级广播
- 按年级广播
- 按部门广播

### 8.2 消息存储设计

#### 8.2.1 消息主表 (messages)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  event VARCHAR(100) NOT NULL,          -- 消息事件类型
  sender_id UUID NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  recipients JSONB,                      -- 接收者配置
  target_department VARCHAR(50),         -- 目标部门（部门广播）
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 8.2.2 用户消息表 (user_messages)

```sql
CREATE TABLE user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'unread',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.3 消息发送流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  发送消息请求  │───▶│  解析接收者   │───▶│  创建消息记录  │
│  (API调用)    │    │  recipients  │    │  messages表   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                    ┌──────────────┐    ┌──────────────┐
                    │  通知目标用户  │◀───│ 创建用户消息  │
                    │  (实时推送)   │    │ user_messages│
                    └──────────────┘    └──────────────┘
```

### 8.4 部门广播实现

#### 8.4.1 部门广播场景

当消息的 `target_department` 设置为某个部门时，该消息会显示在对应部门工作台的"部门通知"区域。

#### 8.4.2 实现逻辑

```typescript
// 获取部门通知
async function getDepartmentNotices(department: GroupType) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('target_department', department)
    .order('created_at', { ascending: false });
  
  return data;
}

// 教务处工作台获取通知
// GET /api/messages?target_department=academic_office
```

---

## 9. 安全设计

### 9.1 认证安全

#### 9.1.1 JWT Token安全

**Token生成**：
- 使用 RS256 非对称加密算法
- 包含用户ID、角色、过期时间
- 签名密钥存储在环境变量中

**Token存储**：
- HttpOnly Cookie：防止XSS攻击
- localStorage：用于前端请求头携带

**Token刷新**：
- Access Token有效期：2小时
- Refresh Token有效期：7天
- 自动刷新机制：`authFetch` 封装

#### 9.1.2 密码安全

- 密码加密存储（bcrypt）
- 支持密码重置
- 支持密码修改

### 9.2 授权安全

#### 9.2.1 权限检查层级

```
┌─────────────────────────────────────────────────────────────┐
│                        前端权限检查                           │
│  - 页面访问控制 (usePermissions Hook)                        │
│  - 组件渲染控制 (条件渲染)                                     │
│  - 操作按钮控制 (禁用/隐藏)                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API权限检查                            │
│  - 路由中间件 (验证Token)                                     │
│  - 业务逻辑检查 (验证角色/权限)                                │
│  - 数据访问控制 (验证数据所有权)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据库权限检查                          │
│  - 行级安全策略 (RLS)                                         │
│  - 数据隔离 (按角色/班级过滤)                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 9.2.2 数据访问控制

**学生数据访问规则**：

| 角色 | 访问范围 |
|------|----------|
| 校长/书记/副校长 | 全部学生 |
| 教务主任/德育主任 | 全部学生 |
| 年段长 | 本年级学生 |
| 班主任 | 本班学生 |
| 科任教师 | 任教班级学生 |
| 家长 | 仅自己孩子 |

**实现示例**：
```typescript
// API层权限检查
if (!hasAccessToStudent(user, studentId)) {
  return NextResponse.json({ 
    success: false, 
    error: '无权访问该学生信息' 
  }, { status: 403 });
}

function hasAccessToStudent(user: User, studentId: string): boolean {
  // 领导层全部权限
  if (['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal'].includes(user.role)) {
    return true;
  }
  
  // 教务主任、德育主任
  if (['academic_director', 'moral_director'].includes(user.administrativeRole)) {
    return true;
  }
  
  // 班主任：本班学生
  if (user.role === 'head_teacher') {
    return isStudentInClass(studentId, user.classId);
  }
  
  // 科任教师：任教班级学生
  if (user.role === 'subject_teacher') {
    return isStudentInTaughtClasses(studentId, user.id);
  }
  
  // 家长：自己孩子
  if (user.role === 'parent') {
    return isParentOfStudent(user.id, studentId);
  }
  
  return false;
}
```

### 9.3 数据安全

#### 9.3.1 敏感数据处理

**密码脱敏**：
- 数据库中存储加密后的密码
- API返回时过滤密码字段

**个人信息保护**：
- 手机号部分隐藏：`138****1234`
- 身份证号部分隐藏：`310***********1234`

#### 9.3.2 数据传输安全

- 强制HTTPS
- API请求签名验证
- 敏感操作二次验证

### 9.4 日志审计

#### 9.4.1 审计日志

记录关键操作：
- 用户登录/登出
- 数据修改操作
- 敏感信息访问
- 权限变更

#### 9.4.2 日志存储

- 日志路径：`/app/work/logs/bypass/`
- 日志类型：
  - `app.log`：主流程日志
  - `dev.log`：开发调试日志
  - `console.log`：浏览器控制台日志

---

## 10. 性能优化

### 10.1 前端优化

#### 10.1.1 代码分割

- 路由级懒加载
- 组件级动态导入
- 第三方库按需加载

#### 10.1.2 状态管理

- 使用 Hooks 管理组件状态
- 数据缓存在 Hooks 层
- 避免重复请求

#### 10.1.3 渲染优化

- 使用 React.memo 减少重渲染
- 使用 useMemo/useCallback 缓存计算结果
- 虚拟列表处理大数据量

### 10.2 后端优化

#### 10.2.1 数据库优化

- 合理使用索引
- 查询字段精简
- 分页查询

#### 10.2.2 API优化

- 响应数据压缩
- 缓存热点数据
- 批量接口合并请求

### 10.3 缓存策略

#### 10.3.1 数据缓存

- 教师列表缓存
- 班级列表缓存
- 课表数据缓存

#### 10.3.2 缓存更新

- 数据变更时清除相关缓存
- 定时刷新缓存

---

## 11. 部署架构

### 11.1 部署环境

#### 11.1.1 开发环境

- 本地开发：`pnpm dev` (端口5000)
- 热更新支持
- 开发日志输出

#### 11.1.2 生产环境

- 构建命令：`pnpm build`
- 启动命令：`pnpm start`
- 环境变量配置

### 11.2 环境变量

```bash
# Supabase 数据库
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# JWT 密钥
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx

# 对象存储
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=xxx
S3_ENDPOINT=xxx

# 其他
NODE_ENV=production
```

### 11.3 部署流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  代码提交     │───▶│  自动构建     │───▶│  自动部署     │
│              │    │  pnpm build  │    │  pnpm start  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 12. 扩展性设计

### 12.1 模块化设计

- 各业务模块独立
- 统一的API接口规范
- 可插拔的组件架构

### 12.2 未来扩展方向

1. **智能排课**：基于约束满足算法的自动排课
2. **AI辅助**：成绩分析、学生画像、智能推荐
3. **移动端适配**：响应式设计优化
4. **数据大屏**：实时数据展示
5. **消息推送**：实时消息推送服务

---

## 附录

### A. 技术栈版本清单

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.x | App Router |
| React | 19.x | 最新版本 |
| TypeScript | 5.x | 严格模式 |
| Tailwind CSS | 4.x | 原子化CSS |
| shadcn/ui | latest | 组件库 |
| Supabase Client | 2.x | 数据库客户端 |
| jose | 6.x | JWT处理 |
| zod | 4.x | 参数校验 |
| date-fns | 4.x | 日期处理 |
| Recharts | 2.x | 图表库 |
| Lucide React | latest | 图标库 |
| Sonner | latest | Toast通知 |
| pnpm | latest | 包管理器 |

### B. 参考资料

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**文档版本**: v1.0
**最后更新**: 2025-01-17
**维护者**: 开发团队