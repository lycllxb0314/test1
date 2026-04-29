'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, Clock, Check, AlertTriangle, Info } from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import { ClassInfo, TeacherInfo, SubjectGroup, SelectedSlot } from '../lib/types';
import { SUBJECT_ORDER, getFilteredTeachers, WEEKDAYS, getPeriodDisplay } from '../lib/schedule-rules';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedClass: ClassInfo | null;
  selectedWeekDay: number;
  selectedPeriodIndex: number;
  selectedSlot: SelectedSlot | null;
  teachers: SubjectGroup[];
  grade: number;
  onSave: (classId: string, weekDay: number, periodIndex: number, subject: string, teacherId: string, teacherName: string) => void;
}

export const SlotPickerDialog: React.FC<Props> = ({
  open, onOpenChange, selectedClass, selectedWeekDay, selectedPeriodIndex,
  selectedSlot, teachers, grade, onSave
}) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTeacher, setHoveredTeacher] = useState<TeacherInfo | null>(null);

  const filteredTeachers = useMemo(
    () => getFilteredTeachers(teachers, selectedSubject, selectedSlot, searchQuery, grade),
    [teachers, selectedSubject, selectedSlot, searchQuery, grade]
  );

  const handleSave = (teacher: TeacherInfo) => {
    if (!selectedClass) return;
    onSave(selectedClass.id, selectedWeekDay, selectedPeriodIndex, selectedSubject, teacher.id, teacher.name);
    onOpenChange(false);
    setSelectedSubject('');
    setSearchQuery('');
  };

  const dayName = WEEKDAYS[selectedWeekDay] || '';
  const periodName = getPeriodDisplay(selectedPeriodIndex);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedSubject(''); setSearchQuery(''); } }}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            排课 - {selectedClass?.name} {dayName} {periodName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* 左侧：科目选择 */}
          <div>
            <h4 className="text-sm font-medium text-stone-700 mb-2">选择科目</h4>
            <ScrollArea className="h-[400px] pr-2">
              <div className="grid grid-cols-2 gap-1.5">
                {SUBJECT_ORDER.map(subject => {
                  const colors = getSubjectColor(subject);
                  const isSelected = selectedSubject === subject;
                  return (
                    <button
                      key={subject}
                      onClick={() => { setSelectedSubject(subject); setSearchQuery(''); }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${colors.border?.replace('border-', 'ring-')}`
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* 右侧：教师选择 */}
          <div>
            <h4 className="text-sm font-medium text-stone-700 mb-2">选择教师</h4>
            {selectedSubject ? (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="搜索教师姓名..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[340px]">
                  <div className="space-y-1.5">
                    {filteredTeachers.length === 0 ? (
                      <div className="text-center py-8 text-stone-400">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">无可用教师</p>
                      </div>
                    ) : (
                      filteredTeachers.map(teacher => (
                        <button
                          key={teacher.id}
                          onClick={() => handleSave(teacher)}
                          onMouseEnter={() => setHoveredTeacher(teacher)}
                          onMouseLeave={() => setHoveredTeacher(null)}
                          className="w-full p-3 rounded-lg border border-stone-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm font-medium text-stone-600 group-hover:bg-primary/10 group-hover:text-primary">
                                {teacher.name[0]}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{teacher.name}</div>
                                <div className="text-xs text-stone-400">{teacher.subject}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-stone-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {teacher.remainingHours}/{teacher.maxHours}节
                              </div>
                              <div className={`text-xs mt-0.5 ${teacher.remainingHours > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {teacher.remainingHours > 0 ? `余${teacher.remainingHours}节` : '已满'}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {hoveredTeacher && (
                  <div className="mt-2 p-2 bg-stone-50 rounded-lg text-xs text-stone-500">
                    <Info className="h-3 w-3 inline mr-1" />
                    点击教师姓名即可排课，已用 {hoveredTeacher.usedHours}/{hoveredTeacher.maxHours} 节
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[380px] text-stone-400">
                <div className="text-center">
                  <User className="h-12 w-12 mx-auto mb-2 text-stone-300" />
                  <p className="text-sm">请先选择科目</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
