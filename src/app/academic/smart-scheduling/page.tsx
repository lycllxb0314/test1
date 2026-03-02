'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  FileText,
  Send,
  FolderOpen,
} from 'lucide-react';
import { WEEKDAYS } from '@/lib/scheduling/rules';
import type { ScheduleResult, ClassSchedule, TeacherSchedule, ScheduleSlot } from '@/lib/scheduling/types';
import { useScheduleDraft, type ScheduleDraft } from '@/hooks/useScheduleDraft';
import { DraftList } from '@/components/scheduling/DraftList';
import { DraftScheduleTab } from '@/components/scheduling/DraftScheduleTab';
import { OfficialScheduleTab } from '@/components/scheduling/OfficialScheduleTab';

/**
 * 将草稿数据转换为排课结果格式
 */
function convertDraftToResult(draft: ScheduleDraft, teachers: any[]): ScheduleResult {
  const classMap = new Map<string, ClassSchedule>();
  const teacherMap = new Map<string, TeacherSchedule>();
  
  // 遍历所有课表格子
  for (const slot of draft.slots || []) {
    // 确定时段（上午/下午）和节次
    // 数据库中：上午1-3对应period_index=1,2,3，下午1-3对应period_index=4,5,6
    let period: '上午' | '下午' = '上午';
    let periodIndex = slot.period_index;
    
    if (slot.period_name?.includes('下午') || slot.period_index > 3) {
      period = '下午';
      // 下午课程：period_index 4,5,6 转换为 1,2,3
      periodIndex = slot.period_index - 3;
    }
    
    // 创建 ScheduleSlot
    const scheduleSlot: ScheduleSlot = {
      timeSlotId: `${slot.week_day}_${period}_${periodIndex}`,
      timeSlot: {
        weekday: WEEKDAYS[slot.week_day - 1] || '周一',
        period,
        periodIndex,
      },
      classId: slot.class_id,
      className: slot.class_name,
      grade: slot.grade,
      subject: slot.subject,
      teacherId: slot.teacher_id,
      teacherName: slot.teacher_name,
    };
    
    // 添加到班级课表
    if (!classMap.has(slot.class_id)) {
      classMap.set(slot.class_id, {
        classId: slot.class_id,
        className: slot.class_name,
        grade: slot.grade,
        slots: [[], [], [], [], []], // 5天
      });
    }
    const classSchedule = classMap.get(slot.class_id)!;
    const dayIndex = slot.week_day - 1;
    if (classSchedule.slots[dayIndex]) {
      classSchedule.slots[dayIndex].push(scheduleSlot);
    }
    
    // 添加到教师课表
    if (!teacherMap.has(slot.teacher_id)) {
      const teacher = teachers.find(t => t.id === slot.teacher_id);
      teacherMap.set(slot.teacher_id, {
        teacherId: slot.teacher_id,
        teacherName: slot.teacher_name,
        primarySubject: teacher?.primarySubject || '',
        slots: [[], [], [], [], []],
        totalHours: 0,
      });
    }
    const teacherSchedule = teacherMap.get(slot.teacher_id)!;
    teacherSchedule.slots[dayIndex].push(scheduleSlot);
    teacherSchedule.totalHours++;
  }
  
  // 对每个班级的 slots 按时间排序
  for (const classSchedule of classMap.values()) {
    for (const daySlots of classSchedule.slots) {
      daySlots.sort((a, b) => {
        const aOrder = (a.timeSlot.period === '上午' ? 0 : 100) + a.timeSlot.periodIndex;
        const bOrder = (b.timeSlot.period === '上午' ? 0 : 100) + b.timeSlot.periodIndex;
        return aOrder - bOrder;
      });
    }
  }
  
  const classSchedules = Array.from(classMap.values());
  const teacherSchedules = Array.from(teacherMap.values());
  
  return {
    success: true,
    message: `已载入草稿: ${draft.name}`,
    classSchedules,
    teacherSchedules,
    statistics: {
      totalSlots: draft.slots?.length || 0,
      assignedSlots: draft.slots?.length || 0,
      unassignedSlots: 0,
      teacherHoursVariance: 0,
      averageTeacherHours: teacherSchedules.length > 0 
        ? teacherSchedules.reduce((sum, t) => sum + t.totalHours, 0) / teacherSchedules.length 
        : 0,
    },
    hardConstraintViolations: [],
    softConstraintPenalty: 0,
    softConstraintDetails: [],
  };
}

