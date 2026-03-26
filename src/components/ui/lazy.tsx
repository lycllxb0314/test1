"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

/**
 * 懒加载组件
 * 
 * 用于延迟加载重型组件，减少初始包大小
 * 
 * @example
 * ```tsx
 * // 懒加载对话框
 * const LazyEditDialog = createLazyDialog(() => import('./EditDialog'))
 * 
 * // 使用
 * <LazyEditDialog open={open} onOpenChange={setOpen} data={item} />
 * ```
 */

// ============================================
// 懒加载基础组件
// ============================================

export interface LazyProps {
  /** 加载中占位 */
  fallback?: React.ReactNode
  /** 子组件 */
  children: React.ReactNode
  /** 是否立即加载（默认false） */
  immediate?: boolean
  /** 根元素margin，用于IntersectionObserver */
  rootMargin?: string
  /** 阈值 */
  threshold?: number | number[]
  /** 类名 */
  className?: string
}

/**
 * 懒加载容器组件
 * 当元素进入视口时才渲染内容
 */
export function Lazy({
  fallback = null,
  children,
  immediate = false,
  rootMargin = "200px",
  threshold = 0.1,
  className,
}: LazyProps) {
  const [isVisible, setIsVisible] = React.useState(immediate)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (immediate) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [immediate, rootMargin, threshold])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  )
}

// ============================================
// 懒加载对话框
// ============================================

export interface LazyDialogProps {
  /** 是否打开 */
  open: boolean
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void
  /** 其他props */
  [key: string]: unknown
}

/**
 * 创建懒加载对话框
 * 
 * @example
 * ```tsx
 * const LazyEditDialog = createLazyDialog(
 *   () => import('./EditDialog').then(mod => ({ default: mod.EditDialog }))
 * )
 * ```
 */
export function createLazyDialog<T extends LazyDialogProps>(
  loader: () => Promise<{ default: React.ComponentType<T> }>
) {
  const LazyComponent = React.lazy(loader)

  return function LazyDialog(props: T) {
    const { open, onOpenChange } = props
    
    // 只有在打开时才加载组件
    const [shouldLoad, setShouldLoad] = React.useState(false)
    
    React.useEffect(() => {
      if (open && !shouldLoad) {
        setShouldLoad(true)
      }
    }, [open, shouldLoad])

    // 关闭后不卸载组件，保持状态（可选：可以添加延迟卸载）
    const [showContent, setShowContent] = React.useState(false)
    
    React.useEffect(() => {
      if (open) {
        setShowContent(true)
      }
    }, [open])

    if (!showContent || !shouldLoad) {
      return null
    }

    return (
      <React.Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Spinner size="lg" />
          </div>
        }
      >
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }
}

// ============================================
// 懒加载模态框（带预加载）
// ============================================

/**
 * 创建带预加载功能的懒加载模态框
 * 
 * @example
 * ```tsx
 * const LazyFormModal = createPreloadModal(
 *   () => import('./FormModal').then(mod => ({ default: mod.FormModal }))
 * )
 * 
 * // 鼠标悬停时预加载
 * <button onMouseEnter={LazyFormModal.preload}>打开表单</button>
 * <LazyFormModal open={open} onOpenChange={setOpen} />
 * ```
 */
export function createPreloadModal<T extends LazyDialogProps>(
  loader: () => Promise<{ default: React.ComponentType<T> }>
) {
  let cachedComponent: React.ComponentType<T> | null = null
  let loadingPromise: Promise<void> | null = null

  const loadComponent = async () => {
    if (cachedComponent) return
    if (loadingPromise) return loadingPromise

    loadingPromise = loader().then((mod) => {
      cachedComponent = mod.default
      loadingPromise = null
    })
    return loadingPromise
  }

  const LazyModal = function LazyPreloadModal(props: T) {
    const { open } = props
    const [Component, setComponent] = React.useState<React.ComponentType<T> | null>(
      cachedComponent
    )

    React.useEffect(() => {
      if (open && !Component) {
        loadComponent().then(() => {
          if (cachedComponent) {
            setComponent(cachedComponent)
          }
        })
      }
    }, [open, Component])

    if (!open || !Component) {
      return null
    }

    return <Component {...props} />
  }

  // 添加预加载方法
  LazyModal.preload = loadComponent

  return LazyModal
}

