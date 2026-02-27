# 课表与教师工作量系统设计

## 一、业务场景

### 1.1 学期排课流程

```
学期开始前
    ↓
教务处配置教师课时量（参考标准约13节，教务主任决定具体数值）
    ↓
智能排课（遵循"本班优先"规则）
    ↓
生成【基准课表】
    ├── 班级课表（每周固定）
    └── 教师课表（每周固定）
    ↓
教务主任手动调整
    ↓
最终课表确认
```

### 1.2 学期中课表变化

```
教师请假（病假/事假/公假）
    ↓
请假审批通过
    ↓
自动创建【代课记录】
    ↓
年段长安排代课教师
    ↓
生成【实际课表】（该周特定）
    ↓
更新教师工作量统计
```

### 1.3 教师工作量统计

**月度/学期教师工作量 =**
```
自己上的课（基准课表 - 请假课时）
+ 帮人代课的课
+ 课后服务节数
= 实际工作量
```

---

## 二、数据模型设计

### 2.1 课表数据模型

#### 基准课表（BaseSchedule）

学期开始前确定的课表，作为整个学期的基准。

```typescript
interface BaseSchedule {
  id: string;
  semester: string;                    // 学期，如"2024-2025-1"
  
  // 班级课表
  classSchedules: ClassSchedule[];
  
  // 教师课表
  teacherSchedules: TeacherSchedule[];
  
  // 元数据
  createdAt: string;
  createdBy: string;                   // 教务主任
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
}
```

#### 实际课表（ActualSchedule）

每周生成的实际课表，反映请假、代课等变化。

```typescript
interface ActualSchedule {
  id: string;
  semester: string;
  weekNumber: number;                  // 第几周
  weekStartDate: string;               // 周一日期
  weekEndDate: string;                 // 周五日期
  
  // 班级课表（含变更）
  classSchedules: ScheduleSlot[];
  
  // 教师课表（含变更）
  teacherSchedules: ScheduleSlot[];
  
  // 本周变更记录
  changes: ScheduleChangeLog[];
  
  // 元数据
  generatedAt: string;                 // 生成时间
  generatedFrom: string;               // 基准课表ID
}
```

### 2.2 教师工作量统计模型

```typescript
interface TeacherWorkload {
  id: string;
  teacherId: string;
  teacherName: string;
  semester: string;
  month?: number;                      // 月度统计时使用
  
  // === 基准课时 ===
  /** 基准周课时（教务主任配置） */
  baseWeeklyHours: number;
  /** 本月应上课时（基准 × 周数 - 法定节假日） */
  expectedHours: number;
  
  // === 实际授课 ===
  /** 自己上的课 */
  selfTaughtHours: number;
  /** 请假课时 */
  leaveHours: number;
  /** 调课课时（与其他老师互换） */
  swappedHours: number;
  
  // === 代课 ===
  /** 帮人代课的课 */
  substituteHours: number;
  /** 代课详情 */
  substituteDetails: Array<{
    date: string;
    classId: string;
    className: string;
    subject: string;
    originalTeacherId: string;
    originalTeacherName: string;
  }>;
  
  // === 课后服务 ===
  /** 课后服务节数 */
  afterSchoolServiceHours: number;
  /** 课后服务详情 */
  afterSchoolServiceDetails: Array<{
    date: string;
    serviceType: string;               // 课后服务类型
    classId: string;
    className: string;
    hours: number;
  }>;
  
  // === 统计 ===
  /** 实际工作量 = 自己上的课 + 代课 + 课后服务 */
  totalWorkload: number;
  /** 与预期差异 */
  variance: number;
  
  updatedAt: string;
}
```

### 2.3 课后服务数据模型

```typescript
interface AfterSchoolService {
  id: string;
  semester: string;
  weekNumber: number;
  date: string;
  
  // 服务信息
  serviceType: string;                 // 课后服务类型（托管/兴趣班等）
  classId: string;
  className: string;
  grade: number;
  
  // 教师信息
  teacherId: string;
  teacherName: string;
  
  // 时间信息
  periodIndex: number;                 // 第几节课（通常是下午第X节后）
  startTime: string;
  endTime: string;
  hours: number;                       // 课时数
  
  // 状态
  status: 'scheduled' | 'completed' | 'cancelled';
  
  createdAt: string;
  updatedAt: string;
}
```

