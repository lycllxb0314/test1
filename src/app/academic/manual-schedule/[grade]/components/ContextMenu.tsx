'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Eraser, ArrowRightLeft, X } from 'lucide-react';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  classId: string;
  className: string;
  weekDay: number;
  periodIndex: number;
  hasSlot: boolean;
  slotSubject?: string;
  slotTeacherId?: string;
  slotTeacherName?: string;
}

interface Props {
  menu: ContextMenuState;
  onClose: () => void;
  onClear: (classId: string, weekDay: number, periodIndex: number) => void;
  onCopySlot: (classId: string, weekDay: number, periodIndex: number) => void;
  onPasteSlot: (classId: string, weekDay: number, periodIndex: number) => void;
  hasCopiedSlot: boolean;
}

export const ScheduleContextMenu: React.FC<Props> = ({ menu, onClose, onClear, onCopySlot, onPasteSlot, hasCopiedSlot }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (menu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menu.visible, onClose]);

  if (!menu.visible) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 min-w-[180px] animate-in fade-in-0 zoom-in-95"
      style={{ left: menu.x, top: menu.y }}
    >
      <div className="px-3 py-1.5 border-b border-stone-100 mb-1">
        <div className="text-xs font-medium text-stone-800">{menu.className}</div>
        <div className="text-[10px] text-stone-400">
          {['周一','周二','周三','周四','周五'][menu.weekDay]} 第{menu.periodIndex + 1}节
          {menu.hasSlot && <span className="ml-1 text-stone-500">· {menu.slotSubject} - {menu.slotTeacherName}</span>}
        </div>
      </div>

      {menu.hasSlot && (
        <button
          onClick={() => { onClear(menu.classId, menu.weekDay, menu.periodIndex); onClose(); }}
          className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Eraser className="h-3.5 w-3.5" />清空此节
        </button>
      )}

      {menu.hasSlot && (
        <button
          onClick={() => { onCopySlot(menu.classId, menu.weekDay, menu.periodIndex); onClose(); }}
          className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />复制此节
        </button>
      )}

      {hasCopiedSlot && (
        <button
          onClick={() => { onPasteSlot(menu.classId, menu.weekDay, menu.periodIndex); onClose(); }}
          className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />粘贴到此节
        </button>
      )}

      <button
        onClick={() => { onClose(); }}
        className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-stone-50 text-stone-500 transition-colors"
      >
        <X className="h-3.5 w-3.5" />取消
      </button>
    </div>
  );
};
