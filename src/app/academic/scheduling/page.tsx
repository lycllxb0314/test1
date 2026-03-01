'use client';

/**
 * 智能排课系统 - 管理界面
 * 
 * 功能：
 * 1. 排课预览 - 查看教师和班级数据
 * 2. 执行排课 - 一键生成课表
 * 3. 结果查看 - 查看排课详情、教师工作量、班级课表
 * 4. 草稿保存 - 保存排课草稿
 * 5. 确认同步 - 确认后排入正式课表
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  SaveIcon,
  SendIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react';
import type { SchedulingResult, SchedulingTeacher, SchedulingClass, ScheduleDraft } from '@/lib/scheduling/types';

interface PreviewData {
  teachers: SchedulingTeacher[];
  classes: SchedulingClass[];
  preview: {
    totalSlots: number;
    totalTeacherHours: number;
    avgTeacherHours: number;
    subjectCoverage: Array<{ subject: string; teachers: number; hours: number }>;
  };
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export default function SchedulingPage() {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [draftData, setDraftData] = useState<ScheduleDraft | null>(null);
  const [result, setResult] = useState<SchedulingResult | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // 加载预览数据
  useEffect(() => {
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/academic/scheduling?action=preview');
      const data = await response.json();
      
      if (data.success) {
        setPreviewData(data.data);
      }
    } catch (error) {
      console.error('加载预览数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeScheduling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/academic/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data.result);
        setActiveTab('result');
      } else {
        alert(data.error || '排课失败');
      }
    } catch (error) {
      console.error('执行排课失败:', error);
      alert('排课失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const confirmScheduling = async () => {
    if (!draftData) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/academic/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', draftId: draftData.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('排课结果已确认并同步到正式课表');
        setConfirmDialogOpen(false);
      } else {
        alert(data.error || '确认失败');
      }
    } catch (error) {
      console.error('确认排课失败:', error);
      alert('确认失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacherExpand = (teacherId: string) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">智能排课系统</h1>
          <p className="text-muted-foreground mt-1">
            基于教师角色、课时配置、任教学科、学段配置的自动排课
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPreviewData} disabled={loading}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
          <Button onClick={executeScheduling} disabled={loading || !previewData?.validation.valid}>
            {loading ? '排课中...' : '执行排课'}
          </Button>
        </div>
      </div>

      {/* 数据验证提示 */}
      {previewData && !previewData.validation.valid && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>数据验证失败</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {previewData.validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 统计概览 */}
      {previewData && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>教师总数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{previewData.teachers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>班级总数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{previewData.classes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总课时槽</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{previewData.preview.totalSlots}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>平均课时</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{previewData.preview.avgTeacherHours}节</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">
            <UsersIcon className="h-4 w-4 mr-2" />
            排课预览
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!result}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            排课结果
          </TabsTrigger>
          <TabsTrigger value="teachers" disabled={!result}>
            <UsersIcon className="h-4 w-4 mr-2" />
            教师工作量
          </TabsTrigger>
          <TabsTrigger value="classes" disabled={!result}>
            <ClockIcon className="h-4 w-4 mr-2" />
            班级课表
          </TabsTrigger>
        </TabsList>

        {/* 排课预览 */}
        <TabsContent value="preview" className="space-y-4">
          {previewData && (
            <>
              {/* 科目覆盖情况 */}
              <Card>
                <CardHeader>
                  <CardTitle>科目覆盖情况</CardTitle>
                  <CardDescription>各科目的教师配置和课时需求</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4">
                    {previewData.preview.subjectCoverage.map((item) => (
                      <div key={item.subject} className="border rounded-lg p-3">
                        <div className="font-medium">{item.subject}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          教师: {item.teachers}人
                        </div>
                        <div className="text-sm text-muted-foreground">
                          需求: {item.hours}节
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 教师列表 */}
              <Card>
                <CardHeader>
                  <CardTitle>教师配置 ({previewData.teachers.length}人)</CardTitle>
                  <CardDescription>参与排课的教师及其课时配置</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>主教学科</TableHead>
                        <TableHead>可教年级</TableHead>
                        <TableHead>基准课时</TableHead>
                        <TableHead>课时范围</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.teachers.slice(0, 10).map(teacher => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant="secondary">{teacher.primaryRole}</Badge>
                              {teacher.hasAdministrativeRole && (
                                <Badge variant="outline">{teacher.additionalRoles[0]}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{teacher.primarySubject}</TableCell>
                          <TableCell>{teacher.teachableGrades.join(', ')}年级</TableCell>
                          <TableCell>{teacher.baseWeeklyHours}节</TableCell>
                          <TableCell>
                            {teacher.minWeeklyHours} - {teacher.maxWeeklyHours}节
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {previewData.teachers.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      还有 {previewData.teachers.length - 10} 名教师...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 班级列表 */}
              <Card>
                <CardHeader>
                  <CardTitle>班级列表 ({previewData.classes.length}个)</CardTitle>
                  <CardDescription>需要排课的班级</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {previewData.classes.map(cls => (
                      <div key={cls.id} className="border rounded-lg p-3">
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          班主任: {cls.headTeacherName || '未设置'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          科任: {cls.subTeacherName || '未设置'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 排课结果 */}
        <TabsContent value="result" className="space-y-4">
          {result && (
            <>
              {/* 结果统计 */}
              <div className="grid grid-cols-4 gap-4">
                <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader className="pb-2">
                    <CardDescription>排课状态</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-red-500" />
                      )}
                      <span className="text-xl font-bold">
                        {result.success ? '成功' : '失败'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>已排课时</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{result.statistics.filledSlots}</div>
                    <Progress 
                      value={(result.statistics.filledSlots / result.statistics.totalSlots) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>教师平均课时</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{result.statistics.averageTeacherHours.toFixed(1)}节</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>课时调整</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{result.statistics.adjustmentsCount}人</div>
                  </CardContent>
                </Card>
              </div>

              {/* 警告信息 */}
              {result.warnings.length > 0 && (
                <Alert>
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertTitle>排课警告 ({result.warnings.length}条)</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      {result.warnings.map((warning, index) => (
                        <div key={index} className="text-sm py-1">
                          • {warning.message}
                        </div>
                      ))}
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {/* 错误信息 */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <XCircleIcon className="h-4 w-4" />
                  <AlertTitle>排课错误 ({result.errors.length}条)</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="text-sm py-1">
                          • {error.message}
                        </div>
                      ))}
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={executeScheduling} disabled={loading}>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  重新排课
                </Button>
                <Button onClick={() => setConfirmDialogOpen(true)} disabled={!result.success}>
                  <SendIcon className="h-4 w-4 mr-2" />
                  确认并同步
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* 教师工作量 */}
        <TabsContent value="teachers" className="space-y-4">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>教师工作量详情</CardTitle>
                <CardDescription>各教师的课时分配情况</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>教师</TableHead>
                      <TableHead>主教学科</TableHead>
                      <TableHead>基准课时</TableHead>
                      <TableHead>实际课时</TableHead>
                      <TableHead>调整</TableHead>
                      <TableHead>带班情况</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.teacherWorkloads.map(teacher => (
                      <TableRow key={teacher.teacherId}>
                        <TableCell className="font-medium">{teacher.teacherName}</TableCell>
                        <TableCell>{teacher.primarySubject}</TableCell>
                        <TableCell>{teacher.originalHours}节</TableCell>
                        <TableCell>
                          <span className={teacher.actualHours !== teacher.originalHours ? 'text-orange-500 font-bold' : ''}>
                            {teacher.actualHours}节
                          </span>
                        </TableCell>
                        <TableCell>
                          {teacher.adjustments.length > 0 ? (
                            <Badge variant={teacher.adjustments[0].adjustment > 0 ? 'default' : 'destructive'}>
                              {teacher.adjustments[0].adjustment > 0 ? '+' : ''}{teacher.adjustments[0].adjustment}节
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {teacher.classes.slice(0, 2).map((c, i) => (
                              <div key={i}>{c.className} ({c.subject} {c.hours}节)</div>
                            ))}
                            {teacher.classes.length > 2 && (
                              <div className="text-muted-foreground">还有 {teacher.classes.length - 2} 个班级...</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 班级课表 */}
        <TabsContent value="classes" className="space-y-4">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>班级课表概览</CardTitle>
                <CardDescription>各班级的课表完成情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {result.classSchedules.map(cls => (
                    <div key={cls.classId} className="border rounded-lg p-4">
                      <div className="font-bold text-lg">{cls.className}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        已排: {cls.filledSlots}/{cls.totalSlots} 节
                      </div>
                      <Progress 
                        value={(cls.filledSlots / cls.totalSlots) * 100} 
                        className="mt-2"
                      />
                      <div className="mt-3 text-sm">
                        <div className="font-medium mb-1">任课教师:</div>
                        <div className="flex flex-wrap gap-1">
                          {cls.teachers.slice(0, 4).map((t, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {t.teacherName}({t.subject})
                            </Badge>
                          ))}
                          {cls.teachers.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{cls.teachers.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认排课结果</DialogTitle>
            <DialogDescription>
              确认后，排课结果将同步到正式课表，当前学期的课表将被覆盖。
              此操作不可撤销，请确认无误后再继续。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">班级数量:</span>
                <span className="font-medium">{result?.statistics.totalClasses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">已排课时:</span>
                <span className="font-medium">{result?.statistics.filledSlots || 0}节</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">跨段教学:</span>
                <span className="font-medium">{result?.statistics.crossGradeAssignments || 0}人</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmScheduling} disabled={loading}>
              {loading ? '确认中...' : '确认同步'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
