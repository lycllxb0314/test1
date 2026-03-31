/**
 * 文件预览弹窗组件
 * 
 * @module components/ui/file-preview-dialog
 * 
 * 全局可复用的文件预览弹窗，支持 PDF、Office 文档、视频、图片等格式
 * 
 * 性能优化：
 * - 骨架屏提供更好的加载体验
 * - 图片渐进式加载
 * - 视频预加载元数据
 * - Office 文档加载状态提示和快速切换
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  ExternalLink,
  File,
  FileText,
  Presentation,
  FileSpreadsheet,
  Video,
  Loader2,
  ZoomIn,
  ZoomOut,
  FileDown,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { FilePreviewResource, FileType, ViewerType } from '@/types/file-preview';
import {
  getFileType,
  getViewerUrl,
  formatFileSize,
  needsViewerSwitch,
} from '@/lib/file-preview';
import { cn } from '@/lib/utils';

/** Props 类型 */
type FilePreviewDialogProps = {
  /** 是否打开 */
  open: boolean;
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 预览资源 */
  resource: FilePreviewResource | null;
  /** 加载状态 */
  loading?: boolean;
  /** 当前预览器类型 */
  viewerType?: ViewerType;
  /** 切换预览器回调 */
  onViewerTypeChange?: (type: ViewerType) => void;
  /** 加载完成回调 */
  onLoad?: () => void;
};

/** 文件类型图标映射 */
const FILE_TYPE_ICONS: Record<FileType, React.ElementType> = {
  pdf: FileText,
  word: FileText,
  ppt: Presentation,
  excel: FileSpreadsheet,
  video: Video,
  image: File,
  other: File,
};

/** 文件类型颜色映射 */
const FILE_TYPE_COLORS: Record<FileType, string> = {
  pdf: 'text-red-500',
  word: 'text-blue-500',
  ppt: 'text-orange-500',
  excel: 'text-green-500',
  video: 'text-purple-500',
  image: 'text-pink-500',
  other: 'text-gray-500',
};

/** 文件类型名称映射 */
const FILE_TYPE_NAMES: Record<FileType, string> = {
  pdf: 'PDF 文档',
  word: 'Word 文档',
  ppt: 'PPT 演示',
  excel: 'Excel 表格',
  video: '视频文件',
  image: '图片文件',
  other: '其他文件',
};