---

## 三、数据关联关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        基准课表 (BaseSchedule)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   班级课表       │  │   教师课表       │  │   教师课时配置   │  │
│  │ (ClassSchedule) │  │(TeacherSchedule)│  │ (TeacherHours)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 学期中变化
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        请假系统 (LeaveRequest)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   请假申请       │  │   代课记录       │  │   调课记录       │  │
│  │ (LeaveRequest)  │→│(SubstituteRecord)│  │(CourseAdjustment)│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 生成
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      实际课表 (ActualSchedule)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   每周班级课表   │  │   每周教师课表   │  │   变更日志       │  │
│  │ (ScheduleSlot)  │  │ (ScheduleSlot)  │  │(ScheduleChangeLog)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 统计
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    教师工作量统计 (TeacherWorkload)               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   自己上的课     │  │   帮人代课       │  │   课后服务       │  │
│  │ (selfTaught)    │+│ (substitute)    │+│ (afterSchool)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                              = 实际工作量                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、关键业务规则

### 4.1 排课规则（固定不变）

| 优先级 | 情况 | 分数 |
|-------|-----|-----|
| 1 | 班主任教本班主科 | 100 |
| 2 | 班主任教本班兼任 | 95 |
| 3 | 科任教本班主科 | 85 |
| 4 | 科任教本班兼任 | 80 |
| 5 | 教其他班主科 | 60 |
| 6 | 教其他班其他 | 50 |
| 7 | 技能科教师 | 40 |

### 4.2 课时量规则（参考标准，教务主任决定）

| 角色类型 | 带班数 | 本班主科 | 本班兼任 | 其他班课时 | 总计 |
|---------|-------|---------|---------|----------|-----|
| 班主任 | 1个班 | 5-6节 | 约4节 | 约3节 | 约13节 |
| 教研组长 | 1个班 | 5-6节 | 约4节 | 约3节 | 约13节 |
| 中层行政 | 1个班 | 5-6节 | 约4节 | 约3节 | 约13节 |
| 年段长 | 1个班 | 5-6节 | 约4节 | 约3节 | 约13节 |
| 科任 | 2个班 | 10-12节 | 1-2节 | - | 约13节 |
| 技能科教师 | 多个班 | - | - | 约13节 | 约13节 |

### 4.3 工作量计算规则

```
实际工作量 = 自己上的课 + 帮人代课的课 + 课后服务

其中：
- 自己上的课 = 基准课时 - 请假课时
- 请假课时 = 请假期间应上的课（被别人代课）
- 代课课时 = 帮其他老师上的课
- 课后服务 = 课后托管、兴趣班等
```

---

## 五、API设计

### 5.1 课表相关

```
GET  /api/schedules/base              # 获取基准课表
POST /api/schedules/base              # 创建/更新基准课表
GET  /api/schedules/actual            # 获取实际课表（按周）
GET  /api/schedules/class/:id         # 获取班级课表
GET  /api/schedules/teacher/:id       # 获取教师课表
```

### 5.2 工作量统计

```
GET  /api/workload/teacher/:id        # 获取教师工作量统计
GET  /api/workload/monthly            # 月度工作量汇总
GET  /api/workload/semester           # 学期工作量汇总
```

### 5.3 课后服务

```
GET  /api/after-school-services       # 获取课后服务列表
POST /api/after-school-services       # 创建课后服务记录
PUT  /api/after-school-services/:id   # 更新课后服务记录
```

---

## 六、实现计划

1. **Phase 1**: 完善课表数据模型
   - 区分基准课表和实际课表
   - 实现每周课表生成

2. **Phase 2**: 教师工作量统计
   - 实现工作量计算逻辑
   - 与请假、代课系统联动
   - 与考勤系统整合

3. **Phase 3**: 课后服务模块
   - 实现课后服务记录
   - 纳入工作量统计

4. **Phase 4**: 报表与展示
   - 教师空间课表展示
   - 工作量月度报表
   - 学期工作量汇总
