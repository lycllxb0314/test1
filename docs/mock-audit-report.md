# 前端页面独立 Mock 数据审查报告

**审查时间**: 2024-12-10（第二轮）
**审查范围**: `src/app/` 目录下所有页面组件 + `src/data/mock.ts`
**问题类型**: 页面内定义独立 mock 数据（未使用统一数据源）

---

## 📊 审查摘要

| 指标 | 数量 |
|------|------|
| 问题页面总数 | **50+ 个** |
| 独立 mock 数据定义 | **100+ 处** |
| 涉及模块 | 教务、总务、德育、教师、家长、驾驶舱、工作流 |

---

## 🚨 严重发现：数据严重不一致

### `src/data/mock.ts` vs `src/lib/mock/master-data.ts`

| 数据项 | `data/mock.ts` | `lib/mock/master-data.ts` | 差异 |
|--------|----------------|---------------------------|------|
| 学生总数 | 1286 | 100 | **相差 12 倍** |
| 教师总数 | 68 | 28 | **相差 2.4 倍** |
| 班级总数 | 36 | 14 | **相差 2.6 倍** |

**影响范围**：所有引用 `schoolStats` 的页面显示的数据与实际数据源不一致！

---

## 🔴 新增问题：驾驶舱/工作台页面

### 1. `dashboard/principal/page.tsx`（校长驾驶舱）
```typescript
// 独立 mock 数据定义
const schoolHealthData = {...}       // 学校运行健康度
const teachingQualityData = {...}    // 教学质量趋势
const teacherDevelopmentData = {...} // 教师队伍发展
const studentGrowthData = {...}      // 学生成长指标
const resourceEfficiencyData = {...} // 资源配置效率
const developmentOpportunities = {...} // 发展机遇与突破
```
**问题**: 6 个独立 mock 数据对象，数据与统一数据源完全不一致

### 2. `dashboard/secretary/page.tsx`（书记驾驶舱）
```typescript
const partyBuildingData = {...}      // 党建工作数据
const teacherMoralityData = {...}    // 师德师风数据
const safetyData = {...}             // 安全稳定数据
const collaborationData = {...}      // 家校社协同数据
const developmentData = {...}        // 发展规划数据
```
**问题**: 5 个独立 mock 数据对象

### 3. `dashboard/vice-principal/page.tsx`（副校长驾驶舱）
```typescript
const pendingDecisions = [...]       // 待决策事项
const departmentWork = {...}         // 分管部门重点工作
const crossDepartmentProjects = [...] // 跨部门协同项目
const riskAlerts = [...]             // 风险预警
const coordinationNeeds = [...]      // 资源协调需求
const weeklySchedule = [...]         // 本周工作安排
```
**问题**: 6 个独立 mock 数据对象

### 4. `dashboard/page.tsx`（主驾驶舱）
```typescript
import { schoolStats } from '@/data/mock';  // 引用不一致的数据源
const pendingTasks = [...]           // 待办事项
const quickActions = [...]           // 快捷操作
```

---

## 🔴 新增问题：各系统首页

### 5. `academic/page.tsx`（教务首页）
```typescript
import { schoolStats } from '@/data/mock';  // 不一致数据
const todaySchedule = [...]          // 今日课程
const topStudents = [...]            // 优秀学生
const recentActivities = [...]       // 最近活动
```

### 6. `general/page.tsx`（总务首页）
```typescript
import { mockRepairRequests, mockAssets } from '@/data/mock';
const stats = [...]                  // 统计数据
const securityAlerts = [...]         // 安全提醒
```

### 7. `moral/page.tsx`（德育首页）
```typescript
const schoolStats = {                // 重新定义！与 data/mock.ts 不同
  totalStudents: 2450,               // 又一个不同值！
  totalClasses: 48,                  // 又一个不同值！
  ...
};
const gradeComparisonData = [...]    // 年级对比数据
const classRankingData = [...]       // 班级德育排行
const warningData = [...]            // 实时预警数据
const moralTypeData = [...]          // 德育类型分布
```
**严重问题**: 德育首页重新定义了 `schoolStats`，值又不同！

