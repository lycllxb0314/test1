# 智慧校园API接口扎根理论分析

## 第一阶段：开放编码（Open Coding）

将54个API接口进行概念化，识别核心属性和维度。

### 原始数据（54个接口）

| 序号 | 接口路径 | 原始描述 | HTTP方法 |
|------|----------|----------|----------|
| 1 | /api/auth/login | 用户登录 | POST |
| 2 | /api/auth/current | 获取当前用户 | GET |
| 3 | /api/teachers | 教师管理 | GET/POST |
| 4 | /api/teachers/[id] | 教师详情 | GET/PUT/DELETE |
| 5 | /api/teachers/[id]/profile | 教师档案 | GET |
| 6 | /api/students | 学生管理 | GET/POST |
| 7 | /api/students/[id] | 学生详情 | GET/PUT/DELETE |
| 8 | /api/students/[id]/habit-profile | 学生习惯档案 | GET |
| 9 | /api/classes | 班级管理 | GET/POST |
| 10 | /api/courses | 课程管理 | GET/POST |
| 11 | /api/schedules | 课表管理 | GET/POST/PUT |
| 12 | /api/schedule-changes | 调课申请 | GET/POST/PUT |
| 13 | /api/exams | 考试管理 | GET/POST/PUT |
| 14 | /api/grades | 成绩管理 | GET/POST/PUT |
| 15 | /api/attendance | 考勤管理 | GET/POST/PUT |
| 16 | /api/leave-requests | 请假申请 | GET/POST/PUT |
| 17 | /api/research/activities | 教研活动 | GET/POST |
| 18 | /api/research/observations | 听课评课 | GET/POST |
| 19 | /api/research/preparations | 集体备课 | GET/POST |
| 20 | /api/rooms | 教室管理 | GET/POST/PUT/DELETE |
| 21 | /api/rooms/bookings | 教室预约 | GET/POST/PUT |
| 22 | /api/rooms/bookings/[id]/approve | 预约审批 | PUT |
| 23 | /api/habit/stats/school | 习惯统计 | GET |
| 24 | /api/habit/stars | 习惯之星 | GET/POST |
| 25 | /api/habit/goals | 习惯目标 | GET/POST/PUT/DELETE |
| 26 | /api/habit/assessments | 习惯评价 | GET/POST |
| 27 | /api/repair-requests | 维修申请 | GET/POST/PUT |
| 28 | /api/assets | 资产管理 | GET/POST |
| 29 | /api/access/statistics | 门禁统计 | GET |
| 30 | /api/access/devices | 门禁设备 | GET/POST/PUT |
| 31 | /api/access/records | 通行记录 | GET |
| 32 | /api/access/visitors | 访客管理 | GET/POST/PUT |
| 33 | /api/moral/activities | 德育活动 | GET/POST/PUT |
| 34 | /api/moral/alerts | 德育预警 | GET/POST/PUT |
| 35 | /api/moral/plans | 德育计划 | GET/POST |
| 36 | /api/moral/growth | 成长档案 | GET/POST |
| 37 | /api/homeworks | 作业管理 | GET/POST |
| 38 | /api/data-collection | 数据采集 | GET/POST |
| 39 | /api/finance/records | 财务记录 | GET/POST |
| 40 | /api/safety/inspections | 安全检查 | GET/POST |
| 41 | /api/safety/drills | 安全演练 | GET/POST |
| 42 | /api/spaces/reservations | 空间预约 | GET/POST |
| 43 | /api/communications | 通知消息 | GET/POST/PUT |
| 44 | /api/homepage | 主页内容 | GET/PUT |
| 45 | /api/homepage/news | 新闻动态 | GET/POST/PUT/DELETE |
| 46 | /api/homepage/honors | 荣誉奖项 | GET/POST/PUT/DELETE |
| 47 | /api/homepage/migrate | 主页迁移 | POST |
| 48 | /api/workflow/config | 流程配置 | GET/POST/PUT |
| 49 | /api/workflow/instances | 流程实例 | GET/POST |
| 50 | /api/workflow/migrate | 工作流迁移 | POST |
| 51 | /api/migrate | 数据迁移 | POST |
| 52 | /api/data-link | 数据关联 | GET/POST |
| 53 | /api/upload | 文件上传 | POST |
| 54 | /api/search-images | 图片搜索 | GET |

