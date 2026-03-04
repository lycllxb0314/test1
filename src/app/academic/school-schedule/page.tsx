'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SUBJECT_COLORS, getSubjectColor } from '@/lib/subject-colors';
import { toast } from 'sonner';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const MORNING_PERIODS = ['第1节', '第2节', '第3节'];
const AFTERNOON_PERIODS = ['第4节', '第5节', '第6节'];
const ALL_PERIODS = [...MORNING_PERIODS, ...AFTERNOON_PERIODS];

const GRADES = [1, 2, 3, 4, 5, 6];

// 科目颜色
const SUBJECT_BG_COLORS: Record<string, string> = {
  '语文': 'bg-red-100 border-red-300 text-red-800',
  '数学': 'bg-blue-100 border-blue-300 text-blue-800',
  '英语': 'bg-purple-100 border-purple-300 text-purple-800',
  '科学': 'bg-teal-100 border-teal-300 text-teal-800',
  '道德与法治': 'bg-orange-100 border-orange-300 text-orange-800',
  '音乐': 'bg-pink-100 border-pink-300 text-pink-800',
  '美术': 'bg-amber-100 border-amber-300 text-amber-800',
  '体育': 'bg-green-100 border-green-300 text-green-800',
  '信息技术': 'bg-cyan-100 border-cyan-300 text-cyan-800',
  '书法': 'bg-rose-100 border-rose-300 text-rose-800',
  '劳动': 'bg-lime-100 border-lime-300 text-lime-800',
  '综合实践': 'bg-indigo-100 border-indigo-300 text-indigo-800',
  '校本': 'bg-violet-100 border-violet-300 text-violet-800',
  '班会': 'bg-yellow-100 border-yellow-300 text-yellow-800',
};

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
    data: any;
    scheduleMatrix: (SlotData | null)[][];
  } | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载概览数据
      const summaryRes = await fetch('/api/academic/school-schedule?mode=summary');
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummary(summaryData.data);
      }
      
      // 根据视图模式加载对应数据
      if (viewMode === 'classes') {
        const gradeParam = gradeFilter !== 'all' ? `&grade=${gradeFilter}` : '';
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/academic/school-schedule?mode=all-classes${gradeParam}${searchParam}`);
        const data = await res.json();
        if (data.success) {
          setClassData(data.data);
        }
      } else if (viewMode === 'teachers') {
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`/api/academic/school-schedule?mode=all-teachers${searchParam}`);
        const data = await res.json();
        if (data.success) {
          setTeacherData(data.data);
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
      if (data.success) {
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
      if (data.success) {
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

  // 获取课表格子背景色
  const getSlotBgColor = (subject: string) => {
    return SUBJECT_BG_COLORS[subject] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  // 渲染课表矩阵
  const renderScheduleMatrix = (matrix: (SlotData | null)[][], type: 'class' | 'teacher') => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16 h-10 bg-muted/50 border text-xs font-medium"></th>
              {WEEKDAYS.map((day) => (
                <th key={day} className="w-24 h-10 bg-muted/50 border text-xs font-medium">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, periodIndex) => (
              <tr key={periodIndex}>
                <td className="h-14 bg-muted/30 border text-xs text-center font-medium">
                  {ALL_PERIODS[periodIndex]}
                </td>
                {row.map((slot, dayIndex) => (
                  <td key={dayIndex} className="h-14 border p-0.5">
                    {slot ? (
                      <div className={cn(
                        'h-full rounded text-xs p-1 border flex flex-col justify-center items-center',
                        getSlotBgColor(slot.subject)
                      )}>
                        <div className="font-medium truncate w-full text-center">{slot.subject}</div>
                        <div className="text-[10px] opacity-70 truncate w-full text-center">
                          {type === 'class' ? slot.teacher_name : slot.class_name}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full bg-gray-50 rounded"></div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
            <CardTitle className="text-lg">课表查看</CardTitle>
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
          {/* 视图切换和内容 */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="mb-4">
              <TabsTrigger value="classes" className="flex items-center gap-1">
                <School className="h-4 w-4" />
                按班级
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                按教师
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <LayoutGrid className="h-4 w-4" />
                统计
              </TabsTrigger>
            </TabsList>
          
            {/* 按班级视图 */}
            <TabsContent value="classes" className="mt-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                加载中...
              </div>
            ) : classData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无课表数据
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {classData.map((gradeData) => (
                    <div key={gradeData.grade} className="border rounded-lg">
                      {/* 年级标题 */}
                      <div
                        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleGrade(gradeData.grade)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedGrades.has(gradeData.grade) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{gradeData.gradeName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {gradeData.classCount} 个班级
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          已排 {gradeData.classes.reduce((sum, c) => sum + c.slots.length, 0)} 节课
                        </div>
                      </div>
                      
                      {/* 班级列表 */}
                      {expandedGrades.has(gradeData.grade) && (
                        <div className="p-3 space-y-3">
                          {gradeData.classes.map((cls) => (
                            <div
                              key={cls.id}
                              className="border rounded-lg p-3 hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{cls.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {cls.slots.length} 节课
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewClassDetail(cls)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  查看课表
                                </Button>
                              </div>
                              
                              {/* 班主任信息 */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                {cls.head_teacher && (
                                  <span>
                                    班主任：{cls.head_teacher.name}
                                    {cls.head_teacher.primary_subject && ` (${cls.head_teacher.primary_subject})`}
                                  </span>
                                )}
                                {cls.sub_teacher && (
                                  <span>
                                    副班主任：{cls.sub_teacher.name}
                                    {cls.sub_teacher.primary_subject && ` (${cls.sub_teacher.primary_subject})`}
                                  </span>
                                )}
                              </div>
                              
                              {/* 课表缩略图 */}
                              <div className="grid grid-cols-5 gap-1">
                                {ALL_PERIODS.map((_, periodIndex) => (
                                  WEEKDAYS.map((_, dayIndex) => {
                                    const slot = cls.slots.find(
                                      s => s.week_day === dayIndex + 1 && s.period_index === periodIndex
                                    );
                                    return (
                                      <div
                                        key={`${periodIndex}-${dayIndex}`}
                                        className={cn(
                                          'h-5 text-[8px] rounded flex items-center justify-center border',
                                          slot
                                            ? getSlotBgColor(slot.subject)
                                            : 'bg-gray-50 border-gray-200'
                                        )}
                                      >
                                        {slot?.subject?.substring(0, 2) || ''}
                                      </div>
                                    );
                                  })
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          {/* 按教师视图 */}
          <TabsContent value="teachers" className="mt-0">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                加载中...
              </div>
            ) : filteredTeacherData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无教师课表数据
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {filteredTeacherData.map((group) => (
                    <div key={group.subject} className="border rounded-lg">
                      {/* 学科标题 */}
                      <div
                        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSubject(group.subject)}
                      >
                        <div className="flex items-center gap-2">
                          {expandedSubjects.has(group.subject) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{group.subject}</span>
                          <Badge variant="secondary" className="ml-2">
                            {group.teacherCount} 位教师
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          共 {group.teachers.reduce((sum, t) => sum + t.totalHours, 0)} 节课
                        </div>
                      </div>
                      
                      {/* 教师列表 */}
                      {expandedSubjects.has(group.subject) && (
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.teachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              className="border rounded-lg p-3 hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{teacher.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {teacher.totalHours} 节课
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewTeacherDetail(teacher)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* 课表缩略图 */}
                              <div className="grid grid-cols-5 gap-0.5">
                                {ALL_PERIODS.map((_, periodIndex) => (
                                  WEEKDAYS.map((_, dayIndex) => {
                                    const slot = teacher.slots.find(
                                      s => s.week_day === dayIndex + 1 && s.period_index === periodIndex
                                    );
                                    return (
                                      <div
                                        key={`${periodIndex}-${dayIndex}`}
                                        className={cn(
                                          'h-4 text-[8px] rounded flex items-center justify-center border',
                                          slot
                                            ? 'bg-green-100 border-green-300 text-green-800'
                                            : 'bg-gray-50 border-gray-200'
                                        )}
                                      >
                                        {slot ? '●' : ''}
                                      </div>
                                    );
                                  })
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          {/* 统计视图 */}
          <TabsContent value="summary" className="mt-0">
            {summary && (
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
                      {summary.subjectStats.slice(0, 10).map((stat) => (
                        <div key={stat.subject} className="flex items-center justify-between">
                          <span className="text-sm">{stat.subject}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  SUBJECT_BG_COLORS[stat.subject]?.split(' ')[0] || 'bg-gray-300'
                                )}
                                style={{ width: `${Math.min(100, (stat.hours / (summary.totalSlots || 1)) * 100 * 3)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {stat.hours}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          </Tabs>
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
            <div className="mt-4">
              {renderScheduleMatrix(detailDialog.scheduleMatrix, detailDialog.type)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
