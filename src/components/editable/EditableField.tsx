/**
 * 可编辑字段组件
 * 
 * 用于资源详情页的编辑功能
 * 
 * @module components/editable/EditableField
 */

'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function EditableTextarea({
  value,
  onChange,
  isEditing,
  placeholder = '请输入内容',
  className,
  rows = 3,
}: EditableTextareaProps) {
  if (!isEditing) {
    return (
      <p className={cn('text-sm text-gray-700 whitespace-pre-wrap', className)}>
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </p>
    );
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn('text-sm', className)}
    />
  );
}

interface EditableInputProps {
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  placeholder?: string;
  className?: string;
}

export function EditableInput({
  value,
  onChange,
  isEditing,
  placeholder = '请输入',
  className,
}: EditableInputProps) {
  if (!isEditing) {
    return (
      <span className={cn('text-sm', className)}>
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </span>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn('text-sm h-8', className)}
    />
  );
}

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  isEditing: boolean;
  placeholder?: string;
  itemClassName?: string;
}

export function EditableList({
  items,
  onChange,
  isEditing,
  placeholder = '每行一个项目',
  itemClassName,
}: EditableListProps) {
  if (!isEditing) {
    if (!items || items.length === 0) {
      return <span className="text-gray-400 italic text-sm">暂无内容</span>;
    }
    return (
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className={cn('text-sm text-gray-700', itemClassName)}>
            • {item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Textarea
      value={items.join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
      placeholder={placeholder}
      rows={Math.max(3, items.length + 1)}
      className="text-sm"
    />
  );
}