### 概念化（Conceptualization）

对每个接口进行属性标注：

| 概念 | 属性维度 | 包含接口数 |
|------|----------|------------|
| **身份主体** | 人/组织 | 9 |
| **教学事务** | 课程/考试/成绩 | 7 |
| **时间调度** | 课表/调课 | 2 |
| **行为记录** | 考勤/通行 | 3 |
| **申请审批** | 请假/预约/维修 | 6 |
| **教研活动** | 活动/备课/听课 | 3 |
| **德育培养** | 活动/计划/档案 | 4 |
| **习惯养成** | 目标/评价/之星 | 4 |
| **资源管理** | 资产/设备/空间 | 5 |
| **安全防护** | 检查/演练 | 2 |
| **财务事务** | 收支记录 | 1 |
| **消息通知** | 通知/公告 | 1 |
| **系统配置** | 主页/工作流 | 5 |
| **工具服务** | 上传/搜索/迁移 | 2 |

### 范畴化（Categorization）

将概念进一步归纳为范畴：

```
┌─────────────────────────────────────────────────────────────┐
│                     开放编码结果                             │
├─────────────────────────────────────────────────────────────┤
│  范畴A: 主体（Who）                                         │
│  ├── A1 教师 - teachers, teachers/[id]/profile             │
│  ├── A2 学生 - students, students/[id]/habit-profile       │
│  └── A3 组织 - classes                                      │
├─────────────────────────────────────────────────────────────┤
│  范畴B: 事务（What）                                        │
│  ├── B1 教学 - courses, schedules, exams, grades           │
│  ├── B2 教研 - research/*                                   │
│  ├── B3 德育 - moral/*                                      │
│  └── B4 习惯 - habit/*                                      │
├─────────────────────────────────────────────────────────────┤
│  范畴C: 流程（How）                                         │
│  ├── C1 申请 - leave-requests, repair-requests              │
│  ├── C2 审批 - schedule-changes, rooms/bookings/approve    │
│  └── C3 工作流 - workflow/*                                 │
├─────────────────────────────────────────────────────────────┤
│  范畴D: 记录（Trace）                                       │
│  ├── D1 出勤 - attendance                                   │
│  ├── D2 通行 - access/records, access/visitors             │
│  └── D3 成长 - moral/growth, students/habit-profile        │
├─────────────────────────────────────────────────────────────┤
│  范畴E: 资源（Resource）                                    │
│  ├── E1 空间 - rooms, spaces/reservations                  │
│  ├── E2 设备 - access/devices                               │
│  └── E3 资产 - assets                                       │
├─────────────────────────────────────────────────────────────┤
│  范畴F: 支撑（Support）                                     │
│  ├── F1 安全 - safety/*                                     │
│  ├── F2 财务 - finance/*                                    │
│  ├── F3 通知 - communications                               │
│  └── F4 配置 - homepage, auth                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 第二阶段：主轴编码（Axial Coding）

发现范畴之间的因果关系、时间关系、结构关系。

### 范式模型分析

```
                        ┌──────────────┐
                        │   条件条件    │
                        │ 系统环境/规则 │
                        └──────┬───────┘
                               │
                               ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   前因因果    │ ───▶ │   核心行动    │ ───▶ │   后果后果    │
