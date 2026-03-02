'use client';

/**
 * 可编辑的课表格子组件
 * 
 * 功能：
 * - 显示科目和教师
 * - 点击可编辑
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
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
  teachers: any[];
  subjectColor: string;
  draftId?: string;
  onSlotUpdate?: (slotId: string, subject: string, teacherId: string, teacherName: string) => Promise<void>;
  readOnly?: boolean;
}

export function SlotCell({
  slot,
  teachers,
  subjectColor,
  draftId,
  onSlotUpdate,
  readOnly = false,
}: SlotCellProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(slot);

  if (!slot) {
    return <div className="min-h-[60px] flex items-center justify-center text-muted-foreground text-xs">-</div>;
  }

  const handleClick = () => {
    if (!readOnly) {
      setEditDialogOpen(true);
    }
  };

  const handleSave = async (slotId: string, subject: string, teacherId: string, teacherName: string) => {
    if (onSlotUpdate) {
      await onSlotUpdate(slotId, subject, teacherId, teacherName);
      setCurrentSlot(prev => prev ? { ...prev, subject, teacherId, teacherName } : null);
    }
  };

  return (
    <>
      <div
        className={`rounded p-2 text-xs ${subjectColor} relative group cursor-pointer transition-all hover:shadow-md ${!readOnly ? 'hover:ring-2 hover:ring-primary/50' : ''}`}
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
