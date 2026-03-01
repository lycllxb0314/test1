'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  RefreshCw,
  Download,
  Plus,
  Edit,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  CalendarClock,
  ArrowRightLeft,
  UserCheck,
  Loader2,
  Sparkles,
  Zap,
  Settings,
  Play,
  ChevronRight,
  Layers,
} from 'lucide-react';
import type { ScheduleSlot, TeachingTask, ScheduleResult, SubstituteRecord } from '@/types';

// 科目颜色配置
const subjectColors: Record<string, string> = {
  '语文': 'bg-red-100 text-red-700 border-red-200',
  '数学': 'bg-blue-100 text-blue-700 border-blue-200',
  '英语': 'bg-green-100 text-green-700 border-green-200',
  '体育': 'bg-orange-100 text-orange-700 border-orange-200',
  '音乐': 'bg-purple-100 text-purple-700 border-purple-200',
  '美术': 'bg-pink-100 text-pink-700 border-pink-200',
  '科学': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '道德与法治': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '阅读': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '班会': 'bg-gray-100 text-gray-700 border-gray-200',
  '自习': 'bg-slate-100 text-slate-700 border-slate-200',
  '信息技术': 'bg-teal-100 text-teal-700 border-teal-200',
};

const weekDays = [
  { key: 1, label: '周一' },
  { key: 2, label: '周二' },
  { key: 3, label: '周三' },
  { key: 4, label: '周四' },
  { key: 5, label: '周五' },
];

