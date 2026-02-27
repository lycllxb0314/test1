'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  X, 
  CheckSquare, 
  Square,
  Loader2,
  Edit,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BatchAction {
  /** 操作标识 */
  key: string;
  /** 显示标签 */
  label: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 点击回调 */
  onClick: () => void;
  /** 是否危险操作（红色） */
  destructive?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示 */
  visible?: boolean;
}

export interface BatchToolbarProps {
  /** 选中数量 */
  selectedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 是否全选 */
  isAllSelected?: boolean;
  /** 全选/取消全选 */
  onToggleSelectAll?: () => void;
  /** 取消选择 */
  onClearSelection?: () => void;
  /** 批量操作列表 */
  actions?: BatchAction[];
  /** 处理中状态 */
  processing?: boolean;
  /** 额外的操作按钮 */
  extraActions?: React.ReactNode;
}

/**
 * 批量操作工具栏
 * 显示在数据列表上方，提供批量操作入口
 */
export function BatchToolbar({
  selectedCount,
  totalCount,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  actions = [],
  processing = false,
  extraActions,
}: BatchToolbarProps) {
  const hasSelection = selectedCount > 0;
  const visibleActions = actions.filter(a => a.visible !== false);

  if (!hasSelection) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* 左侧：选择状态 */}
          <div className="flex items-center gap-3">
            {onToggleSelectAll && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected ? true : (selectedCount > 0 ? 'indeterminate' : false)}
                  onCheckedChange={onToggleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  {isAllSelected ? '全选' : `已选 ${selectedCount} 项`}
                </span>
              </div>
            )}
            
            {!onToggleSelectAll && (
              <Badge variant="secondary" className="gap-1">
                <CheckSquare className="h-3 w-3" />
                已选择 {selectedCount} / {totalCount} 项
              </Badge>
            )}

            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={processing}
                className="h-7 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                取消选择
              </Button>
            )}
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            {extraActions}
            
            {/* 主要操作按钮（最多显示3个） */}
            {visibleActions.slice(0, 3).map(action => (
              <Button
                key={action.key}
                variant={action.destructive ? 'destructive' : 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || processing}
                className={action.destructive ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  action.icon
                )}
                {action.label}
              </Button>
            ))}

            {/* 更多操作下拉菜单 */}
            {visibleActions.length > 3 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={processing}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {visibleActions.slice(3).map(action => (
                    <DropdownMenuItem
                      key={action.key}
                      onClick={action.onClick}
                      disabled={action.disabled || processing}
                      className={action.destructive ? 'text-red-600 focus:text-red-600' : ''}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 批量操作确认对话框
 */
export interface BatchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  count: number;
  confirmText?: string;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
}

export function BatchConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  count,
  confirmText = '确认',
  loading = false,
  variant = 'default',
}: BatchConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              variant === 'destructive' ? 'bg-red-100' : 
              variant === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              {variant === 'destructive' ? (
                <Trash2 className="h-6 w-6 text-red-600" />
              ) : (
                <Edit className="h-6 w-6 text-blue-600" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-500 mb-2">{description}</p>
            <Badge variant="secondary" className="mb-4">
              共 {count} 项
            </Badge>
            
            <div className="flex gap-3 justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={loading}
                className={variant === 'destructive' ? 'bg-red-500 hover:bg-red-600' : ''}
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 表格选择列组件
 */
export interface SelectColumnProps {
  /** 是否选中 */
  selected: boolean;
  /** 选择/取消选择 */
  onToggle: () => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export function SelectColumn({ selected, onToggle, disabled }: SelectColumnProps) {
  return (
    <Checkbox
      checked={selected}
      onCheckedChange={onToggle}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