│   触发条件    │       │   主体行为    │       │   结果产出    │
└──────────────┘       └──────┬───────┘       └──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ 策略策略     │       │   中介条件    │       │   干涉条件    │
│ 行动方案     │       │   环境因素    │       │   外部影响    │
└──────────────┘       └──────────────┘       └──────────────┘
```

### 关系矩阵

| 范畴 | 主体(A) | 事务(B) | 流程(C) | 记录(D) | 资源(E) | 支撑(F) |
|------|---------|---------|---------|---------|---------|---------|
| **主体(A)** | - | 参与 | 发起 | 产生 | 使用 | 依赖 |
| **事务(B)** | 面向 | - | 触发 | 留痕 | 占用 | 需要 |
| **流程(C)** | 规范 | 管理 | - | 生成 | 分配 | 控制 |
| **记录(D)** | 描述 | 追踪 | 证明 | - | 登记 | 审计 |
| **资源(E)** | 服务 | 承载 | 支撑 | 关联 | - | 消耗 |
| **支撑(F)** | 赋能 | 保障 | 配置 | 统计 | 维护 | - |

### 核心关系发现

#### 1. 生命线关系（时间维度）

```
学生生命周期：入学 → 编班 → 学习 → 评价 → 毕业
     │           │      │      │      │
     │           ▼      ▼      ▼      ▼
     │        students classes grades habit-profile
     │
教师生命周期：入职 → 任教 → 教研 → 发展 → 退休
     │           │      │      │
     │           ▼      ▼      ▼
     │        teachers courses research/profile
```

#### 2. 业务线关系（功能维度）

```
教学业务线：
课程(courses) → 排课(schedules) → 上课(attendance) → 作业(homeworks) → 考试(exams) → 成绩(grades)

德育业务线：
计划(moral/plans) → 活动(moral/activities) → 评价(habit/assessments) → 档案(moral/growth)

