/**
 * 共享资源弹窗组件
 * 
 * 当发现共享资源时，弹窗提示用户选择使用或重新生成
 * 
 * @module components/shared-resource/SharedResourceDialog
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Users,
  Clock,
  Check,
  Loader2,
} from 'lucide-react';

// ==================== 类型定义 ====================

export interface SharedResourceData {
  id: string;
  title: string;
  useCount: number;
  createdByName: string | null;
  createdAt: string;
}

interface SharedResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: SharedResourceData | null;
  onUseShared: () => void;
  onGenerateNew: () => void;
  isLoading?: boolean;
}

// ==================== 辅助函数 ====================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

// ==================== 主组件 ====================

export function SharedResourceDialog({
  open,
  onOpenChange,
  resource,
  onUseShared,
  onGenerateNew,
  isLoading = false,
}: SharedResourceDialogProps) {
  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            发现共享资源
          </DialogTitle>
          <DialogDescription>
            该篇目已有教师贡献了教学方案，您可以直接使用
          </DialogDescription>
        </DialogHeader>

        {/* 资源预览卡片 */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold text-lg">{resource.title}</div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="bg-white">
                <Users className="w-3 h-3 mr-1" />
                {resource.useCount > 0 ? `${resource.useCount}人使用` : '新资源'}
              </Badge>
              
              {resource.createdByName && (
                <span className="flex items-center gap-1">
                  贡献者：{resource.createdByName}
                </span>
              )}
              
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(resource.createdAt)}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground bg-white/50 rounded-lg p-2">
              💡 使用共享资源可以节省等待时间，您可以在此基础上进行个性化修改
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={onUseShared}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                使用共享方案
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onGenerateNew}
            disabled={isLoading}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            重新生成（约15秒）
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
