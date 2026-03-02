'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/useClasses';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const MORNING_PERIODS = ['第1节', '第2节', '第3节'];
const AFTERNOON_PERIODS = ['第4节', '第5节', '第6节'];

interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  maxHours: number;
  usedHours: number;
  remainingHours: number;
}

interface SubjectGroup {
  subject: string;
  teachers: TeacherInfo[];
}

interface SlotData {
  id: string;
  class_id: string;
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
}

export default function GradeSchedulePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade: gradeParam } = use(params);
  const grade = parseInt(gradeParam);
  const { classes, loading: classesLoading, getClassesByGrade } = useClasses();
  const [gradeClasses, setGradeClasses] = useState<any[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<string, SlotData[]>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    classId: string;
    className: string;
    weekDay: number;
    periodIndex: number;
    currentSubject?: string;
    currentTeacherId?: string;
    currentTeacherName?: string;
  } | null>(null);
  
  // 教师搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teachers, setTeachers] = useState<SubjectGroup[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // 获取年级班级
  useEffect(() => {
    if (!classesLoading) {
      const gradeCls = getClassesByGrade(grade);
      setGradeClasses(gradeCls);
    }
  }, [classesLoading, classes, grade, getClassesByGrade]);

  // 加载年级课表
  const loadGradeSchedule = useCallback(async () => {
    if (gradeClasses.length === 0) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/manual-schedule/grade?grade=${grade}`);
      const data = await res.json();
      
      if (data.success) {
        const map = new Map<string, SlotData[]>();
        for (const item of data.data.scheduleData || []) {
          map.set(item.classId, item.slots || []);
        }
        setSchedulesMap(map);
      }
    } catch (err) {
      console.error('加载课表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [gradeClasses, grade]);

  useEffect(() => {
    loadGradeSchedule();
  }, [loadGradeSchedule]);

  // 加载教师列表
  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await fetch(`/api/academic/manual-schedule/teachers?grade=${grade}`);
      const data = await res.json();
      
      if (data.success) {
        setTeachers(data.data.subjects || []);
      }
    } catch (err) {
      console.error('加载教师失败:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // 获取某个班级某个时段的课程
  const getSlot = (classId: string, weekDay: number, periodIndex: number): SlotData | null => {
    const slots = schedulesMap.get(classId) || [];
    return slots.find(s => s.week_day === weekDay + 1 && s.period_index === periodIndex) || null;
  };

  // 点击格子
  const handleSlotClick = (classId: string, className: string, weekDay: number, periodIndex: number) => {
    const slot = getSlot(classId, weekDay, periodIndex);
    
    setSelectedSlot({
      classId,
      className,
      weekDay,
      periodIndex,
      currentSubject: slot?.subject || undefined,
      currentTeacherId: slot?.teacher_id || undefined,
      currentTeacherName: slot?.teacher_name || undefined,
    });
    setSearchQuery('');
    setSelectedSubject(slot?.subject || '');
    setDialogOpen(true);
    loadTeachers();
  };

  // 选择教师
  const handleSelectTeacher = async (teacher: TeacherInfo | null) => {
    if (!selectedSlot) return;
    
    const subjectToUse = selectedSubject || selectedSlot.currentSubject;
    if (!subjectToUse) {
      toast.error('请先选择科目');
      return;
    }
    
    try {
      const res = await fetch('/api/academic/manual-schedule/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedSlot.classId,
          className: selectedSlot.className,
          grade,
          weekDay: selectedSlot.weekDay + 1,
          periodIndex: selectedSlot.periodIndex,
          subject: subjectToUse,
          teacherId: teacher?.id || null,
          teacherName: teacher?.name || null,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('保存成功');
        setDialogOpen(false);
        loadGradeSchedule();
        loadTeachers();
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败');
    }
  };

  // 清除格子
  const handleClearSlot = async () => {
    if (!selectedSlot) return;
    
    try {
      const res = await fetch(
        `/api/academic/manual-schedule/slot?classId=${selectedSlot.classId}&weekDay=${selectedSlot.weekDay + 1}&periodIndex=${selectedSlot.periodIndex}`,
        { method: 'DELETE' }
      );
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('已清除');
        setDialogOpen(false);
        loadGradeSchedule();
        loadTeachers();
      }
    } catch (err) {
      console.error('清除失败:', err);
      toast.error('清除失败');
    }
  };

  // 筛选教师
  const filteredTeachers = teachers
    .filter(g => !selectedSubject || g.subject === selectedSubject)
    .flatMap(g => g.teachers)
    .filter(t => !searchQuery || t.name.includes(searchQuery) || t.subject.includes(searchQuery));

  // 获取时段显示名称
  const getPeriodDisplay = (index: number) => {
    if (index < 3) return MORNING_PERIODS[index];
    return AFTERNOON_PERIODS[index - 3];
  };

  // 判断是否可选时段
  const isSlotAvailable = (weekDay: number, periodIndex: number) => {
    if (grade <= 2 && weekDay < 4 && periodIndex >= 5) return false;
    return true;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{grade}年级排课</h1>
        <p className="text-sm text-muted-foreground">点击课表格子安排课程</p>
      </div>

      {(classesLoading || loading) ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">加载中...</div>
      ) : (
        <div className="space-y-6">
          {gradeClasses.map(cls => (
            <Card key={cls.id} className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{cls.name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm">
                    {cls.headTeacher && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">班主任</span>
                        <Badge variant="outline" className="font-normal">{cls.headTeacherName}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ({cls.headTeacher?.subject || '语文'})
                        </span>
                      </div>
                    )}
                    {cls.subTeacher && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">副班</span>
                        <Badge variant="outline" className="font-normal">{cls.subTeacherName}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ({cls.subTeacher?.subject || '数学'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                      <th className="border-b border-r w-16 py-2 text-center font-medium text-muted-foreground">节次</th>
                      {WEEKDAYS.map((day, i) => (
                        <th key={day} className="border-b py-2 text-center font-medium text-muted-foreground">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4, 5].map(periodIdx => (
                      <tr key={periodIdx} className={periodIdx === 3 ? 'border-t-2 border-t-slate-200 dark:border-t-slate-700' : ''}>
                        <td className="border-r py-1 text-center text-xs text-muted-foreground bg-slate-50/30 dark:bg-slate-900/20">
                          {getPeriodDisplay(periodIdx)}
                        </td>
                        {WEEKDAYS.map((_, dayIdx) => {
                          const slot = getSlot(cls.id, dayIdx, periodIdx);
                          const available = isSlotAvailable(dayIdx, periodIdx);
                          
                          return (
                            <td
                              key={dayIdx}
                              className={`h-10 border-b ${available ? 'cursor-pointer hover:bg-primary/5 transition-colors' : 'bg-slate-100/50 dark:bg-slate-900/30'}`}
                              onClick={() => available && handleSlotClick(cls.id, cls.name, dayIdx, periodIdx)}
                            >
                              {available && (
                                <div className="h-full flex flex-col items-center justify-center">
                                  {slot ? (
                                    <>
                                      <span className="font-medium text-sm">{slot.subject}</span>
                                      {slot.teacher_name && (
                                        <span className="text-xs text-muted-foreground">{slot.teacher_name}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-300 dark:text-slate-600">+</span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 选课弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedSlot?.className} · {selectedSlot && WEEKDAYS[selectedSlot.weekDay]} {selectedSlot && getPeriodDisplay(selectedSlot.periodIndex)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* 当前状态 */}
            {selectedSlot?.currentSubject && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div>
                  <span className="font-medium">{selectedSlot.currentSubject}</span>
                  {selectedSlot.currentTeacherName && (
                    <span className="text-muted-foreground ml-2">- {selectedSlot.currentTeacherName}</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearSlot} className="text-destructive hover:text-destructive">
                  清除
                </Button>
              </div>
            )}
            
            {/* 科目筛选 */}
            <div>
              <label className="text-sm font-medium mb-2 block">选择科目</label>
              <div className="flex flex-wrap gap-1.5">
                {teachers.map(g => (
                  <button
                    key={g.subject}
                    onClick={() => setSelectedSubject(selectedSubject === g.subject ? '' : g.subject)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      selectedSubject === g.subject
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200'
                    }`}
                  >
                    {g.subject}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 教师搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索教师姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* 教师列表 */}
            <ScrollArea className="h-56 border rounded-lg">
              {loadingTeachers ? (
                <div className="p-4 text-center text-muted-foreground text-sm">加载中...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">未找到教师</div>
              ) : (
                <div className="divide-y">
                  {filteredTeachers.map(teacher => (
                    <button
                      key={teacher.id}
                      onClick={() => handleSelectTeacher(teacher)}
                      disabled={teacher.remainingHours <= 0}
                      className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between ${
                        teacher.remainingHours <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium">{teacher.name}</div>
                        <div className="text-xs text-muted-foreground">{teacher.subject}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={teacher.remainingHours > 0 ? 'secondary' : 'destructive'} className="font-normal">
                          {teacher.usedHours}/{teacher.maxHours}节
                        </Badge>
                        {teacher.remainingHours > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            剩余 {teacher.remainingHours} 节
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {/* 不指定教师 */}
            {selectedSubject && (
              <button
                onClick={() => handleSelectTeacher(null)}
                className="w-full p-2 text-sm text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors border border-dashed"
              >
                不指定教师（仅安排科目）
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
