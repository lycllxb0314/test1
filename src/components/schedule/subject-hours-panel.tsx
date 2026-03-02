'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGradeSubjectHours, getGradeTotalHours, GRADE_CHINESE } from '@/lib/schedule-config';
import { SUBJECT_COLORS } from '@/lib/subject-colors';

interface SubjectHoursPanelProps {
  grade: number;
}

export function SubjectHoursPanel({ grade }: SubjectHoursPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const subjectHours = getGradeSubjectHours(grade);
  const totalHours = getGradeTotalHours(grade);
  const gradeName = GRADE_CHINESE[grade] || grade;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      {/* 头部 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-stone-50 to-white hover:from-stone-100 hover:to-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-stone-800">{gradeName}年级课时参考</span>
          <span className="text-xs text-stone-500 font-normal">（每周）</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">建议 {totalHours} 节</span>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          )}
        </div>
      </button>

      {/* 内容 */}
      {!collapsed && (
        <div className="p-4">
          {/* 学科课时列表 - 紧凑横排布局 */}
          <div className="flex flex-wrap gap-2">
            {subjectHours.map(({ subject, hours }) => {
              const colors = SUBJECT_COLORS[subject] || { bg: 'bg-neutral-100', text: 'text-neutral-700' };

              return (
                <div 
                  key={subject} 
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    colors.bg, colors.text
                  )}
                >
                  <span className="font-semibold text-sm">{subject}</span>
                  <span className="text-xs opacity-70">{hours}节</span>
                </div>
              );
            })}
          </div>

          {/* 提示 */}
          <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-400">
            💡 以上为参考课时，可根据实际情况灵活调整
          </div>
        </div>
      )}
    </div>
  );
}
