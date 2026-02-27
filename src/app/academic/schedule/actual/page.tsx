'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  AlertCircle,
  UserCheck,
  BookOpen,
  Users,
  CalendarDays,
} from 'lucide-react';
import type { ActualScheduleSlot } from '@/types';

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
  '信息技术': 'bg-teal-100 text-teal-700 border-teal-200',
};

const weekDays = [
  { key: 1, label: '周一' },
  { key: 2, label: '周二' },
  { key: 3, label: '周三' },
  { key: 4, label: '周四' },
  { key: 5, label: '周五' },
];

const periods = [
  { index: 1, name: '第一节', time: '08:00-08:40' },
  { index: 2, name: '第二节', time: '08:50-09:30' },
  { index: 3, name: '第三节', time: '10:00-10:40' },
  { index: 4, name: '第四节', time: '10:50-11:30' },
  { index: 5, name: '第五节', time: '14:00-14:40' },
  { index: 6, name: '第六节', time: '14:50-15:30' },
  { index: 7, name: '第七节', time: '15:40-16:20' },
  { index: 8, name: '第八节', time: '16:30-17:10' },
];

export default function ActualSchedulePage() {
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('2024-2025-1');
  const [weekNumber, setWeekNumber] = useState(12);
  const [classId, setClassId] = useState('c001');
  
  // 数据
  const [schedules, setSchedules] = useState<ActualScheduleSlot[]>([]);
  const [weekInfo, setWeekInfo] = useState<{
    weekNumber: number;
    startDate: string;
    endDate: string;
  } | null>(null);
  
  // 班级列表
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([
    { id: 'c001', name: '一年级1班' },
    { id: 'c002', name: '一年级2班' },
    { id: 'c003', name: '二年级1班' },
  ]);

  // 加载数据
  useEffect(() => {
    fetchScheduleData();
  }, [semester, weekNumber, classId]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/actual-schedules?semester=${semester}&weekNumber=${weekNumber}&classId=${classId}`
      );
      const result = await response.json();
      
      if (result.success) {
        setSchedules(result.data);
        setWeekInfo(result.weekInfo);
      }
    } catch (error) {
      console.error('获取课表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 上周/下周
  const goToPrevWeek = () => {
    if (weekNumber > 1) setWeekNumber(weekNumber - 1);
  };

  const goToNextWeek = () => {
    if (weekNumber < 22) setWeekNumber(weekNumber + 1);
  };

  // 获取指定位置的课次
  const getSlot = (dayOfWeek: number, periodIndex: number): ActualScheduleSlot | undefined => {
    return schedules.find(
      s => s.dayOfWeek === dayOfWeek && s.periodIndex === periodIndex
    );
  };

  // 获取日期显示
  const getDateForDay = (dayOfWeek: number): string => {
    if (!weekInfo?.startDate) return '';
    const startDate = new Date(weekInfo.startDate);
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOfWeek - 1);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">实际课表</h1>
          <p className="text-muted-foreground mt-1">
            查看每周实际课表，反映请假、代课等调整
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchScheduleData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">班级:</span>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-4 py-2 bg-muted rounded-lg min-w-[120px] text-center">
                  <p className="text-sm font-medium">第 {weekNumber} 周</p>
                  {weekInfo && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(weekInfo.startDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      -
                      {new Date(weekInfo.endDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* 本周统计 */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-muted-foreground">正常</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-muted-foreground">代课</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-muted-foreground">请假</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 课表主体 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-2 text-center w-20">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">时间</span>
                    </th>
                    {weekDays.map(day => (
                      <th key={day.key} className="border p-2 text-center min-w-[140px]">
                        <p className="font-medium">{day.label}</p>
                        <p className="text-xs text-muted-foreground">{getDateForDay(day.key)}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => (
                    <tr key={period.index}>
                      <td className="border p-2 text-center bg-muted/30">
                        <p className="text-sm font-medium">{period.name}</p>
                        <p className="text-xs text-muted-foreground">{period.time}</p>
                      </td>
                      {weekDays.map(day => {
                        const slot = getSlot(day.key, period.index);
                        
                        if (!slot) {
                          return (
                            <td key={day.key} className="border p-2">
                              <div className="h-16 flex items-center justify-center text-muted-foreground text-sm">
                                -
                              </div>
                            </td>
                          );
                        }
                        
                        const isAdjusted = slot.isAdjusted;
                        const isSubstitute = slot.status === 'substitute';
                        const isLeave = slot.status === 'leave';
                        
                        return (
                          <td key={day.key} className="border p-1">
                            <div
                              className={`h-16 p-2 rounded-lg transition-colors ${
                                isLeave
                                  ? 'bg-red-50 border border-red-200'
                                  : isSubstitute
                                  ? 'bg-orange-50 border border-orange-200'
                                  : 'bg-card border border-transparent'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${subjectColors[slot.subject] || ''}`}
                                >
                                  {slot.subject}
                                </Badge>
                                {isAdjusted && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      isSubstitute
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {isSubstitute ? '代' : '假'}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1">
                                <p className="text-xs truncate">{slot.teacherName}</p>
                                {isSubstitute && slot.originalTeacherName && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    原任: {slot.originalTeacherName}
                                  </p>
                                )}
                              </div>
                            </div>
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

      {/* 本周调整汇总 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">本周调整汇总</CardTitle>
          <CardDescription>第 {weekNumber} 周课表变更记录</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.filter(s => s.isAdjusted).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              本周无课表调整
            </div>
          ) : (
            <div className="space-y-3">
              {schedules
                .filter(s => s.isAdjusted)
                .map((slot, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      slot.status === 'substitute'
                        ? 'bg-orange-50'
                        : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {slot.status === 'substitute' ? (
                        <UserCheck className="h-5 w-5 text-orange-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {weekDays.find(d => d.key === slot.dayOfWeek)?.label} 第{slot.periodIndex}节
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slot.className} · {slot.subject}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {slot.status === 'substitute' ? (
                        <>
                          <p className="text-sm">
                            <span className="line-through text-muted-foreground mr-2">
                              {slot.originalTeacherName}
                            </span>
                            <span className="text-orange-600 font-medium">
                              {slot.teacherName} 代
                            </span>
                          </p>
                          {slot.substituteReason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {slot.substituteReason}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-red-600">
                          {slot.teacherName} 请假
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