// ============================================
// 懒加载组件工厂
// ============================================

export interface LazyComponentProps {
  /** 加载中占位 */
  fallback?: React.ReactNode
  /** 其他props */
  [key: string]: unknown
}

/**
 * 创建懒加载组件
 * 
 * @example
 * ```tsx
 * const LazyChart = createLazyComponent(
 *   () => import('./Chart').then(mod => ({ default: mod.Chart }))
 * )
 * 
 * <LazyChart fallback={<Skeleton className="h-64" />} data={chartData} />
 * ```
 */
export function createLazyComponent<T extends LazyComponentProps>(
  loader: () => Promise<{ default: React.ComponentType<T> }>
) {
  const LazyComponent = React.lazy(loader)

  return function LazyWrapper({
    fallback = (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    ),
    ...props
  }: T) {
    return (
      <React.Suspense fallback={fallback}>
        <LazyComponent {...(props as T)} />
      </React.Suspense>
    )
  }
}

// ============================================
// 条件渲染优化
// ============================================

export interface ConditionalRenderProps {
  /** 条件 */
  when: boolean
  /** 子组件 */
  children: React.ReactNode
  /** 条件为false时的占位 */
  fallback?: React.ReactNode
  /** 延迟渲染时间（毫秒） */
  delay?: number
}

/**
 * 条件渲染优化组件
 * 支持延迟渲染，避免闪烁
 */
export function ConditionalRender({
  when,
  children,
  fallback = null,
  delay = 0,
}: ConditionalRenderProps) {
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => {
    if (when) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay)
        return () => clearTimeout(timer)
      } else {
        setShouldRender(true)
      }
    } else {
      setShouldRender(false)
    }
  }, [when, delay])

  if (!shouldRender) {
    return fallback
  }

  return <>{children}</>
}

// ============================================
// 延迟渲染 Hook
// ============================================

/**
 * 延迟渲染 Hook
 * 延迟渲染组件，减少初始渲染压力
 */
export function useDeferredRender(
  shouldRender: boolean,
  delay: number = 100
): boolean {
  const [deferredRender, setDeferredRender] = React.useState(false)

  React.useEffect(() => {
    if (shouldRender) {
      const timer = setTimeout(() => setDeferredRender(true), delay)
      return () => clearTimeout(timer)
    } else {
      setDeferredRender(false)
    }
  }, [shouldRender, delay])

  return deferredRender
}

// ============================================
// 骨架屏组件
// ============================================

export interface SkeletonTableProps {
  /** 行数 */
  rows?: number
  /** 列数 */
  columns?: number
  /** 行高 */
  rowHeight?: number
  /** 类名 */
  className?: string
}

/**
 * 表格骨架屏
 */
export function SkeletonTable({
  rows = 10,
  columns = 5,
  rowHeight = 48,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* 表头骨架 */}
      <div className="flex border-b bg-muted/30 p-2">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-6 flex-1 bg-muted animate-pulse rounded mx-1"
          />
        ))}
      </div>
      {/* 表体骨架 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex border-b p-2"
          style={{ height: rowHeight }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-5 flex-1 bg-muted animate-pulse rounded mx-1"
              style={{
                animationDelay: `${rowIndex * 50 + colIndex * 20}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================
// 预加载 Hook
// ============================================

/**
 * 预加载资源 Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { preload, isPreloaded } = usePreload(() => import('./HeavyComponent'))
 *   
 *   return (
 *     <button 
 *       onMouseEnter={preload}
 *       disabled={!isPreloaded}
 *     >
 *       加载重型组件
 *     </button>
 *   )
 * }
 * ```
 */
export function usePreload(loader: () => Promise<unknown>) {
  const [isPreloaded, setIsPreloaded] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const preload = React.useCallback(async () => {
    if (isPreloaded || isLoading) return
    
    setIsLoading(true)
    try {
      await loader()
      setIsPreloaded(true)
    } catch (error) {
      console.error('Preload failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loader, isPreloaded, isLoading])

  return { preload, isPreloaded, isLoading }
}

// ============================================
// 导出
// ============================================

export { Spinner }
