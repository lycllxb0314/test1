# 智慧校园API接口架构（叙事性版）

## 设计理念

基于扎根理论分析，本架构以**叙事性**为核心，将54个API接口按照学校日常运营的故事线进行组织，便于理解和维护。

## 架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        智慧校园API架构                               │
│                                                                     │
│    核心层          流程层          业务层          支撑层          系统层    │
│    Core    →     Process    →    Business   →    Support   →    System   │
│                                                                     │
│    身份           审批            教学            资源           展示      │
│    主体           预约            教研            安全           工具      │
│                                   德育            财务                     │
│                                   习惯            通知                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 第一层：核心层（Core Layer）

> **叙事意义**：学校的基础，定义"是谁"

### 身份域（Identity Domain）

**故事线**：每一个进入校园的人，都需要被识别和记录。

```
/api/auth
├── POST /login           # 故事开始：用户登录
└── GET  /current         # 身份确认：获取当前用户

/api/teachers
├── GET    /              # 查看教师队伍
├── POST   /              # 新教师入职
├── GET    /[id]          # 教师详情
├── PUT    /[id]          # 更新信息
├── DELETE /[id]          # 教师离校
└── GET    /[id]/profile  # 教师档案（含教研成果）

/api/students
├── GET    /              # 查看学生名单
├── POST   /              # 新生入学
├── GET    /[id]          # 学生详情
├── PUT    /[id]          # 更新信息
├── DELETE /[id]          # 学生离校
└── GET    /[id]/habit-profile  # 学生习惯档案

/api/classes
├── GET  /                # 班级列表
└── POST /                # 创建班级
```

**关系图**：
```
教师 teachers ──┬── 任教 ──▶ 课程 courses
                └── 班主任 ──▶ 班级 classes
学生 students ──┬── 属于 ──▶ 班级 classes
                └── 学习 ──▶ 课程 courses
```

---

## 第二层：流程层（Process Layer）

> **叙事意义**：学校的运转，定义"如何协调"

### 审批域（Approval Domain）

**故事线**：当老师需要请假、调课时，系统如何处理？

```
/api/leave-requests
├── GET  /                # 查看请假申请
├── POST /                # 发起请假
└── PUT  /                # 审批/更新

/api/schedule-changes
├── GET  /                # 查看调课申请
├── POST /                # 发起调课
└── PUT  /                # 审批/更新

/api/repair-requests
├── GET  /                # 查看维修申请
├── POST /                # 发起维修
└── PUT  /                # 处理/更新

/api/workflow
├── GET  /config          # 流程配置
├── POST /config          # 创建流程
├── PUT  /config          # 更新流程
├── GET  /instances       # 流程实例
└── POST /instances       # 创建实例
```

**审批流程叙事**：
```
请假故事：
老师发起请假(leave-requests POST)
    ↓
触发工作流(workflow/instances POST)
    ↓
需要调课时 → 创建调课申请(schedule-changes POST)
    ↓
通知相关人员(communications POST)
```

### 预约域（Booking Domain）

**故事线**：教室、空间、访客如何预约管理？

```
/api/rooms
├── GET    /              # 教室列表
├── POST   /              # 创建教室
├── PUT    /[id]          # 更新教室
├── DELETE /[id]          # 删除教室
└── /bookings
    ├── GET    /          # 预约列表
    ├── POST   /          # 创建预约
    ├── PUT    /[id]      # 更新预约
    └── PUT    /[id]/approve  # 审批预约

/api/spaces
└── /reservations
    ├── GET  /            # 空间预约列表
    └── POST /            # 创建空间预约

/api/access
└── /visitors
    ├── GET  /            # 访客列表
    ├── POST /            # 访客预约
    └── PUT  /            # 访客审批
```

---

## 第三层：业务层（Business Layer）

> **叙事意义**：学校的核心，定义"做什么"

### 教学域（Teaching Domain）

**故事线**：一天的教学是如何展开的？

