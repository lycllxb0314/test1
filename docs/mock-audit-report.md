# 前端页面独立 Mock 数据审查报告

**审查时间**: 2024-12-10
**审查范围**: `src/app/` 目录下所有页面组件
**问题类型**: 页面内定义独立 mock 数据（未使用统一数据源）

---

## 📊 审查摘要

| 指标 | 数量 |
|------|------|
| 问题页面总数 | **37 个** |
| 独立 mock 数据定义 | **65+ 处** |
| 涉及模块 | 教务、总务、德育、教师、家长、工作流 |

---

## 🔴 严重程度分级

### P0 - 高优先级（核心业务页面，数据需与 API 保持一致）

| 页面路径 | Mock 数据 | 影响 |
|----------|-----------|------|
| `academic/attendance/page.tsx` | `mockAttendance`, `mockLeaveRecords` | 教师考勤统计与 API 不一致 |
| `academic/exams/page.tsx` | `mockExams` | 考试列表与 API 不一致 |
| `academic/grades/page.tsx` | `mockGrades` | 成绩数据与 API 不一致 |
| `academic/teachers/[id]/page.tsx` | `mockTeacherProfile` | 教师档案详情页 |
| `parent/grades/page.tsx` | `mockExams`, `mockGrades` | 家长端成绩查询 |

### P1 - 中优先级（功能页面，影响用户体验）

| 页面路径 | Mock 数据 |
|----------|-----------|
| `academic/classes/[id]/schedule/page.tsx` | `mockClassInfo`, `mockScheduleSlots`, `mockNotices` |
| `academic/research/page.tsx` | `mockLessonGroups`, `mockLessonActivities`, `mockObservations` |
| `academic/rooms/page.tsx` | `mockRooms`, `mockBookings` |
| `academic/rooms/approval/page.tsx` | `mockPendingApprovals`, `mockAllBookings` |
| `academic/rooms/booking/page.tsx` | `mockAvailableRooms`, `mockMyBookings` |
| `academic/rooms/calendar/page.tsx` | `mockRooms`, `mockScheduleData` |
| `moral/honors/page.tsx` | `mockHonors` |
| `teacher/homework/page.tsx` | `mockHomework`, `mockLearning` |
| `teacher/leave/page.tsx` | `mockApplications` |
| `teacher/grade/page.tsx` | `mockTeachers`, `mockClasses` |

### P2 - 低优先级（辅助功能页面）

| 页面路径 | Mock 数据 |
|----------|-----------|
| `general/access/page.tsx` | `mockStatistics`, `mockDeviceStatus`, `mockRecentRecords`, `mockPendingVisitors` |
| `general/access/devices/page.tsx` | `mockDevices` |
| `general/access/persons/page.tsx` | `mockStudents`, `mockTeachers`, `mockStaff` |
| `general/access/records/page.tsx` | `mockRecords` |
| `general/access/visitors/page.tsx` | `mockVisitors` |
| `general/devices/page.tsx` | `mockDevices` |
| `general/purchase/page.tsx` | `mockPurchases` |
| `general/security/page.tsx` | `mockSecurityRecords`, `mockHazards` |
| `general/staff/page.tsx` | `mockStaff` |
| `moral/activities/page.tsx` | `mockActivities` |
| `moral/alerts/page.tsx` | `mockAlerts` |
| `moral/assessment/page.tsx` | `mockAssessments` |
| `moral/growth/page.tsx` | `mockGrowth` |
| `moral/plans/page.tsx` | `mockPlans` |
| `parent/announcements/page.tsx` | `mockNotices` |
| `teacher/admin/page.tsx` | `mockMaterials` |
| `teacher/collect/page.tsx` | `mockCollections`, `mockNotSubmitted` |
| `teacher/communication/page.tsx` | `mockNotices`, `mockMessages`, `mockTemplates` |
| `teacher/grade-habit/page.tsx` | `mockGradeClasses` |
| `teacher/moral/page.tsx` | `mockMoral`, `mockRecords` |
| `teacher/safety/page.tsx` | `mockSafety`, `mockHazards` |
| `workflow/purchase/page.tsx` | `mockPurchases` |

---

## 📋 详细问题清单

### 教务模块 (academic/)

#### 1. `academic/attendance/page.tsx`
```typescript
// 问题代码位置：第 42 行、第 164 行
const mockAttendance = [...]  // 教师考勤数据
const mockLeaveRecords = [...]  // 请假记录数据
```
**问题**: 数据格式与 `MOCK_TEACHER_ATTENDANCE` 不一致，ID 使用 `ta001` vs `t001`

#### 2. `academic/classes/[id]/schedule/page.tsx`
```typescript
// 问题代码位置：第 60 行、第 76 行、第 114 行
const mockClassInfo = {...}  // 班级信息
const mockScheduleSlots = [...]  // 课表数据
const mockNotices = [...]  // 通知数据
```
**问题**: 班级信息应从 `MASTER_CLASSES` 获取，课表应从 `MOCK_BASE_SCHEDULE` 获取

#### 3. `academic/exams/page.tsx`
```typescript
// 问题代码位置：第 35 行
const mockExams = [...]  // 考试列表
```
**问题**: 数据与 `MOCK_EXAMS` 不一致，字段名 `examType` vs `type`

#### 4. `academic/grades/page.tsx`
```typescript
// 问题代码位置：第 34 行
const mockGrades = [...]  // 成绩列表
```
**问题**: 数据与 `MOCK_GRADES` 不一致

