/**
 * 文件预览 Hook
 * 
 * @module hooks/useFilePreview
 * 
 * 封装文件预览的状态管理和控制逻辑
 */

'use client';

import { useState, useCallback } from 'react';
import type { FilePreviewResource, FilePreviewState, FilePreviewController, ViewerType } from '@/types/file-preview';

/**
 * 文件预览 Hook
 * 
 * @example
 * ```tsx
 * const preview = useFilePreview();
 * 
 * // 打开预览
 * preview.open({
 *   id: '1',
 *   title: '教学设计',
 *   fileName: '教学设计.docx',
 *   fileUrl: 'https://...',
 *   fileSize: 102400,
 * });
 * 
 * // 关闭预览
 * preview.close();
 * ```
 */
export function useFilePreview(): FilePreviewController {
  const [state, setState] = useState<FilePreviewState>({
    isOpen: false,
    resource: null,
    loading: true,
    viewerType: 'office',
  });

  const open = useCallback((resource: FilePreviewResource) => {
    setState({
      isOpen: true,
      resource,
      loading: true,
      viewerType: 'office',
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      resource: null,
      loading: true,
      viewerType: 'office',
    });
  }, []);

  const setViewerType = useCallback((viewerType: ViewerType) => {
    setState(prev => ({ ...prev, viewerType, loading: true }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  return {
    open,
    close,
    setViewerType,
    setLoading,
    state,
  };
}