### 8. `teacher/page.tsx`（教师工作台）
```typescript
const todosData = [...]              // 待办事项
const headTeacherTodos = [...]       // 班主任专属待办
const notificationsData = [...]      // 通知提醒
const todayAttendance = {...}        // 今日考勤
const classOverview = {...}          // 班级概况
const todaySchedule = [...]          // 今日课表
```

---

## 📋 `src/data/mock.ts` 完整问题清单

该文件是**另一个独立数据源**，与 `lib/mock/` 完全独立：

| 导出项 | 用途 | 使用页面数 |
|--------|------|-----------|
| `mockUsers` | 用户数据 | 多处 |
| `mockClasses` | 班级数据（36班）| 多处 |
| `mockAnnouncements` | 公告数据 | 驾驶舱 |
| `mockStudents` | 学生数据 | 多处 |
| `mockRepairRequests` | 维修申请 | 总务首页 |
| `mockAssets` | 资产数据 | 总务首页 |
| `schoolStats` | **学校统计** | **5+ 页面** |
| `newsList` | 新闻动态 | 首页 |
| `quickLinks` | 快捷入口 | 多处 |

---

## 🔴 严重程度分级（更新）

### P0 - 极高优先级（数据不一致问题）

| 页面 | 问题 | 影响 |
|------|------|------|
| `data/mock.ts` | 与 `lib/mock/master-data.ts` 数据完全不一致 | **全局性影响** |
| `dashboard/principal/page.tsx` | 6 处独立 mock | 校长决策数据错误 |
| `dashboard/secretary/page.tsx` | 5 处独立 mock | 书记工作台数据错误 |
| `dashboard/vice-principal/page.tsx` | 6 处独立 mock | 副校长工作台数据错误 |
| `moral/page.tsx` | 重新定义 schoolStats（又是不同值！） | 德育统计数据三重不一致 |
| `academic/page.tsx` | 引用错误 schoolStats | 教务首页数据错误 |

### P1 - 高优先级（核心业务页面）

| 页面 | Mock 数据 |
|------|-----------|
| `teacher/page.tsx` | 6 处独立 mock |
| `general/page.tsx` | 多处独立 mock |
| `academic/attendance/page.tsx` | `mockAttendance`, `mockLeaveRecords` |
| `academic/exams/page.tsx` | `mockExams` |
| `academic/grades/page.tsx` | `mockGrades` |
| `academic/teachers/[id]/page.tsx` | `mockTeacherProfile` |
| `parent/grades/page.tsx` | `mockExams`, `mockGrades` |

### P2 - 中优先级（功能页面）- **10 个**

### P3 - 低优先级（辅助功能页面）- **22 个**

---

## 📊 数据不一致问题汇总

### 学校统计数据三重不一致

| 来源 | 学生数 | 教师数 | 班级数 |
|------|--------|--------|--------|
| `lib/mock/master-data.ts` | 100 | 28 | 14 |
| `data/mock.ts` → `schoolStats` | 1286 | 68 | 36 |
| `moral/page.tsx` → `schoolStats` | 2450 | ? | 48 |

**这导致**：
- 教务首页显示 1286 名学生
- 德育首页显示 2450 名学生
- 实际数据源只有 100 名学生

---

## 🎯 整改优先级建议（更新）

### Phase 0 - 紧急（本周）
1. **删除 `src/data/mock.ts`**，所有引用改为 `lib/mock/`
2. **驾驶舱页面整改** - 3 个页面，17 处 mock
3. **首页统计数据统一** - 5 个首页使用统一数据源

### Phase 1 - 高优先级
- P0 核心业务页面整改

### Phase 2 - 中优先级
- P1 功能页面整改

### Phase 3 - 后续
- P2/P3 辅助页面整改

---

## ⚠️ 风险提示（更新）

1. **数据严重不一致**: 同一数据在不同页面显示不同值
2. **数据源分裂**: 存在两个完全独立的 mock 数据体系
3. **决策风险**: 领导驾驶舱数据与实际不符，可能影响决策
4. **用户体验差**: 用户在不同页面看到矛盾的统计数据

---

**审查结论**: 项目存在**严重的数据孤岛和数据不一致问题**，需要立即进行系统性整改。建议优先处理 `src/data/mock.ts` 文件和驾驶舱页面。
