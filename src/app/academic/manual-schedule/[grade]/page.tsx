'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Save, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';

import { getSubjectColor } from '@/lib/subject-colors';
import { getGradeSubjectHours } from '@/lib/schedule-config';
import { useClasses } from '@/hooks/useClasses';
import { SubjectHoursPanel } from '@/components/schedule/subject-hours-panel';

import type { SlotData, ClassInfo, TeacherInfo, SubjectGroup, ScheduleStatus, SelectedSlot } from './lib/types';
import { WEEKDAYS } from './lib/schedule-rules';
import { ScheduleClassCard } from './components/ScheduleClassCard';
import { SlotPickerDialog } from './components/SlotPickerDialog';
import { ScheduleContextMenu } from './components/ContextMenu';

export type { SlotData, ClassInfo, TeacherInfo, SubjectGroup } from './lib/types';

export default function ManualSchedulePage() {
  const params = useParams();
  const grade = Number(params.grade);

  // 基础状态
  const { classes: rawClasses, loading: classesLoading } = useClasses({ grade });
  const [schedulesMap, setSchedulesMap] = useState<Map<string, SlotData[]>>(new Map());
  const [teachers, setTeachers] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ScheduleStatus | null>(null);

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    classId: string; className: string; weekDay: number; periodIndex: number;
    currentSubject?: string; currentTeacherId?: string; currentTeacherName?: string;
    headTeacherId?: string; headTeacherName?: string;
    chineseTeacherId?: string; chineseTeacherName?: string;
    mathTeacherId?: string; mathTeacherName?: string;
    classTeacherBySubject?: Record<string, { id: string; name: string }[]>;
  } | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; classId: string; weekDay: number; periodIndex: number; hasSlot: boolean;
  } | null>(null);

  // 剪贴板
  const [clipboard, setClipboard] = useState<{ subject: string; teacherId: string | null; teacherName: string | null } | null>(null);

  // 获取课表数据
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academic/schedule/grade?grade=${grade}`);
      const data = await res.json();
      if (data.success && data.data?.scheduleData) {
        const map = new Map<string, SlotData[]>();
        data.data.scheduleData.forEach((item: { classId: string; slots: SlotData[] }) => {
          map.set(item.classId, item.slots);
        });
        setSchedulesMap(map);
      }
      if (data.data?.status) setStatus(data.data.status);
    } catch (err) {
      console.error('获取课表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [grade]);

  // 获取教师数据
  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch(`/api/academic/schedule/teachers?grade=${grade}`);
      const data = await res.json();
      if (data.success) {
        setTeachers(data.data.subjects || data.data || []);
      }
    } catch (err) {
      console.error('获取教师失败:', err);
    }
  }, [grade]);

  useEffect(() => {
    fetchSchedules();
    fetchTeachers();
  }, [fetchSchedules, fetchTeachers]);

  // 获取某个班级某个时间节的课程
  const getSlot = useCallback((classId: string, weekDay: number, periodIndex: number) => {
    const slots = schedulesMap.get(classId) || [];
    return slots.find(s => s.week_day === weekDay + 1 && s.period_index === periodIndex) || null;
  }, [schedulesMap]);

  // 判断是否可选时段
  const isSlotAvailable = useCallback((weekDay: number, periodIndex: number) => {
    if (grade <= 2 && weekDay < 4 && periodIndex >= 5) return false;
    return true;
  }, [grade]);

  // 点击空格子弹窗
  const handleSlotClick = useCallback((cls: ClassInfo, weekDay: number, periodIndex: number) => {
    const slot = getSlot(cls.id, weekDay, periodIndex);
    const classSlots = schedulesMap.get(cls.id) || [];

    // 计算本班各科目已排教师
    const classTeacherBySubject: Record<string, { id: string; name: string }[]> = {};
    classSlots.forEach(s => {
      if (s.teacher_id && s.teacher_name) {
        if (!classTeacherBySubject[s.subject]) classTeacherBySubject[s.subject] = [];
        if (!classTeacherBySubject[s.subject].some(t => t.id === s.teacher_id)) {
          classTeacherBySubject[s.subject].push({ id: s.teacher_id, name: s.teacher_name });
        }
      }
    });

    setSelectedSlot({
      classId: cls.id,
      className: cls.name,
      weekDay,
      periodIndex,
      currentSubject: slot?.subject || undefined,
      currentTeacherId: slot?.teacher_id || undefined,
      currentTeacherName: slot?.teacher_name || undefined,
      headTeacherId: cls.headTeacherId || (cls.headTeacher as any)?.id || undefined,
      headTeacherName: cls.headTeacherName || (cls.headTeacher as any)?.name || undefined,
      chineseTeacherId: cls.headTeacherId || undefined,
      chineseTeacherName: cls.headTeacherName || undefined,
      mathTeacherId: cls.subTeacherId || undefined,
      mathTeacherName: cls.subTeacherName || undefined,
      classTeacherBySubject,
    });
    setDialogOpen(true);
  }, [getSlot, schedulesMap]);

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, cls: ClassInfo, weekDay: number, periodIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const slot = getSlot(cls.id, weekDay, periodIndex);
    setContextMenu({
      x: e.clientX, y: e.clientY,
      classId: cls.id, weekDay, periodIndex,
      hasSlot: !!slot,
    });
  }, [getSlot]);

  const handleCopySlot = useCallback((classId: string, weekDay: number, periodIndex: number) => {
    const slot = getSlot(classId, weekDay, periodIndex);
    if (slot) {
      setClipboard({ subject: slot.subject, teacherId: slot.teacher_id, teacherName: slot.teacher_name });
    }
    setContextMenu(null);
  }, [getSlot]);

  const handlePasteSlot = useCallback((classId: string, weekDay: number, periodIndex: number) => {
    if (!clipboard) return;
    const newSlot: SlotData = {
      id: crypto.randomUUID(),
      class_id: classId,
      subject: clipboard.subject,
      teacher_id: clipboard.teacherId,
      teacher_name: clipboard.teacherName,
      week_day: weekDay + 1,
      period_index: periodIndex,
    };
    setSchedulesMap(prev => {
      const map = new Map(prev);
      const slots = [...(map.get(classId) || [])];
      const idx = slots.findIndex(s => s.week_day === weekDay + 1 && s.period_index === periodIndex);
      if (idx >= 0) slots[idx] = newSlot;
      else slots.push(newSlot);
      map.set(classId, slots);
      return map;
    });
    setContextMenu(null);
  }, [clipboard]);

  const handleContextMenuClear = useCallback((classId: string, weekDay: number, periodIndex: number) => {
    setSchedulesMap(prev => {
      const map = new Map(prev);
      const slots = (map.get(classId) || []).filter(
        s => !(s.week_day === weekDay + 1 && s.period_index === periodIndex)
      );
      map.set(classId, slots);
      return map;
    });
    setContextMenu(null);
  }, []);

  // 保存草稿
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const allSlots = Array.from(schedulesMap.values()).flat();
      const res = await fetch(`/api/academic/schedule/grade?grade=${grade}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: allSlots, status: 'draft' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('草稿保存成功');
        fetchSchedules();
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (err) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [schedulesMap, grade, fetchSchedules]);

  // 刷新
  const handleRefresh = useCallback(() => {
    fetchSchedules();
    fetchTeachers();
  }, [fetchSchedules, fetchTeachers]);

  // 点击空白关闭右键菜单
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  // 加载教师数据（弹窗打开时）
  useEffect(() => {
    if (dialogOpen && teachers.length === 0) {
      setLoadingTeachers(true);
      fetchTeachers().finally(() => setLoadingTeachers(false));
    }
  }, [dialogOpen, teachers.length, fetchTeachers]);

  // 将 ClassContainer 映射为 ClassInfo
  const gradeClasses: ClassInfo[] = rawClasses.map(cls => ({
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    headTeacherId: cls.headTeacherId,
    headTeacherName: cls.headTeacherName,
    headTeacher: cls.headTeacher ? { id: cls.headTeacher.id, name: cls.headTeacher.name, primarySubject: cls.headTeacher.primarySubject || '' } : undefined,
    subTeacherId: cls.subTeacherId,
    subTeacherName: cls.subTeacherName,
    subTeacher: cls.subTeacher ? { id: cls.subTeacher.id, name: cls.subTeacher.name, primarySubject: cls.subTeacher.primarySubject || '' } : undefined,
  }));

  // 计算统计
  const totalSlots = Array.from(schedulesMap.values()).reduce((acc, slots) => acc + slots.length, 0);
  const gradeChinese = ['一', '二', '三', '四', '五', '六'][grade - 1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* 页面头部 */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                <span className="text-white font-bold text-lg">{gradeChinese}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900 tracking-tight">{gradeChinese}年级课程表</h1>
                <p className="text-sm text-stone-500">共 {gradeClasses.length} 个班级 · 已安排 {totalSlots} 节课</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {status && (
                <div className="flex items-center gap-4 text-sm mr-4">
                  {status.hasDraft && (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                      <FileText className="w-3.5 h-3.5" />
                      <span>有草稿 ({status.draftSlotsCount}节)</span>
                    </div>
                  )}
                  {status.hasOfficial && (
                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                      <Database className="w-3.5 h-3.5" />
                      <span>已定稿 ({status.officialSlotsCount}节)</span>
                    </div>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-1.5">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />刷新
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving || totalSlots === 0} className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50">
                <Save className="w-4 h-4" />{saving ? '保存中...' : '保存草稿'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <SubjectHoursPanel grade={grade} />

        {(classesLoading || loading) ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
            <span>加载课表数据...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {gradeClasses.map((cls, classIndex) => (
              <ScheduleClassCard
                key={cls.id}
                cls={cls}
                classIndex={classIndex}
                totalInGrade={gradeClasses.length}
                grade={grade}
                slots={schedulesMap.get(cls.id) || []}
                onSlotClick={handleSlotClick}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* 选课弹窗 */}
      <SlotPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedClass={selectedSlot ? { id: selectedSlot.classId, name: selectedSlot.className } as ClassInfo : null}
        selectedWeekDay={selectedSlot?.weekDay ?? 0}
        selectedPeriodIndex={selectedSlot?.periodIndex ?? 0}
        selectedSlot={selectedSlot}
        teachers={teachers}
        grade={grade}
        onSave={(classId, weekDay, periodIndex, subject, teacherId, teacherName) => {
          const newSlot: SlotData = {
            id: crypto.randomUUID(),
            class_id: classId,
            subject,
            teacher_id: teacherId,
            teacher_name: teacherName,
            week_day: weekDay + 1,
            period_index: periodIndex,
          };
          setSchedulesMap(prev => {
            const map = new Map(prev);
            const slots = [...(map.get(classId) || [])];
            const idx = slots.findIndex(s => s.week_day === weekDay + 1 && s.period_index === periodIndex);
            if (idx >= 0) slots[idx] = newSlot;
            else slots.push(newSlot);
            map.set(classId, slots);
            return map;
          });
        }}
      />

      {/* 右键菜单 */}
      {contextMenu && (
        <ScheduleContextMenu
          menu={{
            visible: true,
            x: contextMenu.x,
            y: contextMenu.y,
            classId: contextMenu.classId,
            className: '',
            weekDay: contextMenu.weekDay,
            periodIndex: contextMenu.periodIndex,
            hasSlot: contextMenu.hasSlot,
          }}
          onClose={() => setContextMenu(null)}
          onClear={handleContextMenuClear}
          onCopySlot={handleCopySlot}
          onPasteSlot={handlePasteSlot}
          hasCopiedSlot={!!clipboard}
        />
      )}
    </div>
  );
}
