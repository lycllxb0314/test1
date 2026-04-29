'use client';

import React from 'react';
import { getSubjectColor } from '@/lib/subject-colors';
import { getGradeSubjectHours } from '@/lib/schedule-config';
import { ClassInfo, SlotData } from '../lib/types';
import { WEEKDAYS, isSlotAvailable } from '../lib/schedule-rules';

interface Props {
  cls: ClassInfo;
  classIndex: number;
  totalInGrade: number;
  grade: number;
  slots: SlotData[];
  onSlotClick: (cls: ClassInfo, weekDay: number, periodIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, cls: ClassInfo, weekDay: number, periodIndex: number) => void;
}

const getSlot = (slots: SlotData[], weekDay: number, periodIndex: number): SlotData | null => {
  return slots.find(s => s.week_day === weekDay + 1 && s.period_index === periodIndex) || null;
};

export const ScheduleClassCard: React.FC<Props> = ({ cls, classIndex, totalInGrade, grade, slots, onSlotClick, onContextMenu }) => {
  const subjectCount: Record<string, number> = {};
  slots.forEach(s => {
    subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
  });
  const gradeSubjectHours = getGradeSubjectHours(grade);
  const totalClassSlots = slots.length;

  const renderPeriodRow = (periodIdx: number) => {
    const isMorning = periodIdx < 3;
    const slot = getSlot(slots, 0, periodIdx); // just for type reference
    return (
      <div key={`row-${periodIdx}`} className="contents">
        <div className="h-14 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] text-stone-400 leading-none">{isMorning ? '上午' : '下午'}</div>
            <div className="text-base font-bold text-stone-700">{periodIdx + 1}</div>
          </div>
        </div>
        {WEEKDAYS.map((_, dayIdx) => {
          const s = getSlot(slots, dayIdx, periodIdx);
          const available = isSlotAvailable(grade, dayIdx, periodIdx);
          const colors = s ? getSubjectColor(s.subject) : null;
          return (
            <div
              key={`${dayIdx}-${periodIdx}`}
              className={`h-14 rounded-xl transition-all duration-200 ${
                available ? 'cursor-pointer hover:scale-[1.02] hover:z-10' : 'bg-stone-50/50'
              } ${
                s
                  ? `${colors?.bg} ${colors?.border} border shadow-sm hover:shadow-md`
                  : available
                    ? 'bg-stone-50 hover:bg-amber-50 border border-dashed border-stone-200 hover:border-amber-300'
                    : ''
              }`}
              onClick={() => available && onSlotClick(cls, dayIdx, periodIdx)}
              onContextMenu={(e) => onContextMenu(e, cls, dayIdx, periodIdx)}
            >
              {available && (
                <div className="h-full flex flex-col items-center justify-center px-1">
                  {s ? (
                    <>
                      <span className={`text-sm font-bold ${colors?.text} truncate max-w-full`}>{s.subject}</span>
                      {s.teacher_name && <span className="text-xs text-stone-500 truncate max-w-full">{s.teacher_name}</span>}
                    </>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-sm font-light hover:border-amber-400 hover:text-amber-500 transition-colors">+</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md hover:border-stone-200 transition-all duration-300">
      {/* 班级标题栏 */}
      <div className="px-4 py-2 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-stone-800">{cls.name}</span>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{classIndex + 1}/{totalInGrade}</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {cls.headTeacher && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">班主任</span>
              <span className="font-medium text-stone-700">{cls.headTeacherName}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{cls.headTeacher?.primarySubject || '语文'}</span>
            </div>
          )}
          {cls.subTeacher && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">副班</span>
              <span className="font-medium text-stone-700">{cls.subTeacherName}</span>
              <span className="text-xs text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">{cls.subTeacher?.primarySubject || '数学'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 科目课时统计栏 */}
      <div className="px-4 py-1.5 bg-stone-50/50 border-b border-stone-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-stone-500 shrink-0">课时</span>
        <div className="flex items-center gap-1">
          {gradeSubjectHours.map(({ subject }) => {
            const count = subjectCount[subject] || 0;
            const colors = getSubjectColor(subject);
            return (
              <span key={subject} className={`text-xs px-1 py-0.5 rounded shrink-0 ${count > 0 ? colors.bg + ' ' + colors.text : 'bg-white border border-stone-200 text-stone-400'}`}>
                {subject}{count}
              </span>
            );
          })}
        </div>
        <span className="text-xs text-stone-500 ml-auto shrink-0 font-medium">共{totalClassSlots}节</span>
      </div>

      {/* 课表网格 */}
      <div className="p-3">
        <div className="grid grid-cols-6 gap-1.5">
          <div className="h-8" />
          {WEEKDAYS.map(day => <div key={day} className="h-8 flex items-center justify-center text-sm font-bold text-stone-600 bg-stone-100 rounded-lg">{day}</div>)}
          {[0, 1, 2].map(renderPeriodRow)}
          <div className="col-span-6 h-6 flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
            <span className="px-3 text-xs text-stone-400 mx-2">午休</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
          </div>
          {[3, 4, 5].map(renderPeriodRow)}
        </div>
      </div>
    </div>
  );
};
