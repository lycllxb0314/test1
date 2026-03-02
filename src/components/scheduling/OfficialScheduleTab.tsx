'use client';

/**
 * 正式课表Tab组件
 * 
 * 功能：
 * - 展示已发布的正式课表
 * - 支持按班级/年级/教师筛选
 * - 点击格子可编辑
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GraduationCap,
  Users,
  Calendar,
  RefreshCw,
  Info,
} from 'lucide-react';
import { WEEKDAYS } from '@/lib/scheduling/rules';
import { useOfficialSchedule } from '@/hooks/useOfficialSchedule';
import { SlotCell } from './SlotCell';

// 科目颜色配置
const SUBJECT_COLORS: Record<string, string> = {
  '语文': 'bg-red-100 text-red-700 border-red-300',
  '数学': 'bg-blue-100 text-blue-700 border-blue-300',
  '英语': 'bg-green-100 text-green-700 border-green-300',
  '体育': 'bg-orange-100 text-orange-700 border-orange-300',
  '音乐': 'bg-purple-100 text-purple-700 border-purple-300',
  '美术': 'bg-pink-100 text-pink-700 border-pink-300',
  '科学': 'bg-teal-100 text-teal-700 border-teal-300',
  '道德与法治': 'bg-amber-100 text-amber-700 border-amber-300',
  '信息技术': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  '劳动': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  '综合实践': 'bg-lime-100 text-lime-700 border-lime-300',
  '班会': 'bg-gray-100 text-gray-700 border-gray-300',
  '书法': 'bg-rose-100 text-rose-700 border-rose-300',
  '心育': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '校本': 'bg-emerald-100 text-emerald-700 border-emerald-300',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || 'bg-gray-100 text-gray-700 border-gray-300';
}

interface OfficialScheduleTabProps {
  teachers: any[];
}

export function OfficialScheduleTab({ teachers }: OfficialScheduleTabProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  const { schedule, isLoading, error, refresh, updateSlot } = useOfficialSchedule(
    selectedClass !== 'all' ? { classId: selectedClass } : 
    selectedGrade !== 'all' ? { grade: parseInt(selectedGrade) } : undefined
  );

  // 按班级分组
  const classSchedules = useMemo(() => {
    const classMap = new Map<string, {
      classId: string;
      className: string;
      grade: number;
      slots: any[];
    }>();

    for (const slot of schedule || []) {
      if (!classMap.has(slot.class_id)) {
        classMap.set(slot.class_id, {
          classId: slot.class_id,
          className: slot.class_name,
          grade: slot.grade,
          slots: [],
        });
      }
      classMap.get(slot.class_id)!.slots.push(slot);
    }

    return Array.from(classMap.values());
  }, [schedule]);

  // 获取班级列表
  const classOptions = useMemo(() => {
    const classes = new Map<string, string>();
    for (const slot of schedule || []) {
      if (!classes.has(slot.class_id)) {
        classes.set(slot.class_id, slot.class_name);
      }
    }
    return Array.from(classes.entries()).map(([id, name]) => ({ id, name }));
  }, [schedule]);

  const handleSlotUpdate = async (slotId: string, subject: string, teacherId: string, teacherName: string) => {
    await updateSlot(slotId, subject, teacherId, teacherName);
  };

  // 将slots转换为表格数据
  const getSlotTableData = (slots: any[]) => {
    const table: Record<string, Record<string, any>> = {};
    
    for (const slot of slots) {
      const key = `${slot.week_day}-${slot.period_index}`;
      if (!table[slot.period_index]) {
        table[slot.period_index] = {};
      }
      table[slot.period_index][slot.week_day] = slot;
    }
    
    return table;
  };

  if (schedule.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">暂无正式课表</p>
            <p className="text-sm mt-2">请先在"排课草稿"中发布课表</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 筛选和刷新 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedGrade} onValueChange={(v) => {
            setSelectedGrade(v);
            setSelectedClass('all');
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="选择年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年级</SelectItem>
              <SelectItem value="1">一年级</SelectItem>
              <SelectItem value="2">二年级</SelectItem>
              <SelectItem value="3">三年级</SelectItem>
              <SelectItem value="4">四年级</SelectItem>
              <SelectItem value="5">五年级</SelectItem>
              <SelectItem value="6">六年级</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择班级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部班级</SelectItem>
              {classOptions.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 提示信息 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          点击课表格子可修改科目和教师，修改后自动保存
        </AlertDescription>
      </Alert>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 课表展示 */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-6 pr-4">
          {classSchedules.map(classSchedule => {
            const tableData = getSlotTableData(classSchedule.slots);
            
            return (
              <Card key={classSchedule.classId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{classSchedule.className}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">时段</TableHead>
                        {WEEKDAYS.map(day => (
                          <TableHead key={day} className="text-center">{day}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 上午 */}
                      {[1, 2, 3].map(period => (
                        <TableRow key={`上午${period}`}>
                          <TableCell className="font-medium bg-muted/50">
                            上午{period}
                          </TableCell>
                          {WEEKDAYS.map((_, dayIndex) => {
                            const slot = tableData[period]?.[dayIndex + 1];
                            return (
                              <TableCell key={dayIndex} className="text-center p-1">
                                <SlotCell
                                  slot={slot ? {
                                    id: slot.id,
                                    classId: slot.class_id,
                                    className: slot.class_name,
                                    grade: slot.grade,
                                    weekDay: slot.week_day,
                                    periodIndex: slot.period_index,
                                    periodName: slot.period_name,
                                    subject: slot.subject,
                                    teacherId: slot.teacher_id,
                                    teacherName: slot.teacher_name,
                                  } : null}
                                  teachers={teachers}
                                  subjectColor={getSubjectColor(slot?.subject || '')}
                                  onSlotUpdate={handleSlotUpdate}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      {/* 下午 */}
                      {[1, 2, 3].map(period => (
                        <TableRow key={`下午${period}`}>
                          <TableCell className="font-medium bg-muted/50">
                            下午{period}
                          </TableCell>
                          {WEEKDAYS.map((_, dayIndex) => {
                            const slot = tableData[period]?.[dayIndex + 1];
                            return (
                              <TableCell key={dayIndex} className="text-center p-1">
                                <SlotCell
                                  slot={slot ? {
                                    id: slot.id,
                                    classId: slot.class_id,
                                    className: slot.class_name,
                                    grade: slot.grade,
                                    weekDay: slot.week_day,
                                    periodIndex: slot.period_index,
                                    periodName: slot.period_name,
                                    subject: slot.subject,
                                    teacherId: slot.teacher_id,
                                    teacherName: slot.teacher_name,
                                  } : null}
                                  teachers={teachers}
                                  subjectColor={getSubjectColor(slot?.subject || '')}
                                  onSlotUpdate={handleSlotUpdate}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