export default function SmartSchedulingPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ phase: '', current: 0, total: 0, message: '' });
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  // 草稿管理
  const {
    drafts,
    currentDraft,
    isLoading: draftLoading,
    error: draftError,
    fetchDrafts,
    saveDraft,
    loadDraft,
    publishDraft,
    deleteDraft,
    createSlot,
  } = useScheduleDraft();

  // 获取教师列表
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers?pageSize=200');
        const data = await response.json();
        if (data.success && data.data) {
          setTeachers(data.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            primarySubject: t.primary_subject,
            secondarySubjects: t.secondary_subjects || [],
            teachableGrades: t.teachable_grades || [1, 2, 3, 4, 5, 6],
            weeklyHours: t.total_weekly_hours || 16,
            currentHours: 0,
          })));
        }
      } catch (err) {
        console.error('获取教师列表失败:', err);
      }
    };
    fetchTeachers();
    fetchDrafts('all');
  }, [fetchDrafts]);

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

  // 保存草稿
  const handleSaveDraft = useCallback(async (name: string) => {
    if (!result) return;

    // 转换结果为数据库格式
    const slots: any[] = [];
    for (const classSchedule of result.classSchedules) {
      for (let dayIndex = 0; dayIndex < classSchedule.slots.length; dayIndex++) {
        for (const slot of classSchedule.slots[dayIndex]) {
          slots.push({
            classId: slot.classId,
            className: slot.className,
            grade: slot.grade,
            weekDay: dayIndex + 1,
            periodIndex: slot.timeSlot.period === '上午' 
              ? slot.timeSlot.periodIndex 
              : slot.timeSlot.periodIndex + 3,
            periodName: `${slot.timeSlot.period}${slot.timeSlot.periodIndex}`,
            subject: slot.subject,
            teacherId: slot.teacherId,
            teacherName: slot.teacherName,
          });
        }
      }
    }

    const draft = await saveDraft(name, slots, '智能排课生成');
    if (draft) {
      alert('草稿保存成功！');
    }
  }, [result, saveDraft]);

  // 载入草稿
  const handleLoadDraft = useCallback(async (draftId: string) => {
    const draft = await loadDraft(draftId);
    if (draft && draft.slots) {
      // 将草稿数据转换为结果格式
      const convertedResult = convertDraftToResult(draft, teachers);
      setResult(convertedResult);
      // currentDraft 已经在 loadDraft 中更新
    }
  }, [loadDraft, teachers]);

  // 发布草稿
  const handlePublish = useCallback(async () => {
    setPublishDialogOpen(false);
    const success = await publishDraft(currentDraft?.id || '');
    if (success) {
      alert('课表发布成功！正式课表已更新。');
      fetchDrafts('all');
    }
  }, [currentDraft, publishDraft, fetchDrafts]);

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
            基于约束满足算法的自动排课，支持草稿编辑和发布
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

      {/* 主要内容区域 */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            排课结果
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            草稿管理
          </TabsTrigger>
          <TabsTrigger value="official" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            正式课表
          </TabsTrigger>
        </TabsList>

        {/* 排课结果 */}
        <TabsContent value="schedule">
          {result ? (
            <>
              {/* 统计卡片 */}
              <div className="grid grid-cols-4 gap-4 mb-6">
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

              {/* 排课结果展示 */}
              <DraftScheduleTab
                result={result}
                teachers={teachers}
                onSaveDraft={handleSaveDraft}
                onPublish={async () => { setPublishDialogOpen(true); }}
                onSlotCreate={async (slotData) => {
                  if (currentDraft?.id) {
                    const success = await createSlot(currentDraft.id, slotData);
                    if (success) {
                      // 可以添加成功提示
                    }
                  } else {
                    // 如果没有当前草稿，需要先提示用户保存草稿
                    alert('请先保存草稿后再编辑');
                  }
                }}
                isSaving={draftLoading}
              />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无排课结果</p>
                  <p className="text-sm mt-2">点击"开始排课"按钮执行智能排课</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 草稿管理 */}
        <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                草稿管理
              </CardTitle>
              <CardDescription>
                管理排课草稿，支持载入、编辑和发布
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{draftError}</AlertDescription>
                </Alert>
              )}
              <DraftList
                drafts={drafts}
                isLoading={draftLoading}
                onLoad={handleLoadDraft}
                onDelete={async (id) => {
                  const success = await deleteDraft(id);
                  if (success) {
                    alert('草稿已删除');
                  }
                }}
                onPublish={async (id) => {
                  await loadDraft(id);
                  setPublishDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 正式课表 */}
        <TabsContent value="official">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                正式课表
              </CardTitle>
              <CardDescription>
                已发布的正式课表，点击格子可修改科目和教师
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OfficialScheduleTab teachers={teachers} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 确认排课对话框 */}
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

      {/* 发布确认对话框 */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认发布课表？</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              发布后将替换现有的正式课表，教师详情和班级详情中的教师团队信息将自动更新。
            </p>
            {result && result.hardConstraintViolations.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>警告</AlertTitle>
                <AlertDescription>
                  当前排课存在 {result.hardConstraintViolations.length} 项硬约束违反，建议修复后再发布。
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              确认发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
