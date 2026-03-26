/**
 * 性能优化 Hooks
 * 
 * 提供防抖、节流、请求取消等性能优化能力
 * 
 * @module hooks/usePerformance
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ============================================
// 防抖 Hook
// ============================================

/**
 * 防抖值 Hook
 * 延迟更新值，适用于搜索输入等场景
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [value, setValue] = useState('')
 *   const debouncedValue = useDebouncedValue(value, 300)
 *   
 *   useEffect(() => {
 *     // 只有在停止输入300ms后才触发搜索
 *     search(debouncedValue)
 *   }, [debouncedValue])
 *   
 *   return <input value={value} onChange={e => setValue(e.target.value)} />
 * }
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖函数 Hook
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const debouncedSearch = useDebouncedCallback((query: string) => {
 *     fetchResults(query)
 *   }, 300)
 *   
 *   return <input onChange={e => debouncedSearch(e.target.value)} />
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// ============================================
// 节流 Hook
// ============================================

/**
 * 节流值 Hook
 * 
 * @example
 * ```tsx
 * function ScrollPosition() {
 *   const [scrollTop, setScrollTop] = useState(0)
 *   const throttledScrollTop = useThrottledValue(scrollTop, 100)
 *   
 *   // throttledScrollTop 最多每100ms更新一次
 * }
 * ```
 */
export function useThrottledValue<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastUpdatedRef = useRef(Date.now())

  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdatedRef.current >= interval) {
      lastUpdatedRef.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastUpdatedRef.current = Date.now()
        setThrottledValue(value)
      }, interval - (now - lastUpdatedRef.current))

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * 节流函数 Hook
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const throttledScroll = useThrottledCallback(() => {
 *     console.log('滚动位置:', window.scrollY)
 *   }, 100)
 *   
 *   useEffect(() => {
 *     window.addEventListener('scroll', throttledScroll)
 *     return () => window.removeEventListener('scroll', throttledScroll)
 *   }, [])
 * }
 * ```
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval: number
): T {
  const lastRunRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRunRef.current

      if (timeSinceLastRun >= interval) {
        lastRunRef.current = now
        callback(...args)
      } else {
        // 确保最后一次调用会被执行
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          lastRunRef.current = Date.now()
          callback(...args)
        }, interval - timeSinceLastRun)
      }
    },
    [callback, interval]
  ) as T

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return throttledCallback
}

// ============================================
// 请求取消 Hook
// ============================================

/**
 * 请求取消 Hook
 * 自动处理组件卸载时的请求取消
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { signal, abort, isAborted } = useAbortController()
 *   
 *   useEffect(() => {
 *     fetch('/api/data', { signal })
 *       .then(res => res.json())
 *       .catch(err => {
 *         if (err.name === 'AbortError') return
 *         // 处理其他错误
 *       })
 *     
 *     return () => abort()
 *   }, [])
 * }
 * ```
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null)
  const [isAborted, setIsAborted] = useState(false)

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort()
      setIsAborted(true)
    }
  }, [])

  const getSignal = useCallback(() => {
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController()
      setIsAborted(false)
    }
    return controllerRef.current.signal
  }, [])

  // 组件卸载时取消
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  return {
    signal: getSignal(),
    abort,
    isAborted,
    getSignal,
  }
}

// ============================================
// 可取消的异步操作 Hook
// ============================================

export interface UseCancellableOptions<T> {
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 取消回调 */
  onCancel?: () => void
}

export interface UseCancellableResult<T, P> {
  /** 执行 */
  execute: (params: P) => Promise<T | null>
  /** 取消 */
  cancel: () => void
  /** 是否已取消 */
  isCancelled: boolean
  /** 加载中 */
  loading: boolean
  /** 错误 */
  error: Error | null
  /** 数据 */
  data: T | null
}

/**
 * 可取消的异步操作 Hook
 */
