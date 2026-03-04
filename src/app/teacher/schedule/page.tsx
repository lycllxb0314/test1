'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  Users,
  School,
  BookOpen,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';
import { getGradeSubjectHours } from '@/lib/schedule-config';
import { toast } from 'sonner';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const ALL_PERIODS = ['第1节', '第2节', '第3节', '第4节', '第5节', '第6节'];

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

interface TeacherInfo {
  id: string;
  name: string;
  primary_subject: string;
  employee_id?: string;
}

interface ClassInfo {
  classId: string;
  className: string;
  grade: number;
  subjects: string[];
  totalHours: number;
  headTeacher?: { id: string; name: string; primary_subject: string } | null;
}

interface PersonalScheduleData {
  teacher: TeacherInfo;
  scheduleMatrix: (SlotData | null)[][];
  byWeekday: Record<number, SlotData[]>;
  slots: SlotData[];
  totalHours: number;
  classes: { id: string; name: string; grade: number }[];
}

interface ClassScheduleData {
  class: {
    id: string;
    name: string;
    grade: number;
    head_teacher?: { id: string; name: string; primary_subject: string } | null;
    sub_teacher?: { id: string; name: string; primary_subject: string } | null;
  };
  scheduleMatrix: (SlotData | null)[][];
  slots: SlotData[];
  subjectCount: Record<string, number>;
  totalSlots: number;
}

