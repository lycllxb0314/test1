# AGENTS.md - 教务管理系统项目规范

> 本文件为 AI Agent 和开发者提供项目全貌、开发规范和常见问题解决方案。

## 项目概览

### 简介
基于 Next.js 16 App Router 的全栈教务管理系统，支持教师管理、学生管理、课程安排、考勤管理、成绩管理、请假审批、总务管理等核心业务模块。

### 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.1 | 全栈框架 (App Router) |
| React | 19.2.3 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Supabase | 2.95.3 | 数据库 (PostgreSQL) |
| Tailwind CSS | 4.x | 样式 |
| shadcn/ui | latest | UI 组件库 |
| Zod | 4.3.5 | 数据验证 |
| DOMPurify | 3.3.3 | HTML 安全消毒 |

### 项目规模
- 总代码行数: ~156,000 行
- TypeScript 文件: 298 个
- TSX 组件: 189 个
- API 路由: 100+ 个
- 页面: 93 个

---

## 架构设计

### 六层架构

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Component (UI展示)                                │
│  - 页面: src/app/**/page.tsx (93个)                         │
│  - 组件: src/components/**/*.tsx (57个)                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Hook (React适配)                                  │
│  - 自定义 Hooks: src/hooks/*.ts (25个)                      │
│  - 封装状态管理和数据获取逻辑                                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: API Client (请求封装)                             │
│  - 统一请求封装: src/services/api-client.ts                 │
│  - 处理认证、错误、缓存                                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: API Route (HTTP接口)                              │
│  - Next.js API Routes: src/app/api/**/route.ts (100+个)     │
│  - 调用 Service 层处理业务                                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Service (业务逻辑)                                │
│  - 业务服务: src/services/*.ts (19个)                       │
│  - 通过 DI 容器获取 Repository                               │
├─────────────────────────────────────────────────────────────┤
│  Layer 6: Repository (数据访问)                             │
│  - 数据仓库: src/repositories/*.ts (19个)                   │
│  - 继承 BaseRepository，封装数据库操作                       │
└─────────────────────────────────────────────────────────────┘
```

### 依赖注入 (DI)

项目实现了轻量级依赖注入容器 (`src/lib/di/container.ts`)，**已覆盖全部 Service 和 Repository 层**：

**已注册的服务标识符 (SERVICE_IDENTIFIERS)：**

**Repositories (20个)：**
- UserRepository, TeacherRepository, StudentRepository, ClassRepository
- AttendanceRepository, ScheduleRepository, ActualScheduleRepository, GradeRepository
- ApprovalRepository, MessageRepository, LeaveRepository, CourseRepository
- ExamRepository, ExamScoreRepository, HomeworkRepository, HomeworkSubmissionRepository
- ResearchActivityRepository, ResearchStageRepository, ResearchAchievementRepository, ResearchResourceRepository
- MoralActivityRepository, MoralActivitySubmissionRepository
- HabitGoalRepository, StudentHabitGoalRepository, HabitRecordRepository, HabitStarRepository
- InformationCollectionRepository, CollectionResponseRepository
- **新增**: SeatingPlanRepository, ClassSOPRepository, ClassRoutineRepository
- **新增**: ConversationRepository, SharedResourceRepository, TeachingResourceRepository
- **新增**: LessonPrepRepository, DutyTeacherRepository, WeeklyEvaluationRepository

**Services (24个)：**
- UserService, StudentService, TeacherService, ClassService
- AttendanceService, ApprovalService, CourseService
- ExamService, ExamScoreService, HomeworkService, HomeworkSubmissionService
- ResearchActivityService, ResearchStageService, ResearchAchievementService, ResearchResourceService
- MoralActivityService, MoralActivitySubmissionService
- HabitGoalService, StudentHabitGoalService, HabitRecordService, HabitStarService
- InformationCollectionService, CollectionResponseService
- **新增**: SeatingPlanService, ClassSOPService, ClassRoutineService
- **新增**: ConversationService, MessageService, SharedResourceService, TeachingResourceService
- **新增**: LessonPrepService, MathPrepService, ReadingTeachingService, WritingTeachingService
- **新增**: TextbookService

```typescript
// 注册服务
container.registerSingleton(SERVICE_IDENTIFIERS.UserRepository, () => userRepository);

// 获取服务
const userRepo = getService<UserRepository>(SERVICE_IDENTIFIERS.UserRepository);
```

**优势**：
- 解耦各层依赖
- 支持单例/瞬态模式
- 循环依赖检测
- **完整覆盖**: 所有 Service 和 Repository 都通过 DI 容器管理

### 目录结构

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (100+)
│   │   ├── academic/         # 教务相关 API
│   │   ├── auth/             # 认证相关 API
│   │   ├── classes/          # 班级管理 API
│   │   ├── students/         # 学生管理 API
│   │   ├── teachers/         # 教师管理 API
│   │   └── ...
│   ├── academic/             # 教务管理页面
│   ├── general/              # 总务管理页面
│   ├── moral/                # 德育管理页面
│   ├── teacher/              # 教师工作台页面
│   ├── parent/               # 家长门户页面
│   └── ...
├── components/               # React 组件
│   ├── ui/                   # shadcn/ui 基础组件 (57个)
│   ├── approval/             # 审批相关组件
│   ├── research/             # 教研相关组件
│   ├── schedule/             # 课表相关组件
│   └── ...
├── hooks/                    # 自定义 Hooks (25个)
├── services/                 # Service 层 (26个)
│   ├── base.service.ts       # 基础 Service 类
│   ├── user.service.ts       # 用户服务
│   ├── class-sop.service.ts  # 班级SOP智能台账服务
│   ├── class-routine.service.ts # 班级常规评比服务
│   ├── seating-plan.service.ts # 座位表服务
│   ├── conversation.service.ts # 对话存储服务
│   ├── teaching-resource.service.ts # 教学资源库服务
│   ├── shared-resource.service.ts # 共享教学资源服务
│   ├── lesson-prep.service.ts # 备课中心服务
│   ├── math-prep.service.ts  # 数学备课服务
│   ├── reading-teaching.service.ts # 朗读教学服务
│   ├── writing-teaching.service.ts # 习作教学服务
│   ├── textbook.service.ts   # 课文数据服务
│   └── ...
├── repositories/             # Repository 层 (28个)
│   ├── base.repository.ts    # 基础 Repository 类
│   ├── user.repository.ts    # 用户仓库
│   ├── class-sop.repository.ts # 班级SOP仓库
│   ├── class-routine.repository.ts # 班级常规仓库
│   ├── seating-plan.repository.ts # 座位表仓库
│   ├── conversation.repository.ts # 对话仓库
│   ├── teaching-resource.repository.ts # 教学资源仓库
│   ├── shared-resource.repository.ts # 共享资源仓库
│   ├── lesson-prep.repository.ts # 备课文档仓库
│   └── ...
├── lib/                      # 工具库
│   ├── api.ts                # API 工具（响应格式化、错误处理）
│   ├── auth.ts               # 认证中间件
│   ├── di/                   # 依赖注入容器
│   └── utils.ts              # 通用工具函数
├── types/                    # 类型定义 (26个)
│   ├── db-helpers.ts         # 数据库行类型统一管理
│   ├── user.ts               # 用户类型
│   ├── student.ts            # 学生类型
│   └── ...
├── contexts/                 # React Context
│   └── AuthContext.tsx       # 认证上下文
├── config/                   # 配置文件
│   ├── roles.ts              # 角色配置
│   └── habit.ts              # 习惯养成配置
└── storage/                  # 存储层
    └── database/             # 数据库连接
        └── supabase-client.ts
```

---

## 构建和测试命令

### 开发环境
```bash
# 安装依赖 (必须使用 pnpm)
pnpm install

# 启动开发服务器 (端口 5000)
pnpm dev

# 类型检查
pnpm ts-check
# 或
npx tsc --noEmit
```

### 生产环境
```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start
```

### 代码质量
```bash
# ESLint 检查
pnpm lint

# 类型检查
npx tsc --noEmit
```

---

## 代码风格指南

### 包管理器
- **必须使用 pnpm**，禁止使用 npm 或 yarn
- 项目配置了 `preinstall` 钩子强制检查

### 类型定义规范

1. **业务模型使用 `type` 而非 `interface`**
```typescript
// ✅ 推荐
type Student = {
  id: string;
  name: string;
};

// ❌ 避免
interface Student {
  id: string;
  name: string;
}
```

2. **数据库行类型与业务类型分离**
```typescript
// 数据库返回的行类型 (src/types/db-helpers.ts)
type StudentRow = {
  id: string;
  name: string;
  class_id: string;  // 下划线命名
  created_at: string;
};

// 业务类型 (src/types/student.ts)
type Student = {
  id: string;
  name: string;
  classId: string;   // 驼峰命名
  createdAt: string;
};
```

3. **禁止使用 `any` 类型**
```typescript
// ✅ 推荐
const data = response.json() as StudentData[];

// ❌ 避免
const data: any = response.json();
```

### 导入规范

1. **从具体模块导入（推荐）**
```typescript
// ✅ 推荐
import { studentService } from '@/services/student.service';
import type { Student } from '@/types/student';

// ⚠️ 仅在需要多个模块时使用桶文件
import { studentService, teacherService } from '@/services';
```

2. **导入顺序**
```typescript
// 1. React/Next.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. 第三方库
import { toast } from 'sonner';
import { z } from 'zod';

// 3. 项目内部模块
import { Button } from '@/components/ui/button';
import { studentService } from '@/services/student.service';
import type { Student } from '@/types/student';

// 4. 相对导入
import { LocalComponent } from './LocalComponent';
```

### API 响应格式

使用 `src/lib/api.ts` 提供的统一格式：

```typescript
import { success, error, ErrorCode } from '@/lib/api';

// 成功响应
return NextResponse.json(success(data, 'database'));

// 分页响应
return NextResponse.json(success(data, 'database', { page, pageSize, total }));

// 错误响应
return NextResponse.json(error('错误信息', ErrorCode.BAD_REQUEST), { status: 400 });
```

### Service 层规范

```typescript
// 继承 BaseService
export class StudentService extends BaseService {
  // 使用 ServiceResult 返回结果
  async getStudent(id: string): Promise<ServiceResult<Student>> {
    const student = await studentRepository.findById(id);
    if (!student) {
      return this.fail('学生不存在', 'NOT_FOUND');
    }
    return this.ok(student);
  }
}
```

### Repository 层规范

```typescript
// 继承 BaseRepository
export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students');  // 表名
  }

  // 扩展自定义方法
  async findByClassId(classId: string): Promise<Student[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('class_id', classId);
    
    if (error) {
      console.error('[StudentRepository] findByClassId error:', error.message);
      return [];
    }
    return (data || []) as Student[];
  }
}
```

---

## 核心业务模块

### 用户角色体系

| 角色 | 英文标识 | 说明 |
|------|---------|------|
| 校长 | principal | 学校最高管理者 |
| 书记 | secretary | 党务管理 |
| 教学副校长 | academic_vice_principal | 教学管理 |
| 德育副校长 | moral_vice_principal | 德育管理 |
| 总务副校长 | general_vice_principal | 总务管理 |
| 班主任 | head_teacher | 班级管理 |
| 科任教师 | subject_teacher | 学科教学 |
| 技能课教师 | skill_teacher | 技能课教学 |
| 家长 | parent | 家长门户 |

### 兼任职务

| 职务 | 英文标识 |
|------|---------|
| 教务主任 | academic_director |
| 德育主任 | moral_director |
| 总务主任 | general_director |
| 年段长 | grade_leader |
| 教研组长 | research_group_leader |

### 业务模块清单

1. **教务管理** (`/academic/*`)
   - 班级管理、学生管理、教师管理
   - 手工排课、全校课表
   - 考试管理、成绩录入
   - 教研活动、资源库

2. **德育管理** (`/moral/*`)
   - 德育活动、习惯养成
   - 荣誉管理、常规评比

3. **总务管理** (`/general/*`)
   - 资产管理、设备管理
   - 报修管理、采购管理
   - 财务管理、门禁管理

4. **教师工作台** (`/teacher/*`)
   - 消息通知、调课处理
   - 请假申请、工作量统计
   - **班级 SOP 智能台账** (`/teacher/class-sop`)

5. **家长门户** (`/parent/*`)
   - 子女信息、成绩查询
   - 习惯打卡、信息采集

---

## 班级 SOP 智能台账模块

### 模块概述

解决班主任工作核心痛点：
- **标准化缺失** → SOP模板库 → "怎么做有章可循"
- **留痕缺失** → 执行记录+证据附件 → "做了什么有据可查"
- **责任边界模糊** → 时间线+责任人+签字 → "谁来负责一目了然"

### 核心功能

1. **SOP 模板管理**
   - 创建/编辑/分享标准操作流程
   - 系统预置 6 大类 SOP 模板
   - 支持步骤分解、检查要点、证据要求

2. **执行记录管理**
   - 按步骤执行、留痕、签字确认
   - 支持图片、视频等多媒体证据
   - 自动生成时间线和责任链

3. **台账管理**
   - 自动从执行记录生成台账条目
   - 支持查询、统计、导出
   - 后续跟进提醒

### 文件结构

```
src/
├── types/class-sop.ts              # 类型定义
├── repositories/class-sop.repository.ts  # 数据访问层
├── services/class-sop.service.ts   # 业务逻辑层
├── hooks/useClassSOP.ts            # React Hooks
├── app/
│   ├── api/class-sop/              # API 路由
│   │   ├── templates/              # SOP 模板 API
│   │   ├── executions/             # 执行记录 API
│   │   ├── ledger/                 # 台账 API
│   │   └── statistics/             # 统计 API
│   └── teacher/class-sop/          # 前端页面
└── supabase/migrations/004_class_sop.sql  # 数据库迁移
```

### 数据库表

| 表名 | 说明 |
|------|------|
| `sop_templates` | SOP 模板表 |
| `sop_executions` | SOP 执行记录表 |
| `ledger_entries` | 台账条目表 |

### SOP 类别

| 类别 | 标识 | 说明 |
|------|------|------|
| 卫生检查 | hygiene | 班级卫生值日检查 |
| 安全排查 | safety | 班级安全隐患排查 |
| 矛盾处理 | conflict | 学生矛盾处理流程 |
| 家校沟通 | communication | 家校沟通记录 |
| 违纪处理 | discipline | 学生违纪处理 |
| 考勤管理 | attendance | 考勤管理 |
| 活动组织 | activity | 班级活动组织 |
| 应急处置 | emergency | 突发安全事件应急处置 |

### 使用示例

```typescript
// 获取 SOP 模板列表
const { templates } = useSOPTemplates({ category: 'hygiene' });

// 开始执行 SOP
const { startExecution } = useSOPExecutionActions();
await startExecution({
  templateId: 'template-uuid',
  classId: 'class-uuid',
  executorId: 'teacher-uuid',
  executorName: '张老师',
  className: '一年级1班',
});

// 更新步骤状态
await updateStep(executionId, stepOrder, 'complete', {
  content: '已完成',
  attachments: [{ type: 'photo', url: '...' }],
});

// 完成执行
await completeExecution(executionId, summary, signatures);
```

---

## 关键文件说明

### 认证相关
| 文件 | 说明 |
|------|------|
| `src/contexts/AuthContext.tsx` | 认证上下文，管理用户登录状态 |
| `src/lib/auth.ts` | 服务端认证中间件 |
| `src/lib/auth-client.ts` | 客户端认证工具 |
| `src/app/api/auth/login/route.ts` | 登录接口 |
| `src/app/api/auth/current/route.ts` | 获取当前用户接口 |

### 数据库连接
| 文件 | 说明 |
|------|------|
| `src/storage/database/supabase-client.ts` | Supabase 客户端，带缓存和重试 |

### DI 容器
| 文件 | 说明 |
|------|------|
| `src/lib/di/container.ts` | 依赖注入容器实现 |
| `src/lib/di/index.ts` | 导出容器和服务标识符 |

### 类型系统
| 文件 | 说明 |
|------|------|
| `src/types/db-helpers.ts` | 数据库行类型统一管理 |
| `src/types/index.ts` | 类型统一导出 |

---

## 常见问题与修复

### 1. 类型错误：属性不存在

**问题**：访问可能为 `undefined` 的属性时报错

```typescript
// ❌ 错误
adjust.grade  // Grade 可能为 undefined

// ✅ 修复
adjust.grade ?? 0
adjust.grade ? gradeNames[adjust.grade] : '未知年级'
```

### 2. 类型错误：联合类型赋值

**问题**：`string` 不能赋值给联合类型

```typescript
// ❌ 错误
const status: AdjustStatus = adjust.status;  // status 是 string

// ✅ 修复
const status: AdjustStatus | string = adjust.status;
// 或类型断言
const status = adjust.status as AdjustStatus;
```

### 3. API 返回类型不匹配

**问题**：API 返回下划线命名，业务代码使用驼峰命名

**解决方案**：在 API 层转换字段名

```typescript
// API Route 中转换
const formattedData = data.map(item => ({
  id: item.id,
  classId: item.class_id,      // 下划线 -> 驼峰
  studentName: item.student_name,
  createdAt: item.created_at,
}));
```

### 4. 循环依赖

**问题**：两个模块相互导入导致循环依赖

**解决方案**：使用 DI 容器解耦

```typescript
// ❌ 避免：直接导入
import { teacherService } from './teacher.service';

// ✅ 推荐：通过 DI 容器获取
const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
```

---

## 安全注意事项

1. **认证检查**：所有受保护的 API 路由必须使用 `protectedRoute` 包装
```typescript
export const GET = protectedRoute(async (request, { user }) => {
  // user 已通过认证
});
```

2. **权限验证**：在 Service 层验证用户权限
```typescript
if (!await this.checkPermission(userId, requiredRole)) {
  return this.fail('无权限', 'FORBIDDEN');
}
```

3. **HTML 安全**：用户输入的 HTML 必须消毒
```typescript
import DOMPurify from 'dompurify';
const safeHtml = DOMPurify.sanitize(userInput);
```

4. **敏感信息**：禁止在日志中输出密码、token 等敏感信息

---

## 性能优化建议

1. **分页查询**：大数据量使用分页，参考 `PAGINATION` 配置
2. **缓存策略**：Supabase 客户端已内置 5 分钟缓存
3. **虚拟滚动**：长列表使用 `VirtualTable` 组件
4. **懒加载**：使用 `React.lazy()` 和 `Suspense`

---

## 更新日志

- 2026-04-01: 修复数据展示相关问题
  - 修复学生列表 parents 字段未正确解析问题：在 `student.repository.ts` 中添加 parents 字段映射和类型转换
  - 修复班级管理家长信息未加载问题：确保 API 返回 parents 数组数据
  - **修复教师管理界面任教班级信息缺失问题**：
    - 根本原因：班级表 `head_teacher_id`/`sub_teacher_id` 使用旧格式（t008），与用户表 UUID 不匹配
    - 解决方案：更新班级表，将 `head_teacher_id` 和 `sub_teacher_id` 替换为用户表的真实 UUID（通过姓名匹配）
    - API 层改进：在 `teachers/route.ts` 中添加班级信息关联查询，返回 `isHeadTeacher`、`headTeacherClassId`、`headTeacherClassName`、`subTeacherClasses` 字段
    - classes API 改进：添加 `subjectTeachers` 字段返回
  - 关键修改文件：
    - `src/repositories/student.repository.ts` - findWithClass 方法添加 parents 字段
    - `src/app/api/teachers/route.ts` - 添加班级信息关联查询
    - `src/app/api/classes/route.ts` - 添加 subjectTeachers 字段返回
    - 数据库：更新 classes 表的 head_teacher_id 和 sub_teacher_id 为用户表真实 UUID
- 2026-03-31: 实现教研活动资源库与备课中心资源库双向联动
  - 新增 `/api/teaching-resources/copy-from-research` 接口，支持从教研活动复制资源到备课中心
  - 新增 `/api/teaching-resources/upload` 接口，支持上传教案、课件、视频等文件资源
  - 扩展 `ResourceCategory` 类型，新增 `lesson_plan`、`courseware`、`video` 分类
  - 扩展 `ResourceSourceType` 类型，支持 `upload`、`generated`、`research_import` 三种来源
  - 备课中心资源库页面新增上传功能，支持文件选择、分类设置、学科年级标注
  - 教研活动资源库页面新增"添加到备课中心"按钮，一键复制资源
- 2026-03-27: 完成 `any` 类型清理，类型检查通过
- 2026-03-27: 创建 AGENTS.md 项目规范文件
