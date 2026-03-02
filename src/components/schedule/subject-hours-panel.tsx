'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGradeSubjectHours, getGradeTotalHours, GRADE_CHINESE } from '@/lib/schedule-config';
import { SUBJECT_COLORS } from '@/lib/subject-colors';

interface SubjectHoursPanelProps {
  grade: number;
}

export function SubjectHoursPanel({ grade }: SubjectHoursPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const subjectHours = getGradeSubjectHours(grade);
  const totalHours = getGradeTotalHours(grade);
  const gradeName = GRADE_CHINESE[grade] || grade;

  // 初始化位置（右下角）
  useEffect(() => {
    const savedPos = localStorage.getItem('subjectHoursPanelPos');
    if (savedPos) {
      try {
        setPosition(JSON.parse(savedPos));
      } catch {
        // 默认位置
        setPosition({ x: -20, y: 100 });
      }
    } else {
      // 默认在右侧
      setPosition({ x: -20, y: 100 });
    }
  }, []);

  // 保存位置
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    localStorage.setItem('subjectHoursPanelPos', JSON.stringify(pos));
  }, []);

  // 拖动开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // 拖动中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 获取窗口尺寸
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const panelWidth = panelRef.current?.offsetWidth || 280;
      const panelHeight = panelRef.current?.offsetHeight || 200;

      // 计算相对右下角的位置（用于存储）
      const relativeX = newX - (windowWidth - panelWidth);
      const relativeY = newY;

      // 边界限制
      const boundedX = Math.max(-panelWidth + 100, Math.min(windowWidth - 100, newX));
      const boundedY = Math.max(80, Math.min(windowHeight - 50, newY));

      setPosition({
        x: relativeX,
        y: boundedY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      savePosition(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, savePosition]);

  // 计算实际位置
  const getActualPosition = useCallback(() => {
    if (typeof window === 'undefined') return { right: 20, top: position.y };
    const windowWidth = window.innerWidth;
    const panelWidth = panelRef.current?.offsetWidth || 280;
    return {
      right: Math.max(20, -position.x),
      top: position.y,
    };
  }, [position]);

  if (!visible) return null;

  const actualPos = getActualPosition();

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden transition-shadow",
        isDragging ? "shadow-2xl cursor-grabbing" : "cursor-default"
      )}
      style={{
        right: actualPos.right,
        top: actualPos.top,
        maxWidth: '320px',
      }}
    >
      {/* 拖动头部 */}
      <div
        data-drag-handle
        onMouseDown={handleMouseDown}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-stone-100 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-stone-400" />
        <BookOpen className="w-4 h-4 text-amber-500" />
        <span className="font-bold text-stone-800 text-sm flex-1">{gradeName}年级课时参考</span>
        <span className="text-xs text-stone-500">建议{totalHours}节</span>
        <button
          onClick={() => setVisible(false)}
          className="ml-1 p-0.5 rounded hover:bg-stone-200 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-stone-400" />
        </button>
      </div>

      {/* 折叠/展开按钮 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-stone-50 transition-colors border-b border-stone-100"
      >
        <span className="text-xs text-stone-500">{collapsed ? '展开详情' : '收起'}</span>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
        )}
      </button>

      {/* 内容 */}
      {!collapsed && (
        <div className="p-3">
          {/* 学科课时列表 - 紧凑横排布局 */}
          <div className="flex flex-wrap gap-1.5">
            {subjectHours.map(({ subject, hours }) => {
              const colors = SUBJECT_COLORS[subject] || { bg: 'bg-neutral-100', text: 'text-neutral-700' };

              return (
                <div 
                  key={subject} 
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md",
                    colors.bg, colors.text
                  )}
                >
                  <span className="font-semibold text-xs">{subject}</span>
                  <span className="text-[10px] opacity-70">{hours}</span>
                </div>
              );
            })}
          </div>

          {/* 提示 */}
          <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
            💡 参考课时，可灵活调整
          </div>
        </div>
      )}
    </div>
  );
}