后勤业务线：
资源(assets) → 空间(rooms) → 维护(repair-requests) → 安全(safety/*)
```

#### 3. 流程线关系（审批维度）

```
请假流程：
请假申请(leave-requests) → 工作流实例(workflow/instances) → 调课(schedule-changes)
                              │
                              ▼
                        通知(communications)

预约流程：
空间预约(spaces/reservations) → 审批 → 通行记录(access/records)
```

---

## 第三阶段：选择性编码（Selective Coding）

提炼核心范畴，构建叙事性架构。

### 核心范畴识别

通过持续比较分析，识别出**五个核心范畴**：

```
┌─────────────────────────────────────────────────────────────────┐
│                        核心范畴架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌─────────┐     ┌─────────┐     ┌─────────┐                │
│     │  身份   │────▶│  行为   │────▶│  成果   │                │
│     │ Identity│     │ Action  │     │ Outcome │                │
│     └────┬────┘     └────┬────┘     └────┬────┘                │
│          │               │               │                      │
│          │    ┌──────────┴──────────┐    │                      │
│          │    │                     │    │                      │
│          ▼    ▼                     ▼    ▼                      │
│     ┌─────────┐               ┌─────────┐                       │
│     │  资源   │◀──────────────│  流程   │                       │
│     │ Resource│               │ Process │                       │
│     └─────────┘               └─────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 叙事性故事线（Story Line）

**学校的一天：**

```
清晨，师生通过【门禁】进入校园，系统记录【通行记录】。
├── 身份识别：auth/current, access/records
│
上午，教师开展【教学活动】，学生参与【课程学习】。
├── 教学过程：schedules, courses, attendance
├── 作业布置：homeworks
│
课间，可能有【请假】【调课】等事务需要处理。
├── 事务流程：leave-requests, schedule-changes, workflow/instances
│
午后，开展【教研活动】【德育活动】。
├── 教研：research/activities, research/observations
├── 德育：moral/activities, moral/plans
│
傍晚，记录【习惯评价】【成长档案】，【通知】发送。
├── 评价归档：habit/assessments, moral/growth
├── 消息通知：communications
│
日常运营中，【资源管理】【安全检查】【财务记录】持续进行。
├── 资源：rooms, assets, spaces/reservations
├── 安全：safety/inspections, safety/drills
├── 财务：finance/records
```

### 核心API矩阵

基于叙事性架构，重新组织API接口：

```
┌────────────────────────────────────────────────────────────────────┐
│                    核心API叙事架构                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ═════════════════════════════════════════════════════════════════ │
│  📌 核心层（Core Layer）- 系统基石                                 │
│  ═════════════════════════════════════════════════════════════════ │
│                                                                    │
│  👤 身份域（Identity Domain）                                      │
│  ├── /api/auth/*          认证入口                                │
│  ├── /api/teachers/*      教师身份                                │
│  ├── /api/students/*      学生身份                                │
│  └── /api/classes         组织架构                                │
│                                                                    │
│  ═════════════════════════════════════════════════════════════════ │
│  🔄 流程层（Process Layer）- 业务流转                              │
│  ═════════════════════════════════════════════════════════════════ │
│                                                                    │
│  📋 审批域（Approval Domain）                                      │
│  ├── /api/leave-requests  请假申请                                │
│  ├── /api/schedule-changes 调课申请                               │
│  ├── /api/repair-requests 维修申请                                │
│  └── /api/workflow/*      通用工作流                              │
│                                                                    │
│  📅 预约域（Booking Domain）                                       │
│  ├── /api/rooms/bookings  教室预约                                │
│  ├── /api/spaces/reservations 空间预约                            │
│  └── /api/access/visitors 访客预约                                │
│                                                                    │
│  ═════════════════════════════════════════════════════════════════ │
│  📚 业务层（Business Layer）- 核心业务                             │
│  ═════════════════════════════════════════════════════════════════ │
│                                                                    │
│  📖 教学域（Teaching Domain）                                      │
│  ├── /api/courses         课程管理                                │
│  ├── /api/schedules       课表管理                                │
│  ├── /api/attendance      考勤管理                                │
│  ├── /api/homeworks       作业管理                                │
│  ├── /api/exams           考试管理                                │
│  └── /api/grades          成绩管理                                │
│                                                                    │
│  🎓 教研域（Research Domain）                                      │
│  ├── /api/research/activities 教研活动                            │
│  ├── /api/research/observations 听课评课                          │
│  └── /api/research/preparations 集体备课                          │
│                                                                    │
│  🌱 德育域（Moral Domain）                                         │
│  ├── /api/moral/plans     德育计划                                │
│  ├── /api/moral/activities 德育活动                               │
│  ├── /api/moral/alerts    德育预警                                │
│  ├── /api/moral/growth    成长档案                                │
│  ├── /api/habit/*         习惯养成                                │
│  └── /api/homeworks       作业管理（共享）                        │
│                                                                    │
│  ═════════════════════════════════════════════════════════════════ │
│  🏗️ 支撑层（Support Layer）- 基础设施                             │
│  ═════════════════════════════════════════════════════════════════ │
│                                                                    │
│  🏠 资源域（Resource Domain）                                      │
│  ├── /api/rooms           教室管理                                │
│  ├── /api/assets          资产管理                                │
│  └── /api/access/devices  门禁设备                                │
│                                                                    │
│  🛡️ 安全域（Safety Domain）                                        │
│  ├── /api/safety/inspections 安全检查                             │
│  ├── /api/safety/drills   安全演练                                │
│  └── /api/access/*        门禁管理                                │
│                                                                    │
│  💰 财务域（Finance Domain）                                       │
│  └── /api/finance/records 财务记录                                │
│                                                                    │
│  📢 通知域（Notification Domain）                                  │
│  └── /api/communications  消息通知                                │
│                                                                    │
│  ═════════════════════════════════════════════════════════════════ │
│  ⚙️ 系统层（System Layer）- 系统管理                               │
│  ═════════════════════════════════════════════════════════════════ │
│                                                                    │
│  🖥️ 展示域（Presentation Domain）                                  │
│  ├── /api/homepage        主页内容                                │
│  ├── /api/homepage/news   新闻动态                                │
│  └── /api/homepage/honors 荣誉奖项                                │
│                                                                    │
│  🔧 工具域（Utility Domain）                                       │
│  ├── /api/upload          文件上传                                │
│  ├── /api/search-images   图片搜索                                │
│  ├── /api/data-collection 数据采集                                │
│  └── /api/migrate         数据迁移                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```
