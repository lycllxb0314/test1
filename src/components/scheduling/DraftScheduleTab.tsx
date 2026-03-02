'use client';

/**
 * 草稿排课Tab组件
 * 
 * 功能：
 * - 展示排课草稿
 * - 支持编辑
 */

import { useState, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Save,
  Send,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { WEEKDAYS } from '@/lib/scheduling/rules';
import type { ScheduleResult, ClassSchedule } from '@/lib/scheduling/types';
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

interface DraftScheduleTabProps {
  result: ScheduleResult | null;
  teachers: any[];
  onSaveDraft: (name: string) => Promise<void>;
  onPublish: () => Promise<void>;
  onSlotUpdate?: (slotId: string, subject: string, teacherId: string, teacherName: string) => Promise<void>;
  onSlotCreate?: (slotData: {
    classId: string;
    className: string;
    grade: number;
    weekDay: number;
    periodIndex: number;
    periodName: string;
    subject: string;
    teacherId: string;
    teacherName: string;
  }) => Promise<void>;
  isSaving: boolean;
}

export function DraftScheduleTab({
  result,
  teachers,
  onSaveDraft,
  onPublish,
  onSlotUpdate,
  onSlotCreate,
  isSaving,
}: DraftScheduleTabProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [draftName, setDraftName] = useState('');

  // 筛选班级课表
  const filteredClassSchedules = useMemo(() => {
    if (!result) return [];
    
    let filtered = result.classSchedules;
    
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(c => c.grade === parseInt(selectedGrade));
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(c => c.classId === selectedClass);
    }
    
    return filtered;
  }, [result, selectedGrade, selectedClass]);

  if (!result) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">暂无排课结果</p>
            <p className="text-sm mt-2">请先执行智能排课</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSaveDraft = async () => {
    const name = draftName || `排课草稿 ${new Date().toLocaleString('zh-CN')}`;
    await onSaveDraft(name);
    setDraftName('');
  };

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
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
              {result.classSchedules
                .filter(c => selectedGrade === 'all' || c.grade === parseInt(selectedGrade))
                .map(c => (
                  <SelectItem key={c.classId} value={c.classId}>
                    {c.className}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            保存草稿
          </Button>
          <Button 
            onClick={onPublish}
            disabled={isSaving || result.hardConstraintViolations.length > 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            发布课表
          </Button>
        </div>
      </div>

      {/* 约束违反提示 */}
      {result.hardConstraintViolations.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              硬约束违反（共 {result.hardConstraintViolations.length} 项）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {result.hardConstraintViolations.map((v, i) => (
                  <li key={i}>{v.message} ({v.count}处)</li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 课表展示 */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-6 pr-4">
          {filteredClassSchedules.map(classSchedule => (
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
                          const slot = classSchedule.slots[dayIndex]?.find(
                            s => s.timeSlot.period === '上午' && s.timeSlot.periodIndex === period
                          );
                          return (
                            <TableCell key={dayIndex} className="text-center p-1">
                              <SlotCell
                                slot={slot ? {
                                  classId: classSchedule.classId,
                                  className: classSchedule.className,
                                  grade: classSchedule.grade,
                                  weekDay: dayIndex + 1,
                                  periodIndex: period,
                                  periodName: `上午${period}`,
                                  subject: slot.subject,
                                  teacherId: slot.teacherId,
                                  teacherName: slot.teacherName,
                                } : null}
                                emptySlotData={{
                                  classId: classSchedule.classId,
                                  className: classSchedule.className,
                                  grade: classSchedule.grade,
                                  weekDay: dayIndex + 1,
                                  periodIndex: period,
                                  periodName: `上午${period}`,
                                }}
                                teachers={teachers}
                                subjectColor={slot ? getSubjectColor(slot.subject) : undefined}
                                onSlotUpdate={onSlotUpdate}
                                onSlotCreate={onSlotCreate}
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
                          const slot = classSchedule.slots[dayIndex]?.find(
                            s => s.timeSlot.period === '下午' && s.timeSlot.periodIndex === period
                          );
                          return (
                            <TableCell key={dayIndex} className="text-center p-1">
                              <SlotCell
                                slot={slot ? {
                                  classId: classSchedule.classId,
                                  className: classSchedule.className,
                                  grade: classSchedule.grade,
                                  weekDay: dayIndex + 1,
                                  periodIndex: period,
                                  periodName: `下午${period}`,
                                  subject: slot.subject,
                                  teacherId: slot.teacherId,
                                  teacherName: slot.teacherName,
                                } : null}
                                emptySlotData={{
                                  classId: classSchedule.classId,
                                  className: classSchedule.className,
                                  grade: classSchedule.grade,
                                  weekDay: dayIndex + 1,
                                  periodIndex: period,
                                  periodName: `下午${period}`,
                                }}
                                teachers={teachers}
                                subjectColor={slot ? getSubjectColor(slot.subject) : undefined}
                                onSlotUpdate={onSlotUpdate}
                                onSlotCreate={onSlotCreate}
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
