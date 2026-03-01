# 数据孤岛整改方案

> **⚠️ 重要：本方案需审核确认后才能实施**
> 
> 本文档包含：问题诊断、影响分析、整改方案、风险评估

---

## 0. 影响分析（整改前必读）

### 0.1 API依赖链分析

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据依赖链路图                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Mock数据文件                    API路由                      前端消费者
─────────────────────────────────────────────────────────────────────────────
students.mock.ts            →   /api/students/*         →   useStudentData Hook
   └── classInfoMap              └── /api/students           ├── 学生列表页
       (独立的班级映射)              /api/students/[id]        ├── 学生详情页
                                   /api/students/[id]/full-profile
                                                              └── 学生档案组件

classes.mock.ts             →   /api/classes            →   班级选择器组件
   └── MOCK_CLASSES (14个班级)    └── /api/classes?groupByGrade   学生抽屉组件
                                                              班级管理页面

teachers.mock.ts            →   /api/teachers/*         →   useTeacherData Hook
   └── MOCK_TEACHERS             └── /api/teachers           ├── 教师列表页
       (10位教师, 部分班主任)          /api/teachers/[id]        ├── 教师详情页
                                     /api/teachers/[id]/profile   └── 教师档案组件
                                     /api/teachers/[id]/full-profile

schedules.mock.ts           →   /api/schedules          →   课表管理页面
   └── MOCK_SCHEDULE_VIEW_DATA    /api/base-schedules       课表视图组件
       (c6-1格式, 王明华等教师名)    /api/actual-schedules

class-teachers.mock.ts      →   /api/class-teachers     →   班级教师管理页面
   └── MOCK_CLASS_TEACHERS       (班主任和科任教师关系)
       (c001格式, 张明华等教师名)
```

### 0.2 影响范围矩阵

| Mock文件 | 修改内容 | 直接影响的API | 间接影响的页面 | 影响级别 |
|----------|----------|--------------|----------------|----------|
| **students.mock.ts** | 修正classInfoMap | `/api/students/*` | 学生列表、学生详情、学生档案 | 🔴 高 |
| **schedules.mock.ts** | 班级ID `c6-1`→`c013` | `/api/schedules/*` | 课表管理、课表视图 | 🔴 高 |
| **schedules.mock.ts** | 教师名统一 | `/api/schedules/*` | 课表显示、教师关联 | 🟡 中 |
| **teachers.mock.ts** | 班级关联修正 | `/api/teachers/*` | 教师列表、教师详情 | 🟡 中 |
| **classes.mock.ts** | 保持不变（作为基准） | `/api/classes` | 班级选择器 | 🟢 低 |

### 0.3 关键风险点

#### 风险1: 课表数据完全孤立
```
问题：schedules.mock.ts 使用完全不同的ID和命名体系
- 班级ID: c6-1 vs c013 (标准)
- 教师名: 王明华 vs 张明华, 李芳 vs 李秀芳, 张强 vs 王建国
影响：课表无法关联到正确的班级和教师
解决：需要完全重写课表Mock数据，涉及约40条课表记录
```

#### 风险2: students.mock.ts 的 classInfoMap 与 classes.mock.ts 不一致
```
问题：classInfoMap 定义了独立的班级-年级-班主任映射
- c003: classes说"一年级3班", classInfoMap说"二年级"
- c011: classes说"五年级1班班主任t001", classInfoMap说"六年级班主任t011"
影响：学生详情页显示错误的年级和班主任信息
解决：删除 classInfoMap，改为从 classes.mock.ts 导入
```

#### 风险3: API返回格式变更风险
```
问题：如果修改Mock数据结构，API返回格式也会变化
- students.mock.ts 中 Student 类型已定义
- 页面依赖这些字段：grade, gradeName, headTeacherName, className
风险：如果新增/删除字段，页面可能显示异常
缓解：保持字段名不变，只修正值
```

### 0.4 受影响的代码文件清单

| 文件路径 | 修改类型 | 说明 |
|----------|----------|------|
| `src/lib/mock/students.mock.ts` | 修改 | 删除classInfoMap，导入classes.mock.ts |
| `src/lib/mock/schedules.mock.ts` | 重写 | 统一ID格式和教师姓名 |
| `src/lib/mock/teachers.mock.ts` | 修改 | 修正班级关联关系 |
| `src/lib/mock/class-teachers.mock.ts` | 检查 | 确认与classes.mock.ts一致 |
| `src/app/api/students/route.ts` | 无需修改 | Mock导入方式不变 |
| `src/app/api/schedules/route.ts` | 无需修改 | Mock导入方式不变 |
| `src/hooks/useStudentData.ts` | 无需修改 | API调用方式不变 |
| `src/app/academic/students/[id]/page.tsx` | 无需修改 | 数据结构不变 |

### 0.5 不需要修改的部分

以下部分**不需要修改**，因为它们不直接依赖Mock数据：

1. **API路由**：只需要Mock函数签名不变，API代码无需修改
2. **Hooks**：只需要API返回格式不变，Hook代码无需修改  
3. **页面组件**：只需要数据字段名不变，组件代码无需修改
4. **types定义**：Student、Teacher、ClassInfo 类型保持不变

### 0.6 改动影响范围总结

| 改动范围 | 文件数 | 代码行数估计 | 测试覆盖 |
|----------|--------|-------------|----------|
| Mock数据修正 | 4个文件 | ~200行 | 需手动验证 |
| API路由 | 0个文件 | 0行 | - |
| Hooks | 0个文件 | 0行 | - |
| 页面组件 | 0个文件 | 0行 | - |

**结论**：影响范围**仅限于Mock数据层**，上层代码无需修改。

### 1.1 数据孤岛问题

| 问题类型 | 描述 | 影响范围 |
|----------|------|----------|
| **Mock覆盖不足** | 80个API路由仅11个有Mock回退 | 69个API在数据库失败时无数据 |
| **数据源不统一** | 各Mock文件独立定义数据 | 跨模块数据关联失效 |
| **部分页面空数据** | 无Mock回退的API返回空数据 | 页面显示空白或报错 |

### 1.2 数据不一致问题

#### a) 班级-年级-班主任映射不一致

| 班级ID | students.mock.ts | classes.mock.ts | 差异 |
|--------|-----------------|-----------------|------|
| c003 | 二年级, t003王建国 | 一年级3班, t003王建国 | ❌ 年级不一致 |
| c004 | 二年级, t004赵丽萍 | 二年级1班, t004赵丽萍 | ✓ 一致 |
| c005 | 三年级, t005刘伟强 | 二年级2班, t005刘伟强 | ❌ 年级不一致 |
| c007 | 四年级, t007周志明 | 三年级1班, t007周志明 | ❌ 年级不一致 |
| c011 | 六年级, t011张明华 | 五年级1班, t001张明华 | ❌ 年级和班主任都不一致 |
| c012 | 六年级, t012李秀芳 | 五年级2班, t002李秀芳 | ❌ 年级不一致 |

**根因**：`students.mock.ts` 的 classInfoMap 定义与 `classes.mock.ts` 的班级定义错位。

#### b) 班级数量不一致

| 数据源 | 班级数量 | ID范围 |
|--------|----------|--------|
| students.mock.ts | 12个 | c001-c012 |
| classes.mock.ts | 14个 | c001-c014 |

#### c) 课表数据完全独立

| 问题 | schedules.mock.ts | 其他Mock |
|------|-------------------|----------|
| 班级ID | `c6-1` 格式 | `c001-c014` 格式 |
| 教师ID | t001, t002... | t001, t002... |
| 教师姓名 | 王明华, 李芳, 张强 | 张明华, 李秀芳, 王建国 |

#### d) 教师数据部分不一致

| 教师ID | teachers.mock.ts | classes.mock.ts 班主任 | 一致性 |
|--------|-----------------|----------------------|--------|
| t001 | 张明华, 一年级1班 | c001 张明华 | ✓ |
| t002 | 李秀芳, 一年级2班 | c002 李秀芳 | ✓ |
| t003 | 王建国, 二年级1班 | c003 王建国 | ✓ |
| t004 | 赵丽萍, 无班级 | c004 赵丽萍 | ❌ |
| t005 | 刘伟强, 无班级 | c005 刘伟强 | ❌ |

### 1.3 Mock数据覆盖缺失

**有Mock回退的API（11个）**:
- `/api/students` - students.mock.ts
- `/api/teachers` - teachers.mock.ts
- `/api/classes` - classes.mock.ts
- `/api/class-teachers` - class-teachers.mock.ts
- `/api/base-schedules` - schedules.mock.ts
- `/api/actual-schedules` - schedules.mock.ts
- `/api/schedules` - schedules.mock.ts
- `/api/expenses` - general.mock.ts
- `/api/access/*` - access.mock.ts
- `/api/rooms` - general.mock.ts
- `/api/workflow/*` - workflow配置

**无Mock回退的关键API（69个）**:
- `/api/habit/*` - 习惯养成
- `/api/moral/*` - 德育管理
- `/api/grades` - 成绩管理
- `/api/exams` - 考试管理
- `/api/enrollment` - 新生注册
- `/api/attendance` - 考勤管理
- `/api/workload` - 工作量统计
- `/api/research/*` - 教研活动
- `/api/safety/*` - 安全管理
- ...等

---

## 2. 整改方案

### 2.1 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      统一数据源层                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    src/lib/mock/master-data.ts              ││
│  │           (统一的主数据定义 - 学校、班级、教师、学生)         ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     各领域Mock数据文件（引用主数据，扩展领域数据）            ││
│  │  students.mock.ts | teachers.mock.ts | classes.mock.ts      ││
│  │  schedules.mock.ts | moral.mock.ts | access.mock.ts | ...   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 src/lib/mock/index.ts                       ││
│  │              (统一导出，提供数据一致性检查)                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 整改步骤

#### 第一阶段：建立统一主数据源（优先级：高）

**步骤1.1：创建主数据文件**

创建 `src/lib/mock/master-data.ts`，定义：

```typescript
// 学校基础信息
export const SCHOOL_INFO = {
  id: 'lysf-fx',
  name: '龙岩师范附属小学',
  totalGrades: 6,
  classesPerGrade: 2,
};

// 统一的班级定义
export const MASTER_CLASSES = [
  { id: 'c001', name: '一年级1班', grade: 1, classNumber: 1, headTeacherId: 't001' },
  { id: 'c002', name: '一年级2班', grade: 1, classNumber: 2, headTeacherId: 't002' },
  { id: 'c003', name: '二年级1班', grade: 2, classNumber: 1, headTeacherId: 't003' },
  { id: 'c004', name: '二年级2班', grade: 2, classNumber: 2, headTeacherId: 't004' },
  // ... 共12个班级，6个年级×2个班
];

// 统一的教师定义
export const MASTER_TEACHERS = [
  { id: 't001', name: '张明华', gender: 'male', subjects: ['语文'] },
  { id: 't002', name: '李秀芳', gender: 'female', subjects: ['数学'] },
  // ... 共12位班主任 + 若干科任教师
];

// 统一的学生定义（每班5-10名代表性学生）
export const MASTER_STUDENTS = [
  { id: 's001', name: '张三', classId: 'c001', studentNo: '2024001' },
  // ...
];
```

**步骤1.2：重构现有Mock文件**

各Mock文件改为从 `master-data.ts` 导入基础数据：

```typescript
// students.mock.ts
import { MASTER_CLASSES, MASTER_TEACHERS, MASTER_STUDENTS } from './master-data';

// 基于 MASTER_STUDENTS 扩展完整字段
export const MOCK_STUDENTS = MASTER_STUDENTS.map(s => ({
  ...s,
  className: MASTER_CLASSES.find(c => c.id === s.classId)?.name,
  grade: MASTER_CLASSES.find(c => c.id === s.classId)?.grade,
  headTeacherId: MASTER_CLASSES.find(c => c.id === s.classId)?.headTeacherId,
  headTeacherName: MASTER_TEACHERS.find(t => t.id === MASTER_CLASSES.find(c => c.id === s.classId)?.headTeacherId)?.name,
  // ...其他字段
}));
```

#### 第二阶段：补全Mock数据（优先级：高）

**步骤2.1：创建缺失的Mock文件**

| 模块 | 新建Mock文件 | 数据内容 |
|------|-------------|----------|
| 习惯养成 | `habit.mock.ts` | 评价记录、目标、习惯之星 |
| 德育管理 | `moral.mock.ts` | 已存在，需重构 |
| 成绩管理 | `grades.mock.ts` | 成绩记录、考试信息 |
| 考勤管理 | `attendance.mock.ts` | 考勤记录 |
| 工作量 | `workload.mock.ts` | 工作量统计 |
| 教研活动 | `research.mock.ts` | 教研活动、听课记录 |
| 新生注册 | `enrollment.mock.ts` | 新生申请记录 |

**步骤2.2：为API路由添加Mock回退**

修改所有无Mock回退的API路由，添加统一的数据获取模式：

```typescript
// 标准API路由模式
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('xxx').select('*');
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.log('Database failed, using mock data');
    
    // 回退到Mock数据
    const mockData = getMockXxx();
    return NextResponse.json({ 
      success: true, 
      data: mockData,
      source: 'mock'
    });
  }
}
```

#### 第三阶段：数据关联完整性（优先级：中）

**步骤3.1：建立关联查询函数**

```typescript
// src/lib/mock/relations.ts

// 获取学生的完整档案（跨模块聚合）
export function getStudentFullProfile(studentId: string) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const classInfo = MASTER_CLASSES.find(c => c.id === student?.classId);
  const habitRecords = MOCK_HABIT_ASSESSMENTS.filter(a => a.studentId === studentId);
  const moralRecords = MOCK_MORAL_EVALUATIONS.filter(e => e.studentId === studentId);
  const grades = MOCK_GRADES.filter(g => g.studentId === studentId);
  
  return { student, classInfo, habitRecords, moralRecords, grades };
}

// 获取教师的完整档案
export function getTeacherFullProfile(teacherId: string) {
  // 类似实现
}

// 获取班级的完整信息
export function getClassFullInfo(classId: string) {
  // 类似实现
}
```

**步骤3.2：统一ID生成规则**

| 实体类型 | ID前缀 | 格式示例 | 说明 |
|----------|--------|----------|------|
| 学校 | school | school-001 | 多校支持预留 |
| 班级 | c | c001-c012 | 3位数字 |
| 教师 | t | t001-t020 | 3位数字 |
| 学生 | s | s001-s100 | 3位数字 |
| 课程 | course | course-001 | - |
| 课表项 | sch | sch-001 | - |
| 习惯评价 | ha | ha001 | - |
| 德育评价 | me | me001 | - |

#### 第四阶段：数据一致性验证（优先级：中）

**步骤4.1：创建数据验证脚本**

```typescript
// scripts/validate-mock-data.ts

function validateDataConsistency() {
  const errors: string[] = [];
  
  // 检查学生班级引用
  MOCK_STUDENTS.forEach(s => {
    const classExists = MASTER_CLASSES.some(c => c.id === s.classId);
    if (!classExists) {
      errors.push(`学生 ${s.id} 引用不存在的班级 ${s.classId}`);
    }
  });
  
  // 检查班级班主任引用
  MASTER_CLASSES.forEach(c => {
    const teacherExists = MASTER_TEACHERS.some(t => t.id === c.headTeacherId);
    if (!teacherExists) {
      errors.push(`班级 ${c.id} 引用不存在的班主任 ${c.headTeacherId}`);
    }
  });
  
  // 检查习惯评价学生引用
  MOCK_HABIT_ASSESSMENTS.forEach(a => {
    const studentExists = MASTER_STUDENTS.some(s => s.id === a.studentId);
    if (!studentExists) {
      errors.push(`习惯评价 ${a.id} 引用不存在的学生 ${a.studentId}`);
    }
  });
  
  return errors;
}
```

**步骤4.2：添加CI检查**

在构建流程中添加数据一致性检查。

---

## 3. 详细实施计划

### 3.1 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新建 | `src/lib/mock/master-data.ts` | 统一主数据源 |
| 新建 | `src/lib/mock/relations.ts` | 跨模块关联查询 |
| 新建 | `src/lib/mock/habit.mock.ts` | 习惯养成Mock |
| 新建 | `src/lib/mock/grades.mock.ts` | 成绩管理Mock |
| 新建 | `src/lib/mock/attendance.mock.ts` | 考勤管理Mock |
| 新建 | `src/lib/mock/workload.mock.ts` | 工作量Mock |
| 新建 | `src/lib/mock/research.mock.ts` | 教研活动Mock |
| 新建 | `src/lib/mock/enrollment.mock.ts` | 新生注册Mock |
| 重构 | `src/lib/mock/students.mock.ts` | 引用主数据 |
| 重构 | `src/lib/mock/teachers.mock.ts` | 引用主数据 |
| 重构 | `src/lib/mock/classes.mock.ts` | 引用主数据 |
| 重构 | `src/lib/mock/schedules.mock.ts` | 引用主数据，修正ID |
| 重构 | `src/lib/mock/moral.mock.ts` | 引用主数据 |
| 重构 | `src/lib/mock/access.mock.ts` | 引用主数据 |
| 更新 | `src/lib/mock/index.ts` | 统一导出 |
| 修改 | 69个API路由 | 添加Mock回退 |

### 3.2 数据模型修正

**班级数据修正方案**：

采用 `classes.mock.ts` 的定义作为标准（14个班级），修正 `students.mock.ts` 的 classInfoMap：

```typescript
// 修正后的班级-年级-班主任映射
const CLASS_INFO_MAP = {
  'c001': { grade: 1, gradeName: '一年级', headTeacherId: 't001', headTeacherName: '张明华' },
  'c002': { grade: 1, gradeName: '一年级', headTeacherId: 't002', headTeacherName: '李秀芳' },
  'c003': { grade: 1, gradeName: '一年级', headTeacherId: 't003', headTeacherName: '王建国' },
  'c004': { grade: 2, gradeName: '二年级', headTeacherId: 't004', headTeacherName: '赵丽萍' },
  'c005': { grade: 2, gradeName: '二年级', headTeacherId: 't005', headTeacherName: '刘伟强' },
  'c006': { grade: 2, gradeName: '二年级', headTeacherId: 't006', headTeacherName: '陈美玲' },
  'c007': { grade: 3, gradeName: '三年级', headTeacherId: 't007', headTeacherName: '周志明' },
  'c008': { grade: 3, gradeName: '三年级', headTeacherId: 't008', headTeacherName: '陈思思' },
  'c009': { grade: 4, gradeName: '四年级', headTeacherId: 't009', headTeacherName: '王强' },
  'c010': { grade: 4, gradeName: '四年级', headTeacherId: 't010', headTeacherName: '林小燕' },
  'c011': { grade: 5, gradeName: '五年级', headTeacherId: 't001', headTeacherName: '张明华' },
  'c012': { grade: 5, gradeName: '五年级', headTeacherId: 't002', headTeacherName: '李秀芳' },
  'c013': { grade: 6, gradeName: '六年级', headTeacherId: 't003', headTeacherName: '王建国' },
  'c014': { grade: 6, gradeName: '六年级', headTeacherId: 't004', headTeacherName: '赵丽萍' },
};
```

**课表数据修正方案**：

将 `schedules.mock.ts` 的班级ID从 `c6-1` 格式修正为 `c013`，教师姓名统一为标准名称。

### 3.3 工作量估算

| 阶段 | 工作内容 | 预估工作量 |
|------|----------|------------|
| 第一阶段 | 创建主数据源，重构现有Mock | 2-3天 |
| 第二阶段 | 创建缺失Mock文件，添加API回退 | 3-4天 |
| 第三阶段 | 建立关联查询，统一ID规则 | 1-2天 |
| 第四阶段 | 数据验证，CI集成 | 1天 |
| **合计** | - | **7-10天** |

---

## 4. 详细风险评估

### 4.1 API影响评估

#### ✅ **不会影响的API**

以下API**不需要修改**，因为它们只消费Mock数据：

| API路由 | Mock导入方式 | 是否修改 |
|---------|-------------|----------|
| `/api/students` | `import { MOCK_STUDENTS, getMockStudents }` | ❌ 不修改 |
| `/api/students/[id]` | `getMockStudents()` | ❌ 不修改 |
| `/api/students/[id]/full-profile` | 多Mock聚合 | ❌ 不修改 |
| `/api/classes` | `import { MOCK_CLASSES, getMockClasses }` | ❌ 不修改 |
| `/api/teachers` | `import { MOCK_TEACHERS, getMockTeachers }` | ❌ 不修改 |
| `/api/schedules` | `getMockScheduleViewData()` | ❌ 不修改 |

**原因**：Mock函数签名不变，返回类型不变，API代码无需改动。

#### ⚠️ **可能受影响的场景**

| 场景 | 风险描述 | 缓解措施 |
|------|----------|----------|
| Mock函数返回格式变更 | 如果修改返回的Student类型字段 | 保持字段名不变，只修正值 |
| Mock数据量变化 | 班级数量从12变14 | 分页逻辑已处理，无影响 |
| ID格式变化 | schedules的c6-1改为c013 | 需同步修改API中的classId过滤 |

### 4.2 页面影响评估

#### ✅ **不会影响的页面**

以下页面**不需要修改**：

| 页面 | 数据来源 | 是否修改 |
|------|----------|----------|
| 学生列表页 `/academic/students` | `useStudentsList` Hook | ❌ 不修改 |
| 学生详情页 `/academic/students/[id]` | `useStudentFullProfile` Hook | ❌ 不修改 |
| 教师列表页 `/teacher` | `useTeachersList` Hook | ❌ 不修改 |
| 班级管理页 `/academic/classes` | `/api/classes` | ❌ 不修改 |
| 课表管理页 `/academic/schedule` | `/api/schedules` | ❌ 不修改 |

**原因**：数据字段名不变，页面渲染逻辑无需改动。

#### ⚠️ **可能受影响的显示**

| 页面 | 可能变化 | 预期效果 |
|------|----------|----------|
| 学生详情页 | 年级显示从"二年级"变为"一年级" | ✅ 这是预期修正 |
| 学生详情页 | 班主任从"t011张明华"变为"t001张明华" | ✅ 这是预期修正 |
| 课表视图 | 班级ID从"c6-1"变为"c013" | ✅ 可关联到正确班级 |
| 课表视图 | 教师从"王明华"变为"张明华" | ✅ 教师显示一致 |

### 4.3 Hook影响评估

#### ✅ **不会影响的Hook**

以下Hook**不需要修改**：

| Hook | API调用方式 | 是否修改 |
|------|------------|----------|
| `useStudentsList` | `fetch('/api/students', params)` | ❌ 不修改 |
| `useStudentFullProfile` | `fetch('/api/students/${id}/full-profile')` | ❌ 不修改 |
| `useTeachersList` | `fetch('/api/teachers', params)` | ❌ 不修改 |
| `useTeacherFullProfile` | `fetch('/api/teachers/${id}/full-profile')` | ❌ 不修改 |

**原因**：API路径不变，返回结构不变。

### 4.4 Mock数据变更影响汇总

| Mock文件 | 变更类型 | 对API影响 | 对页面影响 |
|----------|----------|-----------|-----------|
| students.mock.ts | 删除classInfoMap，导入classes | 无影响（函数签名不变） | 显示正确的年级/班主任 |
| schedules.mock.ts | 重写班级ID和教师名 | 无影响（函数签名不变） | 显示正确的班级/教师 |
| teachers.mock.ts | 修正班级关联 | 无影响（函数签名不变） | 显示正确的班级信息 |

### 4.5 改动前后对比

#### 改动前：学生数据流
```
students.mock.ts (独立定义classInfoMap)
    → 数据不一致（班级年级错误）
    → API返回错误数据
    → 页面显示错误信息
```

#### 改动后：学生数据流
```
master-data.ts (统一班级定义)
    → students.mock.ts (导入master-data)
    → 数据一致
    → API返回正确数据
    → 页面显示正确信息
```

### 4.6 风险应对策略

| 风险等级 | 风险描述 | 应对策略 | 验证方法 |
|----------|----------|----------|----------|
| 🔴 高 | 修改Mock数据结构导致API报错 | 保持返回类型不变 | TypeScript类型检查 |
| 🟡 中 | 页面显示空数据 | 分批修改，每步验证 | 手动测试页面 |
| 🟢 低 | 数据值变化导致页面显示变化 | 这是预期行为 | 验证显示是否正确 |

### 4.7 回滚策略

如果整改出现问题，可按以下步骤回滚：

1. **Git回滚**：`git checkout HEAD -- src/lib/mock/`
2. **验证回滚**：重启开发服务器，验证页面正常
3. **记录问题**：将问题记录到文档，重新评估整改方案

---

## 5. 风险与应对（简化版）

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 数据修改影响现有功能 | 页面显示异常 | 分批修改，充分测试 |
| Mock数据与数据库结构不一致 | 上线后数据异常 | Mock数据结构与数据库Schema保持一致 |
| 遗漏某些API的回退 | 部分页面无数据 | 使用脚本自动检测无Mock的API |

---

## 6. 验收标准

1. **数据一致性**：所有Mock文件中的ID引用有效，无悬空引用
2. **Mock覆盖**：80个API路由全部有Mock回退
3. **关联完整**：学生详情页可正常展示习惯、德育、成绩等跨模块数据
4. **构建通过**：TypeScript类型检查通过，数据验证脚本无错误

---

## 7. 后续优化

1. **数据库迁移**：将Mock数据作为种子数据导入Supabase
2. **数据同步**：建立Mock数据与数据库的双向同步机制
3. **自动化测试**：添加E2E测试覆盖关键数据流程
