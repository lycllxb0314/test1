'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LayoutGrid,
  Users,
  School,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  BookOpen,
  Calendar,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';
import { getGradeSubjectHours } from '@/lib/schedule-config';
import { toast } from 'sonner';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const MORNING_PERIODS = ['第1节', '第2节', '第3节'];
const AFTERNOON_PERIODS = ['第4节', '第5节', '第6节'];
const ALL_PERIODS = [...MORNING_PERIODS, ...AFTERNOON_PERIODS];

const GRADES = [1, 2, 3, 4, 5, 6];

interface SlotData {
  id: string;
  class_id: string;
  subject: string;
  teacher_id: string | null;
  teacher_name: string | null;
  week_day: number;
  period_index: number;
  class_name?: string;
  grade?: number;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  head_teacher_id?: string;
  sub_teacher_id?: string;
  head_teacher?: { id: string; name: string; primary_subject: string };
  sub_teacher?: { id: string; name: string; primary_subject: string };
  headTeacherName?: string;
  subTeacherName?: string;
  headTeacher?: { subject?: string };
  subTeacher?: { subject?: string };
  slots: SlotData[];
}

interface GradeData {
  grade: number;
  gradeName: string;
  classes: ClassInfo[];
  classCount: number;
}

interface TeacherInfo {
  id: string;
  name: string;
  primary_subject: string;
  employee_id?: string;
  slots: SlotData[];
  totalHours: number;
}

interface SubjectGroup {
  subject: string;
  teachers: TeacherInfo[];
  teacherCount: number;
}

interface SummaryData {
  totalClasses: number;
  totalSlots: number;
  totalTeachers: number;
  gradeStats: Array<{
    grade: number;
    gradeName: string;
    classCount: number;
    slotCount: number;
  }>;
  subjectStats: Array<{
    subject: string;
    hours: number;
  }>;
}

type ViewMode = 'classes' | 'teachers' | 'summary';

