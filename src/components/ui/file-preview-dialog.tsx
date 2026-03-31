/**
 * 文件预览弹窗组件
 * 
 * @module components/ui/file-preview-dialog
 * 
 * 全局可复用的文件预览弹窗，支持 PDF、Office 文档、视频、图片等格式
 */

'use client';

import React from 'react';
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
  if (!resource) return null;

  const fileType = getFileType(resource.fileName, resource.fileUrl);
  const FileIcon = FILE_TYPE_ICONS[fileType];
  const iconColor = FILE_TYPE_COLORS[fileType];
  const showViewerSwitch = needsViewerSwitch(fileType);

  // 下载文件
  const handleDownload = async () => {
    if (!resource.fileUrl) return;

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
  };

  // 新窗口打开
  const handleOpenInNew = () => {
    if (!resource.fileUrl) return;
    window.open(resource.fileUrl, '_blank');
  };

  // 渲染预览内容
  const renderPreview = () => {
    const fileUrl = resource.fileUrl;

    // PDF 预览
    if (fileType === 'pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title="PDF预览"
          onLoad={onLoad}
        />
      );
    }

    // 图片预览
    if (fileType === 'image') {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50">
          <img
            src={fileUrl}
            alt={resource.fileName || '图片'}
            className="max-w-full max-h-full object-contain"
            onLoad={onLoad}
          />
        </div>
      );
    }

    // 视频预览
    if (fileType === 'video') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-full"
            onLoadedData={onLoad}
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      );
    }

    // Office 文档预览
    return (
      <iframe
        src={getViewerUrl(fileUrl, viewerType)}
        className="w-full h-full border-0"
        title="文档预览"
        onLoad={onLoad}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        {/* 头部 */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileIcon className={cn('w-5 h-5', iconColor)} />
              {resource.title}
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
                    variant={viewerType === 'office' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewerTypeChange?.('office')}
                    className="text-xs"
                  >
                    Office
                  </Button>
                  <Button
                    variant={viewerType === 'google' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onViewerTypeChange?.('google')}
                    className="text-xs"
                  >
                    Google
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span>{resource.fileName}</span>
            {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
            <span>·</span>
            <span className="uppercase">{fileType}</span>
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
          {/* 加载状态 */}
          {loading && fileType !== 'video' && fileType !== 'image' && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm text-gray-500">正在加载预览...</span>
              </div>
            </div>
          )}
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
  const [loading, setLoading] = React.useState(true);

  // 资源变化时重置加载状态
  React.useEffect(() => {
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
