# 前端数据操作功能指南

## 概述

本文档说明如何在前端页面中使用数据操作功能，包括：
- 单条数据的创建、编辑、删除
- 批量选择、批量删除、批量更新

## 核心组件

### 1. Hooks

#### `useCrudOperations<T>` - 单条数据CRUD

```typescript
import { useCrudOperations } from '@/hooks/useCrudOperations';

const {
  data,           // 数据列表
  selected,       // 当前选中的数据（用于编辑）
  loading,        // 加载状态
  error,          // 错误信息
  fetchData,      // 获取数据
  create,         // 创建
  update,         // 更新
  remove,         // 删除
  select,         // 选择数据
} = useCrudOperations({
  endpoint: '/api/teachers',
  onCreate: (data) => console.log('创建成功', data),
  onUpdate: (data) => console.log('更新成功', data),
  onDelete: (id) => console.log('删除成功', id),
  onError: (error) => console.error('操作失败', error),
});
```

#### `useBatchOperations<T>` - 批量操作

```typescript
import { useBatchOperations } from '@/hooks/useBatchOperations';

const {
  selectedCount,    // 选中数量
  hasSelection,     // 是否有选中
  processing,       // 处理中状态
  toggleSelect,     // 切换选中
  selectAll,        // 全选
  deselectAll,      // 取消全选
  isSelected,       // 检查是否选中
  batchDelete,      // 批量删除
  batchUpdate,      // 批量更新
} = useBatchOperations({
  endpoint: '/api/teachers',
  onSuccess: (action, count) => console.log(`${action}成功，影响${count}条`),
  onError: (error) => console.error('操作失败', error),
});
```

### 2. UI组件

#### `DeleteConfirmDialog` - 删除确认对话框

```tsx
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

<DeleteConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={handleDelete}
  title="确认删除"
  description="此操作不可撤销"
  loading={loading}
/>
```

#### `BatchToolbar` - 批量操作工具栏

```tsx
import { BatchToolbar, BatchAction } from '@/components/common/BatchToolbar';

const batchActions: BatchAction[] = [
  {
    key: 'delete',
    label: '批量删除',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: () => setBatchDeleteDialogOpen(true),
    destructive: true,
  },
  {
    key: 'update-status',
    label: '更新状态',
    icon: <Edit className="h-4 w-4" />,
    onClick: () => handleBatchUpdate(),
  },
];

<BatchToolbar
  selectedCount={selectedIds.size}
  totalCount={filteredData.length}
  isAllSelected={selectedIds.size === filteredData.length}
  onToggleSelectAll={toggleSelectAll}
  onClearSelection={clearSelection}
  actions={batchActions}
  processing={loading}
/>
```

#### `SelectColumn` - 表格选择列

```tsx
import { SelectColumn } from '@/components/common/BatchToolbar';

<TableCell onClick={(e) => e.stopPropagation()}>
  <SelectColumn
    selected={selectedIds.has(item.id)}
    onToggle={() => toggleSelect(item.id)}
  />
</TableCell>
```

## API接口规范

### 批量删除接口

```
POST /api/{resource}/batch-delete
Request: { ids: string[] }
Response: { success: boolean, data: { count: number }, error?: string }
```

### 批量更新接口

```
POST /api/{resource}/batch-update
Request: { ids: string[], updates: Partial<T> }
Response: { success: boolean, data: { count: number }, error?: string }
```

## 完整示例

### 教师管理页面

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useCrudOperations } from '@/hooks/useCrudOperations';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { BatchToolbar, SelectColumn, BatchAction } from '@/components/common/BatchToolbar';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  status: string;
}

export default function TeachersPage() {
  // 使用CRUD Hook
  const {
    data: teachers,
    loading,
    fetchData,
    create,
    update,
    remove,
  } = useCrudOperations<Teacher>({
    endpoint: '/api/teachers',
  });

  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  // 选择操作
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    // 调用批量删除API
    const response = await fetch('/api/teachers/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    
    if (response.ok) {
      fetchData(); // 刷新数据
      setSelectedIds(new Set());
    }
  }, [selectedIds, fetchData]);

  // 批量操作按钮
  const batchActions: BatchAction[] = [
    {
      key: 'delete',
      label: '批量删除',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleBatchDelete,
      destructive: true,
    },
  ];

  return (
    <div>
      {/* 批量操作工具栏 */}
      <BatchToolbar
        selectedCount={selectedIds.size}
        totalCount={teachers.length}
        onToggleSelectAll={() => {/* 全选逻辑 */}}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={batchActions}
      />

      {/* 数据表格 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox onCheckedChange={/* 全选 */} />
            </TableHead>
            <TableHead>姓名</TableHead>
            <TableHead>学科</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map(teacher => (
            <TableRow key={teacher.id}>
              <TableCell>
                <SelectColumn
                  selected={selectedIds.has(teacher.id)}
                  onToggle={() => toggleSelect(teacher.id)}
                />
              </TableCell>
              <TableCell>{teacher.name}</TableCell>
              <TableCell>{teacher.subject}</TableCell>
              <TableCell>
                <Button onClick={() => {
                  setCurrentTeacher(teacher);
                  setEditDialogOpen(true);
                }}>编辑</Button>
                <Button onClick={() => {
                  setCurrentTeacher(teacher);
                  setDeleteDialogOpen(true);
                }}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => currentTeacher && remove(currentTeacher.id)}
        title="确认删除"
        description={`确定删除教师"${currentTeacher?.name}"吗？`}
      />
    </div>
  );
}
```

## 文件结构

```
src/
├── hooks/
│   ├── useCrudOperations.ts     # CRUD操作Hook
│   └── useBatchOperations.ts    # 批量操作Hook
├── components/
│   └── common/
│       ├── DeleteConfirmDialog.tsx  # 删除确认对话框
│       └── BatchToolbar.tsx         # 批量操作工具栏
├── app/
│   └── api/
│       ├── teachers/
│       │   ├── route.ts             # 教师CRUD
│       │   ├── batch-delete/route.ts # 批量删除
│       │   └── batch-update/route.ts # 批量更新
│       └── students/
│           ├── batch-delete/route.ts
│           └── batch-update/route.ts
```

## 已实现的页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 教师管理 | `/academic/teachers` | 新增、编辑、删除、批量删除、批量更新状态 |
| 德育活动 | `/moral/activities` | 新增、编辑、删除、批量删除、批量更新状态 |

## 扩展指南

### 为新页面添加CRUD功能

1. **创建批量操作API**
```typescript
// src/app/api/{resource}/batch-delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  const { ids } = await request.json();
  
  const { error } = await client
    .from('{table}')
    .delete()
    .in('id', ids);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, data: { count: ids.length } });
}
```

2. **在页面中引入组件**
```typescript
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { BatchToolbar, SelectColumn } from '@/components/common/BatchToolbar';
```

3. **添加状态管理**
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
```

4. **实现操作函数**
```typescript
const handleDelete = async () => { /* 删除逻辑 */ };
const handleBatchDelete = async () => { /* 批量删除逻辑 */ };
```