export default function SchoolSchedulePage() {
  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('classes');
  
  // 数据
  const [classData, setClassData] = useState<GradeData[]>([]);
  const [teacherData, setTeacherData] = useState<SubjectGroup[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(true);
  
  // 筛选
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 展开的年级/学科
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  
  // 详情弹窗
  const [detailDialog, setDetailDialog] = useState<{
    type: 'class' | 'teacher';
    data: ClassInfo | TeacherInfo;
    scheduleMatrix: (SlotData | null)[][];
  } | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载概览数据
      const summaryRes = await fetch('/api/academic/school-schedule?mode=summary');
      const summaryData = await summaryRes.json();
      if (summaryData.success && summaryData.data) {
        setSummary(summaryData.data);
      }
      
      // 根据视图模式加载对应数据
      if (viewMode === 'classes') {
        const gradeParam = gradeFilter !== 'all' ? `&grade=${gradeFilter}` : '';
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/academic/school-schedule?mode=all-classes${gradeParam}${searchParam}`);
        const data = await res.json();
        if (data.success && data.data?.data) {
          setClassData(data.data.data);
        } else {
          setClassData([]);
        }
      } else if (viewMode === 'teachers') {
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/academic/school-schedule?mode=all-teachers${searchParam}`);
        const data = await res.json();
        if (data.success && data.data?.data) {
          setTeacherData(data.data.data);
        } else {
          setTeacherData([]);
        }
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [viewMode, gradeFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换年级展开
  const toggleGrade = (grade: number) => {
    const newExpanded = new Set(expandedGrades);
    if (newExpanded.has(grade)) {
      newExpanded.delete(grade);
    } else {
      newExpanded.add(grade);
    }
    setExpandedGrades(newExpanded);
  };

  // 切换学科展开
  const toggleSubject = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject);
    } else {
      newExpanded.add(subject);
    }
    setExpandedSubjects(newExpanded);
  };

  // 查看班级详情
  const viewClassDetail = async (classInfo: ClassInfo) => {
    try {
      const res = await fetch(`/api/academic/school-schedule?mode=class&classId=${classInfo.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDetailDialog({
          type: 'class',
          data: data.data.class,
          scheduleMatrix: data.data.scheduleMatrix,
        });
      }
    } catch (err) {
      console.error('获取班级课表失败:', err);
      toast.error('获取班级课表失败');
    }
  };

  // 查看教师详情
  const viewTeacherDetail = async (teacher: TeacherInfo) => {
    try {
      const res = await fetch(`/api/academic/school-schedule?mode=teacher&teacherId=${teacher.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDetailDialog({
          type: 'teacher',
          data: data.data.teacher,
          scheduleMatrix: data.data.scheduleMatrix,
        });
      }
    } catch (err) {
      console.error('获取教师课表失败:', err);
      toast.error('获取教师课表失败');
    }
  };

  // 筛选后的教师数据
  const filteredTeacherData = useMemo(() => {
    if (!Array.isArray(teacherData)) return [];
    if (subjectFilter === 'all') return teacherData;
    return teacherData.filter(g => g.subject === subjectFilter);
  }, [teacherData, subjectFilter]);

  // 获取学科列表
  const subjects = useMemo(() => {
    if (!Array.isArray(teacherData)) return [];
    return Array.from(new Set(teacherData.map(g => g.subject)));
  }, [teacherData]);

  // 获取课表格子信息
  const getSlot = (slots: SlotData[], weekDay: number, periodIndex: number): SlotData | null => {
    return slots.find(s => s.week_day === weekDay + 1 && s.period_index === periodIndex) || null;
  };

  // 渲染班级课表卡片（与年级排课一致样式）
  const renderClassScheduleCard = (cls: ClassInfo, classIndex: number, totalInGrade: number) => {
    // 计算该班级各学科已排课时
    const subjectCount: Record<string, number> = {};
    cls.slots.forEach(s => {
      subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
    });
    
    // 获取该年级的科目课时配置
    const gradeSubjectHours = getGradeSubjectHours(cls.grade);
    const allSubjectsCount = gradeSubjectHours.map(({ subject }) => ({
      subject,
      count: subjectCount[subject] || 0,
    }));
    const totalClassSlots = cls.slots.length;
    
    return (
      <div 
        key={cls.id} 
        className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md hover:border-stone-200 transition-all duration-300"
      >
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
            {allSubjectsCount.map(({ subject, count }) => {
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
            {/* 表头 */}
            <div className="h-8"></div>
            {WEEKDAYS.map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-sm font-bold text-stone-600 bg-stone-100 rounded-lg">
                {day}
              </div>
            ))}
            
            {/* 上午课程 */}
            {[0, 1, 2].map((periodIdx) => (
              <div key={`row-${periodIdx}`} className="contents">
                <div className="h-14 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[10px] text-stone-400 leading-none">上午</div>
                    <div className="text-base font-bold text-stone-700">{periodIdx + 1}</div>
                  </div>
                </div>
                {WEEKDAYS.map((_, dayIdx) => {
                  const slot = getSlot(cls.slots, dayIdx, periodIdx);
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
                    <div className="text-[10px] text-stone-400 leading-none">下午</div>
                    <div className="text-base font-bold text-stone-700">{periodIdx + 1}</div>
                  </div>
                </div>
                {WEEKDAYS.map((_, dayIdx) => {
                  const slot = getSlot(cls.slots, dayIdx, periodIdx);
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
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染教师课表卡片
  const renderTeacherScheduleCard = (teacher: TeacherInfo) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md hover:border-stone-200 transition-all duration-300">
        {/* 教师标题栏 */}
        <div className="px-4 py-2 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${getSubjectColor(teacher.primary_subject).bg} ${getSubjectColor(teacher.primary_subject).text}`}>
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
            <Button variant="ghost" size="sm" onClick={() => viewTeacherDetail(teacher)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* 课表网格 */}
        <div className="p-3">
          <div className="grid grid-cols-6 gap-1">
            {/* 表头 */}
            <div className="h-6"></div>
            {WEEKDAYS.map((day) => (
              <div key={day} className="h-6 flex items-center justify-center text-xs font-bold text-stone-600 bg-stone-100 rounded">
                {day.slice(1)}
              </div>
            ))}
            
            {/* 课程格子 */}
            {[0, 1, 2, 3, 4, 5].map((periodIdx) => (
              <div key={`row-${periodIdx}`} className="contents">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染课表矩阵（详情弹窗）
  const renderScheduleMatrix = (matrix: (SlotData | null)[][], type: 'class' | 'teacher') => {
    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-6 gap-1.5 p-4">
          {/* 表头 */}
          <div className="h-10"></div>
          {WEEKDAYS.map((day) => (
            <div key={day} className="h-10 flex items-center justify-center text-sm font-bold text-stone-600 bg-stone-100 rounded-lg">
              {day}
            </div>
          ))}
          
          {/* 上午课程 */}
          {[0, 1, 2].map((periodIdx) => (
            <div key={`row-${periodIdx}`} className="contents">
              <div className="h-16 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[10px] text-stone-400 leading-none">上午</div>
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
              <div className="h-16 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[10px] text-stone-400 leading-none">下午</div>
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
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            全校课表总览
          </h1>
          <p className="text-muted-foreground mt-1">
            查看所有年级、班级、教师的课表安排
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{summary.totalClasses}</div>
                  <div className="text-xs text-muted-foreground">班级总数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{summary.totalTeachers}</div>
                  <div className="text-xs text-muted-foreground">有课教师</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{summary.totalSlots}</div>
                  <div className="text-xs text-muted-foreground">总课时</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round((summary.totalSlots / summary.totalClasses) || 0)}</div>
                  <div className="text-xs text-muted-foreground">平均班课时</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主内容区 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 视图切换按钮 */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'classes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('classes')}
                  className="gap-1"
                >
                  <School className="h-4 w-4" />
                  按班级
                </Button>
                <Button
                  variant={viewMode === 'teachers' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('teachers')}
                  className="gap-1"
                >
                  <Users className="h-4 w-4" />
                  按教师
                </Button>
                <Button
                  variant={viewMode === 'summary' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('summary')}
                  className="gap-1"
                >
                  <LayoutGrid className="h-4 w-4" />
                  统计
                </Button>
              </div>
            </div>
            
            {/* 筛选和搜索 */}
            <div className="flex items-center gap-3">
              {/* 年级筛选 */}
              {viewMode === 'classes' && (
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g.toString()}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* 学科筛选 */}
              {viewMode === 'teachers' && (
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择学科" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部学科</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={viewMode === 'classes' ? '搜索班级...' : '搜索教师...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 按班级视图 */}
          {viewMode === 'classes' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
                <span>加载课表数据...</span>
              </div>
            ) : classData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无课表数据
              </div>
            ) : (
              <div className="space-y-6">
                {classData.map((gradeData) => (
                  <div key={gradeData.grade} className="border rounded-xl overflow-hidden">
                    {/* 年级标题 */}
                    <div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50 to-white cursor-pointer hover:bg-stone-100 transition-colors"
                      onClick={() => toggleGrade(gradeData.grade)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedGrades.has(gradeData.grade) ? (
                          <ChevronDown className="h-5 w-5 text-stone-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-stone-400" />
                        )}
                        <span className="text-lg font-bold text-stone-800">{gradeData.gradeName}</span>
                        <Badge variant="secondary" className="ml-1">
                          {gradeData.classCount} 个班级
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        已排 {gradeData.classes.reduce((sum, c) => sum + c.slots.length, 0)} 节课
                      </div>
                    </div>
                    
                    {/* 班级课表列表 */}
                    {expandedGrades.has(gradeData.grade) && (
                      <div className="p-4 space-y-4 bg-stone-50/50">
                        {gradeData.classes.map((cls, index) => 
                          renderClassScheduleCard(cls, index, gradeData.classCount)
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
          
          {/* 按教师视图 */}
          {viewMode === 'teachers' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
                <span>加载教师数据...</span>
              </div>
            ) : filteredTeacherData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无教师课表数据
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTeacherData.map((group) => (
                  <div key={group.subject} className="border rounded-xl overflow-hidden">
                    {/* 学科标题 */}
                    <div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50 to-white cursor-pointer hover:bg-stone-100 transition-colors"
                      onClick={() => toggleSubject(group.subject)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedSubjects.has(group.subject) ? (
                          <ChevronDown className="h-5 w-5 text-stone-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-stone-400" />
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${getSubjectColor(group.subject).bg} ${getSubjectColor(group.subject).text}`}>
                          {group.subject.slice(0, 1)}
                        </div>
                        <span className="text-lg font-bold text-stone-800">{group.subject}</span>
                        <Badge variant="secondary" className="ml-1">
                          {group.teacherCount} 位教师
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        共 {group.teachers.reduce((sum, t) => sum + t.totalHours, 0)} 节课
                      </div>
                    </div>
                    
                    {/* 教师课表网格 */}
                    {expandedSubjects.has(group.subject) && (
                      <div className="p-4 bg-stone-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.teachers.map((teacher) => 
                            renderTeacherScheduleCard(teacher)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
          
          {/* 统计视图 */}
          {viewMode === 'summary' && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 年级统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">各年级课表统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.gradeStats.map((stat) => (
                      <div key={stat.grade} className="flex items-center justify-between">
                        <span className="text-sm">{stat.gradeName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {stat.classCount} 个班级
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, (stat.slotCount / (stat.classCount * 30)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {stat.slotCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* 学科统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">各学科课时统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summary.subjectStats.slice(0, 10).map((stat) => {
                      const colors = getSubjectColor(stat.subject);
                      return (
                        <div key={stat.subject} className="flex items-center justify-between">
                          <span className="text-sm">{stat.subject}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', colors.bg)}
                                style={{ width: `${Math.min(100, (stat.hours / (summary.totalSlots || 1)) * 100 * 3)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {stat.hours}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailDialog?.type === 'class' ? (
                <span className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {detailDialog?.data?.name || ''} 课表
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {detailDialog?.data?.name || ''} 课表
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {detailDialog && detailDialog.scheduleMatrix && (
            renderScheduleMatrix(detailDialog.scheduleMatrix, detailDialog.type)
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