export function useCancellable<T, P>(
  asyncFn: (params: P, signal: AbortSignal) => Promise<T>,
  options: UseCancellableOptions<T> = {}
): UseCancellableResult<T, P> {
  const { onSuccess, onError, onCancel } = options

  const controllerRef = useRef<AbortController | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort()
      controllerRef.current = null
      setIsCancelled(true)
      setLoading(false)
      onCancel?.()
    }
  }, [onCancel])

  const execute = useCallback(
    async (params: P): Promise<T | null> => {
      // 取消之前的请求
      cancel()

      // 创建新的 AbortController
      const controller = new AbortController()
      controllerRef.current = controller
      setIsCancelled(false)
      setLoading(true)
      setError(null)

      try {
        const result = await asyncFn(params, controller.signal)

        // 检查是否已取消
        if (controller.signal.aborted) {
          return null
        }

        setData(result)
        setLoading(false)
        onSuccess?.(result)
        return result
      } catch (err) {
        // 检查是否是取消导致的错误
        if (controller.signal.aborted) {
          return null
        }

        const error = err as Error
        setError(error)
        setLoading(false)
        onError?.(error)
        return null
      }
    },
    [asyncFn, cancel, onSuccess, onError]
  )

  // 组件卸载时取消
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  return {
    execute,
    cancel,
    isCancelled,
    loading,
    error,
    data,
  }
}

// ============================================
// 记忆化计算 Hook
// ============================================

/**
 * 深度记忆化 Hook
 * 对于复杂数据结构进行深度比较
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | null>(null)

  if (!ref.current || !shallowEqualArrays(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() }
  }

  return ref.current.value
}

function shallowEqualArrays(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, index) => Object.is(item, b[index]))
}

// ============================================
// 依赖优化 Hook
// ============================================

/**
 * 稳定的对象引用 Hook
 * 防止对象依赖导致的重复渲染
 */
export function useStableObject<T extends Record<string, unknown>>(obj: T): T {
  const ref = useRef<T>(obj)
  const keys = Object.keys(obj)

  // 比较所有值是否相同
  const isSame = useMemo(() => {
    return keys.every(key => Object.is(ref.current[key], obj[key]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obj])

  if (!isSame) {
    ref.current = obj
  }

  return ref.current
}

/**
 * 稳定的数组引用 Hook
 */
export function useStableArray<T>(arr: T[]): T[] {
  const ref = useRef<T[]>(arr)

  // 比较数组内容是否相同
  const isSame = useMemo(() => {
    if (ref.current.length !== arr.length) return false
    return ref.current.every((item, index) => Object.is(item, arr[index]))
  }, [arr])

  if (!isSame) {
    ref.current = arr
  }

  return ref.current
}

// ============================================
// 计算缓存 Hook
// ============================================

/**
 * 计算缓存 Hook
 * 缓存昂贵的计算结果
 * 
 * @example
 * ```tsx
 * function DataList({ items }) {
 *   const processedItems = useComputed(() => {
 *     // 昂贵的计算
 *     return items.map(item => heavyTransform(item))
 *   }, [items])
 *   
 *   return <div>{processedItems.map(...)}</div>
 * }
 * ```
 */
export function useComputed<T>(compute: () => T, deps: unknown[]): T {
  return useMemo(compute, deps)
}

// ============================================
// 间隔执行 Hook
// ============================================

/**
 * 间隔执行 Hook
 * 
 * @example
 * ```tsx
 * function Timer() {
 *   const [count, setCount] = useState(0)
 *   
 *   useInterval(() => {
 *     setCount(c => c + 1)
 *   }, 1000)
 *   
 *   return <div>{count}秒</div>
 * }
 * ```
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  // 保存最新的回调
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // 设置定时器
  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// ============================================
// 延迟执行 Hook
// ============================================

/**
 * 延迟执行 Hook
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setTimeout(() => savedCallback.current(), delay)
    return () => clearTimeout(id)
  }, [delay])
}