/** 骨架屏组件 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-muted rounded-md', className)} />
  );
}

/** 图片预览组件 */
function ImageViewer({ 
  fileUrl, 
  fileName, 
  onLoad 
}: { 
  fileUrl: string; 
  fileName?: string;
  onLoad?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-muted-foreground">图片加载失败</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-100 relative">
      {loading && (
        <Skeleton className="absolute inset-4 max-w-[80%] max-h-[80%] mx-auto" />
      )}
      <img
        src={fileUrl}
        alt={fileName || '图片'}
        className={cn(
          'max-w-full max-h-full object-contain transition-opacity duration-300',
          loading ? 'opacity-0' : 'opacity-100'
        )}
        style={{ transform: `scale(${scale})` }}
        onLoad={() => {
          setLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {/* 缩放控制 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setScale(Math.max(0.5, scale - 0.2))}
          className="text-white hover:text-white hover:bg-white/20 h-7 w-7 p-0"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-white text-sm min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setScale(Math.min(3, scale + 0.2))}
          className="text-white hover:text-white hover:bg-white/20 h-7 w-7 p-0"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/** 视频预览组件 */
function VideoViewer({ 
  fileUrl, 
  onLoad 
}: { 
  fileUrl: string; 
  onLoad?: () => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        src={fileUrl}
        controls
        preload="metadata"
        className="max-w-full max-h-full"
        onLoadedMetadata={onLoad}
      >
        您的浏览器不支持视频播放
      </video>
    </div>
  );
}

/** PDF/Office 文档预览组件 */
function DocumentViewer({ 
  fileUrl, 
  fileType,
  viewerType,
  onLoad,
  onViewerTypeChange,
}: { 
  fileUrl: string; 
  fileType: FileType;
  viewerType: ViewerType;
  onLoad?: () => void;
  onViewerTypeChange?: (type: ViewerType) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadTime, setLoadTime] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setLoadTime(0);
    setShowFallback(false);
    
    // 记录加载时间
    const startTime = Date.now();
    const timer = setInterval(() => {
      setLoadTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [fileUrl, viewerType]);

  // 文档加载器有时不会触发 onload，设置超时
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        onLoad?.();
      }
    }, fileType === 'pdf' ? 3000 : 5000);
    
    return () => clearTimeout(timeout);
  }, [loading, onLoad, fileType]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  // 切换查看器
  const switchViewer = () => {
    if (fileType === 'pdf') {
      // PDF 在 iframe 和新窗口之间切换
      setShowFallback(!showFallback);
    } else {
      onViewerTypeChange?.(viewerType === 'office' ? 'google' : 'office');
    }
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    // 强制刷新 iframe
    const iframe = document.querySelector('iframe[title="文档预览"]');
    if (iframe) {
      const src = iframe.getAttribute('src');
      if (src) {
        iframe.setAttribute('src', src + (src.includes('?') ? '&' : '?') + '_t=' + Date.now());
      }
    }
  };

  // PDF 可以直接用 iframe 显示，也可以在新窗口打开
  const viewerUrl = fileType === 'pdf' 
    ? fileUrl 
    : getViewerUrl(fileUrl, viewerType);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-muted-foreground mb-2">正在加载文档预览...</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>已等待 {loadTime} 秒</span>
          </div>
          {loadTime > 5 && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-sm text-amber-600">加载时间较长，建议：</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={switchViewer}>
                  {fileType === 'pdf' ? '在新窗口打开' : `切换到 ${viewerType === 'office' ? 'Google' : 'Office'} 查看器`}
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  直接下载
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <p className="text-muted-foreground mb-2">文档预览加载失败</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            {fileType !== 'pdf' && (
              <Button variant="outline" onClick={switchViewer}>
                尝试 {viewerType === 'office' ? 'Google' : 'Office'} 查看器
              </Button>
            )}
            <Button onClick={() => window.open(fileUrl, '_blank')}>
              <FileDown className="w-4 h-4 mr-2" />
              下载文件
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          title="文档预览"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}

/**
 * 文件预览弹窗组件
 */
export function FilePreviewDialog({
  open,
  onOpenChange,
  resource,
  loading = true,
  viewerType = 'office',
  onViewerTypeChange,
  onLoad,
}: FilePreviewDialogProps) {
  const [internalLoading, setInternalLoading] = useState(true);
  const [currentViewerType, setCurrentViewerType] = useState<ViewerType>(viewerType);

  // 资源变化时重置状态
  useEffect(() => {
    if (resource) {
      setInternalLoading(true);
      setCurrentViewerType(viewerType);
    }
  }, [resource?.id, viewerType]);

  const handleLoad = useCallback(() => {
    setInternalLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleViewerTypeChange = useCallback((type: ViewerType) => {
    setCurrentViewerType(type);
    setInternalLoading(true);
    onViewerTypeChange?.(type);
  }, [onViewerTypeChange]);

  // 下载文件
  const handleDownload = useCallback(async () => {
    if (!resource?.fileUrl) return;

    try {
      const response = await fetch(resource.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('下载失败:', error);
      window.open(resource.fileUrl, '_blank');
    }
  }, [resource]);

  // 新窗口打开
  const handleOpenInNew = useCallback(() => {
    if (!resource?.fileUrl) return;
    window.open(resource.fileUrl, '_blank');
  }, [resource]);

  // 渲染预览内容
  const renderPreview = useCallback(() => {
    if (!resource) return null;

    const fileType = getFileType(resource.fileName, resource.fileUrl);
    const fileUrl = resource.fileUrl;

    switch (fileType) {
      case 'image':
        return (
          <ImageViewer 
            fileUrl={fileUrl} 
            fileName={resource.fileName}
            onLoad={handleLoad}
          />
        );
      
      case 'video':
        return (
          <VideoViewer 
            fileUrl={fileUrl} 
            onLoad={handleLoad}
          />
        );
      
      default:
        // PDF 和 Office 文档都使用 iframe
        return (
          <DocumentViewer
            fileUrl={fileUrl}
            fileType={fileType}
            viewerType={currentViewerType}
            onLoad={handleLoad}
            onViewerTypeChange={handleViewerTypeChange}
          />
        );
    }
  }, [resource, currentViewerType, handleLoad, handleViewerTypeChange]);

  if (!resource) return null;

  const fileType = getFileType(resource.fileName, resource.fileUrl);
  const FileIcon = FILE_TYPE_ICONS[fileType];
  const iconColor = FILE_TYPE_COLORS[fileType];
  const showViewerSwitch = needsViewerSwitch(fileType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        {/* 头部 */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileIcon className={cn('w-5 h-5', iconColor)} />
              <span className="truncate max-w-[300px]">{resource.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNew}>
                <ExternalLink className="w-4 h-4 mr-1" />
                新窗口
              </Button>
              {showViewerSwitch && (
                <div className="flex items-center gap-1">
                  <Button
                    variant={currentViewerType === 'office' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewerTypeChange('office')}
                    className="text-xs"
                  >
                    Office
                  </Button>
                  <Button
                    variant={currentViewerType === 'google' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewerTypeChange('google')}
                    className="text-xs"
                  >
                    Google
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="truncate max-w-[200px]">{resource.fileName}</span>
            {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
            <span>·</span>
            <span>{FILE_TYPE_NAMES[fileType]}</span>
            {resource.sourceType && (
              <>
                <span>·</span>
                <Badge variant="outline" className="text-xs">
                  {resource.sourceType === 'upload' ? '上传' : 
                   resource.sourceType === 'research_import' ? '教研导入' : 
                   resource.sourceType === 'generated' ? '系统生成' : '其他'}
                </Badge>
              </>
            )}
          </div>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 带状态的文件预览弹窗组件
 * 
 * 自动管理状态，无需外部传入 loading 和 viewerType
 */
export function FilePreviewDialogWithState({
  open,
  onOpenChange,
  resource,
  viewerType = 'office',
  onViewerTypeChange,
}: Omit<FilePreviewDialogProps, 'loading' | 'onLoad'>) {
  const [loading, setLoading] = useState(true);

  // 资源变化时重置加载状态
  useEffect(() => {
    if (resource) {
      setLoading(true);
    }
  }, [resource?.id]);

  return (
    <FilePreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      resource={resource}
      loading={loading}
      viewerType={viewerType}
      onViewerTypeChange={onViewerTypeChange}
      onLoad={() => setLoading(false)}
    />
  );
}
