/**
 * 文件预览相关类型定义
 * 
 * @module types/file-preview
 */

/** 文件类型枚举 */
export type FileType = 'pdf' | 'word' | 'ppt' | 'excel' | 'video' | 'image' | 'other';

/** 文件预览器类型 */
export type ViewerType = 'office' | 'google' | 'native';

/** 文件预览资源信息 */
export type FilePreviewResource = {
  /** 资源ID */
  id: string;
  /** 文件标题 */
  title: string;
  /** 文件名称 */
  fileName?: string;
  /** 文件URL */
  fileUrl: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 文件类型 */
  fileType?: FileType;
  /** 资源来源类型 */
  sourceType?: 'upload' | 'generated' | 'research_import' | 'other';
};

/** 文件预览状态 */
export type FilePreviewState = {
  /** 是否打开预览 */
  isOpen: boolean;
  /** 当前预览的资源 */
  resource: FilePreviewResource | null;
  /** 加载状态 */
  loading: boolean;
  /** 当前使用的预览器 */
  viewerType: ViewerType;
};

/** 文件预览控制器 */
export type FilePreviewController = {
  /** 打开预览 */
  open: (resource: FilePreviewResource) => void;
  /** 关闭预览 */
  close: () => void;
  /** 切换预览器 */
  setViewerType: (type: ViewerType) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 当前状态 */
  state: FilePreviewState;
};
