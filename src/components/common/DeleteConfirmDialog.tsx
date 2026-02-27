'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 确认删除回调 */
  onConfirm: () => void;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 删除确认对话框
 * 用于删除操作前的二次确认
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '确认删除',
  description = '此操作不可撤销，确定要删除这条数据吗？',
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * 操作确认对话框
 * 用于通用操作的二次确认
 */
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-primary hover:bg-primary/90';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className={getVariantStyles()}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
