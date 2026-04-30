'use client';

/**
 * 教师端 - 课后服务管理
 *
 * 功能：
 * - 查看我所教授的课后服务课程
 * - 查看选课学生名单（点名表）
 * - AI 智能评语反馈（零教师负担）
 * - 申请开设新课程（含AI辅助生成，教务审核）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  BookOpen,
  Users,
  Clock,
  CalendarDays,
  Loader2,
  Sparkles,
  Star,
  MessageSquareText,
  CheckCircle2,
  Plus,
  Send,
  Hourglass,
  XCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import type { AfterSchoolCourse, CourseEnrollment, DayOfWeek, CourseCategory } from '@/types/after-school';
import { DAY_LABELS, CATEGORY_CONFIG } from '@/types/after-school';
import { useFeedbackGeneration, useCourseGeneration } from '@/hooks/useAfterSchoolAI';
import type { FeedbackTag } from '@/types/after-school-ai';

const FEEDBACK_TAGS: FeedbackTag[] = [
  '专注认真', '思维活跃', '乐于助人', '动手能力强', '进步明显', '团队协作',
];

type Teacher = {
  id: string;
  name: string;
  employeeId: string;
};

type ApplyFormData = {
  name: string;
  category: CourseCategory;
  targetGrades: number[];
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classroom: string;
  maxStudents: number;
  description: string;
  highlights: string;
  objectives: string;
  format: string;
};

const EMPTY_APPLY_FORM: ApplyFormData = {
  name: '',
  category: 'interest',
  targetGrades: [],
  dayOfWeek: 1,
  startTime: '16:30',
  endTime: '17:30',
  classroom: '',
  maxStudents: 25,
  description: '',
  highlights: '',
  objectives: '',
  format: '',
};

const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6];

const APPROVAL_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待审核', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Hourglass className="h-3 w-3 mr-1" /> },
  approved: { label: '已通过', color: 'text-[#5C7A72] bg-[#5C7A72]/10 border-[#5C7A72]/30', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle className="h-3 w-3 mr-1" /> },
};

export default function TeacherAfterSchoolPage() {
  const [courses, setCourses] = useState<AfterSchoolCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [rosterCourseId, setRosterCourseId] = useState<string | null>(null);
  const [roster, setRoster] = useState<CourseEnrollment[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // 评语相关
  const [feedbackStudent, setFeedbackStudent] = useState<CourseEnrollment | null>(null);
  const [feedbackCourse, setFeedbackCourse] = useState<AfterSchoolCourse | null>(null);
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(95);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const { feedback, isGenerating: isGeneratingFeedback, generate: generateFeedback, clearFeedback } = useFeedbackGeneration();

  // 申请课程相关
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyForm, setApplyForm] = useState<ApplyFormData>(EMPTY_APPLY_FORM);
  const [applying, setApplying] = useState(false);
  const { generatedContent, isGenerating: isGeneratingCourse, generate: generateCourse, clearContent } = useCourseGeneration();

  // 获取当前教师信息
  useEffect(() => {
    apiClient.get<Teacher>('/auth/current').then((res: ApiResponse<Teacher>) => {
      if (res.success && res.data) {
        setTeacher(res.data);
      }
    }).catch(() => {});
  }, []);

  // 获取教师所教授的课后服务课程
  const fetchMyCourses = useCallback(async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const res = await apiClient.get<AfterSchoolCourse[]>(`/after-school/courses?teacherId=${teacher.employeeId}`);
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch {
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  }, [teacher]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  // 查看点名表
  const openRoster = async (courseId: string) => {
    setRosterCourseId(courseId);
    setRosterLoading(true);
    try {
      const res = await apiClient.get<CourseEnrollment[]>(`/after-school/roster/${courseId}`);
      if (res.success && res.data) {
        setRoster(res.data);
      }
    } catch {
      toast.error('加载点名表失败');
    } finally {
      setRosterLoading(false);
    }
  };

  // 打开评语弹窗
  const openFeedbackDialog = (student: CourseEnrollment, course: AfterSchoolCourse) => {
    setFeedbackStudent(student);
    setFeedbackCourse(course);
    setSelectedTags([]);
    setAttendanceRate(95);
    clearFeedback();
    setShowFeedbackDialog(true);
  };

  // 生成评语
  const handleGenerateFeedback = () => {
    if (!feedbackStudent || !feedbackCourse) return;
    if (selectedTags.length === 0) {
      toast.error('请至少选择一个表现标签');
      return;
    }
    generateFeedback({
      studentName: feedbackStudent.studentName || '同学',
      courseName: feedbackCourse.name,
      selectedTags,
      attendanceRate,
    });
  };

  // AI 生成课程内容
  const handleAIGenerate = () => {
    if (!applyForm.name.trim()) {
      toast.error('请先输入课程名称');
      return;
    }
    generateCourse({
      courseName: applyForm.name,
      targetGrades: applyForm.targetGrades.length > 0 ? applyForm.targetGrades : [1,2,3,4,5,6],
      category: applyForm.category,
      teacherName: teacher?.name,
    });
  };

  // AI 生成内容回填表单
  useEffect(() => {
    if (generatedContent && typeof generatedContent === 'string') {
      setApplyForm(prev => ({
        ...prev,
        description: generatedContent,
      }));
    }
  }, [generatedContent]);

  // 提交课程申请
  const handleApplySubmit = async () => {
    if (!teacher) return;
    if (!applyForm.name.trim()) {
      toast.error('请输入课程名称');
      return;
    }
    if (applyForm.targetGrades.length === 0) {
      toast.error('请选择面向年级');
      return;
    }
    setApplying(true);
    try {
      const res = await apiClient.post<ApiResponse<unknown>>('/after-school/courses/apply', {
        ...applyForm,
        teacherId: teacher.employeeId,
        teacherName: teacher.name,
        appliedBy: teacher.employeeId,
      });
      if (res.success) {
        toast.success('课程申请已提交，等待教务审核');
        setShowApplyDialog(false);
        setApplyForm(EMPTY_APPLY_FORM);
        clearContent();
        fetchMyCourses();
      } else {
        toast.error(res.error || '提交失败');
      }
    } catch {
      toast.error('提交失败');
    } finally {
      setApplying(false);
    }
  };

  // 打开申请弹窗
  const openApplyDialog = () => {
    setApplyForm(EMPTY_APPLY_FORM);
    clearContent();
    setShowApplyDialog(true);
  };

  // 当前查看点名表的课程
  const currentRosterCourse = courses.find(c => c.id === rosterCourseId);

  // 按审批状态分组
  const approvedCourses = courses.filter(c => c.approvalStatus === 'approved');
  const pendingCourses = courses.filter(c => c.approvalStatus === 'pending');
  const rejectedCourses = courses.filter(c => c.approvalStatus === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C7A72]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">我的课后服务</h1>
          <p className="text-sm text-muted-foreground mt-1">查看课程名单、申请开课、一键生成AI期末评语</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMyCourses}>
            <Loader2 className="h-3.5 w-3.5 mr-1" />刷新
          </Button>
          <Button size="sm" className="bg-[#5C7A72] hover:bg-[#4A6A62] text-white" onClick={openApplyDialog}>
            <Plus className="h-3.5 w-3.5 mr-1" />申请开课
          </Button>
        </div>
      </div>

      {/* 待审核提示 */}
      {pendingCourses.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3 flex items-center gap-3">
            <Hourglass className="h-5 w-5 text-amber-600" />
            <div>
              <span className="text-sm font-medium text-amber-800">
                {pendingCourses.length} 门课程待审核：
              </span>
              <span className="text-sm text-amber-700 ml-1">
                {pendingCourses.map(c => c.name).join('、')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 被拒绝提示 */}
      {rejectedCourses.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-3 space-y-2">
            {rejectedCourses.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-red-800 font-medium">{c.name}</span>
                {c.rejectionReason && (
                  <span className="text-red-600">— {c.rejectionReason}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 已通过的课程卡片 */}
      {approvedCourses.length === 0 && rejectedCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">暂无课后服务课程</p>
            <p className="text-xs text-muted-foreground mt-1">点击右上角"申请开课"提交课程申请</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedCourses.map(course => {
            const categoryConf = CATEGORY_CONFIG[course.category] || CATEGORY_CONFIG.interest;
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <Badge variant="outline" className={categoryConf.color}>{categoryConf.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{DAY_LABELS[course.dayOfWeek as keyof typeof DAY_LABELS]}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.startTime}-{course.endTime}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.currentStudents}/{course.maxStudents}人</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{course.classroom}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openRoster(course.id)}>
                      <Users className="h-3.5 w-3.5 mr-1" />点名表
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 点名表弹窗 */}
      <Dialog open={!!rosterCourseId} onOpenChange={(open: boolean) => { if (!open) setRosterCourseId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5C7A72]" />
              {currentRosterCourse?.name || '课程'} - 点名表
            </DialogTitle>
            <DialogDescription>
              共 {roster.length} 名学生，点击"AI评语"一键生成期末反馈
            </DialogDescription>
          </DialogHeader>

          {rosterLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#5C7A72]" />
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无选课学生</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">序号</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>班级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((student, idx) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{student.className || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[#5C7A72] border-[#5C7A72]/30 bg-[#5C7A72]/5">
                        <CheckCircle2 className="h-3 w-3 mr-1" />已确认
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#5C7A72] hover:text-[#4A6A62]"
                        onClick={() => {
                          if (currentRosterCourse) openFeedbackDialog(student, currentRosterCourse);
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />AI评语
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* AI 评语生成弹窗 */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-[#5C7A72]" />
              AI 期末评语
            </DialogTitle>
            <DialogDescription>
              为 {feedbackStudent?.studentName || '同学'} 生成《{feedbackCourse?.name || '课程'}》期末反馈
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">本学期表现标签</label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={isSelected ? 'bg-[#5C7A72] hover:bg-[#4A6A62] text-white' : ''}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                    >
                      {tag}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">出勤率: {attendanceRate}%</label>
              <input
                type="range"
                min={50}
                max={100}
                value={attendanceRate}
                onChange={(e) => setAttendanceRate(Number(e.target.value))}
                className="w-full accent-[#5C7A72]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <Button
              className="w-full bg-[#5C7A72] hover:bg-[#4A6A62] text-white"
              onClick={handleGenerateFeedback}
              disabled={isGeneratingFeedback || selectedTags.length === 0}
            >
              {isGeneratingFeedback ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />正在生成评语...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" />生成评语</>
              )}
            </Button>

            {feedback && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5C7A72]">生成的评语</label>
                <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(feedback);
                    toast.success('评语已复制到剪贴板');
                  }}
                >
                  复制评语
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 申请开课弹窗 */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#5C7A72]" />
              申请开设课后服务课程
            </DialogTitle>
            <DialogDescription>
              提交后需教务审核通过方可开放选课
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 课程名称 + AI生成 */}
            <div className="space-y-2">
              <Label>课程名称 *</Label>
              <div className="flex gap-2">
                <Input
                  value={applyForm.name}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：趣味编程、创意美术"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAIGenerate}
                  disabled={isGeneratingCourse || !applyForm.name.trim()}
                  className="shrink-0 text-[#5C7A72] border-[#5C7A72]/30 hover:bg-[#5C7A72]/5"
                >
                  {isGeneratingCourse ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />生成中...</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5 mr-1" />AI生成内容</>
                  )}
                </Button>
              </div>
            </div>

            {/* 课程分类 + 面向年级 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>课程分类</Label>
                <Select
                  value={applyForm.category}
                  onValueChange={(v) => setApplyForm(prev => ({ ...prev, category: v as CourseCategory }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>面向年级 *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {GRADE_OPTIONS.map(g => {
                    const isSelected = applyForm.targetGrades.includes(g);
                    return (
                      <Button
                        key={g}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        className={isSelected ? 'bg-[#5C7A72] hover:bg-[#4A6A62] text-white h-7 text-xs px-2.5' : 'h-7 text-xs px-2.5'}
                        onClick={() => {
                          setApplyForm(prev => ({
                            ...prev,
                            targetGrades: isSelected
                              ? prev.targetGrades.filter(x => x !== g)
                              : [...prev.targetGrades, g].sort(),
                          }));
                        }}
                      >
                        {g}年级
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 上课时间 + 教室 + 人数 */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>星期</Label>
                <Select
                  value={String(applyForm.dayOfWeek)}
                  onValueChange={(v) => setApplyForm(prev => ({ ...prev, dayOfWeek: Number(v) as DayOfWeek }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DAY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={applyForm.startTime}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input
                  type="time"
                  value={applyForm.endTime}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>最大人数</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={applyForm.maxStudents}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, maxStudents: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* 教室 */}
            <div className="space-y-2">
              <Label>上课地点</Label>
              <Input
                value={applyForm.classroom}
                onChange={(e) => setApplyForm(prev => ({ ...prev, classroom: e.target.value }))}
                placeholder="如：美术教室、操场、三(1)班"
              />
            </div>

            {/* 课程详情（始终可见，AI可辅助填充） */}
            <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#5C7A72]">
                <FileText className="h-4 w-4" />
                课程详情{generatedContent ? '（AI 已生成，可编辑修改）' : '（可手动填写，或点击上方AI生成）'}
              </div>

              {generatedContent && (
                <div className="border border-[#5C7A72]/20 rounded p-2 bg-[#5C7A72]/5 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {generatedContent}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">课程简介</Label>
                <Textarea
                  value={applyForm.description}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="请填写课程简介，或点击上方「AI 生成」自动填充..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">课程亮点</Label>
                <Input
                  value={applyForm.highlights}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, highlights: e.target.value }))}
                  placeholder="课程核心亮点..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">培养目标</Label>
                <Textarea
                  value={applyForm.objectives}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, objectives: e.target.value }))}
                  rows={2}
                  placeholder="培养目标..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">课堂形式</Label>
                <Input
                  value={applyForm.format}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, format: e.target.value }))}
                  placeholder="如：小组合作、项目式学习、动手实践..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>取消</Button>
            <Button
              className="bg-[#5C7A72] hover:bg-[#4A6A62] text-white"
              onClick={handleApplySubmit}
              disabled={applying || !applyForm.name.trim()}
            >
              {applying ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />提交中...</>
              ) : (
                <><Send className="h-4 w-4 mr-1" />提交申请</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
