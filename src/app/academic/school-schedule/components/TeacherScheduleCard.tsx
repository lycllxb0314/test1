'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import { TeacherInfo, SlotData } from '../types';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];

const getSlot = (slots: SlotData[], weekDay: number, periodIndex: number): SlotData | null => {
  return slots.find(s => s.week_day === weekDay + 1 && s.period_index === periodIndex) || null;
};

interface Props {
  teacher: TeacherInfo;
  onViewDetail: (teacher: TeacherInfo) => void;
}

export const TeacherScheduleCard: React.FC<Props> = ({ teacher, onViewDetail }) => {
  const subjectColors = getSubjectColor(teacher.primary_subject);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md hover:border-stone-200 transition-all duration-300">
      {/* 教师标题栏 */}
      <div className="px-4 py-2 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${subjectColors.bg} ${subjectColors.text}`}>
            {teacher.name.slice(0, 1)}
          </div>
          <div>
            <span className="text-base font-bold text-stone-800">{teacher.name}</span>
            <div className="text-xs text-stone-500">{teacher.primary_subject}教师</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {teacher.totalHours} 节课
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => onViewDetail(teacher)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 课表网格 */}
      <div className="p-3">
        <div className="grid grid-cols-6 gap-1">
          <div className="h-6" />
          {WEEKDAYS.map(day => (
            <div key={day} className="h-6 flex items-center justify-center text-xs font-bold text-stone-600 bg-stone-100 rounded">
              {day.slice(1)}
            </div>
          ))}

          {[0, 1, 2, 3, 4, 5].map((periodIdx) => (
            <React.Fragment key={`row-${periodIdx}`}>
              <div className="h-8 flex items-center justify-center">
                <div className="text-xs font-bold text-stone-500">{periodIdx + 1}</div>
              </div>
              {WEEKDAYS.map((_, dayIdx) => {
                const slot = getSlot(teacher.slots, dayIdx, periodIdx);
                const colors = slot ? getSubjectColor(slot.subject) : null;

                return (
                  <div
                    key={`${dayIdx}-${periodIdx}`}
                    className={`h-8 rounded transition-all duration-200 ${
                      slot
                        ? `${colors?.bg} ${colors?.border} border`
                        : 'bg-stone-50 border border-stone-100'
                    }`}
                  >
                    <div className="h-full flex flex-col items-center justify-center px-0.5">
                      {slot ? (
                        <span className="text-[10px] text-stone-600 truncate max-w-full">
                          {slot.class_name?.replace('年级', '') || ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-300">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
