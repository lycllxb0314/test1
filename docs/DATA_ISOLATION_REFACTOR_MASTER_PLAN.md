# 数据孤岛整改总体方案

> **状态：待审核**
> **创建时间：2024-03-01**
> **影响范围：全系统数据层**

---

## 1. 问题全景分析

### 1.1 数据孤岛分布统计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           数据孤岛问题全景                                    │
└─────────────────────────────────────────────────────────────────────────────┘

位置                    数量      严重程度    说明
─────────────────────────────────────────────────────────────────────────────
页面内 mock 数据         63处      🔴 高       前端直接定义数据，无法与后端同步
API 内 mock 数据         40处      🟡 中       API 层独立定义，与 lib/mock 不一致
lib/mock 独立定义        11个文件   🟢 已整改   已建立 master-data.ts 统一入口

按模块分布：
├── academic (教务)      20处      🔴 核心业务
├── teacher (教师空间)   18处      🔴 核心业务  
├── general (总务)       15处      🟡 支撑业务
├── moral (德育)         6处       🟡 支撑业务
└── parent (家长端)      3处       🟢 影响较小
```

### 1.2 核心实体数据依赖图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        核心数据实体依赖关系                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │ master-data  │  ← 唯一数据源（已建立）
                          │    .ts       │
                          └──────┬───────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
   ┌───────────┐          ┌───────────┐          ┌───────────┐
   │ classes   │          │ teachers  │          │ students  │
   │ .mock.ts  │          │ .mock.ts  │          │ .mock.ts  │
   └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
         │                       │                       │
         ▼                       ▼                       ▼
   ┌───────────┐          ┌───────────┐          ┌───────────┐
   │ /api/     │          │ /api/     │          │ /api/     │
   │ classes   │          │ teachers  │          │ students  │
   └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │     前端页面/Hooks      │
                    │  (应该只通过 API 获取)  │
                    └────────────────────────┘

问题：当前有 63 处前端页面绕过 API 直接定义 mock 数据
```

### 1.3 问题分类与优先级

| 优先级 | 问题类型 | 数量 | 影响范围 | 整改难度 |
|--------|----------|------|----------|----------|
| P0 | 核心实体数据不一致 | 6个页面 | 班级/教师/学生显示错误 | 中 |
| P1 | 页面绕过 API 获取数据 | 63处 | 数据无法同步更新 | 高 |
| P1 | API 内独立 mock 定义 | 15个API | 回退数据与主数据源不一致 | 中 |
| P2 | 缺少 mock 回退机制 | 54个API | 数据库失败时无数据 | 低 |

---

## 2. 整改目标架构

### 2.1 目标数据流架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         目标：统一数据源架构                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────┐
                    │      master-data.ts         │
                    │  (唯一主数据源，已建立)      │
                    │  - 14个班级定义             │
                    │  - 28位教师定义             │
                    │  - 30位学生定义             │
                    │  - 学校基础信息             │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ classes.mock  │          │teachers.mock  │          │students.mock  │
│ 导入 master   │          │ 导入 master   │          │ 导入 master   │
│ 扩展业务字段  │          │ 扩展业务字段  │          │ 扩展业务字段  │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ /api/classes  │          │ /api/teachers │          │ /api/students │
│ + DB 查询     │          │ + DB 查询     │          │ + DB 查询     │
│ + Mock 回退   │          │ + Mock 回退   │          │ + Mock 回退   │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │        前端数据获取层        │
                    │  ┌───────────────────────┐  │
                    │  │ useClasses() Hook     │  │
                    │  │ useTeachers() Hook    │  │
                    │  │ useStudents() Hook    │  │
                    │  └───────────────────────┘  │
                    │           或                │
                    │  页面内直接 fetch('/api/*') │
                    └─────────────────────────────┘

原则：
1. master-data.ts 是唯一的数据源定义
2. *.mock.ts 文件只扩展，不重新定义
3. API 路由统一从 lib/mock 导入
4. 前端页面只能通过 API 获取数据
```

### 2.2 整改后文件结构

```
src/lib/mock/
├── master-data.ts        # 主数据源（唯一）- 已建立
├── classes.mock.ts       # 班级相关 - 已重构导入 master
├── teachers.mock.ts      # 教师相关 - 已重构导入 master
├── students.mock.ts      # 学生相关 - 已重构导入 master
├── schedules.mock.ts     # 课表相关 - 已重构导入 master
├── academic.mock.ts      # 教务相关 - 待重构
├── moral.mock.ts         # 德育相关 - 待重构
├── general.mock.ts       # 总务相关 - 待重构
├── access.mock.ts        # 门禁相关 - 待重构
├── class-teachers.mock.ts # 班级教师关系 - 待重构
└── index.ts              # 统一导出

src/app/api/
├── classes/route.ts      # 从 lib/mock 导入 - 已完成
├── teachers/route.ts     # 从 lib/mock 导入 - 已完成
├── students/route.ts     # 从 lib/mock 导入 - 已完成
├── [其他API]/route.ts    # 需移除内部 mock 定义，改为导入
└── ...

