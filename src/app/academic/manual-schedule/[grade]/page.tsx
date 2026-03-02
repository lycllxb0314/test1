'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Clock, User, Sparkles, RefreshCw, Save, CheckCircle, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/useClasses';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const MORNING_PERIODS = ['第1节', '第2节', '第3节'];
const AFTERNOON_PERIODS = ['第4节', '第5节', '第6节'];

// 学科配色系统
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  '语文': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', light: 'bg-amber-50' },
  '数学': { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200', light: 'bg-sky-50' },
  '英语': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', light: 'bg-teal-50' },
  '科学': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', light: 'bg-emerald-50' },
  '音乐': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', light: 'bg-rose-50' },
  '美术': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', light: 'bg-orange-50' },
  '体育': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', light: 'bg-green-50' },
  '道德与法治': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', light: 'bg-violet-50' },
  '信息技术': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', light: 'bg-cyan-50' },
  '综合实践': { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200', light: 'bg-stone-50' },
  '班会': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', light: 'bg-slate-50' },
  '自习': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', light: 'bg-gray-50' },
};

const getSubjectColor = (subject: string) => {
  return SUBJECT_COLORS[subject] || { bg: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-200', light: 'bg-neutral-50' };
};

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

interface ScheduleStatus {
  hasDraft: boolean;
  draftUpdatedAt: string | null;
  draftSlotsCount: number;
  hasOfficial: boolean;
  officialSlotsCount: number;
}

export default function GradeSchedulePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade: gradeParam } = use(params);
  const grade = parseInt(gradeParam);
  const { classes, loading: classesLoading, getClassesByGrade } = useClasses();
  const [gradeClasses, setGradeClasses] = useState<any[]>([]);
  const [schedulesMap, setSchedulesMap] = useState<Map<string, SlotData[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ScheduleStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  
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

  // 加载状态
  const loadStatus = async () => {
    try {
      const res = await fetch(`/api/academic/manual-schedule/status?grade=${grade}`);
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('加载状态失败:', err);
    }
  };

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
    loadStatus();
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
        loadStatus();
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
        loadStatus();
      }
    } catch (err) {
      console.error('清除失败:', err);
      toast.error('清除失败');
    }
  };

  // 构建草稿数据
  const buildScheduleData = () => {
    return gradeClasses.map(cls => {
      const slots = schedulesMap.get(cls.id) || [];
      return {
        classId: cls.id,
        className: cls.name,
        slots: slots.map(s => ({
          subject: s.subject,
          teacher_id: s.teacher_id,
          teacher_name: s.teacher_name,
          week_day: s.week_day,
          period_index: s.period_index,
        })),
      };
    });
  };

  // 刷新
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([loadGradeSchedule(), loadStatus()]);
    toast.success('已刷新');
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const scheduleData = buildScheduleData();
      const res = await fetch('/api/academic/manual-schedule/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, scheduleData }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('草稿保存成功');
        loadStatus();
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存草稿失败:', err);
      toast.error('保存草稿失败');
    } finally {
      setSaving(false);
    }
  };

  // 定稿
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const scheduleData = buildScheduleData();
      
      if (scheduleData.every(c => c.slots.length === 0)) {
        toast.error('请先安排课程');
        setPublishing(false);
        setShowPublishDialog(false);
        return;
      }
      
      const res = await fetch('/api/academic/manual-schedule/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, scheduleData }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`课表定稿成功，共 ${data.data.slotsCount} 节课`);
        setShowPublishDialog(false);
        loadStatus();
      } else {
        toast.error(data.error || '定稿失败');
      }
    } catch (err) {
      console.error('定稿失败:', err);
      toast.error('定稿失败');
    } finally {
      setPublishing(false);
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

  // 计算已安排课程数
  const totalSlots = Array.from(schedulesMap.values()).reduce((acc, slots) => acc + slots.length, 0);

  // 获取年级中文数字
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
                <p className="text-sm text-stone-500">
                  共 {gradeClasses.length} 个班级 · 已安排 {totalSlots} 节课
                </p>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              {/* 状态指示 */}
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || totalSlots === 0}
                className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存草稿'}
              </Button>
              
              <Button
                size="sm"
                onClick={() => setShowPublishDialog(true)}
                disabled={publishing || totalSlots === 0}
                className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                {publishing ? '定稿中...' : '定稿'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {(classesLoading || loading) ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
            <span>加载课表数据...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {gradeClasses.map((cls, classIndex) => (
              <div 
                key={cls.id} 
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-lg hover:border-stone-200 transition-all duration-300"
                style={{ animationDelay: `${classIndex * 50}ms` }}
              >
                {/* 班级标题栏 */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-stone-800">{cls.name}</span>
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      {classIndex + 1}/{gradeClasses.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {cls.headTeacher && (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400">班主任</span>
                        <span className="font-medium text-stone-700">{cls.headTeacherName}</span>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          {cls.headTeacher?.subject || '语文'}
                        </span>
                      </div>
                    )}
                    {cls.subTeacher && (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400">副班</span>
                        <span className="font-medium text-stone-700">{cls.subTeacherName}</span>
                        <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                          {cls.subTeacher?.subject || '数学'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 课表网格 */}
                <div className="p-4">
                  <div className="grid grid-cols-6 gap-1.5">
                    {/* 表头 */}
                    <div className="h-10"></div>
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-stone-600 bg-stone-50 rounded-lg">
                        {day}
                      </div>
                    ))}
                    
                    {/* 上午课程 */}
                    {[0, 1, 2].map((periodIdx) => (
                      <div key={`row-${periodIdx}`} className="contents">
                        <div className="h-14 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs text-stone-400 mb-0.5">上午</div>
                            <div className="text-sm font-medium text-stone-600">{periodIdx + 1}</div>
                          </div>
                        </div>
                        {WEEKDAYS.map((_, dayIdx) => {
                          const slot = getSlot(cls.id, dayIdx, periodIdx);
                          const available = isSlotAvailable(dayIdx, periodIdx);
                          const colors = slot ? getSubjectColor(slot.subject) : null;
                          
                          return (
                            <div
                              key={`${dayIdx}-${periodIdx}`}
                              className={`h-14 rounded-xl transition-all duration-200 ${
                                available 
                                  ? 'cursor-pointer hover:scale-[1.02] hover:z-10' 
                                  : 'bg-stone-50/50'
                              } ${
                                slot 
                                  ? `${colors?.bg} ${colors?.border} border shadow-sm hover:shadow-md` 
                                  : available 
                                    ? 'bg-stone-50/50 hover:bg-stone-100 border border-transparent hover:border-stone-200' 
                                    : ''
                              }`}
                              onClick={() => available && handleSlotClick(cls.id, cls.name, dayIdx, periodIdx)}
                            >
                              {available && (
                                <div className="h-full flex flex-col items-center justify-center px-1">
                                  {slot ? (
                                    <>
                                      <span className={`text-sm font-semibold ${colors?.text} truncate max-w-full`}>
                                        {slot.subject}
                                      </span>
                                      {slot.teacher_name && (
                                        <span className="text-xs text-stone-500 truncate max-w-full mt-0.5">
                                          {slot.teacher_name}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-lg font-light hover:border-amber-300 hover:text-amber-400 transition-colors">
                                      +
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    {/* 午休分隔 */}
                    <div className="col-span-6 h-6 flex items-center justify-center">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
                      <span className="px-3 text-xs text-stone-400 mx-2">午休</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
                    </div>
                    
                    {/* 下午课程 */}
                    {[3, 4, 5].map((periodIdx) => (
                      <div key={`row-${periodIdx}`} className="contents">
                        <div className="h-14 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs text-stone-400 mb-0.5">下午</div>
                            <div className="text-sm font-medium text-stone-600">{periodIdx + 1}</div>
                          </div>
                        </div>
                        {WEEKDAYS.map((_, dayIdx) => {
                          const slot = getSlot(cls.id, dayIdx, periodIdx);
                          const available = isSlotAvailable(dayIdx, periodIdx);
                          const colors = slot ? getSubjectColor(slot.subject) : null;
                          
                          return (
                            <div
                              key={`${dayIdx}-${periodIdx}`}
                              className={`h-14 rounded-xl transition-all duration-200 ${
                                available 
                                  ? 'cursor-pointer hover:scale-[1.02] hover:z-10' 
                                  : 'bg-stone-50/50'
                              } ${
                                slot 
                                  ? `${colors?.bg} ${colors?.border} border shadow-sm hover:shadow-md` 
                                  : available 
                                    ? 'bg-stone-50/50 hover:bg-stone-100 border border-transparent hover:border-stone-200' 
                                    : ''
                              }`}
                              onClick={() => available && handleSlotClick(cls.id, cls.name, dayIdx, periodIdx)}
                            >
                              {available && (
                                <div className="h-full flex flex-col items-center justify-center px-1">
                                  {slot ? (
                                    <>
                                      <span className={`text-sm font-semibold ${colors?.text} truncate max-w-full`}>
                                        {slot.subject}
                                      </span>
                                      {slot.teacher_name && (
                                        <span className="text-xs text-stone-500 truncate max-w-full mt-0.5">
                                          {slot.teacher_name}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 text-lg font-light hover:border-amber-300 hover:text-amber-400 transition-colors">
                                      +
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 选课弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-stone-200 shadow-2xl">
          {/* 弹窗头部 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
            <DialogTitle className="text-lg font-bold text-stone-800">
              {selectedSlot?.className}
            </DialogTitle>
            <p className="text-sm text-stone-500 mt-1">
              {selectedSlot && WEEKDAYS[selectedSlot.weekDay]} · {selectedSlot && getPeriodDisplay(selectedSlot.periodIndex)}
            </p>
          </div>
          
          <div className="p-6 space-y-5">
            {/* 当前状态 */}
            {selectedSlot?.currentSubject && (
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${getSubjectColor(selectedSlot.currentSubject).bg} ${getSubjectColor(selectedSlot.currentSubject).text}`}>
                    {selectedSlot.currentSubject.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-stone-800">{selectedSlot.currentSubject}</div>
                    {selectedSlot.currentTeacherName && (
                      <div className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        {selectedSlot.currentTeacherName}
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSlot} 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  清除
                </Button>
              </div>
            )}
            
            {/* 科目选择 */}
            <div>
              <label className="text-sm font-semibold text-stone-700 mb-3 block flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                选择科目
              </label>
              <div className="grid grid-cols-4 gap-2">
                {teachers.map(g => {
                  const colors = getSubjectColor(g.subject);
                  const isSelected = selectedSubject === g.subject;
                  return (
                    <button
                      key={g.subject}
                      onClick={() => setSelectedSubject(isSelected ? '' : g.subject)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                        isSelected
                          ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm scale-105`
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {g.subject}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 教师搜索 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="搜索教师姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-stone-50 border-stone-200 focus:border-amber-300 focus:ring-amber-200"
              />
            </div>
            
            {/* 教师列表 */}
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <ScrollArea className="h-64">
                {loadingTeachers ? (
                  <div className="p-8 text-center text-stone-400">
                    <div className="w-8 h-8 border-2 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                    加载教师数据...
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    未找到匹配的教师
                  </div>
                ) : (
                  <div>
                    {filteredTeachers.map((teacher) => {
                      const colors = getSubjectColor(teacher.subject);
                      const isDisabled = teacher.remainingHours <= 0;
                      return (
                        <button
                          key={teacher.id}
                          onClick={() => handleSelectTeacher(teacher)}
                          disabled={isDisabled}
                          className={`w-full p-4 text-left transition-colors border-b border-stone-100 last:border-0 flex items-center justify-between ${
                            isDisabled 
                              ? 'opacity-40 cursor-not-allowed bg-stone-50' 
                              : 'hover:bg-amber-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${colors.light} ${colors.text}`}>
                              {teacher.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-stone-800">{teacher.name}</div>
                              <div className="text-xs text-stone-400 mt-0.5">{teacher.subject}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${teacher.remainingHours > 0 ? 'text-stone-700' : 'text-red-500'}`}>
                              {teacher.usedHours}/{teacher.maxHours} 节
                            </div>
                            <div className={`text-xs mt-0.5 ${teacher.remainingHours > 0 ? 'text-green-600' : 'text-red-400'}`}>
                              {teacher.remainingHours > 0 ? `剩余 ${teacher.remainingHours} 节` : '已满'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            {/* 不指定教师 */}
            {selectedSubject && (
              <button
                onClick={() => handleSelectTeacher(null)}
                className="w-full p-3 text-sm text-stone-500 hover:bg-stone-50 rounded-xl transition-colors border border-dashed border-stone-300 hover:border-stone-400 flex items-center justify-center gap-2"
              >
                <span>仅安排科目，不指定教师</span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 定稿确认弹窗 */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认定稿？</AlertDialogTitle>
            <AlertDialogDescription>
              定稿后将覆盖该年级现有的正式课表，所有班级的排课数据将生效。
              <br /><br />
              当前已安排 <span className="font-bold text-stone-900">{totalSlots}</span> 节课程。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              disabled={publishing}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              {publishing ? '定稿中...' : '确认定稿'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
