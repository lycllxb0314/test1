'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { WEEKDAYS, isMainSubject, isSkillSubject } from '@/lib/scheduling/rules';
import type { ScheduleResult, ClassSchedule, TeacherSchedule } from '@/lib/scheduling/types';

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
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || 'bg-gray-100 text-gray-700 border-gray-300';
}

export default function SmartSchedulingPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ phase: '', current: 0, total: 0, message: '' });
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 执行排课
  const handleSchedule = useCallback(async () => {
    setLoading(true);
    setProgress({ phase: '初始化', current: 0, total: 7, message: '准备排课数据...' });
    setConfirmOpen(false);

    try {
      const response = await fetch('/api/academic/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        console.error('排课失败:', data.error);
      }
    } catch (error) {
      console.error('排课请求失败:', error);
    } finally {
      setLoading(false);
      setProgress({ phase: '', current: 0, total: 0, message: '' });
    }
  }, []);

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

  // 筛选教师课表
  const filteredTeacherSchedules = useMemo(() => {
    if (!result) return [];
    
    if (selectedTeacher === 'all') return result.teacherSchedules.slice(0, 20);
    
    return result.teacherSchedules.filter(t => t.teacherId === selectedTeacher);
  }, [result, selectedTeacher]);

  // 统计信息
  const statistics = useMemo(() => {
    if (!result) return null;
    
    return {
      totalClasses: result.classSchedules.length,
      totalTeachers: result.teacherSchedules.length,
      violations: result.hardConstraintViolations.length,
      penalty: result.softConstraintPenalty,
    };
  }, [result]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            智能排课系统
          </h1>
          <p className="text-muted-foreground mt-1">
            基于约束满足算法的自动排课，支持硬软约束优化
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Button variant="outline" onClick={() => setResult(null)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重新排课
            </Button>
          )}
          <Button onClick={() => setConfirmOpen(true)} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                排课中...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                开始排课
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 进度条 */}
      {loading && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.phase}</span>
                <span>{progress.message}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 排课结果 */}
      {result && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">班级总数</p>
                    <p className="text-2xl font-bold">{statistics?.totalClasses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">教师总数</p>
                    <p className="text-2xl font-bold">{statistics?.totalTeachers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">约束违反</p>
                    <p className={`text-2xl font-bold ${statistics?.violations ? 'text-red-600' : 'text-green-600'}`}>
                      {statistics?.violations}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">软约束惩罚</p>
                    <p className="text-2xl font-bold">{statistics?.penalty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 约束违反详情 */}
          {result.hardConstraintViolations.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>硬约束违反（共 {result.hardConstraintViolations.length} 项）</AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-60 overflow-y-auto">
                  <ul className="list-disc list-inside space-y-1">
                    {result.hardConstraintViolations.map((v, i) => (
                      <li key={i}>{v.message} ({v.count}处)</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 课表展示 */}
          <Tabs defaultValue="class" className="space-y-4">
            <TabsList>
              <TabsTrigger value="class" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                班级课表
              </TabsTrigger>
              <TabsTrigger value="teacher" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                教师课表
              </TabsTrigger>
            </TabsList>

            {/* 班级课表 */}
            <TabsContent value="class">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>班级课表</CardTitle>
                      <CardDescription>按班级查看排课结果</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {filteredClassSchedules.map(classSchedule => (
                      <div key={classSchedule.classId} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">{classSchedule.className}</h3>
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
                                      {slot && (
                                        <div className={`rounded p-2 text-xs ${getSubjectColor(slot.subject)}`}>
                                          <div className="font-medium">{slot.subject}</div>
                                          <div className="text-muted-foreground">{slot.teacherName}</div>
                                        </div>
                                      )}
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
                                      {slot && (
                                        <div className={`rounded p-2 text-xs ${getSubjectColor(slot.subject)}`}>
                                          <div className="font-medium">{slot.subject}</div>
                                          <div className="text-muted-foreground">{slot.teacherName}</div>
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 教师课表 */}
            <TabsContent value="teacher">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>教师课表</CardTitle>
                      <CardDescription>按教师查看排课结果</CardDescription>
                    </div>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="选择教师" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部教师（前20）</SelectItem>
                        {result.teacherSchedules.map(t => (
                          <SelectItem key={t.teacherId} value={t.teacherId}>
                            {t.teacherName} ({t.primarySubject})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {filteredTeacherSchedules.map(teacherSchedule => (
                      <div key={teacherSchedule.teacherId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{teacherSchedule.teacherName}</h3>
                          <Badge variant="outline">
                            {teacherSchedule.primarySubject} | {teacherSchedule.totalHours}节/周
                          </Badge>
                        </div>
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
                                  const slot = teacherSchedule.slots[dayIndex]?.find(
                                    s => s.timeSlot.period === '上午' && s.timeSlot.periodIndex === period
                                  );
                                  return (
                                    <TableCell key={dayIndex} className="text-center p-1">
                                      {slot && (
                                        <div className={`rounded p-2 text-xs ${getSubjectColor(slot.subject)}`}>
                                          <div className="font-medium">{slot.subject}</div>
                                          <div className="text-muted-foreground">{slot.className}</div>
                                        </div>
                                      )}
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
                                  const slot = teacherSchedule.slots[dayIndex]?.find(
                                    s => s.timeSlot.period === '下午' && s.timeSlot.periodIndex === period
                                  );
                                  return (
                                    <TableCell key={dayIndex} className="text-center p-1">
                                      {slot && (
                                        <div className={`rounded p-2 text-xs ${getSubjectColor(slot.subject)}`}>
                                          <div className="font-medium">{slot.subject}</div>
                                          <div className="text-muted-foreground">{slot.className}</div>
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* 确认对话框 */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认开始排课？</AlertDialogTitle>
            <AlertDialogDescription>
              执行智能排课将清空现有排课数据并重新生成。此操作不可撤销，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSchedule}>确认排课</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
