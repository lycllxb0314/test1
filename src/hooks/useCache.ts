/**
 * 数据缓存 Hooks
 * 
 * 提供全局缓存能力，减少重复请求，提升性能
 * 
 * 设计原则：
 * 1. 内存缓存 - 快速访问
 * 2. TTL机制 - 自动过期
 * 3. 缓存失效 - 支持手动清除
 * 4. 请求去重 - 避免并发重复请求
 * 
 * @module hooks/useCache
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ============================================
// 缓存存储
// ============================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: number
}

// 全局缓存存储
const globalCache = new Map<string, CacheEntry<unknown>>()

// 请求去重队列
const pendingRequests = new Map<string, Promise<unknown>>()

// 缓存版本号，用于强制刷新
let cacheVersion = 0

// ============================================
// 缓存工具函数
// ============================================

/**
 * 生成缓存键
 */
function generateCacheKey(key: string, params?: Record<string, unknown>): string {
  if (!params) return key
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${JSON.stringify(params[k])}`)
    .join('&')
  return `${key}?${sortedParams}`
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp > entry.ttl
}

/**
 * 获取缓存
 */
function getCache<T>(key: string): T | null {
  const entry = globalCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (isCacheExpired(entry)) {
    globalCache.delete(key)
    return null
  }
  return entry.data
}

/**
 * 设置缓存
 */
function setCache<T>(key: string, data: T, ttl: number): void {
  globalCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
    version: cacheVersion,
  })
}

/**
 * 清除缓存
 */
function clearCache(pattern?: string): void {
  if (!pattern) {
    globalCache.clear()
    cacheVersion++
    return
  }
  
  // 按模式清除
  for (const key of globalCache.keys()) {
    if (key.startsWith(pattern)) {
      globalCache.delete(key)
    }
  }
}

// ============================================
// 缓存 Hook
// ============================================

export interface UseCacheOptions<T> {
  /** 缓存键 */
  key: string
  /** 缓存参数 */
  params?: Record<string, unknown>
  /** 数据获取函数 */
  fetcher: () => Promise<T>
  /** 缓存时间（毫秒），默认5分钟 */
  ttl?: number
  /** 是否启用缓存（默认true） */
  enabled?: boolean
  /** 是否立即获取（默认true） */
  immediate?: boolean
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 窗口聚焦时刷新（默认false） */
  refetchOnWindowFocus?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
}

export interface UseCacheResult<T> {
  /** 数据 */
  data: T | null
  /** 加载中 */
  loading: boolean
  /** 错误 */
  error: Error | null
  /** 刷新数据 */
  refetch: (force?: boolean) => Promise<void>
  /** 清除缓存 */
  clearCache: () => void
  /** 是否来自缓存 */
  isFromCache: boolean
  /** 是否正在获取 */
  isFetching: boolean
}

/**
 * 通用缓存 Hook
 * 
 * @example
 * ```tsx
 * function TeacherList() {
 *   const { data, loading, refetch } = useCache({
 *     key: 'teachers',
 *     params: { department: '语文组' },
 *     fetcher: () => api.teacher.list({ department: '语文组' }),
 *     ttl: 5 * 60 * 1000, // 5分钟缓存
 *   })
 *   
 *   return <div>{data?.map(t => t.name)}</div>
 * }
 * ```
 */
export function useCache<T>(options: UseCacheOptions<T>): UseCacheResult<T> {
  const {
    key,
    params,
    fetcher,
    ttl = 5 * 60 * 1000, // 默认5分钟
    enabled = true,
    immediate = true,
    onSuccess,
    onError,
    refetchOnWindowFocus = false,
    retryCount = 0,
    retryDelay = 1000,
  } = options

  const cacheKey = useMemo(() => generateCacheKey(key, params), [key, params])
  
  const [data, setData] = useState<T | null>(() => {
    // 初始化时检查缓存
    if (enabled) {
      return getCache<T>(cacheKey)
    }
    return null
  })
  const [loading, setLoading] = useState(!data)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(!!data)

  const mountedRef = useRef(true)
  const retryAttemptRef = useRef(0)

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    // 检查缓存
    if (!forceRefresh) {
      const cached = getCache<T>(cacheKey)
      if (cached) {
        setData(cached)
        setIsFromCache(true)
        setLoading(false)
        return
      }
    }

    // 检查是否有正在进行的请求（请求去重）
    const pendingRequest = pendingRequests.get(cacheKey) as Promise<T> | undefined
    if (pendingRequest) {
      setIsFetching(true)
      try {
        const result = await pendingRequest
        if (mountedRef.current) {
          setData(result)
          setIsFromCache(false)
          setLoading(false)
          onSuccess?.(result)
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error)
          onError?.(err as Error)
        }
      } finally {
        if (mountedRef.current) {
          setIsFetching(false)
        }
      }
      return
    }

    // 发起新请求
    setIsFetching(true)
    setLoading(prev => prev || !data)
    setError(null)

    const request = fetcher()
    pendingRequests.set(cacheKey, request)

    try {
      const result = await request
      
      if (mountedRef.current) {
        setData(result)
        setCache(cacheKey, result, ttl)
        setIsFromCache(false)
        setLoading(false)
        retryAttemptRef.current = 0
        onSuccess?.(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err as Error
        setError(error)
        
        // 重试逻辑
        if (retryAttemptRef.current < retryCount) {
          retryAttemptRef.current++
          setTimeout(() => {
            if (mountedRef.current) {
              fetchData(forceRefresh)
            }
          }, retryDelay)
        } else {
          onError?.(error)
          setLoading(false)
        }
      }
    } finally {
      pendingRequests.delete(cacheKey)
      if (mountedRef.current) {
        setIsFetching(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cacheKey, ttl, fetcher, retryCount, retryDelay])

  const clearCacheByKey = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  const refetch = useCallback(async (force = true) => {
    retryAttemptRef.current = 0
    await fetchData(force)
  }, [fetchData])

  // 初始化获取
  useEffect(() => {
    mountedRef.current = true
    if (immediate && enabled) {
      fetchData()
    }
    return () => {
      mountedRef.current = false
    }
  }, [immediate, enabled, fetchData])

  // 窗口聚焦时刷新
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const cached = getCache<T>(cacheKey)
      if (!cached) {
        fetchData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, cacheKey, fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    clearCache: clearCacheByKey,
    isFromCache,
    isFetching,
  }
}

// ============================================
// 批量缓存 Hook
// ============================================

export interface UseBatchCacheOptions<T> {
  /** 缓存键前缀 */
  keyPrefix: string
  /** 参数列表 */
  paramsList: Array<Record<string, unknown>>
  /** 批量获取函数 */
  batchFetcher: (paramsList: Array<Record<string, unknown>>) => Promise<T[]>
  /** 单个获取函数 */
  singleFetcher: (params: Record<string, unknown>) => Promise<T>
  /** 缓存时间 */
  ttl?: number
  /** 是否启用 */
  enabled?: boolean
}

export interface UseBatchCacheResult<T> {
  /** 数据列表 */
  data: (T | null)[]
  /** 加载中 */
  loading: boolean
  /** 错误列表 */
  errors: (Error | null)[]
  /** 刷新单个 */
  refetchOne: (index: number) => Promise<void>
  /** 刷新全部 */
  refetchAll: () => Promise<void>
}

/**
 * 批量缓存 Hook
 * 支持批量获取和单个刷新
 */
export function useBatchCache<T>(
  options: UseBatchCacheOptions<T>
): UseBatchCacheResult<T> {
  const {
    keyPrefix,
    paramsList,
    batchFetcher,
    singleFetcher,
    ttl = 5 * 60 * 1000,
    enabled = true,
  } = options

  const [data, setData] = useState<(T | null)[]>(() => {
    return paramsList.map(params => {
      const cacheKey = generateCacheKey(keyPrefix, params)
      return getCache<T>(cacheKey)
    })
  })
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<(Error | null)[]>(new Array(paramsList.length).fill(null))

  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    // 检查哪些需要获取
    const needFetchIndices: number[] = []
    paramsList.forEach((params, index) => {
      const cacheKey = generateCacheKey(keyPrefix, params)
      const cached = getCache<T>(cacheKey)
      if (!cached) {
        needFetchIndices.push(index)
      }
    })

    if (needFetchIndices.length === 0) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // 优先使用批量获取
      if (batchFetcher && needFetchIndices.length > 1) {
        const paramsToFetch = needFetchIndices.map(i => paramsList[i])
        const results = await batchFetcher(paramsToFetch)
        
        if (mountedRef.current) {
          const newData = [...data]
          results.forEach((result, i) => {
            const index = needFetchIndices[i]
            newData[index] = result
            const cacheKey = generateCacheKey(keyPrefix, paramsList[index])
            setCache(cacheKey, result, ttl)
          })
          setData(newData)
        }
      } else {
        // 单个获取
        const newData = [...data]
        const newErrors = [...errors]
        
        await Promise.all(
          needFetchIndices.map(async index => {
            try {
              const result = await singleFetcher(paramsList[index])
              if (mountedRef.current) {
                newData[index] = result
                const cacheKey = generateCacheKey(keyPrefix, paramsList[index])
                setCache(cacheKey, result, ttl)
              }
            } catch (err) {
              if (mountedRef.current) {
                newErrors[index] = err as Error
              }
            }
          })
        )
        
        if (mountedRef.current) {
          setData(newData)
          setErrors(newErrors)
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, keyPrefix, paramsList, batchFetcher, singleFetcher, ttl])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  const refetchOne = useCallback(async (index: number) => {
    const params = paramsList[index]
    if (!params) return

    try {
      const result = await singleFetcher(params)
      const cacheKey = generateCacheKey(keyPrefix, params)
      setCache(cacheKey, result, ttl)
      
      if (mountedRef.current) {
        setData(prev => {
          const newData = [...prev]
          newData[index] = result
          return newData
        })
      }
    } catch (err) {
      if (mountedRef.current) {
        setErrors(prev => {
          const newErrors = [...prev]
          newErrors[index] = err as Error
          return newErrors
        })
      }
    }
  }, [keyPrefix, paramsList, singleFetcher, ttl])

  const refetchAll = useCallback(async () => {
    // 清除所有缓存
    paramsList.forEach(params => {
      const cacheKey = generateCacheKey(keyPrefix, params)
      globalCache.delete(cacheKey)
    })
    await fetchData()
  }, [keyPrefix, paramsList, fetchData])

  return {
    data,
    loading,
    errors,
    refetchOne,
    refetchAll,
  }
}

// ============================================
// 全局缓存管理
// ============================================

/**
 * 缓存管理器
 */
export const CacheManager = {
  /** 获取缓存 */
  get: <T>(key: string, params?: Record<string, unknown>): T | null => {
    const cacheKey = generateCacheKey(key, params)
    return getCache<T>(cacheKey)
  },
  
  /** 设置缓存 */
  set: <T>(key: string, data: T, ttl: number = 5 * 60 * 1000, params?: Record<string, unknown>): void => {
    const cacheKey = generateCacheKey(key, params)
    setCache(cacheKey, data, ttl)
  },
  
  /** 清除缓存 */
  clear: (pattern?: string): void => {
    clearCache(pattern)
  },
  
  /** 获取缓存大小 */
  size: (): number => {
    return globalCache.size
  },
  
  /** 获取所有缓存键 */
  keys: (): string[] => {
    return Array.from(globalCache.keys())
  },
  
  /** 检查缓存是否存在 */
  has: (key: string, params?: Record<string, unknown>): boolean => {
    const cacheKey = generateCacheKey(key, params)
    const cached = getCache(cacheKey)
    return cached !== null
  },
}

// ============================================
// 静态数据缓存 Hook
// ============================================

/**
 * 静态数据缓存 Hook
 * 适用于不常变化的数据，如年级、班级列表等
 */
export function useStaticCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 30 * 60 * 1000 // 默认30分钟
): UseCacheResult<T> {
  return useCache({
    key,
    fetcher,
    ttl,
    refetchOnWindowFocus: false,
  })
}

// ============================================
// 导出
// ============================================

export { globalCache }