```
/api/courses
├── GET  /                # 课程列表
└── POST /                # 创建课程

/api/schedules
├── GET  /                # 查看课表
├── POST /                # 安排课程
└── PUT  /                # 调整课表

/api/attendance
├── GET  /                # 考勤记录
├── POST /                # 记录考勤
└── PUT  /                # 更新考勤

/api/homeworks
├── GET  /                # 作业列表
└── POST /                # 布置作业

/api/exams
├── GET  /                # 考试列表
├── POST /                # 安排考试
└── PUT  /                # 更新考试

/api/grades
├── GET  /                # 成绩列表
├── POST /                # 录入成绩
└── PUT  /                # 更新成绩
```

**教学流程叙事**：
```
教学的一天：
排课(schedules) → 上课考勤(attendance) → 布置作业(homeworks)
                                        ↓
考试安排(exams) ← 成绩录入(grades) ← 作业批改
```

### 教研域（Research Domain）

**故事线**：教师如何进行专业发展？

```
/api/research
├── GET  /activities      # 教研活动
├── POST /activities      # 发起活动
├── GET  /observations    # 听课评课记录
├── POST /observations    # 记录听课
├── GET  /preparations    # 集体备课记录
└── POST /preparations    # 发起备课
```

### 德育域（Moral Domain）

**故事线**：如何培养全面发展的学生？

```
/api/moral
├── GET  /plans           # 德育计划
├── POST /plans           # 制定计划
├── GET  /activities      # 德育活动
├── POST /activities      # 发起活动
├── PUT  /activities      # 更新活动
├── GET  /alerts          # 德育预警
├── POST /alerts          # 创建预警
├── PUT  /alerts          # 处理预警
├── GET  /growth          # 成长档案
└── POST /growth          # 记录成长

/api/habit
├── GET  /stats/school    # 全校习惯统计
├── GET  /stars           # 习惯之星
├── POST /stars           # 评选之星
├── GET  /goals           # 小目标
├── POST /goals           # 设定目标
├── PUT  /goals           # 更新目标
├── DELETE /goals         # 删除目标
├── GET  /assessments     # 习惯评价
└── POST /assessments     # 记录评价
```

**德育流程叙事**：
```
德育培养闭环：
制定计划(moral/plans) → 开展活动(moral/activities) → 评价反思(habit/assessments)
         ↑                                                    ↓
         └──────────── 生成档案(moral/growth) ←───────────────┘
```

---

## 第四层：支撑层（Support Layer）

> **叙事意义**：学校的保障，定义"如何维护"

### 资源域（Resource Domain）

```
/api/rooms                # 教室资源（见流程层）
/api/assets
├── GET  /                # 资产列表
└── POST /                # 登记资产

/api/access
├── GET  /statistics      # 门禁统计
├── GET  /devices         # 设备列表
├── POST /devices         # 新增设备
├── PUT  /devices         # 更新设备
└── GET  /records         # 通行记录
```

### 安全域（Safety Domain）

**故事线**：如何保障校园安全？

```
/api/safety
├── GET  /inspections     # 安全检查记录
├── POST /inspections     # 记录检查
├── GET  /drills          # 安全演练记录
└── POST /drills          # 记录演练

/api/access               # 门禁管理（见资源域）
```

### 财务域（Finance Domain）

```
/api/finance
└── /records
    ├── GET  /            # 财务记录列表
    └── POST /            # 登记财务
```

### 通知域（Notification Domain）

```
/api/communications
├── GET  /                # 通知列表
├── POST /                # 发送通知
└── PUT  /                # 标记已读
```

---

## 第五层：系统层（System Layer）

> **叙事意义**：系统的配置，定义"如何展示"

### 展示域（Presentation Domain）

```
/api/homepage
├── GET  /                # 主页内容
├── PUT  /                # 更新主页
├── GET  /news            # 新闻列表
├── POST /news            # 发布新闻
├── PUT  /news            # 更新新闻
├── DELETE /news          # 删除新闻
├── GET  /honors          # 荣誉列表
├── POST /honors          # 添加荣誉
├── PUT  /honors          # 更新荣誉
└── DELETE /honors        # 删除荣誉
```

