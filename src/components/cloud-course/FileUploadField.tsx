'use client';

/**
 * 通用文件上传字段组件
 *
 * 支持：
 * - 文件选择 + 上传到对象存储
 * - 手动输入 URL（切换模式）
 * - 上传进度显示
 * - 已上传文件预览/删除
 * - 拖拽上传
 *
 * 用于视频、课件等非图片类文件上传
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  Loader2,
  Link,
  FileText,
  Video,
  Paperclip,
  Check,
} from 'lucide-react';
import {
  FILE_TYPE_CONFIGS,
  isFileTypeAllowed,
  isFileSizeAllowed,
  formatMaxFileSize,
  type FileCategory,
} from '@/lib/file-upload-config';

type FileUploadFieldProps = {
  /** 当前值（URL） */
  value: string;
  /** 变更回调 */
  onChange: (url: string) => void;
  /** 文件类别，决定允许的文件类型和大小 */
  category?: FileCategory;
  /** 上传到对象存储的文件夹前缀 */
  folder?: string;
  /** 上传接口路径，默认 /api/upload；视频文件建议用 /api/upload-video */
  uploadEndpoint?: string;
  /** 占位文字 */
  placeholder?: string;
  /** 标签 */
  label?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外类名 */
  className?: string;
  /** 图标类型 */
  iconType?: 'video' | 'document' | 'generic';
};

export function FileUploadField({
  value,
  onChange,
  category = 'teaching',
  folder = 'cloud-course',
  uploadEndpoint,
  label,
  placeholder,
  disabled = false,
  className,
  iconType = 'generic',
}: FileUploadFieldProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(value ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = FILE_TYPE_CONFIGS[category];

  // 自动选择上传端点
  const endpoint = uploadEndpoint || (category === 'video' ? '/api/upload-video' : '/api/upload');

  const uploadFile = useCallback(async (file: File) => {
    // 类型校验
    if (!isFileTypeAllowed(file, category)) {
      alert(`不支持的文件格式，${config.hint}`);
      return;
    }
    // 大小校验
    if (!isFileSizeAllowed(file, category)) {
      alert(`文件大小超过限制（最大 ${formatMaxFileSize(category)}）`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (endpoint === '/api/upload') {
        formData.append('folder', folder);
      }

      // 使用 XMLHttpRequest 以获取上传进度
      const result = await new Promise<{ success: boolean; data?: { url: string; key?: string; name?: string }; url?: string; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const resp = JSON.parse(xhr.responseText);
            resolve(resp);
          } catch {
            reject(new Error('解析响应失败'));
          }
        };

        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.send(formData);
      });

      if (result.success) {
        // /api/upload 返回 data.url，/api/upload-video 直接返回 url
        const url = result.data?.url || result.url || '';
        if (url) {
          onChange(url);
          setUploadedFileName(result.data?.name || file.name);
        }
      } else {
        alert(result.error || '上传失败');
      }
    } catch (err) {
      console.error('文件上传失败:', err);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [category, config.hint, endpoint, folder, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleRemove = useCallback(() => {
    onChange('');
    setUploadedFileName('');
  }, [onChange]);

  // 图标选择
  const IconComponent = iconType === 'video' ? Video : iconType === 'document' ? FileText : Paperclip;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="text-xs text-muted-foreground block">{label}</label>}

      {/* 模式切换 */}
      <div className="flex items-center gap-1 mb-1">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'text-xs px-2 py-1 rounded transition-colors',
            mode === 'upload' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="h-3 w-3 inline mr-1" />上传文件
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'text-xs px-2 py-1 rounded transition-colors',
            mode === 'url' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link className="h-3 w-3 inline mr-1" />输入链接
        </button>
      </div>

      {mode === 'url' ? (
        /* URL 输入模式 */
        <div className="relative">
          <IconComponent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={placeholder || '输入链接（支持B站/YouTube等平台链接）'}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
            disabled={disabled}
          />
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* 上传模式 */
        value ? (
          /* 已上传：显示文件信息 */
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border/50">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {uploadedFileName || (value.includes('/') ? value.split('/').pop() : '已上传文件')}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{value}</p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ) : (
          /* 未上传：上传区域 */
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-muted-foreground/40',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">上传中 {uploadProgress}%</span>
                <div className="w-full max-w-[160px] h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">点击或拖拽上传</span>
                <span className="text-[10px] text-muted-foreground/50">{config.hint}</span>
              </div>
            )}
          </div>
        )
      )}

      {/* 隐藏文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />
    </div>
  );
}
