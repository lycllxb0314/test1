'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, ChevronLeft, ChevronRight, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle, User, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

interface WeeklySlot {
  slotId: string;
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  employeeId: string;
  isAdjusted: boolean;
  actualTeacherName: string;
  actualEmployeeId: string;
  adjustmentType?: string;
  adjustmentNote?: string;
  originalTeacherName?: string;
  originalEmployeeId?: string;
  applicantId?: string;
  applicantName?: string;
}

interface WeekInfo {
  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  isCurrentWeek: boolean;
}

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = [
  { index: 0, label: '第1节', time: '08:00-08:40' },
  { index: 1, label: '第2节', time: '08:50-09:30' },
  { index: 2, label: '第3节', time: '10:00-10:40' },
  { index: 3, label: '第4节', time: '10:50-11:30' },
  { index: 4, label: '第5节', time: '14:00-14:40' },
  { index: 5, label: '第6节', time: '14:50-15:30' },
];

// ==================== 主组件 ====================

export default function MySchedulePage() {
  const { user } = useAuth();
  
  // === 状态 ===
  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [viewType, setViewType] = useState<'week' | 'list'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekMonday());
  const [loading, setLoading] = useState(false);
  
  // === 加载课表 ===
  const loadSchedule = async (weekStart: string) => {
    if (!user?.employeeId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule/weekly?employeeId=${user.employeeId}&weekStartDate=${weekStart}`);
      const result = await res.json();
      
      if (result.success) {
        setSlots(result.data?.slots || []);
        setWeekInfo(result.data?.weekInfo || null);
      } else {
        toast.error(result.error || '加载课表失败');
      }
    } catch (err) {
      console.error('加载课表失败:', err);
      toast.error('加载课表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // === 初始化 ===
  useEffect(() => {
    loadSchedule(currentWeekStart);
  }, [currentWeekStart, user?.employeeId]);
  
  // === 周导航 ===
  const goToPrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(formatDate(prev));
  };
  
  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(formatDate(next));
  };
  
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekMonday());
  };
  
  // === 统计数据 ===
  const stats = {
    totalLessons: slots.length,
    adjustedLessons: slots.filter(s => s.isAdjusted).length,
    subjects: [...new Set(slots.map(s => s.subject))],
    classes: [...new Set(slots.map(s => s.className))],
  };
  
  // === 获取格子内容 ===
  const getSlotContent = (weekDay: number, periodIndex: number): WeeklySlot | null => {
    return slots.find(s => s.weekDay === weekDay && s.periodIndex === periodIndex) || null;
  };
  
  // === 渲染 ===
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            我的课表
          </h1>
          <p className="text-muted-foreground mt-1">
            查看本周课表及调课信息
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadSchedule(currentWeekStart)}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </div>
      
      {/* 周导航和视图切换 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 px-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {weekInfo?.weekStartDate || currentWeekStart} 
                  ~ 
                  {weekInfo?.weekEndDate || ''}
                </span>
                {weekInfo?.isCurrentWeek && (
                  <Badge variant="secondary">本周</Badge>
                )}
              </div>
              
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
                回到本周
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'week' | 'list')}>
                <TabsList className="h-8">
                  <TabsTrigger value="week" className="text-xs">周视图</TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">列表</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalLessons}</div>
                <div className="text-sm text-muted-foreground">本周课时</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.adjustedLessons}</div>
                <div className="text-sm text-muted-foreground">调课节数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.subjects.length}</div>
                <div className="text-sm text-muted-foreground">任教学科</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.classes.length}</div>
                <div className="text-sm text-muted-foreground">任教班级</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 课表内容 */}
      {viewType === 'week' ? (
        <WeekView 
          slots={slots} 
          loading={loading}
          getSlotContent={getSlotContent}
          currentEmployeeId={user?.employeeId}
        />
      ) : (
        <ListView 
          slots={slots} 
          loading={loading}
          currentEmployeeId={user?.employeeId}
        />
      )}
      
      {/* 图例 */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">图例说明</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-stone-100 border border-stone-200"></div>
              <span>正常课程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
              <span>调课课程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span>代课课程</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== 周视图组件 ====================

interface WeekViewProps {
  slots: WeeklySlot[];
  loading: boolean;
  getSlotContent: (weekDay: number, periodIndex: number) => WeeklySlot | null;
  currentEmployeeId?: string;
}

function WeekView({ slots, loading, getSlotContent, currentEmployeeId }: WeekViewProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            加载课表...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="py-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16 h-10 bg-stone-50 border border-stone-200 rounded-tl-lg"></th>
                {WEEKDAYS.map((day, idx) => (
                  <th key={day} className="h-10 bg-stone-50 border border-stone-200 font-medium text-stone-600 text-sm">
                    <div>{day}</div>
                    {getWeekDate(idx + 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period.index}>
                  <td className="border border-stone-200 bg-stone-50 text-center p-1">
                    <div className="text-sm font-medium">{period.label}</div>
                    <div className="text-xs text-stone-400">{period.time}</div>
                  </td>
                  {WEEKDAYS.map((_, dayIdx) => {
                    const slot = getSlotContent(dayIdx + 1, period.index);
                    const colors = slot ? getSubjectColor(slot.subject) : null;
                    
                    return (
                      <td key={dayIdx} className="border border-stone-200 p-0.5 align-top">
                        {slot ? (
                          <div 
                            className={cn(
                              "h-full min-h-[60px] rounded p-2 transition-all hover:shadow-md cursor-pointer",
                              colors?.bg, colors?.border,
                              "border",
                              slot.isAdjusted && "ring-2 ring-orange-400 ring-offset-1"
                            )}
                          >
                            <div className={cn("text-sm font-bold truncate", colors?.text)}>
                              {slot.subject}
                            </div>
                            <div className="text-xs text-stone-500 truncate">
                              {slot.className}
                            </div>
                            
                            {/* 调课标识 */}
                            {slot.isAdjusted && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-[10px] px-1 h-4 bg-orange-50 border-orange-300 text-orange-600">
                                  <RefreshCcw className="h-2.5 w-2.5 mr-0.5" />
                                  {slot.adjustmentType === 'substitute' ? '代课' : '调课'}
                                </Badge>
                                {slot.adjustmentType === 'substitute' && (() => {
                                  // 判断当前用户身份
                                  // 使用 applicantId（请假人ID）和 actualEmployeeId（实际代课人ID）判断
                                  const isOriginalTeacher = slot.applicantId === currentEmployeeId || 
                                    (slot.employeeId === currentEmployeeId && slot.actualEmployeeId !== currentEmployeeId);
                                  const isSubstitute = slot.actualEmployeeId === currentEmployeeId && 
                                    slot.applicantId !== currentEmployeeId;
                                  
                                  if (isOriginalTeacher) {
                                    // 被代课人看到代课人信息
                                    return (
                                      <>
                                        <div className="text-[10px] text-orange-600 mt-0.5 font-medium">
                                          您已请假
                                        </div>
                                        <div className="text-[10px] text-stone-400">
                                          代课人：{slot.actualTeacherName}
                                        </div>
                                      </>
                                    );
                                  } else if (isSubstitute) {
                                    // 代课人看到原教师信息
                                    return (
                                      <div className="text-[10px] text-stone-400 mt-0.5">
                                        原教师：{slot.originalTeacherName || slot.teacherName}
                                      </div>
                                    );
                                  } else {
                                    // 其他人看到双方信息
                                    return (
                                      <>
                                        <div className="text-[10px] text-stone-400 mt-0.5">
                                          代课：{slot.actualTeacherName}
                                        </div>
                                        <div className="text-[10px] text-stone-400">
                                          原教师：{slot.originalTeacherName || slot.teacherName}
                                        </div>
                                      </>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[60px] flex items-center justify-center text-stone-300 text-xs">
                            -
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
      </CardContent>
    </Card>
  );
}

// ==================== 列表视图组件 ====================

interface ListViewProps {
  slots: WeeklySlot[];
  loading: boolean;
  currentEmployeeId?: string;
}

function ListView({ slots, loading, currentEmployeeId }: ListViewProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            加载课表...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 按天分组
  const groupedSlots = WEEKDAYS.map((day, idx) => ({
    day,
    weekDay: idx + 1,
    slots: slots.filter(s => s.weekDay === idx + 1).sort((a, b) => a.periodIndex - b.periodIndex),
  }));
  
  return (
    <div className="space-y-4">
      {groupedSlots.map(({ day, weekDay, slots }) => (
        <Card key={weekDay}>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              {day}
              <span className="text-sm font-normal text-muted-foreground">
                ({getWeekDate(weekDay)})
              </span>
              <Badge variant="secondary" className="ml-auto">
                {slots.length} 节
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            {slots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                暂无课程安排
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => {
                  const colors = getSubjectColor(slot.subject);
                  const periodInfo = PERIODS[slot.periodIndex];
                  
                  return (
                    <div 
                      key={slot.slotId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        colors?.bg, colors?.border,
                        slot.isAdjusted && "ring-2 ring-orange-400 ring-offset-1"
                      )}
                    >
                      <div className="w-16 text-sm font-medium text-stone-600">
                        {periodInfo?.label}
                      </div>
                      
                      <div className="flex-1">
                        <div className={cn("font-bold", colors?.text)}>
                          {slot.subject}
                        </div>
                        <div className="text-sm text-stone-500">
                          {slot.className}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {periodInfo?.time}
                      </div>
                      
                      {slot.isAdjusted && (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="bg-orange-50 border-orange-300 text-orange-600">
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            {slot.adjustmentType === 'substitute' ? '代课' : '调课'}
                          </Badge>
                          {slot.adjustmentType === 'substitute' && (() => {
                            // 使用 applicantId（请假人ID）和 actualEmployeeId（实际代课人ID）判断
                            const isOriginalTeacher = slot.applicantId === currentEmployeeId || 
                              (slot.employeeId === currentEmployeeId && slot.actualEmployeeId !== currentEmployeeId);
                            const isSubstitute = slot.actualEmployeeId === currentEmployeeId && 
                              slot.applicantId !== currentEmployeeId;
                            
                            if (isOriginalTeacher) {
                              return (
                                <span className="text-xs text-orange-600 font-medium">
                                  代课人：{slot.actualTeacherName}
                                </span>
                              );
                            } else if (isSubstitute) {
                              return (
                                <span className="text-xs text-muted-foreground">
                                  原教师：{slot.originalTeacherName || slot.teacherName}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== 辅助函数 ====================

// 获取本周周一
function getWeekMonday(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return formatDate(monday);
}

// 格式化日期
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 获取周几对应的日期
function getWeekDate(weekDay: number): string {
  const monday = new Date(getWeekMonday());
  const target = new Date(monday);
  target.setDate(monday.getDate() + weekDay - 1);
  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${month}/${day}`;
}
