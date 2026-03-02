'use client';

/**
 * 可编辑的课表格子组件
 * 
 * 功能：
 * - 显示科目和教师
 * - 点击可编辑
 * - 支持空槽人工分配
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus } from 'lucide-react';
import { ScheduleEditDialog } from './ScheduleEditDialog';

interface SlotCellProps {
  slot: {
    id?: string;
    classId: string;
    className: string;
    grade: number;
    weekDay: number;
    periodIndex: number;
    periodName?: string;
    subject: string;
    teacherId: string;
    teacherName: string;
  } | null;
  // 空槽时使用的数据
  emptySlotData?: {
    classId: string;
    className: string;
    grade: number;
    weekDay: number;
    periodIndex: number;
    periodName: string;
  };
  teachers: any[];
  subjectColor?: string;
  draftId?: string;
  onSlotUpdate?: (slotId: string, subject: string, teacherId: string, teacherName: string) => Promise<void>;
  onSlotCreate?: (slotData: {
    classId: string;
    className: string;
    grade: number;
    weekDay: number;
    periodIndex: number;
    periodName: string;
    subject: string;
    teacherId: string;
    teacherName: string;
  }) => Promise<void>;
  readOnly?: boolean;
}

export function SlotCell({
  slot,
  emptySlotData,
  teachers,
  subjectColor,
  draftId,
  onSlotUpdate,
  onSlotCreate,
  readOnly = false,
}: SlotCellProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(slot);

  const handleClick = () => {
    if (!readOnly) {
      setEditDialogOpen(true);
    }
  };

  const handleSave = async (slotId: string, subject: string, teacherId: string, teacherName: string) => {
    if (slot && onSlotUpdate) {
      // 更新已有课时
      await onSlotUpdate(slotId, subject, teacherId, teacherName);
      setCurrentSlot(prev => prev ? { ...prev, subject, teacherId, teacherName } : null);
    } else if (!slot && onSlotCreate) {
      // 创建新课时
      // 这里 slotId 实际上是临时的，需要从外部传入完整数据
    }
  };

  const handleCreate = async (subject: string, teacherId: string, teacherName: string, slotData: any) => {
    if (onSlotCreate) {
      await onSlotCreate({
        ...slotData,
        subject,
        teacherId,
        teacherName,
      });
    }
  };

  // 空槽显示
  if (!slot) {
    return (
      <>
        <div
          className="min-h-[60px] flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
          onClick={handleClick}
        >
          <Plus className="h-4 w-4 text-muted-foreground/50" />
        </div>

        {!readOnly && emptySlotData && (
          <ScheduleEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            slot={null}
            teachers={teachers}
            isNewSlot={true}
            emptySlotData={emptySlotData}
            onSave={() => Promise.resolve()}
            onCreate={async (subject, teacherId, teacherName, slotData) => {
              if (onSlotCreate) {
                await onSlotCreate({
                  ...slotData,
                  subject,
                  teacherId,
                  teacherName,
                });
              }
            }}
          />
        )}
      </>
    );
  }

  // 已有课时显示
  return (
    <>
      <div
        className={`rounded p-2 text-xs ${subjectColor || 'bg-gray-100 text-gray-700 border-gray-300'} relative group cursor-pointer transition-all hover:shadow-md ${!readOnly ? 'hover:ring-2 hover:ring-primary/50' : ''}`}
        onClick={handleClick}
      >
        <div className="font-medium">{currentSlot?.subject || slot.subject}</div>
        <div className="text-muted-foreground text-[10px]">{currentSlot?.teacherName || slot.teacherName}</div>
        {!readOnly && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-3 w-3" />
          </div>
        )}
      </div>

      {!readOnly && (
        <ScheduleEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          slot={{
            id: slot.id || '',
            classId: slot.classId,
            className: slot.className,
            grade: slot.grade,
            weekDay: slot.weekDay,
            periodIndex: slot.periodIndex,
            periodName: slot.periodName || '',
            subject: currentSlot?.subject || slot.subject,
            teacherId: currentSlot?.teacherId || slot.teacherId,
            teacherName: currentSlot?.teacherName || slot.teacherName,
          }}
          teachers={teachers}
          onSave={handleSave}
        />
      )}
    </>
  );
}