export default function SchedulePage() {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; grade: number }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; subjects: string[] }>>([]);
  const [periods, setPeriods] = useState<Array<{ index: number; name: string; startTime: string; endTime: string }>>([
    { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40' },
    { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30' },
    { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40' },
    { index: 4, name: '第四节', startTime: '14:00', endTime: '14:40' },
    { index: 5, name: '第五节', startTime: '14:50', endTime: '15:30' },
    { index: 6, name: '第六节', startTime: '15:40', endTime: '16:20' },
  ]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [teachingTasks, setTeachingTasks] = useState<TeachingTask[]>([]);
  const [substitutes, setSubstitutes] = useState<SubstituteRecord[]>([]);
  
  // 视图控制
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedGrade, setSelectedGrade] = useState<string>('all'); // 年级筛选
  
  // 教师课表筛选
  const [teacherGradeFilter, setTeacherGradeFilter] = useState<string>('all');
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState<string>('all');
  
  // 按年级分组班级
  const classesByGrade = useCallback(() => {
    const grouped: Record<number, typeof classes> = {};
    for (const cls of classes) {
      const grade = cls.grade || 1;
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push(cls);
    }
    return grouped;
  }, [classes]);
  
  // 筛选后的班级列表
  const filteredClasses = selectedGrade === 'all' 
    ? classes 
    : classes.filter(c => String(c.grade) === selectedGrade);
  
  // 对话框控制
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showSubstituteDialog, setShowSubstituteDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState<SubstituteRecord | null>(null);
  
  // 排课结果
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // 初始化数据
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 根据年级动态获取节次配置
  const getPeriodsByGrade = (grade: number) => {
    // 上午3节（所有年级相同）
    const morningPeriods = [
      { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40' },
      { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30' },
      { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40' },
    ];
    
    // 下午节次根据年级区分
    const afternoonPeriods = grade <= 2
      ? [ // 低年级（1-2年级）下午2节
          { index: 4, name: '第四节', startTime: '14:00', endTime: '14:40' },
          { index: 5, name: '第五节', startTime: '14:50', endTime: '15:30' },
        ]
      : [ // 中高年级（3-6年级）下午3节
          { index: 4, name: '第四节', startTime: '14:00', endTime: '14:40' },
          { index: 5, name: '第五节', startTime: '14:50', endTime: '15:30' },
          { index: 6, name: '第六节', startTime: '15:40', endTime: '16:20' },
        ];
    
    return [...morningPeriods, ...afternoonPeriods];
  };

  // 根据选中班级动态调整节次
  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (selectedClass) {
        setPeriods(getPeriodsByGrade(selectedClass.grade));
      }
    }
  }, [selectedClassId, classes]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 并行获取基础数据（periods使用前端默认配置）
      const [classesRes, teachersRes, slotsRes, tasksRes, subsRes, statsRes] = await Promise.all([
        fetch('/api/schedule?action=classes'),
        fetch('/api/schedule?action=teachers'),
        fetch('/api/schedule'),
        fetch('/api/schedule?action=tasks'),
        fetch('/api/schedule/substitutes'),
        fetch('/api/schedule?action=statistics'),
      ]);
      
      const [classesData, teachersData, slotsData, tasksData, subsData, statsData] = await Promise.all([
        classesRes.json(),
        teachersRes.json(),
        slotsRes.json(),
        tasksRes.json(),
        subsRes.json(),
        statsRes.json(),
      ]);
      
      if (classesData.success) setClasses(classesData.data);
      if (teachersData.success) setTeachers(teachersData.data);
      // periods使用前端默认配置，根据班级年级动态调整
      if (slotsData.success) setScheduleSlots(slotsData.data.slots || []);
      if (tasksData.success) setTeachingTasks(tasksData.data);
      if (subsData.success) setSubstitutes(subsData.data);
      
      // 设置默认选中
      if (classesData.data?.length > 0) {
        setSelectedClassId(classesData.data[0].id);
      }
      if (teachersData.data?.length > 0) {
        setSelectedTeacherId(teachersData.data[0].id);
      }
      
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 智能排课
  const handleGenerateSchedule = async () => {
    try {
      setGenerating(true);
      
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
      
      const result = await response.json();
      
      // 即使有冲突也显示排课结果（success 可能为 false 表示有冲突）
      if (result.data) {
        setScheduleResult(result.data);
        setScheduleSlots(result.data.slots || []);
        setShowResultDialog(true);
        
        // 刷新教学任务
        const tasksRes = await fetch('/api/schedule?action=tasks');
        const tasksData = await tasksRes.json();
        if (tasksData.success) {
          setTeachingTasks(tasksData.data);
        }
      }
      
    } catch (error) {
      console.error('排课失败:', error);
    } finally {
      setGenerating(false);
    }
  };

  // 重置课表
  const handleResetSchedule = async () => {
    if (!confirm('确定要重置所有课表数据吗？此操作不可撤销。')) return;
    
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      fetchInitialData();
    } catch (error) {
      console.error('重置失败:', error);
    }
  };

  // 安排代课
  const handleArrangeSubstitute = async (teacherId: string, teacherName: string, remark: string) => {
    if (!selectedSubstitute) return;
    
    try {
      const response = await fetch('/api/schedule/substitutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'arrange',
          substituteRecordId: selectedSubstitute.id,
          substituteTeacherId: teacherId,
          substituteTeacherName: teacherName,
          arrangerId: 'current-user', // 实际应从登录状态获取
          arrangerName: '当前用户',
          remark,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 刷新代课记录
        const subsRes = await fetch('/api/schedule/substitutes');
        const subsData = await subsRes.json();
        if (subsData.success) {
          setSubstitutes(subsData.data);
        }
        
        setShowSubstituteDialog(false);
        setSelectedSubstitute(null);
      }
      
    } catch (error) {
      console.error('安排代课失败:', error);
    }
  };

  // 获取班级课表
  const getClassScheduleSlots = useCallback(() => {
    if (!selectedClassId) return [];
    return scheduleSlots.filter(s => s.classId === selectedClassId);
  }, [scheduleSlots, selectedClassId]);

  // 获取教师课表
  const getTeacherScheduleSlots = useCallback(() => {
    if (!selectedTeacherId) return [];
    let slots = scheduleSlots.filter(s => s.teacherId === selectedTeacherId);
    
    // 按年级筛选
    if (teacherGradeFilter !== 'all') {
      slots = slots.filter(s => {
        const slotClass = classes.find(c => c.id === s.classId);
        return slotClass?.grade === parseInt(teacherGradeFilter);
      });
    }
    
    // 按科目筛选
    if (teacherSubjectFilter !== 'all') {
      slots = slots.filter(s => s.subject === teacherSubjectFilter);
    }
    
    return slots;
  }, [scheduleSlots, selectedTeacherId, teacherGradeFilter, teacherSubjectFilter, classes]);
  
  // 获取教师涉及的年级列表
  const getTeacherGrades = useCallback(() => {
    if (!selectedTeacherId) return [];
    const teacherSlots = scheduleSlots.filter(s => s.teacherId === selectedTeacherId);
    const gradesSet = new Set<number>();
    teacherSlots.forEach(s => {
      const cls = classes.find(c => c.id === s.classId);
      if (cls) gradesSet.add(cls.grade);
    });
    return Array.from(gradesSet).sort((a, b) => a - b);
  }, [scheduleSlots, selectedTeacherId, classes]);
  
  // 获取教师涉及的科目列表
  const getTeacherSubjects = useCallback(() => {
    if (!selectedTeacherId) return [];
    const teacherSlots = scheduleSlots.filter(s => s.teacherId === selectedTeacherId);
    const subjectsSet = new Set<string>();
    teacherSlots.forEach(s => {
      if (s.subject) subjectsSet.add(s.subject);
    });
    return Array.from(subjectsSet);
  }, [scheduleSlots, selectedTeacherId]);

  // 获取指定位置的课表
  const getSlot = (weekDay: number, periodIndex: number, slots: ScheduleSlot[]) => {
    return slots.find(s => s.weekDay === weekDay && s.periodIndex === periodIndex);
  };

  // 计算课时统计
  const calculateSubjectHours = (slots: ScheduleSlot[]) => {
    const hours: Record<string, number> = {};
    slots.forEach(slot => {
      if (slot.subject && slot.subject !== '自习') {
        hours[slot.subject] = (hours[slot.subject] || 0) + 1;
      }
    });
    return hours;
  };

  const classScheduleSlots = getClassScheduleSlots();
  const teacherScheduleSlots = getTeacherScheduleSlots();
  const subjectHours = calculateSubjectHours(classScheduleSlots);
  
  // 统计数据
  const pendingSubstitutes = substitutes.filter(s => s.status === 'pending');
  const arrangedSubstitutes = substitutes.filter(s => s.status === 'arranged');
  const completedTasks = teachingTasks.filter(t => t.status === 'completed');
  const pendingTasks = teachingTasks.filter(t => t.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">加载数据中...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能排课</h1>
          <p className="text-gray-500 mt-1">
            全校统一排课 · 支持{classes.length}个班级 · {teachers.length}位教师 · 跨年级教学自动安排
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出课表
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-red-600 hover:text-red-700"
            onClick={handleResetSchedule}
          >
            <RefreshCw className="h-4 w-4" />
            重置课表
          </Button>
          <Button 
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            onClick={handleGenerateSchedule}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                排课中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                智能排课
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级总数</p>
                <p className="text-2xl font-bold text-amber-600">{classes.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已排课时</p>
                <p className="text-2xl font-bold text-green-600">{scheduleSlots.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待安排代课</p>
                <p className="text-2xl font-bold text-orange-600">{pendingSubstitutes.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <CalendarClock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">排课覆盖率</p>
                <p className="text-2xl font-bold text-blue-600">
                  {teachingTasks.length > 0 
                    ? `${((completedTasks.length / teachingTasks.length) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="schedule">班级课表</TabsTrigger>
          <TabsTrigger value="teacher">教师课表</TabsTrigger>
          <TabsTrigger value="tasks">教学任务</TabsTrigger>
          <TabsTrigger value="substitutes">代课管理</TabsTrigger>
          <TabsTrigger value="settings">排课设置</TabsTrigger>
        </TabsList>

        {/* 班级课表 */}
        <TabsContent value="schedule">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>班级课程表</CardTitle>
                  <CardDescription>查看和管理各班级的课程安排（全校统一排课）</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  {/* 年级筛选 */}
                  <Select value={selectedGrade} onValueChange={(val) => {
                    setSelectedGrade(val);
                    // 自动选择该年级第一个班级
                    const gradeClasses = val === 'all' ? classes : classes.filter(c => String(c.grade) === val);
                    if (gradeClasses.length > 0) {
                      setSelectedClassId(gradeClasses[0].id);
                    }
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部年级</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map(g => (
                        <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 班级选择（根据年级筛选显示） */}
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="选择班级" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedGrade === 'all' ? (
                        // 全部年级：按年级分组显示
                        Object.entries(classesByGrade()).map(([grade, gradeClasses]) => (
                          <div key={grade}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                              {grade}年级
                            </div>
                            {gradeClasses.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </div>
                        ))
                      ) : (
                        // 特定年级：只显示该年级班级
                        filteredClasses.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {scheduleSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无课表数据</p>
                  <p className="text-sm mt-2">点击右上角"智能排课"按钮自动生成课表</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-3 text-left bg-gray-50 border font-medium text-gray-700 w-24">节次/时间</th>
                          {weekDays.map(day => (
                            <th key={day.key} className="p-3 text-center bg-gray-50 border font-medium text-gray-700">
                              {day.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map(period => (
                          <tr key={period.index}>
                            <td className="p-3 border bg-gray-50">
                              <div className="font-medium text-gray-700">{period.name}</div>
                              <div className="text-xs text-gray-500">{period.startTime}-{period.endTime}</div>
                            </td>
                            {weekDays.map(day => {
                              const slot = getSlot(day.key, period.index, classScheduleSlots);
                              if (!slot) {
                                return (
                                  <td key={day.key} className="p-2 border text-center">
                                    <div className="p-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                                      未安排
                                    </div>
                                  </td>
                                );
                              }
                              
                              const isAdjusted = slot.status === 'substituted' || slot.status === 'swapped';
                              
                              return (
                                <td key={day.key} className="p-2 border text-center">
                                  <div 
                                    className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                                      subjectColors[slot.subject] || 'bg-gray-50'
                                    } ${isAdjusted ? 'ring-2 ring-orange-400' : ''}`}
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      setShowSlotDialog(true);
                                    }}
                                  >
                                    <div className="font-medium">{slot.courseName}</div>
                                    <div className="text-xs mt-1 flex items-center justify-center gap-1">
                                      <User className="h-3 w-3" />
                                      {slot.teacherName || '待定'}
                                    </div>
                                    {isAdjusted && (
                                      <div className="mt-1">
                                        <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
                                          {slot.status === 'substituted' ? '已代课' : '已调换'}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 课时统计 */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">本周课时分布</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {Object.entries(subjectHours).map(([subject, hours]) => (
                        <div key={subject} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className={`px-2 py-0.5 rounded text-xs ${subjectColors[subject] || 'bg-gray-100'}`}>
                            {subject}
                          </span>
                          <span className="font-medium text-sm">{hours}节</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教师课表 */}
        <TabsContent value="teacher">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>教师课程表</CardTitle>
                  <CardDescription>查看各教师的授课安排和周课时统计</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {/* 年级筛选 */}
                  <Select value={teacherGradeFilter} onValueChange={setTeacherGradeFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="年级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部年级</SelectItem>
                      {getTeacherGrades().map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>{grade}年级</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 科目筛选 */}
                  <Select value={teacherSubjectFilter} onValueChange={setTeacherSubjectFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部科目</SelectItem>
                      {getTeacherSubjects().map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 教师选择 */}
                  <Select value={selectedTeacherId} onValueChange={(val) => {
                    setSelectedTeacherId(val);
                    // 切换教师时重置筛选
                    setTeacherGradeFilter('all');
                    setTeacherSubjectFilter('all');
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="选择教师" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {scheduleSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无课表数据</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-3 text-left bg-gray-50 border font-medium text-gray-700 w-24">节次/时间</th>
                          {weekDays.map(day => (
                            <th key={day.key} className="p-3 text-center bg-gray-50 border font-medium text-gray-700">
                              {day.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map(period => (
                          <tr key={period.index}>
                            <td className="p-3 border bg-gray-50">
                              <div className="font-medium text-gray-700">{period.name}</div>
                              <div className="text-xs text-gray-500">{period.startTime}-{period.endTime}</div>
                            </td>
                            {weekDays.map(day => {
                              const slot = getSlot(day.key, period.index, teacherScheduleSlots);
                              if (!slot) {
                                return (
                                  <td key={day.key} className="p-2 border text-center">
                                    <div className="p-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                                      -
                                    </div>
                                  </td>
                                );
                              }
                              
                              return (
                                <td key={day.key} className="p-2 border text-center">
                                  <div 
                                    className={`p-2 rounded-lg border ${
                                      subjectColors[slot.subject] || 'bg-gray-50'
                                    }`}
                                  >
                                    <div className="font-medium">{slot.courseName}</div>
                                    <div className="text-xs mt-1">{slot.className}</div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">周课时：</span>
                      <span className="font-bold text-blue-600 text-lg">{teacherScheduleSlots.length}节</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教学任务 */}
        <TabsContent value="tasks">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>教学任务管理</CardTitle>
              <CardDescription>
                共 {teachingTasks.length} 个教学任务，
                已完成 {completedTasks.length} 个，
                待排课 {pendingTasks.length} 个
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teachingTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无教学任务数据</p>
                  <p className="text-sm mt-2">请先配置班级和教师信息</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teachingTasks.slice(0, 20).map(task => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded text-xs ${subjectColors[task.subject] || 'bg-gray-100'}`}>
                          {task.subject}
                        </span>
                        <div>
                          <span className="font-medium">{task.className}</span>
                          <span className="text-gray-500 mx-2">·</span>
                          <span className="text-gray-600">{task.teacherName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                          {task.arrangedHours}/{task.weeklyHours}节
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status === 'completed' ? '已完成' : task.status === 'partial' ? '部分' : '待排课'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 代课管理 */}
        <TabsContent value="substitutes">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>代课管理</CardTitle>
              <CardDescription>
                与请假系统联动，自动生成代课记录，由年段长安排代课教师
              </CardDescription>
            </CardHeader>
            <CardContent>
              {substitutes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无代课记录</p>
                  <p className="text-sm mt-2">当教师请假审批通过后，系统会自动生成代课记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {substitutes.map(sub => (
                    <div 
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          sub.status === 'pending' ? 'bg-orange-100' :
                          sub.status === 'arranged' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <UserCheck className={`h-5 w-5 ${
                            sub.status === 'pending' ? 'text-orange-600' :
                            sub.status === 'arranged' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium">
                            {sub.className} · {sub.subject} · {sub.periodName}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            原任课：{sub.originalTeacherName} · 请假原因：{sub.leaveReason}
                          </div>
                          {sub.substituteTeacherName && (
                            <div className="text-sm text-blue-600 mt-1">
                              代课教师：{sub.substituteTeacherName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          sub.status === 'pending' ? 'destructive' :
                          sub.status === 'arranged' ? 'default' : 'secondary'
                        }>
                          {sub.status === 'pending' ? '待安排' :
                           sub.status === 'arranged' ? '已安排' : '已完成'}
                        </Badge>
                        {sub.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedSubstitute(sub);
                              setShowSubstituteDialog(true);
                            }}
                          >
                            安排代课
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 排课设置 */}
        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  排课规则配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">主科优先上午</div>
                    <div className="text-sm text-gray-500">语文、数学、英语优先安排在上午</div>
                  </div>
                  <Badge variant="default">已启用</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">体育课下午优先</div>
                    <div className="text-sm text-gray-500">避免学生过度疲劳</div>
                  </div>
                  <Badge variant="default">已启用</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">同科目分散</div>
                    <div className="text-sm text-gray-500">同一科目尽量分布在不同天</div>
                  </div>
                  <Badge variant="default">已启用</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">避免连堂</div>
                    <div className="text-sm text-gray-500">非必要不连续安排同一科目</div>
                  </div>
                  <Badge variant="default">已启用</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  作息时间配置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {periods.map(period => (
                    <div key={period.index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{period.name}</span>
                      <span className="text-sm text-gray-600">{period.startTime} - {period.endTime}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 排课结果对话框 */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {scheduleResult?.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  排课完成
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  排课完成（存在需调整项）
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {scheduleResult?.statistics.arrangedSlots || 0}
                </div>
                <div className="text-sm text-gray-600">已排课时</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {scheduleResult ? `${(scheduleResult.statistics.coverageRate * 100).toFixed(1)}%` : '0%'}
                </div>
                <div className="text-sm text-gray-600">覆盖率</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {scheduleResult?.conflicts?.length || 0}
                </div>
                <div className="text-sm text-gray-600">需关注</div>
              </div>
            </div>
            
            {/* 调整建议 */}
            {scheduleResult?.adjustments && scheduleResult.adjustments.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="font-medium text-amber-700 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  建议调整教师课时配置
                </div>
                <div className="space-y-2 text-sm">
                  {scheduleResult.adjustments.map((adj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                      <div>
                        <span className="font-medium">{adj.teacherName}</span>
                        <span className="text-gray-500 mx-2">·</span>
                        <span className="text-gray-600">{adj.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through">{adj.originalHours}节</span>
                        <ArrowRightLeft className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-amber-600">{adj.suggestedHours}节</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  * 系统检测到部分教师的课时配置与实际可排课时存在差异，建议在教师管理界面调整配置
                </div>
              </div>
            )}
            
            {/* 未填满的槽位 */}
            {scheduleResult?.unfilledSlots && scheduleResult.unfilledSlots.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-medium text-orange-700 mb-2">
                  有 {scheduleResult.unfilledSlots.length} 个时段未安排课程
                </div>
                <div className="text-sm text-gray-600 max-h-24 overflow-y-auto">
                  {scheduleResult.unfilledSlots.slice(0, 10).map((slot, idx) => (
                    <div key={idx} className="py-1">
                      {slot.className} · {weekDays.find(d => d.key === slot.weekDay)?.label}第{slot.periodIndex}节
                    </div>
                  ))}
                  {scheduleResult.unfilledSlots.length > 10 && (
                    <div className="text-gray-400">...还有 {scheduleResult.unfilledSlots.length - 10} 个</div>
                  )}
                </div>
              </div>
            )}
            
            {/* 冲突信息 */}
            {scheduleResult?.conflicts && scheduleResult.conflicts.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="font-medium text-red-700 mb-2">
                  排课提示
                </div>
                <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                  {scheduleResult.conflicts.map(c => (
                    <div key={c.id} className="py-1">{c.description}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-gray-500 flex justify-between">
              <span>排课耗时：{scheduleResult?.duration || 0}ms</span>
              <span>全校统一排课 · 自动均衡分配</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 代课安排对话框 */}
      <SubstituteDialog
        open={showSubstituteDialog}
        onOpenChange={setShowSubstituteDialog}
        substitute={selectedSubstitute}
        teachers={teachers}
        onConfirm={handleArrangeSubstitute}
      />
    </div>
  );
}

// 代课安排对话框组件
function SubstituteDialog({
  open,
  onOpenChange,
  substitute,
  teachers,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  substitute: SubstituteRecord | null;
  teachers: Array<{ id: string; name: string; subjects: string[] }>;
  onConfirm: (teacherId: string, teacherName: string, remark: string) => void;
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [remark, setRemark] = useState('');
  
  const availableTeachers = substitute
    ? teachers.filter(t => t.subjects.includes(substitute.subject))
    : [];
  
  useEffect(() => {
    setSelectedTeacherId('');
    setRemark('');
  }, [open]);
  
  if (!substitute) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>安排代课教师</DialogTitle>
          <DialogDescription>
            为 {substitute.className} {substitute.subject} 课安排代课教师
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 bg-gray-50 rounded-lg space-y-1">
            <div className="text-sm"><span className="text-gray-500">课程：</span>{substitute.courseName}</div>
            <div className="text-sm"><span className="text-gray-500">时间：</span>
              {weekDays.find(d => d.key === substitute.weekDay)?.label} {substitute.periodName}
            </div>
            <div className="text-sm"><span className="text-gray-500">原教师：</span>{substitute.originalTeacherName}</div>
            <div className="text-sm"><span className="text-gray-500">请假原因：</span>{substitute.leaveReason}</div>
          </div>
          
          <div className="space-y-2">
            <Label>选择代课教师</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择代课教师" />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea 
              value={remark} 
              onChange={(e) => setRemark(e.target.value)}
              placeholder="可选：填写安排说明..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button 
            disabled={!selectedTeacherId}
            onClick={() => {
              const teacher = teachers.find(t => t.id === selectedTeacherId);
              if (teacher) {
                onConfirm(teacher.id, teacher.name, remark);
              }
            }}
          >
            确认安排
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
