"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "./table"
import { VirtualTable } from "./virtual-table"
import { SkeletonTable } from "./lazy"
import { Button } from "./button"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

// ============================================
// 数据表格列定义
// ============================================

export interface DataTableColumn<T> {
  /** 列标识 */
  key: keyof T | string
  /** 列标题 */
  header: React.ReactNode
  /** 列宽度 */
  width?: number | string
  /** 是否固定列 */
  fixed?: 'left' | 'right'
  /** 自定义渲染 */
  render?: (value: unknown, item: T, index: number) => React.ReactNode
  /** 是否可排序 */
  sortable?: boolean
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否隐藏 */
  hidden?: boolean
}

// ============================================
// 数据表格 Props
// ============================================

export interface DataTableProps<T> {
  /** 数据源 */
  data: T[]
  /** 列定义 */
  columns: DataTableColumn<T>[]
  /** 行唯一标识字段 */
  rowKey: keyof T | ((item: T, index: number) => string)
  
  /** 分页配置 */
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    pageSizeOptions?: number[]
  }
  
  /** 是否启用虚拟滚动（大数据量时自动启用） */
  virtual?: boolean | 'auto'
  /** 虚拟滚动阈值（超过此数量自动启用虚拟滚动，默认100） */
  virtualThreshold?: number
  /** 虚拟滚动行高 */
  rowHeight?: number
  /** 表格高度 */
  height?: number | string
  
  /** 加载状态 */
  loading?: boolean
  /** 空状态 */
  emptyText?: string
  /** 空状态渲染 */
  renderEmpty?: () => React.ReactNode
  
  /** 行点击事件 */
  onRowClick?: (item: T, index: number) => void
  /** 行样式 */
  rowClassName?: string | ((item: T, index: number) => string)
  /** 行选中状态 */
  rowSelection?: {
    selectedKeys: Set<string>
    onChange: (keys: Set<string>) => void
    multiple?: boolean
  }
  
  /** 表头固定 */
  stickyHeader?: boolean
  /** 底部固定内容 */
  footer?: React.ReactNode
  /** 类名 */
  className?: string
  /** 表格包装器类名 */
  wrapperClassName?: string
}

// ============================================
// 分页组件
// ============================================

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}

function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          显示 {start}-{end} 条，共 {total} 条
        </span>
        {onPageSizeChange && (
          <>
            <span className="mx-2">|</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm">
          {page} / {totalPages || 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ============================================
// 数据表格组件
// ============================================

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  pagination,
  virtual = 'auto',
  virtualThreshold = 100,
  rowHeight = 48,
  height = 600,
  loading = false,
  emptyText = "暂无数据",
  renderEmpty,
  onRowClick,
  rowClassName,
  rowSelection,
  stickyHeader = true,
  footer,
  className,
  wrapperClassName,
}: DataTableProps<T>) {
  // 判断是否启用虚拟滚动
  const shouldUseVirtual = React.useMemo(() => {
    if (virtual === true) return true
    if (virtual === 'auto') return data.length > virtualThreshold
    return false
  }, [virtual, virtualThreshold, data.length])

  // 获取行唯一标识
  const getRowKey = React.useCallback(
    (item: T, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(item, index)
      }
      return String(item[rowKey] ?? index)
    },
    [rowKey]
  )

  // 渲染表头
  const renderHeader = React.useMemo(() => {
    return (
      <TableRow>
        {rowSelection && (
          <TableHead className="w-10 sticky left-0 bg-background z-20">
            {rowSelection.multiple && (
              <input
                type="checkbox"
                checked={data.length > 0 && data.every((_, i) => 
                  rowSelection.selectedKeys.has(getRowKey(_, i))
                )}
                onChange={(e) => {
                  if (e.target.checked) {
                    const newKeys = new Set(rowSelection.selectedKeys)
                    data.forEach((item, i) => newKeys.add(getRowKey(item, i)))
                    rowSelection.onChange(newKeys)
                  } else {
                    rowSelection.onChange(new Set())
                  }
                }}
              />
            )}
          </TableHead>
        )}
        {columns
          .filter((col) => !col.hidden)
          .map((col) => (
            <TableHead
              key={String(col.key)}
              style={{ width: col.width }}
              className={cn(
                col.fixed === 'left' && 'sticky left-0 bg-background z-10',
                col.fixed === 'right' && 'sticky right-0 bg-background z-10',
                col.align === 'center' && 'text-center',
                col.align === 'right' && 'text-right'
              )}
            >
              {col.header}
            </TableHead>
          ))}
      </TableRow>
    )
  }, [columns, rowSelection, data, getRowKey])

  // 渲染行
  const renderRow = React.useCallback(
    (item: T, index: number) => {
      const key = getRowKey(item, index)
      const isSelected = rowSelection?.selectedKeys.has(key)
      const rowCls =
        typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName

      return (
        <TableRow
          key={key}
          className={cn(
            onRowClick && 'cursor-pointer',
            isSelected && 'bg-primary/5',
            rowCls
          )}
          onClick={() => onRowClick?.(item, index)}
        >
          {rowSelection && (
            <TableCell className="w-10 sticky left-0 bg-background z-10">
              <input
                type={rowSelection.multiple ? 'checkbox' : 'radio'}
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  const newKeys = new Set(rowSelection.selectedKeys)
                  if (e.target.checked) {
                    if (!rowSelection.multiple) {
                      newKeys.clear()
                    }
                    newKeys.add(key)
                  } else {
                    newKeys.delete(key)
                  }
                  rowSelection.onChange(newKeys)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </TableCell>
          )}
          {columns
            .filter((col) => !col.hidden)
            .map((col) => {
              const value = col.key in item ? item[col.key] : undefined
              return (
                <TableCell
                  key={String(col.key)}
                  className={cn(
                    col.fixed === 'left' && 'sticky left-0 bg-background z-10',
                    col.fixed === 'right' && 'sticky right-0 bg-background z-10',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render ? col.render(value, item, index) : String(value ?? '-')}
                </TableCell>
              )
            })}
        </TableRow>
      )
    },
    [columns, getRowKey, onRowClick, rowClassName, rowSelection]
  )

  // 虚拟滚动模式
  if (shouldUseVirtual && !loading) {
    return (
      <div className={cn("border rounded-lg overflow-hidden", wrapperClassName)}>
        <VirtualTable
          data={data}
          rowHeight={rowHeight}
          height={height}
          headerRow={renderHeader}
          renderRow={renderRow}
          rowKey={getRowKey}
          emptyText={emptyText}
          className={className}
          footer={footer}
        />
      </div>
    )
  }

  // 普通表格模式
  return (
    <div className={cn("border rounded-lg overflow-hidden", wrapperClassName)}>
      <div className={cn("overflow-auto", className)} style={{ maxHeight: height }}>
        <Table>
          <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-background')}>
            {renderHeader}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter((c) => !c.hidden).length + (rowSelection ? 1 : 0)}
                  className="p-0"
                >
                  <SkeletonTable rows={10} columns={columns.filter((c) => !c.hidden).length} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter((c) => !c.hidden).length + (rowSelection ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {renderEmpty ? renderEmpty() : emptyText}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pagination && !loading && data.length > 0 && (
        <DataTablePagination {...pagination} />
      )}

      {/* 底部固定 */}
      {footer && <div className="border-t">{footer}</div>}
    </div>
  )
}

// ============================================
// 导出
// ============================================

export default DataTable