src/app/[模块]/
├── [页面]/page.tsx       # 需移除内部 mock 数据，改为 fetch API
└── ...
```

---

## 3. 分阶段整改计划

### 3.1 整改阶段总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          整改阶段路线图                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 0: 基础设施 ✅ 已完成
├── 创建 master-data.ts
├── 定义核心实体类型
└── 验证数据一致性

Phase 1: 核心实体层 🔄 进行中
├── 重构 classes.mock.ts
├── 重构 teachers.mock.ts  
├── 重构 students.mock.ts
└── 重构 schedules.mock.ts

Phase 2: API 层统一 (预计 2-3 天)
├── 移除 API 内部 mock 定义
├── 统一导入 lib/mock
└── 添加缺失的 mock 回退

Phase 3: 前端页面层 (预计 3-5 天)
├── 重构核心页面（教师、学生、课表）
├── 重构支撑页面（德育、总务）
└── 删除页面内 mock 数据

Phase 4: 验证与优化 (预计 1-2 天)
├── 全量数据一致性测试
├── 页面功能回归测试
└── 性能优化
```

### 3.2 Phase 1: 核心实体层（已基本完成）

**目标**：建立统一数据源，确保核心实体数据一致

| 任务 | 状态 | 说明 |
|------|------|------|
| 创建 master-data.ts | ✅ 完成 | 定义 14 班级、28 教师、30 学生 |
| 重构 classes.mock.ts | ✅ 完成 | 导入 master，扩展业务字段 |
| 重构 teachers.mock.ts | ✅ 完成 | 导入 master，扩展业务字段 |
| 重构 students.mock.ts | ✅ 完成 | 导入 master，删除独立映射 |
| 重构 schedules.mock.ts | ✅ 完成 | 统一 ID 格式和教师姓名 |
| 验证数据一致性 | ✅ 完成 | 班级-班主任映射 14/14 有效 |

### 3.3 Phase 2: API 层统一

**目标**：移除 API 内部的 mock 数据定义，统一从 lib/mock 导入

**需要整改的 API 文件（15个）**：

| 优先级 | API 文件 | 当前问题 | 整改方案 |
|--------|----------|----------|----------|
| P0 | `/api/actual-schedules/route.ts` | 内部定义 mockBaseScheduleSlots | 导入 schedules.mock.ts |
| P0 | `/api/schedule/substitutes/route.ts` | 内部定义 mockClasses, mockTeachers | 导入 classes/teachers.mock.ts |
| P1 | `/api/students/[id]/full-profile/route.ts` | 内部定义 mockStudentProfiles | 导入 students.mock.ts |
| P1 | `/api/teachers/[id]/full-profile/route.ts` | 已使用 getMockTeacherProfile | ✅ 无需修改 |
| P2 | `/api/teachers/achievements/route.ts` | 内部定义 mockAchievements | 移至 teachers.mock.ts |
| P2 | `/api/teachers/honors/route.ts` | 内部定义 mockHonors | 移至 teachers.mock.ts |
| P2 | `/api/teachers/records/route.ts` | 内部定义 mockRecords | 移至 teachers.mock.ts |
| P2 | `/api/teachers/trainings/route.ts` | 内部定义 mockTrainings | 移至 teachers.mock.ts |
| P3 | `/api/grades/route.ts` | 内部定义 mockGrades | 创建 grades.mock.ts |
| P3 | `/api/exams/route.ts` | 内部定义 mockExams | 创建 exams.mock.ts |
| P3 | `/api/attendance/route.ts` | 内部定义 mockAttendance | 创建 attendance.mock.ts |
| P3 | `/api/courses/route.ts` | 内部定义 mockCourses | 创建 courses.mock.ts |
| P3 | `/api/homeworks/route.ts` | 内部定义 mockHomeworks | 创建 homeworks.mock.ts |
| P3 | `/api/assets/route.ts` | 内部定义 mockAssets | 创建 assets.mock.ts |
| P3 | `/api/rooms/route.ts` | 内部定义 mockRooms | 创建 rooms.mock.ts |

### 3.4 Phase 3: 前端页面层

**目标**：移除页面内 mock 数据，统一通过 API 获取

**需要整改的页面分类**：

#### 3.4.1 核心页面（P0 - 高优先级）

| 页面 | 当前问题 | 整改方案 | 影响范围 |
|------|----------|----------|----------|
| `/academic/teachers/page.tsx` | 独立 mockTeachers | fetch('/api/teachers') | 教师列表 |
| `/academic/students/page.tsx` | 独立 mockStudents | fetch('/api/students') | 学生列表 |
| `/academic/classes/[id]/schedule/page.tsx` | 独立 mockClassInfo, mockScheduleSlots | fetch('/api/classes'), fetch('/api/schedules') | 班级课表 |
| `/teacher/grade/page.tsx` | 独立 mockTeachers, mockClasses | fetch API | 年级管理 |
| `/teacher/habit/page.tsx` | 独立 mockStudents | fetch('/api/students') | 习惯养成 |
| `/teacher/daily/page.tsx` | 独立 mockStudents | fetch('/api/students') | 日常记录 |