### 工具域（Utility Domain）

```
/api/upload               # 文件上传
/api/search-images        # 图片搜索
/api/data-collection      # 数据采集任务
/api/migrate              # 数据迁移
/api/data-link            # 数据关联
```

---

## API速查表

### 按角色查询

| 角色 | 常用API |
|------|---------|
| **校长** | `/api/homepage`, `/api/workflow/config`, `/api/habit/stats/school` |
| **教务主任** | `/api/schedules`, `/api/courses`, `/api/exams`, `/api/grades` |
| **德育主任** | `/api/moral/*`, `/api/habit/*`, `/api/communications` |
| **总务主任** | `/api/assets`, `/api/repair-requests`, `/api/safety/*`, `/api/finance/*` |
| **年段长** | `/api/classes`, `/api/schedule-changes`, `/api/leave-requests` |
| **班主任** | `/api/students`, `/api/attendance`, `/api/habit/*`, `/api/moral/growth` |
| **普通教师** | `/api/courses`, `/api/homeworks`, `/api/leave-requests`, `/api/research/*` |

### 按场景查询

| 场景 | 涉及API | 叙事流程 |
|------|---------|----------|
| **请假** | leave-requests → workflow → schedule-changes → communications | 申请→审批→调课→通知 |
| **预约教室** | rooms/bookings → workflow → communications | 申请→审批→通知 |
| **学生评价** | habit/assessments → habit/stars → moral/growth | 评价→评优→归档 |
| **考试管理** | exams → grades → communications | 安排→录入→通知 |

---

## 接口统计

| 层级 | 域 | 接口数 | 说明 |
|------|-----|--------|------|
| 核心层 | 身份域 | 9 | 用户、组织基础 |
| 流程层 | 审批域 | 6 | 申请、工作流 |
| 流程层 | 预约域 | 8 | 教室、空间、访客 |
| 业务层 | 教学域 | 7 | 课程、考试、成绩 |
| 业务层 | 教研域 | 3 | 活动、听课、备课 |
| 业务层 | 德育域 | 8 | 计划、活动、档案 |
| 业务层 | 习惯域 | 4 | 目标、评价、之星 |
| 支撑层 | 资源域 | 5 | 教室、资产、设备 |
| 支撑层 | 安全域 | 4 | 检查、演练、门禁 |
| 支撑层 | 财务域 | 1 | 财务记录 |
| 支撑层 | 通知域 | 1 | 消息通知 |
| 系统层 | 展示域 | 4 | 主页、新闻、荣誉 |
| 系统层 | 工具域 | 4 | 上传、搜索、迁移 |
| **合计** | | **54** | |

---

## 维护指南

### 新增接口决策树

```
新增接口需求
    │
    ├─ 是身份相关？ ──────────────▶ 核心层·身份域
    │
    ├─ 是申请审批？ ──────────────▶ 流程层·审批域
    │
    ├─ 是预约管理？ ──────────────▶ 流程层·预约域
    │
    ├─ 是教学教研？ ──────────────▶ 业务层·教学域/教研域
    │
    ├─ 是德育培养？ ──────────────▶ 业务层·德育域/习惯域
    │
    ├─ 是后勤保障？ ──────────────▶ 支撑层·资源域/安全域/财务域
    │
    └─ 是系统配置？ ──────────────▶ 系统层·展示域/工具域
```

### 命名规范

```
/api/{域}/{资源}
/api/{域}/{资源}/{操作}

示例：
/api/moral/plans           # 德育计划
/api/moral/plans/[id]      # 具体计划
/api/workflow/instances    # 工作流实例
```

### 版本演进建议

当需要破坏性更新时，建议采用以下策略：

```
/api/v2/moral/activities   # 新版本接口
/api/moral/activities      # 旧版本接口（保留兼容期）
```
