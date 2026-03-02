'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = ['上午1', '上午2', '上午3', '下午1', '下午2', '下午3'];

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
}

interface SlotData {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
}

interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  maxHours: number;
  usedHours: number;
  remainingHours: number;
  isHeadTeacher: boolean;
}

interface SubjectGroup {
  subject: string;
  teachers: TeacherInfo[];
}

export default function ManualSchedulePage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [schedule, setSchedule] = useState<(SlotData | null)[][]>([[], [], [], [], []]);
  const [teachersBySubject, setTeachersBySubject] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ weekDay: number; periodIndex: number } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  // 加载班级列表
  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClasses(data.data || []);
        }
      })
      .catch(console.error);
  }, []);
  
  // 加载教师列表
  useEffect(() => {
    const grade = selectedClass?.grade || 1;
    fetch(`/api/academic/manual-schedule/teachers?grade=${grade}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeachersBySubject(data.data.subjects || []);
        }
      })
      .catch(console.error);
  }, [selectedClass?.grade]);
  
  // 加载班级课表
  const loadSchedule = useCallback(async (classId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic/manual-schedule/slot?classId=${classId}`);
      const data = await res.json();
      
      if (data.success) {
        setSchedule(data.data.schedule || [[], [], [], [], []]);
      }
    } catch (err) {
      console.error('加载课表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (selectedClass) {
      loadSchedule(selectedClass.id);
    }
  }, [selectedClass, loadSchedule]);
  
  // 点击格子
  const handleSlotClick = (weekDay: number, periodIndex: number) => {
    const slot = schedule[weekDay]?.[periodIndex];
    
    setSelectedSlot({ weekDay, periodIndex });
    setSelectedSubject(slot?.subject || '');
    setSelectedTeacherId(slot?.teacher_id || '');
    setDialogOpen(true);
  };
  
  // 保存课位
  const handleSave = async () => {
    if (!selectedClass || !selectedSlot || !selectedSubject) {
      toast.error('请选择科目');
      return;
    }
    
    const teacher = teachersBySubject
      .find(g => g.subject === selectedSubject)
      ?.teachers.find(t => t.id === selectedTeacherId);
    
    try {
      const res = await fetch('/api/academic/manual-schedule/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass.id,
          className: selectedClass.name,
          grade: selectedClass.grade,
          weekDay: selectedSlot.weekDay + 1,
          periodIndex: selectedSlot.periodIndex,
          subject: selectedSubject,
          teacherId: selectedTeacherId || null,
          teacherName: teacher?.name || null,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('保存成功');
        loadSchedule(selectedClass.id);
        setDialogOpen(false);
        
        // 刷新教师课时
        const grade = selectedClass.grade;
        const teachersRes = await fetch(`/api/academic/manual-schedule/teachers?grade=${grade}`);
        const teachersData = await teachersRes.json();
        if (teachersData.success) {
          setTeachersBySubject(teachersData.data.subjects || []);
        }
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败');
    }
  };
  
  // 删除课位
  const handleDelete = async () => {
    if (!selectedClass || !selectedSlot) return;
    
    try {
      const res = await fetch(
        `/api/academic/manual-schedule/slot?classId=${selectedClass.id}&weekDay=${selectedSlot.weekDay + 1}&periodIndex=${selectedSlot.periodIndex}`,
        { method: 'DELETE' }
      );
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('删除成功');
        loadSchedule(selectedClass.id);
        setDialogOpen(false);
        
        // 刷新教师课时
        const grade = selectedClass.grade;
        const teachersRes = await fetch(`/api/academic/manual-schedule/teachers?grade=${grade}`);
        const teachersData = await teachersRes.json();
        if (teachersData.success) {
          setTeachersBySubject(teachersData.data.subjects || []);
        }
      }
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    }
  };
  
  // 获取时段名称
  const getPeriodName = (index: number, grade: number) => {
    if (index < 3) return `上午${index + 1}`;
    return `下午${index - 2}`;
  };
  
  // 判断是否可选时段
  const isSlotAvailable = (weekDay: number, periodIndex: number) => {
    // 低年级周一到周四下午只有2节
    if (selectedClass && selectedClass.grade <= 2) {
      if (weekDay < 4 && periodIndex >= 5) return false;
    }
    return true;
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">手动排课</h1>
      </div>
      
      <div className="flex gap-4">
        {/* 班级选择 */}
        <Card className="w-64">
          <CardHeader>
            <CardTitle className="text-base">选择班级</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedClass?.id || ''}
              onValueChange={(value) => {
                const cls = classes.find(c => c.id === value);
                setSelectedClass(cls || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择班级" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <div key={grade}>
                    <div className="px-2 py-1 text-xs text-muted-foreground">{grade}年级</div>
                    {classes.filter(c => c.grade === grade).map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* 教师列表 */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">教师课时统计</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {teachersBySubject.map(group => (
                  <div key={group.subject} className="space-y-1">
                    <div className="font-medium text-sm text-muted-foreground">{group.subject}</div>
                    {group.teachers.map(teacher => (
                      <div
                        key={teacher.id}
                        className={`text-sm p-1 rounded cursor-pointer hover:bg-muted ${
                          teacher.remainingHours <= 0 ? 'text-red-500' : ''
                        }`}
                      >
                        <span>{teacher.name}</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {teacher.usedHours}/{teacher.maxHours}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* 课表 */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selectedClass.name} 课表</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted w-20">节次</th>
                      {WEEKDAYS.map((day, i) => (
                        <th key={day} className="border p-2 bg-muted">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period, periodIdx) => (
                      <tr key={period}>
                        <td className="border p-2 bg-muted/50 text-center font-medium">
                          {period}
                        </td>
                        {WEEKDAYS.map((_, dayIdx) => {
                          const slot = schedule[dayIdx]?.[periodIdx];
                          const available = isSlotAvailable(dayIdx, periodIdx);
                          
                          return (
                            <td
                              key={dayIdx}
                              className={`border p-2 h-16 cursor-pointer transition-colors ${
                                available
                                  ? 'hover:bg-muted/50'
                                  : 'bg-muted/30 cursor-not-allowed'
                              }`}
                              onClick={() => available && handleSlotClick(dayIdx, periodIdx)}
                            >
                              {slot && (
                                <div className="text-center">
                                  <div className="font-medium text-sm">{slot.subject}</div>
                                  {slot.teacher_name && (
                                    <div className="text-xs text-muted-foreground">
                                      {slot.teacher_name}
                                    </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* 选课弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              安排课程 - {selectedSlot && WEEKDAYS[selectedSlot.weekDay]} {selectedSlot && getPeriodName(selectedSlot.periodIndex, selectedClass?.grade || 1)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">科目</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {teachersBySubject.map(g => (
                    <SelectItem key={g.subject} value={g.subject}>{g.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedSubject && (
              <div className="space-y-2">
                <label className="text-sm font-medium">教师</label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择教师（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不指定教师</SelectItem>
                    {teachersBySubject
                      .find(g => g.subject === selectedSubject)
                      ?.teachers.map(t => (
                        <SelectItem
                          key={t.id}
                          value={t.id}
                          disabled={t.remainingHours <= 0}
                        >
                          {t.name} ({t.usedHours}/{t.maxHours}节)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button variant="destructive" onClick={handleDelete}>
              清除
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
