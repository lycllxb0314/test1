'use client';

import { useState, useEffect, useCallback, use } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  '劳动': { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', light: 'bg-lime-50' },
  '书法': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', light: 'bg-pink-50' },
  '校本': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', light: 'bg-indigo-50' },
  '班会': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', light: 'bg-slate-50' },
  '自习': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', light: 'bg-gray-50' },
};

// 科目显示顺序（语文数学优先）
const SUBJECT_ORDER = [
  '语文', '数学',
  '英语', '科学', '道德与法治',
  '音乐', '美术', '体育',
  '信息技术', '书法', '劳动', '综合实践', '校本',
  '班会'
];

// 科目特殊规则类型
type SubjectRule = 
  | 'chinese_only'      // 只能选本班语文老师（语文、书法）
  | 'math_only'         // 只能选本班数学老师（数学）
  | 'head_teacher_only' // 只能选本班班主任（班会）
  | 'all_chinese'       // 可选全校语文老师（道德与法治）
  | 'all_math'          // 可选全校数学老师（科学）
  | 'all_chinese_math'  // 可选全校语数老师（校本、综合实践、劳动）
  | 'all_subject';      // 可选该学科全校老师（其他学科）

// 科目规则映射
const SUBJECT_RULES: Record<string, SubjectRule> = {
  '语文': 'chinese_only',
  '数学': 'math_only',
  '书法': 'chinese_only',           // 书法只能选本班语文老师
  '班会': 'head_teacher_only',      // 班会只能选本班班主任
  '道德与法治': 'all_chinese',      // 道德与法治可选全校语文老师
  '科学': 'all_math',               // 科学可选全校数学老师
  '校本': 'all_chinese_math',       // 校本可选全校语数老师
  '综合实践': 'all_chinese_math',   // 综合实践可选全校语数老师
  '劳动': 'all_chinese_math',       // 劳动可选全校语数老师
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
  isClassHeadTeacher?: boolean;
  isClassSubTeacher?: boolean;
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
    // 班级语数老师信息
    chineseTeacherId?: string;
    chineseTeacherName?: string;
    mathTeacherId?: string;
    mathTeacherName?: string;
    // 班主任信息（用于班会课）
    headTeacherId?: string;
    headTeacherName?: string;
  } | null>(null);
  
  // 教师搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teachers, setTeachers] = useState<SubjectGroup[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [classInfo, setClassInfo] = useState<{
    headTeacherId: string | null;
    subTeacherId: string | null;
    headTeacherSubject: string | null;
    subTeacherSubject: string | null;
  } | null>(null);

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
  const handleSlotClick = (cls: any, weekDay: number, periodIndex: number) => {
    const slot = getSlot(cls.id, weekDay, periodIndex);
    
    // 确定本班的语文老师和数学老师
    const headSubject = cls.headTeacher?.subject;
    const subSubject = cls.subTeacher?.subject;
    
    let chineseTeacherId: string | undefined;
    let chineseTeacherName: string | undefined;
    let mathTeacherId: string | undefined;
    let mathTeacherName: string | undefined;
    
    // 班主任是语文老师
    if (headSubject === '语文') {
      chineseTeacherId = cls.headTeacherId;
      chineseTeacherName = cls.headTeacherName;
    }
    // 副班主任是语文老师
    if (subSubject === '语文') {
      chineseTeacherId = cls.subTeacherId;
      chineseTeacherName = cls.subTeacherName;
    }
    // 班主任是数学老师
    if (headSubject === '数学') {
      mathTeacherId = cls.headTeacherId;
      mathTeacherName = cls.headTeacherName;
    }
    // 副班主任是数学老师
    if (subSubject === '数学') {
      mathTeacherId = cls.subTeacherId;
      mathTeacherName = cls.subTeacherName;
    }
    
    setSelectedSlot({
      classId: cls.id,
      className: cls.name,
      weekDay,
      periodIndex,
      currentSubject: slot?.subject || undefined,
      currentTeacherId: slot?.teacher_id || undefined,
      currentTeacherName: slot?.teacher_name || undefined,
      chineseTeacherId,
      chineseTeacherName,
      mathTeacherId,
      mathTeacherName,
      headTeacherId: cls.headTeacherId,
      headTeacherName: cls.headTeacherName,
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

  // 筛选教师（根据科目规则）
  const filteredTeachers = (() => {
    if (!selectedSubject) return [];
    
    const rule = SUBJECT_RULES[selectedSubject] || 'all_subject';
    
    // 获取本班语数老师信息
    const getClassTeacher = (type: 'chinese' | 'math') => {
      const teacherId = type === 'chinese' ? selectedSlot?.chineseTeacherId : selectedSlot?.mathTeacherId;
      const teacherName = type === 'chinese' ? selectedSlot?.chineseTeacherName : selectedSlot?.mathTeacherName;
      const subject = type === 'chinese' ? '语文' : '数学';
      const subjectGroup = teachers.find(g => g.subject === subject);
      const teacherInfo = subjectGroup?.teachers.find(t => t.id === teacherId);
      
      if (teacherInfo) return teacherInfo;
      if (teacherId) {
        return {
          id: teacherId,
          name: teacherName || '未知',
          subject,
          maxHours: 16,
          usedHours: 0,
          remainingHours: 16,
        };
      }
      return null;
    };
    
    // 根据规则筛选教师
    switch (rule) {
      // 只能选本班语文老师（语文、书法）
      case 'chinese_only': {
        const teacher = getClassTeacher('chinese');
        return teacher ? [teacher] : [];
      }
      
      // 只能选本班数学老师（数学）
      case 'math_only': {
        const teacher = getClassTeacher('math');
        return teacher ? [teacher] : [];
      }
      
      // 只能选本班班主任（班会）
      case 'head_teacher_only': {
        if (!selectedSlot?.headTeacherId) return [];
        // 在所有教师中查找班主任
        const allTeachers = teachers.flatMap(g => g.teachers);
        const headTeacher = allTeachers.find(t => t.id === selectedSlot.headTeacherId);
        if (headTeacher) return [headTeacher];
        // 如果找不到，返回基本信息
        return [{
          id: selectedSlot.headTeacherId,
          name: selectedSlot.headTeacherName || '未知',
          subject: '班主任',
          maxHours: 16,
          usedHours: 0,
          remainingHours: 16,
        }];
      }
      
      // 可选全校语文老师（道德与法治）- 本班老师优先，其次课时快要满足的
      case 'all_chinese': {
        const chineseGroup = teachers.find(g => g.subject === '语文');
        const filtered = (chineseGroup?.teachers || []).filter(t => !searchQuery || t.name.includes(searchQuery));
        // 本班老师ID（班主任、语文老师、数学老师）
        const priorityIds = new Set([
          selectedSlot?.headTeacherId,
          selectedSlot?.chineseTeacherId,
          selectedSlot?.mathTeacherId
        ].filter(Boolean));
        // 排序：1.本班老师在前 2.剩余课时少的优先（快要满足课时）
        return filtered.sort((a, b) => {
          const aIsPriority = priorityIds.has(a.id) ? 0 : 1;
          const bIsPriority = priorityIds.has(b.id) ? 0 : 1;
          if (aIsPriority !== bIsPriority) return aIsPriority - bIsPriority;
          // 都是本班老师或都不是，按剩余课时升序（少的在前）
          return a.remainingHours - b.remainingHours;
        });
      }
      
      // 可选全校数学老师（科学）- 本班老师优先，其次课时快要满足的
      case 'all_math': {
        const mathGroup = teachers.find(g => g.subject === '数学');
        const filtered = (mathGroup?.teachers || []).filter(t => !searchQuery || t.name.includes(searchQuery));
        // 本班老师ID
        const priorityIds = new Set([
          selectedSlot?.headTeacherId,
          selectedSlot?.chineseTeacherId,
          selectedSlot?.mathTeacherId
        ].filter(Boolean));
        // 排序：1.本班老师在前 2.剩余课时少的优先
        return filtered.sort((a, b) => {
          const aIsPriority = priorityIds.has(a.id) ? 0 : 1;
          const bIsPriority = priorityIds.has(b.id) ? 0 : 1;
          if (aIsPriority !== bIsPriority) return aIsPriority - bIsPriority;
          return a.remainingHours - b.remainingHours;
        });
      }
      
      // 可选全校语数老师（校本、综合实践、劳动）- 本班老师优先，其次课时快要满足的
      case 'all_chinese_math': {
        const chineseGroup = teachers.find(g => g.subject === '语文');
        const mathGroup = teachers.find(g => g.subject === '数学');
        const allTeachers = [...(chineseGroup?.teachers || []), ...(mathGroup?.teachers || [])];
        const filtered = allTeachers.filter(t => !searchQuery || t.name.includes(searchQuery));
        // 本班老师ID
        const priorityIds = new Set([
          selectedSlot?.headTeacherId,
          selectedSlot?.chineseTeacherId,
          selectedSlot?.mathTeacherId
        ].filter(Boolean));
        // 排序：1.本班老师在前 2.剩余课时少的优先
        return filtered.sort((a, b) => {
          const aIsPriority = priorityIds.has(a.id) ? 0 : 1;
          const bIsPriority = priorityIds.has(b.id) ? 0 : 1;
          if (aIsPriority !== bIsPriority) return aIsPriority - bIsPriority;
          return a.remainingHours - b.remainingHours;
        });
      }
      
      // 默认：显示该学科所有教师 - 课时快要满足的优先
      case 'all_subject':
      default: {
        const subjectGroup = teachers.find(g => g.subject === selectedSubject);
        const filtered = (subjectGroup?.teachers || []).filter(t => !searchQuery || t.name.includes(searchQuery));
        // 排序：剩余课时少的优先（快要满足课时）
        return filtered.sort((a, b) => a.remainingHours - b.remainingHours);
      }
    }
  })();

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
                <div className="p-5">
                  <div className="grid grid-cols-6 gap-2">
                    {/* 表头 */}
                    <div className="h-12"></div>
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="h-12 flex items-center justify-center text-base font-bold text-stone-600 bg-stone-100 rounded-xl">
                        {day}
                      </div>
                    ))}
                    
                    {/* 上午课程 */}
                    {[0, 1, 2].map((periodIdx) => (
                      <div key={`row-${periodIdx}`} className="contents">
                        <div className="h-20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs text-stone-400 mb-1">上午</div>
                            <div className="text-lg font-bold text-stone-700">{periodIdx + 1}</div>
                          </div>
                        </div>
                        {WEEKDAYS.map((_, dayIdx) => {
                          const slot = getSlot(cls.id, dayIdx, periodIdx);
                          const available = isSlotAvailable(dayIdx, periodIdx);
                          const colors = slot ? getSubjectColor(slot.subject) : null;
                          
                          return (
                            <div
                              key={`${dayIdx}-${periodIdx}`}
                              className={`h-20 rounded-2xl transition-all duration-200 ${
                                available 
                                  ? 'cursor-pointer hover:scale-[1.03] hover:z-10' 
                                  : 'bg-stone-50/50'
                              } ${
                                slot 
                                  ? `${colors?.bg} ${colors?.border} border-2 shadow-sm hover:shadow-lg` 
                                  : available 
                                    ? 'bg-stone-50 hover:bg-amber-50 border-2 border-dashed border-stone-200 hover:border-amber-300' 
                                    : ''
                              }`}
                              onClick={() => available && handleSlotClick(cls, dayIdx, periodIdx)}
                            >
                              {available && (
                                <div className="h-full flex flex-col items-center justify-center px-2">
                                  {slot ? (
                                    <>
                                      <span className={`text-base font-bold ${colors?.text} truncate max-w-full`}>
                                        {slot.subject}
                                      </span>
                                      {slot.teacher_name && (
                                        <span className="text-sm text-stone-500 truncate max-w-full mt-1">
                                          {slot.teacher_name}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-xl font-light hover:border-amber-400 hover:text-amber-500 transition-colors">
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
                    <div className="col-span-6 h-8 flex items-center justify-center">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
                      <span className="px-4 text-sm text-stone-400 mx-3 font-medium">午休</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
                    </div>
                    
                    {/* 下午课程 */}
                    {[3, 4, 5].map((periodIdx) => (
                      <div key={`row-${periodIdx}`} className="contents">
                        <div className="h-20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs text-stone-400 mb-1">下午</div>
                            <div className="text-lg font-bold text-stone-700">{periodIdx + 1}</div>
                          </div>
                        </div>
                        {WEEKDAYS.map((_, dayIdx) => {
                          const slot = getSlot(cls.id, dayIdx, periodIdx);
                          const available = isSlotAvailable(dayIdx, periodIdx);
                          const colors = slot ? getSubjectColor(slot.subject) : null;
                          
                          return (
                            <div
                              key={`${dayIdx}-${periodIdx}`}
                              className={`h-20 rounded-2xl transition-all duration-200 ${
                                available 
                                  ? 'cursor-pointer hover:scale-[1.03] hover:z-10' 
                                  : 'bg-stone-50/50'
                              } ${
                                slot 
                                  ? `${colors?.bg} ${colors?.border} border-2 shadow-sm hover:shadow-lg` 
                                  : available 
                                    ? 'bg-stone-50 hover:bg-amber-50 border-2 border-dashed border-stone-200 hover:border-amber-300' 
                                    : ''
                              }`}
                              onClick={() => available && handleSlotClick(cls, dayIdx, periodIdx)}
                            >
                              {available && (
                                <div className="h-full flex flex-col items-center justify-center px-2">
                                  {slot ? (
                                    <>
                                      <span className={`text-base font-bold ${colors?.text} truncate max-w-full`}>
                                        {slot.subject}
                                      </span>
                                      {slot.teacher_name && (
                                        <span className="text-sm text-stone-500 truncate max-w-full mt-1">
                                          {slot.teacher_name}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-xl font-light hover:border-amber-400 hover:text-amber-500 transition-colors">
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

      {/* 选课弹窗 - 横向大屏布局 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-6xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          {/* 弹窗头部 */}
          <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-amber-50 px-8 py-5 relative overflow-hidden border-b border-amber-200/50">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-200/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-full translate-y-1/2" />
            <div className="relative flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-stone-800 tracking-tight">
                  {selectedSlot?.className}
                </DialogTitle>
                <DialogDescription className="text-base text-stone-500 mt-1 font-medium">
                  {selectedSlot && WEEKDAYS[selectedSlot.weekDay]} · {selectedSlot && getPeriodDisplay(selectedSlot.periodIndex)}
                </DialogDescription>
              </div>
              {/* 当前状态 */}
              {selectedSlot?.currentSubject && (
                <div className="flex items-center gap-4 px-5 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200 shadow-sm">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${getSubjectColor(selectedSlot.currentSubject).bg} ${getSubjectColor(selectedSlot.currentSubject).text}`}>
                    {selectedSlot.currentSubject.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-stone-800">{selectedSlot.currentSubject}</div>
                    {selectedSlot.currentTeacherName && (
                      <div className="text-sm text-stone-500 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {selectedSlot.currentTeacherName}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleClearSlot} 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5 ml-2"
                  >
                    <X className="w-4 h-4" />
                    清除
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* 横向布局主体 */}
          <div className="flex flex-1 h-[calc(85vh-88px)]">
            {/* 左侧 - 科目选择 */}
            <div className="w-72 border-r border-stone-200 bg-stone-50/50 p-4 flex flex-col">
              <label className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                选择科目
              </label>
              <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto content-start">
                {/* 按顺序显示科目 */}
                {SUBJECT_ORDER.map(subject => {
                  const colors = getSubjectColor(subject);
                  const isSelected = selectedSubject === subject;
                  const rule = SUBJECT_RULES[subject];
                  // 标记需要特殊处理的科目
                  const isRestricted = rule === 'chinese_only' || rule === 'math_only' || rule === 'head_teacher_only';
                  
                  return (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(isSelected ? '' : subject)}
                      className={`px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border relative ${
                        isSelected
                          ? `${colors.bg} ${colors.text} ${colors.border} shadow-md`
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <span className="truncate block">{subject}</span>
                      {isRestricted && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white shadow" title="限本班教师" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* 提示信息 */}
              {selectedSubject && SUBJECT_RULES[selectedSubject] === 'chinese_only' && selectedSlot?.chineseTeacherName && (
                <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2 text-amber-700 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>本班老师：<strong>{selectedSlot.chineseTeacherName}</strong></span>
                </div>
              )}
              {selectedSubject && SUBJECT_RULES[selectedSubject] === 'math_only' && selectedSlot?.mathTeacherName && (
                <div className="mt-3 p-2.5 bg-sky-50 rounded-lg border border-sky-200 flex items-center gap-2 text-sky-700 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>本班老师：<strong>{selectedSlot.mathTeacherName}</strong></span>
                </div>
              )}
              {selectedSubject && SUBJECT_RULES[selectedSubject] === 'head_teacher_only' && selectedSlot?.headTeacherName && (
                <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2 text-emerald-700 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>本班班主任：<strong>{selectedSlot.headTeacherName}</strong></span>
                </div>
              )}
              {selectedSubject && (SUBJECT_RULES[selectedSubject] === 'all_chinese' || SUBJECT_RULES[selectedSubject] === 'all_math' || SUBJECT_RULES[selectedSubject] === 'all_chinese_math') && (
                <div className="mt-3 p-2.5 bg-stone-100 rounded-lg border border-stone-200 flex items-center gap-2 text-stone-600 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    {SUBJECT_RULES[selectedSubject] === 'all_chinese' && '可选全校语文老师'}
                    {SUBJECT_RULES[selectedSubject] === 'all_math' && '可选全校数学老师'}
                    {SUBJECT_RULES[selectedSubject] === 'all_chinese_math' && '可选全校语数老师'}
                  </span>
                </div>
              )}
            </div>
            
            {/* 右侧 - 教师选择 */}
            <div className="flex-1 flex flex-col bg-white min-h-0">
              {/* 搜索栏 - 非限制科目才显示 */}
              {selectedSubject && !['chinese_only', 'math_only', 'head_teacher_only'].includes(SUBJECT_RULES[selectedSubject] || '') && (
                <div className="p-4 border-b border-stone-200 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <Input
                      placeholder="搜索教师姓名..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base bg-stone-50 border-stone-200 focus:border-amber-400 focus:ring-amber-200 rounded-xl"
                    />
                  </div>
                </div>
              )}
              
              {/* 教师列表 - 使用原生滚动 */}
              {selectedSubject ? (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {loadingTeachers ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                      <div className="w-10 h-10 border-3 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-3" />
                      <span className="text-base">加载教师数据...</span>
                    </div>
                  ) : filteredTeachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                      <User className="w-12 h-12 mb-3 opacity-50" />
                      <span className="text-base">
                        {selectedSubject === '语文' && !selectedSlot?.chineseTeacherId 
                          ? '该班级尚未配置语文老师' 
                          : selectedSubject === '数学' && !selectedSlot?.mathTeacherId
                          ? '该班级尚未配置数学老师'
                          : '未找到匹配的教师'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {filteredTeachers.map((teacher) => {
                        const colors = getSubjectColor(teacher.subject);
                        const isDisabled = teacher.remainingHours <= 0;
                        // 判断是否显示"本班"标记
                        const rule = SUBJECT_RULES[selectedSubject];
                        const isClassTeacher = rule === 'chinese_only' || rule === 'math_only';
                        // 判断是否是本班的班主任/副班主任
                        const isThisClassTeacher = teacher.id === selectedSlot?.chineseTeacherId || teacher.id === selectedSlot?.mathTeacherId || teacher.id === selectedSlot?.headTeacherId;
                        
                        return (
                          <button
                            key={teacher.id}
                            onClick={() => handleSelectTeacher(teacher)}
                            disabled={isDisabled}
                            className={`w-full p-4 text-left transition-all duration-200 rounded-xl flex items-center justify-between gap-4 ${
                              isDisabled 
                                ? 'opacity-40 cursor-not-allowed bg-stone-100 border border-stone-200' 
                                : 'bg-white hover:bg-amber-50 hover:shadow-md border border-stone-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm shrink-0 ${colors.bg} ${colors.text}`}>
                                {teacher.name.slice(0, 1)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-base font-bold text-stone-800 flex items-center gap-2 truncate">
                                  {teacher.name}
                                  {isThisClassTeacher && (
                                    <span className="text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shrink-0">本班</span>
                                  )}
                                </div>
                                <div className="text-sm text-stone-500 truncate">{teacher.subject}教师</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <div className={`text-base font-bold ${teacher.remainingHours > 0 ? 'text-stone-700' : 'text-red-500'}`}>
                                  {teacher.usedHours}/{teacher.maxHours}
                                </div>
                                <div className={`text-xs font-medium ${teacher.remainingHours > 0 ? 'text-green-600' : 'text-red-400'}`}>
                                  {teacher.remainingHours > 0 ? `剩余${teacher.remainingHours}节` : '已满'}
                                </div>
                              </div>
                              <div className={`w-2 h-8 rounded-full ${teacher.remainingHours > 0 ? 'bg-green-400' : 'bg-red-300'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                  <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                  <span className="text-lg">请先选择科目</span>
                </div>
              )}
              
              {/* 不指定教师按钮 */}
              {selectedSubject && selectedSubject !== '语文' && selectedSubject !== '数学' && (
                <div className="p-4 border-t border-stone-200 shrink-0">
                  <button
                    onClick={() => handleSelectTeacher(null)}
                    className="w-full p-4 text-base text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-xl transition-colors border-2 border-dashed border-stone-300 hover:border-stone-400 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    <span>不指定教师（仅安排科目）</span>
                  </button>
                </div>
              )}
            </div>
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
