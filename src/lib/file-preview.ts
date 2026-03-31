/**
 * 文件预览工具函数
 * 
 * @module lib/file-preview
 */

import type { FileType, ViewerType } from '@/types/file-preview';

/**
 * 根据文件名或URL判断文件类型
 */
export function getFileType(fileName?: string, fileUrl?: string): FileType {
  const name = fileName?.toLowerCase() || fileUrl?.toLowerCase() || '';
  
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return 'word';
  if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';
  if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'excel';
  if (name.match(/\.(mp4|mov|avi|webm|mkv|wmv|flv)$/)) return 'video';
  if (name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return 'image';
  
  return 'other';
}

/**
 * 获取 Office Online Viewer URL
 */
export function getOfficeViewerUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
}

/**
 * 获取 Google Docs Viewer URL
 */
export function getGoogleViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

/**
 * 获取预览器 URL
 */
export function getViewerUrl(fileUrl: string, viewerType: ViewerType): string {
  switch (viewerType) {
    case 'office':
      return getOfficeViewerUrl(fileUrl);
    case 'google':
      return getGoogleViewerUrl(fileUrl);
    default:
      return fileUrl;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * 判断是否需要切换预览器
 * PDF、视频、图片使用原生预览，不需要切换
 */
export function needsViewerSwitch(fileType: FileType): boolean {
  return fileType !== 'pdf' && fileType !== 'video' && fileType !== 'image';
}

/**
 * 判断文件是否可预览
 */
export function isPreviewable(fileName?: string, fileUrl?: string): boolean {
  if (!fileUrl) return false;
  const fileType = getFileType(fileName, fileUrl);
  return fileType !== 'other' || fileName?.match(/\.(txt|md|json|xml|csv)$/i) !== null;
}
