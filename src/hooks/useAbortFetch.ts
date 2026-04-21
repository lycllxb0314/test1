'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * useAbortFetch — 自动取消上一次未完成请求的 Hook
 *
 * 使用场景：Tab 切换、搜索筛选、快速操作等需要取消旧请求的场合。
 * 每次调用 getSignal() 会自动 abort 上一次请求，返回新的 AbortSignal。
 * 组件卸载时自动 abort 当前请求。
 *
 * @example
 * ```ts
 * const { getSignal, abort } = useAbortFetch();
 *
 * // 在 effect 或事件中
 * const res = await fetch('/api/data', { signal: getSignal() });
 * ```
 */
export function useAbortFetch() {
  const controllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const getSignal = useCallback(() => {
    // 取消上一次
    abort();
    // 创建新的 controller
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }, [abort]);

  // 组件卸载时自动取消
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { getSignal, abort };
}
