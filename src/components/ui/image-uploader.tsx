/**
 * 图片上传组件
 *
 * 功能：
 * - 点击/拖拽上传图片
 * - 上传到对象存储（/api/upload）
 * - 预览已上传图片
 * - 删除已上传图片
 *
 * @module components/ui/image-uploader
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImagePlus, X, Loader2 } from 'lucide-react';

type ImageUploaderProps = {
  /** 已上传图片 URL */
  value?: string;
  /** 图片说明 */
  alt?: string;
  /** 变更回调 */
  onChange: (url: string | undefined, alt?: string) => void;
  /** alt 变更回调 */
  onAltChange?: (alt: string) => void;
  /** 上传文件夹（默认 question-images） */
  folder?: string;
  /** 额外类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

export function ImageUploader({
  value,
  alt,
  onChange,
  onAltChange,
  folder = 'question-images',
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    // 限制大小 10MB
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        onChange(data.data.url, alt);
      }
    } catch (err) {
      console.error('图片上传失败:', err);
    } finally {
      setUploading(false);
    }
  }, [folder, alt, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // 重置 input 以便再次选择同一文件
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
    onChange(undefined, undefined);
  }, [onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        /* 已上传：显示预览 */
        <div className="relative group border rounded-lg overflow-hidden bg-muted/20">
          <img
            src={value}
            alt={alt || '题目配图'}
            className="w-full max-h-48 object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* 未上传：上传区域 */
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">上传中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <ImagePlus className="w-6 h-6 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">点击或拖拽上传图片</span>
              <span className="text-[10px] text-muted-foreground/60">支持 JPG/PNG/GIF，最大 10MB</span>
            </div>
          )}
        </div>
      )}

      {/* 图片说明 */}
      {value && onAltChange && (
        <input
          type="text"
          className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="图片说明（选填，如：几何图形）"
          value={alt || ''}
          onChange={(e) => onAltChange(e.target.value)}
          disabled={disabled}
        />
      )}

      {/* 隐藏文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />
    </div>
  );
}

/**
 * 多图上传组件
 */
type MultiImageUploaderProps = {
  /** 已上传图片 URL 列表 */
  images: string[];
  /** 变更回调 */
  onChange: (images: string[]) => void;
  /** 最大图片数量 */
  maxImages?: number;
  /** 上传文件夹 */
  folder?: string;
  /** 额外类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

export function MultiImageUploader({
  images,
  onChange,
  maxImages = 5,
  folder = 'question-images',
  className,
  disabled = false,
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    if (images.length >= maxImages) {
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        onChange([...images, data.data.url]);
      }
    } catch (err) {
      console.error('图片上传失败:', err);
    } finally {
      setUploading(false);
    }
  }, [folder, images, maxImages, onChange]);

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

  const handleRemove = useCallback((index: number) => {
    onChange(images.filter((_, i) => i !== index));
  }, [images, onChange]);

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className={cn('space-y-2', className)}>
      {/* 已上传图片预览 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative group w-20 h-20">
              <img
                src={url}
                alt={`图片${index + 1}`}
                className="w-full h-full object-cover rounded border cursor-pointer"
                onClick={() => window.open(url, '_blank')}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 上传区域 */}
      {canAddMore && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40'
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">上传中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ImagePlus className="w-4 h-4 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">
                点击上传 ({images.length}/{maxImages})
              </span>
            </div>
          )}
        </div>
      )}

      {/* 隐藏文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />
    </div>
  );
}
