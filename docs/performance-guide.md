/**
 * 性能优化指南
 * 
 * 本文档介绍如何在项目中使用性能优化工具
 */

# 性能优化指南

## 概述

本项目提供了多种性能优化工具，包括：
- **虚拟滚动**：大数据量列表渲染优化
- **懒加载**：组件延迟加载
- **数据缓存**：减少重复请求
- **防抖节流**：减少函数执行频率

## 1. 虚拟滚动

适用于大数据量列表（100+行），只渲染可视区域内的元素。

### 使用 DataTable 组件（推荐）

```tsx
import { DataTable, DataTableColumn } from '@/components/ui/data-table'

interface Student {
  id: string
  name: string
  grade: number
  class: string
}

const columns: DataTableColumn<Student>[] = [
  { key: 'name', header: '姓名', width: 120 },
  { key: 'grade', header: '年级', width: 80 },
  { key: 'class', header: '班级', width: 100 },
]

function StudentList({ students }) {
  return (
    <DataTable
      data={students}
      columns={columns}
      rowKey="id"
      // 自动启用虚拟滚动（数据超过100条时）
      virtual="auto"
      // 虚拟滚动阈值
      virtualThreshold={100}
      // 表格高度
      height={500}
      // 分页配置
      pagination={{
        page: 1,
        pageSize: 20,
        total: 500,
        onPageChange: (page) => console.log(page),
      }}
    />
  )
}
```

### 使用 VirtualTable 组件

```tsx
import { VirtualTable } from '@/components/ui/virtual-table'

function TeacherList({ teachers }) {
  return (
    <VirtualTable
      data={teachers}
      rowHeight={48}
      height={600}
      renderRow={(teacher, index) => (
        <TableRow key={teacher.id}>
          <TableCell>{teacher.name}</TableCell>
          <TableCell>{teacher.department}</TableCell>
        </TableRow>
      )}
      headerRow={
        <TableRow>
          <TableHead>姓名</TableHead>
          <TableHead>部门</TableHead>
        </TableRow>
      }
    />
  )
}
```

## 2. 懒加载

### 对话框懒加载

```tsx
import { createLazyDialog, createPreloadModal } from '@/components/ui/lazy'

// 创建懒加载对话框
const LazyEditDialog = createLazyDialog(
  () => import('./EditDialog').then(mod => ({ default: mod.EditDialog }))
)

// 创建带预加载功能的对话框
const LazyFormModal = createPreloadModal(
  () => import('./FormModal').then(mod => ({ default: mod.FormModal }))
)

function MyComponent() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      {/* 鼠标悬停时预加载 */}
      <button 
        onClick={() => setOpen(true)}
        onMouseEnter={LazyFormModal.preload}
      >
        打开表单
      </button>
      
      <LazyEditDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
```

### 组件懒加载

```tsx
import { Lazy, createLazyComponent } from '@/components/ui/lazy'

// 使用 Lazy 容器
function MyPage() {
  return (
    <div>
      {/* 进入视口时才加载 */}
      <Lazy rootMargin="200px" fallback={<Skeleton className="h-64" />}>
        <HeavyChart />
      </Lazy>
    </div>
  )
}

// 创建懒加载组件
const LazyChart = createLazyComponent(
  () => import('./Chart').then(mod => ({ default: mod.Chart }))
)
```

### 骨架屏

```tsx
import { SkeletonTable } from '@/components/ui/lazy'

function LoadingState() {
  return <SkeletonTable rows={10} columns={5} rowHeight={48} />
}
```

## 3. 数据缓存

### 静态数据缓存

```tsx
import { useStaticCache } from '@/hooks/useCache'

function GradeSelector() {
  // 年级列表变化很少，缓存30分钟
  const { data: grades } = useStaticCache(
    'grades',
    () => fetch('/api/grades').then(r => r.json()),
    30 * 60 * 1000
  )
  
  return (
    <select>
      {grades?.map(g => <option key={g.id}>{g.name}</option>)}
    </select>
  )
}
```

### 通用缓存

```tsx
import { useCache, CacheManager } from '@/hooks/useCache'

function TeacherList() {
  const { data, loading, refetch, isFromCache } = useCache({
    key: 'teachers',
    params: { department: '语文组' },
    fetcher: () => api.teacher.list({ department: '语文组' }),
    ttl: 5 * 60 * 1000, // 5分钟缓存
    refetchOnWindowFocus: false,
  })
  
  // 手动清除缓存
  const handleClearCache = () => {
    CacheManager.clear('teachers')
  }
  
  return (
    <div>
      {isFromCache && <span className="text-xs text-muted">来自缓存</span>}
      {/* ... */}
    </div>
  )
}
```

## 4. 防抖节流

### 搜索输入防抖

```tsx
import { useDebouncedValue } from '@/hooks/usePerformance'

function SearchInput() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  
  useEffect(() => {
    if (debouncedSearch) {
      fetchResults(debouncedSearch)
    }
  }, [debouncedSearch])
  
  return <input value={search} onChange={e => setSearch(e.target.value)} />
}
```

### 滚动事件节流

```tsx
import { useThrottledCallback } from '@/hooks/usePerformance'

function ScrollSpy() {
  const handleScroll = useThrottledCallback(() => {
    console.log('滚动位置:', window.scrollY)
  }, 100)
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
}
```

## 5. 请求取消

```tsx
import { useAbortController, useCancellable } from '@/hooks/usePerformance'

function DataFetcher() {
  const { signal, abort } = useAbortController()
  
  useEffect(() => {
    fetch('/api/data', { signal })
      .then(r => r.json())
      .then(setData)
      .catch(err => {
        if (err.name === 'AbortError') return
        console.error(err)
      })
    
    return () => abort()
  }, [])
}

// 或者使用更高级的封装
function SmartFetcher() {
  const { execute, loading, cancel, data } = useCancellable(
    async (url, signal) => {
      const res = await fetch(url, { signal })
      return res.json()
    }
  )
  
  const handleClick = () => {
    execute('/api/data')
  }
  
  // 取消请求
  const handleCancel = () => cancel()
}
```

## 6. 最佳实践

### 何时使用虚拟滚动

| 数据量 | 建议 |
|--------|------|
| < 50条 | 普通表格 |
| 50-100条 | 可选虚拟滚动 |
| > 100条 | 必须虚拟滚动 |

### 何时使用缓存

| 数据类型 | 缓存时间 |
|----------|----------|
| 年级/班级列表 | 30分钟 |
| 用户信息 | 10分钟 |
| 列表数据 | 5分钟 |
| 实时数据 | 不缓存 |

### 何时使用懒加载

- **对话框**：总是使用懒加载
- **复杂组件**：非首屏时懒加载
- **图表**：进入视口时加载

## 7. 性能检查清单

- [ ] 列表超过100条使用虚拟滚动
- [ ] 对话框使用懒加载
- [ ] 搜索输入使用防抖
- [ ] 滚动事件使用节流
- [ ] 静态数据使用缓存
- [ ] 组件卸载时取消请求
- [ ] 使用骨架屏代替加载中文字