#### 5. `academic/research/page.tsx`
```typescript
// 问题代码位置：第 59 行、第 65 行、第 93 行
const mockLessonGroups = [...]  // 集体备课组
const mockLessonActivities = [...]  // 教研活动
const mockObservations = [...]  // 听课记录
```
**问题**: 教研相关数据未在统一数据源中定义

#### 6. `academic/rooms/page.tsx`
```typescript
// 问题代码位置：第 76 行、第 253 行
const mockRooms: Room[] = [...]  // 场地列表
const mockBookings = [...]  // 预约记录
```
**问题**: 数据与 `MOCK_ROOMS`、`MOCK_ROOM_BOOKINGS` 不一致

#### 7. `academic/rooms/approval/page.tsx`
```typescript
// 问题代码位置：第 48 行、第 87 行
const mockPendingApprovals: RoomBooking[] = [...]
const mockAllBookings: RoomBooking[] = [...]
```

#### 8. `academic/rooms/booking/page.tsx`
```typescript
// 问题代码位置：第 53 行、第 152 行
const mockAvailableRooms: Room[] = [...]
const mockMyBookings: RoomBooking[] = [...]
```

#### 9. `academic/rooms/calendar/page.tsx`
```typescript
// 问题代码位置：第 45 行、第 53 行
const mockRooms = [...]
const mockScheduleData: Record<string, RoomBooking[]> = {...}
```

#### 10. `academic/teachers/[id]/page.tsx`
```typescript
// 问题代码位置：第 60 行
const mockTeacherProfile: TeacherProfile = {...}
```
**问题**: 教师档案详情应从 `getMockTeacherProfile()` 获取

---

### 总务模块 (general/)

#### 11-15. 门禁管理 (general/access/)
| 文件 | Mock 数据 |
|------|-----------|
| `page.tsx` | `mockStatistics`, `mockDeviceStatus`, `mockRecentRecords`, `mockPendingVisitors` |
| `devices/page.tsx` | `mockDevices` |
| `persons/page.tsx` | `mockStudents`, `mockTeachers`, `mockStaff` |
| `records/page.tsx` | `mockRecords` |
| `visitors/page.tsx` | `mockVisitors` |

#### 16-19. 其他总务页面
| 文件 | Mock 数据 |
|------|-----------|
| `devices/page.tsx` | `mockDevices` |
| `purchase/page.tsx` | `mockPurchases` |
| `security/page.tsx` | `mockSecurityRecords`, `mockHazards` |
| `staff/page.tsx` | `mockStaff` |

---

### 德育模块 (moral/)

| 文件 | Mock 数据 |
|------|-----------|
| `activities/page.tsx` | `mockActivities` |
| `alerts/page.tsx` | `mockAlerts` |
| `assessment/page.tsx` | `mockAssessments` |
| `growth/page.tsx` | `mockGrowth` |
| `honors/page.tsx` | `mockHonors` |
| `plans/page.tsx` | `mockPlans` |

---

### 教师工作台 (teacher/)

| 文件 | Mock 数据 |
|------|-----------|
| `admin/page.tsx` | `mockMaterials` |
| `collect/page.tsx` | `mockCollections`, `mockNotSubmitted` |
| `communication/page.tsx` | `mockNotices`, `mockMessages`, `mockTemplates` |
| `grade-habit/page.tsx` | `mockGradeClasses` |
| `grade/page.tsx` | `mockTeachers`, `mockClasses` |
| `homework/page.tsx` | `mockHomework`, `mockLearning` |
| `leave/page.tsx` | `mockApplications` |
| `moral/page.tsx` | `mockMoral`, `mockRecords` |
| `safety/page.tsx` | `mockSafety`, `mockHazards` |

---

### 家长端 (parent/)

| 文件 | Mock 数据 |
|------|-----------|
| `announcements/page.tsx` | `mockNotices` |
| `grades/page.tsx` | `mockExams`, `mockGrades` |

---

### 工作流模块 (workflow/)

| 文件 | Mock 数据 |
|------|-----------|
| `purchase/page.tsx` | `mockPurchases` |

---

## 🎯 整改建议

### 方案 A: 页面调用 API（推荐）
```typescript
// 改造前
const mockExams = [...]

// 改造后
const [exams, setExams] = useState([]);

useEffect(() => {
  fetch('/api/exams')
    .then(res => res.json())
    .then(data => setExams(data.data));
}, []);
```

### 方案 B: 导入统一 Mock 数据源
```typescript
// 改造前
const mockExams = [...]

// 改造后
import { MOCK_EXAMS } from '@/lib/mock/academic.mock';
```

---

## 📅 整改优先级建议

1. **Phase 1 (本周)**: P0 级别 - 5 个核心业务页面
2. **Phase 2 (下周)**: P1 级别 - 10 个功能页面
3. **Phase 3 (后续)**: P2 级别 - 22 个辅助页面

---

## ⚠️ 风险提示

1. **数据不一致风险**: 页面显示与 API 返回数据不一致，可能导致用户困惑
2. **维护成本**: 同一数据多处维护，修改时容易遗漏
3. **类型不一致**: 部分 mock 数据类型定义与统一数据源不匹配

---

**审查结论**: 项目存在严重的数据孤岛问题，需要系统性整改。建议按优先级逐步推进，确保页面数据与 API 层保持一致。