export default function TeacherSchedulePage() {
  // 个人课表数据
  const [personalData, setPersonalData] = useState<PersonalScheduleData | null>(null);
  
  // 任教班级列表
  const [teachingClasses, setTeachingClasses] = useState<ClassInfo[]>([]);
  
  // 当前选中的班级课表
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classSchedule, setClassSchedule] = useState<ClassScheduleData | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(true);
  const [loadingClass, setLoadingClass] = useState(false);
  
  // 视图模式
  const [viewMode, setViewMode] = useState<'personal' | 'classes'>('personal');

  // 加载个人课表和任教班级
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载个人课表和任教班级
      const [personalRes, classesRes] = await Promise.all([
        fetch('/api/teacher/schedule?mode=personal'),
        fetch('/api/teacher/schedule?mode=classes'),
      ]);
      
      const personalResult = await personalRes.json();
      const classesResult = await classesRes.json();
      
      if (personalResult.success && personalResult.data) {
        setPersonalData(personalResult.data);
      }
      
      if (classesResult.success && classesResult.data) {
        setTeachingClasses(classesResult.data.teachingClasses || []);
        // 默认选中第一个班级
        if (classesResult.data.teachingClasses?.length > 0 && !selectedClassId) {
          setSelectedClassId(classesResult.data.teachingClasses[0].classId);
        }
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  // 加载班级课表
  const loadClassSchedule = useCallback(async (classId: string) => {
    if (!classId) return;
    
    setLoadingClass(true);
    try {
      const res = await fetch(`/api/teacher/schedule?mode=class-schedule&classId=${classId}`);
      const result = await res.json();
      
      if (result.success && result.data) {
        setClassSchedule(result.data);
      }
    } catch (err) {
      console.error('加载班级课表失败:', err);
      toast.error('加载班级课表失败');
    } finally {
      setLoadingClass(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (viewMode === 'classes' && selectedClassId) {
      loadClassSchedule(selectedClassId);
    }
  }, [viewMode, selectedClassId, loadClassSchedule]);

  // 渲染课表网格
  const renderScheduleGrid = (
    matrix: (SlotData | null)[][],
    type: 'personal' | 'class',
    showTeacher: boolean = true
  ) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
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
                {matrix[periodIdx]?.map((slot, dayIdx) => {
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
                            <span className="text-xs text-stone-500 truncate max-w-full">
                              {type === 'personal' ? slot.class_name : (showTeacher ? slot.teacher_name : '')}
                            </span>
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
                {matrix[periodIdx]?.map((slot, dayIdx) => {
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
                            <span className="text-xs text-stone-500 truncate max-w-full">
                              {type === 'personal' ? slot.class_name : (showTeacher ? slot.teacher_name : '')}
                            </span>
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

  // 渲染每日课程列表（个人课表快速预览）
  const renderWeekdayList = () => {
    if (!personalData?.byWeekday) return null;
    
    return (
      <div className="grid grid-cols-5 gap-3">
        {WEEKDAYS.map((day, dayIdx) => {
          const daySlots = personalData.byWeekday[dayIdx + 1] || [];
          return (
            <div key={day} className="bg-white rounded-lg border border-stone-100 overflow-hidden">
              <div className="px-3 py-2 bg-stone-50 border-b border-stone-100">
                <span className="text-sm font-bold text-stone-700">{day}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {daySlots.length}节
                </Badge>
              </div>
              <div className="p-2 space-y-1 min-h-[100px]">
                {daySlots.length === 0 ? (
                  <div className="text-xs text-stone-400 text-center py-4">无课程</div>
                ) : (
                  daySlots.map((slot, idx) => {
                    const colors = getSubjectColor(slot.subject);
                    return (
                      <div key={idx} className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                        <div className={`text-xs font-bold ${colors.text}`}>
                          第{slot.period_index + 1}节 {slot.subject}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {slot.class_name}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染班级课表卡片
  const renderClassScheduleCard = () => {
    if (!classSchedule) return null;
    
    const cls = classSchedule.class;
    
    // 科目课时统计
    const gradeSubjectHours = getGradeSubjectHours(cls.grade);
    const allSubjectsCount = gradeSubjectHours.map(({ subject }) => ({
      subject,
      count: classSchedule.subjectCount[subject] || 0,
    }));
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {/* 班级标题栏 */}
        <div className="px-4 py-2 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-stone-800">{cls.name}</span>
            <Badge variant="secondary" className="text-xs">
              {cls.grade}年级
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {cls.head_teacher && (
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400">班主任</span>
                <span className="font-medium text-stone-700">{cls.head_teacher.name}</span>
                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  {cls.head_teacher.primary_subject || ''}
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
          <span className="text-xs text-stone-500 ml-auto shrink-0 font-medium">共{classSchedule.totalSlots}节</span>
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
                {classSchedule.scheduleMatrix[periodIdx]?.map((slot, dayIdx) => {
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
                {classSchedule.scheduleMatrix[periodIdx]?.map((slot, dayIdx) => {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            我的课表
          </h1>
          <p className="text-muted-foreground mt-1">
            查看个人课程安排和任教班级课表
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {personalData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{personalData.totalHours}</div>
                  <div className="text-xs text-muted-foreground">周课时</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{personalData.classes.length}</div>
                  <div className="text-xs text-muted-foreground">任教班级</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{personalData.teacher.primary_subject}</div>
                  <div className="text-xs text-muted-foreground">任教学科</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round((personalData.totalHours / 30) * 100)}%</div>
                  <div className="text-xs text-muted-foreground">课时占比</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主内容区 - 视图切换 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'personal' | 'classes')}>
        <TabsList className="mb-4">
          <TabsTrigger value="personal" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            个人课表
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-1">
            <School className="h-4 w-4" />
            班级课表
            {teachingClasses.length > 0 && (
              <Badge variant="secondary" className="ml-1">{teachingClasses.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 个人课表视图 */}
        <TabsContent value="personal" className="mt-0 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
              <span>加载课表数据...</span>
            </div>
          ) : !personalData ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无课表数据
            </div>
          ) : (
            <>
              {/* 每日课程快速预览 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">本周课程概览</CardTitle>
                  <CardDescription>快速查看每天课程安排</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderWeekdayList()}
                </CardContent>
              </Card>
              
              {/* 完整课表网格 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">完整课表</CardTitle>
                  <CardDescription>
                    {personalData.teacher.name} · {personalData.teacher.primary_subject}教师 · 共{personalData.totalHours}节课
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderScheduleGrid(personalData.scheduleMatrix, 'personal')}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 班级课表视图 */}
        <TabsContent value="classes" className="mt-0 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
              <span>加载任教班级...</span>
            </div>
          ) : teachingClasses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无任教班级数据
            </div>
          ) : (
            <>
              {/* 班级选择 Tab */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {teachingClasses.map((cls) => (
                  <Button
                    key={cls.classId}
                    variant={selectedClassId === cls.classId ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedClassId(cls.classId)}
                    className="shrink-0"
                  >
                    <School className="h-4 w-4 mr-1" />
                    {cls.className}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {cls.totalHours}节
                    </Badge>
                  </Button>
                ))}
              </div>
              
              {/* 班级课表内容 */}
              {loadingClass ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                  <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
                  <span>加载班级课表...</span>
                </div>
              ) : classSchedule ? (
                renderClassScheduleCard()
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  请选择班级查看课表
                </div>
              )}
              
              {/* 任教班级信息卡片 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">任教班级汇总</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teachingClasses.map((cls) => (
                      <div
                        key={cls.classId}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedClassId === cls.classId
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                        onClick={() => setSelectedClassId(cls.classId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-stone-800">{cls.className}</span>
                          <ChevronRight className="h-4 w-4 text-stone-400" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span>{cls.grade}年级</span>
                          <span>·</span>
                          <span>{cls.totalHours}节课</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {cls.subjects.map((subject) => {
                            const colors = getSubjectColor(subject);
                            return (
                              <span key={subject} className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                {subject}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
