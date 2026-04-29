/**
 * 健康模块性能优化工具
 *
 * 1. LazyChart - 图表懒加载包装器（IntersectionObserver 触发渲染）
 * 2. useAPICache - 前端 API 缓存 Hook
 * 3. VirtualList - 虚拟滚动列表组件（基于 @tanstack/react-virtual）
 */
'use client';

import { useState, useEffect, useRef, useCallback, ReactNode, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// ==================== 图表懒加载 ====================

/**
 * LazyChart - 当组件进入可视区域时才渲染
 * 用于图表等重计算组件的懒加载优化
 */
export function LazyChart({
  children,
  height = 300,
  fallback,
}: {
  children: ReactNode;
  height?: number;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {visible ? children : (fallback || (
        <div className="flex h-full items-center justify-center text-muted-foreground/50 text-sm">
          加载中...
        </div>
      ))}
    </div>
  );
}

// ==================== 前端 API 缓存 ====================

type CacheEntry<T> = {
  data: T;
  ts: number;
};

const DEFAULT_TTL = 3 * 60 * 1000; // 3分钟

/**
 * useAPICache - 带 TTL 的前端缓存 Hook
 * 避免短时间内重复请求相同数据
 */
export function useAPICache<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_TTL) {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.ts < ttl) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    try {
      const result = await fetcher();
      cacheRef.current.set(key, { data: result, ts: Date.now() });
      setData(result);
    } catch (err) {
      console.error('[useAPICache] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [key, ttl, fetcher]);

  useEffect(() => { load(); }, [load]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    load();
  }, [key, load]);

  return { data, loading, reload: invalidate };
}

// ==================== 虚拟滚动列表 ====================

/**
 * VirtualList - 基于虚拟滚动的长列表组件
 * 适用于大数据量表格行渲染
 */
export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 48,
  overscan = 5,
  className = '',
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div ref={parentRef} className={`overflow-auto ${className}`} style={{ maxHeight: '600px' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const item = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
