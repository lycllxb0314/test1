'use client';

/**
 * 草稿列表组件
 * 
 * 显示所有草稿，支持载入和删除
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
import {
  FileText,
  Clock,
  Trash2,
  FolderOpen,
  CheckCircle,
  Archive,
} from 'lucide-react';
import type { ScheduleDraft } from '@/hooks/useScheduleDraft';

interface DraftListProps {
  drafts: ScheduleDraft[];
  isLoading: boolean;
  onLoad: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  onPublish: (draftId: string) => void;
}

export function DraftList({
  drafts,
  isLoading,
  onLoad,
  onDelete,
  onPublish,
}: DraftListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />草稿</Badge>;
      case 'published':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />已发布</Badge>;
      case 'archived':
        return <Badge variant="outline"><Archive className="h-3 w-3 mr-1" />已归档</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (drafts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>暂无草稿</p>
        <p className="text-sm">执行智能排课后可保存为草稿</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 p-1">
          {drafts.map(draft => (
            <div
              key={draft.id}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{draft.name}</span>
                    {getStatusBadge(draft.status)}
                  </div>
                  {draft.description && (
                    <p className="text-sm text-muted-foreground">{draft.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(draft.updated_at)}
                </span>
                {draft.slots && (
                  <span>{draft.slots.length} 条课表记录</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLoad(draft.id)}
                  disabled={isLoading}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  载入
                </Button>
                
                {draft.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onPublish(draft.id)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    发布
                  </Button>
                )}
                
                {draft.status !== 'published' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(draft.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个草稿吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
