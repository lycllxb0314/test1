'use client';

import React from 'react';
import { getSubjectColor } from '@/lib/subject-colors';
import { SlotData } from '../types';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];

interface Props {
  matrix: (SlotData | null)[][];
  type: 'class' | 'teacher';
}

const MatrixPeriodRow: React.FC<{
  matrix: (SlotData | null)[][];
  periodIndices: number[];
  label: string;
  type: 'class' | 'teacher';
}> = ({ matrix, periodIndices, label, type }) => (
  <>
    {periodIndices.map((periodIdx) => (
      <React.Fragment key={`row-${periodIdx}`}>
        <div className="h-16 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] text-stone-400 leading-none">{label}</div>
            <div className="text-base font-bold text-stone-700">{periodIdx + 1}</div>
          </div>
        </div>
        {matrix[periodIdx]?.map((slot, dayIdx) => {
          const colors = slot ? getSubjectColor(slot.subject) : null;
          return (
            <div
              key={`${dayIdx}-${periodIdx}`}
              className={`h-16 rounded-xl ${
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
                    <span className="text-xs text-stone-500 truncate max-w-full">
                      {type === 'class' ? slot.teacher_name : slot.class_name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-stone-300">空</span>
                )}
              </div>
            </div>
          );
        })}
      </React.Fragment>
    ))}
  </>
);

export const ScheduleMatrix: React.FC<Props> = ({ matrix, type }) => (
  <div className="overflow-x-auto">
    <div className="grid grid-cols-6 gap-1.5 p-4">
      <div className="h-10" />
      {WEEKDAYS.map(day => (
        <div key={day} className="h-10 flex items-center justify-center text-sm font-bold text-stone-600 bg-stone-100 rounded-lg">
          {day}
        </div>
      ))}

      <MatrixPeriodRow matrix={matrix} periodIndices={[0, 1, 2]} label="上午" type={type} />

      <div className="col-span-6 h-6 flex items-center justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
        <span className="px-3 text-xs text-stone-400 mx-2">午休</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      </div>

      <MatrixPeriodRow matrix={matrix} periodIndices={[3, 4, 5]} label="下午" type={type} />
    </div>
  </div>
);
