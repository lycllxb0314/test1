'use client';

/**
 * 教务端 - 课后服务管理
 *
 * 功能：
 * - 课程管理（创建/编辑/删除/发布/关闭）
 * - 选课统计概览
 * - 点名表查看（一键导出 CSV）
 * - 零教师审批负担
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/services/api-client';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Users,
  BookOpen,
  Clock,
  CalendarDays,
  Loader2,
  RefreshCw,
  BarChart3,
  Download,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Zap,
  Flame,
  Snowflake,
} from 'lucide-react';
import type { AfterSchoolCourse, CourseEnrollment, CreateCourseDTO, CourseCategory, DayOfWeek } from '@/types/after-school';
import { CATEGORY_CONFIG, DAY_LABELS } from '@/types/after-school';
import { useCoursePrediction, useCourseGeneration } from '@/hooks/useAfterSchoolAI';
import type { CoursePrediction } from '@/types/after-school-ai';

const CATEGORY_OPTIONS = [
  { value: 'care', label: '课后托管' },
  { value: 'interest', label: '兴趣班' },
  { value: 'art', label: '艺术' },
  { value: 'sports', label: '体育' },
  { value: 'tech', label: '科技' },
  { value: 'academic', label: '学科辅导' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '开放选课', color: 'bg-[#5C7A72]/10 text-[#5C7A72]' },
  { value: 'closed', label: '已关闭', color: 'bg-muted text-muted-foreground' },
];

const DEFAULT_FORM: CreateCourseDTO = {
  name: '',
  type: '兴趣班',
  teacherId: '',
  teacherName: '',
  classroom: '',
  dayOfWeek: 1 as DayOfWeek,
  startTime: '16:30',
  endTime: '17:30',
  maxStudents: 25,
  description: '',
  targetGrades: [1, 2, 3, 4, 5, 6],
  category: 'interest' as CourseCategory,
  status: 'active',
};

export default function AcademicAfterSchoolPage() {
  const [courses, setCourses] = useState<AfterSchoolCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialog, setFormDialog] = useState<{ open: boolean; course?: AfterSchoolCourse }>({ open: false });
  const [rosterDialog, setRosterDialog] = useState<{ open: boolean; courseId: string; courseName: string }>({ open: false, courseId: '', courseName: '' });
  const [roster, setRoster] = useState<CourseEnrollment[]>([]);

  // AI 功能
  const { predictions, loading: predicting, predict } = useCoursePrediction();
  const { generatedContent, isGenerating, generate: generateCourseContent, clearContent } = useCourseGeneration();
  const [showPrediction, setShowPrediction] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCourseDTO>({ ...DEFAULT_FORM });

  // 加载课程列表
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<AfterSchoolCourse[]>>('/after-school/courses');
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // 打开创建/编辑表单
  const openFormDialog = (course?: AfterSchoolCourse) => {
    if (course) {
      setFormData({
        name: course.name,
        type: course.type,
        teacherId: course.teacherId,
        teacherName: course.teacherName,
        classroom: course.classroom,
        dayOfWeek: course.dayOfWeek,
        startTime: course.startTime,
        endTime: course.endTime,
        maxStudents: course.maxStudents,
        description: course.description || '',
        targetGrades: course.targetGrades,
        category: course.category,
        status: course.status,
      });
    } else {
      setFormData({ ...DEFAULT_FORM });
    }
    setFormDialog({ open: true, course });
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name || !formData.teacherName || !formData.classroom) {
      toast.error('请填写课程名称、教师和教室');
      return;
    }
    try {
      let res: ApiResponse<unknown>;
      if (formDialog.course) {
        res = await apiClient.patch<ApiResponse<unknown>>(`/after-school/courses/${formDialog.course.id}`, formData);
      } else {
        res = await apiClient.post<ApiResponse<unknown>>('/after-school/courses', formData);
      }
      if (res.success) {
        toast.success(formDialog.course ? '课程已更新' : '课程已创建');
        setFormDialog({ open: false });
        fetchCourses();
      } else {
        toast.error(res.error || '操作失败');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  // 删除课程
  const handleDelete = async (id: string) => {
    try {
      const res = await apiClient.delete<ApiResponse<null>>(`/after-school/courses/${id}`);
      if (res.success) {
        toast.success('课程已删除');
        setDeleteConfirm(null);
        fetchCourses();
      } else {
        toast.error(res.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  // 查看点名表
  const openRoster = async (courseId: string, courseName: string) => {
    setRosterDialog({ open: true, courseId, courseName });
    setRosterLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<CourseEnrollment[]>>(`/after-school/roster/${courseId}`);
      if (res.success && res.data) {
        setRoster(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error('加载点名表失败');
    } finally {
      setRosterLoading(false);
    }
  };

  // 统计数据
  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    totalEnrolled: courses.reduce((sum, c) => sum + c.currentStudents, 0),
    totalCapacity: courses.reduce((sum, c) => sum + c.maxStudents, 0),
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课后服务管理</h1>
          <p className="text-muted-foreground mt-1">管理课后服务课程、查看选课情况</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { predict(); setShowPrediction(true); }} disabled={predicting}>
            {predicting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            AI需求预测
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCourses}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />刷新
          </Button>
          <Button size="sm" className="bg-[#5C7A72] hover:bg-[#4A6A62] text-white" onClick={() => openFormDialog()}>
            <Plus className="h-3.5 w-3.5 mr-1" />新建课程
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#A0785A]/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#A0785A]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">课程总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5C7A72]/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[#5C7A72]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">开放选课</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C8956C]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#C8956C]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
                <p className="text-xs text-muted-foreground">已报名人次</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#6B8DB5]/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#6B8DB5]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCapacity > 0 ? Math.round(stats.totalEnrolled / stats.totalCapacity * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">整体报满率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI 需求预测面板 */}
      {showPrediction && (
        <Card className="border-[#5C7A72]/30 bg-gradient-to-r from-[#5C7A72]/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#5C7A72]" />
                AI 需求预测
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPrediction(false)}>收起</Button>
            </div>
          </CardHeader>
          <CardContent>
            {predicting ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#5C7A72]" />
                <span className="ml-2 text-muted-foreground">AI 正在分析历史数据...</span>
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-muted-foreground">点击"AI需求预测"按钮开始分析</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {predictions.map((p: CoursePrediction, idx: number) => (
                  <div key={idx} className={`rounded-lg border p-3 space-y-2 ${
                    p.heatLevel === 'HOT' ? 'border-[#C8956C]/40 bg-[#FBF3ED]/50' :
                    p.heatLevel === 'COLD' ? 'border-[#6B8DB5]/30 bg-[#F0F5FA]/50' :
                    'border-border bg-background'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{p.courseName}</span>
                      {p.heatLevel === 'HOT' ? (
                        <Badge className="bg-[#C8956C]/10 text-[#C8956C] text-[10px]"><Flame className="h-3 w-3 mr-0.5" />热门</Badge>
                      ) : p.heatLevel === 'COLD' ? (
                        <Badge className="bg-[#6B8DB5]/10 text-[#6B8DB5] text-[10px]"><Snowflake className="h-3 w-3 mr-0.5" />冷门</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]"><Zap className="h-3 w-3 mr-0.5" />正常</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>预测需求: <b className="text-foreground">{p.predictedDemand}</b>人</span>
                      <span>当前容量: <b className="text-foreground">{p.currentCapacity}</b>人</span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">{p.aiSuggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 课程列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">课程列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无课程</p>
              <p className="text-sm text-muted-foreground mt-1">点击"新建课程"添加</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>课程名称</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>授课教师</TableHead>
                    <TableHead>上课时间</TableHead>
                    <TableHead>教室</TableHead>
                    <TableHead>报名/容量</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map(course => {
                    const statusConfig = STATUS_OPTIONS.find(s => s.value === course.status) || STATUS_OPTIONS[1];
                    const categoryLabel = CATEGORY_CONFIG[course.category]?.label || course.category;
                    const fillRate = course.maxStudents > 0 ? Math.round(course.currentStudents / course.maxStudents * 100) : 0;

                    return (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{categoryLabel}</Badge>
                        </TableCell>
                        <TableCell>{course.teacherName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{DAY_LABELS[course.dayOfWeek] || `周${course.dayOfWeek}`} {course.startTime}-{course.endTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>{course.classroom}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-sm">{course.currentStudents}/{course.maxStudents}</span>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${fillRate >= 100 ? 'bg-destructive' : fillRate >= 80 ? 'bg-[#C9A96E]' : 'bg-[#5C7A72]'}`}
                                style={{ width: `${Math.min(fillRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openRoster(course.id, course.name)} title="查看名单">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openFormDialog(course)} title="编辑">
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteConfirm(course.id)} title="删除">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑课程弹窗 */}
      <Dialog open={formDialog.open} onOpenChange={(open) => setFormDialog({ open, course: formDialog.course })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formDialog.course ? '编辑课程' : '新建课程'}</DialogTitle>
            <DialogDescription>填写课后服务课程信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>课程名称 *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如：趣味编程" />
              </div>
              <div className="space-y-2">
                <Label>课程类别 *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as CourseCategory, type: CATEGORY_OPTIONS.find(c => c.value === v)?.label || '兴趣班' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>授课教师 *</Label>
                <Input value={formData.teacherName} onChange={(e) => setFormData({ ...formData, teacherName: e.target.value, teacherId: e.target.value })} placeholder="教师姓名" />
              </div>
              <div className="space-y-2">
                <Label>教室 *</Label>
                <Input value={formData.classroom} onChange={(e) => setFormData({ ...formData, classroom: e.target.value })} placeholder="如：美术教室" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>上课日 *</Label>
                <Select value={String(formData.dayOfWeek)} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: Number(v) as DayOfWeek })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {([1, 2, 3, 4, 5] as DayOfWeek[]).map(d => (
                      <SelectItem key={d} value={String(d)}>{DAY_LABELS[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} placeholder="16:30" />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} placeholder="17:30" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>最大容量 *</Label>
                <Input type="number" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })} min={1} max={100} />
              </div>
              <div className="space-y-2">
                <Label>课程状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as 'active' | 'closed' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">开放选课</SelectItem>
                    <SelectItem value="closed">已关闭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>面向年级</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <Badge
                    key={grade}
                    variant={formData.targetGrades.includes(grade) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const newGrades = formData.targetGrades.includes(grade)
                        ? formData.targetGrades.filter(g => g !== grade)
                        : [...formData.targetGrades, grade].sort();
                      setFormData({ ...formData, targetGrades: newGrades });
                    }}
                  >
                    {grade}年级
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>课程简介</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-[#5C7A72] hover:text-[#4A6A62]"
                  disabled={isGenerating || !formData.name}
                  onClick={() => {
                    if (!formData.name) { toast.error('请先填写课程名称'); return; }
                    generateCourseContent({
                      courseName: formData.name,
                      targetGrades: formData.targetGrades.length > 0 ? formData.targetGrades : [1,2,3,4,5,6],
                      category: CATEGORY_OPTIONS.find(c => c.value === formData.category)?.label || '兴趣班',
                    });
                  }}
                >
                  {isGenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  AI生成简介
                </Button>
              </div>
              <Textarea
                value={isGenerating ? generatedContent : formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); clearContent(); }}
                placeholder="简要描述课程内容和特色，或点击上方AI生成"
                rows={3}
              />
              {isGenerating && (
                <p className="text-xs text-[#5C7A72] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />AI 正在生成...
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialog({ open: false })}>取消</Button>
            <Button onClick={handleSubmit} className="bg-[#5C7A72] hover:bg-[#4A6A62] text-white">
              {formDialog.course ? '保存修改' : '创建课程'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 点名表弹窗 */}
      <Dialog open={rosterDialog.open} onOpenChange={(open) => setRosterDialog({ open, courseId: rosterDialog.courseId, courseName: rosterDialog.courseName })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>点名表 - {rosterDialog.courseName}</DialogTitle>
            <DialogDescription>已选报学生名单（共 {roster.length} 人）</DialogDescription>
          </DialogHeader>

          {rosterLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无学生选报</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">序号</TableHead>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.className}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#5C7A72]/10 text-[#5C7A72] text-xs">已确认</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => {
              const csv = ['序号,学生姓名,班级,状态', ...roster.map((r, i) => `${i + 1},${r.studentName},${r.className},已确认`)].join('\n');
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `点名表_${rosterDialog.courseName}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('点名表已导出');
            }}>
              <Download className="h-3.5 w-3.5 mr-1" />导出 CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>删除后无法恢复，已选报的学生将被退课。确认删除？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
