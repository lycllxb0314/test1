"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Table, TableHeader, TableHead, TableRow, TableCell } from "./table"

/**
 * 虚拟滚动表格组件
 * 
 * 用于渲染大数据量列表，只渲染可视区域内的行
 * 支持10000+行数据的流畅滚动
 * 
 * @example
 * ```tsx
 * <VirtualTable
 *   data={teachers}
 *   rowHeight={48}
 *   columns={[
 *     { key: 'name', header: '姓名', width: 120 },
 *     { key: 'department', header: '部门', width: 150 },
 *   ]}
 *   renderRow={(teacher, index) => (
 *     <TableRow key={teacher.id}>
 *       <TableCell>{teacher.name}</TableCell>
 *       <TableCell>{teacher.department}</TableCell>
 *     </TableRow>
 *   )}
 * />
 * ```
 */

export interface VirtualTableColumn<T> {
  /** 列标识 */
  key: string
  /** 列标题 */
  header: React.ReactNode
  /** 列宽度 */
  width?: number | string
  /** 是否固定列 */
  fixed?: 'left' | 'right'
  /** 自定义渲染 */
  render?: (item: T, index: number) => React.ReactNode
}

export interface VirtualTableProps<T> {
  /** 数据源 */
  data: T[]
  /** 行高度（默认48） */
  rowHeight?: number
  /** 表格高度（默认600） */
  height?: number | string
  /** 列定义 */
  columns?: VirtualTableColumn<T>
  /** 自定义行渲染（优先级高于columns） */
  renderRow?: (item: T, index: number, startIndex: number) => React.ReactNode
  /** 表头行 */
  headerRow?: React.ReactNode
  /** 空状态 */
  emptyText?: string
  /** 加载中 */
  loading?: boolean
  /** 预渲染行数（上下各预渲染的行数，默认5） */
  overscan?: number
  /** 类名 */
  className?: string
  /** 行类名 */
  rowClassName?: string | ((item: T, index: number) => string)
  /** 行点击事件 */
  onRowClick?: (item: T, index: number) => void
  /** 获取行唯一标识 */
  rowKey?: (item: T, index: number) => string
  /** 底部固定内容 */
  footer?: React.ReactNode
}

/**
 * 虚拟滚动表格
 */
export function VirtualTable<T>({
  data,
  rowHeight = 48,
  height = 600,
  columns,
  renderRow,
  headerRow,
  emptyText = "暂无数据",
  loading = false,
  overscan = 5,
  className,
  rowClassName,
  onRowClick,
  rowKey,
  footer,
}: VirtualTableProps<T>) {
  // 滚动位置
  const [scrollTop, setScrollTop] = React.useState(0)
  // 容器引用
  const containerRef = React.useRef<HTMLDivElement>(null)
  // 容器高度
  const [containerHeight, setContainerHeight] = React.useState(
    typeof height === 'number' ? height : 600
  )

  // 计算可视区域
  const totalHeight = data.length * rowHeight
  const visibleCount = Math.ceil(containerHeight / rowHeight)
  
  // 计算起始索引
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(
    data.length - 1,
    Math.floor(scrollTop / rowHeight) + visibleCount + overscan
  )

  // 获取当前可见的数据
  const visibleData = React.useMemo(() => {
    return data.slice(startIndex, endIndex + 1)
  }, [data, startIndex, endIndex])

  // 滚动事件处理
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 监听容器高度变化
  React.useEffect(() => {
    if (typeof height === 'string' && containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
        }
      })
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
  }, [height])

  // 生成默认表头
  const defaultHeaderRow = React.useMemo(() => {
    if (!columns || headerRow) return null
    
    const cols = Array.isArray(columns) ? columns : []
    return (
      <TableRow>
        {cols.map((col) => (
          <TableHead
            key={col.key}
            style={{ width: col.width }}
            className={cn(
              col.fixed === 'left' && 'sticky left-0 bg-background z-10',
              col.fixed === 'right' && 'sticky right-0 bg-background z-10'
            )}
          >
            {col.header}
          </TableHead>
        ))}
      </TableRow>
    )
  }, [columns, headerRow])

  // 渲染行
  const renderRows = React.useMemo(() => {
    if (!renderRow && !columns) return null
    
    if (renderRow) {
      return visibleData.map((item, i) => {
        const actualIndex = startIndex + i
        const key = rowKey ? rowKey(item, actualIndex) : `row-${actualIndex}`
        const rowCls = typeof rowClassName === 'function' 
          ? rowClassName(item, actualIndex) 
          : rowClassName
        
        return (
          <React.Fragment key={key}>
            {renderRow(item, actualIndex, startIndex)}
          </React.Fragment>
        )
      })
    }
    
    return null
  }, [visibleData, startIndex, renderRow, columns, rowKey, rowClassName])

  // 计算偏移量
  const offsetY = startIndex * rowHeight

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* 表头 - 固定 */}
      <div className="sticky top-0 z-20 bg-background">
        <Table>
          <TableHeader>
            {headerRow || defaultHeaderRow}
          </TableHeader>
        </Table>
      </div>
      
      {/* 表体 - 虚拟滚动 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">{emptyText}</div>
          </div>
        ) : (
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <Table>
              <tbody>
                {renderRows}
              </tbody>
            </Table>
          </div>
        )}
      </div>
      
      {/* 底部固定 */}
      {footer && (
        <div className="sticky bottom-0 z-20 bg-background border-t">
          {footer}
        </div>
      )}
    </div>
  )
}

/**
 * 虚拟滚动列表组件
 * 更轻量级，适用于简单列表场景
 */
export interface VirtualListProps<T> {
  /** 数据源 */
  data: T[]
  /** 行高度 */
  itemHeight: number
  /** 列表高度 */
  height: number | string
  /** 渲染项 */
  renderItem: (item: T, index: number) => React.ReactNode
  /** 预渲染数量 */
  overscan?: number
  /** 类名 */
  className?: string
  /** 空状态 */
  emptyText?: string
  /** 加载中 */
  loading?: boolean
  /** 获取唯一标识 */
  itemKey?: (item: T, index: number) => string
}

export function VirtualList<T>({
  data,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  className,
  emptyText = "暂无数据",
  loading = false,
  itemKey,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = React.useState(
    typeof height === 'number' ? height : 400
  )

  const totalHeight = data.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    data.length - 1,
    startIndex + visibleCount + overscan * 2
  )

  const visibleData = data.slice(startIndex, endIndex + 1)
  const offsetY = startIndex * itemHeight

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  React.useEffect(() => {
    if (typeof height === 'string' && containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
        }
      })
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }
  }, [height])

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleData.map((item, i) => {
              const actualIndex = startIndex + i
              const key = itemKey ? itemKey(item, actualIndex) : `item-${actualIndex}`
              return (
                <div key={key} style={{ height: itemHeight }}>
                  {renderItem(item, actualIndex)}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 使用虚拟滚动的 Hook
 * 返回计算后的可视数据范围
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const totalHeight = itemCount * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  
  const startIndex = React.useMemo(
    () => Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    [scrollTop, itemHeight, overscan]
  )
  
  const endIndex = React.useMemo(
    () => Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2),
    [itemCount, startIndex, visibleCount, overscan]
  )

  const offsetY = startIndex * itemHeight

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    scrollTop,
    setScrollTop,
    handleScroll,
    totalHeight,
    startIndex,
    endIndex,
    offsetY,
    visibleCount,
  }
}