#### 3.4.2 支撑页面（P1 - 中优先级）

| 模块 | 页面数 | 主要问题 | 整改方式 |
|------|--------|----------|----------|
| general/access | 5个 | 门禁人员数据独立定义 | 统一使用 API |
| moral | 6个 | 德育活动数据独立定义 | 统一使用 API |
| parent | 3个 | 家长端数据独立定义 | 统一使用 API |

#### 3.4.3 其他页面（P2 - 低优先级）

其他页面多为功能独立的数据，不影响核心实体关联，可延后处理。

---

## 4. 详细整改步骤

### 4.1 API 层整改模板

**整改前**：
```typescript
// src/app/api/example/route.ts
const mockData = [
  { id: '1', name: 'Example', classId: 'c001' },
  // ...
];

export async function GET() {
  // 数据库查询...
  if (error) {
    return NextResponse.json({ data: mockData });
  }
}
```

**整改后**：
```typescript
// src/lib/mock/example.mock.ts
import { MASTER_CLASSES } from './master-data';

export const MOCK_EXAMPLES = [
  { id: '1', name: 'Example', classId: 'c001' }, // 使用标准 classId
];

// src/app/api/example/route.ts
import { MOCK_EXAMPLES } from '@/lib/mock/example.mock';

export async function GET() {
  // 数据库查询...
  if (error) {
    return NextResponse.json(success(MOCK_EXAMPLES, 'mock'));
  }
}
```

### 4.2 前端页面整改模板

**整改前**：
```typescript
// src/app/academic/example/page.tsx
const mockItems = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
];

export default function ExamplePage() {
  const [items, setItems] = useState(mockItems);
  // ...
}
```

**整改后**：
```typescript
// src/app/academic/example/page.tsx
export default function ExamplePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/examples')
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  // ...
}
```

---

## 5. 风险评估与缓解措施

### 5.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 页面显示空数据 | 中 | 高 | 保留 loading 状态，确保 API 返回正确格式 |
| 数据字段名不匹配 | 低 | 中 | 保持 API 返回字段名不变 |
| 循环依赖 | 低 | 高 | 严格分层：master → mock → api → page |
| 性能下降 | 低 | 低 | 使用 SWR/React Query 缓存 |
| 整改遗漏 | 中 | 中 | 建立检查清单，全量测试 |

### 5.2 回滚策略

每个阶段整改完成后：
1. 创建 Git 分支保存
2. 标记版本 Tag
3. 如遇严重问题，可快速回滚

### 5.3 验证检查清单

每个页面整改后需验证：
- [ ] 页面正常加载，无 JS 错误
- [ ] 数据正确显示（班级名称、教师姓名等）
- [ ] 筛选/搜索功能正常
- [ ] 详情页/编辑页数据关联正确
- [ ] 移动端响应式正常

---

## 6. 工作量估算

| 阶段 | 任务数 | 预估工时 | 依赖关系 |
|------|--------|----------|----------|
| Phase 1 (已完成) | 6 | 4h | 无 |
| Phase 2: API 层 | 15 | 8h | Phase 1 |
| Phase 3: 核心页面 | 6 | 6h | Phase 2 |
| Phase 3: 支撑页面 | 14 | 8h | Phase 2 |
| Phase 4: 验证 | 全量 | 4h | Phase 3 |
| **总计** | **41** | **30h** | - |

---

## 7. 待确认事项

### 7.1 技术决策

| 决策点 | 选项 | 建议 |
|--------|------|------|
| 数据获取方式 | fetch vs SWR vs React Query | 建议使用 fetch，简单直接 |
| 全局状态管理 | 保持现状 vs 引入 Zustand | 保持现状，避免大改 |
| API 错误处理 | Toast vs 静默失败 | 建议 Toast 提示用户 |

### 7.2 需要确认的问题

1. **是否需要添加 mock 数据到所有 69 个无回退的 API？**
   - 建议：仅对核心业务 API 添加，其他可延后

2. **是否需要统一使用数据 Hook（如 useTeachers）？**
   - 建议：先完成数据源统一，Hook 封装可后续优化

3. **整改期间是否需要冻结新功能开发？**
   - 建议：核心模块（academic/teacher）整改期间冻结

---

## 8. 审核确认

请审核以上方案，确认后开始实施。

**审核要点**：
1. ✅ 是否认同分阶段整改策略？
2. ✅ 是否认同优先级排序？
3. ✅ 是否有其他需要考虑的因素？
4. ✅ 是否确认开始 Phase 2 的整改？

---

*文档版本: v1.0*
*最后更新: 2024-03-01*
