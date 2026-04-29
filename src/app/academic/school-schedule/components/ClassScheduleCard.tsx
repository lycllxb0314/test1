'use client';

import React from 'react';
import { getSubjectColor } from '@/lib/subject-colors';
import { getGradeSubjectHours } from '@/lib/schedule-config';
import { ClassInfo, SlotData } from '../types';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];

const getSlot = (slots: SlotData[], weekDay: number, periodIndex: number): SlotData | null => {
  return slots.find(s => s.week_day === weekDay + 1 && s.period_index === periodIndex) || null;
};

interface Props {
  cls: ClassInfo;
  classIndex: number;
  totalInGrade: number;
}

const PeriodRow: React.FC<{
  slots: SlotData[];
  periodIndices: number[];
  label: string;
}> = ({ slots, periodIndices, label }) => (
  <>
    {periodIndices.map((periodIdx) => (
      <React.Fragment key={`row-${periodIdx}`}>
        <div className="h-14 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] text-stone-400 leading-none">{label}</div>
            <div className="text-base font-bold text-stone-700">{periodIdx + 1}</div>
          </div>
        </div>
        {WEEKDAYS.map((_, dayIdx) => {
          const slot = getSlot(slots, dayIdx, periodIdx);
          const colors = slot ? getSubjectColor(slot.subject) : null;

          return (
            <div
              key={`${dayIdx}-${periodIdx}`}
              className={`h-14 rounded-xl transition-all duration-200 ${
                slot
                  ? `${colors?.bg} ${colors?.border} border shadow-sm`
                  : 'bg-stone-50 border border-dashed border-stone-200'
              }`}
            >
              <div className="h-full flex flex-col items-center justify-center px-1">
                {slot ? (
                  <>
                    <span className={`text-sm font-bold ${colors?.text} truncate max-w-full`}>
                      {slot.subject}
                    </span>
                    {slot.teacher_name && (
                      <span className="text-xs text-stone-500 truncate max-w-full">
                        {slot.teacher_name}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-sm font-light">
                    -
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </React.Fragment>
    ))}
  </>
);

export const ClassScheduleCard: React.FC<Props> = ({ cls, classIndex, totalInGrade }) => {
  const subjectCount: Record<string, number> = {};
  cls.slots.forEach(s => {
    subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
  });

  const gradeSubjectHours = getGradeSubjectHours(cls.grade);
  const totalClassSlots = cls.slots.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md hover:border-stone-200 transition-all duration-300">
      {/* 班级标题栏 */}
      <div className="px-4 py-2 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-stone-800">{cls.name}</span>
          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">
            {classIndex + 1}/{totalInGrade}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {cls.head_teacher && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">班主任</span>
              <span className="font-medium text-stone-700">{cls.head_teacher.name}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                {cls.head_teacher.primary_subject || '语文'}
              </span>
            </div>
          )}
          {cls.sub_teacher && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">副班</span>
              <span className="font-medium text-stone-700">{cls.sub_teacher.name}</span>
              <span className="text-xs text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                {cls.sub_teacher.primary_subject || '数学'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 科目课时统计栏 */}
      <div className="px-4 py-1.5 bg-stone-50/50 border-b border-stone-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-stone-500 shrink-0">课时</span>
        <div className="flex items-center gap-1 flex-wrap">
          {gradeSubjectHours.map(({ subject }) => {
            const count = subjectCount[subject] || 0;
            const colors = getSubjectColor(subject);
            return (
              <span
                key={subject}
                className={`text-xs px-1 py-0.5 rounded shrink-0 ${count > 0 ? colors.bg : 'bg-white border border-stone-200'} ${count > 0 ? colors.text : 'text-stone-400'}`}
              >
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
          {WEEKDAYS.map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-bold text-stone-600 bg-stone-100 rounded-lg">
              {day}
            </div>
          ))}

          <PeriodRow slots={cls.slots} periodIndices={[0, 1, 2]} label="上午" />

          <div className="col-span-6 h-6 flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
            <span className="px-3 text-xs text-stone-400 mx-2">午休</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
          </div>

          <PeriodRow slots={cls.slots} periodIndices={[3, 4, 5]} label="下午" />
        </div>
      </div>
    </div>
  );
};
