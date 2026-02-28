# 软件设计文档 (SDD)

**项目名称**: 龙岩师范附属小学智慧校园管理平台  
**文档版本**: v1.4  
**编制日期**: 2024年1月  
**编制单位**: 智慧校园项目组

---

## 目录

1. [概述](#1-概述)
2. [架构设计](#2-架构设计)
3. [模块设计](#3-模块设计)
4. [数据设计](#4-数据设计)
5. [接口设计](#5-接口设计)
6. [部署设计](#6-部署设计)
7. [设计约束](#7-设计约束)
8. [验收准则](#8-验收准则)
9. [附录](#9-附录)

---

## 1. 概述

### 1.1 文档目的

本文档是龙岩师范附属小学智慧校园管理平台的软件设计文档(SDD)，旨在：
- 为开发团队提供详细的技术实现指南
- 为测试团队提供验收测试依据
- 为运维团队提供部署维护参考
- 为甲方提供系统设计审阅材料

### 1.2 项目背景

龙岩师范附属小学是一所具有百年历史的省级示范小学，学校现有36个教学班，教职工120余人，学生1800余人。随着教育信息化2.0行动计划的深入推进，学校亟需建设一套集成化、智能化的校园管理平台，实现：

- **统一门户**: 一站式访问所有业务系统
- **统一身份认证**: 单点登录，权限精细化管理
- **统一数据管理**: 消除数据孤岛，实现数据共享

### 1.3 系统范围

智慧校园平台涵盖**九大核心业务系统**，共计**60+功能模块**：

| 系统名称 | 主要功能 | 功能模块数 | 目标用户 |
|----------|----------|------------|----------|
| 总务后勤系统 | 财务报销、资产管理、维修管理、功能室预约、门禁管理、安全管理 | 12 | 后勤人员、财务人员 |
| 教务教研系统 | 课表管理、调课代课、工作量统计、考试管理、教研活动、教师发展 | 15 | 教务员、教师 |
| 德育管理系统 | 学生管理、行为评价、习惯养成、活动管理、成长档案 | 12 | 德育员、班主任 |
| 教师空间 | 个人信息、请假申请、工资查询、教研参与 | 8 | 全体教师 |
| 家长端 | 学生信息、缴费记录、习惯记录、成绩查询 | 6 | 学生家长 |
| 新生注册系统 | 信息采集、审核分配、学籍同步 | 4 | 教务、家长 |
| 数据中心 | 数据采集、数据链接、迁移工具 | 3 | 系统管理员 |
| 工作流引擎 | 流程配置、审批实例、流程监控 | 3 | 系统管理员 |
| 公共组件 | 文件上传、图片搜索、通讯通知 | 3 | 所有用户 |

### 1.4 术语定义

| 术语 | 定义 |
|------|------|
| RBAC | 基于角色的访问控制 (Role-Based Access Control) |
| JWT | JSON Web Token，用于身份认证的令牌标准 |
| SSE | Server-Sent Events，服务器推送事件 |
| HMR | Hot Module Replacement，热模块替换 |
| 基准课表 | 学期开始前确定的固定课表 |
| 实际课表 | 根据请假、代课动态生成的每周课表 |
| 习惯养成 | 学生日常行为习惯评价与追踪系统 |

### 1.5 参考文档

| 文档名称 | 版本 | 说明 |
|----------|------|------|
| 需求规格说明书 | v1.0 | 功能需求详细说明 |
| 技术选型报告 | v1.0 | 技术架构决策依据 |
| 接口规范文档 | v1.0 | API接口详细定义 |
| 数据库设计文档 | v1.0 | 数据表结构说明 |

---

## 2. 架构设计

### 2.1 总体架构

采用**前后端分离**的微服务化架构，整体分为四层：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         展示层 (Presentation)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 总务系统  │ │ 教务系统  │ │ 德育系统  │ │教师空间  │ │ 家长端   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         应用层 (Application)                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Next.js API Routes                        │    │
│  │  /api/auth  /api/teachers  /api/students  /api/expenses...   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         服务层 (Service)                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │认证服务  │ │业务服务  │ │文件服务  │ │搜索服务  │ │消息服务  │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         数据层 (Data)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │  S3 Storage │  │   Redis     │  │Elasticsearch│ │
│  │ (Supabase)  │  │ (对象存储)   │  │   (缓存)    │  │  (搜索)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术架构

#### 2.2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.x | 全栈框架 (App Router) |
| React | 19.x | UI组件库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 样式系统 |
| shadcn/ui | latest | 组件库 |

#### 2.2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 16.x | BFF层API |
| Supabase | latest | 数据库+认证 |
| jose | latest | JWT处理 |
| zod | latest | 参数校验 |

#### 2.2.3 基础设施

| 服务 | 用途 |
|------|------|
| Supabase PostgreSQL | 主数据库 |
| S3兼容对象存储 | 文件存储 |
| Vercel/自建服务器 | 应用托管 |

### 2.3 认证授权架构

#### 2.3.1 角色权限体系

系统支持**13种角色**，**6大模块**，**5级权限**：

**角色层级**:
```
┌─────────────────────────────────────────────────────────────┐
│                      学校领导层                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │    校长     │ │    书记     │ │       分管副校长         │ │
│  │ (principal) │ │  (secretary)│ │   (vice_principal)      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      部门负责人                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   教务主任   │ │   德育主任   │ │       总务主任          │ │
│  │(academic_  │ │  (moral_    │ │   (general_director)    │ │
│  │ director)   │ │  director)  │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      普通职员                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   教务员     │ │   德育员     │ │        年段长           │ │
│  │(academic_  │ │  (moral_    │ │    (grade_leader)       │ │
│  │  staff)     │ │  staff)     │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      教师群体                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   班主任     │ │   普通教师   │ │       后勤人员          │ │
│  │(head_teacher│ │  (teacher)  │ │      (staff)            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      外部用户                                │
│  ┌─────────────┐ ┌─────────────┐                            │
│  │    学生     │ │    家长     │                            │
│  │  (student)  │ │  (parent)   │                            │
│  └─────────────┘ └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 权限矩阵

| 角色 | 总务 | 教务 | 德育 | 教师空间 | 家长端 |
|------|------|------|------|----------|--------|
| 校长/书记 | admin | admin | admin | admin | - |
| 教务主任 | view | manage | view | view | - |
| 德育主任 | view | view | manage | view | - |
| 总务主任 | manage | view | view | view | - |
| 教务员 | - | edit | - | - | - |
| 德育员 | - | - | edit | - | - |
| 年段长 | - | approve* | - | edit | - |
| 班主任 | - | - | - | edit | - |
| 普通教师 | - | - | - | view | - |
| 家长 | - | - | - | - | edit |

*年段长专属权限: 调课管理、接收请假通知、指派代课教师、查看年级课表

### 2.4 高并发保护机制

#### 2.4.1 高并发场景分析

开学季和特定时段会出现明显的高并发访问：

| 场景 | 高峰时段 | 预估并发量 | 风险等级 |
|------|----------|------------|----------|
| 新生注册 | 8月底-9月初 | 500-1000 QPS | 高 |
| 家长端成绩查询 | 考试成绩发布后1小时 | 800-1500 QPS | 高 |
| 家长端缴费 | 缴费通知发布后 | 300-500 QPS | 中 |
| 教师端打卡/请假 | 早8点、下午5点 | 200-400 QPS | 中 |
| 门禁记录同步 | 上下学时段 | 100-200 QPS | 低 |

#### 2.4.2 限流策略

**基于Redis的分布式限流**，采用滑动窗口算法：

```typescript
// 限流中间件实现
interface RateLimitConfig {
  windowMs: number;      // 时间窗口（毫秒）
  maxRequests: number;   // 窗口内最大请求数
  keyPrefix: string;     // Redis key前缀
}

// API限流配置
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // 新生注册 - 严格限流
  '/api/enrollment': { windowMs: 60000, maxRequests: 100, keyPrefix: 'enrollment' },
  
  // 成绩查询 - 宽松限流
  '/api/grades': { windowMs: 60000, maxRequests: 200, keyPrefix: 'grades' },
  
  // 家长端通用
  '/api/students': { windowMs: 60000, maxRequests: 300, keyPrefix: 'parent' },
  
  // 认证接口 - 防暴力破解
  '/api/auth/login': { windowMs: 900000, maxRequests: 5, keyPrefix: 'login' },
  
  // 默认限流
  'default': { windowMs: 60000, maxRequests: 500, keyPrefix: 'default' },
};
```

**限流级别**:

| 级别 | 策略 | 适用场景 |
|------|------|----------|
| IP级别 | 同一IP限流 | 防止恶意攻击 |
| 用户级别 | 同一用户ID限流 | 防止单用户刷接口 |
| 接口级别 | 单接口全局限流 | 保护核心接口 |
| 租户级别 | 全局QPS限制 | 系统整体保护 |

**限流响应**:
```json
{
  "success": false,
  "error": "请求过于频繁，请稍后再试",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

#### 2.4.3 熔断机制

采用熔断器模式防止级联故障：

```typescript
// 熔断器状态机
enum CircuitState {
  CLOSED,      // 正常状态
  OPEN,        // 熔断状态
  HALF_OPEN,   // 半开状态（试探性恢复）
}

// 熔断器配置
interface CircuitBreakerConfig {
  failureThreshold: number;    // 失败次数阈值
  successThreshold: number;    // 半开状态成功次数阈值
  timeout: number;             // 熔断超时时间（ms）
  resetTimeout: number;        // 熔断恢复时间（ms）
}

// 各服务熔断配置
const circuitConfigs: Record<string, CircuitBreakerConfig> = {
  'database': { failureThreshold: 5, successThreshold: 3, timeout: 30000, resetTimeout: 60000 },
  'storage': { failureThreshold: 3, successThreshold: 2, timeout: 10000, resetTimeout: 30000 },
  'cache': { failureThreshold: 5, successThreshold: 2, timeout: 5000, resetTimeout: 15000 },
};
```

**熔断降级策略**:

| 服务 | 熔断后降级方案 |
|------|----------------|
| 数据库 | 返回Mock数据 / 缓存数据 |
| 对象存储 | 返回默认占位图 / 延迟加载 |
| 缓存 | 直接查询数据库（有限流保护） |
| 搜索服务 | 返回空结果 / 简单匹配 |

#### 2.4.4 队列削峰

对于写入密集型操作，采用消息队列削峰：

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  客户端   │────▶│  消息队列     │────▶│  后端处理    │
│(高并发写) │     │ (Redis/RabbitMQ)│   │ (异步消费)   │
└──────────┘     └──────────────┘     └──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  持久化存储   │
                 └──────────────┘
```

**异步处理场景**:

| 场景 | 队列类型 | 处理方式 |
|------|----------|----------|
| 门禁记录同步 | Redis List | 批量写入数据库 |
| 习惯评价记录 | Redis List | 批量聚合计算 |
| 通知推送 | Redis Stream | 异步推送 |
| 数据统计 | Redis List | 定时任务消费 |

#### 2.4.5 缓存策略

**多级缓存架构**:

```
┌─────────────┐
│  客户端缓存  │  ← Cache-Control / ETag
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CDN缓存    │  ← 静态资源 / 公共数据
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Redis缓存  │  ← 热点数据 / 会话数据
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  数据库     │  ← 持久化存储
└─────────────┘
```

**缓存规则**:

| 数据类型 | 缓存时间 | 更新策略 |
|----------|----------|----------|
| 课表数据 | 5分钟 | 定时刷新 |
| 用户信息 | 30分钟 | 写时更新 |
| 统计数据 | 10分钟 | 定时刷新 |
| 配置数据 | 1小时 | 写时失效 |
| 公告通知 | 5分钟 | 写时失效 |

---

## 3. 模块设计

### 3.1 系统模块总览

项目采用 Next.js App Router 架构，页面按功能模块组织在 `src/app/` 目录下：

```
智慧校园平台 (91个页面)
├── academic/          教务系统 (21个页面)
│   ├── analysis/      教学分析
│   ├── attendance/    考勤管理
│   ├── classes/       班级管理
│   │   └── [id]/schedule/  班级课表
│   ├── enrollment/    新生注册
│   ├── exams/         考试管理
│   ├── grades/        成绩管理
│   ├── research/      教研活动
│   ├── rooms/         功能室预约
│   │   ├── approval/  预约审批
│   │   ├── booking/   预约申请
│   │   └── calendar/  预约日历
│   ├── schedule/      课表管理
│   │   └── actual/    实际课表
│   ├── students/      学生管理
│   │   └── [id]/      学生详情
│   ├── teachers/      教师管理
│   │   └── [id]/      教师详情
│   └── workload/      工作量统计
│
├── general/           总务系统 (12个页面)
│   ├── access/        门禁管理
│   │   ├── devices/   设备管理
│   │   ├── persons/   人员管理
│   │   ├── records/   通行记录
│   │   └── visitors/  访客管理
│   ├── assets/        资产管理
│   ├── devices/       设备管理
│   ├── environment/   环境管理
│   ├── finance/       财务管理
│   ├── purchase/      采购管理
│   ├── repairs/       维修管理
│   ├── security/      安全管理
│   └── staff/         员工管理
│
├── moral/             德育系统 (14个页面)
│   ├── activities/    德育活动
│   ├── alerts/        预警管理
│   ├── analytics/     德育分析
│   ├── assessment/    行为评价
│   ├── growth/        成长档案
│   ├── habit/         习惯养成
│   │   ├── goals/     习惯目标
│   │   ├── overview/  习惯概览
│   │   ├── reports/   习惯报告
│   │   ├── settings/  习惯设置
│   │   ├── stars/     习惯之星
│   │   └── students/  学生习惯
│   ├── pioneer/       先锋管理
│   └── plans/         德育计划
│
├── teacher/           教师空间 (20个页面)
│   ├── adjust/        调课管理
│   ├── admin/         管理功能
│   ├── class/         班级管理
│   │   └── students/[id]/  学生详情
│   ├── collect/       数据收集
│   ├── communication/ 家校通讯
│   ├── daily/         日常管理
│   ├── expense/       报销管理
│   ├── grade/         年级管理
│   ├── grade-habit/   年级习惯
│   ├── grade-schedule/ 年级课表
│   ├── habit/         习惯管理
│   ├── homework/      作业管理
│   ├── leave/         请假管理
│   ├── moral/         德育工作
│   ├── profile/       个人中心
│   └── safety/        安全管理
│
├── parent/            家长端 (6个页面)
│   ├── announcements/ 公告通知
│   ├── children/      孩子信息
│   ├── enrollment/    新生注册
│   ├── grades/        成绩查询
│   └── habit/         习惯记录
│
├── workflow/          工作流 (6个页面)
│   ├── config/        流程配置
│   │   └── edit/      流程编辑
│   ├── expense/       报销流程
│   ├── leave/         请假流程
│   ├── purchase/      采购流程
│   └── repair/        维修流程
│
├── homepage/          首页管理 (5个页面)
│   ├── honors/        荣誉展示
│   ├── images/        图片管理
│   ├── news/          新闻管理
│   └── sections/      板块管理
│
├── dashboard/         仪表盘 (4个页面)
│   ├── principal/     校长仪表盘
│   ├── secretary/     书记仪表盘
│   └── vice-principal/ 副校长仪表盘
│
└── login/             登录页
```

### 3.2 教务系统 (academic)

教务系统是学校的核心业务系统，涵盖课表、成绩、考试、教研等功能。

#### 3.2.1 课表管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 基准课表 | /academic/schedule | 学期开始前确定的固定课表 |
| 实际课表 | /academic/schedule/actual | 每周生成，反映请假、代课等变化 |
| 班级课表 | /academic/classes/[id]/schedule | 各班级课表查询 |

**课表数据模型**:
| 数据类型 | 说明 | 更新频率 |
|----------|------|----------|
| 基准课表 | 学期开始前确定的固定课表 | 学期初 |
| 实际课表 | 根据请假、代课动态生成的每周课表 | 每周 |
| 调课记录 | 所有调课申请的记录 | 实时追加 |

#### 3.2.2 学生管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 学生列表 | /academic/students | 学生档案管理、学籍管理 |
| 学生详情 | /academic/students/[id] | 学生完整信息查看与编辑 |

#### 3.2.3 教师管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 教师列表 | /academic/teachers | 教师档案管理 |
| 教师详情 | /academic/teachers/[id] | 教师完整信息、工作量统计 |

#### 3.2.4 新生注册

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 新生注册 | /academic/enrollment | 新生信息采集、审核、班级分配 |

**业务流程**:
```
家长端提交信息 → 教务审核 → 分配班级 → 手动同步到学生管理
```

#### 3.2.5 考试与成绩

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 考试管理 | /academic/exams | 考试安排、成绩录入 |
| 成绩管理 | /academic/grades | 成绩查询、分析统计 |

#### 3.2.6 教研活动

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 教研活动 | /academic/research | 集体备课、听课评课、教研活动管理 |

#### 3.2.7 功能室预约

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 预约申请 | /academic/rooms/booking | 功能室预约申请 |
| 预约审批 | /academic/rooms/approval | 预约审批管理 |
| 预约日历 | /academic/rooms/calendar | 可视化预约日历 |

#### 3.2.8 工作量统计

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 工作量统计 | /academic/workload | 教师工作量计算与统计 |

**工作量计算公式**:
```
教师工作量 = 基准课时 × 班级系数 + 代课课时 + 课后服务课时
```

#### 3.2.9 考勤管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 考勤管理 | /academic/attendance | 教师考勤记录与统计 |

### 3.3 总务系统 (general)

总务系统负责学校后勤保障工作，涵盖财务、资产、维修、门禁等功能。

#### 3.3.1 门禁管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 设备管理 | /general/access/devices | 门禁设备增删改查、状态监控 |
| 人员管理 | /general/access/persons | 通行人员信息管理 |
| 通行记录 | /general/access/records | 进出记录查询、异常告警 |
| 访客管理 | /general/access/visitors | 访客预约、访客审批、访客记录 |

**数据统计指标**:
- 今日通行总数、进入人数、外出人数
- 按人员类型统计（学生/教师/后勤/访客）
- 异常通行记录数
- 设备在线/离线/故障数量

#### 3.3.2 财务管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 财务管理 | /general/finance | 报销申请、审批、统计 |

**报销审批流程**:
```
申请人提交 → 部门负责人审核 → 财务审核 → 总务主任审批 → 校长审批(大额)
```

**金额审批权限**:
| 金额范围 | 审批人 |
|----------|--------|
| ≤1000元 | 部门负责人 |
| 1000-5000元 | 总务主任 |
| 5000-20000元 | 分管副校长 |
| >20000元 | 校长 |

#### 3.3.3 资产与设备

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 资产管理 | /general/assets | 资产登记、领用、报废 |
| 设备管理 | /general/devices | 设备台账、维护记录 |

#### 3.3.4 维修与采购

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 维修管理 | /general/repairs | 报修申请、派工、验收 |
| 采购管理 | /general/purchase | 采购申请、审批流程 |

#### 3.3.5 安全管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 安全管理 | /general/security | 安全演练、安全检查、隐患整改 |

**功能模块**:
| 子模块 | 功能描述 |
|--------|----------|
| 安全演练 | 演练计划、演练记录、演练评估 |
| 安全检查 | 检查计划、检查记录、隐患整改 |
| 隐患整改 | 隐患上报、整改跟踪、验收闭环 |

### 3.4 德育系统 (moral)

德育系统负责学生思想品德教育、习惯养成、成长档案管理等工作。

#### 3.4.1 习惯养成

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 习惯概览 | /moral/habit/overview | 习惯养成整体概况 |
| 习惯目标 | /moral/habit/goals | 习惯目标设置与管理 |
| 学生习惯 | /moral/habit/students | 学生习惯评价记录 |
| 习惯之星 | /moral/habit/stars | 习惯之星评选与展示 |
| 习惯报告 | /moral/habit/reports | 习惯养成统计报告 |
| 习惯设置 | /moral/habit/settings | 习惯评价规则配置 |

**习惯评价体系**:
| 类别 | 习惯项目 | 评价方式 |
|------|----------|----------|
| 学习习惯 | 按时完成作业、课前预习 | 每日评价 |
| 生活习惯 | 按时作息、整理书包 | 每日评价 |
| 行为习惯 | 文明礼貌、遵守纪律 | 每日评价 |
| 卫生习惯 | 个人卫生、环境卫生 | 每日评价 |

#### 3.4.2 行为评价与预警

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 行为评价 | /moral/assessment | 学生日常行为评价 |
| 预警管理 | /moral/alerts | 行为预警、提醒推送 |

#### 3.4.3 成长档案

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 成长档案 | /moral/growth | 学生成长记录、荣誉管理、综合素质 |

#### 3.4.4 德育活动

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 德育活动 | /moral/activities | 活动发布、报名、记录、评价 |
| 德育计划 | /moral/plans | 德育工作计划制定与执行 |
| 先锋管理 | /moral/pioneer | 少先队相关工作管理 |

#### 3.4.5 德育分析

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 德育分析 | /moral/analytics | 德育工作数据统计分析 |

### 3.5 教师空间 (teacher)

教师空间是教师的个人工作台，提供教学管理、请假报销、班级管理等功能。

#### 3.5.1 个人中心

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 个人中心 | /teacher/profile | 基本信息、我的课表、密码修改 |

#### 3.5.2 教学管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 作业管理 | /teacher/homework | 作业布置、批改记录 |
| 习惯管理 | /teacher/habit | 班级习惯评价 |
| 德育工作 | /teacher/moral | 班级德育工作记录 |
| 日常管理 | /teacher/daily | 日常事务处理 |

#### 3.5.3 班级与年级管理

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 班级管理 | /teacher/class | 班级学生管理 |
| 年级管理 | /teacher/grade | 年段长专属功能 |
| 年级课表 | /teacher/grade-schedule | 年级课表查看 |
| 年级习惯 | /teacher/grade-habit | 年级习惯统计 |

#### 3.5.4 请假与调课

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 请假管理 | /teacher/leave | 请假申请、审批记录 |
| 调课管理 | /teacher/adjust | 调课申请、代课安排 |

#### 3.5.5 报销与通讯

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 报销管理 | /teacher/expense | 报销申请、进度查询 |
| 家校通讯 | /teacher/communication | 与家长沟通记录 |

#### 3.5.6 年段长专属功能

年段长除普通教师功能外，还拥有以下专属权限：

| 功能 | 路由 | 说明 |
|------|------|------|
| 年级管理 | /teacher/grade | 本年级整体管理 |
| 年级课表 | /teacher/grade-schedule | 查看本年级所有班级课表 |
| 年级习惯 | /teacher/grade-habit | 本年级习惯养成统计 |
| 调课管理 | /teacher/adjust | 本年级调课申请审批 |

### 3.6 家长端 (parent)

家长端为家长提供查看孩子在校情况、参与习惯养成等功能。

#### 3.6.1 孩子信息

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 孩子信息 | /parent/children | 查看孩子基本信息、班级动态 |

#### 3.6.2 习惯记录

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 习惯记录 | /parent/habit | 查看学校习惯评价、家庭端习惯打卡 |

**功能说明**:
| 功能 | 说明 |
|------|------|
| 习惯查看 | 查看学校习惯评价记录 |
| 习惯打卡 | 家庭端习惯打卡（如按时起床） |
| 习惯统计 | 月度习惯养成统计 |

#### 3.6.3 成绩查询

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 成绩查询 | /parent/grades | 考试成绩、成绩分析 |

#### 3.6.4 公告通知

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 公告通知 | /parent/announcements | 学校公告、班级通知 |

#### 3.6.5 新生注册

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 新生注册 | /parent/enrollment | 家长端新生信息填报 |

### 3.7 工作流系统 (workflow)

工作流系统提供流程配置和审批实例管理。

#### 3.7.1 流程配置

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 流程配置 | /workflow/config | 流程模板配置 |
| 流程编辑 | /workflow/config/edit | 流程节点编辑 |

#### 3.7.2 审批流程

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 报销流程 | /workflow/expense | 报销审批流程 |
| 请假流程 | /workflow/leave | 请假审批流程 |
| 采购流程 | /workflow/purchase | 采购审批流程 |
| 维修流程 | /workflow/repair | 维修审批流程 |

### 3.8 首页管理 (homepage)

首页管理用于学校官网首页内容维护。

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 新闻管理 | /homepage/news | 学校新闻发布管理 |
| 荣誉展示 | /homepage/honors | 学校荣誉、师生荣誉展示 |
| 图片管理 | /homepage/images | 首页轮播图、相册管理 |
| 板块管理 | /homepage/sections | 首页板块内容编辑 |

### 3.9 仪表盘 (dashboard)

仪表盘为学校领导提供数据可视化大屏。

| 子模块 | 路由 | 功能说明 |
|--------|------|----------|
| 校长仪表盘 | /dashboard/principal | 校长视角数据概览 |
| 书记仪表盘 | /dashboard/secretary | 书记视角数据概览 |
| 副校长仪表盘 | /dashboard/vice-principal | 副校长视角数据概览 |

### 3.10 API接口清单

项目共实现 **78个API接口**，按功能模块组织：

```
src/app/api/
├── access/           门禁管理API
│   ├── devices/      设备管理
│   ├── records/      通行记录
│   ├── statistics/   数据统计
│   └── visitors/     访客管理
├── auth/             认证API
│   ├── current/      当前用户
│   ├── login/        登录
│   ├── logout/       登出
│   └── refresh/      刷新Token
├── classes/          班级管理API
├── students/         学生管理API
├── teachers/         教师管理API
├── expenses/         报销管理API
├── grades/           成绩管理API
├── habit/            习惯养成API
├── moral/            德育管理API
├── rooms/            功能室API
├── schedule*/        课表相关API
├── workflow/         工作流API
└── ...               其他API
```

---

## 4. 数据设计

### 4.1 数据架构概述

#### 4.1.1 数据存储策略

| 数据类型 | 存储方案 | 说明 |
|----------|----------|------|
| 业务数据 | PostgreSQL (Supabase) | 结构化业务数据 |
| 文件资料 | S3兼容对象存储 | 图片、文档、附件 |
| 会话数据 | Cookie + JWT | 无状态会话管理 |
| 搜索数据 | Elasticsearch | 全文搜索索引 |
| 缓存数据 | Redis | 热点数据缓存 |

#### 4.1.2 数据命名规范

| 对象类型 | 命名规范 | 示例 |
|----------|----------|------|
| 表名 | snake_case, 复数 | users, students, expense_items |
| 字段名 | snake_case | created_at, class_id |
| 主键 | id | id (UUID) |
| 外键 | {表名单数}_id | teacher_id, class_id |

### 4.2 数据安全与加密

#### 4.2.1 敏感数据识别

根据《个人信息保护法》和教育行业数据安全规范，识别以下敏感数据：

| 数据类型 | 敏感级别 | 示例字段 | 保护要求 |
|----------|----------|----------|----------|
| 身份证号 | 高 | id_card | 加密存储、脱敏展示 |
| 手机号码 | 中 | phone, emergency_phone | 加密存储、脱敏展示 |
| 家庭住址 | 中 | home_address | 加密存储 |
| 银行账号 | 高 | bank_account | 加密存储、脱敏展示 |
| 密码 | 高 | password | 哈希存储（不可逆） |
| 学生照片 | 中 | avatar | 访问控制 |
| 成绩数据 | 中 | score | 访问控制 |

#### 4.2.2 字段级加密方案

采用AES-256-GCM对称加密算法，配合密钥管理系统：

**加密架构**:
```
┌─────────────────────────────────────────────────────────────┐
│                      应用层                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 加密/解密服务                        │    │
│  │  - encrypt(plaintext, keyId) → ciphertext          │    │
│  │  - decrypt(ciphertext, keyId) → plaintext          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    密钥管理系统 (KMS)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  主密钥(MK)  │  │ 数据密钥(DK) │  │  密钥版本   │          │
│  │  KMS管理    │  │  自动轮换    │  │  版本控制   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**加密字段存储格式**:
```json
{
  "phone": "enc:AES256-GCM:v1:base64EncodedCiphertext:base64EncodedIV:base64EncodedTag",
  "phone_masked": "138****8001"
}
```

**加密实现示例**:
```typescript
import crypto from 'crypto';

interface EncryptedData {
  algorithm: string;
  keyVersion: string;
  ciphertext: string;
  iv: string;
  tag: string;
}

class FieldEncryption {
  private algorithm = 'aes-256-gcm';
  private keyVersion = 'v1';
  
  // 加密
  encrypt(plaintext: string): string {
    const key = this.getDataKey(this.keyVersion);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag();
    
    return `enc:${this.algorithm}:${this.keyVersion}:${encrypted}:${iv.toString('base64')}:${tag.toString('base64')}`;
  }
  
  // 解密
  decrypt(encryptedValue: string): string {
    const parts = encryptedValue.split(':');
    const [, algorithm, keyVersion, ciphertext, ivBase64, tagBase64] = parts;
    
    const key = this.getDataKey(keyVersion);
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 4.2.3 数据脱敏规则

**展示层脱敏**:

| 字段类型 | 脱敏规则 | 示例 |
|----------|----------|------|
| 手机号 | 中间4位替换为* | 138****8001 |
| 身份证号 | 保留前3后4位 | 350***********001 |
| 银行账号 | 保留后4位 | ************1234 |
| 姓名 | 保留姓，名用* | 张** |
| 地址 | 隐藏门牌号 | xx市xx区xx路**号 |

**敏感数据访问权限架构**:

系统采用"角色+关系"双重判断机制，确保敏感数据的安全访问。

```
┌─────────────────────────────────────────────────────────────────────┐
│                      敏感数据访问判断流程                              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   用户角色判断       │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ 领导层/部门  │     │  年段长     │     │ 班主任/科任  │
   │ 负责人      │     │             │     │ /家长       │
   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ 全校学生    │     │ 本年级学生   │     │ 关系判断     │
   │ 完全可见    │     │ 完全可见     │     │             │
   └─────────────┘     └─────────────┘     └──────┬──────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                                    ▼              ▼              ▼
                             ┌───────────┐ ┌───────────┐ ┌───────────┐
                             │ 班主任    │ │ 科任      │ │ 家长      │
                             │ 本班学生  │ │ 任教班级  │ │ 自己孩子  │
                             └───────────┘ └───────────┘ └───────────┘
```

**权限差异化展示**:

| 角色 | 手机号 | 身份证 | 家庭住址 | 可见范围 |
|------|--------|--------|----------|----------|
| 校长/书记 | 完整显示 | 完整显示 | 完整显示 | 全校所有学生 |
| 副校长 | 完整显示 | 完整显示 | 完整显示 | 全校所有学生 |
| 教务主任 | 完整显示 | 完整显示 | 完整显示 | 全校所有学生 |
| 德育主任 | 完整显示 | 完整显示 | 完整显示 | 全校所有学生 |
| 年段长 | 完整显示 | 完整显示 | 完整显示 | 本年级所有学生 |
| 班主任 | 完整显示 | 完整显示 | 完整显示 | 本班学生 |
| 科任 | 完整显示 | 完整显示 | 完整显示 | 任教班级学生 |
| 普通教师 | 不显示 | 不显示 | 不显示 | 无 |
| 家长 | 完整显示 | 完整显示 | 完整显示 | 仅自己孩子 |

**科任权限说明**:
- 科任不是一个独立的角色，而是通过"班级教师关系表"动态判断
- 当教师被设置为某班的科任后，自动获得该班学生敏感数据的查看权限
- 科任关系按学期管理，学期结束后自动失效
- 科任由教务主任在班级管理中设置，每学年更新

#### 4.2.4 密钥管理

**密钥生命周期**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  密钥生成   │────▶│  密钥使用   │────▶│  密钥轮换   │
│ (KMS生成)  │     │ (加解密)    │     │ (定期轮换)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  密钥归档   │
                                        │ (安全销毁)  │
                                        └─────────────┘
```

**密钥轮换策略**:

| 密钥类型 | 轮换周期 | 轮换方式 |
|----------|----------|----------|
| 主密钥(MK) | 1年 | 手动轮换 |
| 数据密钥(DK) | 90天 | 自动轮换 |
| JWT密钥 | 30天 | 自动轮换 |

**密钥存储**:
- 主密钥存储于KMS（如AWS KMS、阿里云KMS）
- 数据密钥加密后存储于数据库
- 应用内存中缓存解密后的密钥（有效期5分钟）

#### 4.2.5 数据访问审计

**审计日志记录**:

| 审计项 | 记录内容 |
|--------|----------|
| 访问者 | 用户ID、角色、IP地址 |
| 访问时间 | 精确到毫秒 |
| 访问对象 | 表名、记录ID、字段名 |
| 操作类型 | 查询/新增/修改/删除/导出 |
| 数据量 | 涉及记录数 |
| 敏感数据 | 是否访问敏感字段 |

**敏感操作告警**:

| 场景 | 触发条件 | 告警方式 |
|------|----------|----------|
| 批量导出 | 导出记录>100条 | 系统通知+邮件 |
| 敏感查询 | 查询身份证/手机号 | 系统日志 |
| 异常访问 | 非工作时间大量查询 | 实时告警 |
| 权限变更 | 用户角色变更 | 系统通知 |

### 4.3 核心数据表设计

#### 4.2.1 用户表 (users)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| name | VARCHAR(100) | NO | 用户姓名 |
| role | VARCHAR(50) | NO | 用户角色 |
| phone | VARCHAR(20) | YES | 联系电话 |
| email | VARCHAR(100) | YES | 电子邮箱 |
| avatar | VARCHAR(500) | YES | 头像URL |
| status | VARCHAR(20) | NO | 状态(active/on_leave) |
| created_at | TIMESTAMP | NO | 创建时间 |
| updated_at | TIMESTAMP | NO | 更新时间 |

#### 4.2.2 教师表 (teachers)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| user_id | UUID | YES | 关联用户ID |
| employee_no | VARCHAR(50) | NO | 工号 |
| name | VARCHAR(100) | NO | 姓名 |
| gender | VARCHAR(10) | NO | 性别 |
| phone | VARCHAR(20) | NO | 联系电话 |
| subjects | JSONB | NO | 任教学科数组 |
| title | VARCHAR(50) | YES | 职称 |
| is_head_teacher | BOOLEAN | NO | 是否班主任 |
| class_id | UUID | YES | 班主任班级ID |
| status | VARCHAR(20) | NO | 状态 |

#### 4.2.3 学生表 (students)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| student_no | VARCHAR(50) | NO | 学号 |
| name | VARCHAR(100) | NO | 姓名 |
| gender | VARCHAR(10) | NO | 性别 |
| birth_date | DATE | YES | 出生日期 |
| class_id | UUID | NO | 班级ID |
| grade | INTEGER | NO | 年级(1-6) |
| status | VARCHAR(20) | NO | 状态 |
| family_type | VARCHAR(20) | YES | 家庭类型 |

#### 4.2.4 班级表 (classes)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| name | VARCHAR(100) | NO | 班级名称 |
| grade | INTEGER | NO | 年级(1-6) |
| class_number | INTEGER | NO | 班级号 |
| head_teacher_id | UUID | YES | 班主任ID |
| student_count | INTEGER | NO | 学生人数 |

#### 4.2.5 班级教师关系表 (class_teachers)

用于管理班主任和科任教师与班级的关系，支持敏感数据访问权限判断。

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| class_id | UUID | NO | 班级ID |
| class_name | VARCHAR(100) | NO | 班级名称（冗余） |
| teacher_id | UUID | NO | 教师ID |
| teacher_name | VARCHAR(100) | NO | 教师姓名（冗余） |
| position | VARCHAR(20) | NO | 职位类型：head_teacher(班主任)/subject_teacher(科任) |
| subjects | JSONB | YES | 任教科目数组 ["语文","数学"] |
| semester | VARCHAR(20) | NO | 学期，如"2024-2025-1" |
| status | VARCHAR(20) | NO | 状态：active(有效)/expired(已失效) |
| created_by | UUID | YES | 创建人ID |
| created_at | TIMESTAMP | NO | 创建时间 |
| updated_at | TIMESTAMP | YES | 更新时间 |

**业务规则**:
- 每个班级每学期每个学科只能有一个科任教师
- 学期结束后，系统自动将 `status` 更新为 `expired`
- 教务主任在班级管理中设置科任，每学年更新
- 班主任信息同时写入此表和 `classes.head_teacher_id`

**索引设计**:
```sql
-- 按班级查询教师
CREATE INDEX idx_class_teachers_class ON class_teachers(class_id, semester);
-- 按教师查询任教班级
CREATE INDEX idx_class_teachers_teacher ON class_teachers(teacher_id, semester);
-- 查询有效关系
CREATE INDEX idx_class_teachers_status ON class_teachers(status, semester);
```

**数据示例**:
```json
{
  "id": "ct-001",
  "class_id": "class-3-1",
  "class_name": "三年1班",
  "teacher_id": "teacher-001",
  "teacher_name": "张老师",
  "position": "subject_teacher",
  "subjects": ["语文"],
  "semester": "2024-2025-1",
  "status": "active",
  "created_at": "2024-09-01 10:00:00"
}
```

#### 4.2.6 基准课表表 (base_schedules)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| semester | VARCHAR(20) | NO | 学期 |
| class_id | UUID | NO | 班级ID |
| class_name | VARCHAR(100) | NO | 班级名称 |
| grade | INTEGER | NO | 年级 |
| day_of_week | INTEGER | NO | 星期几(1-5) |
| period_index | INTEGER | NO | 第几节课(1-6) |
| start_time | TIME | NO | 开始时间 |
| end_time | TIME | NO | 结束时间 |
| subject | VARCHAR(50) | NO | 科目 |
| teacher_id | UUID | NO | 教师ID |
| teacher_name | VARCHAR(100) | NO | 教师姓名 |
| classroom_id | UUID | YES | 教室ID |
| classroom_name | VARCHAR(100) | YES | 教室名称 |
| status | VARCHAR(20) | NO | 状态(normal/disabled) |

#### 4.2.6 实际课表表 (actual_schedules)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| week_number | INTEGER | NO | 第几周 |
| semester | VARCHAR(20) | NO | 学期 |
| base_schedule_id | UUID | NO | 基准课表ID |
| date | DATE | NO | 具体日期 |
| status | VARCHAR(20) | NO | 状态(normal/leave/substitute) |
| original_teacher_id | UUID | YES | 原教师ID（请假） |
| substitute_teacher_id | UUID | YES | 代课教师ID |

#### 4.2.7 请假记录表 (leave_requests)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| applicant_id | UUID | NO | 申请人ID |
| type | VARCHAR(20) | NO | 请假类型 |
| start_date | DATE | NO | 开始日期 |
| end_date | DATE | NO | 结束日期 |
| periods | JSONB | YES | 请假节次 [1,2,3] |
| reason | TEXT | NO | 请假原因 |
| status | VARCHAR(20) | NO | 状态 |
| approval_flow | JSONB | YES | 审批流程 |

#### 4.2.8 代课记录表 (substitute_records)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| original_teacher_id | UUID | NO | 原教师ID |
| substitute_teacher_id | UUID | NO | 代课教师ID |
| class_id | UUID | NO | 班级ID |
| date | DATE | NO | 代课日期 |
| period_index | INTEGER | NO | 节次 |
| subject | VARCHAR(50) | NO | 科目 |
| semester | VARCHAR(20) | NO | 学期 |
| week_number | INTEGER | NO | 第几周 |

#### 4.2.9 工作量统计表 (teacher_workloads)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| teacher_id | UUID | NO | 教师ID |
| semester | VARCHAR(20) | NO | 学期 |
| month | INTEGER | YES | 月份(1-12) |
| base_hours | DECIMAL(5,1) | NO | 基准课时 |
| substitute_hours | DECIMAL(5,1) | NO | 代课课时 |
| after_school_hours | DECIMAL(5,1) | NO | 课后服务课时 |
| total_hours | DECIMAL(5,1) | NO | 总课时 |
| variance | DECIMAL(5,2) | NO | 工作量偏差 |

#### 4.2.10 报销记录表 (expense_reimbursements)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| expense_no | VARCHAR(50) | NO | 报销单号 |
| title | VARCHAR(200) | NO | 报销标题 |
| applicant_id | UUID | NO | 申请人ID |
| category | VARCHAR(50) | NO | 报销类别 |
| total_amount | DECIMAL(12,2) | NO | 总金额 |
| items | JSONB | NO | 报销明细 |
| status | VARCHAR(20) | NO | 状态 |
| approval_flow | JSONB | YES | 审批流程 |

#### 4.2.11 门禁设备表 (access_devices)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| name | VARCHAR(100) | NO | 设备名称 |
| location | VARCHAR(200) | NO | 安装位置 |
| device_type | VARCHAR(50) | NO | 设备类型 |
| status | VARCHAR(20) | NO | 状态(online/offline/fault) |
| last_heartbeat | TIMESTAMP | YES | 最后心跳时间 |

#### 4.2.12 通行记录表 (access_records)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| device_id | UUID | NO | 设备ID |
| person_id | UUID | YES | 人员ID |
| person_type | VARCHAR(20) | NO | 人员类型 |
| person_name | VARCHAR(100) | NO | 人员姓名 |
| direction | VARCHAR(10) | NO | 方向(in/out) |
| occurred_at | TIMESTAMP | NO | 发生时间 |
| status | VARCHAR(20) | NO | 状态(normal/denied) |

#### 4.2.13 习惯评价表 (habit_assessments)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| student_id | UUID | NO | 学生ID |
| date | DATE | NO | 评价日期 |
| category | VARCHAR(50) | NO | 习惯类别 |
| score | INTEGER | NO | 得分(1-5) |
| evaluator_id | UUID | NO | 评价人ID |
| notes | TEXT | YES | 备注 |

#### 4.2.14 习惯之星表 (habit_stars)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| student_id | UUID | NO | 学生ID |
| month | VARCHAR(7) | NO | 月份(2024-03) |
| categories | JSONB | NO | 获评类别 |
| total_score | INTEGER | NO | 总分 |
| achievements | TEXT | YES | 成就描述 |

#### 4.2.15 新生注册申请表 (new_student_applications)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| student_name | VARCHAR(100) | NO | 学生姓名 |
| gender | VARCHAR(10) | NO | 性别 |
| birth_date | DATE | NO | 出生日期 |
| apply_grade | INTEGER | NO | 申请年级 |
| apply_class_id | UUID | YES | 分配班级ID |
| home_address | VARCHAR(500) | NO | 家庭住址 |
| parents | JSONB | NO | 家长信息 |
| student_type | VARCHAR(20) | NO | 学生类型 |
| status | VARCHAR(20) | NO | 状态 |
| submitted_at | TIMESTAMP | NO | 提交时间 |
| reviewed_at | TIMESTAMP | YES | 审核时间 |
| synced_at | TIMESTAMP | YES | 同步时间 |

#### 4.2.16 功能室表 (rooms)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| name | VARCHAR(100) | NO | 功能室名称 |
| type | VARCHAR(50) | NO | 类型(实验室/音乐室等) |
| capacity | INTEGER | NO | 容纳人数 |
| equipment | JSONB | YES | 设备清单 |
| status | VARCHAR(20) | NO | 状态 |

#### 4.2.17 功能室预约表 (room_bookings)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| room_id | UUID | NO | 功能室ID |
| applicant_id | UUID | NO | 申请人ID |
| booking_date | DATE | NO | 预约日期 |
| start_time | TIME | NO | 开始时间 |
| end_time | TIME | NO | 结束时间 |
| purpose | TEXT | NO | 用途说明 |
| status | VARCHAR(20) | NO | 状态 |

#### 4.2.18 教研活动表 (research_activities)

| 字段名 | 数据类型 | 可空 | 说明 |
|--------|----------|------|------|
| id | UUID | NO | 主键 |
| title | VARCHAR(200) | NO | 活动标题 |
| type | VARCHAR(50) | NO | 活动类型 |
| organizer_id | UUID | NO | 组织者ID |
| start_time | TIMESTAMP | NO | 开始时间 |
| end_time | TIMESTAMP | NO | 结束时间 |
| location | VARCHAR(200) | NO | 地点 |
| participants | JSONB | NO | 参与人员 |
| status | VARCHAR(20) | NO | 状态 |

### 4.3 数据字典

#### 4.3.1 用户角色枚举

| 枚举值 | 显示名称 | 模块权限 |
|--------|----------|----------|
| principal | 校长 | 全部模块 |
| secretary | 书记 | 全部模块 |
| vice_principal | 副校长 | 全部模块 |
| academic_director | 教务主任 | academic, teacher, homepage |
| moral_director | 德育主任 | moral, teacher, homepage |
| general_director | 总务主任 | general |
| academic_staff | 教务员 | academic |
| moral_staff | 德育员 | moral |
| head_teacher | 班主任 | teacher |
| grade_leader | 年段长 | teacher + 专属功能 |
| teacher | 普通教师 | teacher |
| staff | 后勤人员 | general |
| student | 学生 | - |
| parent | 家长 | parent |

#### 4.3.2 工作流状态枚举

| 枚举值 | 显示名称 | 说明 |
|--------|----------|------|
| draft | 草稿 | 未提交 |
| pending | 待审批 | 已提交待审批 |
| reviewing | 审核中 | 审核中 |
| approved | 已通过 | 审批通过 |
| rejected | 已拒绝 | 审批拒绝 |
| cancelled | 已取消 | 已取消 |
| synced | 已同步 | 数据已同步 |

#### 4.3.3 新生注册状态枚举

| 枚举值 | 显示名称 | 说明 |
|--------|----------|------|
| pending | 待审核 | 家长已提交 |
| reviewing | 审核中 | 教务审核中 |
| approved | 已通过 | 审核通过，待分配班级 |
| assigned | 已分配 | 已分配班级 |
| synced | 已同步 | 已同步到学生管理系统 |
| rejected | 已拒绝 | 审核不通过 |

---

## 5. 接口设计

### 5.1 接口规范概述

#### 5.1.1 接口设计原则

| 原则 | 说明 |
|------|------|
| RESTful风格 | 遵循REST架构风格设计API |
| 统一响应 | 所有接口返回统一JSON格式 |
| 错误处理 | 标准化错误码和错误信息 |
| 认证授权 | JWT Token认证 + RBAC权限校验 |

#### 5.1.2 基础URL

| 环境 | 基础URL |
|------|---------|
| 开发环境 | http://localhost:5000/api |
| 生产环境 | https://api.example.com/api |

#### 5.1.3 统一响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { },
  "pagination": { "page": 1, "pageSize": 20, "total": 100 },
  "source": "database"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误描述",
  "errorCode": "VALIDATION_ERROR"
}
```

#### 5.1.4 HTTP状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或Token过期 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

### 5.2 认证接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 用户登录 | POST | /api/auth/login | 公开 | 用户名密码登录 |
| 获取当前用户 | GET | /api/auth/current | 需认证 | 获取登录用户信息 |
| 刷新Token | POST | /api/auth/refresh | 需Refresh Token | 刷新Access Token |
| 用户登出 | POST | /api/auth/logout | 需认证 | 退出登录 |

### 5.3 教师管理接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取教师列表 | GET | /api/teachers | academic.view | 分页查询 |
| 获取教师详情 | GET | /api/teachers/{id} | academic.view | 单个教师详情 |
| 获取教师完整档案 | GET | /api/teachers/{id}/full-profile | academic.view | 含成长记录 |
| 获取教师个人资料 | GET | /api/teachers/{id}/profile | 本人/管理员 | 个人信息 |
| 创建教师 | POST | /api/teachers | academic.manage | 新增教师 |
| 更新教师 | PUT | /api/teachers/{id} | academic.edit | 修改教师信息 |
| 删除教师 | DELETE | /api/teachers/{id} | academic.manage | 删除教师 |
| 批量删除 | POST | /api/teachers/batch-delete | academic.manage | 批量删除 |
| 批量更新 | POST | /api/teachers/batch-update | academic.manage | 批量更新 |
| 获取成长记录 | GET | /api/teachers/records | academic.view | 教师成长记录 |
| 获取荣誉奖项 | GET | /api/teachers/honors | academic.view | 教师荣誉 |
| 获取培训记录 | GET | /api/teachers/trainings | academic.view | 教师培训 |
| 获取教学成果 | GET | /api/teachers/achievements | academic.view | 教学成果 |

### 5.4 学生管理接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取学生列表 | GET | /api/students | moral.view | 分页查询 |
| 获取学生详情 | GET | /api/students/{id} | moral.view | 单个学生详情 |
| 获取完整档案 | GET | /api/students/{id}/full-profile | moral.view | 含家庭信息 |
| 获取习惯档案 | GET | /api/students/{id}/habit-profile | moral.view | 习惯养成档案 |
| 创建学生 | POST | /api/students | moral.manage | 新增学生 |
| 更新学生 | PUT | /api/students/{id} | moral.edit | 修改学生信息 |
| 删除学生 | DELETE | /api/students/{id} | moral.manage | 删除学生 |
| 批量删除 | POST | /api/students/batch-delete | moral.manage | 批量删除 |
| 批量更新 | POST | /api/students/batch-update | moral.manage | 批量更新 |

### 5.5 课表管理接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取基准课表 | GET | /api/base-schedules | academic.view | 按班级/教师查询 |
| 创建基准课表 | POST | /api/base-schedules | academic.manage | 批量创建 |
| 更新基准课表 | PUT | /api/base-schedules | academic.edit | 批量更新 |
| 删除基准课表 | DELETE | /api/base-schedules | academic.manage | 删除 |
| 获取实际课表 | GET | /api/actual-schedules | academic.view | 按周查询 |
| 生成实际课表 | POST | /api/actual-schedules | academic.edit | 生成某周课表 |
| 获取班级课表 | GET | /api/schedules | academic.view | 班级课表 |
| 获取教师课表 | GET | /api/schedule | academic.view | 教师个人课表 |
| 调课申请 | POST | /api/schedule-changes | academic.edit | 提交调课申请 |
| 获取调课列表 | GET | /api/schedule-changes | academic.view | 查询调课记录 |
| 代课安排 | POST | /api/schedule/substitutes | academic.edit | 安排代课 |
| 获取代课列表 | GET | /api/schedule/substitutes | academic.view | 查询代课记录 |

### 5.6 工作量统计接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取教师工作量 | GET | /api/workload?action=teacher | academic.view | 单个教师 |
| 获取月度汇总 | GET | /api/workload?action=monthly-summary | academic.view | 月度统计 |
| 批量查询工作量 | GET | /api/workload?action=batch | academic.view | 批量查询 |
| 获取Mock数据 | GET | /api/workload?action=mock | academic.view | 测试数据 |

### 5.7 报销管理接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取报销列表 | GET | /api/expenses | general.view | 分页查询 |
| 获取报销详情 | GET | /api/expenses/{id} | general.view | 单个详情 |
| 创建报销 | POST | /api/expenses | general.edit | 提交报销 |
| 更新报销 | PUT | /api/expenses/{id} | general.edit | 修改报销 |
| 删除报销 | DELETE | /api/expenses/{id} | general.manage | 删除报销 |
| 审批报销 | POST | /api/expenses/{id}/approve | general.approve | 审批操作 |
| 处理报销 | POST | /api/expenses/{id}/process | general.manage | 财务处理 |
| 报销统计 | GET | /api/expenses/statistics | general.view | 统计报表 |

### 5.8 门禁管理接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取设备列表 | GET | /api/access/devices | general.view | 门禁设备 |
| 创建设备 | POST | /api/access/devices | general.manage | 新增设备 |
| 更新设备 | PUT | /api/access/devices | general.edit | 修改设备 |
| 删除设备 | DELETE | /api/access/devices | general.manage | 删除设备 |
| 获取通行记录 | GET | /api/access/records | general.view | 通行记录 |
| 获取访客列表 | GET | /api/access/visitors | general.view | 访客管理 |
| 访客审批 | POST | /api/access/visitors | general.approve | 访客审批 |
| 门禁统计 | GET | /api/access/statistics | general.view | 统计数据 |

### 5.9 习惯养成接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取习惯评价 | GET | /api/habit/assessments | moral.view | 评价记录 |
| 创建习惯评价 | POST | /api/habit/assessments | moral.edit | 新增评价 |
| 获取习惯目标 | GET | /api/habit/goals | moral.view | 习惯目标 |
| 创建习惯目标 | POST | /api/habit/goals | moral.edit | 新增目标 |
| 获取习惯之星 | GET | /api/habit/stars | moral.view | 习惯之星 |
| 创建习惯之星 | POST | /api/habit/stars | moral.edit | 评选之星 |
| 全校习惯统计 | GET | /api/habit/stats/school | moral.view | 统计数据 |

### 5.10 新生注册接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取申请列表 | GET | /api/enrollment | academic.view | 查询申请 |
| 提交申请 | POST | /api/enrollment | parent | 家长提交 |
| 审核申请 | PUT | /api/enrollment | academic.approve | 教务审核 |
| 分配班级 | PUT | /api/enrollment | academic.manage | 分配班级 |
| 同步到学籍 | POST | /api/enrollment/sync | academic.manage | 手动同步 |

### 5.11 功能室预约接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取功能室列表 | GET | /api/rooms | general.view | 查询功能室 |
| 创建功能室 | POST | /api/rooms | general.manage | 新增功能室 |
| 获取预约列表 | GET | /api/rooms/bookings | general.view | 查询预约 |
| 创建预约 | POST | /api/rooms/bookings | general.edit | 提交预约 |
| 审批预约 | POST | /api/rooms/bookings/{id}/approve | general.approve | 审批预约 |

### 5.12 教研活动接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取活动列表 | GET | /api/research/activities | academic.view | 教研活动 |
| 创建活动 | POST | /api/research/activities | academic.edit | 新增活动 |
| 获取听课记录 | GET | /api/research/observations | academic.view | 听课评课 |
| 创建听课记录 | POST | /api/research/observations | academic.edit | 新增记录 |
| 获取备课记录 | GET | /api/research/preparations | academic.view | 集体备课 |
| 创建备课记录 | POST | /api/research/preparations | academic.edit | 新增备课 |

### 5.13 安全管理接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取演练列表 | GET | /api/safety/drills | general.view | 安全演练 |
| 创建演练 | POST | /api/safety/drills | general.edit | 新增演练 |
| 获取检查记录 | GET | /api/safety/inspections | general.view | 安全检查 |
| 创建检查 | POST | /api/safety/inspections | general.edit | 新增检查 |

### 5.14 公共接口

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 文件上传 | POST | /api/upload | 需认证 | 通用上传 |
| 图片搜索 | GET | /api/search-images | 需认证 | 图片搜索 |

### 5.15 接口清单汇总

| 模块 | 接口数量 | 主要接口 |
|------|----------|----------|
| 认证授权 | 4 | login, logout, current, refresh |
| 教师管理 | 13 | CRUD, profile, batch, records, honors |
| 学生管理 | 10 | CRUD, batch, habit-profile |
| 班级管理 | 5 | CRUD, students |
| 课表管理 | 12 | base-schedule, actual-schedule, changes |
| 工作量统计 | 4 | teacher, monthly, batch, mock |
| 报销管理 | 8 | CRUD, approve, process, statistics |
| 门禁管理 | 8 | devices, records, visitors, statistics |
| 习惯养成 | 7 | assessments, goals, stars, stats |
| 新生注册 | 5 | enrollment CRUD, sync |
| 功能室预约 | 5 | rooms, bookings, approve |
| 教研活动 | 6 | activities, observations, preparations |
| 安全管理 | 4 | drills, inspections |
| 数据中心 | 3 | collection, link, migrate |
| 工作流 | 3 | config, instances, migrate |
| 公共组件 | 2 | upload, search-images |
| **合计** | **99** | - |

---

## 6. 部署设计

### 6.1 部署架构

#### 6.1.1 部署拓扑图

```
                    ┌─────────────────┐
                    │   用户终端设备   │
                    │ (PC/手机/平板)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   CDN/负载均衡   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Web节点1 │   │ Web节点2 │   │ Web节点3 │
       │(Next.js) │   │(Next.js) │   │(Next.js) │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │Supabase  │ │   S3     │ │  Redis   │
       │PostgreSQL│ │ Storage  │ │  Cache   │
       └──────────┘ └──────────┘ └──────────┘
```

#### 6.1.2 环境规划

| 环境 | 用途 | 域名 | 配置 |
|------|------|------|------|
| 开发环境 | 开发调试 | dev.example.com | 2核4G |
| 测试环境 | 集成测试 | test.example.com | 2核4G |
| 预发布环境 | 上线前验证 | staging.example.com | 4核8G |
| 生产环境 | 正式运行 | www.example.com | 4核8G×3 |

### 6.2 容器化部署

#### 6.2.1 Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# 运行阶段
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 5000
CMD ["node", "server.js"]
```

#### 6.2.2 Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 6.3 环境配置

#### 6.3.1 环境变量清单

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | production |
| DATABASE_URL | 数据库连接 | postgresql://... |
| JWT_SECRET | JWT密钥 | (随机32字符) |
| JWT_REFRESH_SECRET | Refresh Token密钥 | (随机32字符) |
| S3_ENDPOINT | 对象存储端点 | https://s3.example.com |
| S3_ACCESS_KEY | S3访问密钥 | - |
| S3_SECRET_KEY | S3私钥 | - |
| REDIS_URL | Redis连接 | redis://localhost:6379 |

#### 6.3.2 数据库初始化

```sql
-- 创建数据库
CREATE DATABASE smart_campus;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建初始管理员
INSERT INTO users (id, name, role, status)
VALUES (uuid_generate_v4(), '系统管理员', 'admin', 'active');
```

### 6.4 监控与运维

#### 6.4.1 健康检查接口

**接口**: `GET /api/health`

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": "ok",
    "storage": "ok",
    "cache": "ok"
  }
}
```

#### 6.4.2 日志管理

| 日志类型 | 存储位置 | 保留时间 |
|----------|----------|----------|
| 应用日志 | /var/log/app/ | 30天 |
| 访问日志 | /var/log/nginx/ | 30天 |
| 错误日志 | /var/log/error/ | 90天 |

#### 6.4.3 告警规则

| 告警项 | 阈值 | 级别 |
|--------|------|------|
| CPU使用率 | >80% | Warning |
| 内存使用率 | >85% | Warning |
| 磁盘使用率 | >90% | Critical |
| 响应时间 | >3s | Warning |
| 错误率 | >1% | Critical |

---

## 7. 设计约束

### 7.1 技术约束

#### 7.1.1 技术栈约束

| 约束项 | 约束内容 | 原因 |
|--------|----------|------|
| 前端框架 | 必须使用Next.js 16 | 团队熟悉度高，SEO友好 |
| UI组件库 | 必须使用shadcn/ui | 风格统一，可定制性强 |
| 包管理器 | 禁止使用npm/yarn | pnpm依赖管理更高效 |
| 数据库 | 使用Supabase PostgreSQL | 托管服务，运维成本低 |

#### 7.1.2 代码规范约束

| 约束项 | 约束内容 |
|--------|----------|
| 语言 | 必须使用TypeScript，禁止any类型 |
| 样式 | 必须使用Tailwind语义化变量，禁止硬编码颜色 |
| 组件 | 必须使用shadcn/ui组件，禁止重复造轮子 |
| API | 必须使用统一响应格式，禁止自定义格式 |

### 7.2 业务约束

#### 7.2.1 权限约束

| 约束项 | 约束内容 |
|--------|----------|
| 角色分配 | 普通教师只能访问教师空间 |
| 班主任权限 | 班主任可访问教师空间，无其他系统权限 |
| 教务员权限 | 教务员仅能访问教务系统 |
| 年段长权限 | 年段长可访问教师空间及专属调课功能 |
| 家长权限 | 家长仅能访问家长端 |

#### 7.2.2 数据约束

| 约束项 | 约束内容 |
|--------|----------|
| 新生注册 | 教务审核后手动同步到学生管理系统 |
| 报销金额 | 大额报销需校长审批 |
| 课表变更 | 调课需提前申请，经批准后生效 |
| 实际课表 | 每周基于基准课表+请假/代课动态生成 |

### 7.3 性能约束

| 指标 | 约束值 | 说明 |
|------|--------|------|
| 页面加载时间 | <2秒 | 首屏渲染 |
| API响应时间 | <500ms | 95分位 |
| 并发用户数 | >500 | 高峰期支持 |
| 数据库查询 | <100ms | 单次查询 |

### 7.4 安全约束

| 约束项 | 约束内容 |
|--------|----------|
| 认证方式 | JWT Token，Access Token 2小时过期 |
| 密码策略 | 最少8位，必须包含数字和字母 |
| 敏感数据 | 禁止在日志中输出Token、密码等 |
| SQL注入 | 必须使用参数化查询 |

---

## 8. 验收准则

### 8.1 功能验收

#### 8.1.1 验收清单

| 模块 | 功能点 | 验收标准 | 状态 |
|------|--------|----------|------|
| 认证 | 用户登录 | 正确账号可登录，错误提示明确 | □ |
| 认证 | 权限控制 | 不同角色只能访问授权页面 | □ |
| 总务 | 报销申请 | 可提交报销，流程正确 | □ |
| 总务 | 报销审批 | 审批流程符合金额权限 | □ |
| 总务 | 门禁管理 | 设备管理、通行记录、访客管理正常 | □ |
| 总务 | 功能室预约 | 预约申请和审批流程正确 | □ |
| 教务 | 课表查询 | 班级/教师课表正确显示 | □ |
| 教务 | 调课管理 | 调课申请和审批流程正确 | □ |
| 教务 | 工作量统计 | 统计公式正确，数据准确 | □ |
| 教务 | 新生注册 | 信息采集、审核、同步流程正确 | □ |
| 德育 | 学生管理 | CRUD功能完整 | □ |
| 德育 | 习惯养成 | 习惯评价、习惯之星评选正常 | □ |
| 德育 | 德育活动 | 活动发布、报名、记录正常 | □ |
| 教师空间 | 请假申请 | 申请和审批流程正确 | □ |
| 教师空间 | 年段长功能 | 调课管理、代课指派正常 | □ |
| 家长端 | 学生信息 | 可查看孩子信息 | □ |
| 家长端 | 习惯记录 | 可查看习惯评价和打卡 | □ |

### 8.2 性能验收

| 指标 | 目标值 | 测试方法 | 工具 |
|------|--------|----------|------|
| 首屏加载 | <2s | 10次平均 | Lighthouse |
| API响应 | <500ms | 100次请求 | Apache Bench |
| 并发支持 | >500用户 | 压力测试 | k6 |
| 数据库查询 | <100ms | 慢查询分析 | pgAdmin |

### 8.3 安全验收

| 检查项 | 验收标准 | 测试方法 |
|--------|----------|----------|
| 认证安全 | Token正确过期 | 等待Token过期后访问 |
| 权限隔离 | 越权访问被拒绝 | 直接访问未授权页面 |
| SQL注入 | 攻击无效 | 输入恶意SQL语句 |
| XSS攻击 | 脚本不执行 | 输入script标签 |
| CSRF | 跨站请求被拒绝 | 伪造请求 |

### 8.4 兼容性验收

| 类型 | 要求 | 验收标准 |
|------|------|----------|
| 浏览器 | Chrome, Firefox, Safari, Edge | 最新两个版本正常 |
| 分辨率 | 1920x1080, 1366x768 | 布局正常 |
| 移动端 | iOS, Android | 响应式适配 |

---

## 9. 附录

### 9.1 缩略语表

| 缩略语 | 全称 | 中文含义 |
|--------|------|----------|
| SDD | Software Design Document | 软件设计文档 |
| RBAC | Role-Based Access Control | 基于角色的访问控制 |
| JWT | JSON Web Token | JSON网络令牌 |
| API | Application Programming Interface | 应用程序接口 |
| CRUD | Create, Read, Update, Delete | 增删改查 |
| BFF | Backend For Frontend | 前端后端 |
| SSE | Server-Sent Events | 服务器推送事件 |
| HMR | Hot Module Replacement | 热模块替换 |
| CDN | Content Delivery Network | 内容分发网络 |
| SQL | Structured Query Language | 结构化查询语言 |

### 9.2 快速登录账号（测试环境）

| 角色 | 账号 | 密码 | 用途 |
|------|------|------|------|
| 校长 | principal | test123 | 管理功能测试 |
| 教务主任 | academic_director | test123 | 教务管理测试 |
| 德育主任 | moral_director | test123 | 德育管理测试 |
| 总务主任 | general_director | test123 | 总务管理测试 |
| 年段长 | grade_leader | test123 | 年段长功能测试 |
| 班主任 | head_teacher | test123 | 班级管理测试 |
| 普通教师 | teacher | test123 | 教师空间测试 |
| 家长 | parent | test123 | 家长端测试 |

### 9.3 技术债务清单

| ID | 描述 | 优先级 | 计划解决时间 |
|----|------|--------|--------------|
| TD-001 | 部分API缺少单元测试 | 中 | v1.1 |
| TD-002 | Mock数据需迁移到统一目录 | 低 | v1.1 |
| TD-003 | 错误处理需要更细化 | 中 | v1.1 |
| TD-004 | 性能优化（数据库索引） | 中 | v1.2 |
| TD-005 | 缓存策略优化 | 低 | v1.2 |

### 9.4 变更记录

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2024-01-15 | 项目组 | 初始版本 |
| v1.1 | 2024-01-15 | 项目组 | 补充门禁、习惯养成、新生注册、教研活动、安全管理等模块 |
| v1.2 | 2024-01-16 | 项目组 | 【高并发保护】新增2.4节：限流策略（Redis分布式限流）、熔断机制、队列削峰、多级缓存；【数据安全】新增4.2节：敏感数据识别、字段级加密（AES-256-GCM）、数据脱敏规则、密钥管理、访问审计 |
| v1.2.1 | 2024-01-17 | 项目组 | 【代码实现】<br/>1. **Redis限流中间件** (`src/lib/rate-limit/index.ts`): 实现滑动窗口算法，支持IP/用户/接口/租户四级限流，配置新生注册(100/min)、成绩查询(60/min)、登录(5/15min)等接口限流策略<br/>2. **熔断器实现** (`src/lib/circuit-breaker/index.ts`): CLOSED/OPEN/HALF_OPEN状态机，支持数据库/存储/缓存服务的熔断配置和降级方案<br/>3. **字段加密服务** (`src/lib/encryption/index.ts`): AES-256-GCM算法，密钥版本管理，批量加密解密<br/>4. **数据脱敏工具** (`src/lib/masking/index.ts`): 手机号/身份证/银行账号/姓名/地址脱敏规则，角色差异化展示<br/>5. **API路由保护**: 登录接口应用防暴力破解限流，新生注册接口应用高并发限流+敏感数据加密+脱敏展示 |
| v1.3 | 2024-01-18 | 项目组 | 【模块设计重构】<br/>1. **模块结构对齐**: 移除M01-M62编号系统，改为与实际项目目录结构一致的模块命名<br/>2. **新增模块**: 补充首页管理(homepage)、仪表盘(dashboard)模块文档<br/>3. **页面统计**: 明确项目共91个页面、78个API接口<br/>4. **模块详情**: 为每个模块补充路由路径、功能说明表格<br/>5. **年段长功能**: 补充年段长专属功能文档 |
| v1.4 | 2024-01-19 | 项目组 | 【科任权限方案】<br/>1. **数据模型**: 新增班级教师关系表(class_teachers)设计，支持班主任和科任教师与班级的关系管理<br/>2. **敏感数据权限架构**: 采用"角色+关系"双重判断机制，领导层/部门负责人/年段长/班主任/科任均可查看敏感数据，权限差异体现在可见范围<br/>3. **类型定义** (`src/types/index.ts`): 新增ClassTeacher、ClassTeacherPosition、ClassTeacherStatus等类型<br/>4. **Mock数据** (`src/lib/mock/class-teachers.mock.ts`): 班级教师关系模拟数据<br/>5. **权限检查模块** (`src/lib/auth/sensitive-data.ts`): canViewStudentSensitiveData等权限判断函数<br/>6. **API接口** (`src/app/api/class-teachers/`): 班级教师关系CRUD接口<br/>7. **业务规则**: 每班每学科1个科任、学期结束自动失效、教务主任每学年设置 |

---

**文档结束**
